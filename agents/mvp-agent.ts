import { groqComplete } from "@/services/groq.service";
import { GROQ_MODELS } from "@/constants";

const SYSTEM_PROMPT = `You are a senior product manager and startup advisor specializing in MVP development. 
You use lean startup principles, MoSCoW prioritization, and Jobs-to-be-Done framework to define focused, 
buildable MVPs that validate core assumptions quickly. You think in terms of user value, not features.`;

export async function runMVPAgent(
  idea: string,
  industry: string,
  targetUsers: string,
  onChunk?: (chunk: string, full: string) => void
): Promise<string> {
  const prompt = `Define the MVP (Minimum Viable Product) for this startup:

**Startup Idea:** "${idea}"
**Industry:** ${industry}
**Target Users:** ${targetUsers}

## Core MVP Features (Must-Have)
List exactly 5 core features that:
- Solve the primary user pain point
- Can be built in 60 days by a small team
- Are testable with early adopters

For each feature:
- **Feature Name**
- **User Story** (As a [user], I want to [action], so that [benefit])
- **Why It's Essential**
- **Build Complexity** (Low / Medium / High)

## Phase 2 Features (Nice-to-Have)
3 features to add after MVP validation:
- Feature name and brief description

## The #1 Differentiator
What single thing will make users choose this over competitors?

## MVP Success Metrics
3 key metrics to validate product-market fit after launch:
- Metric name, target value, and measurement method

## Technical Scope
Recommended tech stack for the MVP considering speed of development.`;

  return groqComplete(prompt, SYSTEM_PROMPT, GROQ_MODELS.REASONING, onChunk);
}
