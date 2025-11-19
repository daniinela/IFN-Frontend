// src/pages/coord_ifn/MonitoreoGlobal.jsx
import { useState, useEffect, useRef } from 'react';
import { conglomeradosService } from '../../services/conglomeradosService';
import { brigadasService } from '../../services/brigadasService';
import LeafletMapComponent from '../../components/common/LeafletMapComponent';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import './MonitoreoGlobal.css';

export default function MonitoreoGlobal() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [conglomerados, setConglomerados] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [conglomeradoSeleccionado, setConglomeradoSeleccionado] = useState(null);
  const [showModalDetalle, setShowModalDetalle] = useState(false);
  const [brigadaDetalle, setBrigadaDetalle] = useState(null);

  useEffect(() => {
    cargarConglomerados();
  }, [filtroEstado]);

  const cargarConglomerados = async () => {
    try {
      setLoading(true);
      setError('');
      
      let response;
      if (filtroEstado === 'todos') {
        response = await conglomeradosService.getAll(1, 9999, '');
        setConglomerados(response.data.data);
      } else {
        response = await conglomeradosService.getByEstado(filtroEstado);
        setConglomerados(response.data);
      }
    } catch (err) {
      console.error('Error cargando conglomerados:', err);
      setError(err.response?.data?.error || 'Error al cargar conglomerados');
    } finally {
      setLoading(false);
    }
  };

  const verDetalle = async (conglomerado) => {
    try {
      const congResponse = await conglomeradosService.getById(conglomerado.id);
      setConglomeradoSeleccionado(congResponse.data);
      
      if (conglomerado.jefe_brigada_asignado_id || conglomerado.brigada_expedicion_id) {
        try {
          const brigadaResponse = await brigadasService.getAll();
          const brigada = brigadaResponse.data.find(
            b => b.conglomerado_id === conglomerado.id
          );
          setBrigadaDetalle(brigada);
        } catch (err) {
          console.error('Error cargando brigada:', err);
          setBrigadaDetalle(null);
        }
      } else {
        setBrigadaDetalle(null);
      }
      
      setShowModalDetalle(true);
    } catch (err) {
      console.error('Error cargando detalle:', err);
      setError('Error al cargar el detalle del conglomerado');
    }
  };

  const getColorPorEstado = (estado) => {
    const colores = {
      'en_revision': '#94a3b8',
      'rechazado': '#ef4444',
      'listo_para_asignacion': '#3b82f6',
      'asignado_a_jefe': '#8b5cf6',
      'en_ejecucion': '#f59e0b',
      'finalizado_campo': '#10b981',
      'no_establecido': '#6b7280'
    };
    return colores[estado] || '#6b7280';
  };

  const contarPorEstado = (estado) => {
    return conglomerados.filter(c => c.estado === estado).length;
  };

  const estadosDisponibles = [
    { key: 'en_revision', label: 'En Revisión', icon: '🔍' },
    { key: 'asignado_a_jefe', label: 'Asignados', icon: '👤' },
    { key: 'en_ejecucion', label: 'En Ejecución', icon: '🚀' },
    { key: 'finalizado_campo', label: 'Finalizados', icon: '✓' },
    { key: 'no_establecido', label: 'No Establecidos', icon: '✕' }
  ];

  return (
    <div className="monitoreo-global">
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1>Monitoreo Global</h1>
          <p>Seguimiento en tiempo real de todas las operaciones de campo</p>
        </div>
        <div className="header-stats">
          <div className="stat-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <div>
              <span className="stat-label">Total:</span>
              <span className="stat-value">{conglomerados.length}</span>
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorAlert mensaje={error} onClose={() => setError('')} />}

      {/* FILTERS BAR */}
      <div className="filters-bar">
        <button
          className={`filter-btn ${filtroEstado === 'todos' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('todos')}
        >
          <span className="filter-icon">📊</span>
          Todos ({conglomerados.length})
        </button>
        {estadosDisponibles.map(({ key, label, icon }) => (
          <button
            key={key}
            className={`filter-btn ${filtroEstado === key ? 'active' : ''}`}
            onClick={() => setFiltroEstado(key)}
          >
            <span className="filter-icon">{icon}</span>
            {label} ({contarPorEstado(key)})
          </button>
        ))}
      </div>

      {loading ? (
        <LoadingSpinner mensaje="Cargando mapa..." />
      ) : (
        <>
          {/* MAPA GLOBAL */}
          <div className="mapa-global-container">
            <div className="mapa-leyenda">
              <h3>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                Leyenda
              </h3>
              {['en_revision', 'listo_para_asignacion', 'asignado_a_jefe', 'en_ejecucion', 'finalizado_campo', 'no_establecido'].map(estado => (
                <div key={estado} className="leyenda-item">
                  <span 
                    className="leyenda-color" 
                    style={{ backgroundColor: getColorPorEstado(estado) }}
                  />
                  <span className="leyenda-text">
                    {estado.replace(/_/g, ' ')}
                  </span>
                  <span className="leyenda-count">({contarPorEstado(estado)})</span>
                </div>
              ))}
            </div>

            <div className="mapa-global-wrapper">
              {conglomerados.length > 0 ? (
                <MapaGlobalLeaflet 
                  conglomerados={conglomerados}
                  onMarkerClick={verDetalle}
                  getColorPorEstado={getColorPorEstado}
                />
              ) : (
                <div className="mapa-placeholder">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  <p>No hay conglomerados para mostrar</p>
                </div>
              )}
            </div>
          </div>

          {/* AUDITORIA SECTION */}
          <div className="auditoria-section">
            <div className="section-header">
              <div className="section-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                </svg>
              </div>
              <div>
                <h2>Auditoría de Conglomerados</h2>
                <p>Registro detallado de estados y asignaciones</p>
              </div>
            </div>
            
            {conglomerados.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <h3>No hay conglomerados</h3>
                <p>No hay conglomerados con el filtro seleccionado</p>
              </div>
            ) : (
              <div className="tabla-auditoria">
                <table>
                  <thead>
                    <tr>
                      <th>Código</th>
                      <th>Estado</th>
                      <th>Jefe Asignado</th>
                      <th>Fecha Asignación</th>
                      <th>Región</th>
                      <th>Observaciones</th>
                      <th>Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {conglomerados.map(cong => (
                      <tr key={cong.id}>
                        <td className="codigo">{cong.codigo}</td>
                        <td>
                          <span 
                            className="badge-estado"
                            style={{ backgroundColor: getColorPorEstado(cong.estado) }}
                          >
                            {cong.estado.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td>
                          {cong.jefe_brigada_asignado_id ? (
                            <span className="jefe-info">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <polyline points="20 6 9 17 4 12"/>
                              </svg>
                              Asignado
                            </span>
                          ) : (
                            <span className="sin-asignar">Sin asignar</span>
                          )}
                        </td>
                        <td>
                          {cong.fecha_asignacion ? 
                            new Date(cong.fecha_asignacion).toLocaleDateString() : 
                            '-'
                          }
                        </td>
                        <td>{cong.region_id ? 'Asignada' : 'Sin asignar'}</td>
                        <td>
                          {cong.estado === 'no_establecido' && cong.razon_no_establecido && (
                            <span className="razon-no-establecido">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                                <line x1="12" y1="9" x2="12" y2="13"/>
                                <line x1="12" y1="17" x2="12.01" y2="17"/>
                              </svg>
                              {cong.razon_no_establecido.substring(0, 50)}...
                            </span>
                          )}
                        </td>
                        <td>
                          <button 
                            onClick={() => verDetalle(cong)}
                            className="btn-view"
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                              <circle cx="12" cy="12" r="3"/>
                            </svg>
                            Ver Detalle
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {}
      {/* MODAL DETALLE */}
      {showModalDetalle && conglomeradoSeleccionado && (
        <div className="modal-overlay" onClick={() => setShowModalDetalle(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalle: {conglomeradoSeleccionado.codigo}</h3>
              <button onClick={() => setShowModalDetalle(false)} className="modal-close">✕</button>
            </div>
            
            <div className="modal-body">
              <div className="modal-map">
                <LeafletMapComponent
                  latitud={conglomeradoSeleccionado.latitud}
                  longitud={conglomeradoSeleccionado.longitud}
                  codigo={conglomeradoSeleccionado.codigo}
                  subparcelas={conglomeradoSeleccionado.conglomerados_subparcelas || []}
                  height="400px"
                />
              </div>

              <div className="detalle-section">
                <h4>Información del Conglomerado</h4>
                <div className="info-grid">
                  <div className="info-item">
                    <label>Estado:</label>
                    <span 
                      className="badge-estado"
                      style={{ backgroundColor: getColorPorEstado(conglomeradoSeleccionado.estado) }}
                    >
                      {conglomeradoSeleccionado.estado.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <div className="info-item">
                    <label>Fecha Creación:</label>
                    <span>{new Date(conglomeradoSeleccionado.created_at).toLocaleString()}</span>
                  </div>
                  {conglomeradoSeleccionado.fecha_asignacion && (
                    <div className="info-item">
                      <label>Fecha Asignación:</label>
                      <span>{new Date(conglomeradoSeleccionado.fecha_asignacion).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {conglomeradoSeleccionado.estado === 'no_establecido' && conglomeradoSeleccionado.razon_no_establecido && (
                  <div className="alert alert-danger">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                      <line x1="12" y1="9" x2="12" y2="13"/>
                      <line x1="12" y1="17" x2="12.01" y2="17"/>
                    </svg>
                    <div>
                      <strong>Razón No Establecido:</strong>
                      <p>{conglomeradoSeleccionado.razon_no_establecido}</p>
                    </div>
                  </div>
                )}
              </div>

              {brigadaDetalle && (
                <div className="detalle-section">
                  <h4>Información de la Brigada</h4>
                  <div className="info-grid">
                    <div className="info-item">
                      <label>Estado Brigada:</label>
                      <span className="badge-estado-brigada">{brigadaDetalle.estado}</span>
                    </div>
                    <div className="info-item">
                      <label>Fecha Inicio Campo:</label>
                      <span>
                        {brigadaDetalle.fecha_inicio_campo ? 
                          new Date(brigadaDetalle.fecha_inicio_campo).toLocaleDateString() : 
                          'Sin registrar'
                        }
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Fecha Fin Campo:</label>
                      <span>
                        {brigadaDetalle.fecha_fin_campo ? 
                          new Date(brigadaDetalle.fecha_fin_campo).toLocaleDateString() : 
                          'Sin registrar'
                        }
                      </span>
                    </div>
                    <div className="info-item">
                      <label>Miembros:</label>
                      <span>{brigadaDetalle.brigadas_rol_operativo?.length || 0} miembros</span>
                    </div>
                  </div>

                  {brigadaDetalle.brigadas_rol_operativo && brigadaDetalle.brigadas_rol_operativo.length > 0 && (
                    <div className="miembros-brigada">
                      <h5>Miembros de la Brigada</h5>
                      <ul>
                        {brigadaDetalle.brigadas_rol_operativo.map((miembro, idx) => (
                          <li key={miembro.id || idx}>
                            <strong>{miembro.rol_operativo}:</strong> {miembro.usuario_id}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {conglomeradoSeleccionado.conglomerados_subparcelas && (
                <div className="detalle-section">
                  <h4>Subparcelas</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>SPF</th>
                        <th>Lat. Prediligenciada</th>
                        <th>Lon. Prediligenciada</th>
                        <th>Establecida</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conglomeradoSeleccionado.conglomerados_subparcelas.map(spf => (
                        <tr key={spf.id}>
                          <td>SPF{spf.subparcela_num}</td>
                          <td>{spf.latitud_prediligenciada}</td>
                          <td>{spf.longitud_prediligenciada}</td>
                          <td>
                            {spf.se_establecio ? (
                              <span className="badge-success">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12"/>
                                </svg>
                                Sí
                              </span>
                            ) : spf.razon_no_establecida ? (
                              <span className="badge-danger">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18"/>
                                  <line x1="6" y1="6" x2="18" y2="18"/>
                                </svg>
                                No ({spf.razon_no_establecida})
                              </span>
                            ) : (
                              <span className="badge-pending">Pendiente</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowModalDetalle(false)} className="btn-primary">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Componente Mapa Global con Leaflet
function MapaGlobalLeaflet({ conglomerados, onMarkerClick, getColorPorEstado }) {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    if (!mapContainer.current || conglomerados.length === 0) return;

    if (mapInstance.current) {
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const L = window.L;
    if (!L) return;

    const validCoords = conglomerados
      .map(c => ({ lat: parseFloat(c.latitud), lng: parseFloat(c.longitud) }))
      .filter(c => !isNaN(c.lat) && !isNaN(c.lng));

    if (validCoords.length === 0) return;

    const centerLat = validCoords.reduce((sum, c) => sum + c.lat, 0) / validCoords.length;
    const centerLng = validCoords.reduce((sum, c) => sum + c.lng, 0) / validCoords.length;

    const map = L.map(mapContainer.current).setView([centerLat, centerLng], 6);
    mapInstance.current = map;

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19
    }).addTo(map);

    const bounds = [];
    conglomerados.forEach(cong => {
      const lat = parseFloat(cong.latitud);
      const lng = parseFloat(cong.longitud);
      
      if (isNaN(lat) || isNaN(lng)) return;

      const color = getColorPorEstado(cong.estado);
      
      const icon = L.divIcon({
        className: 'custom-marker-small',
        html: `<div style="width:16px;height:16px;background:${color};border:2px solid white;border-radius:50%;box-shadow:0 2px 4px rgba(0,0,0,0.3);"></div>`,
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marker = L.marker([lat, lng], { icon }).addTo(map);
      
      marker.bindPopup(`
        <div style="padding:8px;min-width:150px;">
          <strong>${cong.codigo}</strong><br/>
          <span style="font-size:11px;color:#666;">${cong.estado.replace(/_/g, ' ')}</span><br/>
          <button onclick="window.verDetalleConglomerado('${cong.id}')" 
                  style="margin-top:6px;padding:4px 8px;background:#3b82f6;color:white;border:none;border-radius:4px;cursor:pointer;font-size:11px;">
            Ver Detalle
          </button>
        </div>
      `);

      bounds.push([lat, lng]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 12 });
    }

    window.verDetalleConglomerado = (congId) => {
      const cong = conglomerados.find(c => c.id === congId);
      if (cong) onMarkerClick(cong);
    };

    setTimeout(() => {
      if (mapInstance.current) {
        mapInstance.current.invalidateSize();
      }
    }, 100);

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
      delete window.verDetalleConglomerado;
    };
  }, [conglomerados, onMarkerClick, getColorPorEstado]);

  return (
    <div 
      ref={mapContainer} 
      style={{ 
        height: '100%', 
        width: '100%',
        borderRadius: '12px',
        overflow: 'hidden'
      }} 
    />
  );
}