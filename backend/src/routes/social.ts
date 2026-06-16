import { Router } from "express";
import { db } from "../database/db";
import {
  users,
  friendRequests,
  friends,
  conversations,
  conversationMembers,
  directMessages,
  messageReactions,
  notifications
} from "../database/schema";
import { eq, and, or, desc, ilike } from "drizzle-orm";
import { v4 as uuidv4 } from "uuid";

export const socialRouter = Router();

// Send Friend Request
socialRouter.post("/friends/request", async (req, res) => {
  try {
    const { senderId, username } = req.body;
    if (!senderId || !username) {
      return res.status(400).json({ error: "Sender ID and Username are required" });
    }

    const cleanedUsername = username.toLowerCase().replace(/^@+/, "");

    // Find the receiver user
    const [receiver] = await db.select().from(users).where(
      or(
        eq(users.username, cleanedUsername),
        eq(users.username, `@${cleanedUsername}`),
        eq(users.email, username.toLowerCase())
      )
    ).limit(1);

    if (!receiver) {
      return res.status(404).json({ error: "User not found" });
    }

    if (receiver.id === senderId) {
      return res.status(400).json({ error: "You cannot add yourself as a friend" });
    }

    // Check if already friends
    const [existingFriendship] = await db.select().from(friends).where(
      or(
        and(eq(friends.userId, senderId), eq(friends.friendId, receiver.id)),
        and(eq(friends.userId, receiver.id), eq(friends.friendId, senderId))
      )
    ).limit(1);

    if (existingFriendship) {
      return res.status(400).json({ error: "You are already friends with this user" });
    }

    // Check if there is already a pending request
    const [existingRequest] = await db.select().from(friendRequests).where(
      or(
        and(eq(friendRequests.senderId, senderId), eq(friendRequests.receiverId, receiver.id), eq(friendRequests.status, "pending")),
        and(eq(friendRequests.senderId, receiver.id), eq(friendRequests.receiverId, senderId), eq(friendRequests.status, "pending"))
      )
    ).limit(1);

    if (existingRequest) {
      return res.status(400).json({ error: "A pending friend request already exists between you" });
    }

    // Insert request
    await db.insert(friendRequests).values({
      senderId: senderId as any,
      receiverId: receiver.id,
      status: "pending"
    });

    // Create Notification
    await db.insert(notifications).values({
      userId: receiver.id,
      title: "Friend Request",
      message: `You received a friend request from @${req.body.senderUsername || "an operator"}.`,
      type: "mention"
    });

    // If socket server is available, notify in real-time
    const io = req.app.get("io");
    if (io) {
      io.to(receiver.id).emit("friend_request", {
        senderId,
        senderUsername: req.body.senderUsername || "operator"
      });
      io.to(receiver.id).emit("notification", {
        title: "Friend Request",
        message: `You received a friend request.`
      });
    }

    res.json({ success: true, message: "Friend request sent successfully" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Friend Requests list
socialRouter.get("/friends/requests/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Incoming requests
    const incoming = await db.select({
      id: friendRequests.id,
      senderId: friendRequests.senderId,
      status: friendRequests.status,
      createdAt: friendRequests.createdAt,
      senderName: users.name,
      senderUsername: users.username,
      senderAvatar: users.avatar
    })
    .from(friendRequests)
    .innerJoin(users, eq(friendRequests.senderId, users.id))
    .where(eq(friendRequests.receiverId, userId as any));

    // Outgoing requests
    const outgoing = await db.select({
      id: friendRequests.id,
      receiverId: friendRequests.receiverId,
      status: friendRequests.status,
      createdAt: friendRequests.createdAt,
      receiverName: users.name,
      receiverUsername: users.username,
      receiverAvatar: users.avatar
    })
    .from(friendRequests)
    .innerJoin(users, eq(friendRequests.receiverId, users.id))
    .where(eq(friendRequests.senderId, userId as any));

    res.json({ incoming, outgoing });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Respond to Friend Request (Accept/Decline/Block)
socialRouter.post("/friends/respond", async (req, res) => {
  try {
    const { requestId, userId, response } = req.body; // response: 'accepted' | 'declined' | 'blocked'
    if (!requestId || !userId || !response) {
      return res.status(400).json({ error: "Missing required params" });
    }

    const [request] = await db.select().from(friendRequests).where(eq(friendRequests.id, requestId)).limit(1);
    if (!request) {
      return res.status(404).json({ error: "Friend request not found" });
    }

    let conversation = null;

    if (response === "accepted") {
      // 1. Update request status
      await db.update(friendRequests).set({ status: "accepted" }).where(eq(friendRequests.id, requestId));
      
      // 2. Add friendship record
      await db.insert(friends).values({
        userId: request.senderId,
        friendId: request.receiverId
      });

      // 3. Find or Create conversation
      const user1 = request.senderId;
      const user2 = request.receiverId;

      const cm1 = await db.select({ cid: conversationMembers.conversationId })
        .from(conversationMembers)
        .where(eq(conversationMembers.userId, user1 as any));

      const cm2 = await db.select({ cid: conversationMembers.conversationId })
        .from(conversationMembers)
        .where(eq(conversationMembers.userId, user2 as any));

      const c1Ids = cm1.map(c => c.cid);
      const c2Ids = cm2.map(c => c.cid);
      const commonIds = c1Ids.filter(id => c2Ids.includes(id));

      let targetCId = null;
      if (commonIds.length > 0) {
        for (const id of commonIds) {
          const [existing] = await db.select().from(conversations)
            .where(and(eq(conversations.id, id), eq(conversations.type, "private")))
            .limit(1);
          if (existing) {
            targetCId = existing.id;
            break;
          }
        }
      }

      if (!targetCId) {
        const cId = uuidv4();
        await db.insert(conversations).values({
          id: cId as any,
          type: "private",
          name: null,
          icon: null
        });

        await db.insert(conversationMembers).values({
          conversationId: cId as any,
          userId: user1
        });

        await db.insert(conversationMembers).values({
          conversationId: cId as any,
          userId: user2
        });
        targetCId = cId;
      }

      // Fetch the full conversation object with members
      const [conv] = await db.select().from(conversations).where(eq(conversations.id, targetCId as any)).limit(1);
      if (conv) {
        const members = await db.select({
          id: users.id,
          name: users.name,
          username: users.username,
          avatar: users.avatar
        })
        .from(conversationMembers)
        .innerJoin(users, eq(conversationMembers.userId, users.id))
        .where(eq(conversationMembers.conversationId, targetCId as any));

        conversation = {
          ...conv,
          members,
          lastMessage: null
        };
      }

      // Notify sender & insert notification in DB
      const [receiverUser] = await db.select().from(users).where(eq(users.id, request.receiverId)).limit(1);
      const receiverName = receiverUser?.name || "an operator";
      await db.insert(notifications).values({
        userId: request.senderId,
        title: "Friend Request Accepted",
        message: `Your friend request was accepted by ${receiverName}.`,
        type: "mention"
      });

      const io = req.app.get("io");
      if (io) {
        io.to(request.senderId).emit("friend_accept", { friendId: userId, conversation });
        io.to(request.senderId).emit("notification", {
          title: "Friend Request Accepted",
          message: `Your friend request was accepted by ${receiverName}.`
        });
      }
    } else {
      await db.update(friendRequests).set({ status: response }).where(eq(friendRequests.id, requestId));
    }

    res.json({ success: true, conversation });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Friends List
socialRouter.get("/friends/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // A friendship exists if user_id = userId OR friend_id = userId
    const list = await db.select({
      id: friends.id,
      createdAt: friends.createdAt,
      user1Id: friends.userId,
      user2Id: friends.friendId
    })
    .from(friends)
    .where(
      or(
        eq(friends.userId, userId as any),
        eq(friends.friendId, userId as any)
      )
    );

    const friendIds = list.map(f => f.user1Id === userId ? f.user2Id : f.user1Id);
    if (friendIds.length === 0) {
      return res.json([]);
    }

    // Query user details for each friend ID
    const friendsDetails = [];
    for (const fId of friendIds) {
      const [u] = await db.select({
        id: users.id,
        name: users.name,
        username: users.username,
        avatar: users.avatar
      }).from(users).where(eq(users.id, fId as any)).limit(1);
      if (u) friendsDetails.push(u);
    }

    res.json(friendsDetails);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get User conversations (DMs & Groups)
socialRouter.get("/conversations/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    // Get all conversation IDs the user belongs to
    const membersList = await db.select({
      conversationId: conversationMembers.conversationId
    })
    .from(conversationMembers)
    .where(eq(conversationMembers.userId, userId as any));

    const conversationIds = membersList.map(m => m.conversationId);
    if (conversationIds.length === 0) {
      return res.json([]);
    }

    const results = [];
    for (const cId of conversationIds) {
      const [conv] = await db.select().from(conversations).where(eq(conversations.id, cId)).limit(1);
      if (!conv) continue;

      // Fetch conversation members
      const members = await db.select({
        id: users.id,
        name: users.name,
        username: users.username,
        avatar: users.avatar
      })
      .from(conversationMembers)
      .innerJoin(users, eq(conversationMembers.userId, users.id))
      .where(eq(conversationMembers.conversationId, cId));

      // Fetch last message
      const [lastMsg] = await db.select().from(directMessages)
        .where(eq(directMessages.conversationId, cId))
        .orderBy(desc(directMessages.createdAt))
        .limit(1);

      results.push({
        ...conv,
        members,
        lastMessage: lastMsg || null
      });
    }

    res.json(results);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Create private or group conversation
socialRouter.post("/conversations", async (req, res) => {
  try {
    const { type, name, icon, memberIds } = req.body; // type: 'private' | 'group'
    if (!memberIds || !Array.isArray(memberIds) || memberIds.length < 2) {
      return res.status(400).json({ error: "At least 2 members are required" });
    }

    // For private chats, check if conversation already exists
    if (type === "private") {
      const user1 = memberIds[0];
      const user2 = memberIds[1];

      const cm1 = await db.select({ cid: conversationMembers.conversationId })
        .from(conversationMembers)
        .where(eq(conversationMembers.userId, user1 as any));

      const cm2 = await db.select({ cid: conversationMembers.conversationId })
        .from(conversationMembers)
        .where(eq(conversationMembers.userId, user2 as any));

      const c1Ids = cm1.map(c => c.cid);
      const c2Ids = cm2.map(c => c.cid);
      const commonIds = c1Ids.filter(id => c2Ids.includes(id));

      if (commonIds.length > 0) {
        for (const id of commonIds) {
          const [existing] = await db.select().from(conversations)
            .where(and(eq(conversations.id, id), eq(conversations.type, "private")))
            .limit(1);
          if (existing) {
            const members = await db.select({
              id: users.id,
              name: users.name,
              username: users.username,
              avatar: users.avatar
            })
            .from(conversationMembers)
            .innerJoin(users, eq(conversationMembers.userId, users.id))
            .where(eq(conversationMembers.conversationId, existing.id));

            return res.json({
              ...existing,
              members
            });
          }
        }
      }
    }

    // Create conversation
    const cId = uuidv4();
    const [newConv] = await db.insert(conversations).values({
      id: cId as any,
      type: type || "private",
      name: name || null,
      icon: icon || null
    }).returning();

    // Link members
    for (const mId of memberIds) {
      await db.insert(conversationMembers).values({
        conversationId: newConv.id,
        userId: mId
      });
    }

    const members = await db.select({
      id: users.id,
      name: users.name,
      username: users.username,
      avatar: users.avatar
    })
    .from(conversationMembers)
    .innerJoin(users, eq(conversationMembers.userId, users.id))
    .where(eq(conversationMembers.conversationId, newConv.id));

    res.status(201).json({
      ...newConv,
      members
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Get Messages
socialRouter.get("/conversations/:id/messages", async (req, res) => {
  try {
    const { id } = req.params;
    const list = await db.select({
      id: directMessages.id,
      conversationId: directMessages.conversationId,
      senderId: directMessages.senderId,
      content: directMessages.content,
      mediaUrl: directMessages.mediaUrl,
      mediaType: directMessages.mediaType,
      replyToId: directMessages.replyToId,
      seen: directMessages.seen,
      edited: directMessages.edited,
      pinned: directMessages.pinned,
      createdAt: directMessages.createdAt,
      senderName: users.name,
      senderUsername: users.username,
      senderAvatar: users.avatar
    })
    .from(directMessages)
    .innerJoin(users, eq(directMessages.senderId, users.id))
    .where(eq(directMessages.conversationId, id as any))
    .orderBy(desc(directMessages.createdAt))
    .limit(100);

    // Fetch reactions for each message
    const formatted = [];
    for (const m of list) {
      const rxns = await db.select({
        id: messageReactions.id,
        userId: messageReactions.userId,
        reaction: messageReactions.reaction,
        username: users.username
      })
      .from(messageReactions)
      .innerJoin(users, eq(messageReactions.userId, users.id))
      .where(eq(messageReactions.messageId, m.id));

      formatted.push({
        ...m,
        reactions: rxns
      });
    }

    res.json(formatted.reverse());
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Edit direct message
socialRouter.patch("/messages/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    await db.update(directMessages)
      .set({ content, edited: 1 })
      .where(eq(directMessages.id, id as any));

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Delete direct message
socialRouter.delete("/messages/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(directMessages).where(eq(directMessages.id, id as any));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Message Pin Toggle
socialRouter.patch("/messages/:id/pin", async (req, res) => {
  try {
    const { id } = req.params;
    const { pinned } = req.body; // 0 or 1
    await db.update(directMessages).set({ pinned }).where(eq(directMessages.id, id as any));
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Message Reactions Toggle
socialRouter.post("/messages/:id/react", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, reaction } = req.body;

    const [existing] = await db.select().from(messageReactions)
      .where(and(eq(messageReactions.messageId, id as any), eq(messageReactions.userId, userId), eq(messageReactions.reaction, reaction)))
      .limit(1);

    if (existing) {
      await db.delete(messageReactions).where(eq(messageReactions.id, existing.id));
    } else {
      await db.insert(messageReactions).values({
        messageId: id as any,
        userId,
        reaction
      });
    }

    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
