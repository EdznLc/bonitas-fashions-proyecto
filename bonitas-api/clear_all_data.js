import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

// Connection pools
const mainPool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const surveyPool = new Pool({
    connectionString: process.env.SURVEY_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    // 1. Limpieza de respuestas y encuestas en SURVEY_DATABASE_URL
    console.log('Estableciendo conexión con la base de datos de encuestas...');
    const surveyClient = await surveyPool.connect();
    try {
        await surveyClient.query('BEGIN');
        
        console.log('Eliminando respuestas de encuesta (Likert)...');
        await surveyClient.query('DELETE FROM respuestas_encuesta;');
        
        console.log('Eliminando métricas de usabilidad (Ficha)...');
        await surveyClient.query('DELETE FROM metricas_usabilidad;');
        
        console.log('Eliminando participantes registrados...');
        await surveyClient.query('DELETE FROM participantes;');
        
        await surveyClient.query('COMMIT');
        console.log('¡Limpieza de base de datos de encuestas completada con éxito!');
    } catch (err) {
        await surveyClient.query('ROLLBACK');
        console.error('Error al limpiar base de datos de encuestas:', err);
    } finally {
        surveyClient.release();
        await surveyPool.end();
    }

    // 2. Limpieza de prendas y catálogos en DATABASE_URL
    console.log('\nEstableciendo conexión con la base de datos de la tienda...');
    const mainClient = await mainPool.connect();
    try {
        await mainClient.query('BEGIN');

        console.log('Eliminando detalles de ventas anteriores (venta_producto)...');
        await mainClient.query('DELETE FROM venta_producto;');

        console.log('Eliminando registros de ventas (venta)...');
        await mainClient.query('DELETE FROM venta;');

        console.log('Eliminando registros de apartados (apartado)...');
        await mainClient.query('DELETE FROM apartado;');

        console.log('Eliminando catálogo de prendas (producto)...');
        await mainClient.query('DELETE FROM producto;');

        await mainClient.query('COMMIT');
        console.log('¡Limpieza de catálogo de prendas de la tienda completada con éxito!');
    } catch (err) {
        await mainClient.query('ROLLBACK');
        console.error('Error al limpiar catálogo de la tienda:', err);
    } finally {
        mainClient.release();
        await mainPool.end();
    }
}

main();
