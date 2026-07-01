import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const connectionString = 'postgresql://neondb_owner:npg_Ob0L2nZqpJBh@ep-round-sound-atd8y6nz-pooler.c-9.us-east-1.aws.neon.tech/neondb?sslmode=require';

console.log("Testing database connection for 'metricas_usabilidad'...");

const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const client = await pool.connect();
        
        // Check structure of 'metricas_usabilidad'
        const columnsRes = await client.query(`
            SELECT column_name, data_type, is_nullable 
            FROM information_schema.columns 
            WHERE table_name = 'metricas_usabilidad';
        `);
        console.log("Columns of 'metricas_usabilidad':", columnsRes.rows);

        // Try to select sample rows
        const sampleRes = await client.query("SELECT * FROM metricas_usabilidad LIMIT 3;");
        console.log("Sample rows from 'metricas_usabilidad':", sampleRes.rows);

        client.release();
    } catch (err) {
        console.error("ERROR running database diagnostic:", err);
    } finally {
        await pool.end();
    }
}

run();
