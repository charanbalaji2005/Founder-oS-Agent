import React, { useRef, useState } from "react";
import { View, TextInput, StyleSheet, Platform } from "react-native";

interface OTPInputProps {
  length?: number;
  onComplete: (otp: string) => void;
  disabled?: boolean;
}

export function OTPInput({ length = 6, onComplete, disabled = false }: OTPInputProps) {
  const [otp, setOtp] = useState<string[]>(new Array(length).fill(""));
  const inputs = useRef<TextInput[]>([]);

  const handleChange = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text.slice(-1);
    setOtp(newOtp);

    if (text && index < length - 1) {
      inputs.current[index + 1]?.focus();
    }

    if (newOtp.every(val => val !== "") && newOtp.length === length) {
      onComplete(newOtp.join(""));
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  return (
    <View style={styles.container}>
      {otp.map((digit, i) => (
        <TextInput
          key={i}
          ref={(ref) => { if (ref) inputs.current[i] = ref; }}
          style={[styles.input as any, digit ? styles.inputFilled : null]}
          keyboardType="number-pad"
          maxLength={1}
          value={digit}
          onChangeText={(text) => handleChange(text, i)}
          onKeyPress={(e) => handleKeyPress(e, i)}
          editable={!disabled}
          autoFocus={i === 0}
          textAlign="center"
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginVertical: 20,
  },
  input: {
    width: 45,
    height: 56,
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    ...Platform.select({
      web: {
        outlineStyle: "none",
      }
    } as any)
  },
  inputFilled: {
    borderColor: "#111827",
    backgroundColor: "#FFFFFF",
  },
});
