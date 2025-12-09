// src/App.js
import React, { useEffect, useState } from "react";
import { View, Image, StyleSheet } from "react-native";

import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { PaperProvider, MD3LightTheme } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";

import AppNavigator from "./navigation/AppNavigator";
import { testFirebaseConnection, createTestDocument } from "./firebase/firebase";

const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: "#2563eb",
    secondary: "#0f172a",
  },
};

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#fff",
  },
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const runTests = async () => {
      console.log("🚀 App starting - Testing Firebase connection...");
      await testFirebaseConnection();
      await createTestDocument();

      // Show logo for 2 seconds
      setTimeout(() => {
        setIsLoading(false);
      }, 2000);
    };

    runTests();
  }, []);

  // ✅ Splash Screen
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Image
          source={require("../assets/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>
    );
  }

  // ✅ Main App
  return (
    <SafeAreaProvider>
      <PaperProvider theme={paperTheme}>
        <NavigationContainer theme={navTheme}>
          <AppNavigator />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
  },
  logo: {
    width: 220,
    height: 220,
  },
});
