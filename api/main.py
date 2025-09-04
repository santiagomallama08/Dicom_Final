# api/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import login_router
from api.routers import dicom_router
from fastapi.staticfiles import StaticFiles
from api.routers import historial_router
from api.routers import modelos3d_router   



app = FastAPI(title="DICOM API", version="1.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ← Restringe en producción
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Ruta de prueba
@app.get("/")
def read_root():
    return {"message": "API DICOM funcionando correctamente 🎯"}


# Incluir routers
app.include_router(dicom_router.router)
app.mount("/static", StaticFiles(directory="api/static"), name="static")
app.include_router(login_router.router)
app.include_router(historial_router.router)
app.include_router(modelos3d_router.router)

