// src/components/MarkParkingButton.js
import React from "react";
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from "react-native";

export default function MarkParkingButton({ onPress, loading }) {
  const buttonStyle = [styles.button, loading && styles.buttonDisabled];

  return (
    <TouchableOpacity style={buttonStyle} onPress={onPress} disabled={loading}>
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={styles.text}>I Parked Here</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: "100%",
    backgroundColor: "#2f95dc",
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#0d47a1",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 6,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  text: { color: "#fff", fontSize: 16, fontWeight: "600" }
});
