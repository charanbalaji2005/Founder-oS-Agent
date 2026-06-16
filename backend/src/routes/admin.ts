import { Router } from "express";
import { db } from "../database/db";
import {
  users,
  workspaces,
  workspaceMembers,
  meetings,
  projects,
  agentResults,
  chatMessages,
  tasks,
  activities,
  notifications,
  invitations
} from "../database/schema";
import { eq, and, desc, count, ilike } from "drizzle-orm";
import { z } from "zod";
import jwt from "jsonwebtoken";
import Groq from "groq-sdk";
import fs from "fs";
import path from "path";
import { AGENT_CONFIG } from "../../../constants/shared";

declare global {
  namespace Express {
    interface Request {
      adminId?: string;
    }
  }
}

export const adminRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "founderos_super_secret_key_12345";
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// ─── JSON File Paths for Custom Data Persistence ────────────────────────────
const DOCUMENTS_FILE = path.join(__dirname, "../database/documents.json");
const WORKFLOWS_FILE = path.join(__dirname, "../database/workflows.json");
const MARKETPLACE_FILE = path.join(__dirname, "../database/marketplace.json");
const AGENT_CONFIGS_FILE = path.join(__dirname, "../database/agent_configs.json");

// Helper to read JSON files safely
const readJsonFile = (filePath: string, defaultData: any) => {
  try {
    if (!fs.existsSync(filePath)) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
      fs.writeFileSync(filePath, JSON.stringify(defaultData, null, 2));
      return defaultData;
    }
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data);
  } catch (err) {
    console.error(`Error reading ${filePath}:`, err);
    return defaultData;
  }
};

// Helper to write JSON files safely
const writeJsonFile = (filePath: string, data: any) => {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`Error writing ${filePath}:`, err);
  }
};

// ─── AUTH MIDDLEWARE ────────────────────────────────────────────────────────
const adminAuth = (req: any, res: any, next: any) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Access Denied: No Token Provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.adminId = decoded.userId;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Access Denied: Invalid Token" });
  }
};

// ─── 1. ADMIN LOGIN ─────────────────────────────────────────────────────────
adminRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const results = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    const user = results[0];

    if (!user) {
      return res.status(401).json({ error: "User not found with this email" });
    }

    if (user.password?.trim() !== password.trim()) {
      return res.status(401).json({ error: "Invalid password" });
    }

    // Permit any operator with Founder/Admin roles
    const allowedRoles = ["founder", "admin", "superadmin", "owner", "super admin"];
    const hasAccess = allowedRoles.includes(user.role.toLowerCase());

    if (!hasAccess) {
      return res.status(403).json({ error: "Forbidden: Access restricted to Founders and Admins" });
    }

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "30d" });

    res.json({
      user,
      token
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 2. AGGREGATE SYSTEM STATS ──────────────────────────────────────────────
adminRouter.get("/stats", adminAuth, async (req, res) => {
  try {
    const userCount = await db.select({ val: count() }).from(users);
    const wsCount = await db.select({ val: count() }).from(workspaces);
    const projectCount = await db.select({ val: count() }).from(projects);
    const messageCount = await db.select({ val: count() }).from(chatMessages);
    const taskCount = await db.select({ val: count() }).from(tasks);
    const auditCount = await db.select({ val: count() }).from(activities);

    // Calculate a dynamic health score based on tasks done vs todo
    const completedTasks = await db.select({ val: count() }).from(tasks).where(eq(tasks.status, "done"));
    const pendingTasks = await db.select({ val: count() }).from(tasks).where(eq(tasks.status, "todo"));
    const done = completedTasks[0].val || 0;
    const todo = pendingTasks[0].val || 0;
    
    let healthScore = 88; // default
    if (done + todo > 0) {
      healthScore = Math.min(100, Math.max(60, Math.round((done / (done + todo)) * 30 + 70)));
    }

    res.json({
      users: userCount[0].val,
      workspaces: wsCount[0].val,
      projects: projectCount[0].val,
      messages: messageCount[0].val,
      tasks: taskCount[0].val,
      auditLogs: auditCount[0].val,
      agents: Object.keys(AGENT_CONFIG).length,
      uptime: "99.98%",
      storage: "1.24 GB",
      healthScore
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 3. USER MANAGEMENT ─────────────────────────────────────────────────────
adminRouter.get("/users", adminAuth, async (req, res) => {
  try {
    const allUsers = await db.select().from(users).orderBy(desc(users.createdAt));
    res.json(allUsers);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.patch("/users/:id/role", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!role) return res.status(400).json({ error: "Role is required" });

    await db.update(users).set({ role }).where(eq(users.id, id as any));

    // Audit Log
    const targetUser = await db.select().from(users).where(eq(users.id, id as any)).limit(1);
    await db.insert(activities).values({
      userId: req.adminId as any,
      type: "role_change",
      description: `Updated role of operator @${targetUser[0]?.username || id} to ${role}`
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.patch("/users/:id/status", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { suspended } = req.body;
    
    const results = await db.select().from(users).where(eq(users.id, id as any)).limit(1);
    const user = results[0];
    if (!user) return res.status(404).json({ error: "User not found" });

    const preferences = { ...(user.preferences as object), suspended };
    await db.update(users).set({ preferences }).where(eq(users.id, id as any));

    // Audit Log
    await db.insert(activities).values({
      userId: req.adminId as any,
      type: suspended ? "operator_suspended" : "operator_activated",
      description: `${suspended ? 'Suspended' : 'Activated'} operator @${user.username}`
    });

    res.json({ success: true, user: { ...user, preferences } });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.delete("/users/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const target = await db.select().from(users).where(eq(users.id, id as any)).limit(1);
    if (!target[0]) return res.status(404).json({ error: "User not found" });

    await db.delete(users).where(eq(users.id, id as any));

    // Audit Log
    await db.insert(activities).values({
      userId: req.adminId as any,
      type: "operator_removed",
      description: `Removed operator ${target[0].name} (@${target[0].username})`
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 4. WORKSPACE MANAGEMENT ────────────────────────────────────────────────
adminRouter.get("/workspaces", adminAuth, async (req, res) => {
  try {
    const ws = await db.select({
      id: workspaces.id,
      name: workspaces.name,
      code: workspaces.code,
      industry: workspaces.industry,
      description: workspaces.description,
      logo: workspaces.logo,
      createdAt: workspaces.createdAt,
      ownerName: users.name,
      ownerEmail: users.email
    })
    .from(workspaces)
    .innerJoin(users, eq(workspaces.ownerId, users.id))
    .orderBy(desc(workspaces.createdAt));

    res.json(ws);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.patch("/workspaces/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, logo, industry } = req.body;

    await db.update(workspaces)
      .set({ name, description, logo, industry })
      .where(eq(workspaces.id, id as any));

    // Audit Log
    await db.insert(activities).values({
      userId: req.adminId as any,
      type: "workspace_updated",
      description: `Modified settings of workspace: ${name}`
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.delete("/workspaces/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const ws = await db.select().from(workspaces).where(eq(workspaces.id, id as any)).limit(1);
    if (!ws[0]) return res.status(404).json({ error: "Workspace not found" });

    await db.delete(workspaces).where(eq(workspaces.id, id as any));

    // Audit Log
    await db.insert(activities).values({
      userId: req.adminId as any,
      type: "workspace_deleted",
      description: `Deleted workspace: ${ws[0].name}`
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 5. AI AGENT CONTROL CENTER ──────────────────────────────────────────────
adminRouter.get("/agents", adminAuth, async (req, res) => {
  try {
    const customConfigs = readJsonFile(AGENT_CONFIGS_FILE, {});
    const dynamicAgents = Object.entries(AGENT_CONFIG).map(([id, conf]: [string, any]) => {
      const custom = customConfigs[id] || {};
      return {
        id,
        name: conf.label,
        role: conf.description,
        model: custom.model || conf.model,
        temperature: custom.temperature ?? 0.7,
        systemPrompt: custom.systemPrompt || "",
        enabled: custom.enabled !== false,
        status: id === 'founder' ? 'Online' : id === 'ceo' ? 'Thinking' : id === 'coding' ? 'Executing' : 'Idle',
        load: id === 'coding' ? '82%' : id === 'ceo' ? '41%' : '10%',
        completedTasks: id === 'founder' ? 128 : id === 'ceo' ? 94 : id === 'coding' ? 156 : 32
      };
    });

    res.json(dynamicAgents);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post("/agents/:id/config", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { model, temperature, systemPrompt, enabled } = req.body;

    const customConfigs = readJsonFile(AGENT_CONFIGS_FILE, {});
    customConfigs[id] = {
      model,
      temperature,
      systemPrompt,
      enabled
    };

    writeJsonFile(AGENT_CONFIGS_FILE, customConfigs);

    // Audit Log
    await db.insert(activities).values({
      userId: req.adminId as any,
      type: "agent_reconfigured",
      description: `Tuned neural weights for agent entity: ${id}`
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 6. PROJECT MANAGEMENT CRUD ─────────────────────────────────────────────
adminRouter.get("/projects", adminAuth, async (req, res) => {
  try {
    const all = await db.select().from(projects).orderBy(desc(projects.createdAt));
    res.json(all);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post("/projects", adminAuth, async (req, res) => {
  try {
    const { title, description, industry, targetUsers, workspaceId } = req.body;
    
    // Pick first workspace if not provided
    let targetWsId = workspaceId;
    if (!targetWsId) {
      const wss = await db.select().from(workspaces).limit(1);
      targetWsId = wss[0]?.id;
    }

    if (!title || !industry || !targetUsers) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const [proj] = await db.insert(projects).values({
      workspaceId: targetWsId as any,
      userId: req.adminId as any,
      title,
      description,
      industry,
      targetUsers,
      status: "in_progress",
      progress: 10
    }).returning();

    // Audit log
    await db.insert(activities).values({
      userId: req.adminId as any,
      workspaceId: targetWsId as any,
      type: "project_created",
      description: `Created new project venture: ${title}`
    });

    res.status(201).json(proj);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.patch("/projects/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, progress, title, description } = req.body;

    await db.update(projects)
      .set({ status, progress, title, description, updatedAt: new Date() })
      .where(eq(projects.id, id as any));

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.delete("/projects/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const proj = await db.select().from(projects).where(eq(projects.id, id as any)).limit(1);
    if (!proj[0]) return res.status(404).json({ error: "Project not found" });

    await db.delete(projects).where(eq(projects.id, id as any));

    // Audit
    await db.insert(activities).values({
      userId: req.adminId as any,
      type: "project_deleted",
      description: `Deleted venture plan: ${proj[0].title}`
    });

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 7. TASK MANAGEMENT CRUD ────────────────────────────────────────────────
adminRouter.get("/tasks", adminAuth, async (req, res) => {
  try {
    const all = await db.select().from(tasks).orderBy(desc(tasks.createdAt));
    res.json(all);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post("/tasks", adminAuth, async (req, res) => {
  try {
    const { title, description, assignedTo, priority, status, dueDate, projectId, workspaceId } = req.body;
    
    let targetWsId = workspaceId;
    if (!targetWsId) {
      const wss = await db.select().from(workspaces).limit(1);
      targetWsId = wss[0]?.id;
    }

    if (!title) return res.status(400).json({ error: "Title is required" });

    const [task] = await db.insert(tasks).values({
      workspaceId: targetWsId as any,
      projectId: projectId || null,
      title,
      description: description || "",
      assignedTo: assignedTo || "Founder Agent",
      priority: priority || "medium",
      status: status || "todo",
      dueDate: dueDate ? new Date(dueDate) : null
    }).returning();

    // Audit
    await db.insert(activities).values({
      userId: req.adminId as any,
      workspaceId: targetWsId as any,
      type: "task_created",
      description: `Created workspace task: "${title}"`
    });

    // Notify assignee
    if (assignedTo) {
      // Find user if it's a UUID, otherwise it's an agent
      const cleanAssignee = assignedTo.replace('@', '');
      const userRes = await db.select().from(users).where(eq(users.username, cleanAssignee)).limit(1);
      if (userRes[0]) {
        await db.insert(notifications).values({
          userId: userRes[0].id,
          workspaceId: targetWsId as any,
          title: "New Task Assigned",
          message: `You've been assigned: ${title}`,
          type: "task_assigned"
        });
      }
    }

    res.status(201).json(task);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.patch("/tasks/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, assignedTo, priority, status, dueDate } = req.body;

    await db.update(tasks)
      .set({
        title,
        description,
        assignedTo,
        priority,
        status,
        dueDate: dueDate ? new Date(dueDate) : null
      })
      .where(eq(tasks.id, id as any));

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.delete("/tasks/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(tasks).where(eq(tasks.id, id as any));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 8. TEAM INVITATIONS ────────────────────────────────────────────────────
adminRouter.get("/invitations", adminAuth, async (req, res) => {
  try {
    const invites = await db.select({
      id: invitations.id,
      email: invitations.email,
      role: invitations.role,
      message: invitations.message,
      status: invitations.status,
      token: invitations.token,
      expiresAt: invitations.expiresAt,
      createdAt: invitations.createdAt,
      workspaceName: workspaces.name,
      senderName: users.name
    })
    .from(invitations)
    .innerJoin(workspaces, eq(invitations.workspaceId, workspaces.id))
    .innerJoin(users, eq(invitations.senderId, users.id))
    .orderBy(desc(invitations.createdAt));

    res.json(invites);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 9. NOTIFICATION CENTER ─────────────────────────────────────────────────
adminRouter.get("/notifications", adminAuth, async (req, res) => {
  try {
    const list = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, req.adminId as any))
      .orderBy(desc(notifications.createdAt))
      .limit(30);
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post("/notifications/read", adminAuth, async (req, res) => {
  try {
    await db.update(notifications)
      .set({ read: 1 })
      .where(eq(notifications.userId, req.adminId as any));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 10. AI MEETING CENTER (RUN MEETING VIA GROQ) ──────────────────────────
adminRouter.get("/meetings", adminAuth, async (req, res) => {
  try {
    const list = await db.select().from(meetings).orderBy(desc(meetings.createdAt));
    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

adminRouter.post("/meetings/run", adminAuth, async (req, res) => {
  try {
    const { title, agenda, participants, workspaceId } = req.body;
    
    let targetWsId = workspaceId;
    if (!targetWsId) {
      const wss = await db.select().from(workspaces).limit(1);
      targetWsId = wss[0]?.id;
    }

    if (!title || !agenda) {
      return res.status(400).json({ error: "Title and Agenda are required" });
    }

    const agentsList = participants && participants.length > 0 ? participants : ["founder", "ceo", "coding", "marketing"];

    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: "AI Engine offline: GROQ_API_KEY not configured" });
    }

    const groq = new Groq({ apiKey: GROQ_API_KEY });
    
    // Compile labels
    const characterLabels = agentsList.map((a: string) => {
      const conf = (AGENT_CONFIG as any)[a];
      return conf ? `${conf.label} (${conf.description})` : a;
    }).join(", ");

    const systemPrompt = `You are simulated as a collaborative business dashboard script.
We are running a virtual business meeting.
Title: "${title}"
Agenda: "${agenda}"
Participants: [${characterLabels}]

Write a short, engaging meeting transcript where each of the participants speaks in character, sharing expert strategic advice based on their roles. Keep the dialogue efficient and professional. No markdown bold name prefixes, format like:
Founder Agent: ...
CEO Agent: ...

At the very end of the meeting, write a special delimiter "###SUMMARY_METADATA###" and provide a JSON payload. The JSON payload must contain:
{
  "summary": "A high level 2-sentence summary of the meeting",
  "decisions": ["Decision 1", "Decision 2"],
  "actionItems": ["Action Item 1 (Assignee)", "Action Item 2 (Assignee)"]
}
`;

    console.log(`🤖 Invoking virtual AI meeting for: ${title}`);
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: systemPrompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.7,
      max_tokens: 1500
    });

    const responseText = completion.choices[0]?.message?.content || "";
    
    let dialogue = responseText;
    let summary = "Meeting successfully run.";
    let decisions: string[] = ["Proceed with strategic plan."];
    let actionItems: string[] = ["Review roadmap items (All Agents)"];

    if (responseText.includes("###SUMMARY_METADATA###")) {
      const parts = responseText.split("###SUMMARY_METADATA###");
      dialogue = parts[0].trim();
      try {
        const metadata = JSON.parse(parts[1].trim());
        summary = metadata.summary || summary;
        decisions = metadata.decisions || decisions;
        actionItems = metadata.actionItems || actionItems;
      } catch (jsonErr) {
        console.warn("⚠️ Failed to parse meeting metadata JSON", jsonErr);
      }
    }

    // Save virtual meeting in PostgreSQL
    const [meeting] = await db.insert(meetings).values({
      workspaceId: targetWsId as any,
      title,
      agenda,
      date: new Date(),
      summary: dialogue + "\n\n**Executive Summary:** " + summary,
      decisions,
      actionItems
    }).returning();

    // Audit log
    await db.insert(activities).values({
      userId: req.adminId as any,
      workspaceId: targetWsId as any,
      type: "meeting_completed",
      description: `Completed virtual AI meeting session: "${title}"`
    });

    res.status(201).json(meeting);
  } catch (err: any) {
    console.error("❌ virtual meeting failed:", err);
    res.status(500).json({ error: err.message });
  }
});

// ─── 11. COMPANY MEMORY COGNITIVE ENGINE ────────────────────────────────────
adminRouter.post("/memory/query", adminAuth, async (req, res) => {
  try {
    const { query, workspaceId } = req.body;
    if (!query) return res.status(400).json({ error: "Query is required" });

    let targetWsId = workspaceId;
    if (!targetWsId) {
      const wss = await db.select().from(workspaces).limit(1);
      targetWsId = wss[0]?.id;
    }

    if (!GROQ_API_KEY) {
      return res.status(500).json({ error: "AI Engine offline: GROQ_API_KEY not configured" });
    }

    // Gather contextual signals from SQLite/PostgreSQL
    const recentMessages = await db.select({
      role: chatMessages.role,
      content: chatMessages.content,
      agentId: chatMessages.agentId
    })
    .from(chatMessages)
    .where(eq(chatMessages.workspaceId, targetWsId as any))
    .orderBy(desc(chatMessages.createdAt))
    .limit(30);

    const recentMeetings = await db.select({
      title: meetings.title,
      summary: meetings.summary,
      decisions: meetings.decisions
    })
    .from(meetings)
    .where(eq(meetings.workspaceId, targetWsId as any))
    .orderBy(desc(meetings.createdAt))
    .limit(5);

    const recentProjects = await db.select({
      title: projects.title,
      description: projects.description,
      status: projects.status
    })
    .from(projects)
    .where(eq(projects.workspaceId, targetWsId as any))
    .limit(5);

    const contextData = {
      chatMessages: recentMessages.reverse(),
      meetings: recentMeetings,
      projects: recentProjects
    };

    const groq = new Groq({ apiKey: GROQ_API_KEY });
    const systemPrompt = `You are Founder Agent, the cognitive corporate memory of FounderOS.
Analyze the following compiled workspace workspace events, decisions, messages and project schemas to retrieve the requested answers.

[WORKSPACE CONTEXT RECORDS]
${JSON.stringify(contextData, null, 2)}

[USER QUERY]
"${query}"

Write a detailed response synthesizing the records above. Explain decisions or history clearly. Do not use emojis. Always be concise.`;

    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: systemPrompt }],
      model: "llama-3.3-70b-versatile",
      temperature: 0.4
    });

    const response = completion.choices[0]?.message?.content || "No strategic record matches the query parameters.";
    res.json({ answer: response });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 12. KNOWLEDGE BASE DOCUMENTS ───────────────────────────────────────────
adminRouter.get("/documents", adminAuth, (req, res) => {
  const defaultDocs = [
    {
      id: "doc-1",
      title: "FounderOS SOP: AI Employee Collaboration Protocols",
      category: "SOP",
      content: "# FounderOS Standard Operating Procedures\n\nThis guide explains how human operators collaborate with AI agents. Mentions using @Agent trigger context retrievals. All agents participate in active channels like #general.",
      author: "Founder Agent",
      createdAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString()
    },
    {
      id: "doc-2",
      title: "Market Analysis: TAM-SAM-SOM Pitch Deck Draft",
      category: "Research",
      content: "# Market Analysis & TAM-SAM-SOM\n\n- TAM: $12B (Global AI Agent tooling and workspace market)\n- SAM: $4.5B (SME & startup operational platforms)\n- SOM: $250M (Initial developer/creator SaaS customer targets)",
      author: "Research Agent",
      createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString()
    }
  ];
  const list = readJsonFile(DOCUMENTS_FILE, defaultDocs);
  res.json(list);
});

adminRouter.post("/documents", adminAuth, (req, res) => {
  const { title, category, content } = req.body;
  if (!title || !content) return res.status(400).json({ error: "Title and Content are required" });

  const list = readJsonFile(DOCUMENTS_FILE, []);
  const newDoc = {
    id: `doc-${Date.now()}`,
    title,
    category: category || "Business Plan",
    content,
    author: "Super Admin",
    createdAt: new Date().toISOString()
  };

  list.unshift(newDoc);
  writeJsonFile(DOCUMENTS_FILE, list);
  res.status(201).json(newDoc);
});

// ─── 13. AUDIT LOGS ─────────────────────────────────────────────────────────
adminRouter.get("/activities", adminAuth, async (req, res) => {
  try {
    const list = await db.select({
      id: activities.id,
      type: activities.type,
      description: activities.description,
      createdAt: activities.createdAt,
      userName: users.name
    })
    .from(activities)
    .leftJoin(users, eq(activities.userId, users.id))
    .orderBy(desc(activities.createdAt))
    .limit(100);

    res.json(list);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─── 14. AUTOMATION WORKFLOWS ──────────────────────────────────────────────
adminRouter.get("/automations", adminAuth, (req, res) => {
  const defaultWorkflows = [
    {
      id: "wf-1",
      name: "New Venture Setup Flow",
      trigger: "New Project Venture Initialized",
      steps: ["Research Agent TAM Competitors", "CEO Agent Monetization Model", "Coding Agent Database Design"],
      active: true
    },
    {
      id: "wf-2",
      name: "GTM Growth Hack Loop",
      trigger: "Product MVP Ready",
      steps: ["Creative Agent Style Guide", "Marketing Agent Copywriting Campaign", "Manager Agent Task Deployment"],
      active: false
    }
  ];
  const list = readJsonFile(WORKFLOWS_FILE, defaultWorkflows);
  res.json(list);
});

adminRouter.post("/automations", adminAuth, (req, res) => {
  const { name, trigger, steps } = req.body;
  if (!name || !trigger || !steps) return res.status(400).json({ error: "Missing workflow properties" });

  const list = readJsonFile(WORKFLOWS_FILE, []);
  const newWf = {
    id: `wf-${Date.now()}`,
    name,
    trigger,
    steps,
    active: true
  };

  list.push(newWf);
  writeJsonFile(WORKFLOWS_FILE, list);
  res.status(201).json(newWf);
});

// ─── 15. AGENT MARKETPLACE INSTALLATION ────────────────────────────────────
adminRouter.get("/marketplace", adminAuth, (req, res) => {
  const defaultMarket = [
    { id: "hr", name: "HR Agent", role: "Employee Onboarding & Talent Optimization", installed: false },
    { id: "sales", name: "Sales Agent", role: "B2B Lead Scraping & Cold Outreach Sequences", installed: false },
    { id: "finance", name: "Finance Agent", role: "Runway Burn Rate Charts & Investor KPI Modeling", installed: true }, // initialized
    { id: "legal", name: "Legal Agent", role: "Contracts, Terms, NDA Generation & Local Compliance", installed: true }, // initialized
    { id: "analyst", name: "Data Analyst Agent", role: "SQL Queries, Amplitude Cohort Analytics & Metrics Reports", installed: false }
  ];
  const list = readJsonFile(MARKETPLACE_FILE, defaultMarket);
  res.json(list);
});

adminRouter.post("/marketplace/install", adminAuth, (req, res) => {
  const { id } = req.body;
  if (!id) return res.status(400).json({ error: "Agent ID is required" });

  const list = readJsonFile(MARKETPLACE_FILE, []);
  const idx = list.findIndex((a: any) => a.id === id);
  if (idx > -1) {
    list[idx].installed = true;
    writeJsonFile(MARKETPLACE_FILE, list);
    
    // Auto-update AGENT_CONFIGS if applicable
    const customConfigs = readJsonFile(AGENT_CONFIGS_FILE, {});
    customConfigs[id] = { ...customConfigs[id], enabled: true };
    writeJsonFile(AGENT_CONFIGS_FILE, customConfigs);
    
    return res.json({ success: true, agent: list[idx] });
  }

  res.status(404).json({ error: "Agent not found in marketplace catalog" });
});
