import { useCallback, useEffect, useMemo, useState } from 'react';
import { PageHead } from '../components/UI';
import { Download, Key, Reset, Search } from '../components/Icons';
import { toast } from '../lib/toast';
import AdminAnalytics from '../components/AdminAnalytics';

const STATUSES = ['new', 'contacted', 'quoted', 'won', 'closed'];
const TOKEN_KEY = 'hz-admin-token';

function useToken() {
  const [token, setToken] = useState(() => { try { return sessionStorage.getItem(TOKEN_KEY) || ''; } catch { return ''; } });
  const save = (t) => { setToken(t); try { t ? sessionStorage.setItem(TOKEN_KEY, t) : sessionStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ } };
  return [token, save];
}

export default function Admin() {
  const [token, setToken] = useToken();
  const [input, setInput] = useState('');
  const [rows, setRows] = useState([]);
  const [stats, setStats] = useState(null);
  const [sys, setSys] = useState(null);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [filter, setFilter] = useState('');
  const [importing, setImporting] = useState(false);
  const [tab, setTab] = useState(() => (window.location.hash === '#analytics' ? 'analytics' : 'enquiries'));
  const showTab = (t) => { setTab(t); window.history.replaceState(null, '', t === 'analytics' ? '#analytics' : window.location.pathname); };

  const api = useCallback(async (path, opts = {}) => {
    const r = await fetch(path, { ...opts, headers: { ...(opts.headers || {}), Authorization: `Bearer ${token}` } });
    if (r.status === 401) { setToken(''); throw new Error('Wrong admin password.'); }
    const isJson = (r.headers.get('content-type') || '').includes('json');
    const data = isJson ? await r.json() : await r.blob();
    if (!r.ok) throw new Error((isJson && data.error) || `Request failed (${r.status})`);
    return data;
  }, [token]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true); setErr('');
    try { const d = await api('/api/admin/enquiries'); setRows(d.enquiries); setStats(d.stats); setSys(d.system); }
    catch (e) { setErr(e.message); }
    finally { setLoading(false); }
  }, [api, token]);
  useEffect(() => { load(); }, [load]);

  const setStatus = async (id, status) => {
    setRows((r) => r.map((x) => (x.id === id ? { ...x, status } : x)));
    try { await api(`/api/admin/enquiries?id=${encodeURIComponent(id)}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) }); toast('Status updated'); }
    catch (e) { setErr(e.message); load(); }
  };

  const exportCSV = async () => {
    try {
      const blob = await api('/api/admin/enquiries?format=csv');
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `hazdemy-enquiries-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
    } catch (e) { setErr(e.message); }
  };

  const importSheet = async (file) => {
    if (!file) return;
    setImporting(true); setErr('');
    try {
      const d = await api('/api/admin/import', { method: 'POST', headers: { 'Content-Type': 'application/octet-stream', 'X-File-Name': file.name }, body: file });
      toast(`Imported ${d.total} courses (${d.available} available, ${d.coming} coming soon)`);
      setTimeout(() => window.location.reload(), 1200);
    } catch (e) { setErr(e.message); }
    finally { setImporting(false); }
  };

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return rows.filter((r) => (!filter || r.status === filter) && (!s || [r.first, r.last, r.email, r.company, r.courseCode, r.courseName, r.subject, r.notes].join(' ').toLowerCase().includes(s)));
  }, [rows, q, filter]);

  if (!token) {
    return (
      <>
        <PageHead crumbs={[{ label: 'Admin' }]} title="Admin" lead="Enquiries and course catalogue management." />
        <div className="wrap" style={{ paddingTop: 56, paddingBottom: 96, maxWidth: 520 }}>
          <form className="form" onSubmit={(e) => { e.preventDefault(); setToken(input.trim()); }}>
            <div className="field"><label htmlFor="adm">Admin password</label><input id="adm" type="password" autoComplete="current-password" value={input} onChange={(e) => setInput(e.target.value)} required /></div>
            <button className="btn btn-primary" type="submit"><Key /> Sign in</button>
            {err && <p role="alert" style={{ color: '#c0262d', marginTop: 12 }}>{err}</p>}
          </form>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHead crumbs={[{ label: 'Admin' }]} title={tab === 'analytics' ? 'Website analytics' : 'Enquiries'}
        lead={tab === 'analytics' ? 'Visitors, pages, courses and enquiries from Google Analytics.' : 'Every “Ask for details” and contact-form request, newest first.'} />
      <div className="wrap wide" style={{ paddingTop: 40, paddingBottom: 96 }}>
        <div className="adm-head">
          <div className="tabs" role="tablist" aria-label="Admin sections">
            {[['enquiries', 'Enquiries'], ['analytics', 'Website analytics']].map(([k, label]) => (
              <button key={k} role="tab" aria-selected={tab === k} className={tab === k ? 'on' : ''} onClick={() => showTab(k)}>{label}</button>
            ))}
          </div>
          <button className="btn btn-ghost sm" onClick={() => setToken('')}>Sign out</button>
        </div>
        {tab === 'analytics' ? <AdminAnalytics api={api} /> : (<>
        {sys && (sys.storage !== 'redis' || !sys.mail) && (
          <div className="adm-warn">
            {sys.storage !== 'redis' && <p><b>Storage not connected.</b> Enquiries are only kept temporarily. In Vercel open <b>Storage → Create Database → Upstash Redis</b>, connect it to this project, then redeploy.</p>}
            {!sys.mail && <p><b>Email not set up.</b> Enquiries are saved here but not emailed. Add the <code>SMTP_*</code> settings in Vercel → Settings → Environment Variables to receive them by email.</p>}
          </div>
        )}
        {stats && (
          <div className="adm-stats">
            {[['Total', stats.total], ['New', stats.byStatus.new || 0], ['Last 7 days', stats.last7], ['Courses in catalogue', stats.courses]].map(([k, v]) => (
              <div key={k}><b>{v}</b><span>{k}</span></div>
            ))}
          </div>
        )}
        <div className="toolbar" style={{ marginTop: 24 }}>
          <label className="search" style={{ flex: '1 1 320px', maxWidth: 480 }}><Search /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, email, company, course…" /></label>
          <div className="tools">
            <select className="sel" value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter by status">
              <option value="">All statuses</option>{STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button className="btn btn-ghost sm" onClick={load}><Reset /> Refresh</button>
            <button className="btn btn-ghost sm" onClick={exportCSV}><Download /> Export CSV</button>
            <label className="btn btn-ghost sm" style={{ cursor: 'pointer' }}>
              {importing ? 'Importing…' : 'Upload course sheet (.xlsx)'}
              <input type="file" accept=".xlsx,.xls" hidden onChange={(e) => importSheet(e.target.files[0])} />
            </label>
          </div>
        </div>
        {err && <p role="alert" style={{ color: '#c0262d', margin: '8px 0 16px' }}>{err}</p>}
        {loading ? <p>Loading…</p> : !list.length ? (
          <div className="empty"><h3 style={{ fontSize: 22 }}>No enquiries yet</h3><p>New requests from the website will appear here.</p></div>
        ) : (
          <div className="tscroll"><table className="ctable adm-table">
            <thead><tr><th style={{ width: '11%' }}>Received</th><th style={{ width: '16%' }}>Contact</th><th style={{ width: '18%' }}>Course</th><th>Subject &amp; notes</th><th style={{ width: '11%' }}>Status</th></tr></thead>
            <tbody>{list.map((r) => (
              <tr key={r.id} style={{ '--c': r.status === 'new' ? '#e9a23b' : '#ecdcd8' }}>
                <td data-l="Received">{new Date(r.createdAt).toLocaleString()}</td>
                <td data-l="Contact"><b>{r.first} {r.last}</b><br /><a href={`mailto:${r.email}`}>{r.email}</a>{r.phone && <><br />{r.phone}</>}{r.company && <><br /><span style={{ color: 'var(--ink-3)' }}>{r.company}</span></>}</td>
                <td data-l="Course">{r.courseCode ? <><span className="code">{r.courseCode}</span><br />{r.courseName}</> : <span style={{ color: 'var(--ink-3)' }}>Not specified</span>}</td>
                <td data-l="Subject"><div style={{ whiteSpace: 'pre-line' }}>{r.subject}</div>{r.notes && <div style={{ marginTop: 6, color: 'var(--ink-3)', whiteSpace: 'pre-line' }}>{r.notes}</div>}</td>
                <td data-l="Status"><select className="sel" value={r.status} onChange={(e) => setStatus(r.id, e.target.value)}>{STATUSES.map((s) => <option key={s}>{s}</option>)}</select></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
        </>)}
      </div>
    </>
  );
}
