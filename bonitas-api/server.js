import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import modular routers
import authRoutes from './src/routes/authRoutes.js';
import productRoutes from './src/routes/productRoutes.js';
import apartadoRoutes from './src/routes/apartadoRoutes.js';
import recoleccionRoutes from './src/routes/recoleccionRoutes.js';

dotenv.config();

const app = express();

// Global Middlewares
app.use(cors());
app.use(express.json());

// Mount Modular Routes
app.use('/', authRoutes);
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
