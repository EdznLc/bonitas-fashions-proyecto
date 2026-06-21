import { useState, useEffect } from 'react';

function App() {
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
    fetch('http://localhost:5000/api/productos')
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
      const res = await fetch('http://localhost:5000/api/productos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoProd)
      });

      if (res.ok) {
        alert("¡Prenda registrada con éxito!");
        // Resetear el formulario
        setNuevoProd({ categoria: '', descripcion: '', precio: '', url_imagen: '' });
        
        // Volver a consultar los productos para que aparezca el nuevo sin recargar toda la página
        const resProductos = await fetch('http://localhost:5000/api/productos');
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

  if (cargando) return <div style={styles.centrado}>Cargando catálogo de ropa...</div>;
  if (error) return <div style={styles.error}>Error: {error}</div>;

  return (
    <div style={styles.contenedor}>
      <header style={styles.header}>
        <h1>Bonitas Fashions 👗</h1>
        <p>Catálogo de prendas disponibles (Piezas Únicas)</p>
      </header>

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

      {/* Renderizado de la cuadrícula de productos */}
      {productos.length === 0 ? (
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
  );
}

// Estilos agregando la sección del formulario de manera básica pero ordenada
const styles = {
  contenedor: { padding: '20px', fontFamily: 'Arial, sans-serif', maxWidth: '1200px', margin: '0 auto' },
  header: { textAlign: 'center', marginBottom: '30px', borderBottom: '2px solid #eaeaea', paddingBottom: '20px' },
  centrado: { textAlign: 'center', marginTop: '50px', fontSize: '18px' },
  error: { color: 'red', textAlign: 'center', marginTop: '50px', fontWeight: 'bold' },
  sinProductos: { textAlign: 'center', color: '#666' },
  seccionForm: { background: '#f5f5f5', padding: '20px', borderRadius: '8px', border: '1px solid #e0e0e0' },
  formulario: { display: 'flex', flexWrap: 'wrap', gap: '10px' },
  input: { padding: '8px 12px', borderRadius: '4px', border: '1px solid #ccc', fontSize: '14px', flex: '1 1 200px' },
  botonGuardar: { background: '#2e7d32', color: '#fff', border: 'none', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' },
  cuadricula: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '25px' },
  tarjeta: { border: '1px solid #ddd', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column' },
  imagen: { width: '100%', height: '250px', objectFit: 'cover' },
  info: { padding: '15px', display: 'flex', flexDirection: 'column', flexGrow: 1 },
  categoria: { background: '#ff4081', color: '#fff', padding: '3px 8px', borderRadius: '4px', fontSize: '12px', alignSelf: 'flex-start', fontWeight: 'bold', marginBottom: '10px' },
  descripcion: { fontSize: '14px', color: '#333', margin: '0 0 15px 0', flexGrow: 1 },
  precio: { fontSize: '20px', fontWeight: 'bold', color: '#2e7d32', marginBottom: '15px' },
  boton: { background: '#000', color: '#fff', border: 'none', padding: '10px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', transition: 'background 0.2s' }
};

export default App;