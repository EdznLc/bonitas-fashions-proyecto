import { useState } from 'react';

export default function Register({ API_URL, onRegisterSuccess, onNavigateToLogin }) {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido_p: '',
    apellido_m: '',
    correo: '',
    password: '',
    telefono: '',
    rol: 'cliente' // default
  });
  const [error, setError] = useState('');
  const [exito, setExito] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setExito('');

    const { nombre, correo, password, rol } = formData;
    if (!nombre || !correo || !password || !rol) {
      setError('Por favor, completa los campos obligatorios (*).');
      return;
    }

    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await res.json();
      if (res.ok) {
        setExito('¡Registro exitoso! Ya puedes iniciar sesión.');
        setTimeout(() => {
          onRegisterSuccess();
        }, 1500);
      } else {
        setError(data.error || 'Ocurrió un error al registrar tu cuenta.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión con el servidor.');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="auth-card-container">
      <div className="auth-card">
        <h2 className="auth-title">Crear Cuenta</h2>
        <p className="auth-subtitle">Regístrate para apartar prendas exclusivas</p>

        {error && <div className="auth-error-alert">{error}</div>}
        {exito && <div className="auth-success-alert">{exito}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label className="auth-label">Nombre *</label>
            <input
              type="text"
              name="nombre"
              value={formData.nombre}
              onChange={handleChange}
              placeholder="Tu nombre"
              className="auth-input"
              required
            />
          </div>

          <div className="auth-form-row">
            <div className="auth-input-group">
              <label className="auth-label">Primer Apellido</label>
              <input
                type="text"
                name="apellido_p"
                value={formData.apellido_p}
                onChange={handleChange}
                placeholder="Apellido Paterno"
                className="auth-input"
              />
            </div>
            <div className="auth-input-group">
              <label className="auth-label">Segundo Apellido</label>
              <input
                type="text"
                name="apellido_m"
                value={formData.apellido_m}
                onChange={handleChange}
                placeholder="Apellido Materno"
                className="auth-input"
              />
            </div>
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Correo Electrónico *</label>
            <input
              type="email"
              name="correo"
              value={formData.correo}
              onChange={handleChange}
              placeholder="ejemplo@correo.com"
              className="auth-input"
              required
            />
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Contraseña *</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Mínimo 6 caracteres"
              className="auth-input"
              required
            />
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Teléfono de Contacto</label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="10 dígitos"
              className="auth-input"
            />
          </div>



          <button type="submit" disabled={cargando} className="btn-auth-submit">
            {cargando ? 'Creando cuenta...' : 'Registrarse'}
          </button>
        </form>

        <div className="auth-footer">
          ¿Ya tienes una cuenta?{' '}
          <button onClick={onNavigateToLogin} className="btn-auth-toggle">
            Inicia sesión aquí
          </button>
        </div>
      </div>
    </div>
  );
}
