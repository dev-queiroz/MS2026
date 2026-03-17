import React from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";
import { Colors } from "@/constants/colors";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  accentColor?: string;
  noPad?: boolean;
}

export function Card({ children, style, onPress, accentColor, noPad }: CardProps) {
  const inner = (
    <View style={[
      styles.card,
      noPad && styles.noPad,
      accentColor && { borderLeftColor: accentColor, borderLeftWidth: 3 },
      style,
    ]}>
      {children}
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1 }]}>
        {inner}
      </Pressable>
    );
  }
  return inner;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  noPad: {
    padding: 0,
    overflow: "hidden",
  },
});
