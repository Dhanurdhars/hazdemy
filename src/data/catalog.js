// Course data + reference tables shared by pages, the chatbot and the 3D scene.
// The live catalogue comes from the Node.js API (GET /api/courses) via initCatalog() before the app renders.
// courses.json is only a bundled fallback so the site still works if the API is unreachable.
import FALLBACK from './courses.json';

export const AREAS = {
  Data: { c: '#8e1b1e', d: 'Integrate, govern, analyse and warehouse enterprise data with DataStage, Cloud Pak for Data, Db2, Cognos and more.',
    i: '<ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5"/><path d="M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/>' },
  AI: { c: '#7c3aed', d: 'Administer and operate the watsonx platform — watsonx.ai and watsonx.data — for production AI.',
    i: '<path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4z"/><path d="M19 16l1 2 2 1-2 1-1 2-1-2-2-1 2-1z"/>' },
  Sustainability: { c: '#14a36b', d: 'Run assets and operations smarter with IBM Maximo Application Suite and Sterling supply chain.',
    i: '<path d="M11 20A7 7 0 0 1 4 13c0-6 7-10 16-10 0 9-4 16-10 16"/><path d="M4 21c4-4 7-7 11-10"/>' },
  Security: { c: '#e5484d', d: 'Protect sensitive data and privileged access with IBM Guardium and Verify Privilege.',
    i: '<path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z"/><path d="M9 12l2 2 4-4"/>' },
  Automation: { c: '#ff7a45', d: 'Connect systems and automate work with webMethods Integration and Business Automation Workflow.',
    i: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>' },
  Infrastructure: { c: '#0e8a8a', d: 'Mainframe and storage skills — Db2 for z/OS, CICS COBOL, DS8000 storage and IBM Z workload automation.',
    i: '<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01"/>' },
};

export const LEVELS = ['Foundation', 'Intermediate', 'Advanced'];

export const TRACKS = {
  builders: { name: 'Builders', k: 'Track 01', cls: 't1',
    d: 'Developers, data engineers and architects who build pipelines and agents, connect systems, design workflows, test behaviour and prepare applications for production.',
    re: /develop|engineer|architect|programmer|author|modell|scientist|etl|consultant|qa |devops/i },
  operators: { name: 'Operators', k: 'Track 02', cls: 't2',
    d: 'Administrators, platform owners and support teams who monitor, govern, troubleshoot, secure and optimise the systems the business depends on.',
    re: /admin|operat|support|platform|dba|steward|security|deployment|system|governance|infrastructure|compliance/i },
  leaders: { name: 'Leaders', k: 'Track 03', cls: 't3',
    d: 'Business users, analysts, planners and program owners who evaluate use cases, turn data into decisions, manage risk and scale what works.',
    re: /business|analyst|manager|finance|planner|lead|officer|power user|excel|consumer|decision/i },
};

// Live ES-module bindings: importers always see the latest values after initCatalog()
export let COURSES = [];
export let byCode = {};
export let PRODUCTS = [];

export function initCatalog(raw) {
  COURSES = (raw || []).map((c) => {
    const tracks = Object.keys(TRACKS).filter((t) => TRACKS[t].re.test((c.persona || []).join(' ') + ' ' + c.name));
    return { prereq: [], persona: [], ...c, tracks: tracks.length ? tracks : ['builders'] };
  });
  byCode = Object.fromEntries(COURSES.map((c) => [c.code, c]));
  PRODUCTS = [...new Set(COURSES.map((c) => c.product))];
}

/** Load the catalogue from the API; fall back to the bundled copy. */
export async function loadCatalog() {
  try {
    const r = await fetch('/api/courses', { headers: { Accept: 'application/json' } });
    if (!r.ok) throw new Error(r.status);
    const data = await r.json();
    initCatalog(data.courses);
  } catch {
    initCatalog(FALLBACK);
  }
}

export const count = (k, v) => COURSES.filter((c) => c[k] === v).length;
export const areaOf = (c) => AREAS[c.area] || AREAS.Data;

export const COMPANY = {
  email: 'training@hazdemy.com',
  address: '251 Little Falls Drive, Wilmington, Delaware 19808',
  stats: { satisfaction: 98, solutions: 3000, instructors: 750 },
};

// Public virtual classes, in date order. Each is announced (banner, course page, catalog, chatbot) until its last day ends.
// `start` is the first day's start in UTC; the class runs the same hours on `days` consecutive days (3 unless set).
// US Eastern is EST (UTC−5) and Central European is CET (UTC+1) for all of these dates.
// A `free` class costs nothing; with a `register` link (its Zoom registration page) the Register buttons open that page
// instead of the contact form.
const ZONES = { EST: 'America/New_York', CET: 'Europe/Berlin' };
const session = (code, name, ibm, start, hrs, time, tz, instructor, { days: n = 3, free = false, register = '' } = {}) => {
  const zone = ZONES[tz], dayLength = hrs * 3600e3;
  const days = Array.from({ length: n }, (_, i) => start + i * 864e5);
  const md = (t, o) => new Intl.DateTimeFormat('en-US', { timeZone: zone, ...o }).format(t);
  const [first, last] = [days[0], days[days.length - 1]];
  const sameMonth = md(first, { month: 'short' }) === md(last, { month: 'short' });
  const day = { month: 'short', day: 'numeric' }, wday = { weekday: 'short', ...day };
  return {
    id: `${code}-${new Date(first).toISOString().slice(0, 10)}`, code, ibm, name, instructor, free, register,
    days, dayLength, hrs, zone, end: last + dayLength,
    hours: `${time} ${tz}`,
    dates: n === 1 ? md(first, day) : sameMonth ? `${md(first, day)}–${md(last, { day: 'numeric' })}` : `${md(first, day)} – ${md(last, day)}`,
    when: `${md(first, wday)}${n === 1 ? '' : ` – ${md(last, wday)}`}, ${md(last, { year: 'numeric' })}`,
    length: n === 1 ? `${hrs} hour${hrs === 1 ? '' : 's'}` : `${n} days`,
  };
};
// Free one-hour HAZ-AT-013 classes on Zoom. Paste each class's Zoom registration link here.
const AT013 = ['HAZ-AT-013', 'IBM webMethods Integration : What’s New in v12.1', ''];
const ZOOM_AT013_NOV19 = 'https://us06web.zoom.us/meeting/register/27DnIfxhQ-SWiBu9yfOjMg';
const ZOOM_AT013_NOV24 = 'https://us06web.zoom.us/meeting/register/aTNztq3BS4ij1Bnyd2qFJA';
export const SESSIONS = [
  session('HAZ-AT-008', 'IBM webMethods Integration v12.1 Developer', 'V010037G', Date.UTC(2026, 10, 16, 12), 8, '7 am–3 pm', 'EST', 'Megan Irvine'),
  session(...AT013, Date.UTC(2026, 10, 19, 15), 1, '10–11 am', 'EST', 'Megan Irvine', { days: 1, free: true, register: ZOOM_AT013_NOV19 }),
  session('HAZ-DA-0009', 'InfoSphere DataStage 11.7 Developers', 'V010009G', Date.UTC(2026, 10, 23, 7), 5, '8 am–1 pm', 'CET', 'Praveen Chinthala'),
  session(...AT013, Date.UTC(2026, 10, 24, 12), 1, '7–8 am', 'EST', 'Megan Irvine', { days: 1, free: true, register: ZOOM_AT013_NOV24 }),
  session('HAZ-DA-0001', 'IBM DataStage NextGen on IBM Cloud Pak for Data', 'V010001G', Date.UTC(2026, 10, 30, 12), 5, '7 am–12 pm', 'EST', 'Praveen Chinthala'),
  session('HAZ-AT-008', 'IBM webMethods Integration v12.1 Developer', 'V010037G', Date.UTC(2026, 11, 7, 12), 8, '1 pm–9 pm', 'CET', 'Megan Irvine'),
  session('HAZ-DA-0009', 'InfoSphere DataStage 11.7 Developers', 'V010009G', Date.UTC(2026, 11, 7, 7), 5, '8 am–1 pm', 'CET', 'Praveen Chinthala'),
];
export const bySession = Object.fromEntries(SESSIONS.map((s) => [s.id, s]));
/** Sessions not yet over, optionally only those of one course. */
export const openSessions = (code, now = Date.now()) => SESSIONS.filter((s) => now < s.end && (!code || s.code === code));
