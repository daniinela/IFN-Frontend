import { useState, useEffect, useCallback } from 'react';
import axios from '../../api/axiosConfig';
import './Brigadistas.css';

<<<<<<< HEAD
const API_USUARIOS = 'https://ifn-usuarios-service.onrender.com';
const API_BRIGADAS = 'https://ifn-brigadas-service.onrender.com';

=======
>>>>>>> vercel/main
function Brigadistas() {
  const [loading, setLoading] = useState(false);
  const [brigadistas, setBrigadistas] = useState([]);
  const [filtroRol, setFiltroRol] = useState('todos');
  const [filtroMunicipio, setFiltroMunicipio] = useState('');
  const [brigadistasPendientes, setBrigadistasPendientes] = useState([]);
  const [emailInvitacion, setEmailInvitacion] = useState('');
  
<<<<<<< HEAD
=======
  // Modales
>>>>>>> vercel/main
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [showEliminarModal, setShowEliminarModal] = useState(false);
  
<<<<<<< HEAD
=======
  // Formularios
>>>>>>> vercel/main
  const [brigadistaSeleccionado, setBrigadistaSeleccionado] = useState(null);
  const [usuarioDatos, setUsuarioDatos] = useState(null);

  const cargarBrigadistas = useCallback(async () => {
    try {
      setLoading(true);
<<<<<<< HEAD
      const response = await axios.get(`${API_BRIGADAS}/api/brigadistas`);
=======
      const response = await axios.get('http://localhost:3002/api/brigadistas');
>>>>>>> vercel/main
      setBrigadistas(response.data);
    } catch (error) {
      console.error('Error cargando brigadistas:', error);
      alert('Error al cargar brigadistas');
    } finally {
      setLoading(false);
    }
  }, []);

  const cargarUsuarios = useCallback(async () => {
    try {
<<<<<<< HEAD
      const response = await axios.get(`${API_USUARIOS}/api/usuarios`);
=======
      const response = await axios.get('http://localhost:3001/api/usuarios');
>>>>>>> vercel/main
      const pendientes = response.data.filter(u => 
        u.rol === 'brigadista' && 
        !brigadistas.some(b => b.user_id === u.id)
      );
      setBrigadistasPendientes(pendientes);
    } catch (error) {
      console.error('Error cargando usuarios:', error);
    }
  }, [brigadistas]);

  const cargarUsuarioPorId = useCallback(async (userId) => {
    try {
<<<<<<< HEAD
      const response = await axios.get(`${API_USUARIOS}/api/usuarios/${userId}`);
=======
      const response = await axios.get(`http://localhost:3001/api/usuarios/${userId}`);
>>>>>>> vercel/main
      setUsuarioDatos(response.data);
    } catch (error) {
      console.error('Error cargando usuario:', error);
    }
  }, []);

  useEffect(() => {
    cargarBrigadistas();
  }, [cargarBrigadistas]);

  useEffect(() => {
    if (brigadistas.length > 0) {
      cargarUsuarios();
    }
  }, [brigadistas, cargarUsuarios]);

  useEffect(() => {
    if (brigadistaSeleccionado?.user_id && showDetalleModal) {
      cargarUsuarioPorId(brigadistaSeleccionado.user_id);
    }
  }, [brigadistaSeleccionado?.user_id, showDetalleModal, cargarUsuarioPorId]);

  const enviarInvitacion = async () => {
    try {
      if (!emailInvitacion || !emailInvitacion.includes('@')) {
        alert('⚠️ Ingresa un email válido');
        return;
      }

      setLoading(true);

      await axios.post(
<<<<<<< HEAD
        `${API_USUARIOS}/api/usuarios/invite`,
=======
        'http://localhost:3001/api/usuarios/invite',
>>>>>>> vercel/main
        { 
          email: emailInvitacion,
          rol: 'brigadista'
        }
      );

      alert(`✅ Invitación enviada a ${emailInvitacion}\n\nEl usuario recibirá un email para completar su registro.`);
      
      setEmailInvitacion('');
      setShowCrearModal(false);
      cargarBrigadistas();
    } catch (error) {
      console.error('Error enviando invitación:', error);
      
      if (error.response?.status === 409) {
        alert('⚠️ Este email ya está registrado en el sistema');
      } else {
        alert(error.response?.data?.error || 'Error al enviar invitación');
      }
    } finally {
      setLoading(false);
    }
  };

<<<<<<< HEAD
  const eliminarBrigadista = async () => {
    try {
      setLoading(true);
      
      console.log('🗑️ Eliminando brigadista:', brigadistaSeleccionado.id);
      console.log('User ID:', brigadistaSeleccionado.user_id);
      
      if (brigadistaSeleccionado.user_id) {
        console.log('Llamando a usuarios-service...');
        await axios.delete(`${API_USUARIOS}/api/usuarios/${brigadistaSeleccionado.user_id}`);
        console.log('✅ Eliminado de usuarios-service (cascada a brigadistas y auth)');
      } else {
        console.log('Sin user_id, eliminando solo brigadista...');
        await axios.delete(`${API_BRIGADAS}/api/brigadistas/${brigadistaSeleccionado.id}`);
        console.log('✅ Eliminado solo de brigadistas');
      }
      
      alert('✅ Brigadista eliminado exitosamente de todas las tablas');
      setShowEliminarModal(false);
      setBrigadistaSeleccionado(null);
      cargarBrigadistas();
      
    } catch (error) {
      console.error('❌ Error eliminando:', error);
      alert(error.response?.data?.error || 'Error al eliminar brigadista');
    } finally {
      setLoading(false);
    }
  };
=======
const eliminarBrigadista = async () => {
  try {
    setLoading(true);
    
    console.log('🗑️ Eliminando brigadista:', brigadistaSeleccionado.id);
    console.log('User ID:', brigadistaSeleccionado.user_id);
    
    // ✅ PRIMERO: Eliminar desde usuarios-service (esto eliminará en cascada)
    if (brigadistaSeleccionado.user_id) {
      console.log('Llamando a usuarios-service...');
      await axios.delete(
        `http://localhost:3001/api/usuarios/${brigadistaSeleccionado.user_id}`
      );
      console.log('✅ Eliminado de usuarios-service (cascada a brigadistas y auth)');
    } else {
      // Si no tiene user_id, eliminar solo de brigadistas
      console.log('Sin user_id, eliminando solo brigadista...');
      await axios.delete(
        `http://localhost:3002/api/brigadistas/${brigadistaSeleccionado.id}`
      );
      console.log('✅ Eliminado solo de brigadistas');
    }
    
    alert('✅ Brigadista eliminado exitosamente de todas las tablas');
    setShowEliminarModal(false);
    setBrigadistaSeleccionado(null);
    cargarBrigadistas();
    
  } catch (error) {
    console.error('❌ Error eliminando:', error);
    alert(error.response?.data?.error || 'Error al eliminar brigadista');
  } finally {
    setLoading(false);
  }
};
>>>>>>> vercel/main

  const brigadistasFiltrados = brigadistas.filter(b => {
    const cumpleRol = filtroRol === 'todos' || b.rol === filtroRol;
    const cumpleMunicipio = !filtroMunicipio || 
      b.municipio?.toLowerCase().includes(filtroMunicipio.toLowerCase());
    return cumpleRol && cumpleMunicipio;
  });

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
    <div className="brigadistas-container">
<<<<<<< HEAD
=======
      {/* Header */}
>>>>>>> vercel/main
      <div className="brigadistas-header">
        <div className="header-info">
          <h2 className="brigadistas-title">Gestión de Brigadistas</h2>
          <p className="brigadistas-subtitle">Total: {brigadistasFiltrados.length} brigadistas registrados</p>
        </div>
        <button className="btn-create-brigadista" onClick={() => setShowCrearModal(true)}>
          <span className="btn-icon">➕</span>
          Invitar Brigadista
        </button>
      </div>

<<<<<<< HEAD
=======
      {/* Alerta de pendientes */}
>>>>>>> vercel/main
      {brigadistasPendientes.length > 0 && (
        <div className="alert-pendientes">
          <span className="alert-icon">⏳</span>
          <div className="alert-content">
            <div className="alert-title">
              {brigadistasPendientes.length} invitación(es) pendiente(s)
            </div>
            <div className="alert-description">
              Usuarios que no han completado su perfil
            </div>
          </div>
          <button className="btn-ver-pendientes" onClick={() => setShowCrearModal(true)}>
            Ver detalles
          </button>
        </div>
      )}

<<<<<<< HEAD
=======
      {/* Filtros */}
>>>>>>> vercel/main
      <div className="brigadistas-filters">
        <div className="filter-buttons">
          {['todos', 'jefe', 'botanico', 'tecnico', 'coinvestigador'].map(rol => {
            const badge = getRolBadge(rol);
            return (
              <button
                key={rol}
                className={`filter-btn ${filtroRol === rol ? 'active' : ''}`}
                onClick={() => setFiltroRol(rol)}
              >
                {rol === 'todos' ? '📋 Todos' : `${badge.icon} ${badge.text}`}
              </button>
            );
          })}
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar por municipio..."
            value={filtroMunicipio}
            onChange={e => setFiltroMunicipio(e.target.value)}
            className="search-input"
          />
          <span className="search-icon">🔍</span>
        </div>
      </div>

<<<<<<< HEAD
=======
      {/* Lista */}
>>>>>>> vercel/main
      {loading ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p className="loading-text">Cargando brigadistas...</p>
        </div>
      ) : brigadistasFiltrados.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">👥</span>
          <h3 className="empty-title">No hay brigadistas</h3>
          <p className="empty-description">Invita el primer brigadista para comenzar</p>
        </div>
      ) : (
        <div className="brigadistas-grid">
          {brigadistasFiltrados.map(brigadista => {
            const badge = getRolBadge(brigadista.rol);
            return (
              <div key={brigadista.id} className="brigadista-card">
                <div className="brigadista-card-header">
                  <div 
                    className="rol-icon" 
                    style={{ background: `${badge.color}20` }}
                  >
                    {badge.icon}
                  </div>
                  <div className="brigadista-info">
                    <h3 className="brigadista-name">
                      {brigadista.nombre_completo || 'Sin nombre'}
                    </h3>
                    <span 
                      className="rol-badge"
                      style={{
                        background: `${badge.color}20`,
                        color: badge.color
                      }}
                    >
                      {badge.text}
                    </span>
                  </div>
                </div>

                <div className="brigadista-details">
                  <div className="detail-row">
                    <span className="detail-icon">📧</span>
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{brigadista.email || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-icon">📍</span>
                    <span className="detail-label">Municipio:</span>
                    <span className="detail-value">{brigadista.municipio || 'No especificado'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-icon">🎓</span>
                    <span className="detail-label">Títulos:</span>
                    <span className="detail-value">{brigadista.titulos?.length || 0}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-icon">💼</span>
                    <span className="detail-label">Experiencias:</span>
                    <span className="detail-value">{brigadista.experiencia_laboral?.length || 0}</span>
                  </div>
                </div>

                <div className="brigadista-actions">
                  <button 
                    className="btn-view-details"
                    onClick={() => {
                      setBrigadistaSeleccionado(brigadista);
                      setShowDetalleModal(true);
                    }}
                  >
                    Ver Detalles
                  </button>
                  <button 
                    className="btn-delete-small"
                    onClick={() => {
                      setBrigadistaSeleccionado(brigadista);
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

<<<<<<< HEAD
=======
      {/* Modal Invitar */}
>>>>>>> vercel/main
      {showCrearModal && (
        <div className="modal-overlay" onClick={() => setShowCrearModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📧 Invitar Nuevo Brigadista</h3>
              <button className="modal-close" onClick={() => setShowCrearModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <p className="modal-description">
                Ingresa el email del brigadista. Recibirá un enlace para completar su registro.
              </p>

              <div className="form-group">
                <label className="form-label">Email del brigadista: *</label>
                <input
                  type="email"
                  value={emailInvitacion}
                  onChange={e => setEmailInvitacion(e.target.value)}
                  placeholder="ejemplo@email.com"
                  className="form-input"
                />
              </div>

<<<<<<< HEAD
=======
              {/* Lista de usuarios pendientes */}
>>>>>>> vercel/main
              {brigadistasPendientes.length > 0 && (
                <div className="pendientes-box">
                  <h4 className="pendientes-title">
                    ⏳ Invitaciones Pendientes ({brigadistasPendientes.length})
                  </h4>
                  <p className="pendientes-description">
                    Esperando que completen su perfil:
                  </p>
                  <div className="pendientes-lista">
                    {brigadistasPendientes.map(user => (
                      <div key={user.id} className="pendiente-item">
                        <div className="pendiente-info">
                          <div className="pendiente-nombre">
                            {user.nombre_completo !== 'Pendiente de completar' 
                              ? user.nombre_completo 
                              : 'Sin nombre'}
                          </div>
                          <div className="pendiente-email">{user.email}</div>
                        </div>
                        <span className="pendiente-badge">Esperando</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-modal btn-cancel"
                onClick={() => {
                  setShowCrearModal(false);
                  setEmailInvitacion('');
                }}
              >
                Cancelar
              </button>
              <button 
                className="btn-modal btn-confirm"
                onClick={enviarInvitacion}
                disabled={loading}
              >
                {loading ? 'Enviando...' : '📧 Enviar Invitación'}
              </button>
            </div>
          </div>
        </div>
      )}

<<<<<<< HEAD
=======
      {/* Modal Detalle */}
>>>>>>> vercel/main
      {showDetalleModal && brigadistaSeleccionado && (
        <div className="modal-overlay" onClick={() => setShowDetalleModal(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">👤 Detalle del Brigadista</h3>
              <button className="modal-close" onClick={() => setShowDetalleModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {usuarioDatos ? (
                <div>
                  <div className="detalle-header">
                    <div 
                      className="detalle-avatar"
                      style={{ background: `${getRolBadge(brigadistaSeleccionado.rol).color}20` }}
                    >
                      {getRolBadge(brigadistaSeleccionado.rol).icon}
                    </div>
                    <div className="detalle-info-principal">
                      <h4 className="detalle-nombre">{usuarioDatos.nombre_completo}</h4>
                      <div className="detalle-email">📧 {usuarioDatos.email}</div>
                      <span 
                        className="rol-badge-large"
                        style={{
                          background: `${getRolBadge(brigadistaSeleccionado.rol).color}20`,
                          color: getRolBadge(brigadistaSeleccionado.rol).color
                        }}
                      >
                        {getRolBadge(brigadistaSeleccionado.rol).text}
                      </span>
                    </div>
                  </div>

                  <div className="detalle-section">
                    <h5 className="section-title">📍 Información de Ubicación</h5>
                    <div className="info-box">
                      <div className="info-item-detail">
                        <span className="info-label-detail">Municipio:</span>
                        <span className="info-value-detail">
                          {brigadistaSeleccionado.municipio || 'No especificado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {brigadistaSeleccionado.titulos && brigadistaSeleccionado.titulos.length > 0 && (
                    <div className="detalle-section">
                      <h5 className="section-title">
                        🎓 Títulos Académicos ({brigadistaSeleccionado.titulos.length})
                      </h5>
                      <div className="titulos-lista">
                        {brigadistaSeleccionado.titulos.map((titulo, idx) => (
                          <div key={idx} className="titulo-card">
                            <div className="titulo-nombre">{titulo.titulo}</div>
                            <div className="titulo-institucion">
                              {titulo.institucion} • {titulo.año || titulo.anio}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {brigadistaSeleccionado.experiencia_laboral && brigadistaSeleccionado.experiencia_laboral.length > 0 && (
                    <div className="detalle-section">
                      <h5 className="section-title">
                        💼 Experiencia Laboral ({brigadistaSeleccionado.experiencia_laboral.length})
                      </h5>
                      <div className="experiencia-lista">
                        {brigadistaSeleccionado.experiencia_laboral.map((exp, idx) => (
                          <div key={idx} className="experiencia-card">
                            <div className="experiencia-cargo">{exp.cargo}</div>
                            <div className="experiencia-empresa">{exp.empresa}</div>
                            {exp.años && (
                              <div className="experiencia-años">
                                {exp.años} años de experiencia
                              </div>
                            )}
                            {exp.descripcion && (
                              <div className="experiencia-descripcion">{exp.descripcion}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="loading-detalle">
                  <div className="loading-spinner"></div>
                  <p className="loading-text">Cargando datos...</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-modal btn-cancel"
                onClick={() => {
                  setShowDetalleModal(false);
                  setUsuarioDatos(null);
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

<<<<<<< HEAD
=======
      {/* Modal Eliminar */}
>>>>>>> vercel/main
      {showEliminarModal && brigadistaSeleccionado && (
        <div className="modal-overlay" onClick={() => setShowEliminarModal(false)}>
          <div className="modal-content modal-confirm" onClick={e => e.stopPropagation()}>
            <div className="confirm-header">
              <div className="confirm-icon">⚠️</div>
              <h3 className="confirm-title">¿Eliminar brigadista?</h3>
              <p className="confirm-description">Esta acción no se puede deshacer</p>
            </div>

            <div className="confirm-info">
              <div className="confirm-info-item">
                <strong>Nombre:</strong> {brigadistaSeleccionado.nombre_completo || 'Sin nombre'}
              </div>
              <div className="confirm-info-item">
                <strong>Rol:</strong> {getRolBadge(brigadistaSeleccionado.rol).text}
              </div>
            </div>

            <div className="confirm-actions">
              <button 
                className="btn-modal btn-cancel"
                onClick={() => setShowEliminarModal(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-modal btn-danger"
                onClick={eliminarBrigadista}
                disabled={loading}
              >
                {loading ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Brigadistas;