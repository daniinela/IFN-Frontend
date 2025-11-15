// src/services/conglomeradosService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_CONGLOMERADOS || 'http://localhost:3002';

const getAuthHeader = () => ({
  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
});

export const conglomeradosService = {
  getAll: (page = 1, limit = 20, busqueda = '') => 
    axios.get(`${API_URL}/api/conglomerados?page=${page}&limit=${limit}&busqueda=${busqueda}`, getAuthHeader()),
  
  getById: (id) => 
    axios.get(`${API_URL}/api/conglomerados/${id}`, getAuthHeader()),
  
  generarBatch: (cantidad) => 
    axios.post(`${API_URL}/api/conglomerados/generar-batch`, { cantidad }, getAuthHeader()),
  
  asignarAJefe: (id, jefe_brigada_id) => 
    axios.post(`${API_URL}/api/conglomerados/${id}/asignar`, { jefe_brigada_id }, getAuthHeader()),
  
  cambiarEstado: (id, estado) => 
    axios.patch(`${API_URL}/api/conglomerados/${id}/estado`, { estado }, getAuthHeader()),
  
  getMisConglomerados: () => 
    axios.get(`${API_URL}/api/conglomerados/mis-conglomerados`, getAuthHeader()),
  
  getEstadisticas: () => 
    axios.get(`${API_URL}/api/conglomerados/estadisticas`, getAuthHeader()),
  
  getByEstado: (estado) => 
    axios.get(`${API_URL}/api/conglomerados/estado/${estado}`, getAuthHeader())
};

// src/services/brigadasService.js
const BRIGADAS_URL = import.meta.env.VITE_API_BRIGADAS || 'http://localhost:3003';

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

// src/services/usuariosService.js
const USUARIOS_URL = import.meta.env.VITE_API_USUARIOS || 'http://localhost:3001';

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

// src/services/geoService.js
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