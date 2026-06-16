import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { FullProject, WorkflowState, AgentId } from "@/types";
import { AGENT_ORDER, AGENT_CONFIG } from "@/constants";
// Lightweight pure JS UUID generator to avoid crypto.getRandomValues dependency in React Native
function uuidv4() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

// ─── State Interface ──────────────────────────────────────────────────────────

interface ProjectStore {
  // Projects
  projects: FullProject[];
  currentProjectId: string | null;

  // Workflow
  workflow: WorkflowState;

  // Actions — Projects
  createProject: (data: {
    idea: string;
    industry: string;
    targetUsers: string;
  }) => string;
  updateProject: (id: string, updates: Partial<FullProject>) => void;
  deleteProject: (id: string) => void;
  setCurrentProject: (id: string | null) => void;
  getCurrentProject: () => FullProject | null;

  // Actions — Workflow
  startWorkflow: (idea: string, industry: string, targetUsers: string) => void;
  setAgentRunning: (agentId: AgentId) => void;
  setAgentDone: (agentId: AgentId, result: string) => void;
  setAgentError: (agentId: AgentId, error: string) => void;
  setWorkflowError: (error: string) => void;
  completeWorkflow: () => void;
  resetWorkflow: () => void;
  saveWorkflowToProject: () => void;
}

// ─── Initial Workflow State ───────────────────────────────────────────────────

function makeDefaultWorkflow(): WorkflowState {
  const agents: any = {};
  for (const id of AGENT_ORDER) {
    agents[id] = { id, status: "idle" };
  }

  return {
    idea: "",
    industry: "",
    targetUsers: "",
    isRunning: false,
    currentStep: 0,
    agents,
  };
}

// ─── Store ────────────────────────────────────────────────────────────────────

export const useProjectStore = create<ProjectStore>()(
  persist(
    (set, get) => ({
      projects: [],
      currentProjectId: null,
      workflow: makeDefaultWorkflow(),

      // ── Project CRUD ──────────────────────────────────────────────────────

      createProject: (data) => {
        const id = uuidv4();
        const now = new Date().toISOString();
        const newProject: FullProject = {
          id,
          title: data.idea.slice(0, 60),
          description: data.idea,
          industry: data.industry,
          targetUsers: data.targetUsers,
          status: "in_progress",
          createdAt: now,
          updatedAt: now,
        };
        set((s) => ({
          projects: [...s.projects, newProject],
          currentProjectId: id,
        }));
        return id;
      },

      updateProject: (id, updates) => {
        set((s) => ({
          projects: s.projects.map((p) =>
            p.id === id
              ? { ...p, ...updates, updatedAt: new Date().toISOString() }
              : p
          ),
        }));
      },

      deleteProject: (id) => {
        set((s) => ({
          projects: s.projects.filter((p) => p.id !== id),
          currentProjectId:
            s.currentProjectId === id ? null : s.currentProjectId,
        }));
      },

      setCurrentProject: (id) => {
        set({ currentProjectId: id });
        if (id) {
          const proj = get().projects.find((p) => p.id === id);
          if (proj) {
            const agents: any = {};
            for (const id of AGENT_ORDER) {
              const res = (proj.results as any)?.[id];
              agents[id] = {
                id,
                status: res ? "done" : "idle",
                result: res?.content,
              };
            }

            // Hydrate workflow from saved project
            set((s) => ({
              workflow: {
                ...s.workflow,
                idea: proj.description || proj.title,
                industry: proj.industry,
                targetUsers: proj.targetUsers,
                agents,
              },
            }));
          }
        }
      },

      getCurrentProject: () => {
        const { projects, currentProjectId } = get();
        return projects.find((p) => p.id === currentProjectId) ?? null;
      },

      // ── Workflow ──────────────────────────────────────────────────────────

      startWorkflow: (idea, industry, targetUsers) => {
        const projectId = get().createProject({ idea, industry, targetUsers });
        const agents: any = {};
        for (const id of AGENT_ORDER) {
          agents[id] = { id, status: "idle" };
        }

        set({
          workflow: {
            projectId,
            idea,
            industry,
            targetUsers,
            isRunning: true,
            currentStep: 0,
            agents,
          },
        });
      },

      setAgentRunning: (agentId) => {
        set((s) => ({
          workflow: {
            ...s.workflow,
            agents: {
              ...s.workflow.agents,
              [agentId]: {
                ...s.workflow.agents[agentId],
                status: "running",
                startedAt: Date.now(),
              },
            },
          },
        }));
      },

      setAgentDone: (agentId, result) => {
        const stepIndex = AGENT_ORDER.indexOf(agentId);
        set((s) => ({
          workflow: {
            ...s.workflow,
            currentStep: stepIndex + 1,
            agents: {
              ...s.workflow.agents,
              [agentId]: {
                ...s.workflow.agents[agentId],
                status: "done",
                result,
                completedAt: Date.now(),
              },
            },
          },
        }));
      },

      setAgentError: (agentId, error) => {
        set((s) => ({
          workflow: {
            ...s.workflow,
            isRunning: false,
            agents: {
              ...s.workflow.agents,
              [agentId]: {
                ...s.workflow.agents[agentId],
                status: "error",
                error,
                completedAt: Date.now(),
              },
            },
          },
        }));
      },

      setWorkflowError: (error) => {
        set((s) => ({
          workflow: { ...s.workflow, isRunning: false, error },
        }));
      },

      completeWorkflow: () => {
        const { workflow, currentProjectId } = get();
        set((s) => ({
          workflow: { ...s.workflow, isRunning: false, currentStep: AGENT_ORDER.length },
        }));
        // Persist to project
        if (currentProjectId) {
          const now = new Date().toISOString();
          const results: Record<string, any> = {};

          for (const id of AGENT_ORDER) {
            const ag = workflow.agents[id];
            if (ag?.result) {
              results[id] = {
                id: uuidv4(),
                projectId: currentProjectId,
                content: ag.result,
                model: AGENT_CONFIG[id].model,
                createdAt: now,
              };
            }
          }

          get().updateProject(currentProjectId, {
            status: "complete",
            results,
          });
        }
      },

      resetWorkflow: () => {
        set({ workflow: makeDefaultWorkflow() });
      },

      saveWorkflowToProject: () => {
        get().completeWorkflow();
      },
    }),
    {
      name: "founderos-projects",
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        projects: state.projects,
        currentProjectId: state.currentProjectId,
      }),
    }
  )
);
