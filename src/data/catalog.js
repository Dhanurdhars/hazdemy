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
