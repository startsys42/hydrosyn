

jwt_key_manager = JWTKeyManager(get_rotation_time=get_jwt_rotation_time_from_db, ttl=600)
