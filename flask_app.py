import os
import json
import joblib
import numpy as np
import pandas as pd
from flask import Flask, request, jsonify
import xgboost as xgb

# -----------------------------
# Paths
# -----------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARTIFACT_DIR = os.path.join(BASE_DIR, "artifacts")
DATA_PATH = os.path.join(BASE_DIR, "bangalore_parking_6months.csv")

# -----------------------------
# Load artifacts
# -----------------------------
print("🔄 Loading artifacts...")

scaler = joblib.load(os.path.join(ARTIFACT_DIR, "feature_scaler.joblib"))
label_encoder = joblib.load(os.path.join(ARTIFACT_DIR, "loc_label_encoder.joblib"))

with open(os.path.join(ARTIFACT_DIR, "feature_order.json")) as f:
    FEATURE_ORDER = json.load(f)

xgb_model = xgb.Booster()
xgb_model.load_model(os.path.join(ARTIFACT_DIR, "xgb_parking_model.json"))

print("✅ Artifacts loaded")

# -----------------------------
# Load & preprocess data (MATCH TRAINING)
# -----------------------------
df = pd.read_csv(DATA_PATH)
df["timestamp"] = pd.to_datetime(df["timestamp"])
df = df.sort_values(["loc_id", "timestamp"]).reset_index(drop=True)

TARGET = "occupancy_rate"

# Time features
df["hour"] = df["timestamp"].dt.hour
df["dayofweek"] = df["timestamp"].dt.dayofweek
df["is_weekend"] = df["dayofweek"].isin([5, 6]).astype(int)

# Lag features
for lag in [1, 4, 96]:
    df[f"lag_{lag}"] = df.groupby("loc_id")[TARGET].shift(lag)

# Rolling means
df["roll_mean_4"] = (
    df.groupby("loc_id")[TARGET]
    .shift(1)
    .rolling(4, min_periods=1)
    .mean()
    .reset_index(level=0, drop=True)
)

df["roll_mean_96"] = (
    df.groupby("loc_id")[TARGET]
    .shift(1)
    .rolling(96, min_periods=1)
    .mean()
    .reset_index(level=0, drop=True)
)

# Fill NaNs using loc mean (same as training)
df["loc_mean"] = df.groupby("loc_id")[TARGET].transform("mean")
for c in ["lag_1", "lag_4", "lag_96", "roll_mean_4", "roll_mean_96"]:
    df[c] = df[c].fillna(df["loc_mean"])

# Precompute latest state
latest_state = df.groupby("loc_id").tail(1).reset_index(drop=True)

# Location coordinates
loc_coords = df.groupby("loc_id")[["lat", "lon"]].first().reset_index()

# -----------------------------
# Flask app
# -----------------------------
app = Flask(__name__)

@app.route("/", methods=["GET"])
def home():
    return {
        "status": "ok",
        "model": "xgboost",
        "locations": int(len(loc_coords))
    }

@app.route("/predict", methods=["POST"])
def predict():
    payload = request.get_json(force=True)

    lat = payload.get("latitude")
    lon = payload.get("longitude")
    rain = int(payload.get("rain", 0))
    is_event = int(payload.get("is_event", 0))

    if lat is None or lon is None:
        return jsonify({"error": "latitude and longitude required"}), 400

    # 1️⃣ Find nearest location
    loc_coords["dist"] = np.sqrt(
        (loc_coords["lat"] - lat) ** 2 +
        (loc_coords["lon"] - lon) ** 2
    )

    loc_id = loc_coords.sort_values("dist").iloc[0]["loc_id"]

    # 2️⃣ Latest row for that location
    row = latest_state[latest_state["loc_id"] == loc_id].iloc[0]

    # 3️⃣ Feature map (ORDER MATTERS)
    feature_map = {
        "loc_enc": int(label_encoder.transform([loc_id])[0]),
        "capacity": float(row["capacity"]),
        "hour": int(row["hour"]),
        "dayofweek": int(row["dayofweek"]),
        "is_weekend": int(row["is_weekend"]),
        "lag_1": float(row["lag_1"]),
        "lag_4": float(row["lag_4"]),
        "lag_96": float(row["lag_96"]),
        "roll_mean_4": float(row["roll_mean_4"]),
        "roll_mean_96": float(row["roll_mean_96"]),
        "rain": rain,
        "is_event": is_event,
    }

    X = np.array([[feature_map[f] for f in FEATURE_ORDER]])

    # Scale continuous cols
    CONT_COLS = ["capacity", "lag_1", "lag_4", "lag_96", "roll_mean_4", "roll_mean_96"]
    CONT_IDX = [FEATURE_ORDER.index(c) for c in CONT_COLS]
    X[:, CONT_IDX] = scaler.transform(X[:, CONT_IDX])

    # Predict
    dmatrix = xgb.DMatrix(X, feature_names=FEATURE_ORDER)
    pred = float(xgb_model.predict(dmatrix)[0])

    return jsonify({
        "location_id": loc_id,
        "occupancy_rate": round(pred * 100, 2)
    })

# -----------------------------
# Run
# -----------------------------
if __name__ == "__main__":
    print("🚀 Flask inference server running...")
    app.run(host="127.0.0.1", port=8000)
