// src/api/mlApi.js

/**
 * Lightweight mock around the parking availability model.
 * In production this would call your hosted ML service. For now, we generate
 * deterministic-yet-dynamic data based on the coordinates so designers can
 * iterate on the UI without a backend dependency.
 */
export async function fetchParkingPrediction({ latitude, longitude }) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    return null;
  }

  // Simulate latency so the UI can show a shimmer/loader.
  await wait(650);

  const base = normalize(latitude, -90, 90);
  const modifier = normalize(longitude, -180, 180);

  const current = clamp(Math.round(100 - (base * 40 + modifier * 30)), 5, 95);
  const confidence = clamp(Math.round(70 + modifier * 15), 45, 98);

  const nextHours = Array.from({ length: 4 }).map((_, idx) => {
    const delta = idx * 0.18;
    const value = clamp(
      Math.round(current + Math.sin(base + idx) * 10 - modifier * 6 + delta * 15),
      5,
      97
    );
    return {
      label: idx === 0 ? "Now" : `${idx * 30}m`,
      value,
    };
  });

  const recommendation =
    current > 70 ? "Plenty of slots" : current > 40 ? "Moderate demand" : "High demand";

  return {
    currentOccupancy: current,
    confidence,
    nextHours,
    recommendation,
  };
}

function normalize(value, min, max) {
  return (value - min) / (max - min);
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
