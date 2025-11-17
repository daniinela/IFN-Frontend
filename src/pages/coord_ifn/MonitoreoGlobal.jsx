// src/pages/coord_ifn/MonitoreoGlobal.jsx
import { useState, useEffect } from 'react';
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
        response = await conglomeradosService.getAll(1, 999, '');
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
    setConglomeradoSeleccionado(conglomerado);
    
    // Si tiene brigada asignada, cargar detalles
    if (conglomerado.jefe_brigada_asignado_id) {
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
  };

  const getColorPorEstado = (estado) => {
    const colores = {
      'en_revision': '#94a3b8',
      'listo_para_asignacion': '#3b82f6',
      'asignado_a_jefe': '#8b5cf6',
      'en_ejecucion': '#f59e0b',
      'finalizado_campo': '#10b981',
      'no_establecido': '#ef4444'
    };
    return colores[estado] || '#6b7280';
  };

  const contarPorEstado = (estado) => {
    return conglomerados.filter(c => c.estado === estado).length;
  };

  return (
    <div className="monitoreo-global">
      <div className="page-header">
        <div>
          <h1>Monitoreo Global</h1>
          <p>Seguimiento en tiempo real de todas las operaciones de campo</p>
        </div>
      </div>

      {error && <ErrorAlert mensaje={error} onClose={() => setError('')} />}

      {/* Filtros */}
      <div className="filters-bar">
        <button
          className={`filter-btn ${filtroEstado === 'todos' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('todos')}
        >
          Todos ({conglomerados.length})
        </button>
        <button
          className={`filter-btn en_revision ${filtroEstado === 'en_revision' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('en_revision')}
        >
          En Revisión ({contarPorEstado('en_revision')})
        </button>
        <button
          className={`filter-btn asignado ${filtroEstado === 'asignado_a_jefe' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('asignado_a_jefe')}
        >
          Asignados ({contarPorEstado('asignado_a_jefe')})
        </button>
        <button
          className={`filter-btn ejecucion ${filtroEstado === 'en_ejecucion' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('en_ejecucion')}
        >
          En Ejecución ({contarPorEstado('en_ejecucion')})
        </button>
        <button
          className={`filter-btn finalizado ${filtroEstado === 'finalizado_campo' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('finalizado_campo')}
        >
          Finalizados ({contarPorEstado('finalizado_campo')})
        </button>
        <button
          className={`filter-btn no-establecido ${filtroEstado === 'no_establecido' ? 'active' : ''}`}
          onClick={() => setFiltroEstado('no_establecido')}
        >
          No Establecidos ({contarPorEstado('no_establecido')})
        </button>
      </div>

      {loading ? (
        <LoadingSpinner mensaje="Cargando mapa..." />
      ) : (
        <>
          {/* Mapa Global */}
          <div className="mapa-global-container">
            <div className="mapa-leyenda">
              <h3>Leyenda</h3>
              {['en_revision', 'listo_para_asignacion', 'asignado_a_jefe', 'en_ejecucion', 'finalizado_campo', 'no_establecido'].map(estado => (
                <div key={estado} className="leyenda-item">
                  <span 
                    className="leyenda-color" 
                    style={{ backgroundColor: getColorPorEstado(estado) }}
                  />
                  <span className="leyenda-text">
                    {estado.replace(/_/g, ' ')} ({contarPorEstado(estado)})
                  </span>
                </div>
              ))}
            </div>

            {/* Aquí iría un mapa con todos los puntos */}
            <div className="mapa-placeholder">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
              <p>Vista de mapa con {conglomerados.length} puntos</p>
              <small>Usa MapboxComponent con múltiples marcadores</small>
            </div>
          </div>

          {/* Tabla de Auditoría */}
          <div className="auditoria-section">
            <h2>Auditoría de Conglomerados</h2>
            
            {conglomerados.length === 0 ? (
              <div className="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
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
                      <th>CAR</th>
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
                                <polyline points="20 6 9 17 4 12" />
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
                        <td>{cong.car_sigla || 'N/A'}</td>
                        <td>
                          {cong.estado === 'no_establecido' && cong.razon_no_establecido && (
                            <span className="razon-no-establecido">
                              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                                <line x1="12" y1="9" x2="12" y2="13" />
                                <line x1="12" y1="17" x2="12.01" y2="17" />
                              </svg>
                              {cong.razon_no_establecido}
                            </span>
                          )}
                        </td>
                        <td>
                          <button 
                            onClick={() => verDetalle(cong)}
                            className="btn-view"
                          >
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

      {/* Modal Detalle */}
      {showModalDetalle && conglomeradoSeleccionado && (
        <div className="modal-overlay" onClick={() => setShowModalDetalle(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalle: {conglomeradoSeleccionado.codigo}</h3>
              <button onClick={() => setShowModalDetalle(false)} className="modal-close">✕</button>
            </div>
            
            <div className="modal-body">
              {/* Mapa */}
              <div className="modal-map">
                <MapboxComponent
                  latitud={conglomeradoSeleccionado.latitud}
                  longitud={conglomeradoSeleccionado.longitud}
                  codigo={conglomeradoSeleccionado.codigo}
                />
              </div>

              {/* Información del Conglomerado */}
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
                    <label>CAR:</label>
                    <span>{conglomeradoSeleccionado.car_sigla || 'No asignado'}</span>
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

                {conglomeradoSeleccionado.estado === 'no_establecido' && (
                  <div className="alert-danger">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                      <line x1="12" y1="9" x2="12" y2="13" />
                      <line x1="12" y1="17" x2="12.01" y2="17" />
                    </svg>
                    <div>
                      <strong>Razón No Establecido:</strong>
                      <p>{conglomeradoSeleccionado.razon_no_establecido}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Información de la Brigada */}
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

              {/* Subparcelas */}
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
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                Sí
                              </span>
                            ) : spf.razon_no_establecida ? (
                              <span className="badge-danger">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
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