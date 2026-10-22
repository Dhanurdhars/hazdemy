// The site's public address for canonical links, the sitemap and link previews (no trailing slash).
// SITE_URL wins; on Vercel the production domain is provided automatically; otherwise the main domain.
export function siteUrl(env = process.env) {
  const url = env.SITE_URL || (env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${env.VERCEL_PROJECT_PRODUCTION_URL}` : 'https://hazdemy.com');
  return url.replace(/\/+$/, '');
}
