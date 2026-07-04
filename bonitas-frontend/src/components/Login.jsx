import { useState } from 'react';

export default function Login({ API_URL, onLoginSuccess, onNavigateToRegister }) {
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!correo || !password) {
      setError('Por favor, ingresa tu correo y contraseña.');
      return;
    }

    setCargando(true);
    try {
      const res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, password })
      });

      const data = await res.json();
      if (res.ok) {
        onLoginSuccess(data);
      } else {
        setError(data.error || 'Correo o contraseña incorrectos.');
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
        <h2 className="auth-title">Iniciar Sesión</h2>
        <p className="auth-subtitle">Accede a tu cuenta de Bonitas Fashions</p>

        {error && <div className="auth-error-alert">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="auth-input-group">
            <label className="auth-label">Correo Electrónico</label>
            <input
              type="email"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              placeholder="ejemplo@correo.com"
              className="auth-input"
              required
            />
          </div>

          <div className="auth-input-group">
            <label className="auth-label">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="auth-input"
              required
            />
          </div>

          <button type="submit" disabled={cargando} className="btn-auth-submit">
            {cargando ? 'Iniciando sesión...' : 'Ingresar'}
          </button>
        </form>

        <div className="auth-footer">
          ¿No tienes una cuenta?{' '}
          <button onClick={onNavigateToRegister} className="btn-auth-toggle">
            Regístrate aquí
          </button>
        </div>
      </div>
    </div>
  );
}
