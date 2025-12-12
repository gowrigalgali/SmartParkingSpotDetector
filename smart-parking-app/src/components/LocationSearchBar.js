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
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

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
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          placeholder="Search for a location..."
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          onFocus={() => {
            if (results.length > 0) {
              setShowResults(true);
            }
          }}
        />
        {isSearching && (
          <ActivityIndicator size="small" color="#2563eb" style={styles.loader} />
        )}
        {searchQuery.length > 0 && !isSearching && (
          <TouchableOpacity onPress={handleClear} style={styles.clearButton}>
            <Ionicons name="close-circle" size={20} color="#64748b" />
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
                <Ionicons name="location" size={18} color="#2563eb" />
                <View style={styles.resultTextContainer}>
                  <Text style={styles.resultName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
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
            <Ionicons name="location-outline" size={24} color="#94a3b8" />
            <Text style={styles.noResultsText}>No locations found</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "relative",
    zIndex: 10,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#0f172a",
    padding: 0,
  },
  loader: {
    marginLeft: 8,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  resultsContainer: {
    marginTop: 8,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 200,
    overflow: "hidden",
  },
  resultsList: {
    maxHeight: 200,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  resultTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  resultName: {
    fontSize: 15,
    color: "#0f172a",
    fontWeight: "500",
  },
  noResults: {
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  noResultsText: {
    marginTop: 8,
    fontSize: 14,
    color: "#94a3b8",
  },
});

