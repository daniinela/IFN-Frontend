// src/components/common/ErrorAlert.jsx
export default function ErrorAlert({ mensaje, onClose, onRetry }) {
  return (
    <div className="error-alert">
      <div className="alert-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      
      <div className="alert-content">
        <strong>Error</strong>
        <p>{mensaje}</p>
      </div>
      
      <div className="alert-actions">
        {onRetry && (
          <button onClick={onRetry} className="btn-retry">
            🔄 Reintentar
          </button>
        )}
        {onClose && (
          <button onClick={onClose} className="btn-close">
            ✕
          </button>
        )}
      </div>
    </div>
  );
}