import { Link } from 'react-router-dom';
import { COURSES, TRACKS } from '../data/catalog';
import { Flask, Layers, Mentor, Play } from '../components/Icons';

export const OFFERINGS = [
  ['Tiered upskilling', 'Structured learning from foundations to advanced, matched to each learner’s role and maturity — Foundation, Intermediate and Advanced levels.', Layers],
  ['Product-specific playbooks', 'Hands-on instruction for IBM architecture patterns, integrations and specialised toolkits — on the versions you actually run.', Play],
  ['Technical mentorship', 'Ongoing support and one-on-one mentoring for applying training to your enterprise environment and delivery constraints.', Mentor],
  ['Labs, reviews & capstones', 'Hands-on exercises, peer reviews and capstone projects that leave learners with working artifacts, not just slides.', Flask],
];

export const Offerings = () => (
  <div className="offer-grid">
    {OFFERINGS.map(([t, d, Ic], i) => (
      <div className="offer reveal" key={t} style={{ transitionDelay: `${i * 80}ms` }}>
        <span className="num">0{i + 1}</span><h3>{t}</h3><p>{d}</p><div className="ic"><Ic /></div>
      </div>
    ))}
  </div>
);

export const TrackCards = () => (
  <div className="tracks">
    {Object.entries(TRACKS).map(([k, t], i) => (
      <Link key={k} className={`track ${t.cls} reveal`} style={{ transitionDelay: `${i * 90}ms` }} to={`/paths?t=${k}`}>
        <span className="k">{t.k}</span><h3>{t.name}</h3><p>{t.d}</p>
        <div className="tf"><span>Explore track →</span><span><b>{COURSES.filter((c) => c.tracks.includes(k)).length}</b> courses</span></div>
      </Link>
    ))}
  </div>
);

export const Bars = ({ heights }) => (
  <div className="bars">{heights.map((h, i) => <i key={i} style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }} />)}</div>
);
