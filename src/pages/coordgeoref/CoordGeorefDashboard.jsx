// src/pages/coordgeoref/CoordGeorefDashboard.jsx
import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import axios from '../../api/axiosConfig';
import './CoordGeorefDashboard.css';

function CoordGeorefDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalAsignados: 0,
    pendientesRevision: 0,
    aprobados: 0,
    rechazados: 0,
    vencidos: 0,
    promedioRevisionDias: 0,
    proximosVencer: 0,
    revisionesHoy: 0
  });

  // Función auxiliar para calcular promedio de días de revisión
  const calcularPromedio = (conglomerados) => {
    const revisados = conglomerados.filter(c => c.updated_at && c.fecha_asignacion);
    if (revisados.length === 0) return 0;
    
    const tiempos = revisados.map(c => {
      const inicio = new Date(c.fecha_asignacion);
      const fin = new Date(c.updated_at);
      return (fin - inicio) / (1000 * 60 * 60 * 24); // Días
    });
    
    return Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length);
  };

  const cargarEstadisticas = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('No autenticado');
        return;
      }

      const token = session.access_token;

      // ✅ Obtener TODOS mis asignados (sin paginación para contar)
      const misAsignadosRes = await axios.get(
        'http://localhost:3001/api/conglomerados/mis-asignados?page=1&limit=1000',
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const conglomerados = misAsignadosRes.data.data || [];
      const hoy = new Date();

      // ✅ Calcular estadísticas localmente
      const aprobados = conglomerados.filter(c => c.estado === 'aprobado');
      const rechazados = conglomerados.filter(c => c.estado === 'rechazado_permanente');
      const enRevision = conglomerados.filter(c => c.estado === 'en_revision');
      
      const vencidos = conglomerados.filter(c => c.plazo_vencido === true);
      const proximosVencer = conglomerados.filter(c => 
        c.dias_restantes !== null && c.dias_restantes >= 0 && c.dias_restantes <= 5
      );

      // Calcular promedio de días de revisión
      const promedio = calcularPromedio([...aprobados, ...rechazados]);

      // Revisiones de hoy
      const revisionesHoy = conglomerados.filter(c => 
        c.updated_at && new Date(c.updated_at).toDateString() === hoy.toDateString()
      );

      setStats({
        totalAsignados: conglomerados.length,
        pendientesRevision: enRevision.length,
        aprobados: aprobados.length,
        rechazados: rechazados.length,
        vencidos: vencidos.length,
        proximosVencer: proximosVencer.length,
        promedioRevisionDias: promedio,
        revisionesHoy: revisionesHoy.length
      });

    } catch (error) {
      console.error('Error cargando estadísticas:', error);
      setError('Error al cargar estadísticas personales');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarEstadisticas();
  }, [cargarEstadisticas]);

  const cards = [
    {
      title: 'Total Asignados',
      value: stats.totalAsignados,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
      ),
      color: '#3b82f6',
      bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)'
    },
    {
      title: 'Pendientes Revisión',
      value: stats.pendientesRevision,
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
      title: 'Aprobados',
      value: stats.aprobados,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
          <polyline points="22 4 12 14.01 9 11.01"/>
        </svg>
      ),
      color: '#10b981',
      bgGradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)'
    },
    {
      title: 'Rechazados',
      value: stats.rechazados,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      ),
      color: '#ef4444',
      bgGradient: 'linear-gradient(135deg, #ef4444 0%, #f87171 100%)'
    },
    {
      title: 'Vencidos',
      value: stats.vencidos,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4M12 16h.01"/>
        </svg>
      ),
      color: '#dc2626',
      bgGradient: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)'
    },
    {
      title: 'Próximos a Vencer',
      value: stats.proximosVencer,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
          <line x1="12" y1="9" x2="12" y2="13"/>
          <line x1="12" y1="17" x2="12.01" y2="17"/>
        </svg>
      ),
      color: '#f97316',
      bgGradient: 'linear-gradient(135deg, #f97316 0%, #fb923c 100%)'
    },
    {
      title: 'Promedio Revisión',
      value: `${stats.promedioRevisionDias}d`,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <line x1="12" y1="20" x2="12" y2="10"/>
          <line x1="18" y1="20" x2="18" y2="4"/>
          <line x1="6" y1="20" x2="6" y2="16"/>
        </svg>
      ),
      color: '#8b5cf6',
      bgGradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)'
    },
    {
      title: 'Revisiones Hoy',
      value: stats.revisionesHoy,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
      ),
      color: '#06b6d4',
      bgGradient: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)'
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
    <div className="coordgeoref-dashboard">
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Panel de Coordinador Georreferenciación</h2>
          <p className="dashboard-subtitle">
            Gestión y validación de conglomerados asignados
          </p>
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
          <button 
            className="action-card primary-action"
            onClick={() => navigate('/mis-conglomerados?estado=en_revision')}
          >
            <div className="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
              </svg>
            </div>
            <div className="action-content">
              <h4>Revisar Pendientes</h4>
              <p>{stats.pendientesRevision} conglomerados por revisar</p>
            </div>
          </button>

          {stats.vencidos > 0 && (
            <button 
              className="action-card danger-action"
              onClick={() => navigate('/mis-conglomerados?estado=vencidos')}
            >
              <div className="action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 8v4M12 16h.01"/>
                </svg>
              </div>
              <div className="action-content">
                <h4>Atender Vencidos</h4>
                <p>{stats.vencidos} urgentes</p>
              </div>
            </button>
          )}

          {stats.proximosVencer > 0 && (
            <button 
              className="action-card warning-action"
              onClick={() => navigate('/mis-conglomerados?estado=proximos_vencer')}
            >
              <div className="action-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                </svg>
              </div>
              <div className="action-content">
                <h4>Próximos a Vencer</h4>
                <p>{stats.proximosVencer} conglomerados</p>
              </div>
            </button>
          )}

          <button 
            className="action-card success-action"
            onClick={() => navigate('/mis-conglomerados?estado=aprobado')}
          >
            <div className="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
                <polyline points="22 4 12 14.01 9 11.01"/>
              </svg>
            </div>
            <div className="action-content">
              <h4>Ver Aprobados</h4>
              <p>{stats.aprobados} validados exitosamente</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default CoordGeorefDashboard;