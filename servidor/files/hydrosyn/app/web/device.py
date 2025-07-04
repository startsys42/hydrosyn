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

@app.post("/device-info")
async def device_info(request: Request):
    try:
        data = await request.json()
        info = DeviceInfo(**data)
        logging.info(f"Info recibida de IP {request.client.host}: {info}")
        # Aquí guardas o procesas info...
    except Exception as e:
        # Captura cualquier error (incluido ValidationError)
        logging.warning(f"Datos inválidos recibidos de IP {request.client.host}: {e}")
        # No hacemos nada más, ni devolvemos error al cliente
    return Response(status_code=status.HTTP_204_NO_CONTENT)
