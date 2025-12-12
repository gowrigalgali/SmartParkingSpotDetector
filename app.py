from fastapi import FastAPI
from pydantic import BaseModel
import pandas as pd
import numpy as np
import joblib
# from xgboost import XGBRegressor
from tensorflow.keras.models import load_model

# Load artifacts
#xgb_model = XGBRegressor()
lstm_model = load_model("artifacts/lstm_parking_demo_model.keras")

scaler = joblib.load("/Users/gowrigalgali/Desktop/MADproject/SmartParkingSpotDetector/artifacts/feature_scaler.joblib")
label_encoder = joblib.load("/Users/gowrigalgali/Desktop/MADproject/SmartParkingSpotDetector/artifacts/loc_label_encoder.joblib")

# FastAPI app
app = FastAPI()

# Request body model
class ParkingRequest(BaseModel):
    latitude: float
    longitude: float
    rain: int = 0
    is_event: int = 0


@app.post("/predict")
def predict(req: ParkingRequest):

    # 1. Map coordinates → nearest location ID (same as you wrote)
    df = pd.read_csv("bangalore_parking_6months.csv")
    locs = df.groupby("loc_id")[["lat","lon"]].first().reset_index()
    locs["dist"] = np.sqrt((locs["lat"] - req.latitude)**2 + (locs["lon"] - req.longitude)**2)
    nearest = locs.sort_values("dist").iloc[0]
    loc_id = nearest["loc_id"]

    # 2. Get latest record from that location
    loc_df = df[df["loc_id"] == loc_id].sort_values("timestamp")
    latest = loc_df.iloc[-1]

    # 3. Build feature vector
    feature = {
        "loc_enc": label_encoder.transform([loc_id])[0],
        "capacity": latest["capacity"],
        "hour": latest["timestamp"].hour,
        "dayofweek": latest["timestamp"].weekday(),
        "is_weekend": 1 if latest["timestamp"].weekday() >= 5 else 0,
        "lag_1": latest["lag_1"],
        "lag_4": latest["lag_4"],
        "lag_96": latest["lag_96"],
        "roll_mean_4": latest["roll_mean_4"],
        "roll_mean_96": latest["roll_mean_96"],
        "rain": req.rain,
        "is_event": req.is_event
    }

    X = np.array([list(feature.values())])
    
    # Scale continuous columns
    cont_idx = [1, 5, 6, 7, 8, 9]
    X[:, cont_idx] = scaler.transform(X[:, cont_idx])

    # Predict
    pred = lstm_model.predict(X)[0]
    occupancy_percent = round(pred * 100, 2)

    return {
        "location_id": loc_id,
        "occupancy_rate": occupancy_percent
    }
