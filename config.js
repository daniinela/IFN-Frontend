// config.js - Configuración global de la aplicación
const config = {
  apiUrl: 'http://localhost:3001/api', // URL base del backend
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL, // URL de Supabase desde .env
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY, // Clave anónima desde .env
  },
  mapboxToken: import.meta.env.VITE_MAPBOX_TOKEN, // Token de Mapbox
  openWeatherApiKey: import.meta.env.VITE_OPENWEATHER_API_KEY, // Clave de OpenWeather
};

// Exporta la configuración para usarla en toda la app
export default config;