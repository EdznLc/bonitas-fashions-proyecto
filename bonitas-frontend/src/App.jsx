import { useState } from 'react';
import CuestionarioLikert from '../../recoleccion de datos/CuestionarioLikert.jsx';
import FichaTecnica from '../../recoleccion de datos/FichaTecnica.jsx';

export default function App() {
  const [vista, setVista] = useState('likert'); // 'likert' | 'ficha'

  return (
    <div style={styles.contenedor}>
      <header style={styles.header}>
        <h1 style={{ margin: '0 0 6px 0', fontFamily: "'Outfit', sans-serif", fontSize: '38px', fontWeight: '800', letterSpacing: '-0.02em' }}>
          Bonitas Fashions
        </h1>
        <p style={{ margin: 0, color: '#475569', fontSize: '14px', fontWeight: '500' }}>
          Tienda de Moda Online - Diseños Exclusivos
        </p>
      </header>

      {/* Barra de Navegación de Vistas */}
      <nav style={styles.navbar}>
        <button
          onClick={() => setVista('likert')}
          style={{
            ...styles.navLink,
            ...(vista === 'likert' ? styles.navLinkActive : {})
          }}
        >
          Cuestionario Likert (Usuario)
        </button>
        <button
          onClick={() => setVista('ficha')}
          style={{
            ...styles.navLink,
            ...(vista === 'ficha' ? styles.navLinkActive : {})
          }}
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

// Estilos premium
const styles = {
  contenedor: { 
    padding: '40px', 
    fontFamily: "'Outfit', 'Inter', sans-serif", 
    maxWidth: '1000px', 
    margin: '40px auto', 
    color: '#1e293b',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.06)',
    border: '1px solid #cbd5e1',
    boxSizing: 'border-box'
  },
  header: { textAlign: 'center', marginBottom: '25px', borderBottom: '2px solid #cbd5e1', paddingBottom: '20px' },
  navbar: { display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px', borderBottom: '1px solid #cbd5e1', paddingBottom: '15px' },
  navLink: { padding: '10px 20px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#faf9f6', color: '#1e293b', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  navLinkActive: { backgroundColor: '#115e59', color: '#faf9f6', borderColor: '#115e59', boxShadow: '0 4px 12px rgba(17, 94, 89, 0.15)' }
};