// src/services/brigadasService.js
import axios from 'axios';

const BRIGADAS_URL = import.meta.env.VITE_API_BRIGADAS || 'http://localhost:3002';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    console.warn('⚠️ No hay token en localStorage');
    return { headers: {} };
  }
  
  return {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

export const brigadasService = {
  getAll: () => axios.get(`${BRIGADAS_URL}/api/brigadas`, getAuthHeader()),
  
  getById: (id) => axios.get(`${BRIGADAS_URL}/api/brigadas/${id}`, getAuthHeader()),
  
  getMisBrigadas: () => axios.get(`${BRIGADAS_URL}/api/brigadas/mis-brigadas`, getAuthHeader()),
  
  cambiarEstado: (id, estado) => {
    return axios.put(
      `${BRIGADAS_URL}/api/brigadas/${id}/estado`, 
      { estado }, 
      getAuthHeader()
    );
  },
  
  agregarMiembro: (brigada_id, usuario_id, rol_operativo) => {
    return axios.post(
      `${BRIGADAS_URL}/api/brigadas/${brigada_id}/miembros`, 
      { usuario_id, rol_operativo }, 
      getAuthHeader()
    );
  },

  eliminarMiembro: (miembro_id) => {
    return axios.delete(
      `${BRIGADAS_URL}/api/brigadas/miembros/${miembro_id}`,
      getAuthHeader()
    );
  },

  enviarInvitaciones: (brigada_id) => {
    return axios.post(
      `${BRIGADAS_URL}/api/brigadas/${brigada_id}/enviar-invitaciones`,
      {},
      getAuthHeader()
    );
  },
  
  registrarFechas: (id, fecha_inicio_campo, fecha_fin_campo) => {
    return axios.put(
      `${BRIGADAS_URL}/api/brigadas/${id}/fechas`, 
      { fecha_inicio_campo, fecha_fin_campo }, 
      getAuthHeader()
    );
  },
  
  crearRuta: (brigada_id, ruta) => {
    return axios.post(
      `${BRIGADAS_URL}/api/brigadas/${brigada_id}/rutas`, 
      ruta, 
      getAuthHeader()
    );
  },
  
  
  agregarPuntoReferencia: (ruta_id, punto) => {
    const payload = {
      ruta_id: ruta_id,
      nombre_punto: punto.nombre_punto,
      latitud: punto.latitud,
      longitud: punto.longitud,
      error_gps_m: punto.error_gps_m
    };
    
    console.log('📡 Agregando punto referencia - Payload:', payload);
    
    return axios.post(
      `${BRIGADAS_URL}/api/puntos-referencia`, 
      payload,
      getAuthHeader()
    );
  },

  getMisInvitaciones: (estado = null) => {
    const config = getAuthHeader();
    const params = estado ? { estado } : {};
    return axios.get(`${BRIGADAS_URL}/api/brigadistas/mis-invitaciones`, {
      ...config,
      params
    });
  },
  
  aceptarInvitacion: (invitacion_id) => {
    return axios.post(
      `${BRIGADAS_URL}/api/brigadistas/invitaciones/${invitacion_id}/aceptar`,
      {},
      getAuthHeader()
    );
  },
  
  rechazarInvitacion: (invitacion_id, motivo) => {
    return axios.post(
      `${BRIGADAS_URL}/api/brigadistas/invitaciones/${invitacion_id}/rechazar`,
      { motivo },
      getAuthHeader()
    );
  }
};