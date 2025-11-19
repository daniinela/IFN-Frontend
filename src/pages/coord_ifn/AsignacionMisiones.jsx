// src/pages/coord_ifn/AsignacionMisiones.jsx
import { useState, useEffect } from 'react';
import { conglomeradosService } from '../../services/conglomeradosService';
import { usuariosService } from '../../services/usuariosService';
import { geoService } from '../../services/geoService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import './AsignacionMisiones.css';

export default function AsignacionMisiones() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [conglomeradosListos, setConglomeradosListos] = useState([]);
  const [jefesBrigada, setJefesBrigada] = useState([]);
  
  // 🆕 Cache de nombres geográficos
  const [departamentosCache, setDepartamentosCache] = useState({});
  const [municipiosCache, setMunicipiosCache] = useState({});
  
  const [showModalAsignar, setShowModalAsignar] = useState(false);
  const [conglomeradoSeleccionado, setConglomeradoSeleccionado] = useState(null);
  const [jefeSeleccionado, setJefeSeleccionado] = useState('');

  useEffect(() => {
    cargarConglomeradosListos();
  }, []);

  const cargarConglomeradosListos = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await conglomeradosService.getByEstado('listo_para_asignacion');
      setConglomeradosListos(response.data);
    } catch (err) {
      console.error('Error cargando conglomerados:', err);
      setError(err.response?.data?.error || 'Error al cargar conglomerados');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Función para obtener nombre del departamento
  const obtenerNombreDepartamento = async (departamento_id) => {
    if (!departamento_id) return 'N/A';
    
    // Revisar cache primero
    if (departamentosCache[departamento_id]) {
      return departamentosCache[departamento_id];
    }
    
    try {
      const response = await geoService.getDepartamentoById(departamento_id);
      const nombre = response.data.nombre;
      
      // Guardar en cache
      setDepartamentosCache(prev => ({ ...prev, [departamento_id]: nombre }));
      
      return nombre;
    } catch (err) {
      console.error('Error obteniendo departamento:', err);
      return departamento_id; // Fallback al ID
    }
  };

  // 🆕 Función para obtener nombre del municipio
  const obtenerNombreMunicipio = async (municipio_id) => {
    if (!municipio_id) return 'N/A';
    
    if (municipiosCache[municipio_id]) {
      return municipiosCache[municipio_id];
    }
    
    try {
      const response = await geoService.getMunicipioById(municipio_id);
      const nombre = response.data.nombre;
      
      setMunicipiosCache(prev => ({ ...prev, [municipio_id]: nombre }));
      
      return nombre;
    } catch (err) {
      console.error('Error obteniendo municipio:', err);
      return municipio_id;
    }
  };

const cargarJefesBrigada = async (conglomerado = null) => {
  try {
    setLoading(true);
    const filtros = {
      rol_codigo: 'JEFE_BRIGADA',
      activo: true,
      solo_aprobados: true
    };
    
    const conglo = conglomerado || conglomeradoSeleccionado;
    
    if (conglo) {
      if (conglo.municipio_id) {
        filtros.municipio_id = conglo.municipio_id;
      } else if (conglo.departamento_id) {
        filtros.departamento_id = conglo.departamento_id;
      } else if (conglo.region_id) {
        filtros.region_id = conglo.region_id;
      }
    }
    
    const response = await usuariosService.getJefesBrigadaDisponibles(filtros);
    
    console.log('📦 Respuesta completa:', response.data);
    
    // ✅ FIX 1: Detectar formato del array correctamente
    const jefesData = Array.isArray(response.data) 
      ? response.data 
      : (response.data?.data || []);
    
    console.log('👥 Array de jefes:', jefesData);
    
    // 🆕 Enriquecer con nombres de ubicación
    const jefesConCarga = await Promise.all(
      jefesData.map(async (cuentaRol) => {
        try {
          // ✅ FIX 2: Validar que usuarios existe antes de acceder a id
          if (!cuentaRol?.usuarios?.id) {
            console.warn('⚠️ Jefe sin usuario válido:', cuentaRol);
            return null;
          }
          
          const conglosResponse = await conglomeradosService.getAll(1, 999, '');
          const conglosAsignados = conglosResponse.data.data.filter(
            c => c.jefe_brigada_asignado_id === cuentaRol.usuarios.id
          );
          
          // 🆕 Obtener nombres
          const nombreDepartamento = await obtenerNombreDepartamento(cuentaRol.departamento_id);
          const nombreMunicipio = await obtenerNombreMunicipio(cuentaRol.municipio_id);
          
          return {
            ...cuentaRol,
            carga_trabajo: conglosAsignados.length,
            nombre_completo: cuentaRol.usuarios.nombre_completo || 'Sin nombre',
            departamento_nombre: nombreDepartamento,
            municipio_nombre: nombreMunicipio,
            ubicacion: {
              region_id: cuentaRol.region_id,
              departamento_id: cuentaRol.departamento_id,
              municipio_id: cuentaRol.municipio_id
            }
          };
        } catch (err) {
          console.error('❌ Error enriqueciendo jefe:', err);
          
          // ✅ FIX 3: Validar usuarios en el catch también
          if (!cuentaRol?.usuarios) {
            return null;
          }
          
          return {
            ...cuentaRol,
            carga_trabajo: 0,
            nombre_completo: cuentaRol.usuarios.nombre_completo || 'Sin nombre',
            departamento_nombre: 'N/A',
            municipio_nombre: 'N/A',
            ubicacion: {
              region_id: cuentaRol.region_id,
              departamento_id: cuentaRol.departamento_id,
              municipio_id: cuentaRol.municipio_id
            }
          };
        }
      })
    );

    // Filtrar nulls antes de ordenar
    const jefesFiltrados = jefesConCarga.filter(jefe => jefe !== null);
    jefesFiltrados.sort((a, b) => a.carga_trabajo - b.carga_trabajo);
    
    console.log('✅ Jefes enriquecidos:', jefesFiltrados.length);
    setJefesBrigada(jefesFiltrados);
  } catch (err) {
    console.error('❌ Error cargando jefes:', err);
    setError('Error al cargar jefes de brigada disponibles');
  } finally {
    setLoading(false);
  }
};

  const abrirModalAsignar = (conglomerado) => {
    setConglomeradoSeleccionado(conglomerado);
    setJefeSeleccionado('');
    setShowModalAsignar(true);
    cargarJefesBrigada(conglomerado);
  };

  const asignarConglomerado = async () => {
    if (!jefeSeleccionado) {
      setError('Debes seleccionar un jefe de brigada');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await conglomeradosService.asignarAJefe(
        conglomeradoSeleccionado.id, 
        jefeSeleccionado
      );
      
      setSuccess('Conglomerado asignado exitosamente');
      setShowModalAsignar(false);
      setConglomeradoSeleccionado(null);
      setJefeSeleccionado('');
      
      cargarConglomeradosListos();
      cargarJefesBrigada();
    } catch (err) {
      console.error('Error asignando:', err);
      setError(err.response?.data?.error || 'Error al asignar conglomerado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="asignacion-misiones">
      <div className="page-header">
        <div>
          <h1>Asignación de Misiones</h1>
          <p>Asignar conglomerados a jefes de brigada</p>
        </div>
        <div className="header-stats">
          <div className="stat-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            <div>
              <span className="stat-label">Pendientes:</span>
              <span className="stat-value">{conglomeradosListos.length}</span>
            </div>
          </div>
          <div className="stat-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <div>
              <span className="stat-label">Jefes Disponibles:</span>
              <span className="stat-value">{jefesBrigada.length}</span>
            </div>
          </div>
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

      {loading && <LoadingSpinner mensaje="Cargando..." />}

      {!loading && conglomeradosListos.length === 0 ? (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 11l3 3L22 4" />
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
          </svg>
          <h3>No hay conglomerados pendientes de asignación</h3>
          <p>Todos los conglomerados aprobados han sido asignados</p>
        </div>
      ) : (
        <div className="conglomerados-grid">
          {conglomeradosListos.map(cong => (
            <div key={cong.id} className="conglomerado-card">
              <div className="card-header">
                <h3>{cong.codigo}</h3>
                <span className="badge-estado listo">Listo</span>
              </div>
              
              <div className="card-body">
                <div className="info-row">
                  <span className="label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Latitud:
                  </span>
                  <span className="value">{cong.latitud}</span>
                </div>
                <div className="info-row">
                  <span className="label">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    Longitud:
                  </span>
                  <span className="value">{cong.longitud}</span>
                </div>
              </div>
              
              <div className="card-footer">
                <button 
                  onClick={() => abrirModalAsignar(cong)}
                  className="btn-primary-full"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                  Asignar Jefe de Brigada
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Asignación */}
      {showModalAsignar && conglomeradoSeleccionado && (
        <div className="modal-overlay" onClick={() => setShowModalAsignar(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Asignar Conglomerado: {conglomeradoSeleccionado.codigo}</h3>
              <button onClick={() => setShowModalAsignar(false)} className="modal-close">✕</button>
            </div>
            
            <div className="modal-body">
              <div className="conglomerado-info">
                <div className="info-item">
                  <label>Código:</label>
                  <span>{conglomeradoSeleccionado.codigo}</span>
                </div>
                <div className="info-item">
                  <label>Ubicación:</label>
                  <span>{conglomeradoSeleccionado.latitud}, {conglomeradoSeleccionado.longitud}</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Seleccionar Jefe de Brigada *</label>
                <select
                  value={jefeSeleccionado}
                  onChange={(e) => setJefeSeleccionado(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Selecciona un jefe --</option>
                  {jefesBrigada.map(jefe => (
                    <option key={jefe.usuarios.id} value={jefe.usuarios.id}>
                      {jefe.nombre_completo} - Carga: {jefe.carga_trabajo} conglomerados
                      {jefe.departamento_nombre && ` - ${jefe.departamento_nombre}`}
                      {jefe.municipio_nombre && jefe.municipio_nombre !== 'N/A' && `, ${jefe.municipio_nombre}`}
                    </option>
                  ))}
                </select>
              </div>

              {jefeSeleccionado && (
                <div className="alert alert-info">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  Se creará automáticamente la brigada en estado "formación"
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowModalAsignar(false)} className="btn-cancel">
                Cancelar
              </button>
              <button 
                onClick={asignarConglomerado} 
                disabled={loading || !jefeSeleccionado}
                className="btn-primary"
              >
                {loading ? 'Asignando...' : 'Confirmar Asignación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}