// Configuración central de las URLs de los 4 Microservicios en Render

const DEFAULT_BASE = import.meta.env.VITE_API_URL || 'https://bonitas-fashions-proyecto.onrender.com';

export const SERVICES_CONFIG = {
  // 1. Autenticación (Puerto 5001 / URL Render 1)
  AUTH: import.meta.env.VITE_AUTH_SERVICE_URL || DEFAULT_BASE,

  // 2. Productos e Inventario (Puerto 5002 / URL Render 2)
  PRODUCTOS: import.meta.env.VITE_PRODUCTOS_SERVICE_URL || DEFAULT_BASE,

  // 3. Apartados y Ventas (Puerto 5003 / URL Render 3)
  APARTADOS: import.meta.env.VITE_APARTADOS_SERVICE_URL || DEFAULT_BASE,

  // 4. Encuestas y Métricas ISO (Puerto 5004 / URL Render 4)
  ENCUESTAS: import.meta.env.VITE_ENCUESTAS_SERVICE_URL || DEFAULT_BASE,
};
