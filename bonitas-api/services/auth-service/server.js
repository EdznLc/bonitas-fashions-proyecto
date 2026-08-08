import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import pg from 'pg';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

const { Pool } = pg;
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Service-API-Key', 'Accept']
}));
app.use(express.json());

const hashPassword = (password) => {
    return crypto.createHash('sha256').update(password).digest('hex');
};

// Health Check
app.get('/health', (req, res) => {
    res.json({ service: 'Auth Service', status: 'ONLINE', port: process.env.PORT || 5001 });
});

// 1. Registro de usuario
app.post('/api/auth/register', async (req, res) => {
    const { nombre, apellido_p, apellido_m, correo, password, telefono } = req.body;
    
    if (!nombre || !correo || !password) {
        return res.status(400).json({ error: 'Nombre, correo y contraseña son obligatorios.' });
    }

    try {
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
        const nuevoUsuario = resultado.rows[0];

        // Firmar JWT Token (Válido por 8 horas)
        const token = jwt.sign(
            { id_usuario: nuevoUsuario.id_usuario, correo: nuevoUsuario.correo, rol: nuevoUsuario.rol },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.status(201).json({
            ...nuevoUsuario,
            token,
            usuario: nuevoUsuario
        });
    } catch (error) {
        console.error('Error en Auth Service (Register):', error);
        res.status(500).json({ error: 'No se pudo realizar el registro de usuario.' });
    }
});

// 2. Login de usuario
app.post('/api/auth/login', async (req, res) => {
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

        const { password: _, ...usuarioInfo } = usuario;

        // Firmar JWT Token (Válido por 8 horas)
        const token = jwt.sign(
            { id_usuario: usuarioInfo.id_usuario, correo: usuarioInfo.correo, rol: usuarioInfo.rol },
            JWT_SECRET,
            { expiresIn: '8h' }
        );

        res.json({
            ...usuarioInfo,
            token,
            usuario: usuarioInfo
        });
    } catch (error) {
        console.error('Error en Auth Service (Login):', error);
        res.status(500).json({ error: 'Ocurrió un error en el servidor de autenticación.' });
    }
});

// 3. Verificación de JWT Token
app.get('/api/auth/verify', (req, res) => {
    const authHeader = req.headers['authorization'];
    const token = (authHeader && authHeader.split(' ')[1]) || req.query.token;

    if (!token) {
        return res.status(401).json({ error: 'Token no provisto (401 Unauthorized)' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        return res.json({ valid: true, user: decoded });
    } catch (err) {
        return res.status(401).json({ error: 'Token inválido o expirado (401 Unauthorized)' });
    }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`[AUTH SERVICE] Corriendo de forma independiente en puerto http://localhost:${PORT}`);
});

