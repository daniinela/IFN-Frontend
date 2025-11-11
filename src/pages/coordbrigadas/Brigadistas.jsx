// src/pages/coordbrigadas/Brigadistas.jsx
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabaseClient';
import axios from '../../api/axiosConfig';
import './Brigadistas.css';

function Brigadistas() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [brigadistas, setBrigadistas] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [filtroRol, setFiltroRol] = useState('todos');
  const [filtroMunicipio, setFiltroMunicipio] = useState('');
  const [busqueda, setBusqueda] = useState('');
  
  // Modales
  const [showInvitarModal, setShowInvitarModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showEliminarModal, setShowEliminarModal] = useState(false);
  const [brigadistaSeleccionado, setBrigadistaSeleccionado] = useState(null);
  
  // Formulario de invitación (solo email y rol esperado)
  const [formInvitacion, setFormInvitacion] = useState({
    email: '',
    rol_esperado: 'tecnico',
    municipio_id: ''
  });

  // Formulario de edición
  const [formEdicion, setFormEdicion] = useState({
    nombre_completo: '',
    telefono: '',
    rol: 'tecnico',
    municipio_id: ''
  });

  const cargarMunicipios = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3003/api/ubicaciones/municipios');
      setMunicipios(response.data);
    } catch (error) {
      console.error('Error cargando municipios:', error);
    }
  }, []);

  const cargarBrigadistas = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('No autenticado');
        return;
      }

      const response = await axios.get(
        'http://localhost:3002/api/brigadistas',
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );

      setBrigadistas(response.data || []);
    } catch (error) {
      console.error('Error cargando brigadistas:', error);
      setError('Error al cargar brigadistas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarBrigadistas();
    cargarMunicipios();
  }, [cargarBrigadistas, cargarMunicipios]);

  const resetFormInvitacion = () => {
    setFormInvitacion({
      email: '',
      rol_esperado: 'tecnico',
      municipio_id: ''
    });
  };

  const abrirModalInvitar = () => {
    resetFormInvitacion();
    setShowInvitarModal(true);
  };

  const abrirModalEditar = (brigadista) => {
    setBrigadistaSeleccionado(brigadista);
    setFormEdicion({
      nombre_completo: brigadista.nombre_completo || '',
      telefono: brigadista.telefono || '',
      rol: brigadista.rol || 'tecnico',
      municipio_id: brigadista.municipio_id || ''
    });
    setShowEditarModal(true);
  };

  // ✅ NUEVO: Validar email único
  const validarEmailUnico = async (email) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/usuarios/email/${email}`);
      if (response.data) {
        setError('⚠️ Este email ya está registrado en el sistema');
        return false;
      }
      return true;
    } catch (error) {
      if (error.response?.status === 404) {
        // Email no existe, está disponible
        return true;
      }
      console.error('Error validando email:', error);
      return false;
    }
  };

  // ✅ CORREGIDO: Enviar invitación por email (usando Supabase)
  const invitarBrigadista = async () => {
    if (!formInvitacion.email) {
      setError('El email es requerido');
      return;
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formInvitacion.email)) {
      setError('Formato de email inválido');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // ✅ Validar que el email no exista
      const esUnico = await validarEmailUnico(formInvitacion.email);
      if (!esUnico) {
        setLoading(false);
        return;
      }

      console.log('📧 Enviando invitación a:', formInvitacion.email);

      // ✅ INVITAR CON SUPABASE
      const { data, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
        formInvitacion.email,
        {
          data: {
            rol_esperado: formInvitacion.rol_esperado,
            municipio_id: formInvitacion.municipio_id || null,
            invitado_como: 'brigadista'
          },
          redirectTo: `${window.location.origin}/register`
        }
      );

      if (inviteError) {
        console.error('❌ Error Supabase:', inviteError);
        throw new Error(inviteError.message);
      }

      console.log('✅ Invitación enviada:', data);

      setSuccess(`✅ Invitación enviada a ${formInvitacion.email}`);
      setShowInvitarModal(false);
      resetFormInvitacion();
      
      // Opcional: Guardar registro de invitación pendiente en BD
      try {
        await axios.post('http://localhost:3002/api/brigadistas/invitacion', {
          email: formInvitacion.email,
          rol_esperado: formInvitacion.rol_esperado,
          municipio_id: formInvitacion.municipio_id,
          estado: 'pendiente'
        });
      } catch (err) {
        console.warn('No se pudo registrar la invitación en BD:', err);
      }

    } catch (error) {
      console.error('Error enviando invitación:', error);
      setError(error.message || 'Error al enviar invitación');
    } finally {
      setLoading(false);
    }
  };

  const actualizarBrigadista = async () => {
    if (!formEdicion.nombre_completo) {
      setError('El nombre completo es requerido');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { data: { session } } = await supabase.auth.getSession();

      await axios.put(
        `http://localhost:3002/api/brigadistas/${brigadistaSeleccionado.id}`,
        formEdicion,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );

      setSuccess('✅ Brigadista actualizado exitosamente');
      setShowEditarModal(false);
      setBrigadistaSeleccionado(null);
      cargarBrigadistas();
    } catch (error) {
      console.error('Error actualizando brigadista:', error);
      setError(error.response?.data?.error || 'Error al actualizar brigadista');
    } finally {
      setLoading(false);
    }
  };

  const eliminarBrigadista = async () => {
    try {
      setLoading(true);
      setError('');

      const { data: { session } } = await supabase.auth.getSession();

      await axios.delete(
        `http://localhost:3002/api/brigadistas/${brigadistaSeleccionado.id}`,
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );

      setSuccess('✅ Brigadista eliminado exitosamente');
      setShowEliminarModal(false);
      setBrigadistaSeleccionado(null);
      cargarBrigadistas();
    } catch (error) {
      console.error('Error eliminando brigadista:', error);
      setError(error.response?.data?.error || 'Error al eliminar brigadista');
    } finally {
      setLoading(false);
    }
  };

  const brigadistasFiltrados = brigadistas.filter(b => {
    const cumpleRol = filtroRol === 'todos' || b.rol === filtroRol;
    const cumpleMunicipio = !filtroMunicipio || 
      b.municipio?.toLowerCase().includes(filtroMunicipio.toLowerCase());
    const cumpleBusqueda = !busqueda ||
      b.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
      b.email?.toLowerCase().includes(busqueda.toLowerCase()) ||
      b.cedula?.includes(busqueda);
    
    return cumpleRol && cumpleMunicipio && cumpleBusqueda;
  });

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
    <div className="brigadistas-page">
      <div className="page-header">
        <div>
          <h2 className="page-title">Gestión de Brigadistas</h2>
          <p className="page-subtitle">Invitar y administrar personal de trabajo de campo</p>
        </div>
        <button className="btn-create" onClick={abrirModalInvitar}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="8.5" cy="7" r="4"/>
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
          Invitar Brigadista
        </button>
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

      {/* Barra de filtros y búsqueda */}
      <div className="filtros-section">
        <div className="filtros-principales">
          <div className="form-group-inline">
            <label className="form-label-inline">Rol:</label>
            <select
              value={filtroRol}
              onChange={(e) => setFiltroRol(e.target.value)}
              className="form-select-inline"
            >
              <option value="todos">Todos</option>
              <option value="jefe">Jefe</option>
              <option value="botanico">Botánico</option>
              <option value="tecnico">Técnico</option>
              <option value="coinvestigador">Coinvestigador</option>
            </select>
          </div>

          <div className="form-group-inline">
            <label className="form-label-inline">Municipio:</label>
            <input
              type="text"
              placeholder="Filtrar por municipio..."
              value={filtroMunicipio}
              onChange={(e) => setFiltroMunicipio(e.target.value)}
              className="form-input-inline"
            />
          </div>

          <div className="form-group-inline flex-1">
            <label className="form-label-inline">Buscar:</label>
            <input
              type="text"
              placeholder="Nombre, email o cédula..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="form-input-inline"
            />
          </div>
        </div>

        <div className="resultados-info">
          <span>{brigadistasFiltrados.length} brigadista(s) encontrado(s)</span>
        </div>
      </div>

      {/* Lista de brigadistas */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando brigadistas...</p>
        </div>
      ) : brigadistasFiltrados.length === 0 ? (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          <h3>No hay brigadistas</h3>
          <p>Invita al primer brigadista usando el botón "Invitar Brigadista"</p>
        </div>
      ) : (
        <div className="brigadistas-table-container">
          <table className="brigadistas-table">
            <thead>
              <tr>
                <th>Nombre Completo</th>
                <th>Email</th>
                <th>Cédula</th>
                <th>Rol</th>
                <th>Municipio</th>
                <th>Teléfono</th>
                <th>Estado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {brigadistasFiltrados.map(brigadista => {
                const badge = getRolBadge(brigadista.rol);
                
                return (
                  <tr key={brigadista.id}>
                    <td className="td-nombre">{brigadista.nombre_completo || 'Pendiente'}</td>
                    <td className="td-email">{brigadista.email || 'N/A'}</td>
                    <td className="td-cedula">{brigadista.cedula || 'N/A'}</td>
                    <td>
                      <span 
                        className="rol-badge-table" 
                        style={{ backgroundColor: `${badge.color}20`, color: badge.color }}
                      >
                        {badge.text}
                      </span>
                    </td>
                    <td className="td-municipio">{brigadista.municipio || 'N/A'}</td>
                    <td className="td-telefono">{brigadista.telefono || 'N/A'}</td>
                    <td>
                      <span className={`estado-badge-table ${brigadista.activo ? 'activo' : 'inactivo'}`}>
                        {brigadista.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="td-acciones">
                      <button 
                        className="btn-table btn-edit"
                        onClick={() => abrirModalEditar(brigadista)}
                        title="Editar"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                        </svg>
                      </button>
                      <button 
                        className="btn-table btn-delete"
                        onClick={() => {
                          setBrigadistaSeleccionado(brigadista);
                          setShowEliminarModal(true);
                        }}
                        title="Eliminar"
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ✅ NUEVO: Modal Invitar (solo email y rol) */}
      {showInvitarModal && (
        <div className="modal-overlay" onClick={() => setShowInvitarModal(false)}>
          <div className="modal-content modal-form" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Invitar Brigadista</h3>
              <button className="modal-close" onClick={() => setShowInvitarModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="alert alert-info" style={{ marginBottom: '20px' }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 16v-4M12 8h.01" stroke="currentColor" strokeWidth="2"/>
                </svg>
                <div>
                  <strong>ℹ️ Proceso de invitación</strong>
                  <p>Se enviará un email de invitación. El brigadista completará sus datos al registrarse.</p>
                </div>
              </div>

              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Email del brigadista: *</label>
                  <input
                    type="email"
                    value={formInvitacion.email}
                    onChange={(e) => setFormInvitacion({ ...formInvitacion, email: e.target.value })}
                    className="form-input"
                    placeholder="ejemplo@correo.com"
                    required
                  />
                  <small className="form-help">Se enviará la invitación a este correo</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Rol esperado:</label>
                  <select
                    value={formInvitacion.rol_esperado}
                    onChange={(e) => setFormInvitacion({ ...formInvitacion, rol_esperado: e.target.value })}
                    className="form-select"
                  >
                    <option value="tecnico">Técnico</option>
                    <option value="botanico">Botánico</option>
                    <option value="jefe">Jefe</option>
                    <option value="coinvestigador">Coinvestigador</option>
                  </select>
                  <small className="form-help">Rol sugerido (puede cambiarse al registrarse)</small>
                </div>

                <div className="form-group">
                  <label className="form-label">Municipio (opcional):</label>
                  <select
                    value={formInvitacion.municipio_id}
                    onChange={(e) => setFormInvitacion({ ...formInvitacion, municipio_id: e.target.value })}
                    className="form-select"
                  >
                    <option value="">-- Sin asignar --</option>
                    {municipios.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-modal btn-cancel" onClick={() => setShowInvitarModal(false)}>
                Cancelar
              </button>
              <button 
                className="btn-modal btn-confirm"
                onClick={invitarBrigadista}
                disabled={loading || !formInvitacion.email}
              >
                {loading ? 'Enviando invitación...' : '📧 Enviar Invitación'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar (sin cambios) */}
      {showEditarModal && brigadistaSeleccionado && (
        <div className="modal-overlay" onClick={() => setShowEditarModal(false)}>
          <div className="modal-content modal-form" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Editar Brigadista</h3>
              <button className="modal-close" onClick={() => setShowEditarModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Nombre Completo: *</label>
                  <input
                    type="text"
                    value={formEdicion.nombre_completo}
                    onChange={(e) => setFormEdicion({ ...formEdicion, nombre_completo: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Teléfono:</label>
                  <input
                    type="tel"
                    value={formEdicion.telefono}
                    onChange={(e) => setFormEdicion({ ...formEdicion, telefono: e.target.value })}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rol:</label>
                  <select
                    value={formEdicion.rol}
                    onChange={(e) => setFormEdicion({ ...formEdicion, rol: e.target.value })}
                    className="form-select"
                  >
                    <option value="tecnico">Técnico</option>
                    <option value="botanico">Botánico</option>
                    <option value="jefe">Jefe</option>
                    <option value="coinvestigador">Coinvestigador</option>
                  </select>
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Municipio:</label>
                  <select
                    value={formEdicion.municipio_id}
                    onChange={(e) => setFormEdicion({ ...formEdicion, municipio_id: e.target.value })}
                    className="form-select"
                  >
                    <option value="">-- Selecciona un municipio --</option>
                    {municipios.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-modal btn-cancel" onClick={() => setShowEditarModal(false)}>
                Cancelar
              </button>
              <button 
                className="btn-modal btn-confirm"
                onClick={actualizarBrigadista}
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar (sin cambios) */}
      {showEliminarModal && brigadistaSeleccionado && (
        <div className="modal-overlay" onClick={() => setShowEliminarModal(false)}>
          <div className="modal-content modal-confirm" onClick={e => e.stopPropagation()}>
            <div className="modal-confirm-icon">⚠️</div>
            <h3 className="modal-confirm-title">¿Eliminar brigadista?</h3>
            <p className="modal-confirm-text">Esta acción no se puede deshacer</p>

            <div className="confirm-info-box">
              <div className="info-item">
                <strong>Nombre:</strong> {brigadistaSeleccionado.nombre_completo}
              </div>
              <div className="info-item">
                <strong>Email:</strong> {brigadistaSeleccionado.email}
              </div>
            </div>

            <div className="modal-confirm-actions">
              <button className="btn-modal btn-cancel" onClick={() => setShowEliminarModal(false)}>
                Cancelar
              </button>
              <button className="btn-modal btn-danger" onClick={eliminarBrigadista}>
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Brigadistas;