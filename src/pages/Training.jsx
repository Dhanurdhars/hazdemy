import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { AREAS, COURSES, LEVELS, TRACKS, count, areaOf } from '../data/catalog';
import { hours, coursePath } from '../lib/format';
import { AskButton, CourseCard, LevelBars, PageHead } from '../components/UI';
import { Arrow, Download, Grid, Search, Table } from '../components/Icons';
import { toast } from '../lib/toast';

// Columns mirror the green columns of the course sheet (Pre Reqs / Persona live on each course page)
const COLS = [
  { k: 'product', t: 'Product', w: '11%' },
  { k: 'code', t: 'Course Code', w: '10%' },
  { k: 'name', t: 'Course Name', w: '19%' },
  { k: 'days', t: 'Duration (days)', w: '8%' },
  { k: 'desc', t: 'Course Description', w: '31%', nosort: true },
  { k: 'level', t: 'Skill Level', w: '10%' },
  { k: 'act', t: '', w: '11%', nosort: true, csv: false },
];
const DUR = [['short', '< 1 day'], ['1-2', '1–2 days'], ['3-4', '3–4 days'], ['5', '5 days']];
const inDur = (d, k) => !k || (d != null && (k === 'short' ? d < 1 : k === '1-2' ? d >= 1 && d <= 2 : k === '3-4' ? d >= 3 && d <= 4 : d >= 5));

function Hl({ text, q }) {
  if (!q) return text;
  const i = text.toLowerCase().indexOf(q.toLowerCase());
  if (i < 0) return text;
  return <>{text.slice(0, i)}<mark>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>;
}

function toCSV(list) {
  const cell = (v) => '"' + String(v ?? '').replace(/"/g, '""') + '"';
  const rows = [COLS.filter((c) => c.csv !== false).map((c) => c.t)].concat(list.map((c) => [c.product, c.code, c.name, c.days, c.desc, c.level]));
  return '﻿' + rows.map((r) => r.map(cell).join(',')).join('\r\n');
}

function Chips({ value, onChange, options }) {
  return (
    <div className="chips">
      {options.map(([v, l, n]) => (
        <button key={v || 'all'} className={`chip ${value === v ? 'on' : ''}`} onClick={() => onChange(v)}>
          {l}{n != null && <> <em>{n}</em></>}
        </button>
      ))}
    </div>
  );
}

export default function Training() {
  const [params] = useSearchParams();
  const [f, setF] = useState({ q: '', area: '', level: '', dur: '', track: '' });
  const [sort, setSort] = useState({ k: 'code', dir: 1 });
  const [view, setView] = useState(() => { try { return localStorage.getItem('hz-view') || 'table'; } catch { return 'table'; } });

  useEffect(() => {
    setF({ q: params.get('q') || '', area: params.get('area') || '', level: params.get('level') || '', dur: '', track: params.get('t') || '' });
  }, [params]);
  const set = (k) => (v) => setF((s) => ({ ...s, [k]: v }));
  const setViewP = (v) => { setView(v); try { localStorage.setItem('hz-view', v); } catch { /* ignore */ } };

  const list = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const r = COURSES.filter((c) => (!f.area || c.area === f.area) && (!f.level || c.level === f.level) && inDur(c.days, f.dur) && (!f.track || c.tracks.includes(f.track))
      && (!q || [c.name, c.code, c.product, c.desc, c.area, c.level, c.prereq.join(' '), c.persona.join(' ')].join(' ').toLowerCase().includes(q)));
    const { k, dir } = sort;
    return r.sort((a, b) => {
      const x = k === 'days' ? (a.days ?? 0) - (b.days ?? 0) : k === 'level' ? LEVELS.indexOf(a.level) - LEVELS.indexOf(b.level) : String(a[k]).localeCompare(String(b[k]), undefined, { numeric: true });
      return (x || a.code.localeCompare(b.code, undefined, { numeric: true })) * dir;
    });
  }, [f, sort]);

  const sortBy = (k) => setSort((s) => (s.k === k ? { k, dir: -s.dir } : { k, dir: 1 }));
  const exportCSV = () => {
    const blob = new Blob([toCSV(list)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'hazdemy-courses.csv';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    toast('Course list exported');
  };
  const q = f.q.trim();

  return (
    <>
      <PageHead crumbs={[{ label: 'Training' }]} title="Training catalog"
        lead={`${COURSES.length} instructor-led courses from the Hazdemy course directory — with product, course code, duration, description and skill level for every course.`} />
      <div className="wrap wide"><div className="catalog">
        <div className="fpanel reveal">
          <label className="search"><Search /><input value={f.q} onChange={(e) => set('q')(e.target.value)} placeholder="Search by product, course code, name, description or persona" /></label>
          <div className="fgrid">
            <div className="fgroup"><h4>Area</h4><Chips value={f.area} onChange={set('area')} options={[['', 'All'], ...Object.keys(AREAS).map((a) => [a, a, count('area', a)])]} /></div>
            <div className="fgroup"><h4>Skill level</h4><Chips value={f.level} onChange={set('level')} options={[['', 'All'], ...LEVELS.map((l) => [l, l, count('level', l)])]} /></div>
            <div className="fgroup"><h4>Duration</h4><Chips value={f.dur} onChange={set('dur')} options={[['', 'Any'], ...DUR]} /></div>
            <div className="fgroup"><h4>Role track</h4><Chips value={f.track} onChange={set('track')} options={[['', 'All'], ...Object.entries(TRACKS).map(([k, t]) => [k, t.name])]} /></div>
          </div>
        </div>
        <div>
          <div className="toolbar">
            <div className="count">{list.length} course{list.length === 1 ? '' : 's'} <span>of {COURSES.length}</span></div>
            <div className="tools">
              <select className="sel" value={sort.k} onChange={(e) => setSort({ k: e.target.value, dir: 1 })} aria-label="Sort">
                <option value="code">Sort: Course code</option><option value="name">Sort: Course name</option><option value="product">Sort: Product</option><option value="days">Sort: Duration</option><option value="level">Sort: Skill level</option>
              </select>
              <div className="seg">
                <button className={view === 'table' ? 'on' : ''} onClick={() => setViewP('table')}><Table /> Table</button>
                <button className={view === 'cards' ? 'on' : ''} onClick={() => setViewP('cards')}><Grid /> Cards</button>
              </div>
              <button className="btn btn-ghost sm" onClick={exportCSV}><Download /> Export CSV</button>
            </div>
          </div>

          {!list.length ? (
            <div className="empty"><h3 style={{ fontSize: 22, marginBottom: 8 }}>No results found</h3>
              <p>Try a different search, or <button className="linkbtn" onClick={() => setF({ q: '', area: '', level: '', dur: '', track: '' })}>browse all our available courses</button>.</p></div>
          ) : view === 'cards' ? (
            <div className="cards">{list.map((c, i) => <CourseCard key={c.code} course={c} index={i} />)}</div>
          ) : (
            <div className="tscroll"><table className="ctable">
              <colgroup>{COLS.map((c) => <col key={c.k} style={{ width: c.w }} />)}</colgroup>
              <thead><tr>{COLS.map((c) => c.nosort
                ? <th key={c.k}>{c.t}</th>
                : <th key={c.k} tabIndex={0} data-k={c.k} className={sort.k === c.k ? `on ${sort.dir > 0 ? 'asc' : 'desc'}` : ''}
                    onClick={() => sortBy(c.k)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), sortBy(c.k))}>{c.t}<i className="srt" /></th>)}
              </tr></thead>
              <tbody>{list.map((c, i) => (
                <tr key={c.code} style={{ '--c': areaOf(c).c, animationDelay: `${Math.min(i, 20) * 25}ms` }}>
                  <td data-l="Product"><span className="tag"><Hl text={c.product} q={q} /></span></td>
                  <td data-l="Course Code"><span className="code"><Hl text={c.code} q={q} /></span></td>
                  <td data-l="Course Name"><Link className="cname" to={coursePath(c)}><Hl text={c.name} q={q} /></Link></td>
                  <td data-l="Duration (days)" className="num">{c.days == null ? '—' : <span>{c.days}<small>{c.days < 1 ? '≈ ' : ''}{hours(c.days)}</small></span>}</td>
                  <td data-l="Course Description"><div className="clamp"><Hl text={c.desc} q={q} /></div></td>
                  <td data-l="Skill Level"><span className="lvlc"><LevelBars level={c.level} />{c.level}</span></td>
                  <td data-l="" className="acts"><div className="actw"><Link className="showmore" to={coursePath(c)}>Show more <Arrow /></Link><AskButton course={c} small /></div></td>
                </tr>
              ))}</tbody>
            </table></div>
          )}
        </div>
      </div></div>
    </>
  );
}
