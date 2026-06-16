import { Router } from "express";
import { db } from "../database/db";
import { users, projects, activities, achievements, agentResults, chatMessages, workspaces, workspaceMembers, channels } from "../database/schema";
import { eq, desc, count, and, ne } from "drizzle-orm";
import { z } from "zod";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import requestIp from "request-ip";
import { v4 as uuidv4 } from "uuid";
import { sendOTPEmail } from "../utils/mailer";

export const usersRouter = Router();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

const registerSchema = z.object({
  name: z.string().min(1).max(100),
  username: z.string().min(3).max(30),
  email: z.string().email(),
  password: z.string().min(6),
  companyName: z.string().optional().nullable(),
  workspaceName: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  teamSize: z.string().optional().nullable(),
});

// ... inside the usersRouter ...

// GET /api/users/check-username/:username
usersRouter.get("/check-username/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const existing = await db.select().from(users).where(eq(users.username, username.toLowerCase())).limit(1);
    if (existing[0]) {
      return res.json({ available: false, message: "Username already in use" });
    }
    res.json({ available: true, message: "Username available" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const updateProfileSchema = z.object({
  name: z.string().min(1).optional(),
  username: z.string().min(3).optional(),
  companyName: z.string().optional(),
  workspaceName: z.string().optional(),
  industry: z.string().optional(),
  bio: z.string().optional(),
  phoneNumber: z.string().optional(),
  timezone: z.string().optional(),
  avatar: z.string().optional(),
  preferences: z.any().optional(),
});

const generateToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: "30d" });
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// POST /api/users/register
usersRouter.post("/register", async (req, res) => {
  try {
    console.log("📥 Registration attempt:", req.body.email);
    const data = registerSchema.parse(req.body);
    const email = data.email.toLowerCase();
    const username = data.username.toLowerCase();

    const existingEmail = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingEmail[0]) {
      return res.status(400).json({ error: "Email already registered" });
    }

    const existingUsername = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existingUsername[0]) {
      return res.status(400).json({ error: "Username already in use" });
    }

    const userId = uuidv4();
    const results = await db.insert(users).values({
      id: userId as any,
      name: data.name,
      username: username,
      email: email,
      password: data.password,
      companyName: data.companyName,
      workspaceName: data.workspaceName || `${data.name}'s Workspace`,
      industry: data.industry || "General",
      teamSize: data.teamSize || "1",
    }).returning();

    const user = results[0];

    // CREATE DEFAULT WORKSPACE
    const workspaceId = uuidv4();
    const workspaceCode = `FOS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    await db.insert(workspaces).values({
      id: workspaceId as any,
      name: data.workspaceName || `${data.name}'s Workspace`,
      code: workspaceCode,
      ownerId: user.id,
      industry: data.industry || "General",
    });

    // ADD OWNER AS MEMBER
    await db.insert(workspaceMembers).values({
      workspaceId: workspaceId as any,
      userId: user.id,
      role: "owner",
      status: "online",
    });

    // CREATE DEFAULT CHANNELS
    const defaultChannels = ["general", "marketing", "research", "development", "support", "announcements"];
    for (const name of defaultChannels) {
      await db.insert(channels).values({
        workspaceId: workspaceId as any,
        name,
      });
    }

    // Add initial activity
    await db.insert(activities).values({
      userId: user.id,
      workspaceId: workspaceId as any,
      type: "workspace_created",
      description: "Initialized FounderOS AI Workspace"
    });

    const token = generateToken(user.id);
    res.status(201).json({ user, token, workspaceCode });
  } catch (err) {
    console.error("❌ Registration error:", err);
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        error: "Validation failed",
        details: err.errors.map(e => `${e.path.join('.')}: ${e.message}`)
      });
    }
    const msg = err instanceof Error ? err.message : "Failed to register";
    res.status(500).json({ error: msg });
  }
});

// POST /api/users/login
usersRouter.post("/login", async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);
    const results = await db.select().from(users).where(eq(users.email, email.toLowerCase())).limit(1);
    const user = results[0];

    console.log(`🔑 Login attempt for: ${email}`);

    if (!user) {
      console.log(`❌ User not found: ${email}`);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.password?.trim() !== password.trim()) {
      console.log(`❌ Password mismatch for: ${email}`);
      return res.status(401).json({ error: "Invalid email or password" });
    }

    if (user.twoFactorEnabled === 1) {
      const otp = generateOTP();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      await db.update(users)
        .set({ otpCode: otp, otpExpiresAt: expiresAt })
        .where(eq(users.id, user.id));

      await sendOTPEmail(user.email, otp);

      return res.json({
        twoFactorRequired: true,
        userId: user.id,
        email: user.email.replace(/(.{2})(.*)(?=@)/, (gp1, gp2, gp3) => gp2 + "*".repeat(gp3.length))
      });
    }

    const token = generateToken(user.id);
    console.log(`✅ Login successful: ${email}`);
    res.json({ user, token });
  } catch (err: any) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: "Failed to log in" });
  }
});

// POST /api/users/forgot-password
usersRouter.post("/forgot-password", async (req, res) => {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(req.body);
    const results = await db.select().from(users).where(eq(users.email, email)).limit(1);
    const user = results[0];

    if (!user) {
      return res.status(404).json({ error: "No account found with this email" });
    }

    const otp = generateOTP();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

    await db.update(users)
      .set({ otpCode: otp, otpExpiresAt: expiresAt })
      .where(eq(users.id, user.id));

    await sendOTPEmail(user.email, otp);

    res.json({ success: true, message: "Password reset code sent successfully", userId: user.id });
  } catch (err: any) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// POST /api/users/reset-password
usersRouter.post("/reset-password", async (req, res) => {
  try {
    const { userId, password } = z.object({
      userId: z.string().uuid(),
      password: z.string().min(6),
    }).parse(req.body);

    await db.update(users)
      .set({ password: password, otpCode: null, otpExpiresAt: null })
      .where(eq(users.id, userId as any));

    res.json({ success: true, message: "Password updated successfully" });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update password" });
  }
});

usersRouter.patch("/profile/:id", async (req, res) => {
  try {
    const userId = req.params.id as any;
    const data = updateProfileSchema.parse(req.body);

    if (data.username) {
      const cleanUsername = data.username.toLowerCase().replace(/^@+/, "");
      const existing = await db.select().from(users).where(
        and(
          eq(users.username, cleanUsername),
          ne(users.id, userId)
        )
      ).limit(1);
      if (existing[0]) {
        return res.status(400).json({ error: "Username is already taken" });
      }
      data.username = cleanUsername;
    }

    const results = await db.update(users)
      .set({ ...data })
      .where(eq(users.id, userId))
      .returning();

    if (!results[0]) return res.status(404).json({ error: "User not found" });

    const updatedUser = results[0];

    // Also update the workspace name in the workspaces table if updated
    if (data.workspaceName) {
      try {
        await db.update(workspaces)
          .set({ name: data.workspaceName })
          .where(eq(workspaces.ownerId, userId));
      } catch (wsErr) {
        console.error("Failed to update workspace name in workspaces table:", wsErr);
      }
    }

    const io = req.app.get("io");
    if (io) {
      io.emit("user_update", {
        userId: updatedUser.id,
        name: updatedUser.name,
        username: updatedUser.username,
        avatar: updatedUser.avatar
      });
    }

    // Log activity
    try {
      await db.insert(activities).values({
        userId: userId,
        type: "profile_updated",
        description: "Updated profile information"
      });
    } catch {}

    res.json({ success: true, user: updatedUser });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/profile/:id
usersRouter.get("/profile/:id", async (req, res) => {
  try {
    const userId = req.params.id as any;

    const userResults = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    const user = userResults[0];
    if (!user) return res.status(404).json({ error: "User not found" });

    let stats = { projectsCreated: 0, completedTasks: 0, aiConversations: 0, activeAgents: 0 };
    let activity: any[] = [];
    let projectsList: any[] = [];
    let userAchievements: any[] = [];
    let agents: any[] = [];

    try {
      const projectCount = await db.select({ value: count() }).from(projects).where(eq(projects.userId, userId));
      stats.projectsCreated = projectCount[0]?.value || 0;

      const completedCount = await db.select({ value: count() }).from(projects).where(and(eq(projects.userId, userId), eq(projects.status, "complete" as any)));
      stats.completedTasks = (completedCount[0]?.value || 0) * 12;

      activity = await db.select().from(activities).where(eq(activities.userId, userId)).orderBy(desc(activities.createdAt)).limit(10);
      projectsList = await db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.createdAt)).limit(5);
      userAchievements = await db.select().from(achievements).where(eq(achievements.userId, userId));

      const activeAgentsResult = await db.select().from(agentResults)
        .innerJoin(projects, eq(agentResults.projectId, projects.id))
        .where(eq(projects.userId, userId))
        .orderBy(desc(agentResults.createdAt))
        .limit(8);

      agents = activeAgentsResult.map(a => ({
        id: a.agent_results.agentId,
        status: a.agent_results.status,
        lastActivity: a.agent_results.createdAt
      }));
      stats.activeAgents = agents.length || 8;
      stats.aiConversations = 124; // Static for now
    } catch (dbErr) {
      console.warn("⚠️ Non-critical DB fetch error in profile:", dbErr);
    }

    res.json({
      user,
      stats,
      activity,
      projects: projectsList,
      achievements: userAchievements,
      agents,
      security: {
        twoFactorEnabled: user.twoFactorEnabled === 1,
        connectedAccounts: ["Google"],
        lastLogin: new Date().toISOString(),
        activeSessions: 1,
        devices: ["FounderOS Terminal"]
      },
      billing: {
        plan: user.plan,
        renewalDate: "2024-12-12",
        usage: "45%",
        creditsRemaining: 1200
      }
    });
  } catch (err: any) {
    console.error("❌ Profile Route Error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// POST /api/users/verify-otp
usersRouter.post("/verify-otp", async (req, res) => {
  try {
    const { userId, otp } = z.object({
      userId: z.string().uuid(),
      otp: z.string().length(6),
    }).parse(req.body);

    const results = await db.select().from(users).where(eq(users.id, userId as any)).limit(1);
    const user = results[0];

    if (!user || user.otpCode !== otp) {
      return res.status(401).json({ error: "Invalid verification code" });
    }

    if (user.otpExpiresAt && user.otpExpiresAt < new Date()) {
      return res.status(401).json({ error: "Verification code expired" });
    }

    await db.update(users)
      .set({ otpCode: null, otpExpiresAt: null })
      .where(eq(users.id, user.id));

    const token = generateToken(user.id);
    res.json({ user, token });
  } catch (err: any) {
    res.status(500).json({ error: "Verification failed" });
  }
});

// POST /api/users/toggle-2fa
usersRouter.post("/toggle-2fa", async (req, res) => {
  try {
    console.log("🔒 Toggle 2FA request:", req.body);
    const { userId, enabled } = z.object({
      userId: z.string().uuid(),
      enabled: z.any(), // Be flexible with input type
    }).parse(req.body);

    const isEnabled = enabled === true || enabled === 1 || enabled === 'true';

    const result = await db.update(users)
      .set({ twoFactorEnabled: isEnabled ? 1 : 0 })
      .where(eq(users.id, userId as any))
      .returning();

    console.log("✅ 2FA updated for:", userId, "New state:", isEnabled);
    res.json({ success: true, enabled: isEnabled, user: result[0] });
  } catch (err: any) {
    console.error("❌ 2FA Toggle Error:", err.message);
    res.status(500).json({ error: err.message || "Failed to update security settings" });
  }
});

// GET /api/users/chat/:userId/:agentId
usersRouter.get("/chat/:userId/:agentId", async (req, res) => {
  try {
    const { userId, agentId } = req.params;
    const history = await db.select().from(chatMessages)
      .where(and(eq(chatMessages.userId, userId as any), eq(chatMessages.agentId, agentId)))
      .orderBy(desc(chatMessages.createdAt))
      .limit(50);
    res.json({ messages: history.reverse() });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/chat
usersRouter.post("/chat", async (req, res) => {
  try {
    const { userId, agentId, role, content } = z.object({
      userId: z.string().uuid(),
      agentId: z.string(),
      role: z.enum(["user", "assistant"]),
      content: z.string(),
    }).parse(req.body);

    const results = await db.insert(chatMessages).values({
      userId: userId as any,
      agentId,
      role,
      content,
    }).returning();

    res.status(201).json(results[0]);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

usersRouter.get("/:id", async (req, res) => {
  try {
    const results = await db.select().from(users).where(eq(users.id, req.params.id as any)).limit(1);
    const user = results[0];
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json({ user });
  } catch {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});
