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
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut,
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


const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

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

// Export onAuthStateChanged for use in components
export { onAuthStateChanged };

// Export signOut function for logout
export async function signOutUser() {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function signUp(email, password) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
}
export async function signIn(email, password) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  return userCredential.user;
}
export async function reportParking({
  userId,
  lat,
  lon,
  rain,
  is_event,
  parking_duration,
  user_purpose,
  vehicleType,
  event = "parked",
  message = "",
  test = false,
  easeRating = null,
}) {
  console.log("🔥 Firebase: reportParking called");
  console.log("🔥 Firebase: Parameters received:", {
    userId,
    lat,
    lon,
    vehicleType,
    event,
    message,
    test,
    easeRating,
    rain,
    is_event,
    parking_duration,
    user_purpose,
  });

  // Validate required fields
  if (lat === undefined || lat === null) {
    console.error("❌ Firebase: lat is missing or invalid");
    return { success: false, error: "Latitude is required" };
  }
  if (lon === undefined || lon === null) {
    console.error("❌ Firebase: lon is missing or invalid");
    return { success: false, error: "Longitude is required" };
  }
  if (!vehicleType) {
    console.error("❌ Firebase: vehicleType is missing");
    return { success: false, error: "Vehicle type is required" };
  }

  try {
    const documentData = {
      userId: userId || null,
      lat: Number(lat),
      lon: Number(lon),
      vehicleType: String(vehicleType),
      event: String(event),
      message: String(message || ""),
      rain: Number(rain || 0),
      is_event: Number(is_event || 0),
      parking_duration: Number(parking_duration || 30),
      user_purpose: String(user_purpose || "shopping"),
      easeRating: easeRating !== null && easeRating !== undefined ? Number(easeRating) : null,
      test: Boolean(test),
      timestamp: serverTimestamp(),
    };


    console.log("🔥 Firebase: Document data to save:", JSON.stringify(documentData, null, 2));
    console.log("🔥 Firebase: Attempting to add document to 'parking_events' collection...");

    const docRef = await addDoc(collection(db, "parking_events"), documentData);

    console.log("✅ Firebase: Parking event saved successfully");
    console.log("✅ Firebase: Document ID:", docRef.id);
    console.log("✅ Firebase: Collection:", "parking_events");
    
    return { success: true, id: docRef.id };
  } catch (err) {
    console.error("❌ Firebase: reportParking error occurred");
    console.error("❌ Firebase: Error type:", err.constructor.name);
    console.error("❌ Firebase: Error message:", err.message);
    console.error("❌ Firebase: Error code:", err.code);
    console.error("❌ Firebase: Error stack:", err.stack);
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

// -----------------------------------------------------
// GET TOTAL PARKING EVENTS COUNT
// -----------------------------------------------------
export async function getTotalParkingEventsCount() {
  try {
    const q = query(collection(db, "parking_events"));
    const snap = await getDocs(q);
    return snap.size;
  } catch (err) {
    console.error("❌ Error fetching total count:", err);
    return 0;
  }
}

// -----------------------------------------------------
// GET USER'S PARKING EVENTS COUNT
// -----------------------------------------------------
export async function getUserParkingEventsCount(userId) {
  try {
    if (!userId) return 0;
    
    const q = query(
      collection(db, "parking_events"),
      orderBy("timestamp", "desc")
    );
    const snap = await getDocs(q);
    
    let count = 0;
    snap.forEach((doc) => {
      const data = doc.data();
      if (data.userId === userId) {
        count++;
      }
    });
    
    return count;
  } catch (err) {
    console.error("❌ Error fetching user count:", err);
    return 0;
  }
}

// -----------------------------------------------------
// GET USER'S PARKING HISTORY
// -----------------------------------------------------
export async function getUserParkingHistory(userId, limitCount = 50) {
  try {
    if (!userId) return [];
    
    const q = query(
      collection(db, "parking_events"),
      orderBy("timestamp", "desc"),
      limit(limitCount)
    );
    const snap = await getDocs(q);
    
    const events = [];
    snap.forEach((doc) => {
      const data = doc.data();
      if (data.userId === userId) {
        let timestamp;
        if (data.timestamp && typeof data.timestamp.toDate === "function") {
          timestamp = data.timestamp.toDate();
        } else if (data.timestamp instanceof Date) {
          timestamp = data.timestamp;
        } else {
          timestamp = new Date();
        }
        
        events.push({
          id: doc.id,
          lat: data.lat,
          lon: data.lon,
          vehicleType: data.vehicleType || "car",
          message: data.message || "",
          timestamp: timestamp,
          timestamp_readable: formatTimestamp(timestamp),
        });
      }
    });
    
    return events;
  } catch (err) {
    console.error("❌ Error fetching user history:", err);
    return [];
  }
}

// -----------------------------------------------------
// FORMAT TIMESTAMP FOR DISPLAY
// -----------------------------------------------------
function formatTimestamp(timestamp) {
  if (!timestamp) return "Unknown";
  
  let date;
  if (timestamp instanceof Date) {
    date = timestamp;
  } else if (timestamp && typeof timestamp.toDate === "function") {
    date = timestamp.toDate();
  } else {
    date = new Date(timestamp);
  }
  
  if (isNaN(date.getTime())) {
    return "Unknown";
  }
  
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) {
    return "Just now";
  } else if (diffMins < 60) {
    return `${diffMins} min ago`;
  } else if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
  } else if (diffDays === 1) {
    return "Yesterday";
  } else if (diffDays < 7) {
    return `${diffDays} days ago`;
  } else {
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
    });
  }
}
