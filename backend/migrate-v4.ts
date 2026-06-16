import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    console.log('🚀 Starting FounderOS V4 Migration (Premium OS)...');

    // 1. Channels
    await pool.query(`
      CREATE TABLE IF NOT EXISTS channels (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        type TEXT DEFAULT 'public' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ Channels table created');

    // 2. Notifications
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        type TEXT NOT NULL,
        read INTEGER DEFAULT 0 NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);
    console.log('✅ Notifications table created');

    // 3. Update Workspaces for Avatar
    await pool.query(`
      ALTER TABLE workspaces ADD COLUMN IF NOT EXISTS avatar TEXT;
    `);
    console.log('✅ Workspaces table updated for avatar');

    // 4. Update Chat Messages for Channel
    await pool.query(`
      ALTER TABLE chat_messages
      ADD COLUMN IF NOT EXISTS channel_id UUID REFERENCES channels(id) ON DELETE CASCADE;
    `);
    console.log('✅ Chat Messages table updated for channels');

    console.log('🎉 Migration V4 Completed Successfully!');

  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
