import React from "react";
import { View, StyleSheet, ViewStyle, Platform, StyleProp } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  variant?: "default" | "sm" | "ghost" | "success" | "error" | "premium";
  animate?: boolean;
  delay?: number;
}

export function Card({ children, style, variant = "default", animate = true, delay = 0 }: CardProps) {
  const Content = (
    <View style={[styles.base, styles[variant], style]}>
      {children}
    </View>
  );

  if (animate) {
    return (
      <Animated.View entering={FadeInDown.delay(delay).duration(600)}>
        {Content}
      </Animated.View>
    );
  }

  return Content;
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
    ...Platform.select({
      web: {
        transition: "all 0.3s ease",
      }
    } as any)
  },
  default: {},
  sm: {
    padding: 14,
    borderRadius: 12,
  },
  ghost: {
    backgroundColor: "#F9FAFB",
    borderColor: "transparent",
    shadowOpacity: 0,
    elevation: 0,
  },
  premium: {
    borderColor: "#111827",
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
  },
  success: {
    borderColor: "rgba(16, 185, 129, 0.2)",
    backgroundColor: "rgba(16, 185, 129, 0.02)",
  },
  error: {
    borderColor: "rgba(239, 68, 68, 0.2)",
    backgroundColor: "rgba(239, 68, 68, 0.02)",
  },
});
