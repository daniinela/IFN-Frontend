// src/pages/jefe_brigada/RutasAcceso.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { brigadasService } from '../../services/brigadasService';
import CoordenadasInput from '../../components/common/CoordenadasInput';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import './RutasAcceso.css';

export default function RutasAcceso() {
  const [searchParams] = useSearchParams();
  const brigada_id = searchParams.get('brigada');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [tabActiva, setTabActiva] = useState('campamento');
  const [brigada, setBrigada] = useState(null);
  const [rutas, setRutas] = useState([]);
  
  const [formRuta, setFormRuta] = useState({
    tipo_ruta: 'campamento',
    medio_transporte: '',
    tiempo_acceso: '',
    distancia_km: ''
  });
  
  const [puntosReferencia, setPuntosReferencia] = useState([
    { nombre_punto: '', latitud: '', longitud: '', error_gps_m: '' },
    { nombre_punto: '', latitud: '', longitud: '', error_gps_m: '' },
    { nombre_punto: '', latitud: '', longitud: '', error_gps_m: '' },
    { nombre_punto: '', latitud: '', longitud: '', error_gps_m: '' }
  ]);

  useEffect(() => {
    if (brigada_id) {
      cargarBrigada();
    }
  }, [brigada_id]);

  const cargarBrigada = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await brigadasService.getById(brigada_id);
      setBrigada(res.data);
      setRutas(res.data.rutas_acceso || []);
    } catch (err) {
      console.error('Error cargando brigada:', err);
      setError(err.response?.data?.error || 'Error al cargar brigada');
    } finally {
      setLoading(false);
    }
  };

  const registrarRuta = async (e) => {
    e.preventDefault();
    
    if (!formRuta.medio_transporte || !formRuta.tiempo_acceso || !formRuta.distancia_km) {
      setError('Todos los campos de ruta son obligatorios');
      return;
    }
    
    const puntosValidos = puntosReferencia.filter(p => 
      p.nombre_punto && p.latitud && p.longitud && p.error_gps_m
    );
    
    if (puntosValidos.length < 4) {
      setError('Debes registrar mínimo 4 puntos de referencia');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const rutaRes = await brigadasService.crearRuta(brigada_id, {
        tipo_ruta: formRuta.tipo_ruta,
        medio_transporte: formRuta.medio_transporte,
        tiempo_acceso: formRuta.tiempo_acceso,
        distancia_km: parseFloat(formRuta.distancia_km)
      });
      
      const ruta_id = rutaRes.data.id;
      
      for (const punto of puntosValidos) {
        await brigadasService.agregarPuntoReferencia(ruta_id, {
          nombre_punto: punto.nombre_punto,
          latitud: punto.latitud,
          longitud: punto.longitud,
          error_gps_m: parseFloat(punto.error_gps_m)
        });
      }
      
      setSuccess(`Ruta ${formRuta.tipo_ruta} registrada exitosamente`);
      
      setFormRuta({
        tipo_ruta: formRuta.tipo_ruta,
        medio_transporte: '',
        tiempo_acceso: '',
        distancia_km: ''
      });
      setPuntosReferencia([
        { nombre_punto: '', latitud: '', longitud: '', error_gps_m: '' },
        { nombre_punto: '', latitud: '', longitud: '', error_gps_m: '' },
        { nombre_punto: '', latitud: '', longitud: '', error_gps_m: '' },
        { nombre_punto: '', latitud: '', longitud: '', error_gps_m: '' }
      ]);
      
      cargarBrigada();
    } catch (err) {
      console.error('Error registrando ruta:', err);
      setError(err.response?.data?.error || 'Error al registrar ruta');
    } finally {
      setLoading(false);
    }
  };

  const actualizarPunto = (index, campo, valor) => {
    const nuevos = [...puntosReferencia];
    nuevos[index][campo] = valor;
    setPuntosReferencia(nuevos);
  };

  const agregarPunto = () => {
    setPuntosReferencia([
      ...puntosReferencia,
      { nombre_punto: '', latitud: '', longitud: '', error_gps_m: '' }
    ]);
  };

  if (!brigada_id) {
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
        <p>No se especificó ID de brigada</p>
      </div>
    );
  }

  if (loading && !brigada) return <LoadingSpinner mensaje="Cargando..." />;
if (error && !brigada) return <ErrorAlert mensaje={error} onRetry={cargarBrigada} />;

if (!brigada) {
  return (
    <div className="empty-state-page">
      <div className="empty-state-icon">
        <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      </div>
      <h2>No hay brigada disponible</h2>
      <p>No se encontró información de la brigada para gestionar rutas de acceso</p>
    </div>
  );
}

  const rutaCampamento = rutas.find(r => r.tipo_ruta === 'campamento');
  const rutaConglomerado = rutas.find(r => r.tipo_ruta === 'conglomerado');

  return (
    <div className="rutas-acceso">
      <div className="page-header">
        <div>
          <h1>Rutas de Acceso</h1>
          <p>F1.2 (Campamento) y F1.3 (Conglomerado)</p>
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

      {/* Tabs */}
      <div className="tabs-container">
        <button
          className={`tab ${tabActiva === 'campamento' ? 'active' : ''} ${rutaCampamento ? 'completed' : ''}`}
          onClick={() => {
            setTabActiva('campamento');
            setFormRuta({ ...formRuta, tipo_ruta: 'campamento' });
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <div>
            <span className="tab-title">F1.2 - Ruta al Campamento</span>
            {rutaCampamento && (
              <span className="tab-status">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Registrada
              </span>
            )}
          </div>
        </button>
        <button
          className={`tab ${tabActiva === 'conglomerado' ? 'active' : ''} ${rutaConglomerado ? 'completed' : ''}`}
          onClick={() => {
            setTabActiva('conglomerado');
            setFormRuta({ ...formRuta, tipo_ruta: 'conglomerado' });
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <div>
            <span className="tab-title">F1.3 - Ruta al Conglomerado</span>
            {rutaConglomerado && (
              <span className="tab-status">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Registrada
              </span>
            )}
          </div>
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={registrarRuta} className="form-rutas">
        <div className="section">
          <div className="section-header">
            <div className="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div>
              <h2>Datos de la Ruta</h2>
              <p>Información del trayecto y condiciones de acceso</p>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Medio de Transporte *</label>
              <select
                className="form-select"
                value={formRuta.medio_transporte}
                onChange={(e) => setFormRuta({ ...formRuta, medio_transporte: e.target.value })}
                required
              >
                <option value="">-- Selecciona --</option>
                <option value="Terrestre">Terrestre</option>
                <option value="Fluvial">Fluvial</option>
                <option value="Aéreo">Aéreo</option>
                <option value="Mixto">Mixto</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tiempo de Acceso (HH:MM) *</label>
              <input
                type="time"
                className="form-input"
                value={formRuta.tiempo_acceso}
                onChange={(e) => setFormRuta({ ...formRuta, tiempo_acceso: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Distancia (Km con 1 decimal) *</label>
              <input
                type="number"
                className="form-input"
                step="0.1"
                min="0"
                placeholder="Ej: 15.5"
                value={formRuta.distancia_km}
                onChange={(e) => setFormRuta({ ...formRuta, distancia_km: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

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
              <h2>Puntos de Referencia</h2>
              <p>Mínimo 4 puntos georreferenciados en el trayecto</p>
            </div>
            <button type="button" onClick={agregarPunto} className="btn-secondary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Agregar Punto
            </button>
          </div>

          <div className="puntos-grid">
            {puntosReferencia.map((punto, index) => (
              <div key={index} className="punto-card">
                <div className="punto-header">
                  <div className="punto-number">{index + 1}</div>
                  <h4>Punto de Referencia {index + 1}</h4>
                </div>
                
                <div className="form-group">
                  <label className="form-label">Nombre del Punto *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Árbol grande, Roca marcada, Cruce de ríos"
                    value={punto.nombre_punto}
                    onChange={(e) => actualizarPunto(index, 'nombre_punto', e.target.value)}
                  />
                </div>

                <CoordenadasInput
                  label="Latitud"
                  value={punto.latitud}
                  onChange={(valor) => actualizarPunto(index, 'latitud', valor)}
                  tipo="lat"
                  required
                />

                <CoordenadasInput
                  label="Longitud"
                  value={punto.longitud}
                  onChange={(valor) => actualizarPunto(index, 'longitud', valor)}
                  tipo="lon"
                  required
                />

                <div className="form-group">
                  <label className="form-label">Error GPS (metros) *</label>
                  <input
                    type="number"
                    className="form-input"
                    step="0.1"
                    min="0"
                    placeholder="Ej: 3.5"
                    value={punto.error_gps_m}
                    onChange={(e) => actualizarPunto(index, 'error_gps_m', e.target.value)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="form-actions">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="animate-spin">
                  <line x1="12" y1="2" x2="12" y2="6" />
                  <line x1="12" y1="18" x2="12" y2="22" />
                  <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                  <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                  <line x1="2" y1="12" x2="6" y2="12" />
                  <line x1="18" y1="12" x2="22" y2="12" />
                  <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                  <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Registrar Ruta
              </>
            )}
          </button>
        </div>
      </form>

      {/* Rutas Registradas */}
      {rutas.length > 0 && (
        <div className="section">
          <div className="section-header">
            <div className="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
              </svg>
            </div>
            <div>
              <h2>Rutas Registradas</h2>
              <p>Historial de rutas de acceso documentadas</p>
            </div>
          </div>
          
          <div className="rutas-registradas">
            {rutas.map(ruta => (
              <div key={ruta.id} className="ruta-card">
                <div className="ruta-card-header">
                  <div className="ruta-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      {ruta.tipo_ruta === 'campamento' ? (
                        <>
                          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                          <polyline points="9 22 9 12 15 12 15 22" />
                        </>
                      ) : (
                        <>
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </>
                      )}
                    </svg>
                  </div>
                  <h3>
                    {ruta.tipo_ruta === 'campamento' ? 'F1.2 - Ruta al Campamento' : 'F1.3 - Ruta al Conglomerado'}
                  </h3>
                </div>
                <div className="ruta-info">
                  <div className="info-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 17h14v-2H5z" />
                      <path d="M16 11h5l-1.405-1.405A2.032 2.032 0 0018 8.158V6a1 1 0 00-1-1h-3a1 1 0 00-1 1v2.158c0 .538-.214 1.055-.595 1.437L11 11" />
                      <circle cx="7" cy="17" r="2" />
                      <circle cx="17" cy="17" r="2" />
                    </svg>
                    <span><strong>Medio:</strong> {ruta.medio_transporte}</span>
                  </div>
                  <div className="info-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span><strong>Tiempo:</strong> {ruta.tiempo_acceso}</span>
                  </div>
                  <div className="info-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                    <span><strong>Distancia:</strong> {ruta.distancia_km} km</span>
                  </div>
                  <div className="info-item">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span><strong>Puntos:</strong> {ruta.puntos_referencia?.length || 0}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}