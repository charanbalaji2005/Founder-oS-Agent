import { groqComplete } from "./groq.service";
import { GROQ_MODELS } from "@/constants";

export async function analyzeCompetitors(
  idea: string,
  industry: string,
  targetUsers: string
): Promise<string> {
  return groqComplete(
    `Perform detailed competitive analysis for "${idea}" in ${industry} targeting ${targetUsers}. Include 4-5 competitors, market gaps, SWOT analysis, and recommended positioning.`,
    "You are a competitive intelligence expert for startups.",
    GROQ_MODELS.PRIMARY
  );
}

export function parseCompetitorNames(content: string): string[] {
  const matches = content.match(/\*\*([A-Z][a-zA-Z\s]+)\*\*/g) ?? [];
  return matches.map((m) => m.replace(/\*\*/g, "")).slice(0, 5);
}
