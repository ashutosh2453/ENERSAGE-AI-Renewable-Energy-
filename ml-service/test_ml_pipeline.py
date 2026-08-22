import sys
import numpy as np
import pandas as pd
from app.preprocessing import prepare_features, generate_future_features, get_feature_columns
from app.trainer import train_model
from app.forecaster import forecast

def main():
    print("Testing ML Feature Pipeline...")
    records = []
    now = pd.Timestamp.now()
    for i in range(100):
        t = now - pd.Timedelta(hours=100-i)
        records.append({
            'timestamp': t.isoformat(),
            'solarGeneration': float(max(0.0, 100.0 * np.sin(np.pi * (t.hour - 6) / 12))),
            'windGeneration': float(40.0 + 10.0 * np.sin(t.hour / 24 * 2 * np.pi)),
            'energyDemand': 80.0,
            'batterySOC': 60.0,
            'temperature': 22.0,
            'solarIrradiance': 500.0,
            'cloudCoverage': 20.0,
            'humidity': 50.0,
            'windSpeed': 8.0,
            'windDirection': 180.0,
            'rainProbability': 0.0,
            'batteryCapacity': 500.0,
            'gridPrice': 0.10,
            'gridAvailability': True
        })

    train_res = train_model('test_project_verify', records)
    print(f"[OK] ML Training passed! R2: {train_res['r2Score']:.3f}, RMSE: {train_res['rmse']:.2f}")

    fc_res = forecast('test_project_verify', records, 24)
    print(f"[OK] ML Forecasting passed! Predictions: {len(fc_res['predictions'])}, Confidence: {fc_res['confidenceScore']*100:.1f}%")
    print(f"[OK] Top XAI Insight: {fc_res['xaiReasons'][0]}")

if __name__ == '__main__':
    main()
