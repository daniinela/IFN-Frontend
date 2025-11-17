// src/pages/jefe_brigada/Dashboard.jsx
import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { brigadasService } from '../../services/brigadasService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import './Dashboard.css';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [brigadas, setBrigadas] = useState([]);

  useEffect(() => {
    cargarMisiones();
  }, []);

  const cargarMisiones = async () => {
    try {
      setLoading(true);
      setError('');
      
      const brigadasRes = await brigadasService.getMisBrigadas();
      setBrigadas(brigadasRes.data);
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
        <div className="alert alert-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2"/>
            <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2"/>
          </svg>
          {success}
          <button onClick={() => setSuccess('')} className="alert-close">✕</button>
        </div>
      )}

      <div className="metrics-grid">
        <div className="metric-card total">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div className="metric-content">
            <h3>Total Asignadas</h3>
            <p className="metric-value">{brigadas.length}</p>
            <span className="metric-label">Brigadas</span>
          </div>
        </div>

        <div className="metric-card activas">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="metric-content">
            <h3>Activas</h3>
            <p className="metric-value">{brigadasActivas.length}</p>
            <span className="metric-label">En progreso</span>
          </div>
        </div>

        <div className="metric-card completadas">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="metric-content">
            <h3>Completadas</h3>
            <p className="metric-value">{brigadas.filter(b => b.estado === 'completada').length}</p>
            <span className="metric-label">Finalizadas</span>
          </div>
        </div>
      </div>

      {brigadasActivas.length === 0 ? (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
          <h3>No tienes misiones activas</h3>
          <p>Cuando se te asignen nuevas misiones aparecerán aquí</p>
        </div>
      ) : (
        <div className="brigadas-grid">
          {brigadasActivas.map(brigada => {
            return (
              <div key={brigada.id} className="brigada-card">
                <div className="card-header">
                  <div className="card-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <h3>Brigada {brigada.id}</h3>
                  </div>
                  <span className={`badge-estado ${brigada.estado}`}>
                    {brigada.estado.replace(/_/g, ' ')}
                  </span>
                </div>
                
                <div className="card-body">
                  <div className="info-row">
                    <span className="label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      ID Conglomerado:
                    </span>
                    <span className="value">{brigada.conglomerado_id}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      Miembros:
                    </span>
                    <span className="value">
                      {brigada.brigadas_rol_operativo?.length || 0}
                    </span>
                  </div>
                  {brigada.fecha_inicio_campo && (
                    <div className="info-row">
                      <span className="label">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                          <line x1="16" y1="2" x2="16" y2="6" />
                          <line x1="8" y1="2" x2="8" y2="6" />
                          <line x1="3" y1="10" x2="21" y2="10" />
                        </svg>
                        Inicio:
                      </span>
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
                      {nuevoEstado === 'en_transito' && (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M5 17h14v-2H5z" />
                            <path d="M16 11h5l-1.405-1.405A2.032 2.032 0 0018 8.158V6a1 1 0 00-1-1h-3a1 1 0 00-1 1v2.158c0 .538-.214 1.055-.595 1.437L11 11" />
                            <circle cx="7" cy="17" r="2" />
                            <circle cx="17" cy="17" r="2" />
                          </svg>
                          Iniciar Desplazamiento
                        </>
                      )}
                      {nuevoEstado === 'en_ejecucion' && (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M12 2L2 7l10 5 10-5-10-5z" />
                            <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                          </svg>
                          Iniciar Trabajo
                        </>
                      )}
                      {nuevoEstado === 'completada' && (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Completar
                        </>
                      )}
                      {nuevoEstado === 'cancelada' && (
                        <>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                          Cancelar
                        </>
                      )}
                    </button>
                  ))}
                  
                  <Link 
                    to={`/jefe-brigada/mis-misiones?brigada=${brigada.id}`}
                    className="btn-primary"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                    Ver Detalle
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}