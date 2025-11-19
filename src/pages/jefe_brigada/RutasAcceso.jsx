// src/pages/jefe_brigada/RutasAcceso.jsx
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { brigadasService } from '../../services/brigadasService';
import CoordenadasInput from '../../components/common/CoordenadasInput';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import LeafletMapComponent from '../../components/common/LeafletMapComponent';
import './RutasAcceso.css';

export default function RutasAcceso() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const brigada_id = searchParams.get('brigada');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [tabActiva, setTabActiva] = useState('campamento');
  const [brigada, setBrigada] = useState(null);
  const [rutas, setRutas] = useState([]);
  
  const getStorageKey = (tipo) => `ruta_${tipo}_${brigada_id}`;
  
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
    const savedData = localStorage.getItem(getStorageKey(tabActiva));
    if (savedData) {
      try {
        const parsed = JSON.parse(savedData);
        setFormRuta(prev => ({ ...prev, ...parsed.formRuta, tipo_ruta: tabActiva }));
        setPuntosReferencia(parsed.puntosReferencia);
        console.log('✅ Datos restaurados desde localStorage para:', tabActiva);
      } catch (e) {
        console.error('Error parseando localStorage:', e);
      }
    } else {
      setFormRuta({
        tipo_ruta: tabActiva,
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
    }
  }, [tabActiva, brigada_id]);

  useEffect(() => {
    if (brigada_id && (formRuta.medio_transporte || puntosReferencia.some(p => p.nombre_punto))) {
      const dataToSave = {
        formRuta: {
          medio_transporte: formRuta.medio_transporte,
          tiempo_acceso: formRuta.tiempo_acceso,
          distancia_km: formRuta.distancia_km
        },
        puntosReferencia
      };
      localStorage.setItem(getStorageKey(tabActiva), JSON.stringify(dataToSave));
    }
  }, [formRuta.medio_transporte, formRuta.tiempo_acceso, formRuta.distancia_km, puntosReferencia, tabActiva, brigada_id]);

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

  const cambiarTab = (nuevoTipo) => {
    setTabActiva(nuevoTipo);
    setFormRuta({ ...formRuta, tipo_ruta: nuevoTipo });
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

  const eliminarPunto = (index) => {
    if (puntosReferencia.length <= 4) {
      setError('Debes mantener al menos 4 puntos de referencia');
      return;
    }
    const nuevos = puntosReferencia.filter((_, i) => i !== index);
    setPuntosReferencia(nuevos);
  };

  const dmsADecimal = (dms) => {
    if (!dms) return null;
    const match = dms.match(/^(\d+)°(\d+)'([\d.]+)"([NSEW])$/);
    if (!match) return null;
    
    const [, grados, minutos, segundos, direccion] = match;
    let decimal = parseFloat(grados) + parseFloat(minutos) / 60 + parseFloat(segundos) / 3600;
    
    if (direccion === 'S' || direccion === 'W') {
      decimal = -decimal;
    }
    
    return decimal;
  };

  // ✅ Preparar TODOS los puntos para el mapa (viejos + nuevos)
  const prepararTodosPuntosParaMapa = () => {
    const rutaActual = rutas.find(r => r.tipo_ruta === tabActiva);
    const puntosViejos = rutaActual?.puntos_referencia || [];
    
    // Puntos existentes (viejos)
    const puntosExistentes = puntosViejos.map((p, index) => ({
      subparcela_num: index + 1,
      latitud_prediligenciada: dmsADecimal(p.latitud),
      longitud_prediligenciada: dmsADecimal(p.longitud),
      nombre_punto: p.nombre_punto || `Punto ${index + 1}`,
      se_establecio: true,
      esViejo: true
    })).filter(p => p.latitud_prediligenciada !== null && p.longitud_prediligenciada !== null);
    
    // Puntos nuevos (del formulario)
    const puntosNuevos = puntosReferencia
      .filter(p => p.latitud && p.longitud)
      .map((p, index) => ({
        subparcela_num: puntosExistentes.length + index + 1,
        latitud_prediligenciada: dmsADecimal(p.latitud),
        longitud_prediligenciada: dmsADecimal(p.longitud),
        nombre_punto: p.nombre_punto || `Punto Nuevo ${index + 1}`,
        se_establecio: false,
        esViejo: false
      }))
      .filter(p => p.latitud_prediligenciada !== null && p.longitud_prediligenciada !== null);
    
    return [...puntosExistentes, ...puntosNuevos];
  };

  const registrarRuta = async (e) => {
    e.preventDefault();
    
    const puntosCompletos = puntosReferencia.filter(p => 
      p.nombre_punto && 
      p.latitud && 
      p.longitud && 
      p.error_gps_m
    );
    
    if (puntosCompletos.length === 0) {
      setError('Debes completar al menos 1 punto para continuar');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      // ✅ Verificar si la ruta ya existe
      let ruta_id;
      const rutaExistente = rutas.find(r => r.tipo_ruta === formRuta.tipo_ruta);
      
      if (rutaExistente) {
        console.log('⚠️ Ruta ya existe, agregando puntos a:', rutaExistente.id);
        ruta_id = rutaExistente.id;
      } else {
        // Crear ruta nueva
        const rutaRes = await brigadasService.crearRuta(brigada_id, {
          tipo_ruta: formRuta.tipo_ruta,
          medio_transporte: formRuta.medio_transporte || 'Sin especificar',
          tiempo_acceso: formRuta.tiempo_acceso || '00:00',
          distancia_km: parseFloat(formRuta.distancia_km) || 0
        });
        
        ruta_id = rutaRes.data.id || rutaRes.data.data?.id;
        console.log('✅ Ruta creada con ID:', ruta_id);
      }
      
      if (!ruta_id) {
        throw new Error('No se pudo obtener el ID de la ruta');
      }
      
      // Agregar puntos
      for (const punto of puntosCompletos) {
        await brigadasService.agregarPuntoReferencia(ruta_id, {
          nombre_punto: punto.nombre_punto,
          latitud: String(punto.latitud),
          longitud: String(punto.longitud),
          error_gps_m: parseFloat(punto.error_gps_m) || 0
        });
      }
      
      setSuccess(`${puntosCompletos.length} puntos agregados exitosamente a la ruta ${formRuta.tipo_ruta}`);
      
      localStorage.removeItem(getStorageKey(formRuta.tipo_ruta));
      setPuntosReferencia([
        { nombre_punto: '', latitud: '', longitud: '', error_gps_m: '' },
        { nombre_punto: '', latitud: '', longitud: '', error_gps_m: '' },
        { nombre_punto: '', latitud: '', longitud: '', error_gps_m: '' },
        { nombre_punto: '', latitud: '', longitud: '', error_gps_m: '' }
      ]);
      
      await cargarBrigada();
      
      // Auto-cambiar a conglomerado si completaste campamento
      if (formRuta.tipo_ruta === 'campamento') {
        setTimeout(() => {
          cambiarTab('conglomerado');
          setSuccess('');
        }, 2000);
      }
    } catch (err) {
      console.error('❌ Error registrando ruta:', err);
      setError(err.response?.data?.error || err.message || 'Error al registrar ruta');
    } finally {
      setLoading(false);
    }
  };

  const iniciarEjecucion = async () => {
    if (!window.confirm('¿Confirmas que ambas rutas están completas y deseas iniciar la ejecución en campo?')) return;

    try {
      setLoading(true);
      setError('');
      
      await brigadasService.cambiarEstado(brigada_id, 'en_ejecucion');
      
      setSuccess('Brigada en ejecución. Redirigiendo...');
      setTimeout(() => {
        navigate(`/jefe-brigada/mis-misiones?brigada=${brigada_id}`);
      }, 2000);
    } catch (err) {
      console.error('Error cambiando estado:', err);
      setError(err.response?.data?.error || 'Error cambiando estado');
    } finally {
      setLoading(false);
    }
  };

  if (!brigada_id) {
    return (
      <div className="empty-state-page">
        <div className="empty-state-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
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

  // Validaciones
  const rutaCampamento = rutas.find(r => r.tipo_ruta === 'campamento');
  const rutaConglomerado = rutas.find(r => r.tipo_ruta === 'conglomerado');

  const campamentoCompleto = rutaCampamento && 
    Array.isArray(rutaCampamento.puntos_referencia) && 
    rutaCampamento.puntos_referencia.length >= 4;

  const conglomeradoCompleto = rutaConglomerado && 
    Array.isArray(rutaConglomerado.puntos_referencia) && 
    rutaConglomerado.puntos_referencia.length >= 4;

  const ambasRutasCompletas = campamentoCompleto && conglomeradoCompleto;
  
  // ✅ Preparar puntos para el mapa (viejos + nuevos)
  const todosPuntosMapa = prepararTodosPuntosParaMapa();
  const centroPuntos = todosPuntosMapa.length > 0 
    ? {
        lat: todosPuntosMapa.reduce((sum, p) => sum + p.latitud_prediligenciada, 0) / todosPuntosMapa.length,
        lng: todosPuntosMapa.reduce((sum, p) => sum + p.longitud_prediligenciada, 0) / todosPuntosMapa.length
      }
    : null;
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

      <div className="tabs-container">
        <button
          className={`tab ${tabActiva === 'campamento' ? 'active' : ''} ${campamentoCompleto ? 'completed' : ''}`}
          onClick={() => cambiarTab('campamento')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <div>
            <span className="tab-title">F1.2 - Ruta al Campamento</span>
            {campamentoCompleto && (
              <span className="tab-status">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Completada ({rutaCampamento.puntos_referencia.length} puntos)
              </span>
            )}
          </div>
        </button>

        <button
          className={`tab ${tabActiva === 'conglomerado' ? 'active' : ''} ${conglomeradoCompleto ? 'completed' : ''}`}
          onClick={() => cambiarTab('conglomerado')}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <div>
            <span className="tab-title">F1.3 - Ruta al Conglomerado</span>
            {conglomeradoCompleto ? (
              <span className="tab-status">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                Completada ({rutaConglomerado.puntos_referencia.length} puntos)
              </span>
            ) : null}
          </div>
        </button>
      </div>

      {/* ✅ MAPA SIEMPRE VISIBLE CON TODOS LOS PUNTOS */}
      {todosPuntosMapa.length > 0 && centroPuntos && (
        <div className="section mapa-section">
          <div className="section-header">
            <div className="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div>
              <h2>Vista de la Ruta {tabActiva === 'campamento' ? 'Campamento' : 'Conglomerado'}</h2>
              <p>Puntos guardados: {rutas.find(r => r.tipo_ruta === tabActiva)?.puntos_referencia?.length || 0} | Puntos nuevos: {puntosReferencia.filter(p => p.latitud && p.longitud).length}</p>
            </div>
          </div>
          
          <LeafletMapComponent
            latitud={centroPuntos.lat}
            longitud={centroPuntos.lng}
            codigo={`Ruta ${tabActiva === 'campamento' ? 'Campamento' : 'Conglomerado'}`}
            subparcelas={todosPuntosMapa}
            zoom={12}
            height="400px"
          />
        </div>
      )}

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
              <p>Información del trayecto {tabActiva === 'campamento' ? 'al Campamento' : 'al Conglomerado'}</p>
            </div>
          </div>
          
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Medio de Transporte</label>
              <select
                className="form-select"
                value={formRuta.medio_transporte}
                onChange={(e) => setFormRuta({ ...formRuta, medio_transporte: e.target.value })}
              >
                <option value="">-- Selecciona --</option>
                <option value="Terrestre">Terrestre</option>
                <option value="Fluvial">Fluvial</option>
                <option value="Aéreo">Aéreo</option>
                <option value="Mixto">Mixto</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Tiempo de Acceso (HH:MM)</label>
              <input
                type="time"
                className="form-input"
                value={formRuta.tiempo_acceso}
                onChange={(e) => setFormRuta({ ...formRuta, tiempo_acceso: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Distancia (Km)</label>
              <input
                type="number"
                className="form-input"
                step="0.1"
                min="0"
                placeholder="Ej: 15.5"
                value={formRuta.distancia_km}
                onChange={(e) => setFormRuta({ ...formRuta, distancia_km: e.target.value })}
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
              <h2>Agregar Nuevos Puntos</h2>
              <p>Los puntos ya guardados aparecen en el mapa arriba</p>
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
                  <h4>Punto Nuevo {index + 1}</h4>
                  {index >= 4 && (
                    <button
                      type="button"
                      onClick={() => eliminarPunto(index)}
                      className="btn-delete-small"
                      title="Eliminar punto"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18" />
                        <line x1="6" y1="6" x2="18" y2="18" />
                      </svg>
                    </button>
                  )}
                </div>
                
                <div className="form-group">
                  <label className="form-label">Nombre del Punto</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Árbol grande, Roca marcada"
                    value={punto.nombre_punto}
                    onChange={(e) => actualizarPunto(index, 'nombre_punto', e.target.value)}
                  />
                </div>

                <CoordenadasInput
                  label="Latitud"
                  value={punto.latitud}
                  onChange={(valor) => actualizarPunto(index, 'latitud', valor)}
                  tipo="lat"
                  onUbicacionCapturada={(ubicacion) => {
                    const nuevos = [...puntosReferencia];
                    nuevos[index] = {
                      ...nuevos[index],
                      latitud: ubicacion.latitud,
                      longitud: ubicacion.longitud,
                      error_gps_m: ubicacion.error_gps_m
                    };
                    setPuntosReferencia(nuevos);
                  }}
                />

                <CoordenadasInput
                  label="Longitud"
                  value={punto.longitud}
                  onChange={(valor) => actualizarPunto(index, 'longitud', valor)}
                  tipo="lon"
                />

                <div className="form-group">
                  <label className="form-label">Error GPS (metros)</label>
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
                Guardar Puntos
              </>
            )}
          </button>
        </div>
      </form>

      {ambasRutasCompletas && brigada?.estado === 'en_transito' && (
        <div className="section section-success">
          <div className="section-header">
            <div className="section-icon icon-success">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div>
              <h2>Rutas Completas</h2>
              <p>Las rutas al Campamento y al Conglomerado están registradas. Puedes iniciar la ejecución en campo.</p>
            </div>
            <button onClick={iniciarEjecucion} disabled={loading} className="btn-success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
              Iniciar Ejecución
            </button>
          </div>
        </div>
      )}
    </div>
  );
}