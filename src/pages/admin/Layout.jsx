// AdminLayout.jsx
import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import './AdminLayout.css';

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // ✅ Obtener datos del usuario y roles
  const userData = JSON.parse(localStorage.getItem('user-data') || '{}');
  const userRoles = JSON.parse(localStorage.getItem('user-roles') || '[]');
  const rolPrincipal = userRoles[0]?.codigo || '';

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

  // ✅ MENÚ DINÁMICO SEGÚN ROL
  const getMenuItems = () => {
    const allMenuItems = [
      { 
        path: '/admin/dashboard', 
        label: 'Dashboard',
        roles: ['super_admin', 'coord_georef', 'coord_brigadas'], // Todos lo ven
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
        path: '/admin/conglomerados', 
        label: 'Conglomerados',
        roles: ['super_admin', 'coord_georef'], // Solo estos roles
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
        )
      },
      { 
        path: '/admin/brigadas', 
        label: 'Brigadas',
        roles: ['super_admin', 'coord_brigadas'], // Solo estos roles
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        )
      },
      { 
        path: '/admin/brigadistas', 
        label: 'Brigadistas',
        roles: ['super_admin', 'coord_brigadas'], // Solo estos roles
        icon: (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        )
      },
    ];

    // ✅ Filtrar menú según el rol del usuario
    return allMenuItems.filter(item => item.roles.includes(rolPrincipal));
  };

  const menuItems = getMenuItems();
  const isActive = (path) => location.pathname === path;

  return (
    <div className="admin-layout">
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
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
              <h2 className="logo-text">IFN Admin</h2>
              <p className="logo-subtitle">
                {/* ✅ Mostrar rol del usuario */}
                {rolPrincipal === 'super_admin' && 'Super Admin'}
                {rolPrincipal === 'coord_georef' && 'Georreferenciación'}
                {rolPrincipal === 'coord_brigadas' && 'Brigadas'}
              </p>
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

      <div className="admin-main">
        <header className="admin-topbar">
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

            <div className="topbar-user">
              <div className="user-avatar">
                {userData.nombre_completo?.charAt(0) || 'A'}
              </div>
              <span className="user-name">{userData.nombre_completo || 'Admin'}</span>
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

        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;