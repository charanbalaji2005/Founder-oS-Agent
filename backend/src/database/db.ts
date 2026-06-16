import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });

export async function initDB() {
  try {
    console.log("⏳ Connecting to PostgreSQL...");
    await pool.query("SELECT 1");
    // Ensure UUID extension exists
    await pool.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    await pool.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');
    console.log("✅ Database connected successfully");
  } catch (error) {
    console.error("❌ Database connection failed!");
    console.error("📝 Make sure:");
    console.error("   1. PostgreSQL is installed and running.");
    console.error("   2. You have created a database named 'founderos'.");
    console.error("   3. Your DATABASE_URL in backend/.env is correct.");
    console.error("   Error details:", (error as Error).message);
    process.exit(1);
  }
}

initDB();
