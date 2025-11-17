// src/components/PredictionModel.js
import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Card, Text, Chip } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

export default function PredictionModel({ data, loading, onRefresh }) {
  if (!data) {
    return (
      <Card mode="elevated" style={styles.card}>
        <Card.Content style={styles.cardContent}>
          <Ionicons name="sparkles-outline" size={28} color="#5d5af8" />
          <View style={styles.emptyState}>
            <Text variant="titleMedium" style={styles.title}>
              Smart predictions
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              We need your location to craft live crowd estimates.
            </Text>
          </View>
        </Card.Content>
      </Card>
    );
  }

  const { currentOccupancy, confidence, nextHours = [], recommendation } = data;

  return (
    <Card mode="elevated" style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <View>
            <Text variant="labelMedium" style={styles.label}>
              AI availability score
            </Text>
            <Text variant="headlineMedium" style={styles.occupancy}>
              {currentOccupancy}% free
            </Text>
          </View>
          <Pressable style={styles.refresh} onPress={onRefresh} disabled={loading}>
            <Ionicons
              name={loading ? "refresh" : "refresh-outline"}
              size={22}
              color="#0d47a1"
            />
          </Pressable>
        </View>

        <View style={styles.chips}>
          <Chip icon="speedometer" style={styles.chip}>
            {confidence}% confidence
          </Chip>
          <Chip icon="clock-outline" style={styles.chip}>
            {recommendation}
          </Chip>
        </View>

        <View style={styles.timeline}>
          {nextHours.map((slot) => (
            <View key={slot.label} style={styles.timelineItem}>
              <Text variant="labelSmall" style={styles.timelineLabel}>
                {slot.label}
              </Text>
              <Text variant="titleMedium" style={styles.timelineValue}>
                {slot.value}%
              </Text>
            </View>
          ))}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    backgroundColor: "#f4f7fb",
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  emptyState: { flex: 1 },
  title: { marginBottom: 4 },
  subtitle: { color: "#546e7a" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  label: { color: "#5f6a7a" },
  occupancy: { color: "#0d47a1", fontWeight: "700" },
  refresh: {
    width: 40,
    height: 40,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#c5cae9",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e8ebff",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 12,
  },
  chip: { backgroundColor: "#e6efff" },
  timeline: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timelineItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#ffffff",
    marginHorizontal: 4,
  },
  timelineLabel: { color: "#78909c", marginBottom: 2 },
  timelineValue: { color: "#1e3a8a", fontWeight: "600" },
});
