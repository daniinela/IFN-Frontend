// src/pages/coord_ifn/Dashboard.jsx
import { useState, useEffect } from 'react';
import { conglomeradosService } from '../../services/conglomeradosService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import './Dashboard.css';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [estadisticas, setEstadisticas] = useState(null);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await conglomeradosService.getEstadisticas();
      setEstadisticas(response.data);
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
      setError(err.response?.data?.error || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  const calcularPorcentaje = (cantidad, total) => {
    if (!total) return 0;
    return ((cantidad / total) * 100).toFixed(1);
  };

  if (loading) return <LoadingSpinner mensaje="Cargando estadísticas..." />;
  if (error) return <ErrorAlert mensaje={error} onRetry={cargarEstadisticas} />;
  if (!estadisticas) return null;

  const { total, en_revision, listo_para_asignacion, asignado_a_jefe, en_ejecucion, finalizado_campo, no_establecido } = estadisticas;

  return (
    <div className="dashboard-coord">
      <div className="dashboard-header">
        <h1>Panel de Control - Coordinador IFN</h1>
        <p>Supervisión de operaciones de campo</p>
      </div>

      <div className="metrics-grid">
        {/* Total General */}
        <div className="metric-card total">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div className="metric-content">
            <h3>Total Conglomerados</h3>
            <p className="metric-value">{total}</p>
            <span className="metric-label">Unidades de muestreo</span>
          </div>
        </div>

        {/* Revisión */}
        <div className="metric-card revision">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
          </div>
          <div className="metric-content">
            <h3>En Revisión</h3>
            <p className="metric-value">{en_revision}</p>
            <span className="metric-percentage">{calcularPorcentaje(en_revision, total)}%</span>
          </div>
        </div>

        {/* Listos para Asignar */}
        <div className="metric-card listo">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div className="metric-content">
            <h3>Listos para Asignar</h3>
            <p className="metric-value">{listo_para_asignacion}</p>
            <span className="metric-percentage">{calcularPorcentaje(listo_para_asignacion, total)}%</span>
          </div>
        </div>

        {/* Asignados */}
        <div className="metric-card asignado">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
          </div>
          <div className="metric-content">
            <h3>Asignados a Jefe</h3>
            <p className="metric-value">{asignado_a_jefe}</p>
            <span className="metric-percentage">{calcularPorcentaje(asignado_a_jefe, total)}%</span>
          </div>
        </div>

        {/* En Ejecución */}
        <div className="metric-card ejecucion">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div className="metric-content">
            <h3>En Ejecución</h3>
            <p className="metric-value">{en_ejecucion}</p>
            <span className="metric-percentage">{calcularPorcentaje(en_ejecucion, total)}%</span>
          </div>
        </div>

        {/* Finalizados */}
        <div className="metric-card finalizado">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="metric-content">
            <h3>Finalizados</h3>
            <p className="metric-value">{finalizado_campo}</p>
            <span className="metric-percentage">{calcularPorcentaje(finalizado_campo, total)}%</span>
          </div>
        </div>

        {/* No Establecidos */}
        <div className="metric-card no-establecido">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <div className="metric-content">
            <h3>No Establecidos</h3>
            <p className="metric-value">{no_establecido}</p>
            <span className="metric-percentage">{calcularPorcentaje(no_establecido, total)}%</span>
          </div>
        </div>
      </div>

      {/* Gráfico de Progreso */}
      <div className="progress-section">
        <h2>Progreso Global</h2>
        <div className="progress-bar-container">
          <div className="progress-bar">
            <div 
              className="progress-segment finalizado" 
              style={{ width: `${calcularPorcentaje(finalizado_campo, total)}%` }}
              title={`Finalizados: ${finalizado_campo}`}
            />
            <div 
              className="progress-segment ejecucion" 
              style={{ width: `${calcularPorcentaje(en_ejecucion, total)}%` }}
              title={`En ejecución: ${en_ejecucion}`}
            />
            <div 
              className="progress-segment asignado" 
              style={{ width: `${calcularPorcentaje(asignado_a_jefe, total)}%` }}
              title={`Asignados: ${asignado_a_jefe}`}
            />
            <div 
              className="progress-segment pendiente" 
              style={{ width: `${calcularPorcentaje(listo_para_asignacion + en_revision, total)}%` }}
              title={`Pendientes: ${listo_para_asignacion + en_revision}`}
            />
            <div 
              className="progress-segment no-establecido" 
              style={{ width: `${calcularPorcentaje(no_establecido, total)}%` }}
              title={`No establecidos: ${no_establecido}`}
            />
          </div>
        </div>
        
        <div className="progress-legend">
          <div className="legend-item finalizado">
            <span className="legend-color"></span>
            <span>Finalizados ({calcularPorcentaje(finalizado_campo, total)}%)</span>
          </div>
          <div className="legend-item ejecucion">
            <span className="legend-color"></span>
            <span>En Ejecución ({calcularPorcentaje(en_ejecucion, total)}%)</span>
          </div>
          <div className="legend-item asignado">
            <span className="legend-color"></span>
            <span>Asignados ({calcularPorcentaje(asignado_a_jefe, total)}%)</span>
          </div>
          <div className="legend-item pendiente">
            <span className="legend-color"></span>
            <span>Pendientes ({calcularPorcentaje(listo_para_asignacion + en_revision, total)}%)</span>
          </div>
          <div className="legend-item no-establecido">
            <span className="legend-color"></span>
            <span>No Establecidos ({calcularPorcentaje(no_establecido, total)}%)</span>
          </div>
        </div>
      </div>

      {/* Acciones Rápidas */}
      <div className="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div className="actions-grid">
          <button 
            onClick={() => window.location.href = '/coord-ifn/gestion-conglomerados'}
            className="action-button generar"
          >
            <span className="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </span>
            <span className="action-text">Generar Conglomerados</span>
          </button>
          
          <button 
            onClick={() => window.location.href = '/coord-ifn/asignacion-misiones'}
            className="action-button asignar"
          >
            <span className="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </span>
            <span className="action-text">Asignar Misiones</span>
          </button>
          
          <button 
            onClick={() => window.location.href = '/coord-ifn/monitoreo-global'}
            className="action-button monitoreo"
          >
            <span className="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </span>
            <span className="action-text">Monitoreo Global</span>
          </button>
        </div>
      </div>
    </div>
  );
}