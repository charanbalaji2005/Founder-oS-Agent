import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Dimensions,
  Animated,
  useWindowDimensions,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { BACKEND_URL } from "@/constants";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import { Input } from "@/components/ui/Input";
import { loginAPI, googleLoginAPI } from "@/services/auth.service";
import { Mail, Lock, ShieldCheck, Github, Chrome, X } from "lucide-react-native";
import * as WebBrowser from "expo-web-browser";
import * as Google from "expo-auth-session/providers/google";
import { OTPInput } from "@/components/ui/OTPInput";

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const { login } = useAuthStore();

  const [showError, setShowError] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // 2FA State
  const [showOTP, setShowOTP] = useState(false);
  const [twoFactorId, setTwoFactorId] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState("");

  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const isWideScreen = windowWidth >= 768;

  // Google OAuth
  const [request, response, promptAsync] = Google.useAuthRequest({
    androidClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    iosClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      handleGoogleLogin(id_token);
    }
  }, [response]);

  const handleGoogleLogin = async (idToken: string) => {
    setLoading(true);
    try {
      const res = await googleLoginAPI(idToken);
      await login(res.user, res.token);
      router.replace("/(tabs)");
    } catch (err) {
      setErrorMessage("Google authentication failed. Please try again.");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      const res = await loginAPI(email, password);

      if (res.twoFactorRequired) {
        setTwoFactorId(res.userId || null);
        setMaskedEmail(res.email || "");
        setShowOTP(true);
      } else {
        setSuccessMessage("Identity confirmed. Initializing FounderOS workspace...");
        setShowSuccess(true);
        setTimeout(async () => {
          await login(res.user, res.token);
          router.replace("/(tabs)");
        }, 1500);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid credentials. Please check your email and password.");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (otp: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: twoFactorId, otp })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");

      await login(data.user, data.token);
      setShowOTP(false);
      router.replace("/(tabs)");
    } catch (err: any) {
      setErrorMessage(err.message || "OTP Verification failed.");
      setShowError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, !isWideScreen && styles.containerMobile]}>
      {/* Left Side: Premium Mockups (Only for Desktop) */}
      {isWideScreen && (
        <View style={styles.leftSide}>
          <View style={styles.mockupContainer}>
            <View style={[styles.mockup, styles.mock1]}>
              <View style={styles.mockHeader}><Text style={styles.mockTitle}>CEO Agent</Text></View>
              <View style={styles.mockBody}>
                <View style={styles.mockBar} />
                <View style={styles.mockBarSmall} />
              </View>
            </View>
            <View style={[styles.mockup, styles.mock2]}>
              <View style={styles.mockHeader}><Text style={styles.mockTitle}>Founder Dashboard</Text></View>
              <View style={styles.mockBody}>
                <View style={styles.mockGraph} />
                <View style={styles.mockGrid}>
                  <View style={styles.mockSquare} />
                  <View style={styles.mockSquare} />
                </View>
              </View>
            </View>
            <View style={[styles.mockup, styles.mock3]}>
              <View style={styles.mockHeader}><Text style={styles.mockTitle}>Agent Network</Text></View>
              <View style={styles.mockBody}>
                <View style={styles.mockChat} />
                <View style={[styles.mockChat, { alignSelf: 'flex-end', backgroundColor: '#111827' }]} />
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Right Side: Auth Card */}
      <View style={[styles.rightSide, !isWideScreen && styles.rightSideMobile]}>
        <SafeAreaView style={styles.safe}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
            style={{ flex: 1 }}
          >
            <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
              <View style={styles.authCard}>
              <View style={styles.header}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>FounderOS AI</Text>
                </View>
                <Text style={styles.title}>Welcome Back</Text>
                <Text style={styles.subtitle}>Run Your Entire AI Company From One Workspace</Text>
              </View>

              <View style={styles.form}>
                <Input
                  label="Email Address"
                  placeholder="name@company.com"
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  icon={<Mail size={18} color="#6B7280" />}
                />

                <Input
                  label="Password"
                  placeholder="••••••••"
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  icon={<Lock size={18} color="#6B7280" />}
                />

                <View style={styles.optionsRow}>
                  <TouchableOpacity
                    style={styles.rememberRow}
                    onPress={() => setRememberMe(!rememberMe)}
                  >
                    <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                      {rememberMe && <ShieldCheck size={12} color="#fff" />}
                    </View>
                    <Text style={styles.optionText}>Remember Me</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push("/auth/forgot-password")}>
                    <Text style={[styles.optionText, { color: "#111827", fontWeight: "700" }]}>Forgot Password?</Text>
                  </TouchableOpacity>
                </View>

                <Button
                  label="Sign In"
                  onPress={handleLogin}
                  fullWidth
                  size="lg"
                  loading={loading}
                  style={styles.loginBtn}
                />

                <View style={styles.divider}>
                  <View style={styles.line} />
                  <Text style={styles.dividerText}>OR CONTINUE WITH</Text>
                  <View style={styles.line} />
                </View>

                <View style={styles.socialRow}>
                  <TouchableOpacity
                    style={styles.socialBtn}
                    onPress={() => promptAsync()}
                    disabled={!request || loading}
                  >
                    <Chrome size={20} color="#111827" />
                    <Text style={styles.socialBtnText}>Google</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.socialBtn}>
                    <Github size={20} color="#111827" />
                    <Text style={styles.socialBtnText}>GitHub</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/auth/signup")}>
                  <Text style={styles.signupLink}>Create Workspace</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>

      {/* OTP Verification Modal */}
      <Modal visible={showOTP} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Card style={styles.otpCard}>
            <View style={styles.otpHeader}>
              <View style={styles.shieldIcon}>
                <ShieldCheck size={28} color="#111827" />
              </View>
              <TouchableOpacity onPress={() => setShowOTP(false)} style={styles.closeBtn}>
                <X size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <Text style={styles.otpTitle}>Verify Your Identity</Text>
            <Text style={styles.otpSub}>
              We've sent a 6-digit code to{"\n"}
              <Text style={{ fontWeight: "700", color: "#111827" }}>{maskedEmail}</Text>
            </Text>

            <OTPInput onComplete={handleVerifyOTP} disabled={loading} />

            {loading && <ActivityIndicator color="#111827" style={{ marginTop: 10 }} />}

            <TouchableOpacity style={styles.resendBtn}>
              <Text style={styles.resendText}>Didn't receive code? <Text style={{ fontWeight: "700" }}>Resend</Text></Text>
            </TouchableOpacity>
          </Card>
        </View>
      </Modal>

      <Dialog
        visible={showError}
        onClose={() => setShowError(false)}
        type="error"
        title="Authentication Error"
        description={errorMessage}
      />

      <Dialog
        visible={showSuccess}
        onClose={() => setShowSuccess(false)}
        type="success"
        title="Login Successful"
        description={successMessage}
        showFooter={false}
        hideClose={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  containerMobile: { flexDirection: "column" },
  leftSide: {
    flex: 1.2,
    backgroundColor: "#F8F9FA",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  mockupContainer: { width: "100%", height: "100%", position: "relative" },
  mockup: {
    position: "absolute", width: 220, height: 360,
    backgroundColor: "#fff", borderRadius: 24, borderWidth: 1,
    borderColor: "#E5E7EB", shadowColor: "#000", shadowOpacity: 0.05,
    shadowRadius: 10, elevation: 5, overflow: 'hidden'
  },
  mock1: { top: '10%', left: '15%', transform: [{ rotate: '-10deg' }] },
  mock2: { top: '25%', left: '40%', zIndex: 10, scaleX: 1.1, scaleY: 1.1 },
  mock3: { bottom: '10%', right: '15%', transform: [{ rotate: '10deg' }] },
  mockHeader: { height: 36, backgroundColor: '#F9FAFB', justifyContent: 'center', paddingHorizontal: 12 },
  mockTitle: { fontSize: 9, fontWeight: '800', color: '#111827' },
  mockBody: { flex: 1, padding: 12, gap: 8 },
  mockBar: { height: 10, backgroundColor: '#F3F4F6', borderRadius: 5 },
  mockBarSmall: { height: 10, backgroundColor: '#F3F4F6', borderRadius: 5, width: '60%' },
  mockGraph: { height: 80, backgroundColor: '#F3F4F6', borderRadius: 8 },
  mockGrid: { flexDirection: 'row', gap: 8 },
  mockSquare: { flex: 1, height: 40, backgroundColor: '#F3F4F6', borderRadius: 6 },
  mockChat: { width: '70%', height: 24, backgroundColor: '#F3F4F6', borderRadius: 12 },

  rightSide: { flex: 1, backgroundColor: "#FFFFFF" },
  rightSideMobile: { flex: 1, width: "100%" },
  safe: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: "center", padding: 24, paddingHorizontal: 40 },
  authCard: { width: "100%", maxWidth: 420, alignSelf: "center" },
  header: { marginBottom: 32 },
  badge: {
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    alignSelf: "flex-start",
    marginBottom: 12,
  },
  badgeText: { fontSize: 10, fontWeight: "900", color: "#111827", textTransform: "uppercase" },
  title: { fontSize: 32, fontWeight: "900", color: "#111827", letterSpacing: -1 },
  subtitle: { fontSize: 15, color: "#6B7280", marginTop: 8, lineHeight: 22 },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 13, fontWeight: "700", color: "#374151" },
  optionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10
  },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  checkbox: { width: 18, height: 18, borderRadius: 4, borderWidth: 1, borderColor: "#E5E7EB", alignItems: "center", justifyContent: "center" },
  checkboxActive: { backgroundColor: "#111827", borderColor: "#111827" },
  optionText: { fontSize: 13, color: "#6B7280" },
  loginBtn: { backgroundColor: "#111827", borderRadius: 12, height: 52 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 12 },
  line: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: { fontSize: 10, fontWeight: "800", color: "#9CA3AF" },
  socialRow: { flexDirection: "row", gap: 12 },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  socialBtnText: { fontSize: 13, fontWeight: "700", color: "#111827" },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 32,
    alignItems: "center"
  },
  footerText: { fontSize: 14, color: "#6B7280" },
  signupLink: { fontSize: 14, color: "#111827", fontWeight: "800" },

  // OTP Modal Styles
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", padding: 24 },
  otpCard: { padding: 32, alignItems: "center", borderRadius: 24 },
  otpHeader: { width: "100%", flexDirection: "row", justifyContent: "center", marginBottom: 20 },
  shieldIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  closeBtn: { position: "absolute", right: 0, top: 0 },
  otpTitle: { fontSize: 24, fontWeight: "900", color: "#111827", marginBottom: 8 },
  otpSub: { fontSize: 14, color: "#6B7280", textAlign: "center", lineHeight: 22 },
  resendBtn: { marginTop: 24 },
  resendText: { fontSize: 13, color: "#6B7280" },
});
