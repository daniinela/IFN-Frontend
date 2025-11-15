// src/pages/coord_ifn/AsignacionMisiones.jsx
import { useState, useEffect } from 'react';
import { conglomeradosService } from '../../services/conglomeradosService';
import { usuariosService } from '../../services/usuariosService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

export default function AsignacionMisiones() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [conglomeradosListos, setConglomeradosListos] = useState([]);
  const [jefesBrigada, setJefesBrigada] = useState([]);
  
  const [showModalAsignar, setShowModalAsignar] = useState(false);
  const [conglomeradoSeleccionado, setConglomeradoSeleccionado] = useState(null);
  const [jefeSeleccionado, setJefeSeleccionado] = useState('');

  useEffect(() => {
    cargarConglomeradosListos();
    cargarJefesBrigada();
  }, []);

  const cargarConglomeradosListos = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await conglomeradosService.getByEstado('listo_para_asignacion');
      setConglomeradosListos(response.data);
    } catch (err) {
      console.error('Error cargando conglomerados:', err);
      setError(err.response?.data?.error || 'Error al cargar conglomerados');
    } finally {
      setLoading(false);
    }
  };

  const cargarJefesBrigada = async () => {
    try {
      const response = await usuariosService.getJefesBrigadaDisponibles({});
      
      // Agrupar jefes por región/departamento y contar sus asignaciones
      const jefesConCarga = await Promise.all(
        response.data.map(async (jefe) => {
          try {
            // Obtener conglomerados asignados a este jefe
            const conglosResponse = await conglomeradosService.getAll(1, 999, '');
            const conglosAsignados = conglosResponse.data.data.filter(
              c => c.jefe_brigada_asignado_id === jefe.usuarios.id
            );
            
            return {
              ...jefe,
              carga_trabajo: conglosAsignados.length,
              nombre_completo: jefe.usuarios.nombre_completo
            };
          } catch {
            return {
              ...jefe,
              carga_trabajo: 0,
              nombre_completo: jefe.usuarios.nombre_completo
            };
          }
        })
      );

      // Ordenar por menor carga de trabajo
      jefesConCarga.sort((a, b) => a.carga_trabajo - b.carga_trabajo);
      
      setJefesBrigada(jefesConCarga);
    } catch (err) {
      console.error('Error cargando jefes:', err);
      setError('Error al cargar jefes de brigada');
    }
  };

  const abrirModalAsignar = (conglomerado) => {
    setConglomeradoSeleccionado(conglomerado);
    setJefeSeleccionado('');
    setShowModalAsignar(true);
  };

  const asignarConglomerado = async () => {
    if (!jefeSeleccionado) {
      setError('Debes seleccionar un jefe de brigada');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await conglomeradosService.asignarAJefe(
        conglomeradoSeleccionado.id, 
        jefeSeleccionado
      );
      
      setSuccess('Conglomerado asignado exitosamente');
      setShowModalAsignar(false);
      setConglomeradoSeleccionado(null);
      setJefeSeleccionado('');
      
      cargarConglomeradosListos();
      cargarJefesBrigada();
    } catch (err) {
      console.error('Error asignando:', err);
      setError(err.response?.data?.error || 'Error al asignar conglomerado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="asignacion-misiones">
      <div className="page-header">
        <div>
          <h1>Asignación de Misiones</h1>
          <p>Asignar conglomerados a jefes de brigada</p>
        </div>
        <div className="header-stats">
          <div className="stat-badge">
            <span className="stat-label">Pendientes:</span>
            <span className="stat-value">{conglomeradosListos.length}</span>
          </div>
          <div className="stat-badge">
            <span className="stat-label">Jefes Disponibles:</span>
            <span className="stat-value">{jefesBrigada.length}</span>
          </div>
        </div>
      </div>

      {error && <ErrorAlert mensaje={error} onClose={() => setError('')} />}
      {success && (
        <div className="alert-success">
          ✅ {success}
          <button onClick={() => setSuccess('')}>✕</button>
        </div>
      )}

      {loading && <LoadingSpinner mensaje="Cargando..." />}

      {!loading && conglomeradosListos.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h3>No hay conglomerados pendientes de asignación</h3>
          <p>Todos los conglomerados aprobados han sido asignados</p>
        </div>
      ) : (
        <div className="conglomerados-grid">
          {conglomeradosListos.map(cong => (
            <div key={cong.id} className="conglomerado-card">
              <div className="card-header">
                <h3>{cong.codigo}</h3>
                <span className="badge-estado listo">Listo</span>
              </div>
              
              <div className="card-body">
                <div className="info-row">
                  <span className="label">Latitud:</span>
                  <span className="value">{cong.latitud}</span>
                </div>
                <div className="info-row">
                  <span className="label">Longitud:</span>
                  <span className="value">{cong.longitud}</span>
                </div>
                <div className="info-row">
                  <span className="label">CAR:</span>
                  <span className="value">{cong.car_sigla || 'N/A'}</span>
                </div>
                {cong.municipio_id && (
                  <div className="info-row">
                    <span className="label">Municipio:</span>
                    <span className="value">{cong.municipio_id}</span>
                  </div>
                )}
              </div>
              
              <div className="card-footer">
                <button 
                  onClick={() => abrirModalAsignar(cong)}
                  className="btn-primary"
                >
                  Asignar Jefe de Brigada
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Asignación */}
      {showModalAsignar && conglomeradoSeleccionado && (
        <div className="modal-overlay" onClick={() => setShowModalAsignar(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Asignar Conglomerado: {conglomeradoSeleccionado.codigo}</h3>
              <button onClick={() => setShowModalAsignar(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <div className="conglomerado-info">
                <div className="info-item">
                  <label>Código:</label>
                  <span>{conglomeradoSeleccionado.codigo}</span>
                </div>
                <div className="info-item">
                  <label>Ubicación:</label>
                  <span>{conglomeradoSeleccionado.latitud}, {conglomeradoSeleccionado.longitud}</span>
                </div>
              </div>

              <div className="form-group">
                <label>Seleccionar Jefe de Brigada *</label>
                <select
                  value={jefeSeleccionado}
                  onChange={(e) => setJefeSeleccionado(e.target.value)}
                  className="form-select"
                >
                  <option value="">-- Selecciona un jefe --</option>
                  {jefesBrigada.map(jefe => (
                    <option key={jefe.usuarios.id} value={jefe.usuarios.id}>
                      {jefe.nombre_completo} - Carga: {jefe.carga_trabajo} conglomerados
                      {jefe.departamento_id && ` - Depto: ${jefe.departamento_id}`}
                    </option>
                  ))}
                </select>
              </div>

              {jefeSeleccionado && (
                <div className="alert-info">
                  ℹ️ Se creará automáticamente la brigada en estado "formación"
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowModalAsignar(false)} className="btn-cancel">
                Cancelar
              </button>
              <button 
                onClick={asignarConglomerado} 
                disabled={loading || !jefeSeleccionado}
                className="btn-primary"
              >
                {loading ? 'Asignando...' : 'Confirmar Asignación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}