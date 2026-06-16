import React, { useRef, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Platform,
  Image,
  Alert,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Dialog } from "@/components/ui/Dialog";
import {
  Sparkles, ArrowRight, Bot, Zap, ShieldCheck,
  Briefcase, Search, Code, Settings, Users,
  MessageSquare, BarChart3, ChevronDown, Play,
  CheckCircle2, Plus
} from "lucide-react-native";
import Animated, {
  FadeInDown,
  FadeInUp,
  FadeInLeft,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSpring
} from "react-native-reanimated";
import { useAuthStore } from "@/store/auth-store";
import { useWorkspaceStore } from "@/store/workspace-store";
import { BACKEND_URL } from "@/constants";
import * as SecureStore from "expo-secure-store";

const isWeb = Platform.OS === "web";

export default function LandingScreen() {
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const params = useLocalSearchParams();
  const { user } = useAuthStore();

  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    type: "success" | "error" | "warning" | "info" | "confirm";
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void;
    onCancel?: () => void;
  }>({
    visible: false,
    type: "info",
    title: "",
    description: "",
  });

  const showAlertDialog = (
    type: "success" | "error" | "warning" | "info" | "confirm",
    title: string,
    description: string,
    confirmLabel?: string,
    cancelLabel?: string,
    onConfirm?: () => void,
    onCancel?: () => void
  ) => {
    setDialogConfig({
      visible: true,
      type,
      title,
      description,
      confirmLabel,
      cancelLabel,
      onConfirm,
      onCancel,
    });
  };

  useEffect(() => {
    if (params.token) {
      handleInviteLink(params.token as string, params.action as string);
    }
  }, [params.token, params.action]);

  const handleInviteLink = async (token: string, action?: string) => {
    if (!user?.id) {
       // Cache pending invitation details
       try {
         if (Platform.OS === 'web') {
           localStorage.setItem("pending_invite_token", token);
           if (action) localStorage.setItem("pending_invite_action", action);
         } else {
           await SecureStore.setItemAsync("pending_invite_token", token);
           if (action) await SecureStore.setItemAsync("pending_invite_action", action);
         }
       } catch (err) {
         console.error("Failed to cache pending invite:", err);
       }

       showAlertDialog(
         "confirm",
         "Authentication Required",
         "Please sign in first to respond to this invitation.",
         "Sign In",
         "Cancel",
         () => router.push("/auth/login")
       );
       return;
    }

    if (action === 'accept') {
       respond(token, 'accepted');
    } else if (action === 'decline') {
       respond(token, 'declined');
    } else {
       showAlertDialog(
         "confirm",
         "Workspace Invitation",
         "Would you like to join this workspace?",
         "Accept",
         "Decline",
         () => respond(token, "accepted"),
         () => respond(token, "declined")
       );
    }
  };

  const respond = async (token: string, status: string) => {
    try {
       const res = await fetch(`${BACKEND_URL}/api/workspaces/invitations/respond-token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token, status, userId: user?.id })
       });
       if (res.ok) {
          showAlertDialog("success", "Success", `Workspace invitation ${status} successfully.`);
          if (user?.id) {
             await useWorkspaceStore.getState().fetchWorkspaces(user.id);
          }
          router.replace("/chat");
       }
    } catch (e) {}
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* --- NAVIGATION --- */}
        <View style={styles.nav}>
          <View style={styles.logoRow}>
            <Sparkles size={24} color="#111827" />
            <Text style={styles.logoText}>FounderOS</Text>
          </View>
          <TouchableOpacity style={styles.loginBtn} onPress={() => router.push("/auth/login")}>
            <Text style={styles.loginBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>

        {/* --- SECTION 1: HERO --- */}
        <View style={styles.heroSection}>
          <Animated.View entering={FadeInDown.duration(800)} style={styles.heroBadge}>
            <Sparkles size={14} color="#6366F1" />
            <Text style={styles.heroBadgeText}>The Future of Company Building</Text>
          </Animated.View>

          <Animated.Text entering={FadeInDown.delay(200).duration(800)} style={[styles.heroTitle, { fontSize: width > 400 ? 44 : 36, lineHeight: width > 400 ? 52 : 44 }]}>
            Run Your Entire AI Company{"\n"}
            <Text style={{ color: "#111827" }}>From One Workspace</Text>
          </Animated.Text>

          <Animated.Text entering={FadeInDown.delay(400).duration(800)} style={styles.heroSub}>
            Collaborate with teammates and AI employees inside a shared workspace where specialized agents handle strategy, research, marketing, development, operations, and customer support.
          </Animated.Text>

          <Animated.View entering={FadeInDown.delay(600).duration(800)} style={styles.heroActions}>
            <Button
              label="Get Started"
              size="lg"
              onPress={() => router.push("/auth/login")}
              style={styles.primaryBtn}
              icon={<ArrowRight size={18} color="#fff" />}
            />
            <Button
              label="Create Workspace"
              variant="outline"
              size="lg"
              onPress={() => router.push("/auth/signup")}
              icon={<Plus size={18} color="#111827" />}
            />
          </Animated.View>

          {/* Floating Mockups Simulation */}
          <View style={styles.mockupContainer}>
            <Animated.View entering={FadeInUp.delay(800).duration(1000)} style={[styles.phoneCard, styles.phone1, { left: width * 0.05 }]}>
              <View style={styles.phoneHeader}>
                <Text style={styles.phoneTitle}>Founder Dashboard</Text>
              </View>
              <View style={styles.phoneContent}>
                <View style={styles.mockBar} />
                <View style={styles.mockBarSmall} />
                <View style={styles.mockGrid}>
                  <View style={styles.mockBox} />
                  <View style={styles.mockBox} />
                </View>
              </View>
            </Animated.View>

            <Animated.View entering={FadeInUp.delay(1000).duration(1000)} style={[styles.phoneCard, styles.phone2, { right: width * 0.05 }]}>
              <View style={styles.phoneHeader}>
                <Text style={styles.phoneTitle}>AI Collaboration</Text>
              </View>
              <View style={styles.phoneContent}>
                <View style={styles.chatBubble} />
                <View style={[styles.chatBubble, styles.chatRight]} />
                <View style={styles.chatBubble} />
              </View>
            </Animated.View>
          </View>
        </View>

        {/* --- SECTION 2: HOW IT WORKS --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>The Process</Text>
          <Text style={styles.sectionTitle}>How It Works</Text>

          <View style={styles.timeline}>
            {[
              { step: "01", title: "Set Your Goal", desc: "Tell the Founder Agent what you want to build or achieve." },
              { step: "02", title: "AI Strategy", desc: "Founder Agent coordinates with the CEO to build a master plan." },
              { step: "03", title: "Collaboration", desc: "Specialized agents execute tasks, code, and research simultaneously." },
              { step: "04", title: "Launch", desc: "Receive a complete execution plan and production-ready assets." },
            ].map((item, i) => (
              <Animated.View key={i} entering={FadeInLeft.delay(200 * i)} style={styles.timelineItem}>
                <View style={styles.timelineStep}>
                  <Text style={styles.stepText}>{item.step}</Text>
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemDesc}>{item.desc}</Text>
                </View>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* --- SECTION 3: AI AGENTS --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Your Workforce</Text>
          <Text style={styles.sectionTitle}>Meet The Executive Suite</Text>

          <View style={styles.agentGrid}>
            {[
              { name: "Founder Agent", role: "Orchestrator", icon: "👑" },
              { name: "CEO Agent", role: "Strategy", icon: "💼" },
              { name: "Research Agent", role: "Intelligence", icon: "🔬" },
              { name: "Marketing Agent", role: "Growth", icon: "📈" },
              { name: "Coding Agent", role: "Engineering", icon: "💻" },
              { name: "Manager Agent", role: "Operations", icon: "👨‍💼" },
              { name: "Employee Agent", role: "Execution", icon: "⚙️" },
              { name: "Support Agent", role: "Customer Success", icon: "🎧" },
            ].map((agent, i) => (
              <Animated.View key={i} entering={FadeInUp.delay(100 * i)} style={styles.agentCardWrapper}>
                <Card style={styles.agentCard}>
                  <Text style={styles.agentIcon}>{agent.icon}</Text>
                  <Text style={styles.agentName}>{agent.name}</Text>
                  <Text style={styles.agentRole}>{agent.role}</Text>
                  <View style={styles.agentStatus}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>Active</Text>
                  </View>
                </Card>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* --- SECTION 4: FEATURES --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Capabilities</Text>
          <Text style={styles.sectionTitle}>Everything You Need To Scale</Text>

          <View style={styles.featureList}>
            {[
              { title: "Multi-Agent Collaboration", icon: Users },
              { title: "Automated Research", icon: Search },
              { title: "Software Engineering", icon: Code },
              { title: "Project Management", icon: Settings },
              { title: "Analytics & KPI Tracking", icon: BarChart3 },
              { title: "Long-Term AI Memory", icon: ShieldCheck },
            ].map((feat, i) => (
              <Card key={i} style={styles.featureItem}>
                <View style={styles.featIconBox}>
                  <feat.icon size={20} color="#111827" />
                </View>
                <Text style={styles.featTitle}>{feat.title}</Text>
              </Card>
            ))}
          </View>
        </View>

        {/* --- SECTION 5: PRICING --- */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Pricing</Text>
          <Text style={styles.sectionTitle}>Plans For Every Stage</Text>

          <View style={styles.pricingGrid}>
            {[
              { name: "Starter", price: "$0", features: ["1 Workspace", "3 AI Agents", "Community Support"] },
              { name: "Pro", price: "$49", features: ["Unlimited Workspaces", "Full Executive Suite", "Priority Execution", "API Access"], recommended: true },
              { name: "Enterprise", price: "Custom", features: ["Custom AI Training", "Dedicated Infrastructure", "White Label Options"] },
            ].map((plan, i) => (
              <Card key={i} style={[styles.priceCard, plan.recommended && styles.recommendedCard]}>
                {plan.recommended && (
                  <View style={styles.recBadge}><Text style={styles.recBadgeText}>Recommended</Text></View>
                )}
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPrice}>{plan.price}<Text style={styles.pricePeriod}>{plan.price !== "Custom" ? "/mo" : ""}</Text></Text>
                <View style={styles.planFeatures}>
                  {plan.features.map((f, j) => (
                    <View key={j} style={styles.planFeatRow}>
                      <CheckCircle2 size={16} color="#10B981" />
                      <Text style={styles.planFeatText}>{f}</Text>
                    </View>
                  ))}
                </View>
                <Button
                  label="Get Started"
                  variant={plan.recommended ? "primary" : "outline"}
                  onPress={() => router.push("/auth/signup")}
                  fullWidth
                />
              </Card>
            ))}
          </View>
        </View>

        {/* --- SECTION 6: FINAL CTA --- */}
        <Animated.View entering={FadeInUp} style={styles.ctaSection}>
          <View style={styles.ctaCard}>
            <Text style={styles.ctaTitle}>Ready To Build Your AI Company?</Text>
            <Text style={styles.ctaSub}>Join 5,000+ founders using our AI Operating System.</Text>
            <Button
              label="Get Started Now"
              size="lg"
              onPress={() => router.push("/auth/signup")}
              style={styles.ctaBtn}
            />
          </View>
        </Animated.View>

        {/* --- FOOTER --- */}
        <View style={styles.footer}>
          <View style={styles.footerLogo}>
            <Sparkles size={20} color="#6B7280" />
            <Text style={styles.footerLogoText}>FounderOS AI</Text>
          </View>
          <Text style={styles.copyright}>© 2024 FounderOS. All rights reserved.</Text>
        </View>
      </ScrollView>

      <Dialog
        visible={dialogConfig.visible}
        onClose={() => setDialogConfig(prev => ({ ...prev, visible: false }))}
        type={dialogConfig.type}
        title={dialogConfig.title}
        description={dialogConfig.description}
        confirmLabel={dialogConfig.confirmLabel}
        cancelLabel={dialogConfig.cancelLabel}
        onConfirm={dialogConfig.onConfirm}
        onCancel={dialogConfig.onCancel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  nav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    height: 72,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6"
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  logoText: { fontSize: 20, fontWeight: "900", color: "#111827", letterSpacing: -0.5 },
  loginBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  loginBtnText: { fontSize: 15, fontWeight: "700", color: "#111827" },

  heroSection: { padding: 24, alignItems: "center", paddingTop: 60, minHeight: 600 },
  heroBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#EEF2FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 24
  },
  heroBadgeText: { fontSize: 13, fontWeight: "700", color: "#6366F1" },
  heroTitle: {
    fontWeight: "900",
    color: "#111827",
    textAlign: "center",
    letterSpacing: -1.5,
    marginBottom: 20
  },
  heroSub: {
    fontSize: 17,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 26,
    paddingHorizontal: 10,
    marginBottom: 40
  },
  heroActions: { flexDirection: "row", gap: 16, width: "100%", justifyContent: "center" },
  primaryBtn: { backgroundColor: "#111827" },

  mockupContainer: { width: "100%", height: 340, marginTop: 60, position: "relative", alignItems: "center" },
  phoneCard: {
    width: 200,
    height: 320,
    backgroundColor: "#fff",
    borderRadius: 32,
    borderWidth: 6,
    borderColor: "#111827",
    position: "absolute",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 20 },
    shadowOpacity: 0.1,
    shadowRadius: 30,
    elevation: 10,
    overflow: "hidden"
  },
  phone1: { transform: [{ rotate: "-10deg" }, { translateY: 20 }] },
  phone2: { transform: [{ rotate: "10deg" }, { scale: 1.05 }] },
  phoneHeader: { height: 40, backgroundColor: "#F9FAFB", justifyContent: "center", paddingHorizontal: 16 },
  phoneTitle: { fontSize: 10, fontWeight: "800", color: "#111827" },
  phoneContent: { flex: 1, padding: 12, gap: 10 },
  mockBar: { height: 12, backgroundColor: "#F3F4F6", borderRadius: 6 },
  mockBarSmall: { height: 12, backgroundColor: "#F3F4F6", borderRadius: 6, width: "60%" },
  mockGrid: { flexDirection: "row", gap: 8 },
  mockBox: { flex: 1, height: 60, backgroundColor: "#F3F4F6", borderRadius: 8 },
  chatBubble: { width: "70%", height: 32, backgroundColor: "#F3F4F6", borderRadius: 12 },
  chatRight: { alignSelf: "flex-end", backgroundColor: "#111827" },

  section: { padding: 24, marginTop: 60 },
  sectionLabel: { fontSize: 13, fontWeight: "800", color: "#6366F1", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8, textAlign: "center" },
  sectionTitle: { fontSize: 28, fontWeight: "900", color: "#111827", textAlign: "center", marginBottom: 40 },

  timeline: { gap: 20 },
  timelineItem: { flexDirection: "row", gap: 20, alignItems: "flex-start" },
  timelineStep: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#111827", justifyContent: "center", alignItems: "center" },
  stepText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  timelineContent: { flex: 1 },
  itemTitle: { fontSize: 18, fontWeight: "800", color: "#111827", marginBottom: 4 },
  itemDesc: { fontSize: 14, color: "#6B7280", lineHeight: 22 },

  agentGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  agentCardWrapper: { width: "48%" },
  agentCard: { padding: 16, alignItems: "center", gap: 8 },
  agentIcon: { fontSize: 24 },
  agentName: { fontSize: 14, fontWeight: "800", color: "#111827", textAlign: "center" },
  agentRole: { fontSize: 11, color: "#6B7280", textAlign: "center" },
  agentStatus: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#10B981" },
  statusText: { fontSize: 10, fontWeight: "700", color: "#10B981" },

  featureList: { gap: 12 },
  featureItem: { flexDirection: "row", alignItems: "center", gap: 16, padding: 16 },
  featIconBox: { width: 40, height: 40, borderRadius: 10, backgroundColor: "#F3F4F6", justifyContent: "center", alignItems: "center" },
  featTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },

  pricingGrid: { gap: 16 },
  priceCard: { padding: 24, gap: 16 },
  recommendedCard: { borderColor: "#111827", borderWidth: 2 },
  recBadge: { backgroundColor: "#111827", alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, position: "absolute", top: -12, left: 24 },
  recBadgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  planName: { fontSize: 18, fontWeight: "800", color: "#111827" },
  planPrice: { fontSize: 32, fontWeight: "900", color: "#111827" },
  pricePeriod: { fontSize: 14, color: "#6B7280", fontWeight: "600" },
  planFeatures: { gap: 12, marginVertical: 20 },
  planFeatRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  planFeatText: { fontSize: 14, color: "#374151", fontWeight: "600" },

  ctaSection: { padding: 24, marginTop: 60 },
  ctaCard: { backgroundColor: "#111827", borderRadius: 32, padding: 40, alignItems: "center", gap: 16 },
  ctaTitle: { fontSize: 24, fontWeight: "900", color: "#fff", textAlign: "center" },
  ctaSub: { fontSize: 15, color: "rgba(255,255,255,0.6)", textAlign: "center", lineHeight: 22 },
  ctaBtn: { backgroundColor: "#fff", width: "100%", marginTop: 10 },

  footer: { padding: 40, alignItems: "center", borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  footerLogo: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 12 },
  footerLogoText: { fontSize: 16, fontWeight: "800", color: "#6B7280" },
  copyright: { fontSize: 12, color: "#9CA3AF" },
});
