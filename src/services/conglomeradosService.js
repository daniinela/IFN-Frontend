// src/services/conglomeradosService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_CONGLOMERADOS || 'http://localhost:3003'; // ✅ Cambiar a 3003

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  console.log('🔑 Token usado:', token ? '✅ Existe' : '❌ No existe');
  return {
    headers: { 'Authorization': `Bearer ${token}` }
  };
};

export const conglomeradosService = {
  getAll: (page = 1, limit = 20, busqueda = '') => {
    console.log('📡 GET /api/conglomerados', { page, limit, busqueda });
    return axios.get(`${API_URL}/api/conglomerados?page=${page}&limit=${limit}&busqueda=${busqueda}`, getAuthHeader());
  },
  
  getById: (id) => {
    console.log('📡 GET /api/conglomerados/:id', id);
    return axios.get(`${API_URL}/api/conglomerados/${id}`, getAuthHeader());
  },
  
  generarBatch: (cantidad) => {
    console.log('📡 POST /api/conglomerados/generar-batch', cantidad);
    return axios.post(`${API_URL}/api/conglomerados/generar-batch`, { cantidad }, getAuthHeader());
  },
  
  asignarAJefe: (id, jefe_brigada_id) => {
    console.log('📡 POST /api/conglomerados/:id/asignar', { id, jefe_brigada_id });
    return axios.post(`${API_URL}/api/conglomerados/${id}/asignar`, { jefe_brigada_id }, getAuthHeader());
  },
  
  cambiarEstado: (id, estado) => {
    console.log('📡 PATCH /api/conglomerados/:id/estado', { id, estado });
    return axios.patch(`${API_URL}/api/conglomerados/${id}/estado`, { estado }, getAuthHeader());
  },
  
  getMisConglomerados: () => {
    console.log('📡 GET /api/conglomerados/mis-asignados');
    return axios.get(`${API_URL}/api/conglomerados/mis-asignados`, getAuthHeader());
  },
  
  getEstadisticas: () => {
    console.log('📡 GET /api/conglomerados/estadisticas');
    return axios.get(`${API_URL}/api/conglomerados/estadisticas`, getAuthHeader());
  },
  
  getByEstado: (estado) => {
    console.log('📡 GET /api/conglomerados/estado/:estado', estado);
    return axios.get(`${API_URL}/api/conglomerados/estado/${estado}`, getAuthHeader());
  },
    update: (id, data) => 
  axios.put(`${API_URL}/api/conglomerados/${id}`, data, getAuthHeader()),
};
