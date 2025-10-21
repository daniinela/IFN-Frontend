import { useEffect, useState } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function ProtectedRoute({ children }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [redirectPath, setRedirectPath] = useState(null);
  const location = useLocation();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // 1️⃣ Verificar sesión
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn('⚠️ No hay sesión activa');
          setAuthorized(false);
          setLoading(false);
          return;
        }

        // 2️⃣ Obtener usuario (incluye user_metadata)
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error || !user) {
          console.warn('⚠️ Usuario no encontrado');
          setAuthorized(false);
          setLoading(false);
          return;
        }

        // 3️⃣ ✅ OBTENER ROL DEL TOKEN (no de la BD)
        const rol = user.user_metadata?.rol?.toLowerCase();
        
        if (!rol) {
          console.error('⚠️ No se encontró el rol en user_metadata');
          console.log('User metadata completo:', user.user_metadata);
          setAuthorized(false);
          setLoading(false);
          return;
        }

        console.log('👤 Rol detectado:', rol);
        console.log('👤 Usuario:', user.email);

        // 4️⃣ Determinar ruta según rol
        if (rol === 'admin') {
          setAuthorized(true);
          setRedirectPath('/admin/dashboard');
        } else if (rol === 'brigadista') {
          setAuthorized(true);
          setRedirectPath('/brigadista/dashboard');
        } else {
          console.warn('⚠️ Rol no autorizado:', rol);
          setAuthorized(false);
        }

      } catch (err) {
        console.error('❌ Error verificando autenticación:', err);
        setAuthorized(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [location]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner"></div>
        <p>Verificando acceso...</p>
      </div>
    );
  }

  if (!authorized) {
    console.log('❌ No autorizado, redirigiendo a /login');
    return <Navigate to="/login" replace />;
  }

  if (redirectPath && location.pathname === '/login') {
    console.log('✅ Redirigiendo a:', redirectPath);
    return <Navigate to={redirectPath} replace />;
  }

  return children ? children : <Outlet />;
}

export default ProtectedRoute;