// src/pages/jefe_brigada/EstablecimientoSubparcelas.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { conglomeradosService } from '../../services/conglomeradosService';
import CoordenadasInput from '../../components/common/CoordenadasInput';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import axios from 'axios';
import './EstablecimientoSubparcelas.css';

const API_CONGLOMERADOS = import.meta.env.VITE_API_CONGLOMERADOS || 'http://localhost:3002';

const COBERTURAS = [
  { codigo: 'BT', nombre: 'Bosque de tierra firme' },
  { codigo: 'BI', nombre: 'Bosque inundable' },
  { codigo: 'BS', nombre: 'Bosque secundario' },
  { codigo: 'CU', nombre: 'Cultivos' },
  { codigo: 'PA', nombre: 'Pastos' },
  { codigo: 'VE', nombre: 'Vegetación secundaria' }
];

const ALTERACIONES = [
  { codigo: 'EA', nombre: 'Evidencia de aprovechamientos' },
  { codigo: 'DS', nombre: 'Deslizamientos' },
  { codigo: 'IN', nombre: 'Incendios' },
  { codigo: 'PL', nombre: 'Plagas' },
  { codigo: 'SA', nombre: 'Sin alteración' }
];

const SEVERIDADES = ['FA', 'MA', 'NP'];

export default function EstablecimientoSubparcelas() {
  const [searchParams] = useSearchParams();
  const conglomerado_id = searchParams.get('conglomerado');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [conglomerado, setConglomerado] = useState(null);
  const [subparcelas, setSubparcelas] = useState([]);
  const [spfActual, setSpfActual] = useState(0);
  
  const [formSPF, setFormSPF] = useState({
    se_establecio: null,
    latitud_establecida: '',
    longitud_establecida: '',
    error_gps_establecido: '',
    razon_no_establecida: '',
    inclinaciones: ['', '', '', '', '', '', '', ''],
    cobertura: '',
    porcentaje_cobertura: '',
    alteracion: '',
    severidad: '',
    observaciones: ''
  });

  useEffect(() => {
    if (conglomerado_id) {
      cargarConglomerado();
    }
  }, [conglomerado_id]);

  useEffect(() => {
    if (subparcelas[spfActual]) {
      cargarDatosSPF(subparcelas[spfActual]);
    }
  }, [spfActual, subparcelas]);

  const cargarConglomerado = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await conglomeradosService.getById(conglomerado_id);
      setConglomerado(res.data);
      setSubparcelas(res.data.conglomerados_subparcelas || []);
      
      if (res.data.conglomerados_subparcelas?.length > 0) {
        cargarDatosSPF(res.data.conglomerados_subparcelas[0]);
      }
    } catch (err) {
      console.error('Error cargando conglomerado:', err);
      setError(err.response?.data?.error || 'Error al cargar conglomerado');
    } finally {
      setLoading(false);
    }
  };

  const cargarDatosSPF = (spf) => {
    setFormSPF({
      se_establecio: spf.se_establecio,
      latitud_establecida: spf.latitud_establecida || '',
      longitud_establecida: spf.longitud_establecida || '',
      error_gps_establecido: spf.error_gps_establecido || '',
      razon_no_establecida: spf.razon_no_establecida || '',
      inclinaciones: ['', '', '', '', '', '', '', ''],
      cobertura: '',
      porcentaje_cobertura: '',
      alteracion: '',
      severidad: '',
      observaciones: spf.observaciones || ''
    });
  };

  const registrarEstablecimiento = async (e) => {
    e.preventDefault();
    
    const spf = subparcelas[spfActual];
    if (!spf) return;

    if (formSPF.se_establecio === null) {
      setError('Debes indicar si la subparcela se estableció');
      return;
    }

    if (formSPF.se_establecio) {
      if (!formSPF.latitud_establecida || !formSPF.longitud_establecida || !formSPF.error_gps_establecido) {
        setError('Debes registrar las coordenadas establecidas y el error GPS');
        return;
      }
    } else {
      if (!formSPF.razon_no_establecida) {
        setError('Debes indicar la razón por la que no se estableció');
        return;
      }
    }

    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token');
      
      await axios.patch(
        `${API_CONGLOMERADOS}/api/subparcelas/${spf.id}/establecimiento`,
        {
          se_establecio: formSPF.se_establecio,
          latitud_establecida: formSPF.latitud_establecida || null,
          longitud_establecida: formSPF.longitud_establecida || null,
          error_gps_establecido: formSPF.error_gps_establecido ? parseFloat(formSPF.error_gps_establecido) : null,
          razon_no_establecida: formSPF.razon_no_establecida || null,
          observaciones: formSPF.observaciones || null
        },
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      setSuccess(`SPF${spfActual + 1} registrada exitosamente`);
      cargarConglomerado();
      
      if (spfActual < 4) {
        setSpfActual(spfActual + 1);
      }
    } catch (err) {
      console.error('Error registrando SPF:', err);
      setError(err.response?.data?.error || 'Error al registrar subparcela');
    } finally {
      setLoading(false);
    }
  };

  if (!conglomerado_id) {
    return (
      <div className="page-error">
        <div className="error-icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2>Error</h2>
        <p>No se especificó ID de conglomerado</p>
      </div>
    );
  }

if (loading && !conglomerado) return <LoadingSpinner mensaje="Cargando..." />;
if (error && !conglomerado) return <ErrorAlert mensaje={error} onRetry={cargarConglomerado} />;

if (!conglomerado) {
  return (
    <div className="empty-state-page">
      <div className="empty-state-icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      </div>
      <h2>No hay conglomerado disponible</h2>
      <p>No se encontró información del conglomerado solicitado</p>
    </div>
  );
}

if (subparcelas.length === 0) {
  return (
    <div className="empty-state-page">
      <div className="empty-state-icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      </div>
      <h2>No hay subparcelas registradas</h2>
      <p>Este conglomerado aún no tiene subparcelas configuradas</p>
    </div>
  );
}

  const spf = subparcelas[spfActual];
  const todasRegistradas = subparcelas.every(s => s.se_establecio !== null);

  return (
    <div className="establecimiento-subparcelas">
      <div className="page-header">
        <div>
          <h1>Establecimiento de Subparcelas</h1>
          <p>F2 - Materialización y Registro de Terreno</p>
        </div>
        <div className="progreso-badge">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {subparcelas.filter(s => s.se_establecio !== null).length} / 5 registradas
        </div>
      </div>

      {error && <ErrorAlert mensaje={error} onClose={() => setError('')} />}
      {success && (
        <div className="alert alert-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2"/>
            <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2"/>
          </svg>
          {success}
          <button onClick={() => setSuccess('')} className="alert-close">✕</button>
        </div>
      )}

      {/* Navegación SPF */}
      <div className="spf-tabs">
        {subparcelas.map((s, index) => (
          <button
            key={s.id}
            className={`spf-tab ${spfActual === index ? 'active' : ''} ${s.se_establecio !== null ? 'completado' : ''}`}
            onClick={() => setSpfActual(index)}
          >
            <div className="spf-tab-content">
              <span className="spf-number">SPF{index + 1}</span>
              {s.se_establecio !== null && (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
          </button>
        ))}
      </div>

      {/* Formulario */}
      <form onSubmit={registrarEstablecimiento} className="form-spf">
        <div className="section">
          <div className="section-header">
            <div className="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </div>
            <div>
              <h2>SPF{spfActual + 1} - Coordenadas</h2>
              <p>Registro de ubicación establecida en campo</p>
            </div>
          </div>
          
          <div className="info-prediligenciada">
            <h4>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              Coordenadas Prediligenciadas
            </h4>
            <div className="coord-grid">
              <div className="coord-item">
                <span className="coord-label">Latitud:</span>
                <span className="coord-value">{spf.latitud_prediligenciada}</span>
              </div>
              <div className="coord-item">
                <span className="coord-label">Longitud:</span>
                <span className="coord-value">{spf.longitud_prediligenciada}</span>
              </div>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">¿Se estableció la subparcela? *</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="se_establecio"
                  checked={formSPF.se_establecio === true}
                  onChange={() => setFormSPF({ ...formSPF, se_establecio: true, razon_no_establecida: '' })}
                />
                <span className="radio-custom"></span>
                <span>Sí</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="se_establecio"
                  checked={formSPF.se_establecio === false}
                  onChange={() => setFormSPF({ ...formSPF, se_establecio: false })}
                />
                <span className="radio-custom"></span>
                <span>No</span>
              </label>
            </div>
          </div>

          {formSPF.se_establecio === true && (
            <>
              <CoordenadasInput
                label="Latitud Establecida"
                value={formSPF.latitud_establecida}
                onChange={(valor) => setFormSPF({ ...formSPF, latitud_establecida: valor })}
                tipo="lat"
                required
              />

              <CoordenadasInput
                label="Longitud Establecida"
                value={formSPF.longitud_establecida}
                onChange={(valor) => setFormSPF({ ...formSPF, longitud_establecida: valor })}
                tipo="lon"
                required
              />

              <div className="form-group">
                <label className="form-label">Error GPS Establecido (metros) *</label>
                <input
                  type="number"
                  className="form-input"
                  step="0.1"
                  min="0"
                  placeholder="Ej: 3.5"
                  value={formSPF.error_gps_establecido}
                  onChange={(e) => setFormSPF({ ...formSPF, error_gps_establecido: e.target.value })}
                  required
                />
              </div>

              <div className="alert alert-info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Verifica que los decimales de segundos no difieran en más de 0.1 unidades
              </div>
            </>
          )}

          {formSPF.se_establecio === false && (
            <div className="form-group">
              <label className="form-label">Razón No Establecida *</label>
              <select
                className="form-select"
                value={formSPF.razon_no_establecida}
                onChange={(e) => setFormSPF({ ...formSPF, razon_no_establecida: e.target.value })}
                required
              >
                <option value="">-- Selecciona una razón --</option>
                <option value="1">1 - Acceso denegado por propietario</option>
                <option value="2">2 - Peligros naturales</option>
                <option value="3">3 - Peligros de orden público</option>
                <option value="4">4 - Otras razones</option>
              </select>
            </div>
          )}
        </div>

        {formSPF.se_establecio === true && (
          <>
            {/* Inclinaciones */}
            <div className="section">
              <div className="section-header">
                <div className="section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                  </svg>
                </div>
                <div>
                  <h2>Inclinaciones por Pendiente</h2>
                  <p>F2.7 - Registra el ángulo de inclinación desde el centro de la SPF (8 mediciones)</p>
                </div>
              </div>
              
              <div className="inclinaciones-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num, index) => (
                  <div key={num} className="form-group">
                    <label className="form-label">Pendiente {num} (°)</label>
                    <input
                      type="number"
                      className="form-input"
                      step="0.1"
                      min="-90"
                      max="90"
                      placeholder="-90 a +90"
                      value={formSPF.inclinaciones[index]}
                      onChange={(e) => {
                        const nuevas = [...formSPF.inclinaciones];
                        nuevas[index] = e.target.value;
                        setFormSPF({ ...formSPF, inclinaciones: nuevas });
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Cobertura y Alteración */}
            <div className="section">
              <div className="section-header">
                <div className="section-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                <div>
                  <h2>Cobertura y Alteración</h2>
                  <p>F2.8 - Caracterización del estado de la subparcela</p>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Cobertura *</label>
                  <select
                    className="form-select"
                    value={formSPF.cobertura}
                    onChange={(e) => setFormSPF({ ...formSPF, cobertura: e.target.value })}
                  >
                    <option value="">-- Selecciona --</option>
                    {COBERTURAS.map(c => (
                      <option key={c.codigo} value={c.codigo}>
                        {c.codigo} - {c.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Porcentaje Cobertura (0-100)</label>
                  <input
                    type="number"
                    className="form-input"
                    min="0"
                    max="100"
                    placeholder="Ej: 85"
                    value={formSPF.porcentaje_cobertura}
                    onChange={(e) => setFormSPF({ ...formSPF, porcentaje_cobertura: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Alteración *</label>
                  <select
                    className="form-select"
                    value={formSPF.alteracion}
                    onChange={(e) => setFormSPF({ ...formSPF, alteracion: e.target.value })}
                  >
                    <option value="">-- Selecciona --</option>
                    {ALTERACIONES.map(a => (
                      <option key={a.codigo} value={a.codigo}>
                        {a.codigo} - {a.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Severidad *</label>
                  <select
                    className="form-select"
                    value={formSPF.severidad}
                    onChange={(e) => setFormSPF({ ...formSPF, severidad: e.target.value })}
                  >
                    <option value="">-- Selecciona --</option>
                    {SEVERIDADES.map(s => (
                      <option key={s} value={s}>
                        {s} - {s === 'FA' ? 'Fuertemente alterado' : s === 'MA' ? 'Medianamente alterado' : 'No perturbado'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          </>
        )}

        <div className="section">
          <div className="form-group">
            <label className="form-label">Observaciones</label>
            <textarea
              className="form-textarea"
              rows="4"
              placeholder="Observaciones adicionales sobre la subparcela..."
              value={formSPF.observaciones}
              onChange={(e) => setFormSPF({ ...formSPF, observaciones: e.target.value })}
            />
          </div>
        </div>

        <div className="form-actions">
          {spfActual > 0 && (
            <button 
              type="button" 
              onClick={() => setSpfActual(spfActual - 1)}
              className="btn-secondary"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              SPF Anterior
            </button>
          )}
          
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Guardando...' : `Registrar SPF${spfActual + 1}`}
          </button>
          
          {spfActual < 4 && (
            <button 
              type="button" 
              onClick={() => setSpfActual(spfActual + 1)}
              className="btn-secondary"
            >
              SPF Siguiente
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </div>
      </form>

      {todasRegistradas && (
        <div className="alert alert-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2"/>
            <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Todas las subparcelas han sido registradas exitosamente
        </div>
      )}
    </div>
  );
}