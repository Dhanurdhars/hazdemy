// npm test — runs the real API handlers against a tiny in-process fake of the Upstash Redis REST API.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import fs from 'node:fs';

// ---- fake Upstash REST server ----
const kv = new Map(), hashes = new Map();
const fake = http.createServer(async (req, res) => {
  const chunks = []; for await (const c of req) chunks.push(c);
  const [cmd, ...a] = JSON.parse(Buffer.concat(chunks).toString());
  let result = null;
  const h = (k) => hashes.get(k) || (hashes.set(k, new Map()), hashes.get(k));
  switch (cmd) {
    case 'GET': result = kv.get(a[0]) ?? null; break;
    case 'SET': kv.set(a[0], a[1]); result = 'OK'; break;
    case 'HSET': h(a[0]).set(a[1], a[2]); result = 1; break;
    case 'HGET': result = h(a[0]).get(a[1]) ?? null; break;
    case 'HVALS': result = [...h(a[0]).values()]; break;
    case 'INCR': result = (Number(kv.get(a[0]) || 0) + 1); kv.set(a[0], String(result)); break;
    case 'EXPIRE': result = 1; break;
    default: res.statusCode = 400; return res.end(JSON.stringify({ error: 'unknown ' + cmd }));
  }
  res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify({ result }));
});

let api, base;
before(async () => {
  await new Promise((ok) => fake.listen(0, ok));
  process.env.KV_REST_API_URL = `http://127.0.0.1:${fake.address().port}`;
  process.env.KV_REST_API_TOKEN = 'test';
  process.env.ADMIN_PASSWORD = 'test-pass';
  process.env.SMTP_HOST = '';
  const { createDevServer } = await import('../scripts/dev-api.js');
  api = createDevServer();
  await new Promise((ok) => api.listen(0, ok));
  base = `http://127.0.0.1:${api.address().port}`;
});
after(() => { api.close(); fake.close(); });

const auth = { Authorization: 'Bearer test-pass' };
const post = (p, body) => fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

test('courses: list, filter, single, 404', async () => {
  const d = await (await fetch(base + '/api/courses')).json();
  assert.equal(d.count, 98);
  const avail = await (await fetch(base + '/api/courses?status=available')).json();
  assert.equal(avail.count, 65);
  const one = await (await fetch(base + '/api/courses?code=haz-at-008')).json();
  assert.equal(one.code, 'HAZ-AT-008');
  assert.equal((await fetch(base + '/api/courses?code=NOPE')).status, 404);
});

test('enquiries: validation, save, admin list, status, csv', async () => {
  assert.equal((await post('/api/enquiries', { first: 'A', last: 'B', email: 'bad', subject: 'x' })).status, 400);
  const r = await post('/api/enquiries', { first: 'Asha', last: 'Rao', email: 'asha@example.com', course: 'HAZ-AT-008', subject: 'I would like details and pricing for this course' });
  assert.equal(r.status, 201);
  assert.equal((await fetch(base + '/api/admin/enquiries')).status, 401);
  const d = await (await fetch(base + '/api/admin/enquiries', { headers: auth })).json();
  assert.equal(d.enquiries.length, 1);
  assert.equal(d.enquiries[0].courseName, 'IBM webMethods Integration v12.1 Developer');
  assert.equal(d.system.storage, 'redis');
  const p = await fetch(base + `/api/admin/enquiries?id=${d.enquiries[0].id}`, { method: 'PATCH', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'quoted' }) });
  assert.equal((await p.json()).status, 'quoted');
  const csv = await (await fetch(base + '/api/admin/enquiries?format=csv', { headers: auth })).text();
  assert.match(csv, /asha@example.com/);
});

test('honeypot ignored, rate limit kicks in', async () => {
  assert.equal((await post('/api/enquiries', { first: 'B', last: 'X', email: 'a@b.co', subject: 's', website: 'spam' })).status, 200);
  let last;
  for (let i = 0; i < 6; i++) last = await post('/api/enquiries', { first: 'C', last: 'D', email: 'c@d.co', subject: 's' });
  assert.equal(last.status, 429);
});

test('admin sheet import replaces the catalogue', async () => {
  const sheet = process.env.TEST_SHEET;
  if (!sheet || !fs.existsSync(sheet)) return; // optional: TEST_SHEET=path/to.xlsx npm test
  const r = await fetch(base + '/api/admin/import', { method: 'POST', headers: { ...auth, 'Content-Type': 'application/octet-stream', 'X-File-Name': 'sheet.xlsx' }, body: fs.readFileSync(sheet) });
  const d = await r.json();
  assert.equal(r.status, 200); assert.equal(d.total, 98);
  const cat = await (await fetch(base + '/api/courses')).json();
  assert.equal(cat.count, 98); assert.ok(cat.updatedAt);
});
