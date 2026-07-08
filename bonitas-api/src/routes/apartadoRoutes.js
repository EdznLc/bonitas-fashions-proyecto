import express from 'express';
import { pool } from '../db/db.js';

const router = express.Router();

// 1. Obtener todos los métodos de pago
router.get('/metodos-pago', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM metodo_pago ORDER BY id_metodo_pago;');
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener métodos de pago:', error);
        res.status(500).json({ error: 'No se pudieron consultar los métodos de pago.' });
    }
});

// 2. Obtener todos los tipos de entrega
router.get('/tipos-entrega', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM tipo_entrega ORDER BY id_tipo_entrega;');
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener tipos de entrega:', error);
        res.status(500).json({ error: 'No se pudieron consultar los tipos de entrega.' });
    }
});

// 3. Crear un nuevo apartado (Transaccional)
router.post('/', async (req, res) => {
    const { id_usuario, id_producto, fecha_limite, id_metodo_pago, id_tipo_entrega } = req.body;

    if (!id_usuario || !id_producto || !fecha_limite) {
        return res.status(400).json({ error: 'ID de usuario, ID de producto y fecha límite son obligatorios.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verificar que el producto esté disponible
        const prodCheck = await client.query('SELECT id_estado FROM producto WHERE id_producto = $1', [id_producto]);
        if (prodCheck.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'No se encontró el producto a apartar.' });
        }
        
        if (prodCheck.rows[0].id_estado !== 1) { // 1 = Disponible
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'La prenda seleccionada ya no está disponible para apartados.' });
        }

        // 1. Insertar en la tabla 'apartado'
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

        // 2. Actualizar el estado del producto a 2 (Apartado)
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

// 4. Consultar apartados activos de un cliente específico
router.get('/usuario/:id_usuario', async (req, res) => {
    const { id_usuario } = req.params;
    try {
        const query = `
            SELECT a.*, p.nombre, p.descripcion, p.precio, p.talla, p.marca, p.url_imagen
            FROM apartado a
            JOIN producto p ON a.id_producto = p.id_producto
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

// 5. Consultar todos los apartados registrados (Administrador/Vendedor)
router.get('/admin', async (req, res) => {
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

// 6. Registrar una venta formal (Checkout final)
router.post('/checkout', async (req, res) => {
    const { id_usuario, id_metodo_pago, id_tipo_entrega, detalles_entrega, total_final, productos } = req.body;

    if (!id_usuario || !id_metodo_pago || !id_tipo_entrega || !total_final || !productos || productos.length === 0) {
        return res.status(400).json({ error: 'Faltan datos obligatorios para completar el registro de la venta.' });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Insertar venta principal
        const queryVenta = `
            INSERT INTO venta (id_usuario, id_metodo_pago, id_tipo_entrega, detalles_entrega, total_final)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id_venta;
        `;
        const resVenta = await client.query(queryVenta, [
            id_usuario,
            id_metodo_pago,
            id_tipo_entrega,
            detalles_entrega || null,
            parseFloat(total_final)
        ]);
        const id_venta = resVenta.rows[0].id_venta;

        // 2. Insertar productos de la venta & Actualizar estados de productos
        for (const item of productos) {
            // Insertar en tabla de rompimiento
            const queryVentaProd = `
                INSERT INTO venta_producto (id_venta, id_producto, precio_final)
                VALUES ($1, $2, $3);
            `;
            await client.query(queryVentaProd, [id_venta, item.id_producto, parseFloat(item.precio)]);

            // Actualizar producto a estado 3 (Vendido)
            await client.query('UPDATE producto SET id_estado = 3 WHERE id_producto = $1', [item.id_producto]);

            // Desactivar apartado previo si existía
            await client.query("UPDATE apartado SET estatus = 'Completado' WHERE id_producto = $1 AND id_usuario = $2", [item.id_producto, id_usuario]);
        }

        await client.query('COMMIT');
        res.status(201).json({ id_venta, message: 'Venta registrada con éxito.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al registrar venta:', error);
        res.status(500).json({ error: 'No se pudo registrar la venta.' });
    } finally {
        client.release();
    }
});

// 7. Eliminar/Quitar apartado (Administrador/Vendedor)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    const { id_producto } = req.query;

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Eliminar el apartado
        const deleteQuery = 'DELETE FROM apartado WHERE id_apartado = $1 RETURNING *;';
        const deleteRes = await client.query(deleteQuery, [parseInt(id, 10)]);

        if (deleteRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'No se encontró el apartado a eliminar.' });
        }

        // 2. Liberar el producto (cambiar su estado a 1 - Disponible)
        const targetProdId = id_producto ? parseInt(id_producto, 10) : deleteRes.rows[0].id_producto;
        await client.query('UPDATE producto SET id_estado = 1 WHERE id_producto = $1', [targetProdId]);

        await client.query('COMMIT');
        res.json({ message: 'Apartado eliminado y prenda liberada con éxito.' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error al eliminar apartado:', error);
        res.status(500).json({ error: 'No se pudo eliminar el apartado.' });
    } finally {
        client.release();
    }
});

export default router;
