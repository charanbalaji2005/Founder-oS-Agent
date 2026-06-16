import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    console.log('🚀 Running Messaging & Friends Database Migration...');

    // 1. Friend requests
    await pool.query(`
      CREATE TABLE IF NOT EXISTS friend_requests (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        receiver_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        status TEXT DEFAULT 'pending' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ Friend Requests table created');

    // 2. Friends
    await pool.query(`
      CREATE TABLE IF NOT EXISTS friends (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        friend_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ Friends table created');

    // 3. Conversations
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversations (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        type TEXT DEFAULT 'private' NOT NULL,
        name TEXT,
        icon TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ Conversations table created');

    // 4. Conversation Members
    await pool.query(`
      CREATE TABLE IF NOT EXISTS conversation_members (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        joined_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ Conversation Members table created');

    // 5. Direct Messages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS direct_messages (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
        sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        media_url TEXT,
        media_type TEXT,
        reply_to_id UUID,
        seen INTEGER DEFAULT 0 NOT NULL,
        edited INTEGER DEFAULT 0 NOT NULL,
        pinned INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ Direct Messages table created');

    // 6. Message Reactions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS message_reactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        message_id UUID NOT NULL REFERENCES direct_messages(id) ON DELETE CASCADE,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        reaction TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ Message Reactions table created');

    console.log('🎉 Messaging Migration Completed Successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
