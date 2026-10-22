import { Link } from 'react-router-dom';
import { LEVELS, areaOf } from '../data/catalog';
import { dur, askPath, coursePath } from '../lib/format';
import { Arrow, Chat, Clock } from './Icons';

export const LevelBars = ({ level }) => {
  const n = LEVELS.indexOf(level) + 1;
  return (
    <span className="lvl" aria-hidden="true">
      {[1, 2, 3].map((i) => <i key={i} className={i <= n ? 'on' : ''} />)}
    </span>
  );
};

export const Soon = ({ course }) => (course.status === 'coming' ? <span className="soon">Coming soon</span> : null);

export const AskButton = ({ course, small }) => (
  <Link className={`ask ${small ? 'sm' : ''}`} to={askPath(course)}>
    <Chat />Ask for details
  </Link>
);

export function CourseCard({ course: c, index = 0 }) {
  const a = areaOf(c);
  return (
    <div className="card" style={{ '--c': a.c, animationDelay: `${Math.min(index, 12) * 45}ms` }}>
      <Link className="card-link" to={coursePath(c)} aria-label={c.name} />
      <div className="card-top"><span style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}><span className="tag">{c.area}</span><Soon course={c} /></span><span className="code">{c.code}</span></div>
      <h3>{c.name}</h3>
      <div className="prod">{c.product}</div>
      <p>{c.desc}</p>
      <div className="card-foot">
        <span><Clock />{dur(c.days)}</span>
        <span><LevelBars level={c.level} />{c.level}</span>
      </div>
      <div className="card-actions">
        <AskButton course={c} />
        <span className="go">View <Arrow style={{ width: 15, height: 15 }} /></span>
      </div>
    </div>
  );
}

export function PageHead({ crumbs = [], title, lead, children }) {
  return (
    <header className="phead">
      <div className="blob b1" /><div className="blob b2" /><div className="blob b3" /><div className="grid-bg" />
      <div className="wrap">
        <div className="crumbs">
          <Link to="/">Home</Link>
          {crumbs.map((c, i) => (
            <span key={i} style={{ display: 'contents' }}>
              <span>/</span>{c.to ? <Link to={c.to}>{c.label}</Link> : <span>{c.label}</span>}
            </span>
          ))}
        </div>
        <h1>{title}</h1>
        {lead && <p className="lead">{lead}</p>}
        {children}
      </div>
    </header>
  );
}

export function CTA({
  title = 'Launch yourself into the future',
  text = "Ready to innovate, grow, and lead? Tell us about your team and we'll shape a program around it.",
}) {
  return (
    <section>
      <div className="wrap">
        <div className="cta reveal">
          <div className="blob" style={{ width: 380, height: 380, background: '#8e1b1e', top: -160, left: -80 }} />
          <div className="blob" style={{ width: 320, height: 320, background: '#e9a23b', bottom: -160, right: -40, animationDelay: '-5s' }} />
          <span className="eyebrow" style={{ color: 'var(--brand-2)' }}>Let's build your team's skills</span>
          <h2 style={{ marginTop: 14 }}>{title}</h2>
          <p>{text}</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link to="/contact" className="btn btn-primary">Contact us <Arrow /></Link>
            <Link to="/training" className="btn btn-light">Browse all courses</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export const Logo = (props) => (
  <Link to="/" className="logo" aria-label="Hazdemy home" {...props}>
    <span className="hmark" aria-hidden="true">H</span><span className="wm">azdemy</span>
  </Link>
);
