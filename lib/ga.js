// Google Analytics 4 reports for the admin page, via the GA4 Data API with a read-only service account (no SDK needed).
import crypto from 'node:crypto';
import { config } from './config.js';

export const gaReady = () => Boolean(config.ga.propertyId && config.ga.clientEmail && config.ga.privateKey);

// ---- service-account sign-in: a signed JWT is exchanged for a short-lived access token ----
let cached = { token: '', exp: 0 }, pending = null;
function accessToken() {
  if (cached.token && Date.now() < cached.exp - 60e3) return Promise.resolve(cached.token);
  // reports run in parallel, so they share one sign-in
  pending ||= signIn().finally(() => { pending = null; });
  return pending;
}
async function signIn() {
  const now = Math.floor(Date.now() / 1000);
  const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const unsigned = `${b64({ alg: 'RS256', typ: 'JWT' })}.${b64({
    iss: config.ga.clientEmail, scope: 'https://www.googleapis.com/auth/analytics.readonly',
    aud: config.ga.tokenUrl, iat: now, exp: now + 3600,
  })}`;
  const jwt = `${unsigned}.${crypto.createSign('RSA-SHA256').update(unsigned).sign(config.ga.privateKey, 'base64url')}`;
  const r = await fetch(config.ga.tokenUrl, {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new GaError(`Google sign-in failed: ${d.error_description || d.error || r.status}. Check GA_SERVICE_ACCOUNT_JSON.`);
  cached = { token: d.access_token, exp: Date.now() + (d.expires_in || 3600) * 1000 };
  return cached.token;
}

export class GaError extends Error {}

async function batch(requests) {
  const r = await fetch(`${config.ga.apiBase}/v1beta/properties/${encodeURIComponent(config.ga.propertyId)}:batchRunReports`, {
    method: 'POST', headers: { Authorization: `Bearer ${await accessToken()}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ requests }),
  });
  const d = await r.json().catch(() => ({}));
  if (r.status === 403) throw new GaError(`Google Analytics refused access. In GA4 open Admin → Property access management and add ${config.ga.clientEmail} as a Viewer.`);
  if (!r.ok) throw new GaError(`Google Analytics error: ${d.error?.message || r.status}`);
  return d.reports || [];
}

// ---- the admin report ----
const num = (v) => Number(v) || 0;
const rowsOf = (rep) => (rep?.rows || []).map((r) => ({ d: (r.dimensionValues || []).map((x) => x.value), m: (r.metricValues || []).map((x) => num(x.value)) }));
const iso = (t) => new Date(t).toISOString().slice(0, 10);

/** Visitors, page views, enquiries, top pages/courses, channels, countries and devices for the last `days` days (today included). */
export async function siteReport(days, courseName = () => '') {
  const now = { startDate: `${days - 1}daysAgo`, endDate: 'today' };
  const prev = { startDate: `${2 * days - 1}daysAgo`, endDate: `${days}daysAgo` };
  const top = (dimension, metric, limit, extra = {}) => ({
    dateRanges: [now], dimensions: [{ name: dimension }], metrics: [{ name: metric }], limit, orderBys: [{ metric: { metricName: metric }, desc: true }], ...extra,
  });
  const leadsOnly = { dimensionFilter: { filter: { fieldName: 'eventName', stringFilter: { value: 'generate_lead' } } } };
  const [a, b] = await Promise.all([
    batch([
      { dateRanges: [now, prev], metrics: ['activeUsers', 'sessions', 'screenPageViews', 'engagementRate'].map((name) => ({ name })) },
      { dateRanges: [now, prev], dimensions: [{ name: 'eventName' }], metrics: [{ name: 'eventCount' }], ...leadsOnly },
      { dateRanges: [now], dimensions: [{ name: 'date' }], metrics: [{ name: 'activeUsers' }, { name: 'screenPageViews' }], orderBys: [{ dimension: { dimensionName: 'date' } }], limit: 400 },
      top('pagePath', 'screenPageViews', 10),
      top('sessionDefaultChannelGroup', 'sessions', 8),
    ]),
    batch([
      top('country', 'activeUsers', 8),
      top('deviceCategory', 'activeUsers', 5),
      top('pagePath', 'screenPageViews', 8, { dimensionFilter: { filter: { fieldName: 'pagePath', stringFilter: { matchType: 'BEGINS_WITH', value: '/course/' } } } }),
      { dateRanges: [now], dimensions: [{ name: 'date' }], metrics: [{ name: 'eventCount' }], ...leadsOnly, limit: 400 },
    ]),
  ]);

  // With two date ranges GA adds a "dateRange" dimension: date_range_0 is the current period, date_range_1 the previous one.
  const byRange = (rep, i) => {
    const rows = rowsOf(rep);
    const pick = (name) => rows.find((r) => r.d.includes(name))?.m ?? (rows.length && !rows[0].d.length && name === 'date_range_0' ? rows[0].m : []);
    return pick(`date_range_${i}`);
  };
  const [cur, old] = [byRange(a[0], 0), byRange(a[0], 1)];
  const kpi = (i) => ({ now: num(cur[i]), prev: num(old[i]) });
  const leadsIn = (i) => num(byRange(a[1], i)[0]);

  // Fill every day of the range, since GA leaves out days with no visits.
  const perDay = Object.fromEntries(rowsOf(a[2]).map((r) => [r.d[0], { users: r.m[0], views: r.m[1] }]));
  const leadsPerDay = Object.fromEntries(rowsOf(b[3]).map((r) => [r.d[0], r.m[0]]));
  const daily = Array.from({ length: days }, (_, i) => {
    const date = iso(Date.now() - (days - 1 - i) * 864e5), k = date.replace(/-/g, '');
    return { date, users: perDay[k]?.users || 0, views: perDay[k]?.views || 0, leads: leadsPerDay[k] || 0 };
  });

  const list = (rep, fn) => rowsOf(rep).map(fn);
  return {
    days, start: daily[0].date, end: daily[daily.length - 1].date,
    kpis: { users: kpi(0), sessions: kpi(1), pageViews: kpi(2), engagementRate: kpi(3), leads: { now: leadsIn(0), prev: leadsIn(1) } },
    daily,
    pages: list(a[3], (r) => ({ path: r.d[0], views: r.m[0] })),
    channels: list(a[4], (r) => ({ name: r.d[0], sessions: r.m[0] })),
    countries: list(b[0], (r) => ({ name: r.d[0], users: r.m[0] })),
    devices: list(b[1], (r) => ({ name: r.d[0], users: r.m[0] })),
    courses: list(b[2], (r) => {
      const code = decodeURIComponent(r.d[0].replace(/^\/course\//, '').split(/[/?#]/)[0]).toUpperCase();
      return { code, name: courseName(code), views: r.m[0] };
    }),
  };
}
