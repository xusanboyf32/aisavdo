from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from database import engine, Base
from routers import auth_router, product_router, order_router, ai_router
from routers import settings_router
import models

load_dotenv()

# Jadvallar yaratish
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="AiSavdo API",
    description="AI savdo konsultanti — telefon do'koni",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routerlar
app.include_router(auth_router.router)
app.include_router(product_router.router)
app.include_router(order_router.router)
app.include_router(ai_router.router)
app.include_router(settings_router.router)


@app.get("/")
def root():
    return {"message": "AiSavdo API ishlayapti ✅"}

