# api/models/schemas.py

from pydantic import BaseModel, EmailStr

class RegisterInput(BaseModel):
    nombre_completo: str
    email: EmailStr
    password: str
    rol: str = "usuario"

class LoginInput(BaseModel):
    email: EmailStr
    password: str