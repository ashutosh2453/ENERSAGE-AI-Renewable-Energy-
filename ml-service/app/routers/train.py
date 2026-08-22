from fastapi import APIRouter
from app.schemas import TrainRequest, TrainResponse
from app.trainer import train_model

router = APIRouter()

@router.post("/train", response_model=TrainResponse)
def train_endpoint(request: TrainRequest):
    result = train_model(request.projectId, request.records)
    return result
