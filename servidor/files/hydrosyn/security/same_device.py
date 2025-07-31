from venv import logger
from fastapi import Request
from typing import Dict, Any
from services.notifications import create_user_notification
import json
from datetime import datetime, timezone
import hashlib
async def hash_dict(data: dict) -> str:
    json_str = json.dumps(data, sort_keys=True)
    return hashlib.sha256(json_str.encode()).hexdigest()

async def sameDevice(stored_device_data: Dict[str, Any], summary: str, user_id, username, ip, language, email) -> bool:
    if await hash_dict(stored_device_data) != summary:
        logger.warning(
            f"Session detected from a different device for user '{username}', possible cookie theft detected."
        )
        await create_user_notification(
            notification_id=2,  # ID de la notificación de robo de cookies
            user_id=user_id,
            username=username,
            ip=ip,
            lang=language,
            email=email,
            date=datetime.now(timezone.utc),
        )
        # insertar en login attempts
        return False
    else:
        return True  # La sesión es del mismo dispositivo
