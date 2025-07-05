from fastapi import APIRouter, Request, Response, status
from pydantic import BaseModel
from typing import Optional, Union
from logger import logger  # Your custom logger
from urllib.parse import urlparse
from db.db_device import insert_login_attempts_to_db



router = APIRouter()
class DeviceInfo(BaseModel):
    ram: Optional[Union[int, float]] = None
    cores: Optional[int] = None
    arch: Optional[str] = None
    os: Optional[str] = None
    gpu: Optional[str] = None


def get_html_source(request: Request) -> str:
    """Extrae el nombre del HTML desde el Referer header"""
    referer = request.headers.get("referer", "")
    if not referer:
        return "unknown"
    
    try:
   
        parsed = urlparse(referer)
        path = parsed.path
        if path.endswith(".html"):
            return path.split("/")[-1]  # Devuelve "formulario.html"
        return "non_html_page"
    except:
        return "invalid_referer"
        


@router.post("/device-info")
async def collect_device_info(request: Request):

    client_ip = request.client.host or "unknown"
    user_agent = request.headers.get("user-agent", "unknown")
    html_source = get_html_source(request)
    device_info = None
    try:
        # Safely extract JSON (empty dict if invalid)
        data = await request.json() if await request.body() else {}
        
        # Filter only valid fields we care about
        clean_data = {k: v for k, v in data.items() if k in DeviceInfo.__fields__}
        device_info = DeviceInfo(**clean_data)
        
        # Log everything important
        logger.info(
            "Device Info Collected\n"
            f"IP: {client_ip}\n"
            f"User-Agent: {user_agent}\n"
            f"Data: {device_info.dict(exclude_none=True)}"  # Only show provided fields
        )
        
        # Here you would add database storage logic
        # await store_to_database(device_info, client_ip, user_agent)
        
    except Exception as e:
        logger.warning(
            "Failed to process device info\n"
            f"IP: {client_ip}\n"
            f"User-Agent: {user_agent}\n"
            f"Error: {str(e)}"
        )

    insert_login_attempts_to_db(
            user_id=None,  
            ip_address=client_ip,
            success=False,  # O False si es un intento fallido
            page=html_source,
            http_method='GET',
            user_agent=user_agent,
            ram_gb=device_info.ram,
            cpu_cores=device_info.cores,
            cpu_architecture=device_info.arch,
            gpu_info=device_info.gpu,
            device_os=device_info.os,
            recovery = False
           
     
        )
    # Always return empty response
    return Response(status_code=status.HTTP_204_NO_CONTENT)

