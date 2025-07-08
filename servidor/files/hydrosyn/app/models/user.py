from typing import List

class User:
    def __init__(self, username: str, permissions: List[str]):
        self.username = username
        self.permissions = permissions

    def has_permission(self, perm: str) -> bool:
        """Chequea si el usuario tiene un permiso específico."""
        return perm in self.permissions
