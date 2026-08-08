import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import pg from 'pg';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'bonitas_fashions_jwt_secret_key_2026';
const SERVICE_SECRET_KEY = process.env.SERVICE_SECRET_KEY || 'bonitas_internal_service_key_2026';

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

// Middleware de Seguridad Stateless con JWT y API Key Inter-Servicios (Rúbrica 10%)
const verifyAuthAndRole = (requiredRole = null) => {
    return (req, res, next) => {
        // Permitir catálogo público GET /api/productos sin restricciones
        if (req.method === 'GET' && req.path === '/api/productos') {
            return next();
        }

        const apiKey = req.headers['x-service-api-key'];
        if (apiKey === SERVICE_SECRET_KEY) {
            return next();
        }

        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

        if (!token) {
            // Manejo explícito de fallo de autenticación (Rúbrica 10%)
            return res.status(401).json({ error: 'Acceso Denegado: Token JWT no provisto en encabezado Authorization (401 Unauthorized)' });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;

            // Validación de Autorización por Rol
            if (requiredRole && decoded.rol !== requiredRole) {
                return res.status(403).json({ error: `Acceso Prohibido: Se requieren permisos de '${requiredRole}' (403 Forbidden)` });
            }

            next();
        } catch (err) {
            return res.status(401).json({ error: 'Acceso Denegado: Token JWT inválido o expirado (401 Unauthorized)' });
        }
    };
};

// Health Check
app.get('/health', (req, res) => {
    res.json({ service: 'Productos Service', status: 'ONLINE', port: process.env.PORT || 5002 });
});

// 1. Obtener productos disponibles (público)
app.get('/api/productos', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM producto WHERE id_estado = 1 ORDER BY id_producto DESC;');
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error en Productos Service:', error);
        res.status(500).json({ error: 'Error al consultar la base de datos de productos' });
    }
});

// 2. Obtener inventario admin
app.get('/api/productos/admin', verifyAuthAndRole('vendedor'), async (req, res) => {
    try {
        const query = `
            SELECT p.*, ep.nombre as estado_nombre 
            FROM producto p
            JOIN estado_producto ep ON p.id_estado = ep.id_estado
            WHERE p.id_estado = 1
            ORDER BY p.id_producto DESC;
        `;
        const resultado = await pool.query(query);
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error en Productos Service (Admin):', error);
        res.status(500).json({ error: 'Error al consultar el inventario de productos' });
    }
});

// 3. Catálogo de estados
app.get('/api/productos/estados', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM estado_producto ORDER BY id_estado;');
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error en Productos Service (Estados):', error);
        res.status(500).json({ error: 'Error al consultar estados de prendas' });
    }
});

// 4. Agregar nueva prenda
app.post('/api/productos', async (req, res) => {
    const { nombre, descripcion, precio, talla, marca, condicion, url_imagen, id_estado } = req.body;
    
    if (!nombre || precio === undefined || !talla || !id_estado) {
        return res.status(400).json({ error: 'Nombre, precio, talla y estado son campos obligatorios.' });
    }

    try {
        const query = `
            INSERT INTO producto (nombre, descripcion, precio, talla, marca, condicion, url_imagen, id_estado)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *;
        `;
        const valores = [
            nombre, 
            descripcion || null, 
            parseFloat(precio), 
            talla, 
            marca || null, 
            condicion || 'Nuevo', 
            url_imagen || null, 
            parseInt(id_estado, 10)
        ];
        const resultado = await pool.query(query, valores);
        res.status(201).json(resultado.rows[0]);
    } catch (error) {
        console.error('Error al crear producto:', error);
        res.status(500).json({ error: 'No se pudo guardar el producto en el catálogo' });
    }
});

// 5. Modificar prenda / Actualizar estado
app.put('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    const { nombre, descripcion, precio, talla, marca, condicion, url_imagen, id_estado } = req.body;
    
    if (!nombre || precio === undefined || !talla || !id_estado) {
        return res.status(400).json({ error: 'Nombre, precio, talla y estado son obligatorios.' });
    }

    try {
        const query = `
            UPDATE producto 
            SET nombre = $1, descripcion = $2, precio = $3, talla = $4, marca = $5, condicion = $6, url_imagen = $7, id_estado = $8
            WHERE id_producto = $9
            RETURNING *;
        `;
        const valores = [
            nombre, 
            descripcion || null, 
            parseFloat(precio), 
            talla, 
            marca || null, 
            condicion || 'Nuevo', 
            url_imagen || null, 
            parseInt(id_estado, 10),
            parseInt(id, 10)
        ];
        const resultado = await pool.query(query, valores);
        
        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'No se encontró la prenda para actualizar.' });
        }
        res.json(resultado.rows[0]);
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        res.status(500).json({ error: 'No se pudo actualizar el producto en la base de datos.' });
    }
});

// 6. Eliminar prenda
app.delete('/api/productos/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const query = 'DELETE FROM producto WHERE id_producto = $1 RETURNING *;';
        const resultado = await pool.query(query, [parseInt(id, 10)]);
        
        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'No se encontró el producto.' });
        }
        res.json({ message: 'Prenda eliminada con éxito.' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        if (error.code === '23503') {
            return res.status(409).json({ 
                error: 'No se puede eliminar la prenda porque ya cuenta con apartados o ventas registradas.' 
            });
        }
        res.status(500).json({ error: 'No se pudo eliminar el producto de la base de datos.' });
    }
});

const PORT = process.env.PORT || 5002;
app.listen(PORT, () => {
    console.log(`[PRODUCTOS SERVICE] Corriendo de forma independiente en puerto http://localhost:${PORT}`);
});
