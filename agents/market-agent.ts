import { groqComplete } from "@/services/groq.service";
import { GROQ_MODELS } from "@/constants";

const SYSTEM_PROMPT = `You are a world-class market research analyst specializing in startup market analysis. 
You provide data-driven, specific, and actionable market insights. You use frameworks like TAM/SAM/SOM, 
Jobs-to-be-Done, and customer segmentation to deliver deep analysis.`;

export async function runMarketResearchAgent(
  idea: string,
  industry: string,
  targetUsers: string,
  onChunk?: (chunk: string, full: string) => void
): Promise<string> {
  const prompt = `Conduct a thorough market research analysis for this startup:

**Startup Idea:** "${idea}"
**Industry:** ${industry}
**Target Users:** ${targetUsers}

Provide a structured analysis with these sections:

## Market Size
- TAM (Total Addressable Market) with estimated value
- SAM (Serviceable Addressable Market)
- SOM (Serviceable Obtainable Market - Year 1 realistic target)

## Key Industry Trends (3-4 trends)
- Current trends driving this market
- Emerging opportunities

## Customer Segments
Identify 3 distinct customer personas with:
- Demographics
- Primary pain points
- Willingness to pay

## Market Opportunities
- Top 2-3 unmet needs or gaps in the market
- Why now is the right time to enter

Be specific with numbers and real-world context where possible.`;

  return groqComplete(prompt, SYSTEM_PROMPT, GROQ_MODELS.PRIMARY, onChunk);
}
