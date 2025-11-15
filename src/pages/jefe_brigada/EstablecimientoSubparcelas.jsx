// src/pages/jefe_brigada/EstablecimientoSubparcelas.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { conglomeradosService } from '../../services/conglomeradosService';
import CoordenadasInput from '../../components/CoordenadasInput';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import axios from 'axios';

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

const SEVERIDADES = ['FA', 'MA', 'NP']; // Fuertemente alterado, Medianamente alterado, No perturbado

export default function EstablecimientoSubparcelas() {
  const [searchParams] = useSearchParams();
  const conglomerado_id = searchParams.get('conglomerado');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [conglomerado, setConglomerado] = useState(null);
  const [subparcelas, setSubparcelas] = useState([]);
  const [spfActual, setSpfActual] = useState(0); // Índice 0-4
  
  const [formSPF, setFormSPF] = useState({
    se_establecio: null,
    latitud_establecida: '',
    longitud_establecida: '',
    error_gps_establecido: '',
    razon_no_establecida: '',
    inclinaciones: ['', '', '', '', '', '', '', ''], // 8 inclinaciones
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

    // Validaciones
    if (formSPF.se_establecio === null) {
      setError('Debes indicar si la subparcela se estableció');
      return;
    }

    if (formSPF.se_establecio) {
      if (!formSPF.latitud_establecida || !formSPF.longitud_establecida || !formSPF.error_gps_establecido) {
        setError('Debes registrar las coordenadas establecidas y el error GPS');
        return;
      }
      
      // Validar diferencia de decimales de segundos (tolerancia 0.1)
      // Aquí deberías implementar la validación según el manual
      
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
      
      // Avanzar a siguiente subparcela si existe
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
        <h2>⚠️ Error</h2>
        <p>No se especificó ID de conglomerado</p>
      </div>
    );
  }

  if (loading && !conglomerado) return <LoadingSpinner mensaje="Cargando..." />;
  if (error && !conglomerado) return <ErrorAlert mensaje={error} onRetry={cargarConglomerado} />;
  if (!conglomerado || subparcelas.length === 0) return null;

  const spf = subparcelas[spfActual];
  const todasRegistradas = subparcelas.every(s => s.se_establecio !== null);

  return (
    <div className="establecimiento-subparcelas">
      <div className="page-header">
        <div>
          <h1>Establecimiento de Subparcelas</h1>
          <p>F2 - Materialización y Registro de Terreno</p>
        </div>
        <div className="progreso">
          {subparcelas.filter(s => s.se_establecio !== null).length} / 5 registradas
        </div>
      </div>

      {error && <ErrorAlert mensaje={error} onClose={() => setError('')} />}
      {success && (
        <div className="alert-success">
          ✅ {success}
          <button onClick={() => setSuccess('')}>✕</button>
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
            SPF{index + 1} {s.se_establecio !== null && '✓'}
          </button>
        ))}
      </div>

      {/* Formulario */}
      <form onSubmit={registrarEstablecimiento} className="form-spf">
        <div className="section">
          <h2>SPF{spfActual + 1} - Coordenadas</h2>
          
          <div className="info-prediligenciada">
            <h4>Coordenadas Prediligenciadas</h4>
            <p><strong>Latitud:</strong> {spf.latitud_prediligenciada}</p>
            <p><strong>Longitud:</strong> {spf.longitud_prediligenciada}</p>
          </div>

          <div className="form-group">
            <label>¿Se estableció la subparcela? *</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  name="se_establecio"
                  checked={formSPF.se_establecio === true}
                  onChange={() => setFormSPF({ ...formSPF, se_establecio: true, razon_no_establecida: '' })}
                />
                Sí
              </label>
              <label>
                <input
                  type="radio"
                  name="se_establecio"
                  checked={formSPF.se_establecio === false}
                  onChange={() => setFormSPF({ ...formSPF, se_establecio: false })}
                />
                No
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
                <label>Error GPS Establecido (metros) *</label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={formSPF.error_gps_establecido}
                  onChange={(e) => setFormSPF({ ...formSPF, error_gps_establecido: e.target.value })}
                  required
                />
              </div>

              <div className="alert-info">
                ℹ️ Verifica que los decimales de segundos no difieran en más de 0.1 unidades
              </div>
            </>
          )}

          {formSPF.se_establecio === false && (
            <div className="form-group">
              <label>Razón No Establecida *</label>
              <select
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
            {/* Inclinaciones por Pendiente (F2.7) */}
            <div className="section">
              <h2>Inclinaciones por Pendiente (8 mediciones)</h2>
              <p className="help-text">Registra el ángulo de inclinación desde el centro de la SPF</p>
              
              <div className="inclinaciones-grid">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((num, index) => (
                  <div key={num} className="form-group">
                    <label>Pendiente {num} (°)</label>
                    <input
                      type="number"
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

            {/* Cobertura y Alteración (F2.8) */}
            <div className="section">
              <h2>Cobertura y Alteración</h2>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Cobertura *</label>
                  <select
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
                  <label>Porcentaje Cobertura (0-100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formSPF.porcentaje_cobertura}
                    onChange={(e) => setFormSPF({ ...formSPF, porcentaje_cobertura: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Alteración *</label>
                  <select
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
                  <label>Severidad *</label>
                  <select
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
            <label>Observaciones</label>
            <textarea
              rows="4"
              value={formSPF.observaciones}
              onChange={(e) => setFormSPF({ ...formSPF, observaciones: e.target.value })}
              placeholder="Observaciones adicionales sobre la subparcela..."
            />
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Guardando...' : 'Registrar SPF' + (spfActual + 1)}
          </button>
          
          {spfActual > 0 && (
            <button 
              type="button" 
              onClick={() => setSpfActual(spfActual - 1)}
              className="btn-secondary"
            >
              ← SPF Anterior
            </button>
          )}
          
          {spfActual < 4 && (
            <button 
              type="button" 
              onClick={() => setSpfActual(spfActual + 1)}
              className="btn-secondary"
            >
              SPF Siguiente →
            </button>
          )}
        </div>
      </form>

      {todasRegistradas && (
        <div className="alert-success">
          ✅ Todas las subparcelas han sido registradas
        </div>
      )}
    </div>
  );
}