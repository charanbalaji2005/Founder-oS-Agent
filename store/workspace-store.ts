import { create } from "zustand";
import { BACKEND_URL } from "@/constants";

export interface Workspace {
  id: string;
  name: string;
  role: "owner" | "admin" | "manager" | "member" | "guest";
  industry?: string;
  logo?: string;
  activeAgents?: string[];
  code?: string;
}

export interface WorkspaceMember {
  id: string;
  name: string;
  username?: string;
  avatar?: string;
  email: string;
  role: string;
  status: "online" | "away" | "busy" | "offline";
  lastActive?: string;
  currentActivity?: string;
}

interface WorkspaceStore {
  workspaces: Workspace[];
  activeWorkspace: Workspace | null;
  members: WorkspaceMember[];
  isLoading: boolean;

  fetchWorkspaces: (userId: string) => Promise<void>;
  setActiveWorkspace: (workspace: Workspace) => void;
  createWorkspace: (userId: string, name: string, industry: string, logo?: string, activeAgents?: string[], invites?: string[]) => Promise<Workspace>;
  deleteWorkspace: (workspaceId: string, userId: string) => Promise<void>;
  leaveWorkspace: (workspaceId: string, userId: string) => Promise<void>;
  fetchMembers: (workspaceId: string) => Promise<void>;
  inviteMember: (workspaceId: string, email: string, role: string) => Promise<void>;
}

export const useWorkspaceStore = create<WorkspaceStore>((set, get) => ({
  workspaces: [],
  activeWorkspace: null,
  members: [],
  isLoading: false,

  fetchWorkspaces: async (userId) => {
    set({ isLoading: true });
    try {
      const res = await fetch(`${BACKEND_URL}/api/workspaces/user/${userId}`);
      const data = await res.json();
      set({ workspaces: data, isLoading: false });
      if (data.length > 0) {
        const currentActive = get().activeWorkspace;
        if (currentActive) {
          const updatedActive = data.find((ws: any) => ws.id === currentActive.id);
          if (updatedActive) {
            set({ activeWorkspace: updatedActive });
          }
        } else {
          set({ activeWorkspace: data[0] });
        }
      }
    } catch (err) {
      set({ isLoading: false });
    }
  },

  setActiveWorkspace: (workspace) => set({ activeWorkspace: workspace }),

  createWorkspace: async (userId, name, industry, logo, activeAgents, invites) => {
    const res = await fetch(`${BACKEND_URL}/api/workspaces`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, ownerId: userId, industry, logo, activeAgents, invites })
    });
    const data = await res.json();
    set((s) => ({ workspaces: [...s.workspaces, { ...data, role: 'owner' }] }));
    return data;
  },

  deleteWorkspace: async (workspaceId, userId) => {
    const res = await fetch(`${BACKEND_URL}/api/workspaces/${workspaceId}`, {
      method: "DELETE"
    });
    if (res.ok) {
      await get().fetchWorkspaces(userId);
      const remaining = get().workspaces;
      if (remaining.length > 0) {
        set({ activeWorkspace: remaining[0] });
      } else {
        set({ activeWorkspace: null });
      }
    }
  },

  leaveWorkspace: async (workspaceId, userId) => {
    const res = await fetch(`${BACKEND_URL}/api/workspaces/${workspaceId}/leave`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId })
    });
    if (res.ok) {
      await get().fetchWorkspaces(userId);
      const remaining = get().workspaces;
      if (remaining.length > 0) {
        set({ activeWorkspace: remaining[0] });
      } else {
        set({ activeWorkspace: null });
      }
    }
  },

  fetchMembers: async (workspaceId) => {
    const res = await fetch(`${BACKEND_URL}/api/workspaces/${workspaceId}/members`);
    const data = await res.json();
    set({ members: data });
  },

  inviteMember: async (workspaceId, email, role) => {
    await fetch(`${BACKEND_URL}/api/workspaces/${workspaceId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, role })
    });
  }
}));
