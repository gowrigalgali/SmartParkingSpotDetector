// src/screens/WelcomeScreen.js
import React from "react";
import { View, Text, StyleSheet, StatusBar, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

export default function WelcomeScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar barStyle="light-content" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Text style={styles.preTitle}>Smart mobility</Text>
          <Text style={styles.title}>Smart Parking</Text>
          <Text style={styles.subtitle}>
            Predict crowd levels, drop parking pins, and let the community guide you to
            calmer curbs.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.feature}>
            <Ionicons name="sparkles-outline" size={22} color="#2563eb" />
            <Text style={styles.featureText}>AI powered availability forecast</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="map-outline" size={22} color="#2563eb" />
            <Text style={styles.featureText}>Live heatmap from community check-ins</Text>
          </View>
          <View style={styles.feature}>
            <Ionicons name="shield-checkmark-outline" size={22} color="#2563eb" />
            <Text style={styles.featureText}>Account-safe with Firebase guardrails</Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            icon="arrow-forward"
            contentStyle={styles.buttonContent}
            style={styles.button}
            onPress={() => navigation.navigate("Login")}
          >
            Get Started
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
    flexGrow: 1,
    justifyContent: "center",
  },
  hero: {
    marginBottom: 32,
  },
  preTitle: {
    color: "#60a5fa",
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 38,
    color: "#fff",
    fontWeight: "700",
  },
  subtitle: {
    marginTop: 12,
    color: "#cbd5f5",
    lineHeight: 22,
  },
  card: {
    backgroundColor: "#13203c",
    borderRadius: 20,
    padding: 20,
    gap: 16,
    marginBottom: 32,
  },
  feature: {
    flexDirection: "row",
    gap: 14,
    alignItems: "center",
  },
  featureText: {
    color: "#e2e8f0",
    flex: 1,
    fontSize: 15,
  },
  buttonContainer: {
    marginTop: 16,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 4,
    backgroundColor: "#2563eb",
  },
  buttonContent: {
    paddingVertical: 6,
  },
});

