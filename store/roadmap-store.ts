import { create } from "zustand";

interface RoadmapStore {
  selectedPhase: number | null;
  expandedItems: string[];
  setSelectedPhase: (phase: number | null) => void;
  toggleItem: (id: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
}

export const useRoadmapStore = create<RoadmapStore>((set) => ({
  selectedPhase: null,
  expandedItems: [],

  setSelectedPhase: (phase) => set({ selectedPhase: phase }),

  toggleItem: (id) =>
    set((s) => ({
      expandedItems: s.expandedItems.includes(id)
        ? s.expandedItems.filter((i) => i !== id)
        : [...s.expandedItems, id],
    })),

  expandAll: () =>
    set({ expandedItems: ["phase-1", "phase-2", "phase-3"] }),

  collapseAll: () => set({ expandedItems: [] }),
}));
