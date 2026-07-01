import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const connectionString = 'postgresql://neondb_owner:npg_Ob0L2nZqpJBh@ep-round-sound-atd8y6nz-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require';

console.log("Testing database connection to:", connectionString);

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const client = await pool.connect();
        console.log("SUCCESS: Connected to Neon Survey Database!");
        
        // 1. Check if tables exist
        const tablesRes = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        `);
        console.log("Existing tables:", tablesRes.rows.map(r => r.table_name));

        // 2. Check structure of 'respuestas_encuesta'
        const columnsRes = await client.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'respuestas_encuesta';
        `);
        console.log("Columns of 'respuestas_encuesta':", columnsRes.rows);

        // 3. Try to select some rows
        const sampleRes = await client.query("SELECT * FROM respuestas_encuesta LIMIT 3;");
        console.log("Sample rows from 'respuestas_encuesta':", sampleRes.rows);

        client.release();
    } catch (err) {
        console.error("ERROR running database diagnostic:", err);
    } finally {
        await pool.end();
    }
}

run();
