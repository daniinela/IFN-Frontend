// frontend/src/pages/superadmin/AdminLayout.jsx
import { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
//import './AdminLayout.css';

function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  // Obtener datos del usuario logueado
  const userData = JSON.parse(localStorage.getItem('user-data') || '{}');
  const userRoles = JSON.parse(localStorage.getItem('user-roles') || '[]');
  const userPrivilegios = JSON.parse(localStorage.getItem('user-privilegios') || '[]');

  // Determinar si es super admin
  const esSuperAdmin = userRoles.some(r => r.codigo === 'super_admin');

  // Cargar preferencia de tema
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  }, []);

  // Toggle tema
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

  // Menú de navegación según privilegios
  const getMenuItems = () => {
    const baseItems = [
      { path: '/admin/dashboard', label: 'Dashboard', icon: '📊', privilegio: null }
    ];

    const adminItems = [
      { path: '/admin/conglomerados', label: 'Conglomerados', icon: '🗺️', privilegio: 'ver_conglomerados' },
      { path: '/admin/brigadas', label: 'Brigadas', icon: '👥', privilegio: 'ver_brigadas' },
      { path: '/admin/brigadistas', label: 'Brigadistas', icon: '👤', privilegio: 'ver_brigadistas' }
    ];

    // Menú exclusivo de Super Admin
    const superAdminItems = [
      { path: '/admin/usuarios', label: 'Usuarios', icon: '👨‍💼', privilegio: 'ver_usuarios' },
      { path: '/admin/roles', label: 'Roles y Permisos', icon: '🔐', privilegio: 'gestionar_roles' },
      { path: '/admin/regiones', label: 'Regiones', icon: '🌍', privilegio: null },
      { path: '/admin/config', label: 'Configuración', icon: '⚙️', privilegio: null }
    ];

    // Filtrar según privilegios
    const items = [...baseItems];

    adminItems.forEach(item => {
      if (!item.privilegio || userPrivilegios.includes(item.privilegio)) {
        items.push(item);
      }
    });

    if (esSuperAdmin) {
      superAdminItems.forEach(item => {
        if (!item.privilegio || userPrivilegios.includes(item.privilegio)) {
          items.push(item);
        }
      });
    }

    return items;
  };

  const menuItems = getMenuItems();
  const isActive = (path) => location.pathname === path;

  // ✅ NUEVO: Determinar el nombre del rol para mostrar
  const getRolName = () => {
    if (esSuperAdmin) return 'Super Administrador';
    const adminRegional = userRoles.find(r => r.codigo === 'admin_regional');
    if (adminRegional) return 'Administrador Regional';
    return 'Brigadista';
  };

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        {/* Logo */}
        <div className="sidebar-logo">
          <div className="logo-icon-wrapper">
            <span className="logo-icon">🌳</span>
          </div>
          {sidebarOpen && (
            <div className="logo-text-wrapper">
              <h2 className="logo-text">IFN Admin</h2>
              <p className="logo-subtitle">
                {getRolName()} {/* ✅ Usar la función */}
              </p>
            </div>
          )}
        </div>

        {/* Menu */}
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

        {/* Sidebar Footer */}
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
      <div className="admin-main">
        {/* Topbar */}
        <header className="admin-topbar">
          <div className="topbar-left">
            <h1 className="topbar-title">
              {menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
            </h1>
          </div>
          
          <div className="topbar-right">
            {/* Theme Toggle */}
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

            {/* User Info & Menu */}
            <div className="topbar-user-wrapper">
              <button 
                className="topbar-user"
                onClick={() => setShowUserMenu(!showUserMenu)}
              >
                <div className="user-avatar">
                  {userData.nombre_completo?.charAt(0) || 'A'}
                </div>
                <div className="user-info">
                  <span className="user-name">{userData.nombre_completo || 'Admin'}</span>
                  <span className="user-role">
                    {getRolName()} {/* ✅ Usar la función */}
                  </span>
                </div>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showUserMenu && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <p className="dropdown-name">{userData.nombre_completo}</p>
                    <p className="dropdown-email">{userData.email}</p>
                    <p className="dropdown-cedula">CC: {userData.cedula}</p>
                  </div>

                  <div className="dropdown-section">
                    <p className="dropdown-section-title">Roles Activos</p>
                    {userRoles.map(rol => (
                      <div key={rol.id} className="dropdown-role">
                        <span className="role-badge">{rol.nombre}</span>
                        {rol.departamento_id && (
                          <span className="role-detail">Departamento específico</span>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="dropdown-divider"></div>

                  <button className="dropdown-item" onClick={() => navigate('/admin/perfil')}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Mi Perfil
                  </button>

                  <button className="dropdown-item dropdown-item-danger" onClick={handleLogout}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke="currentColor" strokeWidth="2"/>
                      <path d="M16 17L21 12L16 7" stroke="currentColor" strokeWidth="2"/>
                      <path d="M21 12H9" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Cerrar Sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="admin-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;