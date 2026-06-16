// ─── Core Entity Types ─────────────────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface Project {
  id: string;
  userId?: string;
  title: string;
  description?: string;
  industry: string;
  targetUsers: string;
  createdAt: string;
  updatedAt: string;
  status: "draft" | "in_progress" | "complete";
}

export interface StartupIdea {
  id: string;
  projectId: string;
  idea: string;
  industry: string;
  targetUsers: string;
  createdAt: string;
}

export interface MarketResearch {
  id: string;
  projectId: string;
  content: string;
  marketSize?: string;
  trends?: string[];
  segments?: string[];
  opportunities?: string[];
  model: string;
  createdAt: string;
}

export interface Competitor {
  id: string;
  projectId: string;
  content: string;
  competitors?: CompetitorEntry[];
  gaps?: string[];
  model: string;
  createdAt: string;
}

export interface CompetitorEntry {
  name: string;
  strengths: string[];
  weaknesses: string[];
  pricing?: string;
}

export interface MVPPlan {
  id: string;
  projectId: string;
  content: string;
  coreFeatures?: Feature[];
  niceToHave?: Feature[];
  differentiator?: string;
  model: string;
  createdAt: string;
}

export interface Feature {
  name: string;
  description: string;
  priority: "high" | "medium" | "low";
}

export interface Roadmap {
  id: string;
  projectId: string;
  content: string;
  phases?: RoadmapPhase[];
  model: string;
  createdAt: string;
}

export interface RoadmapPhase {
  phase: number;
  title: string;
  days: string;
  tasks: string[];
}

export interface LaunchPlan {
  id: string;
  projectId: string;
  content: string;
  channels?: string[];
  checklist?: string[];
  pricing?: PricingTier[];
  model: string;
  createdAt: string;
}

export interface PricingTier {
  name: string;
  price: string;
  features: string[];
}

// ─── Full Project with all relations ──────────────────────────────────────

export interface FullProject extends Project {
  startupIdea?: StartupIdea;
  results?: Record<string, {
    id: string;
    projectId: string;
    content: string;
    model: string;
    createdAt: string;
  }>;
  founder?: { content: string };
  ceo?: { content: string };
  research?: { content: string };
  coding?: { content: string };
  marketing?: { content: string };
  manager?: { content: string };
  employee?: { content: string };
  customer_service?: { content: string };
}

// ─── Workflow Types ────────────────────────────────────────────────────────

export type AgentId =
  | "founder"
  | "ceo"
  | "research"
  | "coding"
  | "marketing"
  | "manager"
  | "employee"
  | "customer_service"
  | "legal"
  | "financial"
  | "operations"
  | "creative";

export type AgentStatus = "idle" | "running" | "done" | "error";

export interface AgentState {
  id: AgentId;
  status: AgentStatus;
  result?: string;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface WorkflowState {
  projectId?: string;
  idea: string;
  industry: string;
  targetUsers: string;
  isRunning: boolean;
  currentStep: number;
  agents: Record<AgentId, AgentState>;
  error?: string;
}

// ─── Groq / LLM Types ─────────────────────────────────────────────────────

export type GroqModel =
  | "llama-3.3-70b-versatile"
  | "deepseek-r1-distill-llama-70b"
  | "qwen-2.5-coder-32b";

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqRequest {
  model: GroqModel;
  messages: GroqMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface GroqResponse {
  id: string;
  choices: {
    message: { role: string; content: string };
    finish_reason: string;
  }[];
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

// ─── UI / Navigation Types ─────────────────────────────────────────────────

export type RootTabParamList = {
  index: undefined;
  dashboard: undefined;
  roadmap: undefined;
  projects: undefined;
  profile: undefined;
};

export type StartupStackParamList = {
  create: undefined;
  research: { projectId: string };
  competitors: { projectId: string };
  mvp: { projectId: string };
  roadmap: { projectId: string };
  launch: { projectId: string };
};

// ─── Form Schemas ──────────────────────────────────────────────────────────

export interface StartupIdeaFormData {
  idea: string;
  industry: string;
  targetUsers: string;
  riskAppetite: string;
  timeline: string;
}

export interface AuthFormData {
  email: string;
  password: string;
  name?: string;
}

export interface ApiKeyFormData {
  apiKey: string;
}
