import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { COMPANY } from '../data/catalog';
import { Logo } from './UI';
import { Menu, Moon, Up } from './Icons';
import ChatBot from '../bot/ChatBot';
import CookieConsent from './CookieConsent';
import { openCookieSettings } from '../lib/consent';
import { bindTilt, observeReveals } from '../lib/effects';
import { updateHead } from '../lib/head';

const NAV = [['/', 'Home'], ['/training', 'Training'], ['/paths', 'Learning Paths'], ['/services', 'Enterprise'], ['/about', 'About'], ['/contact', 'Contact']];

function useTheme() {
  useEffect(() => {
    try { const t = localStorage.getItem('hz-theme'); if (t) document.documentElement.dataset.theme = t; } catch { /* storage blocked */ }
  }, []);
  return () => {
    const r = document.documentElement;
    const cur = r.dataset.theme || (matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    r.dataset.theme = cur === 'dark' ? 'light' : 'dark';
    try { localStorage.setItem('hz-theme', r.dataset.theme); } catch { /* ignore */ }
  };
}

export default function Layout() {
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);
  const toggleTheme = useTheme();

  useEffect(() => { bindTilt(); }, []);
  useEffect(() => { updateHead(loc.pathname); }, [loc.pathname]); // title, description, canonical, link-preview tags
  useEffect(() => {
    setOpen(false);
    if (!loc.search.includes('course=')) window.scrollTo({ top: 0, behavior: 'instant' });
    const t = setTimeout(observeReveals, 30);
    return () => clearTimeout(t);
  }, [loc.pathname, loc.search]);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY, max = document.documentElement.scrollHeight - innerHeight;
      setSolid(y > 40); setProgress(max > 0 ? (y / max) * 100 : 0); setShowTop(y > 700);
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    return () => removeEventListener('scroll', onScroll);
  }, []);

  return (
    <>
      <div className="progress" style={{ width: progress + '%' }} />
      <header className={`hdr ${loc.pathname === '/' ? 'on-light' : 'on-dark'} ${solid ? 'solid' : ''}`}>
        <div className="wrap">
          <Logo />
          <nav className={`nav ${open ? 'open' : ''}`}>
            {NAV.map(([to, label]) => (
              <NavLink key={to} to={to} end={to === '/'}
                className={({ isActive }) => (isActive || (to === '/training' && loc.pathname.startsWith('/course')) ? 'active' : '')}>
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="hdr-cta">
            <button className="icon-btn" onClick={toggleTheme} aria-label="Toggle theme"><Moon /></button>
            <Link to="/contact" className="btn btn-primary">Request training</Link>
            <button className="icon-btn burger" onClick={() => setOpen((o) => !o)} aria-label="Menu"><Menu /></button>
          </div>
        </div>
      </header>

      <main id="app"><div className="page" key={loc.pathname}><Outlet /></div></main>

      <footer className="ftr">
        <div className="wrap">
          <div className="ftr-grid">
            <div>
              <Logo />
              <p>Your global IT training partner — 98% customer satisfaction, 750+ expert instructors and hands-on, interactive teaching that turns learning into delivery.</p>
            </div>
            <div><h5>Explore</h5><ul><li><Link to="/">Home</Link></li><li><Link to="/training">Training catalog</Link></li><li><Link to="/paths">Learning paths</Link></li><li><Link to="/services">Enterprise training</Link></li></ul></div>
            <div><h5>Company</h5><ul><li><Link to="/about">About</Link></li><li><Link to="/careers">Careers</Link></li><li><Link to="/contact">Contact</Link></li><li><Link to="/contact#faq">FAQ</Link></li><li><Link to="/privacy">Privacy &amp; Cookie Policy</Link></li></ul></div>
            <div><h5>Get in touch</h5><ul><li>{COMPANY.address}</li><li><a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></li></ul></div>
          </div>
          <div className="ftr-bot"><span>All Rights Reserved © {new Date().getFullYear()} Hazdemy · <Link to="/privacy">Privacy &amp; Cookie Policy</Link> · <button className="linkbtn ftr-cookie" onClick={openCookieSettings}>Cookie settings</button></span><span>Empowering Minds. Enabling Futures.</span></div>
        </div>
      </footer>

      <button className={`totop ${showTop ? 'show' : ''}`} onClick={() => scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top"><Up /></button>
      {loc.pathname !== '/admin' && <ChatBot />}
      <CookieConsent />
    </>
  );
}