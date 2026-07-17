import { useState, useEffect } from 'react';

export default function SellerDashboard({ API_URL }) {
  const [productos, setProductos] = useState([]);
  const [apartados, setApartados] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [estados, setEstados] = useState([]);
  const [cargandoProd, setCargandoProd] = useState(true);
  const [cargandoApartados, setCargandoApartados] = useState(true);
  const [cargandoVentas, setCargandoVentas] = useState(true);
  const [errorProd, setErrorProd] = useState('');
  const [errorApartados, setErrorApartados] = useState('');
  const [errorVentas, setErrorVentas] = useState('');
  const [activeTab, setActiveTab] = useState('prendas'); // 'prendas', 'apartados', 'ventas'

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

  const cargarVentas = async () => {
    try {
      const res = await fetch(`${API_URL}/api/apartados/ventas/admin`);
      if (res.ok) {
        const data = await res.json();
        setVentas(data);
      } else {
        setErrorVentas('Error al cargar la lista de ventas.');
      }
    } catch (err) {
      console.error(err);
      setErrorVentas('Error al conectar con la base de datos de ventas.');
    } finally {
      setCargandoVentas(false);
    }
  };

  const handleCompletarCompra = async (idApartado) => {
    if (!window.confirm('¿Estás seguro de que deseas marcar este apartado como COMPLETADO y concretar la compra? La prenda pasará a estar Vendida y se registrará formalmente la transacción.')) {
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/apartados/${idApartado}/completar`, {
        method: 'POST'
      });

      if (res.ok) {
        alert('¡Compra completada con éxito! Registrada en la tabla de venta.');
        cargarApartados();
        cargarProductos();
        cargarVentas();
      } else {
        const data = await res.json();
        alert(`Error al completar compra: ${data.error || 'Intenta de nuevo.'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error de red al completar la compra.');
    }
  };

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
        cargarVentas();
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
    cargarVentas();
    cargarEstados();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormProducto(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('La imagen es demasiado pesada. El tamaño máximo permitido es de 2 MB.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormProducto(prev => ({
        ...prev,
        url_imagen: reader.result
      }));
    };
    reader.readAsDataURL(file);
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
    const { nombre, precio, talla, marca, url_imagen, descripcion } = formProducto;
    if (!nombre || precio === '' || !talla || !marca || !marca.trim() || !url_imagen || !url_imagen.trim() || !descripcion || !descripcion.trim()) {
      alert('Por favor completa todos los campos obligatorios: Nombre, Marca, Precio, Talla, Imagen y Descripción.');
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

      {/* Botones de Pestañas */}
      <div className="seller-tabs-container">
        <button 
          className={`seller-tab-btn ${activeTab === 'prendas' ? 'active' : ''}`}
          onClick={() => setActiveTab('prendas')}
        >
          Prendas e Inventario
        </button>
        <button 
          className={`seller-tab-btn ${activeTab === 'apartados' ? 'active' : ''}`}
          onClick={() => setActiveTab('apartados')}
        >
          Apartados y Reservaciones
        </button>
        <button 
          className={`seller-tab-btn ${activeTab === 'ventas' ? 'active' : ''}`}
          onClick={() => setActiveTab('ventas')}
        >
          Historial de Ventas
        </button>
      </div>

      {/* SECCIÓN 1: CRUD PRODUCTOS */}
      {activeTab === 'prendas' && (
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
                    <label className="auth-label">Marca *</label>
                    <input
                      type="text"
                      name="marca"
                      value={formProducto.marca}
                      onChange={handleInputChange}
                      placeholder="Ej. Zara, Gucci, etc."
                      className="auth-input"
                      required
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
                  <label className="auth-label">Imagen de la Prenda *</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {/* Selector de Archivo Local */}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="auth-input"
                      style={{ padding: '6px', cursor: 'pointer' }}
                    />
                    {/* Entrada de URL alternativa */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', opacity: 0.8, whiteSpace: 'nowrap' }}>o URL:</span>
                      <input
                        type="text"
                        name="url_imagen"
                        value={formProducto.url_imagen}
                        onChange={handleInputChange}
                        placeholder="https://enlace.com/imagen.jpg"
                        className="auth-input"
                        style={{ flex: 1 }}
                      />
                    </div>
                  </div>
                  {/* Previsualización del archivo cargado */}
                  {formProducto.url_imagen && (
                    <div style={{ marginTop: '10px', border: '1px solid #cbd5e1', padding: '6px', borderRadius: '4px', maxWidth: '120px', backgroundColor: '#faf9f6' }}>
                      <img
                        src={formProducto.url_imagen}
                        alt="Previsualización"
                        style={{ width: '100%', height: '80px', objectFit: 'contain' }}
                      />
                    </div>
                  )}
                </div>

                <div className="auth-input-group">
                  <label className="auth-label">Descripción *</label>
                  <textarea
                    name="descripcion"
                    value={formProducto.descripcion}
                    onChange={handleInputChange}
                    placeholder="Detalles sobre textil, corte, etc."
                    className="auth-input text-area"
                    required
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
      )}

      {/* SECCIÓN 2: CONTROL DE APARTADOS */}
      {activeTab === 'apartados' && (
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
                    <th>Correo Electrónico</th>
                    <th>Teléfono</th>
                    <th>Prenda</th>
                    <th>Talla</th>
                    <th>Monto</th>
                    <th>Fecha Registro</th>
                    <th>Fecha Límite</th>
                    <th>Estatus</th>
                    <th>Acciones</th>
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
                        <td>{a.correo}</td>
                        <td>{a.telefono || 'N/A'}</td>
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
                          <div className="table-actions">
                            {a.estatus === 'Activo' && (
                              <button 
                                onClick={() => handleCompletarCompra(a.id_apartado)} 
                                className="btn-table-edit"
                                title="Registrar compra final y cerrar apartado"
                              >
                                Completar Compra
                              </button>
                            )}
                            <button 
                              onClick={() => handleQuitarApartado(a.id_apartado, a.id_producto)} 
                              className="btn-table-delete"
                              title="Eliminar o cancelar este apartado"
                            >
                              Quitar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* SECCIÓN 3: HISTORIAL DE VENTAS */}
      {activeTab === 'ventas' && (
        <div className="seller-section">
          <h3 className="section-subtitle">Historial de Ventas Concretadas</h3>
          {cargandoVentas && <div className="seller-loading">Cargando ventas...</div>}
          {errorVentas && <div className="seller-error">{errorVentas}</div>}

          {!cargandoVentas && !errorVentas && ventas.length === 0 && (
            <div className="seller-empty-card">
              No hay ventas registradas por el momento.
            </div>
          )}

          {!cargandoVentas && !errorVentas && ventas.length > 0 && (
            <div className="table-responsive">
              <table className="seller-table">
                <thead>
                  <tr>
                    <th>Venta</th>
                    <th>Cliente</th>
                    <th>Contacto</th>
                    <th>Método Pago</th>
                    <th>Tipo Entrega</th>
                    <th>Detalles</th>
                    <th>Prendas Adquiridas</th>
                    <th>Fecha Venta</th>
                    <th>Total Cobrado</th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.map(v => {
                    const fecha = new Date(v.fecha_venta).toLocaleDateString('es-MX', {
                      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
                    });
                    return (
                      <tr key={v.id_venta}>
                        <td>#{v.id_venta}</td>
                        <td><strong>{v.usuario_nombre}</strong></td>
                        <td>
                          <span style={{ fontSize: '11px', display: 'block' }}>{v.correo}</span>
                          <span style={{ fontSize: '11px', opacity: 0.7 }}>{v.telefono || 'Sin tel'}</span>
                        </td>
                        <td>{v.metodo_pago_nombre}</td>
                        <td>{v.tipo_entrega_nombre}</td>
                        <td><span style={{ fontSize: '11px', opacity: 0.7 }}>{v.detalles_entrega || '-'}</span></td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {v.productos && v.productos.map((prod, idx) => (
                              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                                <img 
                                  src={prod.url_imagen || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=50&q=80'} 
                                  alt={prod.nombre} 
                                  style={{ width: '20px', height: '20px', objectFit: 'cover', borderRadius: '2px' }}
                                />
                                <span>{prod.nombre} ({prod.talla}) - ${parseFloat(prod.precio_final).toFixed(2)}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td>{fecha}</td>
                        <td><strong style={{ color: '#115e59', fontSize: '14px' }}>${parseFloat(v.total_final).toFixed(2)}</strong></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
