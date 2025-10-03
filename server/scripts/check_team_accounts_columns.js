import pg from 'pg';
const { Pool } = pg;
const pool = new Pool({
  // Update with your actual connection config
  user: 'your_db_user',
  host: 'localhost',
  database: 'your_db_name',
  password: 'your_db_password',
  port: 5432,
});

const main = async () => {
  try {
    const res = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'team_accounts'"
    );
    console.log('team_accounts columns:', res.rows.map(r => r.column_name));
  } catch (err) {
    console.error('Error checking columns:', err);
  } finally {
    await pool.end();
  }
};

main();
