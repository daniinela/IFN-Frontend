// src/components/common/ModalEditarConglomerado.jsx 
import { useState, useEffect } from 'react';
import { geoService } from '../../services/geoService';
import { conglomeradosService } from '../../services/conglomeradosService';
import LeafletMapComponent from './LeafletMapComponent';
import LoadingSpinner from './LoadingSpinner';
import './ModalEditarConglomerado.css';

export default function ModalEditarConglomerado({ 
  conglomerado, 
  onClose, 
  onSuccess 
}) {
  const [loading, setLoading] = useState(false);
  const [loadingGeo, setLoadingGeo] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('ubicacion');

  const estaBloqueado = 
    conglomerado.estado === 'asignado_a_jefe' || 
    conglomerado.jefe_brigada_asignado_id;

  const [regiones, setRegiones] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);

  const [formData, setFormData] = useState({
    region_id: conglomerado.region_id || '',
    departamento_id: conglomerado.departamento_id || '',
    municipio_id: conglomerado.municipio_id || '',
    estado: conglomerado.estado || 'en_revision'
  });

  useEffect(() => {
    cargarRegiones();
  }, []);

  useEffect(() => {
    if (formData.region_id) {
      cargarDepartamentos(formData.region_id);
    } else {
      setDepartamentos([]);
      setMunicipios([]);
    }
  }, [formData.region_id]);

  useEffect(() => {
    if (formData.departamento_id) {
      cargarMunicipios(formData.departamento_id);
    } else {
      setMunicipios([]);
    }
  }, [formData.departamento_id]);

  const cargarRegiones = async () => {
    try {
      setLoadingGeo(true);
      const response = await geoService.getRegiones();
      setRegiones(response.data);
      setError('');
    } catch (err) {
      console.error('Error cargando regiones:', err);
      setError('No se pudieron cargar las regiones');
    } finally {
      setLoadingGeo(false);
    }
  };

  const cargarDepartamentos = async (region_id) => {
    try {
      setLoadingGeo(true);
      const response = await geoService.getDepartamentosByRegion(region_id);
      setDepartamentos(response.data);
    } catch (err) {
      console.error('Error cargando departamentos:', err);
    } finally {
      setLoadingGeo(false);
    }
  };

  const cargarMunicipios = async (departamento_id) => {
    try {
      setLoadingGeo(true);
      const response = await geoService.getMunicipiosByDepartamento(departamento_id);
      setMunicipios(response.data);
    } catch (err) {
      console.error('Error cargando municipios:', err);
    } finally {
      setLoadingGeo(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      if (name === 'region_id') {
        newData.departamento_id = '';
        newData.municipio_id = '';
      } else if (name === 'departamento_id') {
        newData.municipio_id = '';
      }
      
      return newData;
    });
  };

  const validarFormulario = () => {
    // Si está rechazado, no necesita ubicación
    if (formData.estado === 'rechazado') {
      return true;
    }

    // Si está en revisión, debe tener ubicación completa
    if (!formData.region_id || !formData.departamento_id || !formData.municipio_id) {
      setError('Debe completar la ubicación (Región, Departamento y Municipio)');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validarFormulario()) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      const dataToSend = {
        estado: formData.estado
      };

      // Solo enviar ubicación si NO está rechazado
      if (formData.estado !== 'rechazado') {
        dataToSend.region_id = formData.region_id;
        dataToSend.departamento_id = formData.departamento_id;
        dataToSend.municipio_id = formData.municipio_id;
      }

      const response = await conglomeradosService.update(conglomerado.id, dataToSend);

      const mensaje = response.data.conglomerado?.estado === 'listo_para_asignacion'
        ? 'Conglomerado actualizado y listo para asignación'
        : formData.estado === 'rechazado'
        ? 'Conglomerado rechazado'
        : 'Conglomerado actualizado exitosamente';

      onSuccess?.(mensaje);
      onClose();
    } catch (err) {
      console.error('Error actualizando conglomerado:', err);
      
      if (err.response?.status === 403) {
        setError('Este conglomerado ya está asignado y no puede ser editado');
      } else {
        setError(err.response?.data?.error || 'Error al actualizar el conglomerado');
      }
    } finally {
      setLoading(false);
    }
  };

  const direccionesSubparcelas = {
    1: { emoji: '🎯', text: 'Centro', color: '#ef4444' },
    2: { emoji: '⬆️', text: 'Norte', color: '#3b82f6' },
    3: { emoji: '➡️', text: 'Este', color: '#10b981' },
    4: { emoji: '⬇️', text: 'Sur', color: '#f59e0b' },
    5: { emoji: '⬅️', text: 'Oeste', color: '#8b5cf6' }
  };

  return (
    <div className="modal-overlay-large" onClick={onClose}>
      <div className="modal-content-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header-large">
          <div className="modal-header-content">
            <div className="modal-title-group">
              {estaBloqueado && (
                <div className="lock-icon">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </div>
              )}
              <div>
                <h3>{estaBloqueado ? 'Vista de Conglomerado' : 'Revisión de Conglomerado'}</h3>
                <p className="modal-subtitle">{conglomerado.codigo}</p>
              </div>
            </div>
            <button onClick={onClose} className="modal-close-large">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {estaBloqueado && (
            <div className="alert alert-warning-header">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <div>
                <strong>Conglomerado Bloqueado</strong>
                <p>Este conglomerado ya tiene un jefe de brigada asignado y no puede ser modificado</p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-tabs-large">
          <button 
            className={`modal-tab-large ${activeTab === 'ubicacion' ? 'active' : ''}`}
            onClick={() => setActiveTab('ubicacion')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            <span>Revisión y Ubicación</span>
          </button>
          <button 
            className={`modal-tab-large ${activeTab === 'subparcelas' ? 'active' : ''}`}
            onClick={() => setActiveTab('subparcelas')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 2v20" />
              <path d="M2 12h20" />
            </svg>
            <span>Subparcelas</span>
            <span className="tab-badge">{conglomerado.conglomerados_subparcelas?.length || 0}</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body-large">
          {error && (
            <div className="alert alert-error-large">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span>{error}</span>
              <button type="button" onClick={() => setError('')} className="alert-close">✕</button>
            </div>
          )}

          {activeTab === 'ubicacion' && (
            <div className="content-split">
              {/* COLUMNA IZQUIERDA - FORMULARIO */}
              <div className="form-column">
                {/* Información General */}
                <div className="info-card">
                  <div className="info-card-header">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="16" x2="12" y2="12" />
                      <line x1="12" y1="8" x2="12.01" y2="8" />
                    </svg>
                    <h4>Información General</h4>
                  </div>
                  <div className="info-card-body">
                    <div className="info-row-modern">
                      <span className="info-label">Código:</span>
                      <span className="info-value codigo-badge">{conglomerado.codigo}</span>
                    </div>
                    <div className="info-row-modern">
                      <span className="info-label">Latitud:</span>
                      <code className="info-value-code">{conglomerado.latitud}</code>
                    </div>
                    <div className="info-row-modern">
                      <span className="info-label">Longitud:</span>
                      <code className="info-value-code">{conglomerado.longitud}</code>
                    </div>
                    <div className="info-row-modern">
                      <span className="info-label">Creación:</span>
                      <span className="info-value">{new Date(conglomerado.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                {/* Estado de Revisión */}
                <div className="form-section-modern">
                  <label className="form-label-modern">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="9 11 12 14 22 4" />
                      <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                    Estado de Revisión *
                  </label>
                  <select
                    name="estado"
                    value={formData.estado}
                    onChange={handleChange}
                    className="form-select-modern"
                    disabled={estaBloqueado}
                    required
                  >
                    <option value="en_revision">En Revisión</option>
                    <option value="rechazado">Rechazado</option>
                  </select>
                  <p className="form-hint">
                    {formData.estado === 'rechazado' 
                      ? 'El conglomerado será rechazado sin asignar ubicación administrativa'
                      : 'Complete la ubicación administrativa para aprobar el conglomerado'
                    }
                  </p>
                </div>

                {/* Ubicación Administrativa */}
                {formData.estado !== 'rechazado' && (
                  <div className="form-section-modern">
                    <label className="form-label-modern">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                      Ubicación Administrativa *
                    </label>
                    
                    {loadingGeo && (
                      <div className="loading-inline">
                        <div className="spinner-small"></div>
                        <span>Cargando ubicaciones...</span>
                      </div>
                    )}
                    
                    <div className="form-group-stack">
                      <div className="form-group-modern">
                        <label className="form-sublabel">Región *</label>
                        <select
                          name="region_id"
                          value={formData.region_id}
                          onChange={handleChange}
                          className="form-select-modern"
                          disabled={loadingGeo || estaBloqueado}
                          required
                        >
                          <option value="">Seleccione una región</option>
                          {regiones.map(region => (
                            <option key={region.id} value={region.id}>
                              {region.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group-modern">
                        <label className="form-sublabel">Departamento *</label>
                        <select
                          name="departamento_id"
                          value={formData.departamento_id}
                          onChange={handleChange}
                          className="form-select-modern"
                          disabled={!formData.region_id || loadingGeo || estaBloqueado}
                          required
                        >
                          <option value="">Seleccione un departamento</option>
                          {departamentos.map(depto => (
                            <option key={depto.id} value={depto.id}>
                              {depto.nombre}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="form-group-modern">
                        <label className="form-sublabel">Municipio *</label>
                        <select
                          name="municipio_id"
                          value={formData.municipio_id}
                          onChange={handleChange}
                          className="form-select-modern"
                          disabled={!formData.departamento_id || loadingGeo || estaBloqueado}
                          required
                        >
                          <option value="">Seleccione un municipio</option>
                          {municipios.map(muni => (
                            <option key={muni.id} value={muni.id}>
                              {muni.nombre}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Leyenda del Mapa */}
                <div className="map-legend-card">
                  <h5>Leyenda del Mapa</h5>
                  <div className="legend-items">
                    {Object.entries(direccionesSubparcelas).map(([num, dir]) => (
                      <div key={num} className="legend-item-modern">
                        <span 
                          className="legend-dot" 
                          style={{ backgroundColor: dir.color }}
                        />
                        <span className="legend-emoji">{dir.emoji}</span>
                        <span className="legend-text">{dir.text} (SPF{num})</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* COLUMNA DERECHA - MAPA */}
              <div className="map-column">
                <div className="map-container-modern">
                  <div className="map-header">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <h4>Vista del Conglomerado</h4>
                  </div>
                  <div className="map-wrapper">
                    <LeafletMapComponent
                      latitud={conglomerado.latitud}
                      longitud={conglomerado.longitud}
                      codigo={conglomerado.codigo}
                      subparcelas={conglomerado.conglomerados_subparcelas || []}
                      height="100%"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'subparcelas' && (
            <div className="subparcelas-content">
              <div className="subparcelas-header">
                <div>
                  <h4>Subparcelas Prediligenciadas</h4>
                  <p className="subparcelas-description">
                    Coordenadas calculadas automáticamente a 80 metros del punto central en cada dirección cardinal.
                    Las subparcelas pueden marcarse como "no establecidas" durante el trabajo de campo.
                  </p>
                </div>
                <div className="subparcelas-stats">
                  <div className="stat-chip">
                    <span className="stat-label">Total:</span>
                    <span className="stat-value">{conglomerado.conglomerados_subparcelas?.length || 0}</span>
                  </div>
                  {conglomerado.conglomerados_subparcelas && (
                    <>
                      <div className="stat-chip success">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                        <span className="stat-value">
                          {conglomerado.conglomerados_subparcelas.filter(s => s.se_establecio).length}
                        </span>
                      </div>
                      <div className="stat-chip danger">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" />
                          <line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                        <span className="stat-value">
                          {conglomerado.conglomerados_subparcelas.filter(s => s.razon_no_establecida).length}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {conglomerado.conglomerados_subparcelas && conglomerado.conglomerados_subparcelas.length > 0 ? (
                <div className="subparcelas-grid">
                  {conglomerado.conglomerados_subparcelas
                    .sort((a, b) => a.subparcela_num - b.subparcela_num)
                    .map(spf => {
                      const dir = direccionesSubparcelas[spf.subparcela_num] || { 
                        emoji: '❓', 
                        text: 'Desconocido',
                        color: '#6b7280'
                      };
                      
                      return (
                        <div key={spf.id} className="subparcela-card">
                          <div className="subparcela-header">
                            <div className="subparcela-number" style={{ backgroundColor: dir.color }}>
                              <span className="subparcela-emoji">{dir.emoji}</span>
                              <span className="subparcela-num">SPF{spf.subparcela_num}</span>
                            </div>
                            <div className="subparcela-direction">
                              {dir.text}
                            </div>
                          </div>
                          
                          <div className="subparcela-body">
                            <div className="coord-row">
                              <span className="coord-label">Latitud:</span>
                              <code className="coord-value">{spf.latitud_prediligenciada}</code>
                            </div>
                            <div className="coord-row">
                              <span className="coord-label">Longitud:</span>
                              <code className="coord-value">{spf.longitud_prediligenciada}</code>
                            </div>
                          </div>
                          
                          <div className="subparcela-footer">
                            {spf.se_establecio ? (
                              <div className="status-badge success">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>
                                <span>Establecida</span>
                              </div>
                            ) : spf.razon_no_establecida ? (
                              <div className="status-badge danger">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                                <span>No Establecida</span>
                              </div>
                            ) : (
                              <div className="status-badge pending">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <circle cx="12" cy="12" r="10" />
                                  <polyline points="12 6 12 12 16 14" />
                                </svg>
                                <span>Pendiente</span>
                              </div>
                            )}
                            
                            {(spf.razon_no_establecida || spf.observaciones) && (
                              <div className="subparcela-notes">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                                </svg>
                                <span>{spf.razon_no_establecida || spf.observaciones}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="empty-state-modern">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2v20" />
                    <path d="M2 12h20" />
                  </svg>
                  <h3>No hay subparcelas registradas</h3>
                  <p>Este conglomerado no tiene subparcelas prediligenciadas</p>
                </div>
              )}
            </div>
          )}
        </form>

        <div className="modal-footer-large">
          <button type="button" onClick={onClose} className="btn-cancel-large">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
            Cancelar
          </button>
          {!estaBloqueado && activeTab === 'ubicacion' && (
            <button 
              onClick={handleSubmit} 
              disabled={loading || loadingGeo}
              className="btn-primary-large"
            >
              {loading ? (
                <>
                  <div className="spinner-button"></div>
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>{formData.estado === 'rechazado' ? 'Rechazar Conglomerado' : 'Aprobar y Guardar'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}