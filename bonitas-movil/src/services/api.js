// Configuración de URLs de Microservicios Independientes (SOA) para la App Móvil
export const DEFAULT_AUTH_URL = 'https://bonitas-auth-service.onrender.com';
export const DEFAULT_PRODUCTOS_URL = 'https://bonitas-productos-service.onrender.com';
export const DEFAULT_APARTADOS_URL = 'https://bonitas-apartados-service.onrender.com';

// 1. Autenticación de Administrador (Auth Service - Puerto 5001)
export const loginAdmin = async (apiUrl, correo, password) => {
  const baseUrl = apiUrl ? apiUrl.replace(/\/$/, '') : DEFAULT_AUTH_URL;
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ correo, password }),
  });
  
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al iniciar sesión.');
  }

  // Validar obligatoriamente que sea Administrador/Vendedor
  if (data.rol !== 'vendedor' && data.user?.rol !== 'vendedor') {
    const rolUsuario = data.rol || data.user?.rol || 'cliente';
    if (rolUsuario !== 'vendedor') {
      throw new Error('Acceso Restringido. Esta aplicación móvil es exclusivamente para el personal administrador de Bonitas Fashions.');
    }
  }

  return data;
};

// 2. Obtener lista de productos en modo administración (Productos Service - Puerto 5002)
export const fetchProductosAdmin = async (apiUrl, token = null) => {
  const baseUrl = apiUrl ? apiUrl.replace(/\/$/, '') : DEFAULT_PRODUCTOS_URL;
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}/api/productos/admin`, { headers });
  if (!response.ok) {
    throw new Error('Error al cargar la lista de prendas del inventario.');
  }
  return await response.json();
};

// 3. Obtener apartados registrados (Apartados Service - Puerto 5003)
export const fetchApartadosAdmin = async (apiUrl, token = null) => {
  const baseUrl = apiUrl ? apiUrl.replace(/\/$/, '') : DEFAULT_APARTADOS_URL;
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}/api/apartados/admin`, { headers });
  if (!response.ok) {
    throw new Error('Error al cargar los apartados registrados.');
  }
  return await response.json();
};

// 4. Obtener histórico de ventas (Apartados Service - Puerto 5003)
export const fetchVentasAdmin = async (apiUrl, token = null) => {
  const baseUrl = apiUrl ? apiUrl.replace(/\/$/, '') : DEFAULT_APARTADOS_URL;
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}/api/apartados/ventas/admin`, { headers });
  if (!response.ok) {
    throw new Error('Error al cargar el histórico de ventas.');
  }
  return await response.json();
};

// 5. Obtener estados de productos (Productos Service - Puerto 5002)
export const fetchEstados = async (apiUrl) => {
  const baseUrl = apiUrl ? apiUrl.replace(/\/$/, '') : DEFAULT_PRODUCTOS_URL;
  try {
    const response = await fetch(`${baseUrl}/api/productos/estados`);
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.error('Error al conectar con Productos Service:', e);
  }

  return [
    { id_estado: 1, nombre_estado: 'Disponible' },
    { id_estado: 2, nombre_estado: 'Apartado' },
    { id_estado: 3, nombre_estado: 'Vendido' },
  ];
};

// 6. Guardar producto (Productos Service - Puerto 5002)
export const saveProducto = async (apiUrl, idProducto, productoData, token = null) => {
  const baseUrl = apiUrl ? apiUrl.replace(/\/$/, '') : DEFAULT_PRODUCTOS_URL;
  const isEdit = !!idProducto;
  const url = isEdit ? `${baseUrl}/api/productos/${idProducto}` : `${baseUrl}/api/productos`;
  const method = isEdit ? 'PUT' : 'POST';

  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(url, {
    method,
    headers,
    body: JSON.stringify(productoData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al guardar la prenda.');
  }
  return data;
};

// 7. Eliminar producto (Productos Service - Puerto 5002)
export const deleteProducto = async (apiUrl, idProducto, token = null) => {
  const baseUrl = apiUrl ? apiUrl.replace(/\/$/, '') : DEFAULT_PRODUCTOS_URL;
  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${baseUrl}/api/productos/${idProducto}`, {
    method: 'DELETE',
    headers
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al eliminar la prenda.');
  }
  return data;
};

// 8. Completar apartado (Apartados Service - Puerto 5003)
export const completarApartado = async (apiUrl, idApartado) => {
  const baseUrl = apiUrl ? apiUrl.replace(/\/$/, '') : DEFAULT_APARTADOS_URL;
  const response = await fetch(`${baseUrl}/api/apartados/${idApartado}/completar`, {
    method: 'POST',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al completar la venta.');
  }
  return data;
};

// 9. Cancelar / Liberar apartado activo (Apartados Service - Puerto 5003)
export const cancelarApartado = async (apiUrl, idApartado, idProducto) => {
  const baseUrl = apiUrl ? apiUrl.replace(/\/$/, '') : DEFAULT_APARTADOS_URL;
  const response = await fetch(`${baseUrl}/api/apartados/${idApartado}?id_producto=${idProducto}`, {
    method: 'DELETE',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al liberar el apartado.');
  }
  return data;
};
