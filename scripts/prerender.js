// Runs after `vite build`: writes one HTML file per page (each with its own title, description, canonical link,
// link-preview tags and structured data), plus sitemap.xml, robots.txt and app.html, the neutral fallback for
// addresses without their own file. Search engines and link previews read these without running JavaScript.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { siteUrl } from './site-url.js';
import { STATIC_PATHS, metaFor, headTags, SITE_NAME, DEFAULT_DESCRIPTION } from '../src/seo.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const site = siteUrl();
const courses = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/courses.json'), 'utf8'));
const template = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
if (!/<title>[\s\S]*?<\/title>/.test(template)) throw new Error('dist/index.html has no <title> to replace');

// Swap the template's <title> and description for the page's own tags.
const render = (tags) => template
  .replace(/\s*<meta name="description"[^>]*>/, '')
  .replace(/<title>[\s\S]*?<\/title>/, tags);
const write = (rel, html) => { const f = path.join(DIST, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, html); };
// vercel.json has cleanUrls on, so /training is served from training.html and /course/X from course/X.html
const fileFor = (p) => (p === '/' ? 'index.html' : `${p.slice(1)}.html`);

const pages = [...STATIC_PATHS.map((p) => ({ p })), ...courses.map((c) => ({ p: `/course/${encodeURIComponent(c.code)}`, course: c }))];
for (const { p, course } of pages) write(fileFor(p), render(headTags(metaFor(p, { site, course }))));
write('admin.html', render(headTags(metaFor('/admin', { site }))));
write('app.html', render(`<title>${SITE_NAME}</title>\n    <meta name="description" content="${DEFAULT_DESCRIPTION}" />`));

const today = new Date().toISOString().slice(0, 10);
const urls = pages.map(({ p }) => metaFor(p, { site, course: pages.find((x) => x.p === p).course }).canonical);
write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
  .map((u) => `  <url><loc>${u.replace(/&/g, '&amp;')}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`);
write('robots.txt', `User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: ${site}/sitemap.xml\n`);

console.log(`prerender: ${pages.length} pages + sitemap.xml + robots.txt for ${site}`);
