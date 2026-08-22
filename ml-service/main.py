import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from app.routers import train, forecast, health

load_dotenv()

MODELS_DIR = os.getenv("MODELS_DIR", "./models")

@asynccontextmanager
async def lifespan(app: FastAPI):
    os.makedirs(MODELS_DIR, exist_ok=True)
    yield

app = FastAPI(title="RENEW-AI ML Service", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(train.router)
app.include_router(forecast.router)
