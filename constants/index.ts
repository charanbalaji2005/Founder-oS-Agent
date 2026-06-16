import { Platform } from "react-native";
export * from "./shared";

// ─── API ──────────────────────────────────────────────────────────────────────
export const GROQ_BASE_URL = "https://api.groq.com/openai/v1";

// Intelligent Backend URL detection
const getBackendUrl = () => {
  // Always use localhost for Web to avoid IP/CORS issues on the development machine
  if (Platform.OS === "web") return "http://localhost:3001";

  // For Mobile, use the .env variable if provided
  if (process.env.EXPO_PUBLIC_BACKEND_URL) return process.env.EXPO_PUBLIC_BACKEND_URL;

  // Fallbacks for local dev
  if (Platform.OS === "android") return "http://10.0.2.2:3001"; // Android Emulator
  return "http://localhost:3001"; // iOS Simulator
};

export const BACKEND_URL = getBackendUrl();

// ─── Theme ────────────────────────────────────────────────────────────────────
export const COLORS = {
  bgPrimary: "#FFFFFF", // Pure White
  bgSecondary: "#F9FAFB", // Professional Light Grey Card
  bgTertiary: "#F3F4F6", // Secondary grey
  bgQuaternary: "#E5E7EB", // Darker grey for dividers
  accent: "#000000", // Sleek Charcoal/Black Accent
  accentLight: "#374151",
  accentDark: "#111827",
  textPrimary: "#111827", // Jet Black/Charcoal
  textSecondary: "#4B5563", // Slate Grey
  textMuted: "#9CA3AF", // Muted Grey
  borderPrimary: "rgba(0, 0, 0, 0.1)", // Subtle black border
  borderSecondary: "rgba(0, 0, 0, 0.05)",
  green: "#10B981",
  amber: "#F59E0B",
  red: "#EF4444",
  teal: "#14B8A6",
  pink: "#EC4899",
};
