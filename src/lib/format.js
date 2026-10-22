import { LEVELS } from '../data/catalog';

export const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));

export const dur = (d) => {
  if (d == null) return '—';
  if (d < 1) { const h = Math.max(1, Math.round(d * 8)); return h + (h === 1 ? ' hour' : ' hours'); }
  return d + (d === 1 ? ' day' : ' days');
};

export const hours = (d) => {
  if (d == null) return '—';
  const h = d < 1 ? Math.max(1, Math.round(d * 8)) : d * 8;
  return h + (h === 1 ? ' hr' : ' hrs');
};

/** HTML string version of the level bars (used inside chatbot HTML) */
export const lvlBarsHtml = (l) => {
  const n = LEVELS.indexOf(l) + 1;
  return `<span class="lvl" aria-hidden="true">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
};

export const subjectFor = (c) =>
  c ? `I would like details and pricing for this course:\n${c.name}, Course Code: ${c.code}\nPlease send delivery options, availability, and a quote.` : '';

export const askPath = (c) => `/contact?course=${encodeURIComponent(c.code)}`;
export const coursePath = (c) => `/course/${encodeURIComponent(c.code)}`;
