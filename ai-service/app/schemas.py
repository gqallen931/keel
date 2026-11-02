"""Pydantic 数据模型：接口契约的唯一来源（与前端 src/renderer/src/types 对应）。"""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

ItemStatus = Literal["active", "paused"]


class Item(BaseModel):
    id: str
    name: str
    category: str = "default"
    status: ItemStatus = "active"
    value: int = 0
    updatedAt: str = ""


class ItemCreate(BaseModel):
    name: str
    category: str = "default"
    status: ItemStatus = "active"
    value: int = 0


class ItemUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    status: Optional[ItemStatus] = None
    value: Optional[int] = None


class ItemPage(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[Item]


class HealthInfo(BaseModel):
    status: str
    time: str
    version: str
    device: str


class ServiceInfo(BaseModel):
    name: str
    version: str
    python: str
    device: str
    startedAt: str


class AppEvent(BaseModel):
    id: str
    level: Literal["info", "warning", "error"] = "info"
    title: str
    message: str
    timestamp: str
