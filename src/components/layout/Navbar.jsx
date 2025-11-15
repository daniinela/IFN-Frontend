// src/components/layout/Navbar.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';

export default function Navbar() {
  const navigate = useNavigate();
  const [darkMode, setDarkMode] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  
  const userData = JSON.parse(localStorage.getItem('user-data') || '{}');
  const activeRole = localStorage.getItem('active-role') || '';
  const userRoles = JSON.parse(localStorage.getItem('user-roles') || '[]');

  const toggleTheme = () => {
    setDarkMode(!darkMode);
    document.documentElement.setAttribute('data-theme', darkMode ? 'light' : 'dark');
  };

  const cambiarRol = (nuevoRol) => {
    localStorage.setItem('active-role', nuevoRol);
    setShowRoleMenu(false);
    
    const rutas = {
      'COORD_IFN': '/coord-ifn/dashboard',
      'GESTOR_RECURSOS': '/gestor-recursos/dashboard',
      'JEFE_BRIGADA': '/jefe-brigada/dashboard',
      'BOTANICO': '/jefe-brigada/dashboard',
      'TECNICO': '/jefe-brigada/dashboard',
      'COINVESTIGADOR': '/jefe-brigada/dashboard'
    };
    
    navigate(rutas[nuevoRol] || '/');
    window.location.reload(); // Forzar recarga para actualizar sidebar
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.clear();
      navigate('/login');
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <h1>{userData.nombre_completo || 'Usuario'}</h1>
      </div>
      
      <div className="topbar-right">
        <button onClick={toggleTheme} title="Cambiar tema">
          {darkMode ? '☀️' : '🌙'}
        </button>

        {userRoles.length > 1 && (
          <div className="role-selector">
            <button onClick={() => setShowRoleMenu(!showRoleMenu)}>
              {activeRole} ▼
            </button>
            
            {showRoleMenu && (
              <div className="role-menu">
                {userRoles.map(rol => (
                  <button
                    key={rol.codigo}
                    onClick={() => cambiarRol(rol.codigo)}
                    disabled={rol.codigo === activeRole}
                  >
                    {rol.nombre}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button onClick={handleLogout} title="Cerrar sesión">
          Salir 🚪
        </button>
      </div>
    </header>
  );
}