// npm test — page titles, descriptions, canonical links and structured data (src/seo.js), and the site address.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { metaFor, headTags, STATIC_PATHS } from '../src/seo.js';
import { siteUrl } from '../scripts/site-url.js';

const site = 'https://hazdemy.com';
const courses = JSON.parse(fs.readFileSync(new URL('../src/data/courses.json', import.meta.url), 'utf8'));
const course = courses.find((c) => c.code === 'HAZ-AT-008');

test('seo: every page has its own title, description and canonical link', () => {
  const metas = STATIC_PATHS.map((p) => metaFor(p, { site }));
  assert.equal(new Set(metas.map((m) => m.title)).size, metas.length);
  for (const m of metas) {
    assert.ok(m.description.length >= 70 && m.description.length <= 160, `${m.title}: description ${m.description.length} chars`);
    assert.ok(m.title.length <= 65, `title too long: ${m.title}`);
    assert.match(m.canonical, /^https:\/\/hazdemy\.com\//);
  }
  assert.equal(metaFor('/training/', { site }).canonical, 'https://hazdemy.com/training'); // trailing slash folds in
  assert.equal(metaFor('/', { site }).jsonLd[0]['@type'], 'EducationalOrganization');
});

test('seo: course pages carry Course and breadcrumb structured data', () => {
  const m = metaFor('/course/HAZ-AT-008', { site, course });
  assert.equal(m.title, 'IBM webMethods Integration v12.1 Developer (HAZ-AT-008) | Hazdemy Learning');
  assert.equal(m.canonical, 'https://hazdemy.com/course/HAZ-AT-008');
  assert.ok(m.description.length <= 160);
  assert.doesNotMatch(m.description, /^\d+-day .*\d+-day/); // no "3-day … This 3-day …" repetition
  const [c, crumbs] = m.jsonLd;
  assert.deepEqual([c['@type'], c.courseCode, c.provider.name, c.timeRequired], ['Course', 'HAZ-AT-008', 'Hazdemy Learning', 'P3D']);
  assert.equal(crumbs.itemListElement.length, 3);
  for (const x of courses) assert.ok(metaFor(`/course/${x.code}`, { site, course: x }).description.length <= 160, x.code);
});

test('seo: admin and unknown pages stay out of search results', () => {
  assert.equal(metaFor('/admin', { site }).noindex, true);
  assert.equal(metaFor('/nope', { site }).noindex, true);
  assert.equal(metaFor('/course/NOPE', { site }).noindex, true);
  assert.match(headTags(metaFor('/admin', { site })), /<meta name="robots" content="noindex" \/>/);
});

test('seo: head tags escape text and keep structured data inert', () => {
  const html = headTags(metaFor('/course/X', { site, course: { ...course, code: 'X', name: 'A "B" <c> & d</script>' } }));
  assert.match(html, /<title>A &quot;B&quot; &lt;c&gt; &amp; d&lt;\/script&gt; \(X\)/);
  assert.equal((html.match(/<\/script>/g) || []).length, 2); // only the two JSON-LD blocks close; the name can't
});

test('seo: site address', () => {
  assert.equal(siteUrl({}), 'https://hazdemy.com');
  assert.equal(siteUrl({ VERCEL_PROJECT_PRODUCTION_URL: 'hazdemy.vercel.app' }), 'https://hazdemy.vercel.app');
  assert.equal(siteUrl({ SITE_URL: 'https://www.hazdemy.com/', VERCEL_PROJECT_PRODUCTION_URL: 'x.vercel.app' }), 'https://www.hazdemy.com');
});
