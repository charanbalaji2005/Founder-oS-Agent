import React, { useState, useRef, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, Modal,
  TextInput, ScrollView, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert
} from "react-native";
import { X, Send, Sparkles, HelpCircle, Bot } from "lucide-react-native";
import { COLORS, GROQ_MODELS, BACKEND_URL } from "@/constants";
import { Card } from "@/components/ui/Card";
import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat-store";

const EXAMPLE_QUERIES = [
  "How should I structure my pricing?",
  "Suggest a marketing channel for a B2B SaaS.",
  "What is a good success metric for an MVP?",
  "How can I validate my startup idea quickly?"
];

export function CoFounderChat() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuthStore();
  const { messages, fetchWorkspaceMessages, sendMessage } = useChatStore();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (isOpen && user?.id) {
      fetchWorkspaceMessages("founder_startup_workspace", "founder_chat_bot");
    }
  }, [isOpen, user?.id]);

  useEffect(() => {
    setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const handleSend = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || !user?.id) return;

    setInput("");
    await sendMessage({
      workspaceId: "founder_startup_workspace",
      channelId: "founder_chat_bot",
      userId: user.id,
      role: "user",
      content: trimmed
    });
    setLoading(true);

    try {
      const systemPrompt = "You are FounderOS AI, a world-class startup co-founder, product strategist, and venture builder. Answer the founder's questions with actionable, strategic, and concise insights.";
      
      const res = await fetch(`${BACKEND_URL}/api/agents/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: GROQ_MODELS.PRIMARY,
          messages: [
            { role: "system", content: systemPrompt },
            ...messages.slice(-5).map(m => ({ role: m.role, content: m.content })),
            { role: "user", content: trimmed }
          ]
        })
      });

      const data = await res.json();
      await sendMessage({
        workspaceId: "founder_startup_workspace",
        channelId: "founder_chat_bot",
        role: "assistant",
        content: data.content || "Thinking..."
      });
    } catch (err) {
      Alert.alert("AI Error", "Failed to reach AI.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <TouchableOpacity style={styles.floatingBtn} onPress={() => setIsOpen(true)}>
        <Sparkles size={18} color="#fff" style={{ marginRight: 6 }} />
        <Text style={styles.floatingBtnText}>Ask FounderOS</Text>
      </TouchableOpacity>

      <Modal visible={isOpen} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.modalContent}>
            <View style={styles.chatHeader}>
              <View style={styles.headerTitleRow}>
                <View style={styles.avatarIcon}><Sparkles size={16} color="#fff" /></View>
                <View>
                  <Text style={styles.chatTitle}>FounderOS AI</Text>
                  <Text style={styles.chatSubTitle}>Your AI Co-Founder · Online</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setIsOpen(false)}><X size={20} color="#111827" /></TouchableOpacity>
            </View>

            <ScrollView ref={scrollViewRef} style={styles.messagesScroll} contentContainerStyle={styles.messagesContent}>
              {messages.length === 0 && (
                <View style={styles.examplesContainer}>
                  <HelpCircle size={32} color="#E5E7EB" style={{ marginBottom: 12 }} />
                  <Text style={styles.examplesTitle}>Try asking these:</Text>
                  {EXAMPLE_QUERIES.map((q) => (
                    <TouchableOpacity key={q} style={styles.examplePill} onPress={() => handleSend(q)}>
                      <Text style={styles.exampleText}>{q}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {messages.map((msg, i) => (
                <View key={i} style={[styles.messageBubble, msg.role === "user" ? styles.userBubble : styles.assistantBubble]}>
                  <Text style={[styles.messageText, msg.role === "user" ? styles.userMessageText : styles.assistantMessageText]}>
                    {msg.content}
                  </Text>
                </View>
              ))}

              {loading && (
                <View style={[styles.messageBubble, styles.assistantBubble, styles.loadingRow]}>
                  <ActivityIndicator size="small" color="#111827" />
                  <Text style={[styles.messageText, styles.assistantMessageText, { marginLeft: 8 }]}>Thinking...</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.inputBar}>
              <TextInput
                style={styles.chatInput}
                placeholder="Ask a question..."
                value={input}
                onChangeText={setInput}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]}
                onPress={() => handleSend(input)}
                disabled={!input.trim() || loading}
              >
                <Send size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  floatingBtn: {
    position: "absolute", bottom: 24, right: 20, flexDirection: "row", alignItems: "center",
    backgroundColor: "#111827", paddingHorizontal: 16, paddingVertical: 12, borderRadius: 24,
    shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 6,
  },
  floatingBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContent: { height: "80%", backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, width: "100%", maxWidth: 600, alignSelf: "center" },
  chatHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 20, borderBottomWidth: 1, borderBottomColor: "#F3F4F6" },
  headerTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatarIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: "#111827", alignItems: "center", justifyContent: "center" },
  chatTitle: { fontSize: 15, fontWeight: "700", color: "#111827" },
  chatSubTitle: { fontSize: 11, color: "#10B981", fontWeight: "500" },
  messagesScroll: { flex: 1 },
  messagesContent: { padding: 20, gap: 12 },
  messageBubble: { maxWidth: "80%", borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12 },
  userBubble: { alignSelf: "flex-end", backgroundColor: "#111827" },
  assistantBubble: { alignSelf: "flex-start", backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB" },
  messageText: { fontSize: 14, lineHeight: 20 },
  userMessageText: { color: "#fff" },
  assistantMessageText: { color: "#111827" },
  loadingRow: { flexDirection: "row", alignItems: "center" },
  examplesContainer: { alignItems: 'center', marginTop: 40, gap: 10 },
  examplesTitle: { fontSize: 13, fontWeight: "700", color: "#6B7280", marginBottom: 10 },
  examplePill: { backgroundColor: "#F9FAFB", borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 12, width: '100%' },
  exampleText: { fontSize: 13, color: "#111827", fontWeight: "600", textAlign: 'center' },
  inputBar: { flexDirection: "row", alignItems: "center", padding: 16, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  chatInput: { flex: 1, height: 44, backgroundColor: "#F9FAFB", borderRadius: 22, paddingHorizontal: 16, marginRight: 10, borderWidth: 1, borderColor: "#E5E7EB" },
  sendBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#111827", alignItems: "center", justifyContent: "center" },
  sendBtnDisabled: { opacity: 0.4 },
});
