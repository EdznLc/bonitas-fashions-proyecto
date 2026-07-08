import { useState, useEffect } from 'react';

export default function Catalog({ API_URL, onSelectProduct }) {
  const [productos, setProductos] = useState([]);
  const [filtroTalla, setFiltroTalla] = useState('');
  const [filtroCondicion, setFiltroCondicion] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  const cargarProductos = async () => {
    try {
      const res = await fetch(`${API_URL}/productos`);
      if (res.ok) {
        const data = await res.json();
        setProductos(data);
      } else {
        setError('No se pudo cargar el catálogo de prendas.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con la base de datos.');
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarProductos();
  }, []);

  // Filtrado de productos
  const productosFiltrados = productos.filter(p => {
    const coincideTalla = filtroTalla === '' || p.talla === filtroTalla;
    const coincideCondicion = filtroCondicion === '' || p.condicion === filtroCondicion;
    const coincideBusqueda = busqueda === '' || 
      p.nombre.toLowerCase().includes(busqueda.toLowerCase()) || 
      (p.marca && p.marca.toLowerCase().includes(busqueda.toLowerCase()));
    return coincideTalla && coincideCondicion && coincideBusqueda;
  });

  return (
    <div className="catalog-container">
      <div className="catalog-filters-bar">
        <input
          type="text"
          placeholder="Buscar por nombre o marca..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
          className="filter-search-input"
        />

        <div className="filter-selects">
          <div className="select-wrapper">
            <select
              value={filtroTalla}
              onChange={(e) => setFiltroTalla(e.target.value)}
              className="filter-select"
            >
              <option value="">Todas las Tallas</option>
              <option value="XS">XS</option>
              <option value="S">S</option>
              <option value="M">M</option>
              <option value="L">L</option>
              <option value="XL">XL</option>
            </select>
          </div>

          <div className="select-wrapper">
            <select
              value={filtroCondicion}
              onChange={(e) => setFiltroCondicion(e.target.value)}
              className="filter-select"
            >
              <option value="">Todas las Condiciones</option>
              <option value="Nuevo">Nuevo</option>
              <option value="Usado">Usado</option>
            </select>
          </div>
        </div>
      </div>

      {cargando && <div className="catalog-loading">Cargando catálogo de ropa...</div>}
      {error && <div className="catalog-error">{error}</div>}

      {!cargando && !error && productosFiltrados.length === 0 && (
        <div className="catalog-empty">
          No se encontraron prendas disponibles con los filtros seleccionados.
        </div>
      )}

      <div className="catalog-grid">
        {productosFiltrados.map((producto) => (
          <div
            key={producto.id_producto}
            className="product-card"
            onClick={() => onSelectProduct(producto)}
          >
            <div className="product-image-container">
              {producto.url_imagen ? (
                <img
                  src={producto.url_imagen}
                  alt={producto.nombre}
                  className="product-card-image"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&q=80';
                  }}
                />
              ) : (
                <div className="product-image-fallback">Sin Imagen</div>
              )}
              <span className="product-card-tag">{producto.condicion}</span>
            </div>
            
            <div className="product-card-info">
              <h3 className="product-card-title">{producto.nombre}</h3>
              {producto.marca && <p className="product-card-brand">{producto.marca}</p>}
              

              <div className="product-card-details-row">
                <span className="product-card-size">Talla: {producto.talla}</span>
                <span className="product-card-price">${parseFloat(producto.precio).toFixed(2)}</span>
              </div>
              
              <button className="btn-product-card-view">
                Ver Detalles
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
