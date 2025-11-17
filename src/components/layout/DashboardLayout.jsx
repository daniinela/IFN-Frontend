// src/components/layout/DashboardLayout.jsx
import { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import Sidebar from './Sidebar';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Obtener datos del usuario y rol activo
  const userData = JSON.parse(localStorage.getItem('user-data') || '{}');
  const [activeRole, setActiveRole] = useState(localStorage.getItem('active-role') || '');
  const userRolesStr = localStorage.getItem('user-roles');
  const userRoles = userRolesStr ? JSON.parse(userRolesStr) : [];

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !darkMode;
    setDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  const cambiarRol = async (nuevoRol) => {
    try {
      localStorage.setItem('active-role', nuevoRol);
      setActiveRole(nuevoRol);
      setShowRoleMenu(false);
      
      const token = localStorage.getItem('token');
      
      const cuentasRol = userRoles;
      const rolActivo = cuentasRol.find(r => r.codigo === nuevoRol);
      
      if (!rolActivo) {
        console.error('Rol no encontrado');
        return;
      }

      const rolesResponse = await fetch(`http://localhost:3001/api/usuarios/roles/${rolActivo.id}/privilegios`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const privilegiosDelRol = await rolesResponse.json();
      localStorage.setItem('user-privileges', JSON.stringify(privilegiosDelRol));

      // Rutas según rol
      const rutas = {
        'COORD_IFN': '/coord-ifn/dashboard',
        'GESTOR_RECURSOS': '/gestor-recursos/dashboard',
        'JEFE_BRIGADA': '/jefe-brigada/dashboard',
        'BOTANICO': '/jefe-brigada/dashboard',
        'TECNICO_AUX': '/jefe-brigada/dashboard',
        'COINVESTIGADOR': '/jefe-brigada/dashboard'
      };

      navigate(rutas[nuevoRol] || '/');
    } catch (error) {
      console.error('Error cambiando rol:', error);
      alert('Error al cambiar de rol');
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
      alert('Error al cerrar sesión');
    }
  };

  const getRoleName = (codigo) => {
    const roles = {
      'COORD_IFN': 'Coordinador IFN',
      'GESTOR_RECURSOS': 'Gestor de Recursos',
      'JEFE_BRIGADA': 'Jefe de Brigada',
      'BOTANICO': 'Botánico',
      'TECNICO_AUX': 'Técnico Auxiliar',
      'COINVESTIGADOR': 'Coinvestigador'
    };
    return roles[codigo || activeRole] || 'Usuario';
  };

  const getRoleColor = (codigo) => {
    const colors = {
      'COORD_IFN': '#2d6a4f',
      'GESTOR_RECURSOS': '#3b82f6',
      'JEFE_BRIGADA': '#8b5cf6',
      'BOTANICO': '#10b981',
      'TECNICO_AUX': '#f59e0b',
      'COINVESTIGADOR': '#ef4444'
    };
    return colors[codigo || activeRole] || '#64748b';
  };

  const getUserInitials = () => {
    const name = userData.nombre_completo || 'Usuario';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className="dashboard-layout">
      <Sidebar />

      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <div className="page-indicator">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <div>
                <h1>Dashboard IFN</h1>
                <p>{getRoleName(activeRole)}</p>
              </div>
            </div>
          </div>
          
          <div className="topbar-right">
            {/* Theme Toggle */}
            <button 
              className="topbar-button"
              onClick={toggleTheme}
              title={darkMode ? 'Modo Claro' : 'Modo Oscuro'}
            >
              {darkMode ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="5" />
                  <line x1="12" y1="1" x2="12" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="23" />
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                  <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                  <line x1="1" y1="12" x2="3" y2="12" />
                  <line x1="21" y1="12" x2="23" y2="12" />
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                  <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
                </svg>
              )}
            </button>

            {/* Role Selector */}
            {userRoles.length > 1 && (
              <div className="dropdown-wrapper">
                <button 
                  onClick={() => {
                    setShowRoleMenu(!showRoleMenu);
                    setShowUserMenu(false);
                  }}
                  className="topbar-button role-selector"
                  style={{ '--role-color': getRoleColor(activeRole) }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  <span>{getRoleName(activeRole)}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9"/>
                  </svg>
                </button>

                {showRoleMenu && (
                  <>
                    <div 
                      className="dropdown-overlay"
                      onClick={() => setShowRoleMenu(false)}
                    />
                    
                    <div className="dropdown-menu">
                      <div className="dropdown-header">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <circle cx="12" cy="12" r="3" />
                          <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2" />
                        </svg>
                        <span>Cambiar Rol</span>
                      </div>
                      {userRoles.map(rol => {
                        const isActiveRol = rol.codigo === activeRole;
                        const roleColor = getRoleColor(rol.codigo);
                        return (
                          <button
                            key={rol.codigo}
                            onClick={() => cambiarRol(rol.codigo)}
                            disabled={isActiveRol}
                            className={`dropdown-item ${isActiveRol ? 'active' : ''}`}
                            style={isActiveRol ? { '--role-color': roleColor } : {}}
                          >
                            <div className="dropdown-item-content">
                              {isActiveRol && (
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                              )}
                              {!isActiveRol && <div style={{ width: '18px' }} />}
                              <span>{getRoleName(rol.codigo)}</span>
                            </div>
                            {isActiveRol && <span className="active-badge">Actual</span>}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* User Menu */}
            <div className="dropdown-wrapper">
              <button
                onClick={() => {
                  setShowUserMenu(!showUserMenu);
                  setShowRoleMenu(false);
                }}
                className="topbar-user"
              >
                <div className="user-avatar" style={{ '--role-color': getRoleColor(activeRole) }}>
                  {getUserInitials()}
                </div>
                <div className="user-info">
                  <span className="user-name">{userData.nombre_completo || 'Usuario'}</span>
                  <span className="user-email">{userData.email || ''}</span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {showUserMenu && (
                <>
                  <div 
                    className="dropdown-overlay"
                    onClick={() => setShowUserMenu(false)}
                  />
                  
                  <div className="dropdown-menu user-menu">
                    <div className="user-menu-header">
                      <div className="user-avatar large" style={{ '--role-color': getRoleColor(activeRole) }}>
                        {getUserInitials()}
                      </div>
                      <div className="user-menu-info">
                        <strong>{userData.nombre_completo || 'Usuario'}</strong>
                        <span>{userData.email || ''}</span>
                        <span className="role-tag" style={{ '--role-color': getRoleColor(activeRole) }}>
                          {getRoleName(activeRole)}
                        </span>
                      </div>
                    </div>

                    <div className="dropdown-divider" />

                    <button className="dropdown-item" onClick={() => navigate('/perfil')}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                      </svg>
                      <span>Mi Perfil</span>
                    </button>

                    <button className="dropdown-item" onClick={() => navigate('/configuracion')}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="3" />
                        <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m0 6l4.2 4.2M23 12h-6m-6 0H1m18.2 5.2l-4.2-4.2m0-6l4.2-4.2" />
                      </svg>
                      <span>Configuración</span>
                    </button>

                    <div className="dropdown-divider" />

                    <button 
                      className="dropdown-item logout"
                      onClick={handleLogout}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      <span>Cerrar Sesión</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}