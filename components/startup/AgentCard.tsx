import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Loader } from "@/components/ui/Loader";
import { AGENT_CONFIG, COLORS, MODEL_LABELS } from "@/constants";
import type { AgentId, AgentStatus } from "@/types";
import {
  Check, AlertTriangle, Clock,
  Crown, Briefcase, Search, Code, Megaphone, Calendar, Wrench, Headset,
  Scale, PieChart, Cpu, Sparkles
} from "lucide-react-native";

interface AgentCardProps {
  agentId: AgentId;
  status: AgentStatus;
  error?: string;
}

const getAgentIcon = (id: AgentId) => {
  switch (id) {
    case "founder": return Crown;
    case "ceo": return Briefcase;
    case "research": return Search;
    case "coding": return Code;
    case "marketing": return Megaphone;
    case "manager": return Calendar;
    case "employee": return Wrench;
    case "customer_service": return Headset;
    case "legal": return Scale;
    case "financial": return PieChart;
    case "operations": return Cpu;
    case "creative": return Sparkles;
    default: return Search;
  }
};

export function AgentCard({ agentId, status, error }: AgentCardProps) {
  const config = AGENT_CONFIG[agentId];
  const IconComponent = getAgentIcon(agentId);

  return (
    <View
      style={[
        styles.card,
        status === "running" && styles.active,
        status === "done" && styles.done,
        status === "error" && styles.errored,
      ]}
    >
      <View style={[styles.iconBox, { backgroundColor: config.color + "22" }]}>
        <IconComponent size={18} color={config.color} />
      </View>
      <View style={styles.content}>
        <Text style={styles.name}>{config.label}</Text>
        <Text style={styles.desc}>
          {status === "running"
            ? `Analyzing with ${MODEL_LABELS[config.model]}...`
            : status === "done"
            ? "Complete"
            : status === "error"
            ? error || "Failed"
            : "Waiting in pipeline..."}
        </Text>
      </View>
      <View style={styles.statusBox}>
        {status === "running" ? (
          <Loader size={18} color={config.color} />
        ) : status === "done" ? (
          <Check size={16} color={COLORS.green} />
        ) : status === "error" ? (
          <AlertTriangle size={16} color={COLORS.red} />
        ) : (
          <Clock size={16} color={COLORS.textMuted} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.borderSecondary,
    padding: 14,
  },
  active: {
    borderColor: COLORS.accent,
    backgroundColor: "rgba(197, 139, 90, 0.07)",
  },
  done: {
    borderColor: "rgba(78, 125, 90, 0.3)",
    backgroundColor: "rgba(78, 125, 90, 0.04)",
  },
  errored: {
    borderColor: "rgba(184, 78, 78, 0.3)",
    backgroundColor: "rgba(184, 78, 78, 0.04)",
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  content: { flex: 1 },
  name: { fontSize: 13, fontWeight: "600", color: COLORS.textPrimary, marginBottom: 2 },
  desc: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 17 },
  statusBox: { alignItems: "center", justifyContent: "center", width: 24 },
});
