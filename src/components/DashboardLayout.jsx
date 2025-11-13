import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  
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

    if (nuevoRol === 'super_admin') {
      navigate('/super-admin/dashboard');
    } else if (nuevoRol === 'coord_georef') {
      navigate('/coord-georef/dashboard');
    } else if (nuevoRol === 'coord_brigadas') {
      navigate('/coord-brigadas/dashboard');
    } else if (nuevoRol === 'brigadista') {
      navigate('/brigadista/dashboard');
    }

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

  // MENÚ DINÁMICO SEGÚN ROL ACTIVO
  const getMenuItems = () => {
    if (activeRole === 'super_admin') {
      return [
        { 
          path: '/super-admin/dashboard', 
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
          path: '/generar-asignar', 
          label: 'Generar y Asignar',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          )
        }
      ];
    }
    
    if (activeRole === 'coord_georef') {
      return [
        { 
          path: '/coord-georef/dashboard', 
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
          path: '/mis-conglomerados', 
          label: 'Mis Conglomerados',
          icon: (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          )
        }
      ];
    }
    
if (activeRole === 'coord_brigadas') {
  
  const userPrivilegesStr = localStorage.getItem('user-privileges');
  const userPrivileges = userPrivilegesStr ? JSON.parse(userPrivilegesStr) : [];
  const privilegiosCodigos = userPrivileges.map(p => p.codigo);

  const menu = [
    { 
      path: '/coord-brigadas/dashboard', 
      label: 'Dashboard',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" />
        </svg>
      )
    }
  ];


  if (privilegiosCodigos.includes('brigadistas.solicitudes.gestionar')) {
    menu.push({ 
      path: '/revision-solicitudes', 
      label: 'Revisión Solicitudes',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 11l3 3L22 4" />
          <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
        </svg>
      )
    });
  }

  
  if (privilegiosCodigos.includes('crear_brigadas')) {
    menu.push({ 
      path: '/brigadas', 
      label: 'Brigadas',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
    });
  }

  
  if (privilegiosCodigos.includes('invitar_brigadistas')) {
    menu.push({ 
      path: '/brigadistas', 
      label: 'Brigadistas',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      )
    });
  }

  return menu;
}
    
    return [];
  };

const getRoleName = (codigo) => {
  const roles = {
    'super_admin': 'Super Administrador',
    'coord_georef': 'Coord. Georreferenciación',
    'coord_brigadas': 'Coord. Brigadas',
    'brigadista': 'Brigadista'
  };
  return roles[codigo || activeRole] || 'Usuario';
};

  const menuItems = getMenuItems();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="dashboard-layout">
      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-logo">
          <div className="logo-icon-wrapper">
            <span className="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" />
                <path d="M12 22V12" />
                <path d="M22 7L12 12L2 7" />
                <path d="M2 17L12 12L22 17" />
              </svg>
            </span>
          </div>
          {sidebarOpen && (
            <div className="logo-text-wrapper">
              <h2 className="logo-text">IFN</h2>
              <p className="logo-subtitle">{getRoleName()}</p>
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
              {sidebarOpen && <span className="menu-text">{item.label}</span>}
              {isActive(item.path) && <span className="active-indicator"></span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="sidebar-toggle"
            title={sidebarOpen ? 'Contraer' : 'Expandir'}
          >
            {sidebarOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2"/>
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2"/>
              </svg>
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">
              {menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
            </h1>
          </div>
          
          <div className="topbar-right">
            <button 
              className="theme-toggle"
              onClick={toggleTheme}
              title={darkMode ? 'Modo Claro' : 'Modo Oscuro'}
            >
              {darkMode ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                  <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" stroke="currentColor" strokeWidth="2"/>
                </svg>
              )}
            </button>
            {userRoles.length > 1 && (
  <div style={{ position: 'relative' }}>
    <button 
      onClick={() => setShowRoleMenu(!showRoleMenu)}
      className="theme-toggle"
      title="Cambiar rol"
      style={{ 
        minWidth: '200px', 
        justifyContent: 'space-between',
        padding: '0.5rem 1rem'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
        <span style={{ fontSize: '0.875rem' }}>{getRoleName(activeRole)}</span>
      </div>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>

    {showRoleMenu && (
      <>
        {/* Overlay para cerrar el menú al hacer clic fuera */}
        <div 
          onClick={() => setShowRoleMenu(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 999
          }}
        />
        
        <div 
          style={{
            position: 'absolute',
            top: 'calc(100% + 0.5rem)',
            right: 0,
            background: 'var(--bg-primary, white)',
            border: '1px solid var(--border-color, #e5e5e5)',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
            minWidth: '240px',
            zIndex: 1000,
            overflow: 'hidden'
          }}
        >
          {userRoles.map(rol => {
            const isActive = rol.codigo === activeRole;
            return (
              <button
                key={rol.codigo}
                onClick={() => cambiarRol(rol.codigo)}
                disabled={isActive}
                style={{
                  width: '100%',
                  padding: '0.875rem 1rem',
                  textAlign: 'left',
                  border: 'none',
                  background: isActive ? 'var(--primary-color, #3b82f6)' : 'transparent',
                  color: isActive ? 'white' : 'var(--text-primary, #1f2937)',
                  cursor: isActive ? 'default' : 'pointer',
                  transition: 'all 0.2s',
                  fontSize: '0.9rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontWeight: isActive ? '600' : '400'
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'var(--bg-secondary, #f3f4f6)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = 'transparent';
                  }
                }}
              >
                {isActive && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                )}
                {!isActive && <span style={{ width: '18px' }} />}
                {getRoleName(rol.codigo)}
              </button>
            );
          })}
        </div>
      </>
    )}
  </div>
)}

<div className="topbar-user"></div>

            <div className="topbar-user">
              <div className="user-avatar">
                {userData.nombre_completo?.charAt(0) || 'U'}
              </div>
              <span className="user-name">{userData.nombre_completo || 'Usuario'}</span>
            </div>

            <button
              onClick={handleLogout}
              className="logout-button"
              title="Cerrar Sesión"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2"/>
                <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2"/>
                <path d="M21 12H9" stroke="currentColor" strokeWidth="2"/>
              </svg>
              <span>Salir</span>
            </button>
          </div>
        </header>

        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}