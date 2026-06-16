import { groqComplete } from "@/services/groq.service";
import { GROQ_MODELS } from "@/constants";

const SYSTEM_PROMPT = `You are a go-to-market strategist and growth expert who has helped 50+ startups 
launch successfully. You specialize in product launches, growth hacking, and building early traction 
on limited budgets. You focus on distribution as much as product.`;

export async function runLaunchAgent(
  idea: string,
  industry: string,
  targetUsers: string,
  onChunk?: (chunk: string, full: string) => void
): Promise<string> {
  const prompt = `Create a comprehensive launch strategy for:

**Startup Idea:** "${idea}"
**Industry:** ${industry}
**Target Users:** ${targetUsers}

## Go-To-Market Strategy

### Top 3 Marketing Channels
For each channel:
- **Channel Name**
- **Why it fits** this specific audience
- **Specific tactics** to execute
- **Expected reach and cost**

### Pre-Launch (2 weeks before)
5 specific pre-launch activities to build anticipation and waitlist.

## Pricing Strategy
Recommend 3 pricing tiers:
- **Free / Freemium tier** (what's included, user acquisition goal)
- **Growth tier** (price, features, target segment)
- **Pro / Enterprise tier** (price, features, target segment)

Include pricing rationale and competitive context.

## Launch Week Checklist
8 specific items to complete in launch week (Day 1 through Day 7).

## 90-Day Growth Plan
Month 1, Month 2, Month 3 growth targets with specific tactics:
- User acquisition goal
- Key activities
- Success metric

## Early Adopter Strategy
How to find, engage, and retain the first 100 users.`;

  return groqComplete(prompt, SYSTEM_PROMPT, GROQ_MODELS.REASONING, onChunk);
}
