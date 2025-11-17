// src/components/common/MapBoxComponent.jsx
import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function MapboxComponent({ 
  latitud, 
  longitud, 
  codigo,
  subparcelas = [], // Array de subparcelas con {subparcela_num, latitud_prediligenciada, longitud_prediligenciada}
  zoom = 13,
  height = '400px'
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    if (map.current) return;

    const lat = parseFloat(latitud);
    const lng = parseFloat(longitud);

    if (isNaN(lat) || isNaN(lng)) {
      console.error('Coordenadas inválidas:', { latitud, longitud });
      return;
    }

    console.log('🗺️ Inicializando mapa:', { 
      lat, 
      lng, 
      codigo, 
      subparcelas: subparcelas?.length || 0,
      subparcelasData: subparcelas 
    });

    try {
      // Inicializar mapa
      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        center: [lng, lat],
        zoom: zoom,
        attributionControl: false
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // ========== MARCADOR CENTRAL (Rojo) ==========
      const mainMarker = new mapboxgl.Marker({ 
        color: '#ef4444',
        scale: 1.2
      })
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
            .setHTML(`
              <div style="padding: 10px; min-width: 200px;">
                <strong style="color: #1f2937; font-size: 14px;">${codigo || 'Conglomerado'}</strong>
                <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
                  <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                    <strong>Punto Central</strong>
                  </div>
                  <div style="font-size: 11px; color: #374151; font-family: monospace;">
                    <div>Lat: ${lat.toFixed(6)}</div>
                    <div>Lng: ${lng.toFixed(6)}</div>
                  </div>
                </div>
              </div>
            `)
        )
        .addTo(map.current);

      mainMarker.togglePopup();

      // ========== MARCADORES DE SUBPARCELAS (Azules) ==========
      if (subparcelas && subparcelas.length > 0) {
        const colors = {
          1: '#ef4444', // Centro - Rojo (ya está arriba)
          2: '#3b82f6', // Norte - Azul
          3: '#10b981', // Este - Verde
          4: '#f59e0b', // Sur - Naranja
          5: '#8b5cf6'  // Oeste - Morado
        };

        const direcciones = {
          1: '📍 Centro',
          2: '⬆️ Norte',
          3: '➡️ Este',
          4: '⬇️ Sur',
          5: '⬅️ Oeste'
        };

        subparcelas.forEach((spf) => {
          const spfLat = parseFloat(spf.latitud_prediligenciada);
          const spfLng = parseFloat(spf.longitud_prediligenciada);

          if (!isNaN(spfLat) && !isNaN(spfLng)) {
            // No mostrar el SPF1 (centro) porque ya está el marcador principal
            if (spf.subparcela_num === 1) return;

            new mapboxgl.Marker({ 
              color: colors[spf.subparcela_num] || '#64748b',
              scale: 0.8
            })
              .setLngLat([spfLng, spfLat])
              .setPopup(
                new mapboxgl.Popup({ offset: 20 })
                  .setHTML(`
                    <div style="padding: 8px; min-width: 180px;">
                      <strong style="color: ${colors[spf.subparcela_num]}; font-size: 13px;">
                        SPF${spf.subparcela_num}
                      </strong>
                      <div style="font-size: 11px; color: #6b7280; margin-top: 2px;">
                        ${direcciones[spf.subparcela_num]}
                      </div>
                      <div style="margin-top: 6px; padding-top: 6px; border-top: 1px solid #e5e7eb;">
                        <div style="font-size: 10px; color: #374151; font-family: monospace;">
                          <div>Lat: ${spfLat.toFixed(6)}</div>
                          <div>Lng: ${spfLng.toFixed(6)}</div>
                        </div>
                      </div>
                      ${spf.se_establecio ? 
                        '<div style="margin-top: 6px; padding: 4px 8px; background: #d1fae5; color: #065f46; border-radius: 4px; font-size: 10px; text-align: center;">✓ Establecida</div>' 
                        : 
                        '<div style="margin-top: 6px; padding: 4px 8px; background: #fef3c7; color: #92400e; border-radius: 4px; font-size: 10px; text-align: center;">Pendiente</div>'
                      }
                    </div>
                  `)
              )
              .addTo(map.current);
          }
        });

        // Ajustar el mapa para mostrar todos los marcadores
        const bounds = new mapboxgl.LngLatBounds();
        bounds.extend([lng, lat]); // Punto central

        subparcelas.forEach(spf => {
          const spfLat = parseFloat(spf.latitud_prediligenciada);
          const spfLng = parseFloat(spf.longitud_prediligenciada);
          if (!isNaN(spfLat) && !isNaN(spfLng)) {
            bounds.extend([spfLng, spfLat]);
          }
        });

        map.current.fitBounds(bounds, {
          padding: { top: 80, bottom: 80, left: 80, right: 80 },
          maxZoom: 16
        });
      }

      console.log('✅ Mapa con subparcelas inicializado');

    } catch (error) {
      console.error('❌ Error inicializando mapa:', error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [latitud, longitud, codigo, zoom, subparcelas]);

  return (
    <div 
      ref={mapContainer} 
      style={{ 
        width: '100%', 
        height: height,
        borderRadius: '12px',
        overflow: 'hidden'
      }} 
    />
  );
}