import { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { AREAS, COMPANY, COURSES, byCode } from '../data/catalog';
import { subjectFor } from '../lib/format';
import { PageHead } from '../components/UI';
import { Arrow, Chat, Check, Mail, Pin } from '../components/Icons';
import PhoneField from '../components/PhoneField';
import { byCountry, guessCountry } from '../data/countries';
import { validateEnquiry } from '../../lib/validate.js';

const FAQS = [
  ['How are courses delivered?', 'Courses are instructor-led and hands-on, combining expert-led sessions with practical labs and exercises. Talk to us about public, private and onsite options for your team.'],
  ['Which skill level should I choose?', 'Every course is tagged Foundation, Intermediate or Advanced, and lists prerequisites on its page. Our learning paths ladder these levels by role and technology area.'],
  ['Can you tailor a course to our environment?', 'Yes. We build product-specific playbooks around the versions, integrations and use cases you run — and can combine several courses into one program.'],
  ['How long are the courses?', 'From short one- to two-hour overviews up to five-day deep dives. Each course page shows its duration in days and hours.'],
  ['Do you offer support after training?', 'Technical mentorship is part of our approach: ongoing, one-on-one support to help learners apply new skills inside your enterprise.'],
];

const MIN_FILL_MS = 3500, TOKEN_REFRESH_MS = 60 * 60 * 1000; // the API ignores forms sent in under 3s; tokens last 2h

const EMPTY = { first: '', last: '', email: '', company: '', cc: guessCountry(), tel: '', course: '', subject: '', notes: '', website: '' };
// The API gets one phone string: "+<dialling code> <number>".
const FIELD_IDS = { first: 'f-first', last: 'f-last', email: 'f-email', phone: 'f-tel', company: 'f-co', subject: 'f-subj', notes: 'f-msg' };
const withPhone =(v) => ({ ...v, phone: v.tel.trim() ? `+${byCountry[v.cc]?.dial ?? ''} ${v.tel.trim()}` : '' });

export default function Contact() {
  const [params] = useSearchParams();
  const loc = useLocation();
  const pre = params.get('course') && byCode[params.get('course')] ? params.get('course') : '';
  const priv = params.get('type') === 'private';
  const [v, setV] = useState({ ...EMPTY, course: pre, subject: subjectFor(byCode[pre]), notes: priv ? 'We are interested in a private session for our team.' : '' });
  const [status, setStatus] = useState('idle'); // idle | sending | sent | error
  const [error, setError] = useState('');
  const [flash, setFlash] = useState(Boolean(pre));
  const formRef = useRef(null), firstRef = useRef(null), tokenRef = useRef(null);

  // Signed anti-spam token from the API; requested when the form appears so the visitor's typing time counts.
  const getToken = async () => {
    const r = await fetch('/api/enquiries', { headers: { Accept: 'application/json' } });
    const { token } = await r.json();
    tokenRef.current = { token, at: Date.now() };
  };
  useEffect(() => { getToken().catch(() => {}); }, []);

  // arriving from an "Ask for details" button: refill, scroll to the form, highlight, focus
  useEffect(() => {
    setV((s) => ({ ...s, course: pre, subject: pre ? subjectFor(byCode[pre]) : s.subject, notes: priv ? 'We are interested in a private session for our team.' : s.notes }));
    setStatus('idle');
    if (pre) {
      setFlash(true);
      const t = setTimeout(() => { formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); setTimeout(() => firstRef.current?.focus({ preventScroll: true }), 700); }, 250);
      const f = setTimeout(() => setFlash(false), 1800);
      return () => { clearTimeout(t); clearTimeout(f); };
    }
    if (loc.hash === '#faq') setTimeout(() => document.getElementById('faq')?.scrollIntoView({ behavior: 'smooth' }), 200);
  }, [pre, priv, loc.hash]);

  // A problem with one field: red outline on it and the message right below it; cleared once that field is edited.
  const [bad, setBad] = useState(null); // { field, msg }
  const clearBad = (k) => setBad((b) => (b?.field === k ? null : b));
  const showBad = (field, msg) => {
    setBad({ field, msg }); setStatus('idle');
    const el = document.getElementById(FIELD_IDS[field]);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' }); el?.focus({ preventScroll: true });
  };
  const fieldCls = (k) => `field${bad?.field === k ? ' invalid' : ''}`;
  const aria = (k) => (bad?.field === k ? { 'aria-invalid': true, 'aria-describedby': `${FIELD_IDS[k]}-err` } : {});
  const Err = ({ k }) => (bad?.field === k ? <p className="field-err" id={`${FIELD_IDS[k]}-err`}>{bad.msg}</p> : null);

  const set = (k) => (e) => { clearBad(k); setV((s) => ({ ...s, [k]: e.target.value })); };
  const onCourse = (e) => {
    const code = e.target.value;
    setV((s) => {
      const auto = !s.subject.trim() || s.subject.startsWith('I would like details and pricing for this course:');
      return { ...s, course: code, subject: auto ? subjectFor(byCode[code]) : s.subject };
    });
    setFlash(true); setTimeout(() => setFlash(false), 1600);
  };

  const mailtoFallback = () => {
    const c = byCode[v.course];
    const subject = c ? `Details and pricing request: ${c.name} (Course Code: ${c.code})` : 'Training enquiry';
    const body = `${v.subject}\n\n${v.notes ? v.notes + '\n\n' : ''}Name: ${v.first} ${v.last}\nEmail: ${v.email}\nCompany: ${v.company}\nWork telephone: ${withPhone(v).phone}\nCourse: ${c ? c.code + ' — ' + c.name : 'Not sure / custom program'}`;
    window.location.href = `mailto:${COMPANY.email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  };

  const submit = async (e) => {
    e.preventDefault();
    const check = validateEnquiry(withPhone(v)); // same checks the server runs, so mistakes show instantly
    if (!check.ok) return showBad(check.field, check.error);
    setStatus('sending'); setError(''); setBad(null);
    try {
      if (!tokenRef.current || Date.now() - tokenRef.current.at > TOKEN_REFRESH_MS) await getToken().catch(() => {});
      const wait = (tokenRef.current?.at ?? 0) + MIN_FILL_MS - Date.now();
      if (wait > 0) await new Promise((ok) => setTimeout(ok, wait));
      // Node.js backend: checks for spam, validates, saves the enquiry and emails the training team
      const r = await fetch('/api/enquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...withPhone(v), token: tokenRef.current?.token }) });
      const data = await r.json().catch(() => ({}));
      if (!r.ok && FIELD_IDS[data.field]) return showBad(data.field, data.error);
      if (!r.ok) throw new Error(data.error || 'We could not send your enquiry right now.');
      tokenRef.current = null; // tokens are single-use
      setStatus('sent');
    } catch (err) {
      setStatus('error'); setError(err.message);
    }
  };

  const c = byCode[v.course];
  return (
    <>
      <PageHead crumbs={[{ label: 'Contact' }]} title="Let’s talk training" lead="Tell us what your team needs — a single course, a private session or a full learning program — and we’ll get back to you." />
      <div className="wrap"><div className="contact">
        {status === 'sent' ? (
          <div className="form reveal in" ref={formRef} id="cform" style={{ textAlign: 'center', padding: '56px 32px' }}>
            <div style={{ width: 64, height: 64, margin: '0 auto 18px', color: 'var(--ok)' }}><Check /></div>
            <h2 style={{ fontSize: 28, marginBottom: 10 }}>Thanks, {v.first || 'there'}!</h2>
            <p className="lead" style={{ margin: '0 auto' }}>Your request{c ? <> for <b>{c.name}</b></> : ''} has been sent. Our team will reply to <b>{v.email}</b> with delivery options, availability and a quote.</p>
            <button className="btn btn-ghost" style={{ marginTop: 24 }} onClick={() => { setV({ ...EMPTY }); setStatus('idle'); getToken().catch(() => {}); }}>Send another enquiry</button>
          </div>
        ) : (
          <form className="form reveal" id="cform" ref={formRef} onSubmit={submit}>
            <div className="grid2">
              <div className={fieldCls('first')}><label htmlFor="f-first">First name</label><input id="f-first" ref={firstRef} autoComplete="given-name" required value={v.first} onChange={set('first')} {...aria('first')} /><Err k="first" /></div>
              <div className={fieldCls('last')}><label htmlFor="f-last">Last name</label><input id="f-last" autoComplete="family-name" required value={v.last} onChange={set('last')} {...aria('last')} /><Err k="last" /></div>
            </div>
            <div className={fieldCls('email')}><label htmlFor="f-email">Work email</label><input id="f-email" type="email" autoComplete="email" placeholder="name@yourcompany.com — no Gmail, Yahoo or Outlook" required value={v.email} onChange={set('email')} {...aria('email')} /><Err k="email" /></div>
            <div className="grid2">
              <div className={fieldCls('company')}><label htmlFor="f-co">Company</label><input id="f-co" autoComplete="organization" value={v.company} onChange={set('company')} {...aria('company')} /><Err k="company" /></div>
              <div className={fieldCls('phone')}><label htmlFor="f-tel">Work telephone</label>
                <PhoneField id="f-tel" country={v.cc} number={v.tel} inputProps={aria('phone')}
                  onCountry={(cc) => { clearBad('phone'); setV((s) => ({ ...s, cc })); }} onNumber={(tel) => { clearBad('phone'); setV((s) => ({ ...s, tel })); }} />
                <Err k="phone" /></div>
            </div>
            <div className="field"><label htmlFor="f-course">Course</label>
              <select id="f-course" className={flash ? 'flash' : ''} value={v.course} onChange={onCourse}>
                <option value="">Not sure yet / custom program</option>
                {Object.keys(AREAS).map((a) => (
                  <optgroup key={a} label={a}>{COURSES.filter((x) => x.area === a).map((x) => <option key={x.code} value={x.code}>{x.code} — {x.name}</option>)}</optgroup>
                ))}
              </select>
            </div>
            <div className={fieldCls('subject')}><label htmlFor="f-subj">Subject</label><textarea id="f-subj" rows={3} className={flash ? 'flash' : ''} placeholder="What would you like to know?" required value={v.subject} onChange={set('subject')} {...aria('subject')} /><Err k="subject" /></div>
            <div className={fieldCls('notes')}><label htmlFor="f-msg">Additional notes <span style={{ fontWeight: 500, color: 'var(--ink-3)' }}>(optional)</span></label><textarea id="f-msg" style={{ minHeight: 90 }} placeholder="Preferred dates, location, number of learners…" value={v.notes} onChange={set('notes')} {...aria('notes')} /><Err k="notes" /></div>
            {/* honeypot: hidden from people, bots fill it in */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" value={v.website} onChange={set('website')} style={{ position: 'absolute', left: '-9999px' }} aria-hidden="true" />
            <button className="btn btn-primary" type="submit" disabled={status === 'sending'}>
              {status === 'sending' ? 'Sending…' : v.course ? 'Request details & quote' : 'Send enquiry'} <Arrow />
            </button>
            {status === 'error' && (
              <p role="alert" style={{ fontSize: 14, color: '#c0262d', marginTop: 12 }}>
                {error} <button type="button" className="linkbtn" onClick={mailtoFallback}>Send it by email instead</button>.
              </p>
            )}
            <p style={{ fontSize: 13, color: 'var(--ink-3)', marginTop: 12 }}> By sending it you agree to our <Link to="/privacy" style={{ color: 'var(--brand)', textDecoration: 'underline' }}>Privacy &amp; Cookie Policy</Link>.</p>
          </form>
        )}
        <div className="info">
          <div className="box reveal"><i><Mail /></i><div><b>Email</b><span><a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></span></div></div>
          <div className="box reveal"><i><Pin /></i><div><b>Office</b><span>{COMPANY.address}</span></div></div>
          <div className="box reveal"><i><Chat /></i><div><b>Request a demo</b><span>See how a tailored Hazdemy program would run for your team.</span></div></div>
        </div>
      </div></div>
      <section className="alt" id="faq"><div className="wrap">
        <div className="sec-head" style={{ justifyContent: 'center', textAlign: 'center' }}><div><span className="eyebrow">FAQ</span><h2>Common questions</h2></div></div>
        <div className="faq">{FAQS.map(([q, a]) => <details key={q}><summary>{q}</summary><p>{a}</p></details>)}</div>
      </div></section>
    </>
  );
}
