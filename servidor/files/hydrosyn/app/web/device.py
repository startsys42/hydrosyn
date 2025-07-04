from fastapi import APIRouter
from pydantic import BaseModel
from logger import logger
router = APIRouter()

class DeviceInfo(BaseModel):
    ram: int | None
    cores: int | None
    arch: str | None
    os: str | None
    gpu: str | None

@router.post("/device-info")
async def receive_device_info(info: DeviceInfo):
    print("Info del dispositivo recibida:", info)
    return {"status": "ok"}
