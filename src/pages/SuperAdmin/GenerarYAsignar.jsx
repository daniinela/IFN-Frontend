// src/pages/superadmin/GenerarYAsignar.jsx
import { useState, useEffect, useCallback } from 'react';
import axios from '../../api/axiosConfig';
import './GenerarYAsignar.css';

function GenerarYAsignar() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('generar');
  
  const [cantidad, setCantidad] = useState(50);
  const [coordinadores, setCoordinadores] = useState([]);
  const [coordSeleccionado, setCoordSeleccionado] = useState('');
  const [cantidadAsignar, setCantidadAsignar] = useState(50);
  const [plazoDias, setPlazoDias] = useState(30);
  const [asignacionesActivas, setAsignacionesActivas] = useState([]);
  const [conglomerados, setConglomerados] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [busqueda, setBusqueda] = useState('');

  const cargarCoordinadores = useCallback(async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/usuarios?rol=coord_georef');
      setCoordinadores(response.data);
    } catch (err) {
      console.error('Error cargando coordinadores:', err);
    }
  }, []);

  const cargarAsignaciones = useCallback(async () => {
    try {
      setAsignacionesActivas([]);
    } catch (err) {
      console.error('Error cargando asignaciones:', err);
    }
  }, []);

  const cargarConglomerados = useCallback(async () => {
    try {
      setLoading(true);
      const limit = 50;
      const offset = (page - 1) * limit;
      
      let url = `http://localhost:3001/api/conglomerados?limit=${limit}&offset=${offset}`;
      
      if (filtroEstado !== 'todos') {
        url += `&estado=${filtroEstado}`;
      }
      
      if (busqueda) {
        url += `&search=${busqueda}`;
      }
      
      const response = await axios.get(url);
      
      setConglomerados(response.data.data || []);
      setTotalPages(Math.ceil((response.data.total || 0) / limit));
    } catch (err) {
      console.error('Error cargando conglomerados:', err);
      setError('Error al cargar conglomerados');
    } finally {
      setLoading(false);
    }
  }, [page, filtroEstado, busqueda]);

  useEffect(() => {
    if (activeTab === 'asignar') {
      cargarCoordinadores();
      cargarAsignaciones();
    } else if (activeTab === 'ver') {
      cargarConglomerados();
    }
  }, [activeTab, cargarCoordinadores, cargarAsignaciones, cargarConglomerados]);

  const generarBatch = async () => {
    if (cantidad < 1 || cantidad > 1500) {
      setError('La cantidad debe estar entre 1 y 1500');
      return;
    }
    if (!confirm(`¿Confirmas generar ${cantidad} conglomerados?`)) {
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await axios.post('http://localhost:3001/api/conglomerados/generar-batch', {
        cantidad
      });

      setSuccess(`${cantidad} conglomerados generados exitosamente`);
      setCantidad(50);
    } catch (err) {
      console.error('Error generando:', err);
      setError(err.response?.data?.error || 'Error al generar conglomerados');
    } finally {
      setLoading(false);
    }
  };

  const asignarLote = async () => {
    if (!coordSeleccionado) {
      setError('Debes seleccionar un coordinador');
      return;
    }

    if (cantidadAsignar < 1 || cantidadAsignar > 200) {
      setError('La cantidad a asignar debe estar entre 1 y 200');
      return;
    }

    if (plazoDias < 1 || plazoDias > 90) {
      setError('El plazo debe estar entre 1 y 90 días');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await axios.post('http://localhost:3001/api/conglomerados/asignar-a-coordinador', {
        coord_id: coordSeleccionado,
        cantidad: cantidadAsignar,
        plazo_dias: plazoDias
      });

      setSuccess(`Lote de ${cantidadAsignar} conglomerados asignado exitosamente`);
      setCoordSeleccionado('');
      setCantidadAsignar(50);
      setPlazoDias(30);
      cargarAsignaciones();
    } catch (err) {
      console.error('Error asignando:', err);
      setError(err.response?.data?.error || 'Error al asignar lote');
    } finally {
      setLoading(false);
    }
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      sin_asignar: { class: 'badge-gray', text: 'Sin Asignar' },
      en_revision: { class: 'badge-blue', text: 'En Revisión' },
      aprobado: { class: 'badge-green', text: 'Aprobado' },
      rechazado_temporal: { class: 'badge-yellow', text: 'Rechazado Temporal' },
      rechazado_permanente: { class: 'badge-red', text: 'Rechazado Permanente' }
    };
    return badges[estado] || { class: 'badge-gray', text: estado };
  };

  const renderGenerar = () => (
    <div className="tab-content-section">
      <div className="section-header">
        <div>
          <h3 className="section-title">Generar Conglomerados</h3>
          <p className="section-description">
            Crear nuevos puntos de muestreo. Máximo 1500 conglomerados por lote.
          </p>
        </div>
      </div>

      <div className="form-card">
        <div className="form-group">
          <label className="form-label">Cantidad a generar</label>
          <input
            type="number"
            min="1"
            max="1500"
            value={cantidad}
            onChange={(e) => setCantidad(parseInt(e.target.value))}
            className="form-input"
            placeholder="Ej: 100"
          />
          <small className="form-help">Máximo 1500 conglomerados por lote</small>
        </div>

        <button
          onClick={generarBatch}
          disabled={loading}
          className="btn-primary btn-large"
        >
          {loading ? 'Generando...' : `Generar ${cantidad} Conglomerados`}
        </button>
      </div>
    </div>
  );

  const renderAsignar = () => (
    <div className="tab-content-section">
      <div className="section-header">
        <div>
          <h3 className="section-title">Asignar Lotes a Coordinadores</h3>
          <p className="section-description">
            Distribuir conglomerados sin asignar a coordinadores de georreferenciación.
          </p>
        </div>
      </div>

      <div className="form-card">
        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Coordinador</label>
            <select
              value={coordSeleccionado}
              onChange={(e) => setCoordSeleccionado(e.target.value)}
              className="form-select"
            >
              <option value="">-- Selecciona un coordinador --</option>
              {coordinadores.map(coord => (
                <option key={coord.id} value={coord.id}>
                  {coord.nombre_completo}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Cantidad a asignar</label>
            <input
              type="number"
              min="1"
              max="200"
              value={cantidadAsignar}
              onChange={(e) => setCantidadAsignar(parseInt(e.target.value))}
              className="form-input"
              placeholder="Ej: 50"
            />
            <small className="form-help">Máximo 200 por asignación</small>
          </div>

          <div className="form-group">
            <label className="form-label">Plazo (días)</label>
            <input
              type="number"
              min="1"
              max="90"
              value={plazoDias}
              onChange={(e) => setPlazoDias(parseInt(e.target.value))}
              className="form-input"
              placeholder="Ej: 30"
            />
            <small className="form-help">Días para completar la revisión</small>
          </div>
        </div>

        <button
          onClick={asignarLote}
          disabled={loading}
          className="btn-success btn-large"
        >
          {loading ? 'Asignando...' : 'Asignar Lote'}
        </button>
      </div>

      {asignacionesActivas.length > 0 && (
        <div className="table-section">
          <h4 className="subsection-title">Asignaciones Activas</h4>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Coordinador</th>
                  <th>Asignados</th>
                  <th>Revisados</th>
                  <th>Vencidos</th>
                  <th>Fecha Límite</th>
                </tr>
              </thead>
              <tbody>
                {asignacionesActivas.map((asig, index) => (
                  <tr key={index}>
                    <td>{asig.coordinador_nombre}</td>
                    <td>{asig.total_asignados}</td>
                    <td>{asig.revisados}</td>
                    <td className={asig.vencidos > 0 ? 'text-danger' : ''}>
                      {asig.vencidos}
                    </td>
                    <td>{new Date(asig.fecha_limite).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  const renderVerTodos = () => (
    <div className="tab-content-section">
      <div className="section-header">
        <div>
          <h3 className="section-title">Todos los Conglomerados</h3>
          <p className="section-description">
            Explorar base de datos completa. Mostrando 50 registros por página.
          </p>
        </div>
      </div>

      <div className="filters-bar">
        <div className="filter-group">
          <select
            value={filtroEstado}
            onChange={(e) => {
              setFiltroEstado(e.target.value);
              setPage(1);
            }}
            className="form-select"
          >
            <option value="todos">Todos los estados</option>
            <option value="sin_asignar">Sin Asignar</option>
            <option value="en_revision">En Revisión</option>
            <option value="aprobado">Aprobados</option>
            <option value="rechazado_permanente">Rechazados</option>
          </select>
        </div>

        <div className="filter-group">
          <input
            type="text"
            placeholder="Buscar por código..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="form-input"
          />
        </div>

        <button
          onClick={cargarConglomerados}
          className="btn-secondary"
        >
          Buscar
        </button>
      </div>

      {loading ? (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Cargando conglomerados...</p>
        </div>
      ) : (
        <>
          <div className="table-section">
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Código</th>
                    <th>Latitud</th>
                    <th>Longitud</th>
                    <th>Estado</th>
                    <th>Asignado a</th>
                    <th>Fecha Creación</th>
                  </tr>
                </thead>
                <tbody>
                  {conglomerados.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center">
                        No hay conglomerados que mostrar
                      </td>
                    </tr>
                  ) : (
                    conglomerados.map(c => (
                      <tr key={c.id}>
                        <td><code className="code-text">{c.codigo}</code></td>
                        <td>{c.latitud.toFixed(6)}°</td>
                        <td>{c.longitud.toFixed(6)}°</td>
                        <td>
                          <span className={`badge ${getEstadoBadge(c.estado).class}`}>
                            {getEstadoBadge(c.estado).text}
                          </span>
                        </td>
                        <td>{c.coordinador_nombre || '-'}</td>
                        <td>{new Date(c.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="pagination-btn"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="15 18 9 12 15 6"></polyline>
                </svg>
                Anterior
              </button>

              <span className="pagination-info">
                Página {page} de {totalPages}
              </span>

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="pagination-btn"
              >
                Siguiente
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="9 18 15 12 9 6"></polyline>
                </svg>
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div className="generar-asignar-page">
      <div className="page-header">
        <h2 className="page-title">Generar y Asignar Conglomerados</h2>
        <p className="page-subtitle">Gestión completa del inventario forestal</p>
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

      <div className="tabs-container">
        <button
          className={`tab-btn ${activeTab === 'generar' ? 'active' : ''}`}
          onClick={() => setActiveTab('generar')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          Generar
        </button>

        <button
          className={`tab-btn ${activeTab === 'asignar' ? 'active' : ''}`}
          onClick={() => setActiveTab('asignar')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="9" y1="3" x2="9" y2="21" />
            <line x1="15" y1="3" x2="15" y2="21" />
          </svg>
          Asignar Lotes
        </button>

        <button
          className={`tab-btn ${activeTab === 'ver' ? 'active' : ''}`}
          onClick={() => setActiveTab('ver')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          Ver Todos
        </button>
      </div>

      <div className="tabs-content">
        {activeTab === 'generar' && renderGenerar()}
        {activeTab === 'asignar' && renderAsignar()}
        {activeTab === 'ver' && renderVerTodos()}
      </div>
    </div>
  );
}

export default GenerarYAsignar;