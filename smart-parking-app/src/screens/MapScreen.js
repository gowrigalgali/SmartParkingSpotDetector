// src/screens/MapScreen.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, Alert, StyleSheet, ActivityIndicator, RefreshControl, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import { fetchRecentEvents, reportParking, viewAllParkingEvents, auth } from "../firebase/firebase";
import { fetchParkingPrediction } from "../api/mlApi";
import HeatMapLayer from "../components/HeatMapLayer";
import MarkParkingButton from "../components/MarkParkingButton";
import PredictionModel from "../components/PredictionModel";
import ParkingQuestionnaire from "../components/ParkingQuestionnaire";
import LocationSearchBar from "../components/LocationSearchBar";

export default function MapScreen({ navigation }) {
  // Expo exposes public env vars prefixed with EXPO_PUBLIC_
  const googleMapsApiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const insets = useSafeAreaInsets();

  const mapRef = useRef(null);
  const locationWatcherRef = useRef(null);
  const isSearchedLocationRef = useRef(false);
  const [location, setLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [events, setEvents] = useState([]);
  const [predictions, setPredictions] = useState(null);
  const [fetchingPredictions, setFetchingPredictions] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showQuestionnaire, setShowQuestionnaire] = useState(false);

  // ---------------------------------------------------
  // 1. Get user location
  // ---------------------------------------------------
  useEffect(() => {
    let subscription;
    (async () => {
      setLoadingLocation(true);
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        Alert.alert("Permission Denied", "Please enable location access.");
        setLoadingLocation(false);
        return;
      }

      // Initial position
      const pos = await Location.getCurrentPositionAsync({});
      setLocation(pos.coords);
      setLoadingLocation(false);

      // Live updates as user moves (only if not using searched location)
      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 5, // meters
          timeInterval: 5000, // ms
        },
        (loc) => {
          // Only update location if user hasn't searched for a location
          if (!isSearchedLocationRef.current) {
            setLocation(loc.coords);
            mapRef.current?.animateCamera({
              center: {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
              },
              zoom: 16,
            });
          }
        }
      );
      locationWatcherRef.current = subscription;
    })();

    return () => {
      subscription?.remove();
    };
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
  // 2. Handle location search
  // ---------------------------------------------------
  const handleLocationSearch = async (selectedLocation) => {
    console.log("🗺️ MapScreen: Location searched:", selectedLocation);
    isSearchedLocationRef.current = true;
    setLocation(selectedLocation);
    
    // Animate map to searched location
    mapRef.current?.animateToRegion(
      {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      },
      1000
    );

    // Load events and predictions for searched location
    setRefreshing(true);
    setFetchingPredictions(true);
    
    try {
      // Load events for searched location
      const bbox = {
        minLat: selectedLocation.latitude - 0.02,
        maxLat: selectedLocation.latitude + 0.02,
        minLon: selectedLocation.longitude - 0.02,
        maxLon: selectedLocation.longitude + 0.02,
      };
      const rows = await fetchRecentEvents(bbox);
      setEvents(rows);
      setRefreshing(false);

      // Load predictions for searched location
      const data = await fetchParkingPrediction({
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
      });
      setPredictions(data);
      setFetchingPredictions(false);
    } catch (error) {
      console.log("Error loading data for searched location:", error);
      setRefreshing(false);
      setFetchingPredictions(false);
    }
  };

  // ---------------------------------------------------
  // 3. Show questionnaire when parking button is clicked
  // ---------------------------------------------------
  const handleParking = () => {
    console.log("🗺️ MapScreen: 'I Parked Here' button clicked");
    console.log("🗺️ MapScreen: Current location:", location);
    
    if (!location) {
      console.error("❌ MapScreen: Location not available");
      Alert.alert("Error", "Location not ready yet.");
      return;
    }
    
    console.log("🗺️ MapScreen: Opening questionnaire modal");
    setShowQuestionnaire(true);
  };

  // ---------------------------------------------------
  // 4. Submit parking data from questionnaire
  // ---------------------------------------------------
  const handleSubmitParking = async (formData) => {
    console.log("🗺️ MapScreen: handleSubmitParking called");
    console.log("🗺️ MapScreen: Received form data:", JSON.stringify(formData, null, 2));
    
    setIsSaving(true);
    setShowQuestionnaire(false);

    const userId = auth.currentUser?.uid || auth.currentUser?.email || "anonymous";
    console.log("🗺️ MapScreen: User ID:", userId);

    const payload = {
      userId,
      lat: formData.lat,
      lon: formData.lon,
      rain: formData.rain,
      is_event: formData.is_event,
      parking_duration: formData.parking_duration,
      user_purpose: formData.user_purpose,
      vehicleType: formData.vehicleType,
      message: formData.message,
      test: formData.test,
      easeRating: formData.easeRating,
      event: "parked",
    };

    console.log("🗺️ MapScreen: Payload to send to Firebase:", JSON.stringify(payload, null, 2));

    // Validate payload
    if (!payload.lat || !payload.lon) {
      console.error("❌ MapScreen: Missing lat/lon in payload!");
      Alert.alert("Error", "Location data is missing.");
      setIsSaving(false);
      return;
    }

    if (!payload.vehicleType) {
      console.error("❌ MapScreen: Missing vehicleType in payload!");
      Alert.alert("Error", "Vehicle type is required.");
      setIsSaving(false);
      return;
    }

    try {
      console.log("🗺️ MapScreen: Calling reportParking...");
      const res = await reportParking(payload);
      console.log("🗺️ MapScreen: reportParking response:", JSON.stringify(res, null, 2));
      
      if (!res?.success) {
        throw new Error(res?.error || "Unable to save spot");
      }

      console.log("✅ MapScreen: Parking saved successfully with ID:", res.id);
      setToast("Saved spot – thank you for contributing!");
      setEvents((prev) => [{ ...payload, id: res.id || Date.now() }, ...prev]);
      setTimeout(() => setToast(null), 3000);
      loadRecentEvents();
    } catch (err) {
      console.error("🔥 MapScreen: Firebase error occurred");
      console.error("🔥 MapScreen: Error details:", err);
      console.error("🔥 MapScreen: Error message:", err.message);
      console.error("🔥 MapScreen: Error stack:", err.stack);
      Alert.alert("Unable to mark parking spot", err.message);
    } finally {
      console.log("🗺️ MapScreen: Setting isSaving to false");
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
    <View style={styles.screen}>
      <View style={styles.mapWrapper}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={StyleSheet.absoluteFill}
          region={region}
          showsUserLocation
          showsCompass={false}
          userInterfaceStyle="dark"
          mapPadding={{
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
          }}
        >
          {location && (
            <Marker coordinate={location} title="You are here">
              <Ionicons name="car" size={28} color="#1e3a8a" />
            </Marker>
          )}
          <HeatMapLayer points={events} />
        </MapView>

        <View style={[styles.overlayTop, { top: insets.top + 16 }]}>
          <View style={styles.topRow}>
            <View style={styles.searchContainer}>
              <LocationSearchBar
                onLocationSelect={handleLocationSearch}
                apiKey={googleMapsApiKey}
              />
            </View>
            <TouchableOpacity
              style={styles.profileButton}
              onPress={() => navigation.navigate("Profile")}
            >
              <Ionicons name="person" size={24} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={[styles.bottomSheet, { paddingBottom: insets.bottom }]}
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

        <View style={[styles.parkingButtonContainer, { bottom: insets.bottom + 32 }]}>
          <MarkParkingButton onPress={handleParking} loading={isSaving} />
        </View>

        {toast && (
          <View style={[styles.toast, { bottom: insets.bottom + 140 }]}>
            <Ionicons name="checkmark-circle" size={18} color="#fff" />
            <Text style={styles.toastText}>{toast}</Text>
          </View>
        )}

        <ParkingQuestionnaire
          visible={showQuestionnaire}
          onClose={() => {
            console.log("🗺️ MapScreen: Questionnaire close requested");
            setShowQuestionnaire(false);
          }}
          onSubmit={handleSubmitParking}
          loading={isSaving}
          location={location}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { 
    flex: 1, 
    backgroundColor: "#0f172a",
  },
  mapWrapper: { 
    flex: 1,
  },
  parkingButtonContainer: {
    position: "absolute",
    left: 20,
    right: 20,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  loadingText: { marginTop: 12, fontSize: 16, color: "#0f172a" },
  overlayTop: {
    position: "absolute",
    left: 20,
    right: 20,
    zIndex: 10,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  searchContainer: {
    flex: 1,
    alignSelf: "stretch",
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#4285f4",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
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
