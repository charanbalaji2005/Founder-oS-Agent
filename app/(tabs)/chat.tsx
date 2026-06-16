import React, { useState, useEffect, useRef } from "react";
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ActivityIndicator, Alert, Image as RNImage,
  Dimensions, FlatList, Modal
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth-store";
import { useChatStore } from "@/store/chat-store";
import { useWorkspaceStore, Workspace } from "@/store/workspace-store";
import { useChannelStore } from "@/store/channel-store";
import { AGENT_CONFIG, BACKEND_URL } from "@/constants";
import {
  Send, Bot, BrainCircuit, Image as ImageIcon, X,
  MoreVertical, GitBranch, Volume2, Users, Settings, Plus,
  ChevronDown, Crown, Briefcase, Search, Code, Megaphone, Calendar, Wrench, Headphones,
  CheckCircle2, AlertCircle, Hash, MessageSquare, Terminal, Mic, Command,
  LogOut, Shield, UserPlus, Zap, Microscope, PieChart, Cpu, Sparkles, Scale,
  AudioLines, Paperclip, ChevronRight, Activity, Clock, Circle, Copy, ThumbsUp, ThumbsDown, Share2, RotateCcw
} from "lucide-react-native";
import Animated, { FadeIn, FadeInDown, SlideInDown } from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import Markdown from "react-native-markdown-display";
import { useLocalSearchParams, router } from "expo-router";
import * as Clipboard from "expo-clipboard";
import { Trash2 } from "lucide-react-native";

const AGENT_ICONS: Record<string, any> = {
  founder: Crown,
  ceo: Briefcase,
  research: Search,
  coding: Code,
  marketing: Megaphone,
  manager: Calendar,
  employee: Wrench,
  customer_service: Headphones,
  legal: Scale,
  financial: PieChart,
  operations: Cpu,
  creative: Sparkles
};

const SLASH_COMMANDS = [
  { cmd: "/create-project", label: "Create a new project", icon: Plus },
  { cmd: "/create-roadmap", label: "Generate workspace roadmap", icon: Calendar },
  { cmd: "/research-market", label: "Analyze competitors & market", icon: Search },
  { cmd: "/generate-code", label: "Build MVP architecture", icon: Code },
  { cmd: "/create-campaign", label: "Launch marketing drive", icon: Megaphone },
  { cmd: "/financial-model", label: "Generate burn rate projections", icon: PieChart },
  { cmd: "/legal-audit", label: "Review compliance & privacy", icon: Scale },
];

export default function CollaborativeOSChat() {
  const params = useLocalSearchParams();
  const { user } = useAuthStore();
  const { activeWorkspace, workspaces, fetchWorkspaces, setActiveWorkspace, members, fetchMembers } = useWorkspaceStore();
  const { channels, activeChannel, fetchChannels, setActiveChannel } = useChannelStore();
  const { messages, isLoading, typingStatus, fetchWorkspaceMessages, sendMessage, setTypingStatus } = useChatStore();

  const [input, setInput] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert("Permission Denied", "We need camera roll permissions to select images.");
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
        Alert.alert("Invalid Format", "Please select a JPEG or PNG image format only.");
        return;
      }
      setSelectedImage(asset.base64 || null);
      setSelectedImageUri(asset.uri || null);
    }
  };
  const [generating, setGenerating] = useState(false);
  const [mentionMenuVisible, setMentionMenuVisible] = useState(false);
  const [commandMenuVisible, setCommandMenuVisible] = useState(false);
  const [showWSPicker, setShowWSPicker] = useState(false);
  const [showMembers, setShowMembers] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchQueryResults] = useState<any[]>([]);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    fetchSuggestedUsers();
  }, []);

  const fetchSuggestedUsers = async () => {
    try {
      // Fetch some recent users as suggestions
      const res = await fetch(`${BACKEND_URL}/api/workspaces/search-users?query=`);
      const data = await res.json();
      if (Array.isArray(data)) setSuggestedUsers(data.slice(0, 5));
    } catch (e) {}
  };

  useEffect(() => {
    if (user?.id) fetchWorkspaces(user.id);
  }, [user?.id]);

  useEffect(() => {
    if (activeWorkspace?.id) {
      fetchChannels(activeWorkspace.id);
      fetchMembers(activeWorkspace.id);
    }
  }, [activeWorkspace?.id]);

  useEffect(() => {
    if (activeWorkspace?.id && activeChannel?.id) {
      fetchWorkspaceMessages(activeWorkspace.id, activeChannel.id);
    }
  }, [activeWorkspace?.id, activeChannel?.id]);

  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages, typingStatus]);

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchQueryResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/workspaces/search-users?query=${searchQuery}`);
        const data = await res.json();
        if (Array.isArray(data)) setSearchQueryResults(data);
      } catch (e) {}
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSend = async (overrideText?: string) => {
    const textToSend = (overrideText || input).trim();
    if ((!textToSend && !selectedImage) || generating || !user?.id || !activeWorkspace?.id || !activeChannel?.id) return;

    const lowerText = textToSend.toLowerCase();
    const mentions = Object.keys(AGENT_CONFIG).filter(key =>
      lowerText.includes(`@${key}`) ||
      lowerText.includes(`@${key}agent`)
    );

    setInput("");
    setSelectedImage(null);
    setSelectedImageUri(null);
    setGenerating(true);

    // Simulate agent thinking feedback
    if (mentions.length > 0) {
       const a = (AGENT_CONFIG as any)[mentions[0]];
       const statuses = ["thinking", "researching", "planning", "analyzing context"];
       const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
       setTypingStatus({ name: a?.label || "Agent", agentId: mentions[0], status: randomStatus });
    } else if (textToSend.startsWith('/')) {
       setTypingStatus({ name: "Founder Agent", agentId: "founder", status: "executing command" });
    } else {
       setTypingStatus({ name: user.name || "Founder", status: "transmitting" });
    }

    try {
      await sendMessage({
        workspaceId: activeWorkspace.id,
        channelId: activeChannel.id,
        userId: user.id,
        role: "user",
        content: textToSend || "Analyzed an image.",
        mediaUrl: selectedImage || undefined,
        mentions,
      });
    } catch (err) {
      Alert.alert("Error", "Message transmission failed.");
    } finally {
      setGenerating(false);
      setTypingStatus(null);
    }
  };

  const handleCopy = async (text: string) => {
    await Clipboard.setStringAsync(text);
    Alert.alert("Copied", "Content copied to executive clipboard.");
  };

  const promoteToAdmin = async (targetUserId: string) => {
    if (activeWorkspace?.role !== 'owner') return;
    try {
      await fetch(`${BACKEND_URL}/api/workspaces/${activeWorkspace.id}/members/${targetUserId}/role`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'admin' })
      });
      fetchMembers(activeWorkspace.id);
      Alert.alert("Success", "User promoted to Executive Admin.");
    } catch (e) {}
  };

  const removeMember = async (targetUserId: string) => {
    if (activeWorkspace?.role !== 'owner' && activeWorkspace?.role !== 'admin') return;
    Alert.alert(
      "Remove Member",
      "Are you sure you want to terminate this member's access?",
      [
        { text: "Cancel", style: 'cancel' },
        { text: "Remove", style: 'destructive', onPress: async () => {
          try {
            await fetch(`${BACKEND_URL}/api/workspaces/${activeWorkspace.id}/members/${targetUserId}`, {
              method: 'DELETE'
            });
            fetchMembers(activeWorkspace.id);
          } catch (e) {}
        }}
      ]
    );
  };

  const handleMessageAction = async (msgId: string, action: string) => {
    try {
      await fetch(`${BACKEND_URL}/api/agents/chat/messages/${msgId}/action`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });
      useChatStore.setState((s) => ({
        messages: s.messages.map(m => m.id === msgId ? { ...m, feedback: action } : m)
      }));
      if (action === 'like' || action === 'dislike') {
        Alert.alert("Feedback Received", "Thank you for helping train our agents.");
      }
    } catch (e) {}
  };

  const handleLeaveWS = async () => {
    if (!activeWorkspace?.id || !user?.id) return;
    Alert.alert(
      "Leave Workspace",
      "Are you sure you want to leave this company instance?",
      [
        { text: "Cancel", style: 'cancel' },
        { text: "Leave", style: 'destructive', onPress: async () => {
          try {
            const { leaveWorkspace } = useWorkspaceStore.getState();
            await leaveWorkspace(activeWorkspace.id, user.id);
            setShowMembers(false);
            Alert.alert("Success", "You have left the workspace.");
          } catch (e) {
            Alert.alert("Error", "Failed to leave workspace.");
          }
        }}
      ]
    );
  };

  const handleDeleteWS = async () => {
    if (!activeWorkspace?.id || !user?.id) return;
    Alert.alert(
      "Delete Workspace",
      "Are you sure you want to permanently delete this workspace? All data will be lost.",
      [
        { text: "Cancel", style: 'cancel' },
        { text: "Delete", style: 'destructive', onPress: async () => {
          try {
            const { deleteWorkspace } = useWorkspaceStore.getState();
            await deleteWorkspace(activeWorkspace.id, user.id);
            setShowMembers(false);
            Alert.alert("Success", "Workspace deleted successfully.");
          } catch (e) {
            Alert.alert("Error", "Failed to delete workspace.");
          }
        }}
      ]
    );
  };

  const handleRegenerate = async (msgId: string) => {
    if (generating || !activeWorkspace?.id || !activeChannel?.id) return;
    setGenerating(true);
    setTypingStatus({ name: "Founder Agent", agentId: "founder", status: "regenerating response" });
    try {
      const res = await fetch(`${BACKEND_URL}/api/agents/chat/messages/${msgId}/regenerate`, {
        method: "POST"
      });
      if (res.ok) {
        await fetchWorkspaceMessages(activeWorkspace.id, activeChannel.id);
      } else {
        Alert.alert("Error", "Failed to regenerate response.");
      }
    } catch (e) {
      Alert.alert("Error", "Network transmission failed.");
    } finally {
      setGenerating(false);
      setTypingStatus(null);
    }
  };

  const sendInvite = async (target: string) => {
    if (!activeWorkspace?.id || !user?.id) return;
    setInviteLoading(true);
    try {
      const isEmail = target.includes('@') && !target.startsWith('@') && target.indexOf('@') > 0;
      const payload = {
        username: isEmail ? undefined : target.replace(/^@+/, ''),
        email: isEmail ? target : undefined,
        role: 'member',
        senderId: user.id
      };

      const res = await fetch(`${BACKEND_URL}/api/workspaces/${activeWorkspace.id}/invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      Alert.alert("Success", isEmail ? `Invitation sent to ${target}` : `Invitation sent to @${target}`);
      setShowInvite(false);
      setSearchQuery("");
      setInviteEmail("");
    } catch (err: any) {
      Alert.alert("Invitation Failed", err.message);
    } finally {
      setInviteLoading(false);
    }
  };

  const selectCommand = (cmd: string) => {
    setInput("");
    setCommandMenuVisible(false);
    handleSend(cmd);
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* OS Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.wsTrigger} onPress={() => setShowWSPicker(true)}>
          <View style={styles.wsIcon}>
            {activeWorkspace?.logo && (activeWorkspace.logo.startsWith("http") || activeWorkspace.logo.startsWith("data:")) ? (
              <RNImage source={{ uri: activeWorkspace.logo }} style={{ width: 40, height: 40, borderRadius: 10 }} />
            ) : (
              <Text style={styles.wsIconText}>{activeWorkspace?.logo || activeWorkspace?.name?.[0] || 'W'}</Text>
            )}
          </View>
          <View>
            <Text style={styles.wsName}>{activeWorkspace?.name || "Initializing..."}</Text>
            <Text style={styles.wsStatusText}>{(Array.isArray(members) ? members.length : 0)} Humans · {Object.keys(AGENT_CONFIG).length} Agents</Text>
          </View>
          <ChevronDown size={14} color="#6B7280" />
        </TouchableOpacity>
        <View style={styles.headerActions}>
           <TouchableOpacity style={styles.hBtn} onPress={() => setShowMembers(true)}>
             <Users size={20} color="#111827" />
           </TouchableOpacity>
           <TouchableOpacity style={styles.hBtn}><Settings size={20} color="#111827" /></TouchableOpacity>
        </View>
      </View>

      {/* Channel Strip */}
      <View style={styles.channelBar}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chScroll}>
          {Array.isArray(channels) && channels.map((ch) => (
            <TouchableOpacity
              key={ch.id}
              onPress={() => setActiveChannel(ch)}
              style={[styles.chPill, activeChannel?.id === ch.id && styles.activeChPill]}
            >
              <Hash size={14} color={activeChannel?.id === ch.id ? "#fff" : "#6B7280"} />
              <Text style={[styles.chLabel, activeChannel?.id === ch.id && styles.activeChLabel]}>{ch.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.chatArea}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <ScrollView ref={scrollRef} contentContainerStyle={styles.msgList} showsVerticalScrollIndicator={false}>
          {(Array.isArray(messages) && messages.length === 0) && !isLoading && (
            <View style={styles.emptyContainer}>
              <View style={styles.heroBot}><Bot size={40} color="#111827" /></View>
              <Text style={styles.emptyTitle}>{activeWorkspace?.name || 'Workspace'} OS</Text>
              <Text style={styles.emptyDesc}>Synchronized with human and AI operators. Mention them with @ or use / for commands.</Text>
            </View>
          )}

          {Array.isArray(messages) && messages.map((msg, i) => (
            <View key={msg.id || i} style={[styles.msgBubble, msg.role === 'user' ? styles.userBubble : styles.botBubble]}>
               <View style={styles.msgHeader}>
                  <Text style={styles.msgSender}>
                    {msg.role === 'user' ? (msg.userName || "Founder") : (msg.agentId ? (AGENT_CONFIG as any)[msg.agentId]?.label : "AI Agent")}
                  </Text>
                  <Text style={styles.msgTime}>just now</Text>
               </View>

               {msg.mediaUrl && (
                 <RNImage
                   source={{ uri: msg.mediaUrl.startsWith("data:") ? msg.mediaUrl : `data:image/jpeg;base64,${msg.mediaUrl}` }}
                   style={styles.bubbleImage}
                   resizeMode="cover"
                 />
               )}

               {msg.content ? (
                 <Markdown style={markdownStyles}>
                   {String(msg.content || "")}
                 </Markdown>
               ) : (
                 <Text style={{ color: '#9CA3AF', fontStyle: 'italic' }}>Empty message</Text>
               )}

               {msg.role === 'assistant' && (
                 <View style={styles.msgActions}>
                    <TouchableOpacity style={styles.aBtn} onPress={() => handleCopy(msg.content)}><Copy size={14} color="#9CA3AF" /></TouchableOpacity>
                    <TouchableOpacity style={styles.aBtn} onPress={() => handleMessageAction(msg.id, 'like')}><ThumbsUp size={14} color={msg.feedback === 'like' ? '#10B981' : "#9CA3AF"} /></TouchableOpacity>
                    <TouchableOpacity style={styles.aBtn} onPress={() => handleMessageAction(msg.id, 'dislike')}><ThumbsDown size={14} color={msg.feedback === 'dislike' ? '#EF4444' : "#9CA3AF"} /></TouchableOpacity>
                    <TouchableOpacity style={styles.aBtn}><Share2 size={14} color="#9CA3AF" /></TouchableOpacity>
                    <TouchableOpacity style={styles.aBtn} onPress={() => handleRegenerate(msg.id)}><RotateCcw size={14} color="#9CA3AF" /></TouchableOpacity>
                 </View>
               )}
            </View>
          ))}

          {typingStatus && (
             <Animated.View entering={FadeIn} style={styles.thinkingBox}>
                <ActivityIndicator size="small" color="#6B7280" />
                <Text style={styles.thinkingText}>
                  {typingStatus.name} is {typingStatus.status}...
                </Text>
             </Animated.View>
          )}
        </ScrollView>

        <View style={styles.inputContainer}>
          {mentionMenuVisible && (
            <Animated.View entering={SlideInDown} style={styles.floatingMenu}>
               <Text style={styles.menuTitle}>MENTION AGENT</Text>
              {Object.values(AGENT_CONFIG).map((agent) => (
                <TouchableOpacity key={agent.id} style={styles.mItem} onPress={() => { setInput(input + agent.id); setMentionMenuVisible(false); }}>
                  <Text style={styles.mLabel}>@{agent.label.split(' ')[0]}</Text>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}

          {commandMenuVisible && (
            <Animated.View entering={SlideInDown} style={styles.floatingMenu}>
              <Text style={styles.menuTitle}>COMMAND CENTER</Text>
              {SLASH_COMMANDS.map((c) => (
                <TouchableOpacity key={c.cmd} style={styles.mItem} onPress={() => selectCommand(c.cmd)}>
                   <c.icon size={16} color="#111827" style={{ marginRight: 10 }} />
                   <View>
                      <Text style={styles.mLabel}>{c.cmd}</Text>
                      <Text style={styles.mSubLabel}>{c.label}</Text>
                   </View>
                </TouchableOpacity>
              ))}
            </Animated.View>
          )}

          {selectedImageUri && (
            <View style={styles.imagePreviewContainer}>
              <RNImage source={{ uri: selectedImageUri }} style={styles.imagePreview} />
              <TouchableOpacity style={styles.removeImageBtn} onPress={() => { setSelectedImage(null); setSelectedImageUri(null); }}>
                <X size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.inputBar}>
            <TouchableOpacity style={styles.plusBtn} onPress={() => setCommandMenuVisible(true)}>
              <Plus size={20} color="#9CA3AF" />
            </TouchableOpacity>

            <TextInput
              style={styles.iInput}
              placeholder="Ask anything"
              placeholderTextColor="#6B7280"
              value={input}
              onChangeText={(t) => {
                setInput(t);
                setMentionMenuVisible(t.endsWith('@'));
                setCommandMenuVisible(t === '/');
              }}
              multiline
              // @ts-ignore
              outlineStyle="none"
              onSubmitEditing={() => {
                if (Platform.OS !== 'web' || !input.includes('\n')) {
                  handleSend();
                }
              }}
              onKeyPress={(e: any) => {
                if (Platform.OS === 'web' && e.nativeEvent.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              blurOnSubmit={false}
            />

            <View style={styles.rightActions}>
              <TouchableOpacity style={styles.micBtn} onPress={pickImage}>
                <ImageIcon size={20} color="#9CA3AF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.micBtn}>
                <Mic size={20} color="#9CA3AF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.sendBtn, (!input.trim() && !selectedImage || generating) && { opacity: 0.6 }]}
                onPress={() => handleSend()}
              >
                {generating ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <AudioLines size={20} color="#000" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* WS Picker Modal */}
      <Modal visible={showWSPicker} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowWSPicker(false)}>
           <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Switch Company</Text>
              <ScrollView style={{ maxHeight: 300 }} showsVerticalScrollIndicator={false}>
                {Array.isArray(workspaces) && workspaces.map(ws => (
                  <TouchableOpacity key={ws?.id} style={styles.wsOption} onPress={() => { setActiveWorkspace(ws); setShowWSPicker(false); }}>
                    <View style={styles.wsIconSmall}>
                      {ws?.logo && (ws.logo.startsWith("http") || ws.logo.startsWith("data:")) ? (
                        <RNImage source={{ uri: ws.logo }} style={{ width: 48, height: 48, borderRadius: 16 }} />
                      ) : (
                        <Text style={styles.wsIconTextSmall}>{ws?.logo || ws?.name?.[0] || '?'}</Text>
                      )}
                    </View>
                    <Text style={styles.wsOptionText}>{ws?.name || "Unnamed Workspace"}</Text>
                    {activeWorkspace?.id === ws?.id && <CheckCircle2 size={18} color="#10B981" />}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 16,
                  paddingVertical: 16,
                  borderTopWidth: 1,
                  borderTopColor: '#F3F4F6',
                  marginTop: 8
                }}
                onPress={() => { setShowWSPicker(false); router.push("/startup/create-workspace"); }}
              >
                 <Plus size={20} color="#111827" />
                 <Text style={{ fontSize: 16, fontWeight: '900', color: '#111827' }}>Create New Workspace</Text>
              </TouchableOpacity>
           </View>
        </TouchableOpacity>
      </Modal>

      {/* Members Modal - Redesigned like Slack/Discord */}
      <Modal visible={showMembers} transparent animationType="slide">
        <View style={styles.modalOverlay}>
           <Animated.View entering={SlideInDown} style={styles.modalContentFull}>
              <View style={styles.modalHeader}>
                 <View>
                   <Text style={styles.modalTitle}>Team & Intelligence</Text>
                   <Text style={styles.modalSubtitle}>
                     {(Array.isArray(members) ? members.length : 0) + Object.keys(AGENT_CONFIG).length} total members
                   </Text>
                 </View>
                 <TouchableOpacity onPress={() => setShowMembers(false)} style={styles.closeBtn}>
                   <X size={24} color="#111827" />
                 </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>

                 {/* Active Now Section */}
                 <View style={styles.memberSection}>
                    <Text style={styles.memberSectionTitle}>ACTIVE NOW</Text>

                    {/* Agents (Always "Online" in logic) */}
                    {Object.values(AGENT_CONFIG).map((agent) => (
                      <TouchableOpacity key={agent.id} style={styles.memberCard}>
                        <View style={styles.avatarWrapper}>
                           <View style={[styles.wsIconSmall, { backgroundColor: agent.color }]}>
                             <Text style={styles.wsIconTextSmall}>{agent.label[0]}</Text>
                           </View>
                           <View style={[styles.statusDot, { backgroundColor: '#10B981' }]} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.memberNameRow}>
                             <Text style={styles.memberName}>{agent.label}</Text>
                             <View style={styles.aiBadge}><Text style={styles.aiBadgeText}>AI</Text></View>
                          </View>
                          <Text style={styles.memberActivity}>Ready to execute commands</Text>
                        </View>
                        <ChevronRight size={16} color="#9CA3AF" />
                      </TouchableOpacity>
                    ))}

                    {/* Human Members */}
                    {Array.isArray(members) && members.map(m => (
                      <View key={m.id} style={styles.memberCard}>
                        <View style={styles.avatarWrapper}>
                           <View style={styles.wsIconSmall}>
                             <Text style={styles.wsIconTextSmall}>{m.name?.[0] || '?'}</Text>
                           </View>
                           <View style={[styles.statusDot, { backgroundColor: m.status === 'online' ? '#10B981' : (m.status === 'away' ? '#F59E0B' : (m.status === 'busy' ? '#EF4444' : '#9CA3AF')) }]} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={styles.memberNameRow}>
                             <Text style={styles.memberName}>{m.name || "Unknown Member"}</Text>
                             <View style={[styles.roleTag, m.role === 'owner' ? styles.ownerTag : (m.role === 'admin' ? styles.adminTag : null)]}>
                               <Text style={styles.roleTagText}>{m.role}</Text>
                             </View>
                          </View>
                          <Text style={styles.memberUser}>@{m.username || (m.name ? m.name.toLowerCase().replace(' ', '') : 'user')}</Text>
                        </View>

                        {(activeWorkspace?.role === 'owner' || activeWorkspace?.role === 'admin') && m.id !== user?.id && (
                          <View style={styles.memberActions}>
                             {activeWorkspace.role === 'owner' && m.role !== 'admin' && m.role !== 'owner' && (
                               <TouchableOpacity onPress={() => promoteToAdmin(m.id)} style={styles.actionIcon}>
                                 <Shield size={16} color="#4F46E5" />
                               </TouchableOpacity>
                             )}
                             <TouchableOpacity onPress={() => removeMember(m.id)} style={styles.actionIcon}>
                               <X size={16} color="#EF4444" />
                             </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    ))}
                 </View>

                 {/* Team Insights */}
                 <View style={styles.insightsGrid}>
                    <View style={styles.insightItem}>
                       <Text style={styles.insightVal}>{(Array.isArray(members) ? members.length : 0)}</Text>
                       <Text style={styles.insightLabel}>Humans</Text>
                    </View>
                    <View style={styles.insightItem}>
                       <Text style={styles.insightVal}>{Object.keys(AGENT_CONFIG).length}</Text>
                       <Text style={styles.insightLabel}>Agents</Text>
                    </View>
                    <View style={styles.insightItem}>
                       <Text style={[styles.insightVal, { color: '#10B981' }]}>{(Array.isArray(members) ? members.filter(m => m.status === 'online').length : 0) + Object.keys(AGENT_CONFIG).length}</Text>
                       <Text style={styles.insightLabel}>Online</Text>
                    </View>
                 </View>

                 <TouchableOpacity style={styles.addMemberBtn} onPress={() => { setShowMembers(false); setShowInvite(true); }}>
                    <View style={styles.addIconBox}><UserPlus size={20} color="#fff" /></View>
                    <View>
                       <Text style={styles.addMemberText}>Invite to Workspace</Text>
                       <Text style={styles.addMemberSub}>Onboard more human operators</Text>
                    </View>
                 </TouchableOpacity>

                  {activeWorkspace?.role === 'owner' ? (
                     <TouchableOpacity style={styles.leaveBtn} onPress={handleDeleteWS}>
                        <Trash2 size={20} color="#EF4444" />
                        <Text style={styles.leaveBtnText}>Delete Workspace</Text>
                     </TouchableOpacity>
                  ) : (
                     <TouchableOpacity style={styles.leaveBtn} onPress={handleLeaveWS}>
                        <LogOut size={20} color="#EF4444" />
                        <Text style={styles.leaveBtnText}>Leave Workspace</Text>
                     </TouchableOpacity>
                  )}
              </ScrollView>
           </Animated.View>
        </View>
      </Modal>

      {/* Invite Modal */}
      <Modal visible={showInvite} transparent animationType="fade">
         <View style={styles.modalOverlay}>
            <Animated.View entering={FadeInDown} style={styles.modalContent}>
               <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Invite Operator</Text>
                  <TouchableOpacity onPress={() => setShowInvite(false)}><X size={20} color="#111827" /></TouchableOpacity>
               </View>
               <View style={styles.searchBar}>
                  <Search size={18} color="#9CA3AF" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by username (e.g. charan)"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCapitalize="none"
                  />
               </View>

               <ScrollView style={{ maxHeight: 300 }}>
                  {searchQuery.length > 1 ? (
                    searchResults.map(u => (
                      <TouchableOpacity key={u.id} style={styles.searchResult} onPress={() => sendInvite(u.username)}>
                        <View style={styles.wsIconSmall}><Text style={styles.wsIconTextSmall}>{u.name?.[0] || '?'}</Text></View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.searchResultName}>{u.name}</Text>
                            <Text style={styles.searchResultUser}>{u.username.startsWith("@") ? u.username : `@${u.username}`} {u.email ? `(${u.email})` : ""}</Text>
                        </View>
                        <Text style={styles.inviteLinkText}>Send Invite</Text>
                      </TouchableOpacity>
                    ))
                  ) : (
                    <>
                      <Text style={styles.memberSectionTitle}>SUGGESTED OPERATORS</Text>
                      {suggestedUsers.map(u => (
                        <TouchableOpacity key={u.id} style={styles.searchResult} onPress={() => sendInvite(u.username)}>
                          <View style={styles.wsIconSmall}><Text style={styles.wsIconTextSmall}>{u.name?.[0] || '?'}</Text></View>
                          <View style={{ flex: 1 }}>
                              <Text style={styles.searchResultName}>{u.name}</Text>
                              <Text style={styles.searchResultUser}>{u.username.startsWith("@") ? u.username : `@${u.username}`} {u.email ? `(${u.email})` : ""}</Text>
                          </View>
                          <Text style={styles.inviteLinkText}>Send Invite</Text>
                        </TouchableOpacity>
                      ))}
                    </>
                  )}
                  {searchQuery.length > 2 && searchResults.length === 0 && (
                     <Text style={styles.emptySearch}>No users found with that username.</Text>
                  )}
               </ScrollView>

               <View style={styles.inviteDivider}>
                  <View style={styles.dividerLine} />
                  <Text style={styles.dividerText}>OR INVITE BY EMAIL</Text>
                  <View style={styles.dividerLine} />
               </View>

               <TextInput
                 style={styles.emailInput}
                 placeholder="Enter email address"
                 keyboardType="email-address"
                 autoCapitalize="none"
                 value={inviteEmail}
                 onChangeText={setInviteEmail}
               />
               <TouchableOpacity
                 style={styles.primaryBtn}
                 disabled={inviteLoading}
                 onPress={() => {
                    if (inviteEmail.includes('@')) {
                       sendInvite(inviteEmail);
                    } else {
                       Alert.alert("Invalid Email", "Please enter a valid email address.");
                    }
                 }}
               >
                  <Text style={styles.primaryBtnText}>{inviteLoading ? 'Sending...' : 'Send Invitation'}</Text>
               </TouchableOpacity>
            </Animated.View>
         </View>
      </Modal>
    </SafeAreaView>
  );
}

const markdownStyles = {
  body: { color: '#374151', fontSize: 14, lineHeight: 22 },
  strong: { fontWeight: '900' as const, color: '#111827' },
  code_block: { backgroundColor: '#111827', color: '#fff', padding: 12, borderRadius: 8, marginVertical: 8 },
};

const styles: any = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  wsTrigger: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  wsIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
  wsIconText: { color: '#fff', fontWeight: '900', fontSize: 18 },
  wsName: { fontSize: 16, fontWeight: '900', color: '#111827' },
  wsStatusText: { fontSize: 11, color: '#6B7280', fontWeight: '700' },
  headerActions: { flexDirection: 'row', gap: 8 },
  hBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },

  channelBar: { paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  chScroll: { paddingHorizontal: 16, gap: 10 },
  chPill: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB' },
  activeChPill: { backgroundColor: '#111827', borderColor: '#111827' },
  chLabel: { fontSize: 13, fontWeight: '800', color: '#6B7280' },
  activeChLabel: { color: '#fff' },

  chatArea: { flex: 1 },
  msgList: { padding: 16, gap: 20 },
  msgBubble: { width: '100%', padding: 18, borderRadius: 24, backgroundColor: '#F9FAFB' },
  userBubble: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#111827' },
  botBubble: { backgroundColor: '#F9FAFB', borderLeftWidth: 4, borderLeftColor: '#111827' },
  msgHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  msgSender: { fontSize: 11, fontWeight: '900', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 1 },
  msgTime: { fontSize: 10, color: '#9CA3AF', fontWeight: '600' },

  msgActions: { flexDirection: 'row', gap: 14, marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.05)' },
  aBtn: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },

  emptyContainer: { alignItems: 'center', marginTop: 100, paddingHorizontal: 40 },
  heroBot: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  emptyTitle: { fontSize: 24, fontWeight: '900', color: '#111827' },
  emptyDesc: { fontSize: 15, color: '#6B7280', textAlign: 'center', marginTop: 10, lineHeight: 22 },

  thinkingBox: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 16 },
  thinkingText: { fontSize: 14, color: '#6B7280', fontWeight: '700' },

  inputContainer: {
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6'
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1F1F',
    borderRadius: 24,
    paddingHorizontal: 6,
    paddingVertical: 4,
    minHeight: 48,
  },
  plusBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#2D2D2D',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 2,
  },
  iInput: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    paddingHorizontal: 10,
    paddingVertical: 8,
    maxHeight: 100,
    ...(Platform.select({
      web: {
        outlineStyle: 'none',
        borderWidth: 0,
      }
    }) || {}) as any
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginRight: 2,
  },
  micBtn: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  floatingMenu: {
    position: 'absolute',
    bottom: 72,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.98)',
    borderRadius: 24,
    padding: 20,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
    zIndex: 1000,
    maxWidth: 568,
    alignSelf: 'center',
  },
  menuTitle: { fontSize: 11, fontWeight: '900', color: '#9CA3AF', marginBottom: 16, letterSpacing: 1 },
  mItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#F9FAFB' },
  mLabel: { fontSize: 16, fontWeight: '800', color: '#111827' },
  mSubLabel: { fontSize: 12, color: '#6B7280', fontWeight: '600', marginTop: 2 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, gap: 16, paddingBottom: 40, width: '100%', maxWidth: 600, alignSelf: 'center' },
  modalContentFull: { backgroundColor: '#fff', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, height: '85%', width: '100%', maxWidth: 600, alignSelf: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitle: { fontSize: 24, fontWeight: '900', color: '#111827', letterSpacing: -0.5 },
  modalSubtitle: { fontSize: 13, color: '#6B7280', fontWeight: '600', marginTop: 2 },
  closeBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },

  memberSection: { gap: 4 },
  memberSectionTitle: { fontSize: 11, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1.5, marginBottom: 12, marginTop: 8 },
  memberCard: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 12, paddingHorizontal: 4 },
  avatarWrapper: { position: 'relative' },
  statusDot: { position: 'absolute', bottom: -2, right: -2, width: 14, height: 14, borderRadius: 7, borderWidth: 3, borderColor: '#fff' },
  memberNameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  memberName: { fontSize: 16, fontWeight: '800', color: '#111827' },
  memberUser: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  memberActivity: { fontSize: 13, color: '#6B7280', fontWeight: '500', marginTop: 2 },
  aiBadge: { backgroundColor: '#F5F3FF', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#E9E3FF' },
  aiBadgeText: { fontSize: 10, fontWeight: '900', color: '#7C3AED' },

  roleTag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, backgroundColor: '#F3F4F6', marginLeft: 8 },
  ownerTag: { backgroundColor: '#FEF3C7' },
  adminTag: { backgroundColor: '#E0E7FF' },
  roleTagText: { fontSize: 10, fontWeight: '800', color: '#111827', textTransform: 'uppercase' },
  memberActions: { flexDirection: 'row', gap: 8 },
  actionIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F9FAFB', justifyContent: 'center', alignItems: 'center' },

  insightsGrid: { flexDirection: 'row', gap: 12, marginVertical: 24 },
  insightItem: { flex: 1, padding: 16, backgroundColor: '#F9FAFB', borderRadius: 20, alignItems: 'center', gap: 4, borderWidth: 1, borderColor: '#F3F4F6' },
  insightVal: { fontSize: 20, fontWeight: '900', color: '#111827' },
  insightLabel: { fontSize: 11, color: '#6B7280', fontWeight: '700', textTransform: 'uppercase' },

  addMemberBtn: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20, backgroundColor: '#111827', borderRadius: 24, marginTop: 12 },
  addIconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: 'rgba(255,255,255,0.1)', justifyContent: 'center', alignItems: 'center' },
  addMemberText: { fontSize: 16, fontWeight: '800', color: '#fff' },
  addMemberSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', fontWeight: '600', marginTop: 2 },

  leaveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 16, borderTopWidth: 1, borderTopColor: '#F3F4F6', marginTop: 20 },
  leaveBtnText: { color: '#EF4444', fontWeight: '800', fontSize: 14 },

  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#F3F4F6', borderRadius: 16, paddingHorizontal: 16, height: 50, marginBottom: 16 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827', fontWeight: '600' },
  searchResult: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  searchResultName: { fontSize: 15, fontWeight: '700', color: '#111827' },
  searchResultUser: { fontSize: 13, color: '#9CA3AF', fontWeight: '600' },
  inviteLinkText: { fontSize: 13, fontWeight: '800', color: '#111827' },
  emptySearch: { textAlign: 'center', color: '#9CA3AF', paddingVertical: 20, fontWeight: '600' },

  inviteDivider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E5E7EB' },
  dividerText: { fontSize: 10, fontWeight: '900', color: '#9CA3AF', letterSpacing: 1 },
  emailInput: { height: 52, backgroundColor: '#F9FAFB', borderRadius: 14, borderWidth: 1, borderColor: '#E5E7EB', paddingHorizontal: 16, fontSize: 15, marginBottom: 12 },
  primaryBtn: { height: 56, backgroundColor: '#111827', borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  primaryBtnText: { color: '#fff', fontWeight: '800', fontSize: 16 },

  wsOption: { flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  wsIconSmall: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#111827', justifyContent: 'center', alignItems: 'center' },
  wsIconTextSmall: { color: '#fff', fontWeight: '900', fontSize: 20 },
  wsOptionText: { fontSize: 17, fontWeight: '700', color: '#111827', flex: 1 },
  imagePreviewContainer: {
    flexDirection: 'row',
    padding: 8,
    backgroundColor: '#1F1F1F',
    borderRadius: 12,
    marginBottom: 8,
    alignItems: 'center',
    alignSelf: 'flex-start',
    position: 'relative',
  },
  imagePreview: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  removeImageBtn: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginVertical: 8,
  },
});
