// src/components/layout/Sidebar.jsx
import { useState, useEffect } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import './Sidebar.css';

export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const [searchParams] = useSearchParams();
  
  const activeRole = localStorage.getItem('active-role') || '';
  
  const brigada_id = searchParams.get('brigada');  
  const [estadoBrigada, setEstadoBrigada] = useState(null);
  const [conglomeradoId, setConglomeradoId] = useState(null);
  
  useEffect(() => {
    if (brigada_id) {
      cargarEstadoBrigada();
    }
  }, [brigada_id, location.pathname]); // 🆕 Recargar cuando cambie la ruta
  
  const cargarEstadoBrigada = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3003/api/brigadas/${brigada_id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      setEstadoBrigada(data.estado);
      setConglomeradoId(data.conglomerado_id);
      console.log('🔄 Estado brigada:', data.estado, 'Conglomerado:', data.conglomerado_id);
    } catch (error) {
      console.error('Error cargando estado brigada:', error);
    }
  };

  const getMenuItems = () => {
    const menus = {
      'COORD_IFN': [
        { 
          path: '/coord-ifn/dashboard', 
          label: 'Dashboard', 
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          )
        },
        { 
          path: '/coord-ifn/gestion-conglomerados', 
          label: 'Gestión Conglomerados', 
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          )
        },
        { 
          path: '/coord-ifn/asignacion-misiones', 
          label: 'Asignar Misiones', 
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          )
        },
        { 
          path: '/coord-ifn/monitoreo-global', 
          label: 'Monitoreo Global', 
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          )
        }
      ],
      'GESTOR_RECURSOS': [
        { 
          path: '/gestor-recursos/dashboard', 
          label: 'Dashboard', 
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          )
        },
        { 
          path: '/gestor-recursos/gestion-personal', 
          label: 'Gestión Personal', 
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          )
        }
      ],
      'JEFE_BRIGADA': [
        { 
          path: '/jefe-brigada/dashboard', 
          label: 'Dashboard', 
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
            </svg>
          )
        },
        ...(brigada_id ? [
          { 
            path: `/jefe-brigada/mis-misiones?brigada=${brigada_id}`, 
            label: 'Mis Misiones', 
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            ),
            badge: estadoBrigada === 'formacion' ? 'Formación' : 
                   estadoBrigada === 'en_transito' ? 'Tránsito' :
                   estadoBrigada === 'en_ejecucion' ? 'En Campo' : 
                   'Activa'
          }
        ] : []),
        // 🆕 Rutas de Acceso (solo si estado es en_transito o posterior)
        ...(brigada_id && estadoBrigada && ['en_transito', 'en_ejecucion', 'completada'].includes(estadoBrigada) ? [
          { 
            path: `/jefe-brigada/rutas-acceso?brigada=${brigada_id}`, 
            label: 'Rutas Acceso', 
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M5 17h14v-2H5z" />
                <path d="M16 11h5l-1.405-1.405A2.032 2.032 0 0018 8.158V6a1 1 0 00-1-1h-3a1 1 0 00-1 1v2.158c0 .538-.214 1.055-.595 1.437L11 11" />
                <circle cx="7" cy="17" r="2" />
                <circle cx="17" cy="17" r="2" />
              </svg>
            ),
            badge: estadoBrigada === 'en_transito' ? 'Activo' : undefined
          }
        ] : []),
        // 🆕 Establecimiento Subparcelas (solo si estado es en_ejecucion o posterior)
        ...(brigada_id && conglomeradoId && estadoBrigada && ['en_ejecucion', 'completada'].includes(estadoBrigada) ? [
          { 
            path: `/jefe-brigada/establecimiento-subparcelas?conglomerado=${conglomeradoId}`, 
            label: 'Subparcelas', 
            icon: (
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
              </svg>
            ),
            badge: estadoBrigada === 'en_ejecucion' ? 'Activo' : undefined
          }
        ] : [])
      ],
      'BOTANICO': [
        { 
          path: '/brigadista/dashboard', 
          label: 'Mis Brigadas', 
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          )
        }
      ],
      'TECNICO_AUX': [
        { 
          path: '/brigadista/dashboard', 
          label: 'Mis Brigadas', 
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          )
        }
      ],
      'COINVESTIGADOR': [
        { 
          path: '/brigadista/dashboard', 
          label: 'Mis Brigadas', 
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          )
        }
      ]
    };

    return menus[activeRole] || [];
  };

  const menuItems = getMenuItems();
  
  const isActive = (path) => {
    const currentPath = location.pathname;
    const itemPath = path.split('?')[0];
    return currentPath === itemPath;
  };

  const getRoleInfo = () => {
    const roles = {
      'COORD_IFN': { name: 'Coordinador IFN', color: '#2d6a4f' },
      'GESTOR_RECURSOS': { name: 'Gestor Recursos', color: '#3b82f6' },
      'JEFE_BRIGADA': { name: 'Jefe Brigada', color: '#8b5cf6' },
      'BOTANICO': { name: 'Botánico', color: '#10b981' },
      'TECNICO_AUX': { name: 'Técnico Aux', color: '#f59e0b' },
      'COINVESTIGADOR': { name: 'Coinvestigador', color: '#ef4444' }
    };
    return roles[activeRole] || { name: 'Usuario', color: '#64748b' };
  };

  const roleInfo = getRoleInfo();

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          {sidebarOpen && (
            <div className="logo-text">
              <h2>IFN Colombia</h2>
              <p>Inventario Forestal</p>
            </div>
          )}
        </div>

        {sidebarOpen && (
          <div className="role-badge" style={{ '--role-color': roleInfo.color }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
              <circle cx="12" cy="7" r="4"/>
            </svg>
            <span>{roleInfo.name}</span>
          </div>
        )}
      </div>

      <nav className="sidebar-menu">
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
            title={!sidebarOpen ? item.label : ''}
          >
            <span className="menu-icon">{item.icon}</span>
            {sidebarOpen && (
              <div className="menu-content">
                <span className="menu-text">{item.label}</span>
                {item.badge && (
                  <span className="menu-badge">{item.badge}</span>
                )}
              </div>
            )}
            {isActive(item.path) && <div className="active-indicator" />}
          </Link>
        ))}
        
        {activeRole === 'JEFE_BRIGADA' && !brigada_id && sidebarOpen && (
          <div className="sidebar-hint">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
            <div className="hint-text">
              <strong>Nota:</strong>
              <p>Selecciona una brigada desde el Dashboard para ver más opciones</p>
            </div>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <button 
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="sidebar-toggle"
          title={sidebarOpen ? 'Contraer menú' : 'Expandir menú'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            {sidebarOpen ? (
              <path d="M15 18l-6-6 6-6" />
            ) : (
              <path d="M9 18l6-6-6-6" />
            )}
          </svg>
        </button>
      </div>
    </aside>
  );
}