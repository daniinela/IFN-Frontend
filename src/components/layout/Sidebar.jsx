// src/components/layout/Sidebar.jsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  
  const activeRole = localStorage.getItem('active-role') || '';

  const getMenuItems = () => {
    const menus = {
      'COORD_IFN': [
        { path: '/coord-ifn/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/coord-ifn/gestion-conglomerados', label: 'Gestión Conglomerados', icon: '🗺️' },
        { path: '/coord-ifn/asignacion-misiones', label: 'Asignar Misiones', icon: '📋' },
        { path: '/coord-ifn/monitoreo-global', label: 'Monitoreo Global', icon: '🌍' }
      ],
      'GESTOR_RECURSOS': [
        { path: '/gestor-recursos/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/gestor-recursos/gestion-personal', label: 'Gestión Personal', icon: '👥' }
      ],
      'JEFE_BRIGADA': [
        { path: '/jefe-brigada/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/jefe-brigada/mis-misiones', label: 'Mis Misiones', icon: '🎯' },
        { path: '/jefe-brigada/rutas-acceso', label: 'Rutas Acceso', icon: '🛣️' },
        { path: '/jefe-brigada/establecimiento-subparcelas', label: 'Subparcelas', icon: '📐' },
        { path: '/jefe-brigada/control-equipos', label: 'Control Equipos', icon: '🔧' },
        { path: '/jefe-brigada/medicion-individuos', label: 'Medición Individuos', icon: '🌳' }
      ],
      'BOTANICO': [
        { path: '/jefe-brigada/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/jefe-brigada/medicion-individuos', label: 'Medición Individuos', icon: '🌳' }
      ],
      'TECNICO': [
        { path: '/jefe-brigada/dashboard', label: 'Dashboard', icon: '📊' },
        { path: '/jefe-brigada/establecimiento-subparcelas', label: 'Subparcelas', icon: '📐' }
      ]
    };

    return menus[activeRole] || [];
  };

  const menuItems = getMenuItems();
  const isActive = (path) => location.pathname === path;

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
      <div className="sidebar-logo">
        <div className="logo-icon">🌲</div>
        {sidebarOpen && (
          <div className="logo-text">
            <h2>IFN</h2>
            <p>{activeRole}</p>
          </div>
        )}
      </div>

      <nav className="sidebar-menu">
        {menuItems.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`menu-item ${isActive(item.path) ? 'active' : ''}`}
          >
            <span className="menu-icon">{item.icon}</span>
            {sidebarOpen && <span className="menu-text">{item.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? '◀' : '▶'}
        </button>
      </div>
    </aside>
  );
}