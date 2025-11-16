// src/components/common/LoadingSpinner.jsx
import './LoadingSpinner.css';

export default function LoadingSpinner({ mensaje = 'Cargando...' }) {
  return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p className="loading-message">{mensaje}</p>
    </div>
  );
}