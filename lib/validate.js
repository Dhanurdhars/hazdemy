const clean = (s, max) => String(s ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, max);

/** Validates an enquiry body. Returns { ok, error?, value? } */
export function validateEnquiry(b = {}) {
  const v = {
    first: clean(b.first, 80), last: clean(b.last, 80), email: clean(b.email, 160).toLowerCase(),
    company: clean(b.company, 160), phone: clean(b.phone, 40), course: clean(b.course, 40),
    subject: clean(b.subject, 1500), notes: clean(b.notes, 4000), website: clean(b.website, 200),
  };
  if (!v.first || !v.last) return { ok: false, error: 'Please enter your first and last name.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.email)) return { ok: false, error: 'Please enter a valid work email.' };
  if (v.phone && !/^[0-9+()\-\s.]{6,}$/.test(v.phone)) return { ok: false, error: 'Please enter a valid phone number.' };
  if (!v.subject) return { ok: false, error: 'Please tell us what you would like to know.' };
  return { ok: true, value: v };
}

export const escHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
