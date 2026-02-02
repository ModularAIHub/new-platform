import dotenv from 'dotenv';
import pg from 'pg';
import fs from 'fs';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  try {
    const sql = fs.readFileSync('./migrations/20260202_add_unique_team_owner.sql', 'utf8');
    await pool.query(sql);
    console.log('✅ Migration applied: unique constraint on teams.owner_id');
    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

runMigration();
