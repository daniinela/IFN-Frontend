// frontend/src/api/axiosConfig.js
import axios from 'axios';
import { supabase } from '../supabaseClient';

// Crear instancia de axios
const axiosInstance = axios.create();

// INTERCEPTOR: Agregar token automáticamente a TODAS las peticiones
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      // Obtener sesión actual de Supabase
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.access_token) {
        // Agregar token al header Authorization
        config.headers.Authorization = `Bearer ${session.access_token}`;
        console.log('✅ Token agregado a la petición:', config.url);
      } else {
        console.warn('⚠️ No hay token disponible para:', config.url);
      }
    } catch (error) {
      console.error('❌ Error obteniendo token:', error);
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

//  INTERCEPTOR: Manejar errores de autenticación
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      console.error('❌ Token inválido o expirado, cerrando sesión...');
      
      // Cerrar sesión y redirigir a login
      await supabase.auth.signOut();
      localStorage.clear();
      window.location.href = '/login';
    } else if (error.response?.status === 403) {
      console.error('❌ Acceso prohibido:', error.response.data.error);
      alert('No tienes permisos para realizar esta acción');
    }
    
    return Promise.reject(error);
  }
);

export default axiosInstance;