// Cookie consent: remembers the visitor's choice per category and loads optional third-party resources only after consent.
const KEY = 'hz-consent'; // JSON { fonts: bool, analytics: bool }
const OLD_KEY = 'hz-cookie-consent'; // earlier 'accepted' | 'declined' choice, which covered fonts only
const FONTS = 'https://fonts.googleapis.com/css2?family=Sulphur+Point:wght@400;700&family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&display=swap';

/** Google Analytics 4 Measurement ID. Built sites use Hazdemy's property; `npm run dev` stays out of the reports unless
 *  VITE_GA_MEASUREMENT_ID is set (which also overrides the ID). Without an ID, analytics is off and not offered. */
export const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || (import.meta.env.PROD ? 'G-PP70XTSPMM' : '');

/** The saved choice, or null if the visitor hasn't chosen yet. */
export function getConsent() {
  try { const c = JSON.parse(localStorage.getItem(KEY)); return c && typeof c === 'object' ? c : null; } catch { return null; }
}

/** What to pre-tick in the settings: the saved choice, or the fonts choice from before analytics was added. */
export function consentDefaults() {
  const c = getConsent();
  if (c) return { fonts: !!c.fonts, analytics: !!c.analytics };
  let old = null; try { old = localStorage.getItem(OLD_KEY); } catch { /* storage blocked */ }
  return { fonts: old === 'accepted', analytics: false };
}

export function setConsent(choice) {
  const c = { fonts: !!choice.fonts, analytics: !!(choice.analytics && GA_ID) };
  try { localStorage.setItem(KEY, JSON.stringify(c)); localStorage.removeItem(OLD_KEY); } catch { /* storage blocked */ }
  applyConsent(c);
  window.dispatchEvent(new CustomEvent('hz:consent', { detail: c }));
}

/** Loads or removes the optional resources to match a choice. */
export function applyConsent(c = getConsent()) {
  if (c?.fonts) loadFonts(); else document.getElementById('hz-fonts')?.remove(); // falls back to device fonts
  if (c?.analytics) loadAnalytics(); else stopAnalytics();
}

function loadFonts() {
  if (document.getElementById('hz-fonts')) return;
  for (const href of ['https://fonts.googleapis.com', 'https://fonts.gstatic.com']) {
    const l = document.createElement('link'); l.rel = 'preconnect'; l.href = href; if (href.includes('gstatic')) l.crossOrigin = '';
    document.head.appendChild(l);
  }
  const css = document.createElement('link');
  css.id = 'hz-fonts'; css.rel = 'stylesheet'; css.href = FONTS;
  document.head.appendChild(css);
}

// ---- Google Analytics 4 (only after consent) ----
// GA4's enhanced measurement records page views when the address changes, which covers this single-page app's navigation.
function loadAnalytics() {
  if (!GA_ID) return;
  window[`ga-disable-${GA_ID}`] = false;
  if (document.getElementById('hz-ga')) return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); }; // gtag needs the arguments object, not an array
  window.gtag('js', new Date());
  window.gtag('config', GA_ID);
  const s = document.createElement('script');
  s.id = 'hz-ga'; s.async = true; s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_ID)}`;
  document.head.appendChild(s);
}

/** Consent withdrawn: stop sending data and delete Google Analytics cookies (_ga, _ga_XXXX). */
function stopAnalytics() {
  if (!GA_ID) return;
  window[`ga-disable-${GA_ID}`] = true;
  const host = location.hostname.split('.');
  const domains = ['', ...host.map((_, i) => '.' + host.slice(i).join('.'))];
  for (const name of document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => /^_ga(_|$)/.test(n))) {
    for (const d of domains) document.cookie = `${name}=; Max-Age=0; path=/${d ? '; domain=' + d : ''}`;
  }
}

/** Records an analytics event (e.g. an enquiry sent). Does nothing without analytics consent. */
export function track(event, params = {}) {
  if (getConsent()?.analytics && window.gtag) window.gtag('event', event, params);
}

/** Re-open the banner (used by the footer "Cookie settings" link). */
export const openCookieSettings = () => window.dispatchEvent(new Event('hz:cookie-settings'));
