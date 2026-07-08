import { useState } from 'react';
import CuestionarioLikert from '../../recoleccion de datos/CuestionarioLikert.jsx';
import FichaTecnica from '../../recoleccion de datos/FichaTecnica.jsx';

// Import commercial components
import Login from './components/Login.jsx';
import Register from './components/Register.jsx';
import Catalog from './components/Catalog.jsx';
import ProductDetail from './components/ProductDetail.jsx';
import ClientDashboard from './components/ClientDashboard.jsx';
import SellerDashboard from './components/SellerDashboard.jsx';

// Set central API URL pointing to the Render production server or local fallback
const API_URL = import.meta.env.VITE_API_URL || 'https://bonitas-fashions-proyecto.onrender.com';

export default function App() {
  // 1. Detect if we are in data collection mode (?mode=likert o ?mode=ficha)
  const queryParams = new URLSearchParams(window.location.search);
  const mode = queryParams.get('mode');

  if (mode === 'likert') {
    return <CuestionarioLikert />;
  }
  if (mode === 'ficha') {
    return <FichaTecnica />;
  }

  // 2. Interface version selector state ('A': Minimalist, 'B': Standard Commercial, 'C': Basic)
  const [interfaceVersion, setInterfaceVersion] = useState(() => {
    return queryParams.get('interface')?.toUpperCase() || 'B';
  });

  // 3. Active User session management
  const [user, setUser] = useState(() => {
    return JSON.parse(localStorage.getItem('user') || 'null');
  });

  // Navigation states: 'catalog' | 'login' | 'register' | 'client-dashboard' | 'seller-dashboard' | 'product-detail'
  const [view, setView] = useState('catalog');
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('user');
    setUser(null);
    setView('catalog');
    alert('Has cerrado sesión correctamente.');
  };

  return (
    <div className={`app-container interface-${interfaceVersion.toLowerCase()}`}>
      <header className="app-header">
        <div className="header-brand-container" onClick={() => { setView('catalog'); setSelectedProduct(null); }}>
          <div className="header-title-row">
            <h1 className="app-title">Bonitas Fashions</h1>
            
            {/* Quick switcher for usablity evaluation testing */}
            <div className="interface-selector-debug">
              <span className="debug-label">Diseño:</span>
              <button 
                onClick={() => setInterfaceVersion('A')} 
                className={`btn-debug-toggle ${interfaceVersion === 'A' ? 'active' : ''}`}
                title="Interfaz A: Minimalista (Gestalt)"
              >
                A
              </button>
              <button 
                onClick={() => setInterfaceVersion('B')} 
                className={`btn-debug-toggle ${interfaceVersion === 'B' ? 'active' : ''}`}
                title="Interfaz B: Estándar Comercial"
              >
                B
              </button>
              <button 
                onClick={() => setInterfaceVersion('C')} 
                className={`btn-debug-toggle ${interfaceVersion === 'C' ? 'active' : ''}`}
                title="Interfaz C: Básica"
              >
                C
              </button>
            </div>
          </div>
          <p className="app-subtitle">Tienda de Moda Online - Diseños Exclusivos</p>
        </div>

        {/* User context information & Navigation buttons */}
        <div className="header-user-nav">
          {user ? (
            <div className="user-welcome-row">
              <span className="welcome-text">
                Hola, <strong>{user.nombre}</strong> ({user.rol === 'vendedor' ? 'Vendedor' : 'Cliente'})
              </span>
              
              <div className="nav-action-links">
                {user.rol === 'cliente' && (
                  <button
                    onClick={() => setView('client-dashboard')}
                    className={`btn-header-nav ${view === 'client-dashboard' ? 'active' : ''}`}
                  >
                    Mis Apartados
                  </button>
                )}
                {user.rol === 'vendedor' && (
                  <button
                    onClick={() => setView('seller-dashboard')}
                    className={`btn-header-nav ${view === 'seller-dashboard' ? 'active' : ''}`}
                  >
                    Inventario & Control
                  </button>
                )}
                <button onClick={handleLogout} className="btn-header-logout">
                  Salir
                </button>
              </div>
            </div>
          ) : (
            <div className="nav-action-links">
              <button
                onClick={() => setView('catalog')}
                className={`btn-header-nav ${view === 'catalog' ? 'active' : ''}`}
              >
                Catálogo
              </button>
              <button
                onClick={() => setView('login')}
                className={`btn-header-nav ${view === 'login' ? 'active' : ''}`}
              >
                Iniciar Sesión
              </button>
              <button
                onClick={() => setView('register')}
                className="btn-header-register"
              >
                Crear Cuenta
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Dynamic Views rendering */}
      <main className="app-main-content">
        {view === 'catalog' && (
          <Catalog
            API_URL={API_URL}
            onSelectProduct={(prod) => {
              setSelectedProduct(prod);
              setView('product-detail');
            }}
          />
        )}

        {view === 'login' && (
          <Login
            API_URL={API_URL}
            onLoginSuccess={(userData) => {
              setUser(userData);
              localStorage.setItem('user', JSON.stringify(userData));
              setView(userData.rol === 'vendedor' ? 'seller-dashboard' : 'catalog');
            }}
            onNavigateToRegister={() => setView('register')}
          />
        )}

        {view === 'register' && (
          <Register
            API_URL={API_URL}
            onRegisterSuccess={() => setView('login')}
            onNavigateToLogin={() => setView('login')}
          />
        )}

        {view === 'product-detail' && (
          <ProductDetail
            API_URL={API_URL}
            producto={selectedProduct}
            user={user}
            onBack={() => {
              setSelectedProduct(null);
              setView('catalog');
            }}
            onNavigateToLogin={() => setView('login')}
            onReservationSuccess={() => {
              setSelectedProduct(null);
              setView(user.rol === 'cliente' ? 'client-dashboard' : 'catalog');
            }}
          />
        )}

        {view === 'client-dashboard' && (
          <ClientDashboard
            API_URL={API_URL}
            user={user}
          />
        )}

        {view === 'seller-dashboard' && (
          <SellerDashboard
            API_URL={API_URL}
          />
        )}
      </main>
    </div>
  );
}