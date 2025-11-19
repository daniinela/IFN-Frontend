// src/components/common/CoordenadasInput.jsx
import { useState, useEffect } from 'react';
import './CoordenadasInput.css';

// 🛰️ CONVERSIÓN DECIMAL A DMS (CORREGIDA)
const decimalADMS = (decimal, tipo) => {
  const absoluto = Math.abs(decimal);
  const grados = Math.floor(absoluto);
  const minutos = Math.floor((absoluto - grados) * 60);
  const segundos = ((absoluto - grados - minutos / 60) * 3600).toFixed(2);
  
  let direccion = '';
  if (tipo === 'lat') {
    direccion = decimal >= 0 ? 'N' : 'S';
  } else if (tipo === 'lon') {
    direccion = decimal >= 0 ? 'E' : 'W';
  }
  
  return `${grados}°${minutos}'${segundos}"${direccion}`;
};

function CoordenadasInput({ 
  label, 
  value, 
  onChange, 
  tipo = 'lat', 
  required = false, 
  disabled = false,
  onUbicacionCapturada
}) {
  const [grados, setGrados] = useState('');
  const [minutos, setMinutos] = useState('');
  const [segundos, setSegundos] = useState('');
  const [direccion, setDireccion] = useState(tipo === 'lat' ? 'N' : 'W'); // Default W para Colombia
  const [error, setError] = useState('');
  const [capturandoGPS, setCapturandoGPS] = useState(false);
  const [gpsExito, setGpsExito] = useState('');

  // Parsear valor inicial formato DMS
  useEffect(() => {
    if (value && typeof value === 'string') {
      const match = value.match(/^(\d+)°(\d+)'([\d.]+)"([NSEW])$/);
      if (match) {
        const [, g, m, s, dir] = match;
        setGrados(g);
        setMinutos(m);
        setSegundos(s);
        setDireccion(dir);
      }
    }
  }, [value]);

  const validarYActualizar = (g, m, s, dir) => {
    setError('');
    
    const gradosNum = parseInt(g) || 0;
    const minutosNum = parseInt(m) || 0;
    const segundosNum = parseFloat(s) || 0;

    // ✅ Validación corregida
    if (tipo === 'lat' && (gradosNum < 0 || gradosNum > 90)) {
      setError('Latitud: grados entre 0 y 90');
      return;
    }
    
    if (tipo === 'lon' && (gradosNum < 0 || gradosNum > 180)) {
      setError('Longitud: grados entre 0 y 180');
      return;
    }

    if (minutosNum < 0 || minutosNum > 59) {
      setError('Minutos deben estar entre 0 y 59');
      return;
    }

    if (segundosNum < 0 || segundosNum >= 60) {
      setError('Segundos deben estar entre 0 y 59.99');
      return;
    }

    // ✅ Construir coordenada correctamente
    if (g && m && s && dir) {
      const coordenada = `${g}°${m}'${s}"${dir}`;
      onChange(coordenada);
    }
  };

  // 🛰️ CAPTURAR UBICACIÓN GPS (CORREGIDA)
  const capturarUbicacion = () => {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización');
      return;
    }
    
    setCapturandoGPS(true);
    setError('');
    setGpsExito('');
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        console.log('📍 GPS Capturado:', { latitude, longitude, accuracy });
        
        // ✅ Convertir correctamente a DMS
        const latDMS = decimalADMS(latitude, 'lat');
        const lonDMS = decimalADMS(longitude, 'lon');
        
        console.log('📍 DMS Convertido:', { latDMS, lonDMS });
        
        // Aplicar el valor correspondiente según el tipo
        const valorDMS = tipo === 'lat' ? latDMS : lonDMS;
        
        // Parsear y llenar inputs
        const match = valorDMS.match(/^(\d+)°(\d+)'([\d.]+)"([NSEW])$/);
        if (match) {
          const [, g, m, s, dir] = match;
          setGrados(g);
          setMinutos(m);
          setSegundos(s);
          setDireccion(dir);
          validarYActualizar(g, m, s, dir);
        }
        
        setGpsExito(`±${accuracy.toFixed(1)}m`);
        setCapturandoGPS(false);
        
        // 🆕 Callback para auto-completar otros campos
        if (onUbicacionCapturada) {
          onUbicacionCapturada({
            latitud: latDMS,
            longitud: lonDMS,
            error_gps_m: accuracy.toFixed(1),
            coordenadas_decimales: { latitude, longitude }
          });
        }
      },
      (error) => {
        console.error('❌ Error GPS:', error);
        setCapturandoGPS(false);
        
        switch(error.code) {
          case error.PERMISSION_DENIED:
            setError('Permiso de ubicación denegado');
            break;
          case error.POSITION_UNAVAILABLE:
            setError('Ubicación no disponible');
            break;
          case error.TIMEOUT:
            setError('Tiempo de espera agotado');
            break;
          default:
            setError('Error obteniendo ubicación');
        }
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0 
      }
    );
  };

  return (
    <div className="coordenadas-input-group">
      <label className="coord-label">
        {label} {required && <span className="required">*</span>}
      </label>
      
      <div className="coord-container">
        <div className="coord-inputs">
          <div className="coord-field">
            <input
              type="number"
              value={grados}
              onChange={(e) => {
                setGrados(e.target.value);
                validarYActualizar(e.target.value, minutos, segundos, direccion);
              }}
              placeholder="°"
              className="coord-input"
              disabled={disabled}
              min="0"
              max={tipo === 'lat' ? 90 : 180}
            />
            <span className="coord-unit">°</span>
          </div>

          <div className="coord-field">
            <input
              type="number"
              value={minutos}
              onChange={(e) => {
                setMinutos(e.target.value);
                validarYActualizar(grados, e.target.value, segundos, direccion);
              }}
              placeholder="'"
              className="coord-input"
              disabled={disabled}
              min="0"
              max="59"
            />
            <span className="coord-unit">'</span>
          </div>

          <div className="coord-field">
            <input
              type="number"
              step="0.01"
              value={segundos}
              onChange={(e) => {
                setSegundos(e.target.value);
                validarYActualizar(grados, minutos, e.target.value, direccion);
              }}
              placeholder="''"
              className="coord-input"
              disabled={disabled}
              min="0"
              max="59.99"
            />
            <span className="coord-unit">''</span>
          </div>

          {/* ✅ SELECTOR DE DIRECCIÓN */}
          <div className="coord-field">
            <select
              value={direccion}
              onChange={(e) => {
                setDireccion(e.target.value);
                validarYActualizar(grados, minutos, segundos, e.target.value);
              }}
              className="coord-select"
              disabled={disabled}
            >
              {tipo === 'lat' ? (
                <>
                  <option value="N">N</option>
                  <option value="S">S</option>
                </>
              ) : (
                <>
                  <option value="E">E</option>
                  <option value="W">W</option>
                </>
              )}
            </select>
          </div>
        </div>

        {/* 🛰️ BOTÓN GPS */}
        {!disabled && (
          <button
            type="button"
            onClick={capturarUbicacion}
            disabled={capturandoGPS}
            className="btn-gps"
            title="Usar mi ubicación"
          >
            {capturandoGPS ? (
              <svg className="spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="2" x2="12" y2="6" />
                <line x1="12" y1="18" x2="12" y2="22" />
                <line x1="4.93" y1="4.93" x2="7.76" y2="7.76" />
                <line x1="16.24" y1="16.24" x2="19.07" y2="19.07" />
                <line x1="2" y1="12" x2="6" y2="12" />
                <line x1="18" y1="12" x2="22" y2="12" />
                <line x1="4.93" y1="19.07" x2="7.76" y2="16.24" />
                <line x1="16.24" y1="7.76" x2="19.07" y2="4.93" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="3" />
                <line x1="12" y1="2" x2="12" y2="10" />
                <line x1="12" y1="14" x2="12" y2="22" />
                <line x1="2" y1="12" x2="10" y2="12" />
                <line x1="14" y1="12" x2="22" y2="12" />
              </svg>
            )}
          </button>
        )}
      </div>

      {error && (
        <p className="coord-error">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
          {error}
        </p>
      )}
      
      {gpsExito && (
        <p className="coord-success">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Ubicación capturada ({gpsExito})
        </p>
      )}
      
      {value && !error && !gpsExito && (
        <p className="coord-preview">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          {value}
        </p>
      )}
    </div>
  );
}

export default CoordenadasInput;