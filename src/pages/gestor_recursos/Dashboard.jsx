// src/pages/gestor_recursos/Dashboard.jsx
import { useState, useEffect } from 'react';
import { usuariosService } from '../../services/usuariosService';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

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
      
      const pendientesRes = await usuariosService.getPendientes();
      const todosRes = await usuariosService.getAll();
      const usuarios = todosRes.data;
      
      const aprobados = usuarios.filter(u => u.estado_aprobacion === 'aprobado').length;
      const rechazados = usuarios.filter(u => u.estado_aprobacion === 'rechazado').length;
      
      // Función auxiliar para contar roles
      const contarPorRol = async (codigo) => {
        try {
          const res = await usuariosService.getJefesBrigadaDisponibles({ rol_codigo: codigo });
          return res.data.length;
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
        pendientes: pendientesRes.data.length,
        aprobados,
        rechazados,
        jefes_brigada: jefes,
        botanicos,
        tecnicos,
        coinvestigadores
      });
    } catch (err) {
      console.error('Error cargando estadísticas:', err);
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
            <div className="metric-icon">⏳</div>
            <div className="metric-content">
              <h3>Pendientes de Revisión</h3>
              <p className="metric-value">{pendientes}</p>
              <span className="metric-label">Requieren aprobación</span>
            </div>
          </div>

          <div className="metric-card aprobados">
            <div className="metric-icon">✅</div>
            <div className="metric-content">
              <h3>Aprobados</h3>
              <p className="metric-value">{aprobados}</p>
              <span className="metric-label">Usuarios habilitados</span>
            </div>
          </div>

          <div className="metric-card rechazados">
            <div className="metric-icon">❌</div>
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
            <div className="metric-icon">👥</div>
            <div className="metric-content">
              <h3>Total Personal</h3>
              <p className="metric-value">{totalPersonal}</p>
              <span className="metric-label">Con roles asignados</span>
            </div>
          </div>

          <div className="metric-card jefe">
            <div className="metric-icon">👤</div>
            <div className="metric-content">
              <h3>Jefes de Brigada</h3>
              <p className="metric-value">{jefes_brigada}</p>
              <span className="metric-label">Liderazgo operacional</span>
            </div>
          </div>

          <div className="metric-card botanico">
            <div className="metric-icon">🌿</div>
            <div className="metric-content">
              <h3>Botánicos</h3>
              <p className="metric-value">{botanicos}</p>
              <span className="metric-label">Identificación especies</span>
            </div>
          </div>

          <div className="metric-card tecnico">
            <div className="metric-icon">📏</div>
            <div className="metric-content">
              <h3>Técnicos</h3>
              <p className="metric-value">{tecnicos}</p>
              <span className="metric-label">Medición y registro</span>
            </div>
          </div>

          <div className="metric-card coinvestigador">
            <div className="metric-icon">🔍</div>
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
          <strong>⚠️ Atención:</strong> Hay {pendientes} candidatura{pendientes > 1 ? 's' : ''} pendiente{pendientes > 1 ? 's' : ''} de revisión
        </div>
      )}

      <div className="quick-actions">
        <h2>Acciones Rápidas</h2>
        <div className="actions-grid">
          <button 
            onClick={() => window.location.href = '/gestor-recursos/gestion-personal?tab=pendientes'}
            className="action-button pendientes"
          >
            <span className="action-icon">📋</span>
            <span className="action-text">Revisar Candidaturas</span>
            {pendientes > 0 && <span className="action-badge">{pendientes}</span>}
          </button>
          
          <button 
            onClick={() => window.location.href = '/gestor-recursos/gestion-personal?tab=roles'}
            className="action-button roles"
          >
            <span className="action-icon">🎯</span>
            <span className="action-text">Asignar Roles</span>
          </button>
          
          <button 
            onClick={() => window.location.href = '/gestor-recursos/gestion-personal?tab=aprobados'}
            className="action-button personal"
          >
            <span className="action-icon">👥</span>
            <span className="action-text">Ver Personal Activo</span>
          </button>
        </div>
      </div>
    </div>
  );
}