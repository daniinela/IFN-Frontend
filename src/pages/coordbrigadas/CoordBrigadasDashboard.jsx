import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../../api/axiosConfig';
import './CoordBrigadasDashboard.css';

function CoordBrigadasDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalBrigadas: 0,
    brigadasActivas: 0,
    brigadasFormacion: 0,
    brigadasCompletadas: 0,
    totalBrigadistas: 0,
    brigadistasActivos: 0,
    conglomeradosDisponibles: 0,
    invitacionesPendientes: 0
  });

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError('');

      // Obtener brigadas
      const brigadasRes = await axios.get('http://localhost:3002/api/brigadas').catch(() => ({ data: [] }));
      const brigadas = Array.isArray(brigadasRes.data) ? brigadasRes.data : [];

      // Obtener brigadistas
      const brigadistasRes = await axios.get('http://localhost:3002/api/brigadistas').catch(() => ({ data: [] }));
      const brigadistas = Array.isArray(brigadistasRes.data) ? brigadistasRes.data : [];

      // Obtener conglomerados disponibles
      const congloDisponiblesRes = await axios.get('http://localhost:3002/api/brigadas/conglomerados-disponibles').catch(() => ({ data: [] }));
      const conglomeradosDisponibles = Array.isArray(congloDisponiblesRes.data) ? congloDisponiblesRes.data : [];

      // Calcular estadísticas
      const brigadasActivas = brigadas.filter(b => b.estado === 'activa').length;
      const brigadasFormacion = brigadas.filter(b => b.estado === 'formacion').length;
      const brigadasCompletadas = brigadas.filter(b => b.estado === 'completada').length;
      
      const brigadistasActivos = brigadistas.filter(b => b.rol !== 'coinvestigador').length;

      // Contar invitaciones pendientes
      let invitacionesPendientes = 0;
      for (const brigada of brigadas) {
        if (brigada.brigadistas) {
          invitacionesPendientes += brigada.brigadistas.filter(
            bb => bb.estado_invitacion === 'pendiente'
          ).length;
        }
      }

      setStats({
        totalBrigadas: brigadas.length,
        brigadasActivas,
        brigadasFormacion,
        brigadasCompletadas,
        totalBrigadistas: brigadistas.length,
        brigadistasActivos,
        conglomeradosDisponibles: conglomeradosDisponibles.length,
        invitacionesPendientes
      });

    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setError('Error al cargar estadísticas del sistema');
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: 'Total Brigadas',
      value: stats.totalBrigadas,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      color: '#3b82f6',
      bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)'
    },
    {
      title: 'Brigadas Activas',
      value: stats.brigadasActivas,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      color: '#10b981',
      bgGradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
    },
    {
      title: 'En Formación',
      value: stats.brigadasFormacion,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v6l4 2"/>
        </svg>
      ),
      color: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
    },
    {
      title: 'Completadas',
      value: stats.brigadasCompletadas,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 21H4.6C4.03995 21 3.75992 21 3.54601 20.891C3.35785 20.7951 3.20487 20.6422 3.10899 20.454C3 20.2401 3 19.9601 3 19.4V3M7 10.5V17.5M11.5 5.5V17.5M16 10.5V17.5M20.5 5.5V17.5" />
        </svg>
      ),
      color: '#8b5cf6',
      bgGradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)'
    },
    {
      title: 'Total Brigadistas',
      value: stats.totalBrigadistas,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      ),
      color: '#06b6d4',
      bgGradient: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)'
    },
    {
      title: 'Brigadistas Activos',
      value: stats.brigadistasActivos,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="8.5" cy="7" r="4" />
          <polyline points="17 11 19 13 23 9" />
        </svg>
      ),
      color: '#10b981',
      bgGradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
    },
    {
      title: 'Conglomerados Disponibles',
      value: stats.conglomeradosDisponibles,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
      color: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)'
    },
    {
      title: 'Invitaciones Pendientes',
      value: stats.invitacionesPendientes,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      color: '#ef4444',
      bgGradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
    }
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Cargando panel de control...</p>
      </div>
    );
  }

  return (
    <div className="coordbrigadas-dashboard">
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Panel de Coordinador de Brigadas</h2>
          <p className="dashboard-subtitle">Gestión de equipos de trabajo de campo</p>
        </div>
        <button className="refresh-btn" onClick={cargarEstadisticas}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M21.5 2V8H15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Actualizar
        </button>
      </div>

      {error && (
        <div className="dashboard-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
          </svg>
          {error}
        </div>
      )}

      <div className="stats-grid">
        {cards.map((card, index) => (
          <div key={index} className="stat-card" style={{ '--card-delay': `${index * 0.1}s` }}>
            <div className="stat-card-inner">
              <div className="stat-icon-wrapper" style={{ background: card.bgGradient }}>
                <span className="stat-icon">{card.icon}</span>
              </div>
              <div className="stat-details">
                <p className="stat-label">{card.title}</p>
                <h3 className="stat-value">{card.value}</h3>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="quick-actions-section">
        <h3 className="section-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Acciones Rápidas
        </h3>
        <div className="actions-grid">
          {stats.conglomeradosDisponibles > 0 && (
            <button 
              className="action-card primary-action"
              onClick={() => navigate('/brigadas')}
            >
              <div className="action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
              </div>
              <div className="action-content">
                <h4>Crear Brigada</h4>
                <p>{stats.conglomeradosDisponibles} conglomerados disponibles</p>
              </div>
            </button>
          )}

          <button 
            className="action-card success-action"
            onClick={() => navigate('/brigadistas')}
          >
            <div className="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div className="action-content">
              <h4>Gestionar Brigadistas</h4>
              <p>{stats.totalBrigadistas} registrados</p>
            </div>
          </button>

          {stats.brigadasFormacion > 0 && (
            <button 
              className="action-card warning-action"
              onClick={() => navigate('/brigadas')}
            >
              <div className="action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <div className="action-content">
                <h4>Brigadas en Formación</h4>
                <p>{stats.brigadasFormacion} pendientes de activar</p>
              </div>
            </button>
          )}

          {stats.invitacionesPendientes > 0 && (
            <button 
              className="action-card info-action"
              onClick={() => navigate('/brigadas')}
            >
              <div className="action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                  <line x1="16" y1="2" x2="16" y2="6"/>
                  <line x1="8" y1="2" x2="8" y2="6"/>
                  <line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <div className="action-content">
                <h4>Invitaciones Pendientes</h4>
                <p>{stats.invitacionesPendientes} esperando respuesta</p>
              </div>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default CoordBrigadasDashboard;