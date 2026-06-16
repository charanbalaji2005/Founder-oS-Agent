import { useCallback } from "react";
import { useProjectStore } from "@/store/project-store";
import { AGENT_ORDER, AGENT_CONFIG } from "@/constants";
import { groqComplete } from "@/services/groq.service";
import type { AgentId } from "@/types";

// Agent prompts map
const AGENT_PROMPTS: Record<
  AgentId,
  (idea: string, industry: string, users: string, riskAppetite: string, timeline: string) => string
> = {
  founder: (idea, industry, users, riskAppetite, timeline) =>
    `Venture Vision & Founder Alignment Plan for: "${idea}" in ${industry} targeting ${users}.
Factor in a ${riskAppetite} risk appetite and a ${timeline} delivery timeline.

## Mission & Vision
- High-impact mission and vision statements.

## Co-founder Alignment
- Key responsibilities, values, and decision guidelines.

## Risk Profile & Strategic Alignment
- Detail strategic risks aligned with the ${riskAppetite} profile.`,

  ceo: (idea, industry, users, riskAppetite, timeline) =>
    `CEO Strategic Executive Plan for: "${idea}" in ${industry} targeting ${users}.
Factor in a ${riskAppetite} risk appetite and a ${timeline} delivery timeline.

## Business Model & Value Proposition
- Key business engines and monetization mechanisms.

## Core Growth KPIs
- Primary and secondary metrics to track performance.

## Governance & Equity Plan
- Management hierarchy, roles definition, and equity/runway allocation.`,

  research: (idea, industry, users, riskAppetite, timeline) =>
    `Conduct thorough market research for: "${idea}" in ${industry} targeting ${users}. 
Factor in a ${riskAppetite} risk appetite and a ${timeline} delivery timeline.

## TAM, SAM, SOM Estimates
- Market sizing with concrete estimates.

## Customer Personas
- 2 key buyer personas with pain points and willingness to pay.

## Key Industry Trends
- Major market shifts and tailwinds.`,

  coding: (idea, industry, users, riskAppetite, timeline) =>
    `Draft a technical architecture and MVP feature roadmap for: "${idea}" in ${industry} targeting ${users}.
Aligned with a ${timeline} timeline constraint and ${riskAppetite} complexity.

## MVP Technology Stack
- Recommended frontend, backend, database, and infrastructure choices.

## Database Schema & Core Entities
- Primary SQL/NoSQL entities and relationships.

## MVP Feature Specifications
- Core built features required within the ${timeline} limit.

## Technical Risks & Mitigation
- Specific engineering challenges.`,

  marketing: (idea, industry, users, riskAppetite, timeline) =>
    `Marketing & Go-to-Market Strategy for: "${idea}" in ${industry} targeting ${users}.
Designed for early adoption within the ${timeline} timeframe.

## Top Growth Channels
- High-yield channels for acquisition.

## Pre-Launch Campaigns
- Early traction strategies and lead capture.

## Landing Page Blueprint
- Main headline, value hook, and call to action copy.`,

  manager: (idea, industry, users, riskAppetite, timeline) =>
    `Manager Project Roadmap and Team Workflow for: "${idea}" in ${industry} targeting ${users}.
Designed for a ${timeline} execution timeframe.

## Phase Timeline (Weeks 1-12)
- Specific sprint phases.

## Project Milestones
- Major milestones and gate checks.

## Team Roles & Handoffs
- Workflow delegation model.`,

  employee: (idea, industry, users, riskAppetite, timeline) =>
    `Employee Standard Operating Procedures (SOPs) and Checklists for: "${idea}" in ${industry} targeting ${users}.
Designed for rapid task execution.

## Onboarding & System Setup SOP
- Instructions for bootstrapping the codebase and tools.

## Daily Action Checklists
- Daily tasks to execute.

## QA Verification Manual
- Validation criteria for key deliverables.`,

  customer_service: (idea, industry, users, riskAppetite, timeline) =>
    `Customer Support & Success Design for: "${idea}" in ${industry} targeting ${users}.
Focus on onboarding, retention, and feedback loops.

## Support Channels
- Setup of help desk and chat widgets.

## User Onboarding & Activation Loops
- Ensuring customers reach the 'Aha!' moment.

## Retention & Escalation Guide
- Handling churn risks and escalations.`,

  legal: (idea, industry, users, riskAppetite, timeline) =>
    `Legal & Regulatory Compliance Assessment for: "${idea}" in ${industry} targeting ${users}.
Factor in a ${riskAppetite} risk appetite and ${timeline} timeline.

## Regulatory Framework
- Applicable licensing, privacy directives, and local jurisdiction compliance.

## Terms of Service Blueprint
- Key sections on liability, content ownership, and user accounts.

## Risk Assessment
- Strategic regulatory risk warnings and mitigation steps.`,

  financial: (idea, industry, users, riskAppetite, timeline) =>
    `Financial & Business Model Projections for: "${idea}" in ${industry} targeting ${users}.
Factor in a ${riskAppetite} risk appetite and ${timeline} timeline.

## Startup Budget & Runway
- High-level cost breakdown (sinking funds, operational expense, software licenses).

## Unit Economics & Revenue Strategy
- Price tiers, subscription models, CAC/LTV benchmarks.

## 12-Month Financial Plan
- Projected monthly burn rate and runway calculations.`,

  operations: (idea, industry, users, riskAppetite, timeline) =>
    `Cloud Operations & Scalability Strategy for: "${idea}" in ${industry} targeting ${users}.
Factor in a ${riskAppetite} risk appetite and ${timeline} timeline.

## Infrastructure Architecture
- Cloud setup, CDN configurations, servers and database scaling patterns.

## Backup & Disaster Recovery
- Data loss prevention plans and continuous uptime strategies.

## Security Policies
- Cyber threat defense, firewall profiles, and credential encryption policies.`,

  creative: (idea, industry, users, riskAppetite, timeline) =>
    `Brand Personality & UI/UX Design Direction for: "${idea}" in ${industry} targeting ${users}.
Factor in a ${riskAppetite} risk appetite and ${timeline} timeline.

## Brand Identity & Style Guide
- Typographic choices, accessibility standards, and color values.

## Core Interaction Blueprints
- Screen flow paths for the primary user journey.

## UI/UX Best Practices
- Micro-interactions, responsiveness checklist, and accessibility loops.`,
};

const AGENT_SYSTEMS: Record<AgentId, string> = {
  founder:
    "You are the Founder Agent. Establish the core mission, vision, co-founder values alignment, and risk-appetite mapping for the venture.",
  ceo:
    "You are the CEO Agent. You focus on strategic business development, monetization structures, primary growth KPIs, and governance models.",
  research:
    "You are the Research Agent. Conduct market sizing, customer persona mapping, and trend analysis.",
  coding:
    "You are the Coding Agent. Define the MVP technical architecture, select the tech stack, write schemas, and assess difficulty.",
  marketing:
    "You are the Marketing Agent. Define acquisition channels, landing page copy strategy, and early growth campaigns.",
  manager:
    "You are the Manager Agent. Structure a weekly milestone plan, sprint backlog, and delegation workflows.",
  employee:
    "You are the Employee Agent. Translate the high-level roadmap into daily checklists and step-by-step Standard Operating Procedures (SOPs).",
  customer_service:
    "You are the Customer Service Agent. Design customer support channels, retention strategies, and onboarding customer loops.",
  legal:
    "You are the Legal Agent. Analyze regulatory frameworks, compliance directives, and terms of service blueprints.",
  financial:
    "You are the Finance Agent. Assess budget allocations, runway projections, unit economics, and monetization tiers.",
  operations:
    "You are the Ops Agent. Map cloud infrastructure deployment, database replication scaling, and system security boundaries.",
  creative:
    "You are the Creative Agent. Design brand personality traits, style guides, interface color palettes, and accessibility systems.",
};

export function useWorkflow() {
  const {
    workflow,
    startWorkflow,
    setAgentRunning,
    setAgentDone,
    setAgentError,
    setWorkflowError,
    completeWorkflow,
    resetWorkflow,
  } = useProjectStore();

  const runWorkflow = useCallback(
    async (
      idea: string,
      industry: string,
      targetUsers: string,
      riskAppetite: string = "Moderate",
      timeline: string = "90 Days"
    ) => {
      startWorkflow(idea, industry, targetUsers);

      for (const agentId of AGENT_ORDER) {
        setAgentRunning(agentId);
        try {
          const model = AGENT_CONFIG[agentId].model;

          const result = await groqComplete(
            AGENT_PROMPTS[agentId](idea, industry, targetUsers, riskAppetite, timeline),
            AGENT_SYSTEMS[agentId],
            model
          );

          setAgentDone(agentId, result);
        } catch (err) {
          const msg =
            err instanceof Error ? err.message : `${agentId} agent failed`;
          setAgentError(agentId, msg);
          return; // stop pipeline on error
        }
      }

      completeWorkflow();
    },
    [
      startWorkflow,
      setAgentRunning,
      setAgentDone,
      setAgentError,
      setWorkflowError,
      completeWorkflow,
    ]
  );

  const rerunAgent = useCallback(
    async (agentId: AgentId, riskAppetite: string = "Moderate", timeline: string = "90 Days") => {
      const { idea, industry, targetUsers } = workflow;
      if (!idea) return;

      setAgentRunning(agentId);
      try {
        const model = AGENT_CONFIG[agentId].model;

        const result = await groqComplete(
          AGENT_PROMPTS[agentId](idea, industry, targetUsers, riskAppetite, timeline),
          AGENT_SYSTEMS[agentId],
          model
        );

        setAgentDone(agentId, result);
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : `${agentId} agent failed`;
        setAgentError(agentId, msg);
      }
    },
    [workflow, setAgentRunning, setAgentDone, setAgentError]
  );

  const isComplete =
    AGENT_ORDER.every(
      (id) => workflow.agents[id].status === "done"
    );

  const progress = AGENT_ORDER.filter(
    (id) => workflow.agents[id].status === "done"
  ).length / AGENT_ORDER.length;

  return {
    workflow,
    runWorkflow,
    rerunAgent,
    resetWorkflow,
    isComplete,
    progress,
  };
}
