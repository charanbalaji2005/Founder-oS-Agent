import { pgTable, text, timestamp, uuid, integer, jsonb, pgEnum } from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["owner", "admin", "manager", "member", "guest"]);
export const statusEnum = pgEnum("status", ["active", "away", "offline"]);

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password"),
  role: text("role").default("user").notNull(),
  plan: text("plan").default("Free").notNull(),
  companyName: text("company_name"),
  workspaceName: text("workspace_name"),
  industry: text("industry"),
  teamSize: text("team_size"),
  avatar: text("avatar"),
  bio: text("bio"),
  phoneNumber: text("phone_number"),
  timezone: text("timezone"),
  preferences: jsonb("preferences").default({}).notNull(),
  twoFactorEnabled: integer("two_factor_enabled").default(0).notNull(),
  otpCode: text("otp_code"),
  otpExpiresAt: timestamp("otp_expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workspaces = pgTable("workspaces", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(), // e.g. FOS-12345
  ownerId: uuid("owner_id").references(() => users.id).notNull(),
  industry: text("industry"),
  description: text("description"),
  logo: text("logo"),
  activeAgents: jsonb("active_agents").default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const workspaceMembers = pgTable("workspace_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  role: text("role").default("member").notNull(), // owner, admin, manager, member, guest
  status: text("status").default("offline").notNull(), // online, away, offline, busy
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  lastActive: timestamp("last_active").defaultNow().notNull(),
});

export const meetings = pgTable("meetings", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  title: text("title").notNull(),
  agenda: text("agenda"),
  date: timestamp("date").notNull(),
  summary: text("summary"),
  decisions: jsonb("decisions").default([]).notNull(),
  actionItems: jsonb("action_items").default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const channels = pgTable("channels", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  name: text("name").notNull(), // e.g., general, marketing, research
  type: text("type").default("public").notNull(), // public, private
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid("user_id").references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  industry: text("industry").notNull(),
  targetUsers: text("target_users").notNull(),
  status: text("status").notNull().default("in_progress"),
  progress: integer("progress").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const agentResults = pgTable("agent_results", {
  id: uuid("id").primaryKey().defaultRandom(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: 'cascade' }).notNull(),
  agentId: text("agent_id").notNull(),
  content: text("content").notNull(),
  model: text("model").notNull(),
  status: text("status").default("completed").notNull(), // completed, thinking, working
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }),
  channelId: uuid("channel_id").references(() => channels.id, { onDelete: 'cascade' }),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }), // Now allows NULL for AI responses
  agentId: text("agent_id"), // Now allows NULL for human messages
  role: text("role").notNull(),
  content: text("content").notNull(),
  mediaUrl: text("media_url"),
  feedback: text("feedback"),
  mentions: jsonb("mentions").default([]).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const tasks = pgTable("tasks", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  projectId: uuid("project_id").references(() => projects.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  description: text("description"),
  assignedTo: text("assigned_to"), // userId or agentId
  status: text("status").default("todo").notNull(), // todo, in_progress, review, done
  priority: text("priority").default("medium").notNull(),
  dueDate: timestamp("due_date"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const approvals = pgTable("approvals", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  requesterId: text("requester_id").notNull(), // agentId usually
  actionType: text("type").notNull(), // publish, delete, send_email
  payload: jsonb("payload").notNull(),
  status: text("status").default("pending").notNull(), // pending, approved, rejected
  decidedBy: uuid("decided_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const activities = pgTable("activities", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }),
  type: text("type").notNull(),
  description: text("description").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  title: text("title").notNull(),
  icon: text("icon").notNull(),
  unlockedAt: timestamp("unlocked_at").defaultNow().notNull(),
});

export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }).notNull(),
  senderId: uuid("sender_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  receiverId: uuid("receiver_id").references(() => users.id, { onDelete: 'cascade' }),
  email: text("email"),
  role: text("role").default("member").notNull(),
  message: text("message"),
  status: text("status").default("pending").notNull(), // pending, accepted, declined, expired
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  workspaceId: uuid("workspace_id").references(() => workspaces.id, { onDelete: 'cascade' }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(), // task_assigned, agent_response, mention
  read: integer("read").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const usageTracking = pgTable("usage_tracking", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  date: timestamp("date").defaultNow().notNull(),
  messagesCount: integer("messages_count").default(0).notNull(),
  aiRequestsCount: integer("ai_requests_count").default(0).notNull(),
  storageUsed: integer("storage_used").default(0).notNull(), // in bytes
});

export const friendRequests = pgTable("friend_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  senderId: uuid("sender_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  receiverId: uuid("receiver_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  status: text("status").default("pending").notNull(), // pending, accepted, declined, blocked
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const friends = pgTable("friends", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  friendId: uuid("friend_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversations = pgTable("conversations", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: text("type").default("private").notNull(), // private, group
  name: text("name"), // for groups
  icon: text("icon"), // for groups
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const conversationMembers = pgTable("conversation_members", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
});

export const directMessages = pgTable("direct_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: 'cascade' }).notNull(),
  senderId: uuid("sender_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  content: text("content").notNull(),
  mediaUrl: text("media_url"),
  mediaType: text("media_type"), // image, file, voice, video, document
  replyToId: uuid("reply_to_id"),
  seen: integer("seen").default(0).notNull(), // 0 = sent, 1 = seen
  edited: integer("edited").default(0).notNull(),
  pinned: integer("pinned").default(0).notNull(), // 0 = normal, 1 = pinned
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const messageReactions = pgTable("message_reactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  messageId: uuid("message_id").references(() => directMessages.id, { onDelete: 'cascade' }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: 'cascade' }).notNull(),
  reaction: text("reaction").notNull(), // 👍, ❤️, 🔥, 😂, 👏
  createdAt: timestamp("created_at").defaultNow().notNull(),
});
