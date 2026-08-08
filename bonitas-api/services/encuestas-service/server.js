import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Pool } = pg;
const surveyPool = new Pool({
    connectionString: process.env.SURVEY_DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Service-API-Key', 'Accept']
}));
app.use(express.json());

// Health Check
app.get('/health', (req, res) => {
    res.json({ service: 'Encuestas & Métricas Service', status: 'ONLINE', port: process.env.PORT || 5004 });
});

// 1. Participantes
app.get('/api/recoleccion/participantes', async (req, res) => {
    try {
        const resultado = await surveyPool.query('SELECT * FROM participantes ORDER BY id DESC;');
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error en Encuestas Service (Participantes GET):', error);
        res.status(500).json({ error: 'No se pudieron consultar los participantes de la encuesta' });
    }
});

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
        console.error('Error en Encuestas Service (Participantes POST):', error);
        res.status(500).json({ error: 'No se pudo registrar el participante en la base de datos' });
    }
});

// 2. Métricas de Usabilidad ISO 9241-11
app.post('/api/recoleccion/metricas', async (req, res) => {
    const { participante_id, tiempo_segundos, tasa_exito, conteo_errores } = req.body;
    if (participante_id === undefined || tiempo_segundos === undefined || tasa_exito === undefined) {
        return res.status(400).json({ error: 'El ID del participante, el tiempo y la tasa de éxito son obligatorios.' });
    }
    try {
        const query = `
            INSERT INTO metricas_usabilidad 
            (participante_id, tiempo_segundos, tasa_exito, conteo_errores) 
            VALUES ($1, $2, $3, $4) 
            RETURNING *;
        `;
        const valores = [
            parseInt(participante_id, 10),
            parseInt(tiempo_segundos, 10),
            Boolean(tasa_exito),
            parseInt(conteo_errores || 0, 10)
        ];
        const resultado = await surveyPool.query(query, valores);
        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error('Error en Encuestas Service (Métricas POST):', error);
        res.status(500).json({ error: 'No se pudieron registrar las métricas en la base de datos.' });
    }
});

// 3. Respuestas Likert
app.post('/api/recoleccion/respuestas', async (req, res) => {
    const { 
        participante_id, 
        p1_claridad_diseno, 
        p2_facilidad_compra, 
        p3_legibilidad_textos, 
        p4_comodidad_uso, 
        p5_recomendacion 
    } = req.body;

    if (!participante_id || !p1_claridad_diseno || !p2_facilidad_compra || !p3_legibilidad_textos || !p4_comodidad_uso || !p5_recomendacion) {
        return res.status(400).json({ error: 'Se deben contestar todas las preguntas del cuestionario.' });
    }

    try {
        const query = `
            INSERT INTO respuestas_encuesta 
            (participante_id, p1_claridad_diseno, p2_facilidad_compra, p3_legibilidad_textos, p4_comodidad_uso, p5_recomendacion) 
            VALUES ($1, $2, $3, $4, $5, $6) 
            RETURNING *;
        `;
        const valores = [
            parseInt(participante_id, 10),
            parseInt(p1_claridad_diseno, 10),
            parseInt(p2_facilidad_compra, 10),
            parseInt(p3_legibilidad_textos, 10),
            parseInt(p4_comodidad_uso, 10),
            parseInt(p5_recomendacion, 10)
        ];
        const resultado = await surveyPool.query(query, valores);
        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error('Error en Encuestas Service (Respuestas POST):', error);
        res.status(500).json({ error: 'No se pudieron registrar las respuestas de la encuesta.' });
    }
});

const PORT = process.env.PORT || 5004;
app.listen(PORT, () => {
    console.log(`[ENCUESTAS SERVICE] Corriendo de forma independiente en puerto http://localhost:${PORT}`);
});
