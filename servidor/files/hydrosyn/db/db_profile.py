from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncConnection
from sqlalchemy.exc import SQLAlchemyError
from db.db_engine import DBEngine  # Asegúrate que retorna AsyncEngine
from logger import logger
from datetime import datetime, timedelta
from sqlalchemy.ext.asyncio import create_async_engine

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError


async def validate_username_in_db(username:str) -> bool:

   
    engine = DBEngine.get_engine()
    try:
        async with engine.connect() as conn:
            result = await conn.execute(
                text("SELECT COUNT(*) FROM users WHERE username = :username"),
                {"username": username}
            )
            count = result.scalar()
            return count == 0
    except SQLAlchemyError as e:
        logger.error(f"Error validating username: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error validating username: {e}")
        return False
    
async def is_valid_email_in_db(email: str) -> bool:
    """
    Verifica si un email ya está registrado en la base de datos.

    Args:
        email (str): Email a verificar

    Returns:
        bool: True si el email no está registrado, False si ya existe
    """
    engine = DBEngine.get_engine()
    try:
        async with engine.connect() as conn:
            result = await conn.execute(
                text("SELECT COUNT(*) FROM users WHERE email = :email"),
                {"email": email}
            )
            count = result.scalar()
            return count == 0
    except SQLAlchemyError as e:
        logger.error(f"Error validating email: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error validating email: {e}")
        return False

async def update_username_in_db(user_id: int, new_username: str) -> bool:
    """
    Actualiza el nombre de usuario de un usuario en la base de datos.

    Args:
        user_id (int): ID del usuario
        new_username (str): Nuevo nombre de usuario

    Returns:
        bool: True si se actualizó correctamente, False si hubo un error
    """
    engine = DBEngine.get_engine()
    try:
        async with engine.begin() as conn:
            result = await conn.execute(
                text("UPDATE users SET username = :new_username WHERE id = :user_id"),
                {"new_username": new_username, "user_id": user_id}
            )
            return result.rowcount > 0  # Retorna True si se actualizó al menos una fila
    except SQLAlchemyError as e:
        logger.error(f"Error updating username: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error updating username: {e}")
        return False

async def update_password_in_db(user_id: int, new_password: str) -> bool:
    """
    Actualiza el nombre de usuario de un usuario en la base de datos.

    Args:
        user_id (int): ID del usuario
        new_username (str): Nuevo nombre de usuario

    Returns:
        bool: True si se actualizó correctamente, False si hubo un error
    """
    engine = DBEngine.get_engine()
    try:
        async with engine.begin() as conn:
            result = await conn.execute(
                text("UPDATE users SET password = :new_password WHERE id = :user_id"),
                {"new_password": new_password, "user_id": user_id}
            )
            return result.rowcount > 0  # Retorna True si se actualizó al menos una fila
    except SQLAlchemyError as e:
        logger.error(f"Error updating password: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error updating password: {e}")
        return False