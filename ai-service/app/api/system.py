"""系统接口：健康检查与服务信息。"""
from __future__ import annotations

import platform
import sys
from datetime import datetime

from fastapi import APIRouter

from app.schemas import HealthInfo, ServiceInfo

router = APIRouter(tags=["system"])

VERSION = "1.0.0"
STARTED_AT = datetime.now().astimezone().isoformat(timespec="seconds")


@router.get("/health")
def health() -> dict:
    """根路径健康检查（前端 isBackendReady 使用）。"""
    return {"status": "ok", "time": datetime.now().isoformat()}


@router.get("/api/system/health", response_model=HealthInfo)
def system_health() -> HealthInfo:
    return HealthInfo(
        status="ok",
        time=datetime.now().astimezone().isoformat(timespec="seconds"),
        version=VERSION,
        device=platform.machine(),
    )


@router.get("/api/system/info", response_model=ServiceInfo)
def system_info() -> ServiceInfo:
    return ServiceInfo(
        name="Desktop Framework Service",
        version=VERSION,
        python=sys.version.split()[0],
        device=platform.machine(),
        startedAt=STARTED_AT,
    )
