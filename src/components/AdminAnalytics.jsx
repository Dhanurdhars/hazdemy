import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Reset } from './Icons';
import { byCode } from '../data/catalog';

const RANGES = [[7, 'Last 7 days'], [28, 'Last 28 days'], [90, 'Last 90 days']];
const fmt = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e4 ? `${Math.round(n / 1e3)}K` : n >= 1e3 ? `${(n / 1e3).toFixed(1)}K` : String(Math.round(n)));
const day = (iso, opts = { day: 'numeric', month: 'short' }) => new Date(`${iso}T00:00:00`).toLocaleDateString(undefined, opts);
const PAGE_NAMES = { '/': 'Home', '/training': 'Training catalog', '/paths': 'Learning paths', '/services': 'Enterprise', '/about': 'About', '/careers': 'Careers', '/contact': 'Contact', '/privacy': 'Privacy & cookies' };
// Readable page name, or '' to show the raw path
const pageName = (path) => PAGE_NAMES[path] || byCode[decodeURIComponent(path.match(/^\/course\/([^/?#]+)/)?.[1] || '').toUpperCase()]?.name || '';

/** "Website analytics" tab of /admin: Google Analytics numbers fetched by the API with a read-only service account. */
export default function AdminAnalytics({ api }) {
  const [days, setDays] = useState(28);
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (fresh) => {
    setLoading(true); setErr('');
    try { setData(await api(`/api/admin/analytics?days=${days}${fresh ? '&fresh=1' : ''}`)); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [api, days]);
  useEffect(() => { load(); }, [load]);

  if (data && !data.configured) return <Setup />;

  const k = data?.kpis;
  return (
    <div className="ga">
      <div className="ga-filters">
        <div className="seg" role="group" aria-label="Date range">
          {RANGES.map(([d, label]) => <button key={d} className={d === days ? 'on' : ''} aria-pressed={d === days} onClick={() => setDays(d)}>{label}</button>)}
        </div>
        <button className="btn btn-ghost sm" onClick={() => load(true)}><Reset /> Refresh</button>
        {data && <span className="ga-meta">{day(data.start)} – {day(data.end)} · updated {new Date(data.generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
      </div>
      {err && <p role="alert" className="ga-err">{err}</p>}
      {!data && loading && <p>Loading analytics…</p>}
      {data && (
        <div className={loading ? 'ga-body ga-busy' : 'ga-body'} aria-busy={loading}>
          <div className="ga-tiles">
            <Tile label="Visitors" v={k.users} />
            <Tile label="Sessions" v={k.sessions} />
            <Tile label="Page views" v={k.pageViews} />
            <Tile label="Enquiries sent" v={k.leads} />
            <Tile label="Engaged sessions" v={k.engagementRate} pct />
          </div>
          <section className="ga-card">
            <h3>Visitors per day</h3>
            <Trend daily={data.daily} />
          </section>
          <div className="ga-grid">
            <Ranked title="Top pages" unit="views" rows={data.pages.map((p) => ({ name: pageName(p.path) || p.path, sub: pageName(p.path) ? p.path : '', value: p.views }))} />
            <Ranked title="Most viewed courses" unit="views" empty="No course pages viewed yet." rows={data.courses.map((c) => ({ name: c.name || c.code, sub: c.name ? c.code : '', value: c.views }))} />
            <Ranked title="How visitors found us" unit="sessions" rows={data.channels.map((c) => ({ name: c.name, value: c.sessions }))} />
            <Ranked title="Countries" unit="visitors" rows={data.countries.map((c) => ({ name: c.name, value: c.users }))} />
            <Ranked title="Devices" unit="visitors" rows={data.devices.map((c) => ({ name: c.name[0].toUpperCase() + c.name.slice(1), value: c.users }))} />
          </div>
          <p className="ga-note">Counts only visitors who allowed analytics cookies, so real traffic is higher. Google Analytics can take up to a day to finish processing recent visits. Full reports: <a href="https://analytics.google.com" target="_blank" rel="noreferrer">analytics.google.com</a>.</p>
        </div>
      )}
    </div>
  );
}

function Tile({ label, v, pct }) {
  const show = (n) => (pct ? `${Math.round(n * 100)}%` : fmt(n));
  const diff = v.now - v.prev;
  const change = !v.prev ? null : pct ? Math.round(diff * 100) : Math.round((diff / v.prev) * 100);
  return (
    <div className="ga-tile">
      <span>{label}</span>
      <b>{show(v.now)}</b>
      <small className={change > 0 ? 'up' : change < 0 ? 'down' : ''}>
        {change === null ? 'No earlier data' : `${change > 0 ? '▲' : change < 0 ? '▼' : '–'} ${Math.abs(change)}${pct ? ' pts' : '%'} vs previous period`}
      </small>
    </div>
  );
}

/** Top-N list: the label, a thin magnitude bar, and the value at the bar's tip. */
function Ranked({ title, unit, rows, empty = 'No data yet.' }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className="ga-card">
      <h3>{title}</h3>
      {!rows.length ? <p className="ga-empty">{empty}</p> : (
        <ol className="ga-rank">
          {rows.map((r) => (
            <li key={r.name + r.sub} title={`${r.name}: ${r.value.toLocaleString()} ${unit}`}>
              <div className="nm"><span>{r.name}</span>{r.sub && <small>{r.sub}</small>}</div>
              <div className="bar"><i style={{ width: `${(r.value / max) * 100}%` }} /><b>{r.value.toLocaleString()}</b></div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

/** Daily visitors as a 2px line over a light wash, with a crosshair tooltip (hover or arrow keys) and a table view. */
function Trend({ daily }) {
  const box = useRef(null);
  const [w, setW] = useState(640);
  const [at, setAt] = useState(null);
  useLayoutEffect(() => {
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, e.contentRect.width)));
    ro.observe(box.current); return () => ro.disconnect();
  }, []);

  const H = 220, pad = { l: 40, r: 12, t: 12, b: 26 };
  const top = niceMax(Math.max(...daily.map((d) => d.users)));
  const x = (i) => pad.l + (daily.length < 2 ? 0 : (i / (daily.length - 1)) * (w - pad.l - pad.r));
  const y = (v) => pad.t + (1 - v / top) * (H - pad.t - pad.b);
  const line = daily.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d.users).toFixed(1)}`).join('');
  const area = `${line}L${x(daily.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * top);
  const labelAt = [0, Math.floor((daily.length - 1) / 2), daily.length - 1];

  const pick = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const i = Math.round(((e.clientX - r.left - pad.l) / (w - pad.l - pad.r)) * (daily.length - 1));
    setAt(Math.min(daily.length - 1, Math.max(0, i)));
  };
  const key = (e) => {
    if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
    e.preventDefault(); setAt((i) => Math.min(daily.length - 1, Math.max(0, (i ?? daily.length - 1) + (e.key === 'ArrowRight' ? 1 : -1))));
  };
  const d = at === null ? null : daily[at];
  const last = daily[daily.length - 1];

  return (
    <>
      <div className="ga-trend" ref={box}>
        <svg width={w} height={H} role="img" tabIndex={0} aria-label="Visitors per day. Use the left and right arrow keys to read each day."
          onPointerMove={pick} onPointerLeave={() => setAt(null)} onKeyDown={key} onBlur={() => setAt(null)}>
          {ticks.map((t) => <g key={t}><line className="grid" x1={pad.l} x2={w - pad.r} y1={y(t)} y2={y(t)} /><text className="tick" x={pad.l - 8} y={y(t) + 4} textAnchor="end">{fmt(t)}</text></g>)}
          {labelAt.map((i) => <text key={i} className="tick" x={x(i)} y={H - 6} textAnchor={i === 0 ? 'start' : i === daily.length - 1 ? 'end' : 'middle'}>{day(daily[i].date)}</text>)}
          <path className="wash" d={area} />
          <path className="ln" d={line} />
          {at === null && <><circle className="dot" cx={x(daily.length - 1)} cy={y(last.users)} r="4" /><text className="end" x={x(daily.length - 1) - 8} y={y(last.users) - 10} textAnchor="end">{last.users.toLocaleString()}</text></>}
          {d && <><line className="cross" x1={x(at)} x2={x(at)} y1={pad.t} y2={H - pad.b} /><circle className="dot" cx={x(at)} cy={y(d.users)} r="4" /></>}
        </svg>
        {d && (
          <div className="ga-tip" style={{ left: Math.min(Math.max(x(at), 90), w - 90) }}>
            <span>{day(d.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
            <p><i className="k" /><b>{d.users.toLocaleString()}</b> visitors</p>
            <p><b>{d.views.toLocaleString()}</b> page views</p>
            <p><b>{d.leads.toLocaleString()}</b> enquiries</p>
          </div>
        )}
      </div>
      <details className="ga-table">
        <summary>Show as table</summary>
        <div className="tscroll"><table>
          <thead><tr><th>Date</th><th>Visitors</th><th>Page views</th><th>Enquiries</th></tr></thead>
          <tbody>{[...daily].reverse().map((r) => <tr key={r.date}><td>{day(r.date, { weekday: 'short', day: 'numeric', month: 'short' })}</td><td>{r.users}</td><td>{r.views}</td><td>{r.leads}</td></tr>)}</tbody>
        </table></div>
      </details>
    </>
  );
}

const niceMax = (v) => {
  if (v <= 4) return 4;
  const p = 10 ** Math.floor(Math.log10(v)), n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
};

function Setup() {
  return (
    <div className="ga-card ga-setup">
      <h3>Connect Google Analytics</h3>
      <p>Visitor numbers are collected (Measurement ID <code>G-PP70XTSPMM</code>), but this page needs read access to show them. One-time setup, about 5 minutes:</p>
      <ol>
        <li>In <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer">Google Cloud Console</a>, create or pick a project and enable the <b>Google Analytics Data API</b>.</li>
        <li>Under <b>IAM &amp; Admin → Service accounts</b>, create a service account (no roles needed), then <b>Keys → Add key → JSON</b>. A key file downloads.</li>
        <li>In Google Analytics, open <b>Admin → Property access management</b> and add the service account’s email (ending in <code>iam.gserviceaccount.com</code>) as a <b>Viewer</b>.</li>
        <li>Copy the <b>Property ID</b> (a number) from <b>Admin → Property details</b>.</li>
        <li>In Vercel → Settings → Environment Variables, add <code>GA_PROPERTY_ID</code> (that number) and <code>GA_SERVICE_ACCOUNT_JSON</code> (paste the whole key file), then redeploy.</li>
      </ol>
    </div>
  );
}
