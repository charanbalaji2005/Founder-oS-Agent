import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from "react-native";
import { Controller, Control } from "react-hook-form";
import { Input } from "@/components/ui/Input";
import { INDUSTRIES, QUICK_IDEAS, COLORS } from "@/constants";
import type { StartupIdeaFormData } from "@/types";

interface IdeaInputProps {
  control: Control<StartupIdeaFormData>;
  errors: Partial<Record<keyof StartupIdeaFormData, { message?: string }>>;
  onQuickFill: (idea: string) => void;
}

const RISK_OPTIONS = ["Conservative", "Moderate", "Aggressive"];
const TIMELINE_OPTIONS = ["30 Days", "90 Days", "180 Days"];

export function IdeaInput({ control, errors, onQuickFill }: IdeaInputProps) {
  return (
    <View>
      {/* Quick Ideas */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Quick Start Ideas</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.chipRow}>
            {QUICK_IDEAS.map((idea) => (
              <TouchableOpacity
                key={idea}
                onPress={() => onQuickFill(idea)}
                style={styles.chip}
                activeOpacity={0.7}
              >
                <Text style={styles.chipText}>{idea}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      {/* Idea Field */}
      <Controller
        control={control}
        name="idea"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Startup Idea *"
            placeholder="Describe your startup idea in detail. What problem does it solve and for whom?"
            multiline
            numberOfLines={4}
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            error={errors.idea?.message}
          />
        )}
      />

      {/* Industry */}
      <Controller
        control={control}
        name="industry"
        render={({ field: { onChange, value } }) => (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Industry *</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.chipRow}>
                {INDUSTRIES.map((ind) => (
                  <TouchableOpacity
                    key={ind}
                    onPress={() => onChange(ind)}
                    style={[
                      styles.chip,
                      value === ind && styles.chipSelected,
                    ]}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        value === ind && styles.chipTextSelected,
                      ]}
                    >
                      {ind}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            {errors.industry?.message && (
              <Text style={styles.error}>{errors.industry.message}</Text>
            )}
          </View>
        )}
      />

      {/* Target Users */}
      <Controller
        control={control}
        name="targetUsers"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Target Users *"
            placeholder="e.g. Busy professionals aged 25–40 who want to stay fit..."
            onChangeText={onChange}
            onBlur={onBlur}
            value={value}
            error={errors.targetUsers?.message}
          />
        )}
      />

      {/* Risk Appetite */}
      <Controller
        control={control}
        name="riskAppetite"
        render={({ field: { onChange, value } }) => (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Risk Appetite *</Text>
            <View style={styles.segmentedControl}>
              {RISK_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => onChange(option)}
                  style={[
                    styles.segmentButton,
                    value === option && styles.segmentButtonSelected,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      value === option && styles.segmentTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      />

      {/* Timeline */}
      <Controller
        control={control}
        name="timeline"
        render={({ field: { onChange, value } }) => (
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Timeline *</Text>
            <View style={styles.segmentedControl}>
              {TIMELINE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => onChange(option)}
                  style={[
                    styles.segmentButton,
                    value === option && styles.segmentButtonSelected,
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      value === option && styles.segmentTextSelected,
                    ]}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 18 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 12,
    fontWeight: "700",
    color: COLORS.textSecondary,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldGroup: { marginBottom: 18 },
  chipRow: { flexDirection: "row", gap: 7, paddingBottom: 4 },
  chip: {
    backgroundColor: COLORS.bgTertiary,
    borderWidth: 1,
    borderColor: COLORS.borderPrimary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipSelected: {
    backgroundColor: "rgba(197, 139, 90, 0.15)",
    borderColor: COLORS.accent,
  },
  chipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "500" },
  chipTextSelected: { color: COLORS.accent, fontWeight: "700" },
  error: { fontSize: 12, color: COLORS.red, marginTop: 5 },
  segmentedControl: {
    flexDirection: "row",
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.borderPrimary,
    borderRadius: 10,
    padding: 3,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 8,
  },
  segmentButtonSelected: {
    backgroundColor: COLORS.accent,
  },
  segmentText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  segmentTextSelected: {
    color: COLORS.bgPrimary,
    fontWeight: "700",
  },
});
