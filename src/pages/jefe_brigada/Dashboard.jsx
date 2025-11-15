// src/pages/jefe_brigada/Dashboard.jsx
import { useState, useEffect } from 'react';
import { brigadasService } from '../../services/brigadasService';
import { conglomeradosService } from '../../services/conglomeradosService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [brigadas, setBrigadas] = useState([]);
  const [conglomerados, setConglomerados] = useState([]);

  useEffect(() => {
    cargarMisiones();
  }, []);

  const cargarMisiones = async () => {
    try {
      setLoading(true);
      setError('');
      
      const brigadasRes = await brigadasService.getMisBrigadas();
      setBrigadas(brigadasRes.data);
      
      const conglosRes = await conglomeradosService.getMisConglomerados();
      setConglomerados(conglosRes.data);
    } catch (err) {
      console.error('Error cargando misiones:', err);
      setError(err.response?.data?.error || 'Error al cargar misiones');
    } finally {
      setLoading(false);
    }
  };

  const cambiarEstadoBrigada = async (brigada_id, nuevoEstado) => {
    if (!confirm(`¿Cambiar estado a "${nuevoEstado}"?`)) return;

    try {
      setLoading(true);
      setError('');
      
      await brigadasService.cambiarEstado(brigada_id, nuevoEstado);
      
      setSuccess(`Estado actualizado a: ${nuevoEstado}`);
      cargarMisiones();
    } catch (err) {
      console.error('Error cambiando estado:', err);
      setError(err.response?.data?.error || 'Error al cambiar estado');
    } finally {
      setLoading(false);
    }
  };

  const getAccionesDisponibles = (estadoActual) => {
    const transiciones = {
      'formacion': ['en_transito', 'cancelada'],
      'en_transito': ['en_ejecucion', 'cancelada'],
      'en_ejecucion': ['completada', 'cancelada']
    };
    return transiciones[estadoActual] || [];
  };

  if (loading) return <LoadingSpinner mensaje="Cargando misiones..." />;
  if (error) return <ErrorAlert mensaje={error} onRetry={cargarMisiones} />;

  const brigadasActivas = brigadas.filter(b => 
    ['formacion', 'en_transito', 'en_ejecucion'].includes(b.estado)
  );

  return (
    <div className="dashboard-jefe">
      <div className="dashboard-header">
        <h1>Mis Misiones Asignadas</h1>
        <p>Gestión de brigadas y operaciones de campo</p>
      </div>

      {success && (
        <div className="alert-success">
          ✅ {success}
          <button onClick={() => setSuccess('')}>✕</button>
        </div>
      )}

      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <h3>Total Asignadas</h3>
            <p className="metric-value">{conglomerados.length}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">🚀</div>
          <div className="metric-content">
            <h3>Activas</h3>
            <p className="metric-value">{brigadasActivas.length}</p>
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-icon">✅</div>
          <div className="metric-content">
            <h3>Completadas</h3>
            <p className="metric-value">
              {brigadas.filter(b => b.estado === 'completada').length}
            </p>
          </div>
        </div>
      </div>

      {brigadasActivas.length === 0 ? (
        <div className="empty-state">
          <p>No tienes misiones activas</p>
        </div>
      ) : (
        <div className="brigadas-grid">
          {brigadasActivas.map(brigada => {
            const conglomerado = conglomerados.find(c => c.id === brigada.conglomerado_id);
            
            return (
              <div key={brigada.id} className="brigada-card">
                <div className="card-header">
                  <h3>{conglomerado?.codigo || 'Sin código'}</h3>
                  <span className={`badge-estado ${brigada.estado}`}>
                    {brigada.estado}
                  </span>
                </div>
                
                <div className="card-body">
                  {conglomerado && (
                    <>
                      <div className="info-row">
                        <span className="label">Latitud:</span>
                        <span className="value">{conglomerado.latitud}</span>
                      </div>
                      <div className="info-row">
                        <span className="label">Longitud:</span>
                        <span className="value">{conglomerado.longitud}</span>
                      </div>
                    </>
                  )}
                  <div className="info-row">
                    <span className="label">Miembros:</span>
                    <span className="value">
                      {brigada.brigadas_rol_operativo?.length || 0}
                    </span>
                  </div>
                  {brigada.fecha_inicio_campo && (
                    <div className="info-row">
                      <span className="label">Inicio:</span>
                      <span className="value">
                        {new Date(brigada.fecha_inicio_campo).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="card-actions">
                  {getAccionesDisponibles(brigada.estado).map(nuevoEstado => (
                    <button
                      key={nuevoEstado}
                      onClick={() => cambiarEstadoBrigada(brigada.id, nuevoEstado)}
                      className={`btn-action ${nuevoEstado}`}
                    >
                      {nuevoEstado === 'en_transito' && '🚗 Iniciar Desplazamiento'}
                      {nuevoEstado === 'en_ejecucion' && '🌲 Iniciar Trabajo'}
                      {nuevoEstado === 'completada' && '✓ Completar'}
                      {nuevoEstado === 'cancelada' && '✕ Cancelar'}
                    </button>
                  ))}
                  
                  <button 
                    onClick={() => window.location.href = `/jefe-brigada/mis-misiones?brigada=${brigada.id}`}
                    className="btn-primary"
                  >
                    Ver Detalle
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}