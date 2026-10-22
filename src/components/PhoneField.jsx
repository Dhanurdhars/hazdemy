import { useEffect, useMemo, useRef, useState } from 'react';
import { COUNTRIES, byCountry } from '../data/countries';
import { Search } from './Icons';

// Flag SVGs bundled from the flag-icons package (no third-party requests); each one downloads only when shown.
const FLAGS = import.meta.glob('/node_modules/flag-icons/flags/4x3/*.svg', { eager: true, query: '?url', import: 'default' });
const flagUrl = (code) => FLAGS[`/node_modules/flag-icons/flags/4x3/${code.toLowerCase()}.svg`];
export const Flag = ({ code }) => <img className="flag" src={flagUrl(code)} alt="" width="22" height="16" loading="lazy" />;

/** Country picker (flag + dialling code) beside the telephone number. */
export default function PhoneField({ id, country, number, onCountry, onNumber }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [active, setActive] = useState(0);
  const wrapRef = useRef(null), listRef = useRef(null), searchRef = useRef(null), btnRef = useRef(null), numRef = useRef(null);
  const c = byCountry[country] || byCountry.US;

  const list = useMemo(() => {
    const s = q.trim().toLowerCase().replace(/^\+/, '');
    if (!s) return COUNTRIES;
    // best matches first: exact code or dial code, then names starting with the search, then names containing it
    const rank = (x) => (x.code.toLowerCase() === s || x.dial === s ? 0 : x.name.toLowerCase().startsWith(s) ? 1 : 2);
    return COUNTRIES.filter((x) => x.name.toLowerCase().includes(s) || x.code.toLowerCase() === s || x.dial.startsWith(s))
      .sort((a, b) => rank(a) - rank(b));
  }, [q]);

  useEffect(() => {
    if (!open) return;
    setQ(''); setActive(Math.max(0, COUNTRIES.indexOf(c)));
    setTimeout(() => {
      // keep the whole dropdown on screen and clear of the fixed header (scroll-margin-top in CSS)
      const pop = wrapRef.current?.querySelector('.phone-pop')?.getBoundingClientRect();
      if (pop && (pop.bottom > innerHeight || wrapRef.current.getBoundingClientRect().top < 90)) wrapRef.current.scrollIntoView({ block: 'start', behavior: 'smooth' });
    }, 0);
    const away = (e) => { if (!wrapRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);
  useEffect(() => { listRef.current?.children[active]?.scrollIntoView({ block: 'nearest' }); }, [active, open]);

  const choose = (x) => { onCountry(x.code); setOpen(false); setTimeout(() => numRef.current?.focus(), 0); };
  const onKey = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, list.length - 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); if (list[active]) choose(list[active]); }
    else if (e.key === 'Escape' || e.key === 'Tab') { setOpen(false); if (e.key === 'Escape') btnRef.current?.focus(); }
  };

  return (
    <div className="phone" ref={wrapRef}>
      <button type="button" ref={btnRef} className="phone-cc" onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox" aria-expanded={open} aria-label={`Country code: ${c.name} +${c.dial}`}>
        <Flag code={c.code} /><span>+{c.dial}</span><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      <input id={id} ref={numRef} type="tel" autoComplete="tel-national" inputMode="tel" placeholder="Phone number"
        value={number} onChange={(e) => onNumber(e.target.value.replace(/[^\d\s()\-.]/g, ''))} />
      {open && (
        <div className="phone-pop">
          <label className="phone-search"><Search /><input ref={(el) => { if (el && !searchRef.current) el.focus({ preventScroll: true }); searchRef.current = el; }} value={q} placeholder="Search country or code"
            aria-label="Search country or code" aria-controls={`${id}-list`} aria-activedescendant={list[active] ? `${id}-${list[active].code}` : undefined}
            onChange={(e) => { setQ(e.target.value); setActive(0); }} onKeyDown={onKey} /></label>
          <ul id={`${id}-list`} role="listbox" ref={listRef} aria-label="Country">
            {list.map((x, i) => (
              <li key={x.code} id={`${id}-${x.code}`} role="option" aria-selected={x.code === c.code}
                className={i === active ? 'on' : ''} onMouseEnter={() => setActive(i)} onClick={() => choose(x)}>
                <Flag code={x.code} /><span className="nm">{x.name}</span><span className="dc">+{x.dial}</span>
              </li>
            ))}
            {!list.length && <li className="none">No matching country</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
