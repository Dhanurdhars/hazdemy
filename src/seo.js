// Search and link-preview details for every page. Plain JS on purpose: the browser uses it as visitors move around
// (src/components/Layout.jsx) and the build uses it to write a separate HTML file per page (scripts/prerender.js).

export const SITE_NAME = 'Hazdemy Learning';
export const DEFAULT_DESCRIPTION = 'Instructor-led, hands-on IBM training for enterprise teams in Data, AI, Automation, Security, Sustainability and Infrastructure: single courses to programs.';
const IMAGE = '/og-image.jpg'; // 1200×630 link-preview card (public/og-image.jpg)

const PAGES = {
  '/': { title: 'Hazdemy Learning: Hands-on IBM Technology Training', description: DEFAULT_DESCRIPTION },
  '/training': { title: 'IBM Training Course Catalog', description: 'Browse instructor-led IBM courses with codes, durations and skill levels: DataStage, Cloud Pak for Data, watsonx, Maximo, Guardium, webMethods and more.' },
  '/paths': { title: 'Learning Paths by Role', description: 'Role-based IBM learning paths for Builders, Operators and Leaders, each laddered from Foundation to Advanced within every technology area.' },
  '/services': { title: 'Enterprise IBM Training Programs', description: 'Tiered upskilling, mentorship and capstones: enterprise training programs that take teams from learning IBM technology to delivering with it.' },
  '/about': { title: 'About Us', description: 'Hazdemy is a global IT training partner building practical skills on the IBM technology portfolio, with 750+ expert instructors and 98% customer satisfaction.' },
  '/careers': { title: 'Careers: Teach IBM Technology', description: 'Join our network of 750+ expert instructors and course authors delivering hands-on IBM training to enterprises worldwide.' },
  '/contact': { title: 'Contact Us: Request IBM Training', description: 'Tell us what your team needs, whether a single course, a private session or a full learning program, and get delivery options, availability and a quote.' },
  '/privacy': { title: 'Privacy & Cookie Policy', description: 'How Hazdemy Learning handles personal information and cookies on this website.' },
};

/** Addresses listed in the sitemap (course pages are added from the catalogue). */
export const STATIC_PATHS = Object.keys(PAGES);

const clip = (s, n) => { const t = String(s || '').replace(/\s+/g, ' ').trim(); return t.length <= n ? t : `${t.slice(0, n - 1).replace(/\s+\S*$/, '')}…`; };

const organization = (site) => ({
  '@context': 'https://schema.org', '@type': 'EducationalOrganization', '@id': `${site}/#org`,
  name: SITE_NAME, url: `${site}/`, logo: `${site}/logo.png`, email: 'training@hazdemy.com',
  address: { '@type': 'PostalAddress', streetAddress: '251 Little Falls Drive', addressLocality: 'Wilmington', addressRegion: 'DE', postalCode: '19808', addressCountry: 'US' },
});

/**
 * Everything the page head needs for `path`. `site` is the public origin (no trailing slash);
 * `course` is the catalogue entry when `path` is a course page.
 */
export function metaFor(path, { site, course } = {}) {
  const clean = path.replace(/\/+$/, '') || '/';
  if (clean === '/admin') return { title: `Admin | ${SITE_NAME}`, description: '', noindex: true };

  let page = PAGES[clean], jsonLd = [];
  if (clean === '/') jsonLd = [organization(site), { '@context': 'https://schema.org', '@type': 'WebSite', name: SITE_NAME, url: `${site}/`, publisher: { '@id': `${site}/#org` } }];

  if (!page && course && clean.startsWith('/course/')) {
    // most descriptions already open with the duration; only short ones get a "3-day Intermediate …" lead-in
    const lead = `${course.days ? `${course.days}-day ` : ''}${course.level ? `${course.level} ` : ''}instructor-led IBM course`;
    page = {
      title: `${course.name} (${course.code})`,
      description: clip(String(course.desc).length < 110 ? `${lead}: ${course.desc}` : course.desc, 160),
      type: 'article',
    };
    const url = `${site}/course/${encodeURIComponent(course.code)}`;
    jsonLd = [
      {
        '@context': 'https://schema.org', '@type': 'Course', name: course.name, courseCode: course.code, url,
        description: clip(course.desc, 500), educationalLevel: course.level || undefined, about: course.product || undefined,
        timeRequired: course.days ? `P${course.days}D` : undefined, inLanguage: 'en',
        provider: { '@type': 'Organization', name: SITE_NAME, sameAs: `${site}/` },
      },
      {
        '@context': 'https://schema.org', '@type': 'BreadcrumbList', itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Training', item: `${site}/training` },
          { '@type': 'ListItem', position: 2, name: course.area, item: `${site}/training?area=${encodeURIComponent(course.area)}` },
          { '@type': 'ListItem', position: 3, name: course.name, item: url },
        ],
      },
    ];
  }

  if (!page) return { title: `Page not found | ${SITE_NAME}`, description: '', noindex: true };
  const canonical = `${site}${clean === '/' ? '/' : clean.startsWith('/course/') ? `/course/${encodeURIComponent(course.code)}` : clean}`;
  return {
    title: clean === '/' ? page.title : `${page.title} | ${SITE_NAME}`,
    description: page.description, canonical, image: `${site}${IMAGE}`, type: page.type || 'website', jsonLd,
  };
}

/** The <head> tags for a page, as HTML (used by the build). Values are escaped. */
export function headTags(m) {
  const e = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const tags = [`<title>${e(m.title)}</title>`];
  if (m.noindex) return [...tags, '<meta name="robots" content="noindex" />'].join('\n    ');
  tags.push(
    `<meta name="description" content="${e(m.description)}" />`,
    `<link rel="canonical" href="${e(m.canonical)}" />`,
    `<meta property="og:site_name" content="${SITE_NAME}" />`,
    `<meta property="og:type" content="${m.type}" />`,
    `<meta property="og:title" content="${e(m.title)}" />`,
    `<meta property="og:description" content="${e(m.description)}" />`,
    `<meta property="og:url" content="${e(m.canonical)}" />`,
    `<meta property="og:image" content="${e(m.image)}" />`,
    '<meta property="og:image:width" content="1200" />', '<meta property="og:image:height" content="630" />',
    '<meta name="twitter:card" content="summary_large_image" />',
    ...m.jsonLd.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, '\\u003c')}</script>`),
  );
  return tags.join('\n    ');
}
