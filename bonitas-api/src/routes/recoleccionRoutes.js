import express from 'express';
import { surveyPool } from '../db/db.js';

const router = express.Router();

// 1. Obtener la lista de participantes registrados
router.get('/participantes', async (req, res) => {
    try {
        const resultado = await surveyPool.query('SELECT * FROM participantes ORDER BY id DESC;');
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener participantes:', error);
        res.status(500).json({ error: 'No se pudieron consultar los participantes de la encuesta' });
    }
});

// 2. Registrar un nuevo participante (edad, version_interfaz)
router.post('/participantes', async (req, res) => {
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
router.post('/metricas', async (req, res) => {
    const { participante_id, tiempo_segundos, tasa_exito, conteo_errores } = req.body;
    if (participante_id === undefined || tiempo_segundos === undefined || tasa_exito === undefined) {
        return res.status(400).json({ error: 'El ID del participante, el tiempo (segundos) y la tasa de éxito son obligatorios.' });
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
        console.error('Error al guardar métricas de usabilidad:', error);
        res.status(500).json({ error: 'No se pudieron registrar las métricas en la base de datos.' });
    }
});

// 4. Registrar las respuestas del cuestionario Likert
router.post('/respuestas', async (req, res) => {
    const { 
        participante_id, 
        p1_claridad_diseno, 
        p2_facilidad_compra, 
        p3_legibilidad_textos, 
        p4_comodidad_uso, 
        p5_recomendacion 
    } = req.body;

    // Validación de obligatoriedad para respuestas Likert (deben ser entre 1 y 5)
    if (!participante_id || !p1_claridad_diseno || !p2_facilidad_compra || !p3_legibilidad_textos || !p4_comodidad_uso || !p5_recomendacion) {
        return res.status(400).json({ error: 'Se deben contestar todas las preguntas del cuestionario de Likert.' });
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
        console.error('Error al guardar respuestas de encuesta:', error);
        res.status(500).json({ error: 'No se pudieron registrar las respuestas de la encuesta.' });
    }
});

export default router;
