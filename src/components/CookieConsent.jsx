import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getConsent, loadOptional, setConsent } from '../lib/consent';

const CATEGORIES = [
  { id: 'essential', name: 'Essential', desc: 'Remembers your theme, catalog view, cookie choice and chat history. Required for the site to work.', locked: true },
  { id: 'fonts', name: 'Third-party fonts', desc: 'Loads Google Fonts, which shares your IP address with Google. Without it we use fonts built into your device.' },
];

// Accept / Decline banner shown on every page until the visitor chooses; "Customize" (or the footer
// "Cookie settings" link) opens per-category toggles.
export default function CookieConsent() {
  const [open, setOpen] = useState(() => !getConsent());
  const [settings, setSettings] = useState(false);
  const [fonts, setFonts] = useState(() => getConsent() === 'accepted');

  useEffect(() => {
    if (getConsent() === 'accepted') loadOptional();
    const show = () => { setFonts(getConsent() === 'accepted'); setSettings(true); setOpen(true); };
    window.addEventListener('hz:cookie-settings', show);
    return () => window.removeEventListener('hz:cookie-settings', show);
  }, []);

  if (!open) return null;
  const choose = (v) => { setConsent(v); setOpen(false); setSettings(false); };

  return (
    <div className={`cookie ${settings ? 'cookie-wide' : ''}`} role="dialog" aria-live="polite" aria-label="Cookie settings">
      <div className="cookie-text">
        <b>Cookie settings</b>
        <p>We use essential browser storage to make this site work. With your consent we also load Google Fonts, which shares your IP address with Google. See our <Link to="/privacy">Privacy &amp; Cookie Policy</Link>.</p>
      </div>
      {settings && (
        <ul className="cookie-cats">
          {CATEGORIES.map((c) => (
            <li key={c.id}>
              <div><b>{c.name}</b><p>{c.desc}</p></div>
              <label className="switch">
                <input type="checkbox" checked={c.locked || fonts} disabled={c.locked}
                  onChange={(e) => setFonts(e.target.checked)} aria-label={c.name} />
                <span />
              </label>
            </li>
          ))}
        </ul>
      )}
      <div className="cookie-actions">
        {settings
          ? <button className="btn btn-ghost" onClick={() => choose(fonts ? 'accepted' : 'declined')}>Save choices</button>
          : <button className="linkbtn" onClick={() => setSettings(true)}>Customize</button>}
        <button className="btn btn-ghost cookie-decline" onClick={() => choose('declined')}>Decline</button>
        <button className="btn btn-primary cookie-accept" onClick={() => choose('accepted')}>Accept all</button>
      </div>
    </div>
  );
}
