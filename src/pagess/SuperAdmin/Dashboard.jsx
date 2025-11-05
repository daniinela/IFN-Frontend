// frontend/src/pages/superadmin/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
//import './Dashboard.css';

function Dashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    conglomerados: { total: 0, en_revision: 0, aprobados: 0, rechazados: 0 },
    brigadas: { total: 0, activas: 0, completadas: 0, en_formacion: 0 },
    brigadistas: { total: 0, activos: 0, pendientes: 0 },
    usuarios: { total: 0, super_admins: 0, admins_regionales: 0, brigadistas: 0 }
  }, []);
  const [actividadReciente, setActividadReciente] = useState([]);
  const [alertas, setAlertas] = useState([]);

  const userData = JSON.parse(localStorage.getItem('user-data') || '{}');
  const userRoles = JSON.parse(localStorage.getItem('user-roles') || '[]');
  const esSuperAdmin = userRoles.some(r => r.codigo === 'super_admin');

  useEffect(() => {
    cargarEstadisticas();
  });

  const cargarEstadisticas = async () => {
    try {
      setLoading(true);

      // Obtener token
      const token = localStorage.getItem('token');
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };

      // Llamadas paralelas
      const [congRes, brigRes, brigadistasRes, usuariosRes] = await Promise.all([
        axios.get('http://localhost:3003/api/conglomerados'),
        axios.get('http://localhost:3002/api/brigadas', config),
        axios.get('http://localhost:3002/api/brigadistas', config),
        esSuperAdmin ? axios.get('http://localhost:3001/api/usuarios', config) : Promise.resolve({ data: [] })
      ]);

      // Procesar conglomerados
      const conglomerados = congRes.data;
      const statsConglomerados = {
        total: conglomerados.length,
        en_revision: conglomerados.filter(c => c.estado === 'en_revision').length,
        aprobados: conglomerados.filter(c => c.estado === 'aprobado').length,
        rechazados: conglomerados.filter(c => c.estado.includes('rechazado')).length
      };

      // Procesar brigadas
      const brigadas = brigRes.data;
      const statsBrigadas = {
        total: brigadas.length,
        activas: brigadas.filter(b => b.estado === 'activa').length,
        completadas: brigadas.filter(b => b.estado === 'completada').length,
        en_formacion: brigadas.filter(b => b.estado === 'formacion').length
      };

      // Procesar brigadistas
      const brigadistas = brigadistasRes.data;
      const statsBrigadistas = {
        total: brigadistas.length,
        activos: brigadistas.filter(b => b.activo).length,
        pendientes: brigadistas.filter(b => !b.activo).length
      };

      // Procesar usuarios (solo super admin)
      let statsUsuarios = { total: 0, super_admins: 0, admins_regionales: 0, brigadistas: 0 };
      if (esSuperAdmin) {
        const usuarios = usuariosRes.data;
        statsUsuarios = {
          total: usuarios.length,
          super_admins: usuarios.filter(u => 
            u.cuentas_rol?.some(cr => cr.roles_sistema.codigo === 'super_admin')
          ).length,
          admins_regionales: usuarios.filter(u => 
            u.cuentas_rol?.some(cr => cr.roles_sistema.codigo === 'admin_regional')
          ).length,
          brigadistas: usuarios.filter(u => 
            u.cuentas_rol?.some(cr => cr.roles_sistema.codigo === 'brigadista')
          ).length
        };
      }

      setStats({
        conglomerados: statsConglomerados,
        brigadas: statsBrigadas,
        brigadistas: statsBrigadistas,
        usuarios: statsUsuarios
      });

      // Generar actividad reciente (últimos 5 cambios)
      const actividad = [
        ...conglomerados
          .filter(c => c.modificado_por_admin_nombre)
          .slice(0, 3)
          .map(c => ({
            tipo: 'conglomerado',
            accion: c.estado === 'aprobado' ? 'aprobó' : 'rechazó',
            item: c.codigo,
            usuario: c.modificado_por_admin_nombre,
            fecha: c.updated_at
          })),
        ...brigadas
          .slice(0, 2)
          .map(b => ({
            tipo: 'brigada',
            accion: 'creó',
            item: `Brigada ${b.id.substring(0, 8)}`,
            usuario: 'Sistema',
            fecha: b.created_at
          }))
      ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha)).slice(0, 5);

      setActividadReciente(actividad);

      // Generar alertas
      const alertasNuevas = [];
      if (statsConglomerados.en_revision > 5) {
        alertasNuevas.push({
          tipo: 'warning',
          mensaje: `Hay ${statsConglomerados.en_revision} conglomerados pendientes de revisión`,
          icono: '⚠️'
        });
      }
      if (statsBrigadistas.pendientes > 0) {
        alertasNuevas.push({
          tipo: 'info',
          mensaje: `${statsBrigadistas.pendientes} brigadistas pendientes de aprobación`,
          icono: 'ℹ️'
        });
      }
      if (statsBrigadas.en_formacion > 3) {
        alertasNuevas.push({
          tipo: 'info',
          mensaje: `${statsBrigadas.en_formacion} brigadas en formación`,
          icono: '👥'
        });
      }

      setAlertas(alertasNuevas);

    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner-large"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h2 className="dashboard-title">
            Bienvenido, {userData.nombre_completo?.split(' ')[0] || 'Admin'} 👋
          </h2>
          <p className="dashboard-subtitle">
            {new Date().toLocaleDateString('es-ES', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="alertas-container">
          {alertas.map((alerta, index) => (
            <div key={index} className={`alerta alerta-${alerta.tipo}`}>
              <span className="alerta-icono">{alerta.icono}</span>
              <p>{alerta.mensaje}</p>
            </div>
          ))}
        </div>
      )}

      {/* Stats Cards */}
      <div className="stats-grid">
        {/* Conglomerados */}
        <div className="stat-card stat-card-primary">
          <div className="stat-header">
            <span className="stat-icon">🗺️</span>
            <Link to="/admin/conglomerados" className="stat-link">Ver todos →</Link>
          </div>
          <h3 className="stat-title">Conglomerados</h3>
          <p className="stat-value">{stats.conglomerados.total}</p>
          <div className="stat-details">
            <div className="stat-detail">
              <span className="stat-detail-label">En Revisión</span>
              <span className="stat-detail-value">{stats.conglomerados.en_revision}</span>
            </div>
            <div className="stat-detail">
              <span className="stat-detail-label">Aprobados</span>
              <span className="stat-detail-value">{stats.conglomerados.aprobados}</span>
            </div>
            <div className="stat-detail">
              <span className="stat-detail-label">Rechazados</span>
              <span className="stat-detail-value">{stats.conglomerados.rechazados}</span>
            </div>
          </div>
        </div>

        {/* Brigadas */}
        <div className="stat-card stat-card-success">
          <div className="stat-header">
            <span className="stat-icon">👥</span>
            <Link to="/admin/brigadas" className="stat-link">Ver todas →</Link>
          </div>
          <h3 className="stat-title">Brigadas</h3>
          <p className="stat-value">{stats.brigadas.total}</p>
          <div className="stat-details">
            <div className="stat-detail">
              <span className="stat-detail-label">Activas</span>
              <span className="stat-detail-value">{stats.brigadas.activas}</span>
            </div>
            <div className="stat-detail">
              <span className="stat-detail-label">En Formación</span>
              <span className="stat-detail-value">{stats.brigadas.en_formacion}</span>
            </div>
            <div className="stat-detail">
              <span className="stat-detail-label">Completadas</span>
              <span className="stat-detail-value">{stats.brigadas.completadas}</span>
            </div>
          </div>
        </div>

        {/* Brigadistas */}
        <div className="stat-card stat-card-info">
          <div className="stat-header">
            <span className="stat-icon">👤</span>
            <Link to="/admin/brigadistas" className="stat-link">Ver todos →</Link>
          </div>
          <h3 className="stat-title">Brigadistas</h3>
          <p className="stat-value">{stats.brigadistas.total}</p>
          <div className="stat-details">
            <div className="stat-detail">
              <span className="stat-detail-label">Activos</span>
              <span className="stat-detail-value">{stats.brigadistas.activos}</span>
            </div>
            <div className="stat-detail">
              <span className="stat-detail-label">Pendientes</span>
              <span className="stat-detail-value">{stats.brigadistas.pendientes}</span>
            </div>
          </div>
        </div>

        {/* Usuarios (solo super admin) */}
        {esSuperAdmin && (
          <div className="stat-card stat-card-warning">
            <div className="stat-header">
              <span className="stat-icon">👨‍💼</span>
              <Link to="/admin/usuarios" className="stat-link">Ver todos →</Link>
            </div>
            <h3 className="stat-title">Usuarios del Sistema</h3>
            <p className="stat-value">{stats.usuarios.total}</p>
            <div className="stat-details">
              <div className="stat-detail">
                <span className="stat-detail-label">Super Admins</span>
                <span className="stat-detail-value">{stats.usuarios.super_admins}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-detail-label">Admins Regionales</span>
                <span className="stat-detail-value">{stats.usuarios.admins_regionales}</span>
              </div>
              <div className="stat-detail">
                <span className="stat-detail-label">Brigadistas</span>
                <span className="stat-detail-value">{stats.usuarios.brigadistas}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actividad Reciente */}
      <div className="actividad-section">
        <h3 className="section-title">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 8V12L15 15" stroke="currentColor" strokeWidth="2"/>
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Actividad Reciente
        </h3>

        {actividadReciente.length === 0 ? (
          <div className="empty-state">
            <p>No hay actividad reciente</p>
          </div>
        ) : (
          <div className="actividad-list">
            {actividadReciente.map((act, index) => (
              <div key={index} className="actividad-item">
                <div className="actividad-icon">
                  {act.tipo === 'conglomerado' ? '🗺️' : '👥'}
                </div>
                <div className="actividad-content">
                  <p className="actividad-text">
                    <strong>{act.usuario}</strong> {act.accion} <strong>{act.item}</strong>
                  </p>
                  <p className="actividad-fecha">
                    {new Date(act.fecha).toLocaleString('es-ES')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Acciones Rápidas (solo super admin) */}
      {esSuperAdmin && (
        <div className="acciones-section">
          <h3 className="section-title">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M13 2L3 14H12L11 22L21 10H12L13 2Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Acciones Rápidas
          </h3>

          <div className="acciones-grid">
            <Link to="/admin/usuarios" className="accion-card">
              <span className="accion-icon">👨‍💼</span>
              <h4>Gestionar Usuarios</h4>
              <p>Crear admins regionales y gestionar accesos</p>
            </Link>

            <Link to="/admin/roles" className="accion-card">
              <span className="accion-icon">🔐</span>
              <h4>Roles y Permisos</h4>
              <p>Configurar privilegios y permisos del sistema</p>
            </Link>

            <Link to="/admin/regiones" className="accion-card">
              <span className="accion-icon">🌍</span>
              <h4>Ver Regiones</h4>
              <p>Consultar departamentos y municipios</p>
            </Link>

            <Link to="/admin/config" className="accion-card">
              <span className="accion-icon">⚙️</span>
              <h4>Configuración</h4>
              <p>Ajustes generales del sistema</p>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;