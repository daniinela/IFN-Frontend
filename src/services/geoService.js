// src/services/geoService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_GEO || 'http://localhost:3004';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  console.log('🔑 Token geoService:', token ? '✅ Existe' : '❌ No existe');
  return {
    headers: { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };
};

export const geoService = {
  // ========== REGIONES ==========
  getRegiones: async () => {
    console.log('📡 GET /api/regiones');
    try {
      const response = await axios.get(`${API_URL}/api/regiones`, getAuthHeader());
      console.log(`✅ ${response.data.length} regiones obtenidas`);
      return response;
    } catch (error) {
      console.error('❌ Error en getRegiones:', error.response?.data || error.message);
      throw error;
    }
  },
  
  getRegionById: async (id) => {
    console.log(`📡 GET /api/regiones/${id}`);
    try {
      const response = await axios.get(`${API_URL}/api/regiones/${id}`, getAuthHeader());
      return response;
    } catch (error) {
      console.error('❌ Error en getRegionById:', error.response?.data || error.message);
      throw error;
    }
  },

  // ========== DEPARTAMENTOS ==========
  getDepartamentos: async () => {
    console.log('📡 GET /api/departamentos');
    try {
      const response = await axios.get(`${API_URL}/api/departamentos`, getAuthHeader());
      console.log(`✅ ${response.data.length} departamentos obtenidos`);
      return response;
    } catch (error) {
      console.error('❌ Error en getDepartamentos:', error.response?.data || error.message);
      throw error;
    }
  },
  
  getDepartamentosByRegion: async (region_id) => {
    console.log(`📡 GET /api/departamentos/region/${region_id}`);
    try {
      const response = await axios.get(
        `${API_URL}/api/departamentos/region/${region_id}`, 
        getAuthHeader()
      );
      console.log(`✅ ${response.data.length} departamentos obtenidos`);
      return response;
    } catch (error) {
      console.error('❌ Error en getDepartamentosByRegion:', error.response?.data || error.message);
      throw error;
    }
  },
  
  getDepartamentoById: async (id) => {
    console.log(`📡 GET /api/departamentos/${id}`);
    try {
      const response = await axios.get(`${API_URL}/api/departamentos/${id}`, getAuthHeader());
      return response;
    } catch (error) {
      console.error('❌ Error en getDepartamentoById:', error.response?.data || error.message);
      throw error;
    }
  },

  // ========== MUNICIPIOS ==========
  getMunicipios: async () => {
    console.log('📡 GET /api/municipios');
    try {
      const response = await axios.get(`${API_URL}/api/municipios`, getAuthHeader());
      console.log(`✅ ${response.data.length} municipios obtenidos`);
      return response;
    } catch (error) {
      console.error('❌ Error en getMunicipios:', error.response?.data || error.message);
      throw error;
    }
  },
  
  getMunicipiosByDepartamento: async (departamento_id) => {
    console.log(`📡 GET /api/municipios/departamento/${departamento_id}`);
    try {
      const response = await axios.get(
        `${API_URL}/api/municipios/departamento/${departamento_id}`, 
        getAuthHeader()
      );
      console.log(`✅ ${response.data.length} municipios obtenidos`);
      return response;
    } catch (error) {
      console.error('❌ Error en getMunicipiosByDepartamento:', error.response?.data || error.message);
      throw error;
    }
  },
  
  getMunicipioById: async (id) => {
    console.log(`📡 GET /api/municipios/${id}`);
    try {
      const response = await axios.get(`${API_URL}/api/municipios/${id}`, getAuthHeader());
      return response;
    } catch (error) {
      console.error('❌ Error en getMunicipioById:', error.response?.data || error.message);
      throw error;
    }
  }
};
