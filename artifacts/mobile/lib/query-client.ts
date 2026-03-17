import { Platform } from "react-native";

export function getApiUrl(): string {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) {
    return `https://${domain}/api/`;
  }
  if (Platform.OS === "web") {
    return "/api/";
  }
  return "http://localhost/api/";
}
