import pandas as pd
import numpy as np

def prepare_features(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    if "timestamp" in df.columns:
        df["timestamp"] = pd.to_datetime(df["timestamp"])
        df = df.sort_values("timestamp").reset_index(drop=True)
        df["hour"] = df["timestamp"].dt.hour
        df["day_of_week"] = df["timestamp"].dt.dayofweek
        df["month"] = df["timestamp"].dt.month
        df["day_of_year"] = df["timestamp"].dt.dayofyear
        
        df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
        df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
        df["dow_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
        df["dow_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7)
    
    if "solarGeneration" in df.columns:
        df["solarGeneration_lag1"] = df["solarGeneration"].shift(1)
        df["solarGeneration_lag24"] = df["solarGeneration"].shift(24)
        df["solarGen_rolling6"] = df["solarGeneration"].rolling(window=6).mean()
    
    if "windGeneration" in df.columns:
        df["windGeneration_lag1"] = df["windGeneration"].shift(1)
        df["windGen_rolling6"] = df["windGeneration"].rolling(window=6).mean()
        
    df = df.dropna().reset_index(drop=True)
    return df

def get_feature_columns() -> list:
    return [
        "hour", "day_of_week", "month", "day_of_year",
        "hour_sin", "hour_cos", "dow_sin", "dow_cos",
        "solarGeneration_lag1", "solarGeneration_lag24", "windGeneration_lag1",
        "solarGen_rolling6", "windGen_rolling6",
        "solarIrradiance", "windSpeed", "temperature"
    ]

def generate_future_features(last_record: dict, horizon: int, last_timestamp: str) -> pd.DataFrame:
    last_dt = pd.to_datetime(last_timestamp)
    future_timestamps = [last_dt + pd.Timedelta(hours=i+1) for i in range(horizon)]
    
    future_records = []
    for dt in future_timestamps:
        rec = last_record.copy()
        rec["timestamp"] = dt
        future_records.append(rec)
        
    df = pd.DataFrame(future_records)
    
    df["hour"] = df["timestamp"].dt.hour
    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["month"] = df["timestamp"].dt.month
    df["day_of_year"] = df["timestamp"].dt.dayofyear
    
    df["hour_sin"] = np.sin(2 * np.pi * df["hour"] / 24)
    df["hour_cos"] = np.cos(2 * np.pi * df["hour"] / 24)
    df["dow_sin"] = np.sin(2 * np.pi * df["day_of_week"] / 7)
    df["dow_cos"] = np.cos(2 * np.pi * df["day_of_week"] / 7)
    
    if "solarGeneration" in last_record:
        df["solarGeneration_lag1"] = last_record["solarGeneration"]
        df["solarGeneration_lag24"] = last_record["solarGeneration"]
        df["solarGen_rolling6"] = last_record["solarGeneration"]
    
    if "windGeneration" in last_record:
        df["windGeneration_lag1"] = last_record["windGeneration"]
        df["windGen_rolling6"] = last_record["windGeneration"]
        
    return df
