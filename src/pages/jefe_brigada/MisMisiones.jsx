// src/pages/jefe_brigada/MisMisiones.jsx 
import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { brigadasService } from '../../services/brigadasService';
import { usuariosService } from '../../services/usuariosService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import LeafletMapComponent from '../../components/common/LeafletMapComponent';
import './MisMisiones.css';

export default function MisMisiones() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const brigada_id = searchParams.get('brigada');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [brigada, setBrigada] = useState(null);
  const [conglomerado, setConglomerado] = useState(null);
  const [personalDisponible, setPersonalDisponible] = useState([]);
  const [showModalAgregar, setShowModalAgregar] = useState(false);
  const [showModalEliminar, setShowModalEliminar] = useState(false);
  const [miembroAEliminar, setMiembroAEliminar] = useState(null);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');
  const [rolSeleccionado, setRolSeleccionado] = useState('');
  
  const [formFechas, setFormFechas] = useState({
    fecha_inicio_campo: '',
    fecha_fin_campo: ''
  });

  useEffect(() => {
    if (brigada_id) {
      cargarBrigada();
    }
  }, [brigada_id]);

  const cargarBrigada = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('📡 Cargando brigada:', brigada_id);
      const res = await brigadasService.getById(brigada_id);
      console.log('✅ Brigada cargada:', res.data);
      
      setBrigada(res.data);

      // ✅ El conglomerado ya viene enriquecido desde el backend
      if (res.data.conglomerado) {
        console.log('✅ Conglomerado enriquecido:', res.data.conglomerado);
        setConglomerado(res.data.conglomerado);
      }

      if (res.data.fecha_inicio_campo) {
        setFormFechas({
          fecha_inicio_campo: res.data.fecha_inicio_campo.split('T')[0],
          fecha_fin_campo: res.data.fecha_fin_campo?.split('T')[0] || ''
        });
      }
    } catch (err) {
      console.error('❌ Error cargando brigada:', err);
      setError(err.response?.data?.error || 'Error al cargar brigada');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (showModalAgregar && rolSeleccionado) {
      cargarPersonal();
    }
  }, [showModalAgregar, rolSeleccionado]);

  const cargarPersonal = async () => {
    try {
      setLoading(true);
      setError('');
      console.log('🔍 Buscando personal con rol:', rolSeleccionado);
      
      const filtros = { rol_codigo: rolSeleccionado };
      
      if (conglomerado?.municipio_id) {
        filtros.municipio_id = conglomerado.municipio_id;
        console.log('🎯 Filtrando por MUNICIPIO');
      } else if (conglomerado?.departamento_id) {
        filtros.departamento_id = conglomerado.departamento_id;
        console.log('🎯 Filtrando por DEPARTAMENTO');
      } else if (conglomerado?.region_id) {
        filtros.region_id = conglomerado.region_id;
        console.log('🎯 Filtrando por REGIÓN');
      }

      let res = await usuariosService.getCuentasRolFiltros(filtros);
      console.log('✅ Personal encontrado (1er intento):', res.data?.length || 0);
      
      // Búsqueda en cascada si no hay resultados
      if ((!res.data || res.data.length === 0) && filtros.municipio_id) {
        console.log('⚠️ No hay personal en municipio, buscando en DEPARTAMENTO...');
        delete filtros.municipio_id;
        if (conglomerado?.departamento_id) {
          filtros.departamento_id = conglomerado.departamento_id;
          res = await usuariosService.getCuentasRolFiltros(filtros);
          console.log('✅ Personal encontrado (2do intento):', res.data?.length || 0);
        }
      }
      
      if ((!res.data || res.data.length === 0) && filtros.departamento_id) {
        console.log('⚠️ No hay personal en departamento, buscando en REGIÓN...');
        delete filtros.departamento_id;
        if (conglomerado?.region_id) {
          filtros.region_id = conglomerado.region_id;
          res = await usuariosService.getCuentasRolFiltros(filtros);
          console.log('✅ Personal encontrado (3er intento):', res.data?.length || 0);
        }
      }
      
      if (!res.data || res.data.length === 0) {
        console.log('⚠️ No hay personal en región, buscando a NIVEL NACIONAL...');
        delete filtros.region_id;
        res = await usuariosService.getCuentasRolFiltros(filtros);
        console.log('✅ Personal encontrado (nivel nacional):', res.data?.length || 0);
      }

      const personal = (res.data || []).map(item => ({
        id: item.usuarios?.id || item.usuario_id,
        nombre: item.usuarios?.nombre_completo || 'Sin nombre',
        municipio: item.usuarios?.municipio_residencia || null,
        cuentaRolId: item.id
      }));

      setPersonalDisponible(personal);
    } catch (err) {
      console.error('❌ Error cargando personal:', err);
      setError('No se pudo cargar personal disponible');
    } finally {
      setLoading(false);
    }
  };

  const agregarMiembro = async () => {
    if (!usuarioSeleccionado || !rolSeleccionado) {
      setError('Debes seleccionar usuario y rol');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      const roleMap = {
        'BOTANICO': 'Botanico',
        'TECNICO_AUX': 'Tecnico',
        'COINVESTIGADOR': 'Coinvestigador'
      };
      
      const rolOperativo = roleMap[rolSeleccionado];
      
      if (!rolOperativo) {
        throw new Error(`Rol ${rolSeleccionado} no válido`);
      }

      await brigadasService.agregarMiembro(brigada_id, usuarioSeleccionado, rolOperativo);
      
      setSuccess('Miembro agregado a la brigada');
      setShowModalAgregar(false);
      setUsuarioSeleccionado('');
      setRolSeleccionado('');
      cargarBrigada();
    } catch (err) {
      console.error('❌ Error agregando miembro:', err);
      setError(err.response?.data?.error || 'Error al agregar miembro');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalEliminar = (miembro) => {
    setMiembroAEliminar(miembro);
    setShowModalEliminar(true);
  };

  const eliminarMiembro = async () => {
    if (!miembroAEliminar) return;

    try {
      setLoading(true);
      setError('');
      
      await brigadasService.eliminarMiembro(miembroAEliminar.id);
      
      setSuccess('Miembro eliminado de la brigada');
      setShowModalEliminar(false);
      setMiembroAEliminar(null);
      cargarBrigada();
    } catch (err) {
      console.error('❌ Error eliminando miembro:', err);
      setError(err.response?.data?.error || 'Error al eliminar miembro');
    } finally {
      setLoading(false);
    }
  };

  const registrarFechas = async (e) => {
    e.preventDefault();
    
    if (!formFechas.fecha_inicio_campo) {
      setError('La fecha de inicio es obligatoria');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await brigadasService.registrarFechas(
        brigada_id,
        formFechas.fecha_inicio_campo,
        formFechas.fecha_fin_campo || null
      );
      
      setSuccess('Fechas registradas correctamente');
      cargarBrigada();
    } catch (err) {
      console.error('❌ Error registrando fechas:', err);
      setError(err.response?.data?.error || 'Error al registrar fechas');
    } finally {
      setLoading(false);
    }
  };

  const enviarInvitaciones = async () => {
    if (!window.confirm('¿Confirmas que deseas enviar las invitaciones a todos los miembros? Una vez enviadas, no podrás eliminar miembros.')) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await brigadasService.enviarInvitaciones(brigada_id);
      
      setSuccess('Invitaciones enviadas exitosamente. La brigada queda en formación hasta que todos acepten.');
      cargarBrigada();
    } catch (err) {
      console.error('❌ Error enviando invitaciones:', err);
      setError(err.response?.data?.error || 'Error al enviar invitaciones');
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstadoBrigada = async (nuevoEstado) => {
    const confirmaciones = {
      'en_transito': '¿Confirmas que la brigada inicia el tránsito hacia el campamento/conglomerado?',
      'en_ejecucion': '¿Confirmas que la brigada llega y comienza la ejecución en campo?',
      'completada': '¿Confirmas que la brigada completó todas sus actividades?',
      'cancelada': '¿Estás seguro que deseas CANCELAR esta brigada?'
    };

    if (!window.confirm(confirmaciones[nuevoEstado])) return;

    try {
      setLoading(true);
      setError('');
      
      await brigadasService.cambiarEstado(brigada_id, nuevoEstado);
      
      setSuccess(`Estado cambiado a: ${nuevoEstado.replace('_', ' ')}`);
      cargarBrigada();
      
      // Redirigir según el nuevo estado
      if (nuevoEstado === 'en_transito') {
        setTimeout(() => {
          navigate(`/jefe-brigada/rutas-acceso?brigada=${brigada_id}`);
        }, 2000);
      } else if (nuevoEstado === 'en_ejecucion' && conglomerado?.id) {
        setTimeout(() => {
          navigate(`/jefe-brigada/establecimiento-subparcelas?conglomerado=${conglomerado.id}`);
        }, 2000);
      }
    } catch (err) {
      console.error('❌ Error cambiando estado:', err);
      setError(err.response?.data?.error || 'Error al cambiar estado');
    } finally {
      setLoading(false);
    }
  };

  if (!brigada_id) {
    return (
      <div className="empty-state-page">
        <div className="empty-state-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
        </div>
        <h2>Brigada no especificada</h2>
        <p>Debes acceder desde el Dashboard seleccionando una brigada</p>
        <Link to="/jefe-brigada/dashboard" className="btn-primary" style={{ marginTop: '1.5rem' }}>
          Volver al Dashboard
        </Link>
      </div>
    );
  }

  if (loading && !brigada) return <LoadingSpinner mensaje="Cargando brigada..." />;
  if (error && !brigada) return <ErrorAlert mensaje={error} onRetry={cargarBrigada} />;

  if (!brigada) {
    return (
      <div className="empty-state-page">
        <div className="empty-state-icon">
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        </div>
        <h2>No hay brigada asignada</h2>
        <p>No se encontró información de la brigada solicitada</p>
      </div>
    );
  }

  const rolesRequeridos = ['Jefe', 'Botanico', 'Tecnico'];
  const rolesAsignados = brigada.brigadas_rol_operativo?.map(m => m.rol_operativo) || [];
  const brigadaCompleta = rolesRequeridos.every(rol => rolesAsignados.includes(rol));
  
  // Invitaciones enviadas = cuando estado_invitacion NO es null
  const invitacionesEnviadas = brigada.brigadas_rol_operativo?.some(m => 
    m.rol_operativo !== 'Jefe' && m.estado_invitacion !== null
  );
  
  // Miembros que aún no respondieron (estado_invitacion = 'pendiente')
  const invitacionesPendientes = brigada.brigadas_rol_operativo?.filter(m => 
    m.rol_operativo !== 'Jefe' && m.estado_invitacion === 'pendiente'
  ) || [];

  // Todas aceptadas = todos los miembros tienen estado 'aceptada' (excepto Jefe que siempre está aceptado)
  const todasAceptadas = brigada.brigadas_rol_operativo?.every(m => 
    m.rol_operativo === 'Jefe' || m.estado_invitacion === 'aceptada'
  ) && brigadaCompleta;

  // Condiciones para acciones
  const puedeEnviarInvitaciones = brigadaCompleta && !invitacionesEnviadas && brigada.estado === 'formacion';
  const puedeIniciarTransito = todasAceptadas && brigada.fecha_inicio_campo && brigada.estado === 'formacion';
  const puedeEliminarMiembros = !invitacionesEnviadas && brigada.estado === 'formacion';

  return (
    <div className="mis-misiones">
      <div className="page-header">
        <div>
          <h1>Gestión de Misión</h1>
          <p>F1.1 - Localización y Conformación de Brigada</p>
        </div>
        <span className={`badge-estado ${brigada.estado}`}>
          {brigada.estado.replace(/_/g, ' ')}
        </span>
      </div>

      {error && <ErrorAlert mensaje={error} onClose={() => setError('')} />}
      {success && (
        <div className="alert alert-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
            <polyline points="22 4 12 14.01 9 11.01" />
          </svg>
          {success}
          <button onClick={() => setSuccess('')} className="alert-close">✕</button>
        </div>
      )}

      {/* MAPA Y UBICACIÓN */}
      {conglomerado && (
        <div className="ubicacion-section">
          {conglomerado.latitud && conglomerado.longitud && (
            <div className="mapa-container">
              <LeafletMapComponent
                latitud={conglomerado.latitud}
                longitud={conglomerado.longitud}
                codigo={conglomerado.codigo}
                subparcelas={conglomerado.conglomerados_subparcelas || []}
                zoom={13}
                height="300px"
              />
            </div>
          )}
          
          <div className="ubicacion-info">
            <h3>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Ubicación del Conglomerado
            </h3>
            <div className="info-grid">
              <div className="info-item">
                <strong>Código:</strong>
                <span>{conglomerado.codigo}</span>
              </div>
              <div className="info-item">
                <strong>Municipio:</strong>
                <span>{conglomerado.municipio?.nombre || 'No asignado'}</span>
              </div>
              <div className="info-item">
                <strong>Departamento:</strong>
                <span>{conglomerado.departamento?.nombre || 'No asignado'}</span>
              </div>
              <div className="info-item">
                <strong>Región:</strong>
                <span>{conglomerado.region?.nombre || 'No asignado'}</span>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Fechas de Campo */}
      <div className="section">
        <div className="section-header">
          <div className="section-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
          </div>
          <div>
            <h2>Fechas de Campo</h2>
            <p>F1.1.5 - Registro de período de operación</p>
          </div>
        </div>
        
        <form onSubmit={registrarFechas} className="form-fechas">
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Fecha Inicio Campo *</label>
              <input
                type="date"
                className="form-input"
                value={formFechas.fecha_inicio_campo}
                onChange={(e) => setFormFechas({ ...formFechas, fecha_inicio_campo: e.target.value })}
                disabled={brigada.estado !== 'formacion'}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Fecha Fin Campo</label>
              <input
                type="date"
                className="form-input"
                value={formFechas.fecha_fin_campo}
                onChange={(e) => setFormFechas({ ...formFechas, fecha_fin_campo: e.target.value })}
                min={formFechas.fecha_inicio_campo}
                disabled={brigada.estado !== 'formacion'}
              />
            </div>
          </div>
          {brigada.estado === 'formacion' && (
            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? 'Guardando...' : 'Registrar Fechas'}
            </button>
          )}
        </form>
      </div>

      {/* Conformación de Brigada */}
      <div className="section">
        <div className="section-header">
          <div className="section-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <div>
            <h2>Brigada Forestal</h2>
            <p>F1.1.1 - Conformación de equipo operativo</p>
          </div>
          {brigada.estado === 'formacion' && puedeEliminarMiembros && (
            <button onClick={() => setShowModalAgregar(true)} className="btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Agregar Miembro
            </button>
          )}
        </div>

        {!brigadaCompleta && brigada.estado === 'formacion' && (
          <div className="alert alert-warning">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Brigada incompleta. Roles mínimos: Jefe, Botánico, Técnico. <strong>Completa el equipo antes de enviar invitaciones.</strong>
          </div>
        )}

        {invitacionesEnviadas && invitacionesPendientes.length > 0 && (
          <div className="alert alert-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            Invitaciones enviadas. Esperando respuesta de {invitacionesPendientes.length} brigadista(s). 
            <strong> No puedes modificar el equipo hasta que todos respondan.</strong>
          </div>
        )}

        {invitacionesEnviadas && todasAceptadas && (
          <div className="alert alert-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            <strong>¡Equipo confirmado!</strong> Todos los brigadistas aceptaron. La brigada está lista para iniciar tránsito.
          </div>
        )}

        <div className="miembros-container">
          {brigada.brigadas_rol_operativo && brigada.brigadas_rol_operativo.length > 0 ? (
            <div className="miembros-table">
              <table>
                <thead>
                  <tr>
                    <th>Rol Operativo</th>
                    <th>Usuario ID</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                    {puedeEliminarMiembros && <th>Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {brigada.brigadas_rol_operativo.map(miembro => (
                    <tr key={miembro.id}>
                      <td>
                        <span className={`badge-rol ${miembro.rol_operativo}`}>
                          {miembro.rol_operativo}
                        </span>
                      </td>
                      <td>{miembro.usuario_id}</td>
                      <td>
                        {miembro.rol_operativo === 'Jefe' ? (
                          <span className="badge-estado aceptada">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                            </svg>
                            Jefe
                          </span>
                        ) : miembro.estado_invitacion === 'aceptada' ? (
                          <span className="badge-estado aceptada">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                            Aceptada
                          </span>
                        ) : miembro.estado_invitacion === 'rechazada' ? (
                          <span className="badge-estado rechazada">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <line x1="18" y1="6" x2="6" y2="18"/>
                              <line x1="6" y1="6" x2="18" y2="18"/>
                            </svg>
                            Rechazada
                          </span>
                        ) : miembro.estado_invitacion === 'pendiente' ? (
                          <span className="badge-estado pendiente">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <circle cx="12" cy="12" r="10"/>
                              <polyline points="12 6 12 12 16 14"/>
                            </svg>
                            Pendiente
                          </span>
                        ) : (
                          <span className="badge-estado">Sin enviar</span>
                        )}
                      </td>
                      <td>
                        {miembro.fecha_respuesta 
                          ? new Date(miembro.fecha_respuesta).toLocaleDateString()
                          : new Date(miembro.created_at).toLocaleDateString()
                        }
                      </td>
                      {puedeEliminarMiembros && (
                        <td>
                          {miembro.rol_operativo !== 'Jefe' && (
                            <button
                              onClick={() => abrirModalEliminar(miembro)}
                              className="btn-delete"
                              title="Eliminar miembro"
                            >
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="3 6 5 6 21 6" />
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <h3>No hay miembros asignados</h3>
              <p>Agrega miembros para conformar la brigada</p>
            </div>
          )}
        </div>

        {/* Botón para enviar invitaciones */}
        {puedeEnviarInvitaciones && (
          <div className="enviar-invitaciones-container">
            <div className="alert alert-info" style={{ marginBottom: '1rem' }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
              <strong>Importante:</strong> Una vez enviadas las invitaciones, NO podrás agregar ni eliminar miembros. Verifica que el equipo esté completo.
            </div>
            <button onClick={enviarInvitaciones} className="btn-success">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                <polyline points="22,6 12,13 2,6"/>
              </svg>
              Enviar Invitaciones a Brigadistas
            </button>
          </div>
        )}
      </div>

      {/* Controles de Estado */}
      {brigada.estado === 'formacion' && todasAceptadas && puedeIniciarTransito && (
        <div className="section">
          <div className="section-header">
            <div className="section-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 11 12 14 22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </div>
            <div>
              <h2>Brigada Lista para Movilización</h2>
              <p>Todos los requisitos están completos</p>
            </div>
          </div>
          <p>Todos los miembros han aceptado y las fechas están registradas. Puedes iniciar el tránsito.</p>
          <button onClick={() => cambiarEstadoBrigada('en_transito')} className="btn-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="3" width="15" height="13"/>
              <polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/>
              <circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            Iniciar Tránsito hacia Campo
          </button>
        </div>
      )}

      {brigada.estado === 'en_transito' && (
        <div className="section">
          <div className="alert alert-info">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            La brigada está en tránsito. Debes registrar <strong>AMBAS rutas de acceso</strong> (Campamento y Conglomerado) con sus 4 puntos de referencia cada una antes de iniciar ejecución.
          </div>
          <Link to={`/jefe-brigada/rutas-acceso?brigada=${brigada_id}`} className="btn-primary">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            Registrar Rutas de Acceso
          </Link>
        </div>
      )}

      {brigada.estado === 'en_ejecucion' && (
        <div className="section">
          <div className="alert alert-success">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            La brigada está ejecutando actividades en campo.
          </div>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            {conglomerado?.id && (
              <Link to={`/jefe-brigada/establecimiento-subparcelas?conglomerado=${conglomerado.id}`} className="btn-primary" style={{ flex: 1 }}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5"/>
                  <path d="M2 12l10 5 10-5"/>
                </svg>
                Establecer Subparcelas
              </Link>
            )}
            <button onClick={() => cambiarEstadoBrigada('completada')} className="btn-success" style={{ flex: 1 }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
              Finalizar Misión
            </button>
          </div>
        </div>
      )}

      {(brigada.estado === 'formacion' || brigada.estado === 'en_transito' || brigada.estado === 'en_ejecucion') && (
        <div className="section">
          <button onClick={() => cambiarEstadoBrigada('cancelada')} className="btn-danger">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <line x1="15" y1="9" x2="9" y2="15"/>
              <line x1="9" y1="9" x2="15" y2="15"/>
            </svg>
            Cancelar Brigada
          </button>
        </div>
      )}

      {/* Modal Agregar Miembro */}
      {showModalAgregar && (
        <div className="modal-overlay" onClick={() => setShowModalAgregar(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Agregar Miembro a la Brigada</h3>
              <button onClick={() => setShowModalAgregar(false)} className="modal-close">✕</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Rol Operativo *</label>
                <select
                  className="form-select"
                  value={rolSeleccionado}
                  onChange={(e) => {
                    setRolSeleccionado(e.target.value);
                    setUsuarioSeleccionado('');
                    setPersonalDisponible([]);
                  }}
                >
                  <option value="">-- Selecciona rol --</option>
                  <option value="BOTANICO">Botánico</option>
                  <option value="TECNICO_AUX">Técnico Auxiliar</option>
                  <option value="COINVESTIGADOR">Coinvestigador</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Personal Disponible *</label>
                <select
                  className="form-select"
                  value={usuarioSeleccionado}
                  onChange={(e) => setUsuarioSeleccionado(e.target.value)}
                  disabled={!rolSeleccionado || personalDisponible.length === 0}
                >
                  <option value="">
                    {!rolSeleccionado 
                      ? '-- Primero selecciona un rol --'
                      : personalDisponible.length === 0
                      ? 'Cargando personal...'
                      : '-- Selecciona persona --'
                    }
                  </option>
                  {personalDisponible.map(persona => (
                    <option key={persona.id} value={persona.id}>
                      {persona.nombre}
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
                Selecciona primero el rol para ver el personal disponible en la zona
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowModalAgregar(false)} className="btn-cancel">
                Cancelar
              </button>
              <button 
                onClick={agregarMiembro}
                disabled={loading || !usuarioSeleccionado || !rolSeleccionado}
                className="btn-primary"
              >
                {loading ? 'Agregando...' : 'Agregar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar Miembro */}
      {showModalEliminar && miembroAEliminar && (
        <div className="modal-overlay" onClick={() => setShowModalEliminar(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Eliminar Miembro</h3>
              <button onClick={() => setShowModalEliminar(false)} className="modal-close">✕</button>
            </div>
            
            <div className="modal-body">
              <p>¿Estás seguro que deseas eliminar este miembro de la brigada?</p>
              <div className="miembro-info">
                <strong>Rol:</strong> {miembroAEliminar.rol_operativo}<br/>
                <strong>Usuario:</strong> {miembroAEliminar.usuario_id}
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowModalEliminar(false)} className="btn-cancel">
                Cancelar
              </button>
              <button 
                onClick={eliminarMiembro}
                disabled={loading}
                className="btn-danger"
              >
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}