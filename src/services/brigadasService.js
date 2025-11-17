// src/services/brigadasService.js
import axios from 'axios';

const BRIGADAS_URL = import.meta.env.VITE_API_BRIGADAS || 'http://localhost:3003';

// Función para obtener el token de forma más robusta
const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.warn('⚠️ No hay token en localStorage');
    return { headers: {} };
  }
  
  console.log('🔐 Token encontrado:', token.substring(0, 20) + '...');
  
  return {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

// Interceptor para logging de errores
axios.interceptors.response.use(
  response => response,
  error => {
    console.error('❌ Error en brigadasService:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      headers: error.config?.headers
    });
    return Promise.reject(error);
  }
);

export const brigadasService = {
  getAll: () => {
    console.log('📡 Llamando a getAll brigadas');
    return axios.get(`${BRIGADAS_URL}/api/brigadas`, getAuthHeader());
  },
  
  getById: (id) => {
    console.log('📡 Llamando a getById:', id);
    return axios.get(`${BRIGADAS_URL}/api/brigadas/${id}`, getAuthHeader());
  },
  
  getMisBrigadas: () => {
    console.log('📡 Llamando a getMisBrigadas');
    const config = getAuthHeader();
    console.log('📡 URL:', `${BRIGADAS_URL}/api/brigadas/mis-brigadas`);
    console.log('📡 Headers:', config.headers);
    return axios.get(`${BRIGADAS_URL}/api/brigadas/mis-brigadas`, config);
  },
  
  cambiarEstado: (id, estado) => {
    console.log('📡 Cambiando estado:', { id, estado });
    return axios.put(
      `${BRIGADAS_URL}/api/brigadas/${id}/estado`, 
      { estado }, 
      getAuthHeader()
    );
  },
  
  agregarMiembro: (brigada_id, usuario_id, rol_operativo) => {
    console.log('📡 Agregando miembro:', { brigada_id, usuario_id, rol_operativo });
    return axios.post(
      `${BRIGADAS_URL}/api/brigadas/${brigada_id}/miembros`, 
      { usuario_id, rol_operativo }, 
      getAuthHeader()
    );
  },
  
  registrarFechas: (id, fecha_inicio_campo, fecha_fin_campo) => {
    console.log('📡 Registrando fechas:', { id, fecha_inicio_campo, fecha_fin_campo });
    return axios.put(
      `${BRIGADAS_URL}/api/brigadas/${id}/fechas`, 
      { fecha_inicio_campo, fecha_fin_campo }, 
      getAuthHeader()
    );
  },
  
  crearRuta: (brigada_id, ruta) => {
    console.log('📡 Creando ruta:', { brigada_id, ruta });
    return axios.post(
      `${BRIGADAS_URL}/api/brigadas/${brigada_id}/rutas`, 
      ruta, 
      getAuthHeader()
    );
  },
  
  agregarPuntoReferencia: (ruta_id, punto) => {
    console.log('📡 Agregando punto referencia:', { ruta_id, punto });
    return axios.post(
      `${BRIGADAS_URL}/api/puntos-referencia`, 
      { ruta_id, ...punto }, 
      getAuthHeader()
    );
  }
};