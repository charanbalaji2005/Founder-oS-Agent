import React, { useState } from "react";
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity, TextInput, Alert, ActivityIndicator, Dimensions, Image, Modal
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuthStore } from "@/store/auth-store";
import { useWorkspaceStore } from "@/store/workspace-store";
import { COLORS, INDUSTRIES, AGENT_CONFIG, AGENT_ORDER } from "@/constants";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { ArrowLeft, Check, Sparkles, Image as ImageIcon, Users, UserPlus, Trash2, Bot, CheckCircle2, Building, ArrowRight } from "lucide-react-native";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";

const LOGO_OPTIONS = ["🏢", "🚀", "💻", "📈", "🎨", "🧠", "⚡", "🧬", "🥗", "🎒", "🛒", "🎯", "🤖", "🔬", "⚖️"];

export default function CreateWorkspaceScreen() {
  const { user } = useAuthStore();
  const { createWorkspace } = useWorkspaceStore();

  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("AI / ML Tools");
  const [selectedLogo, setSelectedLogo] = useState("🏢");
  
  // Custom image picture states
  const [logoUri, setLogoUri] = useState<string | null>(null);
  const [logoBase64, setLogoBase64] = useState<string | null>(null);

  // Step 2: Team Members invites
  const [inviteInput, setInviteInput] = useState("");
  const [invites, setInvites] = useState<string[]>([]);

  // Step 3: Agents
  const [selectedAgents, setSelectedAgents] = useState<string[]>(AGENT_ORDER);

  // Step 4: Loading & Success Popup
  const [loading, setLoading] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [newWorkspace, setNewWorkspace] = useState<any>(null);

  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    type: "success" | "error" | "warning" | "info";
    title: string;
    description: string;
  }>({
    visible: false,
    type: "info",
    title: "",
    description: "",
  });

  const showAlertDialog = (
    type: "success" | "error" | "warning" | "info",
    title: string,
    description: string
  ) => {
    setDialogConfig({ visible: true, type, title, description });
  };

  const selectWorkspacePic = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showAlertDialog("warning", "Permission Denied", "We need camera roll permissions to select a workspace picture.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      const extension = asset.uri.split('.').pop()?.toLowerCase();
      if (extension !== 'jpg' && extension !== 'jpeg' && extension !== 'png') {
        showAlertDialog("error", "Invalid Format", "Please select a JPEG or PNG image format only.");
        return;
      }
      setLogoUri(asset.uri);
      // Store base64 or base64 URL to use as the logo in Drizzle
      setLogoBase64(`data:image/jpeg;base64,${asset.base64}`);
    }
  };

  const addInvite = () => {
    const val = inviteInput.trim();
    if (!val) return;
    if (invites.includes(val)) {
      showAlertDialog("warning", "Duplicate Operator", "This member is already added to the invite list.");
      return;
    }
    setInvites([...invites, val]);
    setInviteInput("");
  };

  const removeInvite = (index: number) => {
    setInvites(invites.filter((_, i) => i !== index));
  };

  const toggleAgent = (agentId: string) => {
    if (selectedAgents.includes(agentId)) {
      if (selectedAgents.length <= 1) {
        showAlertDialog("warning", "Requirement", "At least one AI agent must join the workspace.");
        return;
      }
      setSelectedAgents(selectedAgents.filter((id) => id !== agentId));
    } else {
      setSelectedAgents([...selectedAgents, agentId]);
    }
  };

  const handleNextStep = () => {
    if (step === 1) {
      if (!name.trim()) {
        showAlertDialog("warning", "Input Required", "Please enter a name for your workspace.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setStep(3);
    }
  };

  const handleBackStep = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleCreate = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      // Use custom base64 logo if uploaded, otherwise selected logo emoji
      const finalLogo = logoBase64 || selectedLogo;
      const ws = await createWorkspace(
        user.id,
        name.trim(),
        selectedIndustry,
        finalLogo,
        selectedAgents,
        invites
      );
      setNewWorkspace(ws);
      setLoading(false);
      setShowSuccessModal(true);
    } catch (err: any) {
      setLoading(false);
      showAlertDialog("error", "Error", err.message || "Failed to create workspace.");
    }
  };

  const enterWorkspace = () => {
    setShowSuccessModal(false);
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      {/* Header */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={handleBackStep} style={styles.backBtn}>
          <ArrowLeft size={20} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Step {step} of 3</Text>
      </View>

      {/* Progress Indicator */}
      <View style={styles.progressBarBg}>
        <View style={[styles.progressBarFill, { width: `${(step / 3) * 100}%` }]} />
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {step === 1 && (
          <Animated.View entering={FadeInDown.duration(350)}>
            <Card style={styles.formCard}>
              <View style={styles.formHeaderIcon}>
                <Building size={20} color={COLORS.accent} />
              </View>
              <Text style={styles.formTitle}>Company Details</Text>
              <Text style={styles.formSub}>
                Provide a name, select a logo image or emoji, and define the industry purpose of your workspace.
              </Text>

              {/* Workspace Name */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Company / Workspace Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. FounderOS Headquarters"
                  placeholderTextColor={COLORS.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>

              {/* Logo / Pic Pickers */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Workspace Picture (PNG/JPG Only)</Text>
                <View style={styles.uploadRow}>
                  {logoUri ? (
                    <Image source={{ uri: logoUri }} style={styles.logoImagePreview} />
                  ) : (
                    <View style={styles.logoImagePlaceholder}>
                      <ImageIcon size={24} color={COLORS.textMuted} />
                    </View>
                  )}
                  <TouchableOpacity style={styles.uploadBtn} onPress={selectWorkspacePic}>
                    <Text style={styles.uploadBtnText}>Upload PNG/JPEG</Text>
                  </TouchableOpacity>
                  {logoUri && (
                    <TouchableOpacity style={styles.clearLogoBtn} onPress={() => { setLogoUri(null); setLogoBase64(null); }}>
                      <Text style={styles.clearLogoText}>Clear</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Fallback Emoji Picker */}
              {!logoUri && (
                <View style={styles.fieldGroup}>
                  <Text style={styles.label}>Or Pick an Emoji Icon</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.logoScroll}>
                    {LOGO_OPTIONS.map((logo) => (
                      <TouchableOpacity
                        key={logo}
                        style={[styles.logoBtn, selectedLogo === logo && styles.selectedLogoBtn]}
                        onPress={() => setSelectedLogo(logo)}
                      >
                        <Text style={styles.logoText}>{logo}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Industry Purpose */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Workspace Purpose / Industry</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.indScroll}>
                  {INDUSTRIES.map((ind) => (
                    <TouchableOpacity
                      key={ind}
                      style={[styles.indPill, selectedIndustry === ind && styles.selectedIndPill]}
                      onPress={() => setSelectedIndustry(ind)}
                    >
                      <Text style={[styles.indText, selectedIndustry === ind && styles.selectedIndText]}>{ind}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              <Button
                label="Continue"
                onPress={handleNextStep}
                fullWidth
                size="lg"
                icon={<ArrowRight size={16} color="#fff" />}
              />
            </Card>
          </Animated.View>
        )}

        {step === 2 && (
          <Animated.View entering={FadeInDown.duration(350)}>
            <Card style={styles.formCard}>
              <View style={styles.formHeaderIcon}>
                <Users size={20} color={COLORS.accent} />
              </View>
              <Text style={styles.formTitle}>Invite Team Operators</Text>
              <Text style={styles.formSub}>
                Add email addresses or usernames of colleague operators you wish to invite to this workspace instance.
              </Text>

              {/* Add Member Form */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Add by Username or Email</Text>
                <View style={styles.addMemberRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="e.g. charan or user@gmail.com"
                    placeholderTextColor={COLORS.textMuted}
                    value={inviteInput}
                    onChangeText={setInviteInput}
                    autoCapitalize="none"
                  />
                  <TouchableOpacity style={styles.plusBtn} onPress={addInvite}>
                    <UserPlus size={20} color="#fff" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Invited Members List */}
              <View style={styles.fieldGroup}>
                <Text style={styles.label}>Operators to Invite ({invites.length})</Text>
                {invites.length === 0 ? (
                  <Text style={styles.emptyText}>No initial team members added yet. Colleagues can also join later.</Text>
                ) : (
                  <ScrollView style={styles.invitesScroll} nestedScrollEnabled>
                    {invites.map((inv, idx) => (
                      <View key={idx} style={styles.inviteItem}>
                        <View style={styles.inviteItemAvatar}>
                          <Text style={styles.inviteItemAvatarText}>{inv[0].toUpperCase()}</Text>
                        </View>
                        <Text style={styles.inviteItemText} numberOfLines={1}>{inv}</Text>
                        <TouchableOpacity onPress={() => removeInvite(idx)} style={styles.trashBtn}>
                          <Trash2 size={16} color={COLORS.red} />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                )}
              </View>

              <Button
                label="Continue"
                onPress={handleNextStep}
                fullWidth
                size="lg"
                icon={<ArrowRight size={16} color="#fff" />}
              />
            </Card>
          </Animated.View>
        )}

        {step === 3 && (
          <Animated.View entering={FadeInDown.duration(350)}>
            <Card style={styles.formCard}>
              <View style={styles.formHeaderIcon}>
                <Bot size={20} color={COLORS.accent} />
              </View>
              <Text style={styles.formTitle}>Initialize AI Agents</Text>
              <Text style={styles.formSub}>
                Toggle which specialized AI agents are active in this workspace chat rooms.
              </Text>

              <View style={styles.agentGrid}>
                {AGENT_ORDER.map((id) => {
                  const agent = (AGENT_CONFIG as any)[id];
                  const isActive = selectedAgents.includes(id);
                  return (
                    <TouchableOpacity
                      key={id}
                      style={[styles.agentRow, isActive && styles.activeAgentRow]}
                      onPress={() => toggleAgent(id)}
                    >
                      <View style={[styles.agentColorBox, { backgroundColor: agent.color }]}>
                        <Text style={styles.agentInit}>{agent.label[0]}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.agentName}>{agent.label}</Text>
                        <Text style={styles.agentDesc} numberOfLines={1}>{agent.description}</Text>
                      </View>
                      <View style={[styles.checkbox, isActive && styles.checkboxActive]}>
                        {isActive && <Check size={12} color="#fff" />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <Button
                label={loading ? "Provisioning..." : "Provision AI Workspace"}
                onPress={handleCreate}
                fullWidth
                size="lg"
                disabled={loading}
                icon={loading ? <ActivityIndicator size="small" color="#fff" /> : <Sparkles size={16} color="#fff" />}
              />
            </Card>
          </Animated.View>
        )}
      </ScrollView>

      {/* Success Modal Popup */}
      <Modal visible={showSuccessModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInUp.duration(400)} style={styles.modalContent}>
            <View style={styles.successIconBox}>
              <CheckCircle2 size={44} color="#10B981" />
            </View>
            <Text style={styles.modalTitleText}>Workspace Provisioned!</Text>
            <Text style={styles.modalSubText}>
              Your company workspace "{name}" has been successfully configured with {selectedAgents.length} AI agents and invitations queued for {invites.length} human team members.
            </Text>

            <TouchableOpacity style={styles.enterBtn} onPress={enterWorkspace}>
              <Text style={styles.enterBtnText}>Launch Workspace</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>

      <Dialog
        visible={dialogConfig.visible}
        onClose={() => setDialogConfig(prev => ({ ...prev, visible: false }))}
        type={dialogConfig.type}
        title={dialogConfig.title}
        description={dialogConfig.description}
      />
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
  },
  backBtn: { padding: 4, marginRight: 12 },
  topTitle: { fontSize: 16, fontWeight: "800", color: COLORS.textSecondary },
  progressBarBg: { height: 4, backgroundColor: COLORS.bgQuaternary, width: "100%" },
  progressBarFill: { height: "100%", backgroundColor: COLORS.accent },
  scroll: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  formCard: { padding: 20, gap: 20 },
  formHeaderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  formTitle: { fontSize: 22, fontWeight: "900", color: COLORS.textPrimary },
  formSub: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  fieldGroup: { gap: 8, marginVertical: 4 },
  label: { fontSize: 12, fontWeight: "800", color: COLORS.textSecondary, textTransform: "uppercase", letterSpacing: 0.5 },
  input: {
    height: 52,
    backgroundColor: COLORS.bgSecondary,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.bgQuaternary,
    paddingHorizontal: 16,
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: "600",
  },
  uploadRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoImagePreview: { width: 52, height: 52, borderRadius: 14 },
  logoImagePlaceholder: { width: 52, height: 52, borderRadius: 14, backgroundColor: COLORS.bgSecondary, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: COLORS.bgQuaternary },
  uploadBtn: { paddingHorizontal: 16, height: 44, borderRadius: 12, backgroundColor: COLORS.bgSecondary, borderWidth: 1, borderColor: COLORS.bgQuaternary, justifyContent: "center", alignItems: "center" },
  uploadBtnText: { fontSize: 13, color: COLORS.textPrimary, fontWeight: "700" },
  clearLogoBtn: { paddingHorizontal: 12, height: 44, justifyContent: "center", alignItems: "center" },
  clearLogoText: { fontSize: 13, color: COLORS.red, fontWeight: "700" },
  logoScroll: { gap: 8, paddingVertical: 4 },
  logoBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.bgQuaternary,
    justifyContent: "center",
    alignItems: "center",
  },
  selectedLogoBtn: {
    borderColor: COLORS.accent,
    backgroundColor: COLORS.bgTertiary,
    borderWidth: 2,
  },
  logoText: { fontSize: 20 },
  indScroll: { gap: 8, paddingVertical: 4 },
  indPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.bgQuaternary,
  },
  selectedIndPill: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },
  indText: { fontSize: 13, color: COLORS.textSecondary, fontWeight: "700" },
  selectedIndText: { color: COLORS.bgPrimary },

  addMemberRow: { flexDirection: "row", gap: 10, alignItems: "center" },
  plusBtn: { width: 52, height: 52, borderRadius: 14, backgroundColor: COLORS.accent, justifyContent: "center", alignItems: "center" },
  emptyText: { fontSize: 13, color: COLORS.textMuted, lineHeight: 18, fontStyle: "italic" },
  invitesScroll: { maxHeight: 200, gap: 8 },
  inviteItem: { flexDirection: "row", alignItems: "center", gap: 12, padding: 10, borderRadius: 12, backgroundColor: COLORS.bgSecondary, borderWidth: 1, borderColor: COLORS.bgQuaternary, marginVertical: 3 },
  inviteItemAvatar: { width: 32, height: 32, borderRadius: 8, backgroundColor: COLORS.bgQuaternary, justifyContent: "center", alignItems: "center" },
  inviteItemAvatarText: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary },
  inviteItemText: { flex: 1, fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  trashBtn: { padding: 4 },

  agentGrid: { gap: 10, marginVertical: 6 },
  agentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 14,
    backgroundColor: COLORS.bgSecondary,
    borderWidth: 1,
    borderColor: COLORS.bgQuaternary,
  },
  activeAgentRow: {
    borderColor: "rgba(0,0,0,0.12)",
  },
  agentColorBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  agentInit: { color: "#fff", fontWeight: "900", fontSize: 16 },
  agentName: { fontSize: 14, fontWeight: "800", color: COLORS.textPrimary },
  agentDesc: { fontSize: 11, color: COLORS.textMuted, marginTop: 2, fontWeight: "500" },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: COLORS.bgQuaternary,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxActive: {
    backgroundColor: COLORS.accent,
    borderColor: COLORS.accent,
  },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0, 0, 0, 0.6)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { backgroundColor: "#fff", borderRadius: 28, padding: 28, width: "100%", maxWidth: 360, alignItems: "center", gap: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.15, shadowRadius: 20, elevation: 10 },
  successIconBox: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#ECFDF5", justifyContent: "center", alignItems: "center", marginBottom: 8 },
  modalTitleText: { fontSize: 20, fontWeight: "900", color: COLORS.textPrimary },
  modalSubText: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center", lineHeight: 20 },
  enterBtn: { width: "100%", height: 52, borderRadius: 16, backgroundColor: COLORS.accent, justifyContent: "center", alignItems: "center", marginTop: 8 },
  enterBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
