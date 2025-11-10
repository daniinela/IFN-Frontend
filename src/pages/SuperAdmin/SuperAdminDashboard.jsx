// src/pages/superadmin/SuperAdminDashboard.jsx
import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import axios from '../../api/axiosConfig';
import './SuperAdminDashboard.css';

function SuperAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalConglomerados: 0,
    sinAsignar: 0,
    enRevision: 0,
    aprobados: 0,
    rechazados: 0,
    totalBrigadas: 0,
    totalBrigadistas: 0,
    totalCoordinadores: 0
  });

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);
      setError('');

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('No autenticado');
        return;
      }

      const token = session.access_token;

      // Llamadas paralelas a los microservicios
      const [congloRes, brigadasRes, brigadistasRes, usuariosRes] = await Promise.all([
        axios.get('http://localhost:3001/api/conglomerados/estadisticas', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          console.error('Error conglomerados:', err);
          return { data: {} };
        }),
        axios.get('http://localhost:3002/api/brigadas', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          console.error('Error brigadas:', err);
          return { data: [] };
        }),
        axios.get('http://localhost:3002/api/brigadistas', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          console.error('Error brigadistas:', err);
          return { data: [] };
        }),
        axios.get('http://localhost:3000/api/usuarios', {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(err => {
          console.error('Error usuarios:', err);
          return { data: [] };
        })
      ]);

      // Contar coordinadores (usuarios con rol coord_georef o coord_brigadas)
      const coordinadores = usuariosRes.data.filter(user => 
        user.roles?.some(r => r.codigo === 'coord_georef' || r.codigo === 'coord_brigadas')
      );

      setStats({
        totalConglomerados: congloRes.data.total || 0,
        sinAsignar: congloRes.data.sin_asignar || 0,
        enRevision: congloRes.data.en_revision || 0,
        aprobados: congloRes.data.aprobado || 0,
        rechazados: (congloRes.data.rechazado_temporal || 0) + (congloRes.data.rechazado_permanente || 0),
        totalBrigadas: brigadasRes.data.length || 0,
        totalBrigadistas: brigadistasRes.data.length || 0,
        totalCoordinadores: coordinadores.length || 0
      });

    } catch (error) {
      console.error('Error general:', error);
      setError('Error al cargar estadísticas del sistema');
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    {
      title: 'Total Conglomerados',
      value: stats.totalConglomerados,
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
      title: 'Sin Asignar',
      value: stats.sinAsignar,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 16v-4M12 8h.01"/>
        </svg>
      ),
      color: '#6b7280',
      bgGradient: 'linear-gradient(135deg, #6b7280 0%, #9ca3af 100%)'
    },
    {
      title: 'En Revisión',
      value: stats.enRevision,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4"/>
          <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
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
      title: 'Brigadas Activas',
      value: stats.totalBrigadas,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
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
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
      color: '#06b6d4',
      bgGradient: 'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)'
    },
    {
      title: 'Coordinadores',
      value: stats.totalCoordinadores,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
          <circle cx="9" cy="7" r="4"/>
          <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
          <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
        </svg>
      ),
      color: '#ec4899',
      bgGradient: 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)'
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
    <div className="superadmin-dashboard">
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Panel de Super Administrador</h2>
          <p className="dashboard-subtitle">
            Vista general del Sistema de Inventario Forestal Nacional
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
          <button className="action-card primary-action">
            <div className="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
            </div>
            <div className="action-content">
              <h4>Generar Conglomerados</h4>
              <p>Crear nuevos puntos de muestreo</p>
            </div>
          </button>

          <button className="action-card warning-action">
            <div className="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="8.5" cy="7" r="4"/>
                <polyline points="17 11 19 13 23 9"/>
              </svg>
            </div>
            <div className="action-content">
              <h4>Asignar Lotes</h4>
              <p>Distribuir conglomerados a coordinadores</p>
            </div>
          </button>

          <button className="action-card success-action">
            <div className="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className="action-content">
              <h4>Gestionar Usuarios</h4>
              <p>Crear y administrar cuentas</p>
            </div>
          </button>

          <button className="action-card info-action">
            <div className="action-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21.21 15.89A10 10 0 1 1 8 2.83"/>
                <path d="M22 12A10 10 0 0 0 12 2v10z"/>
              </svg>
            </div>
            <div className="action-content">
              <h4>Ver Reportes</h4>
              <p>Analíticas y métricas del sistema</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}

export default SuperAdminDashboard;