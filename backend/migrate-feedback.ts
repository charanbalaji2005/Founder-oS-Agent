import { Pool } from 'pg';
import * as dotenv from 'dotenv';
dotenv.config();

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    console.log('🚀 Running Feedback Column Migration...');
    await pool.query(`
      ALTER TABLE chat_messages ADD COLUMN IF NOT EXISTS feedback TEXT;
    `);
    console.log('✅ Chat Messages table updated with feedback column');
    console.log('🎉 Migration Completed Successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    await pool.end();
  }
}

migrate();
