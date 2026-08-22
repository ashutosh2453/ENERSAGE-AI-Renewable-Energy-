from fastapi import APIRouter
from app.schemas import ForecastRequest, ForecastResponse
from app.forecaster import forecast

router = APIRouter()

@router.post("/forecast", response_model=ForecastResponse)
def forecast_endpoint(request: ForecastRequest):
    result = forecast(request.projectId, request.records, request.horizon)
    return result
