import React, { useState } from "react";
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TextInputProps,
  ViewStyle,
  Platform,
  StyleProp,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  containerStyle?: StyleProp<ViewStyle>;
  multiline?: boolean;
  numberOfLines?: number;
  icon?: React.ReactNode;
}

export function Input({
  label,
  error,
  hint,
  containerStyle,
  multiline,
  numberOfLines,
  icon,
  ...props
}: InputProps) {
  const [isFocused, setIsFocused] = useState(false);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    borderColor: withTiming(error ? "#EF4444" : isFocused ? "#111827" : "#E5E7EB", { duration: 200 }),
    backgroundColor: withTiming(isFocused ? "#FFFFFF" : "#F9FAFB", { duration: 200 }),
  }));

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View style={[styles.inputWrapper, animatedContainerStyle]}>
        {icon && (
          <View style={styles.iconContainer}>
            {icon}
          </View>
        )}
        <TextInput
          {...props}
          multiline={multiline}
          numberOfLines={numberOfLines}
          onFocus={(e) => {
            setIsFocused(true);
            props.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            props.onBlur?.(e);
          }}
          style={[
            styles.input as any,
            multiline && (styles.multiline as any),
            props.style,
          ]}
          placeholderTextColor="#9CA3AF"
          // @ts-ignore - web only prop
          outlineStyle="none"
        />
      </Animated.View>
      {error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 16,
    height: 52,
  },
  iconContainer: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: "100%",
    color: "#111827",
    fontSize: 15,
    fontWeight: "500",
    ...Platform.select({
      web: {
        outlineStyle: "none",
        boxShadow: "none",
      }
    } as any)
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: "top",
    paddingTop: 12,
    lineHeight: 22,
  },
  error: {
    fontSize: 12,
    color: "#EF4444",
    marginTop: 6,
    fontWeight: "600",
  },
});
