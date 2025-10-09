import React from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get("window");

type Props = {
  navigation?: any;
};

export default function Onboarding2Screen({ navigation }: Props) {
  const markSeenAndGoLogin = async () => {
    try {
      await AsyncStorage.setItem('hasSeenOnboarding', 'true');
    } catch (e) {
      // ignore
    }
    if (navigation && navigation.replace) {
      navigation.replace("Login");
    }
  };

  const handleSkip = () => {
    markSeenAndGoLogin();
  };

  const handleUpload = () => {
    if (navigation && navigation.navigate) {
      navigation.navigate("Onboarding3");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.topRow}>
        <View style={{ width: 60 }} />
        <Text style={styles.progress}>○ ● ○</Text>
        <TouchableOpacity onPress={handleSkip}>
          <Text style={styles.skip}>Skip</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Share Your Knowledge.</Text>
        <Text style={styles.subtitle}>
          Upload notes, assignments, and references. Help others while building
          your own library.
        </Text>

        <Image
          source={require("../assets/onboarding-2.png")}
          style={styles.illustration}
          resizeMode="contain"
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.primaryButton} onPress={handleUpload}>
          <Text style={styles.primaryText}>Upload Your First File</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  topRow: {
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progress: {
    fontSize: 16,
    color: "#111827",
    textAlign: "center",
    flex: 1,
  },
  skip: {
    color: "#6B7280",
    fontSize: 16,
    padding: 8,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#0F172A",
    textAlign: "center",
    marginTop: 12,
  },
  subtitle: {
    fontSize: 15,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
    paddingHorizontal: 8,
  },
  illustration: {
    width: Math.min(width - 48, 520),
    height: Math.min((width - 48) * 0.75, 360),
    marginTop: 20,
  },
  footer: {
    paddingBottom: 24,
  },
  primaryButton: {
    backgroundColor: "#2563EB",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 16,
  },
});