export default ({ config }) => {
  const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY || "";

  return {
    ...config,
    expo: {
      ...config.expo,
      name: "smart-parking-app",
      slug: "smart-parking-app",

      android: {
        package: "com.app.smartparkingapp", // ✅ REQUIRED
        adaptiveIcon: {
          foregroundImage: "./assets/icon.png",
          backgroundColor: "#ffffff",
        },
        config: {
          googleMaps: {
            apiKey: googleMapsApiKey,
          },
        },
      },

      ios: {
        bundleIdentifier: "com.app.smartparkingapp", // ✅ REQUIRED for iOS
        config: {
          googleMapsApiKey,
        },
      },

      extra: {
        googleMapsApiKey,
      },
    },
  };
};
