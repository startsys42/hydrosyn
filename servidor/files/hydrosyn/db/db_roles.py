from sqlalchemy import text
from db.db_engine import DBEngine
from logger import logger

async def get_users_with_permission_notifications_from_db(permission_id: int) -> list[dict]:
    """
    Devuelve una lista de usuarios activos que tienen un rol con el permiso indicado.

    Args:
        permission_id (int): ID del permiso (por ejemplo, 19)

    Returns:
        list[dict]: Lista de diccionarios con id y language, por ejemplo:
                    [{"id": 1, "language": "es"}, {"id": 2, "language": "en"}]
    """
    sql = text("""
        SELECT DISTINCT u.id, u.language
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        WHERE rp.permission_id = :permission_id
          AND u.is_active = TRUE
    """)

    try:
        async with DBEngine.get_engine().begin() as conn:
            result = await conn.execute(sql, {"permission_id": permission_id})
            return [{"id": row.id, "language": row.language} for row in result.fetchall()]

    except Exception as e:
        logger.error(
            f"Error obteniendo usuarios para permiso {permission_id}: {e}",
            exc_info=True,
            extra={"permission_id": permission_id}
        )
        return []