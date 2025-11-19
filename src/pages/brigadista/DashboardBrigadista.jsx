// src/components/brigadista/DashboardBrigadista.jsx
import { useState, useEffect } from 'react';
import { brigadasService } from '../../services/brigadasService';
import { usuariosService } from '../../services/usuariosService';
import './DashboardBrigadista.css';

export default function DashboardBrigadista() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [invitaciones, setInvitaciones] = useState([]);
  const [jefesInfo, setJefesInfo] = useState({}); // 🆕 Info de jefes de brigada
  const [showModalRechazo, setShowModalRechazo] = useState(false);
  const [showModalDetalle, setShowModalDetalle] = useState(false); // 🆕 Modal detalles
  const [invitacionSeleccionada, setInvitacionSeleccionada] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');

  useEffect(() => {
    cargarInvitaciones();
  }, []);

  const cargarInvitaciones = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await brigadasService.getMisInvitaciones();
      console.log('✅ Invitaciones cargadas:', res.data);
      
      const invitacionesData = res.data.data || [];
      setInvitaciones(invitacionesData);

      // 🆕 Cargar info de los jefes de brigada
      await cargarInfoJefes(invitacionesData);
    } catch (err) {
      console.error('❌ Error cargando invitaciones:', err);
      setError(err.response?.data?.error || 'Error al cargar invitaciones');
    } finally {
      setLoading(false);
    }
  };

  // 🆕 Cargar información de los jefes de brigada
  const cargarInfoJefes = async (invitaciones) => {
    const jefeIds = [...new Set(
      invitaciones
        .map(inv => inv.brigadas_expedicion?.jefe_brigada_id)
        .filter(Boolean)
    )];

    const jefesData = {};
    
    await Promise.all(
      jefeIds.map(async (jefeId) => {
        try {
          const res = await usuariosService.getById(jefeId);
          jefesData[jefeId] = res.data.data || res.data;
        } catch (err) {
          console.error(`Error cargando jefe ${jefeId}:`, err);
          jefesData[jefeId] = { nombre_completo: 'Desconocido' };
        }
      })
    );

    setJefesInfo(jefesData);
  };

  const handleAceptar = async (invitacion_id) => {
    if (!window.confirm('¿Confirmas que aceptas esta invitación a la brigada?')) return;

    try {
      setLoading(true);
      setError('');
      
      await brigadasService.aceptarInvitacion(invitacion_id);
      
      setSuccess('¡Invitación aceptada! Ya formas parte de la brigada.');
      setTimeout(() => setSuccess(''), 5000);
      await cargarInvitaciones();
    } catch (err) {
      console.error('❌ Error aceptando invitación:', err);
      setError(err.response?.data?.error || 'Error al aceptar invitación');
    } finally {
      setLoading(false);
    }
  };

  const abrirModalRechazo = (invitacion) => {
    setInvitacionSeleccionada(invitacion);
    setMotivoRechazo('');
    setShowModalRechazo(true);
  };

  // 🆕 Abrir modal con detalles de la brigada
  const abrirModalDetalle = (invitacion) => {
    setInvitacionSeleccionada(invitacion);
    setShowModalDetalle(true);
  };

  const handleRechazar = async () => {
    if (!motivoRechazo || motivoRechazo.trim().length < 10) {
      alert('Debes proporcionar un motivo de al menos 10 caracteres');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await brigadasService.rechazarInvitacion(
        invitacionSeleccionada.id, 
        motivoRechazo.trim()
      );
      
      setSuccess('Invitación rechazada');
      setTimeout(() => setSuccess(''), 5000);
      setShowModalRechazo(false);
      await cargarInvitaciones();
    } catch (err) {
      console.error('❌ Error rechazando invitación:', err);
      setError(err.response?.data?.error || 'Error al rechazar invitación');
    } finally {
      setLoading(false);
    }
  };

  const invitacionesPendientes = invitaciones.filter(i => i.estado_invitacion === 'pendiente');
  const brigadasActivas = invitaciones.filter(i => 
    i.estado_invitacion === 'aceptada' && 
    ['formacion', 'en_transito', 'en_ejecucion'].includes(i.brigadas_expedicion?.estado)
  );
  const brigadasCompletadas = invitaciones.filter(i => 
    i.estado_invitacion === 'aceptada' && 
    ['completada', 'cancelada'].includes(i.brigadas_expedicion?.estado)
  );
  const invitacionesRechazadas = invitaciones.filter(i => i.estado_invitacion === 'rechazada');

  const getEstadoColor = (estado) => {
    const colores = {
      'formacion': '#3b82f6',
      'en_transito': '#f59e0b',
      'en_ejecucion': '#10b981',
      'completada': '#6b7280',
      'cancelada': '#ef4444'
    };
    return colores[estado] || '#64748b';
  };

  const getEstadoLabel = (estado) => {
    const labels = {
      'formacion': 'En Formación',
      'en_transito': 'En Tránsito',
      'en_ejecucion': 'En Ejecución',
      'completada': 'Completada',
      'cancelada': 'Cancelada'
    };
    return labels[estado] || estado;
  };

  if (loading && invitaciones.length === 0) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Cargando tus brigadas...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-brigadista">
      <div className="dashboard-header">
        <h1>Mis Brigadas y Misiones</h1>
        <p>Gestiona tus asignaciones y participa en expediciones</p>
      </div>

      {error && (
        <div className="alert alert-error">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
            <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="2"/>
            <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2"/>
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

      {/* Métricas */}
      <div className="metrics-grid">
        <div className="metric-card pendientes">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="metric-content">
            <h3>Invitaciones Pendientes</h3>
            <p className="metric-value">{invitacionesPendientes.length}</p>
            <span className="metric-label">Requieren respuesta</span>
          </div>
        </div>

        <div className="metric-card activas">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <div className="metric-content">
            <h3>Brigadas Activas</h3>
            <p className="metric-value">{brigadasActivas.length}</p>
            <span className="metric-label">En progreso</span>
          </div>
        </div>

        <div className="metric-card completadas">
          <div className="metric-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div className="metric-content">
            <h3>Completadas</h3>
            <p className="metric-value">{brigadasCompletadas.length}</p>
            <span className="metric-label">Finalizadas</span>
          </div>
        </div>
      </div>

      {/* Invitaciones Pendientes */}
      {invitacionesPendientes.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Invitaciones Pendientes
            </h2>
            <span className="badge">{invitacionesPendientes.length}</span>
          </div>

          <div className="invitaciones-grid">
            {invitacionesPendientes.map(inv => {
              const jefe = jefesInfo[inv.brigadas_expedicion?.jefe_brigada_id];
              return (
                <div key={inv.id} className="invitacion-card">
                  <div className="invitacion-header">
                    <span className="badge-rol">{inv.rol_operativo}</span>
                    <span className="badge-pendiente">Pendiente</span>
                  </div>
                  
                  <div className="invitacion-body">
                    <h3>Brigada Expedición</h3>
                    <div className="info-row">
                      <span className="label">Conglomerado:</span>
                      <span className="value">{inv.brigadas_expedicion?.conglomerado_id || 'N/A'}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Jefe de Brigada:</span>
                      <span className="value">{jefe?.nombre_completo || 'Cargando...'}</span>
                    </div>
                    <div className="info-row">
                      <span className="label">Estado:</span>
                      <span className="value">{getEstadoLabel(inv.brigadas_expedicion?.estado)}</span>
                    </div>
                    {inv.brigadas_expedicion?.fecha_inicio_campo && (
                      <div className="info-row">
                        <span className="label">Fecha Inicio:</span>
                        <span className="value">
                          {new Date(inv.brigadas_expedicion.fecha_inicio_campo).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                    <div className="info-row">
                      <span className="label">Invitado:</span>
                      <span className="value">
                        {new Date(inv.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="invitacion-actions">
                    <button 
                      onClick={() => abrirModalDetalle(inv)}
                      className="btn-detalle"
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="12" y1="16" x2="12" y2="12"/>
                        <line x1="12" y1="8" x2="12.01" y2="8"/>
                      </svg>
                      Ver Detalles
                    </button>
                    <button 
                      onClick={() => handleAceptar(inv.id)}
                      className="btn-aceptar"
                      disabled={loading}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                      Aceptar
                    </button>
                    <button 
                      onClick={() => abrirModalRechazo(inv)}
                      className="btn-rechazar"
                      disabled={loading}
                    >
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="18" y1="6" x2="6" y2="18"/>
                        <line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                      Rechazar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Brigadas Activas */}
      {brigadasActivas.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                <circle cx="12" cy="10" r="3"/>
              </svg>
              Brigadas Activas
            </h2>
          </div>

          <div className="brigadas-grid">
            {brigadasActivas.map(inv => {
              const jefe = jefesInfo[inv.brigadas_expedicion?.jefe_brigada_id];
              return (
                <div key={inv.id} className="brigada-card" onClick={() => abrirModalDetalle(inv)}>
                  <div className="card-header">
                    <span className="badge-rol">{inv.rol_operativo}</span>
                    <span 
                      className="badge-estado" 
                      style={{ backgroundColor: getEstadoColor(inv.brigadas_expedicion?.estado) }}
                    >
                      {getEstadoLabel(inv.brigadas_expedicion?.estado)}
                    </span>
                  </div>
                  <div className="card-body">
                    <h3>Conglomerado {inv.brigadas_expedicion?.conglomerado_id}</h3>
                    <p className="jefe">👤 {jefe?.nombre_completo || 'Cargando...'}</p>
                    {inv.brigadas_expedicion?.fecha_inicio_campo && (
                      <p className="fecha">
                        📅 {new Date(inv.brigadas_expedicion.fecha_inicio_campo).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 🆕 Historial de Invitaciones Rechazadas */}
      {invitacionesRechazadas.length > 0 && (
        <div className="section">
          <div className="section-header">
            <h2>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="15" y1="9" x2="9" y2="15"/>
                <line x1="9" y1="9" x2="15" y2="15"/>
              </svg>
              Invitaciones Rechazadas
            </h2>
          </div>

          <div className="rechazadas-list">
            {invitacionesRechazadas.map(inv => (
              <div key={inv.id} className="rechazada-item">
                <div className="rechazada-info">
                  <span className="badge-rol small">{inv.rol_operativo}</span>
                  <span>Conglomerado {inv.brigadas_expedicion?.conglomerado_id}</span>
                  <span className="fecha-rechazada">
                    {new Date(inv.fecha_respuesta).toLocaleDateString()}
                  </span>
                </div>
                <p className="motivo-rechazo">
                  <strong>Motivo:</strong> {inv.motivo_rechazo}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Estado vacío */}
      {invitacionesPendientes.length === 0 && brigadasActivas.length === 0 && (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          <h3>No tienes invitaciones pendientes</h3>
          <p>Cuando un jefe de brigada te asigne a una misión, aparecerá aquí</p>
        </div>
      )}

      {/* 🆕 Modal Detalle de Brigada */}
      {showModalDetalle && invitacionSeleccionada && (
        <div className="modal-overlay" onClick={() => setShowModalDetalle(false)}>
          <div className="modal-content modal-detalle" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalles de la Brigada</h3>
              <button onClick={() => setShowModalDetalle(false)} className="modal-close">✕</button>
            </div>
            
            <div className="modal-body">
              <div className="detalle-seccion">
                <h4>Información General</h4>
                <div className="detalle-grid">
                  <div className="detalle-item">
                    <span className="detalle-label">Rol Asignado:</span>
                    <span className="detalle-value badge-rol">{invitacionSeleccionada.rol_operativo}</span>
                  </div>
                  <div className="detalle-item">
                    <span className="detalle-label">Conglomerado:</span>
                    <span className="detalle-value">{invitacionSeleccionada.brigadas_expedicion?.conglomerado_id}</span>
                  </div>
                  <div className="detalle-item">
                    <span className="detalle-label">Estado:</span>
                    <span 
                      className="detalle-value badge-estado"
                      style={{ backgroundColor: getEstadoColor(invitacionSeleccionada.brigadas_expedicion?.estado) }}
                    >
                      {getEstadoLabel(invitacionSeleccionada.brigadas_expedicion?.estado)}
                    </span>
                  </div>
                  <div className="detalle-item">
                    <span className="detalle-label">Jefe de Brigada:</span>
                    <span className="detalle-value">
                      {jefesInfo[invitacionSeleccionada.brigadas_expedicion?.jefe_brigada_id]?.nombre_completo || 'Cargando...'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="detalle-seccion">
                <h4>Fechas</h4>
                <div className="detalle-grid">
                  {invitacionSeleccionada.brigadas_expedicion?.fecha_inicio_campo && (
                    <div className="detalle-item">
                      <span className="detalle-label">Inicio de Campo:</span>
                      <span className="detalle-value">
                        {new Date(invitacionSeleccionada.brigadas_expedicion.fecha_inicio_campo).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  {invitacionSeleccionada.brigadas_expedicion?.fecha_fin_campo && (
                    <div className="detalle-item">
                      <span className="detalle-label">Fin de Campo:</span>
                      <span className="detalle-value">
                        {new Date(invitacionSeleccionada.brigadas_expedicion.fecha_fin_campo).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                  <div className="detalle-item">
                    <span className="detalle-label">Invitado el:</span>
                    <span className="detalle-value">
                      {new Date(invitacionSeleccionada.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              {invitacionSeleccionada.estado_invitacion === 'aceptada' && invitacionSeleccionada.fecha_respuesta && (
                <div className="detalle-seccion">
                  <h4>Estado de Invitación</h4>
                  <div className="detalle-grid">
                    <div className="detalle-item">
                      <span className="detalle-label">Aceptada el:</span>
                      <span className="detalle-value">
                        {new Date(invitacionSeleccionada.fecha_respuesta).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => setShowModalDetalle(false)} 
                className="btn-primary"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rechazo */}
      {showModalRechazo && (
        <div className="modal-overlay" onClick={() => setShowModalRechazo(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Rechazar Invitación</h3>
              <button onClick={() => setShowModalRechazo(false)} className="modal-close">✕</button>
            </div>
            
            <div className="modal-body">
              <p>¿Estás seguro que deseas rechazar esta invitación?</p>
              <p className="text-muted">Debes proporcionar un motivo (mínimo 10 caracteres)</p>
              
              <div className="form-group">
                <label>Motivo del rechazo *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Explica por qué rechazas esta invitación..."
                  value={motivoRechazo}
                  onChange={(e) => setMotivoRechazo(e.target.value)}
                  rows="4"
                  minLength="10"
                  required
                />
                <small>{motivoRechazo.length}/10 caracteres mínimo</small>
              </div>
            </div>

            <div className="modal-footer">
              <button 
                onClick={() => setShowModalRechazo(false)} 
                className="btn-cancel"
              >
                Cancelar
              </button>
              <button 
                onClick={handleRechazar}
                disabled={loading || motivoRechazo.length < 10}
                className="btn-danger"
              >
                {loading ? 'Rechazando...' : 'Rechazar Invitación'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}