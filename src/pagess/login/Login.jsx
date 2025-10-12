import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient'; 
import axios from '../../api/axiosConfig';
import './Login.css';

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

        // Verificar que el usuario aún existe
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          console.warn('⚠️ Sesión inválida, limpiando...');
          await supabase.auth.signOut();
          localStorage.clear();
          setCheckingSession(false);
          return;
        }

        // Obtener rol del backend
        try {
          const response = await axios.post('http://localhost:3001/api/usuarios/login', {
            email: user.email
          });

          const userData = response.data.user;
          localStorage.setItem('user-data', JSON.stringify(userData));

          // Redirigir según rol
          if (userData.rol === 'admin') {
            navigate('/admin/dashboard');
          } else if (userData.rol === 'brigadista') {
            navigate('/brigadista/dashboard');
          } else {
            setCheckingSession(false);
          }
        } catch (err) {
          console.error('Error obteniendo datos de usuario:', err);
          // Si falla el backend pero la sesión es válida, cerrar sesión
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
    // 1. Login con Supabase Auth
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

    // ✅ GUARDAR EL TOKEN (ESTO FALTABA)
    const token = data.session.access_token;
    localStorage.setItem('token', token);
    console.log('✅ Token guardado en localStorage');

    // 2. Obtener datos del usuario desde tu backend
    const response = await axios.post('http://localhost:3001/api/usuarios/login', {
      email: formData.email
    });

    const userData = response.data.user;
    console.log('✅ Datos de usuario:', userData);

    // 3. Guardar datos del usuario
    localStorage.setItem('user-data', JSON.stringify(userData));

    // 4. Redirigir según rol
    if (userData.rol === 'admin') {
      console.log('🔐 Redirigiendo a /admin/dashboard');
      navigate('/admin/dashboard');
    } else if (userData.rol === 'brigadista') {
      console.log('🔐 Redirigiendo a /brigadista/dashboard');
      navigate('/brigadista/dashboard');
    } else {
      setError('Rol no autorizado: ' + userData.rol);
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
      <div className="login-container">
        <div className="checking-session">
          <div className="spinner"></div>
          <p>Verificando sesión...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="login-container">
      <div className="particles">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
      <div className="gradient-bg"></div>
      
      <div className="login-card">
        <div className="login-logo">
          <div className="logo-circle">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M12 2L4 7V17L12 22L20 17V7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12L4 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12V22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <path d="M12 12L20 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
        </div>

        <div className="login-header">
          <h1>Inventario Forestal Nacional</h1>
          <p>Acceso al sistema de gestión ambiental</p>
        </div>

        {error && (
          <div className="error-message">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="currentColor"/>
            </svg>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="email">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M4 4H20C21.1 4 22 4.9 22 6V18C22 19.1 21.1 20 20 20H4C2.9 20 2 19.1 2 18V6C2 4.9 2.9 4 4 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M22 6L12 13L2 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Email
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
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M19 11H5C3.89543 11 3 11.8954 3 13V20C3 21.1046 3.89543 22 5 22H19C20.1046 22 21 21.1046 21 20V13C21 11.8954 20.1046 11 19 11Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7 11V7C7 5.67392 7.52678 4.40215 8.46447 3.46447C9.40215 2.52678 10.6739 2 12 2C13.3261 2 14.5979 2.52678 15.5355 3.46447C16.4732 4.40215 17 5.67392 17 7V11" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Contraseña
            </label>
            <div className="password-input-wrapper">
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
                className="toggle-password" 
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

          <button 
            type="submit" 
            disabled={loading} 
            className={`login-button ${loading ? 'loading' : ''}`}
          >
            {loading ? (
              <>
                <span className="spinner"></span>
                Iniciando sesión...
              </>
            ) : (
              <>
                Iniciar Sesión
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </>
            )}
          </button>
        </form>

        <div className="login-footer">
          <a href="#forgot">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
              <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      </div>

      <div className="system-footer">
        <p>© 2025 Sistema de Gestión Forestal Nacional</p>
      </div>
    </div>
  );
}

export default Login;