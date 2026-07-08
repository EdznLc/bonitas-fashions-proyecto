import { useState, useEffect } from 'react';

export default function ProductDetail({ API_URL, producto, user, onBack, onNavigateToLogin, onReservationSuccess }) {
  const [showReservaModal, setShowReservaModal] = useState(false);
  const [showCompraModal, setShowCompraModal] = useState(false);
  const [cargandoModal, setCargandoModal] = useState(false);
  
  // Catálogos cargados de base de datos
  const [metodosPago, setMetodosPago] = useState([]);
  const [tiposEntrega, setTiposEntrega] = useState([]);
  
  // Formulario Reserva
  const [fechaLimite, setFechaLimite] = useState(() => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 3); // 3 días por defecto
    return defaultDate.toISOString().substring(0, 10);
  });
  
  // Formulario Compra/Checkout
  const [idMetodoPago, setIdMetodoPago] = useState('');
  const [idTipoEntrega, setIdTipoEntrega] = useState('');
  const [detallesEntrega, setDetallesEntrega] = useState('');
  const [errorModal, setErrorModal] = useState('');

  // Cargar métodos y formas de entrega desde la API
  useEffect(() => {
    const cargarCatalogos = async () => {
      try {
        const [resPago, resEntrega] = await Promise.all([
          fetch(`${API_URL}/api/apartados/metodos-pago`),
          fetch(`${API_URL}/api/apartados/tipos-entrega`)
        ]);
        
        if (resPago.ok && resEntrega.ok) {
          const pagos = await resPago.json();
          const entregas = await resEntrega.json();
          setMetodosPago(pagos);
          setTiposEntrega(entregas);
          
          if (pagos.length > 0) setIdMetodoPago(pagos[0].id_metodo_pago.toString());
          if (entregas.length > 0) setIdTipoEntrega(entregas[0].id_tipo_entrega.toString());
        }
      } catch (err) {
        console.error('Error al cargar catálogos:', err);
      }
    };
    
    if (showCompraModal) {
      cargarCatalogos();
    }
  }, [showCompraModal]);

  const handleApartar = async (e) => {
    e.preventDefault();
    setErrorModal('');
    setCargandoModal(true);

    try {
      const res = await fetch(`${API_URL}/api/apartados`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_usuario: user.id_usuario,
          id_producto: producto.id_producto,
          fecha_limite: fechaLimite
        })
      });

      const data = await res.json();
      if (res.ok) {
        alert('¡Prenda apartada con éxito!\n\nRecuerda coordinar el pago directamente con el vendedor por WhatsApp desde tu panel de cliente. Tienes un máximo de 2 semanas, de lo contrario el apartado se cancelará automáticamente.');
        setShowReservaModal(false);
        onReservationSuccess();
      } else {
        setErrorModal(data.error || 'No se pudo realizar el apartado.');
      }
    } catch (err) {
      console.error(err);
      setErrorModal('Error al conectar con el servidor.');
    } finally {
      setCargandoModal(false);
    }
  };

  const handleComprar = async (e) => {
    e.preventDefault();
    setErrorModal('');
    setCargandoModal(true);

    const tipoSel = tiposEntrega.find(t => t.id_tipo_entrega.toString() === idTipoEntrega);
    const costoEnvio = tipoSel ? parseFloat(tipoSel.costo_adicional) : 0;
    const total = parseFloat(producto.precio) + costoEnvio;

    const payload = {
      id_usuario: user.id_usuario,
      id_metodo_pago: parseInt(idMetodoPago, 10),
      id_tipo_entrega: parseInt(idTipoEntrega, 10),
      detalles_entrega: detallesEntrega,
      total_final: total,
      productos: [
        {
          id_producto: producto.id_producto,
          precio: producto.precio
        }
      ]
    };

    try {
      const res = await fetch(`${API_URL}/api/apartados/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (res.ok) {
        alert('¡Compra registrada con éxito! Tu prenda ha sido marcada como Vendida.');
        setShowCompraModal(false);
        onReservationSuccess();
      } else {
        setErrorModal(data.error || 'No se pudo registrar la compra.');
      }
    } catch (err) {
      console.error(err);
      setErrorModal('Error al procesar el pago.');
    } finally {
      setCargandoModal(false);
    }
  };

  const tipoEntregaSeleccionado = tiposEntrega.find(t => t.id_tipo_entrega.toString() === idTipoEntrega);
  const costoAdicional = tipoEntregaSeleccionado ? parseFloat(tipoEntregaSeleccionado.costo_adicional) : 0;
  const totalCompra = parseFloat(producto.precio) + costoAdicional;

  return (
    <div className="product-detail-container">
      <button onClick={onBack} className="btn-back">
        ← Volver al Catálogo
      </button>

      <div className="product-detail-layout">
        <div className="product-detail-image-box">
          {producto.url_imagen ? (
            <img
              src={producto.url_imagen}
              alt={producto.nombre}
              className="product-detail-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=600&q=80';
              }}
            />
          ) : (
            <div className="product-detail-image-fallback">Sin Imagen Disponible</div>
          )}
        </div>

        <div className="product-detail-info-box">
          <span className="product-detail-badge">{producto.condicion}</span>
          <h1 className="product-detail-title">{producto.nombre}</h1>
          {producto.marca && <h3 className="product-detail-brand">Marca: {producto.marca}</h3>}
          
          <div className="product-detail-divider"></div>

          <div className="product-detail-price-row">
            <span className="price-label">Precio Final:</span>
            <span className="price-value">${parseFloat(producto.precio).toFixed(2)}</span>
          </div>

          <div className="product-detail-spec-grid">
            <div className="spec-card">
              <span className="spec-title">Talla</span>
              <span className="spec-value">{producto.talla}</span>
            </div>
            <div className="spec-card">
              <span className="spec-title">Condición</span>
              <span className="spec-value">{producto.condicion}</span>
            </div>
            <div className="spec-card">
              <span className="spec-title">Estado</span>
              <span className="spec-value">Disponible</span>
            </div>
          </div>

          <p className="product-detail-description">
            {producto.descripcion || 'Esta prenda exclusiva de Bonitas Fashions no cuenta con una descripción adicional. El diseño está listo para entrega inmediata y elaborado con la mejor calidad en textiles.'}
          </p>

          <div className="product-detail-actions">
            {!user ? (
              <div className="visitor-action-alert">
                <p>Inicia sesión con tu cuenta de cliente para adquirir o apartar esta prenda.</p>
                <button onClick={onNavigateToLogin} className="btn-login-redirect">
                  Iniciar Sesión / Registrarse
                </button>
              </div>
            ) : user.rol === 'vendedor' ? (
              <div className="visitor-action-alert">
                <p>Como vendedor, no tienes habilitada la opción de apartar o comprar productos.</p>
              </div>
            ) : (
              <div className="client-action-buttons">
                <button onClick={() => setShowCompraModal(true)} className="btn-comprar-now">
                  Comprar Prenda
                </button>
                <button onClick={() => setShowReservaModal(true)} className="btn-apartar-now">
                  Apartar (Abonar / Reservar)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* MODAL 1: RESERVAR/APARTAR */}
      {showReservaModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">Apartar Prenda</h3>
            <p className="modal-subtitle">Establece la fecha límite de pago para resguardar la prenda.</p>
            
            {errorModal && <div className="modal-error">{errorModal}</div>}

            <form onSubmit={handleApartar} className="modal-form">
              <div className="modal-input-group">
                <label className="modal-label">Fecha Límite para Liquidar *</label>
                <input
                  type="date"
                  value={fechaLimite}
                  onChange={(e) => setFechaLimite(e.target.value)}
                  min={new Date().toISOString().substring(0, 10)}
                  max={new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10)}
                  className="modal-input"
                  required
                />
              </div>

              <div className="modal-actions-row">
                <button type="button" onClick={() => setShowReservaModal(false)} className="btn-modal-cancel">
                  Cancelar
                </button>
                <button type="submit" disabled={cargandoModal} className="btn-modal-submit">
                  {cargandoModal ? 'Registrando...' : 'Confirmar Apartado'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: COMPRAR/CHECKOUT */}
      {showCompraModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3 className="modal-title">Completar Compra</h3>
            <p className="modal-subtitle">Registra tu método de pago y detalles de entrega.</p>
            
            {errorModal && <div className="modal-error">{errorModal}</div>}

            <form onSubmit={handleComprar} className="modal-form">
              <div className="modal-input-group">
                <label className="modal-label">Método de Pago *</label>
                <div className="select-wrapper">
                  <select
                    value={idMetodoPago}
                    onChange={(e) => setIdMetodoPago(e.target.value)}
                    className="modal-select"
                    required
                  >
                    {metodosPago.map(m => (
                      <option key={m.id_metodo_pago} value={m.id_metodo_pago}>
                        {m.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-input-group">
                <label className="modal-label">Tipo de Entrega *</label>
                <div className="select-wrapper">
                  <select
                    value={idTipoEntrega}
                    onChange={(e) => setIdTipoEntrega(e.target.value)}
                    className="modal-select"
                    required
                  >
                    {tiposEntrega.map(t => (
                      <option key={t.id_tipo_entrega} value={t.id_tipo_entrega}>
                        {t.nombre} (+${parseFloat(t.costo_adicional).toFixed(2)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="modal-input-group">
                <label className="modal-label">Detalles de la Entrega (Dirección / Sucursal) *</label>
                <input
                  type="text"
                  placeholder="Ej. Av. Hidalgo #123, Col. Centro o Recoge en Sucursal Norte"
                  value={detallesEntrega}
                  onChange={(e) => setDetallesEntrega(e.target.value)}
                  className="modal-input"
                  required
                />
              </div>

              <div className="modal-summary-box">
                <div className="summary-row">
                  <span>Subtotal Prenda:</span>
                  <span>${parseFloat(producto.precio).toFixed(2)}</span>
                </div>
                <div className="summary-row">
                  <span>Costo de Entrega:</span>
                  <span>+${costoAdicional.toFixed(2)}</span>
                </div>
                <div className="summary-row total">
                  <span>Total Final:</span>
                  <span>${totalCompra.toFixed(2)}</span>
                </div>
              </div>

              <div className="modal-actions-row">
                <button type="button" onClick={() => setShowCompraModal(false)} className="btn-modal-cancel">
                  Cancelar
                </button>
                <button type="submit" disabled={cargandoModal} className="btn-modal-submit">
                  {cargandoModal ? 'Registrando Pago...' : 'Confirmar Compra'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
