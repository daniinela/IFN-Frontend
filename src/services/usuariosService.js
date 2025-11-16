// src/services/usuariosService.js
import axios from 'axios';

const USUARIOS_URL = import.meta.env.VITE_API_USUARIOS || 'http://localhost:3001';

const getAuthHeader = () => ({
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
});

export const usuariosService = {
  getAll: () => 
    axios.get(`${USUARIOS_URL}/api/usuarios`, getAuthHeader()),
  
  getById: (id) => 
    axios.get(`${USUARIOS_URL}/api/usuarios/${id}`, getAuthHeader()),
  
  getPendientes: () => 
    axios.get(`${USUARIOS_URL}/api/usuarios/pendientes`, getAuthHeader()),
  
  aprobar: (id) => 
    axios.post(`${USUARIOS_URL}/api/usuarios/${id}/aprobar`, {}, getAuthHeader()),
  
  rechazar: (id, motivo) => 
    axios.post(`${USUARIOS_URL}/api/usuarios/${id}/rechazar`, { motivo }, getAuthHeader()),
  
  asignarRol: (usuario_id, tipo_rol_id, alcance) => 
    axios.post(`${USUARIOS_URL}/api/cuentas-rol`, 
      { usuario_id, tipo_rol_id, ...alcance }, getAuthHeader()),
  
  getCuentasRolPorUsuario: (usuario_id) => 
    axios.get(`${USUARIOS_URL}/api/cuentas-rol/usuario/${usuario_id}`, getAuthHeader()),
  
  getJefesBrigadaDisponibles: (filtros) => 
    axios.get(`${USUARIOS_URL}/api/cuentas-rol/filtros`, { 
      params: { rol_codigo: 'JEFE_BRIGADA', solo_aprobados: true, ...filtros }, 
      ...getAuthHeader() 
    })
};