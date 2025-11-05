// frontend/src/components/WeatherWidget.jsx
import { useState, useEffect } from 'react';
import axios from 'axios';
import './WeatherWidget.css';

function WeatherWidget({ latitud, longitud }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [weatherData, setWeatherData] = useState(null);
  const [forecast, setForecast] = useState([]);

  useEffect(() => {
    const fetchWeather = async () => {
      try {
        setLoading(true);
        setError('');
        
        const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;
        
        // Validar coordenadas
        if (!latitud || !longitud) {
          setError('Coordenadas requeridas');
          return;
        }
        
        // Clima actual
        const currentWeather = await axios.get(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitud}&lon=${longitud}&appid=${apiKey}&units=metric&lang=es`
        );
        
        // Pronóstico 5 días
        const forecastData = await axios.get(
          `https://api.openweathermap.org/data/2.5/forecast?lat=${latitud}&lon=${longitud}&appid=${apiKey}&units=metric&lang=es`
        );
        
        setWeatherData(currentWeather.data);
        
        // Filtrar pronóstico (1 por día a las 12:00)
        const dailyForecast = forecastData.data.list.filter(item => 
          item.dt_txt.includes('12:00:00')
        ).slice(0, 5);
        
        setForecast(dailyForecast);
      } catch (err) {
        console.error('Error fetching weather:', err);
        setError('No se pudo cargar el clima: ' + (err.response?.data?.message || err.message));
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [latitud, longitud]);

  if (loading) {
    return (
      <div className="weather-loading">
        <div className="spinner-small"></div>
        <p>Cargando clima...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="weather-error">
        <span>⚠️</span>
        <p>{error}</p>
      </div>
    );
  }

  if (!weatherData) {
    return (
      <div className="weather-error">
        <span>⚠️</span>
        <p>No hay datos climáticos disponibles</p>
      </div>
    );
  }

  const getWeatherIcon = (iconCode) => {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
  };

  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' });
  };

  return (
    <div className="weather-widget">
      {/* Clima Actual */}
      <div className="weather-current">
        <div className="weather-current-header">
          <h4>Clima Actual</h4>
          <span className="weather-location">{weatherData.name}</span>
        </div>
        
        <div className="weather-current-main">
          <img 
            src={getWeatherIcon(weatherData.weather[0].icon)} 
            alt={weatherData.weather[0].description}
            className="weather-icon-large"
          />
          <div className="weather-temp-main">
            <span className="temp-value">{Math.round(weatherData.main.temp)}°</span>
            <span className="temp-unit">C</span>
          </div>
        </div>

        <p className="weather-description">{weatherData.weather[0].description}</p>

        <div className="weather-details-grid">
          <div className="weather-detail-item">
            <span className="detail-icon">💧</span>
            <div>
              <span className="detail-label">Humedad</span>
              <span className="detail-value">{weatherData.main.humidity}%</span>
            </div>
          </div>
          
          <div className="weather-detail-item">
            <span className="detail-icon">🌬️</span>
            <div>
              <span className="detail-label">Viento</span>
              <span className="detail-value">{Math.round(weatherData.wind.speed * 3.6)} km/h</span>
            </div>
          </div>
          
          <div className="weather-detail-item">
            <span className="detail-icon">🌡️</span>
            <div>
              <span className="detail-label">Sensación</span>
              <span className="detail-value">{Math.round(weatherData.main.feels_like)}°C</span>
            </div>
          </div>
          
          {weatherData.rain && (
            <div className="weather-detail-item weather-alert">
              <span className="detail-icon">🌧️</span>
              <div>
                <span className="detail-label">Lluvia (1h)</span>
                <span className="detail-value">{weatherData.rain['1h']} mm</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Pronóstico 5 días */}
      <div className="weather-forecast">
        <h4>Pronóstico 5 Días</h4>
        <div className="forecast-grid">
          {forecast.map((day, index) => (
            <div key={index} className="forecast-day">
              <span className="forecast-date">{formatDate(day.dt)}</span>
              <img 
                src={getWeatherIcon(day.weather[0].icon)} 
                alt={day.weather[0].description}
                className="forecast-icon"
              />
              <div className="forecast-temps">
                <span className="temp-max">{Math.round(day.main.temp_max)}°</span>
                <span className="temp-min">{Math.round(day.main.temp_min)}°</span>
              </div>
              {day.pop > 0.3 && (
                <span className="forecast-rain">💧 {Math.round(day.pop * 100)}%</span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Recomendaciones */}
      <div className="weather-recommendations">
        <h5>💡 Recomendaciones</h5>
        <ul>
          {weatherData.main.humidity > 80 && (
            <li className="rec-warning">Alta humedad - Considerar pausar trabajos</li>
          )}
          {weatherData.wind.speed > 10 && (
            <li className="rec-warning">Vientos fuertes - Precaución en campo</li>
          )}
          {weatherData.rain && (
            <li className="rec-danger">Lluvia detectada - Evaluar acceso al sitio</li>
          )}
          {weatherData.main.temp > 30 && (
            <li className="rec-info">Temperatura alta - Hidratación constante</li>
          )}
          {!weatherData.rain && weatherData.main.humidity < 70 && weatherData.wind.speed < 8 && (
            <li className="rec-success">Condiciones óptimas para trabajo de campo</li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default WeatherWidget;