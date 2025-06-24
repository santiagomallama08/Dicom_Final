# api/routers/login_router.py

from fastapi import APIRouter, HTTPException
from api.models.schemas import RegisterInput, LoginInput
from ..services.login_services import registrar_usuario, verificar_credenciales, obtener_id_usuario
router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register")
def register(user: RegisterInput):
    ok, msg = registrar_usuario(
        nombre_completo=user.nombre_completo,
        email=user.email,
        password=user.password,
        rol=user.rol
    )
    if not ok:
        raise HTTPException(status_code=400, detail=msg)
    return {"message": msg}

@router.post("/login")
def login(data: LoginInput):
    if not verificar_credenciales(data.email, data.password):
        raise HTTPException(status_code=401, detail="Credenciales incorrectas")
    user_id = obtener_id_usuario(data.email)
    return {"message": "Login exitoso", "user_id": user_id}