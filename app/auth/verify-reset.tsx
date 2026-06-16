import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { BACKEND_URL } from "@/constants";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { OTPInput } from "@/components/ui/OTPInput";
import { ArrowLeft, ShieldCheck } from "lucide-react-native";

export default function VerifyResetScreen() {
  const { userId, email } = useLocalSearchParams();
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleVerify = async (otp: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otp })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Verification failed");
        setShowError(true);
        return;
      }

      router.push({
        pathname: "/auth/reset-password-final",
        params: { userId }
      });
    } catch (err) {
      setErrorMsg("Connection error.");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.flex}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color="#111827" />
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.titleBox}>
            <Text style={styles.title}>Enter Code</Text>
            <Text style={styles.subtitle}>
              We've sent a 6-digit verification code to {email}.
            </Text>
          </View>

          <Card style={styles.formCard}>
            <OTPInput onComplete={handleVerify} disabled={loading} />
            {loading && <ActivityIndicator color="#111827" style={{ marginTop: 20 }} />}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      <Dialog
        visible={showError}
        onClose={() => setShowError(false)}
        type="error"
        title="Verification Failed"
        description={errorMsg}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  flex: { flex: 1 },
  header: { padding: 24 },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center" },
  scrollContent: { padding: 24 },
  titleBox: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: "900", color: "#111827", letterSpacing: -1 },
  subtitle: { fontSize: 16, color: "#6B7280", marginTop: 12, lineHeight: 24 },
  formCard: { padding: 24, alignItems: 'center' },
});
