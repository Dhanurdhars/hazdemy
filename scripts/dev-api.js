// Local stand-in for Vercel's serverless runtime: serves /api/* from the api/ folder on http://localhost:3001.
// (On Vercel this file is not used.) Loads settings from .env.local if present.
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
}

export function createDevServer() {
  return http.createServer(async (req, res) => {
    const url = new URL(req.url, 'http://localhost');
    const file = path.join(ROOT, url.pathname.replace(/\/$/, '') + '.js');
    if (!url.pathname.startsWith('/api/') || !file.startsWith(path.join(ROOT, 'api')) || !fs.existsSync(file)) {
      res.statusCode = 404; res.setHeader('Content-Type', 'application/json'); return res.end('{"error":"Not found"}');
    }
    req.query = Object.fromEntries(url.searchParams);
    if ((req.headers['content-type'] || '').includes('application/json')) {
      const chunks = []; for await (const c of req) chunks.push(c);
      try { req.body = JSON.parse(Buffer.concat(chunks).toString() || '{}'); } catch { req.body = {}; }
    }
    try {
      const mod = await import(pathToFileURL(file).href);
      await mod.default(req, res);
    } catch (e) {
      console.error(e); res.statusCode = 500; res.end(JSON.stringify({ error: e.message }));
    }
  });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  loadEnv(path.join(ROOT, '.env.local'));
  loadEnv(path.join(ROOT, '.env'));
  const port = Number(process.env.API_PORT) || 3001;
  createDevServer().listen(port, () => console.log(`Local API on http://localhost:${port}  (storage: ${process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL ? 'redis' : 'memory'})`));
}
