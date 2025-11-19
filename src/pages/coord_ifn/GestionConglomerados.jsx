// src/pages/coord_ifn/GestionConglomerados.jsx
import { useState, useEffect, useCallback } from 'react';
import { conglomeradosService } from '../../services/conglomeradosService';
import ModalEditarConglomerado from '../../components/common/ModalEditarConglomerado';
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

  const cargarConglomerados = useCallback(async () => {
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
  }, [page, busqueda]);
  
  useEffect(() => {
    cargarConglomerados();
  }, [cargarConglomerados]);

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

  const verDetalle = async (conglomerado) => {
    try {
      setLoading(true);
      const response = await conglomeradosService.getById(conglomerado.id);
      setConglomeradoSeleccionado(response.data);
      setShowModalDetalle(true);
    } catch (err) {
      console.error('Error cargando detalle:', err);
      setError('Error al cargar el detalle del conglomerado');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoIcon = (estado) => {
    const icons = {
      'en_revision': '🔍',
      'listo_para_asignacion': '✓',
      'asignado_a_jefe': '👤',
      'en_ejecucion': '🚀',
      'finalizado_campo': '✓',
      'no_establecido': '✕'
    };
    return icons[estado] || '•';
  };

  return (
    <div className="gestion-conglomerados">
      {/* PAGE HEADER */}
      <div className="page-header">
        <div>
          <h1>Gestión de Conglomerados</h1>
          <p>Carga, validación y administración de puntos de muestreo</p>
        </div>
        <div className="header-stats">
          <div className="stat-badge">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
            <div>
              <span className="stat-label">Total Conglomerados:</span>
              <span className="stat-value">{conglomerados.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ALERTS */}
      {error && <ErrorAlert mensaje={error} onClose={() => setError('')} />}
      {success && (
        <div className="alert alert-success">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
            <polyline points="22 4 12 14.01 9 11.01"/>
          </svg>
          {success}
          <button onClick={() => setSuccess('')} className="alert-close">✕</button>
        </div>
      )}

      {/* SEARCH & ACTIONS BAR */}
      <div className="actions-bar">
        <div className="search-bar">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Buscar por código de conglomerado..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
          />
        </div>
        <button onClick={() => setShowModalGenerar(true)} className="btn-primary">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="5" y1="12" x2="19" y2="12"/>
          </svg>
          Generar Conglomerados
        </button>
      </div>

      {/* LOADING */}
      {loading && <LoadingSpinner mensaje="Cargando conglomerados..." />}

      {/* EMPTY STATE */}
      {!loading && conglomerados.length === 0 && (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>
          <h3>No hay conglomerados registrados</h3>
          <p>Genera un nuevo lote de conglomerados para comenzar</p>
        </div>
      )}

      {/* CONGLOMERADOS GRID */}
      {!loading && conglomerados.length > 0 && (
        <>
          <div className="conglomerados-grid">
            {conglomerados.map(cong => (
              <div key={cong.id} className="conglomerado-card">
                {/* Card Header */}
                <div className="card-header">
                  <h3>{cong.codigo}</h3>
                  <span className={`badge-estado ${cong.estado}`}>
                    <span className="badge-icon">{getEstadoIcon(cong.estado)}</span>
                    {cong.estado.replace(/_/g, ' ')}
                  </span>
                </div>

                {/* Card Body */}
                <div className="card-body">
                  <div className="info-row">
                    <span className="label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      Latitud:
                    </span>
                    <span className="value">{parseFloat(cong.latitud).toFixed(5)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                        <circle cx="12" cy="10" r="3"/>
                      </svg>
                      Longitud:
                    </span>
                    <span className="value">{parseFloat(cong.longitud).toFixed(5)}</span>
                  </div>
                  <div className="info-row">
                    <span className="label">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                      </svg>
                      Fecha:
                    </span>
                    <span className="value">
                      {new Date(cong.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Ubicación Info */}
                  {(cong.region || cong.departamento || cong.municipio) && (
                    <div className="ubicacion-info">
                      {cong.region && (
                        <div className="ubicacion-item">
                          <strong>Región:</strong>
                          <span>{cong.region.nombre}</span>
                        </div>
                      )}
                      {cong.departamento && (
                        <div className="ubicacion-item">
                          <strong>Departamento:</strong>
                          <span>{cong.departamento.nombre}</span>
                        </div>
                      )}
                      {cong.municipio && (
                        <div className="ubicacion-item">
                          <strong>Municipio:</strong>
                          <span>{cong.municipio.nombre}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Card Footer */}
                <div className="card-footer">
                  <button onClick={() => verDetalle(cong)} className="btn-view">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Ver y Editar Detalle
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="pagination-btn"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"/>
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
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
          )}
        </>
      )}

      {}
      {/* MODAL GENERAR CONGLOMERADOS */}
      {showModalGenerar && (
        <div className="modal-overlay" onClick={() => setShowModalGenerar(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Generar Conglomerados</h3>
              <button onClick={() => setShowModalGenerar(false)} className="modal-close">✕</button>
            </div>
            
            <div className="modal-body">
              <p className="modal-description">
                Genera un lote de conglomerados con coordenadas aleatorias dentro del territorio colombiano
              </p>
              
              <div className="form-group">
                <label className="form-label">Cantidad de Conglomerados (1-500) *</label>
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
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="16" x2="12" y2="12"/>
                  <line x1="12" y1="8" x2="12.01" y2="8"/>
                </svg>
                Se generarán <strong>{cantidad} conglomerados</strong> con 5 subparcelas cada uno
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

      {/* MODAL DETALLE/EDITAR */}
      {showModalDetalle && conglomeradoSeleccionado && (
        <ModalEditarConglomerado
          conglomerado={conglomeradoSeleccionado}
          onClose={() => {
            setShowModalDetalle(false);
            setConglomeradoSeleccionado(null);
          }}
          onSuccess={(msg) => {
            setSuccess(msg);
            setShowModalDetalle(false);
            setConglomeradoSeleccionado(null);
            cargarConglomerados();
          }}
        />
      )}
    </div>
  );
}