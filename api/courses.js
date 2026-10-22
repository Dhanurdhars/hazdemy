// GET /api/courses                → full catalogue  (?status=available|coming, ?area=Data)
// GET /api/courses?code=HAZ-AT-008 → one course
import { getCatalog } from '../lib/courses.js';
import { allow, send } from '../lib/http.js';

export default async function handler(req, res) {
  if (!allow(req, res, ['GET'])) return;
  try {
    const { courses, updatedAt } = await getCatalog();
    const { code, status, area } = req.query || {};
    if (code) {
      const c = courses.find((x) => x.code === String(code).toUpperCase());
      return c ? send(res, 200, c) : send(res, 404, { error: 'Course not found' });
    }
    let list = courses;
    if (status) list = list.filter((c) => c.status === status);
    if (area) list = list.filter((c) => c.area === area);
    send(res, 200, { updatedAt, count: list.length, courses: list }, { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' });
  } catch (e) {
    console.error(e); send(res, 500, { error: 'Could not load courses' });
  }
}
