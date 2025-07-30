# api/models/schemas.py
from datetime import date
from pydantic import BaseModel, EmailStr


class RegisterInput(BaseModel):
    nombre_completo: str
    email: EmailStr
    password: str
    rol: str = "usuario"


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class ArchivoDicomOut(BaseModel):
    archivodicomid: int
    nombrearchivo: str
    rutaarchivo: str
    fechacarga: date
    sistemaid: int
    session_id: str | None = None
