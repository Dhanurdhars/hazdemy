import crypto from 'node:crypto';
import { config } from './config.js';

export const send = (res, status, body, headers = {}) => {
  for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
  if (typeof body === 'string' || Buffer.isBuffer(body)) { res.statusCode = status; return res.end(body); }
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  return res.end(JSON.stringify(body));
};

export const allow = (req, res, methods) => {
  if (methods.includes(req.method)) return true;
  res.setHeader('Allow', methods.join(', '));
  send(res, 405, { error: 'Method not allowed' });
  return false;
};

export const clientIp = (req) =>
  String(req.headers['x-forwarded-for'] || '').split(',')[0].trim() || req.socket?.remoteAddress || 'anon';

/** Bearer-token admin auth (constant-time compare). Returns true if allowed; otherwise responds. */
export function requireAdmin(req, res) {
  if (!config.adminPassword) { send(res, 503, { error: 'Admin is disabled — set ADMIN_PASSWORD in Vercel → Settings → Environment Variables.' }); return false; }
  const token = String(req.headers.authorization || '').replace(/^Bearer\s+/i, '');
  const a = crypto.createHash('sha256').update(token).digest();
  const b = crypto.createHash('sha256').update(config.adminPassword).digest();
  if (!token || !crypto.timingSafeEqual(a, b)) { send(res, 401, { error: 'Unauthorised' }); return false; }
  return true;
}

/** JSON body (Vercel pre-parses req.body; the local dev server does too). */
export const jsonBody = (req) => (typeof req.body === 'string' ? JSON.parse(req.body || '{}') : req.body || {});

/** Raw binary body as a Buffer (for spreadsheet uploads). */
// Reads the request stream directly (without touching req.body, so Vercel's lazy body parser never runs).
export async function rawBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(c);
  if (chunks.length) return Buffer.concat(chunks);
  return Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
}
