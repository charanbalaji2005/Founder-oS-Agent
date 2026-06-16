import { groqComplete } from "@/services/groq.service";
import { GROQ_MODELS } from "@/constants";

const SYSTEM_PROMPT = `You are a competitive intelligence expert with deep expertise in startup ecosystems. 
You specialize in identifying competitors, analyzing their strengths and weaknesses, and finding strategic 
market gaps that new entrants can exploit. You use Porter's Five Forces and Blue Ocean Strategy frameworks.`;

export async function runCompetitorAgent(
  idea: string,
  industry: string,
  targetUsers: string,
  onChunk?: (chunk: string, full: string) => void
): Promise<string> {
  const prompt = `Perform a comprehensive competitor analysis for this startup:

**Startup Idea:** "${idea}"
**Industry:** ${industry}
**Target Users:** ${targetUsers}

## Competitor Landscape
Identify 4-5 main competitors (direct and indirect) with for each:
- **Company Name & Description**
- **Key Strengths** (2-3 bullets)
- **Weaknesses / Gaps** (2-3 bullets)
- **Pricing Model** (free, freemium, subscription, enterprise)
- **Target Audience**

## Feature Comparison Matrix
Create a brief feature comparison showing what competitors offer vs. what's missing.

## Market Gaps & Opportunities
- **2-3 clear gaps** that competitors are not addressing
- How our startup can uniquely position to fill these gaps
- **Recommended positioning statement**

## SWOT Summary
Brief SWOT for entering this market against existing competition.`;

  return groqComplete(prompt, SYSTEM_PROMPT, GROQ_MODELS.PRIMARY, onChunk);
}
