import { useState, useEffect } from 'react';
import axios from '../../api/axiosConfig';
import './Brigadas.css';

function Brigadas() {
  const [loading, setLoading] = useState(false);
  const [brigadas, setBrigadas] = useState([]);
  const [conglomerados, setConglomerados] = useState([]);
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
  const [brigadistasAsignados, setBrigadistasAsignados] = useState([]);
  
  // Filtros para asignar brigadistas
  const [filtroRolAsignar, setFiltroRolAsignar] = useState('todos');
  const [filtroMunicipioAsignar, setFiltroMunicipioAsignar] = useState('');
  const [mostrarSoloConTitulos, setMostrarSoloConTitulos] = useState(false);

  useEffect(() => {
    cargarBrigadas();
    cargarConglomerados();
    cargarBrigadistas();
  }, []);

  const cargarBrigadas = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:3002/api/brigadas');
      setBrigadas(response.data);
    } catch (error) {
      console.error('Error cargando brigadas:', error);
      alert('Error al cargar brigadas');
    } finally {
      setLoading(false);
    }
  };

  const cargarConglomerados = async () => {
    try {
      const response = await axios.get('http://localhost:3003/api/conglomerados/estado/aprobado');
      const conglomeradosDisponibles = [];
      
      for (const cong of response.data) {
        try {
          await axios.get(`http://localhost:3002/api/brigadas/conglomerado/${cong.id}`);
        } catch (err) {
          if (err.response?.status === 404) {
            conglomeradosDisponibles.push(cong);
          }
        }
      }
      
      setConglomerados(conglomeradosDisponibles);
    } catch (error) {
      console.error('Error cargando conglomerados:', error);
    }
  };

  const cargarBrigadistas = async () => {
    try {
      const response = await axios.get('http://localhost:3002/api/brigadistas');
      setBrigadistas(response.data);
    } catch (error) {
      console.error('Error cargando brigadistas:', error);
    }
  };

  const crearBrigada = async () => {
    try {
      if (!conglomeradoSeleccionado) {
        alert('⚠️ Selecciona un conglomerado');
        return;
      }

      setLoading(true);
      await axios.post('http://localhost:3002/api/brigadas', {
        conglomerado_id: conglomeradoSeleccionado
      });
      
      alert('✅ Brigada creada exitosamente');
      setShowCrearModal(false);
      setConglomeradoSeleccionado('');
      cargarBrigadas();
      cargarConglomerados();
    } catch (error) {
      console.error('Error creando brigada:', error);
      alert(error.response?.data?.error || 'Error al crear brigada');
    } finally {
      setLoading(false);
    }
  };

  const verDetalle = async (brigada) => {
    try {
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
    }
  };

  const abrirModalAsignar = (brigada) => {
    setBrigadaSeleccionada(brigada);
    setBrigadistasAsignados([]);
    setShowAsignarModal(true);
  };

  const toggleBrigadista = (brigadistaId) => {
    if (brigadistasAsignados.includes(brigadistaId)) {
      setBrigadistasAsignados(brigadistasAsignados.filter(id => id !== brigadistaId));
    } else {
      setBrigadistasAsignados([...brigadistasAsignados, brigadistaId]);
    }
  };

  const invitarBrigadistas = async () => {
    try {
      if (brigadistasAsignados.length === 0) {
        alert('⚠️ Selecciona al menos un brigadista');
        return;
      }

      setLoading(true);
      
      for (const brigadistaId of brigadistasAsignados) {
        await axios.post('http://localhost:3002/api/brigadas-brigadistas/invitar', {
          brigada_id: brigadaSeleccionada.id,
          brigadista_id: brigadistaId,
          fecha_inicio: null,
          fecha_fin: null
        });
      }
      
      alert(`✅ ${brigadistasAsignados.length} invitación(es) enviada(s)`);
      setShowAsignarModal(false);
      setBrigadistasAsignados([]);
      cargarBrigadas();
    } catch (error) {
      console.error('Error invitando brigadistas:', error);
      alert(error.response?.data?.error || 'Error al enviar invitaciones');
    } finally {
      setLoading(false);
    }
  };

  const eliminarBrigada = async () => {
    try {
      await axios.delete(`http://localhost:3002/api/brigadas/${brigadaSeleccionada.id}`);
      
      alert('✅ Brigada eliminada exitosamente');
      setShowEliminarModal(false);
      cargarBrigadas();
      cargarConglomerados();
    } catch (error) {
      console.error('Error eliminando:', error);
      alert(error.response?.data?.error || 'Error al eliminar brigada');
    }
  };

  const cambiarEstadoBrigada = async (brigada, nuevoEstado) => {
    try {
      await axios.put(`http://localhost:3002/api/brigadas/${brigada.id}/estado`, {
        estado: nuevoEstado
      });
      
      alert('✅ Estado actualizado');
      cargarBrigadas();
    } catch (error) {
      console.error('Error cambiando estado:', error);
      alert('Error al cambiar estado');
    }
  };

  const brigadistasFiltrados = brigadistas.filter(b => {
    const cumpleRol = filtroRolAsignar === 'todos' || b.rol === filtroRolAsignar;
    const cumpleMunicipio = !filtroMunicipioAsignar || 
      b.municipio.toLowerCase().includes(filtroMunicipioAsignar.toLowerCase());
    const cumpleTitulos = !mostrarSoloConTitulos || 
      (b.titulos && b.titulos.length > 0);
    const noAsignado = !brigadaSeleccionada?.brigadistas?.some(
      asig => asig.brigadista_id === b.id
    );
    
    return cumpleRol && cumpleMunicipio && cumpleTitulos && noAsignado;
  });

  const brigadasFiltradas = brigadas.filter(b => 
    filtroEstado === 'todos' || b.estado === filtroEstado
  );

  const getEstadoBadge = (estado) => {
    const badges = {
      'formacion': { text: 'En Formación', icon: '🔨', color: '#f59e0b' },
      'activa': { text: 'Activa', icon: '✅', color: '#10b981' },
      'completada': { text: 'Completada', icon: '🎉', color: '#6366f1' },
      'cancelada': { text: 'Cancelada', icon: '❌', color: '#ef4444' }
    };
    return badges[estado] || { text: estado, icon: '❓', color: '#6b7280' };
  };

  const getRolBadge = (rol) => {
    const badges = {
      'jefe': { text: 'Jefe', icon: '👨‍💼', color: '#dc2626' },
      'botanico': { text: 'Botánico', icon: '🌿', color: '#059669' },
      'tecnico': { text: 'Técnico', icon: '🔧', color: '#2563eb' },
      'coinvestigador': { text: 'Coinvestigador', icon: '🔬', color: '#7c3aed' }
    };
    return badges[rol] || { text: rol, icon: '👤', color: '#6b7280' };
  };

  return (
    <div className="brigadas-container">
      {/* Header */}
      <div className="brigadas-header">
        <div>
          <h2 className="brigadas-title">Gestión de Brigadas</h2>
          <p className="brigadas-subtitle">Total: {brigadasFiltradas.length} brigadas</p>
        </div>
        <button className="btn-crear-brigada" onClick={() => setShowCrearModal(true)}>
          <span className="btn-icon">➕</span>
          Crear Brigada
        </button>
      </div>

      {/* Filtros */}
      <div className="filtros-container">
        {['todos', 'formacion', 'activa', 'completada', 'cancelada'].map(estado => (
          <button
            key={estado}
            onClick={() => setFiltroEstado(estado)}
            className={`filtro-btn ${filtroEstado === estado ? 'active' : ''}`}
          >
            {estado === 'todos' ? 'Todos' : getEstadoBadge(estado).text}
          </button>
        ))}
      </div>

      {/* Lista de Brigadas */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Cargando brigadas...</p>
        </div>
      ) : brigadasFiltradas.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">👥</span>
          <h3 className="empty-title">No hay brigadas</h3>
          <p className="empty-text">Crea la primera brigada para comenzar</p>
        </div>
      ) : (
        <div className="brigadas-grid">
          {brigadasFiltradas.map(brigada => {
            const badge = getEstadoBadge(brigada.estado);
            const numBrigadistas = brigada.brigadistas?.length || 0;
            
            return (
              <div key={brigada.id} className="brigada-card">
                <div className="brigada-card-header">
                  <div>
                    <h3 className="brigada-card-title">
                      Brigada #{brigada.id.substring(0, 8)}
                    </h3>
                    <span className="estado-badge" style={{
                      background: `${badge.color}20`,
                      color: badge.color
                    }}>
                      {badge.icon} {badge.text}
                    </span>
                  </div>
                </div>

                <div className="brigada-card-info">
                  <div className="info-item">
                    <strong>📍 Conglomerado:</strong> {brigada.conglomerado?.codigo || 'N/A'}
                  </div>
                  <div className="info-item">
                    <strong>👥 Brigadistas:</strong> {numBrigadistas}
                  </div>
                  {brigada.conglomerado?.municipio && (
                    <div className="info-item">
                      <strong>🏘️ Municipio:</strong> {brigada.conglomerado.municipio}
                    </div>
                  )}
                </div>

                <div className="brigada-card-actions">
                  <button className="btn-action btn-secondary" onClick={() => verDetalle(brigada)}>
                    Ver Detalles
                  </button>
                  
                  {brigada.estado === 'formacion' && (
                    <>
                      <button className="btn-action btn-primary" onClick={() => abrirModalAsignar(brigada)}>
                        ➕ Asignar
                      </button>
                      <button 
                        className="btn-action btn-success"
                        onClick={() => cambiarEstadoBrigada(brigada, 'activa')}
                        title="Activar brigada"
                      >
                        ▶️
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
                    🗑️
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
              <button className="modal-close-btn" onClick={() => setShowCrearModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Selecciona un Conglomerado Aprobado: *</label>
                <select
                  value={conglomeradoSeleccionado}
                  onChange={e => setConglomeradoSeleccionado(e.target.value)}
                  className="form-select"
                >
                  <option value="">Selecciona un conglomerado</option>
                  {conglomerados.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.codigo} - {c.municipio || `${c.latitud}°, ${c.longitud}°`}
                    </option>
                  ))}
                </select>
                <small className="form-help">
                  Solo se muestran conglomerados aprobados sin brigada asignada
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
                <p className="modal-subtitle">
                  Brigada: {brigadaSeleccionada.conglomerado?.codigo}
                </p>
              </div>
              <button className="modal-close-btn" onClick={() => setShowAsignarModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {/* Filtros */}
              <div className="filtros-asignar">
                <div className="filtros-grid">
                  <div className="form-group">
                    <label className="form-label-small">Filtrar por Rol:</label>
                    <select
                      value={filtroRolAsignar}
                      onChange={e => setFiltroRolAsignar(e.target.value)}
                      className="form-select-small"
                    >
                      <option value="todos">Todos los roles</option>
                      <option value="jefe">👨‍💼 Jefe</option>
                      <option value="botanico">🌿 Botánico</option>
                      <option value="tecnico">🔧 Técnico</option>
                      <option value="coinvestigador">🔬 Coinvestigador</option>
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

                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={mostrarSoloConTitulos}
                    onChange={e => setMostrarSoloConTitulos(e.target.checked)}
                    className="checkbox-input"
                  />
                  <span>Mostrar solo brigadistas con títulos académicos</span>
                </label>
              </div>

              {/* Seleccionados */}
              {brigadistasAsignados.length > 0 && (
                <div className="seleccionados-banner">
                  <span className="seleccionados-text">
                    ✓ {brigadistasAsignados.length} brigadista(s) seleccionado(s)
                  </span>
                  <button
                    className="btn-limpiar"
                    onClick={() => setBrigadistasAsignados([])}
                  >
                    Limpiar
                  </button>
                </div>
              )}

              {/* Lista de brigadistas */}
              <div className="brigadistas-lista">
                {brigadistasFiltrados.length === 0 ? (
                  <div className="empty-state-small">
                    No hay brigadistas disponibles con estos filtros
                  </div>
                ) : (
                  <div className="brigadistas-container">
                    {brigadistasFiltrados.map(brigadista => {
                      const badge = getRolBadge(brigadista.rol);
                      const isSelected = brigadistasAsignados.includes(brigadista.id);
                      
                      return (
                        <div 
                          key={brigadista.id}
                          onClick={() => toggleBrigadista(brigadista.id)}
                          className={`brigadista-item ${isSelected ? 'selected' : ''}`}
                        >
                          <div className="brigadista-icon" style={{
                            background: `${badge.color}20`
                          }}>
                            {badge.icon}
                          </div>

                          <div className="brigadista-info">
                            <div className="brigadista-header">
                              <div>
                                <div className="brigadista-nombre">
                                  {brigadista.nombre_completo || 'Sin nombre'}
                                </div>
                                <span className="rol-badge" style={{
                                  background: `${badge.color}20`,
                                  color: badge.color
                                }}>
                                  {badge.text}
                                </span>
                              </div>
                              
                              {isSelected && (
                                <div className="check-icon">✓</div>
                              )}
                            </div>

                            <div className="brigadista-detalles">
                              📍 {brigadista.municipio} • 📧 {brigadista.usuario?.email}
                            </div>

                            {brigadista.titulos && brigadista.titulos.length > 0 && (
                              <div className="brigadista-tag titulos-tag">
                                🎓 {brigadista.titulos.length} título(s): {brigadista.titulos.map(t => t.titulo).join(', ')}
                              </div>
                            )}

                            {brigadista.experiencia_laboral && brigadista.experiencia_laboral.length > 0 && (
                              <div className="brigadista-tag experiencia-tag">
                                💼 {brigadista.experiencia_laboral.length} experiencia(s) • {brigadista.experiencia_laboral.map(e => e.cargo).slice(0, 2).join(', ')}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
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
                disabled={loading || brigadistasAsignados.length === 0}
              >
                {loading ? 'Enviando...' : `Enviar Invitaciones (${brigadistasAsignados.length})`}
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
              <h3 className="modal-title">📋 Detalles de la Brigada</h3>
              <button className="modal-close-btn" onClick={() => setShowDetalleModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {/* Info de la brigada */}
              <div className="brigada-info-box">
                <div style={{ marginBottom: '16px' }}>
                  <span className="estado-badge-large" style={{
                    background: `${getEstadoBadge(brigadaSeleccionada.estado).color}20`,
                    color: getEstadoBadge(brigadaSeleccionada.estado).color
                  }}>
                    {getEstadoBadge(brigadaSeleccionada.estado).icon} {getEstadoBadge(brigadaSeleccionada.estado).text}
                  </span>
                </div>

                <div className="info-details">
                  <div className="info-item">
                    <strong>🆔 ID:</strong> {brigadaSeleccionada.id}
                  </div>
                  <div className="info-item">
                    <strong>📍 Conglomerado:</strong> {brigadaSeleccionada.conglomerado?.codigo || 'N/A'}
                  </div>
                  {brigadaSeleccionada.conglomerado?.municipio && (
                    <div className="info-item">
                      <strong>🏘️ Municipio:</strong> {brigadaSeleccionada.conglomerado.municipio}
                    </div>
                  )}
                  {brigadaSeleccionada.conglomerado && (
                    <div className="info-item">
                      <strong>🌐 Coordenadas:</strong> {brigadaSeleccionada.conglomerado.latitud}°, {brigadaSeleccionada.conglomerado.longitud}°
                    </div>
                  )}
                </div>
              </div>

              {/* Brigadistas asignados */}
              <div>
                <h4 className="section-subtitle">
                  👥 Brigadistas Asignados
                  <span className="count-badge">
                    {brigadaSeleccionada.brigadistas?.length || 0}
                  </span>
                </h4>
                
                {!brigadaSeleccionada.brigadistas || brigadaSeleccionada.brigadistas.length === 0 ? (
                  <div className="empty-state-small">
                    No hay brigadistas asignados a esta brigada
                  </div>
                ) : (
                  <div className="brigadistas-asignados-lista">
                    {brigadaSeleccionada.brigadistas.map((asignacion, index) => {
                      const brigadista = asignacion.brigadista || asignacion;
                      const badge = getRolBadge(brigadista.rol);
                      const estadoInvitacion = asignacion.estado_invitacion || 'pendiente';
                      
                      return (
                        <div key={index} className="brigadista-asignado-card">
                          <div className="brigadista-icon-large" style={{
                            background: `${badge.color}20`
                          }}>
                            {badge.icon}
                          </div>

                          <div className="brigadista-content">
                            <div className="brigadista-top">
                              <div>
                                <div className="brigadista-nombre">
                                  {brigadista.usuario?.nombre || 'Sin nombre'}
                                </div>
                                <span className="rol-badge-small" style={{
                                  background: `${badge.color}20`,
                                  color: badge.color
                                }}>
                                  {badge.text}
                                </span>
                              </div>

                              <span className={`invitacion-badge ${estadoInvitacion}`}>
                                {estadoInvitacion === 'aceptada' ? '✓ Aceptada' :
                                 estadoInvitacion === 'rechazada' ? '✕ Rechazada' : '⏱ Pendiente'}
                              </span>
                            </div>

                            <div className="brigadista-contacto">
                              📧 {brigadista.usuario?.email} • 📍 {brigadista.municipio}
                            </div>

                            {brigadista.titulos && brigadista.titulos.length > 0 && (
                              <div className="detalle-tag titulos">
                                <strong>🎓 Títulos:</strong> {brigadista.titulos.map(t => t.titulo).join(', ')}
                              </div>
                            )}

                            {brigadista.experiencia_laboral && brigadista.experiencia_laboral.length > 0 && (
                              <div className="detalle-tag experiencia">
                                <strong>💼 Experiencia:</strong> {brigadista.experiencia_laboral.map(e => e.cargo).join(', ')}
                              </div>
                            )}

                            {asignacion.motivo_rechazo && (
                              <div className="detalle-tag rechazo">
                                <strong>Motivo rechazo:</strong> {asignacion.motivo_rechazo}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Acciones rápidas */}
              {brigadaSeleccionada.estado === 'formacion' && (
                <div className="modal-quick-actions">
                  <button
                    className="btn-modal btn-primary"
                    onClick={() => {
                      setShowDetalleModal(false);
                      abrirModalAsignar(brigadaSeleccionada);
                    }}
                  >
                    ➕ Asignar Más Brigadistas
                  </button>
                </div>
              )}
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
              <div className="info-item">
                <strong>Brigadistas asignados:</strong> {brigadaSeleccionada.brigadistas?.length || 0}
              </div>
            </div>

            {brigadaSeleccionada.brigadistas?.length > 0 && (
              <div className="warning-box">
                <span className="warning-icon">⚠️</span>
                <p className="warning-text">
                  <strong>Advertencia:</strong> Esta brigada tiene brigadistas asignados. Al eliminarla, todas las asignaciones se perderán.
                </p>
              </div>
            )}

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