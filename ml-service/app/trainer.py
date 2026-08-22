import os
import numpy as np
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import r2_score, mean_squared_error
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from xgboost import XGBRegressor

from app.preprocessing import prepare_features, get_feature_columns

MODELS_DIR = os.getenv("MODELS_DIR", "./models")

def train_model(projectId: str, records: list) -> dict:
    np.random.seed(42)
    df = pd.DataFrame(records)
    df = prepare_features(df)
    
    df["totalGeneration"] = df.get("solarGeneration", 0) + df.get("windGeneration", 0)
    
    all_features = get_feature_columns()
    features = [f for f in all_features if f in df.columns]
    
    if len(df) < 2:
        raise ValueError("Not enough data to train model after preprocessing")
        
    X = df[features]
    y = df["totalGeneration"]
    
    split_idx = int(len(df) * 0.8)
    if split_idx == 0:
        split_idx = 1
        
    X_train, X_test = X.iloc[:split_idx], X.iloc[split_idx:]
    y_train, y_test = y.iloc[:split_idx], y.iloc[split_idx:]
    
    if len(X_test) == 0:
        X_test = X_train
        y_test = y_train
    
    rf = RandomForestRegressor(n_estimators=100, random_state=42)
    gb = GradientBoostingRegressor(n_estimators=100, random_state=42)
    xgb = XGBRegressor(n_estimators=100, random_state=42)
    
    rf.fit(X_train, y_train)
    gb.fit(X_train, y_train)
    xgb.fit(X_train, y_train)
    
    rf_pred = rf.predict(X_test)
    gb_pred = gb.predict(X_test)
    xgb_pred = xgb.predict(X_test)
    
    ensemble_pred = (rf_pred + gb_pred + xgb_pred) / 3
    
    r2 = r2_score(y_test, ensemble_pred) if len(np.unique(y_test)) > 1 else 1.0
    rmse = np.sqrt(mean_squared_error(y_test, ensemble_pred))
    
    rf_fi = rf.feature_importances_
    gb_fi = gb.feature_importances_
    xgb_fi = xgb.feature_importances_
    
    xgb_fi = xgb_fi / xgb_fi.sum() if xgb_fi.sum() > 0 else xgb_fi
    
    avg_fi = (rf_fi + gb_fi + xgb_fi) / 3
    feature_importance = {f: float(imp) for f, imp in zip(features, avg_fi)}
    
    os.makedirs(MODELS_DIR, exist_ok=True)
    joblib.dump(rf, os.path.join(MODELS_DIR, f"{projectId}_rf.joblib"))
    joblib.dump(gb, os.path.join(MODELS_DIR, f"{projectId}_gb.joblib"))
    joblib.dump(xgb, os.path.join(MODELS_DIR, f"{projectId}_xgb.joblib"))
    joblib.dump(features, os.path.join(MODELS_DIR, f"{projectId}_features.joblib"))
    
    return {
        "modelId": projectId,
        "r2Score": float(r2),
        "rmse": float(rmse),
        "featureImportance": feature_importance,
        "message": "Models trained successfully"
    }
