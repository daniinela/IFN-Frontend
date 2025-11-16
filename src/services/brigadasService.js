// src/services/brigadasService.js
import axios from 'axios';

const BRIGADAS_URL = import.meta.env.VITE_API_BRIGADAS || 'http://localhost:3003';

const getAuthHeader = () => ({
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
});

export const brigadasService = {
  getAll: () => 
    axios.get(`${BRIGADAS_URL}/api/brigadas`, getAuthHeader()),
  
  getById: (id) => 
    axios.get(`${BRIGADAS_URL}/api/brigadas/${id}`, getAuthHeader()),
  
  getMisBrigadas: () => 
    axios.get(`${BRIGADAS_URL}/api/brigadas/mis-brigadas`, getAuthHeader()),
  
  cambiarEstado: (id, estado) => 
    axios.patch(`${BRIGADAS_URL}/api/brigadas/${id}/estado`, { estado }, getAuthHeader()),
  
  agregarMiembro: (brigada_id, usuario_id, rol_operativo) => 
    axios.post(`${BRIGADAS_URL}/api/brigadas/${brigada_id}/miembros`, 
      { usuario_id, rol_operativo }, getAuthHeader()),
  
  registrarFechas: (id, fecha_inicio_campo, fecha_fin_campo) => 
    axios.patch(`${BRIGADAS_URL}/api/brigadas/${id}/fechas`, 
      { fecha_inicio_campo, fecha_fin_campo }, getAuthHeader()),
  
  crearRuta: (brigada_id, ruta) => 
    axios.post(`${BRIGADAS_URL}/api/rutas`, { brigada_id, ...ruta }, getAuthHeader()),
  
  agregarPuntoReferencia: (ruta_id, punto) => 
    axios.post(`${BRIGADAS_URL}/api/puntos-referencia`, { ruta_id, ...punto }, getAuthHeader())
};