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
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn('⚠️ No hay sesión activa');
          setAuthorized(false);
          setLoading(false);
          return;
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.warn('⚠️ Usuario no encontrado');
          setAuthorized(false);
          setLoading(false);
          return;
        }

        const { data: userData, error } = await supabase
          .from('usuarios')
          .select('rol')
          .eq('email', user.email)
          .single();

        if (error || !userData) {
          console.warn('⚠️ No se encontró el rol');
          setAuthorized(false);
          setLoading(false);
          return;
        }

        const rol = userData.rol?.toLowerCase();
        console.log('👤 Rol detectado:', rol);

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

  if (!authorized) return <Navigate to="/login" replace />;
  if (redirectPath && location.pathname === '/login')
    return <Navigate to={redirectPath} replace />;

  return children ? children : <Outlet />;
}

export default ProtectedRoute;
