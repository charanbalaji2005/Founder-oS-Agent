import { create } from "zustand";
import { BACKEND_URL } from "@/constants";

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  type: "public" | "private";
}

interface ChannelStore {
  channels: Channel[];
  activeChannel: Channel | null;
  isLoading: boolean;

  fetchChannels: (workspaceId: string) => Promise<void>;
  setActiveChannel: (channel: Channel) => void;
  createChannel: (workspaceId: string, name: string) => Promise<Channel>;
}

export const useChannelStore = create<ChannelStore>((set, get) => ({
  channels: [],
  activeChannel: null,
  isLoading: false,

  fetchChannels: async (workspaceId) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${BACKEND_URL}/api/workspaces/${workspaceId}/channels`);
      const data = await res.json();
      set({ channels: data, isLoading: false });
      if (data.length > 0 && !get().activeChannel) {
        set({ activeChannel: data[0] });
      }
    } catch (err) {
      set({ isLoading: false });
    }
  },

  setActiveChannel: (channel) => set({ activeChannel: channel }),

  createChannel: async (workspaceId, name) => {
    const res = await fetch(`${BACKEND_URL}/api/workspaces/${workspaceId}/channels`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    set((s) => ({ channels: [...s.channels, data] }));
    return data;
  }
}));
