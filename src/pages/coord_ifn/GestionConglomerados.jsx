// src/pages/coord_ifn/GestionConglomerados.jsx
import { useState, useEffect } from 'react';
import { conglomeradosService } from '../../services/conglomeradosService';
import MapboxComponent from '../../components/MapboxComponent';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorAlert from '../../components/common/ErrorAlert';

const CORPORACIONES = [
  { sigla: 'CAR', nombre: 'CAR - Cundinamarca' },
  { sigla: 'CVC', nombre: 'CVC - Valle del Cauca' },
  { sigla: 'CORANTIOQUIA', nombre: 'CORANTIOQUIA - Centro de Antioquia' },
  { sigla: 'CORNARE', nombre: 'CORNARE - Ríos Negro y Nare' },
  { sigla: 'CARDIQUE', nombre: 'CARDIQUE - Canal del Dique' },
  { sigla: 'CORPOGUAJIRA', nombre: 'CORPOGUAJIRA - La Guajira' },
  { sigla: 'CORPOAMAZONIA', nombre: 'CORPOAMAZONIA - Sur de la Amazonia' },
  { sigla: 'CDA', nombre: 'CDA - San Andrés' }
];

export default function GestionConglomerados() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [conglomerados, setConglomerados] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [busqueda, setBusqueda] = useState('');
  
  // Modal generación batch
  const [showModalGenerar, setShowModalGenerar] = useState(false);
  const [cantidad, setCantidad] = useState(100);
  
  // Modal detalle conglomerado
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
      
      // Marcar como no establecido con el motivo
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
          ➕ Generar Conglomerados
        </button>
      </div>

      {/* Mensajes */}
      {error && <ErrorAlert mensaje={error} onClose={() => setError('')} />}
      {success && (
        <div className="alert-success">
          ✅ {success}
          <button onClick={() => setSuccess('')}>✕</button>
        </div>
      )}

      {/* Búsqueda */}
      <div className="search-bar">
        <input
          type="text"
          placeholder="Buscar por código..."
          value={busqueda}
          onChange={(e) => setBusqueda(e.target.value)}
        />
      </div>

      {/* Lista de Conglomerados */}
      {loading ? (
        <LoadingSpinner mensaje="Cargando conglomerados..." />
      ) : conglomerados.length === 0 ? (
        <div className="empty-state">
          <p>No hay conglomerados registrados</p>
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

          {/* Paginación */}
          {totalPages > 1 && (
            <div className="pagination">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                ← Anterior
              </button>
              <span>Página {page} de {totalPages}</span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
              >
                Siguiente →
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal Generar Batch */}
      {showModalGenerar && (
        <div className="modal-overlay" onClick={() => setShowModalGenerar(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Generar Conglomerados</h3>
              <button onClick={() => setShowModalGenerar(false)}>✕</button>
            </div>
            
            <div className="modal-body">
              <p>Genera un lote de conglomerados con coordenadas aleatorias dentro de Colombia</p>
              
              <div className="form-group">
                <label>Cantidad (1-500) *</label>
                <input
                  type="number"
                  min="1"
                  max="500"
                  value={cantidad}
                  onChange={(e) => setCantidad(parseInt(e.target.value))}
                />
              </div>

              <div className="alert-info">
                ℹ️ Se generarán {cantidad} conglomerados con 5 subparcelas cada uno
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
              <button onClick={() => setShowModalDetalle(false)}>✕</button>
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

              {/* Información */}
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

              {/* Subparcelas */}
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
                    ✓ Aprobar para Asignación
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
                    ✕ Rechazar
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