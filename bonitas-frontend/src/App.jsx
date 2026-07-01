import { useState } from 'react';
import CuestionarioLikert from '../../recoleccion de datos/CuestionarioLikert.jsx';
import FichaTecnica from '../../recoleccion de datos/FichaTecnica.jsx';

export default function App() {
  const [vista, setVista] = useState('likert'); // 'likert' | 'ficha'

  return (
    <div className="app-container">
      <header className="app-header">
        <h1 className="app-title">
          Bonitas Fashions
        </h1>
        <p className="app-subtitle">
          Tienda de Moda Online - Diseños Exclusivos
        </p>
      </header>

      {/* Barra de Navegación de Vistas */}
      <nav className="app-navbar">
        <button
          onClick={() => setVista('likert')}
          className={`app-nav-link ${vista === 'likert' ? 'active' : ''}`}
        >
          Cuestionario Likert (Usuario)
        </button>
        <button
          onClick={() => setVista('ficha')}
          className={`app-nav-link ${vista === 'ficha' ? 'active' : ''}`}
        >
          Ficha Técnica (Monitoreo de Compra)
        </button>
      </nav>

      {/* Vista: Cuestionario Likert */}
      {vista === 'likert' && <CuestionarioLikert />}

      {/* Vista: Ficha Técnica */}
      {vista === 'ficha' && <FichaTecnica />}
    </div>
  );
}