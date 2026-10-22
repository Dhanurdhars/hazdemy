import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createEngine } from './engine';
import { COURSES } from '../data/catalog';
import { esc } from '../lib/format';
import { ChatDots, Close, Minus, Mic, Reset, Arrow } from '../components/Icons';

const STORE = 'haz-chat-v1';
const reduceMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function ChatBot() {
  const navigate = useNavigate();
  const loc = useLocation();
  const [open, setOpen] = useState(false);
  const [teaser, setTeaser] = useState(false);
  const [msgs, setMsgs] = useState(() => { try { return JSON.parse(sessionStorage.getItem(STORE)) || []; } catch { return []; } });
  const [typing, setTyping] = useState(false);
  const [text, setText] = useState('');
  const [rec, setRec] = useState(null);
  const logRef = useRef(null), inputRef = useRef(null), queue = useRef(Promise.resolve()), idRef = useRef(Date.now());

  const push = useCallback((m) => setMsgs((list) => [...list.map((x) => ({ ...x, chips: x.who === 'me' ? x.chips : undefined })), { id: idRef.current++, ...m }]), []);

  // say(): queue a bot message with a short typing delay, like a real conversation
  const say = useCallback((html, chips, cls = '') => {
    queue.current = queue.current.then(() => new Promise((res) => {
      setTyping(true);
      const ms = reduceMotion() ? 40 : Math.min(1100, 350 + html.replace(/<[^>]+>/g, '').length * 4);
      setTimeout(() => { setTyping(false); push({ who: 'bot', html, chips, cls }); res(); }, ms);
    }));
    return queue.current;
  }, [push]);

  const engine = useMemo(() => createEngine({ say, navigate: (p) => navigate(p) }), [say, navigate]);

  const send = useCallback((v) => {
    const q = v.trim(); if (!q) return;
    push({ who: 'me', html: esc(q) });
    engine.reply(q);
  }, [engine, push]);

  // persist the conversation for the session
  useEffect(() => {
    try { sessionStorage.setItem(STORE, JSON.stringify(msgs.slice(-60))); } catch { /* ignore */ }
    logRef.current && (logRef.current.scrollTop = logRef.current.scrollHeight);
  }, [msgs]);
  useEffect(() => { logRef.current && (logRef.current.scrollTop = logRef.current.scrollHeight); }, [typing]);

  const toggle = (v) => {
    setOpen(v); setTeaser(false);
    try { sessionStorage.setItem('haz-seen', 1); } catch { /* ignore */ }
    if (v) { if (!msgs.length) engine.greet(loc.pathname); setTimeout(() => inputRef.current?.focus(), 300); }
  };
  useEffect(() => { document.body.classList.toggle('bot-open', open); }, [open]);
  useEffect(() => {
    let seen = false; try { seen = !!sessionStorage.getItem('haz-seen'); } catch { /* ignore */ }
    if (seen) return;
    const t = setTimeout(() => setTeaser(true), 5000);
    return () => clearTimeout(t);
  }, []);
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') setOpen(false); };
    addEventListener('keydown', k); return () => removeEventListener('keydown', k);
  }, []);

  // clicks inside bot HTML: in-app links, "Details" buttons
  const onLogClick = (e) => {
    const a = e.target.closest('a[data-link]');
    if (a) { e.preventDefault(); navigate(a.getAttribute('href')); if (matchMedia('(max-width:520px)').matches) setOpen(false); return; }
    const info = e.target.closest('[data-act="info"]');
    if (info) send('Details on ' + info.dataset.code);
  };

  const reset = () => { setMsgs([]); Object.assign(engine.state, { ctx: null, last: [], flow: null }); setTimeout(() => engine.greet(loc.pathname), 50); };

  const SR = typeof window !== 'undefined' && (window.SpeechRecognition || window.webkitSpeechRecognition);
  const listen = () => {
    if (rec) { rec.stop(); return; }
    const r = new SR(); r.lang = 'en-US'; r.interimResults = true;
    r.onresult = (ev) => {
      const t = [...ev.results].map((x) => x[0].transcript).join(''); setText(t);
      if (ev.results[ev.results.length - 1].isFinal) { setText(''); send(t); }
    };
    r.onend = r.onerror = () => setRec(null);
    r.start(); setRec(r);
  };

  return (
    <>
      <div className={`bot-teaser ${teaser && !open ? 'show' : ''}`} role="button" tabIndex={0} onClick={() => toggle(true)}>
        <b>Need help choosing a course?</b>Ask Haz — I'll match you in seconds.
      </div>
      <button className="bot-fab" onClick={() => toggle(!open)} aria-label="Open course advisor chat" aria-expanded={open}>
        <ChatDots className="ic-chat" /><Close className="ic-close" /><span className="dot" />
      </button>
      <section className="bot" role="dialog" aria-label="Hazdemy course advisor">
        <div className="bot-head">
          <div className="bot-av"><img src="/logo-icon.png" alt="" /></div>
          <div><h4>Haz · Course Advisor</h4><p>Hazdemy Learning · replies instantly</p></div>
          <div className="hb">
            <button onClick={reset} title="Start over" aria-label="Start over"><Reset /></button>
            <button onClick={() => setOpen(false)} title="Close" aria-label="Close chat"><Minus /></button>
          </div>
        </div>
        <div className="bot-log" ref={logRef} aria-live="polite" onClick={onLogClick}>
          {msgs.map((m, i) => (
            <div key={m.id} style={{ display: 'contents' }}>
              <div className={`msg ${m.who === 'me' ? 'me' : 'bot-m'} ${m.cls || ''}`} dangerouslySetInnerHTML={{ __html: m.html }} />
              {m.chips && i === msgs.length - 1 && !typing && (
                <div className="qr">{m.chips.map((c) => <button key={c} onClick={() => send(c)}>{c}</button>)}</div>
              )}
            </div>
          ))}
          {typing && <div className="msg bot-m typing"><i /><i /><i /></div>}
        </div>
        <form className="bot-in" onSubmit={(e) => { e.preventDefault(); const v = text; setText(''); send(v); }}>
          <input ref={inputRef} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask about courses, prices, paths…" autoComplete="off" aria-label="Message" />
          {SR && <button type="button" className={`mic ${rec ? 'rec' : ''}`} onClick={listen} aria-label="Speak"><Mic /></button>}
          <button className="send" aria-label="Send"><Arrow /></button>
        </form>
        <div className="bot-foot">Haz searches the live Hazdemy catalog · {COURSES.length} courses</div>
      </section>
    </>
  );
}
