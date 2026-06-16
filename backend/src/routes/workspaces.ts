import { Router } from "express";
import { db } from "../database/db";
import {
  workspaces,
  workspaceMembers,
  invitations,
  users,
  chatMessages,
  channels,
  notifications,
  activities
} from "../database/schema";
import { eq, and, or, desc, ilike, count } from "drizzle-orm";
import { z } from "zod";
import { v4 as uuidv4 } from "uuid";
import { sendInviteEmail } from "../services/mail.service";
import { AGENT_CONFIG } from "../../../constants/shared";

export const workspacesRouter = Router();

const createWorkspaceSchema = z.object({
  name: z.string().min(1),
  ownerId: z.string().uuid(),
  industry: z.string().optional(),
  logo: z.string().optional(),
  activeAgents: z.array(z.string()).optional(),
  invites: z.array(z.string()).optional(),
});

// GET /api/workspaces/admin/stats
workspacesRouter.get("/admin/stats", async (req, res) => {
  try {
    const userCount = await db.select({ val: count() }).from(users);
    const wsCount = await db.select({ val: count() }).from(workspaces);
    const projectCount = await db.select({ val: count() }).from(chatMessages); // Proxy for now
    const messageCount = await db.select({ val: count() }).from(chatMessages);
    const taskCount = await db.select({ val: count() }).from(chatMessages); // Proxy for now

    res.json({
      users: userCount[0].val,
      workspaces: wsCount[0].val,
      projects: projectCount[0].val,
      messages: messageCount[0].val,
      tasks: taskCount[0].val,
      agents: Object.keys(AGENT_CONFIG).length,
      uptime: "99.9%",
      storage: "1.2GB"
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workspaces/admin/activity
workspacesRouter.get("/admin/activity", async (req, res) => {
  try {
    const recent = await db.select({
      id: activities.id,
      type: activities.type,
      description: activities.description,
      createdAt: activities.createdAt,
      userName: users.name
    })
    .from(activities)
    .innerJoin(users, eq(activities.userId, users.id))
    .orderBy(desc(activities.createdAt))
    .limit(20);

    res.json(recent);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workspaces/search-users?query=xxx
workspacesRouter.get("/search-users", async (req, res) => {
  try {
    const { query } = req.query;
    if (!query || typeof query !== 'string') {
       // Return recent users if no query
       const recent = await db.select({
         id: users.id,
         name: users.name,
         username: users.username,
         avatar: users.avatar,
         email: users.email
       }).from(users).limit(5);
       return res.json(recent);
    }

    const results = await db.select({
      id: users.id,
      name: users.name,
      username: users.username,
      avatar: users.avatar,
      email: users.email
    })
    .from(users)
    .where(
      or(
        ilike(users.username, `%${query}%`),
        ilike(users.name, `%${query}%`),
        ilike(users.email, `%${query}%`)
      )
    )
    .limit(15);

    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workspaces/:id/invite
workspacesRouter.post("/:id/invite", async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const { username, email: rawEmail, role, message, senderId } = req.body;

    console.log(`✉️ Invite Request: WS=${workspaceId}, User=${username}, Email=${rawEmail}, Sender=${senderId}`);

    if (!senderId) return res.status(400).json({ error: "Sender ID is required" });

    let receiverId: string | null = null;
    let email = rawEmail || null;

    if (username) {
      const cleaned = username.toLowerCase().replace(/^@+/, '');
      const userResult = await db.select().from(users).where(
        or(
          eq(users.username, cleaned),
          eq(users.username, `@${cleaned}`)
        )
      ).limit(1);

      if (userResult[0]) {
        receiverId = userResult[0].id;
        email = userResult[0].email;
      } else {
        // If not found and no email provided, it's a bad request
        if (!email) {
          return res.status(404).json({ error: `User "@${cleaned}" not found. Please provide an email to invite external members.` });
        }
      }
    }

    if (!email && !receiverId) {
      return res.status(400).json({ error: "Username or Email is required for invitation" });
    }

    if (receiverId) {
      const existing = await db.select().from(workspaceMembers)
        .where(and(eq(workspaceMembers.workspaceId, workspaceId as any), eq(workspaceMembers.userId, receiverId as any)))
        .limit(1);
      if (existing[0]) return res.status(400).json({ error: "User is already a member of this workspace" });

      const pending = await db.select().from(invitations)
        .where(and(
          eq(invitations.workspaceId, workspaceId as any),
          eq(invitations.receiverId, receiverId as any),
          eq(invitations.status, 'pending')
        )).limit(1);
      if (pending[0]) return res.status(400).json({ error: "An invitation is already pending for this user" });
    }

    const token = uuidv4();
    await db.insert(invitations).values({
      workspaceId: workspaceId as any,
      senderId: senderId as any,
      receiverId: receiverId as any,
      email,
      role: role || "member",
      message: message || `Join our workspace on FounderOS`,
      token,
      status: "pending"
    });

    const wsResults = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId as any)).limit(1);
    const wsName = wsResults[0]?.name || "a Workspace";

    // 1. Send Email
    if (email) {
       try {
         await sendInviteEmail(email, wsName, role || "member", token);
       } catch (mailErr) {
         console.error("⚠️ Failed to send invite email, but invitation stored in DB");
       }
    }

    // 2. Send App Notification
    if (receiverId) {
      await db.insert(notifications).values({
        userId: receiverId as any,
        workspaceId: workspaceId as any,
        title: "Workspace Invitation",
        message: `You've been invited to join ${wsName}.`,
        type: "mention"
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    console.error("❌ Invite Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workspaces/invitations/:userId
workspacesRouter.get("/invitations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const invites = await db.select({
      id: invitations.id,
      workspaceId: invitations.workspaceId,
      role: invitations.role,
      status: invitations.status,
      createdAt: invitations.createdAt,
      workspaceName: workspaces.name,
      senderName: users.name
    })
    .from(invitations)
    .innerJoin(workspaces, eq(invitations.workspaceId, workspaces.id))
    .innerJoin(users, eq(invitations.senderId, users.id))
    .where(and(eq(invitations.receiverId, userId as any), eq(invitations.status, 'pending')));

    res.json(invites);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workspaces/invitations/respond-token
workspacesRouter.post("/invitations/respond-token", async (req, res) => {
  try {
    const { token, status, userId } = req.body;
    const invite = await db.select().from(invitations).where(eq(invitations.token, token)).limit(1);

    if (!invite[0]) return res.status(404).json({ error: "Invitation not found" });

    if (status === 'accepted' && userId) {
       await db.insert(workspaceMembers).values({
         workspaceId: invite[0].workspaceId,
         userId: userId as any,
         role: invite[0].role,
         status: "online"
       });
    }

    await db.update(invitations).set({ status }).where(eq(invitations.id, invite[0].id));

    if (userId) {
      await db.update(notifications)
        .set({ read: 1 })
        .where(and(
          eq(notifications.userId, userId as any),
          eq(notifications.workspaceId, invite[0].workspaceId as any),
          eq(notifications.title, "Workspace Invitation")
        ));
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workspaces/invitations/:id/respond
workspacesRouter.post("/invitations/:id/respond", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, userId } = req.body;

    const invite = await db.select().from(invitations).where(eq(invitations.id, id as any)).limit(1);
    if (!invite[0]) return res.status(404).json({ error: "Invitation not found" });

    if (status === 'accepted' && userId) {
       await db.insert(workspaceMembers).values({
         workspaceId: invite[0].workspaceId,
         userId: userId as any,
         role: invite[0].role,
         status: "online"
       });
    }

    await db.update(invitations).set({ status }).where(eq(invitations.id, id as any));

    if (userId) {
      await db.update(notifications)
        .set({ read: 1 })
        .where(and(
          eq(notifications.userId, userId as any),
          eq(notifications.workspaceId, invite[0].workspaceId as any),
          eq(notifications.title, "Workspace Invitation")
        ));
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/workspaces/:workspaceId/members/:userId/role
workspacesRouter.patch("/:workspaceId/members/:userId/role", async (req, res) => {
  try {
    const { workspaceId, userId } = req.params;
    const { role } = req.body;
    await db.update(workspaceMembers)
      .set({ role })
      .where(and(eq(workspaceMembers.workspaceId, workspaceId as any), eq(workspaceMembers.userId, userId as any)));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/workspaces/:workspaceId/members/:userId
workspacesRouter.delete("/:workspaceId/members/:userId", async (req, res) => {
  try {
    const { workspaceId, userId } = req.params;
    await db.delete(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, workspaceId as any), eq(workspaceMembers.userId, userId as any)));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workspaces/:id/leave
workspacesRouter.post("/:id/leave", async (req, res) => {
  try {
    const { id: workspaceId } = req.params;
    const { userId } = req.body;

    await db.delete(workspaceMembers)
      .where(and(eq(workspaceMembers.workspaceId, workspaceId as any), eq(workspaceMembers.userId, userId as any)));

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workspaces/:id/members
workspacesRouter.get("/:id/members", async (req, res) => {
  try {
    const { id } = req.params;
    const results = await db.select({
      id: users.id,
      name: users.name,
      username: users.username,
      email: users.email,
      avatar: users.avatar,
      role: workspaceMembers.role,
      status: workspaceMembers.status,
      lastActive: workspaceMembers.lastActive
    })
    .from(workspaceMembers)
    .innerJoin(users, eq(workspaceMembers.userId, users.id))
    .where(eq(workspaceMembers.workspaceId, id as any));

    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workspaces
workspacesRouter.post("/", async (req, res) => {
  try {
    const data = createWorkspaceSchema.parse(req.body);
    const id = uuidv4();
    const code = `FOS-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

    const defaultAgents = ["founder", "ceo", "research", "coding", "marketing", "manager", "employee", "customer_service", "legal", "financial", "operations", "creative"];
    const [ws] = await db.insert(workspaces).values({
      id: id as any,
      name: data.name,
      ownerId: data.ownerId as any,
      industry: data.industry,
      logo: data.logo || "🏢",
      activeAgents: data.activeAgents || defaultAgents,
      code
    }).returning();

    // Auto-add owner
    await db.insert(workspaceMembers).values({
      workspaceId: ws.id,
      userId: data.ownerId as any,
      role: "owner",
      status: "online"
    });

    // Create default channels
    const defaults = ["general", "marketing", "research", "development"];
    for (const name of defaults) {
      await db.insert(channels).values({
        workspaceId: ws.id,
        name
      });
    }

    // Process initial invites if any
    if (data.invites && data.invites.length > 0) {
      for (const target of data.invites) {
        try {
          const isEmail = target.includes('@') && !target.startsWith('@') && target.indexOf('@') > 0;
          let receiverId: string | null = null;
          let email = isEmail ? target : null;

          if (!isEmail) {
            const cleaned = target.toLowerCase().replace(/^@+/, '');
            const userResult = await db.select().from(users).where(
              or(
                eq(users.username, cleaned),
                eq(users.username, `@${cleaned}`)
              )
            ).limit(1);
            if (userResult[0]) {
              receiverId = userResult[0].id;
              email = userResult[0].email;
            }
          } else {
            // Find user by email to get their ID if they already exist
            const userResult = await db.select().from(users).where(eq(users.email, target.toLowerCase())).limit(1);
            if (userResult[0]) {
              receiverId = userResult[0].id;
            }
          }

          const token = uuidv4();
          await db.insert(invitations).values({
            workspaceId: ws.id,
            senderId: data.ownerId as any,
            receiverId: receiverId as any,
            email,
            role: "member",
            message: `Join our workspace ${ws.name} on FounderOS`,
            token,
            status: "pending"
          });

          // Send App Notification if user exists
          if (receiverId) {
            await db.insert(notifications).values({
              userId: receiverId as any,
              workspaceId: ws.id,
              title: "Workspace Invitation",
              message: `You've been invited to join ${ws.name}.`,
              type: "mention"
            });
          }

          // Send Email
          if (email) {
            await sendInviteEmail(email, ws.name, "member", token);
          }
        } catch (inviteErr: any) {
          console.error(`Error sending onboarding invite to ${target}:`, inviteErr.message);
        }
      }
    }

    res.status(201).json(ws);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workspaces/user/:userId
workspacesRouter.get("/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const results = await db.select({
      id: workspaces.id,
      name: workspaces.name,
      role: workspaceMembers.role,
      industry: workspaces.industry,
      code: workspaces.code,
      logo: workspaces.logo,
      activeAgents: workspaces.activeAgents
    })
    .from(workspaceMembers)
    .innerJoin(workspaces, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(eq(workspaceMembers.userId, userId as any));

    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workspaces/notifications/:userId
workspacesRouter.get("/notifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const notes = await db.select()
      .from(notifications)
      .where(eq(notifications.userId, userId as any))
      .orderBy(desc(notifications.createdAt))
      .limit(20);
    res.json(notes);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/workspaces/notifications/:userId/read
workspacesRouter.post("/notifications/:userId/read", async (req, res) => {
  try {
    const { userId } = req.params;
    await db.update(notifications)
      .set({ read: 1 })
      .where(eq(notifications.userId, userId as any));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workspaces/:workspaceId/channels
workspacesRouter.get("/:workspaceId/channels", async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const results = await db.select().from(channels).where(eq(channels.workspaceId, workspaceId as any));
    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/workspaces/:workspaceId/chat/:channelId
workspacesRouter.get("/:workspaceId/chat/:channelId", async (req, res) => {
  try {
    const { workspaceId, channelId } = req.params;
    const messages = await db.select({
      id: chatMessages.id,
      role: chatMessages.role,
      content: chatMessages.content,
      userId: chatMessages.userId,
      agentId: chatMessages.agentId,
      mediaUrl: chatMessages.mediaUrl,
      feedback: chatMessages.feedback,
      createdAt: chatMessages.createdAt,
      userName: users.name
    })
    .from(chatMessages)
    .leftJoin(users, eq(chatMessages.userId, users.id))
    .where(and(
      eq(chatMessages.workspaceId, workspaceId as any),
      eq(chatMessages.channelId, channelId as any)
    ))
    .orderBy(desc(chatMessages.createdAt))
    .limit(50);

    res.json(messages.reverse());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/workspaces/:id
workspacesRouter.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(workspaces).where(eq(workspaces.id, id as any));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
