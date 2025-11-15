// src/pages/auth/Login.jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import axios from 'axios';

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
      'BOTANICO': '/jefe-brigada/dashboard', // También accede como brigadista
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

      // Obtener cuentas_rol del usuario
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

      // Obtener datos completos del usuario
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
            <h3>Selecciona tu Rol</h3>
            <p>Tu cuenta tiene múltiples roles asignados</p>

            {error && (
              <div className="error-alert">
                <span>{error}</span>
              </div>
            )}

            <select 
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              required
            >
              <option value="">-- Selecciona un rol --</option>
              {userRoles.map(rol => (
                <option key={rol.codigo} value={rol.codigo}>
                  {rol.nombre} ({rol.nivel})
                </option>
              ))}
            </select>

            <button onClick={handleRoleSelection}>
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
            >
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
        <form onSubmit={handleSubmit}>
          <h3>Iniciar Sesión</h3>

          {error && (
            <div className="error-alert">
              <span>{error}</span>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
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
            <label htmlFor="password">Contraseña</label>
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
              >
                {showPassword ? '👁️' : '👁️‍🗨️'}
              </button>
            </div>
          </div>

          <button type="submit" disabled={loading}>
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </section>
  );
}

export default Login;