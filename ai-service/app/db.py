"""SQLite 数据访问层（示例实体：items）。

要点：
1. 单文件数据库，WAL 模式，便于桌面端单机部署；
2. 写操作使用 RLock 串行化，避免并发写冲突；
3. 仅作为框架示例，二次开发时可按同样结构新增业务仓储。
"""
from __future__ import annotations

import sqlite3
import threading
import uuid
from datetime import datetime, timedelta
from pathlib import Path
from typing import Iterable, Optional

SCHEMA = """
CREATE TABLE IF NOT EXISTS items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'default',
  status TEXT NOT NULL DEFAULT 'active',
  value INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT ''
);
CREATE INDEX IF NOT EXISTS idx_items_status ON items(status);
"""


def _now() -> str:
    return datetime.now().astimezone().isoformat(timespec="seconds")


def _item_row(row: sqlite3.Row) -> dict:
    """数据库行 → 接口模型字典（snake_case → camelCase）。"""
    return {
        "id": row["id"],
        "name": row["name"],
        "category": row["category"],
        "status": row["status"],
        "value": row["value"],
        "updatedAt": row["updated_at"],
    }


class Database:
    def __init__(self, path: Path) -> None:
        self.path = path
        self.path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = threading.RLock()
        self._conn = sqlite3.connect(str(path), check_same_thread=False, timeout=30)
        self._conn.row_factory = sqlite3.Row
        with self._lock:
            self._conn.execute("PRAGMA journal_mode=WAL")
            self._conn.execute("PRAGMA synchronous=NORMAL")
            self._conn.executescript(SCHEMA)
            self._conn.commit()
        self.seed_if_empty()

    # ------------------------------------------------------------ 基础

    def execute(self, sql: str, params: Iterable[object] = ()) -> sqlite3.Cursor:
        with self._lock:
            cur = self._conn.execute(sql, tuple(params))
            self._conn.commit()
            return cur

    def query(self, sql: str, params: Iterable[object] = ()) -> list[sqlite3.Row]:
        with self._lock:
            return self._conn.execute(sql, tuple(params)).fetchall()

    # ------------------------------------------------------------ items

    def seed_if_empty(self) -> None:
        if self.query("SELECT COUNT(*) AS n FROM items")[0]["n"] > 0:
            return
        names = [f"示例条目 {chr(65 + i)}" for i in range(8)]
        categories = ["Alpha", "Beta", "Gamma", "Delta"]
        with self._lock:
            for i in range(24):
                self._conn.execute(
                    "INSERT INTO items(id,name,category,status,value,updated_at) VALUES(?,?,?,?,?,?)",
                    (
                        f"item-{i + 1:03d}",
                        names[i % len(names)],
                        categories[i % len(categories)],
                        "active" if i % 4 != 2 else "paused",
                        40 + (i * 37) % 160,
                        (datetime.now().astimezone() - timedelta(hours=i)).isoformat(timespec="seconds"),
                    ),
                )
            self._conn.commit()

    def list_items(
        self,
        page: int = 1,
        page_size: int = 10,
        keyword: str = "",
        status: Optional[str] = None,
    ) -> tuple[list[dict], int]:
        where: list[str] = []
        params: list[object] = []
        if keyword:
            where.append("(id LIKE ? OR name LIKE ? OR category LIKE ?)")
            like = f"%{keyword}%"
            params.extend([like, like, like])
        if status:
            where.append("status = ?")
            params.append(status)
        cond = f"WHERE {' AND '.join(where)}" if where else ""
        total = int(self.query(f"SELECT COUNT(*) AS n FROM items {cond}", params)[0]["n"])
        rows = self.query(
            f"SELECT * FROM items {cond} ORDER BY id LIMIT ? OFFSET ?",
            (*params, max(1, page_size), max(0, (page - 1) * page_size)),
        )
        return [_item_row(r) for r in rows], total

    def get_item(self, item_id: str) -> Optional[dict]:
        rows = self.query("SELECT * FROM items WHERE id = ?", (item_id,))
        return _item_row(rows[0]) if rows else None

    def create_item(self, name: str, category: str, status: str, value: int) -> dict:
        item_id = f"item-{uuid.uuid4().hex[:8]}"
        self.execute(
            "INSERT INTO items(id,name,category,status,value,updated_at) VALUES(?,?,?,?,?,?)",
            (item_id, name, category, status, value, _now()),
        )
        return self.get_item(item_id) or {}

    def update_item(self, item_id: str, fields: dict) -> Optional[dict]:
        if not fields:
            return self.get_item(item_id)
        cols = ", ".join(f"{k} = ?" for k in fields)
        self.execute(
            f"UPDATE items SET {cols}, updated_at = ? WHERE id = ?",
            (*fields.values(), _now(), item_id),
        )
        return self.get_item(item_id)

    def delete_item(self, item_id: str) -> bool:
        return self.execute("DELETE FROM items WHERE id = ?", (item_id,)).rowcount > 0

    def counts(self) -> dict:
        total = int(self.query("SELECT COUNT(*) AS n FROM items")[0]["n"])
        active = int(self.query("SELECT COUNT(*) AS n FROM items WHERE status='active'")[0]["n"])
        return {"items": total, "active": active}


_db: Optional[Database] = None
_db_lock = threading.Lock()


def get_db() -> Database:
    """进程内单例：首次调用时建库、建表并写入示例数据。"""
    global _db
    if _db is None:
        with _db_lock:
            if _db is None:
                from app.config import get_settings

                _db = Database(get_settings().db_file)
    return _db

