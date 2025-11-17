// src/components/common/LoadingSpinner.jsx
import './LoadingSpinner.css';

export default function LoadingSpinner({ mensaje = 'Cargando...' }) {
  return (
    <div className="loading-container">
      <div className="loading-spinner">
        <svg viewBox="0 0 50 50" className="spinner-svg">
          <circle 
            className="spinner-circle" 
            cx="25" 
            cy="25" 
            r="20" 
            fill="none" 
            strokeWidth="4"
          />
        </svg>
      </div>
      <p className="loading-message">{mensaje}</p>
    </div>
  );
}