import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';
import cors from 'cors'; // ¡Ojo! Instalen cors ejecutando: npm install cors

dotenv.config();

const app = express();
app.use(cors()); // Permite que su app de React consulte esta API sin bloqueos de seguridad
app.use(express.json());

// Configuración de la conexión a Neon para productos
const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false } // Requerido por Neon para conexiones seguras
});

// Configuración de la conexión a Neon para la recolección de datos de encuestas/métricas
const SURVEY_DATABASE_URL = process.env.SURVEY_DATABASE_URL || process.env.DATABASE_URL;
const surveyPool = new Pool({
    connectionString: SURVEY_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

// Endpoint para obtener el catálogo usando la Vista que crearon
app.get('/api/productos', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM vista_catalogo_disponible;');
        res.json(resultado.rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error al consultar la base de datos de productos' });
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

// --- Endpoints para la Recolección de Datos de Usabilidad ---

// 1. Obtener la lista de participantes registrados
app.get('/api/recoleccion/participantes', async (req, res) => {
    try {
        const resultado = await surveyPool.query('SELECT * FROM participantes ORDER BY id DESC;');
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener participantes:', error);
        res.status(500).json({ error: 'No se pudieron consultar los participantes de la encuesta' });
    }
});

// 2. Registrar un nuevo participante (edad, version_interfaz)
app.post('/api/recoleccion/participantes', async (req, res) => {
    const { edad, version_interfaz } = req.body;
    if (!edad || !version_interfaz) {
        return res.status(400).json({ error: 'La edad y la versión de interfaz son campos obligatorios.' });
    }
    try {
        const query = 'INSERT INTO participantes (edad, version_interfaz) VALUES ($1, $2) RETURNING id, edad, version_interfaz, fecha_registro;';
        const valores = [parseInt(edad, 10), version_interfaz.toUpperCase()];
        const resultado = await surveyPool.query(query, valores);
        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error('Error al registrar participante:', error);
        res.status(500).json({ error: 'No se pudo registrar el participante en la base de datos' });
    }
});

// 3. Registrar la Ficha Técnica (métricas de usabilidad)
app.post('/api/recoleccion/metricas', async (req, res) => {
    const { participante_id, tiempo_segundos, tasa_exito, conteo_errores, observaciones_cualitativas } = req.body;
    if (participante_id === undefined || tiempo_segundos === undefined || tasa_exito === undefined) {
        return res.status(400).json({ error: 'El ID del participante, el tiempo (segundos) y la tasa de éxito son obligatorios.' });
    }
    try {
        const query = `
            INSERT INTO metricas_usabilidad 
            (participante_id, tiempo_segundos, tasa_exito, conteo_errores, observaciones_cualitativas) 
            VALUES ($1, $2, $3, $4, $5) 
            RETURNING *;
        `;
        const valores = [
            parseInt(participante_id, 10),
            parseInt(tiempo_segundos, 10),
            Boolean(tasa_exito),
            parseInt(conteo_errores || 0, 10),
            observaciones_cualitativas
        ];
        const resultado = await surveyPool.query(query, valores);
        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error('Error al guardar métricas de usabilidad:', error);
        res.status(500).json({ error: 'No se pudieron registrar las métricas en la base de datos.' });
    }
});

// 4. Registrar las respuestas del cuestionario Likert
app.post('/api/recoleccion/respuestas', async (req, res) => {
    const { 
        participante_id, 
        p1_claridad_diseno, 
        p2_facilidad_compra, 
        p3_legibilidad_textos, 
        p4_comodidad_uso, 
        p5_recomendacion, 
        comentario_abierto 
    } = req.body;

    // Validación de obligatoriedad para respuestas Likert (deben ser entre 1 y 5)
    if (!participante_id || !p1_claridad_diseno || !p2_facilidad_compra || !p3_legibilidad_textos || !p4_comodidad_uso || !p5_recomendacion) {
        return res.status(400).json({ error: 'Se deben contestar todas las preguntas del cuestionario de Likert.' });
    }

    try {
        const query = `
            INSERT INTO respuestas_encuesta 
            (participante_id, p1_claridad_diseno, p2_facilidad_compra, p3_legibilidad_textos, p4_comodidad_uso, p5_recomendacion, comentario_abierto) 
            VALUES ($1, $2, $3, $4, $5, $6, $7) 
            RETURNING *;
        `;
        const valores = [
            parseInt(participante_id, 10),
            parseInt(p1_claridad_diseno, 10),
            parseInt(p2_facilidad_compra, 10),
            parseInt(p3_legibilidad_textos, 10),
            parseInt(p4_comodidad_uso, 10),
            parseInt(p5_recomendacion, 10),
            comentario_abierto
        ];
        const resultado = await surveyPool.query(query, valores);
        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error('Error al guardar respuestas de encuesta:', error);
        res.status(500).json({ error: 'No se pudieron registrar las respuestas de la encuesta.' });
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor de la API corriendo en http://localhost:${PORT}`);
    if (!process.env.DATABASE_URL && !process.env.SURVEY_DATABASE_URL) {
        console.warn("⚠️ ALERTA: Ni DATABASE_URL ni SURVEY_DATABASE_URL están configuradas en las variables de entorno.");
    } else {
        console.log("🚀 Base de datos configurada correctamente.");
    }
});