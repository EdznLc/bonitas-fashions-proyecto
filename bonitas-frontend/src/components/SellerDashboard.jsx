import { useState, useEffect } from 'react';

export default function SellerDashboard({ API_URL }) {
  const [productos, setProductos] = useState([]);
  const [apartados, setApartados] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cargandoProd, setCargandoProd] = useState(true);
  const [cargandoApartados, setCargandoApartados] = useState(true);
  const [errorProd, setErrorProd] = useState('');
  const [errorApartados, setErrorApartados] = useState('');

  // Formulario de Producto (para agregar y editar)
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null); // null = agregando, number = editando
  const [formProducto, setFormProducto] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    talla: 'M',
    marca: '',
    condicion: 'Nuevo',
    url_imagen: '',
    id_estado: '1' // Disponible
  });

  const cargarProductos = async () => {
    try {
      const res = await fetch(`${API_URL}/api/productos/admin`);
      if (res.ok) {
        const data = await res.json();
        setProductos(data);
      } else {
        setErrorProd('Error al cargar la lista de prendas.');
      }
    } catch (err) {
      console.error(err);
      setErrorProd('Error al conectar con la base de datos.');
    } finally {
      setCargandoProd(false);
    }
  };

  const cargarApartados = async () => {
    try {
      const res = await fetch(`${API_URL}/api/apartados/admin`);
      if (res.ok) {
        const data = await res.json();
        setApartados(data);
      } else {
        setErrorApartados('Error al cargar la lista de apartados.');
      }
    } catch (err) {
      console.error(err);
      setErrorApartados('Error al conectar con el servidor.');
    } finally {
      setCargandoApartados(false);
    }
  };

  const cargarEstados = async () => {
    try {
      const res = await fetch(`${API_URL}/api/productos/estados`);
      if (res.ok) {
        const data = await res.json();
        setEstados(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEstados = () => {}; // fallback placeholder if needed
  
  const handleQuitarApartado = async (idApartado, idProducto) => {
    if (!window.confirm('¿Estás seguro de que deseas cancelar y eliminar este apartado? La prenda volverá a estar disponible de inmediato en la tienda.')) {
      return;
    }
    
    try {
      const res = await fetch(`${API_URL}/api/apartados/${idApartado}?id_producto=${idProducto}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        alert('Apartado eliminado y prenda liberada con éxito.');
        cargarApartados();
        cargarProductos();
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || 'No se pudo eliminar el apartado.'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error al intentar eliminar el apartado.');
    }
  };

  useEffect(() => {
    cargarProductos();
    cargarApartados();
    cargarEstados();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormProducto(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAgregarNuevoClick = () => {
    setEditandoId(null);
    setFormProducto({
      nombre: '',
      descripcion: '',
      precio: '',
      talla: 'M',
      marca: '',
      condicion: 'Nuevo',
      url_imagen: '',
      id_estado: '1'
    });
    setMostrarForm(true);
  };

  const handleEditarClick = (producto) => {
    setEditandoId(producto.id_producto);
    setFormProducto({
      nombre: producto.nombre,
      descripcion: producto.descripcion || '',
      precio: producto.precio,
      talla: producto.talla,
      marca: producto.marca || '',
      condicion: producto.condicion,
      url_imagen: producto.url_imagen || '',
      id_estado: producto.id_estado.toString()
    });
    setMostrarForm(true);
  };

  const handleGuardarProducto = async (e) => {
    e.preventDefault();
    if (!formProducto.nombre || formProducto.precio === '' || !formProducto.talla) {
      alert('Nombre, precio y talla son obligatorios.');
      return;
    }

    try {
      const url = editandoId 
        ? `${API_URL}/api/productos/${editandoId}` 
        : `${API_URL}/api/productos`;
      const method = editandoId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formProducto)
      });

      if (res.ok) {
        alert(editandoId ? 'Prenda actualizada con éxito.' : 'Prenda agregada al catálogo.');
        setMostrarForm(false);
        cargarProductos();
      } else {
        const data = await res.json();
        alert(`Error al guardar: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de red al intentar guardar la prenda.');
    }
  };

  const handleEliminarClick = async (id) => {
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta prenda del catálogo?')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/productos/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        alert('Prenda eliminada con éxito.');
        cargarProductos();
      } else {
        const data = await res.json();
        alert(data.error || 'No se pudo eliminar la prenda.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión al eliminar.');
    }
  };

  return (
    <div className="seller-dashboard-container">
      <h2 className="dashboard-title">Panel de Vendedor</h2>
      <p className="dashboard-subtitle">Administración de inventario, catálogo y control de apartados de clientes.</p>

      {/* SECCIÓN 1: CRUD PRODUCTOS */}
      <div className="seller-section">
        <div className="section-header-row">
          <h3 className="section-subtitle">Catálogo e Inventario de Prendas</h3>
          <button onClick={handleAgregarNuevoClick} className="btn-add-product">
            + Agregar Nueva Prenda
          </button>
        </div>

        {mostrarForm && (
          <div className="product-form-card">
            <h4>{editandoId ? 'Editar Prenda' : 'Agregar Nueva Prenda'}</h4>
            <form onSubmit={handleGuardarProducto} className="seller-form">
              <div className="auth-form-row">
                <div className="auth-input-group">
                  <label className="auth-label">Nombre de la Prenda *</label>
                  <input
                    type="text"
                    name="nombre"
                    value={formProducto.nombre}
                    onChange={handleInputChange}
                    placeholder="Ej. Vestido Vintage Rojo"
                    className="auth-input"
                    required
                  />
                </div>
                <div className="auth-input-group">
                  <label className="auth-label">Marca</label>
                  <input
                    type="text"
                    name="marca"
                    value={formProducto.marca}
                    onChange={handleInputChange}
                    placeholder="Ej. Zara, Gucci, etc."
                    className="auth-input"
                  />
                </div>
              </div>

              <div className="auth-form-row">
                <div className="auth-input-group">
                  <label className="auth-label">Precio ($) *</label>
                  <input
                    type="number"
                    step="0.01"
                    name="precio"
                    value={formProducto.precio}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    className="auth-input"
                    required
                  />
                </div>
                <div className="auth-input-group">
                  <label className="auth-label">Talla *</label>
                  <select
                    name="talla"
                    value={formProducto.talla}
                    onChange={handleInputChange}
                    className="auth-select"
                    required
                  >
                    <option value="XS">XS</option>
                    <option value="S">S</option>
                    <option value="M">M</option>
                    <option value="L">L</option>
                    <option value="XL">XL</option>
                  </select>
                </div>
              </div>

              <div className="auth-form-row">
                <div className="auth-input-group">
                  <label className="auth-label">Condición *</label>
                  <select
                    name="condicion"
                    value={formProducto.condicion}
                    onChange={handleInputChange}
                    className="auth-select"
                    required
                  >
                    <option value="Nuevo">Nuevo</option>
                    <option value="Usado">Usado</option>
                  </select>
                </div>
                <div className="auth-input-group">
                  <label className="auth-label">Estado de Venta *</label>
                  <select
                    name="id_estado"
                    value={formProducto.id_estado}
                    onChange={handleInputChange}
                    className="auth-select"
                    required
                  >
                    {estados.map(e => (
                      <option key={e.id_estado} value={e.id_estado}>
                        {e.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Enlace URL de Imagen</label>
                <input
                  type="url"
                  name="url_imagen"
                  value={formProducto.url_imagen}
                  onChange={handleInputChange}
                  placeholder="https://enlace.com/imagen.jpg"
                  className="auth-input"
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Descripción</label>
                <textarea
                  name="descripcion"
                  value={formProducto.descripcion}
                  onChange={handleInputChange}
                  placeholder="Detalles sobre textil, corte, etc."
                  className="auth-input text-area"
                />
              </div>

              <div className="form-actions-row">
                <button type="button" onClick={() => setMostrarForm(false)} className="btn-modal-cancel">
                  Cancelar
                </button>
                <button type="submit" className="btn-modal-submit">
                  {editandoId ? 'Guardar Cambios' : 'Registrar Prenda'}
                </button>
              </div>
            </form>
          </div>
        )}

        {cargandoProd && <div className="seller-loading">Cargando inventario...</div>}
        {errorProd && <div className="seller-error">{errorProd}</div>}

        {!cargandoProd && !errorProd && productos.length === 0 && (
          <div className="seller-empty-card">
            No tienes prendas en inventario en este momento. ¡Agrega tu primer prenda!
          </div>
        )}

        {!cargandoProd && !errorProd && productos.length > 0 && (
          <div className="table-responsive">
            <table className="seller-table">
              <thead>
                <tr>
                  <th>Imagen</th>
                  <th>ID</th>
                  <th>Prenda</th>
                  <th>Marca</th>
                  <th>Talla</th>
                  <th>Condición</th>
                  <th>Precio</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {productos.map(p => (
                  <tr key={p.id_producto}>
                    <td>
                      <img
                        src={p.url_imagen || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=100&q=80'}
                        alt={p.nombre}
                        className="table-thumbnail"
                      />
                    </td>
                    <td>{p.id_producto}</td>
                    <td><strong className="table-item-name">{p.nombre}</strong></td>
                    <td>{p.marca || '-'}</td>
                    <td>{p.talla}</td>
                    <td>{p.condicion}</td>
                    <td>${parseFloat(p.precio).toFixed(2)}</td>
                    <td>
                      <span className={`table-badge-${p.id_estado}`}>
                        {p.estado_nombre}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button onClick={() => handleEditarClick(p)} className="btn-table-edit">
                          Editar
                        </button>
                        <button onClick={() => handleEliminarClick(p.id_producto)} className="btn-table-delete">
                          Eliminar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="seller-section-divider"></div>

      {/* SECCIÓN 2: CONTROL DE APARTADOS */}
      <div className="seller-section">
        <h3 className="section-subtitle">Monitoreo de Apartados de Clientes</h3>
        {cargandoApartados && <div className="seller-loading">Cargando apartados...</div>}
        {errorApartados && <div className="seller-error">{errorApartados}</div>}

        {!cargandoApartados && !errorApartados && apartados.length === 0 && (
          <div className="seller-empty-card">
            No hay apartados o reservaciones registradas por el momento.
          </div>
        )}

        {!cargandoApartados && !errorApartados && apartados.length > 0 && (
          <div className="table-responsive">
            <table className="seller-table">
              <thead>
                <tr>
                  <th>Apartado</th>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th>Prenda</th>
                  <th>Talla</th>
                  <th>Monto</th>
                  <th>Fecha Registro</th>
                  <th>Fecha Límite</th>
                  <th>Estatus</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {apartados.map(a => {
                  const reg = new Date(a.fecha_apartado).toLocaleDateString('es-MX', {
                    day: '2-digit', month: '2-digit', year: 'numeric'
                  });
                  const lim = new Date(a.fecha_limite).toLocaleDateString('es-MX', {
                    day: '2-digit', month: '2-digit', year: 'numeric'
                  });
                  
                  return (
                    <tr key={a.id_apartado}>
                      <td>{a.id_apartado}</td>
                      <td><strong>{a.usuario_nombre}</strong></td>
                      <td>
                        <div className="table-contact-cell">
                          <span>{a.correo}</span>
                          {a.telefono && <span className="sub-phone">{a.telefono}</span>}
                        </div>
                      </td>
                      <td>{a.producto_nombre}</td>
                      <td>{a.talla}</td>
                      <td>${parseFloat(a.precio).toFixed(2)}</td>
                      <td>{reg}</td>
                      <td>{lim}</td>
                      <td>
                        <span className="status-badge-active">
                          {a.estatus}
                        </span>
                      </td>
                      <td>
                        <button 
                          onClick={() => handleQuitarApartado(a.id_apartado, a.id_producto)} 
                          className="btn-table-delete"
                          title="Eliminar o cancelar este apartado"
                        >
                          Quitar
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
