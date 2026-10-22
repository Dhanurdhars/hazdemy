// GET   /api/admin/enquiries             → all enquiries + stats
// GET   /api/admin/enquiries?format=csv  → CSV download
// PATCH /api/admin/enquiries?id=…        → { status }
import { hvals, hget, hset, storageKind, overLimit } from '../../lib/store.js';
import { getCatalog } from '../../lib/courses.js';
import { mailEnabled } from '../../lib/mailer.js';
import { allow, send, jsonBody, requireAdmin, clientIp } from '../../lib/http.js';

const STATUSES = ['new', 'contacted', 'quoted', 'won', 'closed'];
const COLS = ['createdAt', 'status', 'first', 'last', 'email', 'phone', 'company', 'courseCode', 'courseName', 'subject', 'notes'];

export default async function handler(req, res) {
  if (!allow(req, res, ['GET', 'PATCH'])) return;
  try {
    if (await overLimit(`adm:${clientIp(req)}`, 300, 900)) return send(res, 429, { error: 'Too many requests' });
    if (!requireAdmin(req, res)) return;

    if (req.method === 'PATCH') {
      const id = String(req.query?.id || '');
      const status = String(jsonBody(req).status || '');
      if (!STATUSES.includes(status)) return send(res, 400, { error: 'Invalid status' });
      const cur = await hget('enquiries', id);
      if (!cur) return send(res, 404, { error: 'Enquiry not found' });
      const next = { ...cur, status, updatedAt: new Date().toISOString() };
      await hset('enquiries', id, next);
      return send(res, 200, next);
    }

    const list = (await hvals('enquiries')).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    if (req.query?.format === 'csv') {
      const cell = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
      const csv = '﻿' + [COLS.join(','), ...list.map((e) => COLS.map((c) => cell(e[c])).join(','))].join('\r\n');
      return send(res, 200, csv, { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="hazdemy-enquiries.csv"' });
    }
    const week = Date.now() - 7 * 864e5;
    const byStatus = list.reduce((m, e) => ((m[e.status] = (m[e.status] || 0) + 1), m), {});
    const { courses, updatedAt, source } = await getCatalog();
    send(res, 200, {
      enquiries: list,
      stats: { total: list.length, byStatus, last7: list.filter((e) => Date.parse(e.createdAt) > week).length, courses: courses.length },
      system: { storage: storageKind(), mail: mailEnabled(), catalogUpdatedAt: updatedAt, catalogSource: source },
    });
  } catch (e) {
    console.error(e); send(res, 500, { error: e.message });
  }
}
