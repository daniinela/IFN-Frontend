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

// Lista de CARs en Colombia
export const CARS_COLOMBIA = [
  { sigla: 'CAM', nombre: 'Corporación Autónoma Regional del Alto Magdalena' },
  { sigla: 'CAR', nombre: 'Corporación Autónoma Regional de Cundinamarca' },
  { sigla: 'CARDIQUE', nombre: 'Corporación Autónoma Regional del Canal del Dique' },
  { sigla: 'CARDER', nombre: 'Corporación Autónoma Regional de Risaralda' },
  { sigla: 'CARSUCRE', nombre: 'Corporación Autónoma Regional de Sucre' },
  { sigla: 'CAS', nombre: 'Corporación Autónoma Regional de Santander' },
  { sigla: 'CODECHOCÓ', nombre: 'Corporación para el Desarrollo Sostenible del Chocó' },
  { sigla: 'CORALINA', nombre: 'Corporación para el Desarrollo Sostenible del Archipiélago de San Andrés' },
  { sigla: 'CORPOAMAZONIA', nombre: 'Corporación para el Desarrollo Sostenible del Sur de la Amazonia' },
  { sigla: 'CORPOBOYACA', nombre: 'Corporación Autónoma Regional de Boyacá' },
  { sigla: 'CORPOCALDAS', nombre: 'Corporación Autónoma Regional de Caldas' },
  { sigla: 'CORPOCESAR', nombre: 'Corporación Autónoma Regional del Cesar' },
  { sigla: 'CORPOCHIVOR', nombre: 'Corporación Autónoma Regional de Chivor' },
  { sigla: 'CORPOGUAJIRA', nombre: 'Corporación Autónoma Regional de La Guajira' },
  { sigla: 'CORPOGUAVIO', nombre: 'Corporación Autónoma Regional del Guavio' },
  { sigla: 'CORPOMAG', nombre: 'Corporación Autónoma Regional del Magdalena' },
  { sigla: 'CORPONARIÑO', nombre: 'Corporación Autónoma Regional de Nariño' },
  { sigla: 'CORPONOR', nombre: 'Corporación Autónoma Regional de la Frontera Nororiental' },
  { sigla: 'CORPOORINO', nombre: 'Corporación Autónoma Regional de la Orinoquía' },
  { sigla: 'CORPORINOQUIA', nombre: 'Corporación Autónoma Regional de la Orinoquía' },
  { sigla: 'CORPOURA', nombre: 'Corporación Autónoma Regional de los Valles del Sinú y San Jorge' },
  { sigla: 'CORPOURABÁ', nombre: 'Corporación para el Desarrollo Sostenible del Urabá' },
  { sigla: 'CORTOLIMA', nombre: 'Corporación Autónoma Regional del Tolima' },
  { sigla: 'CRA', nombre: 'Corporación para el Desarrollo Sostenible del Área de Manejo Especial La Macarena' },
  { sigla: 'CRC', nombre: 'Corporación Autónoma Regional del Cauca' },
  { sigla: 'CRQ', nombre: 'Corporación Autónoma Regional del Quindío' },
  { sigla: 'CSB', nombre: 'Corporación Autónoma Regional del Sur de Bolívar' },
  { sigla: 'CVC', nombre: 'Corporación Autónoma Regional del Valle del Cauca' },
  { sigla: 'CVS', nombre: 'Corporación Autónoma Regional de los Valles del Sinú y San Jorge' },
  { sigla: 'CORNARE', nombre: 'Corporación Autónoma Regional de las Cuencas de los Ríos Negro y Nare' },
  { sigla: 'DADMA', nombre: 'Departamento Administrativo de Gestión del Medio Ambiente' }
].sort((a, b) => a.sigla.localeCompare(b.sigla));