export const DEFAULT_API_URL = 'https://bonitas-fashions-proyecto.onrender.com';

// 1. Autenticación de Administrador
export const loginAdmin = async (apiUrl, correo, password) => {
  const cleanUrl = (apiUrl || DEFAULT_API_URL).replace(/\/$/, '');
  const response = await fetch(`${cleanUrl}/api/auth/login`, {
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

// 2. Obtener lista de productos en modo administración
export const fetchProductosAdmin = async (apiUrl) => {
  const cleanUrl = (apiUrl || DEFAULT_API_URL).replace(/\/$/, '');
  const response = await fetch(`${cleanUrl}/api/productos/admin`);
  if (!response.ok) {
    throw new Error('Error al cargar la lista de prendas del inventario.');
  }
  return await response.json();
};

// 3. Obtener apartados activos
export const fetchApartadosAdmin = async (apiUrl) => {
  const cleanUrl = (apiUrl || DEFAULT_API_URL).replace(/\/$/, '');
  const response = await fetch(`${cleanUrl}/api/apartados/admin`);
  if (!response.ok) {
    throw new Error('Error al cargar los apartados activos.');
  }
  return await response.json();
};

// 4. Obtener histórico de ventas
export const fetchVentasAdmin = async (apiUrl) => {
  const cleanUrl = (apiUrl || DEFAULT_API_URL).replace(/\/$/, '');
  const response = await fetch(`${cleanUrl}/api/apartados/ventas/admin`);
  if (!response.ok) {
    throw new Error('Error al cargar el histórico de ventas.');
  }
  return await response.json();
};

// 5. Obtener estados de productos
export const fetchEstados = async (apiUrl) => {
  const cleanUrl = (apiUrl || DEFAULT_API_URL).replace(/\/$/, '');
  const response = await fetch(`${cleanUrl}/api/productos/estados`);
  if (!response.ok) {
    return [
      { id_estado: 1, nombre_estado: 'Disponible' },
      { id_estado: 2, nombre_estado: 'Apartado' },
      { id_estado: 3, nombre_estado: 'Vendido' },
    ];
  }
  return await response.json();
};

// 6. Guardar producto (Crear o Editar)
export const saveProducto = async (apiUrl, idProducto, productoData) => {
  const cleanUrl = (apiUrl || DEFAULT_API_URL).replace(/\/$/, '');
  const isEdit = !!idProducto;
  const url = isEdit ? `${cleanUrl}/api/productos/${idProducto}` : `${cleanUrl}/api/productos`;
  const method = isEdit ? 'PUT' : 'POST';

  const response = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productoData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al guardar la prenda.');
  }
  return data;
};

// 7. Eliminar producto
export const deleteProducto = async (apiUrl, idProducto) => {
  const cleanUrl = (apiUrl || DEFAULT_API_URL).replace(/\/$/, '');
  const response = await fetch(`${cleanUrl}/api/productos/${idProducto}`, {
    method: 'DELETE',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al eliminar la prenda.');
  }
  return data;
};

// 8. Completar apartado (marcar como compra concretada)
export const completarApartado = async (apiUrl, idApartado) => {
  const cleanUrl = (apiUrl || DEFAULT_API_URL).replace(/\/$/, '');
  const response = await fetch(`${cleanUrl}/api/apartados/${idApartado}/completar`, {
    method: 'POST',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al completar la venta.');
  }
  return data;
};

// 9. Cancelar / Liberar apartado
export const cancelarApartado = async (apiUrl, idApartado, idProducto) => {
  const cleanUrl = (apiUrl || DEFAULT_API_URL).replace(/\/$/, '');
  const response = await fetch(`${cleanUrl}/api/apartados/${idApartado}?id_producto=${idProducto}`, {
    method: 'DELETE',
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Error al liberar el apartado.');
  }
  return data;
};
