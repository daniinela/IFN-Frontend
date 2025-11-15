// src/components/CoordenadasInput.jsx
import { useState, useEffect } from 'react';
import './CoordenadasInput.css';

function CoordenadasInput({ label, value, onChange, tipo = 'lat', required = false, disabled = false }) {
  const [grados, setGrados] = useState('');
  const [minutos, setMinutos] = useState('');
  const [segundos, setSegundos] = useState('');
  const [error, setError] = useState('');

  // Parsear coordenada DMS al montar
  useEffect(() => {
    if (value) {
      const match = value.match(/^(-?\d{1,3})°(\d{1,2})'([\d.]{1,5})''$/);
      if (match) {
        setGrados(match[1]);
        setMinutos(match[2]);
        setSegundos(match[3]);
      }
    }
  }, [value]);

  const validarYActualizar = (g, m, s) => {
    setError('');
    
    // Validar rangos
    const gradosNum = parseInt(g) || 0;
    const minutosNum = parseInt(m) || 0;
    const segundosNum = parseFloat(s) || 0;

    if (tipo === 'lat') {
      if (gradosNum < -90 || gradosNum > 90) {
        setError('Latitud debe estar entre -90° y 90°');
        return;
      }
    } else {
      if (gradosNum < -180 || gradosNum > 180) {
        setError('Longitud debe estar entre -180° y 180°');
        return;
      }
    }

    if (minutosNum < 0 || minutosNum > 59) {
      setError('Minutos deben estar entre 0 y 59');
      return;
    }

    if (segundosNum < 0 || segundosNum >= 60) {
      setError('Segundos deben estar entre 0 y 59.99');
      return;
    }

    // Construir formato DMS
    if (g && m && s) {
      const coordenada = `${g}°${m}'${s}''`;
      onChange(coordenada);
    }
  };

  const handleGradosChange = (e) => {
    const val = e.target.value;
    setGrados(val);
    validarYActualizar(val, minutos, segundos);
  };

  const handleMinutosChange = (e) => {
    const val = e.target.value;
    setMinutos(val);
    validarYActualizar(grados, val, segundos);
  };

  const handleSegundosChange = (e) => {
    const val = e.target.value;
    setSegundos(val);
    validarYActualizar(grados, minutos, val);
  };

  return (
    <div className="coordenadas-input-group">
      <label className="coord-label">
        {label} {required && <span className="required">*</span>}
      </label>
      
      <div className="coord-inputs">
        <div className="coord-field">
          <input
            type="number"
            value={grados}
            onChange={handleGradosChange}
            placeholder="°"
            className="coord-input"
            disabled={disabled}
            min={tipo === 'lat' ? -90 : -180}
            max={tipo === 'lat' ? 90 : 180}
          />
          <span className="coord-unit">°</span>
        </div>

        <div className="coord-field">
          <input
            type="number"
            value={minutos}
            onChange={handleMinutosChange}
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
            onChange={handleSegundosChange}
            placeholder="''"
            className="coord-input"
            disabled={disabled}
            min="0"
            max="59.99"
          />
          <span className="coord-unit">''</span>
        </div>
      </div>

      {error && <p className="coord-error">{error}</p>}
      
      {value && !error && (
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