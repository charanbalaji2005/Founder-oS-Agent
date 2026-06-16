import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function cleanup() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    console.log('🧹 Starting Database Cleanup...');

    // 1. Remove duplicate users (keep the oldest one per email)
    console.log('Removing duplicate users...');
    await pool.query(`
      DELETE FROM users a USING (
        SELECT MIN(created_at) as min_created, email
        FROM users
        GROUP BY email
        HAVING COUNT(*) > 1
      ) b
      WHERE a.email = b.email
      AND a.created_at > b.min_created;
    `);

    // 2. Ensure all tables from schema exist (Idempotent)
    console.log('Ensuring all V4 tables exist...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS agent_results (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
        agent_id TEXT NOT NULL,
        content TEXT NOT NULL,
        model TEXT NOT NULL,
        status TEXT DEFAULT 'completed' NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS achievements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        title TEXT NOT NULL,
        icon TEXT NOT NULL,
        unlocked_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `);

    console.log('✅ Cleanup and Table Validation Completed!');

  } catch (err) {
    console.error('❌ Cleanup failed:', err);
  } finally {
    await pool.end();
  }
}

cleanup();
