import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { UPCOMING_CLASS as K } from '../data/catalog';
import { askPath, coursePath } from '../lib/format';
import { Close } from './Icons';

const KEY = `hz-class-${K.code}`;
const pad = (n) => String(n).padStart(2, '0');

/** Where the class stands at `now`: counting down to the next day's session, live, or over (null). */
function phase(now) {
  for (let i = 0; i < K.days.length; i++) {
    const start = K.days[i], end = start + K.dayLength;
    if (now < start) return { live: false, day: i + 1, left: start - now };
    if (now < end) return { live: true, day: i + 1, left: end - now };
  }
  return null;
}

/** The class's current phase, re-evaluated every second until it is over. */
export function useClassPhase() {
  const [now, setNow] = useState(Date.now);
  const p = phase(now);
  useEffect(() => {
    if (!p) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [!p]);
  return { p, now };
}

export function Countdown({ p }) {
  const s = Math.floor(p.left / 1000);
  const d = Math.floor(s / 86400), h = Math.floor(s / 3600) % 24, m = Math.floor(s / 60) % 60;
  const label = p.live ? `Live now · Day ${p.day} of ${K.days.length}` : p.day === 1 ? 'Starts in' : `Day ${p.day} starts in`;
  return (
    <span className="ann-timer" aria-live="off">
      <small>{label}</small>
      {p.live ? `${pad(h)}h ${pad(m)}m left` : <>{d > 0 && <><b>{d}</b>d </>}<b>{pad(h)}</b>h <b>{pad(m)}</b>m <b>{pad(s % 60)}</b>s</>}
    </span>
  );
}

/** Announcement bar with a live countdown for the next scheduled public class. */
export default function ClassBanner() {
  const { p } = useClassPhase();
  const [hidden, setHidden] = useState(() => { try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; } });
  const show = p && !hidden;
  const ref = useRef(null);

  // The header and page shift down by the bar's height.
  useEffect(() => {
    const root = document.documentElement.style;
    if (!show || !ref.current) { root.removeProperty('--ann-h'); return; }
    const ro = new ResizeObserver(([e]) => root.setProperty('--ann-h', `${Math.ceil(e.borderBoxSize?.[0]?.blockSize ?? e.target.offsetHeight)}px`));
    ro.observe(ref.current);
    return () => { ro.disconnect(); root.removeProperty('--ann-h'); };
  }, [show]);

  if (!show) return null;
  const dismiss = () => { setHidden(true); try { sessionStorage.setItem(KEY, '1'); } catch { /* storage blocked */ } };

  return (
    <div className="ann" ref={ref} role="region" aria-label="Upcoming training">
      <div className="wrap">
        <span className={`ann-tag ${p.live ? 'live' : ''}`}>{p.live ? 'Live' : 'Upcoming training'}</span>
        <p className="ann-txt">
          <Link className="ann-name" to={coursePath(K)} title={`${K.name} (${K.code})`}><b>{K.name}</b></Link>
          <span className="ann-meta"><span className="ins"> · with {K.instructor}</span> · {K.dates}<span className="hrs"> · {K.hours}</span></span>
        </p>
        <Countdown p={p} />
        <Link className="ann-cta ghost" to={coursePath(K)}>View course details</Link>
        <Link className="ann-cta" to={askPath(K)}>Enroll</Link>
        <button className="ann-x" onClick={dismiss} aria-label="Hide announcement"><Close /></button>
      </div>
    </div>
  );
}
