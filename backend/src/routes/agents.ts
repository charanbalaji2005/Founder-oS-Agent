import { Router } from "express";
import Groq from "groq-sdk";
import { z } from "zod";
import { db } from "../database/db";
import { chatMessages, tasks, projects, notifications } from "../database/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { AGENT_CONFIG } from "../../../constants/shared";

export const agentsRouter = Router();

const MODELS = {
  primary: "llama-3.3-70b-versatile",
  reasoning: "llama-3.3-70b-versatile",
  coding: "llama-3.3-70b-versatile",
  vision: "llama-3.2-11b-vision-preview",
} as const;

// Helper to notify admin on error
const notifyAdmin = async (userId: string, workspaceId: string, error: string) => {
  try {
    await db.insert(notifications).values({
      userId: userId as any,
      workspaceId: workspaceId as any,
      title: "System Manager Alert",
      message: `Database error detected: ${error}`,
      type: "error",
    });
  } catch (e) {
    console.error("Failed to notify admin", e);
  }
};

// POST /api/agents/completions/chat - Collaborative Chat Handler
agentsRouter.post("/completions/chat", async (req, res) => {
  try {
    const { workspaceId, channelId, userId, role, content, mediaUrl, mentions } = req.body;

    console.log(`💬 Incoming message for workspace: ${workspaceId}, channel: ${channelId}`);

    if (!workspaceId || !channelId || !userId) {
      console.error("❌ Missing required fields in request body");
      return res.status(400).json({ error: "Missing required fields" });
    }

    // 1. Save Human Message
    let userMsg;
    try {
      const results = await db.insert(chatMessages).values({
        workspaceId: workspaceId as any,
        channelId: channelId as any,
        userId: userId as any,
        role: "user",
        content: String(content || ""),
        mediaUrl: mediaUrl || null,
        mentions: mentions || [],
      }).returning();
      userMsg = results[0];
      console.log("✅ Human message saved:", userMsg.id);
    } catch (dbErr: any) {
      console.error("❌ Database Error (User Msg):", dbErr.message);
      return res.status(500).json({ error: "DB_SAVE_FAILED", details: dbErr.message });
    }

    // 2. Determine if AI should respond
    const lowerContent = String(content || "").toLowerCase();
    const detectedMentions = Object.keys(AGENT_CONFIG).filter(key =>
      lowerContent.includes(`@${key}`) ||
      lowerContent.includes(`@${key}agent`)
    );

    const finalMentions = [...new Set([...(mentions || []), ...detectedMentions])];

    const isCommand = content && content.startsWith('/');

    if (finalMentions.length > 0 || isCommand) {
      let activeAgentId = "founder";
      if (finalMentions.length > 0) {
        activeAgentId = finalMentions[0].toLowerCase().replace('@', '').replace('agent', '');
      } else if (isCommand) {
        // Map common commands to agents
        if (content.startsWith('/generate-code')) activeAgentId = 'coding';
        else if (content.startsWith('/research')) activeAgentId = 'research';
        else if (content.startsWith('/financial')) activeAgentId = 'financial';
        else if (content.startsWith('/marketing') || content.startsWith('/campaign')) activeAgentId = 'marketing';
      }

      const agent = (AGENT_CONFIG as any)[activeAgentId] || (AGENT_CONFIG as any).founder;

      console.log(`🤖 AI Triggered: Agent ${activeAgentId} (${agent.label})`);

      // 3. Build AI Context
      let dbContext = "";
      if (activeAgentId === 'manager' || activeAgentId === 'operations' || (content && content.toLowerCase().includes('status'))) {
        try {
          const tCount = await db.select({ val: count() }).from(tasks).where(eq(tasks.workspaceId, workspaceId as any));
          const pCount = await db.select({ val: count() }).from(projects).where(eq(projects.workspaceId, workspaceId as any));
          dbContext = `\n[DB_CONTEXT]: ${pCount[0]?.val || 0} projects, ${tCount[0]?.val || 0} tasks active.`;
        } catch (ctxErr) {
          console.warn("⚠️ Failed to fetch DB context, continuing without it.");
        }
      }

      const key = process.env.GROQ_API_KEY;
      if (!key) {
        console.error("❌ GROQ_API_KEY missing");
        return res.status(500).json({ error: "AI_CONFIG_ERROR" });
      }

      const client = new Groq({
        apiKey: key,
        timeout: 120 * 1000, // Increased to 120 seconds
        maxRetries: 3,
      });

      let history: any[] = [];
      try {
        history = await db.select().from(chatMessages)
          .where(and(
            eq(chatMessages.workspaceId, workspaceId as any),
            eq(chatMessages.channelId, channelId as any)
          ))
          .orderBy(desc(chatMessages.createdAt))
          .limit(10); // Reduced history slightly to speed up request
      } catch (hErr) {
        console.warn("⚠️ History fetch failed");
      }

      const isBase64Image = mediaUrl && (
        mediaUrl.startsWith("data:image/") ||
        mediaUrl.startsWith("data:application/octet-stream") ||
        mediaUrl.length > 500
      );

      let targetModel = agent.model;
      let lastMsgContent: any = String(content || "");

      if (isBase64Image) {
        targetModel = MODELS.vision;
        lastMsgContent = [
          { type: "text", text: String(content || "Analyze this image.") },
          { type: "image_url", image_url: { url: mediaUrl.startsWith("data:") ? mediaUrl : `data:image/jpeg;base64,${mediaUrl}` } }
        ];
      }

      const aiMessages = [
        {
          role: "system",
          content: `You are ${agent.label}, an expert ${agent.description}.
          WORKSPACE CONTEXT: ${dbContext}

          CORE INSTRUCTIONS:
          1. Use BOLD HEADINGS for all sections.
          2. NEVER use emojis.
          3. You have full access to previous messages in this channel to maintain context.
          4. If the user asks about tasks or projects, use the [DB_CONTEXT] provided above.
          5. Keep your tone professional, efficient, and technical.
          6. If you need to perform an action (like creating a task), explain your plan clearly.
          7. If an image is provided, analyze the image carefully.`
        },
        ...history.reverse().filter(m => m.id !== userMsg.id).map(m => ({
          role: (m.role === 'assistant' ? 'assistant' : 'user') as "user" | "assistant",
          content: String(m.content || "")
        })).filter(m => m.content.trim().length > 0),
        { role: "user", content: lastMsgContent }
      ];

      console.log(`🚀 Dispatching to Groq (${targetModel})...`);

      try {
        let completion;
        try {
          completion = await client.chat.completions.create({
            model: targetModel,
            messages: aiMessages as any,
            temperature: 0.7,
          });
        } catch (firstErr: any) {
          if (firstErr.message.includes("timeout") || firstErr.message.includes("timed out")) {
            console.warn("⚠️ Primary model timed out, attempting fallback to 8B model...");
            completion = await client.chat.completions.create({
              model: "llama3-8b-8192", // Fast fallback
              messages: aiMessages as any,
              temperature: 0.7,
            });
          } else {
            throw firstErr;
          }
        }

        let botContent = completion.choices[0]?.message?.content;

        if (!botContent || botContent.trim().length === 0) {
          console.warn("⚠️ Groq returned empty, using fallback");
          botContent = `I am currently processing your request for the ${workspaceId} instance. Please refine your objective or mention me again if you need specific strategic guidance.`;
        }

        // 5. Save AI Response
        const [aiMsg] = await db.insert(chatMessages).values({
          workspaceId: workspaceId as any,
          channelId: channelId as any,
          agentId: activeAgentId,
          role: "assistant",
          content: botContent,
        }).returning();

        console.log("✅ AI response saved and returned");
        return res.json({
          userMsg,
          aiMsg
        });
      } catch (groqErr: any) {
        console.error("❌ Groq Execution Error:", groqErr.message);
        return res.status(500).json({ error: "AI_EXECUTION_FAILED", details: groqErr.message });
      }
    }

    // Default: Return user message if no AI response needed
    return res.json({ userMsg });

  } catch (err: any) {
    console.error("❌ CRITICAL CHAT ERROR:", err);
    res.status(500).json({ error: "INTERNAL_SERVER_ERROR", details: err.message });
  }
});

// POST /api/agents/chat/messages/:id/regenerate
agentsRouter.post("/chat/messages/:id/regenerate", async (req, res) => {
  try {
    const { id } = req.params;
    const [msg] = await db.select().from(chatMessages).where(eq(chatMessages.id, id as any)).limit(1);
    if (!msg) return res.status(404).json({ error: "Message not found" });

    const history = await db.select().from(chatMessages)
      .where(and(
        eq(chatMessages.workspaceId, msg.workspaceId as string),
        eq(chatMessages.channelId, msg.channelId as string)
      ))
      .orderBy(desc(chatMessages.createdAt))
      .limit(20);

    const lastUserMsg = history.find(h => h.role === 'user');
    if (!lastUserMsg) return res.status(400).json({ error: "No user message found to regenerate from" });

    // Delete old assistant message
    await db.delete(chatMessages).where(eq(chatMessages.id, id as any));

    const agent = (AGENT_CONFIG as any)[msg.agentId || 'founder'] || (AGENT_CONFIG as any).founder;
    const key = process.env.GROQ_API_KEY;
    if (!key) return res.status(500).json({ error: "Groq key missing" });
    const client = new Groq({
      apiKey: key,
      timeout: 90 * 1000,
      maxRetries: 2
    });

    const activeHistory = history.filter(h => h.id !== id);

    const isBase64Image = lastUserMsg.mediaUrl && (
      lastUserMsg.mediaUrl.startsWith("data:image/") ||
      lastUserMsg.mediaUrl.startsWith("data:application/octet-stream") ||
      lastUserMsg.mediaUrl.length > 500
    );

    let targetModel = agent.model;
    let lastUserContent: any = String(lastUserMsg.content || "");
    if (isBase64Image) {
      targetModel = MODELS.vision;
      lastUserContent = [
        { type: "text", text: String(lastUserMsg.content || "Analyze this image.") },
        { type: "image_url", image_url: { url: lastUserMsg.mediaUrl!.startsWith("data:") ? lastUserMsg.mediaUrl! : `data:image/jpeg;base64,${lastUserMsg.mediaUrl}` } }
      ];
    }

    const aiMessages = [
      {
        role: "system",
        content: `You are ${agent.label}, an expert ${agent.description}.
        CORE INSTRUCTIONS:
        1. Use BOLD HEADINGS for all sections.
        2. NEVER use emojis.
        3. You have full access to previous messages in this channel to maintain context.
        4. Keep your tone professional, efficient, and technical.
        5. If image provided, analyze the image carefully.`
      },
      ...activeHistory.reverse().filter(m => m.id !== lastUserMsg.id).map(m => ({
        role: (m.role === 'assistant' ? 'assistant' : 'user') as "user" | "assistant",
        content: String(m.content || "")
      })).filter(m => m.content.trim().length > 0),
      { role: "user", content: lastUserContent }
    ];

    console.log(`🚀 Regenerating Groq Response (${targetModel})...`);

    let completion;
    try {
      completion = await client.chat.completions.create({
        model: targetModel,
        messages: aiMessages as any,
        temperature: 0.7,
      });
    } catch (firstErr: any) {
      if (firstErr.message.includes("timeout") || firstErr.message.includes("timed out")) {
        console.warn("⚠️ Regeneration timed out, fallback to 8B...");
        completion = await client.chat.completions.create({
          model: "llama3-8b-8192",
          messages: aiMessages as any,
          temperature: 0.7,
        });
      } else {
        throw firstErr;
      }
    }

    let botContent = completion.choices[0]?.message?.content;
    if (!botContent) botContent = "I could not regenerate a response. Please try again.";

    const [newAiMsg] = await db.insert(chatMessages).values({
      workspaceId: msg.workspaceId,
      channelId: msg.channelId,
      agentId: msg.agentId,
      role: "assistant",
      content: botContent,
    }).returning();

    res.json(newAiMsg);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/agents/chat/messages/:id/action
agentsRouter.patch("/chat/messages/:id/action", async (req, res) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'like', 'dislike', etc.

    await db.update(chatMessages)
      .set({ feedback: action })
      .where(eq(chatMessages.id, id as any));

    console.log(`👍 Message ${id} feedback updated: ${action}`);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Original completions proxy for non-workspace contexts
agentsRouter.post("/completions", async (req, res) => {
  try {
    let { model, messages, temperature, max_tokens, stream, apiKey, image } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: "Invalid messages format. Expected an array." });
    }

    const key = (apiKey || process.env.GROQ_API_KEY)?.trim();
    if (!key) {
      return res.status(400).json({ error: "Groq API key not configured on server" });
    }

    const client = new Groq({
      apiKey: key,
      timeout: 90 * 1000,
      maxRetries: 2
    });
    let targetModel = model || MODELS.primary;

    if (image) {
      targetModel = MODELS.vision;
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.role === 'user') {
        lastMsg.content = [
          { type: "text", text: typeof lastMsg.content === 'string' ? lastMsg.content : "Analyze this image." },
          { type: "image_url", image_url: { url: `data:image/jpeg;base64,${image}` } }
        ];
      }
    }

    const formattingRules = "\n\nCRITICAL FORMATTING RULES:\n1. Use bold text for all headings (e.g., **Heading**).\n2. Use code blocks for all code.\n3. NEVER use emojis.\n4. If image provided, perform analysis.";

    if (messages[0] && messages[0].role === 'system') {
      messages[0].content += formattingRules;
    }

    const validMessages = messages.map(m => {
      if (Array.isArray(m.content)) return m;
      return { ...m, content: String(m.content) };
    });

    if (stream) {
      res.setHeader("Content-Type", "text/event-stream");
      try {
        const completionStream = await client.chat.completions.create({
          model: targetModel,
          messages: validMessages as any,
          temperature: temperature ?? 0.7,
          max_tokens: max_tokens ?? 1500,
          stream: true,
        });
        for await (const chunk of completionStream) {
          res.write(`data: ${JSON.stringify(chunk)}\n\n`);
        }
      } catch (streamErr: any) {
        res.write(`data: ${JSON.stringify({ error: streamErr.message })}\n\n`);
      } finally {
        res.write("data: [DONE]\n\n");
        res.end();
      }
    } else {
      let completion;
      try {
        completion = await client.chat.completions.create({
          model: targetModel,
          messages: validMessages as any,
          temperature: temperature ?? 0.7,
          max_tokens: max_tokens ?? 1500,
        });
      } catch (firstErr: any) {
        if (firstErr.message.includes("timeout") || firstErr.message.includes("timed out")) {
          console.warn("⚠️ Completion timed out, fallback to 8B...");
          completion = await client.chat.completions.create({
            model: "llama3-8b-8192",
            messages: validMessages as any,
            temperature: temperature ?? 0.7,
            max_tokens: max_tokens ?? 1000,
          });
        } else {
          throw firstErr;
        }
      }
      res.json({ content: completion.choices[0]?.message?.content ?? "" });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
