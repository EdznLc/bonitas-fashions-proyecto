import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import cors from 'cors'; // ¡Ojo! Instalen cors ejecutando: npm install cors

dotenv.config();

const app = express();
app.use(cors()); // Permite que su app de React consulte esta API sin bloqueos de seguridad
app.use(express.json());

// Configuración de la conexión a Neon
const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Requerido por Neon para conexiones seguras
});

// Endpoint para obtener el catálogo usando la Vista que crearon
app.get('/api/productos', async (req, res) => {
    try {
    const resultado = await pool.query('SELECT * FROM vista_catalogo_disponible;');
    res.json(resultado.rows);
    } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error al consultar la base de datos' });
    }
});

app.post('/api/productos', async (req, res) => {
    const { categoria, descripcion, precio, url_imagen } = req.body;
    try {
    const query = 'INSERT INTO producto (categoria, descripcion, precio, url_imagen) VALUES ($1, $2, $3, $4) RETURNING *';
    const valores = [categoria, descripcion, precio, url_imagen];
    const resultado = await pool.query(query, valores);
    res.status(201).json(resultado.rows[0]);
    } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'No se pudo guardar el producto' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor de la API corriendo en http://localhost:${PORT}`);
});