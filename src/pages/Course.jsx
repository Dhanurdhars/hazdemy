import { Link, useParams } from 'react-router-dom';
import { COURSES, TRACKS, byCode, areaOf } from '../data/catalog';
import { dur, hours, askPath } from '../lib/format';
import { CourseCard, CTA, LevelBars, PageHead, Soon } from '../components/UI';
import { Arrow, Book, Check, Clock, Key, Target, Users } from '../components/Icons';
import NotFound from './NotFound';

export default function Course() {
  const { code } = useParams();
  const c = byCode[decodeURIComponent(code || '')];
  if (!c) return <NotFound />;
  const a = areaOf(c);
  const related = COURSES.filter((x) => x !== c && (x.product === c.product || x.area === c.area))
    .sort((x, y) => (y.product === c.product) - (x.product === c.product)).slice(0, 3);

  return (
    <>
      <PageHead crumbs={[{ label: 'Training', to: '/training' }, { label: c.area, to: `/training?area=${encodeURIComponent(c.area)}` }, { label: c.code }]} title={c.name}>
        <div className="dhero-meta">
          <span className="m" style={{ borderColor: a.c }}><i style={{ width: 8, height: 8, borderRadius: '50%', background: a.c }} />{c.product}</span>
          <span className="m"><Clock />{dur(c.days)}</span>
          <span className="m"><Target />{c.level}</span>
          <span className="m"><Key />{c.code}</span>
          {c.status === 'coming' && <span className="m soon-m">Coming soon</span>}
        </div>
      </PageHead>
      <div className="wrap">
        <div className="detail">
          <div>
            <div className="dsec reveal"><h2><i><Book /></i>Course overview</h2><p>{c.desc}</p></div>
            {c.persona.length > 0 && (
              <div className="dsec reveal"><h2><i><Users /></i>Who should attend</h2>
                <ul className="checks">{c.persona.map((p) => <li key={p}><Check /><span>{p}</span></li>)}</ul></div>
            )}
            {c.prereq.length > 0 && (
              <div className="dsec reveal"><h2><i><Key /></i>Prerequisites</h2>
                <ul className="checks">{c.prereq.map((p) => <li key={p}><Check /><span>{p}</span></li>)}</ul></div>
            )}
          </div>
          <aside className="aside reveal">
            <span className="eyebrow">At a glance</span>
            <dl>
              <div className="row"><dt>Course code</dt><dd>{c.code}</dd></div>
              <div className="row"><dt>Product</dt><dd>{c.product}</dd></div>
              <div className="row"><dt>Area</dt><dd>{c.area}</dd></div>
              <div className="row"><dt>Duration</dt><dd>{dur(c.days)} · {hours(c.days)}</dd></div>
              <div className="row"><dt>Skill level</dt><dd style={{ display: 'flex', gap: 8, alignItems: 'center', '--c': a.c }}><LevelBars level={c.level} />{c.level}</dd></div>
              <div className="row"><dt>Availability</dt><dd>{c.status === 'coming' ? <Soon course={c} /> : 'Available now'}</dd></div>
              <div className="row"><dt>Role tracks</dt><dd>{c.tracks.map((t) => TRACKS[t].name).join(', ')}</dd></div>
            </dl>
            <Link className="btn btn-primary" to={askPath(c)}>Ask for details <Arrow /></Link>
            <Link className="btn btn-ghost" to={`${askPath(c)}&type=private`}>Private team session</Link>
          </aside>
        </div>
        {related.length > 0 && (
          <div style={{ paddingBottom: 40 }}>
            <div className="sec-head"><div><span className="eyebrow">Keep learning</span><h2>Related courses</h2></div></div>
            <div className="cards">{related.map((r, i) => <CourseCard key={r.code} course={r} index={i} />)}</div>
          </div>
        )}
      </div>
      <CTA title={`Train your whole team on ${c.product}`} text="Bring this course to your organisation as a dedicated session tailored to your environment." />
    </>
  );
}
