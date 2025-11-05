import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Obtiene el directorio actual del archivo
const __dirname = dirname(fileURLToPath(import.meta.url));

// Configura las variables de entorno
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, ''); // Carga las variables del .env desde el directorio actual
  return {
    plugins: [react()],
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_MAPBOX_TOKEN': JSON.stringify(env.VITE_MAPBOX_TOKEN),
      'import.meta.env.VITE_OPENWEATHER_API_KEY': JSON.stringify(env.VITE_OPENWEATHER_API_KEY),
    },
    server: {
      port: 5173, // Puerto por defecto de Vite
      open: true, // Abre el navegador automáticamente
    },
    build: {
      outDir: 'dist', // Carpeta de salida para el build
    },
  };
});