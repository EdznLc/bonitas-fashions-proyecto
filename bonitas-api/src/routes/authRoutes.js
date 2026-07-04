import express from 'express';
import crypto from 'crypto';
import { pool } from '../db/db.js';

const router = express.Router();

// Helper to hash passwords using SHA-256
const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

// 1. Registro de usuario (Solo permite registrar CLIENTES por seguridad)
router.post('/register', async (req, res) => {
    const { nombre, apellido_p, apellido_m, correo, password, telefono } = req.body;
    
    // Validar obligatoriedad
    if (!nombre || !correo || !password) {
        return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios.' });
    }

    try {
        // Verificar si el correo ya existe
        const checkEmail = await pool.query('SELECT id_usuario FROM usuario WHERE correo = $1', [correo]);
        if (checkEmail.rows.length > 0) {
            return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
        }

        const passwordHash = hashPassword(password);
        const query = `
            INSERT INTO usuario (nombre, apellido_p, apellido_m, correo, password, telefono, rol)
            VALUES ($1, $2, $3, $4, $5, $6, 'cliente')
            RETURNING id_usuario, nombre, apellido_p, apellido_m, correo, telefono, rol;
        `;
        const valores = [nombre, apellido_p || null, apellido_m || null, correo, passwordHash, telefono || null];
        const resultado = await pool.query(query, valores);
        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ error: 'No se pudo realizar el registro de usuario.' });
    }
});

// 2. Login de usuario
router.post('/login', async (req, res) => {
    const { correo, password } = req.body;

    if (!correo || !password) {
        return res.status(400).json({ error: 'Correo y contraseña son obligatorios.' });
    }

    try {
        const passwordHash = hashPassword(password);
        const query = `
            SELECT id_usuario, nombre, apellido_p, apellido_m, correo, telefono, rol, password
            FROM usuario
            WHERE correo = $1;
        `;
        const resultado = await pool.query(query, [correo]);

        if (resultado.rows.length === 0) {
            return res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos.' });
        }

        const usuario = resultado.rows[0];
        if (usuario.password !== passwordHash) {
            return res.status(401).json({ error: 'Correo electrónico o contraseña incorrectos.' });
        }

        // Retornar datos de usuario excluyendo password
        const { password: _, ...usuarioInfo } = usuario;
        res.json(usuarioInfo);
    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ error: 'Ocurrió un error en el servidor al intentar iniciar sesión.' });
    }
});

export default router;
