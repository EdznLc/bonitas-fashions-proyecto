import { useState, useEffect } from 'react';
import CuestionarioLikert from '../../recoleccion de datos/CuestionarioLikert.jsx';
import FichaTecnica from '../../recoleccion de datos/FichaTecnica.jsx';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [vista, setVista] = useState('catalogo'); // 'catalogo' | 'likert' | 'ficha'
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  // Estado para controlar los campos del nuevo producto
  const [nuevoProd, setNuevoProd] = useState({
    categoria: '',
    descripcion: '',
    precio: '',
    url_imagen: ''
  });

  // Efecto para consultar los datos de la API en cuanto carga la página
  useEffect(() => {
    fetch(`${API_BASE_URL}/api/productos`)
      .then((response) => {
        if (!response.ok) {
          throw new Error('No se pudo conectar con la API del servidor');
        }
        return response.json();
      })
      .then((data) => {
        setProductos(data);
        setCargando(false);
      })
      .catch((err) => {
        setError(err.message);
        setCargando(false);
      });
  }, []);

  // Función para enviar el nuevo producto a la API
  const guardarProducto = async (e) => {
    e.preventDefault();

    if (!nuevoProd.categoria || !nuevoProd.descripcion || !nuevoProd.precio) {
      alert("Por favor llena los campos obligatorios (Categoría, Descripción y Precio)");
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/productos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoProd)
      });

      if (res.ok) {
        alert("¡Prenda registrada con éxito!");
        // Resetear el formulario
        setNuevoProd({ categoria: '', descripcion: '', precio: '', url_imagen: '' });
        
        // Volver a consultar los productos para que aparezca el nuevo sin recargar toda la página
        const resProductos = await fetch(`${API_BASE_URL}/api/productos`);
        const data = await resProductos.json();
        setProductos(data);
      } else {
        alert("Hubo un error al guardar el producto en el servidor.");
      }
    } catch (err) {
      console.error(err);
      alert("No se pudo conectar con la API para guardar.");
    }
  };

  return (
    <div style={styles.contenedor}>
      <header style={styles.header}>
        <h1 style={{ margin: '0 0 10px 0', fontFamily: "'Outfit', sans-serif" }}>Bonitas Fashions</h1>
        <p style={{ margin: 0, color: '#666' }}>Sistema de Investigacion de Interfaces y Catalogo de Ropa</p>
      </header>

      {/* Barra de Navegación de Vistas */}
      <nav style={styles.navbar}>
        <button
          onClick={() => setVista('catalogo')}
          style={{
            ...styles.navLink,
            ...(vista === 'catalogo' ? styles.navLinkActive : {})
          }}
        >
          Catálogo de Tienda
        </button>
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
          Ficha Técnica (Investigador)
        </button>
      </nav>

      {/* Vista: Catálogo */}
      {vista === 'catalogo' && (
        <div>
          {/* Formulario simple para agregar productos */}
          <div style={styles.seccionForm}>
            <h2 style={{ marginTop: 0, marginBottom: '15px', fontSize: '18px' }}>Registrar Nueva Prenda</h2>
            <form onSubmit={guardarProducto} style={styles.formulario}>
              <input 
                type="text"
                placeholder="Categoría (ej: Vestido, Blusa)" 
                value={nuevoProd.categoria}
                onChange={e => setNuevoProd({...nuevoProd, categoria: e.target.value})} 
                style={styles.input}
              />
              <input 
                type="text"
                placeholder="Descripción de la prenda" 
                value={nuevoProd.descripcion}
                onChange={e => setNuevoProd({...nuevoProd, descripcion: e.target.value})} 
                style={styles.input}
              />
              <input 
                type="number"
                step="0.01"
                placeholder="Precio ($)" 
                value={nuevoProd.precio}
                onChange={e => setNuevoProd({...nuevoProd, precio: e.target.value})} 
                style={styles.input}
              />
              <input 
                type="text"
                placeholder="URL de la imagen (Opcional)" 
                value={nuevoProd.url_imagen}
                onChange={e => setNuevoProd({...nuevoProd, url_imagen: e.target.value})} 
                style={styles.input}
              />
              <button type="submit" style={styles.botonGuardar}>Guardar en Catálogo</button>
            </form>
          </div>

          <hr style={{ margin: '40px 0', border: '0', borderTop: '1px solid #eaeaea' }} />

          {/* Renderizado de la cuadrícula o estados de carga */}
          {cargando ? (
            <div style={styles.centrado}>Cargando catálogo de ropa...</div>
          ) : error ? (
            <div style={styles.error}>Catálogo no disponible temporalmente. Error: {error}</div>
          ) : productos.length === 0 ? (
            <p style={styles.sinProductos}>No hay prendas disponibles en este momento.</p>
          ) : (
            <div style={styles.cuadricula}>
              {productos.map((producto) => (
                <div key={producto.id_producto} style={styles.tarjeta}>
                  <img 
                    src={producto.url_imagen || 'https://via.placeholder.com/200'} 
                    alt={producto.descripcion} 
                    style={styles.imagen}
                  />
                  <div style={styles.info}>
                    <span style={styles.categoria}>{producto.categoria}</span>
                    <p style={styles.descripcion}>{producto.descripcion}</p>
                    <div style={styles.precio}>${producto.precio}</div>
                    <button style={styles.boton}>Comprar Pieza Única</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Vista: Cuestionario Likert */}
      {vista === 'likert' && <CuestionarioLikert />}

      {/* Vista: Ficha Técnica */}
      {vista === 'ficha' && <FichaTecnica />}
    </div>
  );
}

// Estilos ordenados y adaptados para la navegación
const styles = {
  contenedor: { padding: '20px', fontFamily: "'Outfit', 'Inter', sans-serif", maxWidth: '1200px', margin: '0 auto', color: '#1e293b' },
  header: { textAlign: 'center', marginBottom: '25px', borderBottom: '2px solid #cbd5e1', paddingBottom: '20px' },
  navbar: { display: 'flex', justifyContent: 'center', gap: '15px', marginBottom: '30px', borderBottom: '1px solid #cbd5e1', paddingBottom: '15px' },
  navLink: { padding: '10px 20px', borderRadius: '8px', border: '1.5px solid #cbd5e1', backgroundColor: '#faf9f6', color: '#1e293b', fontSize: '14px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.2s' },
  navLinkActive: { backgroundColor: '#115e59', color: '#faf9f6', borderColor: '#115e59', boxShadow: '0 4px 12px rgba(17, 94, 89, 0.15)' },
  centrado: { textAlign: 'center', marginTop: '50px', fontSize: '18px' },
  error: { color: '#dc2626', textAlign: 'center', marginTop: '30px', fontWeight: 'bold' },
  sinProductos: { textAlign: 'center', color: '#1e293b' },
  seccionForm: { background: '#faf9f6', padding: '20px', borderRadius: '8px', border: '1.5px solid #e7e5e4' },
  formulario: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  input: { padding: '8px 12px', borderRadius: '4px', border: '1.5px solid #cbd5e1', fontSize: '14px', flex: '1 1 200px', backgroundColor: '#ffffff', color: '#1e293b' },
  botonGuardar: { background: '#115e59', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  cuadricula: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '25px' },
  tarjeta: { border: '1px solid #e7e5e4', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', backgroundColor: '#ffffff' },
  imagen: { width: '100%', height: '250px', objectFit: 'cover' },
  info: { padding: '15px', display: 'flex', flexDirection: 'column', flexGrow: 1 },
  categoria: { background: '#c2410c', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', alignSelf: 'flex-start', fontWeight: 'bold', marginBottom: '10px' },
  descripcion: { fontSize: '14px', color: '#1e293b', margin: '0 0 15px 0', flexGrow: 1 },
  precio: { fontSize: '20px', fontWeight: 'bold', color: '#115e59', marginBottom: '15px' },
  boton: { background: '#1e293b', color: '#faf9f6', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }
};

export default App;