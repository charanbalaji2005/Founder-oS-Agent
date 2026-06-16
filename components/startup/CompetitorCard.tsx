import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "@/components/ui/Card";
import { COLORS } from "@/constants";

interface CompetitorCardProps {
  name: string;
  description?: string;
  strengths: string[];
  weaknesses: string[];
  pricing?: string;
  index: number;
}

const CARD_COLORS = [
  COLORS.accent,
  COLORS.pink,
  COLORS.teal,
  COLORS.amber,
  COLORS.green,
];

export function CompetitorCard({
  name,
  description,
  strengths,
  weaknesses,
  pricing,
  index,
}: CompetitorCardProps) {
  const color = CARD_COLORS[index % CARD_COLORS.length];

  return (
    <Card variant="sm" style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: color + "22" }]}>
          <Text style={[styles.avatarText, { color }]}>
            {name.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.name}>{name}</Text>
          {description && (
            <Text style={styles.description} numberOfLines={2}>
              {description}
            </Text>
          )}
        </View>
        {pricing && (
          <View style={[styles.pricingBadge, { borderColor: color + "44" }]}>
            <Text style={[styles.pricingText, { color }]}>{pricing}</Text>
          </View>
        )}
      </View>

      <View style={styles.grid}>
        <View style={styles.col}>
          <Text style={[styles.colLabel, { color: COLORS.green }]}>✦ Strengths</Text>
          {strengths.map((s, i) => (
            <Text key={i} style={styles.bullet}>
              • {s}
            </Text>
          ))}
        </View>
        <View style={[styles.col, styles.colRight]}>
          <Text style={[styles.colLabel, { color: COLORS.red }]}>✦ Weaknesses</Text>
          {weaknesses.map((w, i) => (
            <Text key={i} style={styles.bullet}>
              • {w}
            </Text>
          ))}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 14,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  avatarText: { fontSize: 17, fontWeight: "700" },
  headerText: { flex: 1 },
  name: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  description: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2, lineHeight: 17 },
  pricingBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    flexShrink: 0,
  },
  pricingText: { fontSize: 11, fontWeight: "600" },
  grid: { flexDirection: "row", gap: 12 },
  col: { flex: 1 },
  colRight: {
    borderLeftWidth: 1,
    borderLeftColor: COLORS.borderSecondary,
    paddingLeft: 12,
  },
  colLabel: { fontSize: 11, fontWeight: "700", marginBottom: 6, letterSpacing: 0.03 },
  bullet: { fontSize: 12, color: COLORS.textSecondary, lineHeight: 18, marginBottom: 2 },
});
