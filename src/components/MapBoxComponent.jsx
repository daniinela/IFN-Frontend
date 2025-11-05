// frontend/src/components/MapboxComponent.jsx
import { useState} from 'react';
import Map, { Marker, Popup, NavigationControl, FullscreenControl, ScaleControl } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './MapboxComponent.css';

function MapboxComponent({ latitud, longitud, codigo }) {
  const [showPopup, setShowPopup] = useState(false);
  const [viewState, setViewState] = useState({
    latitude: parseFloat(latitud),
    longitude: parseFloat(longitud),
    zoom: 12,
    pitch: 45,
    bearing: 0
  });

  const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

  // Validar que las props existan
  if (!latitud || !longitud || !codigo) {
    return (
      <div className="map-error">
        <p>⚠️ Faltan datos para mostrar el mapa</p>
      </div>
    );
  }

  return (
    <div className="mapbox-container">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        mapboxAccessToken={MAPBOX_TOKEN}
        className="mapbox-gl"
      >
        {/* Controles */}
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
        <ScaleControl position="bottom-left" unit="metric" />

        {/* Marcador */}
        <Marker
          latitude={parseFloat(latitud)}
          longitude={parseFloat(longitud)}
          anchor="bottom"
          onClick={() => setShowPopup(true)}
        >
          <div className="map-marker" />
        </Marker>

        {/* Popup */}
        {showPopup && (
          <Popup
            latitude={parseFloat(latitud)}
            longitude={parseFloat(longitud)}
            anchor="top"
            onClose={() => setShowPopup(false)}
            closeOnClick={false}
            className="map-popup"
          >
            <div className="popup-content">
              <h4>{codigo}</h4>
              <p><strong>Latitud:</strong> {latitud}°</p>
              <p><strong>Longitud:</strong> {longitud}°</p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}

export default MapboxComponent;