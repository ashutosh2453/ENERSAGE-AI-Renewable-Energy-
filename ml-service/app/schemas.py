from pydantic import BaseModel
from typing import List, Dict, Optional

class TrainRequest(BaseModel):
    projectId: str
    records: List[Dict]

class TrainResponse(BaseModel):
    modelId: str
    r2Score: float
    rmse: float
    featureImportance: Dict[str, float]
    message: str

class ForecastRequest(BaseModel):
    projectId: str
    records: List[Dict]
    horizon: int = 24

class ForecastPoint(BaseModel):
    timestamp: str
    value: float
    upperBound: float
    lowerBound: float
    confidence: float

class ForecastResponse(BaseModel):
    modelId: str
    horizon: int
    predictions: List[ForecastPoint]
    featureImportance: Dict[str, float]
    confidenceScore: float
    xaiReasons: List[str]
