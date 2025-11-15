// src/pages/jefe_brigada/RutasAcceso.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { brigadasService } from '../../services/brigadasService';
import CoordenadasInput from '../../components/CoordenadasInput';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

export default function RutasAcceso() {
  const [searchParams] = useSearchParams();
  const brigada_id = searchParams.get('brigada');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [tabActiva, setTabActiva] = useState('campamento'); // campamento | conglomerado
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
    
    // Validaciones
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
      
      // 1. Crear ruta
      const rutaRes = await brigadasService.crearRuta(brigada_id, {
        tipo_ruta: formRuta.tipo_ruta,
        medio_transporte: formRuta.medio_transporte,
        tiempo_acceso: formRuta.tiempo_acceso,
        distancia_km: parseFloat(formRuta.distancia_km)
      });
      
      const ruta_id = rutaRes.data.id;
      
      // 2. Agregar puntos de referencia
      for (const punto of puntosValidos) {
        await brigadasService.agregarPuntoReferencia(ruta_id, {
          nombre_punto: punto.nombre_punto,
          latitud: punto.latitud,
          longitud: punto.longitud,
          error_gps_m: parseFloat(punto.error_gps_m)
        });
      }
      
      setSuccess(`Ruta ${formRuta.tipo_ruta} registrada exitosamente`);
      
      // Reset form
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
        <h2>⚠️ Error</h2>
        <p>No se especificó ID de brigada</p>
      </div>
    );
  }

  if (loading && !brigada) return <LoadingSpinner mensaje="Cargando..." />;
  if (error && !brigada) return <ErrorAlert mensaje={error} onRetry={cargarBrigada} />;
  if (!brigada) return null;

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
        <div className="alert-success">
          ✅ {success}
          <button onClick={() => setSuccess('')}>✕</button>
        </div>
      )}

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab ${tabActiva === 'campamento' ? 'active' : ''}`}
          onClick={() => {
            setTabActiva('campamento');
            setFormRuta({ ...formRuta, tipo_ruta: 'campamento' });
          }}
        >
          F1.2 - Ruta al Campamento {rutaCampamento && '✓'}
        </button>
        <button
          className={`tab ${tabActiva === 'conglomerado' ? 'active' : ''}`}
          onClick={() => {
            setTabActiva('conglomerado');
            setFormRuta({ ...formRuta, tipo_ruta: 'conglomerado' });
          }}
        >
          F1.3 - Ruta al Conglomerado {rutaConglomerado && '✓'}
        </button>
      </div>

      {/* Formulario */}
      <form onSubmit={registrarRuta} className="form-rutas">
        <div className="section">
          <h2>Datos de la Ruta</h2>
          
          <div className="form-row">
            <div className="form-group">
              <label>Medio de Transporte *</label>
              <select
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
              <label>Tiempo de Acceso (HH:MM) *</label>
              <input
                type="time"
                value={formRuta.tiempo_acceso}
                onChange={(e) => setFormRuta({ ...formRuta, tiempo_acceso: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label>Distancia (Km con 1 decimal) *</label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formRuta.distancia_km}
                onChange={(e) => setFormRuta({ ...formRuta, distancia_km: e.target.value })}
                required
              />
            </div>
          </div>
        </div>

        <div className="section">
          <div className="section-header">
            <h2>Puntos de Referencia (Mínimo 4)</h2>
            <button type="button" onClick={agregarPunto} className="btn-secondary">
              ➕ Agregar Punto
            </button>
          </div>

          <div className="puntos-grid">
            {puntosReferencia.map((punto, index) => (
              <div key={index} className="punto-card">
                <h4>Punto de Referencia {index + 1}</h4>
                
                <div className="form-group">
                  <label>Nombre del Punto *</label>
                  <input
                    type="text"
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
                  <label>Error GPS (metros) *</label>
                  <input
                    type="number"
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
            {loading ? 'Guardando...' : 'Registrar Ruta'}
          </button>
        </div>
      </form>

      {/* Rutas Registradas */}
      {rutas.length > 0 && (
        <div className="section">
          <h2>Rutas Registradas</h2>
          <div className="rutas-registradas">
            {rutas.map(ruta => (
              <div key={ruta.id} className="ruta-card">
                <h3>
                  {ruta.tipo_ruta === 'campamento' ? 'F1.2 - Ruta al Campamento' : 'F1.3 - Ruta al Conglomerado'}
                </h3>
                <div className="ruta-info">
                  <p><strong>Medio:</strong> {ruta.medio_transporte}</p>
                  <p><strong>Tiempo:</strong> {ruta.tiempo_acceso}</p>
                  <p><strong>Distancia:</strong> {ruta.distancia_km} km</p>
                  <p><strong>Puntos de Referencia:</strong> {ruta.puntos_referencia?.length || 0}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}