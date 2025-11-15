// src/components/common/LoadingSpinner.jsx
export default function LoadingSpinner({ mensaje = 'Cargando...', size = 'medium' }) {
  const sizeClasses = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  };

  return (
    <div className="loading-container">
      <div className={`spinner ${sizeClasses[size]}`}></div>
      <p className="loading-text">{mensaje}</p>
    </div>
  );
}