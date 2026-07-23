import React, { PropsWithChildren } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, spacing } from "@/constants/theme";

interface ScreenProps {
  style?: ViewStyle;
  padded?: boolean;
}

/** Consistent full-screen wrapper: safe area + background + optional padding. */
export function Screen({ children, style, padded = true }: PropsWithChildren<ScreenProps>) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <View style={[styles.container, padded && styles.padded, style]}>{children}</View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  padded: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
});
