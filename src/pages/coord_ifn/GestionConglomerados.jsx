// src/pages/coord_ifn/GestionConglomerados.jsx
import { useState, useEffect } from 'react';
import { conglomeradosService } from '../../services/conglomeradosService';
import MapboxComponent from '../../components/MapboxComponent';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';
import './GestionConglomerados.css';

export default function GestionConglomerados() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [conglomerados, setConglomerados] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  
  const [showModalGenerar, setShowModalGenerar] = useState(false);
  const [cantidad, setCantidad] = useState(100);
  
  const [showModalDetalle, setShowModalDetalle] = useState(false);
  const [conglomeradoSeleccionado, setConglomeradoSeleccionado] = useState(null);

  useEffect(() => {
    cargarConglomerados();
  }, [page, busqueda]);

  const cargarConglomerados = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await conglomeradosService.getAll(page, 20, busqueda);
      setConglomerados(response.data.data);
      setTotalPages(response.data.totalPages);
    } catch (err) {
      console.error('Error cargando conglomerados:', err);
      setError(err.response?.data?.error || 'Error al cargar conglomerados');
    } finally {
      setLoading(false);
    }
  };

  const generarBatch = async () => {
    if (cantidad < 1 || cantidad > 500) {
      setError('La cantidad debe estar entre 1 y 500');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      await conglomeradosService.generarBatch(cantidad);
      
      setSuccess(`${cantidad} conglomerados generados exitosamente`);
      setShowModalGenerar(false);
      setCantidad(100);
      cargarConglomerados();
    } catch (err) {
      console.error('Error generando conglomerados:', err);
      setError(err.response?.data?.error || 'Error al generar conglomerados');
    } finally {
      setLoading(false);
    }
  };

  const aprobarConglomerado = async (id) => {
    try {
      setLoading(true);
      setError('');
      
      await conglomeradosService.cambiarEstado(id, 'listo_para_asignacion');
      
      setSuccess('Conglomerado aprobado para asignación');
      setShowModalDetalle(false);
      cargarConglomerados();
    } catch (err) {
      console.error('Error aprobando:', err);
      setError(err.response?.data?.error || 'Error al aprobar conglomerado');
    } finally {
      setLoading(false);
    }
  };

  const rechazarConglomerado = async (id, motivo) => {
    if (!motivo || motivo.trim().length < 10) {
      setError('El motivo debe tener al menos 10 caracteres');
      return;
    }

    try {
      setLoading(true);
      setError('');
      
      await conglomeradosService.cambiarEstado(id, 'no_establecido');
      
      setSuccess('Conglomerado rechazado');
      setShowModalDetalle(false);
      cargarConglomerados();
    } catch (err) {
      console.error('Error rechazando:', err);
      setError(err.response?.data?.error || 'Error al rechazar conglomerado');
    } finally {
      setLoading(false);
    }
  };

  const verDetalle = (conglomerado) => {
    setConglomeradoSeleccionado(conglomerado);
    setShowModalDetalle(true);
  };

  return (
    <div className="gestion-conglomerados">
      <div className="page-header">
        <div>
          <h1>Gestión de Conglomerados</h1>
          <p>Carga y validación de puntos de muestreo</p>
        </div>
        <button onClick={() => setShowModalGenerar(true)} className="btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Generar Conglomerados
        </button>
      </div>

      {error && <ErrorAlert mensaje={error} onClose={() => setError('')} />}
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

      <div className="search-bar">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          type="text"
          placeholder="Buscar por código..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {loading ? (
        <LoadingSpinner mensaje="Cargando conglomerados..." />
      ) : conglomerados.length === 0 ? (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <h3>No hay conglomerados registrados</h3>
          <p>Genera un nuevo lote de conglomerados para comenzar</p>
        </div>
      ) : (
        <>
          <div className="conglomerados-table">
            <table>
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Latitud</th>
                  <th>Longitud</th>
                  <th>Estado</th>
                  <th>CAR</th>
                  <th>Fecha Creación</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {conglomerados.map(cong => (
                  <tr key={cong.id}>
                    <td className="codigo">{cong.codigo}</td>
                    <td>{cong.latitud}</td>
                    <td>{cong.longitud}</td>
                    <td>
                      <span className={`badge-estado ${cong.estado}`}>
                        {cong.estado.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>{cong.car_sigla || 'N/A'}</td>
                    <td>{new Date(cong.created_at).toLocaleDateString()}</td>
                    <td>
                      <button onClick={() => verDetalle(cong)} className="btn-view">
                        Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="pagination-btn"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
                Anterior
              </button>
              <span className="pagination-info">Página {page} de {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="pagination-btn"
              >
                Siguiente
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal Generar */}
      {showModalGenerar && (
        <div className="modal-overlay" onClick={() => setShowModalGenerar(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Generar Conglomerados</h3>
              <button onClick={() => setShowModalGenerar(false)} className="modal-close">✕</button>
            </div>
            
            <div className="modal-body">
              <p className="modal-description">Genera un lote de conglomerados con coordenadas aleatorias dentro de Colombia</p>
              
              <div className="form-group">
                <label className="form-label">Cantidad (1-500) *</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={cantidad}
                  onChange={(e) => setCantidad(parseInt(e.target.value))}
                  className="form-input"
                />
              </div>

              <div className="alert alert-info">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Se generarán {cantidad} conglomerados con 5 subparcelas cada uno
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowModalGenerar(false)} className="btn-cancel">
                Cancelar
              </button>
              <button onClick={generarBatch} disabled={loading} className="btn-primary">
                {loading ? 'Generando...' : 'Generar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle */}
      {showModalDetalle && conglomeradoSeleccionado && (
        <div className="modal-overlay" onClick={() => setShowModalDetalle(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalle Conglomerado: {conglomeradoSeleccionado.codigo}</h3>
              <button onClick={() => setShowModalDetalle(false)} className="modal-close">✕</button>
            </div>
            
            <div className="modal-body">
              <div className="modal-map">
                <MapboxComponent
                  latitud={conglomeradoSeleccionado.latitud}
                  longitud={conglomeradoSeleccionado.longitud}
                  codigo={conglomeradoSeleccionado.codigo}
                />
              </div>

              <div className="info-grid">
                <div className="info-item">
                  <label>Estado:</label>
                  <span className={`badge-estado ${conglomeradoSeleccionado.estado}`}>
                    {conglomeradoSeleccionado.estado.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="info-item">
                  <label>CAR:</label>
                  <span>{conglomeradoSeleccionado.car_sigla || 'No asignado'}</span>
                </div>
                <div className="info-item">
                  <label>Latitud:</label>
                  <span>{conglomeradoSeleccionado.latitud}</span>
                </div>
                <div className="info-item">
                  <label>Longitud:</label>
                  <span>{conglomeradoSeleccionado.longitud}</span>
                </div>
              </div>

              {conglomeradoSeleccionado.conglomerados_subparcelas && (
                <div className="subparcelas-info">
                  <h4>Subparcelas Prediligenciadas</h4>
                  <table>
                    <thead>
                      <tr>
                        <th>SPF</th>
                        <th>Latitud</th>
                        <th>Longitud</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conglomeradoSeleccionado.conglomerados_subparcelas.map(spf => (
                        <tr key={spf.id}>
                          <td>SPF{spf.subparcela_num}</td>
                          <td>{spf.latitud_prediligenciada}</td>
                          <td>{spf.longitud_prediligenciada}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {conglomeradoSeleccionado.estado === 'en_revision' && (
                <>
                  <button 
                    onClick={() => aprobarConglomerado(conglomeradoSeleccionado.id)} 
                    className="btn-success"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    Aprobar para Asignación
                  </button>
                  <button 
                    onClick={() => {
                      const motivo = prompt('Motivo del rechazo (mínimo 10 caracteres):');
                      if (motivo) {
                        rechazarConglomerado(conglomeradoSeleccionado.id, motivo);
                      }
                    }}
                    className="btn-danger"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18" />
                      <line x1="6" y1="6" x2="18" y2="18" />
                    </svg>
                    Rechazar
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}