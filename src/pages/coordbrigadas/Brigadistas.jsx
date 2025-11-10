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
  const [showCrearModal, setShowCrearModal] = useState(false);
  const [showEditarModal, setShowEditarModal] = useState(false);
  const [showEliminarModal, setShowEliminarModal] = useState(false);
  const [brigadistaSeleccionado, setBrigadistaSeleccionado] = useState(null);
  
  // Formulario
  const [formData, setFormData] = useState({
    email: '',
    cedula: '',
    nombre_completo: '',
    telefono: '',
    rol: 'tecnico',
    municipio_id: '',
    titulos: [],
    experiencia_laboral: [],
    disponibilidad: []
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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const resetForm = () => {
    setFormData({
      email: '',
      cedula: '',
      nombre_completo: '',
      telefono: '',
      rol: 'tecnico',
      municipio_id: '',
      titulos: [],
      experiencia_laboral: [],
      disponibilidad: []
    });
  };

  const abrirModalCrear = () => {
    resetForm();
    setShowCrearModal(true);
  };

  const abrirModalEditar = (brigadista) => {
    setBrigadistaSeleccionado(brigadista);
    setFormData({
      email: brigadista.email || '',
      cedula: brigadista.cedula || '',
      nombre_completo: brigadista.nombre_completo || '',
      telefono: brigadista.telefono || '',
      rol: brigadista.rol || 'tecnico',
      municipio_id: brigadista.municipio_id || '',
      titulos: brigadista.titulos || [],
      experiencia_laboral: brigadista.experiencia_laboral || [],
      disponibilidad: brigadista.disponibilidad || []
    });
    setShowEditarModal(true);
  };

  const crearBrigadista = async () => {
    if (!formData.email || !formData.cedula || !formData.nombre_completo) {
      setError('Email, cédula y nombre completo son requeridos');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { data: { session } } = await supabase.auth.getSession();

      // 1. Crear usuario en el sistema
      const usuarioRes = await axios.post(
        'http://localhost:3000/api/usuarios',
        {
          email: formData.email,
          cedula: formData.cedula,
          nombre_completo: formData.nombre_completo,
          telefono: formData.telefono
        },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );

      const userId = usuarioRes.data.id;

      // 2. Asignar rol de brigadista
      await axios.post(
        'http://localhost:3000/api/cuentas-rol',
        {
          usuario_id: userId,
          tipo_rol_id: 'brigadista_rol_id', // Ajustar según tu BD
          municipio_id: formData.municipio_id
        },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );

      // 3. Crear perfil de brigadista
      await axios.post(
        'http://localhost:3002/api/brigadistas',
        {
          user_id: userId,
          municipio_id: formData.municipio_id,
          rol: formData.rol,
          titulos: formData.titulos,
          experiencia_laboral: formData.experiencia_laboral,
          disponibilidad: formData.disponibilidad
        },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );

      setSuccess('Brigadista creado exitosamente');
      setShowCrearModal(false);
      resetForm();
      cargarBrigadistas();
    } catch (error) {
      console.error('Error creando brigadista:', error);
      setError(error.response?.data?.error || 'Error al crear brigadista');
    } finally {
      setLoading(false);
    }
  };

  const actualizarBrigadista = async () => {
    if (!formData.nombre_completo) {
      setError('El nombre completo es requerido');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const { data: { session } } = await supabase.auth.getSession();

      await axios.put(
        `http://localhost:3002/api/brigadistas/${brigadistaSeleccionado.id}`,
        {
          nombre_completo: formData.nombre_completo,
          telefono: formData.telefono,
          rol: formData.rol,
          municipio_id: formData.municipio_id,
          titulos: formData.titulos,
          experiencia_laboral: formData.experiencia_laboral,
          disponibilidad: formData.disponibilidad
        },
        { headers: { Authorization: `Bearer ${session.access_token}` } }
      );

      setSuccess('Brigadista actualizado exitosamente');
      setShowEditarModal(false);
      setBrigadistaSeleccionado(null);
      resetForm();
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

      setSuccess('Brigadista eliminado exitosamente');
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
          <p className="page-subtitle">Personal de trabajo de campo</p>
        </div>
        <button className="btn-create" onClick={abrirModalCrear}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          Crear Brigadista
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
          <p>No se encontraron brigadistas con los filtros aplicados</p>
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
                    <td className="td-nombre">{brigadista.nombre_completo || 'Sin nombre'}</td>
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

      {/* Modal Crear */}
      {showCrearModal && (
        <div className="modal-overlay" onClick={() => setShowCrearModal(false)}>
          <div className="modal-content modal-form" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Crear Nuevo Brigadista</h3>
              <button className="modal-close" onClick={() => setShowCrearModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Email: *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="ejemplo@correo.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Cédula: *</label>
                  <input
                    type="text"
                    name="cedula"
                    value={formData.cedula}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="1234567890"
                  />
                </div>

                <div className="form-group full-width">
                  <label className="form-label">Nombre Completo: *</label>
                  <input
                    type="text"
                    name="nombre_completo"
                    value={formData.nombre_completo}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Juan Pérez García"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Teléfono:</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="3001234567"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rol:</label>
                  <select
                    name="rol"
                    value={formData.rol}
                    onChange={handleInputChange}
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
                    name="municipio_id"
                    value={formData.municipio_id}
                    onChange={handleInputChange}
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
              <button className="btn-modal btn-cancel" onClick={() => setShowCrearModal(false)}>
                Cancelar
              </button>
              <button 
                className="btn-modal btn-confirm"
                onClick={crearBrigadista}
                disabled={loading}
              >
                {loading ? 'Creando...' : 'Crear Brigadista'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Editar */}
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
                    name="nombre_completo"
                    value={formData.nombre_completo}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Teléfono:</label>
                  <input
                    type="tel"
                    name="telefono"
                    value={formData.telefono}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Rol:</label>
                  <select
                    name="rol"
                    value={formData.rol}
                    onChange={handleInputChange}
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
                    name="municipio_id"
                    value={formData.municipio_id}
                    onChange={handleInputChange}
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

      {/* Modal Eliminar */}
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