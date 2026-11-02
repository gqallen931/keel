"""FastAPI 应用入口：CORS、路由注册与生命周期。"""
from __future__ import annotations

import asyncio
import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import items, system
from app.config import get_settings
from app.db import get_db
from app.ws import events

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    events.hub.bind_loop(asyncio.get_running_loop())
    counts = get_db().counts()
    logger.info("示例数据库就绪：%s", counts)
    yield
    logger.info("服务已停止")


app = FastAPI(title="Desktop Framework Service", version="1.0.0", lifespan=lifespan)

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(system.router)
app.include_router(items.router)
app.include_router(events.router)
