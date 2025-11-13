import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import './Register.css';

const API_UBICACIONES = import.meta.env.VITE_API_UBICACIONES || 'http://localhost:3004';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function Register() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    nombre_completo: '',
    telefono: '',
    cedula: ''
  });

  // Estados para ubicación
  const [regiones, setRegiones] = useState([]);
  const [departamentos, setDepartamentos] = useState([]);
  const [municipios, setMunicipios] = useState([]);
  const [regionSeleccionada, setRegionSeleccionada] = useState('');
  const [departamentoSeleccionado, setDepartamentoSeleccionado] = useState('');
  const [municipioSeleccionado, setMunicipioSeleccionado] = useState('');

  const [titulos, setTitulos] = useState([{ titulo: '', institucion: '', anio: '' }]);
  const [experiencias, setExperiencias] = useState([{ cargo: '', empresa: '', fecha_inicio: '', fecha_fin: '', descripcion: '' }]);

  useEffect(() => {
    const manejarInvitacion = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          console.log('❌ Sin sesión');
          setError('Debes acceder mediante el link de invitación');
          return;
        }

        console.log('✅ Sesión encontrada:', session.user.email);
        
        setFormData(prev => ({
          ...prev,
          email: session.user.email
        }));
      } catch (err) {
        console.error('Error:', err);
        setError('Error verificando invitación');
      }
    };

    manejarInvitacion();
  }, []);

  useEffect(() => {
    const cargarRegiones = async () => {
      try {
        const response = await axios.get(`${API_UBICACIONES}/api/ubicaciones/regiones`);
        setRegiones(response.data || []);
      } catch (error) {
        console.error('Error cargando regiones:', error);
      }
    };
    cargarRegiones();
  }, []);

  useEffect(() => {
    if (!regionSeleccionada) {
      setDepartamentos([]);
      setMunicipios([]);
      return;
    }

    const cargarDepartamentos = async () => {
      try {
        const response = await axios.get(`${API_UBICACIONES}/api/ubicaciones/departamentos/region/${regionSeleccionada}`);
        setDepartamentos(response.data || []);
        setMunicipios([]);
        setDepartamentoSeleccionado('');
        setMunicipioSeleccionado('');
      } catch (error) {
        console.error('Error cargando departamentos:', error);
      }
    };
    cargarDepartamentos();
  }, [regionSeleccionada]);

  useEffect(() => {
    if (!departamentoSeleccionado) {
      setMunicipios([]);
      return;
    }

    const cargarMunicipios = async () => {
      try {
        const response = await axios.get(`${API_UBICACIONES}/api/ubicaciones/municipios/departamento/${departamentoSeleccionado}`);
        setMunicipios(response.data || []);
        setMunicipioSeleccionado('');
      } catch (error) {
        console.error('Error cargando municipios:', error);
      }
    };
    cargarMunicipios();
  }, [departamentoSeleccionado]);

  const validarFechas = () => {
    for (let exp of experiencias) {
      if (exp.fecha_inicio && exp.fecha_fin && exp.fecha_inicio > exp.fecha_fin) {
        setError('La fecha de inicio no puede ser posterior a la fecha de fin');
        return false;
      }
    }
    return true;
  };

  const agregarTitulo = () => setTitulos([...titulos, { titulo: '', institucion: '', anio: '' }]);
  const actualizarTitulo = (index, campo, valor) => {
    const nuevos = [...titulos];
    nuevos[index][campo] = valor;
    setTitulos(nuevos);
  };
  const eliminarTitulo = (index) => {
    if (titulos.length > 1) setTitulos(titulos.filter((_, i) => i !== index));
  };

  const agregarExperiencia = () => setExperiencias([...experiencias, { cargo: '', empresa: '', fecha_inicio: '', fecha_fin: '', descripcion: '' }]);
  const actualizarExperiencia = (index, campo, valor) => {
    const nuevas = [...experiencias];
    nuevas[index][campo] = valor;
    setExperiencias(nuevas);
  };
  const eliminarExperiencia = (index) => {
    if (experiencias.length > 1) setExperiencias(experiencias.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (formData.password !== formData.confirmPassword) {
        throw new Error('Las contraseñas no coinciden');
      }

      if (formData.password.length < 8) {
        throw new Error('La contraseña debe tener al menos 8 caracteres');
      }

      if (!validarFechas()) {
        setLoading(false);
        return;
      }

      if (!municipioSeleccionado) {
        throw new Error('Debes seleccionar tu municipio de residencia');
      }

      if (!formData.cedula || formData.cedula.length < 6) {
        throw new Error('Cédula inválida');
      }

      if (titulos.some(t => !t.titulo || !t.institucion || !t.anio)) {
        throw new Error('Por favor completa todos los títulos');
      }

      if (experiencias.some(e => !e.cargo || !e.empresa || !e.descripcion)) {
        throw new Error('Por favor completa toda la experiencia laboral');
      }

      const titulosCompletos = titulos.filter(t => t.titulo && t.institucion && t.anio);
      const experienciasCompletas = experiencias.filter(e => e.cargo && e.empresa && e.descripcion);

      console.log('📧 COMPLETANDO INVITACIÓN...');
      
      const { data, error } = await supabase.auth.updateUser({
        password: formData.password,
        data: {
          nombre_completo: formData.nombre_completo,
          rol: 'brigadista'
        }
      });

      if (error) {
        console.error('❌ Error Auth:', error);
        throw new Error('Error estableciendo contraseña: ' + error.message);
      }
      
      if (!data.user?.id) {
        throw new Error('No se pudo obtener ID de usuario');
      }

      const userId = data.user.id;
      console.log('✅ Contraseña establecida. User ID:', userId);

      console.log('💾 Guardando en tabla usuarios...');
      try {
        await axios.post('http://localhost:3001/api/usuarios', {
          id: userId,
          email: formData.email,
          cedula: formData.cedula,
          nombre_completo: formData.nombre_completo,
          telefono: formData.telefono || null
        });
        console.log('✅ Usuario guardado en BD');
      } catch (err) {
        console.error('❌ Error usuarios:', err.response?.data || err.message);
        throw new Error('Error guardando usuario: ' + (err.response?.data?.error || err.message));
      }

      console.log('💾 Creando brigadista...');
      try {
        await axios.post('http://localhost:3002/api/brigadistas/registro/nuevo', {
          user_id: userId,
          municipio_id: municipioSeleccionado,
          titulos: titulosCompletos,
          experiencia_laboral: experienciasCompletas
        });
        console.log('✅ Brigadista creado');
      } catch (err) {
        console.error('❌ Error brigadista:', err.response?.data || err.message);
        await axios.delete(`http://localhost:3001/api/usuarios/${userId}`).catch(console.error);
        throw new Error('Error creando brigadista: ' + (err.response?.data?.error || err.message));
      }

      console.log('✉️ Confirmando email...');
      await axios.post(`http://localhost:3001/api/usuarios/confirmar-email/${userId}`).catch(console.error);

      console.log('✅ REGISTRO COMPLETADO');
      alert('¡Registro completado exitosamente! Ya puedes iniciar sesión.');
      navigate('/login');

    } catch (error) {
      console.error('❌ ERROR EN REGISTRO:', error);
      setError(error.message || 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  if (error && error.includes('solo para usuarios invitados')) {
    return (
      <div className="forest-bg">
        <div className="register-container">
          <div className="register-card">
            <div className="error-alert">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="currentColor"/>
              </svg>
              <span>{error}</span>
            </div>
            <button onClick={() => navigate('/login')} className="btn-submit">
              Ir a Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="forest-bg">
      <div className="particles-register">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>
      <div className="register-container">
        <div className="register-card">
          <div className="register-header">
            <div className="header-icon">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 17L12 22L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12L12 17L22 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h2>Completar Invitación</h2>
            <p>Completa tus datos para finalizar el registro</p>
          </div>
          <div className="register-body">
            {error && (
              <div className="error-alert">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 0C4.48 0 0 4.48 0 10C0 15.52 4.48 20 10 20C15.52 20 20 15.52 20 10C20 4.48 15.52 0 10 0ZM11 15H9V13H11V15ZM11 11H9V5H11V11Z" fill="currentColor"/>
                </svg>
                <span>{error}</span>
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h3 className="section-title">Datos Personales</h3>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Email</label>
                    <input 
                      type="email" 
                      className="form-input form-input-readonly" 
                      value={formData.email}
                      readOnly
                    />
                  </div>
                  <div className="form-group">
                    <label>Teléfono</label>
                    <input 
                      type="tel" 
                      className="form-input"
                      placeholder="3001234567"
                      value={formData.telefono || ''}
                      onChange={(e) => {
                        const soloNumeros = e.target.value.replace(/[^0-9]/g, '');
                        if (soloNumeros.length <= 10) {
                          setFormData({ ...formData, telefono: soloNumeros });
                        }
                      }}
                      maxLength="10"
                    />
                  </div>
                </div>
                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Contraseña *</label>
                    <input 
                      type="password" 
                      className="form-input"
                      placeholder="Mínimo 8 caracteres"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      required
                      minLength="8"
                    />
                  </div>
                  <div className="form-group">
                    <label>Confirmar Contraseña *</label>
                    <input 
                      type="password" 
                      className="form-input"
                      placeholder="Repite la contraseña"
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>Nombre Completo *</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Nombres y apellidos"
                    value={formData.nombre_completo}
                    onChange={(e) => setFormData({ ...formData, nombre_completo: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Cédula *</label>
                  <input 
                    type="text" 
                    className="form-input"
                    placeholder="Número de cédula"
                    value={formData.cedula}
                    onChange={(e) => {
                      const soloNumeros = e.target.value.replace(/[^0-9]/g, '');
                      if (soloNumeros.length <= 12) {
                        setFormData({ ...formData, cedula: soloNumeros });
                      }
                    }}
                    required
                    minLength="6"
                    maxLength="12"
                  />
                </div>

                <div className="form-group">
                  <label>Región *</label>
                  <select 
                    className="form-select"
                    value={regionSeleccionada}
                    onChange={(e) => setRegionSeleccionada(e.target.value)}
                    required
                  >
                    <option value="">Selecciona tu región</option>
                    {regiones.map(region => (
                      <option key={region.id} value={region.id}>
                        {region.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-grid-2">
                  <div className="form-group">
                    <label>Departamento *</label>
                    <select 
                      className="form-select form-select-disabled"
                      value={departamentoSeleccionado}
                      onChange={(e) => setDepartamentoSeleccionado(e.target.value)}
                      disabled={!regionSeleccionada}
                      required
                    >
                      <option value="">Selecciona departamento</option>
                      {departamentos.map(depto => (
                        <option key={depto.id} value={depto.id}>
                          {depto.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Municipio *</label>
                    <select 
                      className="form-select form-select-disabled"
                      value={municipioSeleccionado}
                      onChange={(e) => setMunicipioSeleccionado(e.target.value)}
                      disabled={!departamentoSeleccionado}
                      required
                    >
                      <option value="">Selecciona municipio</option>
                      {municipios.map(mun => (
                        <option key={mun.id} value={mun.id}>
                          {mun.nombre}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-title">Títulos Académicos</h3>
                {titulos.map((titulo, index) => (
                  <div key={index} className="subsection-card">
                    <div className="subsection-header">
                      <span>Título {index + 1}</span>
                      {titulos.length > 1 && (
                        <button 
                          type="button" 
                          className="btn-delete-mini"
                          onClick={() => eliminarTitulo(index)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="form-grid-3">
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Título obtenido"
                        value={titulo.titulo}
                        onChange={(e) => actualizarTitulo(index, 'titulo', e.target.value)}
                        required
                      />
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Institución"
                        value={titulo.institucion}
                        onChange={(e) => actualizarTitulo(index, 'institucion', e.target.value)}
                        required
                      />
                      <input 
                        type="number" 
                        className="form-input" 
                        placeholder="Año"
                        min="1950"
                        max={new Date().getFullYear()}
                        value={titulo.anio}
                        onChange={(e) => actualizarTitulo(index, 'anio', e.target.value)}
                        required
                      />
                    </div>
                  </div>
                ))}
                <button type="button" className="btn-add" onClick={agregarTitulo}>
                  + Agregar Título
                </button>
              </div>

              <div className="form-section">
                <h3 className="section-title">Experiencia Laboral</h3>
                {experiencias.map((exp, index) => (
                  <div key={index} className="subsection-card">
                    <div className="subsection-header">
                      <span>Experiencia {index + 1}</span>
                      {experiencias.length > 1 && (
                        <button 
                          type="button" 
                          className="btn-delete-mini"
                          onClick={() => eliminarExperiencia(index)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                    <div className="form-grid-2">
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Cargo"
                        value={exp.cargo}
                        onChange={(e) => actualizarExperiencia(index, 'cargo', e.target.value)}
                        required
                      />
                      <input 
                        type="text" 
                        className="form-input" 
                        placeholder="Empresa"
                        value={exp.empresa}
                        onChange={(e) => actualizarExperiencia(index, 'empresa', e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-grid-2">
                      <div className="form-group">
                        <label className="label-small">Fecha inicio</label>
                        <input 
                          type="date" 
                          className="form-input"
                          value={exp.fecha_inicio}
                          onChange={(e) => actualizarExperiencia(index, 'fecha_inicio', e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-group">
                        <label className="label-small">Fecha fin</label>
                        <input 
                          type="date" 
                          className="form-input"
                          value={exp.fecha_fin}
                          onChange={(e) => actualizarExperiencia(index, 'fecha_fin', e.target.value)}
                        />
                      </div>
                    </div>
                    <textarea 
                      className="form-textarea"
                      placeholder="Describe tus funciones y logros principales..."
                      value={exp.descripcion}
                      onChange={(e) => actualizarExperiencia(index, 'descripcion', e.target.value)}
                      required
                      rows="3"
                    />
                  </div>
                ))}
                <button type="button" className="btn-add" onClick={agregarExperiencia}>
                  + Agregar Experiencia
                </button>
              </div>

              <button type="submit" disabled={loading} className="btn-submit">
                {loading ? 'Registrando...' : 'Completar Registro'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;