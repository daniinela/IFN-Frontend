// src/services/usuariosService.js
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_USUARIOS || 'http://localhost:3001';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  console.log('🔑 Token usuariosService:', token ? '✅ Existe' : '❌ No existe');
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
    console.error('❌ Error en usuariosService:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

export const usuariosService = {
  // ============================================
  // USUARIOS
  // ============================================
  getAll: () => {
    console.log('📡 GET /api/usuarios');
    return axios.get(`${API_URL}/api/usuarios`, getAuthHeader());
  },
  
  getById: (id) => {
    console.log('📡 GET /api/usuarios/:id', id);
    return axios.get(`${API_URL}/api/usuarios/${id}`, getAuthHeader());
  },
  
  getByEmail: (email) => {
    console.log('📡 GET /api/usuarios/email/:email', email);
    return axios.get(`${API_URL}/api/usuarios/email/${email}`, getAuthHeader());
  },
  
  create: (userData) => {
    console.log('📡 POST /api/usuarios', userData);
    return axios.post(`${API_URL}/api/usuarios`, userData, getAuthHeader());
  },
  
  update: (id, userData) => {
    console.log('📡 PUT /api/usuarios/:id', { id, userData });
    return axios.put(`${API_URL}/api/usuarios/${id}`, userData, getAuthHeader());
  },
  
  delete: (id) => {
    console.log('📡 DELETE /api/usuarios/:id', id);
    return axios.delete(`${API_URL}/api/usuarios/${id}`, getAuthHeader());
  },
  
  getPendientes: () => {
    console.log('📡 GET /api/usuarios/pendientes');
    return axios.get(`${API_URL}/api/usuarios/pendientes`, getAuthHeader());
  },
  
  // 🆕 MODIFICADO: Aprobar con múltiples roles
  aprobarConRoles: (id, roles) => {
    console.log('📡 POST /api/usuarios/:id/aprobar con roles', { id, roles });
    return axios.post(`${API_URL}/api/usuarios/${id}/aprobar`, { roles }, getAuthHeader());
  },
  
  // Mantener el método antiguo por compatibilidad (deprecated)
  aprobar: (id) => {
    console.log('⚠️ DEPRECATED: Usar aprobarConRoles() en su lugar');
    return axios.post(`${API_URL}/api/usuarios/${id}/aprobar`, { roles: [] }, getAuthHeader());
  },
  
  rechazar: (id, motivo) => {
    console.log('📡 POST /api/usuarios/:id/rechazar', { id, motivo });
    return axios.post(`${API_URL}/api/usuarios/${id}/rechazar`, { motivo }, getAuthHeader());
  },

  // 🆕 NUEVO: Invitar usuario
  inviteUser: (email) => {
    console.log('📧 POST /api/usuarios/invite', email);
    return axios.post(`${API_URL}/api/usuarios/invite`, { email }, getAuthHeader());
  },

  // 🆕 NUEVO: Obtener solo personal operacional (sin Coordinadores ni Gestores)
  getPersonalOperacional: () => {
    console.log('📡 GET /api/usuarios/personal-operacional');
    return axios.get(`${API_URL}/api/usuarios/personal-operacional`, getAuthHeader());
  },

  // ============================================
  // CUENTAS ROL - Obtener personal con filtros
  // ============================================
  
  /**
   * Obtiene cuentas_rol con filtros geográficos y de rol
   * @param {Object} filtros - Objeto con filtros opcionales
   * @param {string} filtros.rol_codigo - Código del rol (ej: 'JEFE_BRIGADA', 'BOTANICO')
   * @param {string} filtros.region_id - UUID de la región
   * @param {string} filtros.departamento_id - UUID del departamento
   * @param {string} filtros.municipio_id - UUID del municipio
   * @param {boolean} filtros.activo - Filtrar por activo/inactivo
   * @param {boolean} filtros.solo_aprobados - Solo usuarios aprobados
   */
  getCuentasRolFiltros: (filtros = {}) => {
    console.log('📡 GET /api/cuentas-rol/filtros', filtros);
    
    // Construir query params
    const params = new URLSearchParams();
    
    if (filtros.rol_codigo) params.append('rol_codigo', filtros.rol_codigo);
    if (filtros.region_id) params.append('region_id', filtros.region_id);
    if (filtros.departamento_id) params.append('departamento_id', filtros.departamento_id);
    if (filtros.municipio_id) params.append('municipio_id', filtros.municipio_id);
    if (filtros.activo !== undefined) params.append('activo', filtros.activo);
    if (filtros.solo_aprobados !== undefined) params.append('solo_aprobados', filtros.solo_aprobados);
    
    const url = `${API_URL}/api/cuentas-rol/filtros?${params.toString()}`;
    console.log('🔗 URL construida:', url);
    
    return axios.get(url, getAuthHeader());
  },
  
  // Método específico para obtener jefes de brigada
  getJefesBrigadaDisponibles: (filtros = {}) => {
    console.log('📡 GET /api/usuarios/jefes-brigada-disponibles', filtros);
    
    const params = new URLSearchParams();
    if (filtros.region_id) params.append('region_id', filtros.region_id);
    if (filtros.departamento_id) params.append('departamento_id', filtros.departamento_id);
    if (filtros.municipio_id) params.append('municipio_id', filtros.municipio_id);
    params.append('activo', 'true');
    params.append('solo_aprobados', 'true');
    
    return axios.get(
      `${API_URL}/api/usuarios/jefes-brigada-disponibles?${params.toString()}`, 
      getAuthHeader()
    );
  },

  // ============================================
  // ROLES SISTEMA
  // ============================================
  getRolesSistema: () => {
    console.log('📡 GET /api/roles-sistema');
    return axios.get(`${API_URL}/api/roles-sistema`, getAuthHeader());
  },
  
  getRolByCode: (codigo) => {
    console.log('📡 GET /api/roles-sistema/codigo/:codigo', codigo);
    return axios.get(`${API_URL}/api/roles-sistema/codigo/${codigo}`, getAuthHeader());
  },

  // 🆕 NUEVO: Obtener roles operacionales
  getRolesOperacionales: () => {
    console.log('📡 GET /api/roles-sistema/nivel/operacional');
    return axios.get(`${API_URL}/api/roles-sistema/nivel/operacional`, getAuthHeader());
  }
};