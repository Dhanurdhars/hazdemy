import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// `npm run dev` starts the local API on :3001 (scripts/dev-api.js) and Vite on :5173, which forwards /api to it.
// On Vercel, /api/* files are deployed as serverless functions automatically — no proxy needed.
export default defineConfig({
  plugins: [react()],
  build: { target: 'es2022' },
  server: { port: 5173, proxy: { '/api': 'http://localhost:3001' } },
});
