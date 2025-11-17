// src/pages/auth/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import axios from 'axios';
import './Login.css';

const API_USUARIOS = import.meta.env.VITE_API_USUARIOS || 'http://localhost:3001';

function Login() {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  
  const [userRoles, setUserRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setCheckingSession(false);
          return;
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          await supabase.auth.signOut();
          localStorage.clear();
          setCheckingSession(false);
          return;
        }

        try {
          const response = await axios.get(
            `${API_USUARIOS}/api/cuentas-rol/usuario/${user.id}`,
            { headers: { 'Authorization': `Bearer ${session.access_token}` } }
          );

          const cuentasRol = response.data;
          
          if (!cuentasRol || cuentasRol.length === 0) {
            setError('Usuario sin roles asignados');
            await supabase.auth.signOut();
            localStorage.clear();
            setCheckingSession(false);
            return;
          }

          const rolesActivos = cuentasRol
            .filter(cr => cr.activo && cr.roles_sistema)
            .map(cr => ({
              id: cr.id,
              codigo: cr.roles_sistema.codigo,
              nombre: cr.roles_sistema.nombre,
              nivel: cr.roles_sistema.nivel
            }));

          if (rolesActivos.length === 0) {
            setError('No tienes roles activos');
            await supabase.auth.signOut();
            localStorage.clear();
            setCheckingSession(false);
            return;
          }

          const userResponse = await axios.get(
            `${API_USUARIOS}/api/usuarios/${user.id}`,
            { headers: { 'Authorization': `Bearer ${session.access_token}` } }
          );

          localStorage.setItem('token', session.access_token);
          localStorage.setItem('user-data', JSON.stringify(userResponse.data));
          localStorage.setItem('user-roles', JSON.stringify(rolesActivos));

          setUserRoles(rolesActivos);
          setShowRoleSelector(true);
          setCheckingSession(false);
        } catch (err) {
          console.error('Error obteniendo datos:', err);
          await supabase.auth.signOut();
          localStorage.clear();
          setCheckingSession(false);
        }
      } catch (err) {
        console.error('Error verificando sesión:', err);
        setCheckingSession(false);
      }
    };

    checkSession();
  }, []);

  const redirigirPorRol = (codigoRol) => {
    const rutas = {
      'COORD_IFN': '/coord-ifn/dashboard',
      'GESTOR_RECURSOS': '/gestor-recursos/dashboard',
      'JEFE_BRIGADA': '/jefe-brigada/dashboard',
      'BOTANICO': '/jefe-brigada/dashboard',
      'TECNICO': '/jefe-brigada/dashboard',
      'COINVESTIGADOR': '/jefe-brigada/dashboard'
    };

    const ruta = rutas[codigoRol];
    if (ruta) {
      navigate(ruta);
    } else {
      setError('Rol no reconocido');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });

      if (authError) {
        if (authError.message.includes('Invalid login credentials')) {
          setError('Credenciales inválidas');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Por favor confirma tu email antes de iniciar sesión');
        } else {
          setError('Error al iniciar sesión: ' + authError.message);
        }
        return;
      }

      const token = data.session.access_token;
      localStorage.setItem('token', token);

      const rolesResponse = await axios.get(
        `${API_USUARIOS}/api/cuentas-rol/usuario/${data.user.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      const cuentasRol = rolesResponse.data;

      if (!cuentasRol || cuentasRol.length === 0) {
        setError('Usuario sin roles asignados. Contacta al administrador.');
        await supabase.auth.signOut();
        localStorage.clear();
        return;
      }

      const rolesActivos = cuentasRol
        .filter(cr => cr.activo && cr.roles_sistema)
        .map(cr => ({
          id: cr.id,
          codigo: cr.roles_sistema.codigo,
          nombre: cr.roles_sistema.nombre,
          nivel: cr.roles_sistema.nivel,
          region_id: cr.region_id,
          departamento_id: cr.departamento_id,
          municipio_id: cr.municipio_id
        }));

      if (rolesActivos.length === 0) {
        setError('No tienes roles activos');
        await supabase.auth.signOut();
        localStorage.clear();
        return;
      }

      const userResponse = await axios.get(
        `${API_USUARIOS}/api/usuarios/${data.user.id}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );

      localStorage.setItem('user-data', JSON.stringify(userResponse.data));
      localStorage.setItem('user-roles', JSON.stringify(rolesActivos));

      setUserRoles(rolesActivos);
      setShowRoleSelector(true);

    } catch (err) {
      console.error('Error:', err);
      setError(err.response?.data?.error || err.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelection = () => {
    if (!selectedRole) {
      setError('Por favor selecciona un rol');
      return;
    }

    localStorage.setItem('active-role', selectedRole);
    redirigirPorRol(selectedRole);
  };

  if (checkingSession) {
    return (
      <div className="login-loading-container">
        <div className="checking-session">
          <div className="spinner"></div>
          <p>Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (showRoleSelector) {
    return (
      <section className="login-section">
        <div className="login-container">
          <div className="role-selector-card">
            <div className="role-selector-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            
            <h3>Selecciona tu Rol</h3>
            <p>Tu cuenta tiene múltiples roles asignados</p>

            {error && (
              <div className="error-alert">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              required
              className="role-select"
            >
              <option value="">-- Selecciona un rol --</option>
              {userRoles.map(rol => (
                <option key={rol.codigo} value={rol.codigo}>
                  {rol.nombre} ({rol.nivel})
                </option>
              ))}
            </select>

            <button onClick={handleRoleSelection} className="btn-primary">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
              Continuar
            </button>

            <button 
              onClick={() => {
                setShowRoleSelector(false);
                setUserRoles([]);
                setSelectedRole('');
                supabase.auth.signOut();
                localStorage.clear();
              }}
              className="btn-secondary"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              Volver
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="login-section">
      <div className="login-container">
        <form onSubmit={handleSubmit} className="login-form">
          <div className="login-header">
            <div className="login-icon">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" />
                <path d="M12 22V12" />
                <path d="M22 7L12 12L2 7" />
                <path d="M2 17L12 12L22 17" />
              </svg>
            </div>
            <h3>Iniciar Sesión</h3>
            <p>Inventario Forestal Nacional</p>
          </div>

          {error && (
            <div className="error-alert">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
              Correo electrónico
            </label>
            <input 
              type="email" 
              id="email" 
              placeholder="tu.nombre@ifn.gov.co"
              value={formData.email} 
              onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
              required 
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                <path d="M7 11V7a5 5 0 0 1 10 0v4" />
              </svg>
              Contraseña
            </label>
            <div className="password-wrapper">
              <input 
                type={showPassword ? 'text' : 'password'} 
                id="password" 
                placeholder="••••••••"
                value={formData.password} 
                onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                required 
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="password-toggle"
              >
                {showPassword ? (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                ) : (
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-submit">
            {loading ? (
              <>
                <div className="btn-spinner"></div>
                Iniciando sesión...
              </>
            ) : (
              <>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                  <polyline points="10 17 15 12 10 7" />
                  <line x1="15" y1="12" x2="3" y2="12" />
                </svg>
                Iniciar Sesión
              </>
            )}
          </button>
        </form>
      </div>
    </section>
  );
}

export default Login;