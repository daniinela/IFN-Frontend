// src/pages/gestor_recursos/GestionPersonal.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { usuariosService } from '../../services/usuariosService';
import { geoService } from '../../services/geoService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import './GestionPersonal.css';

export default function GestionPersonal() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabActual = searchParams.get('tab') || 'pendientes';
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Datos
  const [usuariosPendientes, setUsuariosPendientes] = useState([]);
  const [usuariosAprobados, setUsuariosAprobados] = useState([]);
  const [rolesDisponibles, setRolesDisponibles] = useState([]);
  
  // Geografía
  const [regiones, setRegiones] = useState([]);
  
  // Modales
  const [showModalDetalle, setShowModalDetalle] = useState(false);
  const [showModalInvitar, setShowModalInvitar] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  
  // 🆕 Modal de aprobación con roles
  const [showModalAprobar, setShowModalAprobar] = useState(false);
  const [rolesAsignados, setRolesAsignados] = useState([{
    tipo_rol_id: '',
    region_id: '',
    departamento_id: '',
    municipio_id: '',
    departamentos: [],
    municipios: []
  }]);

  // Invitación
  const [emailInvitacion, setEmailInvitacion] = useState('');

  useEffect(() => {
    cargarDatos();
    cargarGeografia();
  }, [tabActual]);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Cargar pendientes
      const pendientesRes = await usuariosService.getPendientes();
      setUsuariosPendientes(pendientesRes.data);
      
      // 🆕 Cargar solo personal operacional
      const aprobadosRes = await usuariosService.getPersonalOperacional();
      setUsuariosAprobados(aprobadosRes.data.data || []);
      
      // 🆕 Roles operacionales únicamente
      setRolesDisponibles([
        { id: '1', codigo: 'JEFE_BRIGADA', nombre: 'Jefe de Brigada', nivel: 'operacional' },
        { id: '2', codigo: 'BOTANICO', nombre: 'Botánico', nivel: 'operacional' },
        { id: '3', codigo: 'TECNICO', nombre: 'Técnico Auxiliar', nivel: 'operacional' },
        { id: '4', codigo: 'COINVESTIGADOR', nombre: 'Coinvestigador', nivel: 'operacional' }
      ]);
    } catch (err) {
      console.error('Error cargando datos:', err);
      setError(err.response?.data?.error || 'Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const cargarGeografia = async () => {
    try {
      const regionesRes = await geoService.getRegiones();
      setRegiones(regionesRes.data);
    } catch (err) {
      console.error('Error cargando geografía:', err);
    }
  };

  const cargarDepartamentos = async (region_id, rolIndex) => {
    try {
      const deptosRes = await geoService.getDepartamentos(region_id);
      const nuevosRoles = [...rolesAsignados];
      nuevosRoles[rolIndex].departamentos = deptosRes.data;
      nuevosRoles[rolIndex].municipios = [];
      setRolesAsignados(nuevosRoles);
    } catch (err) {
      console.error('Error cargando departamentos:', err);
    }
  };

  const cargarMunicipios = async (departamento_id, rolIndex) => {
    try {
      const munRes = await geoService.getMunicipios(departamento_id);
      const nuevosRoles = [...rolesAsignados];
      nuevosRoles[rolIndex].municipios = munRes.data;
      setRolesAsignados(nuevosRoles);
    } catch (err) {
      console.error('Error cargando municipios:', err);
    }
  };

  const verDetalle = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setShowModalDetalle(true);
  };

  // 🆕 Abrir modal de aprobación con roles
  const abrirModalAprobar = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setRolesAsignados([{
      tipo_rol_id: '',
      region_id: '',
      departamento_id: '',
      municipio_id: '',
      departamentos: [],
      municipios: []
    }]);
    setShowModalAprobar(true);
  };

  // 🆕 Agregar nuevo rol
  const agregarRol = () => {
    setRolesAsignados([...rolesAsignados, {
      tipo_rol_id: '',
      region_id: '',
      departamento_id: '',
      municipio_id: '',
      departamentos: [],
      municipios: []
    }]);
  };

  // 🆕 Eliminar rol
  const eliminarRol = (index) => {
    if (rolesAsignados.length > 1) {
      setRolesAsignados(rolesAsignados.filter((_, i) => i !== index));
    }
  };

  // 🆕 Actualizar campo de rol
  const actualizarRol = (index, campo, valor) => {
    const nuevosRoles = [...rolesAsignados];
    nuevosRoles[index][campo] = valor;
    
    // Si cambia región, resetear departamento y municipio
    if (campo === 'region_id') {
      nuevosRoles[index].departamento_id = '';
      nuevosRoles[index].municipio_id = '';
      nuevosRoles[index].municipios = [];
      if (valor) cargarDepartamentos(valor, index);
    }
    
    // Si cambia departamento, resetear municipio
    if (campo === 'departamento_id') {
      nuevosRoles[index].municipio_id = '';
      if (valor) cargarMunicipios(valor, index);
    }
    
    setRolesAsignados(nuevosRoles);
  };

  // 🆕 Aprobar usuario con roles
  const aprobarUsuario = async () => {
    try {
      // Validar que todos los roles tengan tipo_rol_id
      if (rolesAsignados.some(r => !r.tipo_rol_id)) {
        setError('Todos los roles deben tener un tipo seleccionado');
        return;
      }

      // Validar que todos tengan al menos una ubicación
      if (rolesAsignados.some(r => !r.region_id && !r.departamento_id && !r.municipio_id)) {
        setError('Todos los roles deben tener al menos una ubicación geográfica');
        return;
      }

      setLoading(true);
      setError('');
      
      // Preparar roles para el backend
      const rolesParaEnviar = rolesAsignados.map(r => ({
        tipo_rol_id: r.tipo_rol_id,
        region_id: r.region_id || null,
        departamento_id: r.departamento_id || null,
        municipio_id: r.municipio_id || null
      }));

      await usuariosService.aprobarConRoles(usuarioSeleccionado.id, rolesParaEnviar);
      
      setSuccess(`Usuario aprobado con ${rolesParaEnviar.length} rol(es)`);
      setShowModalAprobar(false);
      setShowModalDetalle(false);
      cargarDatos();
    } catch (err) {
      console.error('Error aprobando usuario:', err);
      setError(err.response?.data?.error || 'Error al aprobar usuario');
    } finally {
      setLoading(false);
    }
  };

  const rechazarUsuario = async (id) => {
    const motivo = prompt('Motivo del rechazo (mínimo 10 caracteres):');
    if (!motivo || motivo.length < 10) {
      setError('El motivo debe tener al menos 10 caracteres');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await usuariosService.rechazar(id, motivo);
      
      setSuccess('Usuario rechazado');
      setShowModalDetalle(false);
      cargarDatos();
    } catch (err) {
      console.error('Error rechazando usuario:', err);
      setError(err.response?.data?.error || 'Error al rechazar usuario');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Invitar usuario
  const invitarUsuario = async () => {
    try {
      if (!emailInvitacion) {
        setError('Debes ingresar un email');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(emailInvitacion)) {
        setError('Email inválido');
        return;
      }

      setLoading(true);
      setError('');

      await usuariosService.inviteUser(emailInvitacion);

      setSuccess(`Invitación enviada a ${emailInvitacion}`);
      setEmailInvitacion('');
      setShowModalInvitar(false);
    } catch (err) {
      console.error('Error invitando usuario:', err);
      setError(err.response?.data?.error || 'Error al enviar invitación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gestion-personal">
      <div className="page-header">
        <div>
          <h1>Gestión de Personal</h1>
          <p>Revisión de candidaturas y gestión de personal operacional</p>
        </div>
        {/* 🆕 Botón Invitar Usuario */}
        <button 
          onClick={() => setShowModalInvitar(true)}
          className="btn-primary"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14" />
            <line x1="23" y1="11" x2="17" y2="11" />
          </svg>
          Invitar Usuario
        </button>
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

      {/* Tabs - Solo 2 tabs */}
      <div className="tabs">
        <button
          className={`tab ${tabActual === 'pendientes' ? 'active' : ''}`}
          onClick={() => setSearchParams({ tab: 'pendientes' })}
        >
          Pendientes de Revisión ({usuariosPendientes.length})
        </button>
        <button
          className={`tab ${tabActual === 'aprobados' ? 'active' : ''}`}
          onClick={() => setSearchParams({ tab: 'aprobados' })}
        >
          Personal Aprobado ({usuariosAprobados.length})
        </button>
      </div>

      {/* Contenido por Tab */}
      <div className="tab-content">
        {loading ? (
          <LoadingSpinner mensaje="Cargando..." />
        ) : tabActual === 'pendientes' ? (
          // TAB 1: PENDIENTES
          usuariosPendientes.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <h3>No hay candidaturas pendientes</h3>
              <p>Todas las candidaturas han sido revisadas</p>
            </div>
          ) : (
            <div className="usuarios-grid">
              {usuariosPendientes.map(usuario => (
                <div key={usuario.id} className="usuario-card">
                  <div className="card-header">
                    <h3>{usuario.nombre_completo}</h3>
                    <span className="badge-pendiente">Pendiente</span>
                  </div>
                  
                  <div className="card-body">
                    <div className="info-row">
                      <span className="label">Email:</span>
                      <span className="value">{usuario.email}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Cédula:</span>
                      <span className="value">{usuario.cedula}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Títulos:</span>
                      <span className="value">{usuario.titulos?.length || 0}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Experiencia:</span>
                      <span className="value">{usuario.experiencia_laboral?.length || 0} registros</span>
                    </div>
                  </div>
                  
                  <div className="card-footer">
                    <button onClick={() => verDetalle(usuario)} className="btn-view">
                      Ver Detalle
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )
        ) : (
          // TAB 2: APROBADOS
          usuariosAprobados.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <h3>No hay personal aprobado</h3>
              <p>Aún no se han aprobado candidaturas</p>
            </div>
          ) : (
            <div className="usuarios-tabla">
              <table>
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Cédula</th>
                    <th>Rol(es)</th>
                    <th>Fecha Aprobación</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosAprobados.map(usuario => (
                    <tr key={usuario.id}>
                      <td>{usuario.usuarios?.nombre_completo}</td>
                      <td>{usuario.usuarios?.email}</td>
                      <td>{usuario.usuarios?.cedula}</td>
                      <td>
                        <span className="badge-rol">
                          {usuario.roles_sistema?.nombre}
                        </span>
                      </td>
                      <td>
                        {usuario.usuarios?.fecha_aprobacion ? 
                          new Date(usuario.usuarios.fecha_aprobacion).toLocaleDateString() : 
                          '-'
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Modal Detalle Usuario */}
      {showModalDetalle && usuarioSeleccionado && (
        <div className="modal-overlay" onClick={() => setShowModalDetalle(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalle: {usuarioSeleccionado.nombre_completo}</h3>
              <button onClick={() => setShowModalDetalle(false)} className="modal-close">✕</button>
            </div>
            
            <div className="modal-body">
              {/* Datos Básicos */}
              <div className="section">
                <h4>Información Personal</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Email:</label>
                    <span>{usuarioSeleccionado.email}</span>
                  </div>
                  <div className="info-item">
                    <label>Cédula:</label>
                    <span>{usuarioSeleccionado.cedula}</span>
                  </div>
                  <div className="info-item">
                    <label>Teléfono:</label>
                    <span>{usuarioSeleccionado.telefono || 'No registrado'}</span>
                  </div>
                </div>
              </div>

              {/* Títulos */}
              <div className="section">
                <h4>Títulos Académicos</h4>
                {usuarioSeleccionado.titulos && usuarioSeleccionado.titulos.length > 0 ? (
                  <ul className="titulos-list">
                    {usuarioSeleccionado.titulos.map((titulo, idx) => (
                      <li key={idx}>
                        <strong>{titulo.titulo}</strong> - {titulo.institucion} ({titulo.anio})
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>No registró títulos</p>
                )}
              </div>

              {/* Experiencia */}
              <div className="section">
                <h4>Experiencia Laboral</h4>
                {usuarioSeleccionado.experiencia_laboral && usuarioSeleccionado.experiencia_laboral.length > 0 ? (
                  <div className="experiencia-list">
                    {usuarioSeleccionado.experiencia_laboral.map((exp, idx) => (
                      <div key={idx} className="experiencia-item">
                        <h5>{exp.cargo} - {exp.empresa}</h5>
                        <p className="fechas">
                          {exp.fecha_inicio} {exp.fecha_fin && `- ${exp.fecha_fin}`}
                        </p>
                        <p>{exp.descripcion}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p>No registró experiencia</p>
                )}
              </div>

              {/* Info Extra */}
              {usuarioSeleccionado.info_extra_calificaciones && (
                <div className="section">
                  <h4>Información Adicional</h4>
                  <p>{usuarioSeleccionado.info_extra_calificaciones}</p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {usuarioSeleccionado.estado_aprobacion === 'pendiente' && (
                <>
                  <button 
                    onClick={() => {
                      setShowModalDetalle(false);
                      abrirModalAprobar(usuarioSeleccionado);
                    }}
                    className="btn-success"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Aprobar y Asignar Roles
                  </button>
                  <button 
                    onClick={() => rechazarUsuario(usuarioSeleccionado.id)}
                    className="btn-danger"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    Rechazar
                  </button>
                </>
              )}
              <button onClick={() => setShowModalDetalle(false)} className="btn-cancel">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 Modal Aprobar con Roles */}
      {showModalAprobar && usuarioSeleccionado && (
        <div className="modal-overlay" onClick={() => setShowModalAprobar(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Aprobar: {usuarioSeleccionado.nombre_completo}</h3>
              <button onClick={() => setShowModalAprobar(false)} className="modal-close">✕</button>
            </div>
            
            <div className="modal-body">
              <div className="alert alert-info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Debes asignar al menos un rol con su ubicación geográfica
              </div>

              {rolesAsignados.map((rol, index) => (
                <div key={index} className="rol-section">
                  <div className="rol-header">
                    <h4>Rol {index + 1}</h4>
                    {rolesAsignados.length > 1 && (
                      <button 
                        type="button"
                        onClick={() => eliminarRol(index)}
                        className="btn-delete-mini"
                      >
                        ✕
                      </button>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Tipo de Rol *</label>
                    <select
                      value={rol.tipo_rol_id}
                      onChange={(e) => actualizarRol(index, 'tipo_rol_id', e.target.value)}
                      className="form-select"
                    >
                      <option value="">-- Selecciona un rol --</option>
                      {rolesDisponibles.map(r => (
                        <option key={r.id} value={r.id}>
                          {r.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Región *</label>
                    <select
                      value={rol.region_id}
                      onChange={(e) => actualizarRol(index, 'region_id', e.target.value)}
                      className="form-select"
                    >
                      <option value="">-- Selecciona región --</option>
                      {regiones.map(region => (
                        <option key={region.id} value={region.id}>
                          {region.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Departamento</label>
                    <select
                      value={rol.departamento_id}
                      onChange={(e) => actualizarRol(index, 'departamento_id', e.target.value)}
                      disabled={!rol.region_id}
                      className="form-select"
                    >
                      <option value="">-- Todos los departamentos --</option>
                      {rol.departamentos?.map(depto => (
                        <option key={depto.id} value={depto.id}>
                          {depto.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Municipio</label>
                    <select
                      value={rol.municipio_id}
                      onChange={(e) => actualizarRol(index, 'municipio_id', e.target.value)}
                      disabled={!rol.departamento_id}
                      className="form-select"
                    >
                      <option value="">-- Todos los municipios --</option>
                      {rol.municipios?.map(mun => (
                        <option key={mun.id} value={mun.id}>
                          {mun.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}

              <button 
                type="button"
                onClick={agregarRol}
                className="btn-add"
              >
                + Agregar Otro Rol
              </button>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowModalAprobar(false)} className="btn-cancel">
                Cancelar
              </button>
              <button 
                onClick={aprobarUsuario}
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Aprobando...' : 'Aprobar Usuario'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 Modal Invitar Usuario */}
      {showModalInvitar && (
        <div className="modal-overlay" onClick={() => setShowModalInvitar(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Invitar Nuevo Usuario</h3>
              <button onClick={() => setShowModalInvitar(false)} className="modal-close">✕</button>
            </div>
            
            <div className="modal-body">
              <p>El usuario recibirá un email con un enlace para completar su registro.</p>
              
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  value={emailInvitacion}
                  onChange={(e) => setEmailInvitacion(e.target.value)}
                  placeholder="usuario@ejemplo.com"
                  className="form-input"
                />
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowModalInvitar(false)} className="btn-cancel">
                Cancelar
              </button>
              <button 
                onClick={invitarUsuario}
                disabled={loading || !emailInvitacion}
                className="btn-primary"
              >
                {loading ? 'Enviando...' : 'Enviar Invitación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}