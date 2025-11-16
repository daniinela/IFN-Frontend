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
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  
  // Modales
  const [showModalDetalle, setShowModalDetalle] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);
  const [showModalAsignarRol, setShowModalAsignarRol] = useState(false);
  const [formRol, setFormRol] = useState({
    tipo_rol_id: '',
    region_id: '',
    departamento_id: '',
    municipio_id: ''
  });

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
      
      // Cargar aprobados
      const todosRes = await usuariosService.getAll();
      const aprobados = todosRes.data.filter(u => u.estado_aprobacion === 'aprobado');
      setUsuariosAprobados(aprobados);
      
      // Roles del sistema (hardcoded por ahora, o crear endpoint)
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

  const cargarDepartamentos = async (region_id) => {
    try {
      const deptosRes = await geoService.getDepartamentos(region_id);
      setDepartamentos(deptosRes.data);
      setMunicipios([]);
    } catch (err) {
      console.error('Error cargando departamentos:', err);
    }
  };

  const cargarMunicipios = async (departamento_id) => {
    try {
      const munRes = await geoService.getMunicipios(departamento_id);
      setMunicipios(munRes.data);
    } catch (err) {
      console.error('Error cargando municipios:', err);
    }
  };

  const verDetalle = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setShowModalDetalle(true);
  };

  const aprobarUsuario = async (id) => {
    try {
      setLoading(true);
      setError('');
      
      await usuariosService.aprobar(id);
      
      setSuccess('Usuario aprobado exitosamente');
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

  const abrirAsignarRol = (usuario) => {
    setUsuarioSeleccionado(usuario);
    setFormRol({
      tipo_rol_id: '',
      region_id: '',
      departamento_id: '',
      municipio_id: ''
    });
    setShowModalAsignarRol(true);
  };

  const asignarRol = async () => {
    if (!formRol.tipo_rol_id) {
      setError('Debes seleccionar un rol');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await usuariosService.asignarRol(
        usuarioSeleccionado.id,
        formRol.tipo_rol_id,
        {
          region_id: formRol.region_id || null,
          departamento_id: formRol.departamento_id || null,
          municipio_id: formRol.municipio_id || null
        }
      );
      
      setSuccess('Rol asignado exitosamente');
      setShowModalAsignarRol(false);
      cargarDatos();
    } catch (err) {
      console.error('Error asignando rol:', err);
      setError(err.response?.data?.error || 'Error al asignar rol');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="gestion-personal">
      <div className="page-header">
        <div>
          <h1>Gestión de Personal</h1>
          <p>Revisión de candidaturas y asignación de roles operacionales</p>
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

      {/* Tabs */}
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
        <button
          className={`tab ${tabActual === 'roles' ? 'active' : ''}`}
          onClick={() => setSearchParams({ tab: 'roles' })}
        >
          Asignación de Roles
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
        ) : tabActual === 'aprobados' ? (
          // TAB 2: APROBADOS
          usuariosAprobados.length === 0 ? (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
              <h3>No hay usuarios aprobados</h3>
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
                    <th>Fecha Aprobación</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosAprobados.map(usuario => (
                    <tr key={usuario.id}>
                      <td>{usuario.nombre_completo}</td>
                      <td>{usuario.email}</td>
                      <td>{usuario.cedula}</td>
                      <td>
                        {usuario.fecha_aprobacion ? 
                          new Date(usuario.fecha_aprobacion).toLocaleDateString() : 
                          '-'
                        }
                      </td>
                      <td>
                        <button 
                          onClick={() => abrirAsignarRol(usuario)}
                          className="btn-primary"
                        >
                          Asignar Rol
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        ) : (
          // TAB 3: ROLES
          <div className="roles-section">
            <div className="alert alert-info">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              Selecciona un usuario aprobado para asignarle roles operacionales
            </div>
            <p>Usa la pestaña "Personal Aprobado" para asignar roles</p>
          </div>
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
            </div>

            <div className="modal-footer">
              {usuarioSeleccionado.estado_aprobacion === 'pendiente' && (
                <>
                  <button 
                    onClick={() => aprobarUsuario(usuarioSeleccionado.id)}
                    className="btn-success"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Aprobar
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

      {/* Modal Asignar Rol */}
      {showModalAsignarRol && usuarioSeleccionado && (
        <div className="modal-overlay" onClick={() => setShowModalAsignarRol(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Asignar Rol: {usuarioSeleccionado.nombre_completo}</h3>
              <button onClick={() => setShowModalAsignarRol(false)} className="modal-close">✕</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Rol *</label>
                <select
                  value={formRol.tipo_rol_id}
                  onChange={(e) => setFormRol({ ...formRol, tipo_rol_id: e.target.value })}
                  className="form-select"
                >
                  <option value="">-- Selecciona un rol --</option>
                  {rolesDisponibles.map(rol => (
                    <option key={rol.id} value={rol.id}>
                      {rol.nombre} ({rol.nivel})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Región (Opcional)</label>
                <select
                  value={formRol.region_id}
                  onChange={(e) => {
                    setFormRol({ ...formRol, region_id: e.target.value, departamento_id: '', municipio_id: '' });
                    if (e.target.value) cargarDepartamentos(e.target.value);
                  }}
                  className="form-select"
                >
                  <option value="">-- Todas las regiones --</option>
                  {regiones.map(region => (
                    <option key={region.id} value={region.id}>
                      {region.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Departamento (Opcional)</label>
                <select
                  value={formRol.departamento_id}
                  onChange={(e) => {
                    setFormRol({ ...formRol, departamento_id: e.target.value, municipio_id: '' });
                    if (e.target.value) cargarMunicipios(e.target.value);
                  }}
                  disabled={!formRol.region_id}
                  className="form-select"
                >
                  <option value="">-- Todos los departamentos --</option>
                  {departamentos.map(depto => (
                    <option key={depto.id} value={depto.id}>
                      {depto.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Municipio (Opcional)</label>
                <select
                  value={formRol.municipio_id}
                  onChange={(e) => setFormRol({ ...formRol, municipio_id: e.target.value })}
                  disabled={!formRol.departamento_id}
                  className="form-select"
                >
                  <option value="">-- Todos los municipios --</option>
                  {municipios.map(mun => (
                    <option key={mun.id} value={mun.id}>
                      {mun.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div className="alert alert-info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                El alcance geográfico define dónde puede operar este usuario
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowModalAsignarRol(false)} className="btn-cancel">
                Cancelar
              </button>
              <button 
                onClick={asignarRol}
                disabled={loading || !formRol.tipo_rol_id}
                className="btn-primary"
              >
                {loading ? 'Asignando...' : 'Asignar Rol'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}