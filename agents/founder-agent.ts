import { groqComplete } from "@/services/groq.service";
import { GROQ_MODELS } from "@/constants";

export interface FounderAgentInput {
  idea: string;
  industry: string;
  targetUsers: string;
}

export interface FounderAgentOutput {
  summary: string;
  validationScore: number;
  keyRisks: string[];
  recommendations: string[];
}

const SYSTEM_PROMPT = `You are an experienced startup co-founder and business strategist with 15+ years of experience building and advising successful startups. You have deep expertise in product-market fit, lean startup methodology, and go-to-market strategy.

Your role is to provide honest, actionable, and strategic guidance to founders. Be direct, specific, and avoid generic advice.`;

export async function runFounderAgent(
  input: FounderAgentInput
): Promise<string> {
  const prompt = `Analyze this startup idea and provide a strategic overview:

Startup Idea: "${input.idea}"
Industry: ${input.industry}
Target Users: ${input.targetUsers}

Provide:
1. **Executive Summary** (2-3 sentences on the core value proposition)
2. **Validation Score** (1-10 with reasoning)
3. **3 Key Risks** to watch out for
4. **3 Strategic Recommendations** for success

Be concise, honest, and actionable.`;

  return groqComplete(prompt, SYSTEM_PROMPT, GROQ_MODELS.REASONING);
}

export async function validateStartupIdea(idea: string): Promise<{
  isValid: boolean;
  feedback: string;
}> {
  if (idea.trim().length < 10) {
    return { isValid: false, feedback: "Please describe your idea in more detail." };
  }
  if (idea.trim().length > 1000) {
    return { isValid: false, feedback: "Please keep your idea description under 1000 characters." };
  }
  return { isValid: true, feedback: "Valid startup idea!" };
}
