"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AGENT_ORDER = exports.AGENT_CONFIG = exports.QUICK_IDEAS = exports.INDUSTRIES = exports.STORAGE_KEYS = exports.MODEL_LABELS = exports.GROQ_MODELS = void 0;
// ─── Models ───────────────────────────────────────────────────────────────────
exports.GROQ_MODELS = {
    PRIMARY: "llama-3.3-70b-versatile",
    REASONING: "llama-3.3-70b-versatile",
    CODING: "llama-3.3-70b-versatile",
    VISION: "llama-3.2-11b-vision-preview",
};
exports.MODEL_LABELS = {
    [exports.GROQ_MODELS.PRIMARY]: "Llama-3.3-70B",
    [exports.GROQ_MODELS.REASONING]: "Llama-3.3-70B (Reasoning)",
    [exports.GROQ_MODELS.CODING]: "Llama-3.3-70B (Code)",
    [exports.GROQ_MODELS.VISION]: "Llama-3.2-Vision",
};
// ─── Secure Store Keys ────────────────────────────────────────────────────────
exports.STORAGE_KEYS = {
    GROQ_API_KEY: "groq_api_key",
    USER_TOKEN: "user_token",
    USER_DATA: "user_data",
    ONBOARDED: "onboarded",
};
// ─── Industries ───────────────────────────────────────────────────────────────
exports.INDUSTRIES = [
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
exports.QUICK_IDEAS = [
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
exports.AGENT_CONFIG = {
    founder: {
        id: "founder",
        label: "Founder Agent",
        iconName: "Crown",
        color: "#C58B5A",
        model: exports.GROQ_MODELS.REASONING,
        description: "Core mission, vision, co-founder alignment & risk appetite mapping.",
    },
    ceo: {
        id: "ceo",
        label: "CEO Agent",
        iconName: "Briefcase",
        color: "#3B2F2F",
        model: exports.GROQ_MODELS.PRIMARY,
        description: "Strategic decision making, business model & monetization strategy.",
    },
    research: {
        id: "research",
        label: "Research Agent",
        iconName: "Search",
        color: "#5C8E8B",
        model: exports.GROQ_MODELS.PRIMARY,
        description: "Industry analysis, TAM/SAM/SOM market sizing & competitor intelligence.",
    },
    coding: {
        id: "coding",
        label: "Coding Agent",
        iconName: "Code",
        color: "#14b8a6",
        model: exports.GROQ_MODELS.CODING,
        description: "MVP technical architecture, stack selection & database schema specification.",
    },
    marketing: {
        id: "marketing",
        label: "Marketing Agent",
        iconName: "Megaphone",
        color: "#A8636E",
        model: exports.GROQ_MODELS.PRIMARY,
        description: "Go-to-market channels, early growth hacking & social media campaigns.",
    },
    manager: {
        id: "manager",
        label: "Manager Agent",
        iconName: "Calendar",
        color: "#ec4899",
        model: exports.GROQ_MODELS.PRIMARY,
        description: "90-day roadmapping, weekly milestones & task delegation flows.",
    },
    employee: {
        id: "employee",
        label: "Employee Agent",
        iconName: "Wrench",
        color: "#f59e0b",
        model: exports.GROQ_MODELS.PRIMARY,
        description: "Daily task execution lists, operational SOPs & onboarding guides.",
    },
    customer_service: {
        id: "customer_service",
        label: "Customer Service Agent",
        iconName: "Headphones",
        color: "#4E7D5A",
        model: exports.GROQ_MODELS.PRIMARY,
        description: "Customer support design, onboarding flows, FAQs & retention loops.",
    },
    legal: {
        id: "legal",
        label: "Legal Agent",
        iconName: "Scale",
        color: "#475569",
        model: exports.GROQ_MODELS.PRIMARY,
        description: "Terms of service, privacy policies, and basic regulatory compliance.",
    },
    financial: {
        id: "financial",
        label: "Finance Agent",
        iconName: "PieChart",
        color: "#0891B2",
        model: exports.GROQ_MODELS.PRIMARY,
        description: "Financial modeling, burn rate tracking, and fundraising metrics.",
    },
    operations: {
        id: "operations",
        label: "Ops Agent",
        iconName: "Cpu",
        color: "#7C3AED",
        model: exports.GROQ_MODELS.PRIMARY,
        description: "Cloud infrastructure planning, scalability, and system automation.",
    },
    creative: {
        id: "creative",
        label: "Creative Agent",
        iconName: "Sparkles",
        color: "#D946EF",
        model: exports.GROQ_MODELS.PRIMARY,
        description: "UI/UX direction, brand personality, and visual design systems.",
    },
};
exports.AGENT_ORDER = [
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
//# sourceMappingURL=shared.js.map