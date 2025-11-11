import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, __dirname, '');
  return {
    plugins: [react()],
    resolve: {
      extensions: ['.js', '.jsx', '.ts', '.tsx']  // ← AGREGA ESTA LÍNEA
    },
    define: {
      'import.meta.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL),
      'import.meta.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY),
      'import.meta.env.VITE_MAPBOX_TOKEN': JSON.stringify(env.VITE_MAPBOX_TOKEN),
      'import.meta.env.VITE_OPENWEATHER_API_KEY': JSON.stringify(env.VITE_OPENWEATHER_API_KEY),
    },
    server: {
      port: 5173,
      open: true,
    },
    build: {
      outDir: 'dist',
    },
  };
});