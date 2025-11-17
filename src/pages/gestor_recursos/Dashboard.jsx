// src/pages/gestor_recursos/Dashboard.jsx
import { useState, useEffect } from 'react';
import { usuariosService } from '../../services/usuariosService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import './Dashboard.css';

export default function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [estadisticas, setEstadisticas] = useState({
    pendientes: 0,
    aprobados: 0,
    rechazados: 0,
    jefes_brigada: 0,
    botanicos: 0,
    tecnicos: 0,
    coinvestigadores: 0
  });

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Obtener datos
      const [pendientesRes, todosRes] = await Promise.all([
        usuariosService.getPendientes(),
        usuariosService.getAll()
      ]);
      
      console.log('📊 Respuesta getPendientes:', pendientesRes.data);
      console.log('📊 Respuesta getAll:', todosRes.data);
      
      // Asegurar que tenemos arrays
      const pendientes = Array.isArray(pendientesRes.data) ? pendientesRes.data : [];
      const usuarios = Array.isArray(todosRes.data) ? todosRes.data : [];
      
      const aprobados = usuarios.filter(u => u.estado_aprobacion === 'aprobado').length;
      const rechazados = usuarios.filter(u => u.estado_aprobacion === 'rechazado').length;
      
      // Función auxiliar para contar roles
      const contarPorRol = async (codigo) => {
        try {
          const res = await usuariosService.getCuentasRolFiltros({ 
            rol_codigo: codigo,
            solo_aprobados: true 
          });
          const data = Array.isArray(res.data) ? res.data : [];
          console.log(`📊 ${codigo}:`, data.length);
          return data.length;
        } catch (err) {
          console.error(`Error contando ${codigo}:`, err);
          return 0;
        }
      };

      // Contar todos los roles en paralelo
      const [jefes, botanicos, tecnicos, coinvestigadores] = await Promise.all([
        contarPorRol('JEFE_BRIGADA'),
        contarPorRol('BOTANICO'),
        contarPorRol('TECNICO'),
        contarPorRol('COINVESTIGADOR')
      ]);
      
      setEstadisticas({
        pendientes: pendientes.length,
        aprobados,
        rechazados,
        jefes_brigada: jefes,
        botanicos,
        tecnicos,
        coinvestigadores
      });
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
      console.error('Detalle del error:', err.response?.data);
      setError(err.response?.data?.error || 'Error al cargar estadísticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <LoadingSpinner mensaje="Cargando estadísticas..." />;
  if (error) return <ErrorAlert mensaje={error} onRetry={cargarEstadisticas} />;

  const { pendientes, aprobados, rechazados, jefes_brigada, botanicos, tecnicos, coinvestigadores } = estadisticas;
  const totalPersonal = jefes_brigada + botanicos + tecnicos + coinvestigadores;

  return (
    <div className="dashboard-gestor">
      <div className="dashboard-header">
        <h1>Panel de Control - Gestor de Recursos</h1>
        <p>Gestión y supervisión de recursos humanos</p>
      </div>

      <div className="section">
        <h2>Estado de Candidaturas</h2>
        <div className="metrics-grid">
          <div className="metric-card pendientes">
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <div className="metric-content">
              <h3>Pendientes de Revisión</h3>
              <p className="metric-value">{pendientes}</p>
              <span className="metric-label">Requieren aprobación</span>
            </div>
          </div>

          <div className="metric-card aprobados">
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <div className="metric-content">
              <h3>Aprobados</h3>
              <p className="metric-value">{aprobados}</p>
              <span className="metric-label">Usuarios habilitados</span>
            </div>
          </div>

          <div className="metric-card rechazados">
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <div className="metric-content">
              <h3>Rechazados</h3>
              <p className="metric-value">{rechazados}</p>
              <span className="metric-label">No cumplen perfil</span>
            </div>
          </div>
        </div>
      </div>

      <div className="section">
        <h2>Personal por Rol</h2>
        <div className="metrics-grid">
          <div className="metric-card total">
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div className="metric-content">
              <h3>Total Personal</h3>
              <p className="metric-value">{totalPersonal}</p>
              <span className="metric-label">Con roles asignados</span>
            </div>
          </div>

          <div className="metric-card jefe">
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="metric-content">
              <h3>Jefes de Brigada</h3>
              <p className="metric-value">{jefes_brigada}</p>
              <span className="metric-label">Liderazgo operacional</span>
            </div>
          </div>

          <div className="metric-card botanico">
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M7 20h10" />
                <path d="M12 20v-8" />
                <path d="M12 12c-2 0-3.5-1.5-3.5-4.5S9.5 3 12 3s3.5 1 3.5 4.5S14 12 12 12z" />
              </svg>
            </div>
            <div className="metric-content">
              <h3>Botánicos</h3>
              <p className="metric-value">{botanicos}</p>
              <span className="metric-label">Identificación especies</span>
            </div>
          </div>

          <div className="metric-card tecnico">
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
            </div>
            <div className="metric-content">
              <h3>Técnicos</h3>
              <p className="metric-value">{tecnicos}</p>
              <span className="metric-label">Medición y registro</span>
            </div>
          </div>

          <div className="metric-card coinvestigador">
            <div className="metric-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
            </div>
            <div className="metric-content">
              <h3>Coinvestigadores</h3>
              <p className="metric-value">{coinvestigadores}</p>
              <span className="metric-label">Apoyo operacional</span>
            </div>
          </div>
        </div>
      </div>

      {pendientes > 0 && (
        <div className="alert-warning">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <strong>Atención:</strong> Hay {pendientes} candidatura{pendientes > 1 ? 's' : ''} pendiente{pendientes > 1 ? 's' : ''} de revisión
        </div>
      )}

      <div className="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div className="actions-grid">
          <button 
            onClick={() => window.location.href = '/gestor-recursos/gestion-personal?tab=pendientes'}
            className="action-button pendientes"
          >
            <span className="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </svg>
            </span>
            <span className="action-text">Revisar Candidaturas</span>
            {pendientes > 0 && <span className="action-badge">{pendientes}</span>}
          </button>
          
          <button 
            onClick={() => window.location.href = '/gestor-recursos/gestion-personal?tab=roles'}
            className="action-button roles"
          >
            <span className="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </span>
            <span className="action-text">Asignar Roles</span>
          </button>
          
          <button 
            onClick={() => window.location.href = '/gestor-recursos/gestion-personal?tab=aprobados'}
            className="action-button personal"
          >
            <span className="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </span>
            <span className="action-text">Ver Personal Activo</span>
          </button>
        </div>
      </div>
    </div>
  );
}