// ─── Models ───────────────────────────────────────────────────────────────────
export const GROQ_MODELS = {
  PRIMARY: "llama-3.3-70b-versatile" as const,
  REASONING: "llama-3.3-70b-versatile" as const,
  CODING: "llama-3.3-70b-versatile" as const,
  VISION: "llama-3.2-11b-vision-preview" as const,
};

export const MODEL_LABELS: Record<string, string> = {
  "llama-3.3-70b-versatile": "Llama-3.3-70B",
  "llama-3.2-11b-vision-preview": "Llama-3.2-Vision",
};

// ─── Secure Store Keys ────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
  GROQ_API_KEY: "groq_api_key",
  USER_TOKEN: "user_token",
  USER_DATA: "user_data",
  ONBOARDED: "onboarded",
};

// ─── Industries ───────────────────────────────────────────────────────────────
export const INDUSTRIES = [
  "Health & Fitness",
  "EdTech",
  "FinTech",
  "SaaS / B2B",
  "E-commerce",
  "AI / ML Tools",
  "Social Media",
  "Gaming",
  "PropTech",
  "FoodTech",
  "CleanTech",
  "HealthTech",
  "LegalTech",
  "AgriTech",
  "TravelTech",
  "Other",
];

// ─── Quick Start Ideas ────────────────────────────────────────────────────────
export const QUICK_IDEAS = [
  "AI Fitness Coach App",
  "E-learning Platform for Kids",
  "B2B SaaS Project Tool",
  "Food Delivery Marketplace",
  "Mental Health & Meditation App",
  "Crypto Portfolio Tracker",
  "Remote Work Collaboration Tool",
  "Social Commerce Platform",
  "AI Writing Assistant",
  "Personal Finance Tracker",
];

// ─── Agent Config ─────────────────────────────────────────────────────────────
export const AGENT_CONFIG = {
  founder: {
    id: "founder" as const,
    label: "Founder Agent",
    iconName: "Crown",
    color: "#C58B5A",
    model: GROQ_MODELS.REASONING,
    description: "Core mission, vision, co-founder alignment & risk appetite mapping.",
  },
  ceo: {
    id: "ceo" as const,
    label: "CEO Agent",
    iconName: "Briefcase",
    color: "#3B2F2F",
    model: GROQ_MODELS.PRIMARY,
    description: "Strategic decision making, business model & monetization strategy.",
  },
  research: {
    id: "research" as const,
    label: "Research Agent",
    iconName: "Search",
    color: "#5C8E8B",
    model: GROQ_MODELS.PRIMARY,
    description: "Industry analysis, TAM/SAM/SOM market sizing & competitor intelligence.",
  },
  coding: {
    id: "coding" as const,
    label: "Coding Agent",
    iconName: "Code",
    color: "#14b8a6",
    model: GROQ_MODELS.CODING,
    description: "MVP technical architecture, stack selection & database schema specification.",
  },
  marketing: {
    id: "marketing" as const,
    label: "Marketing Agent",
    iconName: "Megaphone",
    color: "#A8636E",
    model: GROQ_MODELS.PRIMARY,
    description: "Go-to-market channels, early growth hacking & social media campaigns.",
  },
  manager: {
    id: "manager" as const,
    label: "Manager Agent",
    iconName: "Calendar",
    color: "#ec4899",
    model: GROQ_MODELS.PRIMARY,
    description: "90-day roadmapping, weekly milestones & task delegation flows.",
  },
  employee: {
    id: "employee" as const,
    label: "Employee Agent",
    iconName: "Wrench",
    color: "#f59e0b",
    model: GROQ_MODELS.PRIMARY,
    description: "Daily task execution lists, operational SOPs & onboarding guides.",
  },
  customer_service: {
    id: "customer_service" as const,
    label: "Customer Service Agent",
    iconName: "Headphones",
    color: "#4E7D5A",
    model: GROQ_MODELS.PRIMARY,
    description: "Customer support design, onboarding flows, FAQs & retention loops.",
  },
  legal: {
    id: "legal" as const,
    label: "Legal Agent",
    iconName: "Scale",
    color: "#475569",
    model: GROQ_MODELS.PRIMARY,
    description: "Terms of service, privacy policies, and basic regulatory compliance.",
  },
  financial: {
    id: "financial" as const,
    label: "Finance Agent",
    iconName: "PieChart",
    color: "#0891B2",
    model: GROQ_MODELS.PRIMARY,
    description: "Financial modeling, burn rate tracking, and fundraising metrics.",
  },
  operations: {
    id: "operations" as const,
    label: "Ops Agent",
    iconName: "Cpu",
    color: "#7C3AED",
    model: GROQ_MODELS.PRIMARY,
    description: "Cloud infrastructure planning, scalability, and system automation.",
  },
  creative: {
    id: "creative" as const,
    label: "Creative Agent",
    iconName: "Sparkles",
    color: "#D946EF",
    model: GROQ_MODELS.PRIMARY,
    description: "UI/UX direction, brand personality, and visual design systems.",
  },
};

export const AGENT_ORDER: Array<keyof typeof AGENT_CONFIG> = [
  "founder",
  "ceo",
  "research",
  "coding",
  "marketing",
  "manager",
  "employee",
  "customer_service",
  "legal",
  "financial",
  "operations",
  "creative",
];
