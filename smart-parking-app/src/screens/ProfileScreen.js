// src/screens/ProfileScreen.js
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, Button, Card, Divider } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { auth, signOutUser, getTotalParkingEventsCount, getUserParkingEventsCount, getUserParkingHistory } from "../firebase/firebase";

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [driverScore, setDriverScore] = useState(0);
  const [userContributions, setUserContributions] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const [history, setHistory] = useState([]);
  
  const user = auth.currentUser;
  const userId = user?.uid || user?.email || null;
  const userEmail = user?.email || "User";
  const displayName = userEmail.split("@")[0] || "User";
  const initials = displayName.substring(0, 2).toUpperCase();

  useEffect(() => {
    loadProfileData();
  }, [userId]);

  const loadProfileData = async () => {
    if (!userId) {
      setLoadingData(false);
      return;
    }

    try {
      setLoadingData(true);
      
      // Fetch data in parallel
      const [totalCount, userCount, userHistory] = await Promise.all([
        getTotalParkingEventsCount(),
        getUserParkingEventsCount(userId),
        getUserParkingHistory(userId, 50),
      ]);

      setTotalRecords(totalCount);
      setUserContributions(userCount);
      
      // Calculate driver score: (user contributions / total records) * 100
      const score = totalCount > 0 ? Math.round((userCount / totalCount) * 100) : 0;
      setDriverScore(score);
      
      setHistory(userHistory);
    } catch (error) {
      console.error("Error loading profile data:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const result = await signOutUser();
              if (result.success) {
                console.log("✅ User signed out successfully");
                navigation.replace("Welcome");
              } else {
                Alert.alert("Error", result.error || "Failed to sign out");
                setLoading(false);
              }
            } catch (error) {
              console.error("Logout error:", error);
              Alert.alert("Error", "Failed to sign out. Please try again.");
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      <TouchableOpacity 
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="arrow-back" size={24} color="#0f172a" />
      </TouchableOpacity>
      <View style={styles.header}>
        <Avatar.Text size={64} label={initials} style={styles.avatar} />
        <View>
          <Text style={styles.name}>{userEmail}</Text>
          <Text style={styles.tagline}>Community Contributor</Text>
        </View>
      </View>

      <Card mode="elevated" style={styles.card}>
        <Card.Title title="Drive score" subtitle="Community impact" />
        <Card.Content>
          {loadingData ? (
            <ActivityIndicator size="large" color="#2563eb" style={styles.loader} />
          ) : (
            <>
              <Text style={styles.score}>{driverScore}%</Text>
              <Text style={styles.scoreCaption}>
                {userContributions} of {totalRecords} total contributions
              </Text>
              {userContributions === 0 && (
                <Text style={styles.scoreHint}>
                  Start contributing by marking parking spots to increase your score!
                </Text>
              )}
            </>
          )}
        </Card.Content>
      </Card>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Recent drops</Text>
        {history.length > 0 && (
          <Text style={styles.listCount}>{history.length} {history.length === 1 ? "spot" : "spots"}</Text>
        )}
      </View>

      {loadingData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
        </View>
      ) : history.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="location-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>No parking spots marked yet</Text>
          <Text style={styles.emptySubtext}>Start contributing to the community!</Text>
        </View>
      ) : (
        <FlatList
          data={history}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <Ionicons 
                name={item.vehicleType === "motorcycle" ? "bicycle" : item.vehicleType === "truck" ? "car-sport" : "car"} 
                size={20} 
                color="#2563eb" 
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.listItemTitle}>
                  {item.lat?.toFixed(4)}, {item.lon?.toFixed(4)}
                </Text>
                <View style={styles.listItemMeta}>
                  <Text style={styles.listItemTime}>{item.timestamp_readable}</Text>
                  {item.vehicleType && (
                    <Text style={styles.listItemVehicle}> • {item.vehicleType}</Text>
                  )}
                </View>
                {item.message && (
                  <Text style={styles.listItemMessage} numberOfLines={1}>
                    {item.message}
                  </Text>
                )}
              </View>
            </View>
          )}
          contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
        />
      )}

      <Divider style={styles.divider} />

      <View style={styles.logoutSection}>
        <Button
          mode="outlined"
          icon="logout"
          onPress={handleLogout}
          style={styles.logoutButton}
          contentStyle={styles.logoutButtonContent}
          textColor="#dc2626"
          loading={loading}
          disabled={loading}
        >
          Sign Out
        </Button>
      </View>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginTop: 80,
    marginBottom: 24,
    paddingHorizontal: 24,
  },
  avatar: {
    backgroundColor: "#2563eb",
  },
  name: {
    fontSize: 20,
    fontWeight: "600",
    color: "#0f172a",
  },
  tagline: { 
    color: "#94a3b8",
    fontSize: 14,
    marginTop: 2,
  },
  card: {
    borderRadius: 20,
    marginHorizontal: 24,
    marginBottom: 24,
  },
  score: {
    fontSize: 48,
    fontWeight: "700",
    color: "#0f172a",
  },
  scoreCaption: { color: "#475569", marginTop: 4, fontSize: 14 },
  scoreHint: {
    color: "#64748b",
    fontSize: 13,
    marginTop: 8,
    fontStyle: "italic",
  },
  loader: {
    paddingVertical: 20,
  },
  listHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginHorizontal: 24,
    marginBottom: 12,
  },
  listTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#0f172a",
  },
  listCount: {
    fontSize: 14,
    color: "#64748b",
    fontWeight: "500",
  },
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    gap: 12,
    marginHorizontal: 24,
    marginBottom: 10,
  },
  listItemTitle: { 
    fontWeight: "600", 
    color: "#0f172a",
    fontSize: 15,
    marginBottom: 4,
  },
  listItemMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  listItemTime: { 
    color: "#94a3b8",
    fontSize: 13,
  },
  listItemVehicle: {
    color: "#64748b",
    fontSize: 13,
    textTransform: "capitalize",
  },
  listItemMessage: {
    color: "#94a3b8",
    fontSize: 12,
    marginTop: 4,
    fontStyle: "italic",
  },
  loadingContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    padding: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#94a3b8",
    marginTop: 8,
  },
  divider: {
    marginVertical: 24,
    marginHorizontal: 24,
  },
  logoutSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  logoutButton: {
    borderColor: "#dc2626",
    borderRadius: 12,
  },
  logoutButtonContent: {
    paddingVertical: 8,
  },
});
