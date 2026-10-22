// Keeps <head> in step with the page while visitors move around the single-page app (the build writes the same tags
// into each page's HTML file, so crawlers and link previews get them without running JavaScript).
import { metaFor } from '../seo';
import { byCode } from '../data/catalog';

export const SITE_URL = import.meta.env.VITE_SITE_URL; // set in vite.config.js

function tag(selector, create) {
  let el = document.head.querySelector(selector);
  if (!el) { el = create(); document.head.appendChild(el); }
  return el;
}
/** Sets <meta attr="key" content>, or removes it when content is empty. */
const meta = (attr, key, content) => {
  const existing = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!content) return existing?.remove();
  const el = existing || tag(`meta[${attr}="${key}"]`, () => { const m = document.createElement('meta'); m.setAttribute(attr, key); return m; });
  el.setAttribute('content', content);
};

export function updateHead(pathname) {
  const code = decodeURIComponent(pathname.match(/^\/course\/([^/]+)/)?.[1] || '');
  const m = metaFor(pathname, { site: SITE_URL, course: byCode[code] || byCode[code.toUpperCase()] });
  document.title = m.title;
  meta('name', 'robots', m.noindex ? 'noindex' : null);
  meta('name', 'description', m.description || null);
  const canonical = tag('link[rel="canonical"]', () => Object.assign(document.createElement('link'), { rel: 'canonical' }));
  if (m.canonical) canonical.href = m.canonical; else canonical.remove();
  for (const [k, v] of Object.entries({ title: m.title, description: m.description, url: m.canonical, type: m.type, image: m.image })) meta('property', `og:${k}`, m.noindex ? null : v);
  document.head.querySelectorAll('script[type="application/ld+json"]').forEach((s) => s.remove());
  for (const j of m.jsonLd || []) document.head.appendChild(Object.assign(document.createElement('script'), { type: 'application/ld+json', textContent: JSON.stringify(j) }));
}
