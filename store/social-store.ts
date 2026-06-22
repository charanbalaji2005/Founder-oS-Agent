import { create } from "zustand";
import { BACKEND_URL } from "@/constants";
import io, { Socket } from "socket.io-client";

export interface Conversation {
  id: string;
  type: "private" | "group";
  name?: string | null;
  icon?: string | null;
  members: {
    id: string;
    name: string;
    username: string;
    avatar?: string | null;
  }[];
  lastMessage?: DirectMessage | null;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatar?: string | null;
  content: string;
  mediaUrl?: string | null;
  mediaType?: string | null; // image, file, voice
  replyToId?: string | null;
  seen: number; // 0 or 1
  edited: number; // 0 or 1
  pinned: number; // 0 or 1
  createdAt: string;
  reactions: {
    id: string;
    userId: string;
    reaction: string;
    username: string;
  }[];
}

export interface Friend {
  id: string;
  name: string;
  username: string;
  avatar?: string | null;
  status: "online" | "away" | "busy" | "offline";
}

export interface FriendRequest {
  id: string;
  senderId?: string;
  receiverId?: string;
  status: string;
  createdAt: string;
  senderName?: string;
  senderUsername?: string;
  senderAvatar?: string | null;
  receiverName?: string;
  receiverUsername?: string;
  receiverAvatar?: string | null;
}

interface SocialStore {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  messages: DirectMessage[];
  friends: Friend[];
  incomingRequests: FriendRequest[];
  outgoingRequests: FriendRequest[];
  socket: Socket | null;
  onlineStatuses: Record<string, "online" | "away" | "busy" | "offline">;
  typingStatus: Record<string, string[]>; // conversationId -> array of usernames typing
  isLoading: boolean;

  fetchConversations: (userId: string) => Promise<void>;
  setActiveConversation: (conv: Conversation | null) => void;
  fetchMessages: (conversationId: string) => Promise<void>;
  fetchFriends: (userId: string) => Promise<void>;
  fetchRequests: (userId: string) => Promise<void>;
  connectSocket: (userId: string) => void;
  disconnectSocket: () => void;
  sendDM: (payload: {
    conversationId: string;
    senderId: string;
    content: string;
    mediaUrl?: string | null;
    mediaType?: string | null;
    replyToId?: string | null;
  }) => void;
  sendFriendRequest: (senderId: string, username: string, senderUsername: string) => Promise<void>;
  respondToRequest: (requestId: string, userId: string, response: "accepted" | "declined" | "blocked") => Promise<void>;
  createGroupChat: (name: string, icon: string, memberIds: string[]) => Promise<Conversation>;
}

export const useSocialStore = create<SocialStore>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: [],
  friends: [],
  incomingRequests: [],
  outgoingRequests: [],
  socket: null,
  onlineStatuses: {},
  typingStatus: {},
  isLoading: false,

  fetchConversations: async (userId) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${BACKEND_URL}/api/social/conversations/${userId}`);
      const data = await res.json();
      set({ conversations: Array.isArray(data) ? data : [], isLoading: false });
    } catch (e) {
      set({ isLoading: false, conversations: [] });
    }
  },

  setActiveConversation: (conv) => {
    set({ activeConversation: conv, messages: [] });
    if (conv) {
      get().fetchMessages(conv.id);
      const s = get().socket;
      if (s) {
        s.emit("join_conversation", conv.id);
      }
    }
  },

  fetchMessages: async (conversationId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/social/conversations/${conversationId}/messages`);
      const data = await res.json();
      set({ messages: Array.isArray(data) ? data : [] });
    } catch (e) {
      set({ messages: [] });
    }
  },

  fetchFriends: async (userId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/social/friends/${userId}`);
      const data = await res.json();
      const details = (Array.isArray(data) ? data : []).map((f: any) => ({
        ...f,
        status: get().onlineStatuses[f.id] || "offline"
      }));
      set({ friends: details });
    } catch (e) {
      set({ friends: [] });
    }
  },

  fetchRequests: async (userId) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/social/friends/requests/${userId}`);
      const data = await res.json();
      set({
        incomingRequests: Array.isArray(data?.incoming) ? data.incoming : [],
        outgoingRequests: Array.isArray(data?.outgoing) ? data.outgoing : []
      });
    } catch (e) {
      set({ incomingRequests: [], outgoingRequests: [] });
    }
  },

  connectSocket: (userId) => {
    const existing = get().socket;
    if (existing) return;

    // Connect to WebSocket server
    const s = io(BACKEND_URL);

    s.on("connect", () => {
      console.log("🔌 Connected to Socket.IO Server");
      s.emit("join_user", userId);
    });

    // Handle online statuses
    s.on("status_change", ({ userId: uId, status }) => {
      set((prev) => {
        const statuses = { ...prev.onlineStatuses, [uId]: status };
        const updatedFriends = prev.friends.map(f => f.id === uId ? { ...f, status } : f);
        return { onlineStatuses: statuses, friends: updatedFriends };
      });
    });

    // Handle incoming messages
    s.on("receive_dm", (msg: DirectMessage) => {
      const active = get().activeConversation;
      if (active && msg.conversationId === active.id) {
        set((prev) => ({ messages: [...prev.messages, msg] }));
        s.emit("message_seen", { conversationId: active.id, messageId: msg.id });
      }

      // Update conversations last message preview
      set((prev) => ({
        conversations: prev.conversations.map(c =>
          c.id === msg.conversationId ? { ...c, lastMessage: msg } : c
        )
      }));
    });

    s.on("message_seen", ({ conversationId, messageId }) => {
      const active = get().activeConversation;
      if (active && conversationId === active.id) {
        set((prev) => ({
          messages: prev.messages.map(m => m.id === messageId ? { ...m, seen: 1 } : m)
        }));
      }
    });

    // Handle typing indicators
    s.on("typing_start", ({ conversationId, username }) => {
      set((prev) => {
        const typers = prev.typingStatus[conversationId] || [];
        if (!typers.includes(username)) {
          return {
            typingStatus: {
              ...prev.typingStatus,
              [conversationId]: [...typers, username]
            }
          };
        }
        return {};
      });
    });

    s.on("typing_stop", ({ conversationId, username }) => {
      set((prev) => {
        const typers = prev.typingStatus[conversationId] || [];
        return {
          typingStatus: {
            ...prev.typingStatus,
            [conversationId]: typers.filter(u => u !== username)
          }
        };
      });
    });

    s.on("friend_request", () => {
      get().fetchRequests(userId);
    });

    s.on("friend_accept", () => {
      get().fetchFriends(userId);
      get().fetchRequests(userId);
      get().fetchConversations(userId);
    });

    s.on("user_update", ({ userId: updatedUserId, name, username, avatar }) => {
      set((prev) => {
        const updatedFriends = prev.friends.map(f =>
          f.id === updatedUserId ? { ...f, name, username, avatar } : f
        );

        const updatedConversations = prev.conversations.map(c => ({
          ...c,
          members: c.members.map(m =>
            m.id === updatedUserId ? { ...m, name, username, avatar } : m
          )
        }));

        let updatedActive = prev.activeConversation;
        if (updatedActive) {
          const updatedMembers = updatedActive.members.map(m =>
            m.id === updatedUserId ? { ...m, name, username, avatar } : m
          );
          updatedActive = {
            ...updatedActive,
            members: updatedMembers
          };
        }

        return {
          friends: updatedFriends,
          conversations: updatedConversations,
          activeConversation: updatedActive
        };
      });
    });

    set({ socket: s });
  },

  disconnectSocket: () => {
    const s = get().socket;
    if (s) {
      s.disconnect();
      set({ socket: null });
    }
  },

  sendDM: (payload) => {
    const s = get().socket;
    if (s) {
      s.emit("send_dm", payload);
    }
  },

  sendFriendRequest: async (senderId, username, senderUsername) => {
    const res = await fetch(`${BACKEND_URL}/api/social/friends/request`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ senderId, username, senderUsername })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to send request");
    }
    await get().fetchRequests(senderId);
  },

  respondToRequest: async (requestId, userId, response) => {
    const res = await fetch(`${BACKEND_URL}/api/social/friends/respond`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ requestId, userId, response })
    });
    if (res.ok) {
      const data = await res.json();
      await get().fetchRequests(userId);
      await get().fetchFriends(userId);
      await get().fetchConversations(userId);
      return data;
    }
  },

  createGroupChat: async (name, icon, memberIds) => {
    const res = await fetch(`${BACKEND_URL}/api/social/conversations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "group", name, icon, memberIds })
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Failed to create group");
    }
    const currentUserId = memberIds[0]; // Assuming owner is first
    await get().fetchConversations(currentUserId);
    return data;
  }
}));
