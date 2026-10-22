import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AREAS, COURSES, PRODUCTS, byCode, count } from '../data/catalog';
import { AreaIcon, Arrow } from '../components/Icons';
import { CourseCard, CTA } from '../components/UI';
import { initGlobe } from '../components/globeScene';
import { Offerings, TrackCards } from './shared';

const ROTATE = ['Data', 'AI', 'Automation', 'Security', 'Sustainability', 'Infrastructure'];

function GlobeScene() {
  const ref = useRef(null);
  useEffect(() => initGlobe(ref.current), []);
  return (
    <div className="globe reveal" ref={ref} aria-hidden="true">
      <canvas /><div className="glabels" />
    </div>
  );
}

export default function Home() {
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const featured = ['HAZ-AT-008', 'HAZ-DA-0048', 'HAZ-DA-0049'].map((k) => byCode[k]).filter(Boolean);
  const feat = [...featured, ...COURSES.filter((c) => c.level === 'Advanced' && !featured.includes(c))].slice(0, 6);

  return (
    <>
      <section className="hero light">
        <div className="blob b1" /><div className="blob b2" /><div className="blob b3" /><div className="grid-bg" />
        <div className="wrap">
          <div className="hero-grid">
            <div>
              <span className="pill reveal"><b>New</b> watsonx.ai &amp; watsonx.data administration courses</span>
              <h1 className="reveal"><span className="ln">Empowering minds.</span><span className="ln">Enabling futures.</span></h1>
              <p className="sub reveal">Hands-on training in <span className="rotator">{ROTATE.map((w) => <span key={w} className="grad">{w}</span>)}</span></p>
              <p className="lead reveal">Training designed around real delivery. Hazdemy takes your teams from fundamentals to applied, production-ready skills across the IBM technology portfolio — with labs, mentorship and capstones that produce working results.</p>
              <form className="hero-search reveal" onSubmit={(e) => { e.preventDefault(); nav(`/training?q=${encodeURIComponent(q)}`); }}>
                <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Search ${COURSES.length} courses — e.g. DataStage, Maximo, Guardium`} aria-label="Search courses" />
                <button className="btn btn-primary" type="submit">Search</button>
              </form>
              <div className="hero-tags reveal">Popular: {['DataStage', 'Cloud Pak for Data', 'Maximo', 'Cognos', 'Guardium'].map((t) => <Link key={t} to={`/training?q=${encodeURIComponent(t)}`}>{t}</Link>)}</div>
            </div>
            <GlobeScene />
          </div>
          <div className="stats reveal">
            <div className="stat"><b data-count={COURSES.length}>0</b><span>Instructor-led courses</span></div>
            <div className="stat"><b data-count="98" data-suffix="%">0</b><span>Customer satisfaction</span></div>
            <div className="stat"><b data-count="3000" data-suffix="+">0</b><span>Tailored training solutions</span></div>
            <div className="stat"><b data-count="750" data-suffix="+">0</b><span>Expert instructors</span></div>
          </div>
        </div>
      </section>

      <div className="marquee" aria-hidden="true"><div className="marquee-track">{[...PRODUCTS, ...PRODUCTS].map((p, i) => <span key={i}>{p}</span>)}</div></div>

      <section><div className="wrap">
        <div className="sec-head"><div><span className="eyebrow reveal">Course categories</span><h2 className="reveal">Explore by technology area</h2></div><Link to="/training" className="btn btn-ghost reveal">All courses <Arrow /></Link></div>
        <div className="areas">
          {Object.entries(AREAS).map(([k, a], i) => (
            <Link key={k} className="area reveal" style={{ '--c': a.c, transitionDelay: `${i * 70}ms` }} to={`/training?area=${encodeURIComponent(k)}`}>
              <div className="ic"><AreaIcon area={k} /></div><h3>{k}</h3><p>{a.d}</p>
              <div className="meta"><span>{count('area', k)} course{count('area', k) > 1 ? 's' : ''}</span><span className="arrow"><Arrow /></span></div>
            </Link>
          ))}
        </div>
      </div></section>

      <section className="alt"><div className="wrap">
        <div className="sec-head"><div><span className="eyebrow reveal">Why Hazdemy training</span><h2 className="reveal">Training designed around real delivery</h2></div><p className="lead reveal" style={{ maxWidth: '46ch' }}>Learning moves from fundamentals to applied delivery. Teams learn the technology, the architecture patterns and the operating discipline needed to ship safely.</p></div>
        <Offerings />
      </div></section>

      <section><div className="wrap">
        <div className="sec-head"><div><span className="eyebrow reveal">Our top IT training courses</span><h2 className="reveal">Featured courses</h2></div><Link to="/training" className="btn btn-ghost reveal">Explore all training <Arrow /></Link></div>
        <div className="cards">{feat.map((c, i) => <CourseCard key={c.code} course={c} index={i} />)}</div>
      </div></section>

      <section className="alt"><div className="wrap">
        <div className="sec-head"><div><span className="eyebrow reveal">Role-based tracks</span><h2 className="reveal">Learning built for every role</h2></div><Link to="/paths" className="btn btn-ghost reveal">See learning paths <Arrow /></Link></div>
        <TrackCards />
      </div></section>

      <section><div className="wrap">
        <div className="sec-head"><div><span className="eyebrow reveal">How it works</span><h2 className="reveal">From fundamentals to working results</h2></div></div>
        <div className="steps reveal">
          {[['Assess', 'We map your team’s roles and maturity to the right tier of courses.'], ['Learn', 'Instructor-led sessions on the exact product versions you run.'], ['Practise', 'Hands-on labs, peer reviews and exercises on real scenarios.'], ['Deliver', 'Capstones and mentorship that carry skills into your environment.']].map((s, i) => (
            <div className="step" key={s[0]}><div className="dot">{i + 1}</div><h4>{s[0]}</h4><p>{s[1]}</p></div>
          ))}
        </div>
      </div></section>
      <CTA />
    </>
  );
}

