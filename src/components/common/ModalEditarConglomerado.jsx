// src/components/common/ModalEditarConglomerado.jsx
import { useState, useEffect } from 'react';
import { geoService, CARS_COLOMBIA } from '../../services/geoService';
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

  // Estados geográficos
  const [regiones, setRegiones] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);

  // Formulario - SIN coordenadas (bloqueadas)
  const [formData, setFormData] = useState({
    codigo: conglomerado.codigo || '',
    car_sigla: conglomerado.car_sigla || '',
    region_id: conglomerado.region_id || '',
    departamento_id: conglomerado.departamento_id || '',
    municipio_id: conglomerado.municipio_id || ''
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
      console.log('🌍 Cargando regiones...');
      const response = await geoService.getRegiones();
      console.log('✅ Regiones cargadas:', response.data.length);
      setRegiones(response.data);
      setError(''); // Limpiar error si carga bien
    } catch (err) {
      console.error('❌ Error cargando regiones:', err);
      setError('No se pudieron cargar las regiones. Verifica que el servicio de ubicaciones esté activo.');
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
      setError('Error cargando departamentos');
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
      setError('Error cargando municipios');
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
    if (!formData.codigo || formData.codigo.trim() === '') {
      setError('El código es requerido');
      return false;
    }

    if (!formData.car_sigla) {
      setError('Debe seleccionar una CAR');
      return false;
    }

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

    const response = await conglomeradosService.update(conglomerado.id, {
      codigo: formData.codigo,
      car_sigla: formData.car_sigla,
      region_id: formData.region_id,
      departamento_id: formData.departamento_id,
      municipio_id: formData.municipio_id
    });

    console.log('✅ Conglomerado actualizado:', response.data);

    // Mostrar mensaje personalizado si cambió de estado
    const mensaje = response.data.conglomerado?.estado === 'listo_para_asignacion'
      ? '✅ Conglomerado actualizado y listo para asignación a Jefe de Brigada'
      : '✅ Conglomerado actualizado exitosamente';

    onSuccess?.(mensaje);
    onClose();
  } catch (err) {
    console.error('Error actualizando conglomerado:', err);
    setError(err.response?.data?.error || 'Error al actualizar el conglomerado');
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Editar Conglomerado: {conglomerado.codigo}</h3>
          <button onClick={onClose} className="modal-close">✕</button>
        </div>

        {/* TABS */}
        <div className="modal-tabs">
          <button 
            className={`modal-tab ${activeTab === 'ubicacion' ? 'active' : ''}`}
            onClick={() => setActiveTab('ubicacion')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            Ubicación
          </button>
          <button 
            className={`modal-tab ${activeTab === 'subparcelas' ? 'active' : ''}`}
            onClick={() => setActiveTab('subparcelas')}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
            Subparcelas ({conglomerado.conglomerados_subparcelas?.length || 0})
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          {error && (
            <div className="alert-error">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              {error}
              <button type="button" onClick={() => setError('')} className="alert-close">✕</button>
            </div>
          )}

          {/* TAB: UBICACIÓN */}
          {activeTab === 'ubicacion' && (
            <>
              {/* Mapa */}
              <div className="form-section">
                <h4>Vista del Conglomerado y Subparcelas</h4>
                <div className="modal-map">
                  <LeafletMapComponent
                    latitud={conglomerado.latitud}
                    longitud={conglomerado.longitud}
                    codigo={conglomerado.codigo}
                    subparcelas={conglomerado.conglomerados_subparcelas || []}
                    height="450px"
                  />
                </div>
                <div style={{ 
                  marginTop: '12px', 
                  padding: '12px', 
                  background: '#f9fafb', 
                  borderRadius: '8px',
                  fontSize: '12px',
                  color: '#6b7280',
                  display: 'flex',
                  gap: '16px',
                  flexWrap: 'wrap'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', background: '#ef4444', borderRadius: '50%' }}></span>
                    <span>Centro (SPF1)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', background: '#3b82f6', borderRadius: '50%' }}></span>
                    <span>Norte (SPF2)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', background: '#10b981', borderRadius: '50%' }}></span>
                    <span>Este (SPF3)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', background: '#f59e0b', borderRadius: '50%' }}></span>
                    <span>Sur (SPF4)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ width: '12px', height: '12px', background: '#8b5cf6', borderRadius: '50%' }}></span>
                    <span>Oeste (SPF5)</span>
                  </div>
                </div>
              </div>

              {/* Coordenadas (BLOQUEADAS) */}
              <div className="form-section">
                <h4>Coordenadas Geográficas</h4>
                <div className="coords-display">
                  <div className="coord-item">
                    <span className="coord-label">Latitud</span>
                    <span className="coord-value">{parseFloat(conglomerado.latitud).toFixed(6)}</span>
                  </div>
                  <div className="coord-item">
                    <span className="coord-label">Longitud</span>
                    <span className="coord-value">{parseFloat(conglomerado.longitud).toFixed(6)}</span>
                  </div>
                </div>
                <p className="coord-note">
                  🔒 Las coordenadas no pueden modificarse después de la generación
                </p>
              </div>

              {/* Código y CAR */}
              <div className="form-section">
                <h4>Información Básica</h4>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      Código *
                      <span className="label-hint">Identificador único del conglomerado</span>
                    </label>
                    <input
                      type="text"
                      name="codigo"
                      value={formData.codigo}
                      onChange={handleChange}
                      className="form-input"
                      placeholder="Ej: COL-2024-001"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      CAR *
                      <span className="label-hint">Corporación Autónoma Regional</span>
                    </label>
                    <select
                      name="car_sigla"
                      value={formData.car_sigla}
                      onChange={handleChange}
                      className="form-select"
                      required
                    >
                      <option value="">-- Selecciona una CAR --</option>
                      {CARS_COLOMBIA.map(car => (
                        <option key={car.sigla} value={car.sigla}>
                          {car.sigla} - {car.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Ubicación Administrativa */}
              <div className="form-section">
                <h4>Ubicación Administrativa</h4>
                {loadingGeo && <LoadingSpinner mensaje="Cargando ubicaciones..." />}
                
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">
                      Región *
                      <span className="label-hint">Región natural de Colombia</span>
                    </label>
                    <select
                      name="region_id"
                      value={formData.region_id}
                      onChange={handleChange}
                      className="form-select"
                      disabled={loadingGeo}
                      required
                    >
                      <option value="">-- Selecciona una región --</option>
                      {regiones.map(region => (
                        <option key={region.id} value={region.id}>
                          {region.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Departamento *
                      <span className="label-hint">Departamento según región</span>
                    </label>
                    <select
                      name="departamento_id"
                      value={formData.departamento_id}
                      onChange={handleChange}
                      className="form-select"
                      disabled={!formData.region_id || loadingGeo}
                      required
                    >
                      <option value="">-- Selecciona un departamento --</option>
                      {departamentos.map(depto => (
                        <option key={depto.id} value={depto.id}>
                          {depto.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      Municipio *
                      <span className="label-hint">Municipio según departamento</span>
                    </label>
                    <select
                      name="municipio_id"
                      value={formData.municipio_id}
                      onChange={handleChange}
                      className="form-select"
                      disabled={!formData.departamento_id || loadingGeo}
                      required
                    >
                      <option value="">-- Selecciona un municipio --</option>
                      {municipios.map(muni => (
                        <option key={muni.id} value={muni.id}>
                          {muni.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB: SUBPARCELAS */}
          {activeTab === 'subparcelas' && (
            <div className="form-section">
              <h4>Subparcelas Prediligenciadas</h4>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>
                Coordenadas calculadas automáticamente a 80 metros del punto central en cada dirección cardinal
              </p>
              
              {conglomerado.conglomerados_subparcelas && conglomerado.conglomerados_subparcelas.length > 0 ? (
                <div className="subparcelas-info-compact">
                  <table>
                    <thead>
                      <tr>
                        <th style={{ width: '60px' }}>#</th>
                        <th style={{ width: '100px' }}>Dirección</th>
                        <th>Latitud Prediligenciada</th>
                        <th>Longitud Prediligenciada</th>
                        <th style={{ width: '120px' }}>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {conglomerado.conglomerados_subparcelas
                        .sort((a, b) => a.subparcela_num - b.subparcela_num)
                        .map(spf => {
                          const direcciones = {
                            1: { emoji: '📍', text: 'Centro' },
                            2: { emoji: '⬆️', text: 'Norte' },
                            3: { emoji: '➡️', text: 'Este' },
                            4: { emoji: '⬇️', text: 'Sur' },
                            5: { emoji: '⬅️', text: 'Oeste' }
                          };
                          const dir = direcciones[spf.subparcela_num] || { emoji: '❓', text: 'Desconocido' };
                          
                          return (
                            <tr key={spf.id}>
                              <td><strong style={{ fontSize: '14px' }}>SPF{spf.subparcela_num}</strong></td>
                              <td>
                                <span style={{ fontSize: '13px' }}>
                                  {dir.emoji} {dir.text}
                                </span>
                              </td>
                              <td className="coord-cell">{parseFloat(spf.latitud_prediligenciada).toFixed(6)}</td>
                              <td className="coord-cell">{parseFloat(spf.longitud_prediligenciada).toFixed(6)}</td>
                              <td>
                                {spf.se_establecio ? (
                                  <span className="badge-success">✓ Establecida</span>
                                ) : (
                                  <span className="badge-pending">⏳ Pendiente</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="empty-state-small">
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  <p>No hay subparcelas registradas</p>
                  <p style={{ fontSize: '12px', marginTop: '8px' }}>
                    Las subparcelas se generan automáticamente al crear el conglomerado
                  </p>
                </div>
              )}
            </div>
          )}
        </form>

        <div className="modal-footer">
          <button type="button" onClick={onClose} className="btn-cancel">
            Cancelar
          </button>
          <button 
            onClick={handleSubmit} 
            disabled={loading || loadingGeo || activeTab !== 'ubicacion'}
            className="btn-primary"
          >
            {loading ? (
              <>
                <svg className="spinner" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                </svg>
                Guardando...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                Guardar Cambios
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}