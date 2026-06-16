import React from "react";
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
  Platform,
  StyleProp,
} from "react-native";
import { COLORS } from "@/constants";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming
} from "react-native-reanimated";

type Variant = "primary" | "ghost" | "outline" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps {
  onPress: () => void;
  label: string;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  fullWidth?: boolean;
}

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function Button({
  onPress,
  label,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const scale = useSharedValue(1);

  const getLoadingColor = () => {
    if (variant === "primary") return "#fff";
    if (variant === "danger") return "#EF4444";
    return "#111827";
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const onPressIn = () => {
    scale.value = withSpring(0.97);
  };

  const onPressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <AnimatedTouchableOpacity
      onPress={onPress}
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      disabled={isDisabled}
      style={[
        styles.base,
        styles[variant],
        styles[size],
        fullWidth && styles.fullWidth,
        isDisabled && styles.disabled,
        style,
        animatedStyle,
      ] as any}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getLoadingColor()}
        />
      ) : (
        <>
          {icon}
          <Text style={[
            styles.text,
            styles[`${variant}Text`],
            styles[`${size}Text`],
            textStyle
          ]}>
            {label}
          </Text>
        </>
      )}
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 12,
    ...Platform.select({
      web: {
        transitionProperty: "background-color, transform",
        transitionDuration: "200ms",
      }
    } as any)
  },
  // Variants
  primary: {
    backgroundColor: "#111827",
  },
  ghost: {
    backgroundColor: "#F3F4F6",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  danger: {
    backgroundColor: "rgba(239, 68, 68, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  // Sizes
  sm: { paddingVertical: 8, paddingHorizontal: 12 },
  md: { paddingVertical: 11, paddingHorizontal: 18 },
  lg: { paddingVertical: 14, paddingHorizontal: 24 },
  // Text base
  text: { fontWeight: "600" },
  primaryText: { color: "#ffffff" },
  ghostText: { color: "#374151" },
  outlineText: { color: "#111827" },
  dangerText: { color: "#EF4444" },
  // Text sizes
  smText: { fontSize: 13 },
  mdText: { fontSize: 14 },
  lgText: { fontSize: 15 },
  // States
  disabled: { opacity: 0.5 },
  fullWidth: { width: "100%" },
});
