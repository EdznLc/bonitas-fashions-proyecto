import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());

// Middleware de Autenticación y Autorización JWT
const verifyAuthAndRole = (requiredRole = null) => {
    return (req, res, next) => {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.split(' ')[1] : null;

        if (!token) {
            return res.status(401).json({ error: 'Acceso Denegado: Token JWT no provisto en encabezado Authorization (401 Unauthorized)' });
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = decoded;

            if (requiredRole && decoded.rol !== requiredRole) {
                return res.status(403).json({ error: `Acceso Prohibido: Se requieren permisos de '${requiredRole}' (403 Forbidden)` });
            }

            next();
        } catch (err) {
            return res.status(401).json({ error: 'Acceso Denegado: Token JWT inválido o expirado (401 Unauthorized)' });
        }
    };
};

// Tarea automática de des-apartado automático (limpieza cada petición / intervalo)
const cleanupExpiredApartados = async () => {
    try {
        await pool.query(`
            UPDATE producto 
            SET id_estado = 1 
            WHERE id_producto IN (
                SELECT id_producto 
                FROM apartado 
                WHERE estatus = 'Activo' AND (fecha_limite < NOW() OR fecha_apartado + interval '14 days' < NOW())
            );
        `);
        await pool.query(`
            UPDATE apartado 
            SET estatus = 'Expirado' 
            WHERE estatus = 'Activo' AND (fecha_limite < NOW() OR fecha_apartado + interval '14 days' < NOW());
        `);
    } catch (e) {
        console.error('[APARTADOS SERVICE] Error en middleware de limpieza de expirados:', e);
    }
};

app.use(async (req, res, next) => {
    await cleanupExpiredApartados();
    next();
});

// Health Check
app.get('/health', (req, res) => {
    res.json({ service: 'Apartados & Ventas Service', status: 'ONLINE', port: process.env.PORT || 5003 });
});

// 1. Obtener métodos de pago
app.get('/api/apartados/metodos-pago', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM metodo_pago ORDER BY id_metodo_pago;');
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener métodos de pago:', error);
        res.status(500).json({ error: 'No se pudieron consultar los métodos de pago.' });
    }
});

// 2. Obtener tipos de entrega
app.get('/api/apartados/tipos-entrega', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM tipo_entrega ORDER BY id_tipo_entrega;');
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener tipos de entrega:', error);
        res.status(500).json({ error: 'No se pudieron consultar los tipos de entrega.' });
    }
});

// 3. Crear nuevo apartado
app.post('/api/apartados', async (req, res) => {
    const { id_usuario, id_producto, fecha_limite, id_metodo_pago, id_tipo_entrega } = req.body;

    if (!id_usuario || !id_producto || !fecha_limite) {
        return res.status(400).json({ error: 'ID de usuario, ID de producto y fecha límite son obligatorios.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const prodCheck = await client.query('SELECT id_estado FROM producto WHERE id_producto = $1', [id_producto]);
        if (prodCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'No se encontró el producto a apartar.' });
        }
        
        if (prodCheck.rows[0].id_estado !== 1) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'La prenda seleccionada ya no está disponible para apartados.' });
        }

        const queryApartado = `
            INSERT INTO apartado (id_usuario, id_producto, fecha_limite, id_metodo_pago, id_tipo_entrega, estatus)
            VALUES ($1, $2, $3, $4, $5, 'Activo')
            RETURNING *;
        `;
        const resApartado = await client.query(queryApartado, [
            id_usuario, 
            id_producto, 
            new Date(fecha_limite),
            id_metodo_pago ? parseInt(id_metodo_pago, 10) : null,
            id_tipo_entrega ? parseInt(id_tipo_entrega, 10) : null
        ]);

        // Cambiar estado a 2 (Apartado)
        await client.query('UPDATE producto SET id_estado = 2 WHERE id_producto = $1', [id_producto]);

        await client.query('COMMIT');
        res.status(201).json(resApartado.rows[0]);
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al realizar apartado:', error);
        res.status(500).json({ error: 'No se pudo registrar el apartado de la prenda.' });
    } finally {
        client.release();
    }
});

// 4. Consultar apartados del usuario
app.get('/api/apartados/usuario/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;
    try {
        const query = `
            SELECT 
                a.*, 
                p.nombre, 
                p.descripcion, 
                p.precio, 
                p.talla, 
                p.marca, 
                p.url_imagen,
                mp.nombre AS metodo_pago_nombre,
                te.nombre AS tipo_entrega_nombre
            FROM apartado a
            JOIN producto p ON a.id_producto = p.id_producto
            LEFT JOIN metodo_pago mp ON a.id_metodo_pago = mp.id_metodo_pago
            LEFT JOIN tipo_entrega te ON a.id_tipo_entrega = te.id_tipo_entrega
            WHERE a.id_usuario = $1
            ORDER BY a.id_apartado DESC;
        `;
        const resultado = await pool.query(query, [parseInt(id_usuario, 10)]);
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener apartados del usuario:', error);
        res.status(500).json({ error: 'No se pudieron obtener los apartados del usuario.' });
    }
});

// 5. Consultar todos los apartados (Admin)
app.get('/api/apartados/admin', verifyAuthAndRole('vendedor'), async (req, res) => {
    try {
        const query = `
            SELECT a.*, p.nombre as producto_nombre, p.precio, p.talla, u.nombre as usuario_nombre, u.correo, u.telefono
            FROM apartado a
            JOIN producto p ON a.id_producto = p.id_producto
            JOIN usuario u ON a.id_usuario = u.id_usuario
            ORDER BY a.id_apartado DESC;
        `;
        const resultado = await pool.query(query);
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener todos los apartados:', error);
        res.status(500).json({ error: 'No se pudieron consultar los apartados.' });
    }
});

// 6. Consultar todas las ventas (Admin)
app.get('/api/apartados/ventas/admin', verifyAuthAndRole('vendedor'), async (req, res) => {
    try {
        const query = `
            SELECT v.*, u.nombre as usuario_nombre, u.correo, u.telefono,
                   mp.nombre as metodo_pago_nombre, te.nombre as tipo_entrega_nombre,
                   json_build_array(
                       json_build_object(
                           'id_producto', p.id_producto,
                           'nombre', p.nombre,
                           'precio_final', v.total_final,
                           'talla', p.talla,
                           'marca', p.marca,
                           'url_imagen', p.url_imagen
                       )
                   ) as productos
            FROM venta v
            JOIN usuario u ON v.id_usuario = u.id_usuario
            JOIN metodo_pago mp ON v.id_metodo_pago = mp.id_metodo_pago
            JOIN tipo_entrega te ON v.id_tipo_entrega = te.id_tipo_entrega
            JOIN producto p ON v.id_producto = p.id_producto
            ORDER BY v.id_venta DESC;
        `;
        const resultado = await pool.query(query);
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener ventas:', error);
        res.status(500).json({ error: 'No se pudieron obtener las ventas registradas.' });
    }
});

// 7. Liberar / Cancelar apartado activo
app.delete('/api/apartados/:id', async (req, res) => {
    const { id } = req.params;
    const { id_producto } = req.query;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const resApartado = await client.query('SELECT * FROM apartado WHERE id_apartado = $1', [parseInt(id, 10)]);
        if (resApartado.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'No se encontró el apartado a procesar.' });
        }
        const apartado = resApartado.rows[0];

        if (apartado.estatus !== 'Activo') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Este apartado ya ha sido procesado o finalizado previamente.' });
        }

        await client.query("UPDATE apartado SET estatus = 'Expirado' WHERE id_apartado = $1", [parseInt(id, 10)]);

        const targetProdId = id_producto ? parseInt(id_producto, 10) : apartado.id_producto;
        await client.query('UPDATE producto SET id_estado = 1 WHERE id_producto = $1', [targetProdId]);

        await client.query('COMMIT');
        res.json({ message: 'Apartado cancelado y prenda liberada para venta con éxito.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al procesar apartado:', error);
        res.status(500).json({ error: 'No se pudo procesar el apartado.' });
    } finally {
        client.release();
    }
});

// 8. Completar compra a partir de apartado
app.post('/api/apartados/:id/completar', async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const resApartado = await client.query('SELECT * FROM apartado WHERE id_apartado = $1', [parseInt(id, 10)]);
        if (resApartado.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'No se encontró el apartado especificado.' });
        }
        const apartado = resApartado.rows[0];

        if (apartado.estatus === 'Completado') {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Este apartado ya ha sido completado como venta previamente.' });
        }

        const resProducto = await client.query('SELECT * FROM producto WHERE id_producto = $1', [apartado.id_producto]);
        if (resProducto.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'No se encontró el producto asociado a este apartado.' });
        }
        const producto = resProducto.rows[0];

        if (producto.id_estado === 3) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'La prenda ya ha sido vendida previamente.' });
        }

        let metodoPagoId = apartado.id_metodo_pago;
        if (!metodoPagoId) {
            const defMetodo = await client.query('SELECT id_metodo_pago FROM metodo_pago LIMIT 1');
            if (defMetodo.rows.length > 0) {
                metodoPagoId = defMetodo.rows[0].id_metodo_pago;
            } else {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'No hay métodos de pago configurados en el sistema.' });
            }
        }

        let tipoEntregaId = apartado.id_tipo_entrega;
        if (!tipoEntregaId) {
            const defEntrega = await client.query('SELECT id_tipo_entrega FROM tipo_entrega LIMIT 1');
            if (defEntrega.rows.length > 0) {
                tipoEntregaId = defEntrega.rows[0].id_tipo_entrega;
            } else {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'No hay tipos de entrega configurados en el sistema.' });
            }
        }

        const queryVenta = `
            INSERT INTO venta (id_usuario, id_metodo_pago, id_tipo_entrega, detalles_entrega, total_final, id_producto)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id_venta;
        `;
        const resVenta = await client.query(queryVenta, [
            apartado.id_usuario,
            metodoPagoId,
            tipoEntregaId,
            `Completado desde apartado #${id}`,
            producto.precio,
            apartado.id_producto
        ]);
        const id_venta = resVenta.rows[0].id_venta;

        await client.query('UPDATE producto SET id_estado = 3 WHERE id_producto = $1', [apartado.id_producto]);
        await client.query("UPDATE apartado SET estatus = 'Completado' WHERE id_apartado = $1", [parseInt(id, 10)]);

        await client.query('COMMIT');
        res.json({ message: 'Compra completada con éxito. Registrada en la tabla de venta.', id_venta });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al completar compra desde apartado:', error);
        res.status(500).json({ error: 'No se pudo registrar la venta.' });
    } finally {
        client.release();
    }
});

const PORT = process.env.PORT || 5003;
app.listen(PORT, () => {
    console.log(`[APARTADOS SERVICE] Corriendo de forma independiente en puerto http://localhost:${PORT}`);
});
