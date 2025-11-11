// src/pages/superadmin/GenerarYasignar.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import axios from '../../api/axiosConfig';
import './GenerarYAsignar.css';

function GenerarYAsignar() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('estado');
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Estado para sistema
  const [estadisticasGenerales, setEstadisticasGenerales] = useState({
    total: 0,
    sin_asignar: 0,
    en_revision: 0,
    aprobado: 0,
    rechazado_permanente: 0,
    vencidos: 0
  });
  
  // Estado para asignar
  const [coordinadores, setCoordinadores] = useState([]);
  const [coordSeleccionado, setCoordSeleccionado] = useState('');
  const [cantidadAsignar, setCantidadAsignar] = useState(50);
  const [plazoDias, setPlazoDias] = useState(30);
  
  // Estado para ver todos (paginación)
  const [conglomerados, setConglomerados] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  // Obtener usuario actual
  useEffect(() => {
    const obtenerUsuarioActual = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setCurrentUserId(session.user.id);
        }
      } catch (error) {
        console.error('Error obteniendo usuario:', error);
      }
    };
    
    obtenerUsuarioActual();
  }, []);

  // Función para cargar estadísticas
  const cargarEstadisticas = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/conglomerados/estadisticas');
      setEstadisticasGenerales(response.data);
    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setError('Error al cargar estadísticas del sistema');
    }
  };

  useEffect(() => {
    const cargarDatosPorTab = async () => {
      if (activeTab === 'estado') {
        await cargarEstadisticas();
      } else if (activeTab === 'asignar') {
        await cargarCoordinadores();
      } else if (activeTab === 'ver') {
        await cargarConglomerados();
      }
    };
    
    cargarDatosPorTab();
  }, [activeTab, page, filtroEstado, busqueda]);

  // Cargar estadísticas al montar el componente
  useEffect(() => {
    cargarEstadisticas();
  }, []);

  // ✅ CORREGIDO: Cargar coordinadores desde usuarios-service con filtro correcto
  const cargarCoordinadores = async () => {
    try {
      setLoading(true);
      
      // ✅ Llamar al microservicio de usuarios (puerto 3000)
      const response = await axios.get('http://localhost:3000/api/cuentas-rol', {
        params: {
          rol_codigo: 'coord_georef',
          activo: true
        }
      });
      
      // ✅ Obtener datos completos de cada usuario
      const coordsConUsuarios = await Promise.all(
        response.data.map(async (cuentaRol) => {
          try {
            const userRes = await axios.get(`http://localhost:3000/api/usuarios/${cuentaRol.usuario_id}`);
            return {
              id: cuentaRol.usuario_id,
              nombre_completo: userRes.data.nombre_completo,
              email: userRes.data.email,
              cuenta_rol_id: cuentaRol.id
            };
          } catch (error) {
            console.error(`Error cargando usuario ${cuentaRol.usuario_id}:`, error);
            return null;
          }
        })
      );
      
      // Filtrar nulls
      setCoordinadores(coordsConUsuarios.filter(c => c !== null));
    } catch (error) {
      console.error('Error cargando coordinadores:', error);
      setError('Error al cargar coordinadores de georreferenciación');
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORREGIDO: El backend ya filtra por usuario automáticamente
  const cargarConglomerados = async () => {
    try {
      setLoading(true);
      
      const params = {
        page,
        limit: 50,
        busqueda
      };
      
      if (filtroEstado !== 'todos') {
        params.estado = filtroEstado;
      }
      
      // ✅ El JWT en headers contiene user_id, el backend filtra automáticamente
      const response = await axios.get('http://localhost:3001/api/conglomerados', {
        params
      });
      
      setConglomerados(response.data.data || []);
      setTotalPages(response.data.totalPages || Math.ceil((response.data.total || 0) / 50));
    } catch (error) {
      console.error('Error cargando conglomerados:', error);
      setError('Error al cargar conglomerados');
    } finally {
      setLoading(false);
    }
  };

  // ✅ NUEVO: Inicializar sistema (solo si total === 0)
  const inicializarSistema = async () => {
    if (!window.confirm('⚠️ ¿Inicializar sistema con 1500 conglomerados?\n\nEsta acción solo se hace UNA VEZ y no se puede revertir.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await axios.post('http://localhost:3001/api/conglomerados/generar-batch', {
        cantidad: 1500
      });

      setSuccess('✅ Sistema inicializado: 1500 conglomerados generados exitosamente');
      
      await cargarEstadisticas();
    } catch (error) {
      console.error('Error inicializando sistema:', error);
      setError(error.response?.data?.error || 'Error al inicializar sistema');
    } finally {
      setLoading(false);
    }
  };

  // ✅ CORREGIDO: Validación anti-auto-asignación
  const asignarLote = async () => {
    if (!coordSeleccionado) {
      setError('Debes seleccionar un coordinador');
      return;
    }

    // ✅ VALIDACIÓN CRÍTICA: No auto-asignarse
    if (coordSeleccionado === currentUserId) {
      setError('⛔ No puedes asignarte conglomerados a ti mismo');
      return;
    }

    if (cantidadAsignar < 1 || cantidadAsignar > 200) {
      setError('La cantidad a asignar debe estar entre 1 y 200');
      return;
    }

    if (plazoDias < 1 || plazoDias > 90) {
      setError('El plazo debe estar entre 1 y 90 días');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await axios.post('http://localhost:3001/api/conglomerados/asignar-a-coordinador', {
        coord_id: coordSeleccionado,
        cantidad: cantidadAsignar,
        plazo_dias: plazoDias
      });

      setSuccess(`✅ Lote de ${cantidadAsignar} conglomerados asignado exitosamente`);
      setCoordSeleccionado('');
      setCantidadAsignar(50);
      setPlazoDias(30);
      
      await cargarEstadisticas();
    } catch (error) {
      console.error('Error asignando:', error);
      setError(error.response?.data?.error || 'Error al asignar lote');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      sin_asignar: { class: 'badge-gray', text: 'Sin Asignar' },
      en_revision: { class: 'badge-blue', text: 'En Revisión' },
      aprobado: { class: 'badge-green', text: 'Aprobado' },
      rechazado_temporal: { class: 'badge-yellow', text: 'Rechazado Temporal' },
      rechazado_permanente: { class: 'badge-red', text: 'Rechazado Permanente' }
    };
    return badges[estado] || { class: 'badge-gray', text: estado };
  };

  // ✅ NUEVO: Tab "Estado del Sistema" (reemplaza "Generar")
  const renderEstadoSistema = () => (
    <div className="tab-content-section">
      <div className="section-header">
        <div>
          <h3 className="section-title">Estado del Sistema</h3>
          <p className="section-description">
            Vista general de los conglomerados del Inventario Forestal Nacional
          </p>
        </div>
      </div>

      {/* Estadísticas principales */}
      <div className="stats-info-box">
        <div className="stats-row">
          <div className="stat-item">
            <span className="stat-label">Total en sistema:</span>
            <span className="stat-value">{estadisticasGenerales.total || 0} / 1500</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Sin asignar:</span>
            <span className="stat-value warning">{estadisticasGenerales.sin_asignar || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">En revisión:</span>
            <span className="stat-value info">{estadisticasGenerales.en_revision || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Aprobados:</span>
            <span className="stat-value success">{estadisticasGenerales.aprobado || 0}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Rechazados:</span>
            <span className="stat-value danger">{estadisticasGenerales.rechazado_permanente || 0}</span>
          </div>
        </div>
      </div>

      {/* Alertas */}
      {estadisticasGenerales.total === 0 && (
        <div className="alert alert-warning">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke="currentColor" strokeWidth="2"/>
            <line x1="12" y1="9" x2="12" y2="13" stroke="currentColor" strokeWidth="2"/>
            <line x1="12" y1="17" x2="12.01" y2="17" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <div>
            <strong>⚠️ Sistema no inicializado</strong>
            <p>No hay conglomerados en el sistema. Debes inicializarlo una vez.</p>
          </div>
        </div>
      )}

      {estadisticasGenerales.total > 0 && estadisticasGenerales.total < 1500 && (
        <div className="alert alert-info">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <div>
            <strong>ℹ️ Sistema incompleto</strong>
            <p>Faltan {1500 - estadisticasGenerales.total} conglomerados para completar el inventario nacional.</p>
          </div>
        </div>
      )}

      {estadisticasGenerales.vencidos > 0 && (
        <div className="alert alert-danger">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
            <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <div>
            <strong>🚨 Atención: Conglomerados vencidos</strong>
            <p>Hay {estadisticasGenerales.vencidos} conglomerados con plazo de revisión vencido.</p>
            <button 
              onClick={() => navigate('/superadmin/vencidos')} 
              className="btn-sm btn-danger"
              style={{ marginTop: '8px' }}
            >
              Ver detalles
            </button>
          </div>
        </div>
      )}

      {estadisticasGenerales.total === 1500 && (
        <div className="alert alert-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2"/>
            <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <div>
            <strong>✅ Sistema completo</strong>
            <p>Los 1500 conglomerados del Inventario Forestal Nacional han sido generados.</p>
          </div>
        </div>
      )}

      {/* Botón de inicialización (solo si total === 0) */}
      {estadisticasGenerales.total === 0 && (
        <div className="form-card">
          <div className="init-system-section">
            <div className="init-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <h4>Inicializar Sistema</h4>
            <p>Esta acción generará los 1500 conglomerados del inventario nacional.</p>
            <p className="text-muted">⚠️ Solo se puede hacer una vez y no se puede revertir.</p>
            
            <button
              onClick={inicializarSistema}
              disabled={loading}
              className="btn-primary btn-large"
              style={{ marginTop: '20px' }}
            >
              {loading ? 'Generando 1500 conglomerados...' : '🚀 Inicializar Sistema'}
            </button>
          </div>
        </div>
      )}

      {/* Progreso visual */}
      {estadisticasGenerales.total > 0 && (
        <div className="progress-section">
          <h4>Progreso del Inventario</h4>
          <div className="progress-bar-container">
            <div 
              className="progress-bar" 
              style={{ width: `${(estadisticasGenerales.total / 1500) * 100}%` }}
            >
              {Math.round((estadisticasGenerales.total / 1500) * 100)}%
            </div>
          </div>
          <p className="progress-text">
            {estadisticasGenerales.total} de 1500 conglomerados generados
          </p>
        </div>
      )}
    </div>
  );

  const renderAsignar = () => (
    <div className="tab-content-section">
      <div className="section-header">
        <div>
          <h3 className="section-title">Asignar Lotes a Coordinadores</h3>
          <p className="section-description">
            Distribuir conglomerados sin asignar a coordinadores de georreferenciación.
          </p>
        </div>
      </div>

      {/* Info de disponibles */}
      <div className="alert alert-info">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
          <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2"/>
        </svg>
        <div>
          <strong>Conglomerados disponibles: {estadisticasGenerales.sin_asignar || 0}</strong>
          <p>Puedes asignar hasta 200 conglomerados por lote.</p>
        </div>
      </div>

      <div className="form-card">
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Coordinador de Georreferenciación *</label>
            <select
              value={coordSeleccionado}
              onChange={(e) => setCoordSeleccionado(e.target.value)}
              className="form-select"
              disabled={loading}
            >
              <option value="">-- Selecciona un coordinador --</option>
              {coordinadores.map(coord => (
                <option key={coord.id} value={coord.id}>
                  {coord.nombre_completo} ({coord.email})
                </option>
              ))}
            </select>
            {coordinadores.length === 0 && (
              <small className="form-help text-danger">
                No hay coordinadores de georreferenciación disponibles
              </small>
            )}
          </div>

          <div className="form-group">
            <label className="form-label">Cantidad a asignar *</label>
            <input
              type="number"
              min="1"
              max="200"
              value={cantidadAsignar}
              onChange={(e) => setCantidadAsignar(parseInt(e.target.value) || 1)}
              className="form-input"
              placeholder="Ej: 50"
              disabled={loading}
            />
            <small className="form-help">Máximo 200 por asignación</small>
          </div>

          <div className="form-group">
            <label className="form-label">Plazo (días) *</label>
            <input
              type="number"
              min="1"
              max="90"
              value={plazoDias}
              onChange={(e) => setPlazoDias(parseInt(e.target.value) || 1)}
              className="form-input"
              placeholder="Ej: 30"
              disabled={loading}
            />
            <small className="form-help">Días para completar la revisión (1-90)</small>
          </div>
        </div>

        <button
          onClick={asignarLote}
          disabled={loading || coordinadores.length === 0 || estadisticasGenerales.sin_asignar === 0}
          className="btn-success btn-large"
        >
          {loading ? 'Asignando...' : 'Asignar Lote'}
        </button>
      </div>
    </div>
  );

  const renderVerTodos = () => (
    <div className="tab-content-section">
      <div className="section-header">
        <div>
          <h3 className="section-title">Mis Conglomerados</h3>
          <p className="section-description">
            Mostrando 50 registros por página
          </p>
        </div>
      </div>

      {/* ✅ NUEVO: Info visual */}
      {conglomerados.length > 0 && (
        <div className="alert alert-info">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <div>
            <strong>ℹ️ Vista filtrada por usuario</strong>
            <p>Mostrando solo los conglomerados relacionados con tu cuenta.</p>
          </div>
        </div>
      )}

      <div className="filters-bar">
        <div className="filter-group">
          <select
            value={filtroEstado}
            onChange={(e) => {
              setFiltroEstado(e.target.value);
              setPage(1);
            }}
            className="form-select"
          >
            <option value="todos">Todos los estados</option>
            <option value="sin_asignar">Sin Asignar</option>
            <option value="en_revision">En Revisión</option>
            <option value="aprobado">Aprobados</option>
            <option value="rechazado_permanente">Rechazados</option>
          </select>
        </div>

        <div className="filter-group">
          <input
            type="text"
            placeholder="Buscar por código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="form-input"
          />
        </div>

        <button
          onClick={cargarConglomerados}
          className="btn-secondary"
          disabled={loading}
        >
          Buscar
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando conglomerados...</p>
        </div>
      ) : (
        <>
          <div className="table-section">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Latitud</th>
                    <th>Longitud</th>
                    <th>Estado</th>
                    <th>Asignado a</th>
                    <th>Fecha Creación</th>
                  </tr>
                </thead>
                <tbody>
                  {conglomerados.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center">
                        No hay conglomerados que mostrar
                      </td>
                    </tr>
                  ) : (
                    conglomerados.map(c => (
                      <tr key={c.id}>
                        <td><code className="code-text">{c.codigo}</code></td>
                        <td>{c.latitud.toFixed(6)}°</td>
                        <td>{c.longitud.toFixed(6)}°</td>
                        <td>
                          <span className={`badge ${getEstadoBadge(c.estado).class}`}>
                            {getEstadoBadge(c.estado).text}
                          </span>
                        </td>
                        <td>{c.coordinador_nombre || '-'}</td>
                        <td>{new Date(c.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="pagination-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                Anterior
              </button>

              <span className="pagination-info">
                Página {page} de {totalPages}
              </span>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="pagination-btn"
              >
                Siguiente
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="generar-asignar-page">
      <div className="page-header">
        <h2 className="page-title">Gestión de Conglomerados</h2>
        <p className="page-subtitle">Sistema de Inventario Forestal Nacional</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
          </svg>
          {error}
          <button onClick={() => setError('')} className="alert-close">✕</button>
        </div>
      )}

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
          className={`tab-btn ${activeTab === 'estado' ? 'active' : ''}`}
          onClick={() => setActiveTab('estado')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 3h18v18H3z"/>
            <path d="M3 9h18M9 21V9"/>
          </svg>
          Estado del Sistema
        </button>

        <button
          className={`tab-btn ${activeTab === 'asignar' ? 'active' : ''}`}
          onClick={() => setActiveTab('asignar')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
          Asignar Lotes
        </button>

        <button
          className={`tab-btn ${activeTab === 'ver' ? 'active' : ''}`}
          onClick={() => setActiveTab('ver')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Ver Todos
        </button>
      </div>

      <div className="tabs-content">
        {activeTab === 'estado' && renderEstadoSistema()}
        {activeTab === 'asignar' && renderAsignar()}
        {activeTab === 'ver' && renderVerTodos()}
      </div>
    </div>
  );
}

export default GenerarYAsignar;