// Cookie consent: remembers the visitor's choice and loads optional third-party resources only after "Accept".
const KEY = 'hz-cookie-consent'; // 'accepted' | 'declined'
const FONTS = 'https://fonts.googleapis.com/css2?family=Sulphur+Point:wght@400;700&family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap';

export function getConsent() {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export function setConsent(value) {
  try { localStorage.setItem(KEY, value); } catch { /* storage blocked */ }
  if (value === 'accepted') loadOptional();
  window.dispatchEvent(new CustomEvent('hz:consent', { detail: value }));
}

/** Optional resources (Google Fonts). Without consent the site uses similar fonts built into the device. */
export function loadOptional() {
  if (document.getElementById('hz-fonts')) return;
  for (const href of ['https://fonts.googleapis.com', 'https://fonts.gstatic.com']) {
    const l = document.createElement('link'); l.rel = 'preconnect'; l.href = href; if (href.includes('gstatic')) l.crossOrigin = '';
    document.head.appendChild(l);
  }
  const css = document.createElement('link');
  css.id = 'hz-fonts'; css.rel = 'stylesheet'; css.href = FONTS;
  document.head.appendChild(css);
}

/** Re-open the banner (used by the footer "Cookie settings" link). */
export const openCookieSettings = () => window.dispatchEvent(new Event('hz:cookie-settings'));