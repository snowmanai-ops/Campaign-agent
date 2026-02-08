import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 5173,
        strictPort: true,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:8000'),
        'process.env.SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || ''),
        'process.env.SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || ''),
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
