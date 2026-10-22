// GET /api/admin/analytics?days=7|28|90 → Google Analytics summary for the admin page
import { overLimit } from '../../lib/store.js';
import { getCatalog } from '../../lib/courses.js';
import { gaReady, siteReport, GaError } from '../../lib/ga.js';
import { allow, send, requireAdmin, clientIp } from '../../lib/http.js';

const RANGES = [7, 28, 90];
const cache = new Map(); // days → { at, data }; GA data is only refreshed every few minutes anyway

export default async function handler(req, res) {
  if (!allow(req, res, ['GET'])) return;
  try {
    if (await overLimit(`adm:${clientIp(req)}`, 300, 900)) return send(res, 429, { error: 'Too many requests' });
    if (!requireAdmin(req, res)) return;
    if (!gaReady()) return send(res, 200, { configured: false });

    const days = RANGES.includes(Number(req.query?.days)) ? Number(req.query.days) : 28;
    const hit = cache.get(days);
    if (hit && Date.now() - hit.at < 5 * 60e3 && req.query?.fresh !== '1') return send(res, 200, hit.data);

    const { courses } = await getCatalog();
    const names = Object.fromEntries(courses.map((c) => [c.code, c.name]));
    const data = { configured: true, generatedAt: new Date().toISOString(), ...(await siteReport(days, (code) => names[code] || '')) };
    cache.set(days, { at: Date.now(), data });
    send(res, 200, data);
  } catch (e) {
    if (e instanceof GaError) return send(res, 502, { error: e.message });
    console.error(e); send(res, 500, { error: e.message });
  }
}
