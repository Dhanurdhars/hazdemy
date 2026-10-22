// POST /api/admin/import — body: the course inventory .xlsx (Content-Type: application/octet-stream)
// Replaces the live catalogue; the previous one is kept as a backup.
import { parseCourseSheet } from '../../lib/importSheet.js';
import { replaceCatalog } from '../../lib/courses.js';
import { storageKind } from '../../lib/store.js';
import { allow, send, requireAdmin, rawBody } from '../../lib/http.js';

export default async function handler(req, res) {
  if (!allow(req, res, ['POST'])) return;
  if (!requireAdmin(req, res)) return;
  try {
    if (storageKind() === 'memory') return send(res, 503, { error: 'Connect Upstash Redis in Vercel → Storage first, so the uploaded catalogue is saved permanently.' });
    const buf = await rawBody(req);
    if (!buf.length) return send(res, 400, { error: 'Please choose an .xlsx file.' });
    if (buf.length > 4 * 1024 * 1024) return send(res, 413, { error: 'File is too large (max 4 MB).' });
    let parsed;
    try { parsed = parseCourseSheet(buf); } catch (e) { return send(res, 400, { error: e.message }); }
    if (parsed.total < 1) return send(res, 400, { error: 'No publishable courses found in that sheet.' });
    await replaceCatalog(parsed.courses, String(req.headers['x-file-name'] || 'upload.xlsx').slice(0, 120));
    send(res, 200, { ok: true, total: parsed.total, available: parsed.available, coming: parsed.coming });
  } catch (e) {
    console.error(e); send(res, 500, { error: e.message });
  }
}
