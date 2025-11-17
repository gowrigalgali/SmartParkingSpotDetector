// src/screens/MapScreen.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { View, Text, Alert, StyleSheet, ActivityIndicator, RefreshControl, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { fetchRecentEvents, reportParking } from "../firebase/firebase";
import { fetchParkingPrediction } from "../api/mlApi";
import HeatMapLayer from "../components/HeatMapLayer";
import MarkParkingButton from "../components/MarkParkingButton";
import PredictionModel from "../components/PredictionModel";

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [events, setEvents] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [fetchingPredictions, setFetchingPredictions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ---------------------------------------------------
  // 1. Get user location
  // ---------------------------------------------------
  useEffect(() => {
    (async () => {
      setLoadingLocation(true);
      let { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission Denied", "Please enable location access.");
        setLoadingLocation(false);
        return;
      }

      let pos = await Location.getCurrentPositionAsync({});
      setLocation(pos.coords);

      console.log("📍 User Location:", pos.coords);
      setLoadingLocation(false);
    })();
  }, []);

  useEffect(() => {
    if (!location) return;
    loadRecentEvents();
    loadPredictions();
  }, [location]);

  const loadRecentEvents = useCallback(async () => {
    if (!location) return;
    setRefreshing(true);
    try {
      const bbox = {
        minLat: location.latitude - 0.02,
        maxLat: location.latitude + 0.02,
        minLon: location.longitude - 0.02,
        maxLon: location.longitude + 0.02,
      };
      const rows = await fetchRecentEvents(bbox);
      setEvents(rows);
    } catch (error) {
      console.log("Error fetching events", error);
    } finally {
      setRefreshing(false);
    }
  }, [location]);

  const loadPredictions = useCallback(async () => {
    if (!location) return;
    setFetchingPredictions(true);
    try {
      const data = await fetchParkingPrediction({
        latitude: location.latitude,
        longitude: location.longitude,
      });
      setPredictions(data);
    } catch (error) {
      console.log("Prediction error", error);
    } finally {
      setFetchingPredictions(false);
    }
  }, [location]);

  // ---------------------------------------------------
  // 2. Save parking location to Firebase
  // ---------------------------------------------------
  const handleParking = async () => {
    if (!location) {
      Alert.alert("Error", "Location not ready yet.");
      console.log("❌ Location not available");
      return;
    }

    setIsSaving(true);

    const payload = {
      lat: location.latitude,
      lon: location.longitude,
      vehicleType: "car",
    };

    try {
      const res = await reportParking(payload);
      if (!res?.success) {
        throw new Error(res?.error || "Unable to save spot");
      }

      console.log("✅ Parking saved:", res.id);
      setToast("Saved spot – thank you for contributing!");
      setEvents((prev) => [{ ...payload, id: res.id || Date.now() }, ...prev]);
      setTimeout(() => setToast(null), 3000);
      loadRecentEvents();
    } catch (err) {
      console.error("🔥 Firebase error:", err);
      Alert.alert("Unable to mark parking spot", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const quickStats = useMemo(
    () => [
      {
        label: "Community reports",
        value: events.length,
        icon: "people-outline",
      },
      {
        label: "Heat intensity",
        value: events.length ? "Live" : "Calm",
        icon: "flame-outline",
      },
      {
        label: "AI confidence",
        value: predictions?.confidence ? `${predictions.confidence}%` : "--",
        icon: "sparkles-outline",
      },
    ],
    [events.length, predictions?.confidence]
  );

  // ---------------------------------------------------
  // 3. UI rendering
  // ---------------------------------------------------
  if (loadingLocation) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color="#0d47a1" />
        <Text style={styles.loadingText}>Fetching your location...</Text>
      </SafeAreaView>
    );
  }

  if (!location) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.loadingText}>Enable location to explore parking spots.</Text>
      </SafeAreaView>
    );
  }

  const region = {
    latitude: location.latitude,
    longitude: location.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.mapWrapper}>
        <MapView
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          initialRegion={region}
          region={region}
          showsUserLocation
          showsCompass={false}
          userInterfaceStyle="dark"
        >
          {location && (
            <Marker coordinate={location} title="You are here">
              <Ionicons name="car" size={28} color="#1e3a8a" />
            </Marker>
          )}
          <HeatMapLayer points={events} />
        </MapView>

        <View style={styles.overlayTop}>
          <Text style={styles.greeting}>Welcome back 👋</Text>
          <Text style={styles.subGreeting}>Let's find a nearby spot.</Text>
        </View>

        <ScrollView
          style={styles.bottomSheet}
          contentContainerStyle={styles.bottomContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={loadRecentEvents} />
          }
        >
          <PredictionModel
            data={predictions}
            loading={fetchingPredictions}
            onRefresh={loadPredictions}
          />

          <View style={styles.statsRow}>
            {quickStats.map((item) => (
              <View key={item.label} style={styles.statCard}>
                <Ionicons name={item.icon} size={20} color="#0d47a1" />
                <Text style={styles.statValue}>{item.value}</Text>
                <Text style={styles.statLabel}>{item.label}</Text>
              </View>
            ))}
          </View>
        </ScrollView>

        <MarkParkingButton onPress={handleParking} loading={isSaving} />

        {toast && (
          <View style={styles.toast}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#0f172a" },
  mapWrapper: { flex: 1 },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  loadingText: { marginTop: 12, fontSize: 16, color: "#0f172a" },
  overlayTop: {
    position: "absolute",
    top: 16,
    left: 20,
    right: 20,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "rgba(15,23,42,0.72)",
  },
  greeting: { color: "#e0e7ff", fontSize: 18, fontWeight: "600" },
  subGreeting: { color: "#94a3b8", marginTop: 4 },
  bottomSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "50%",
  },
  bottomContent: {
    padding: 20,
    paddingBottom: 120,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    gap: 18,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 16,
    backgroundColor: "#f6f8ff",
    alignItems: "flex-start",
    gap: 6,
  },
  statValue: { fontSize: 17, fontWeight: "700", color: "#0f172a" },
  statLabel: { fontSize: 12, color: "#64748b" },
  toast: {
    position: "absolute",
    bottom: 140,
    left: 40,
    right: 40,
    backgroundColor: "#0d9488",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  toastText: { color: "#fff", fontWeight: "600" },
});
