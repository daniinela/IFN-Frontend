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
          console.warn('⚠️ Sesión inválida, limpiando...');
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
          localStorage.setItem('user-privilegios', JSON.stringify(privilegios));

          if (roles.length === 0) {
            setError('Usuario sin roles asignados');
            await supabase.auth.signOut();
            localStorage.clear();
            setCheckingSession(false);
            return;
          }

          const rolPrincipal = roles[0].codigo;

          if (['super_admin', 'coord_georef', 'coord_brigadas'].includes(rolPrincipal)) {
            navigate('/admin/dashboard');
          } else if (rolPrincipal === 'brigadista') {
            navigate('/brigadista/dashboard');
          } else {
            setError('Rol no reconocido');
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
        console.error('❌ Error de autenticación:', authError.message);
        if (authError.message.includes('Invalid login credentials')) {
          setError('Credenciales inválidas. Verifica tu email y contraseña.');
        } else if (authError.message.includes('Email not confirmed')) {
          setError('Por favor confirma tu email antes de iniciar sesión.');
        } else {
          setError('Error al iniciar sesión: ' + authError.message);
        }
        return;
      }

      console.log('✅ Login exitoso con Supabase');

      const token = data.session.access_token;
      localStorage.setItem('token', token);

      const response = await axios.post(`${API_USUARIOS}/api/usuarios/login`, {
        email: formData.email
      });

      const { user: userData, roles, privilegios } = response.data;
      console.log('✅ Datos de usuario:', userData);
      console.log('✅ Roles:', roles);

      localStorage.setItem('user-data', JSON.stringify(userData));
      localStorage.setItem('user-roles', JSON.stringify(roles));
      localStorage.setItem('user-privilegios', JSON.stringify(privilegios));

      if (roles.length === 0) {
        setError('Usuario sin roles asignados. Contacta al administrador.');
        await supabase.auth.signOut();
        localStorage.clear();
        return;
      }

      const rolPrincipal = roles[0].codigo;

      if (['super_admin', 'coord_georef', 'coord_brigadas'].includes(rolPrincipal)) {
        navigate('/admin/dashboard');
      } else if (rolPrincipal === 'brigadista') {
        navigate('/brigadista/dashboard');
      } else {
        setError('Rol no autorizado: ' + rolPrincipal);
        await supabase.auth.signOut();
        localStorage.clear();
      }
    } catch (err) {
      console.error('❌ Error inesperado:', err);

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

  return (
    <section className="login-section">
      <div className="login-container-fluid">
        <div className="login-row">
          
          <div className="login-col-left">
            <div className="login-logo-container">
              <img src="img/ideam.png" alt="Logo IDEAM" className="login-logo" />
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
                      'Login'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="login-col-right">
            <img 
              src="img/pexels-oigoralvez-34042840.jpg" 
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