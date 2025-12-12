// src/components/ParkingQuestionnaire.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  TextInput as RNTextInput,
  Dimensions,
} from "react-native";
import { Button } from "react-native-paper";
import { Ionicons } from "@expo/vector-icons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ParkingQuestionnaire({
  visible,
  onClose,
  onSubmit,
  loading,
  location,
}) {
  const [vehicleType, setVehicleType] = useState("car");
  const [message, setMessage] = useState("");
  const [test, setTest] = useState(false);
  const [slideAnim] = useState(new Animated.Value(0));
  const [rain, setRain] = useState(0);
  const [isEvent, setIsEvent] = useState(0);
  const [parkingDuration, setParkingDuration] = useState(30);
  const [userPurpose, setUserPurpose] = useState("shopping");
  const [easeRating, setEaseRating] = useState(null);


  // Component mount/unmount logging
  React.useEffect(() => {
    console.log("📋 ParkingQuestionnaire: Component mounted");
    return () => {
      console.log("📋 ParkingQuestionnaire: Component unmounted");
    };
  }, []);

  React.useEffect(() => {
    if (visible) {
      console.log("📋 ParkingQuestionnaire: Opening questionnaire modal");
      console.log("📍 Location:", location ? `${location.latitude}, ${location.longitude}` : "Not available");
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }).start();
    } else {
      console.log("📋 ParkingQuestionnaire: Closing questionnaire modal");
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim, location]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  const handleSubmit = () => {
    try {
      const formData = {
        vehicleType,
        message: message.trim(),
        test,
        lat: location?.latitude,
        lon: location?.longitude,
        rain,
        is_event: isEvent,
        parking_duration: parkingDuration,
        user_purpose: userPurpose,
        easeRating: easeRating !== null ? Number(easeRating) : null,
      };

      console.log("📋 ParkingQuestionnaire: Submitting form data");
      console.log("📋 Form Data:", JSON.stringify(formData, null, 2));

      if (!location) {
        console.error("❌ ParkingQuestionnaire: Location is missing!");
        console.error("❌ ParkingQuestionnaire: Cannot submit without location");
        return;
      }

      if (!location.latitude || !location.longitude) {
        console.error("❌ ParkingQuestionnaire: Invalid location coordinates");
        console.error("❌ ParkingQuestionnaire: lat:", location.latitude, "lon:", location.longitude);
        return;
      }

      if (!vehicleType) {
        console.error("❌ ParkingQuestionnaire: Vehicle type is missing!");
        return;
      }

      console.log("📋 ParkingQuestionnaire: All validations passed, calling onSubmit");
      onSubmit(formData);

      // Reset form
      setMessage("");
      setVehicleType("car");
      setTest(false);
      setEaseRating(null);
      setRain(0);
      setIsEvent(0);
      setParkingDuration(30);
      setUserPurpose("shopping");
      console.log("📋 ParkingQuestionnaire: Form reset complete");
    } catch (error) {
      console.error("❌ ParkingQuestionnaire: Error in handleSubmit");
      console.error("❌ ParkingQuestionnaire: Error:", error);
      console.error("❌ ParkingQuestionnaire: Error stack:", error.stack);
    }
  };

  const handleClose = () => {
    console.log("📋 ParkingQuestionnaire: User closed questionnaire");
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  // Log when component renders
  React.useEffect(() => {
    console.log("📋 ParkingQuestionnaire: Render - visible:", visible, "loading:", loading);
    console.log("📋 ParkingQuestionnaire: Current state - vehicleType:", vehicleType, "message length:", message.length, "test:", test);
  });

  if (!visible) {
    console.log("📋 ParkingQuestionnaire: Not visible, returning null");
    return null;
  }

  console.log("📋 ParkingQuestionnaire: Rendering modal");

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.modalContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />
        <Animated.View
          style={[
            styles.questionnaireContainer,
            {
              transform: [{ translateY }],
            },
          ]}
        >
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.title}>Parking Details</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.section}>
              <Text style={styles.label}>Vehicle Type</Text>
              <View style={styles.vehicleTypeContainer}>
                <TouchableOpacity
                  style={[
                    styles.vehicleButton,
                    vehicleType === "car" && styles.vehicleButtonActive,
                  ]}
                  onPress={() => {
                    console.log("📋 ParkingQuestionnaire: Vehicle type changed to: car");
                    setVehicleType("car");
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="car"
                    size={20}
                    color={vehicleType === "car" ? "#fff" : "#64748b"}
                  />
                  <View style={{ width: 6 }} />
                  <Text
                    style={[
                      styles.vehicleButtonText,
                      vehicleType === "car" && styles.vehicleButtonTextActive,
                    ]}
                  >
                    Car
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.vehicleButton,
                    vehicleType === "motorcycle" && styles.vehicleButtonActive,
                  ]}
                  onPress={() => {
                    console.log("📋 ParkingQuestionnaire: Vehicle type changed to: motorcycle");
                    setVehicleType("motorcycle");
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="bicycle"
                    size={20}
                    color={vehicleType === "motorcycle" ? "#fff" : "#64748b"}
                  />
                  <View style={{ width: 6 }} />
                  <Text
                    style={[
                      styles.vehicleButtonText,
                      vehicleType === "motorcycle" && styles.vehicleButtonTextActive,
                    ]}
                  >
                    Bike
                  </Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.vehicleButton,
                    vehicleType === "truck" && styles.vehicleButtonActive,
                  ]}
                  onPress={() => {
                    console.log("📋 ParkingQuestionnaire: Vehicle type changed to: truck");
                    setVehicleType("truck");
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons
                    name="car-sport"
                    size={20}
                    color={vehicleType === "truck" ? "#fff" : "#64748b"}
                  />
                  <View style={{ width: 6 }} />
                  <Text
                    style={[
                      styles.vehicleButtonText,
                      vehicleType === "truck" && styles.vehicleButtonTextActive,
                    ]}
                  >
                    Truck
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
                    <View style={styles.section}>
  <Text style={styles.label}>Is it raining?</Text>

  <View style={styles.vehicleTypeContainer}>
    <TouchableOpacity
      style={[styles.vehicleButton, rain === 0 && styles.vehicleButtonActive]}
      onPress={() => setRain(0)}
    >
      <Text style={[styles.vehicleButtonText, rain === 0 && styles.vehicleButtonTextActive]}>
        No
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.vehicleButton, rain === 1 && styles.vehicleButtonActive]}
      onPress={() => setRain(1)}
    >
      <Text style={[styles.vehicleButtonText, rain === 1 && styles.vehicleButtonTextActive]}>
        Yes
      </Text>
    </TouchableOpacity>
  </View>
</View>
<View style={styles.section}>
  <Text style={styles.label}>Nearby Event</Text>

  <View style={styles.vehicleTypeContainer}>
    <TouchableOpacity
      style={[styles.vehicleButton, isEvent === 0 && styles.vehicleButtonActive]}
      onPress={() => setIsEvent(0)}
    >
      <Text style={[styles.vehicleButtonText, isEvent === 0 && styles.vehicleButtonTextActive]}>
        No
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.vehicleButton, isEvent === 1 && styles.vehicleButtonActive]}
      onPress={() => setIsEvent(1)}
    >
      <Text style={[styles.vehicleButtonText, isEvent === 1 && styles.vehicleButtonTextActive]}>
        Yes
      </Text>
    </TouchableOpacity>
  </View>
</View>
<View style={styles.section}>
  <Text style={styles.label}>Parking Duration</Text>

  <View style={styles.vehicleTypeContainer}>
    <TouchableOpacity
      style={[styles.vehicleButton, parkingDuration === 15 && styles.vehicleButtonActive]}
      onPress={() => setParkingDuration(15)}
    >
      <Text style={[styles.vehicleButtonText, parkingDuration === 15 && styles.vehicleButtonTextActive]}>
        15 min
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.vehicleButton, parkingDuration === 30 && styles.vehicleButtonActive]}
      onPress={() => setParkingDuration(30)}
    >
      <Text style={[styles.vehicleButtonText, parkingDuration === 30 && styles.vehicleButtonTextActive]}>
        30 min
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.vehicleButton, parkingDuration === 60 && styles.vehicleButtonActive]}
      onPress={() => setParkingDuration(60)}
    >
      <Text style={[styles.vehicleButtonText, parkingDuration === 60 && styles.vehicleButtonTextActive]}>
        1 hr
      </Text>
    </TouchableOpacity>
  </View>
</View>
<View style={styles.section}>
  <Text style={styles.label}>Purpose of Visit</Text>

  <View style={styles.vehicleTypeContainer}>
    <TouchableOpacity
      style={[styles.vehicleButton, userPurpose === "shopping" && styles.vehicleButtonActive]}
      onPress={() => setUserPurpose("shopping")}
    >
      <Text style={[styles.vehicleButtonText, userPurpose === "shopping" && styles.vehicleButtonTextActive]}>
        Shopping
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.vehicleButton, userPurpose === "work" && styles.vehicleButtonActive]}
      onPress={() => setUserPurpose("work")}
    >
      <Text style={[styles.vehicleButtonText, userPurpose === "work" && styles.vehicleButtonTextActive]}>
        Work
      </Text>
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.vehicleButton, userPurpose === "travel" && styles.vehicleButtonActive]}
      onPress={() => setUserPurpose("travel")}
    >
      <Text style={[styles.vehicleButtonText, userPurpose === "travel" && styles.vehicleButtonTextActive]}>
        Travel
      </Text>
    </TouchableOpacity>
  </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>How easy was parking to find? (1-10)</Text>
              <Text style={styles.ratingSubtext}>1 = Very difficult, 10 = Very easy</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((rating) => (
                  <TouchableOpacity
                    key={rating}
                    style={[
                      styles.ratingButton,
                      easeRating === rating && styles.ratingButtonActive,
                    ]}
                    onPress={() => {
                      console.log("📋 ParkingQuestionnaire: Ease rating changed to:", rating);
                      setEaseRating(rating);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.ratingButtonText,
                        easeRating === rating && styles.ratingButtonTextActive,
                      ]}
                    >
                      {rating}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.label}>Message (Optional)</Text>
              <RNTextInput
                placeholder="Add any notes about this parking spot..."
                placeholderTextColor="#94a3b8"
                value={message}
                onChangeText={(text) => {
                  setMessage(text);
                  console.log("📋 ParkingQuestionnaire: Message updated, length:", text.length);
                }}
                multiline
                numberOfLines={4}
                style={styles.textInput}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.section}>
              <TouchableOpacity
                style={styles.checkboxContainer}
                onPress={() => {
                  const newTestValue = !test;
                  console.log("📋 ParkingQuestionnaire: Test checkbox toggled to:", newTestValue);
                  setTest(newTestValue);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.checkbox, test && styles.checkboxChecked]}>
                  {test && <Ionicons name="checkmark" size={16} color="#fff" />}
                </View>
                <Text style={styles.checkboxLabel}>
                  Mark as test data
                </Text>
              </TouchableOpacity>
            </View>

            {location && (
              <View style={styles.locationInfo}>
                <Ionicons name="location" size={16} color="#64748b" />
                <View style={{ width: 8 }} />
                <Text style={styles.locationText}>
                  {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            <Button
              mode="outlined"
              onPress={handleClose}
              style={styles.cancelButton}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              mode="contained"
              onPress={handleSubmit}
              style={styles.submitButton}
              loading={loading}
              disabled={loading}
            >
              Submit
            </Button>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  questionnaireContainer: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: SCREEN_HEIGHT * 0.85,
    minHeight: 400,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: "#cbd5e1",
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: "#0f172a",
  },
  closeButton: {
    padding: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    color: "#0f172a",
    marginBottom: 12,
  },
  vehicleTypeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  vehicleButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    borderWidth: 2,
    borderColor: "transparent",
    marginHorizontal: 4,
  },
  vehicleButtonActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  vehicleButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#64748b",
  },
  vehicleButtonTextActive: {
    color: "#fff",
  },
  ratingSubtext: {
    fontSize: 13,
    color: "#64748b",
    marginBottom: 12,
    marginTop: -4,
  },
  ratingContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 8,
  },
  ratingButton: {
    width: "9%",
    minWidth: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    borderWidth: 2,
    borderColor: "transparent",
    marginBottom: 8,
  },
  ratingButtonActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  ratingButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
  },
  ratingButtonTextActive: {
    color: "#fff",
  },
  textInput: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#0f172a",
    minHeight: 100,
    textAlignVertical: "top",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
  },
  checkboxChecked: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  checkboxLabel: {
    fontSize: 16,
    color: "#0f172a",
  },
  locationInfo: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
  },
  locationText: {
    fontSize: 14,
    color: "#64748b",
    fontFamily: Platform.OS === "ios" ? "Courier" : "monospace",
  },
  footer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  cancelButton: {
    flex: 1,
    borderColor: "#cbd5e1",
    marginRight: 6,
  },
  submitButton: {
    flex: 1,
    backgroundColor: "#2563eb",
    marginLeft: 6,
  },
});
