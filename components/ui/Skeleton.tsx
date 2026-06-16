import React, { useEffect, useRef } from "react";
import { View, Animated, StyleSheet, ViewStyle } from "react-native";

interface SkeletonProps {
  style?: ViewStyle;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
}

export function Skeleton({ style, width, height, borderRadius = 8 }: SkeletonProps) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.7,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          opacity,
          width,
          height,
          borderRadius,
        } as any,
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: "#E5E7EB",
  },
});
