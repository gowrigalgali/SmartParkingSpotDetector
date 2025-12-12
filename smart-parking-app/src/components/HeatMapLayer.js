// src/components/HeatMapLayer.js
import React, { useMemo } from "react";
import { Circle } from "react-native-maps";

/**
 * Custom heatmap implementation using Circle components from react-native-maps.
 * The component accepts Firestore parking events (lat/lon) and renders overlapping
 * circles to create a heatmap effect highlighting popular parking areas.
 */
export default function HeatMapLayer({ points = [], radius = 50 }) {
  const validPoints = useMemo(() => {
    return points
      .map((spot) => ({
        latitude: spot.lat ?? spot.latitude,
        longitude: spot.lon ?? spot.longitude,
        weight: spot.weight ?? 1,
      }))
      .filter(
        (point) =>
          typeof point.latitude === "number" &&
          typeof point.longitude === "number" &&
          !isNaN(point.latitude) &&
          !isNaN(point.longitude)
      );
  }, [points]);

  // Group nearby points to calculate density
  const densityMap = useMemo(() => {
    if (!validPoints.length) {
      return new Map();
    }
    const map = new Map();
    validPoints.forEach((point) => {
      const key = `${Math.round(point.latitude * 1000)}_${Math.round(point.longitude * 1000)}`;
      if (map.has(key)) {
        map.set(key, map.get(key) + point.weight);
      } else {
        map.set(key, point.weight);
      }
    });
    return map;
  }, [validPoints]);

  // Calculate max density for normalization
  const maxDensity = useMemo(() => {
    if (densityMap.size === 0) {
      return 1;
    }
    return Math.max(...Array.from(densityMap.values()), 1);
  }, [densityMap]);

  if (!validPoints.length) {
    return null;
  }

  return (
    <>
      {validPoints.map((point, index) => {
        const key = `${Math.round(point.latitude * 1000)}_${Math.round(point.longitude * 1000)}`;
        const density = densityMap.get(key) || point.weight;
        const normalizedDensity = density / maxDensity;

        // Color gradient based on density (blue to red)
        let color = "#4fc3f7"; // Light blue (low density)
        if (normalizedDensity > 0.75) {
          color = "#d32f2f"; // Red (high density)
        } else if (normalizedDensity > 0.5) {
          color = "#ff7043"; // Orange
        } else if (normalizedDensity > 0.25) {
          color = "#01579b"; // Dark blue
        } else {
          color = "#0288d1"; // Medium blue
        }

        return (
          <Circle
            key={`heatmap-${index}-${point.latitude}-${point.longitude}`}
            center={{
              latitude: point.latitude,
              longitude: point.longitude,
            }}
            radius={radius}
            fillColor={color}
            strokeColor={color}
            strokeWidth={0}
            opacity={0.2 + normalizedDensity * 0.3} // Opacity between 0.2 and 0.5
          />
        );
      })}
    </>
  );
}
