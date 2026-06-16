import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "@/components/ui/Card";
import { COLORS } from "@/constants";

interface LaunchCardProps {
  title: string;
  icon: string;
  items: string[];
  accentColor?: string;
}

export function LaunchCard({
  title,
  icon,
  items,
  accentColor = COLORS.accent,
}: LaunchCardProps) {
  return (
    <Card variant="sm" style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.icon}>{icon}</Text>
        <Text style={styles.title}>{title}</Text>
      </View>
      <View style={styles.list}>
        {items.map((item, i) => (
          <View key={i} style={styles.item}>
            <View style={[styles.dot, { backgroundColor: accentColor }]} />
            <Text style={styles.text}>{item}</Text>
          </View>
        ))}
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 10 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  icon: { fontSize: 18 },
  title: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  list: { gap: 7 },
  item: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 6,
    flexShrink: 0,
  },
  text: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20, flex: 1 },
});
