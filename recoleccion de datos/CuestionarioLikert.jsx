import { useState, useEffect } from 'react';

export default function CuestionarioLikert() {
  // Lista de participantes registrados
  const [participantes, setParticipantes] = useState([]);
  const [participanteId, setParticipanteId] = useState('');
  
  // Estado para registro rápido de participante
  const [nuevoParticipante, setNuevoParticipante] = useState({
    edad: '',
    version_interfaz: 'A'
  });
  
  // Respuestas del cuestionario
  const [respuestas, setRespuestas] = useState({
    p1: null,
    p2: null,
    p3: null,
    p4: null,
    p5: null
  });
  const [consentimiento, setConsentimiento] = useState(false);
  
  // Estados para UI
  const [mensajeExito, setMensajeExito] = useState('');
  const [errorSubmit, setErrorSubmit] = useState('');
  const [cargandoParticipantes, setCargandoParticipantes] = useState(false);
  const [guardando, setGuardando] = useState(false);

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
  }, []);

  // Registrar participante rápido
  const registrarParticipante = async (e) => {
    e.preventDefault();
    if (!consentimiento) {
      alert("Debe aceptar los términos y condiciones de consentimiento informado antes de registrar al participante.");
      return;
    }
    if (!nuevoParticipante.edad || nuevoParticipante.edad <= 0 || nuevoParticipante.edad > 120) {
      alert("Por favor, ingrese una edad válida.");
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

  // Cambiar respuesta de Likert
  const handleRatingChange = (pregunta, valor) => {
    setRespuestas(prev => ({
      ...prev,
      [pregunta]: valor
    }));
  };

  // Enviar respuestas de la encuesta
  const enviarEncuesta = async (e) => {
    e.preventDefault();
    setErrorSubmit('');
    setMensajeExito('');

    // Validaciones
    if (!participanteId) {
      setErrorSubmit("Debes seleccionar o registrar un participante primero.");
      return;
    }
    if (!respuestas.p1 || !respuestas.p2 || !respuestas.p3 || !respuestas.p4 || !respuestas.p5) {
      setErrorSubmit("Por favor contesta todas las preguntas del cuestionario.");
      return;
    }

    setGuardando(true);
    const payload = {
      participante_id: parseInt(participanteId, 10),
      p1_claridad_diseno: respuestas.p1,
      p2_facilidad_compra: respuestas.p2,
      p3_legibilidad_textos: respuestas.p3,
      p4_comodidad_uso: respuestas.p4,
      p5_recomendacion: respuestas.p5,
      comentario_abierto: null
    };

    try {
      const res = await fetch(`${API_URL}/respuestas`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setMensajeExito("Encuesta guardada con éxito en la base de datos.");
        setRespuestas({ p1: null, p2: null, p3: null, p4: null, p5: null });
        setParticipanteId('');
      } else {
        const errData = await res.json();
        setErrorSubmit(`Error del servidor: ${errData.error}`);
      }
    } catch (err) {
      console.error(err);
      setErrorSubmit("No se pudo conectar con el servidor para guardar las respuestas.");
    } finally {
      setGuardando(false);
    }
  };

  const preguntas = [
    { 
      key: 'p1', 
      texto: 'El diseño de la pantalla fue claro y fácil de entender.' 
    },
    { 
      key: 'p2', 
      texto: 'Me resultó sencillo realizar la compra.' 
    },
    { 
      key: 'p3', 
      texto: 'El tamaño de los textos e iconos fue legible.' 
    },
    { 
      key: 'p4', 
      texto: 'Me sentí cómodo/a usando este sistema.' 
    },
    { 
      key: 'p5', 
      texto: 'Recomendaría este sistema para futuras compras.' 
    }
  ];

  return (
    <div className="likert-card-container">
      {/* Estilos CSS premium y colores cálidos, con alineación simétrica absoluta */}
      <style>{`
        .likert-card-container {
          width: 100%;
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
        .likert-header {
          background: linear-gradient(135deg, #115e59 0%, #0f766e 100%);
          color: #faf9f6;
          padding: 35px;
          text-align: center;
        }
        .likert-header h2 {
          margin: 0;
          font-size: 24px;
          font-weight: 700;
          letter-spacing: -0.01em;
          color: #faf9f6;
        }
        .likert-header p {
          margin: 8px 0 0 0;
          font-size: 14px;
          opacity: 0.95;
          font-weight: 350;
        }
        .likert-body {
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
          border-color: #115e59;
          box-shadow: 0 0 0 3px rgba(17, 94, 89, 0.15);
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
          border-color: #115e59;
          box-shadow: 0 0 0 3px rgba(17, 94, 89, 0.15);
        }

        .btn-action {
          background-color: #115e59;
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
          background-color: #0f766e;
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
          color: #115e59;
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

        /* Elementos del cuestionario Likert */
        .likert-section {
          margin-bottom: 30px;
          border-bottom: 1.5px solid #e7e5e4;
          padding-bottom: 25px;
        }
        .likert-section-title {
          margin: 0 0 20px 0;
          font-size: 17px;
          color: #115e59;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .likert-section-title::before {
          content: '';
          display: inline-block;
          width: 5px;
          height: 17px;
          background-color: #115e59;
          border-radius: 3px;
        }
        .likert-banner {
          background-color: #ccfbf1;
          border: 1px solid #99f6e4;
          color: #115e59;
          padding: 14px 20px;
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.5;
          margin-bottom: 25px;
        }
        .likert-question-card {
          border: 1.5px solid #e7e5e4;
          border-radius: 8px;
          padding: 24px;
          background-color: #ffffff;
          margin-bottom: 20px;
        }
        .likert-question-text {
          margin: 0 0 4px 0;
          font-size: 15.5px;
          color: #1e293b;
          font-weight: 700;
          line-height: 1.4;
        }
        .likert-question-sub {
          margin: 0 0 16px 0;
          font-size: 11px;
          color: #475569;
          font-style: italic;
          font-weight: 450;
        }
        .likert-options-row {
          display: flex;
          justify-content: space-between;
          gap: 8px;
          margin: 12px 0;
        }
        .likert-option-btn {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 14px 8px;
          border: 2px solid #e7e5e4;
          border-radius: 8px;
          background-color: #ffffff;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
        }
        .likert-option-btn:hover {
          border-color: #c2410c;
          background-color: #faf9f6;
        }
        .likert-option-btn.selected {
          border-color: #c2410c;
          background-color: #ffedd5;
        }
        .likert-option-number {
          font-size: 18px;
          font-weight: 800;
          color: #334155;
        }
        .likert-option-btn.selected .likert-option-number {
          color: #c2410c;
        }
        .likert-option-label-short {
          font-size: 10px;
          color: #475569;
          margin-top: 4px;
          font-weight: 600;
          text-transform: uppercase;
        }
        .likert-option-btn.selected .likert-option-label-short {
          color: #c2410c;
        }
        .likert-legend {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          color: #475569;
          font-weight: 600;
          margin-top: 8px;
        }
        .likert-textarea {
          width: 100%;
          padding: 12px 14px;
          border: 1.5px solid #cbd5e1;
          border-radius: 6px;
          font-size: 14px;
          outline: none;
          box-sizing: border-box;
          resize: vertical;
          font-family: inherit;
          min-height: 80px;
          transition: all 0.2s ease;
        }
        .likert-textarea:focus {
          border-color: #115e59;
          box-shadow: 0 0 0 3px rgba(17, 94, 89, 0.1);
        }
        .btn-submit {
          background: linear-gradient(135deg, #115e59 0%, #0f766e 100%);
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
          background: #0f766e;
        }
        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .likert-error-alert {
          background-color: #fff7ed;
          border: 1.5px solid #ffedd5;
          color: #c2410c;
          padding: 14px 18px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 18px;
        }
        .likert-success-alert {
          background-color: #f0fdf4;
          border: 1.5px solid #dcfce7;
          color: #15803d;
          padding: 14px 18px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          margin-bottom: 18px;
        }
        .likert-empty-state {
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

      <div className="likert-header">
        <h2>Cuestionario de Satisfaccion (Experiencia de Compra)</h2>
        <p>Bonitas Fashions - Evaluacion de Calidad del Proceso de Ventas</p>
      </div>

      <div className="likert-body">
        
        {/* Paso 1: Grid Sinuoso y Simétrico para Identificar Participante */}
        <div className="likert-section">
          <h3 className="likert-section-title">1. Identificacion del Participante</h3>
          
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
                      placeholder="Ej: 25"
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
                <h5 className="info-box-title">Mejora Continua y Servicio</h5>
                <p className="info-box-text">
                  Al completar este cuestionario, nos ayuda a mejorar nuestro sistema de ventas y la calidad del servicio de Bonitas Fashions.
                </p>
                <div className="consent-check-row">
                  <input
                    type="checkbox"
                    id="consentCheck"
                    checked={consentimiento}
                    onChange={e => setConsentimiento(e.target.checked)}
                    className="consent-checkbox"
                  />
                  <label htmlFor="consentCheck" className="input-label" style={{ cursor: 'pointer' }}>
                    Confirmar envio de respuestas anonimas
                  </label>
                </div>
              </div>
            </div>

            {/* Selección de Existente */}
            <div className="panel-card">
              <h4 className="panel-title">Vincular Participante Existente</h4>
              
              <div className="panel-inputs-row">
                <div className="input-group full-width">
                  <label className="input-label">Seleccionar ID de Registro:</label>
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
                <h5 className="info-box-title">Calidad en el Servicio</h5>
                <p className="info-box-text" style={{ marginBottom: 0 }}>
                  Nuestro objetivo es garantizar una plataforma de compras facil, rapida y segura para todos nuestros clientes de Bonitas Fashions.
                </p>
              </div>
            </div>
            
          </div>
        </div>

        {/* Paso 2: El Cuestionario */}
        {participanteId ? (
          <form onSubmit={enviarEncuesta}>
            <div className="likert-banner">
              Participante activo: U{String(participanteId).padStart(3, '0')}. Valore las siguientes afirmaciones basadas en la interfaz probada:
            </div>

            {preguntas.map((p) => (
              <div key={p.key} className="likert-question-card">
                <p className="likert-question-text" style={{ marginBottom: '16px' }}>{p.texto}</p>
                <div className="likert-options-row">
                  {[1, 2, 3, 4, 5].map((num) => {
                    const seleccionado = respuestas[p.key] === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        onClick={() => handleRatingChange(p.key, num)}
                        className={`likert-option-btn ${seleccionado ? 'selected' : ''}`}
                      >
                        <span className="likert-option-number">{num}</span>
                        <span className="likert-option-label-short">
                          {num === 1 ? 'Mala' : num === 5 ? 'Excelente' : ''}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="likert-legend">
                  <span>Totalmente en desacuerdo (1)</span>
                  <span>Totalmente de acuerdo (5)</span>
                </div>
              </div>
            ))}

            {errorSubmit && <div className="likert-error-alert">{errorSubmit}</div>}
            {mensajeExito && <div className="likert-success-alert">{mensajeExito}</div>}

            <button type="submit" disabled={guardando} className="btn-submit">
              {guardando ? 'Guardando encuesta...' : 'Enviar Respuestas del Cuestionario'}
            </button>
          </form>
        ) : (
          <div className="likert-empty-state">
            <p>Selecciona o registra un participante arriba para desplegar las preguntas de escala Likert.</p>
          </div>
        )}

        <div className="iso-disclaimer">
          Cuestionario de satisfaccion para la mejora continua de nuestra plataforma de venta y la experiencia de nuestros clientes.
        </div>
      </div>
    </div>
  );
}
