from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

class DeviceInfo(BaseModel):
    ram: float | None
    cores: int | None
    arch: str | None
    os: str | None
    gpu: str | None

@router.post("/device-info")
async def receive_device_info(info: DeviceInfo):
    print("Info del dispositivo recibida:", info)
    return {"status": "ok"}
