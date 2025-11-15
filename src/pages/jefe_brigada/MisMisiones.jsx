// src/pages/jefe_brigada/MisMisiones.jsx
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { brigadasService } from '../../services/brigadasService';
import { usuariosService } from '../../services/usuariosService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

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

  useEffect(() => {
    if (brigada_id) {
      cargarBrigada();
      cargarPersonal();
    }
  }, [brigada_id]);

  const cargarBrigada = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await brigadasService.getById(brigada_id);
      setBrigada(res.data);
      
      if (res.data.fecha_inicio_campo) {
        setFormFechas({
          fecha_inicio_campo: res.data.fecha_inicio_campo.split('T')[0],
          fecha_fin_campo: res.data.fecha_fin_campo?.split('T')[0] || ''
        });
      }
    } catch (err) {
      console.error('Error cargando brigada:', err);
      setError(err.response?.data?.error || 'Error al cargar brigada');
    } finally {
      setLoading(false);
    }
  };

  const cargarPersonal = async () => {
    try {
      const rolesRes = await Promise.all([
        usuariosService.getJefesBrigadaDisponibles({ rol_codigo: 'BOTANICO', solo_aprobados: true }),
        usuariosService.getJefesBrigadaDisponibles({ rol_codigo: 'TECNICO', solo_aprobados: true }),
        usuariosService.getJefesBrigadaDisponibles({ rol_codigo: 'COINVESTIGADOR', solo_aprobados: true })
      ]);
      
      const personal = rolesRes.flatMap(res => 
        res.data.map(p => ({
          id: p.usuarios.id,
          nombre: p.usuarios.nombre_completo,
          rol: p.roles_sistema.codigo
        }))
      );
      
      setPersonalDisponible(personal);
    } catch (err) {
      console.error('Error cargando personal:', err);
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
      
      await brigadasService.agregarMiembro(brigada_id, usuarioSeleccionado, rolSeleccionado);
      
      setSuccess('Miembro agregado a la brigada');
      setShowModalAgregar(false);
      setUsuarioSeleccionado('');
      setRolSeleccionado('');
      cargarBrigada();
    } catch (err) {
      console.error('Error agregando miembro:', err);
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
      console.error('Error registrando fechas:', err);
      setError(err.response?.data?.error || 'Error al registrar fechas');
    } finally {
      setLoading(false);
    }
  };

  if (!brigada_id) {
    return (
      <div className="page-error">
        <h2>⚠️ Error</h2>
        <p>No se especificó ID de brigada</p>
      </div>
    );
  }

  if (loading && !brigada) return <LoadingSpinner mensaje="Cargando brigada..." />;
  if (error && !brigada) return <ErrorAlert mensaje={error} onRetry={cargarBrigada} />;
  if (!brigada) return null;

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
          {brigada.estado}
        </span>
      </div>

      {error && <ErrorAlert mensaje={error} onClose={() => setError('')} />}
      {success && (
        <div className="alert-success">
          ✅ {success}
          <button onClick={() => setSuccess('')}>✕</button>
        </div>
      )}

      {/* Fechas de Campo (F1.1) */}
      <div className="section">
        <h2>Fechas de Campo (F1.1.5)</h2>
        <form onSubmit={registrarFechas} className="form-fechas">
          <div className="form-row">
            <div className="form-group">
              <label>Fecha Inicio Campo *</label>
              <input
                type="date"
                value={formFechas.fecha_inicio_campo}
                onChange={(e) => setFormFechas({ ...formFechas, fecha_inicio_campo: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label>Fecha Fin Campo</label>
              <input
                type="date"
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
          <h2>Brigada Forestal (F1.1.1)</h2>
          <button onClick={() => setShowModalAgregar(true)} className="btn-primary">
            ➕ Agregar Miembro
          </button>
        </div>

        {!brigadaCompleta && (
          <div className="alert-warning">
            ⚠️ Brigada incompleta. Roles mínimos: Jefe, Botánico, Técnico
          </div>
        )}

        <div className="miembros-list">
          {brigada.brigadas_rol_operativo && brigada.brigadas_rol_operativo.length > 0 ? (
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
          ) : (
            <div className="empty-state">
              <p>No hay miembros asignados. Agrega al menos: Botánico y Técnico</p>
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
              <button onClick={() => setShowModalAgregar(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="form-group">
                <label>Rol Operativo *</label>
                <select
                  value={rolSeleccionado}
                  onChange={(e) => setRolSeleccionado(e.target.value)}
                >
                  <option value="">-- Selecciona rol --</option>
                  <option value="Botanico">Botánico</option>
                  <option value="Tecnico">Técnico Auxiliar</option>
                  <option value="Coinvestigador">Coinvestigador</option>
                </select>
              </div>

              <div className="form-group">
                <label>Personal Disponible *</label>
                <select
                  value={usuarioSeleccionado}
                  onChange={(e) => setUsuarioSeleccionado(e.target.value)}
                  disabled={!rolSeleccionado}
                >
                  <option value="">-- Selecciona persona --</option>
                  {personalDisponible
                    .filter(p => p.rol === rolSeleccionado)
                    .map(persona => (
                      <option key={persona.id} value={persona.id}>
                        {persona.nombre}
                      </option>
                    ))}
                </select>
              </div>

              <div className="alert-info">
                ℹ️ Solo se muestra personal aprobado con el rol seleccionado
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