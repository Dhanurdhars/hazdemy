// Enterprise (services), About and Careers pages
import { Link } from 'react-router-dom';
import { AREAS, COURSES, PRODUCTS } from '../data/catalog';
import { CTA, PageHead } from '../components/UI';
import { Arrow, Book, Check, Globe, Mentor, Spark, Target } from '../components/Icons';
import { Bars, Offerings, TrackCards } from './shared';

export function Services() {
  return (
    <>
      <PageHead crumbs={[{ label: 'Enterprise' }]} title="Enterprise training, end to end"
        lead="From tiered upskilling to mentorship and capstones, Hazdemy builds programs that move teams from learning the technology to delivering with it." />
      <section><div className="wrap"><Offerings /></div></section>
      <section className="alt"><div className="wrap split">
        <div>
          <span className="eyebrow reveal">Built for real delivery</span>
          <h2 className="reveal" style={{ fontSize: 'clamp(30px,4vw,44px)', marginTop: 12 }}>Teams learn the technology, the patterns and the discipline</h2>
          <ul className="bullets">
            {[['Role-matched tiers', 'Foundation, Intermediate and Advanced levels so every learner starts in the right place.'], ['Your versions, your scenarios', 'Product-specific playbooks aligned to the releases and integrations you run in production.'], ['Mentorship after the class', 'One-on-one support to apply new skills inside your environment and constraints.'], ['Proof of capability', 'Labs, peer reviews and capstones that produce working artifacts your team can reuse.']].map((b) => (
              <li className="reveal" key={b[0]}><Check /><div><b>{b[0]}</b><span>{b[1]}</span></div></li>
            ))}
          </ul>
        </div>
        <div className="visual reveal">
          <div className="blob" style={{ width: 300, height: 300, background: '#8e1b1e', top: -80, left: -60 }} />
          <div className="blob" style={{ width: 260, height: 260, background: '#e9a23b', bottom: -90, right: -40, animationDelay: '-4s' }} />
          <div className="vlabel">Customer satisfaction<b>98%</b></div>
          <Bars heights={[38, 52, 46, 64, 58, 76, 70, 88, 82, 98]} />
        </div>
      </div></section>
      <section><div className="wrap">
        <div className="sec-head"><div><span className="eyebrow reveal">Technology coverage</span><h2 className="reveal">Products we teach today</h2></div><Link className="btn btn-ghost reveal" to="/training">Open catalog <Arrow /></Link></div>
        <div className="cover">
          {Object.entries(AREAS).map(([k, a], i) => (
            <div className="cov reveal" key={k} style={{ '--c': a.c, transitionDelay: `${i * 60}ms` }}>
              <h4><i />{k}</h4>
              <div className="chips">{[...new Set(COURSES.filter((c) => c.area === k).map((c) => c.product))].map((p) => <Link key={p} to={`/training?q=${encodeURIComponent(p)}`}><span>{p}</span></Link>)}</div>
            </div>
          ))}
        </div>
      </div></section>
      <section className="alt"><div className="wrap">
        <div className="sec-head"><div><span className="eyebrow reveal">Role-based tracks</span><h2 className="reveal">Builders, Operators and Leaders</h2></div></div>
        <TrackCards />
      </div></section>
      <CTA title="Plan a program for your organisation" />
    </>
  );
}

export function About() {
  return (
    <>
      <PageHead crumbs={[{ label: 'About' }]} title="Empowering minds. Enabling futures."
        lead="Hazdemy is a global IT training partner helping enterprises build deep, practical skills on the IBM technology portfolio." />
      <section><div className="wrap split">
        <div>
          <span className="eyebrow reveal">Who we are</span>
          <h2 className="reveal" style={{ fontSize: 'clamp(30px,4vw,44px)', margin: '12px 0 18px' }}>A trusted, authorised partner for enterprise technology learning</h2>
          <p className="lead reveal">With more than 3,000 tailored training solutions delivered and a 98% customer satisfaction score, Hazdemy brings together 750+ expert instructors and interactive teaching methods. Our programs go beyond theory — every course is built around the work your teams actually do.</p>
          <p className="lead reveal" style={{ marginTop: 14 }}>Today our catalog spans {COURSES.length} courses across {Object.keys(AREAS).length} technology areas and {PRODUCTS.length} products, from DataStage and Cloud Pak for Data to Maximo, Guardium and IBM Z.</p>
        </div>
        <div className="visual reveal">
          <div className="blob" style={{ width: 320, height: 320, background: '#c2410c', top: -90, right: -60 }} />
          <div className="blob" style={{ width: 280, height: 280, background: '#8e1b1e', bottom: -100, left: -40, animationDelay: '-6s' }} />
          <div className="vlabel">Tailored training solutions<b>3,000+</b></div>
          <Bars heights={[30, 44, 40, 58, 66, 62, 78, 84, 92, 100]} />
        </div>
      </div></section>
      <section className="alt"><div className="wrap">
        <div className="sec-head"><div><span className="eyebrow reveal">What we believe</span><h2 className="reveal">How we teach</h2></div></div>
        <div className="values">
          {[[Target, 'Delivery over theory', 'Learning moves from fundamentals to applied delivery, so skills show up in production — not just on certificates.'], [Mentor, 'Experts in the room', 'Our instructors are practitioners who have built, run and governed these platforms in real enterprises.'], [Globe, 'Global, tailored', 'Programs shaped around your roles, product versions and timelines, delivered wherever your teams are.']].map(([Ic, t, d], i) => (
            <div className="value reveal" key={t} style={{ transitionDelay: `${i * 80}ms` }}><div className="ic"><Ic /></div><h3>{t}</h3><p>{d}</p></div>
          ))}
        </div>
      </div></section>
      <section><div className="wrap">
        <div className="stats reveal" style={{ marginTop: 0, background: 'var(--line)', borderColor: 'var(--line)' }}>
          {[[COURSES.length, '', 'Courses available'], [98, '%', 'Customer satisfaction'], [3000, '+', 'Training solutions'], [750, '+', 'Expert instructors']].map((s) => (
            <div className="stat" key={s[2]} style={{ background: 'var(--surface)' }}>
              <b data-count={s[0]} data-suffix={s[1]} style={{ background: 'linear-gradient(100deg,var(--brand),var(--brand-2))', WebkitBackgroundClip: 'text', backgroundClip: 'text' }}>0</b>
              <span style={{ color: 'var(--ink-2)' }}>{s[2]}</span>
            </div>
          ))}
        </div>
      </div></section>
      <CTA />
    </>
  );
}

export function Careers() {
  return (
    <>
      <PageHead crumbs={[{ label: 'Careers' }]} title="Teach the technology that runs the world"
        lead="Join our network of 750+ expert instructors and course authors delivering hands-on IBM training to enterprises worldwide." />
      <section><div className="wrap">
        <div className="values">
          {[[Mentor, 'Instructors', 'Lead instructor-led sessions in Data, AI, Automation, Security, Sustainability or Infrastructure.'], [Book, 'Course authors', 'Design outlines, labs and capstones for new product releases and emerging platforms.'], [Spark, 'Technical mentors', 'Coach learners one-on-one as they apply new skills inside real enterprise environments.']].map(([Ic, t, d], i) => (
            <div className="value reveal" key={t} style={{ transitionDelay: `${i * 80}ms` }}><div className="ic"><Ic /></div><h3>{t}</h3><p>{d}</p></div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 44 }} className="reveal">
          <a className="btn btn-primary" href={`mailto:training@hazdemy.com?subject=${encodeURIComponent('Careers at Hazdemy')}`}>Send us your profile <Arrow /></a>
        </div>
      </div></section>
    </>
  );
}
