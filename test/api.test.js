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

let api, base, issueFormToken;
before(async () => {
  await new Promise((ok) => fake.listen(0, ok));
  process.env.KV_REST_API_URL = `http://127.0.0.1:${fake.address().port}`;
  process.env.KV_REST_API_TOKEN = 'test';
  process.env.ADMIN_PASSWORD = 'test-pass';
  process.env.SMTP_HOST = '';
  process.env.FORM_SECRET = 'test-secret';
  process.env.EMAIL_DNS_CHECK = 'false'; // no network lookups in tests
  ({ issueFormToken } = await import('../lib/spam.js'));
  const { createDevServer } = await import('../scripts/dev-api.js');
  api = createDevServer();
  await new Promise((ok) => api.listen(0, ok));
  base = `http://127.0.0.1:${api.address().port}`;
});
after(() => { api.close(); fake.close(); });

const auth = { Authorization: 'Bearer test-pass' };
const post = (p, body, ip = '10.0.0.1') => fetch(base + p, { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip }, body: JSON.stringify(body) });
// A valid form token, issued 5s ago (the API ignores forms filled in faster than 3s).
const tok = () => issueFormToken(Date.now() - 5000);
const listEnquiries = async () => (await (await fetch(base + '/api/admin/enquiries', { headers: auth })).json()).enquiries;

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
  assert.equal((await post('/api/enquiries', { first: 'A', last: 'B', email: 'bad', subject: 'x', token: tok() })).status, 400);
  const r = await post('/api/enquiries', { first: 'Asha', last: 'Rao', email: 'asha@northwind-traders.com', course: 'HAZ-AT-008', subject: 'I would like details and pricing for this course', token: tok() });
  assert.equal(r.status, 201);
  assert.equal((await fetch(base + '/api/admin/enquiries')).status, 401);
  const d = await (await fetch(base + '/api/admin/enquiries', { headers: auth })).json();
  assert.equal(d.enquiries.length, 1);
  assert.equal(d.enquiries[0].courseName, 'IBM webMethods Integration v12.1 Developer');
  assert.equal(d.system.storage, 'redis');
  const p = await fetch(base + `/api/admin/enquiries?id=${d.enquiries[0].id}`, { method: 'PATCH', headers: { ...auth, 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'quoted' }) });
  assert.equal((await p.json()).status, 'quoted');
  const csv = await (await fetch(base + '/api/admin/enquiries?format=csv', { headers: auth })).text();
  assert.match(csv, /asha@northwind-traders.com/);
});

test('honeypot ignored, rate limit kicks in', async () => {
  assert.equal((await post('/api/enquiries', { first: 'B', last: 'X', email: 'a@b.co', subject: 's', website: 'spam' })).status, 200);
  let last;
  for (let i = 0; i < 6; i++) last = await post('/api/enquiries', { first: 'C', last: 'D', email: 'c@d.co', subject: 's', token: tok() });
  assert.equal(last.status, 429);
});

test('rate limit: failed attempts do not lock people out, floods do', async () => {
  const ok = { first: 'Ravi', last: 'Kumar', email: 'ravi@northwind-traders.com', subject: 'Retry check' };
  for (let i = 0; i < 6; i++) assert.equal((await post('/api/enquiries', { ...ok, email: 'typo', token: tok() }, '10.0.3.1')).status, 400);
  assert.equal((await post('/api/enquiries', { ...ok, token: tok() }, '10.0.3.1')).status, 201);
  let last;
  for (let i = 0; i < 21; i++) last = await post('/api/enquiries', { ...ok, email: 'typo', token: tok() }, '10.0.3.2');
  assert.equal(last.status, 429);
});

test('spam: form tokens', async () => {
  const before = (await listEnquiries()).length;
  const body = (n, extra) => ({ first: 'Tom', last: 'Baker', email: `tom${n}@northwind-traders.com`, subject: `Token check ${n}`, ...extra });
  const g = await fetch(base + '/api/enquiries');
  assert.equal(g.status, 200); assert.match((await g.json()).token, /^\d+\.[\w-]+\.[\w-]+$/);
  assert.equal((await post('/api/enquiries', body(1), '10.0.1.1')).status, 400); // no token
  assert.equal((await post('/api/enquiries', body(2, { token: tok().replace(/.$/, 'x') }), '10.0.1.1')).status, 400); // tampered
  assert.equal((await post('/api/enquiries', body(3, { token: issueFormToken(Date.now() - 3 * 3600e3) }), '10.0.1.1')).status, 400); // expired
  assert.equal((await post('/api/enquiries', body(4, { token: issueFormToken() }), '10.0.1.1')).status, 200); // too fast: ignored
  const once = tok();
  assert.equal((await post('/api/enquiries', body(5, { token: once }), '10.0.1.2')).status, 201);
  assert.equal((await post('/api/enquiries', body(6, { token: once }), '10.0.1.2')).status, 200); // reused: ignored
  assert.equal((await listEnquiries()).length, before + 1);
});

test('spam: content, duplicates and per-email limit', async () => {
  const ok = { first: 'José', last: "O'Brien", email: 'jose@northwind-traders.com', company: 'Amazon.com', subject: 'Pricing for a team of 8' };
  const status = async (b, ip = '10.0.2.1') => (await post('/api/enquiries', { ...b, token: tok() }, ip)).status;
  const rejected = [
    { first: 'http://cheap.ru' }, { first: 'Test' }, { last: 'fake' }, { first: 'asdf' }, { first: 'Aaaa' }, { last: 'sdfghjk' }, { last: 'Rao2' },
    { email: 'x@mailinator.com' }, { email: 'x@yopmail.com' }, { email: 'jose@gmail.com' }, { email: 'jose@yahoo.co.in' }, { email: 'jose@outlook.com' },
    { email: 'test@northwind-traders.com' }, { email: 'x@example.com' },
    { phone: '12345' }, { phone: '0000000' }, { phone: '1234567' }, { phone: '1234567890123456' },
    { company: 'www.cheap.ru' }, { company: 'Lucky Casino' }, { notes: 'see https://x.io' }, { notes: '<b>hi</b>' }, { notes: 'We sell SEO packages' }, { notes: 'crypto offer' },
  ];
  for (const [i, r] of rejected.entries()) assert.equal(await status({ ...ok, ...r }, `10.0.4.${i}`), 400, JSON.stringify(r));
  // errors name the field, so the form can outline it
  for (const [r, field] of [[{ email: 'jose@gmail.com' }, 'email'], [{ last: 'fake' }, 'last'], [{ phone: '0000000' }, 'phone'], [{ notes: 'crypto offer' }, 'notes'], [{ company: 'Lucky Casino' }, 'company']]) {
    assert.equal((await (await post('/api/enquiries', { ...ok, ...r, token: tok() }, `10.0.6.${field.length}`)).json()).field, field);
  }
  const accepted = [{ last: 'Doherty' }, { first: 'Ng' }, { email: 'jose@orange.com' }, { phone: '+91 98450 12345' }, { notes: 'Cryptography module, cc bob@northwind.co.uk' }];
  for (const [i, r] of accepted.entries()) assert.equal(await status({ ...ok, ...r, email: r.email || `jose${i}@northwind-traders.com` }, `10.0.5.${i}`), 201, JSON.stringify(r));
  const before = (await listEnquiries()).length;
  assert.equal(await status(ok, '10.0.2.2'), 201);
  assert.equal(await status(ok, '10.0.2.2'), 200); // exact repeat: ignored
  assert.equal((await listEnquiries()).length, before + 1);
  assert.equal(await status({ ...ok, subject: 'Second question' }, '10.0.2.3'), 201);
  assert.equal(await status({ ...ok, subject: 'Third question' }, '10.0.2.3'), 429); // 3 attempts per email per day (the repeat counts)
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
