import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AREAS, COURSES, LEVELS, TRACKS } from '../data/catalog';
import { dur, coursePath } from '../lib/format';
import { CTA, LevelBars, PageHead } from '../components/UI';
import { AreaIcon } from '../components/Icons';
import { observeReveals } from '../lib/effects';

export default function Paths() {
  const [params] = useSearchParams();
  const [t, setT] = useState(params.get('t') && TRACKS[params.get('t')] ? params.get('t') : 'builders');
  useEffect(() => { const x = setTimeout(observeReveals, 30); return () => clearTimeout(x); }, [t]);
  const T = TRACKS[t];
  const list = COURSES.filter((c) => c.tracks.includes(t));
  const areas = Object.keys(AREAS).filter((a) => list.some((c) => c.area === a));

  return (
    <>
      <PageHead crumbs={[{ label: 'Learning Paths' }]} title="Learning paths by role"
        lead="Three role-based tracks — Builders, Operators and Leaders — each laddered from Foundation to Advanced within every technology area." />
      <section style={{ paddingTop: 56 }}><div className="wrap">
        <div className="tabs">
          {Object.entries(TRACKS).map(([k, x]) => (
            <button key={k} className={k === t ? 'on' : ''} onClick={() => setT(k)}>{x.name} · {COURSES.filter((c) => c.tracks.includes(k)).length}</button>
          ))}
        </div>
        <p className="lead" style={{ marginTop: 28 }}>{T.d}</p>
        {areas.map((a) => {
          const ac = AREAS[a];
          return (
            <div className="path-block reveal" key={t + a}>
              <h3><span className="ic" style={{ width: 44, height: 44, borderRadius: 12, display: 'grid', placeItems: 'center', background: `color-mix(in srgb,${ac.c} 14%,transparent)`, color: ac.c }}><AreaIcon area={a} style={{ width: 22, height: 22 }} /></span>{a}</h3>
              <div className="ladder">
                {LEVELS.map((l, i) => {
                  const cs = list.filter((c) => c.area === a && c.level === l);
                  return (
                    <div className="rung" key={l} style={{ '--c': ac.c }}>
                      <h4><LevelBars level={l} /> Step {i + 1} · {l}</h4>
                      {cs.length ? (
                        <ol>{cs.map((c) => <li key={c.code}><Link to={coursePath(c)}>{c.name}<small>{c.code} · {dur(c.days)}</small></Link></li>)}</ol>
                      ) : (
                        <p style={{ color: 'var(--ink-3)', fontSize: 14 }}>No {l.toLowerCase()} course in this track yet — <Link to="/contact" style={{ color: 'var(--brand)' }}>ask us</Link>.</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div></section>
      <CTA title="Need a custom learning path?" text="We’ll design a sequenced curriculum around your roles, products and delivery timelines." />
    </>
  );
}
