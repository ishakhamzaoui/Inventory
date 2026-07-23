import React, { PropsWithChildren } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { colors, radius, spacing } from "@/constants/theme";

interface CardProps {
    style?: ViewStyle;
}

export function Card({ children, style }: PropsWithChildren<CardProps>) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
