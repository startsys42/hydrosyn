from security.keys import CookieKeyManager #, JWTKeyManager
from db.db_config import get_cookie_rotation_time_from_db, get_old_cookie_token_limit_hour_from_db, get_jwt_rotation_time_from_db

cookie_key_manager = CookieKeyManager(
    get_rotation_time=get_cookie_rotation_time_from_db,
    get_grace_period=get_old_cookie_token_limit_hour_from_db,
    ttl=600
)

'''
jwt_key_manager = JWTKeyManager(
    get_rotation_time=get_jwt_rotation_time_from_db,
    get_grace_period=get_old_cookie_token_limit_hour_from_db,
    ttl=600
)
'''