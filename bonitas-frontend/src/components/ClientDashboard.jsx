import { useState, useEffect } from 'react';

export default function ClientDashboard({ API_URL, user }) {
  const [apartados, setApartados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  
  // Métodos de pago registrados por el usuario localmente
  const [misTarjetas, setMisTarjetas] = useState(() => {
    return JSON.parse(localStorage.getItem(`tarjetas_${user.id_usuario}`) || '[]');
  });

  // Formulario tarjeta
  const [nuevaTarjeta, setNuevaTarjeta] = useState({
    alias: '',
    numero: '',
    titular: '',
    tipo: 'Crédito'
  });
  const [showTarjetaForm, setShowTarjetaForm] = useState(false);

  const cargarApartados = async () => {
    try {
      const res = await fetch(`${API_URL}/api/apartados/usuario/${user.id_usuario}`);
      if (res.ok) {
        const data = await res.json();
        setApartados(data);
      } else {
        setError('Error al obtener tus apartados.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarApartados();
  }, []);

  const handleAgregarTarjeta = (e) => {
    e.preventDefault();
    if (!nuevaTarjeta.alias || !nuevaTarjeta.numero || !nuevaTarjeta.titular) {
      alert('Por favor, completa todos los campos de la tarjeta.');
      return;
    }

    // Mask card number
    const numEnmascarado = nuevaTarjeta.numero.replace(/\s?/g, '');
    if (numEnmascarado.length < 15 || numEnmascarado.length > 16) {
      alert('Número de tarjeta no válido. Debe tener 15 o 16 dígitos.');
      return;
    }
    const mask = `•••• •••• •••• ${numEnmascarado.slice(-4)}`;
    
    const tarjetaGuardar = {
      id: Date.now(),
      alias: nuevaTarjeta.alias,
      numero: mask,
      titular: nuevaTarjeta.titular.toUpperCase(),
      tipo: nuevaTarjeta.tipo
    };

    const actualizadas = [...misTarjetas, tarjetaGuardar];
    setMisTarjetas(actualizadas);
    localStorage.setItem(`tarjetas_${user.id_usuario}`, JSON.stringify(actualizadas));
    setNuevaTarjeta({ alias: '', numero: '', titular: '', tipo: 'Crédito' });
    setShowTarjetaForm(false);
    alert('¡Método de pago registrado con éxito en tu cartera digital!');
  };

  const handleEliminarTarjeta = (id) => {
    const filtradas = misTarjetas.filter(t => t.id !== id);
    setMisTarjetas(filtradas);
    localStorage.setItem(`tarjetas_${user.id_usuario}`, JSON.stringify(filtradas));
  };

  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Panel de Cliente</h2>
      <p className="dashboard-subtitle">Administra tus prendas apartadas y métodos de pago.</p>

      <div className="dashboard-grid">
        
        {/* COLUMNA 1: APARTADOS */}
        <div className="dashboard-column">
          <h3 className="section-subtitle">Mis Prendas Apartadas</h3>
          {cargando && <div className="dashboard-loading">Cargando apartados...</div>}
          {error && <div className="dashboard-error">{error}</div>}
          
          {!cargando && !error && apartados.length === 0 && (
            <div className="dashboard-empty-card">
              No tienes prendas apartadas en este momento. ¡Visita el catálogo para apartar alguna!
            </div>
          )}

          <div className="apartados-list">
            {apartados.map(a => {
              const limite = new Date(a.fecha_limite).toLocaleDateString('es-MX', {
                year: 'numeric', month: 'long', day: 'numeric'
              });
              
              return (
                <div key={a.id_apartado} className="apartado-card">
                  <div className="apartado-card-image-box">
                    <img
                      src={a.url_imagen || 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=150&q=80'}
                      alt={a.nombre}
                      className="apartado-card-img"
                    />
                  </div>
                  <div className="apartado-card-info">
                    <h4 className="apartado-card-title">{a.nombre}</h4>
                    <p className="apartado-card-meta">Talla: {a.talla} | Marca: {a.marca || 'N/A'}</p>
                    <p className="apartado-card-price">Precio: ${parseFloat(a.precio).toFixed(2)}</p>
                    <div className="apartado-card-status-row">
                      <span className="status-badge-active">{a.estatus}</span>
                      <span className="limite-date">Límite: {limite}</span>
                    </div>
                    <div style={{ marginTop: '12px' }}>
                      <a
                        href={`https://wa.me/521234567890?text=Hola,%20quiero%20coordinar%20el%20pago%20de%20mi%20prenda%20apartada%20"${encodeURIComponent(a.nombre)}"%20con%20ID%20de%20apartado%20${a.id_apartado}.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-whatsapp-contact"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          backgroundColor: '#25d366',
                          color: '#ffffff',
                          padding: '6px 12px',
                          borderRadius: '6px',
                          textDecoration: 'none',
                          fontSize: '11px',
                          fontWeight: '700',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}
                      >
                        💬 Coordinar pago por WhatsApp
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* COLUMNA 2: MÉTODOS DE PAGO */}
        <div className="dashboard-column">
          <div className="section-header-row">
            <h3 className="section-subtitle">Mis Métodos de Pago</h3>
            <button
              onClick={() => setShowTarjetaForm(!showTarjetaForm)}
              className="btn-add-card"
            >
              {showTarjetaForm ? 'Cancelar' : '+ Registrar Tarjeta'}
            </button>
          </div>

          {showTarjetaForm && (
            <form onSubmit={handleAgregarTarjeta} className="card-registration-form">
              <div className="auth-input-group">
                <label className="auth-label">Alias del Método (Ej: Mi Tarjeta Visa) *</label>
                <input
                  type="text"
                  value={nuevaTarjeta.alias}
                  onChange={(e) => setNuevaTarjeta(prev => ({ ...prev, alias: e.target.value }))}
                  placeholder="Visa Principal, Nómina, etc."
                  className="auth-input"
                  required
                />
              </div>

              <div className="auth-input-group">
                <label className="auth-label">Titular de la Tarjeta *</label>
                <input
                  type="text"
                  value={nuevaTarjeta.titular}
                  onChange={(e) => setNuevaTarjeta(prev => ({ ...prev, titular: e.target.value }))}
                  placeholder="NOMBRE COMPLETO EN LA TARJETA"
                  className="auth-input"
                  required
                />
              </div>

              <div className="auth-form-row">
                <div className="auth-input-group">
                  <label className="auth-label">Número de Tarjeta *</label>
                  <input
                    type="text"
                    maxLength="16"
                    value={nuevaTarjeta.numero}
                    onChange={(e) => setNuevaTarjeta(prev => ({ ...prev, numero: e.target.value.replace(/\D/g, '') }))}
                    placeholder="16 dígitos de la tarjeta"
                    className="auth-input"
                    required
                  />
                </div>

                <div className="auth-input-group">
                  <label className="auth-label">Tipo *</label>
                  <select
                    value={nuevaTarjeta.tipo}
                    onChange={(e) => setNuevaTarjeta(prev => ({ ...prev, tipo: e.target.value }))}
                    className="auth-select"
                    required
                  >
                    <option value="Crédito">Crédito</option>
                    <option value="Débito">Débito</option>
                  </select>
                </div>
              </div>

              <button type="submit" className="btn-save-card">
                Guardar Tarjeta
              </button>
            </form>
          )}

          {misTarjetas.length === 0 ? (
            <div className="dashboard-empty-card">
              No tienes tarjetas de pago registradas. Puedes registrar tarjetas aquí para agilizar tus compras en línea.
            </div>
          ) : (
            <div className="cards-list">
              {misTarjetas.map(t => (
                <div key={t.id} className="payment-card-ui">
                  <div className="payment-card-chip"></div>
                  <div className="payment-card-info-row">
                    <span className="payment-card-alias">{t.alias}</span>
                    <span className="payment-card-type">{t.tipo}</span>
                  </div>
                  <div className="payment-card-number">{t.numero}</div>
                  <div className="payment-card-footer">
                    <span className="payment-card-holder">{t.titular}</span>
                    <button
                      onClick={() => handleEliminarTarjeta(t.id)}
                      className="btn-delete-card"
                      title="Eliminar Tarjeta"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
