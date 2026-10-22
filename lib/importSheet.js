// Converts the course inventory spreadsheet into the website catalogue.
// Rules: every row with a Course Description is published except Retired ones;
// Status "Available" → available now, anything else → "coming soon".
// Only the green columns are used (+ Platform for the area and Status for availability).
import XLSX from 'xlsx';

const clean = (v) => String(v ?? '').replace(/\s+/g, ' ').trim();
const list = (v) => String(v ?? '').split(/\n+|•/).map((x) => clean(x).replace(/^[-:;,.\s]+/, '')).filter(Boolean);
const AREA_FIX = { 'IT Infrastructure': 'Infrastructure', Cloud: 'Infrastructure', Z: 'Infrastructure' };
const PRODUCT_FIX = { Datastage: 'DataStage', Integration: 'webMethods Integration' };
const AREAS = ['Data', 'AI', 'Sustainability', 'Security', 'Automation', 'Infrastructure'];

export function parseCourseSheet(buffer) {
  const wb = XLSX.read(buffer, { type: 'buffer' });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { defval: '' });
  const required = ['Course Code', 'Course Name', 'Course Description'];
  const missing = required.filter((k) => !(k in (rows[0] || {})));
  if (missing.length) throw new Error(`The sheet is missing these columns: ${missing.join(', ')}`);

  const seen = new Set();
  const courses = rows
    .filter((r) => clean(r['Course Description']) && clean(r['Status']).toLowerCase() !== 'retired')
    .map((r) => {
      const name = clean(r['Course Name']);
      let area = AREA_FIX[clean(r['Platform'])] || clean(r['Platform']);
      let product = PRODUCT_FIX[clean(r['Product'])] || clean(r['Product']);
      if (!area && /watsonx/i.test(name)) area = 'AI';
      if (!product && /watsonx\.ai/i.test(name)) product = 'watsonx.ai';
      if (!product && /watsonx/i.test(name)) product = 'watsonx.data';
      if (!AREAS.includes(area)) area = 'Data';
      const d = parseFloat(r['Duration (days)']);
      return {
        area, product: product || area, code: clean(r['Course Code']), name,
        days: Number.isFinite(d) ? d : null,
        desc: clean(r['Course Description']),
        level: ['Foundation', 'Intermediate', 'Advanced'].includes(clean(r['Skill Level'])) ? clean(r['Skill Level']) : 'Foundation',
        status: clean(r['Status']) === 'Available' ? 'available' : 'coming',
        prereq: list(r['Pre Reqs']), persona: list(r['Persona']),
      };
    })
    .filter((c) => c.code && c.name && !seen.has(c.code) && seen.add(c.code));

  return {
    courses,
    total: courses.length,
    available: courses.filter((c) => c.status === 'available').length,
    coming: courses.filter((c) => c.status === 'coming').length,
  };
}
