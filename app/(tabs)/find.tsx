import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Image as RNImage,
  Dimensions,
  FlatList,
  Modal,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/store/auth-store";
import { Dialog } from "@/components/ui/Dialog";
import * as Clipboard from "expo-clipboard";
import { useSocialStore, Conversation, DirectMessage, Friend, FriendRequest } from "@/store/social-store";
import { BACKEND_URL, COLORS } from "@/constants";
import {
  Search,
  MessageSquare,
  Users,
  UserPlus,
  Plus,
  Send,
  Paperclip,
  Mic,
  Smile,
  Pin,
  FolderOpen,
  X,
  Check,
  CheckCheck,
  MoreVertical,
  Reply,
  Edit2,
  Trash2,
  ChevronLeft,
  Volume2,
  FileText,
  Video,
  AudioLines,
  AlertCircle,
  HelpCircle,
  Cpu,
  CornerUpLeft,
  Copy,
  CornerUpRight,
} from "lucide-react-native";
import Animated, {
  FadeIn,
  FadeInDown,
  SlideInRight,
  Layout,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";

const { width } = Dimensions.get("window");

const renderAvatar = (avatar: string | null | undefined, textStyle: any, size: number = 24) => {
  if (avatar && (avatar.startsWith("data:") || avatar.startsWith("http") || avatar.startsWith("/"))) {
    return (
      <RNImage
        source={{ uri: avatar }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
      />
    );
  }
  return <Text style={textStyle}>{avatar || "👤"}</Text>;
};

const AGENT_ACCOUNTS = [
  { username: "FounderAgent", name: "Founder Agent", avatar: "👑" },
  { username: "CEOAgent", name: "CEO Agent", avatar: "💼" },
  { username: "ResearchAgent", name: "Research Agent", avatar: "🔍" },
  { username: "MarketingAgent", name: "Marketing Agent", avatar: "📢" },
  { username: "CodingAgent", name: "Coding Agent", avatar: "💻" },
  { username: "ManagerAgent", name: "Manager Agent", avatar: "📅" },
  { username: "CustomerServiceAgent", name: "Customer Service Agent", avatar: "🎧" },
];

export default function FindMessagingScreen() {
  const { width: windowWidth } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && windowWidth > 768;
  const { user } = useAuthStore();
  const {
    conversations,
    activeConversation,
    messages,
    friends,
    incomingRequests,
    outgoingRequests,
    onlineStatuses,
    typingStatus,
    fetchConversations,
    setActiveConversation,
    fetchFriends,
    fetchRequests,
    connectSocket,
    disconnectSocket,
    sendDM,
    sendFriendRequest,
    respondToRequest,
    createGroupChat,
    socket,
  } = useSocialStore();

  // Navigation states
  const [activeTab, setActiveTab] = useState<"messages" | "friends" | "requests" | "add_friend">("messages");
  const [friendsSubTab, setFriendsSubTab] = useState<"pending" | "accepted" | "declined">("pending");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  // Inputs and Search
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChatSearch, setActiveChatSearch] = useState(false);
  const [chatSearchText, setChatSearchText] = useState("");
  const [addFriendUsername, setAddFriendUsername] = useState("");
  const [addFriendSearchResults, setAddFriendSearchResults] = useState<any[]>([]);
  const [addFriendSearchLoading, setAddFriendSearchLoading] = useState(false);
  const [dialogConfig, setDialogConfig] = useState<{
    visible: boolean;
    type: "success" | "error" | "warning" | "info" | "confirm";
    title: string;
    description: string;
    confirmLabel?: string;
    cancelLabel?: string;
    onConfirm?: () => void;
  }>({
    visible: false,
    type: "info",
    title: "",
    description: "",
  });

  const showAlertDialog = (
    type: "success" | "error" | "warning" | "info" | "confirm",
    title: string,
    description: string,
    confirmLabel?: string,
    cancelLabel?: string,
    onConfirm?: () => void
  ) => {
    setDialogConfig({
      visible: true,
      type,
      title,
      description,
      confirmLabel,
      cancelLabel,
      onConfirm,
    });
  };

  useEffect(() => {
    if (addFriendUsername.length < 2) {
      setAddFriendSearchResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        setAddFriendSearchLoading(true);
        const res = await fetch(`${BACKEND_URL}/api/workspaces/search-users?query=${addFriendUsername}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setAddFriendSearchResults(data);
        }
      } catch (e) {
        console.error("Add friend search error:", e);
      } finally {
        setAddFriendSearchLoading(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [addFriendUsername]);

  // Modals and Drawers
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showMediaModal, setShowMediaModal] = useState(false);
  const [showPinnedModal, setShowPinnedModal] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedFriendsForGroup, setSelectedFriendsForGroup] = useState<string[]>([]);
  const [messageMenuMessage, setMessageMenuMessage] = useState<DirectMessage | null>(null);

  // Copy/Forward and Emoji states
  const [showForwardModal, setShowForwardModal] = useState(false);
  const [forwardingMessage, setForwardingMessage] = useState<DirectMessage | null>(null);
  const [emojiPickerVisible, setEmojiPickerVisible] = useState(false);

  // File & Voice Upload Simulator States
  const [selectedImageBase64, setSelectedImageBase64] = useState<string | null>(null);
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [recordingVoice, setRecordingVoice] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimer = useRef<any>(null);

  // Message flow edits & replies
  const [replyingToMessage, setReplyingToMessage] = useState<DirectMessage | null>(null);
  const [editingMessage, setEditingMessage] = useState<DirectMessage | null>(null);
  const [editText, setEditText] = useState("");

  // Current User Online Status Dropdown
  const [myStatus, setMyStatus] = useState<"online" | "away" | "busy" | "offline">("online");
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const typingTimer = useRef<any>(null);
  const isTyping = useRef(false);

  // 1. Initial Load
  useEffect(() => {
    if (user?.id) {
      fetchConversations(user.id);
      fetchFriends(user.id);
      fetchRequests(user.id);
    }
  }, [user?.id]);

  // Sync personal status
  useEffect(() => {
    if (socket && user?.id) {
      socket.emit("user_status", { userId: user.id, status: myStatus });
    }
  }, [myStatus, socket, user?.id]);

  // Keep chat scrolled to bottom
  useEffect(() => {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages, typingStatus]);

  // Handle typing event emitter
  const handleMessageChange = (text: string) => {
    setMessageText(text);
    if (!socket || !activeConversation || !user) return;

    if (!isTyping.current) {
      isTyping.current = true;
      socket.emit("typing_start", {
        conversationId: activeConversation.id,
        username: user.username || user.name || "User",
      });
    }

    if (typingTimer.current) clearTimeout(typingTimer.current);

    typingTimer.current = setTimeout(() => {
      isTyping.current = false;
      socket.emit("typing_stop", {
        conversationId: activeConversation.id,
        username: user.username || user.name || "User",
      });
    }, 2000);
  };

  // 2. Message Actions
  const handleSendDM = async () => {
    if ((!messageText.trim() && !selectedImageBase64) || !activeConversation || !user) return;

    const currentText = messageText;
    const currentReply = replyingToMessage;
    const currentImage = selectedImageBase64;

    // Clear input instantly for UI responsiveness
    setMessageText("");
    setSelectedImageBase64(null);
    setSelectedImageUri(null);
    setReplyingToMessage(null);

    // Stop typing
    if (isTyping.current) {
      isTyping.current = false;
      socket?.emit("typing_stop", {
        conversationId: activeConversation.id,
        username: user.username || user.name || "User",
      });
    }

    // Call store sendDM
    sendDM({
      conversationId: activeConversation.id,
      senderId: user.id,
      content: currentText,
      mediaUrl: currentImage,
      mediaType: currentImage ? "image" : null,
      replyToId: currentReply?.id || null,
    });

    // Check if user mentioned an AI Agent (e.g. @FounderAgent, etc.)
    const mentions = AGENT_ACCOUNTS.filter((agent) =>
      currentText.toLowerCase().includes(`@${agent.username.toLowerCase()}`)
    );

    if (mentions.length > 0) {
      // Simulate Agent Typing
      const agent = mentions[0];
      setTimeout(() => {
        socket?.emit("typing_start", {
          conversationId: activeConversation.id,
          username: agent.name,
        });
      }, 500);

      // Trigger Groq AI call after a brief delay
      setTimeout(async () => {
        try {
          const formattedHistory = messages.slice(-6).map((m) => ({
            role: m.senderUsername.toLowerCase().includes("agent") ? "assistant" : "user",
            content: `${m.senderName}: ${m.content}`,
          }));

          formattedHistory.push({
            role: "user",
            content: `${user.name || "User"}: ${currentText}`,
          });

          const res = await fetch(`${BACKEND_URL}/api/agents/completions`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [
                {
                  role: "system",
                  content: `You are ${agent.name}, an AI executive assistant. Keep responses brief, conversational, and highly operational. Use bold keywords occasionally. Do not use emojis.`,
                },
                ...formattedHistory,
              ],
            }),
          });
          const data = await res.json();
          const responseText = data.content || "Operational diagnostics completed.";

          // Stop Agent Typing
          socket?.emit("typing_stop", {
            conversationId: activeConversation.id,
            username: agent.name,
          });

          // Insert simulated DM in database under agent's identity
          // Find or create agent's dummy user ID in workspace, or we can just send it as a custom agent message
          // To ensure it gets broadcasted correctly, we can send it directly
          const mockAgentId = agent.username.toLowerCase();
          
          // Send simulated websocket message from AI agent
          if (socket) {
            socket.emit("send_dm", {
              conversationId: activeConversation.id,
              senderId: "00000000-0000-0000-0000-000000000000", // system/agent default ID
              content: responseText,
              senderName: agent.name,
              senderUsername: agent.username,
              senderAvatar: agent.avatar,
            });
          }
        } catch (e) {
          console.error("AI mention simulation failed:", e);
        }
      }, 3000);
    }
  };

  // Record simulated voice message
  const startRecordingVoice = () => {
    setRecordingVoice(true);
    setRecordingSeconds(0);
    recordingTimer.current = setInterval(() => {
      setRecordingSeconds((prev) => prev + 1);
    }, 1000);
  };

  const stopRecordingVoice = () => {
    if (recordingTimer.current) clearInterval(recordingTimer.current);
    setRecordingVoice(false);

    if (recordingSeconds < 1) {
      showAlertDialog("warning", "Too short", "Voice recording must be at least 1 second.");
      return;
    }

    // Send mock voice message payload
    const mockVoiceUrl = "simulated_audio_stream_base64_data";
    sendDM({
      conversationId: activeConversation!.id,
      senderId: user!.id,
      content: `Voice Message (${formatTime(recordingSeconds)})`,
      mediaUrl: mockVoiceUrl,
      mediaType: "voice",
    });
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remaining = secs % 60;
    return `${mins}:${remaining < 10 ? "0" : ""}${remaining}`;
  };

  // Image picking handler
  const pickImage = async () => {
    setShowAttachmentMenu(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlertDialog("error", "Denied", "We need library access to share screenshots/photos.");
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
      setSelectedImageUri(asset.uri);
      setSelectedImageBase64(`data:image/jpeg;base64,${asset.base64}`);
    }
  };

  // Video picking handler
  const pickVideo = async () => {
    setShowAttachmentMenu(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      showAlertDialog("error", "Denied", "We need library access to share videos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      allowsEditing: true,
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets[0]) {
      const asset = result.assets[0];
      if (asset.base64) {
        sendDM({
          conversationId: activeConversation!.id,
          senderId: user!.id,
          content: "Video Attachment",
          mediaUrl: `data:video/mp4;base64,${asset.base64}`,
          mediaType: "video",
        });
        showAlertDialog("success", "Video Uploaded", "Your video has been shared successfully.");
      } else {
        sendDM({
          conversationId: activeConversation!.id,
          senderId: user!.id,
          content: "Video Attachment",
          mediaUrl: asset.uri,
          mediaType: "video",
        });
      }
    }
  };

  // Forward message handler
  const handleForwardMessage = async (convId: string) => {
    if (!forwardingMessage || !user) return;
    try {
      sendDM({
        conversationId: convId,
        senderId: user.id,
        content: forwardingMessage.content,
        mediaUrl: forwardingMessage.mediaUrl,
        mediaType: forwardingMessage.mediaType,
        replyToId: null,
      });
      showAlertDialog("success", "Forwarded", "Message forwarded successfully.");
    } catch (e) {
      showAlertDialog("error", "Error", "Failed to forward message.");
    } finally {
      setShowForwardModal(false);
      setForwardingMessage(null);
    }
  };

  // Mock File selection handler
  const attachMockFile = (type: "pdf" | "doc" | "video") => {
    setShowAttachmentMenu(false);
    let mockContent = "";
    let mediaType = "file";
    let filename = "";

    if (type === "pdf") {
      filename = "FounderOS_Whitepaper.pdf";
      mockContent = "📄 Document Attachment: FounderOS_Whitepaper.pdf (1.4MB)";
      mediaType = "file";
    } else if (type === "doc") {
      filename = "Quarterly_Strategic_Plan.docx";
      mockContent = "📝 Document Attachment: Quarterly_Strategic_Plan.docx (240KB)";
      mediaType = "file";
    } else {
      filename = "System_Demo.mp4";
      mockContent = "🎥 Video Attachment: System_Demo.mp4 (4.2MB)";
      mediaType = "video";
    }

    sendDM({
      conversationId: activeConversation!.id,
      senderId: user!.id,
      content: mockContent,
      mediaUrl: `mock_media_url_for_${filename}`,
      mediaType,
    });
  };

  // Edit message handler
  const handleEditMessage = async () => {
    if (!editingMessage || !editText.trim()) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/social/messages/${editingMessage.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: editText }),
      });
      if (res.ok) {
        // Fetch fresh logs
        useSocialStore.getState().fetchMessages(activeConversation!.id);
      }
    } catch (e) {}

    setEditingMessage(null);
    setEditText("");
  };

  // Delete message handler
  const handleDeleteMessage = async (msgId: string) => {
    showAlertDialog(
      "confirm",
      "Delete Message",
      "Are you sure you want to permanently delete this message?",
      "Delete",
      "Cancel",
      async () => {
        try {
          const res = await fetch(`${BACKEND_URL}/api/social/messages/${msgId}`, {
            method: "DELETE",
          });
          if (res.ok) {
            useSocialStore.getState().fetchMessages(activeConversation!.id);
          }
        } catch (e) {}
      }
    );
  };

  // Pin toggle message
  const handlePinMessage = async (msg: DirectMessage) => {
    const nextPinnedState = msg.pinned === 1 ? 0 : 1;
    try {
      const res = await fetch(`${BACKEND_URL}/api/social/messages/${msg.id}/pin`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: nextPinnedState }),
      });
      if (res.ok) {
        useSocialStore.getState().fetchMessages(activeConversation!.id);
        showAlertDialog("success", "Success", nextPinnedState === 1 ? "Message pinned successfully" : "Message unpinned");
      }
    } catch (e) {}
  };

  // Reactions toggle
  const handleToggleReaction = async (msgId: string, emoji: string) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/social/messages/${msgId}/react`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user!.id, reaction: emoji }),
      });
      if (res.ok) {
        useSocialStore.getState().fetchMessages(activeConversation!.id);
      }
    } catch (e) {}
  };

  // 3. Friend Request actions
  const handleAddFriend = async () => {
    if (!addFriendUsername.trim()) return;
    try {
      await sendFriendRequest(user!.id, addFriendUsername, user!.username || user!.name || "Operator");
      showAlertDialog("success", "Success", "Friend request sent successfully");
      setAddFriendUsername("");
    } catch (e: any) {
      showAlertDialog("error", "Error", e.message || "User not found");
    }
  };

  const handleAddFriendUser = async (targetUsername: string) => {
    try {
      await sendFriendRequest(user!.id, targetUsername, user!.username || user!.name || "Operator");
      showAlertDialog("success", "Success", "Friend request sent successfully");
    } catch (e: any) {
      showAlertDialog("error", "Error", e.message || "Failed to send friend request");
    }
  };

  const handleRespondRequest = async (requestId: string, action: "accepted" | "declined" | "blocked") => {
    try {
      await respondToRequest(requestId, user!.id, action);
      showAlertDialog("success", "Success", `Friend request ${action}`);
    } catch (e) {}
  };

  // 4. Create Group Chat
  const handleCreateGroup = async () => {
    if (!groupName.trim() || selectedFriendsForGroup.length === 0) {
      showAlertDialog("warning", "Invalid Input", "Please enter a group name and select at least 1 friend.");
      return;
    }

    try {
      // Include owner in member list
      const memberIds = [user!.id, ...selectedFriendsForGroup];
      const conv = await createGroupChat(groupName, "👥", memberIds);
      setShowGroupModal(false);
      setGroupName("");
      setSelectedFriendsForGroup([]);
      setActiveConversation(conv);
      setMobileView("chat");
    } catch (e: any) {
      showAlertDialog("error", "Error", e.message || "Failed to create group");
    }
  };

  // Helper status styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case "online":
        return "#10B981"; // green
      case "away":
        return "#F59E0B"; // yellow
      case "busy":
        return "#EF4444"; // red
      default:
        return "#9CA3AF"; // grey (offline)
    }
  };

  // Filter conversations/friends lists based on query
  const filteredConversations = (Array.isArray(conversations) ? conversations : []).filter((c) => {
    if (c.type === "group") {
      return c.name?.toLowerCase().includes(searchQuery.toLowerCase());
    }
    const partner = c.members?.find((m) => m.id !== user?.id);
    return (partner?.name || partner?.username || "").toLowerCase().includes(searchQuery.toLowerCase());
  });

  const filteredFriends = (Array.isArray(friends) ? friends : []).filter((f) =>
    (f.name || f.username || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Dynamic message filter inside chat search
  const filteredMessages = (Array.isArray(messages) ? messages : []).filter((m) => {
    if (!chatSearchText.trim()) return true;
    return m.content?.toLowerCase().includes(chatSearchText.toLowerCase());
  });

  const pinnedMessages = (Array.isArray(messages) ? messages : []).filter((m) => m.pinned === 1);
  const mediaMessages = (Array.isArray(messages) ? messages : []).filter((m) => m.mediaUrl !== null);

  // Main UI Render
  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.dashboardContainer}>
        {/* SIDEBAR - Displays on Desktop always, toggled on Mobile */}
        {(!isDesktop && mobileView === "list") || isDesktop ? (
          <View style={[styles.sidebar, isDesktop && styles.sidebarDesktop]}>
            {/* Header: User Session & Presence */}
            <View style={styles.sidebarHeader}>
              <View style={styles.userInfoWrapper}>
                <TouchableOpacity onPress={() => setShowStatusMenu(!showStatusMenu)} style={styles.avatarButton}>
                  {renderAvatar(user?.avatar, styles.avatarEmoji, 32)}
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(myStatus) }]} />
                </TouchableOpacity>

                <View style={styles.userTextInfo}>
                  <Text style={styles.userName} numberOfLines={1}>
                    {user?.name || "Founder Profile"}
                  </Text>
                  <Text style={styles.userUsername} numberOfLines={1}>
                    @{user?.username || "operator"}
                  </Text>
                </View>
              </View>

              {/* Status choice dropdown will be shown as a modern Modal */}
            </View>

            {/* Global Chat Search Input */}
            <View style={styles.searchContainer}>
              <Search size={16} color="#9CA3AF" style={styles.searchIcon} />
              <TextInput
                placeholder="Search DMs, groups, friends..."
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />
            </View>

            {/* Switch Tabs (Messages vs Friends) */}
            <View style={styles.tabsContainer}>
              <TouchableOpacity
                onPress={() => {
                  setActiveTab("messages");
                  setActiveConversation(null);
                }}
                style={[styles.sidebarTab, activeTab === "messages" && styles.sidebarTabActive]}
              >
                <MessageSquare size={18} color={activeTab === "messages" ? "#111827" : "#6B7280"} />
                <Text style={[styles.sidebarTabText, activeTab === "messages" && styles.sidebarTabTextActive]}>
                  Chats
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setActiveTab("friends");
                  setActiveConversation(null);
                }}
                style={[styles.sidebarTab, activeTab === "friends" && styles.sidebarTabActive]}
              >
                <Users size={18} color={activeTab === "friends" ? "#111827" : "#6B7280"} />
                <Text style={[styles.sidebarTabText, activeTab === "friends" && styles.sidebarTabTextActive]}>
                  Social
                </Text>
              </TouchableOpacity>
            </View>

            {/* Sidebar Body */}
            {activeTab === "messages" ? (
              <ScrollView style={styles.scrollList} contentContainerStyle={{ paddingBottom: 100 }}>
                {/* Section header: Group chats */}
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Conversations</Text>
                  <TouchableOpacity onPress={() => setShowGroupModal(true)} style={styles.addButton}>
                    <Plus size={16} color="#111827" />
                  </TouchableOpacity>
                </View>

                {filteredConversations.length === 0 ? (
                  <Text style={styles.emptyText}>No active chats</Text>
                ) : (
                  filteredConversations.map((conv) => {
                    const isGroup = conv.type === "group";
                    const partner = conv.members.find((m) => m.id !== user?.id);
                    const displayName = isGroup ? conv.name : partner?.name || "Operator";
                    const displayUsername = isGroup ? `${conv.members.length} members` : `@${partner?.username || ""}`;
                    const displayAvatar = isGroup ? "👥" : partner?.avatar || "👤";
                    const onlineStatus = isGroup ? "online" : onlineStatuses[partner?.id || ""] || "offline";
                    const isSelected = activeConversation?.id === conv.id;

                    return (
                      <TouchableOpacity
                        key={conv.id}
                        onPress={() => {
                          setActiveConversation(conv);
                          setMobileView("chat");
                        }}
                        style={[styles.chatItem, isSelected && styles.chatItemActive]}
                      >
                        <View style={styles.chatAvatarWrapper}>
                          {renderAvatar(displayAvatar, styles.chatAvatarEmoji, 32)}
                          {!isGroup && (
                            <View
                              style={[
                                styles.chatStatusBadge,
                                { backgroundColor: getStatusColor(onlineStatus) },
                              ]}
                            />
                          )}
                        </View>

                        <View style={styles.chatItemDetails}>
                          <View style={styles.chatItemHeader}>
                            <Text style={styles.chatItemName} numberOfLines={1}>
                              {displayName}
                            </Text>
                            {conv.lastMessage?.createdAt && (
                              <Text style={styles.chatItemTime}>
                                {new Date(conv.lastMessage.createdAt).toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </Text>
                            )}
                          </View>
                          <Text style={styles.chatItemSub} numberOfLines={1}>
                            {conv.lastMessage
                              ? `${conv.lastMessage.senderName}: ${conv.lastMessage.content}`
                              : displayUsername}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            ) : (
              <View style={styles.socialLayout}>
                <TouchableOpacity
                  onPress={() => {
                    setActiveTab("add_friend");
                    if (!isDesktop) setMobileView("chat");
                  }}
                  style={styles.addFriendSidebarButton}
                >
                  <UserPlus size={16} color="#FFFFFF" style={{ marginRight: 8 }} />
                  <Text style={styles.addFriendSidebarButtonText}>Add Friend</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setActiveTab("requests");
                    if (!isDesktop) setMobileView("chat");
                  }}
                  style={styles.requestsBadgeButton}
                >
                  <Text style={styles.requestsBadgeText}>
                    Friend Requests ({incomingRequests.length})
                  </Text>
                </TouchableOpacity>

                <ScrollView style={styles.scrollList} contentContainerStyle={{ paddingBottom: 100 }}>
                  <Text style={styles.sectionTitle}>All Friends ({filteredFriends.length})</Text>
                  {filteredFriends.length === 0 ? (
                    <Text style={styles.emptyText}>No friends in network</Text>
                  ) : (
                    filteredFriends.map((friend) => {
                      const onlineStatus = onlineStatuses[friend.id] || "offline";
                      return (
                        <View key={friend.id} style={styles.friendListItem}>
                          <View style={styles.friendAvatarWrapper}>
                            {renderAvatar(friend.avatar, styles.chatAvatarEmoji, 32)}
                            <View
                              style={[
                                styles.chatStatusBadge,
                                { backgroundColor: getStatusColor(onlineStatus) },
                              ]}
                            />
                          </View>
                          <View style={styles.friendDetails}>
                            <Text style={styles.friendName}>{friend.name}</Text>
                            <Text style={styles.friendUsername}>@{friend.username}</Text>
                          </View>
                          <TouchableOpacity
                            onPress={async () => {
                              // Open or Create conversation
                              try {
                                const res = await fetch(`${BACKEND_URL}/api/social/conversations`, {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    type: "private",
                                    memberIds: [user!.id, friend.id],
                                  }),
                                });
                                const conv = await res.json();
                                fetchConversations(user!.id);
                                setActiveConversation(conv);
                                setActiveTab("messages");
                                setMobileView("chat");
                              } catch (e) {}
                            }}
                            style={styles.friendChatButton}
                          >
                            <MessageSquare size={14} color="#4B5563" />
                          </TouchableOpacity>
                        </View>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            )}
          </View>
        ) : null}

        {/* MAIN DISPLAY AREA */}
        {(isDesktop || mobileView === "chat") ? (
          activeConversation ? (
            // DIRECT MESSAGES & GROUP CHAT FEED
            <View style={styles.chatFeedContainer}>
            {/* Header bar */}
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderLeft}>
                {!isDesktop && (
                  <TouchableOpacity
                    onPress={() => {
                      setMobileView("list");
                      setActiveConversation(null);
                    }}
                    style={styles.backButton}
                  >
                    <ChevronLeft size={24} color="#111827" />
                  </TouchableOpacity>
                )}

                <View style={styles.chatHeaderAvatar}>
                  {renderAvatar(
                    activeConversation.type === "group"
                      ? "👥"
                      : activeConversation.members?.find((m) => m.id !== user?.id)?.avatar,
                    styles.avatarEmoji,
                    32
                  )}
                </View>

                <View style={styles.chatHeaderTitleContainer}>
                  <Text style={styles.chatHeaderName}>
                    {activeConversation.type === "group"
                      ? activeConversation.name
                      : activeConversation.members?.find((m) => m.id !== user?.id)?.name || "Operator"}
                  </Text>
                  <Text style={styles.chatHeaderStatus}>
                    {activeConversation.type === "group"
                      ? `${activeConversation.members?.length || 0} members`
                      : onlineStatuses[activeConversation.members?.find((m) => m.id !== user?.id)?.id || ""] ||
                        "offline"}
                  </Text>
                </View>
              </View>

              {/* Chat action controls */}
              <View style={styles.chatHeaderRight}>
                <TouchableOpacity onPress={() => setActiveChatSearch(!activeChatSearch)} style={styles.headerIconButton}>
                  <Search size={18} color="#4B5563" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setShowPinnedModal(true)} style={styles.headerIconButton}>
                  <Pin size={18} color="#4B5563" />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setShowMediaModal(true)} style={styles.headerIconButton}>
                  <FolderOpen size={18} color="#4B5563" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Inner Chat Search Bar */}
            {activeChatSearch && (
              <View style={styles.chatSearchBar}>
                <TextInput
                  placeholder="Filter chat messages by text..."
                  placeholderTextColor="#9CA3AF"
                  value={chatSearchText}
                  onChangeText={setChatSearchText}
                  style={styles.chatSearchInput}
                  autoFocus
                />
                <TouchableOpacity onPress={() => { setChatSearchText(""); setActiveChatSearch(false); }}>
                  <X size={18} color="#4B5563" />
                </TouchableOpacity>
              </View>
            )}

            {/* Pinned Messages / Shared Media logs alerts */}
            {pinnedMessages.length > 0 && (
              <TouchableOpacity onPress={() => setShowPinnedModal(true)} style={styles.pinnedBanner}>
                <Pin size={12} color="#4B5563" style={{ marginRight: 6 }} />
                <Text style={styles.pinnedBannerText}>
                  This conversation has {pinnedMessages.length} pinned message(s). Click to view.
                </Text>
              </TouchableOpacity>
            )}

            {/* Message logs scroll */}
            <ScrollView ref={scrollRef} style={styles.messagesScroll} contentContainerStyle={{ paddingVertical: 15 }}>
              {filteredMessages.length === 0 ? (
                <View style={styles.chatWelcomeContainer}>
                  <Text style={styles.chatWelcomeTitle}>
                    Welcome to the start of your workspace thread!
                  </Text>
                  <Text style={styles.chatWelcomeSubtitle}>
                    All communications are secure, real-time, and powered by WebSockets.
                  </Text>
                </View>
              ) : (
                filteredMessages.map((msg) => {
                  const isOwnMessage = msg.senderId === user?.id;
                  const hasReply = msg.replyToId;
                  const repliedMessage = messages.find((m) => m.id === msg.replyToId);

                  return (
                    <View
                      key={msg.id}
                      style={[
                        styles.messageRow,
                        isOwnMessage ? styles.messageRowOwn : styles.messageRowOther,
                      ]}
                    >
                      {/* Avatar */}
                      {!isOwnMessage && (
                        <View style={styles.messageAvatar}>
                          {renderAvatar(msg.senderAvatar, styles.messageAvatarText, 28)}
                        </View>
                      )}

                      <View style={styles.messageBubbleContainer}>
                        {/* Sender info */}
                        {!isOwnMessage && (
                          <Text style={styles.messageSenderName}>
                            {msg.senderName} <Text style={styles.messageSenderUsername}>@{msg.senderUsername}</Text>
                          </Text>
                        )}

                        {/* Reply Preview Card */}
                        {hasReply && (
                          <View style={styles.replyBubblePreview}>
                            <CornerUpLeft size={10} color="#9CA3AF" style={{ marginRight: 4 }} />
                            <Text style={styles.replyBubblePreviewText} numberOfLines={1}>
                              {repliedMessage ? repliedMessage.content : "Original message deleted"}
                            </Text>
                          </View>
                        )}

                        {/* Bubble */}
                        <TouchableOpacity
                          activeOpacity={0.9}
                          onLongPress={() => setMessageMenuMessage(msg)}
                          style={[
                            styles.messageBubble,
                            isOwnMessage ? styles.messageBubbleOwn : styles.messageBubbleOther,
                            msg.pinned === 1 && styles.messageBubblePinned,
                          ]}
                        >
                          {/* Rich attachment rendering */}
                          {msg.mediaUrl && msg.mediaType === "image" && (
                            <RNImage
                              source={{ uri: msg.mediaUrl.startsWith("data:") ? msg.mediaUrl : `${BACKEND_URL}${msg.mediaUrl}` }}
                              style={styles.bubbleImage}
                              resizeMode="cover"
                            />
                          )}

                          {msg.mediaUrl && msg.mediaType === "voice" && (
                            <View style={styles.voiceMessageBubble}>
                              <Volume2 size={18} color={isOwnMessage ? "#FFFFFF" : "#111827"} style={{ marginRight: 8 }} />
                              <AudioLines size={24} color={isOwnMessage ? "#FFFFFF" : "#4B5563"} />
                              <Text style={[styles.voiceDurationText, { color: isOwnMessage ? "#FFFFFF" : "#4B5563" }]}>
                                {msg.content}
                              </Text>
                            </View>
                          )}

                          {msg.mediaUrl && msg.mediaType === "file" && (
                            <View style={styles.fileMessageBubble}>
                              <FileText size={18} color={isOwnMessage ? "#FFFFFF" : "#111827"} style={{ marginRight: 8 }} />
                              <Text style={[styles.fileMessageText, { color: isOwnMessage ? "#FFFFFF" : "#111827" }]} numberOfLines={1}>
                                {msg.content}
                              </Text>
                            </View>
                          )}

                          {msg.mediaUrl && msg.mediaType === "video" && (
                            <View style={styles.fileMessageBubble}>
                              <Video size={18} color={isOwnMessage ? "#FFFFFF" : "#111827"} style={{ marginRight: 8 }} />
                              <Text style={[styles.fileMessageText, { color: isOwnMessage ? "#FFFFFF" : "#111827" }]} numberOfLines={1}>
                                {msg.content}
                              </Text>
                            </View>
                          )}

                          {/* Normal text content */}
                          {msg.mediaType !== "voice" && (
                            <Text style={[styles.messageText, isOwnMessage ? styles.messageTextOwn : styles.messageTextOther]}>
                              {msg.content}
                            </Text>
                          )}

                          {/* Seen / Delivered ticks (only for own messages) */}
                          <View style={styles.messageMetaWrapper}>
                            <Text style={[styles.messageTime, { color: isOwnMessage ? "#E5E7EB" : "#9CA3AF" }]}>
                              {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              }) : ""}
                            </Text>
                            {isOwnMessage && (
                              <View style={styles.tickContainer}>
                                {msg.seen === 1 ? (
                                  <CheckCheck size={12} color="#60A5FA" /> // Seen (Blue tick)
                                ) : (
                                  <CheckCheck size={12} color="#D1D5DB" /> // Delivered (Gray ticks)
                                )}
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>

                        {/* Reactions render */}
                        {msg.reactions && msg.reactions.length > 0 && (
                          <View style={styles.messageReactionsRow}>
                            {msg.reactions.map((rxn) => (
                              <TouchableOpacity
                                key={rxn.id}
                                onPress={() => handleToggleReaction(msg.id, rxn.reaction)}
                                style={styles.reactionPill}
                              >
                                <Text style={styles.reactionEmoji}>{rxn.reaction}</Text>
                                <Text style={styles.reactionCount}>@{rxn.username}</Text>
                              </TouchableOpacity>
                            ))}
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })
              )}

              {/* Real-time Typing Indicator Status animation */}
              {typingStatus[activeConversation.id] && typingStatus[activeConversation.id].length > 0 && (
                <View style={styles.typingIndicatorCard}>
                  <View style={styles.typingDotsWrapper}>
                    <Text style={styles.typingText}>
                      {typingStatus[activeConversation.id].join(", ")} is typing...
                    </Text>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Edit/Reply preview panels above input */}
            {replyingToMessage && (
              <View style={styles.actionPreviewBar}>
                <View style={styles.actionPreviewTextWrap}>
                  <Text style={styles.actionPreviewTitle}>Replying to @{replyingToMessage.senderUsername}</Text>
                  <Text style={styles.actionPreviewSubtitle} numberOfLines={1}>
                    {replyingToMessage.content}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setReplyingToMessage(null)}>
                  <X size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}

            {editingMessage && (
              <View style={styles.actionPreviewBar}>
                <View style={styles.actionPreviewTextWrap}>
                  <Text style={styles.actionPreviewTitle}>Editing Message</Text>
                  <Text style={styles.actionPreviewSubtitle} numberOfLines={1}>
                    {editingMessage.content}
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setEditingMessage(null)}>
                  <X size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}

            {/* Selected Image Preview */}
            {selectedImageUri && (
              <View style={styles.imagePreviewBar}>
                <RNImage source={{ uri: selectedImageUri }} style={styles.imagePreviewThumb} />
                <TouchableOpacity
                  onPress={() => {
                    setSelectedImageUri(null);
                    setSelectedImageBase64(null);
                  }}
                  style={styles.imagePreviewClose}
                >
                  <X size={14} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            )}

            {/* Input keyboard block */}
            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              keyboardVerticalOffset={90}
              style={styles.chatInputContainer}
            >
              {emojiPickerVisible && (
                <View style={styles.emojiPickerBar}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.emojiPickerScroll}>
                    {["😀", "😂", "👍", "❤️", "🔥", "🎉", "🚀", "💡", "💯", "🙏", "👀"].map((emoji) => (
                      <TouchableOpacity
                        key={emoji}
                        onPress={() => {
                          if (editingMessage) {
                            setEditText((prev) => prev + emoji);
                          } else {
                            setMessageText((prev) => prev + emoji);
                          }
                        }}
                        style={styles.emojiSelectBtn}
                      >
                        <Text style={styles.emojiSelectText}>{emoji}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {recordingVoice ? (
                <View style={styles.recordingOverlay}>
                  <View style={styles.recordingWaves}>
                    <View style={[styles.recordingWaveDot, styles.recordingWaveDotActive]} />
                    <Text style={styles.recordingText}>Recording Voice Message... {formatTime(recordingSeconds)}</Text>
                  </View>
                  <TouchableOpacity onPress={stopRecordingVoice} style={styles.stopRecordingButton}>
                    <Text style={styles.stopRecordingButtonText}>Release & Send</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.inputInnerWrapper}>
                  <TouchableOpacity
                    onPress={() => setShowAttachmentMenu(!showAttachmentMenu)}
                    style={styles.inputActionButton}
                  >
                    <Paperclip size={20} color="#4B5563" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setEmojiPickerVisible(!emojiPickerVisible)}
                    style={styles.inputActionButton}
                  >
                    <Smile size={20} color={emojiPickerVisible ? "#10B981" : "#4B5563"} />
                  </TouchableOpacity>

                  {showAttachmentMenu && (
                    <View style={styles.attachmentPopup}>
                      <TouchableOpacity onPress={pickImage} style={styles.attachmentOption}>
                        <Text style={styles.attachmentOptionEmoji}>🖼️</Text>
                        <Text style={styles.attachmentOptionText}>Select Photo</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => attachMockFile("pdf")} style={styles.attachmentOption}>
                        <Text style={styles.attachmentOptionEmoji}>📄</Text>
                        <Text style={styles.attachmentOptionText}>Attach PDF</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => attachMockFile("doc")} style={styles.attachmentOption}>
                        <Text style={styles.attachmentOptionEmoji}>📝</Text>
                        <Text style={styles.attachmentOptionText}>Attach Document</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={pickVideo} style={styles.attachmentOption}>
                        <Text style={styles.attachmentOptionEmoji}>🎥</Text>
                        <Text style={styles.attachmentOptionText}>Select Video</Text>
                      </TouchableOpacity>
                    </View>
                  )}

                  <TextInput
                    value={editingMessage ? editText : messageText}
                    onChangeText={editingMessage ? setEditText : handleMessageChange}
                    placeholder="Message..."
                    placeholderTextColor="#94A3B8"
                    style={styles.chatInput}
                    multiline
                    onKeyPress={(e: any) => {
                      if (e.nativeEvent.key === "Enter" && !e.nativeEvent.shiftKey) {
                        if (Platform.OS === "web" && typeof e.preventDefault === "function") {
                          e.preventDefault();
                        }
                        if (editingMessage) {
                          handleEditMessage();
                        } else {
                          handleSendDM();
                        }
                      }
                    }}
                  />

                  {/* Microphone Record triggers */}
                  <TouchableOpacity
                    onPressIn={startRecordingVoice}
                    style={styles.inputActionButton}
                  >
                    <Mic size={20} color={recordingVoice ? "#EF4444" : "#4B5563"} />
                  </TouchableOpacity>

                  {/* Submit Trigger */}
                  <TouchableOpacity
                    onPress={editingMessage ? handleEditMessage : handleSendDM}
                    style={styles.sendButton}
                  >
                    <Send size={18} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              )}
            </KeyboardAvoidingView>
          </View>
        ) : activeTab === "add_friend" ? (
          // ADD FRIEND SCREEN
          <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
            {/* Header bar */}
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderLeft}>
                {!isDesktop && (
                  <TouchableOpacity onPress={() => setMobileView("list")} style={styles.backButton}>
                    <ChevronLeft size={24} color="#111827" />
                  </TouchableOpacity>
                )}
                <View style={styles.chatHeaderTitleContainer}>
                  <Text style={styles.chatHeaderName}>Add Friend</Text>
                  <Text style={styles.chatHeaderStatus}>Connect network</Text>
                </View>
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.mainSocialContainer} showsVerticalScrollIndicator={false}>
              <Text style={styles.socialHeaderSub}>
                Collaborate and chat privately. Enter your contact's username, name, or email.
              </Text>

              <View style={styles.addFriendForm}>
                <TextInput
                  placeholder="Username, Name, or Email"
                  placeholderTextColor="#9CA3AF"
                  value={addFriendUsername}
                  onChangeText={setAddFriendUsername}
                  style={styles.addFriendInput}
                  autoCapitalize="none"
                />
                <TouchableOpacity onPress={handleAddFriend} style={styles.sendRequestButton}>
                  <Text style={styles.sendRequestButtonText}>Send Request</Text>
                </TouchableOpacity>
              </View>

              {/* Reactive Live Search Results */}
              {addFriendUsername.length >= 2 ? (
                <View style={{ marginBottom: 30 }}>
                  <Text style={styles.subHeaderTitle}>Search Results</Text>
                  {addFriendSearchLoading ? (
                    <ActivityIndicator size="small" color="#111827" style={{ marginVertical: 20 }} />
                  ) : addFriendSearchResults.length === 0 ? (
                    <Text style={styles.emptySocialText}>No matching accounts found</Text>
                  ) : (
                    addFriendSearchResults.map((u) => (
                      <View key={u.id} style={styles.requestCard}>
                        <View style={styles.requestCardLeft}>
                          <View style={styles.messageAvatar}>
                            <Text style={{ fontSize: 16 }}>{u.name?.[0] || '?'}</Text>
                          </View>
                          <View style={styles.requestMeta}>
                            <Text style={styles.requestName}>{u.name}</Text>
                            <Text style={styles.requestUsername}>{u.username.startsWith("@") ? u.username : `@${u.username}`} {u.email ? `(${u.email})` : ""}</Text>
                          </View>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleAddFriendUser(u.username)}
                          style={[styles.actionBtn, styles.actionBtnAccept, { paddingHorizontal: 12 }]}
                        >
                          <Text style={styles.actionBtnText}>Add Friend</Text>
                        </TouchableOpacity>
                      </View>
                    ))
                  )}
                </View>
              ) : null}

              {/* List of recommended agent names to add */}
              <Text style={styles.subHeaderTitle}>Available Virtual AI Experts</Text>
              <View style={styles.agentNetworkList}>
                {AGENT_ACCOUNTS.map((agent) => (
                  <View key={agent.username} style={styles.agentCard}>
                    <Text style={agent.avatar.length > 2 ? { fontSize: 14 } : styles.agentCardAvatar}>{agent.avatar}</Text>
                    <Text style={styles.agentCardName}>{agent.name}</Text>
                    <Text style={styles.agentCardUsername}>@{agent.username}</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setAddFriendUsername(agent.username);
                      }}
                      style={styles.agentAddButton}
                    >
                      <Text style={styles.agentAddButtonText}>Select</Text>
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        ) : activeTab === "requests" ? (
          // FRIEND REQUESTS INBOX
          <View style={{ flex: 1, backgroundColor: "#FFFFFF" }}>
            {/* Header bar */}
            <View style={styles.chatHeader}>
              <View style={styles.chatHeaderLeft}>
                {!isDesktop && (
                  <TouchableOpacity onPress={() => setMobileView("list")} style={styles.backButton}>
                    <ChevronLeft size={24} color="#111827" />
                  </TouchableOpacity>
                )}
                <View style={styles.chatHeaderTitleContainer}>
                  <Text style={styles.chatHeaderName}>Friend Inbox</Text>
                  <Text style={styles.chatHeaderStatus}>Pending requests</Text>
                </View>
              </View>
            </View>

            <ScrollView contentContainerStyle={styles.mainSocialContainer} showsVerticalScrollIndicator={false}>
              <View style={styles.socialSubTabs}>
                {(["pending", "accepted", "declined"] as const).map((tab) => (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setFriendsSubTab(tab)}
                    style={[styles.socialSubTab, friendsSubTab === tab && styles.socialSubTabActive]}
                  >
                    <Text style={[styles.socialSubTabText, friendsSubTab === tab && styles.socialSubTabTextActive]}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={{ paddingVertical: 10 }}>
                {incomingRequests.filter((r) => r.status === friendsSubTab).length === 0 ? (
                  <Text style={styles.emptySocialText}>No requests in this tab</Text>
                ) : (
                  incomingRequests
                    .filter((r) => r.status === friendsSubTab)
                    .map((req) => (
                      <View key={req.id} style={styles.requestCard}>
                        <View style={styles.requestCardLeft}>
                          {renderAvatar(req.senderAvatar, styles.chatAvatarEmoji, 32)}
                          <View style={styles.requestMeta}>
                            <Text style={styles.requestName}>{req.senderName || "Operator"}</Text>
                            <Text style={styles.requestUsername}>@{req.senderUsername}</Text>
                          </View>
                        </View>

                        {req.status === "pending" && (
                          <View style={styles.requestActions}>
                            <TouchableOpacity
                              onPress={() => handleRespondRequest(req.id, "accepted")}
                              style={[styles.actionBtn, styles.actionBtnAccept]}
                            >
                              <Text style={styles.actionBtnText}>Accept</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                              onPress={() => handleRespondRequest(req.id, "declined")}
                              style={[styles.actionBtn, styles.actionBtnDecline]}
                            >
                              <Text style={styles.actionBtnText}>Decline</Text>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    ))
                )}
              </View>
            </ScrollView>
          </View>
        ) : (
          // WELCOME PLACEHOLDER
          <View style={styles.welcomePlaceholder}>
            <MessageSquare size={48} color="#9CA3AF" />
            <Text style={styles.welcomePlaceholderTitle}>Start Collaborating in FounderOS</Text>
            <Text style={styles.welcomePlaceholderSubtitle}>
              Select a conversation, browse your friends list, or send a friend request to get started.
            </Text>
          </View>
        )) : null}
      </View>

      {/* CREATE GROUP MODAL */}
      <Modal visible={showGroupModal} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>New Collaboration Group</Text>
              <TouchableOpacity onPress={() => setShowGroupModal(false)}>
                <X size={20} color="#111827" />
              </TouchableOpacity>
            </View>

            <TextInput
              placeholder="Group Name (e.g. Alpha Founders Team)"
              placeholderTextColor="#9CA3AF"
              value={groupName}
              onChangeText={setGroupName}
              style={styles.modalInput}
            />

            <Text style={styles.modalSectionTitle}>Select Friends to Invite</Text>
            {friends.length === 0 ? (
              <Text style={styles.modalEmptyText}>Add friends to network first</Text>
            ) : (
              <FlatList
                data={friends}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isChecked = selectedFriendsForGroup.includes(item.id);
                  return (
                    <TouchableOpacity
                      onPress={() => {
                        if (isChecked) {
                          setSelectedFriendsForGroup(selectedFriendsForGroup.filter((id) => id !== item.id));
                        } else {
                          setSelectedFriendsForGroup([...selectedFriendsForGroup, item.id]);
                        }
                      }}
                      style={styles.modalCheckboxItem}
                    >
                      {renderAvatar(item.avatar, styles.chatAvatarEmoji, 32)}
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.friendName}>{item.name}</Text>
                        <Text style={styles.friendUsername}>@{item.username}</Text>
                      </View>
                      <View style={[styles.checkbox, isChecked && styles.checkboxChecked]}>
                        {isChecked && <Check size={12} color="#FFFFFF" />}
                      </View>
                    </TouchableOpacity>
                  );
                }}
                style={{ maxHeight: 200 }}
              />
            )}

            <TouchableOpacity onPress={handleCreateGroup} style={styles.modalSubmitButton}>
              <Text style={styles.modalSubmitButtonText}>Create Group Chat</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MESSAGE ACTIONS CONTEXT MENU */}
      <Modal visible={messageMenuMessage !== null} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.modalBackground}
          activeOpacity={1}
          onPress={() => setMessageMenuMessage(null)}
        >
          <View style={styles.contextMenuContent}>
            <Text style={styles.contextMenuHeader}>Message Actions</Text>

            {/* Quick Reactions line */}
            <View style={styles.quickReactionsRow}>
              {["👍", "❤️", "🔥", "😂", "👏"].map((emoji) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => {
                    handleToggleReaction(messageMenuMessage!.id, emoji);
                    setMessageMenuMessage(null);
                  }}
                  style={styles.quickReactionEmojiBtn}
                >
                  <Text style={{ fontSize: 20 }}>{emoji}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              onPress={() => {
                setReplyingToMessage(messageMenuMessage);
                setMessageMenuMessage(null);
              }}
              style={styles.contextOption}
            >
              <Reply size={16} color="#4B5563" style={{ marginRight: 10 }} />
              <Text style={styles.contextOptionText}>Reply to Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                if (messageMenuMessage?.content) {
                  await Clipboard.setStringAsync(messageMenuMessage.content);
                  showAlertDialog("success", "Copied", "Message copied to clipboard.");
                }
                setMessageMenuMessage(null);
              }}
              style={styles.contextOption}
            >
              <Copy size={16} color="#4B5563" style={{ marginRight: 10 }} />
              <Text style={styles.contextOptionText}>Copy Message</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                setForwardingMessage(messageMenuMessage);
                setShowForwardModal(true);
                setMessageMenuMessage(null);
              }}
              style={styles.contextOption}
            >
              <CornerUpRight size={16} color="#4B5563" style={{ marginRight: 10 }} />
              <Text style={styles.contextOptionText}>Forward Message</Text>
            </TouchableOpacity>

            {messageMenuMessage?.senderId === user?.id && (
              <TouchableOpacity
                onPress={() => {
                  if (!messageMenuMessage) return;
                  setEditingMessage(messageMenuMessage);
                  setEditText(messageMenuMessage.content);
                  setMessageMenuMessage(null);
                }}
                style={styles.contextOption}
              >
                <Edit2 size={16} color="#4B5563" style={{ marginRight: 10 }} />
                <Text style={styles.contextOptionText}>Edit Message</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              onPress={() => {
                handlePinMessage(messageMenuMessage!);
                setMessageMenuMessage(null);
              }}
              style={styles.contextOption}
            >
              <Pin size={16} color="#4B5563" style={{ marginRight: 10 }} />
              <Text style={styles.contextOptionText}>
                {messageMenuMessage?.pinned === 1 ? "Unpin Message" : "Pin Message"}
              </Text>
            </TouchableOpacity>

            {messageMenuMessage?.senderId === user?.id && (
              <TouchableOpacity
                onPress={() => {
                  handleDeleteMessage(messageMenuMessage!.id);
                  setMessageMenuMessage(null);
                }}
                style={[styles.contextOption, styles.contextOptionDanger]}
              >
                <Trash2 size={16} color="#EF4444" style={{ marginRight: 10 }} />
                <Text style={styles.contextOptionTextDanger}>Delete for Everyone</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* PINNED MESSAGES OVERLAY DRAWER */}
      <Modal visible={showPinnedModal} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.drawerContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📌 Pinned Messages</Text>
              <TouchableOpacity onPress={() => setShowPinnedModal(false)}>
                <X size={20} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
              {pinnedMessages.length === 0 ? (
                <Text style={styles.modalEmptyText}>No pinned messages in this room</Text>
              ) : (
                pinnedMessages.map((msg) => (
                  <View key={msg.id} style={styles.pinnedMsgCard}>
                    <View style={styles.pinnedMsgHeader}>
                      <Text style={styles.pinnedMsgSender}>{msg.senderName}</Text>
                      <TouchableOpacity onPress={() => handlePinMessage(msg)}>
                        <Text style={styles.unpinText}>Unpin</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.pinnedMsgBody}>{msg.content}</Text>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* SHARED MEDIA LOG SHEET */}
      <Modal visible={showMediaModal} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.drawerContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📂 Shared Files & Media</Text>
              <TouchableOpacity onPress={() => setShowMediaModal(false)}>
                <X size={20} color="#111827" />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingVertical: 10 }}>
              {mediaMessages.length === 0 ? (
                <Text style={styles.modalEmptyText}>No attachments shared yet</Text>
              ) : (
                <View style={styles.mediaGrid}>
                  {mediaMessages.map((msg) => {
                    const isImg = msg.mediaType === "image";
                    return (
                      <View key={msg.id} style={styles.mediaGridItem}>
                        {isImg ? (
                          <RNImage source={{ uri: msg.mediaUrl!.startsWith("data:") ? msg.mediaUrl! : `${BACKEND_URL}${msg.mediaUrl}` }} style={styles.mediaGridImage} />
                        ) : (
                          <View style={styles.mediaFileCard}>
                            <FileText size={28} color="#4B5563" />
                            <Text style={styles.mediaFileText} numberOfLines={1}>
                              {msg.content.replace("📄 Document Attachment: ", "")}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.mediaSenderName} numberOfLines={1}>
                          Shared by {msg.senderName}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* FORWARD MESSAGE MODAL */}
      <Modal visible={showForwardModal} animationType="slide" transparent>
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Forward Message</Text>
              <TouchableOpacity onPress={() => { setShowForwardModal(false); setForwardingMessage(null); }}>
                <X size={20} color="#111827" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSectionTitle}>Select Conversation to Forward to</Text>
            {conversations.length === 0 ? (
              <Text style={styles.modalEmptyText}>No active conversations</Text>
            ) : (
              <FlatList
                data={conversations}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => {
                  const isGroup = item.type === "group";
                  const partner = item.members?.find((m) => m.id !== user?.id);
                  const displayName = isGroup ? item.name : partner?.name || "Operator";
                  const displayUsername = isGroup ? `${item.members?.length || 0} members` : `@${partner?.username || ""}`;
                  const displayAvatar = isGroup ? "👥" : partner?.avatar || "👤";

                  return (
                    <View style={styles.modalCheckboxItem}>
                      {renderAvatar(displayAvatar, styles.chatAvatarEmoji, 32)}
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.friendName}>{displayName}</Text>
                        <Text style={styles.friendUsername}>{displayUsername}</Text>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleForwardMessage(item.id)}
                        style={[styles.actionBtn, styles.actionBtnAccept, { paddingHorizontal: 12 }]}
                      >
                        <Text style={styles.actionBtnText}>Forward</Text>
                      </TouchableOpacity>
                    </View>
                  );
                }}
                style={{ maxHeight: 200 }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* STATUS CHOOSE MODAL */}
      <Modal visible={showStatusMenu} animationType="fade" transparent>
        <TouchableOpacity
          style={styles.modalBackground}
          activeOpacity={1}
          onPress={() => setShowStatusMenu(false)}
        >
          <View style={styles.statusModalContent}>
            <Text style={styles.statusModalTitle}>Update Your Status</Text>
            {(["online", "away", "busy", "offline"] as const).map((status) => (
              <TouchableOpacity
                key={status}
                style={styles.statusModalOption}
                onPress={() => {
                  setMyStatus(status);
                  setShowStatusMenu(false);
                }}
              >
                <View style={[styles.statusDot, { backgroundColor: getStatusColor(status), width: 10, height: 10, borderRadius: 5 }]} />
                <Text style={styles.statusModalOptionText}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      <Dialog
        visible={dialogConfig.visible}
        onClose={() => setDialogConfig(prev => ({ ...prev, visible: false }))}
        type={dialogConfig.type}
        title={dialogConfig.title}
        description={dialogConfig.description}
        confirmLabel={dialogConfig.confirmLabel}
        cancelLabel={dialogConfig.cancelLabel}
        onConfirm={() => {
          if (dialogConfig.onConfirm) {
            dialogConfig.onConfirm();
          }
          setDialogConfig(prev => ({ ...prev, visible: false }));
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  dashboardContainer: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#F9FAFB",
  },
  sidebar: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRightWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    flexDirection: "column",
  },
  sidebarDesktop: {
    width: 320,
  },
  sidebarHeader: {
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    position: "relative",
  },
  userInfoWrapper: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarButton: {
    position: "relative",
    marginRight: 10,
  },
  avatarEmoji: {
    fontSize: 24,
  },
  statusBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userTextInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  userUsername: {
    fontSize: 12,
    color: "#6B7280",
  },
  statusDropdown: {
    position: "absolute",
    top: 55,
    left: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 6,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 100,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
  },
  statusOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: 120,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusOptionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  searchContainer: {
    margin: 12,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 38,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: "#111827",
    padding: 0,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  sidebarTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginRight: 6,
    backgroundColor: "transparent",
  },
  sidebarTabActive: {
    backgroundColor: "#F3F4F6",
  },
  sidebarTabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
    marginLeft: 6,
  },
  sidebarTabTextActive: {
    color: "#111827",
  },
  scrollList: {
    flex: 1,
    paddingHorizontal: 12,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 10,
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: "800",
    textTransform: "uppercase",
    color: "#9CA3AF",
    letterSpacing: 0.5,
  },
  addButton: {
    padding: 4,
  },
  emptyText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 20,
    fontStyle: "italic",
  },
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
    marginBottom: 4,
  },
  chatItemActive: {
    backgroundColor: "#F3F4F6",
  },
  chatAvatarWrapper: {
    position: "relative",
    marginRight: 10,
  },
  chatAvatarEmoji: {
    fontSize: 20,
  },
  chatStatusBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  chatItemDetails: {
    flex: 1,
  },
  chatItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  chatItemName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  chatItemTime: {
    fontSize: 10,
    color: "#9CA3AF",
  },
  chatItemSub: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  socialLayout: {
    flex: 1,
    flexDirection: "column",
  },
  addFriendSidebarButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111827",
    marginHorizontal: 12,
    marginVertical: 4,
    height: 38,
    borderRadius: 10,
  },
  addFriendSidebarButtonText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  requestsBadgeButton: {
    backgroundColor: "#F3F4F6",
    marginHorizontal: 12,
    marginBottom: 8,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  requestsBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  friendListItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  friendAvatarWrapper: {
    position: "relative",
    marginRight: 10,
  },
  friendDetails: {
    flex: 1,
  },
  friendName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  friendUsername: {
    fontSize: 11,
    color: "#6B7280",
  },
  friendChatButton: {
    backgroundColor: "#F3F4F6",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  chatFeedContainer: {
    flex: 1,
    backgroundColor: "#F9FAFB",
    flexDirection: "column",
  },
  chatHeader: {
    height: 60,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  chatHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  backButton: {
    marginRight: 10,
  },
  chatHeaderAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  chatHeaderTitleContainer: {
    flexDirection: "column",
  },
  chatHeaderName: {
    fontSize: 14,
    fontWeight: "700",
    color: "#111827",
  },
  chatHeaderStatus: {
    fontSize: 11,
    color: "#10B981",
    textTransform: "capitalize",
  },
  chatHeaderRight: {
    flexDirection: "row",
  },
  headerIconButton: {
    marginLeft: 14,
    padding: 4,
  },
  chatSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  chatSearchInput: {
    flex: 1,
    fontSize: 12,
    color: "#111827",
    padding: 0,
    marginRight: 10,
  },
  pinnedBanner: {
    backgroundColor: "#EFF6FF",
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderColor: "#DBEAFE",
  },
  pinnedBannerText: {
    fontSize: 11,
    color: "#1D4ED8",
    fontWeight: "500",
  },
  messagesScroll: {
    flex: 1,
    paddingHorizontal: 16,
  },
  chatWelcomeContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 50,
    paddingHorizontal: 24,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginHorizontal: 16,
    marginVertical: 40,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.04,
    shadowRadius: 20,
    elevation: 4,
  },
  chatWelcomeTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
    textAlign: "center",
    marginBottom: 8,
    letterSpacing: -0.2,
  },
  chatWelcomeSubtitle: {
    fontSize: 13,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 18,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 14,
    width: "100%",
  },
  messageRowOwn: {
    justifyContent: "flex-end",
  },
  messageRowOther: {
    justifyContent: "flex-start",
  },
  messageAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
    marginTop: 2,
  },
  messageAvatarText: {
    fontSize: 14,
  },
  messageBubbleContainer: {
    maxWidth: "75%",
  },
  messageSenderName: {
    fontSize: 11,
    fontWeight: "700",
    color: "#4B5563",
    marginBottom: 4,
    marginLeft: 4,
  },
  messageSenderUsername: {
    fontWeight: "400",
    color: "#9CA3AF",
  },
  replyBubblePreview: {
    backgroundColor: "#F3F4F6",
    borderLeftWidth: 3,
    borderColor: "#9CA3AF",
    paddingHorizontal: 6,
    paddingVertical: 3,
    marginBottom: 2,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  replyBubblePreviewText: {
    fontSize: 10,
    color: "#6B7280",
  },
  messageBubble: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  messageBubbleOwn: {
    backgroundColor: "#0F172A", // Modern Slate-900
    borderTopRightRadius: 4,
    borderBottomRightRadius: 16,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  messageBubbleOther: {
    backgroundColor: "#F1F5F9", // Sleek light Slate-100
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.02)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  messageBubblePinned: {
    borderColor: "#F59E0B",
    borderWidth: 1.5,
  },
  bubbleImage: {
    width: 180,
    height: 120,
    borderRadius: 8,
    marginBottom: 4,
  },
  voiceMessageBubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  voiceDurationText: {
    fontSize: 11,
    marginLeft: 8,
    fontWeight: "600",
  },
  fileMessageBubble: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 4,
  },
  fileMessageText: {
    fontSize: 12,
    fontWeight: "500",
    maxWidth: 140,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  messageTextOwn: {
    color: "#FFFFFF",
  },
  messageTextOther: {
    color: "#111827",
  },
  messageMetaWrapper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    marginTop: 4,
  },
  messageTime: {
    fontSize: 9,
  },
  tickContainer: {
    marginLeft: 4,
  },
  messageReactionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  reactionPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
    marginRight: 4,
    marginTop: 2,
  },
  reactionEmoji: {
    fontSize: 11,
  },
  reactionCount: {
    fontSize: 9,
    fontWeight: "500",
    color: "#4B5563",
    marginLeft: 2,
  },
  typingIndicatorCard: {
    paddingLeft: 8,
    marginBottom: 10,
  },
  typingDotsWrapper: {
    flexDirection: "row",
    alignItems: "center",
  },
  typingText: {
    fontSize: 11,
    color: "#9CA3AF",
    fontStyle: "italic",
  },
  actionPreviewBar: {
    flexDirection: "row",
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  actionPreviewTextWrap: {
    flex: 1,
  },
  actionPreviewTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
  },
  actionPreviewSubtitle: {
    fontSize: 11,
    color: "#6B7280",
  },
  imagePreviewBar: {
    flexDirection: "row",
    padding: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    position: "relative",
  },
  imagePreviewThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
  },
  imagePreviewClose: {
    position: "absolute",
    top: 4,
    left: 64,
    backgroundColor: "#EF4444",
    borderRadius: 10,
    padding: 2,
  },
  chatInputContainer: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    padding: 12,
  },
  recordingOverlay: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#FEF2F2",
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 44,
  },
  recordingWaves: {
    flexDirection: "row",
    alignItems: "center",
  },
  recordingWaveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    marginRight: 8,
  },
  recordingWaveDotActive: {
    opacity: 0.6,
  },
  recordingText: {
    fontSize: 12,
    color: "#EF4444",
    fontWeight: "600",
  },
  stopRecordingButton: {
    backgroundColor: "#EF4444",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  stopRecordingButtonText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  inputInnerWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    position: "relative",
  },
  inputActionButton: {
    padding: 8,
  },
  attachmentPopup: {
    position: "absolute",
    bottom: 50,
    left: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.08)",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    zIndex: 999,
  },
  attachmentOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    width: 150,
  },
  attachmentOptionEmoji: {
    fontSize: 16,
    marginRight: 8,
  },
  attachmentOptionText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
  },
  chatInput: {
    flex: 1,
    fontSize: 13,
    color: "#0F172A",
    maxHeight: 100,
    paddingVertical: 8,
    paddingHorizontal: 8,
    ...Platform.select({
      web: {
        outlineStyle: "none",
      } as any,
    }),
  },
  sendButton: {
    backgroundColor: "#111827",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 6,
  },
  mainSocialContainer: {
    flex: 1,
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  socialHeaderTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },
  socialHeaderSub: {
    fontSize: 13,
    color: "#6B7280",
    lineHeight: 18,
    marginBottom: 20,
  },
  addFriendForm: {
    flexDirection: "row",
    marginBottom: 30,
  },
  addFriendInput: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 14,
    color: "#111827",
    height: 44,
    marginRight: 10,
  },
  sendRequestButton: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingHorizontal: 16,
    justifyContent: "center",
    alignItems: "center",
    height: 44,
  },
  sendRequestButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  subHeaderTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#374151",
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  agentNetworkList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  agentCard: {
    width: "48%",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
    borderRadius: 12,
    padding: 12,
    marginRight: "2%",
    marginBottom: 12,
    alignItems: "center",
  },
  agentCardAvatar: {
    fontSize: 28,
    marginBottom: 6,
  },
  agentCardName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
  },
  agentCardUsername: {
    fontSize: 10,
    color: "#6B7280",
    marginBottom: 8,
  },
  agentAddButton: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  agentAddButtonText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#374151",
  },
  socialSubTabs: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    marginBottom: 14,
  },
  socialSubTab: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderBottomWidth: 2,
    borderColor: "transparent",
  },
  socialSubTabActive: {
    borderColor: "#111827",
  },
  socialSubTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  socialSubTabTextActive: {
    color: "#111827",
  },
  emptySocialText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginTop: 40,
    fontStyle: "italic",
  },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F9FAFB",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.03)",
  },
  requestCardLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  requestMeta: {
    marginLeft: 10,
  },
  requestName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#111827",
  },
  requestUsername: {
    fontSize: 11,
    color: "#6B7280",
  },
  requestActions: {
    flexDirection: "row",
  },
  actionBtn: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginLeft: 6,
  },
  actionBtnAccept: {
    backgroundColor: "#10B981",
  },
  actionBtnDecline: {
    backgroundColor: "#EF4444",
  },
  actionBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  welcomePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: "#F9FAFB",
  },
  welcomePlaceholderTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    marginTop: 12,
    marginBottom: 4,
  },
  welcomePlaceholderSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 260,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    padding: 20,
    elevation: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
  },
  modalInput: {
    backgroundColor: "#F3F4F6",
    borderRadius: 10,
    paddingHorizontal: 14,
    height: 44,
    fontSize: 13,
    color: "#111827",
    marginBottom: 16,
  },
  modalSectionTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#4B5563",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  modalEmptyText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    marginVertical: 12,
  },
  modalCheckboxItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: "#D1D5DB",
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxChecked: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  modalSubmitButton: {
    backgroundColor: "#111827",
    borderRadius: 10,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  modalSubmitButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
  contextMenuContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: 260,
    padding: 14,
    elevation: 20,
  },
  contextMenuHeader: {
    fontSize: 12,
    fontWeight: "800",
    color: "#9CA3AF",
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 0.5,
    paddingLeft: 4,
  },
  quickReactionsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderColor: "#F3F4F6",
  },
  quickReactionEmojiBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  contextOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  contextOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  contextOptionDanger: {
    marginTop: 8,
    borderTopWidth: 1,
    borderColor: "#FEE2E2",
    paddingTop: 12,
  },
  contextOptionTextDanger: {
    fontSize: 13,
    fontWeight: "700",
    color: "#EF4444",
  },
  drawerContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    maxHeight: "80%",
    padding: 20,
  },
  pinnedMsgCard: {
    backgroundColor: "#FFFBEB",
    borderColor: "#FDE68A",
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  pinnedMsgHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  pinnedMsgSender: {
    fontSize: 12,
    fontWeight: "700",
    color: "#78350F",
  },
  unpinText: {
    fontSize: 11,
    color: "#D97706",
    fontWeight: "600",
  },
  pinnedMsgBody: {
    fontSize: 12,
    color: "#451A03",
    lineHeight: 16,
  },
  mediaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  mediaGridItem: {
    width: "48%",
    marginBottom: 14,
  },
  mediaGridImage: {
    width: "100%",
    height: 100,
    borderRadius: 8,
  },
  mediaFileCard: {
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
  },
  mediaFileText: {
    fontSize: 10,
    color: "#4B5563",
    marginTop: 4,
    fontWeight: "600",
  },
  mediaSenderName: {
    fontSize: 10,
    color: "#9CA3AF",
    marginTop: 4,
    textAlign: "center",
  },
  emojiPickerBar: {
    backgroundColor: "#F3F4F6",
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
    marginBottom: 6,
  },
  emojiPickerScroll: {
    flexDirection: "row",
    alignItems: "center",
  },
  emojiSelectBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginRight: 6,
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.04)",
  },
  emojiSelectText: {
    fontSize: 16,
  },
  statusModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    width: 240,
    padding: 16,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  statusModalTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#9CA3AF",
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 0.5,
    paddingLeft: 4,
  },
  statusModalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  statusModalOptionText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 10,
  },
});
