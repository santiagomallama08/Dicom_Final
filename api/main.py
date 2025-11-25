# api/main.py

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from api.routers import login_router
from api.routers import dicom_router
from api.routers import historial_router
from api.routers import modelos3d_router   

import traceback


app = FastAPI(title="DICOM API", version="1.0")

# ======== 🔥 MIDDLEWARE PARA MOSTRAR EL ERROR COMPLETO 🔥 ========
@app.middleware("http")
async def debug_errors(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception:
        print("\n\n==============================")
        print("🔥🔥 ERROR REAL DEL BACKEND 🔥🔥")
        print("==============================")
        print(traceback.format_exc())
        print("==============================\n\n")
        raise
# =================================================================


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
