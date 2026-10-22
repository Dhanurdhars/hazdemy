// Storage for serverless: Upstash Redis over its REST API (no SDK needed) when configured,
// otherwise an in-memory fallback (fine for trying things out, but it resets when Vercel recycles the function).
import { config } from './config.js';

const P = 'hz:';
export const storageKind = () => (config.redis.url && config.redis.token ? 'redis' : 'memory');

async function redis(...cmd) {
  const r = await fetch(config.redis.url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${config.redis.token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(cmd),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data.error) throw new Error(`Storage error: ${data.error || r.status}`);
  return data.result;
}

// ---- in-memory fallback (per function instance) ----
const mem = globalThis.__hzMem || (globalThis.__hzMem = { kv: new Map(), hash: new Map(), counters: new Map() });

export async function getJSON(key) {
  if (storageKind() === 'memory') return mem.kv.has(key) ? structuredClone(mem.kv.get(key)) : null;
  const v = await redis('GET', P + key);
  return v ? JSON.parse(v) : null;
}
export async function setJSON(key, value) {
  if (storageKind() === 'memory') { mem.kv.set(key, structuredClone(value)); return; }
  await redis('SET', P + key, JSON.stringify(value));
}

export async function hset(hash, id, value) {
  if (storageKind() === 'memory') { if (!mem.hash.has(hash)) mem.hash.set(hash, new Map()); mem.hash.get(hash).set(id, structuredClone(value)); return; }
  await redis('HSET', P + hash, id, JSON.stringify(value));
}
export async function hget(hash, id) {
  if (storageKind() === 'memory') { const v = mem.hash.get(hash)?.get(id); return v ? structuredClone(v) : null; }
  const v = await redis('HGET', P + hash, id);
  return v ? JSON.parse(v) : null;
}
export async function hvals(hash) {
  if (storageKind() === 'memory') return [...(mem.hash.get(hash)?.values() || [])].map((v) => structuredClone(v));
  return ((await redis('HVALS', P + hash)) || []).map((v) => JSON.parse(v));
}

/** Fixed-window rate limit. Returns true when the caller is over the limit. */
export async function overLimit(key, limit, windowSec) {
  const k = `${P}rl:${key}:${Math.floor(Date.now() / 1000 / windowSec)}`;
  if (storageKind() === 'memory') {
    const n = (mem.counters.get(k) || 0) + 1; mem.counters.set(k, n); return n > limit;
  }
  const n = await redis('INCR', k);
  if (n === 1) await redis('EXPIRE', k, windowSec);
  return n > limit;
}
