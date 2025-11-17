import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './LeafletMapComponent.css';

// ===============================================
// FIX: Iconos rotos de Leaflet
// ===============================================
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Iconos personalizados para cada subparcela
const createCustomIcon = (color, size = 'normal') => {
  const iconSize = size === 'large' ? [32, 45] : [25, 38];
  const iconAnchor = size === 'large' ? [16, 45] : [12, 38];
  
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        width: ${iconSize[0]}px; 
        height: ${iconSize[1]}px; 
        position: relative;
      ">
        <svg viewBox="0 0 24 36" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M12 0C5.4 0 0 5.4 0 12c0 9 12 24 12 24s12-15 12-24c0-6.6-5.4-12-12-12z" 
            fill="${color}" 
            stroke="white" 
            stroke-width="2"
          />
          <circle cx="12" cy="12" r="4" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: iconSize,
    iconAnchor: iconAnchor,
    popupAnchor: [0, -iconAnchor[1]]
  });
};

export default function LeafletMapComponent({ 
  latitud, 
  longitud, 
  codigo,
  subparcelas = [],
  zoom = 15,
  height = '450px'
}) {
  const mapContainer = useRef(null);
  const mapInstance = useRef(null);

  useEffect(() => {
    // 1. Validar contenedor y coordenadas
    if (!mapContainer.current) {
      console.log('⚠️ Contenedor no existe aún');
      return; 
    }
    
    // 2. Destruir mapa existente
    if (mapInstance.current) {
      console.log('🗑️ Destruyendo mapa anterior');
      mapInstance.current.remove();
      mapInstance.current = null;
    }

    const lat = parseFloat(latitud);
    const lng = parseFloat(longitud);

    if (isNaN(lat) || isNaN(lng)) {
      console.error('❌ Coordenadas inválidas:', { latitud, longitud });
      return;
    }

    console.log('🗺️ Inicializando Leaflet:', { 
      lat, 
      lng, 
      codigo, 
      subparcelas: subparcelas?.length || 0 
    });

    try {
      // 3. Crear el mapa
      const map = L.map(mapContainer.current, {
        center: [lat, lng],
        zoom: zoom,
        zoomControl: true,
        scrollWheelZoom: true
      });

      mapInstance.current = map;

      // ===============================================
      // 🔥 CRÍTICO: TILES CON URL CORRECTA
      // ===============================================
      console.log('🌍 Agregando capa de tiles...');
      
      const tileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
        minZoom: 1,
        subdomains: ['a', 'b', 'c']
      });
      
      tileLayer.addTo(map);

      // Debug de tiles
      tileLayer.on('tileloadstart', () => {
        console.log('🔄 Tile empezando a cargar...');
      });

      tileLayer.on('tileload', () => {
        console.log('✅ Tile cargado exitosamente');
      });

      tileLayer.on('tileerror', (error) => {
        console.error('❌ Error cargando tile:', error);
      });

      // COLORES y Direcciones
      const colors = { 1: '#ef4444', 2: '#3b82f6', 3: '#10b981', 4: '#f59e0b', 5: '#8b5cf6' };
      const direcciones = { 1: '📍 Centro', 2: '⬆️ Norte', 3: '➡️ Este', 4: '⬇️ Sur', 5: '⬅️ Oeste' };

      const bounds = [];

      // MARCADOR CENTRAL
      const mainIcon = createCustomIcon('#ef4444', 'large');
      const mainMarker = L.marker([lat, lng], { icon: mainIcon }).addTo(map);
      
      mainMarker.bindPopup(`
        <div style="padding: 12px; min-width: 200px;">
          <strong style="color: #1f2937; font-size: 14px; display: block; margin-bottom: 8px;">
            ${codigo || 'Conglomerado'}
          </strong>
          <div style="padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <div style="font-size: 12px; color: #6b7280; margin-bottom: 6px;">
              <strong>Punto Central</strong>
            </div>
            <div style="font-size: 11px; color: #374151; font-family: monospace;">
              <div><strong>Lat:</strong> ${lat.toFixed(6)}</div>
              <div><strong>Lng:</strong> ${lng.toFixed(6)}</div>
            </div>
          </div>
        </div>
      `).openPopup();

      bounds.push([lat, lng]);

      // MARCADORES DE SUBPARCELAS
      if (subparcelas && subparcelas.length > 0) {
        subparcelas.forEach((spf) => {
          const spfLat = parseFloat(spf.latitud_prediligenciada);
          const spfLng = parseFloat(spf.longitud_prediligenciada);

          if (!isNaN(spfLat) && !isNaN(spfLng)) {
            if (spf.subparcela_num === 1) {
              bounds.push([spfLat, spfLng]);
              return;
            }

            const spfIcon = createCustomIcon(colors[spf.subparcela_num] || '#64748b', 'normal');
            const marker = L.marker([spfLat, spfLng], { icon: spfIcon }).addTo(map);

            marker.bindPopup(`
              <div style="padding: 10px; min-width: 180px;">
                <strong style="color: ${colors[spf.subparcela_num]}; font-size: 13px; display: block; margin-bottom: 4px;">
                  SPF${spf.subparcela_num}
                </strong>
                <div style="font-size: 11px; color: #6b7280; margin-bottom: 8px;">
                  ${direcciones[spf.subparcela_num]}
                </div>
                <div style="padding-top: 6px; border-top: 1px solid #e5e7eb;">
                  <div style="font-size: 10px; color: #374151; font-family: monospace;">
                    <div><strong>Lat:</strong> ${spfLat.toFixed(6)}</div>
                    <div><strong>Lng:</strong> ${spfLng.toFixed(6)}</div>
                  </div>
                </div>
                <div style="margin-top: 8px; padding: 5px; background: ${spf.se_establecio ? '#d1fae5' : '#fef3c7'}; color: ${spf.se_establecio ? '#065f46' : '#92400e'}; border-radius: 4px; font-size: 10px; text-align: center; font-weight: 600;">
                  ${spf.se_establecio ? '✓ Establecida' : '⏳ Pendiente'}
                </div>
              </div>
            `);

            bounds.push([spfLat, spfLng]);
          }
        });

        // Ajustar vista para mostrar todos los marcadores
        if (bounds.length > 1) {
          map.fitBounds(bounds, { 
            padding: [50, 50],
            maxZoom: 16 
          });
        }
      }

      console.log('✅ Mapa Leaflet inicializado con', subparcelas?.length || 0, 'subparcelas');
      
      // ===============================================
      // CRÍTICO: invalidateSize() múltiples veces
      // ===============================================
      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
          console.log('🔄 invalidateSize() #1');
        }
      }, 0);

      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
          console.log('🔄 invalidateSize() #2');
        }
      }, 100);

      setTimeout(() => {
        if (mapInstance.current) {
          mapInstance.current.invalidateSize();
          console.log('✨ invalidateSize() #3 (FINAL)');
        }
      }, 300);

    } catch (error) {
      console.error('❌ Error inicializando Leaflet:', error);
    }

    // Cleanup
    return () => {
      if (mapInstance.current) {
        console.log('🧹 Limpiando mapa...');
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, [latitud, longitud, codigo, zoom, subparcelas]);

  return (
    <div className="leaflet-map-container" style={{ height, width: '100%' }}>
      <div 
        ref={mapContainer} 
        style={{ 
          height: '100%', 
          width: '100%',
          borderRadius: '12px',
          overflow: 'hidden',
          zIndex: 1
        }} 
      />
    </div>
  );
}