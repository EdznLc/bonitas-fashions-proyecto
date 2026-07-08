import express from 'express';
import { pool } from '../db/db.js';

const router = express.Router();

// 1. Obtener productos disponibles (para clientes/catálogo público)
router.get('/', async (req, res) => {
    try {
        // id_estado = 1 significa 'Disponible'
        const resultado = await pool.query('SELECT * FROM producto WHERE id_estado = 1 ORDER BY id_producto DESC;');
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener catálogo:', error);
        res.status(500).json({ error: 'Error al consultar la base de datos de productos' });
    }
});

// 2. Obtener todos los productos con su estado (para vendedor/inventario)
router.get('/admin', async (req, res) => {
    try {
        const query = `
            SELECT p.*, ep.nombre as estado_nombre 
            FROM producto p
            JOIN estado_producto ep ON p.id_estado = ep.id_estado
            ORDER BY p.id_producto DESC;
        `;
        const resultado = await pool.query(query);
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener inventario admin:', error);
        res.status(500).json({ error: 'Error al consultar el inventario de productos' });
    }
});

// 3. Obtener catálogo de estados de productos
router.get('/estados', async (req, res) => {
    try {
        const resultado = await pool.query('SELECT * FROM estado_producto ORDER BY id_estado;');
        res.json(resultado.rows);
    } catch (error) {
        console.error('Error al obtener estados de producto:', error);
        res.status(500).json({ error: 'Error al consultar estados de prendas' });
    }
});

// 4. Agregar nueva prenda (Vendedor)
router.post('/', async (req, res) => {
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

// 5. Modificar una prenda (Vendedor)
router.put('/:id', async (req, res) => {
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

// 6. Eliminar una prenda (Vendedor)
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const idInt = parseInt(id, 10);
        const query = 'DELETE FROM producto WHERE id_producto = $1 RETURNING *;';
        const resultado = await pool.query(query, [idInt]);
        
        if (resultado.rows.length === 0) {
            return res.status(404).json({ error: 'No se encontró el producto.' });
        }
        res.json({ message: 'Prenda eliminada con éxito.' });
    } catch (error) {
        console.error('Error al eliminar producto:', error);
        if (error.code === '23503') { // Violación de llave foránea en Postgres
            return res.status(409).json({ 
                error: 'No se puede eliminar la prenda porque ya cuenta con apartados o ventas registradas. Te sugerimos cambiar su estado a "Apartado" o "Vendido" en su lugar.' 
            });
        }
        res.status(500).json({ error: 'No se pudo eliminar el producto de la base de datos.' });
    }
});

export default router;
