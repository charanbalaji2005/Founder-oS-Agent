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
import { router, useLocalSearchParams } from "expo-router";
import { BACKEND_URL } from "@/constants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { Lock, ArrowLeft } from "lucide-react-native";

export default function ResetPasswordFinalScreen() {
  const { userId } = useLocalSearchParams();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters.");
      setShowError(true);
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match.");
      setShowError(true);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, password })
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || "Update failed");
        setShowError(true);
        return;
      }

      setShowSuccess(true);
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
            <Text style={styles.title}>New Password</Text>
            <Text style={styles.subtitle}>
              Set a strong password to protect your FounderOS workspace.
            </Text>
          </View>

          <Card style={styles.formCard}>
            <Input
              label="New Password"
              placeholder="••••••••"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              icon={<Lock size={18} color="#6B7280" />}
            />

            <Input
              label="Confirm New Password"
              placeholder="••••••••"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              icon={<Lock size={18} color="#6B7280" />}
            />

            <Button
              label="Update Password"
              onPress={handleUpdatePassword}
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
        title="Password Updated"
        description="Your credentials have been successfully updated. You can now sign in to your workspace."
      />

      <Dialog
        visible={showError}
        onClose={() => setShowError(false)}
        type="error"
        title="Update Failed"
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
