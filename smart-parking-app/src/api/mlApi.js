// src/api/mlApi.js
import { Platform } from "react-native";

/**
 * =====================================================
 * DEVICE-AWARE API BASE URL
 * =====================================================
 *
 * IMPORTANT:
 * - Emulator: uses special loopback IP
 * - Real phone: MUST use your laptop's local IP
 * - Production: replace with HTTPS domain
 */

const DEV_MACHINE_IP = "192.168.86.120"; // 🔴 CHANGE THIS to your laptop IP

const API_BASE_URL = __DEV__
  ? Platform.select({
      ios:
        Platform.OS === "ios" && !Platform.isPad && !Platform.isTV
          ? "http://127.0.0.1:8000"       // ✅ iOS Simulator
          : `http://${DEV_MACHINE_IP}:8000`, // 📱 real iPhone
      android: `http://${DEV_MACHINE_IP}:8000`,
      default: "http://127.0.0.1:8000",
    })
  : "https://your-production-api.com";

/**
 * =====================================================
 * FETCH PARKING PREDICTION
 * =====================================================
 */
export async function fetchParkingPrediction({
  latitude,
  longitude,
  rain = 0,
  is_event = 0,
}) {
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    console.warn("❌ Invalid coordinates passed to ML API");
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      signal: controller.signal,
      body: JSON.stringify({
        latitude,
        longitude,
        rain,
        is_event,
      }),
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.error("❌ ML API error:", response.status);
      return null;
    }

    const data = await response.json();

    /**
     * Backend returns:
     * {
     *   location_id,
     *   occupancy_rate
     * }
     */

    const current = Math.round(data.occupancy_rate);
    const confidence = 85; // static for now (can be dynamic later)

    // Simulated short-term trend (UI only)
    const nextHours = Array.from({ length: 4 }).map((_, idx) => ({
      label: idx === 0 ? "Now" : `${idx * 30}m`,
      value: clamp(current + idx * 3 - 4, 5, 95),
    }));

    const recommendation =
      current > 70
        ? "Plenty of slots"
        : current > 40
        ? "Moderate demand"
        : "High demand";

    return {
      currentOccupancy: current,
      confidence,
      nextHours,
      recommendation,
      locationId: data.location_id,
      source: "ml-backend",
    };
  } catch (error) {
    if (error.name === "AbortError") {
      console.warn("⏱️ ML API request timed out");
    } else {
      console.error("🔥 ML API fetch failed:", error.message);
    }
    return null;
  }
}

/**
 * =====================================================
 * HELPERS
 * =====================================================
 */
function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}
