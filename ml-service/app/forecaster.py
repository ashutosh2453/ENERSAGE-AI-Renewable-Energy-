import os
import numpy as np
import pandas as pd
import joblib
from fastapi import HTTPException

from app.preprocessing import generate_future_features

MODELS_DIR = os.getenv("MODELS_DIR", "./models")

def load_models(projectId: str) -> tuple:
    rf_path = os.path.join(MODELS_DIR, f"{projectId}_rf.joblib")
    gb_path = os.path.join(MODELS_DIR, f"{projectId}_gb.joblib")
    xgb_path = os.path.join(MODELS_DIR, f"{projectId}_xgb.joblib")
    feat_path = os.path.join(MODELS_DIR, f"{projectId}_features.joblib")
    
    if not (os.path.exists(rf_path) and os.path.exists(gb_path) and os.path.exists(xgb_path) and os.path.exists(feat_path)):
        raise FileNotFoundError("Models not found")
        
    rf = joblib.load(rf_path)
    gb = joblib.load(gb_path)
    xgb = joblib.load(xgb_path)
    features = joblib.load(feat_path)
    
    return rf, gb, xgb, features

def forecast(projectId: str, records: list, horizon: int) -> dict:
    try:
        rf, gb, xgb, features = load_models(projectId)
    except FileNotFoundError:
        raise HTTPException(status_code=404, detail="Models not found. Train the model first.")
        
    if not records:
        raise HTTPException(status_code=400, detail="No records provided")
        
    last_record = records[-1]
    last_timestamp = last_record.get("timestamp")
    
    df_future = generate_future_features(last_record, horizon, last_timestamp)
    
    for f in features:
        if f not in df_future.columns:
            df_future[f] = 0
            
    X_future = df_future[features]
    
    rf_pred = rf.predict(X_future)
    gb_pred = gb.predict(X_future)
    xgb_pred = xgb.predict(X_future)
    
    preds_stack = np.vstack([rf_pred, gb_pred, xgb_pred])
    ensemble_pred = np.mean(preds_stack, axis=0)
    ensemble_std = np.std(preds_stack, axis=0)
    
    predictions = []
    confidences = []
    for i, dt in enumerate(df_future["timestamp"]):
        val = float(ensemble_pred[i])
        std = float(ensemble_std[i])
        
        upper = val + 1.5 * std
        lower = max(0.0, val - 1.5 * std)
        
        conf = max(0.0, 1 - std / max(val, 1.0))
        confidences.append(conf)
        
        predictions.append({
            "timestamp": dt.isoformat(),
            "value": val,
            "upperBound": upper,
            "lowerBound": lower,
            "confidence": conf
        })
        
    confidence_score = float(np.mean(confidences))
    
    rf_fi = rf.feature_importances_
    gb_fi = gb.feature_importances_
    xgb_fi = xgb.feature_importances_
    xgb_fi = xgb_fi / xgb_fi.sum() if xgb_fi.sum() > 0 else xgb_fi
    avg_fi = (rf_fi + gb_fi + xgb_fi) / 3
    
    feature_importance = {f: float(imp) for f, imp in zip(features, avg_fi)}
    sorted_fi = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
    
    xaiReasons = []
    if len(sorted_fi) > 0:
        f1, imp1 = sorted_fi[0]
        xaiReasons.append(f"{f1} accounts for {imp1*100:.1f}% of generation variance")
    if len(sorted_fi) > 1:
        f2, imp2 = sorted_fi[1]
        xaiReasons.append(f"{f2} is the strongest predictor at {imp2*100:.1f}%")
    xaiReasons.append(f"Model uncertainty contributes to bounds with mean confidence of {confidence_score*100:.1f}%")

    return {
        "modelId": projectId,
        "horizon": horizon,
        "predictions": predictions,
        "featureImportance": feature_importance,
        "confidenceScore": confidence_score,
        "xaiReasons": xaiReasons
    }
