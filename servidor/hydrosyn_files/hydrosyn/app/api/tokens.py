from security.keys import JWTKeyManager
from db.sb_config import get_jwt_rotation_time_from_db


jwt_key_manager = JWTKeyManager(get_rotation_time=get_jwt_rotation_time_from_db, get_grace_period = get_old_cookie_token_limit_hour_from_db,ttl=600)
