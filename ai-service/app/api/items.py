"""示例实体接口：items 的分页查询与 CRUD，写操作会推送 WebSocket 事件。"""
from __future__ import annotations

import uuid
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, HTTPException, Query

from app.db import get_db
from app.schemas import Item, ItemCreate, ItemPage, ItemUpdate
from app.ws.events import hub

router = APIRouter(prefix="/api/items", tags=["items"])


def _event(level: str, title: str, message: str) -> None:
    hub.broadcast_threadsafe(
        {
            "id": uuid.uuid4().hex[:8],
            "level": level,
            "title": title,
            "message": message,
            "timestamp": datetime.now().astimezone().isoformat(timespec="seconds"),
        }
    )


@router.get("", response_model=ItemPage)
def list_items(
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=200),
    keyword: str = "",
    status: Optional[str] = None,
) -> ItemPage:
    rows, total = get_db().list_items(page=page, page_size=page_size, keyword=keyword, status=status)
    return ItemPage(total=total, page=page, page_size=page_size, items=[Item(**r) for r in rows])


@router.get("/{item_id}", response_model=Item)
def get_item(item_id: str) -> Item:
    row = get_db().get_item(item_id)
    if row is None:
        raise HTTPException(status_code=404, detail="条目不存在")
    return Item(**row)


@router.post("", response_model=Item, status_code=201)
def create_item(body: ItemCreate) -> Item:
    row = get_db().create_item(body.name, body.category, body.status, body.value)
    _event("info", "条目已创建", f"{row['id']} · {row['name']}")
    return Item(**row)


@router.put("/{item_id}", response_model=Item)
def update_item(item_id: str, body: ItemUpdate) -> Item:
    if get_db().get_item(item_id) is None:
        raise HTTPException(status_code=404, detail="条目不存在")
    row = get_db().update_item(item_id, body.model_dump(exclude_unset=True))
    _event("info", "条目已更新", item_id)
    return Item(**row)


@router.delete("/{item_id}", status_code=204)
def delete_item(item_id: str) -> None:
    if not get_db().delete_item(item_id):
        raise HTTPException(status_code=404, detail="条目不存在")
    _event("warning", "条目已删除", item_id)
