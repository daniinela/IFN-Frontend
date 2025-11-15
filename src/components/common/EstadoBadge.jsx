// src/components/common/EstadoBadge.jsx
export default function EstadoBadge({ estado, tipo = 'conglomerado' }) {
  const getEstilos = () => {
    if (tipo === 'conglomerado') {
      const estilos = {
        'en_revision': { color: '#94a3b8', icon: '🔍', texto: 'En Revisión' },
        'rechazado': { color: '#ef4444', icon: '✕', texto: 'Rechazado' },
        'listo_para_asignacion': { color: '#3b82f6', icon: '✓', texto: 'Listo para Asignar' },
        'asignado_a_jefe': { color: '#8b5cf6', icon: '👤', texto: 'Asignado a Jefe' },
        'en_ejecucion': { color: '#f59e0b', icon: '🚀', texto: 'En Ejecución' },
        'no_establecido': { color: '#ef4444', icon: '⚠️', texto: 'No Establecido' },
        'finalizado_campo': { color: '#10b981', icon: '🏁', texto: 'Finalizado' }
      };
      return estilos[estado] || { color: '#6b7280', icon: '?', texto: estado };
    }

    if (tipo === 'brigada') {
      const estilos = {
        'formacion': { color: '#6366f1', icon: '📋', texto: 'Formación' },
        'en_transito': { color: '#f59e0b', icon: '🚗', texto: 'En Tránsito' },
        'en_ejecucion': { color: '#3b82f6', icon: '🌲', texto: 'En Ejecución' },
        'completada': { color: '#10b981', icon: '✅', texto: 'Completada' },
        'cancelada': { color: '#ef4444', icon: '✕', texto: 'Cancelada' }
      };
      return estilos[estado] || { color: '#6b7280', icon: '?', texto: estado };
    }

    if (tipo === 'usuario') {
      const estilos = {
        'pendiente': { color: '#f59e0b', icon: '⏳', texto: 'Pendiente' },
        'aprobado': { color: '#10b981', icon: '✓', texto: 'Aprobado' },
        'rechazado': { color: '#ef4444', icon: '✕', texto: 'Rechazado' }
      };
      return estilos[estado] || { color: '#6b7280', icon: '?', texto: estado };
    }

    return { color: '#6b7280', icon: '?', texto: estado };
  };

  const estilos = getEstilos();

  return (
    <span 
      className="estado-badge" 
      style={{ 
        backgroundColor: estilos.color + '20',
        color: estilos.color,
        border: `1px solid ${estilos.color}50`,
        padding: '0.25rem 0.75rem',
        borderRadius: '6px',
        fontSize: '0.875rem',
        fontWeight: '600',
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem'
      }}
    >
      <span>{estilos.icon}</span>
      <span>{estilos.texto}</span>
    </span>
  );
}