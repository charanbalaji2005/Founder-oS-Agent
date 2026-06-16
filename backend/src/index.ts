import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import requestIp from "request-ip";
import { projectsRouter } from "./routes/projects";
import { agentsRouter } from "./routes/agents";
import { usersRouter } from "./routes/users";
import { workspacesRouter } from "./routes/workspaces";
import { adminRouter } from "./routes/admin";
import { socialRouter } from "./routes/social";

const app = express();
const PORT = process.env.PORT || 3001;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});
app.use(express.json({ limit: "2mb" }));
app.use(requestIp.mw());

// Rate limiting
app.use(rateLimit({ windowMs: 60_000, max: 100, message: "Too many requests" }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/projects", projectsRouter);
app.use("/api/agents", agentsRouter);
app.use("/api/users", usersRouter);
app.use("/api/workspaces", workspacesRouter);
app.use("/api/admin", adminRouter);
app.use("/api/social", socialRouter);

// Catch-all for API 404s - must return JSON, not HTML
app.use("/api/*", (req, res) => {
  res.status(404).json({ error: `API route not found: ${req.originalUrl}` });
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/api/check-groq", async (req, res) => {
  const key = process.env.GROQ_API_KEY;
  if (!key) return res.status(500).json({ error: "GROQ_API_KEY missing in .env" });

  try {
    const Groq = require("groq-sdk");
    const client = new Groq({ apiKey: key });
    const completion = await client.chat.completions.create({
      messages: [{ role: "user", content: "hi" }],
      model: "llama-3.3-70b-versatile",
      max_tokens: 5
    });
    res.json({ status: "connected", model: "llama-3.3-70b-versatile", response: completion.choices[0]?.message?.content });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ Global Error Handler:", err);
  res.status(err.status || 500).json({
    error: err.message || "Internal Server Error",
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
});

// ─── Start ────────────────────────────────────────────────────────────────────
import { Server } from "socket.io";
import { eq } from "drizzle-orm";
import { db } from "./database/db";
import { directMessages, users } from "./database/schema";

const server = app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`🚀 FounderOS Backend running on http://0.0.0.0:${PORT}`);
});

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.set("io", io);

const onlineUsers = new Map<string, string>(); // userId -> status

io.on("connection", (socket) => {
  console.log(`🔌 Socket connected: ${socket.id}`);

  socket.on("join_user", (userId) => {
    socket.join(userId);
    onlineUsers.set(userId, "online");
    io.emit("status_change", { userId, status: "online" });
    console.log(`👤 User joined personal room: ${userId}`);
  });

  socket.on("join_conversation", (conversationId) => {
    socket.join(conversationId);
    console.log(`💬 Joined conversation room: ${conversationId}`);
  });

  socket.on("user_status", ({ userId, status }) => {
    onlineUsers.set(userId, status);
    io.emit("status_change", { userId, status });
  });

  socket.on("typing_start", ({ conversationId, username }) => {
    socket.to(conversationId).emit("typing_start", { conversationId, username });
  });

  socket.on("typing_stop", ({ conversationId, username }) => {
    socket.to(conversationId).emit("typing_stop", { conversationId, username });
  });

  socket.on("send_dm", async (payload) => {
    try {
      const { conversationId, senderId, content, mediaUrl, mediaType, replyToId } = payload;
      
      const [msg] = await db.insert(directMessages).values({
        conversationId,
        senderId,
        content: content || "",
        mediaUrl: mediaUrl || null,
        mediaType: mediaType || null,
        replyToId: replyToId || null,
        seen: 0
      }).returning();

      const [sender] = await db.select({
        id: users.id,
        name: users.name,
        username: users.username,
        avatar: users.avatar
      }).from(users).where(eq(users.id, senderId)).limit(1);

      const fullMessage = {
        ...msg,
        senderName: sender?.name || "Operator",
        senderUsername: sender?.username || "operator",
        senderAvatar: sender?.avatar || null,
        reactions: []
      };

      io.to(conversationId).emit("receive_dm", fullMessage);

      // Notify others in personal rooms
      socket.to(conversationId).emit("notification", {
        title: "New Message",
        message: `${sender?.name || "Operator"}: ${content || "Shared a file"}`
      });
    } catch (e: any) {
      console.error("Socket send_dm error:", e.message);
    }
  });

  socket.on("message_seen", async ({ conversationId, messageId }) => {
    try {
      await db.update(directMessages).set({ seen: 1 }).where(eq(directMessages.id, messageId));
      io.to(conversationId).emit("message_seen", { conversationId, messageId });
    } catch (e) {}
  });

  socket.on("disconnect", () => {
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

server.on("error", (error: any) => {
  if (error.code === "EADDRINUSE") {
    console.error(`❌ Port ${PORT} is already in use.`);
    process.exit(1);
  } else {
    console.error("❌ Server error:", error);
  }
});

export default app;
