import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { COLORS } from "@/constants";

interface ResultViewerProps {
  content: string;
}

/**
 * Parses and renders AI-generated markdown content
 * Handles: # headings, ## subheadings, - bullets, **bold**, plain text
 */
export function ResultViewer({ content }: ResultViewerProps) {
  const lines = content.split("\n");

  return (
    <View style={styles.container}>
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <View key={i} style={styles.spacer} />;

        if (trimmed.startsWith("## ")) {
          return (
            <Text key={i} style={styles.h2}>
              {trimmed.slice(3)}
            </Text>
          );
        }
        if (trimmed.startsWith("# ")) {
          return (
            <Text key={i} style={styles.h1}>
              {trimmed.slice(2)}
            </Text>
          );
        }
        if (trimmed.startsWith("### ")) {
          return (
            <Text key={i} style={styles.h3}>
              {trimmed.slice(4)}
            </Text>
          );
        }
        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          return (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.bulletDot}>▸</Text>
              <Text style={styles.bulletText}>
                {renderInline(trimmed.slice(2))}
              </Text>
            </View>
          );
        }
        if (/^\d+\.\s/.test(trimmed)) {
          const num = trimmed.match(/^(\d+)\.\s/)?.[1] ?? "";
          return (
            <View key={i} style={styles.bulletRow}>
              <Text style={styles.numDot}>{num}.</Text>
              <Text style={styles.bulletText}>
                {renderInline(trimmed.replace(/^\d+\.\s/, ""))}
              </Text>
            </View>
          );
        }

        return (
          <Text key={i} style={styles.body}>
            {renderInline(trimmed)}
          </Text>
        );
      })}
    </View>
  );
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Text key={i} style={styles.bold}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    return part;
  });
}

const styles = StyleSheet.create({
  container: { gap: 2 },
  spacer: { height: 8 },
  h1: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 14,
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  h2: {
    fontSize: 15,
    fontWeight: "700",
    color: COLORS.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  h3: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.accentLight,
    marginTop: 8,
    marginBottom: 2,
  },
  body: {
    fontSize: 13.5,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  bold: {
    fontWeight: "700",
    color: COLORS.textPrimary,
  },
  bulletRow: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
  },
  bulletDot: {
    color: COLORS.accentLight,
    fontSize: 13,
    marginTop: 1,
    flexShrink: 0,
  },
  numDot: {
    color: COLORS.accentLight,
    fontSize: 13,
    fontWeight: "600",
    flexShrink: 0,
    minWidth: 20,
  },
  bulletText: {
    flex: 1,
    fontSize: 13.5,
    color: COLORS.textSecondary,
    lineHeight: 21,
  },
});
