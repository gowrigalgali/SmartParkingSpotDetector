// src/screens/ProfileScreen.js
import React from "react";
import { View, Text, StyleSheet, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, Button, Card } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

const history = [
  { id: "1", title: "Indiranagar 12th Main", time: "Today • 37 min" },
  { id: "2", title: "Church Street", time: "Yesterday • 58 min" },
  { id: "3", title: "UB City Block C", time: "Sunday • 1h 12m" },
];

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Avatar.Icon size={64} icon="account" />
        <View>
          <Text style={styles.name}>Gowri</Text>
          <Text style={styles.tagline}>Early access member</Text>
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
        contentContainerStyle={{ gap: 10 }}
        showsVerticalScrollIndicator={false}
      />
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
    padding: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    marginBottom: 24,
  },
  name: {
    fontSize: 24,
    fontWeight: "700",
    color: "#0f172a",
  },
  tagline: { color: "#94a3b8" },
  card: {
    borderRadius: 20,
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
  },
  listItemTitle: { fontWeight: "600", color: "#0f172a" },
  listItemTime: { color: "#94a3b8" },
});
