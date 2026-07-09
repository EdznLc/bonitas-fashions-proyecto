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
  const [aceptaPolitica, setAceptaPolitica] = useState(false);

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

    if (!aceptaPolitica) {
      setError('Debes aceptar la política de privacidad para registrarte.');
      return;
    }

    const { nombre, correo, password, rol, apellido_p, telefono } = formData;
    if (!nombre || !correo || !password || !rol || !apellido_p || !telefono) {
      setError('Por favor, completa los campos obligatorios (*).');
      return;
    }

    // 1. Validar Nombre
    const cleanNombre = nombre.trim();
    if (cleanNombre.length < 2 || cleanNombre.length > 50) {
      setError('El nombre debe tener entre 2 y 50 caracteres.');
      return;
    }
    const lettersRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
    if (!lettersRegex.test(cleanNombre)) {
      setError('El nombre solo puede contener letras y espacios.');
      return;
    }

    // 2. Validar Primer Apellido (obligatorio)
    const cleanApP = apellido_p.trim();
    if (cleanApP.length < 2 || cleanApP.length > 50) {
      setError('El primer apellido debe tener entre 2 y 50 caracteres.');
      return;
    }
    if (!lettersRegex.test(cleanApP)) {
      setError('El primer apellido solo puede contener letras y espacios.');
      return;
    }

    // 3. Validar Segundo Apellido (opcional)
    if (formData.apellido_m && formData.apellido_m.trim() !== '') {
      const cleanApM = formData.apellido_m.trim();
      if (cleanApM.length < 2 || cleanApM.length > 50) {
        setError('El segundo apellido debe tener entre 2 y 50 caracteres.');
        return;
      }
      if (!lettersRegex.test(cleanApM)) {
        setError('El segundo apellido solo puede contener letras y espacios.');
        return;
      }
    }

    // 4. Validar Contraseña (longitud mínima)
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    // 5. Validar Teléfono (obligatorio, numérico de exactamente 10 dígitos)
    const cleanPhone = telefono.trim();
    const phoneRegex = /^\d+$/;
    if (!phoneRegex.test(cleanPhone)) {
      setError('El teléfono solo puede contener números (dígitos).');
      return;
    }
    if (cleanPhone.length !== 10) {
      setError('El teléfono debe tener exactamente 10 dígitos.');
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
              <label className="auth-label">Primer Apellido *</label>
              <input
                type="text"
                name="apellido_p"
                value={formData.apellido_p}
                onChange={handleChange}
                placeholder="Apellido Paterno"
                className="auth-input"
                required
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
            <label className="auth-label">Teléfono de Contacto *</label>
            <input
              type="tel"
              name="telefono"
              value={formData.telefono}
              onChange={handleChange}
              placeholder="10 dígitos"
              className="auth-input"
              required
            />
          </div>

          <div className="auth-input-group checkbox-group" style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '15px', marginBottom: '20px' }}>
            <input
              type="checkbox"
              id="politica_privacidad"
              checked={aceptaPolitica}
              onChange={(e) => setAceptaPolitica(e.target.checked)}
              style={{ marginTop: '4px', width: 'auto', cursor: 'pointer' }}
              required
            />
            <label htmlFor="politica_privacidad" className="auth-label" style={{ fontSize: '12px', fontWeight: '500', lineHeight: '1.4', cursor: 'pointer' }}>
              Acepto la <strong style={{ textDecoration: 'underline', cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); alert("POLÍTICA DE PRIVACIDAD:\nEn Bonitas Fashions, protegemos tus datos personales. La información recopilada (nombre, correo y teléfono) se utiliza exclusivamente para la gestión de apartados, compras y contacto directo por WhatsApp. No compartimos tu información con terceros y garantizamos el uso responsable bajo estándares éticos de confidencialidad."); }}>política de privacidad y el uso responsable de mis datos personales</strong> para la gestión de apartados. *
            </label>
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
