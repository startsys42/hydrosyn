from fastapi import APIRouter

router = APIRouter()

@router.get("/usuarios")
def get_usuarios():
    return [{"id": 1, "nombre": "Alice"}]
