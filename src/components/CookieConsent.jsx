import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getConsent, setConsent } from '../lib/consent';

// Accept / Decline banner shown on every page until the visitor chooses (reopened via "Cookie settings").
export default function CookieConsent() {
  const [open, setOpen] = useState(() => !getConsent());
  useEffect(() => {
    const show = () => setOpen(true);
    window.addEventListener('hz:cookie-settings', show);
    return () => window.removeEventListener('hz:cookie-settings', show);
  }, []);
  if (!open) return null;
  const choose = (v) => { setConsent(v); setOpen(false); };
  return (
    <div className="cookie" role="dialog" aria-live="polite" aria-label="Cookie settings">
      <div className="cookie-text">
        <b>Cookie settings</b>
        <p>We use essential browser storage to make this site work. With your consent we also load Google Fonts, which shares your IP address with Google. See our <Link to="/privacy">Privacy &amp; Cookie Policy</Link>.</p>
      </div>
      <div className="cookie-actions">
        <button className="btn cookie-decline" onClick={() => choose('declined')}>Decline</button>
        <button className="btn btn-primary cookie-accept" onClick={() => choose('accepted')}>Accept</button>
      </div>
    </div>
  );
}
