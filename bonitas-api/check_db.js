import pg from 'pg';

const connectionString = 'postgresql://neondb_owner:npg_Ob0L2nZqpJBh@ep-round-sound-atd8y6nz-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

const { Client } = pg;

async function check() {
  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });
  try {
    await client.connect();
    console.log('Successfully connected to PostgreSQL!');
    
    // Check tables
    const res = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public';
    `);
    console.log('Tables in schema:', res.rows.map(r => r.table_name));
  } catch (err) {
    console.error('Error connecting or querying database:', err);
  } finally {
    await client.end();
  }
}

check();
