import { groqComplete } from "./groq.service";
import { GROQ_MODELS } from "@/constants";
import type { RoadmapPhase } from "@/types";

export async function generateRoadmap(
  idea: string,
  industry: string,
  targetUsers: string
): Promise<string> {
  return groqComplete(
    `Create a 90-day development roadmap for "${idea}" in ${industry} targeting ${targetUsers}. Structure in Phase 1 (Days 1-30: Research & Foundation), Phase 2 (Days 31-60: MVP Development), Phase 3 (Days 61-90: Launch Preparation). Include weekly tasks, team structure, milestones, and risk mitigation.`,
    "You are a technical project manager for startups specializing in realistic 90-day roadmaps.",
    GROQ_MODELS.PRIMARY
  );
}

/**
 * Default phase structure for the roadmap UI.
 * The AI-generated content fills in the details per phase.
 */
export function getDefaultPhases(): RoadmapPhase[] {
  return [
    {
      phase: 1,
      title: "Research & Foundation",
      days: "Days 1-30",
      tasks: [
        "Validate core assumptions with target users",
        "Finalize tech stack and architecture",
        "Set up development environment & repos",
        "Design wireframes and user flows",
      ],
    },
    {
      phase: 2,
      title: "MVP Development",
      days: "Days 31-60",
      tasks: [
        "Build core features identified in MVP plan",
        "Implement authentication & data layer",
        "Internal testing and bug fixes",
        "Recruit beta testers",
      ],
    },
    {
      phase: 3,
      title: "Launch Preparation",
      days: "Days 61-90",
      tasks: [
        "Polish UI/UX based on beta feedback",
        "Set up analytics and monitoring",
        "Prepare marketing assets and landing page",
        "Execute launch week checklist",
      ],
    },
  ];
}

/**
 * Extracts phase-specific task lists from AI-generated markdown content.
 * Falls back to default tasks if parsing fails.
 */
export function parseRoadmapPhases(content: string): RoadmapPhase[] {
  const defaults = getDefaultPhases();
  if (!content) return defaults;

  const phaseRegex = /## Phase (\d):?[^\n]*\n([\s\S]*?)(?=## Phase|\n## [A-Z]|$)/g;
  const parsed: RoadmapPhase[] = [];

  let match;
  while ((match = phaseRegex.exec(content)) !== null) {
    const phaseNum = parseInt(match[1], 10);
    const body = match[2];
    const tasks = body
      .split("\n")
      .filter((line) => /^[-*]\s/.test(line.trim()) || /^Week/.test(line.trim()))
      .map((line) => line.trim().replace(/^[-*]\s/, ""))
      .filter(Boolean)
      .slice(0, 6);

    const defaultPhase = defaults.find((p) => p.phase === phaseNum);
    if (defaultPhase) {
      parsed.push({
        ...defaultPhase,
        tasks: tasks.length > 0 ? tasks : defaultPhase.tasks,
      });
    }
  }

  return parsed.length === 3 ? parsed : defaults;
}
