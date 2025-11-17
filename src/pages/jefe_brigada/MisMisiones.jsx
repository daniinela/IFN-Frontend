// src/pages/jefe_brigada/MisMisiones.jsx
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { brigadasService } from '../../services/brigadasService';
import { usuariosService } from '../../services/usuariosService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import './MisMisiones.css';

export default function MisMisiones() {
  const [searchParams] = useSearchParams();
  const brigada_id = searchParams.get('brigada');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [brigada, setBrigada] = useState(null);
  const [personalDisponible, setPersonalDisponible] = useState([]);
  const [showModalAgregar, setShowModalAgregar] = useState(false);
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState('');
  const [rolSeleccionado, setRolSeleccionado] = useState('');
  
  const [formFechas, setFormFechas] = useState({
    fecha_inicio_campo: '',
    fecha_fin_campo: ''
  });

  // 🔧 FIX 1: Remover useCallback que causa loop infinito
  useEffect(() => {
    if (brigada_id) {
      cargarBrigada();
    }
  }, [brigada_id]); // Solo depende de brigada_id

  const cargarBrigada = async () => {
    try {
      setLoading(true);
      setError('');

      console.log('📡 Cargando brigada:', brigada_id);
      const res = await brigadasService.getById(brigada_id);
      console.log('✅ Brigada cargada:', res.data);
      
      setBrigada(res.data);

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

  // 🔧 FIX 2: Cargar personal solo cuando se abre modal Y se selecciona rol
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
      
      // Agregar filtros geográficos si existen
      if (brigada?.municipio_residencia) {
        filtros.municipio_id = brigada.municipio_residencia;
      } else if (brigada?.departamento_id) {
        filtros.departamento_id = brigada.departamento_id;
      }

      const res = await usuariosService.getCuentasRolFiltros(filtros);
      console.log('✅ Personal encontrado:', res.data);

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
      
      // 🔧 FIX 3: Mapeo correcto de roles
      const roleMap = {
        'BOTANICO': 'Botanico',
        'TECNICO_AUX': 'Tecnico',
        'COINVESTIGADOR': 'Coinvestigador',
        'JEFE_BRIGADA': 'Jefe'
      };
      
      const rolOperativo = roleMap[rolSeleccionado];
      
      if (!rolOperativo) {
        throw new Error(`Rol ${rolSeleccionado} no válido`);
      }

      console.log('📝 Agregando miembro:', { 
        brigada_id, 
        usuario: usuarioSeleccionado, 
        rol: rolOperativo 
      });

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

  // 🔧 FIX 4: Validaciones mejoradas
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
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2"/>
            <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2"/>
          </svg>
          {success}
          <button onClick={() => setSuccess('')} className="alert-close">✕</button>
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
              />
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? 'Guardando...' : 'Registrar Fechas'}
          </button>
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
          <button onClick={() => setShowModalAgregar(true)} className="btn-primary">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Agregar Miembro
          </button>
        </div>

        {!brigadaCompleta && (
          <div className="alert alert-warning">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            Brigada incompleta. Roles mínimos: Jefe, Botánico, Técnico
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
                    <th>Fecha Asignación</th>
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
                      <td>{new Date(miembro.created_at).toLocaleDateString()}</td>
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
      </div>

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
                Selecciona primero el rol para ver el personal disponible
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
    </div>
  );
}