import { useState, useEffect, useRef } from 'react';

export default function FichaTecnica() {
  // Lista de participantes registrados
  const [participantes, setParticipantes] = useState([]);
  const [participanteId, setParticipanteId] = useState('');
  
  // Estado para registro rápido de participante
  const [nuevoParticipante, setNuevoParticipante] = useState({
    edad: '',
    version_interfaz: 'A'
  });

  // Métricas de Usabilidad (ISO 9241-11:2018)
  const [tiempoSegundos, setTiempoSegundos] = useState('');
  const [tasaExito, setTasaExito] = useState(true); // true = S, false = N
  const [conteoErrores, setConteoErrores] = useState(0);

  // Observaciones cualitativas (3 secciones)
  const [observaciones, setObservaciones] = useState({
    gestos: '',
    dudas: '',
    friccion: ''
  });

  // Estados del Cronómetro en vivo (Eficiencia)
  const [cronometroActivo, setCronometroActivo] = useState(false);
  const [cronometroTiempo, setCronometroTiempo] = useState(0); // en centésimas de segundo
  const timerRef = useRef(null);

  // Estados para UI
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorSubmit, setErrorSubmit] = useState('');
  const [cargandoParticipantes, setCargandoParticipantes] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [consentimiento, setConsentimiento] = useState(false);

  // API base URL
  const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000') + '/api/recoleccion';

  // Cargar participantes
  const cargarParticipantes = async () => {
    setCargandoParticipantes(true);
    try {
      const res = await fetch(`${API_URL}/participantes`);
      if (res.ok) {
        const data = await res.json();
        setParticipantes(data);
      }
    } catch (err) {
      console.error("Error al cargar participantes:", err);
    } finally {
      setCargandoParticipantes(false);
    }
  };

  useEffect(() => {
    cargarParticipantes();
    return () => clearInterval(timerRef.current);
  }, []);

  // Registrar participante rápido
  const registrarParticipante = async (e) => {
    e.preventDefault();
    if (!consentimiento) {
      alert("Debe confirmar que cuenta con el consentimiento informado firmado por el participante.");
      return;
    }
    if (!nuevoParticipante.edad || nuevoParticipante.edad <= 0 || nuevoParticipante.edad > 120) {
      alert("Por favor, ingresa una edad válida.");
      return;
    }
    try {
      const res = await fetch(`${API_URL}/participantes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(nuevoParticipante)
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Participante registrado. ID asignado: U${String(data.id).padStart(3, '0')}`);
        await cargarParticipantes();
        setParticipanteId(data.id.toString());
        setNuevoParticipante({ edad: '', version_interfaz: 'A' });
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Error de conexión al registrar participante.");
    }
  };

  // Controles del Cronómetro
  const iniciarCronometro = () => {
    if (!cronometroActivo) {
      setCronometroActivo(true);
      const startTime = Date.now() - cronometroTiempo * 10;
      timerRef.current = setInterval(() => {
        setCronometroTiempo(Math.floor((Date.now() - startTime) / 10));
      }, 10);
    }
  };

  const pausarCronometro = () => {
    if (cronometroActivo) {
      clearInterval(timerRef.current);
      setCronometroActivo(false);
    }
  };

  const resetearCronometro = () => {
    clearInterval(timerRef.current);
    setCronometroActivo(false);
    setCronometroTiempo(0);
  };

  const aplicarTiempoCronometro = () => {
    const segs = Math.round(cronometroTiempo / 100);
    setTiempoSegundos(segs.toString());
    alert(`Se aplicó el tiempo de {segs} segundos al campo.`);
  };

  // Formateador: mm:ss.d
  const formatearTiempo = (csec) => {
    const totalSegs = csec / 100;
    const mins = Math.floor(totalSegs / 60);
    const segs = Math.floor(totalSegs % 60);
    const decimas = Math.floor((csec % 100) / 10);

    const minsStr = mins.toString().padStart(2, '0');
    const segsStr = segs.toString().padStart(2, '0');
    return `${minsStr}:${segsStr}.${decimas}`;
  };

  // Obtener info del participante seleccionado
  const participanteSeleccionado = participantes.find(p => p.id.toString() === participanteId);

  // Enviar métricas
  const enviarMetricas = async (e) => {
    e.preventDefault();
    setErrorSubmit('');
    setMensajeExito('');

    if (!participanteId) {
      setErrorSubmit("Debes seleccionar un participante.");
      return;
    }
    if (!tiempoSegundos || parseInt(tiempoSegundos, 10) <= 0) {
      setErrorSubmit("El tiempo de resolución debe ser mayor a 0 segundos.");
      return;
    }
    if (conteoErrores < 0) {
      setErrorSubmit("El conteo de errores no puede ser negativo.");
      return;
    }

    setGuardando(true);

    const observacionesConcatenadas = [
      observaciones.gestos ? `Gestos/Expresiones: ${observaciones.gestos.trim()}` : '',
      observaciones.dudas ? `Dudas verbalizadas: ${observaciones.dudas.trim()}` : '',
      observaciones.friccion ? `Puntos de fricción: ${observaciones.friccion.trim()}` : ''
    ].filter(Boolean).join(' | ');

    const payload = {
      participante_id: parseInt(participanteId, 10),
      tiempo_segundos: parseInt(tiempoSegundos, 10),
      tasa_exito: tasaExito,
      conteo_errores: parseInt(conteoErrores, 10),
      observaciones_cualitativas: observacionesConcatenadas || 'Ninguna observación registrada'
    };

    try {
      const res = await fetch(`${API_URL}/metricas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMensajeExito("Ficha Técnica de métricas guardada con éxito.");
        setTiempoSegundos('');
        setConteoErrores(0);
        setTasaExito(true);
        setObservaciones({ gestos: '', dudas: '', friccion: '' });
        setParticipanteId('');
        resetearCronometro();
      } else {
        const errData = await res.json();
        setErrorSubmit(`Error del servidor: ${errData.error}`);
      }
    } catch (err) {
      console.error(err);
      setErrorSubmit("No se pudo conectar con el servidor para guardar las métricas.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="ficha-card-container">
      {/* Estilos CSS premium y colores cálidos (Slate y Arena), con alineación simétrica absoluta */}
      <style>{`
        .ficha-card-container {
          max-width: 900px;
          margin: 30px auto;
          background-color: #faf9f6;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(44, 53, 57, 0.08);
          overflow: hidden;
          font-family: 'Outfit', 'Inter', system-ui, sans-serif;
          border: 1px solid #e7e5e4;
          color: #1e293b;
        }
        .ficha-header {
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          color: #faf9f6;
          padding: 35px;
          text-align: center;
        }
        .ficha-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.01em;
        }
        .ficha-header p {
          margin: 8px 0 0 0;
          font-size: 14px;
          opacity: 0.95;
          font-weight: 350;
        }
        .ficha-body {
          padding: 35px;
        }
        
        /* Grilla simétrica de la sección superior */
        .panel-grid-cols {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
          gap: 24px;
          align-items: stretch;
          margin-bottom: 30px;
        }
        .panel-card {
          background-color: #f5f5f4;
          border: 1px solid #e7e5e4;
          border-radius: 8px;
          padding: 24px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-sizing: border-box;
        }
        .panel-title {
          margin: 0 0 16px 0;
          font-size: 13px;
          color: #1e293b;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          text-align: center;
          border-bottom: 1.5px solid #e7e5e4;
          padding-bottom: 8px;
        }
        .panel-inputs-row {
          display: flex;
          gap: 12px;
          margin-bottom: 14px;
          min-height: 62px;
          align-items: flex-end;
        }
        .input-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .input-group.full-width {
          flex: 1;
        }
        .input-label {
          font-size: 12px;
          color: #2c3539;
          font-weight: 700;
        }
        .input-field {
          padding: 10px 14px;
          border: 1.5px solid #cbd5e1;
          border-radius: 6px;
          font-size: 14px;
          outline: none;
          background-color: #ffffff;
          color: #1e293b;
          box-sizing: border-box;
          width: 100%;
          transition: all 0.2s ease;
          height: 40px;
        }
        .input-field:focus {
          border-color: #475569;
          box-shadow: 0 0 0 3px rgba(71, 85, 105, 0.15);
        }
        
        /* Custom styled Combobox */
        .select-styled {
          appearance: none;
          background-image: url("data:image/svg+xml;charset=UTF-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%231e293b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          background-size: 14px;
          padding: 10px 36px 10px 14px;
          border: 1.5px solid #cbd5e1;
          border-radius: 6px;
          font-size: 14px;
          background-color: #ffffff;
          color: #1e293b;
          outline: none;
          cursor: pointer;
          box-sizing: border-box;
          width: 100%;
          transition: all 0.2s ease;
          height: 40px;
        }
        .select-styled:focus {
          border-color: #475569;
          box-shadow: 0 0 0 3px rgba(71, 85, 105, 0.15);
        }

        .btn-action {
          background-color: #475569;
          color: #faf9f6;
          border: none;
          padding: 10px 18px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          height: 40px;
          box-sizing: border-box;
          margin-bottom: 16px;
          text-align: center;
        }
        .btn-action:hover {
          background-color: #334155;
        }
        .btn-action-secondary {
          background-color: #ffffff;
          color: #1e293b;
          border: 1.5px solid #cbd5e1;
        }
        .btn-action-secondary:hover {
          background-color: #faf9f6;
          border-color: #4b5563;
        }

        /* Cuadros de información y consentimiento con alturas igualadas */
        .info-box-card {
          background-color: #ffffff;
          border: 1.5px dashed #94a3b8;
          border-radius: 6px;
          padding: 14px;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          min-height: 155px;
        }
        .info-box-title {
          font-size: 12px;
          font-weight: 700;
          color: #1e293b;
          margin: 0 0 6px 0;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .info-box-text {
          font-size: 11px;
          color: #334155;
          line-height: 1.45;
          margin: 0 0 10px 0;
        }
        .consent-check-row {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .consent-checkbox {
          cursor: pointer;
          width: 14px;
          height: 14px;
          margin: 0;
        }

        /* Elementos de la Ficha */
        .ficha-section {
          margin-bottom: 30px;
          border-bottom: 1.5px solid #e7e5e4;
          padding-bottom: 25px;
        }
        .ficha-section-title {
          margin: 0 0 20px 0;
          font-size: 17px;
          color: #1f2937;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .ficha-section-title::before {
          content: '';
          display: inline-block;
          width: 5px;
          height: 17px;
          background-color: #4b5563;
          border-radius: 3px;
        }
        .ficha-banner {
          background-color: #e2e8f0;
          border: 1px solid #cbd5e1;
          color: #1e293b;
          padding: 14px 20px;
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 25px;
        }
        .ficha-badge {
          background-color: #4b5563;
          color: #ffffff;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 12px;
        }
        .timer-display-box {
          background-color: #2c3539;
          border-radius: 8px;
          padding: 20px;
          text-align: center;
          color: #f5f5f4;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.25);
        }
        .timer-digits {
          font-family: monospace;
          font-size: 32px;
          font-weight: 700;
          letter-spacing: 1px;
          margin-bottom: 12px;
        }
        .timer-btn-row {
          display: flex;
          justify-content: center;
          gap: 6px;
          flex-wrap: wrap;
        }
        .timer-btn {
          border: none;
          padding: 8px 12px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .timer-btn-start {
          background-color: #10b981;
          color: #ffffff;
        }
        .timer-btn-start:hover {
          background-color: #059669;
        }
        .timer-btn-pause {
          background-color: #d97706;
          color: #ffffff;
        }
        .timer-btn-pause:hover {
          background-color: #b45309;
        }
        .timer-btn-reset {
          background-color: #dc2626;
          color: #ffffff;
        }
        .timer-btn-reset:hover {
          background-color: #b91c1c;
        }
        .timer-btn-apply {
          background-color: #475569;
          color: #ffffff;
        }
        .timer-btn-apply:hover:not(:disabled) {
          background-color: #334155;
        }
        .timer-btn-apply:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .toggle-box {
          display: flex;
          border-radius: 6px;
          overflow: hidden;
          border: 1.5px solid #cbd5e1;
          width: 100%;
        }
        .toggle-btn {
          flex: 1;
          padding: 12px;
          background-color: #ffffff;
          color: #1e293b;
          border: none;
          cursor: pointer;
          font-size: 13px;
          font-weight: 750;
          transition: all 0.2s ease;
        }
        .toggle-btn-success.active {
          background-color: #10b981;
          color: #ffffff;
        }
        .toggle-btn-failure.active {
          background-color: #ef4444;
          color: #ffffff;
        }
        .counter-box {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 20px;
          border: 1.5px solid #cbd5e1;
          border-radius: 6px;
          padding: 6px;
          background-color: #ffffff;
        }
        .counter-btn {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1.5px solid #cbd5e1;
          background-color: #f5f5f4;
          font-size: 18px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #334155;
          transition: all 0.2s ease;
        }
        .counter-btn:hover {
          background-color: #faf9f6;
          border-color: #4b5563;
        }
        .counter-value {
          font-size: 20px;
          font-weight: 800;
          color: #1e293b;
          min-width: 30px;
          text-align: center;
        }
        .ficha-textarea {
          width: 100%;
          padding: 10px 12px;
          border: 1.5px solid #cbd5e1;
          border-radius: 6px;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          resize: vertical;
          font-family: inherit;
          min-height: 60px;
          transition: all 0.2s ease;
          color: #1e293b;
        }
        .ficha-textarea:focus {
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }
        .btn-submit {
          background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
          color: #faf9f6;
          border: none;
          padding: 14px 24px;
          border-radius: 8px;
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
          text-align: center;
        }
        .btn-submit:hover:not(:disabled) {
          background: #111827;
        }
        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .ficha-error-alert {
          background-color: #fff7ed;
          border: 1.5px solid #ffedd5;
          color: #c2410c;
          padding: 14px 18px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 18px;
        }
        .ficha-success-alert {
          background-color: #f0fdf4;
          border: 1.5px solid #dcfce7;
          color: #15803d;
          padding: 14px 18px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 18px;
        }
        .ficha-empty-state {
          padding: 50px 30px;
          text-align: center;
          color: #1e293b;
          border: 2px dashed #94a3b8;
          border-radius: 8px;
          font-size: 15px;
          background-color: #f5f5f4;
          font-weight: 600;
        }
        .iso-disclaimer {
          margin-top: 25px;
          font-size: 11px;
          color: #475569;
          line-height: 1.4;
          border-top: 1.5px solid #e7e5e4;
          padding-top: 15px;
          text-align: center;
          font-weight: 500;
        }
      `}</style>

      <div className="ficha-header">
        <h2>Ficha Tecnica de Observacion (Investigadores)</h2>
        <p>Registro de Metricas de Usabilidad - Evaluacion de Calidad en el Proceso de Software</p>
      </div>

      <div className="ficha-body">
        
        {/* Paso 1: Grid Simétrico para Configurar Sesión */}
        <div className="ficha-section">
          <h3 className="ficha-section-title">1. Configuración de la Sesión</h3>
          
          <div className="panel-grid-cols">
            
            {/* Registro Rápido */}
            <div className="panel-card">
              <h4 className="panel-title">Registrar Nuevo Participante</h4>
              
              <form onSubmit={registrarParticipante} style={{ display: 'contents' }}>
                <div className="panel-inputs-row">
                  <div className="input-group">
                    <label className="input-label">Edad:</label>
                    <input
                      type="number"
                      min="1"
                      max="120"
                      placeholder="Ej: 30"
                      value={nuevoParticipante.edad}
                      onChange={e => setNuevoParticipante({...nuevoParticipante, edad: e.target.value})}
                      className="input-field"
                      required
                    />
                  </div>
                  <div className="input-group">
                    <label className="input-label">Interfaz asignada:</label>
                    <select
                      value={nuevoParticipante.version_interfaz}
                      onChange={e => setNuevoParticipante({...nuevoParticipante, version_interfaz: e.target.value})}
                      className="select-styled"
                    >
                      <option value="A">Interfaz A (Minimalista)</option>
                      <option value="B">Interfaz B (Tradicional)</option>
                      <option value="C">Interfaz C (Alto Contraste)</option>
                    </select>
                  </div>
                </div>
                
                <button type="submit" className="btn-action">Registrar Participante</button>
              </form>

              {/* Consentimiento */}
              <div className="info-box-card">
                <h5 className="info-box-title">Verificación Ética</h5>
                <p className="info-box-text">
                  Confirmo que el participante ha firmado de conformidad el Consentimiento Informado antes de comenzar la sesión y que se han salvaguardado las pautas éticas.
                </p>
                <div className="consent-check-row">
                  <input
                    type="checkbox"
                    id="consentVerify"
                    checked={consentimiento}
                    onChange={e => setConsentimiento(e.target.checked)}
                    className="consent-checkbox"
                  />
                  <label htmlFor="consentVerify" className="input-label" style={{ cursor: 'pointer' }}>
                    Confirmar consentimiento del participante
                  </label>
                </div>
              </div>
            </div>

            {/* Selección de Existente */}
            <div className="panel-card">
              <h4 className="panel-title">Seleccionar Participante Activo</h4>
              
              <div className="panel-inputs-row">
                <div className="input-group full-width">
                  <label className="input-label">ID de Registro Activo:</label>
                  <select
                    value={participanteId}
                    onChange={e => setParticipanteId(e.target.value)}
                    className="select-styled"
                  >
                    <option value="">-- Selecciona participante --</option>
                    {participantes.map(p => (
                      <option key={p.id} value={p.id}>
                        U{String(p.id).padStart(3, '0')} (Edad: {p.edad}, Interfaz: {p.version_interfaz})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              
              <button type="button" onClick={cargarParticipantes} className="btn-action btn-action-secondary">
                Actualizar Lista de Participantes
              </button>

              {/* Informacion de ISO */}
              <div className="info-box-card">
                <h5 className="info-box-title">Marco de Evaluación ISO</h5>
                <p className="info-box-text" style={{ marginBottom: 0 }}>
                  Esta investigacion evalua la usabilidad segun la norma ISO 9241-11 (Eficacia, Eficiencia, Satisfaccion) y la calidad de producto bajo la norma ISO/IEC 25010 (Operabilidad y Estetica de Interfaz).
                </p>
              </div>
            </div>
            
          </div>
        </div>

        {/* Paso 2: Registro de Métricas y Observaciones */}
        {participanteId ? (
          <form onSubmit={enviarMetricas}>
            
            {participanteSeleccionado && (
              <div className="ficha-banner">
                Observando a: <strong>U{String(participanteSeleccionado.id).padStart(3, '0')}</strong> | 
                Edad: <strong>{participanteSeleccionado.edad} anos</strong> | 
                Version de Interfaz: <span className="ficha-badge">{participanteSeleccionado.version_interfaz}</span>
              </div>
            )}

            {/* Panel de Métricas Cuantitativas */}
            <div className="ficha-grid-cols">
              
              {/* Bloque de Tiempo & Cronómetro - Eficiencia */}
              <div className="ficha-panel-card">
                <h4 className="ficha-panel-title">Eficiencia: Tiempo de Resolucion</h4>
                
                <div className="timer-display-box">
                  <div className="timer-digits">{formatearTiempo(cronometroTiempo)}</div>
                  <div className="timer-btn-row">
                    {!cronometroActivo ? (
                      <button type="button" onClick={iniciarCronometro} className="timer-btn timer-btn-start">Iniciar</button>
                    ) : (
                      <button type="button" onClick={pausarCronometro} className="timer-btn timer-btn-pause">Pausar</button>
                    )}
                    <button type="button" onClick={resetearCronometro} className="timer-btn timer-btn-reset">Reset</button>
                    <button 
                      type="button" 
                      onClick={aplicarTiempoCronometro} 
                      disabled={cronometroTiempo === 0} 
                      className="timer-btn timer-btn-apply"
                    >
                      Aplicar
                    </button>
                  </div>
                </div>

                <div className="ficha-input-group" style={{ marginTop: '16px' }}>
                  <label className="ficha-label">Tiempo Final (Segundos):</label>
                  <span className="ficha-label-sub">Metrica de eficiencia segun ISO 9241-11</span>
                  <input
                    type="number"
                    min="1"
                    placeholder="Ej: 45"
                    value={tiempoSegundos}
                    onChange={e => setTiempoSegundos(e.target.value)}
                    className="ficha-input"
                    required
                  />
                </div>
              </div>

              {/* Bloque de Tasa de Éxito e Incorrectos - Eficacia */}
              <div className="ficha-panel-card">
                <h4 className="ficha-panel-title">Eficacia y Errores</h4>
                
                <div className="ficha-input-group" style={{ marginBottom: '20px' }}>
                  <label className="ficha-label">Tasa de Exito (Eficacia):</label>
                  <span className="ficha-label-sub">Porcentaje de tareas completadas (ISO 9241-11)</span>
                  <div className="toggle-box" style={{ marginTop: '5px' }}>
                    <button
                      type="button"
                      onClick={() => setTasaExito(true)}
                      className={`toggle-btn toggle-btn-success ${tasaExito ? 'active' : ''}`}
                    >
                      Exito (Si)
                    </button>
                    <button
                      type="button"
                      onClick={() => setTasaExito(false)}
                      className={`toggle-btn toggle-btn-failure ${!tasaExito ? 'active' : ''}`}
                    >
                      Fallo (No)
                    </button>
                  </div>
                </div>

                <div className="ficha-input-group">
                  <label className="ficha-label">Clics Incorrectos (Errores):</label>
                  <span className="ficha-label-sub">Proteccion contra errores del usuario (ISO/IEC 25010)</span>
                  <div className="counter-box" style={{ marginTop: '5px' }}>
                    <button
                      type="button"
                      onClick={() => setConteoErrores(Math.max(0, conteoErrores - 1))}
                      className="counter-btn"
                    >
                      -
                    </button>
                    <div className="counter-value">{conteoErrores}</div>
                    <button
                      type="button"
                      onClick={() => setConteoErrores(conteoErrores + 1)}
                      className="counter-btn"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Observaciones Cualitativas */}
            <div className="ficha-panel-card">
              <h4 className="ficha-panel-title">Comportamiento Cualitativo</h4>
              
              <div className="ficha-input-group" style={{ marginBottom: '16px' }}>
                <label className="ficha-label" htmlFor="gestos">1. Gestos / Expresiones del participante:</label>
                <textarea
                  id="gestos"
                  placeholder="Ej: Fruncia el ceño al leer los textos, suspiro en el pago..."
                  value={observaciones.gestos}
                  onChange={e => setObservaciones({...observaciones, gestos: e.target.value})}
                  className="ficha-textarea"
                />
              </div>

              <div className="ficha-input-group" style={{ marginBottom: '16px' }}>
                <label className="ficha-label" htmlFor="dudas">2. Dudas verbalizadas por el usuario:</label>
                <textarea
                  id="dudas"
                  placeholder="Ej: Expresaba en voz alta 'No veo el boton de comprar'..."
                  value={observaciones.dudas}
                  onChange={e => setObservaciones({...observaciones, dudas: e.target.value})}
                  className="ficha-textarea"
                />
              </div>

              <div className="ficha-input-group">
                <label className="ficha-label" htmlFor="friccion">3. Momentos de mayor friccion (donde se detuvo):</label>
                <textarea
                  id="friccion"
                  placeholder="Ej: Permanecio inactivo 8 segundos tratando de cargar la foto..."
                  value={observaciones.friccion}
                  onChange={e => setObservaciones({...observaciones, friccion: e.target.value})}
                  className="ficha-textarea"
                />
              </div>
            </div>

            {errorSubmit && <div className="ficha-error-alert">{errorSubmit}</div>}
            {mensajeExito && <div className="ficha-success-alert">{mensajeExito}</div>}

            <button type="submit" disabled={guardando} className="btn-submit">
              {guardando ? 'Guardando metricas...' : 'Guardar Ficha de Observacion'}
            </button>
          </form>
        ) : (
          <div className="ficha-empty-state">
            <p>Selecciona o registra un participante arriba para habilitar la ficha tecnica de observacion.</p>
          </div>
        )}

        <div className="iso-disclaimer">
          Ficha tecnica de evaluacion de usabilidad estructurada bajo los principios de Eficacia, Eficiencia y Satisfaccion de la norma ISO 9241-11:2018.
        </div>
      </div>
    </div>
  );
}
