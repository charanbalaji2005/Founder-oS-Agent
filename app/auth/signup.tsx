import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { registerAPI } from "@/services/auth.service";
import { BACKEND_URL } from "@/constants";
import {
  User, Mail, Lock, Building, Briefcase, ChevronLeft, AtSign, CheckCircle2, XCircle
} from "lucide-react-native";

export default function SignupScreen() {
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [wsCode, setWsCode] = useState("");
  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    companyName: "",
    workspaceName: "",
  });

  const [usernameStatus, setUsernameStatus] = useState<{
    loading: boolean;
    available: boolean | null;
    message: string;
  }>({ loading: false, available: null, message: "" });

  // Real-time username validation
  useEffect(() => {
    if (formData.username.length < 3) {
      setUsernameStatus({ loading: false, available: null, message: "" });
      return;
    }

    const timer = setTimeout(async () => {
      setUsernameStatus({ ...usernameStatus, loading: true });
      try {
        const res = await fetch(`${BACKEND_URL}/api/users/check-username/${formData.username}`);
        const data = await res.json();
        setUsernameStatus({
          loading: false,
          available: data.available,
          message: data.message
        });
      } catch (err) {
        setUsernameStatus({ loading: false, available: null, message: "Error validating" });
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.username]);

  const handleRegister = async () => {
    if (!formData.name || !formData.username || !formData.email || !formData.password) {
      setErrorMessage("Required fields missing.");
      setShowError(true);
      return;
    }
    if (usernameStatus.available === false) {
      setErrorMessage("Username is not available.");
      setShowError(true);
      return;
    }
    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("Passwords do not match.");
      setShowError(true);
      return;
    }

    setLoading(true);
    try {
      const res = await registerAPI(
        formData.name,
        formData.email,
        formData.password,
        formData.workspaceName || `${formData.name}'s Workspace`,
        "General",
        "1",
        formData.companyName,
        formData.username
      );

      setWsCode(res.workspaceCode);
      setShowSuccess(true);
    } catch (err: any) {
      setErrorMessage(err.message || "Something went wrong.");
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
            <ChevronLeft size={24} color="#111827" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Join FounderOS</Text>
          <View style={{ width: 44 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.titleBox}>
            <Text style={styles.title}>Register Workspace</Text>
            <Text style={styles.subtitle}>Initialize your AI-powered company operating system.</Text>
          </View>

          <View style={styles.form}>
            <Input
              label="Full Name"
              placeholder="John Doe"
              value={formData.name}
              onChangeText={(v) => setFormData({...formData, name: v})}
              icon={<User size={18} color="#6B7280" />}
            />

            <Input
              label="Username"
              placeholder="e.g. charan123"
              autoCapitalize="none"
              value={formData.username}
              onChangeText={(v) => setFormData({...formData, username: v})}
              icon={<AtSign size={18} color="#6B7280" />}
              error={usernameStatus.available === false ? usernameStatus.message : ""}
              hint={usernameStatus.available === true ? "✅ Username available" : ""}
            />

            <Input
              label="Email Address"
              placeholder="john@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.email}
              onChangeText={(v) => setFormData({...formData, email: v})}
              icon={<Mail size={18} color="#6B7280" />}
            />

            <Input
              label="Company Name"
              placeholder="Acme Corp"
              value={formData.companyName}
              onChangeText={(v) => setFormData({...formData, companyName: v})}
              icon={<Building size={18} color="#6B7280" />}
            />

            <Input
              label="Workspace Name"
              placeholder="Strategic Hub"
              value={formData.workspaceName}
              onChangeText={(v) => setFormData({...formData, workspaceName: v})}
              icon={<Briefcase size={18} color="#6B7280" />}
            />

            <Input
              label="Password"
              placeholder="Min 6 characters"
              secureTextEntry
              value={formData.password}
              onChangeText={(v) => setFormData({...formData, password: v})}
              icon={<Lock size={18} color="#6B7280" />}
            />

            <Input
              label="Confirm Password"
              placeholder="Repeat password"
              secureTextEntry
              value={formData.confirmPassword}
              onChangeText={(v) => setFormData({...formData, confirmPassword: v})}
              icon={<Lock size={18} color="#6B7280" />}
            />

            <Button
              label="Initialize System"
              onPress={handleRegister}
              fullWidth
              size="lg"
              loading={loading}
              disabled={usernameStatus.available === false}
              style={styles.regBtn}
            />

            <TouchableOpacity style={styles.loginLink} onPress={() => router.replace("/auth/login")}>
              <Text style={styles.loginLinkText}>Have an account? <Text style={{ color: "#111827", fontWeight: "800" }}>Sign In</Text></Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Dialog
        visible={showSuccess}
        onClose={() => { setShowSuccess(false); router.replace("/auth/login"); }}
        type="success"
        title="Workspace Created!"
        description={`Your AI Company OS is ready.\n\nWorkspace Code: ${wsCode}\n\nPlease sign in to begin operations.`}
      />

      <Dialog
        visible={showError}
        onClose={() => setShowError(false)}
        type="error"
        title="Error"
        description={errorMessage}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  flex: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  headerTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#F9FAFB", alignItems: "center", justifyContent: "center" },
  scrollContent: { padding: 24 },
  titleBox: { marginBottom: 32 },
  title: { fontSize: 32, fontWeight: "900", color: "#111827", letterSpacing: -1 },
  subtitle: { fontSize: 16, color: "#6B7280", marginTop: 8, lineHeight: 24 },
  form: { gap: 4 },
  regBtn: { backgroundColor: "#111827", marginTop: 10 },
  loginLink: { marginTop: 24, marginBottom: 40, alignItems: "center" },
  loginLinkText: { fontSize: 14, color: "#6B7280" },
});
