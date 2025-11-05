import { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import axios from '../../api/axiosConfig';
import './Conglomerados.css';

const API_CONGLOMERADOS = 'https://ifn-conglomerados-service.onrender.com';

function Conglomerados() {
  const [loading, setLoading] = useState(false);
  const [conglomerados, setConglomerados] = useState([]);
  const [estadisticas, setEstadisticas] = useState({
    sin_asignar: 0,
    en_revision: 0,
    aprobado: 0,
    rechazado_temporal: 0,
    rechazado_permanente: 0,
    total: 0
  });
  const [cantidad, setCantidad] = useState(50);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    cargarDatos();
  }, []);

  const cargarDatos = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const token = session.access_token;

      const [statsRes, congloRes] = await Promise.all([
        axios.get(`${API_CONGLOMERADOS}/api/conglomerados/estadisticas`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_CONGLOMERADOS}/api/conglomerados?limit=50`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      setEstadisticas(statsRes.data);
      setConglomerados(congloRes.data.data || []);
    } catch (error) {
      console.error('Error cargando datos:', error);
      setMessage({ type: 'error', text: 'Error al cargar datos' });
    } finally {
      setLoading(false);
    }
  };

  const generarBatch = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      const { data: { session } } = await supabase.auth.getSession();
      const token = session.access_token;

      await axios.post(
        `${API_CONGLOMERADOS}/api/conglomerados/generar-batch`,
        { cantidad },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ 
        type: 'success', 
        text: `✅ ${cantidad} conglomerados generados exitosamente` 
      });

      await cargarDatos();
    } catch (error) {
      console.error('Error generando:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Error al generar conglomerados' 
      });
    } finally {
      setLoading(false);
    }
  };

  const tomarConglomerado = async () => {
    try {
      setLoading(true);
      setMessage({ type: '', text: '' });

      const { data: { session } } = await supabase.auth.getSession();
      const token = session.access_token;

      const response = await axios.post(
        `${API_CONGLOMERADOS}/api/conglomerados/tomar-sin-asignar`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMessage({ 
        type: 'success', 
        text: `✅ Conglomerado ${response.data.conglomerado.codigo} asignado para revisión` 
      });

      await cargarDatos();
    } catch (error) {
      console.error('Error tomando:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.message || 'Error al tomar conglomerado' 
      });
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

  return (
    <div className="conglomerados-page">
      <div className="page-header">
        <h2>Gestión de Conglomerados</h2>
        <p>Sistema de Inventario Forestal Nacional</p>
      </div>

      {message.text && (
        <div className={`alert alert-${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <h3>{estadisticas.sin_asignar}</h3>
          <p>Sin Asignar</p>
        </div>
        <div className="stat-card">
          <h3>{estadisticas.en_revision}</h3>
          <p>En Revisión</p>
        </div>
        <div className="stat-card">
          <h3>{estadisticas.aprobado}</h3>
          <p>Aprobados</p>
        </div>
        <div className="stat-card">
          <h3>{estadisticas.total}</h3>
          <p>Total</p>
        </div>
      </div>

      <div className="actions-section">
        <div className="action-card">
          <h3>Generar Conglomerados</h3>
          <input
            type="number"
            min="1"
            max="1500"
            value={cantidad}
            onChange={(e) => setCantidad(parseInt(e.target.value))}
            placeholder="Cantidad"
          />
          <button onClick={generarBatch} disabled={loading}>
            {loading ? 'Generando...' : `Generar ${cantidad} Conglomerados`}
          </button>
        </div>

        <div className="action-card">
          <h3>Tomar para Revisar</h3>
          <p>Asigna un conglomerado sin asignar para tu revisión</p>
          <button onClick={tomarConglomerado} disabled={loading}>
            {loading ? 'Tomando...' : 'Tomar Conglomerado'}
          </button>
        </div>
      </div>

      <div className="table-section">
        <h3>Últimos Conglomerados ({conglomerados.length})</h3>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Latitud</th>
                <th>Longitud</th>
                <th>Estado</th>
                <th>Fecha Creación</th>
              </tr>
            </thead>
            <tbody>
              {conglomerados.map((c) => (
                <tr key={c.id}>
                  <td><code>{c.codigo}</code></td>
                  <td>{c.latitud}</td>
                  <td>{c.longitud}</td>
                  <td>
                    <span className={`badge ${getEstadoBadge(c.estado).class}`}>
                      {getEstadoBadge(c.estado).text}
                    </span>
                  </td>
                  <td>{new Date(c.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Conglomerados;