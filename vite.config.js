import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { siteUrl } from './scripts/site-url.js';

// `npm run dev` starts the local API on :3001 (scripts/dev-api.js) and Vite on :5173, which forwards /api to it.
// On Vercel, /api/* files are deployed as serverless functions automatically — no proxy needed.
export default defineConfig({
  plugins: [react()],
  define: { 'import.meta.env.VITE_SITE_URL': JSON.stringify(siteUrl()) }, // canonical links and link previews (see src/seo.js)
  // Flags stay separate files (fetched only when shown) instead of being inlined into the main bundle.
  build: { target: 'es2022', assetsInlineLimit: (file) => (file.includes('flag-icons') ? false : undefined) },
  server: { port: 5173, proxy: { '/api': 'http://localhost:3001' } },
});
