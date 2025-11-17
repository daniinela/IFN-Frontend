// src/pages/coordbrigadas/Brigadas.jsx
import { useState, useEffect } from 'react';
import axios from '../../api/axiosConfig';
import WeatherWidget from '../../components/WeatherWidget';
import MapboxComponent from '../../components/common/MapBoxComponent';
import './Brigadas.css';

function Brigadas() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [brigadas, setBrigadas] = useState([]);
  const [conglomeradosDisponibles, setConglomeradosDisponibles] = useState([]);
  const [brigadistas, setBrigadistas] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  
  // Modales
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [showAsignarModal, setShowAsignarModal] = useState(false);
  const [showEliminarModal, setShowEliminarModal] = useState(false);
  
  // Selecciones
  const [brigadaSeleccionada, setBrigadaSeleccionada] = useState(null);
  const [conglomeradoSeleccionado, setConglomeradoSeleccionado] = useState('');
  const [brigadistasSeleccionados, setBrigadistasSeleccionados] = useState([]);
  
  // Filtros para asignar brigadistas
  const [filtroRolAsignar, setFiltroRolAsignar] = useState('todos');
  const [filtroMunicipioAsignar, setFiltroMunicipioAsignar] = useState('');

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      
      const [brigadasRes, conglosRes, brigadistasRes] = await Promise.all([
        axios.get('http://localhost:3002/api/brigadas').catch(() => ({ data: [] })),
        axios.get('http://localhost:3002/api/brigadas/conglomerados-disponibles').catch(() => ({ data: [] })),
        axios.get('http://localhost:3002/api/brigadistas').catch(() => ({ data: [] }))
      ]);

      setBrigadas(brigadasRes.data || []);
      setConglomeradosDisponibles(conglosRes.data || []);
      setBrigadistas(brigadistasRes.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar datos del sistema');
    } finally {
      setLoading(false);
    }
  };

  const crearBrigada = async () => {
    if (!conglomeradoSeleccionado) {
      setError('Debes seleccionar un conglomerado');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await axios.post('http://localhost:3002/api/brigadas', {
        conglomerado_id: conglomeradoSeleccionado
      });
      
      setSuccess('Brigada creada exitosamente');
      setShowCrearModal(false);
      setConglomeradoSeleccionado('');
      cargarDatos();
    } catch (error) {
      console.error('Error creando brigada:', error);
      setError(error.response?.data?.error || 'Error al crear brigada');
    } finally {
      setLoading(false);
    }
  };

  const verDetalle = async (brigada) => {
    try {
      setLoading(true);
      
      const response = await axios.get(
        `http://localhost:3002/api/brigadas/${brigada.id}/brigadistas`
      );
      
      setBrigadaSeleccionada({
        ...brigada,
        brigadistas: response.data
      });
      setShowDetalleModal(true);
    } catch (error) {
      console.error('Error cargando detalles:', error);
      setBrigadaSeleccionada(brigada);
      setShowDetalleModal(true);
    } finally {
      setLoading(false);
    }
  };

  const abrirModalAsignar = (brigada) => {
    setBrigadaSeleccionada(brigada);
    setBrigadistasSeleccionados([]);
    setFiltroRolAsignar('todos');
    setFiltroMunicipioAsignar('');
    setShowAsignarModal(true);
  };

  const toggleBrigadista = (brigadistaId) => {
    if (brigadistasSeleccionados.includes(brigadistaId)) {
      setBrigadistasSeleccionados(brigadistasSeleccionados.filter(id => id !== brigadistaId));
    } else {
      setBrigadistasSeleccionados([...brigadistasSeleccionados, brigadistaId]);
    }
  };

  const invitarBrigadistas = async () => {
    if (brigadistasSeleccionados.length === 0) {
      setError('Selecciona al menos un brigadista');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      for (const brigadistaId of brigadistasSeleccionados) {
        await axios.post('http://localhost:3002/api/brigadas-brigadistas/invitar', {
          brigada_id: brigadaSeleccionada.id,
          brigadista_id: brigadistaId,
          fecha_inicio: null,
          fecha_fin: null
        });
      }
      
      setSuccess(`${brigadistasSeleccionados.length} invitación(es) enviada(s)`);
      setShowAsignarModal(false);
      setBrigadistasSeleccionados([]);
      cargarDatos();
    } catch (error) {
      console.error('Error invitando brigadistas:', error);
      setError(error.response?.data?.error || 'Error al enviar invitaciones');
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstadoBrigada = async (brigada, nuevoEstado) => {
    try {
      setLoading(true);
      
      await axios.put(`http://localhost:3002/api/brigadas/${brigada.id}/estado`, {
        estado: nuevoEstado
      });
      
      setSuccess('Estado actualizado correctamente');
      cargarDatos();
    } catch (error) {
      console.error('Error cambiando estado:', error);
      setError('Error al cambiar estado de la brigada');
    } finally {
      setLoading(false);
    }
  };

  const eliminarBrigada = async () => {
    try {
      setLoading(true);
      
      await axios.delete(`http://localhost:3002/api/brigadas/${brigadaSeleccionada.id}`);
      
      setSuccess('Brigada eliminada exitosamente');
      setShowEliminarModal(false);
      setBrigadaSeleccionada(null);
      cargarDatos();
    } catch (error) {
      console.error('Error eliminando brigada:', error);
      setError(error.response?.data?.error || 'Error al eliminar brigada');
    } finally {
      setLoading(false);
    }
  };

  const brigadasFiltradas = brigadas.filter(b => 
    filtroEstado === 'todos' || b.estado === filtroEstado
  );

  const brigadistasFiltrados = brigadistas.filter(b => {
    const cumpleRol = filtroRolAsignar === 'todos' || b.rol === filtroRolAsignar;
    const cumpleMunicipio = !filtroMunicipioAsignar || 
      b.municipio?.toLowerCase().includes(filtroMunicipioAsignar.toLowerCase());
    const noAsignado = !brigadaSeleccionada?.brigadistas?.some(
      asig => asig.brigadista_id === b.id
    );
    
    return cumpleRol && cumpleMunicipio && noAsignado;
  });

  const getEstadoBadge = (estado) => {
    const badges = {
      'formacion': { text: 'En Formación', color: '#f59e0b' },
      'activa': { text: 'Activa', color: '#10b981' },
      'completada': { text: 'Completada', color: '#6366f1' },
      'cancelada': { text: 'Cancelada', color: '#ef4444' }
    };
    return badges[estado] || { text: estado, color: '#6b7280' };
  };

  const getRolBadge = (rol) => {
    const badges = {
      'jefe': { text: 'Jefe', color: '#dc2626' },
      'botanico': { text: 'Botánico', color: '#059669' },
      'tecnico': { text: 'Técnico', color: '#2563eb' },
      'coinvestigador': { text: 'Coinvestigador', color: '#7c3aed' }
    };
    return badges[rol] || { text: rol, color: '#6b7280' };
  };

  return (
    <div className="brigadas-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Gestión de Brigadas</h2>
          <p className="page-subtitle">Equipos de trabajo de campo</p>
        </div>
        {conglomeradosDisponibles.length > 0 && (
          <button className="btn-create" onClick={() => setShowCrearModal(true)}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Crear Brigada
          </button>
        )}
      </div>

      {/* Mensajes */}
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

      {/* Filtros */}
      <div className="filters-bar">
        {['todos', 'formacion', 'activa', 'completada', 'cancelada'].map(estado => (
          <button
            key={estado}
            onClick={() => setFiltroEstado(estado)}
            className={`filter-btn ${filtroEstado === estado ? 'active' : ''}`}
          >
            {estado === 'todos' ? 'Todas' : getEstadoBadge(estado).text}
          </button>
        ))}
      </div>

      {/* Lista de Brigadas */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando brigadas...</p>
        </div>
      ) : brigadasFiltradas.length === 0 ? (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <h3>No hay brigadas</h3>
          <p>Crea la primera brigada para comenzar</p>
        </div>
      ) : (
        <div className="brigadas-grid">
          {brigadasFiltradas.map(brigada => {
            const badge = getEstadoBadge(brigada.estado);
            const numBrigadistas = brigada.brigadistas?.length || 0;
            
            return (
              <div key={brigada.id} className="brigada-card">
                <div className="card-header">
                  <h3 className="card-title">Brigada #{brigada.id.substring(0, 8)}</h3>
                  <span className="estado-badge" style={{ backgroundColor: `${badge.color}20`, color: badge.color }}>
                    {badge.text}
                  </span>
                </div>

                <div className="card-body">
                  <div className="info-row">
                    <span className="info-label">Conglomerado:</span>
                    <span className="info-value">{brigada.conglomerado?.codigo || 'N/A'}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Brigadistas:</span>
                    <span className="info-value">{numBrigadistas}</span>
                  </div>
                  {brigada.conglomerado?.municipio && (
                    <div className="info-row">
                      <span className="info-label">Municipio:</span>
                      <span className="info-value">{brigada.conglomerado.municipio}</span>
                    </div>
                  )}
                </div>

                <div className="card-actions">
                  <button className="btn-action btn-primary" onClick={() => verDetalle(brigada)}>
                    Ver Detalles
                  </button>
                  
                  {brigada.estado === 'formacion' && (
                    <>
                      <button className="btn-action btn-success" onClick={() => abrirModalAsignar(brigada)}>
                        Asignar
                      </button>
                      <button 
                        className="btn-action btn-activate"
                        onClick={() => cambiarEstadoBrigada(brigada, 'activa')}
                        title="Activar brigada"
                      >
                        Activar
                      </button>
                    </>
                  )}

                  <button 
                    className="btn-action btn-danger"
                    onClick={() => {
                      setBrigadaSeleccionada(brigada);
                      setShowEliminarModal(true);
                    }}
                    title="Eliminar"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear Brigada */}
      {showCrearModal && (
        <div className="modal-overlay" onClick={() => setShowCrearModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Crear Nueva Brigada</h3>
              <button className="modal-close" onClick={() => setShowCrearModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <p className="modal-description">
                Selecciona un conglomerado aprobado para asignar a la nueva brigada
              </p>

              <div className="form-group">
                <label className="form-label">Conglomerado: *</label>
                <select
                  value={conglomeradoSeleccionado}
                  onChange={e => setConglomeradoSeleccionado(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Selecciona un conglomerado --</option>
                  {conglomeradosDisponibles.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} - {c.municipio || `${c.latitud}°, ${c.longitud}°`}
                    </option>
                  ))}
                </select>
                <small className="form-help">
                  Solo conglomerados aprobados sin brigada asignada
                </small>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-modal btn-cancel" onClick={() => setShowCrearModal(false)}>
                Cancelar
              </button>
              <button 
                className="btn-modal btn-confirm"
                onClick={crearBrigada}
                disabled={loading}
              >
                {loading ? 'Creando...' : 'Crear Brigada'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Asignar Brigadistas */}
      {showAsignarModal && brigadaSeleccionada && (
        <div className="modal-overlay" onClick={() => setShowAsignarModal(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3 className="modal-title">Asignar Brigadistas</h3>
                <p className="modal-subtitle">Brigada: {brigadaSeleccionada.conglomerado?.codigo}</p>
              </div>
              <button className="modal-close" onClick={() => setShowAsignarModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {/* Filtros */}
              <div className="filtros-asignar">
                <div className="form-group">
                  <label className="form-label-small">Filtrar por Rol:</label>
                  <select
                    value={filtroRolAsignar}
                    onChange={e => setFiltroRolAsignar(e.target.value)}
                    className="form-select-small"
                  >
                    <option value="todos">Todos los roles</option>
                    <option value="jefe">Jefe</option>
                    <option value="botanico">Botánico</option>
                    <option value="tecnico">Técnico</option>
                    <option value="coinvestigador">Coinvestigador</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label-small">Filtrar por Municipio:</label>
                  <input
                    type="text"
                    placeholder="Buscar municipio..."
                    value={filtroMunicipioAsignar}
                    onChange={e => setFiltroMunicipioAsignar(e.target.value)}
                    className="form-input-small"
                  />
                </div>
              </div>

              {/* Seleccionados */}
              {brigadistasSeleccionados.length > 0 && (
                <div className="seleccionados-banner">
                  <span>{brigadistasSeleccionados.length} brigadista(s) seleccionado(s)</span>
                  <button onClick={() => setBrigadistasSeleccionados([])}>Limpiar</button>
                </div>
              )}

              {/* Lista de brigadistas */}
              <div className="brigadistas-lista">
                {brigadistasFiltrados.length === 0 ? (
                  <div className="empty-state-small">
                    No hay brigadistas disponibles con estos filtros
                  </div>
                ) : (
                  brigadistasFiltrados.map(brigadista => {
                    const badge = getRolBadge(brigadista.rol);
                    const isSelected = brigadistasSeleccionados.includes(brigadista.id);
                    
                    return (
                      <div 
                        key={brigadista.id}
                        onClick={() => toggleBrigadista(brigadista.id)}
                        className={`brigadista-item ${isSelected ? 'selected' : ''}`}
                      >
                        <div className="brigadista-info">
                          <div className="brigadista-header">
                            <span className="brigadista-nombre">
                              {brigadista.nombre_completo || 'Sin nombre'}
                            </span>
                            <span className="rol-badge" style={{ backgroundColor: `${badge.color}20`, color: badge.color }}>
                              {badge.text}
                            </span>
                          </div>
                          <div className="brigadista-detalles">
                            {brigadista.municipio} • {brigadista.email}
                          </div>
                        </div>
                        {isSelected && <div className="check-icon">✓</div>}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-modal btn-cancel" onClick={() => setShowAsignarModal(false)}>
                Cancelar
              </button>
              <button 
                className="btn-modal btn-confirm"
                onClick={invitarBrigadistas}
                disabled={loading || brigadistasSeleccionados.length === 0}
              >
                {loading ? 'Enviando...' : `Enviar Invitaciones (${brigadistasSeleccionados.length})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle */}
      {showDetalleModal && brigadaSeleccionada && (
        <div className="modal-overlay" onClick={() => setShowDetalleModal(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Detalles de la Brigada</h3>
              <button className="modal-close" onClick={() => setShowDetalleModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {/* Info de la brigada */}
              <div className="brigada-info-box">
                <span className="estado-badge-large" style={{
                  backgroundColor: `${getEstadoBadge(brigadaSeleccionada.estado).color}20`,
                  color: getEstadoBadge(brigadaSeleccionada.estado).color
                }}>
                  {getEstadoBadge(brigadaSeleccionada.estado).text}
                </span>

                <div className="info-details">
                  <div className="info-item">
                    <strong>Conglomerado:</strong> {brigadaSeleccionada.conglomerado?.codigo || 'N/A'}
                  </div>
                  {brigadaSeleccionada.conglomerado?.municipio && (
                    <div className="info-item">
                      <strong>Municipio:</strong> {brigadaSeleccionada.conglomerado.municipio}
                    </div>
                  )}
                </div>
              </div>

              {/* Mapa y clima */}
              {brigadaSeleccionada.conglomerado && (
                <div className="detalle-extras">
                  <div className="detalle-mapa">
                    <MapboxComponent
                      latitud={brigadaSeleccionada.conglomerado.latitud}
                      longitud={brigadaSeleccionada.conglomerado.longitud}
                      codigo={brigadaSeleccionada.conglomerado.codigo}
                    />
                  </div>
                  <div className="detalle-clima">
                    <WeatherWidget
                      latitud={brigadaSeleccionada.conglomerado.latitud}
                      longitud={brigadaSeleccionada.conglomerado.longitud}
                    />
                  </div>
                </div>
              )}

              {/* Brigadistas asignados */}
              <div>
                <h4 className="section-subtitle">
                  Brigadistas Asignados ({brigadaSeleccionada.brigadistas?.length || 0})
                </h4>
                
                {!brigadaSeleccionada.brigadistas || brigadaSeleccionada.brigadistas.length === 0 ? (
                  <div className="empty-state-small">
                    No hay brigadistas asignados
                  </div>
                ) : (
                  <div className="brigadistas-asignados-lista">
                    {brigadaSeleccionada.brigadistas.map((asignacion, index) => {
                      const brigadista = asignacion.brigadista || asignacion;
                      const badge = getRolBadge(brigadista.rol);
                      const estadoInvitacion = asignacion.estado_invitacion || 'pendiente';
                      
                      return (
                        <div key={index} className="brigadista-asignado-card">
                          <div className="brigadista-content">
                            <div className="brigadista-top">
                              <span className="brigadista-nombre">
                                {brigadista.nombre_completo || 'Sin nombre'}
                              </span>
                              <span className="rol-badge-small" style={{ backgroundColor: `${badge.color}20`, color: badge.color }}>
                                {badge.text}
                              </span>
                            </div>

                            <div className="brigadista-contacto">
                              {brigadista.email} • {brigadista.municipio}
                            </div>

                            <span className={`invitacion-badge ${estadoInvitacion}`}>
                              {estadoInvitacion === 'aceptada' ? 'Aceptada' :
                               estadoInvitacion === 'rechazada' ? 'Rechazada' : 'Pendiente'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {showEliminarModal && brigadaSeleccionada && (
        <div className="modal-overlay" onClick={() => setShowEliminarModal(false)}>
          <div className="modal-content modal-confirm" onClick={e => e.stopPropagation()}>
            <div className="modal-confirm-icon">⚠️</div>
            <h3 className="modal-confirm-title">¿Eliminar brigada?</h3>
            <p className="modal-confirm-text">Esta acción no se puede deshacer</p>

            <div className="confirm-info-box">
              <div className="info-item">
                <strong>Conglomerado:</strong> {brigadaSeleccionada.conglomerado?.codigo || 'N/A'}
              </div>
              <div className="info-item">
                <strong>Estado:</strong> {getEstadoBadge(brigadaSeleccionada.estado).text}
              </div>
            </div>

            <div className="modal-confirm-actions">
              <button className="btn-modal btn-cancel" onClick={() => setShowEliminarModal(false)}>
                Cancelar
              </button>
              <button className="btn-modal btn-danger" onClick={eliminarBrigada}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Brigadas;