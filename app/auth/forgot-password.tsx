import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { BACKEND_URL } from "@/constants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Mail, ArrowLeft } from "lucide-react-native";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleReset = async () => {
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Reset failed");
        setShowError(true);
        return;
      }

      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        router.push({
          pathname: "/auth/verify-reset",
          params: { userId: data.userId, email: email }
        });
      }, 1500);
    } catch (err) {
      setErrorMsg("Unable to connect to the security server. Make sure the backend is running.");
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
            <Text style={styles.title}>Reset Password</Text>
            <Text style={styles.subtitle}>
              Enter your registered workspace email and we'll send a security code to restore your access.
            </Text>
          </View>

          <Card style={styles.formCard}>
            <Input
              label="Workspace Email"
              placeholder="founder@company.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Mail size={18} color="#6B7280" />}
            />

            <Button
              label="Send Reset Code"
              onPress={handleReset}
              fullWidth
              size="lg"
              loading={loading}
              style={styles.resetBtn}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      <Dialog
        visible={showSuccess}
        onClose={() => { setShowSuccess(false); router.replace("/auth/login"); }}
        type="success"
        title="Code Sent"
        description="A 6-digit security code has been dispatched to your email. Use it to reset your credentials."
      />

      <Dialog
        visible={showError}
        onClose={() => setShowError(false)}
        type="error"
        title="Reset Failed"
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
  formCard: { padding: 24 },
  resetBtn: { backgroundColor: "#111827", marginTop: 16 },
});
