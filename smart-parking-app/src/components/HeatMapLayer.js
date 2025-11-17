// src/components/HeatMapLayer.js
import React from "react";
import { Heatmap } from "react-native-maps";

/**
 * Lightweight wrapper around the `Heatmap` component from react-native-maps.
 * The component accepts Firestore parking events (lat/lon) and renders a soft
 * density layer to highlight popular areas without obscuring the base map.
 */
export default function HeatMapLayer({ points = [], radius = 50 }) {
  if (!points.length) {
    return null;
  }

  const heatPoints = points
    .map((spot) => ({
      latitude: spot.lat ?? spot.latitude,
      longitude: spot.lon ?? spot.longitude,
      weight: spot.weight ?? 1,
    }))
    .filter(
      (point) =>
        typeof point.latitude === "number" && typeof point.longitude === "number"
    );

  if (!heatPoints.length) {
    return null;
  }

  return (
    <Heatmap
      points={heatPoints}
      radius={radius}
      opacity={0.35}
      gradient={{
        colors: ["#4fc3f7", "#0288d1", "#01579b", "#ff7043", "#d32f2f"],
        startPoints: [0.01, 0.25, 0.5, 0.75, 1],
        colorMapSize: 256,
      }}
    />
  );
}
