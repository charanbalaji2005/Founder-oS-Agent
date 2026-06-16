import { Router } from "express";
import { db } from "../database/db";
import { projects, agentResults, activities, notifications } from "../database/schema";
import { eq, and } from "drizzle-orm";
import { z } from "zod";

export const projectsRouter = Router();

const createSchema = z.object({
  userId: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  industry: z.string().min(1),
  targetUsers: z.string().min(1),
});

const saveResultsSchema = z.record(z.string());

// GET /api/projects
projectsRouter.get("/", async (req, res) => {
  try {
    const all = await db.select().from(projects);
    res.json({ projects: all });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch projects" });
  }
});

// GET /api/projects/:id
projectsRouter.get("/:id", async (req, res) => {
  try {
    const results = await db.select().from(projects).where(eq(projects.id, req.params.id as any)).limit(1);
    const proj = results[0];
    if (!proj) return res.status(404).json({ error: "Project not found" });

    const genericResults = await db
      .select()
      .from(agentResults)
      .where(eq(agentResults.projectId, proj.id));

    const resultsMap: Record<string, any> = {};
    for (const r of genericResults) {
      resultsMap[r.agentId] = {
        id: r.id,
        projectId: r.projectId,
        content: r.content,
        model: r.model,
        createdAt: r.createdAt,
      };
    }

    res.json({ project: { ...proj, ...resultsMap, results: resultsMap } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to fetch project";
    res.status(500).json({ error: msg });
  }
});

// POST /api/projects
projectsRouter.post("/", async (req, res) => {
  try {
    const data = createSchema.parse(req.body);
    const results = await db.insert(projects).values({
      ...data,
      userId: data.userId as any,
      status: "in_progress"
    }).returning();

    const newProject = results[0];

    if (data.userId) {
      await db.insert(activities).values({
        userId: data.userId as any,
        type: "project_created",
        description: `Created new venture: ${data.title}`
      });

      await db.insert(notifications).values({
        userId: data.userId as any,
        title: "Venture Initialized",
        message: `${data.title} has been registered in the OS. AI Agents are assigned.`,
        type: "project_created"
      });
    }

    res.status(201).json(newProject);
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: err.errors });
    const msg = err instanceof Error ? err.message : "Failed to create project";
    res.status(500).json({ error: msg });
  }
});

// PUT /api/projects/:id/results
projectsRouter.put("/:id/results", async (req, res) => {
  try {
    const { id } = req.params;
    const data = saveResultsSchema.parse(req.body);

    const MODELS = {
      primary: "llama-3.3-70b-versatile",
      reasoning: "llama-3.3-70b-versatile",
      coding: "llama-3.3-70b-versatile",
    };

    const AGENT_MODELS: Record<string, string> = {
      founder: MODELS.reasoning,
      ceo: MODELS.primary,
      research: MODELS.primary,
      coding: MODELS.coding,
      marketing: MODELS.primary,
      manager: MODELS.primary,
      employee: MODELS.primary,
      customer_service: MODELS.primary,
    };

    for (const [agentId, content] of Object.entries(data)) {
      if (!content) continue;

      const existing = await db
        .select()
        .from(agentResults)
        .where(
          and(
            eq(agentResults.projectId, id as any),
            eq(agentResults.agentId, agentId)
          )
        )
        .limit(1);

      const model = AGENT_MODELS[agentId] || MODELS.primary;

      if (existing[0]) {
        await db
          .update(agentResults)
          .set({ content, model, createdAt: new Date() })
          .where(eq(agentResults.id, existing[0].id));
      } else {
        await db.insert(agentResults).values({
          projectId: id as any,
          agentId,
          content,
          model,
        });
      }
    }

    await db.update(projects).set({ status: "complete", updatedAt: new Date() }).where(eq(projects.id, id as any));

    // Log activity
    const projRes = await db.select().from(projects).where(eq(projects.id, id as any)).limit(1);
    if (projRes[0] && projRes[0].userId) {
      await db.insert(activities).values({
        userId: projRes[0].userId,
        type: "project_completed",
        description: `Completed strategic plan for: ${projRes[0].title}`
      });
    }

    res.json({ success: true });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Failed to save results";
    res.status(500).json({ error: msg });
  }
});

// DELETE /api/projects/:id
projectsRouter.delete("/:id", async (req, res) => {
  try {
    await db.delete(projects).where(eq(projects.id, req.params.id as any));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete project" });
  }
});
