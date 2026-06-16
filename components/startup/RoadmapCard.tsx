import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { COLORS } from "@/constants";

interface RoadmapCardProps {
  phase: number;
  title: string;
  days: string;
  tasks: string[];
  color: string;
  bg: string;
  isExpanded: boolean;
  onToggle: () => void;
}

export function RoadmapCard({
  phase,
  title,
  days,
  tasks,
  color,
  bg,
  isExpanded,
  onToggle,
}: RoadmapCardProps) {
  return (
    <View style={[styles.card, { borderColor: color + "44" }]}>
      <TouchableOpacity
        onPress={onToggle}
        style={styles.header}
        activeOpacity={0.75}
      >
        <View style={[styles.phaseBadge, { backgroundColor: bg }]}>
          <Text style={[styles.phaseNum, { color }]}>Phase {phase}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{title}</Text>
          <Text style={[styles.days, { color }]}>{days}</Text>
        </View>
        <Text style={styles.toggle}>{isExpanded ? "▲" : "▼"}</Text>
      </TouchableOpacity>

      {isExpanded && tasks.length > 0 && (
        <View style={styles.tasks}>
          {tasks.map((task, i) => (
            <View key={i} style={styles.taskRow}>
              <View style={[styles.taskDot, { backgroundColor: color }]} />
              <Text style={styles.taskText}>{task}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  phaseBadge: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  phaseNum: { fontSize: 12, fontWeight: "700" },
  headerText: { flex: 1 },
  title: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  days: { fontSize: 12, marginTop: 2 },
  toggle: { fontSize: 12, color: COLORS.textMuted },
  tasks: {
    paddingHorizontal: 16,
    paddingBottom: 14,
    gap: 8,
  },
  taskRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  taskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  taskText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, flex: 1 },
});
