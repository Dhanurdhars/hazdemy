import { Link, useParams } from 'react-router-dom';
import { COURSES, TRACKS, UPCOMING_CLASS, byCode, areaOf } from '../data/catalog';
import { dur, hours, askPath } from '../lib/format';
import { CourseCard, CTA, LevelBars, PageHead } from '../components/UI';
import { Arrow, Book, Check, Clock, Key, Mentor, Target, Users } from '../components/Icons';
import { Countdown, useClassPhase } from '../components/ClassBanner';
import NotFound from './NotFound';

const ET = { timeZone: 'America/New_York' };
const dayFmt = new Intl.DateTimeFormat('en-US', { ...ET, weekday: 'short', month: 'short', day: 'numeric' });
const localFmt = new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' });
const localTz = new Intl.DateTimeFormat(undefined, { timeZoneName: 'short' });
const tzName = (t) => localTz.formatToParts(t).find((x) => x.type === 'timeZoneName')?.value;

/** Dates, hours and instructor of the scheduled public class. */
function Schedule({ k, p }) {
  const first = k.days[0], last = k.days[k.days.length - 1];
  return (
    <div className="dsec reveal" id="schedule"><h2><i><Clock /></i>Schedule</h2>
      <div className="sched">
        <div className="sched-head">
          <div>
            <span className="eyebrow">Next public class <span className={`st ${p.live ? 'live' : ''}`}>{p.live ? `Live now · Day ${p.day}` : 'Upcoming'}</span></span>
            <b>{dayFmt.format(first)} – {dayFmt.format(last)}, 2026</b>
          </div>
          <Countdown p={p} />
        </div>
        <ul className="sched-facts">
          <li><Clock /><span><b>7:00 am – 3:00 pm US EST, daily</b><small>Your time: {localFmt.format(first)} – {localFmt.format(first + k.dayLength)} {tzName(first)}</small></span></li>
          <li><Mentor /><span><b>{k.instructor}</b><small>Instructor</small></span></li>
          <li><Book /><span><b>{k.days.length} days · {k.days.length * 8} hours</b><small>Live, instructor-led</small></span></li>
        </ul>
        <Link className="btn btn-primary" to={askPath(k)}>Enroll in this class <Arrow /></Link>
      </div>
    </div>
  );
}

export default function Course() {
  const { code } = useParams();
  const c = byCode[decodeURIComponent(code || '')];
  const { p } = useClassPhase();
  if (!c) return <NotFound />;
  const a = areaOf(c);
  const sched = c.code === UPCOMING_CLASS.code && p; // only while the class is still to come or running
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
          {sched && <a className="m m-sched" href="#schedule"><Clock />Next class: {UPCOMING_CLASS.dates} · {UPCOMING_CLASS.instructor}</a>}
        </div>
      </PageHead>
      <div className="wrap">
        <div className="detail">
          <div>
            {sched && <Schedule k={UPCOMING_CLASS} p={p} />}
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
              {sched && <div className="row"><dt>Next class</dt><dd>{UPCOMING_CLASS.dates}</dd></div>}
              {sched && <div className="row"><dt>Instructor</dt><dd>{UPCOMING_CLASS.instructor}</dd></div>}
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
