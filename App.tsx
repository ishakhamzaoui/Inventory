import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { initDatabase } from "@/database/db";
import { useAppStore } from "@/store/useAppStore";
import { RootNavigator } from "@/navigation/RootNavigator";
import { colors } from "@/constants/theme";

export default function App() {
  const [error, setError] = useState<string | null>(null);
  const isDbReady = useAppStore((s) => s.isDbReady);
  const setDbReady = useAppStore((s) => s.setDbReady);

  useEffect(() => {
    initDatabase()
      .then(() => setDbReady(true))
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to initialize database"));
  }, [setDbReady]);

  if (error) {
    return (
      <View style={styles.center}>
        <StatusBar style="light" />
      </View>
    );
  }

  if (!isDbReady) {
    return (
      <View style={styles.center}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <RootNavigator />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.background,
  },
});
