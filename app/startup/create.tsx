import React from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useWorkflow } from "@/hooks/useWorkflow";
import { COLORS, AGENT_ORDER } from "@/constants";
import { IdeaInput } from "@/components/startup/IdeaInput";
import { AgentCard } from "@/components/startup/AgentCard";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { ArrowLeft, RefreshCw, Sparkles, CheckCircle, Play, Cpu, AlertTriangle } from "lucide-react-native";

const schema = z.object({
  idea: z.string().min(10, "Please describe your idea in more detail").max(800),
  industry: z.string().min(1, "Please select an industry"),
  targetUsers: z.string().min(5, "Please describe your target users"),
  riskAppetite: z.string().min(1),
  timeline: z.string().min(1),
});

type FormData = z.infer<typeof schema>;

export default function CreateScreen() {
  const { workflow, runWorkflow, resetWorkflow, isComplete, progress } = useWorkflow();

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      idea: workflow.idea || "",
      industry: workflow.industry || "",
      targetUsers: workflow.targetUsers || "",
      riskAppetite: "Moderate",
      timeline: "90 Days",
    },
  });

  const isRunning = workflow.isRunning;
  const hasResults = AGENT_ORDER.some((id) => workflow.agents[id].status === "done");

  const onSubmit = async (data: FormData) => {
    await runWorkflow(
      data.idea,
      data.industry,
      data.targetUsers,
      data.riskAppetite,
      data.timeline
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={18} color={COLORS.accent} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>New Startup Plan</Text>
        {hasResults && !isRunning && (
          <TouchableOpacity onPress={resetWorkflow} style={styles.resetBtn}>
            <RefreshCw size={14} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Form */}
        {!isRunning && !isComplete && (
          <Card style={styles.formCard}>
            <View style={styles.formHeaderIcon}>
              <Sparkles size={20} color={COLORS.accent} />
            </View>
            <Text style={styles.formTitle}>Describe Your Startup</Text>
            <Text style={styles.formSub}>
              Our 5 AI agents will research, analyze, and plan your startup automatically based on your constraints.
            </Text>

            <IdeaInput
              control={control}
              errors={errors}
              onQuickFill={(idea) => setValue("idea", idea)}
            />

            <Button
              label="Generate Full Startup Plan"
              onPress={handleSubmit(onSubmit)}
              fullWidth
              size="lg"
              disabled={isRunning}
              icon={<Play size={14} color={COLORS.bgPrimary} />}
            />
          </Card>
        )}

        {/* Running / Results */}
        {(isRunning || hasResults) && (
          <View>
            {/* Progress */}
            <Card style={styles.progressCard}>
              <View style={styles.progressHeader}>
                <View style={styles.progressTitleRow}>
                  <Cpu size={16} color={COLORS.accent} style={{ marginRight: 6 }} />
                  <Text style={styles.progressTitle}>
                    {isRunning ? "AI Agents Running..." : isComplete ? "Plan Complete!" : "Paused"}
                  </Text>
                </View>
                <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
              </View>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              {workflow.idea && (
                <Text style={styles.progressIdea} numberOfLines={1}>
                  Active: {workflow.idea}
                </Text>
              )}
            </Card>

            {/* Agent Cards */}
            <View style={styles.agentList}>
              {AGENT_ORDER.map((id) => (
                <AgentCard
                  key={id}
                  agentId={id}
                  status={workflow.agents[id]?.status || "idle"}
                  error={workflow.agents[id]?.error}
                />
              ))}
            </View>

            {/* Error */}
            {workflow.error && (
              <Card variant="error" style={styles.errorCard}>
                <AlertTriangle size={16} color={COLORS.red} style={{ marginRight: 6 }} />
                <Text style={styles.errorText}>{workflow.error}</Text>
              </Card>
            )}

            {/* Success Actions */}
            {isComplete && (
              <Card variant="success" style={styles.successCard}>
                <View style={styles.successIconBox}>
                  <CheckCircle size={24} color={COLORS.green} />
                </View>
                <Text style={styles.successTitle}>Startup Plan Generated!</Text>
                <Text style={styles.successSub}>
                  All 5 specialized AI agents successfully compiled your plan. Select an agent output below to view results.
                </Text>
                <View style={styles.actionGrid}>
                  {[
                    { label: "Market Research", path: "/startup/research" },
                    { label: "Competitors", path: "/startup/competitors" },
                    { label: "MVP Plan", path: "/startup/mvp" },
                    { label: "Roadmap", path: "/startup/roadmap" },
                    { label: "Launch Plan", path: "/startup/launch" },
                  ].map((act) => (
                    <Button
                      key={act.label}
                      label={act.label}
                      onPress={() => router.push(act.path as any)}
                      variant="outline"
                      size="sm"
                      style={styles.actionBtn}
                    />
                  ))}
                </View>
                <Button
                  label="Start New Plan"
                  onPress={resetWorkflow}
                  variant="ghost"
                  fullWidth
                  style={{ marginTop: 10 }}
                  icon={<RefreshCw size={12} color={COLORS.accent} />}
                />
              </Card>
            )}
          </View>
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
  resetBtn: { flexDirection: "row", alignItems: "center" },
  resetText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "600" },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  formCard: { marginBottom: 16, padding: 20 },
  formHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(197, 139, 90, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  formTitle: { fontSize: 18, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 6 },
  formSub: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 18 },
  progressCard: { marginBottom: 14, padding: 16 },
  progressHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  progressTitleRow: { flexDirection: "row", alignItems: "center" },
  progressTitle: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  progressPct: { fontSize: 14, fontWeight: "700", color: COLORS.accent },
  progressBar: { height: 5, backgroundColor: COLORS.bgTertiary, borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", backgroundColor: COLORS.accent, borderRadius: 3 },
  progressIdea: { fontSize: 12, color: COLORS.textSecondary, marginTop: 4 },
  agentList: { gap: 8, marginBottom: 14 },
  errorCard: { marginBottom: 14, flexDirection: "row", alignItems: "center", padding: 14 },
  errorText: { fontSize: 13, color: COLORS.red, flex: 1 },
  successCard: { alignItems: "center", padding: 20 },
  successIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(78, 125, 90, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  successTitle: { fontSize: 17, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 6 },
  successSub: { fontSize: 13, color: COLORS.textSecondary, textAlign: "center", marginBottom: 18, lineHeight: 18 },
  actionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, justifyContent: "center", marginBottom: 4 },
  actionBtn: { minWidth: "45%" },
});
