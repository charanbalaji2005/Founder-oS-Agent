import { groqComplete } from "@/services/groq.service";
import { GROQ_MODELS } from "@/constants";

const SYSTEM_PROMPT = `You are an experienced technical project manager and CTO advisor for early-stage startups. 
You specialize in creating realistic, actionable 90-day development roadmaps using agile methodology. 
You understand the constraints of small teams and limited budgets.`;

export async function runRoadmapAgent(
  idea: string,
  industry: string,
  targetUsers: string,
  onChunk?: (chunk: string, full: string) => void
): Promise<string> {
  const prompt = `Create a detailed 90-day development roadmap for:

**Startup Idea:** "${idea}"
**Industry:** ${industry}
**Target Users:** ${targetUsers}

Structure the roadmap in 3 phases:

## Phase 1: Research & Foundation (Days 1-30)
**Goal:** Validate assumptions and set up technical foundation
- Week 1 (Days 1-7): [specific tasks]
- Week 2 (Days 8-14): [specific tasks]
- Week 3 (Days 15-21): [specific tasks]
- Week 4 (Days 22-30): [specific tasks]
**Phase 1 Deliverable:** [what gets built/validated]

## Phase 2: MVP Development (Days 31-60)
**Goal:** Build and test core features
- Week 5-6 (Days 31-44): [specific tasks]
- Week 7-8 (Days 45-60): [specific tasks]
**Phase 2 Deliverable:** [working MVP]

## Phase 3: Launch Preparation (Days 61-90)
**Goal:** Polish, test, and prepare for public launch
- Week 9-10 (Days 61-74): [specific tasks]
- Week 11-12 (Days 75-90): [specific tasks]
**Phase 3 Deliverable:** [launch-ready product]

## Team Structure
Recommended team composition for this 90-day sprint.

## Key Milestones & Go/No-Go Decisions
3 critical checkpoints where you validate before proceeding.

## Risk Mitigation
2-3 technical or timeline risks and how to handle them.`;

  return groqComplete(prompt, SYSTEM_PROMPT, GROQ_MODELS.PRIMARY, onChunk);
}
