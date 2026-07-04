import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Configuración de la conexión a Neon para productos e-commerce
export const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Requerido por Neon
});

// Configuración de la conexión a Neon para la recolección de datos de encuestas/métricas
export const surveyPool = new Pool({
    connectionString: process.env.SURVEY_DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Requerido por Neon
});
