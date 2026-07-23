import React, { PropsWithChildren } from "react";
import { Text as RNText, TextStyle } from "react-native";
import { colors, typography } from "@/constants/theme";

type Variant = keyof typeof typography;

interface TextProps {
  variant?: Variant;
  color?: string;
  style?: TextStyle;
  numberOfLines?: number;
}

/** Text component that pulls its style from the shared typography scale. */
export function Text({
  variant = "body",
  color = colors.textPrimary,
  style,
  numberOfLines,
  children,
}: PropsWithChildren<TextProps>) {
  return (
    <RNText numberOfLines={numberOfLines} style={[typography[variant], { color }, style]}>
      {children}
    </RNText>
  );
}
