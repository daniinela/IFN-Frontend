// src/pages/coordgeoref/MisConglomerados.jsx
import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '../../supabaseClient';
import axios from '../../api/axiosConfig';
import MapboxComponent from '../../components/MapboxComponent';
import './MisConglomerados.css';

function MisConglomerados() {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [conglomerados, setConglomerados] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filtroEstado, setFiltroEstado] = useState(searchParams.get('estado') || 'todos');
  
  // Modal de aprobar/rechazar
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState('aprobar'); // 'aprobar' | 'rechazar'
  const [conglomeradoSeleccionado, setConglomeradoSeleccionado] = useState(null);
  const [municipios, setMunicipios] = useState([]);
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState('');
  const [motivoRechazo, setMotivoRechazo] = useState('');

  const cargarMunicipios = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3003/api/ubicaciones/municipios');
      setMunicipios(response.data);
    } catch (error) {
      console.error('Error cargando municipios:', error);
    }
  }, []);

  const cargarConglomerados = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        setError('No autenticado');
        return;
      }

      const token = session.access_token;
      const limit = 20;

      const response = await axios.get(
        `http://localhost:3001/api/conglomerados/mis-asignados?page=${page}&limit=${limit}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      let conglosFiltrados = response.data.data || [];

      // Aplicar filtros locales
      if (filtroEstado === 'vencidos') {
        conglosFiltrados = conglosFiltrados.filter(c => c.plazo_vencido === true);
      } else if (filtroEstado === 'proximos_vencer') {
        conglosFiltrados = conglosFiltrados.filter(c => 
          c.dias_restantes !== null && c.dias_restantes >= 0 && c.dias_restantes <= 5
        );
      } else if (filtroEstado !== 'todos') {
        conglosFiltrados = conglosFiltrados.filter(c => c.estado === filtroEstado);
      }

      setConglomerados(conglosFiltrados);
      setTotalPages(response.data.totalPages || 1);

    } catch (error) {
      console.error('Error cargando conglomerados:', error);
      setError('Error al cargar conglomerados');
    } finally {
      setLoading(false);
    }
  }, [page, filtroEstado]);

  useEffect(() => {
    cargarConglomerados();
    cargarMunicipios();
  }, [cargarConglomerados, cargarMunicipios]);

  const abrirModalAprobar = (conglomerado) => {
    setConglomeradoSeleccionado(conglomerado);
    setModalAction('aprobar');
    setMunicipioSeleccionado('');
    setShowModal(true);
  };

  const abrirModalRechazar = (conglomerado) => {
    setConglomeradoSeleccionado(conglomerado);
    setModalAction('rechazar');
    setMotivoRechazo('');
    setShowModal(true);
  };

  const aprobarConglomerado = async () => {
    if (!municipioSeleccionado) {
      setError('Debes seleccionar un municipio');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await axios.post(
        `http://localhost:3001/api/conglomerados/${conglomeradoSeleccionado.id}/aprobar`,
        { municipio_id: municipioSeleccionado }
      );

      setSuccess('Conglomerado aprobado exitosamente');
      setShowModal(false);
      cargarConglomerados();
    } catch (error) {
      console.error('Error aprobando:', error);
      setError(error.response?.data?.error || 'Error al aprobar conglomerado');
    } finally {
      setLoading(false);
    }
  };

  const rechazarConglomerado = async () => {
    if (!motivoRechazo.trim()) {
      setError('Debes ingresar un motivo de rechazo');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await axios.post(
        `http://localhost:3001/api/conglomerados/${conglomeradoSeleccionado.id}/rechazar`,
        { motivo: motivoRechazo }
      );

      setSuccess('Conglomerado rechazado');
      setShowModal(false);
      cargarConglomerados();
    } catch (error) {
      console.error('Error rechazando:', error);
      setError(error.response?.data?.error || 'Error al rechazar conglomerado');
    } finally {
      setLoading(false);
    }
  };

  const getDiasClase = (diasRestantes) => {
    if (diasRestantes === null) return '';
    if (diasRestantes < 0) return 'vencido';
    if (diasRestantes <= 3) return 'urgente';
    if (diasRestantes <= 7) return 'proximo';
    return 'normal';
  };

  return (
    <div className="mis-conglomerados-page">
      <div className="page-header">
        <h2 className="page-title">Mis Conglomerados Asignados</h2>
        <p className="page-subtitle">Gestión y validación de puntos de muestreo</p>
      </div>

      {/* Mensajes */}
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

      {/* Filtros */}
      <div className="filters-bar">
        <button
          className={`filter-btn ${filtroEstado === 'todos' ? 'active' : ''}`}
          onClick={() => { setFiltroEstado('todos'); setPage(1); }}
        >
          Todos
        </button>
        <button
          className={`filter-btn ${filtroEstado === 'en_revision' ? 'active' : ''}`}
          onClick={() => { setFiltroEstado('en_revision'); setPage(1); }}
        >
          Pendientes
        </button>
        <button
          className={`filter-btn ${filtroEstado === 'vencidos' ? 'active' : ''}`}
          onClick={() => { setFiltroEstado('vencidos'); setPage(1); }}
        >
          Vencidos
        </button>
        <button
          className={`filter-btn ${filtroEstado === 'proximos_vencer' ? 'active' : ''}`}
          onClick={() => { setFiltroEstado('proximos_vencer'); setPage(1); }}
        >
          Próximos a Vencer
        </button>
        <button
          className={`filter-btn ${filtroEstado === 'aprobado' ? 'active' : ''}`}
          onClick={() => { setFiltroEstado('aprobado'); setPage(1); }}
        >
          Aprobados
        </button>
        <button
          className={`filter-btn ${filtroEstado === 'rechazado_permanente' ? 'active' : ''}`}
          onClick={() => { setFiltroEstado('rechazado_permanente'); setPage(1); }}
        >
          Rechazados
        </button>
      </div>

      {/* Lista de conglomerados */}
      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando conglomerados...</p>
        </div>
      ) : conglomerados.length === 0 ? (
        <div className="empty-state">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <h3>No hay conglomerados</h3>
          <p>No se encontraron conglomerados con los filtros seleccionados</p>
        </div>
      ) : (
        <div className="conglomerados-grid">
          {conglomerados.map(c => (
            <div key={c.id} className="conglo-card">
              <div className="card-header">
                <h3 className="card-title">{c.codigo}</h3>
                {c.dias_restantes !== null && c.estado === 'en_revision' && (
                  <span className={`dias-badge ${getDiasClase(c.dias_restantes)}`}>
                    {c.plazo_vencido ? 'Vencido' : `${c.dias_restantes}d restantes`}
                  </span>
                )}
              </div>

              <div className="card-body">
                <div className="info-row">
                  <span className="info-label">Latitud:</span>
                  <span className="info-value">{c.latitud.toFixed(6)}°</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Longitud:</span>
                  <span className="info-value">{c.longitud.toFixed(6)}°</span>
                </div>
                <div className="info-row">
                  <span className="info-label">Asignado:</span>
                  <span className="info-value">{new Date(c.fecha_asignacion).toLocaleDateString()}</span>
                </div>
                {c.fecha_limite_revision && (
                  <div className="info-row">
                    <span className="info-label">Límite:</span>
                    <span className="info-value">{new Date(c.fecha_limite_revision).toLocaleDateString()}</span>
                  </div>
                )}
              </div>

              {c.estado === 'en_revision' && (
                <div className="card-actions">
                  <button onClick={() => abrirModalAprobar(c)} className="btn-approve">
                    Aprobar
                  </button>
                  <button onClick={() => abrirModalRechazar(c)} className="btn-reject">
                    Rechazar
                  </button>
                </div>
              )}

              {c.estado === 'aprobado' && (
                <div className="card-status success">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Aprobado
                </div>
              )}

              {c.estado === 'rechazado_permanente' && (
                <div className="card-status danger">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                  Rechazado
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="pagination">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="pagination-btn"
          >
            Anterior
          </button>
          <span className="pagination-info">Página {page} de {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="pagination-btn"
          >
            Siguiente
          </button>
        </div>
      )}

      {/* Modal Aprobar/Rechazar */}
      {showModal && conglomeradoSeleccionado && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {modalAction === 'aprobar' ? 'Aprobar Conglomerado' : 'Rechazar Conglomerado'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-body">
              <div className="modal-info">
                <strong>Código:</strong> {conglomeradoSeleccionado.codigo}
              </div>

              {/* Mapa */}
              <div className="modal-map">
                <MapboxComponent
                  latitud={conglomeradoSeleccionado.latitud}
                  longitud={conglomeradoSeleccionado.longitud}
                  codigo={conglomeradoSeleccionado.codigo}
                />
              </div>

              {modalAction === 'aprobar' ? (
                <div className="form-group">
                  <label className="form-label">Asignar Municipio: *</label>
                  <select
                    value={municipioSeleccionado}
                    onChange={e => setMunicipioSeleccionado(e.target.value)}
                    className="form-select"
                  >
                    <option value="">-- Selecciona un municipio --</option>
                    {municipios.map(m => (
                      <option key={m.id} value={m.id}>{m.nombre}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Motivo del Rechazo: *</label>
                  <textarea
                    value={motivoRechazo}
                    onChange={e => setMotivoRechazo(e.target.value)}
                    className="form-textarea"
                    rows="4"
                    placeholder="Explica por qué rechazas este conglomerado..."
                  />
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button className="btn-modal btn-cancel" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
              <button
                className={`btn-modal ${modalAction === 'aprobar' ? 'btn-success' : 'btn-danger'}`}
                onClick={modalAction === 'aprobar' ? aprobarConglomerado : rechazarConglomerado}
                disabled={loading}
              >
                {loading ? 'Procesando...' : modalAction === 'aprobar' ? 'Confirmar Aprobación' : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MisConglomerados;