import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import axios from '../../api/axiosConfig';
import './AdminDashboard.css';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState({
    totalBrigadistas: 0,
    totalConglomerados: 0,
    totalBrigadas: 0,
    brigadistasActivos: 0
  });
  const [showHelp, setShowHelp] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

  const helpSlides = [
    {
      icon: '📊',
      title: 'Bienvenido al Dashboard',
      description: 'Aquí encontrarás todas las estadísticas clave del sistema. Las tarjetas muestran métricas en tiempo real de brigadistas, conglomerados y brigadas activas.',
      tips: ['Haz clic en las tarjetas para ver detalles', 'Usa las acciones rápidas abajo']
    },
    {
      icon: '👤',
      title: 'Gestión de Brigadistas',
      description: 'Invita nuevos brigadistas al sistema enviándoles un correo. Ellos recibirán un enlace para completar su registro con toda su información académica.',
      tips: ['Verifica que el email sea institucional', 'Puedes ver el estado de invitaciones']
    },
    {
      icon: '🗺️',
      title: 'Conglomerados',
      description: 'Genera nuevos puntos de muestreo para el inventario forestal. El sistema calcula automáticamente las coordenadas y asigna los códigos correspondientes.',
      tips: ['Revisa coordenadas antes de generar', 'Exporta la lista en formato Excel']
    },
    {
      icon: '👥',
      title: 'Brigadas',
      description: 'Crea equipos de trabajo asignando brigadistas a brigadas. Cada brigada necesita un jefe, botánicos y técnicos para funcionar correctamente.',
      tips: ['Mínimo 3 brigadistas por brigada', 'Asigna conglomerados después de crear']
    },
    {
      icon: '💡',
      title: 'Consejos Rápidos',
      description: 'Usa el menú lateral para navegar. Los iconos indican cada sección. Si tienes dudas, contacta al soporte técnico desde el menú de usuario.',
      tips: ['Ctrl + K para búsqueda rápida', 'Exporta reportes desde cada sección']
    }
  ];

  useEffect(() => {
    console.log('useEffect ejecutado en Dashboard');
    const fetchStats = async () => {
      try {
        setLoading(true);
        setError('');

        // CORRECTO: Obtener el token desde Supabase automáticamente
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError || !session) {
          console.error('Error de sesión:', sessionError);
          setError('No autenticado. Por favor inicia sesión.');
          return;
        }

        const token = session.access_token;
        console.log('Token de Supabase obtenido:', token?.substring(0, 10) + '...');

        // Hacer las peticiones con el token de Supabase
        const [brigadistasRes, conglomeradosRes, brigadasRes] = await Promise.all([
          axios.get('http://localhost:3002/api/brigadistas', { 
            headers: { Authorization: `Bearer ${token}` } 
          }).catch(err => {
            console.error('Error en brigadistas:', err.response?.status, err.response?.data || err.message);
            return { data: [] };
          }),
          axios.get('http://localhost:3003/api/conglomerados', { 
            headers: { Authorization: `Bearer ${token}` } 
          }).catch(err => {
            console.error('Error en conglomerados:', err.response?.status, err.response?.data || err.message);
            return { data: [] };
          }),
          axios.get('http://localhost:3004/api/brigadas', { 
            headers: { Authorization: `Bearer ${token}` } 
          }).catch(err => {
            console.error('Error en brigadas:', err.response?.status, err.response?.data || err.message);
            return { data: [] };
          }),
        ]);

        console.log('Respuesta de brigadistas:', brigadistasRes.data);
        console.log('Respuesta de conglomerados:', conglomeradosRes.data);
        console.log('Respuesta de brigadas:', brigadasRes.data);

        setStats({
          totalBrigadistas: brigadistasRes.data.length,
          totalConglomerados: conglomeradosRes.data.length,
          totalBrigadas: brigadasRes.data.length,
          brigadistasActivos: brigadistasRes.data.filter(b => b.rol !== 'coinvestigador').length,
        });
      } catch (error) {
        console.error('Error general en fetchStats:', error);
        setError('Error al cargar estadísticas');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  // Control del carrusel
  useEffect(() => {
    if (!showHelp) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % helpSlides.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [showHelp, helpSlides.length]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % helpSlides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + helpSlides.length) % helpSlides.length);
  };

  const cards = [
    { 
      title: 'Total Brigadistas', 
      value: stats.totalBrigadistas, 
      icon: '👤', 
      color: '#3b82f6',
      bgGradient: 'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
      description: 'Usuarios registrados'
    },
    { 
      title: 'Conglomerados', 
      value: stats.totalConglomerados, 
      icon: '🗺️', 
      color: '#10b981',
      bgGradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
      description: 'Puntos de muestreo'
    },
    { 
      title: 'Brigadas Activas', 
      value: stats.totalBrigadas, 
      icon: '👥', 
      color: '#f59e0b',
      bgGradient: 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
      description: 'Equipos formados'
    },
    { 
      title: 'En Campo', 
      value: stats.brigadistasActivos, 
      icon: '✅', 
      color: '#8b5cf6',
      bgGradient: 'linear-gradient(135deg, #8b5cf6 0%, #a78bfa 100%)',
      description: 'Brigadistas activos'
    }
  ];

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="loading-spinner"></div>
        <p>Cargando estadísticas...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      {/* Header con botón de ayuda */}
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">Panel de Control</h2>
          <p className="dashboard-subtitle">Resumen general del sistema</p>
        </div>
        <button className="help-btn-dashboard" onClick={() => setShowHelp(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 17H12.01" stroke="currentColor" strokeWidth="2"/>
          </svg>
          ¿Necesitas ayuda?
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
      
      {/* Stats Cards */}
      <div className="stats-grid">
        {cards.map((card, index) => (
          <div key={index} className="stat-card-modern" style={{ '--card-delay': `${index * 0.1}s` }}>
            <div className="stat-card-inner">
              <div className="stat-icon-wrapper" style={{ background: card.bgGradient }}>
                <span className="stat-icon-large">{card.icon}</span>
              </div>
              <div className="stat-details">
                <p className="stat-label-modern">{card.title}</p>
                <h3 className="stat-value-modern">{card.value}</h3>
                <p className="stat-desc-modern">{card.description}</p>
              </div>
              <div className="stat-trend">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M13 7L18 12L13 17" stroke={card.color} strokeWidth="2"/>
                  <path d="M6 12H18" stroke={card.color} strokeWidth="2"/>
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions-section">
        <h3 className="section-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          Acciones Rápidas
        </h3>
        <div className="actions-grid-modern">
          <button className="action-card primary-action">
            <div className="action-icon">🗺️</div>
            <div className="action-content">
              <h4>Generar Conglomerado</h4>
              <p>Crear nuevo punto de muestreo</p>
            </div>
          </button>
          <button className="action-card success-action">
            <div className="action-icon">👤</div>
            <div className="action-content">
              <h4>Invitar Brigadista</h4>
              <p>Enviar invitación por email</p>
            </div>
          </button>
          <button className="action-card warning-action">
            <div className="action-icon">👥</div>
            <div className="action-content">
              <h4>Crear Brigada</h4>
              <p>Formar nuevo equipo de trabajo</p>
            </div>
          </button>
          <button className="action-card info-action">
            <div className="action-icon">📊</div>
            <div className="action-content">
              <h4>Ver Reportes</h4>
              <p>Analíticas y exportación</p>
            </div>
          </button>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div className="recent-activity">
        <h3 className="section-title">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Actividad Reciente
        </h3>
        <div className="activity-list">
          <div className="activity-item">
            <div className="activity-icon success">✓</div>
            <div className="activity-content">
              <p className="activity-title">Nueva brigada creada</p>
              <p className="activity-time">Hace 2 horas</p>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon info">📍</div>
            <div className="activity-content">
              <p className="activity-title">5 conglomerados generados</p>
              <p className="activity-time">Hace 5 horas</p>
            </div>
          </div>
          <div className="activity-item">
            <div className="activity-icon warning">👤</div>
            <div className="activity-content">
              <p className="activity-title">Nuevo brigadista registrado</p>
              <p className="activity-time">Hace 1 día</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Ayuda con Carrusel */}
      {showHelp && (
        <div className="help-overlay-dashboard" onClick={() => setShowHelp(false)}>
          <div className="help-modal-dashboard" onClick={(e) => e.stopPropagation()}>
            <button className="help-close-btn" onClick={() => setShowHelp(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2"/>
              </svg>
            </button>

            <div className="help-carousel">
              <div className="help-slide">
                <div className="help-icon-big">{helpSlides[currentSlide].icon}</div>
                <h3>{helpSlides[currentSlide].title}</h3>
                <p>{helpSlides[currentSlide].description}</p>
                <div className="help-tips">
                  {helpSlides[currentSlide].tips.map((tip, i) => (
                    <div key={i} className="tip-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span>{tip}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="help-controls">
                <button onClick={prevSlide} className="help-nav-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>

                <div className="help-indicators">
                  {helpSlides.map((_, index) => (
                    <button
                      key={index}
                      className={`help-indicator ${index === currentSlide ? 'active' : ''}`}
                      onClick={() => setCurrentSlide(index)}
                    />
                  ))}
                </div>

                <button onClick={nextSlide} className="help-nav-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                </button>
              </div>

              <div className="help-progress">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${((currentSlide + 1) / helpSlides.length) * 100}%` }}
                  />
                </div>
                <span className="progress-text">{currentSlide + 1} de {helpSlides.length}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;