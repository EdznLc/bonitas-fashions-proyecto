import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './src/db/db.js';

// Import modular routers
import authRoutes from './src/routes/authRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import apartadoRoutes from './src/routes/apartadoRoutes.js';
import recoleccionRoutes from './src/routes/recoleccionRoutes.js';

dotenv.config();

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Automatical cleanup middleware for expired reservations (max 14 days)
app.use(async (req, res, next) => {
    try {
        // 1. Release products from expired apartados back to 'Disponible' (id_estado = 1)
        await pool.query(`
            UPDATE producto 
            SET id_estado = 1 
            WHERE id_producto IN (
                SELECT id_producto 
                FROM apartado 
                WHERE estatus = 'Activo' AND (fecha_limite < NOW() OR fecha_apartado + interval '14 days' < NOW())
            );
        `);
        // 2. Mark those apartados as 'Expirado'
        await pool.query(`
            UPDATE apartado 
            SET estatus = 'Expirado' 
            WHERE estatus = 'Activo' AND (fecha_limite < NOW() OR fecha_apartado + interval '14 days' < NOW());
        `);
    } catch (e) {
        console.error('Error al liberar apartados expirados:', e);
    }
    next();
});

// Mount Modular Routes
app.use('/api/auth', authRoutes);
app.use('/api/productos', productRoutes);
app.use('/api/apartados', apartadoRoutes);
app.use('/api/recoleccion', recoleccionRoutes);

// Root route
app.get('/', (req, res) => {
    res.json({ message: 'Bonitas Fashions Express API is running successfully' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Servidor de la API corriendo en http://localhost:${PORT}`);
});
