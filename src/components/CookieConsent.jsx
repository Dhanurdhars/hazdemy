import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { GA_ID, applyConsent, consentDefaults, getConsent, setConsent } from '../lib/consent';

const CATEGORIES = [
  { id: 'essential', name: 'Essential', desc: 'Remembers your theme, catalog view, cookie choice and chat history. Required for the site to work.', locked: true },
  { id: 'analytics', name: 'Analytics', desc: 'Google Analytics cookies help us understand which pages and courses people use, so we can improve the site. Google receives your IP address and device details.', hidden: !GA_ID },
  { id: 'fonts', name: 'Third-party fonts', desc: 'Loads Google Fonts, which shares your IP address with Google. Without it we use fonts built into your device.' },
].filter((c) => !c.hidden);

// Accept / Decline banner shown on every page until the visitor chooses; "Customize" (or the footer
// "Cookie settings" link) opens per-category toggles.
export default function CookieConsent() {
  const [open, setOpen] = useState(() => !getConsent());
  const [settings, setSettings] = useState(false);
  const [picked, setPicked] = useState(consentDefaults);

  useEffect(() => {
    applyConsent();
    const show = () => { setPicked(consentDefaults()); setSettings(true); setOpen(true); };
    window.addEventListener('hz:cookie-settings', show);
    return () => window.removeEventListener('hz:cookie-settings', show);
  }, []);

  if (!open) return null;
  const choose = (c) => { setConsent(c); setOpen(false); setSettings(false); };
  const all = (on) => ({ fonts: on, analytics: on });

  return (
    <div className={`cookie ${settings ? 'cookie-wide' : ''}`} role="dialog" aria-live="polite" aria-label="Cookie settings">
      <div className="cookie-text">
        <b>Cookie settings</b>
        <p>We use essential browser storage to make this site work. With your consent we also {GA_ID ? 'use Google Analytics to see how the site is used, and ' : ''}load Google Fonts, which shares your IP address with Google. See our <Link to="/privacy">Privacy &amp; Cookie Policy</Link>.</p>
      </div>
      {settings && (
        <ul className="cookie-cats">
          {CATEGORIES.map((c) => (
            <li key={c.id}>
              <div><b>{c.name}</b><p>{c.desc}</p></div>
              <label className="switch">
                <input type="checkbox" checked={c.locked || !!picked[c.id]} disabled={c.locked}
                  onChange={(e) => setPicked((p) => ({ ...p, [c.id]: e.target.checked }))} aria-label={c.name} />
                <span />
              </label>
            </li>
          ))}
        </ul>
      )}
      <div className="cookie-actions">
        {settings
          ? <button className="btn btn-ghost" onClick={() => choose(picked)}>Save choices</button>
          : <button className="linkbtn" onClick={() => setSettings(true)}>Customize</button>}
        <button className="btn btn-ghost cookie-decline" onClick={() => choose(all(false))}>Decline</button>
        <button className="btn btn-primary cookie-accept" onClick={() => choose(all(true))}>Accept all</button>
      </div>
    </div>
  );
}
