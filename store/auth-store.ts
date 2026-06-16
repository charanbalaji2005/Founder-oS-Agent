import { create } from "zustand";
import * as SecureStore from "expo-secure-store";
import { STORAGE_KEYS, BACKEND_URL } from "@/constants";
import type { User } from "@/types";
import { Platform } from "react-native";

import { useChatStore } from "./chat-store";
import { useProjectStore } from "./project-store";

interface AuthStore {
  user: any | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;
  lastLoginIp: string | null;

  // Actions
  login: (user: any, token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadSession: () => Promise<void>;
  updateUser: (updates: any) => void;
  refreshUser: () => Promise<void>;
}

const isWeb = Platform.OS === "web";

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  token: null,
  lastLoginIp: null,

  login: async (user, token) => {
    let ip = "Unknown";
    try {
      const ipRes = await fetch("https://api.ipify.org?format=json");
      const ipData = await ipRes.json();
      ip = ipData.ip;
    } catch (e) {}

    if (isWeb) {
      localStorage.setItem(STORAGE_KEYS.USER_TOKEN, token);
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      localStorage.setItem("last_login_ip", ip);
    } else {
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_TOKEN, token);
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(user));
      await SecureStore.setItemAsync("last_login_ip", ip);
    }

    set({ user, token, isAuthenticated: true, isLoading: false, lastLoginIp: ip });
  },

  logout: async () => {
    try {
      if (isWeb) {
        localStorage.removeItem(STORAGE_KEYS.USER_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.USER_DATA);
        localStorage.removeItem("last_login_ip");
      } else {
        await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_TOKEN);
        await SecureStore.deleteItemAsync(STORAGE_KEYS.USER_DATA);
        await SecureStore.deleteItemAsync("last_login_ip");
      }
    } catch (e) {
      console.error("Storage clear failed:", e);
    }

    // Reset other stores
    try {
      useChatStore.getState().clearChat();
      useProjectStore.getState().resetWorkflow();
    } catch (e) {}

    set({ user: null, token: null, isAuthenticated: false, lastLoginIp: null });
  },

  loadSession: async () => {
    set({ isLoading: true });
    try {
      let token, userData, ip;
      if (isWeb) {
        token = localStorage.getItem(STORAGE_KEYS.USER_TOKEN);
        userData = localStorage.getItem(STORAGE_KEYS.USER_DATA);
        ip = localStorage.getItem("last_login_ip");
      } else {
        token = await SecureStore.getItemAsync(STORAGE_KEYS.USER_TOKEN);
        userData = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
        ip = await SecureStore.getItemAsync("last_login_ip");
      }

      if (token && userData) {
        const user = JSON.parse(userData);
        set({ user, token, isAuthenticated: true, lastLoginIp: ip });
        // Background refresh to get latest from DB
        get().refreshUser();
      }
    } catch (e) {
      console.error("Failed to load session", e);
    } finally {
      set({ isLoading: false });
    }
  },

  updateUser: async (updates: any) => {
    set((s) => ({ user: { ...s.user, ...updates } }));
    if (isWeb) {
      localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(get().user));
    } else {
      await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(get().user));
    }
  },

  refreshUser: async () => {
    const { user } = get();
    if (!user?.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/users/profile/${user.id}`);
      const data = await res.json();
      if (!res.ok && (res.status === 404 || data.error === "User not found")) {
        await get().logout();
        return;
      }
      if (data.user) {
        set({ user: data.user });
        if (isWeb) {
          localStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
        } else {
          SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(data.user));
        }
      }
    } catch (e) {}
  }
}));
