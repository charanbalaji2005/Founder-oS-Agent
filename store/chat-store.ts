import { create } from "zustand";
import { BACKEND_URL } from "@/constants";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  userId?: string;
  agentId?: string;
  userName?: string;
  mediaUrl?: string;
  mentions?: string[];
  createdAt?: string | Date;
  feedback?: string;
}

interface ChatStore {
  messages: Message[];
  isLoading: boolean;
  typingStatus: {
    name: string;
    agentId?: string;
    status: string; // typing, thinking, researching, coding, etc.
  } | null;

  fetchWorkspaceMessages: (workspaceId: string, channelId: string) => Promise<void>;
  sendMessage: (payload: {
    workspaceId: string;
    channelId: string;
    userId?: string;
    agentId?: string;
    role: "user" | "assistant";
    content: string;
    mediaUrl?: string;
    mentions?: string[];
  }) => Promise<Message>;
  setTypingStatus: (status: { name: string, agentId?: string, status: string } | null) => void;
  clearChat: () => void;
}

export const useChatStore = create<ChatStore>((set, get) => ({
  messages: [],
  isLoading: false,
  typingStatus: null,

  fetchWorkspaceMessages: async (workspaceId, channelId) => {
    if (!workspaceId || !channelId) return;
    set({ isLoading: true });
    try {
      const url = `${BACKEND_URL}/api/workspaces/${workspaceId}/chat/${channelId}`;
      const res = await fetch(url);
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (res.ok) {
          set({ messages: data || [], isLoading: false });
        } else {
          set({ isLoading: false, messages: [] });
        }
      } catch (jsonErr) {
        set({ isLoading: false, messages: [] });
      }
    } catch (err) {
      set({ isLoading: false, messages: [] });
    }
  },

  setTypingStatus: (status) => set({ typingStatus: status }),

  sendMessage: async (payload) => {
    const tempId = Math.random().toString(36);
    const optimisticMsg: Message = {
      id: tempId,
      role: payload.role,
      content: payload.content,
      userId: payload.userId,
      agentId: payload.agentId,
      mediaUrl: payload.mediaUrl,
      mentions: payload.mentions,
      createdAt: new Date().toISOString()
    };

    set((s) => ({ messages: [...s.messages, optimisticMsg] }));

    try {
      const res = await fetch(`${BACKEND_URL}/api/agents/completions/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to send");
      }

      // Replace optimistic user msg with saved one
      set((s) => ({
        messages: s.messages.map(m => m.id === tempId ? data.userMsg : m)
      }));

      // If AI responded, append that too
      if (data.aiMsg) {
        set((s) => ({ messages: [...s.messages, data.aiMsg] }));
      }

      return data.aiMsg || data.userMsg;
    } catch (err: any) {
      console.error("Chat send error:", err);
      // Keep optimistic message but maybe mark as error?
      // For now just return it.
      return optimisticMsg;
    }
  },

  clearChat: () => {
    set({ messages: [] });
  },
}));
