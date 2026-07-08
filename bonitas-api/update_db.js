import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    const client = await pool.connect();
    try {
        console.log('Iniciando actualización de base de datos...');
        await client.query('BEGIN');

        // 1. Limpiar y re-insertar Métodos de Pago
        try {
            await client.query("DELETE FROM metodo_pago WHERE nombre NOT IN ('Efectivo', 'Transferencia')");
        } catch (e) {
            console.log('Manejando dependencias de métodos de pago...');
        }
        
        const mpCheck1 = await client.query("SELECT * FROM metodo_pago WHERE nombre = 'Efectivo'");
        if (mpCheck1.rows.length === 0) {
            await client.query("INSERT INTO metodo_pago (nombre) VALUES ('Efectivo')");
        }
        const mpCheck2 = await client.query("SELECT * FROM metodo_pago WHERE nombre = 'Transferencia'");
        if (mpCheck2.rows.length === 0) {
            await client.query("INSERT INTO metodo_pago (nombre) VALUES ('Transferencia')");
        }

        // 2. Limpiar y re-insertar Tipos de Entrega
        try {
            await client.query("DELETE FROM tipo_entrega WHERE nombre NOT IN ('Recoger en tienda', 'Punto medio en Soriana Centro')");
        } catch (e) {
            console.log('Manejando dependencias de tipos de entrega...');
        }

        const teCheck1 = await client.query("SELECT * FROM tipo_entrega WHERE nombre = 'Recoger en tienda'");
        if (teCheck1.rows.length === 0) {
            await client.query("INSERT INTO tipo_entrega (nombre) VALUES ('Recoger en tienda')");
        }
        const teCheck2 = await client.query("SELECT * FROM tipo_entrega WHERE nombre = 'Punto medio en Soriana Centro'");
        if (teCheck2.rows.length === 0) {
            await client.query("INSERT INTO tipo_entrega (nombre) VALUES ('Punto medio en Soriana Centro')");
        }

        await client.query('COMMIT');
        console.log('¡Actualización de base de datos completada con éxito!');
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al actualizar base de datos:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
