from fastapi import APIRouter, Request, Response, status
from pydantic import BaseModel
from typing import Optional, Union
from logger import logger  # Your custom logger
from urllib.parse import urlparse
from db.db_device import insert_login_attempts_to_db



router = APIRouter()
    


@router.post("/device-info")
async def collect_device_info(request: Request):

    return Response(status_code=status.HTTP_204_NO_CONTENT)

