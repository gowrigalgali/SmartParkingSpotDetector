// ------------------------------
// Firebase Setup
// ------------------------------
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  initializeFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  getDocs,
  orderBy,
  limit,
} from "firebase/firestore";

import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
} from "firebase/auth";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBIDce07GAp-_NZVAoFvK_IkS1NW5LZx6s",
  authDomain: "parkingapp-79ad5.firebaseapp.com",
  projectId: "parkingapp-79ad5",
  storageBucket: "parkingapp-79ad5.firebasestorage.app",
  messagingSenderId: "110129583526",
  appId: "1:110129583526:web:4e7d8a36ba664fc0c0eb67"
};


// ------------------------------
// Initialize App (Safe Singleton)
// ------------------------------
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// ------------------------------
// Firestore (Special initialization for React Native/iOS)
// ------------------------------
let firestoreInstance = globalThis.__FIRESTORE__;

// ensure only 1 instance
if (!firestoreInstance) {
  firestoreInstance =
    Platform.OS === "web"
      ? getFirestore(app)
      : initializeFirestore(app, {
          experimentalForceLongPolling: true, // <-- iOS fix
          useFetchStreams: false,
        });

  globalThis.__FIRESTORE__ = firestoreInstance;
}

export const db = firestoreInstance;

// ------------------------------
// Auth Initialization
// ------------------------------
let authInstance = globalThis.__AUTH__;

if (!authInstance) {
  authInstance =
    Platform.OS === "web"
      ? getAuth(app)
      : initializeAuth(app, {
          persistence: getReactNativePersistence(AsyncStorage),
        });

  globalThis.__AUTH__ = authInstance;
}

export const auth = authInstance;

// -----------------------------------------------------
// REPORT PARKING EVENT
// -----------------------------------------------------
export async function reportParking({
  userId,
  lat,
  lon,
  vehicleType,
  event = "parked",
}) {
  try {
    const docRef = await addDoc(collection(db, "parking_events"), {
      userId: userId || null,
      lat,
      lon,
      vehicleType,
      event,
      timestamp: serverTimestamp(),
    });

    console.log("🚗 Parking event saved with ID:", docRef.id);
    return { success: true, id: docRef.id };
  } catch (err) {
    console.error("❌ reportParking error:", err);
    return { success: false, error: err.message };
  }
}

// -----------------------------------------------------
// FETCH RECENT EVENTS
// -----------------------------------------------------
export async function fetchRecentEvents(bbox, limitCount = 500) {
  const q = query(
    collection(db, "parking_events"),
    orderBy("timestamp", "desc"),
    limit(limitCount)
  );

  const snap = await getDocs(q);
  const rows = [];

  snap.forEach((doc) => {
    const data = doc.data();
    if (!data.lat || !data.lon) return;

    if (
      data.lat >= bbox.minLat &&
      data.lat <= bbox.maxLat &&
      data.lon >= bbox.minLon &&
      data.lon <= bbox.maxLon
    ) {
      rows.push({ ...data, id: doc.id });
    }
  });

  return rows;
}

// -----------------------------------------------------
// TEST FIREBASE CONNECTION
// -----------------------------------------------------
export async function testFirebaseConnection() {
  try {
    console.log("🔌 Testing Firebase connection...");
    console.log("📁 Project:", firebaseConfig.projectId);

    const testQuery = query(collection(db, "parking_events"), limit(1));
    const snap = await getDocs(testQuery);

    if (snap.size === 0) {
      console.log("⚠️ No documents found. Creating test doc...");

      const docRef = await addDoc(collection(db, "parking_events"), {
        userId: "test-user",
        lat: 37.7749,
        lon: -122.4194,
        vehicleType: "car",
        event: "parked",
        test: true,
        timestamp: serverTimestamp(),
      });

      console.log("✅ Test doc created:", docRef.id);
    } else {
      console.log("✅ Firestore reachable. Documents exist:", snap.size);
    }

    return { success: true };
  } catch (err) {
    console.error("❌ Firebase connection failed:", err);
    return { success: false, error: err.message };
  }
}

// -----------------------------------------------------
// CREATE TEST DOCUMENT (Manual Trigger)
// -----------------------------------------------------
export async function createTestDocument() {
  try {
    console.log("🧪 Creating test document...");

    const docRef = await addDoc(collection(db, "parking_events"), {
      userId: "test-user",
      lat: 37.7749,
      lon: -122.4194,
      vehicleType: "car",
      event: "parked",
      test: true,
      message: "Generated from createTestDocument()",
      timestamp: serverTimestamp(),
    });

    console.log("✅ Test document created:", docRef.id);
    return { success: true, id: docRef.id };
  } catch (err) {
    console.error("❌ Failed to create test document:", err);
    return { success: false, error: err.message };
  }
}

// -----------------------------------------------------
// VIEW ALL DOCUMENTS
// -----------------------------------------------------
export async function viewAllParkingEvents(limitCount = 100) {
  try {
    console.log("🔍 Fetching parking events…");

    const q = query(
      collection(db, "parking_events"),
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);

    const events = [];
    snap.forEach((doc) => {
      const data = doc.data();
      events.push({
        id: doc.id,
        ...data,
        timestamp_readable: data.timestamp?.toDate
          ? data.timestamp.toDate().toLocaleString()
          : "N/A",
      });
    });

    console.log("📊 Total events:", events.length);
    console.table(events);

    return events;
  } catch (err) {
    console.error("❌ Error fetching events:", err);
    return [];
  }
}
