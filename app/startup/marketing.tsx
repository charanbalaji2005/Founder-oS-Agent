import React from "react";
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useMarketing } from "@/hooks/useResearch";
import { useWorkflow } from "@/hooks/useWorkflow";
import { COLORS } from "@/constants";
import { ResultViewer } from "@/components/startup/ResultViewer";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Loader } from "@/components/ui/Loader";
import { ArrowLeft, RefreshCw, AlertTriangle, Megaphone, ChevronRight } from "lucide-react-native";

export default function MarketingScreen() {
  const { content, status, error, hasData } = useMarketing();
  const { rerunAgent } = useWorkflow();

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={18} color={COLORS.accent} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Marketing Agent</Text>
        {hasData && (
          <TouchableOpacity onPress={() => rerunAgent("marketing")} style={styles.regenBtn}>
            <RefreshCw size={14} color={COLORS.accent} style={{ marginRight: 4 }} />
            <Text style={styles.regenText}>Redo</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.modelBadge}>
          <Text style={styles.modelBadgeText}>🧠 Llama 3.3 70B via Groq</Text>
        </View>

        {status === "running" && (
          <View style={styles.loadingBox}>
            <Loader size={32} label="Developing GTM campaign blueprints & landing page hook copies..." color={COLORS.accent} />
          </View>
        )}

        {status === "error" && (
          <Card variant="error" style={styles.errorCard}>
            <AlertTriangle size={16} color={COLORS.red} style={{ marginRight: 6 }} />
            <Text style={styles.errorText}>{error}</Text>
            <Button
              label="Retry"
              onPress={() => rerunAgent("marketing")}
              variant="danger"
              size="sm"
              style={{ marginTop: 10 }}
            />
          </Card>
        )}

        {!hasData && status === "idle" && (
          <View style={styles.empty}>
            <Megaphone size={48} color={COLORS.textMuted} style={{ marginBottom: 14, opacity: 0.4 }} />
            <Text style={styles.emptyTitle}>No GTM Campaign Blueprint yet</Text>
            <Text style={styles.emptySub}>
              Run the startup generator pipeline to get lead acquisition and campaign plans.
            </Text>
            <Button
              label="Generate Plan"
              onPress={() => router.push("/startup/create")}
              style={{ marginTop: 16 }}
            />
          </View>
        )}

        {hasData && (
          <>
            <Card style={styles.contentCard}>
              <ResultViewer content={content} />
            </Card>
            <View style={styles.navRow}>
              <Button
                label="Roadmap Plan"
                onPress={() => router.push("/startup/manager")}
                variant="ghost"
                size="sm"
                icon={<ChevronRight size={14} color={COLORS.accent} />}
              />
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.bgPrimary },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderSecondary,
  },
  backBtn: { padding: 4, marginRight: 12 },
  topTitle: { flex: 1, fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  regenBtn: { flexDirection: "row", alignItems: "center" },
  regenText: { fontSize: 13, color: COLORS.accent, fontWeight: "600" },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  modelBadge: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(197, 139, 90, 0.08)",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(197, 139, 90, 0.15)",
  },
  modelBadgeText: { fontSize: 11, color: COLORS.accent, fontWeight: "600" },
  loadingBox: { alignItems: "center", paddingVertical: 60 },
  empty: { alignItems: "center", paddingVertical: 60 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: COLORS.textPrimary },
  emptySub: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, textAlign: "center", lineHeight: 20 },
  contentCard: { marginBottom: 16, padding: 16, backgroundColor: COLORS.bgSecondary },
  errorCard: { padding: 16, marginBottom: 16 },
  errorText: { fontSize: 13, color: COLORS.red },
  navRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 8 },
});
