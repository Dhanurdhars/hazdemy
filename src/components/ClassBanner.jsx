import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { SESSIONS, openSessions } from '../data/catalog';
import { askPath, coursePath } from '../lib/format';
import { Arrow, Close, Next, Prev } from './Icons';

const KEY = 'hz-classes';
const ROTATE_MS = 6000;
const pad = (n) => String(n).padStart(2, '0');

/** Where public class `s` stands at `now`: counting down to the next day's session, live, or over (null). */
export function phase(s, now) {
  for (let i = 0; i < s.days.length; i++) {
    const start = s.days[i], end = start + s.dayLength;
    if (now < start) return { live: false, day: i + 1, left: start - now };
    if (now < end) return { live: true, day: i + 1, left: end - now };
  }
  return null;
}

/** The current time, re-read every second until the last public class is over. */
export function useNow() {
  const [now, setNow] = useState(Date.now);
  const done = now >= Math.max(...SESSIONS.map((s) => s.end));
  useEffect(() => {
    if (done) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [done]);
  return now;
}

export function Countdown({ s, p }) {
  const t = Math.floor(p.left / 1000);
  const d = Math.floor(t / 86400), h = Math.floor(t / 3600) % 24, m = Math.floor(t / 60) % 60;
  const label = p.live ? `Live now · Day ${p.day} of ${s.days.length}` : p.day === 1 ? 'Starts in' : `Day ${p.day} starts in`;
  return (
    <span className="ann-timer" aria-live="off">
      <small>{label}</small>
      {p.live ? `${pad(h)}h ${pad(m)}m left` : <>{d > 0 && <><b>{d}</b>d </>}<b>{pad(h)}</b>h <b>{pad(m)}</b>m <b>{pad(t % 60)}</b>s</>}
    </span>
  );
}

/** Announcement bar under the header: the upcoming public classes, one at a time, with arrows to switch between them. */
export default function ClassBanner() {
  const now = useNow();
  const list = openSessions(undefined, now);
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(() => { try { return sessionStorage.getItem(KEY) === '1'; } catch { return false; } });
  const show = list.length > 0 && !hidden;
  const ref = useRef(null);

  // The page shifts down by the bar's height.
  useEffect(() => {
    const root = document.documentElement.style;
    if (!show || !ref.current) { root.removeProperty('--ann-h'); return; }
    const ro = new ResizeObserver(([e]) => root.setProperty('--ann-h', `${Math.ceil(e.borderBoxSize?.[0]?.blockSize ?? e.target.offsetHeight)}px`));
    ro.observe(ref.current);
    return () => { ro.disconnect(); root.removeProperty('--ann-h'); };
  }, [show]);

  // Moves on to the next class every few seconds, except while the pointer or focus is on the bar (or motion is reduced).
  const many = list.length > 1;
  useEffect(() => {
    if (!show || !many || paused || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = setInterval(() => setI((x) => x + 1), ROTATE_MS);
    return () => clearInterval(t);
  }, [show, many, paused, i]);

  if (!show) return null;
  const n = list.length, at = i % n, s = list[at], p = phase(s, now);
  const go = (d) => setI((at + d + n) % n);
  const dismiss = () => { setHidden(true); try { sessionStorage.setItem(KEY, '1'); } catch { /* storage blocked */ } };

  return (
    <div className="ann" ref={ref} role="region" aria-roledescription="carousel" aria-label="Upcoming virtual classes"
      onPointerEnter={() => setPaused(true)} onPointerLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setPaused(false)}>
      <div className="wrap">
        <Link key={s.id} className="ann-main" to={coursePath(s)} title={`${s.name} (${s.code}) — view course and schedule`}>
          <span className={`ann-tag ${p.live ? 'live' : ''}`}>{p.live ? 'Live' : 'Upcoming training'}</span>
          <span className="ann-txt">
            <b className="ann-name">{s.name}</b>
            <span className="ann-meta">{s.instructor && <span className="ins"> · with {s.instructor}</span>} · {s.dates}<span className="hrs"> · {s.hours}</span></span>
          </span>
          <Countdown s={s} p={p} />
          <Arrow className="ann-go" />
        </Link>
        {n > 1 && (
          <span className="ann-nav">
            <button onClick={() => go(-1)} aria-label="Previous class"><Prev /></button>
            <span aria-label={`Class ${at + 1} of ${n}`}>{at + 1}/{n}</span>
            <button onClick={() => go(1)} aria-label="Next class"><Next /></button>
          </span>
        )}
        <Link className="ann-cta ghost" to={coursePath(s)}>View course details</Link>
        <Link className="ann-cta" to={askPath(s, s)}>Enroll</Link>
        <button className="ann-x" onClick={dismiss} aria-label="Hide announcement"><Close /></button>
      </div>
    </div>
  );
}
