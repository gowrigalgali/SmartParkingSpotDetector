// src/screens/ProfileScreen.js
import React, { useState } from "react";
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, Button, Card, Divider } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { auth, signOutUser } from "../firebase/firebase";

const history = [
  { id: "1", title: "Indiranagar 12th Main", time: "Today • 37 min" },
  { id: "2", title: "Church Street", time: "Yesterday • 58 min" },
  { id: "3", title: "UB City Block C", time: "Sunday • 1h 12m" },
];

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(false);
  const user = auth.currentUser;
  const userEmail = user?.email || "User";
  const displayName = userEmail.split("@")[0] || "User";
  const initials = displayName.substring(0, 2).toUpperCase();

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
          <Text style={styles.score}>82</Text>
          <Text style={styles.scoreCaption}>
            Keep sharing spots to unlock pro mapping tools.
          </Text>
          <View style={styles.badges}>
            <Badge icon="sparkles-outline" label="Top guide" />
            <Badge icon="flame-outline" label="Heatmap hero" />
            <Badge icon="shield-checkmark-outline" label="Trusted" />
          </View>
        </Card.Content>
      </Card>

      <View style={styles.listHeader}>
        <Text style={styles.listTitle}>Recent drops</Text>
        <Button compact mode="text">
          View all
        </Button>
      </View>

      <FlatList
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Ionicons name="location-outline" size={20} color="#2563eb" />
            <View style={{ flex: 1 }}>
              <Text style={styles.listItemTitle}>{item.title}</Text>
              <Text style={styles.listItemTime}>{item.time}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
          </View>
        )}
        contentContainerStyle={{ gap: 10, paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      />

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

function Badge({ icon, label }) {
  return (
    <View style={styles.badge}>
      <Ionicons name={icon} size={16} color="#2563eb" />
      <Text style={styles.badgeText}>{label}</Text>
    </View>
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
  scoreCaption: { color: "#475569", marginTop: 4 },
  badges: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 16,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#e0e7ff",
  },
  badgeText: {
    color: "#1e3a8a",
    fontSize: 12,
    fontWeight: "600",
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
  listItemTitle: { fontWeight: "600", color: "#0f172a" },
  listItemTime: { color: "#94a3b8" },
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
