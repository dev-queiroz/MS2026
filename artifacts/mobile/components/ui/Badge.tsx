import React from "react";
import { StyleSheet, Text, View, ViewStyle } from "react-native";

interface BadgeProps {
  label: string;
  color?: string;
  textColor?: string;
  style?: ViewStyle;
  size?: "sm" | "md";
}

export function Badge({ label, color = "#4F7FFF22", textColor = "#4F7FFF", style, size = "md" }: BadgeProps) {
  return (
    <View style={[styles.badge, size === "sm" && styles.sm, { backgroundColor: color }, style]}>
      <Text style={[styles.text, size === "sm" && styles.textSm, { color: textColor }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    alignSelf: "flex-start",
  },
  sm: {
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  text: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
  textSm: {
    fontSize: 10,
  },
});
