// src/pages/coordbrigadas/RevisionSolicitudes.jsx
import { useState, useEffect, useCallback } from 'react';
import axios from '../../api/axiosConfig';
import './RevisionSolicitudes.css';

function RevisionSolicitudes() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [solicitudes, setSolicitudes] = useState([]);
  const [roles, setRoles] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  
  // Modales
  const [showModalCV, setShowModalCV] = useState(false);
  const [showModalRoles, setShowModalRoles] = useState(false);
  const [showModalRechazo, setShowModalRechazo] = useState(false);
  const [solicitudSeleccionada, setSolicitudSeleccionada] = useState(null);
  const [rolesSeleccionados, setRolesSeleccionados] = useState([]);

  const cargarDatos = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      // Cargar solicitudes y roles en paralelo
      const [solicitudesRes, rolesRes] = await Promise.all([
        axios.get('http://localhost:3002/api/brigadistas/pendientes'),
        axios.get('http://localhost:3002/api/sub-rol')
      ]);

      setSolicitudes(solicitudesRes.data || []);
      setRoles(rolesRes.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setError('Error al cargar las solicitudes pendientes');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const verCV = (solicitud) => {
    setSolicitudSeleccionada(solicitud);
    setShowModalCV(true);
  };

  const abrirModalRoles = () => {
    setShowModalCV(false);
    setRolesSeleccionados([]);
    setShowModalRoles(true);
  };

  const toggleRol = (rolId) => {
    setRolesSeleccionados(prev => 
      prev.includes(rolId) 
        ? prev.filter(id => id !== rolId)
        : [...prev, rolId]
    );
  };

  const aprobarConRoles = async () => {
    if (rolesSeleccionados.length === 0) {
      setError('Debes seleccionar al menos un rol');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await axios.post(
        `http://localhost:3002/api/brigadistas/${solicitudSeleccionada.id}/aprobar`,
        { roles: rolesSeleccionados }
      );

      setSuccess(`✅ ${solicitudSeleccionada.nombre_completo} aprobado con ${rolesSeleccionados.length} rol(es)`);
      setShowModalRoles(false);
      setSolicitudSeleccionada(null);
      setRolesSeleccionados([]);
      cargarDatos();
    } catch (error) {
      console.error('Error aprobando solicitud:', error);
      setError(error.response?.data?.error || 'Error al aprobar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const rechazarSolicitud = async () => {
    try {
      setLoading(true);
      setError('');

      await axios.post(
        `http://localhost:3002/api/brigadistas/${solicitudSeleccionada.id}/rechazar`
      );

      setSuccess(`✅ Solicitud de ${solicitudSeleccionada.nombre_completo} rechazada`);
      setShowModalRechazo(false);
      setSolicitudSeleccionada(null);
      cargarDatos();
    } catch (error) {
      console.error('Error rechazando solicitud:', error);
      setError(error.response?.data?.error || 'Error al rechazar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  const calcularAnosExperiencia = (experiencias) => {
    if (!experiencias || experiencias.length === 0) return 0;
    
    let totalMeses = 0;
    experiencias.forEach(exp => {
      const inicio = new Date(exp.fecha_inicio);
      const fin = exp.fecha_fin ? new Date(exp.fecha_fin) : new Date();
      const meses = (fin.getFullYear() - inicio.getFullYear()) * 12 + (fin.getMonth() - inicio.getMonth());
      totalMeses += meses;
    });
    
    return Math.floor(totalMeses / 12);
  };

  const formatearFechaRelativa = (fecha) => {
    const ahora = new Date();
    const fechaSolicitud = new Date(fecha);
    const diffMs = ahora - fechaSolicitud;
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDias === 0) return 'Hoy';
    if (diffDias === 1) return 'Ayer';
    if (diffDias < 7) return `Hace ${diffDias} días`;
    if (diffDias < 30) return `Hace ${Math.floor(diffDias / 7)} semanas`;
    return `Hace ${Math.floor(diffDias / 30)} meses`;
  };

  const getInitials = (nombre) => {
    if (!nombre) return '?';
    return nombre
      .split(' ')
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const getRolIcon = (codigo) => {
    const icons = {
      jefe: '👨‍💼',
      botanico: '🌿',
      tecnico: '🔧',
      coinvestigador: '🤝'
    };
    return icons[codigo] || '👤';
  };

  const solicitudesFiltradas = solicitudes.filter(s => 
    !busqueda ||
    s.nombre_completo?.toLowerCase().includes(busqueda.toLowerCase()) ||
    s.email?.toLowerCase().includes(busqueda.toLowerCase())
  );

  if (loading && solicitudes.length === 0) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando solicitudes...</p>
      </div>
    );
  }

  return (
    <div className="revision-solicitudes">
      <div className="page-header">
        <div>
          <h2 className="page-title">
            Revisión de Solicitudes
            {solicitudes.length > 0 && (
              <span className="badge-count">{solicitudes.length}</span>
            )}
          </h2>
          <p className="page-subtitle">Aprobar o rechazar solicitudes de brigadistas</p>
        </div>
        <button className="refresh-btn" onClick={cargarDatos}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M21.5 2V8H15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12C21 16.9706 16.9706 21 12 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
          </svg>
          Actualizar
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM13 17H11V15H13V17ZM13 13H11V7H13V13Z" fill="currentColor"/>
          </svg>
          {error}
          <button onClick={() => setError('')} className="alert-close">✕</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke="currentColor" strokeWidth="2"/>
            <polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" strokeWidth="2"/>
          </svg>
          {success}
          <button onClick={() => setSuccess('')} className="alert-close">✕</button>
        </div>
      )}

      <div className="search-section">
        <div className="search-input-wrapper">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por nombre o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {solicitudesFiltradas.length === 0 ? (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="8.5" cy="7" r="4" />
            <line x1="20" y1="8" x2="20" y2="14"/>
            <line x1="23" y1="11" x2="17" y2="11"/>
          </svg>
          <h3>No hay solicitudes pendientes</h3>
          <p>Todas las solicitudes han sido procesadas</p>
        </div>
      ) : (
        <div className="solicitudes-grid">
          {solicitudesFiltradas.map(solicitud => {
            const anosExp = calcularAnosExperiencia(solicitud.experiencia_laboral);
            const numTitulos = solicitud.titulos?.length || 0;
            
            return (
              <div key={solicitud.id} className="solicitud-card">
                <div className="card-avatar">
                  {getInitials(solicitud.nombre_completo)}
                </div>
                
                <div className="card-content">
                  <h3 className="card-nombre">{solicitud.nombre_completo}</h3>
                  
                  <div className="card-info">
                    <div className="info-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                        <polyline points="22,6 12,13 2,6"/>
                      </svg>
                      <span>{solicitud.email}</span>
                    </div>
                    
                    {solicitud.telefono && (
                      <div className="info-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>
                        </svg>
                        <span>{solicitud.telefono}</span>
                      </div>
                    )}
                  </div>

                  <div className="card-stats">
                    <div className="stat-badge">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                        <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                      </svg>
                      {numTitulos} {numTitulos === 1 ? 'título' : 'títulos'}
                    </div>
                    
                    <div className="stat-badge">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                        <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                      </svg>
                      {anosExp} {anosExp === 1 ? 'año' : 'años'} exp.
                    </div>
                  </div>

                  <div className="card-fecha">
                    {formatearFechaRelativa(solicitud.created_at)}
                  </div>

                  <button 
                    className="btn-ver-cv"
                    onClick={() => verCV(solicitud)}
                  >
                    Ver Currículum Completo
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal CV */}
      {showModalCV && solicitudSeleccionada && (
        <div className="modal-overlay" onClick={() => setShowModalCV(false)}>
          <div className="modal-content modal-cv" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Currículum Vitae de {solicitudSeleccionada.nombre_completo}
              </h3>
              <button className="modal-close" onClick={() => setShowModalCV(false)}>×</button>
            </div>

            <div className="modal-body">
              <section className="cv-section">
                <h4 className="cv-section-title">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                    <circle cx="12" cy="7" r="4"/>
                  </svg>
                  Información Personal
                </h4>
                <div className="cv-info-grid">
                  <div className="cv-info-item">
                    <strong>Nombre:</strong>
                    <span>{solicitudSeleccionada.nombre_completo}</span>
                  </div>
                  <div className="cv-info-item">
                    <strong>Email:</strong>
                    <span>{solicitudSeleccionada.email}</span>
                  </div>
                  <div className="cv-info-item">
                    <strong>Teléfono:</strong>
                    <span>{solicitudSeleccionada.telefono || 'No especificado'}</span>
                  </div>
                  <div className="cv-info-item">
                    <strong>Municipio:</strong>
                    <span>{solicitudSeleccionada.municipio || 'No especificado'}</span>
                  </div>
                </div>
              </section>

              {solicitudSeleccionada.titulos && solicitudSeleccionada.titulos.length > 0 && (
                <section className="cv-section">
                  <h4 className="cv-section-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 10v6M2 10l10-5 10 5-10 5z"/>
                      <path d="M6 12v5c3 3 9 3 12 0v-5"/>
                    </svg>
                    Formación Académica
                  </h4>
                  <div className="cv-list">
                    {solicitudSeleccionada.titulos.map((titulo, idx) => (
                      <div key={idx} className="cv-list-item">
                        <div className="cv-list-icon">✓</div>
                        <div>
                          <strong>{titulo.titulo}</strong>
                          <div className="cv-list-details">
                            {titulo.institucion} • {titulo.anio}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {solicitudSeleccionada.experiencia_laboral && solicitudSeleccionada.experiencia_laboral.length > 0 && (
                <section className="cv-section">
                  <h4 className="cv-section-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="7" width="20" height="14" rx="2" ry="2"/>
                      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
                    </svg>
                    Experiencia Laboral
                  </h4>
                  <div className="cv-list">
                    {solicitudSeleccionada.experiencia_laboral.map((exp, idx) => {
                      const inicio = new Date(exp.fecha_inicio).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' });
                      const fin = exp.fecha_fin ? new Date(exp.fecha_fin).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' }) : 'Actual';
                      
                      return (
                        <div key={idx} className="cv-list-item">
                          <div className="cv-list-icon">►</div>
                          <div>
                            <strong>{exp.cargo}</strong> | {exp.empresa}
                            <div className="cv-list-details">
                              {inicio} → {fin}
                            </div>
                            {exp.descripcion && (
                              <p className="cv-list-description">{exp.descripcion}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              )}

              {solicitudSeleccionada.disponibilidad && solicitudSeleccionada.disponibilidad.length > 0 && (
                <section className="cv-section">
                  <h4 className="cv-section-title">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/>
                      <path d="M12 6v6l4 2"/>
                    </svg>
                    Disponibilidad
                  </h4>
                  <div className="cv-disponibilidad">
                    {solicitudSeleccionada.disponibilidad.map((disp, idx) => (
                      <span key={idx} className="disponibilidad-tag">{disp}</span>
                    ))}
                  </div>
                </section>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-modal btn-danger"
                onClick={() => {
                  setShowModalCV(false);
                  setShowModalRechazo(true);
                }}
              >
                Rechazar
              </button>
              <button 
                className="btn-modal btn-confirm"
                onClick={abrirModalRoles}
              >
                Aprobar →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Roles */}
      {showModalRoles && solicitudSeleccionada && (
        <div className="modal-overlay" onClick={() => setShowModalRoles(false)}>
          <div className="modal-content modal-roles" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                Asignar Roles a {solicitudSeleccionada.nombre_completo}
              </h3>
              <button className="modal-close" onClick={() => setShowModalRoles(false)}>×</button>
            </div>

            <div className="modal-body">
              <p className="modal-instruction">
                Selecciona uno o más roles según las cualificaciones del candidato:
              </p>

              <div className="roles-grid">
                {roles.map(rol => (
                  <div
                    key={rol.id}
                    className={`rol-card ${rolesSeleccionados.includes(rol.id) ? 'selected' : ''}`}
                    onClick={() => toggleRol(rol.id)}
                  >
                    <div className="rol-card-check">
                      {rolesSeleccionados.includes(rol.id) ? '☑' : '☐'}
                    </div>
                    <div className="rol-card-icon">
                      {getRolIcon(rol.codigo)}
                    </div>
                    <div className="rol-card-content">
                      <h4>{rol.nombre}</h4>
                      <p>{rol.descripcion}</p>
                    </div>
                  </div>
                ))}
              </div>

              {rolesSeleccionados.length > 0 && (
                <div className="roles-info">
                  ℹ️ Roles seleccionados: {rolesSeleccionados.length}
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                className="btn-modal btn-cancel"
                onClick={() => setShowModalRoles(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-modal btn-confirm"
                onClick={aprobarConRoles}
                disabled={loading || rolesSeleccionados.length === 0}
              >
                {loading ? 'Aprobando...' : `Aprobar con ${rolesSeleccionados.length} rol(es) →`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rechazo */}
      {showModalRechazo && solicitudSeleccionada && (
        <div className="modal-overlay" onClick={() => setShowModalRechazo(false)}>
          <div className="modal-content modal-confirm" onClick={e => e.stopPropagation()}>
            <div className="modal-confirm-icon">⚠️</div>
            <h3 className="modal-confirm-title">¿Rechazar solicitud?</h3>
            <p className="modal-confirm-text">Esta acción no se puede deshacer</p>

            <div className="confirm-info-box">
              <div className="info-item">
                <strong>Candidato:</strong> {solicitudSeleccionada.nombre_completo}
              </div>
              <div className="info-item">
                <strong>Email:</strong> {solicitudSeleccionada.email}
              </div>
            </div>

            <div className="modal-confirm-actions">
              <button 
                className="btn-modal btn-cancel"
                onClick={() => setShowModalRechazo(false)}
              >
                Cancelar
              </button>
              <button 
                className="btn-modal btn-danger"
                onClick={rechazarSolicitud}
                disabled={loading}
              >
                {loading ? 'Rechazando...' : 'Sí, rechazar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RevisionSolicitudes;