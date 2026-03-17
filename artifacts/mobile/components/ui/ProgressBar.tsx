import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { Colors } from "@/constants/colors";

interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  height?: number;
  style?: ViewStyle;
}

export function ProgressBar({ value, max = 100, color = Colors.accent, height = 4, style }: ProgressBarProps) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100));
  return (
    <View style={[styles.track, { height }, style]}>
      <View style={[styles.fill, { width: `${percent}%`, backgroundColor: color, height }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    backgroundColor: Colors.border,
    borderRadius: 99,
    overflow: "hidden",
    width: "100%",
  },
  fill: {
    borderRadius: 99,
  },
});
