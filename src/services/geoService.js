// src/services/geoService.js
import axios from 'axios';

const GEO_URL = import.meta.env.VITE_API_GEO || 'http://localhost:3004';

export const geoService = {
  getRegiones: () => 
    axios.get(`${GEO_URL}/api/ubicaciones/regiones`),
  
  getDepartamentos: (region_id) => 
    axios.get(`${GEO_URL}/api/ubicaciones/departamentos?region_id=${region_id}`),
  
  getMunicipios: (departamento_id) => 
    axios.get(`${GEO_URL}/api/ubicaciones/municipios?departamento_id=${departamento_id}`),
  
  getCorporaciones: () => 
    axios.get(`${GEO_URL}/api/ubicaciones/corporaciones`)
};