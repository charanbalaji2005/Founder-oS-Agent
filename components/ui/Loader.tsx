import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, Text } from "react-native";
import { COLORS } from "@/constants";

interface LoaderProps {
  size?: number;
  color?: string;
  label?: string;
}

export function Loader({ size = 24, color = COLORS.accent, label }: LoaderProps) {
  const spin = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
      })
    ).start();
  }, [spin]);

  const rotate = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.spinner,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderTopColor: color,
            transform: [{ rotate }],
          },
        ]}
      />
      {label && <Text style={styles.label}>{label}</Text>}
    </View>
  );
}

export function FullScreenLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <View style={styles.fullScreen}>
      <Loader size={36} label={label} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    gap: 10,
  },
  spinner: {
    borderWidth: 2.5,
    borderColor: "rgba(255,255,255,0.1)",
    borderTopColor: COLORS.accent,
  },
  label: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  fullScreen: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    alignItems: "center",
    justifyContent: "center",
  },
});
