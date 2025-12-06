// src/screens/LoginScreen.js
import React, { useState } from "react";
import { View, Text, StyleSheet, StatusBar, ScrollView, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button, TextInput } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";
import { signIn, signUp } from "../firebase/firebase";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async () => {
  if (!email.trim() || !password.trim()) {
    Alert.alert("Error", "Please enter both email and password");
    return;
  }

  if (password.length < 6) {
    Alert.alert("Error", "Password must be at least 6 characters");
    return;
  }

  setLoading(true);

  try {
    console.log(`🔄 ${isSignUp ? "Signing up" : "Signing in"}...`);

    const user = isSignUp
      ? await signUp(email.trim(), password)
      : await signIn(email.trim(), password);

    console.log("✅ Auth success:", user.uid);

    Alert.alert(
      "Success",
      isSignUp ? "Account created successfully!" : "Signed in successfully!"
    );

    navigation.replace("Map");

  } catch (error) {
    console.error("❌ Auth exception:", error);

    let errorMessage = "Authentication failed";

    switch (error.code) {
      case "auth/user-not-found":
        errorMessage = "No account found with this email.";
        break;
      case "auth/wrong-password":
        errorMessage = "Incorrect password.";
        break;
      case "auth/email-already-in-use":
        errorMessage = "Email already registered.";
        break;
      case "auth/invalid-email":
        errorMessage = "Invalid email address.";
        break;
      case "auth/weak-password":
        errorMessage = "Password must be at least 6 characters.";
        break;
      case "auth/network-request-failed":
        errorMessage = "Network error. Check your internet connection.";
        break;
    }

    Alert.alert("Authentication Error", errorMessage);
  } finally {
    setLoading(false);
  }
};


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

        <View style={styles.formCard}>
          <Text style={styles.formTitle}>{isSignUp ? "Create Account" : "Sign In"}</Text>
          
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={styles.input}
            contentStyle={styles.inputContent}
            outlineColor="#334155"
            activeOutlineColor="#2563eb"
            textColor="#fff"
            left={<TextInput.Icon icon="email-outline" iconColor="#64748b" />}
            editable={!loading}
          />

          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            mode="outlined"
            secureTextEntry={!showPassword}
            autoCapitalize="none"
            style={styles.input}
            contentStyle={styles.inputContent}
            outlineColor="#334155"
            activeOutlineColor="#2563eb"
            textColor="#fff"
            left={<TextInput.Icon icon="lock-outline" iconColor="#64748b" />}
            right={
              <TextInput.Icon
                icon={showPassword ? "eye-off-outline" : "eye-outline"}
                iconColor="#64748b"
                onPress={() => setShowPassword(!showPassword)}
              />
            }
            editable={!loading}
          />

          <Button
            mode="contained"
            icon={loading ? null : isSignUp ? "account-plus" : "login"}
            contentStyle={styles.buttonContent}
            style={styles.button}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              isSignUp ? "Sign Up" : "Sign In"
            )}
          </Button>

          <Button
            mode="text"
            onPress={() => setIsSignUp(!isSignUp)}
            style={styles.switchButton}
            textColor="#94a3b8"
            disabled={loading}
          >
            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
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
    marginBottom: 24,
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
  formCard: {
    backgroundColor: "#13203c",
    borderRadius: 20,
    padding: 20,
    gap: 16,
  },
  formTitle: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#1e293b",
    marginBottom: 4,
  },
  inputContent: {
    color: "#fff",
  },
  button: {
    borderRadius: 14,
    paddingVertical: 4,
    backgroundColor: "#2563eb",
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 6,
  },
  switchButton: {
    marginTop: 4,
  },
});
