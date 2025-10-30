import { useState, useEffect, useRef, useCallback } from 'react';
import axios from '../../api/axiosConfig';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './Conglomerados.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGV4YW1wbGUifQ.example';

function Conglomerados() {
  const [loading, setLoading] = useState(false);
  const [conglomerados, setConglomerados] = useState([]);
  const [filtro, setFiltro] = useState('todos');
  
  // 🆕 NUEVOS ESTADOS PARA PAGINACIÓN
  const [paginaActual, setPaginaActual] = useState(1);
  const [totalConglomerados, setTotalConglomerados] = useState(0);
  const [totalPaginas, setTotalPaginas] = useState(0);
  const conglomeradosPorPagina = 20;
  
  // 🆕 NUEVOS ESTADOS PARA BÚSQUEDA
  const [busqueda, setBusqueda] = useState('');
  const [busquedaActiva, setBusquedaActiva] = useState('');
  
  const [showGenerarModal, setShowGenerarModal] = useState(false);
  const [showDetalleModal, setShowDetalleModal] = useState(false);
  const [showRechazarModal, setShowRechazarModal] = useState(false);
  const [showEliminarModal, setShowEliminarModal] = useState(false);
  
  const [cantidad, setCantidad] = useState(1);
  const [conglomeradoSeleccionado, setConglomeradoSeleccionado] = useState(null);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [tipoRechazo, setTipoRechazo] = useState('temporal');
  const [fechaRevision, setFechaRevision] = useState('');
  
  const [userData, setUserData] = useState(null);
  
  const [clima, setClima] = useState(null);
  const [climaLoading, setClimaLoading] = useState(false);
  const [municipio, setMunicipio] = useState('');
  const [municipioLoading, setMunicipioLoading] = useState(false);
  
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    const user = localStorage.getItem('user-data');
    if (user) {
      try {
        setUserData(JSON.parse(user));
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }
  }, []);

  // 🆕 FUNCIÓN ACTUALIZADA CON PAGINACIÓN
  const cargarConglomerados = useCallback(async () => {
    try {
      setLoading(true);
      
      const baseUrl = filtro === 'todos' 
        ? 'http://localhost:3003/api/conglomerados'
        : `http://localhost:3003/api/conglomerados/estado/${filtro}`;
      
      // 🆕 Construir parámetros de paginación
      const params = new URLSearchParams({
        page: paginaActual,
        limit: conglomeradosPorPagina
      });
      
      if (busquedaActiva) {
        params.append('busqueda', busquedaActiva);
      }
      
      const response = await axios.get(`${baseUrl}?${params}`);
      
      // 🆕 El backend ahora devuelve { data: [], total: 0, totalPages: 10 }
      if (response.data.data) {
        setConglomerados(response.data.data);
        setTotalConglomerados(response.data.total);
        setTotalPaginas(response.data.totalPages);
      } else {
        // Fallback si el backend no está actualizado
        setConglomerados(response.data);
        setTotalConglomerados(response.data.length);
        setTotalPaginas(1);
      }
      
    } catch (error) {
      console.error('Error cargando conglomerados:', error);
      alert('Error al cargar conglomerados');
    } finally {
      setLoading(false);
    }
  }, [filtro, paginaActual, busquedaActiva]);

  useEffect(() => {
    cargarConglomerados();
  }, [cargarConglomerados]);

  // 🆕 MANEJAR BÚSQUEDA
  const handleBuscar = (e) => {
    e.preventDefault();
    setBusquedaActiva(busqueda);
    setPaginaActual(1);
  };

  // 🆕 LIMPIAR BÚSQUEDA
  const limpiarBusqueda = () => {
    setBusqueda('');
    setBusquedaActiva('');
    setPaginaActual(1);
  };

  // 🆕 CAMBIAR FILTRO (resetea paginación)
  const cambiarFiltro = (nuevoFiltro) => {
    setFiltro(nuevoFiltro);
    setPaginaActual(1);
  };

  // 🆕 NAVEGACIÓN DE PÁGINAS
  const irAPagina = (numeroPagina) => {
    if (numeroPagina >= 1 && numeroPagina <= totalPaginas) {
      setPaginaActual(numeroPagina);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // 🆕 GENERAR NÚMEROS DE PÁGINA VISIBLES
  const obtenerPaginasVisibles = () => {
    const paginas = [];
    const rango = 2;
    
    let inicio = Math.max(1, paginaActual - rango);
    let fin = Math.min(totalPaginas, paginaActual + rango);
    
    if (inicio > 1) {
      paginas.push(1);
      if (inicio > 2) paginas.push('...');
    }
    
    for (let i = inicio; i <= fin; i++) {
      paginas.push(i);
    }
    
    if (fin < totalPaginas) {
      if (fin < totalPaginas - 1) paginas.push('...');
      paginas.push(totalPaginas);
    }
    
    return paginas;
  };

  const generarConglomerados = async () => {
    try {
      setLoading(true);
      await axios.post('http://localhost:3003/api/conglomerados/generar', {
        cantidad: parseInt(cantidad)
      });
      
      alert(`${cantidad} conglomerado(s) generado(s) exitosamente`);
      setShowGenerarModal(false);
      setCantidad(1);
      setPaginaActual(1); // 🆕
      cargarConglomerados();
    } catch (error) {
      console.error('Error generando conglomerados:', error);
      alert('Error al generar conglomerados');
    } finally {
      setLoading(false);
    }
  };

  const obtenerMunicipio = async (lat, lon) => {
    try {
      setMunicipioLoading(true);
      const response = await axios.get(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lon},${lat}.json?access_token=${mapboxgl.accessToken}&language=es`
      );
      
      if (response.data.features?.length > 0) {
        const place = response.data.features.find(f => 
          f.place_type.includes('place') || f.place_type.includes('locality')
        );
        
        if (place) {
          setMunicipio(place.text);
          return place.text;
        }
      }
      
      setMunicipio('Ubicación desconocida');
      return null;
    } catch (error) {
      console.error('Error obteniendo municipio:', error);
      setMunicipio('Error al obtener ubicación');
      return null;
    } finally {
      setMunicipioLoading(false);
    }
  };

  const obtenerClima = async (lat, lon) => {
    try {
      setClimaLoading(true);
      console.log(`🌤️ Solicitando clima del backend para: ${lat}, ${lon}`);
      
      const response = await axios.get('http://localhost:3003/api/conglomerados/clima/obtener', {
        params: { lat, lon }
      });
      
      console.log('✅ Clima obtenido desde backend:', response.data);
      setClima(response.data);
    } catch (error) {
      console.error('❌ Error obteniendo clima:', error.message);
      setClima(null);
    } finally {
      setClimaLoading(false);
    }
  };

  const inicializarMapa = (lat, lon) => {
    if (mapRef.current) mapRef.current.remove();
    if (!mapContainerRef.current) return;
    
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [lon, lat],
      zoom: 13,
      pitch: 45
    });

    map.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.addControl(new mapboxgl.FullscreenControl(), 'top-right');

    new mapboxgl.Marker({ color: '#2d6a4f' })
      .setLngLat([lon, lat])
      .setPopup(
        new mapboxgl.Popup().setHTML(
          `<strong>${conglomeradoSeleccionado?.codigo}</strong><br>
           Lat: ${lat.toFixed(4)}<br>Lng: ${lon.toFixed(4)}`
        )
      )
      .addTo(map);

    mapRef.current = map;
  };

  const verDetalle = async (conglomerado) => {
    setConglomeradoSeleccionado(conglomerado);
    setShowDetalleModal(true);
    setClima(null);
    setMunicipio(conglomerado.municipio || '');
    
    if (!conglomerado.municipio) {
      await obtenerMunicipio(conglomerado.latitud, conglomerado.longitud);
    }
    await obtenerClima(conglomerado.latitud, conglomerado.longitud);
    
    setTimeout(() => {
      inicializarMapa(conglomerado.latitud, conglomerado.longitud);
    }, 100);
  };

  const cerrarDetalleModal = () => {
    setShowDetalleModal(false);
    if (mapRef.current) {
      mapRef.current.remove();
      mapRef.current = null;
    }
  };

  const guardarMunicipio = async () => {
    try {
      await axios.put(
        `http://localhost:3003/api/conglomerados/${conglomeradoSeleccionado.id}`,
        { municipio }
      );
      
      alert('Municipio guardado exitosamente');
      cargarConglomerados();
    } catch (error) {
      console.error('Error guardando municipio:', error);
      alert('Error al guardar municipio');
    }
  };

  const aprobarConglomerado = async () => {
    try {
      if (!userData) {
        alert('Error: No se encontraron datos del usuario');
        return;
      }

      await axios.put(
        `http://localhost:3003/api/conglomerados/${conglomeradoSeleccionado.id}/aprobar`,
        {
          admin_id: userData.id,
          admin_nombre: userData.nombre_completo,
          admin_email: userData.email   
        }
      );
      
      alert('Conglomerado aprobado exitosamente');
      cerrarDetalleModal();
      cargarConglomerados();
    } catch (error) {
      console.error('Error aprobando:', error);
      alert('Error al aprobar conglomerado');
    }
  };

  const abrirModalRechazo = () => {
    cerrarDetalleModal();
    setShowRechazarModal(true);
  };

  const rechazarConglomerado = async () => {
    try {
      if (!userData) {
        alert('Error: No se encontraron datos del usuario');
        return;
      }

      if (!motivoRechazo.trim()) {
        alert('Debes ingresar un motivo de rechazo');
        return;
      }

      if (tipoRechazo === 'temporal' && !fechaRevision) {
        alert('Debes seleccionar una fecha de próxima revisión');
        return;
      }

      await axios.put(
        `http://localhost:3003/api/conglomerados/${conglomeradoSeleccionado.id}/rechazar`,
        {
          tipo: tipoRechazo,
          razon: motivoRechazo,
          fecha_proxima_revision: tipoRechazo === 'temporal' ? fechaRevision : null,
          admin_id: userData.id,
          admin_nombre: userData.nombre_completo,
          admin_email: userData.email
        }
      );

      alert(
        `Conglomerado rechazado ${
          tipoRechazo === 'temporal' ? 'temporalmente' : 'permanentemente'
        }`
      );
      
      setShowRechazarModal(false);
      setMotivoRechazo('');
      setFechaRevision('');
      cargarConglomerados();
    } catch (error) {
      console.error('Error rechazando:', error);
      alert('Error al rechazar conglomerado');
    }
  };

  const abrirModalEliminar = (conglomerado) => {
    setConglomeradoSeleccionado(conglomerado);
    setShowEliminarModal(true);
  };

  const eliminarConglomerado = async () => {
    try {
      await axios.delete(
        `http://localhost:3003/api/conglomerados/${conglomeradoSeleccionado.id}`
      );
      
      alert('Conglomerado eliminado exitosamente');
      setShowEliminarModal(false);
      cargarConglomerados();
    } catch (error) {
      console.error('Error eliminando:', error);
      alert(error.response?.data?.error || 'Error al eliminar conglomerado');
    }
  };

  const getEstadoBadge = (estado) => {
    const badges = {
      'en_revision': { text: 'En Revisión', class: 'badge-warning' },
      'aprobado': { text: 'Aprobado', class: 'badge-success' },
      'rechazado_temporal': { text: 'Rechazado Temporal', class: 'badge-info' },
      'rechazado_permanente': { text: 'Rechazado Permanente', class: 'badge-danger' }
    };
    return badges[estado] || { text: estado, class: 'badge-default' };
  };

  const puedeEliminar = (estado) => {
    return ['rechazado_permanente', 'rechazado_temporal'].includes(estado);
  };

  const getWeatherIcon = (iconCode) => {
    const icons = {
      '01d': '☀️', '01n': '🌙',
      '02d': '⛅', '02n': '☁️',
      '03d': '☁️', '03n': '☁️',
      '04d': '☁️', '04n': '☁️',
      '09d': '🌧️', '09n': '🌧️',
      '10d': '🌦️', '10n': '🌧️',
      '11d': '⛈️', '11n': '⛈️',
      '13d': '❄️', '13n': '❄️',
      '50d': '🌫️', '50n': '🌫️'
    };
    return icons[iconCode] || '🌤️';
  };

  // 🆕 CALCULAR RANGO DE RESULTADOS
  const primerConglomerado = totalConglomerados > 0 ? (paginaActual - 1) * conglomeradosPorPagina + 1 : 0;
  const ultimoConglomerado = Math.min(paginaActual * conglomeradosPorPagina, totalConglomerados);

  return (
    <div className="conglomerados-page">
    {/* Header */}
      <div className="page-header">
        <div className="header-info">
          <h2 className="page-title">Gestión de Conglomerados</h2>
          <p className="page-subtitle">Total: {totalConglomerados} conglomerados registrados</p>
          {userData && (
            <p className="user-info">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M20 21V19C20 17.9391 19.5786 16.9217 18.8284 16.1716C18.0783 15.4214 17.0609 15 16 15H8C6.93913 15 5.92172 15.4214 5.17157 16.1716C4.42143 16.9217 4 17.9391 4 19V21" stroke="currentColor" strokeWidth="2"/>
                <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="2"/>
              </svg>
              {userData.nombre_completo} • {userData.email}
            </p>
          )}
        </div>
        <button className="btn-generar" onClick={() => setShowGenerarModal(true)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2"/>
          </svg>
          Generar Conglomerado
        </button>
      </div>

      {/* 🆕 BARRA DE BÚSQUEDA */}
      <div className="search-container">
        <form onSubmit={handleBuscar} className="search-form">
          <div className="search-input-wrapper">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2"/>
            </svg>
            <input
              type="text"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              placeholder="Buscar por código o municipio..."
              className="search-input"
            />
          </div>
          <button type="submit" className="btn-search">
            Buscar
          </button>
          {busquedaActiva && (
            <button type="button" onClick={limpiarBusqueda} className="btn-clear">
              Limpiar
            </button>
          )}
        </form>
      </div>

      {/* Filtros */}
      <div className="filtros-container">
        {['todos', 'en_revision', 'aprobado', 'rechazado_temporal', 'rechazado_permanente'].map(f => {
          const badge = getEstadoBadge(f);
          return (
            <button
              key={f}
              onClick={() => cambiarFiltro(f)}
              className={`filtro-btn ${filtro === f ? 'active' : ''} ${badge.class}`}
            >
              {f === 'todos' ? 'Todos' : badge.text}
            </button>
          );
        })}
      </div>

      {/* 🆕 CONTADOR DE RESULTADOS */}
      {!loading && conglomerados.length > 0 && (
        <div className="results-counter">
          <span>
            Mostrando <strong>{primerConglomerado}-{ultimoConglomerado}</strong> de <strong>{totalConglomerados}</strong> conglomerados
          </span>
          <span className="page-indicator">
            Página {paginaActual} de {totalPaginas}
          </span>
        </div>
      )}

      {/* Contenido */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner-large"></div>
          <p>Cargando conglomerados...</p>
        </div>
      ) : conglomerados.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🗺️</span>
          <h3>No hay conglomerados</h3>
          <p>{busquedaActiva ? 'No se encontraron resultados para tu búsqueda' : 'Genera tu primer conglomerado para comenzar'}</p>
        </div>
      ) : (
        <>
          <div className="conglomerados-grid">
            {conglomerados.map(cong => {
              const badge = getEstadoBadge(cong.estado);
              return (
                <div key={cong.id} className="conglomerado-card">
                  <div className="card-header">
                    <h3>{cong.codigo}</h3>
                    <span className={`status-badge ${badge.class}`}>
                      {badge.text}
                    </span>
                  </div>

                  <div className="card-body">
                    <div className="coord-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 5 7 2 12 2S21 5 21 10Z" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span>Lat: {cong.latitud.toFixed(4)}°</span>
                    </div>
                    <div className="coord-item">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 5 7 2 12 2S21 5 21 10Z" stroke="currentColor" strokeWidth="2"/>
                        <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                      <span>Lng: {cong.longitud.toFixed(4)}°</span>
                    </div>
                    {cong.municipio && (
                      <div className="municipio-info">
                        📍 {cong.municipio}
                      </div>
                    )}
                    {cong.modificado_por_admin_nombre && (
                      <div className="admin-badge">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M12 15C15.3137 15 18 12.3137 18 9C18 5.68629 15.3137 3 12 3C8.68629 3 6 5.68629 6 9C6 12.3137 8.68629 15 12 15Z" stroke="currentColor" strokeWidth="2"/>
                          <path d="M2 21C2 17.134 5.134 14 9 14H15C18.866 14 22 17.134 22 21" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        {cong.modificado_por_admin_nombre}
                      </div>
                    )}
                  </div>

                  <div className="card-actions">
                    <button className="btn-detalle" onClick={() => verDetalle(cong)}>
                      Ver Detalles
                    </button>
                    {puedeEliminar(cong.estado) && (
                      <button className="btn-eliminar" onClick={() => abrirModalEliminar(cong)}>
                        🗑️
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 🆕 CONTROLES DE PAGINACIÓN */}
          {totalPaginas > 1 && (
            <div className="pagination-container">
              <button
                onClick={() => irAPagina(1)}
                disabled={paginaActual === 1}
                className="pagination-btn"
                title="Primera página"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M18 17L13 12L18 7M11 17L6 12L11 7" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>

              <button
                onClick={() => irAPagina(paginaActual - 1)}
                disabled={paginaActual === 1}
                className="pagination-btn"
                title="Página anterior"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>

              <div className="pagination-numbers">
                {obtenerPaginasVisibles().map((pagina, index) => (
                  pagina === '...' ? (
                    <span key={`ellipsis-${index}`} className="pagination-ellipsis">...</span>
                  ) : (
                    <button
                      key={pagina}
                      onClick={() => irAPagina(pagina)}
                      className={`pagination-number ${paginaActual === pagina ? 'active' : ''}`}
                    >
                      {pagina}
                    </button>
                  )
                ))}
              </div>

              <button
                onClick={() => irAPagina(paginaActual + 1)}
                disabled={paginaActual === totalPaginas}
                className="pagination-btn"
                title="Página siguiente"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>

              <button
                onClick={() => irAPagina(totalPaginas)}
                disabled={paginaActual === totalPaginas}
                className="pagination-btn"
                title="Última página"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M6 17L11 12L6 7M13 17L18 12L13 7" stroke="currentColor" strokeWidth="2"/>
                </svg>
              </button>
            </div>
          )}
        </>
      )}

      {/* Modal Generar */}
      {showGenerarModal && (
        <div className="modal-overlay" onClick={() => setShowGenerarModal(false)}>
          <div className="modal-content modal-small" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Generar Conglomerados</h3>

            <div className="form-group-modal">
              <label>Cantidad:</label>
              <input 
                type="number" 
                min="1" 
                max="100"
                value={cantidad}
                onChange={e => setCantidad(e.target.value)}
                className="input-field"
              />
              <small className="input-hint">Máximo 100 conglomerados por vez</small>
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowGenerarModal(false)}>
                Cancelar
              </button>
              <button className="btn-primary" onClick={generarConglomerados} disabled={loading}>
                {loading ? 'Generando...' : 'Generar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Detalle */}
      {showDetalleModal && conglomeradoSeleccionado && (
        <div className="modal-overlay" onClick={cerrarDetalleModal}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <div className="modal-header-detalle">
              <h3>{conglomeradoSeleccionado.codigo}</h3>
              <button className="btn-close" onClick={cerrarDetalleModal}>×</button>
            </div>

            <div className="detalle-grid">
              {/* Columna Izquierda: Mapa e Info */}
              <div className="detalle-left">
                <div className="map-container">
                  <h4 className="section-title-detalle">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <path d="M21 10C21 17 12 23 12 23S3 17 3 10C3 5 7 2 12 2S21 5 21 10Z" stroke="currentColor" strokeWidth="2"/>
                      <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Ubicación
                  </h4>
                  <div ref={mapContainerRef} className="map-box" />
                </div>

                <div className="info-container">
                  <h4 className="section-title-detalle">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/>
                      <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Información
                  </h4>
                  
                  <div className="info-items">
                    <div className="info-item">
                      <span className="info-label">Código</span>
                      <span className="info-value">{conglomeradoSeleccionado.codigo}</span>
                    </div>

                    <div className="info-item">
                      <span className="info-label">Coordenadas</span>
                      <span className="info-value">
                        {conglomeradoSeleccionado.latitud.toFixed(6)}° / {conglomeradoSeleccionado.longitud.toFixed(6)}°
                      </span>
                    </div>
                    
                    <div className="info-item-full">
                      <span className="info-label">Municipio</span>
                      {municipioLoading ? (
                        <p className="loading-text">Cargando...</p>
                      ) : (
                        <div className="municipio-input-group">
                          <input
                            type="text"
                            value={municipio}
                            onChange={e => setMunicipio(e.target.value)}
                            placeholder="Nombre del municipio"
                            className="input-field"
                          />
                          <button className="btn-save-municipio" onClick={guardarMunicipio}>
                            Guardar
                          </button>
                        </div>
                      )}
                    </div>

                    {conglomeradoSeleccionado.razon_rechazo && (
                      <div className="rechazo-box">
                        <strong>Motivo del rechazo:</strong>
                        <p>{conglomeradoSeleccionado.razon_rechazo}</p>
                      </div>
                    )}

                    {conglomeradoSeleccionado.fecha_proxima_revision && (
                      <div className="revision-box">
                        <strong>Próxima revisión:</strong>
                        <p>{new Date(conglomeradoSeleccionado.fecha_proxima_revision).toLocaleDateString('es-ES')}</p>
                      </div>
                    )}
                  </div>

                  {/* Info del Admin */}
                  {conglomeradoSeleccionado.modificado_por_admin_nombre && (
                    <div className="admin-info-box">
                      <h5 className="admin-info-title">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                          <path d="M12 15C15.3137 15 18 12.3137 18 9C18 5.68629 15.3137 3 12 3C8.68629 3 6 5.68629 6 9C6 12.3137 8.68629 15 12 15Z" stroke="currentColor" strokeWidth="2"/>
                          <path d="M2 21C2 17.134 5.134 14 9 14H15C18.866 14 22 17.134 22 21" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        Modificado por
                      </h5>
                      <div className="admin-info-content">
                        <div className="admin-info-item">
                          <strong>Nombre:</strong> {conglomeradoSeleccionado.modificado_por_admin_nombre}
                        </div>
                        <div className="admin-info-item">
                          <strong>Email:</strong> {conglomeradoSeleccionado.modificado_por_admin_email}
                        </div>
                        <div className="admin-info-item">
                          <strong>Último cambio:</strong> {new Date(conglomeradoSeleccionado.updated_at).toLocaleString('es-ES')}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Columna Derecha: Clima */}
              <div className="detalle-right">
                <h4 className="section-title-detalle">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2"/>
                    <path d="M12 1V3M12 21V23M4.22 4.22L5.64 5.64M18.36 18.36L19.78 19.78M1 12H3M21 12H23M4.22 19.78L5.64 18.36M18.36 5.64L19.78 4.22" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Información Climática
                </h4>
                
                {climaLoading ? (
                  <div className="clima-loading">
                    <div className="spinner-large"></div>
                    <p>Cargando datos climáticos...</p>
                  </div>
                ) : clima ? (
                  <div className="clima-content">
                    {/* Clima Actual */}
                    <div className="clima-actual">
                      <div className="clima-icon-big">
                        {getWeatherIcon(clima.current.weather[0].icon)}
                      </div>
                      <div className="clima-temp">{Math.round(clima.current.main.temp)}°C</div>
                      <div className="clima-desc">{clima.current.weather[0].description}</div>
                      <div className="clima-feels">
                        Sensación térmica: {Math.round(clima.current.main.feels_like)}°C
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="clima-stats">
                      <div className="stat-box">
                        <div className="stat-icon">💧</div>
                        <div className="stat-info">
                          <div className="stat-label">Humedad</div>
                          <div className="stat-value">{clima.current.main.humidity}%</div>
                        </div>
                      </div>

                      <div className="stat-box">
                        <div className="stat-icon">💨</div>
                        <div className="stat-info">
                          <div className="stat-label">Viento</div>
                          <div className="stat-value">{Math.round(clima.current.wind.speed * 3.6)} km/h</div>
                        </div>
                      </div>

                      <div className="stat-box">
                        <div className="stat-icon">🌡️</div>
                        <div className="stat-info">
                          <div className="stat-label">Presión</div>
                          <div className="stat-value">{clima.current.main.pressure} hPa</div>
                        </div>
                      </div>

                      <div className="stat-box">
                        <div className="stat-icon">👁️</div>
                        <div className="stat-info">
                          <div className="stat-label">Visibilidad</div>
                          <div className="stat-value">{(clima.current.visibility / 1000).toFixed(1)} km</div>
                        </div>
                      </div>

                      <div className="stat-box">
                        <div className="stat-icon">🌅</div>
                        <div className="stat-info">
                          <div className="stat-label">Amanecer</div>
                          <div className="stat-value">
                            {new Date(clima.current.sys.sunrise * 1000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <div className="stat-box">
                        <div className="stat-icon">🌇</div>
                        <div className="stat-info">
                          <div className="stat-label">Atardecer</div>
                          <div className="stat-value">
                            {new Date(clima.current.sys.sunset * 1000).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Pronóstico 5 días */}
                    <div className="pronostico-section">
                      <h5 className="pronostico-title">Pronóstico 5 días</h5>
                      <div className="pronostico-grid">
                        {clima.forecast.map((day, index) => (
                          <div key={index} className="pronostico-card">
                            <div className="pronostico-day">
                              {new Date(day.dt * 1000).toLocaleDateString('es-ES', { weekday: 'short' })}
                            </div>
                            <div className="pronostico-icon">
                              {getWeatherIcon(day.weather[0].icon)}
                            </div>
                            <div className="pronostico-temp">
                              <span className="temp-max">{Math.round(day.main.temp_max)}°</span>
                              <span className="temp-min">{Math.round(day.main.temp_min)}°</span>
                            </div>
                            <div className="pronostico-desc">{day.weather[0].description}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Alertas Climáticas */}
                    {clima.forecast.some(day => day.weather[0].main === 'Rain') && (
                      <div className="alert-box rain-alert">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M12 9V13M12 17H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <div>
                          <strong>Lluvia prevista</strong>
                          <p>Se esperan precipitaciones en los próximos días</p>
                        </div>
                      </div>
                    )}

                    {clima.current.clouds.all > 80 && (
                      <div className="alert-box cloud-alert">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                          <path d="M18 10H19C20.6569 10 22 11.3431 22 13C22 14.6569 20.6569 16 19 16H6C3.79086 16 2 14.2091 2 12C2 9.79086 3.79086 8 6 8C6 5.23858 8.23858 3 11 3C13.419 3 15.4367 4.71776 15.9 7" stroke="currentColor" strokeWidth="2"/>
                        </svg>
                        <div>
                          <strong>Nubosidad alta</strong>
                          <p>Condiciones de cielo mayormente nublado</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="clima-error">
                    <span className="error-icon">❌</span>
                    <p>No se pudieron cargar los datos climáticos</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer con botones de acción */}
            {conglomeradoSeleccionado.estado === 'en_revision' && (
              <div className="modal-footer-actions">
                <button className="btn-rechazar" onClick={abrirModalRechazo}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Rechazar
                </button>
                <button className="btn-aprobar" onClick={aprobarConglomerado}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Aprobar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal Rechazar */}
      {showRechazarModal && conglomeradoSeleccionado && (
        <div className="modal-overlay" onClick={() => setShowRechazarModal(false)}>
          <div className="modal-content modal-medium" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Rechazar Conglomerado: {conglomeradoSeleccionado.codigo}</h3>

            <div className="form-group-modal">
              <label>Tipo de Rechazo:</label>
              <select 
                value={tipoRechazo}
                onChange={e => setTipoRechazo(e.target.value)}
                className="input-field"
              >
                <option value="temporal">Rechazo Temporal</option>
                <option value="permanente">Rechazo Permanente</option>
              </select>
            </div>

            <div className="form-group-modal">
              <label>Motivo del Rechazo:</label>
              <textarea 
                value={motivoRechazo}
                onChange={e => setMotivoRechazo(e.target.value)}
                placeholder="Explica el motivo del rechazo..."
                className="textarea-field"
                rows="4"
              />
            </div>

            {tipoRechazo === 'temporal' && (
              <div className="form-group-modal">
                <label>Fecha de Próxima Revisión:</label>
                <input 
                  type="date"
                  value={fechaRevision}
                  onChange={e => setFechaRevision(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="input-field"
                />
                <small className="input-hint">Selecciona cuándo se debe revisar nuevamente</small>
              </div>
            )}

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowRechazarModal(false)}>
                Cancelar
              </button>
              <button className="btn-danger" onClick={rechazarConglomerado} disabled={loading}>
                {loading ? 'Rechazando...' : 'Confirmar Rechazo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Eliminar */}
      {showEliminarModal && conglomeradoSeleccionado && (
        <div className="modal-overlay" onClick={() => setShowEliminarModal(false)}>
          <div className="modal-content modal-small" onClick={e => e.stopPropagation()}>
            <div className="modal-warning">
              <span className="warning-icon">⚠️</span>
              <h3>¿Eliminar Conglomerado?</h3>
              <p>Esta acción no se puede deshacer</p>
            </div>

            <div className="eliminar-info">
              <div><strong>Código:</strong> {conglomeradoSeleccionado.codigo}</div>
              <div><strong>Estado:</strong> {getEstadoBadge(conglomeradoSeleccionado.estado).text}</div>
              {conglomeradoSeleccionado.municipio && (
                <div><strong>Municipio:</strong> {conglomeradoSeleccionado.municipio}</div>
              )}
            </div>

            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowEliminarModal(false)}>
                Cancelar
              </button>
              <button className="btn-danger" onClick={eliminarConglomerado} disabled={loading}>
                {loading ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Conglomerados;