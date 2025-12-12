// src/components/LocationSearchBar.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Dimensions,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

/**
 * Geocoding function using Google Geocoding API
 */
async function geocodeAddress(query, apiKey) {
  if (!query || !query.trim()) {
    return [];
  }

  try {
    // If no API key, use a fallback geocoding service (Nominatim - OpenStreetMap)
    if (!apiKey) {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`,
        {
          headers: {
            "User-Agent": "SmartParkingApp",
          },
        }
      );
      const data = await response.json();
      return data.map((item) => ({
        name: item.display_name,
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        address: item.display_name,
      }));
    }

    // Use Google Geocoding API if API key is available
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${apiKey}`
    );
    const data = await response.json();

    if (data.status === "OK" && data.results) {
      return data.results.map((result) => ({
        name: result.formatted_address,
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        address: result.formatted_address,
      }));
    }

    return [];
  } catch (error) {
    console.error("Geocoding error:", error);
    return [];
  }
}

export default function LocationSearchBar({ onLocationSelect, apiKey }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);

  // Debounce search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      const locations = await geocodeAddress(searchQuery, apiKey);
      setResults(locations);
      setShowResults(true);
      setIsSearching(false);
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [searchQuery, apiKey]);

  const handleSelectLocation = (location) => {
    setSearchQuery(location.name);
    setShowResults(false);
    onLocationSelect({
      latitude: location.latitude,
      longitude: location.longitude,
    });
  };

  const handleClear = () => {
    setSearchQuery("");
    setResults([]);
    setShowResults(false);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={22} color="#5f6368" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Search for a location..."
          placeholderTextColor="#9aa0a6"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => {
            if (results.length > 0) {
              setShowResults(true);
            }
          }}
        />
        {isSearching && (
          <ActivityIndicator size="small" color="#4285f4" style={styles.loader} />
        )}
        {searchQuery.length > 0 && !isSearching && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#9aa0a6" />
          </TouchableOpacity>
        )}
      </View>

      {showResults && results.length > 0 && (
        <View style={styles.resultsContainer}>
          <FlatList
            data={results}
            keyExtractor={(item, index) => `${item.latitude}-${item.longitude}-${index}`}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.resultItem}
                onPress={() => handleSelectLocation(item)}
              >
                <Ionicons name="location" size={18} color="#4285f4" />
                <View style={styles.resultTextContainer}>
                  <Text style={styles.resultName} numberOfLines={2}>
                    {item.name}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#9aa0a6" />
              </TouchableOpacity>
            )}
            style={styles.resultsList}
            keyboardShouldPersistTaps="handled"
          />
        </View>
      )}

      {showResults && results.length === 0 && searchQuery.length > 0 && !isSearching && (
        <View style={styles.resultsContainer}>
          <View style={styles.noResults}>
            <Ionicons name="location-outline" size={24} color="#9aa0a6" />
            <Text style={styles.noResultsText}>No locations found</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 48,
  },
  searchIcon: {
    marginRight: 12,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#202124",
    padding: 0,
    fontWeight: "400",
  },
  loader: {
    marginLeft: 8,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
    borderRadius: 12,
  },
  resultsContainer: {
    position: "absolute",
    top: 56,
    left: -20,
    width: SCREEN_WIDTH,
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    maxHeight: 400,
    overflow: "hidden",
    borderWidth: 0.5,
    borderColor: "rgba(0, 0, 0, 0.08)",
    zIndex: 1000,
  },
  resultsList: {
    maxHeight: 400,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0, 0, 0, 0.08)",
  },
  resultTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  resultName: {
    fontSize: 14,
    color: "#202124",
    fontWeight: "400",
    letterSpacing: 0,
    lineHeight: 20,
  },
  noResults: {
    padding: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  noResultsText: {
    marginTop: 8,
    fontSize: 14,
    color: "#5f6368",
    fontWeight: "400",
  },
});

