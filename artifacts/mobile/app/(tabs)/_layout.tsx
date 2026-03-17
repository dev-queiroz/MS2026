import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Colors } from "@/constants/colors";

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Início</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="faculdade">
        <Icon sf={{ default: "book", selected: "book.fill" }} />
        <Label>Faculdade</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="estudos">
        <Icon sf={{ default: "laptopcomputer", selected: "laptopcomputer" }} />
        <Label>Estudos</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="sonhos">
        <Icon sf={{ default: "star", selected: "star.fill" }} />
        <Label>Sonhos</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="mais">
        <Icon sf={{ default: "ellipsis.circle", selected: "ellipsis.circle.fill" }} />
        <Label>Mais</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.tabIconDefault,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : Colors.surface,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView intensity={80} tint="dark" style={StyleSheet.absoluteFill} />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface }]} />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Início",
          tabBarIcon: ({ color }) => <Feather name="home" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="faculdade"
        options={{
          title: "Faculdade",
          tabBarIcon: ({ color }) => <Feather name="book" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="estudos"
        options={{
          title: "Estudos",
          tabBarIcon: ({ color }) => <Feather name="code" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sonhos"
        options={{
          title: "Sonhos",
          tabBarIcon: ({ color }) => <Feather name="star" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="mais"
        options={{
          title: "Mais",
          tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
