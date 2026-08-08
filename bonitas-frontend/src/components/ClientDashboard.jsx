import { useState, useEffect } from 'react';
import { SERVICES_CONFIG } from '../config/servicesConfig';

export default function ClientDashboard({ API_URL, user }) {
  const APAR_URL = SERVICES_CONFIG.APARTADOS || API_URL;

  const [apartados, setApartados] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');
  

  const cargarApartados = async () => {
    try {
      const res = await fetch(`${APAR_URL}/api/apartados/usuario/${user.id_usuario}`);
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



  return (
    <div className="dashboard-container">
      <h2 className="dashboard-title">Panel de Cliente</h2>
      <p className="dashboard-subtitle">Administra tus prendas apartadas.</p>

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
                      <span className={`status-badge-${a.estatus ? a.estatus.toLowerCase() : 'activo'}`}>
                        {a.estatus === 'Expirado' ? 'Cancelado' : a.estatus}
                      </span>
                      <span className="limite-date">Límite: {limite}</span>
                    </div>
                    {a.estatus === 'Activo' && (
                      <div style={{ marginTop: '12px' }}>
                        {(() => {
                          const mensajeWS = `Hola, quiero coordinar el pago de mi apartado #${a.id_apartado}:\n\n` +
                            `• Prenda: ${a.nombre}\n` +
                            `• Precio: $${parseFloat(a.precio).toFixed(2)}\n` +
                            `• Método de Pago: ${a.metodo_pago_nombre || 'Por acordar'}\n` +
                            `• Tipo de Entrega: ${a.tipo_entrega_nombre || 'Por acordar'}`;
                          const phone = import.meta.env.VITE_WHATSAPP_NUMBER || '5216183647752';
                          const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(mensajeWS)}`;

                          return (
                            <a
                              href={waUrl}
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
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
