"""服务配置：读取 configs/settings.yaml，缺失时回退默认值。"""
from __future__ import annotations

from functools import lru_cache
from pathlib import Path

import yaml
from pydantic import BaseModel, Field

BASE_DIR = Path(__file__).resolve().parent.parent
CONFIG_FILE = BASE_DIR / "configs" / "settings.yaml"


class Settings(BaseModel):
    host: str = "127.0.0.1"
    port: int = 8800
    db_path: str = "runtime/app.db"
    cors_origins: list[str] = Field(default_factory=lambda: ["*"])

    @property
    def db_file(self) -> Path:
        path = Path(self.db_path)
        return path if path.is_absolute() else BASE_DIR / path


@lru_cache
def get_settings() -> Settings:
    if CONFIG_FILE.exists():
        with CONFIG_FILE.open("r", encoding="utf-8") as f:
            data = yaml.safe_load(f) or {}
        return Settings(**data)
    return Settings()
