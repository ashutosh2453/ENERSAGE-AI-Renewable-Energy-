from fastapi import APIRouter
from datetime import datetime

router = APIRouter()

@router.get("/health")
def health_endpoint():
    return {
        "status": "ok",
        "service": "renew-ai-ml",
        "timestamp": datetime.utcnow().isoformat()
    }
