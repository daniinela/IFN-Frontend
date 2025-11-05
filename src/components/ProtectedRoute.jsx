// frontend/src/components/ProtectedRoute.jsx
import { useEffect, useState, useCallback } from 'react';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function ProtectedRoute({ allowedRoles = [], children }) {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const location = useLocation();

  const checkAuth = useCallback(async () => {
    try {
      setLoading(true);

      // 1️⃣ Verificar sesión de Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.warn('⚠️ No hay sesión activa');
        setAuthorized(false);
        setLoading(false);
        return;
      }

      // 2️⃣ Obtener roles desde localStorage
      const userRolesStr = localStorage.getItem('user-roles');
      const userDataStr = localStorage.getItem('user-data');
      
      if (!userRolesStr || !userDataStr) {
        console.warn('⚠️ No hay datos de usuario en localStorage');
        await supabase.auth.signOut();
        localStorage.clear();
        setAuthorized(false);
        setLoading(false);
        return;
      }

      const userRoles = JSON.parse(userRolesStr);
      const userData = JSON.parse(userDataStr);

      console.log('👤 Usuario:', userData.email);
      console.log('🎭 Roles del usuario:', userRoles.map(r => r.codigo));
      console.log('🔐 Roles permitidos:', allowedRoles);

      if (!userRoles || userRoles.length === 0) {
        console.warn('⚠️ Usuario sin roles asignados');
        setAuthorized(false);
        setLoading(false);
        return;
      }

      // 3️⃣ Si no hay roles permitidos especificados, permitir acceso
      if (!allowedRoles || allowedRoles.length === 0) {
        console.log('✅ Ruta sin restricción de roles');
        setAuthorized(true);
        setLoading(false);
        return;
      }

      // 4️⃣ Verificar si tiene algún rol permitido
      const rolesUsuario = userRoles.map(r => r.codigo);
      const tieneAcceso = allowedRoles.some(rolPermitido => 
        rolesUsuario.includes(rolPermitido)
      );

      if (!tieneAcceso) {
        console.warn('❌ No autorizado para esta ruta');
        console.log('Roles del usuario:', rolesUsuario);
        console.log('Roles requeridos:', allowedRoles);
        setAuthorized(false);
        setLoading(false);
        return;
      }

      console.log('✅ Usuario autorizado');
      setAuthorized(true);

    } catch (err) {
      console.error('❌ Error verificando autenticación:', err);
      setAuthorized(false);
    } finally {
      setLoading(false);
    }
  }, [allowedRoles]);

  useEffect(() => {
    checkAuth();
  }, [checkAuth, location.pathname]);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        flexDirection: 'column',
        gap: '1rem'
      }}>
        <div className="spinner"></div>
        <p>Verificando acceso...</p>
      </div>
    );
  }

  if (!authorized) {
    console.log('❌ No autorizado, redirigiendo a /login');
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // ✅ Si tiene children, renderizarlos; si no, usar Outlet
  return children ? children : <Outlet />;
}

export default ProtectedRoute;