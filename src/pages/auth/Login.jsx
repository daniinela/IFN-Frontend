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
  
  // NUEVO: Estado para roles
  const [userRoles, setUserRoles] = useState([]);
  const [selectedRole, setSelectedRole] = useState('');
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  useEffect(() => {
    const redirigirPorRolInterno = (rol) => {
      switch(rol) {
        case 'super_admin':
          navigate('/super-admin/dashboard');
          break;
        case 'coord_georef':
          navigate('/coord-georef/dashboard');
          break;
        case 'coord_brigadas':
          navigate('/coord-brigadas/dashboard');
          break;
        case 'brigadista':
          navigate('/brigadista/dashboard');
          break;
        default:
          setError('Rol no reconocido');
      }
    };

    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          setCheckingSession(false);
          return;
        }

        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.warn('Sesión inválida, limpiando...');
          await supabase.auth.signOut();
          localStorage.clear();
          setCheckingSession(false);
          return;
        }

        try {
          const response = await axios.post(`${API_USUARIOS}/api/usuarios/login`, {
            email: user.email
          });

          const { user: userData, roles, privilegios } = response.data;

          localStorage.setItem('user-data', JSON.stringify(userData));
          localStorage.setItem('user-roles', JSON.stringify(roles));
          localStorage.setItem('user-privileges', JSON.stringify(privilegios));

          if (roles.length === 0) {
            setError('Usuario sin roles asignados');
            await supabase.auth.signOut();
            localStorage.clear();
            setCheckingSession(false);
            return;
          }

          // Si tiene un solo rol, redirigir directamente
          if (roles.length === 1) {
            const rolPrincipal = roles[0].codigo;
            localStorage.setItem('active-role', rolPrincipal);
            redirigirPorRolInterno(rolPrincipal);
          } else {
            // Si tiene múltiples roles, mostrar selector
            setUserRoles(roles);
            setShowRoleSelector(true);
            setCheckingSession(false);
          }
        } catch (err) {
          console.error('Error obteniendo datos de usuario:', err);
          await supabase.auth.signOut();
          localStorage.clear();
          setCheckingSession(false);
        }
      } catch (err) {
        console.error('Error al verificar sesión:', err);
        setCheckingSession(false);
      }
    };

    checkSession();
  }, [navigate]);

  const redirigirPorRol = (rol) => {
    switch(rol) {
      case 'super_admin':
        navigate('/super-admin/dashboard');
        break;
      case 'coord_georef':
        navigate('/coord-georef/dashboard');
        break;
      case 'coord_brigadas':
        navigate('/coord-brigadas/dashboard');
        break;
      case 'brigadista':
        navigate('/brigadista/dashboard');
        break;
      default:
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
        console.error('Error de autenticación:', authError.message);
        if (authError.message.includes('Invalid login credentials')) {
          setError('Credenciales inválidas. Verifica tu email y contraseña.');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Por favor confirma tu email antes de iniciar sesión.');
        } else {
          setError('Error al iniciar sesión: ' + authError.message);
        }
        return;
      }

      console.log('Login exitoso con Supabase');

      const token = data.session.access_token;
      localStorage.setItem('token', token);

      const response = await axios.post(`${API_USUARIOS}/api/usuarios/login`, {
        email: formData.email
      });

      const { user: userData, roles, privilegios } = response.data;
      console.log('Datos de usuario:', userData);
      console.log('Roles:', roles);

      localStorage.setItem('user-data', JSON.stringify(userData));
      localStorage.setItem('user-roles', JSON.stringify(roles));
      localStorage.setItem('user-privileges', JSON.stringify(privilegios));

      if (roles.length === 0) {
        setError('Usuario sin roles asignados. Contacta al administrador.');
        await supabase.auth.signOut();
        localStorage.clear();
        return;
      }

      // NUEVO: Si tiene múltiples roles, mostrar selector
      if (roles.length > 1) {
        setUserRoles(roles);
        setShowRoleSelector(true);
      } else {
        // Si tiene un solo rol, redirigir directamente
        const rolPrincipal = roles[0].codigo;
        localStorage.setItem('active-role', rolPrincipal);
        redirigirPorRol(rolPrincipal);
      }
    } catch (err) {
      console.error('Error inesperado:', err);

      if (err.response) {
        setError(err.response.data.error || 'Error en el servidor');
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Error desconocido al iniciar sesión');
      }
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

  const getRoleName = (codigo) => {
    const nombres = {
      'super_admin': 'Super Administrador',
      'coord_georef': 'Coordinador de Georreferenciación',
      'coord_brigadas': 'Coordinador de Brigadas',
      'brigadista': 'Brigadista'
    };
    return nombres[codigo] || codigo;
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

  // NUEVO: Pantalla de selección de rol
  if (showRoleSelector) {
    return (
      <section className="login-section">
        <div className="login-container-fluid">
          <div className="login-row">
            <div className="login-col-left">
              <div className="login-logo-container">
                <img src="/img/ideam.png" alt="Logo IDEAM" className="login-logo" />
              </div>

              <div className="login-form-wrapper">
                <div className="role-selector-container">
                  <h3 className="login-title">Selecciona tu Rol</h3>
                  <p className="role-selector-subtitle">
                    Tu cuenta tiene múltiples roles asignados. Selecciona el rol con el que deseas ingresar.
                  </p>

                  {error && (
                    <div className="login-error-message">
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                        <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="currentColor"/>
                      </svg>
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="login-form-group">
                    <label htmlFor="role" className="login-label">Rol de acceso</label>
                    <select 
                      id="role"
                      className="login-select"
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                      required
                    >
                      <option value="">-- Selecciona un rol --</option>
                      {userRoles.map(rol => (
                        <option key={rol.codigo} value={rol.codigo}>
                          {getRoleName(rol.codigo)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="login-button-container">
                    <button 
                      type="button"
                      onClick={handleRoleSelection}
                      className="login-button"
                    >
                      Continuar
                    </button>
                  </div>

                  <div className="role-selector-footer">
                    <button 
                      type="button"
                      onClick={() => {
                        setShowRoleSelector(false);
                        setUserRoles([]);
                        setSelectedRole('');
                        supabase.auth.signOut();
                        localStorage.clear();
                      }}
                      className="login-back-btn"
                    >
                      Volver al inicio de sesión
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="login-col-right">
              <img 
                src="/img/pexels-oigoralvez-34042840.jpg" 
                alt="Login image" 
                className="login-image"
              />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // Pantalla de login normal
  return (
    <section className="login-section">
      <div className="login-container-fluid">
        <div className="login-row">
          
          <div className="login-col-left">
            <div className="login-logo-container">
              <img src="/img/ideam.png" alt="Logo IDEAM" className="login-logo" />
            </div>

            <div className="login-form-wrapper">
              <form onSubmit={handleSubmit} className="login-form">
                <h3 className="login-title">Iniciar Sesión</h3>

                {error && (
                  <div className="login-error-message">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="currentColor"/>
                    </svg>
                    <span>{error}</span>
                  </div>
                )}

                <div className="login-form-group">
                  <label htmlFor="email" className="login-label">Correo electrónico</label>
                  <input 
                    type="email" 
                    id="email" 
                    className="login-input" 
                    placeholder="tu.nombre@ifn.gov.co"
                    value={formData.email} 
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                    required 
                  />
                </div>

                <div className="login-form-group">
                  <label htmlFor="password" className="login-label">Contraseña</label>
                  <div className="login-password-wrapper">
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      id="password" 
                      className="login-input" 
                      placeholder="••••••••"
                      value={formData.password} 
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                      required 
                    />
                    <button 
                      type="button" 
                      className="login-toggle-password" 
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" stroke="currentColor" strokeWidth="2"/>
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                      ) : (
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                          <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <div className="login-button-container">
                  <button 
                    type="submit" 
                    disabled={loading} 
                    className={`login-button ${loading ? 'loading' : ''}`}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-small"></span>
                        Iniciando sesión...
                      </>
                    ) : (
                      'Iniciar Sesión'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="login-col-right">
            <img 
              src="/img/pexels-oigoralvez-34042840.jpg" 
              alt="Login image" 
              className="login-image"
            />
          </div>

        </div>
      </div>
    </section>
  );
}

export default Login;