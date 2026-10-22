// Haz course-advisor engine: intent parsing, fuzzy course search, guided flow, FAQ and comparisons.
// UI-agnostic — the React component supplies `say(html, chips, cls)` and `navigate(path)`.
import { AREAS, LEVELS, TRACKS, COURSES, byCode, count } from '../data/catalog';
import { esc, dur, hours, lvlBarsHtml as lvlBars } from '../lib/format';

export function createEngine({ say, navigate }) {
const SYN={
  etl:['datastage','data integration','infosphere'],elt:['datastage'],pipeline:['datastage','data integration'],
  bi:['cognos','planning analytics','dashboard','report'],reporting:['cognos','report'],dashboard:['cognos','dashboard'],dashboards:['cognos','dashboard'],
  report:['cognos','report'],reports:['cognos','report'],olap:['cognos','transformer','tm1'],tm1:['planning analytics'],budgeting:['planning analytics'],planning:['planning analytics'],forecast:['planning analytics'],finance:['planning analytics'],excel:['planning analytics','pafe'],
  asset:['maximo'],assets:['maximo'],eam:['maximo'],maintenance:['maximo'],apm:['maximo'],
  mainframe:['z/os','cics','db2 for zos','ibm z'],zos:['z/os','db2 for zos'],cobol:['cics','cobol'],
  security:['guardium','verify privilege','data security'],privacy:['guardium'],compliance:['guardium','governance'],pam:['verify privilege'],encryption:['guardium'],
  ai:['watsonx'],genai:['watsonx'],ml:['watsonx'],llm:['watsonx'],lakehouse:['watsonx.data'],
  integration:['webmethods','integration'],api:['webmethods','api'],apis:['webmethods','api'],b2b:['webmethods','b2b'],edi:['webmethods'],esb:['webmethods'],
  governance:['governance','knowledge catalog','catalog'],catalog:['knowledge catalog','catalog'],metadata:['catalog','metadata'],lineage:['catalog','lineage'],
  quality:['quality','qualitystage'],mdm:['master data','mdm'],
  database:['db2'],sql:['db2','sql'],warehouse:['warehouse','db2 warehouse'],dwh:['warehouse'],
  storage:['ds8000','storage'],workflow:['workflow','baw'],bpm:['baw','workflow'],automation:['workflow','automation'],
  capture:['datacap'],ocr:['datacap'],observability:['databand'],cicd:['mettleci'],devops:['mettleci','devops'],testing:['mettleci'],
  scheduling:['workload automation','scheduling'],batch:['workload automation'],supply:['sterling'],
  virtualization:['watson query','virtualization'],cp4d:['cloud pak for data'],cloudpak:['cloud pak for data']
};
const STOP=new Set('i im i\'m me my we our us you your a an the to of for in on at and or with about any some is are am be do does can could would should want need looking look find show give get tell learn learning course courses training class classes something like please on-prem want help me which what best good new there have has more that this it'.split(' '));
const LEVEL=[[/\b(beginners?|basics?|intro|introduction|introductory|foundations?|fundamentals?|new to|starters?|entry[- ]level|novice)\b/i,'Foundation'],[/\b(intermediate|mid)\b/i,'Intermediate'],[/\b(advanced|experts?|deep[- ]dive|senior|experienced)\b/i,'Advanced']];
const ROLE=[[/\b(developer|developers|dev|programmer|engineer|engineers|architect|architects|builder|builders|etl dev|data engineer)\b/i,'builders'],[/\b(admin|admins|administrator|administrators|sysadmin|operator|operators|ops|dba|support|platform owner)\b/i,'operators'],[/\b(business|analyst|analysts|manager|managers|leader|leaders|executive|finance|planner|planners|steward|stewards|power user)\b/i,'leaders']];
const NUMW={one:1,two:2,three:3,four:4,five:5,half:.5};
const st={ctx:null,last:[],page:0,flow:null,prefs:{},greeted:false};
function norm(s){return String(s).toLowerCase().replace(/[’']/g,"'")}
function tokens(q){return norm(q).replace(/[^a-z0-9.+\/\- ]/g,' ').split(/\s+/).filter(w=>w.length>1&&!STOP.has(w))}
function lev(a,b){if(Math.abs(a.length-b.length)>2)return 9;const d=Array.from({length:b.length+1},(_,i)=>i);for(let i=1;i<=a.length;i++){let p=d[0];d[0]=i;for(let j=1;j<=b.length;j++){const t=d[j];d[j]=Math.min(d[j]+1,d[j-1]+1,p+(a[i-1]===b[j-1]?0:1));p=t}}return d[b.length]}
const VOCAB=[...new Set(COURSES.flatMap(c=>tokens(c.product+' '+c.name)).filter(w=>w.length>3))];
function fix(w){if(VOCAB.includes(w)||SYN[w])return w;let best=null,bd=3;for(const v of VOCAB.concat(Object.keys(SYN))){const d=lev(w,v);if(d<bd&&d<=(w.length>6?2:1)){bd=d;best=v}}return best||w}

function parseFilters(q){
  const f={};
  for(const [re,l] of LEVEL) if(re.test(q)) f.level=l;
  if(/\b(i'?m|i am|as an?|for|we are|our|my team|team of)\b/i.test(q)) for(const [re,r] of ROLE) if(re.test(q)) f.track=r;
  for(const a of ['Security','Sustainability','Automation','Infrastructure']) if(new RegExp('\\b'+a+'\\b','i').test(q)) f.area=a;
  let m=q.match(/(under|less than|max(?:imum)?|up to|within|<|no more than)\s*(\d+(?:\.\d+)?|one|two|three|four|five|half)\s*(days|day|hours|hour|hrs|hr)/i);
  if(m){let n=NUMW[m[2]]??+m[2];const u=/h/i.test(m[3]);const lbl=`${/under|less|</i.test(m[1])?'under':'up to'} ${m[2]} ${m[3]}`;if(u)n=n/8;f.maxDays=/under|less|</i.test(m[1])?n-0.001:n;f.lbl=lbl}
  m=q.match(/\b(\d+(?:\.\d+)?|one|two|three|four|five)[\s-]*(day|days)\b/i);
  if(m&&!f.maxDays) f.days=NUMW[m[1]]??+m[1];
  if(/\b(short|quick|brief|overview)\b/i.test(q)) f.maxDays=f.maxDays??1;
  if(/\b(long|comprehensive|in-depth|bootcamp)\b/i.test(q)) f.minDays=4;
  return f;
}
function applyF(list,f){return list.filter(c=>(!f.level||c.level===f.level)&&(!f.track||c.tracks.includes(f.track))&&(!f.area||c.area===f.area)&&(f.maxDays==null||(c.days??99)<=f.maxDays)&&(f.minDays==null||(c.days??0)>=f.minDays)&&(f.days==null||c.days===f.days))}
function score(c,toks,phrase){
  let s=0;const why=new Set();
  const F=[[norm(c.code),6,'code'],[norm(c.product),4,'product'],[norm(c.name),3,'title'],[norm(c.persona.join(' ')),1.4,'audience'],[norm(c.desc),1,'description'],[norm(c.prereq.join(' ')),.4,'prerequisites']];
  for(const t of toks){
    const exp=[t,...(SYN[t]||[])];
    let best=0,bw='';
    for(const e of exp)for(const [h,w,n] of F){if(e.length<2)continue;const re=e.length<=3?new RegExp('\\b'+e.replace(/[.*+?^${}()|[\]\\\/]/g,'\\$&')+'\\b'):null;const hit=re?re.test(h):h.includes(e);if(hit){const v=w*(e===t?1:.85);if(v>best){best=v;bw=n}}}
    s+=best;if(bw)why.add(bw);
  }
  if(phrase.length>5&&norm(c.name).includes(phrase))s+=8;
  return {s,why:[...why]};
}
function search(q,extra={}){
  const f=Object.assign(parseFilters(q),extra);
  const toks=tokens(q).map(fix).filter(t=>!/^(beginner|basic|basics|intro|introduction|foundation|fundamentals?|intermediate|advanced|expert|developer|developers|admin|administrator|administrators|analyst|analysts|business|manager|short|quick|day|days|hour|hours|under|less|than|data|ibm)$/.test(t)||Object.keys(AREAS).map(norm).includes(t)&&false);
  if(f.area){const al=f.area.toLowerCase();for(let i=toks.length-1;i>=0;i--)if(toks[i]===al)toks.splice(i,1)}
  const dataTok=/\bdata\b/i.test(q)&&!toks.length&&!f.area;
  let pool=applyF(COURSES,f);
  if(dataTok) pool=pool.filter(c=>c.area==='Data');
  let res,weak=false;
  if(toks.length){
    const phrase=norm(q).trim();
    res=pool.map(c=>({c,...score(c,toks,phrase)})).filter(r=>r.s>=Math.max(1,toks.length*.9)).sort((a,b)=>b.s-a.s||(a.c.days??0)-(b.c.days??0));
    if(!res.length){res=pool.map(c=>({c,...score(c,toks,phrase)})).filter(r=>r.s>0).sort((a,b)=>b.s-a.s);weak=true}
  } else res=pool.map(c=>({c,s:1,why:[]})).sort((a,b)=>LEVELS.indexOf(a.c.level)-LEVELS.indexOf(b.c.level)||(a.c.days??0)-(b.c.days??0));
  if(!res.length&&toks.length&&(f.level||f.maxDays!=null||f.days||f.minDays||f.track)){
    const loose=search(toks.join(' '));
    if(loose.res.length){loose.relaxed=fdesc(f);return loose}
  }
  return {res,f,toks,weak};
}

const dtxt=d=>dur(d);
function ccard(c,why){const a=AREAS[c.area]||AREAS.Data;return `<div class="bc" style="--c:${a.c}"><div class="t"><span>${esc(c.product)}</span><span>${esc(c.code)}</span></div><h5>${esc(c.name)}</h5><div class="m"><span>⏱ ${dtxt(c.days)}</span><span>${lvlBars(c.level)} ${esc(c.level)}</span></div>${why&&why.length?`<div class="why">Matched on ${why.slice(0,3).join(', ')}</div>`:''}<div class="a"><button data-act="info" data-code="${esc(c.code)}">Details</button><a data-link href="/course/${encodeURIComponent(c.code)}" data-close>Open page</a><a class="pri" data-link href="/contact?course=${encodeURIComponent(c.code)}" data-close>Ask for details</a></div></div>`}
function fdesc(f){const p=[];if(f.level)p.push(f.level.toLowerCase());if(f.area)p.push(f.area);if(f.track)p.push('for '+TRACKS[f.track].name.toLowerCase());if(f.maxDays!=null)p.push(f.lbl||(f.maxDays<=1?'1 day or less':`up to ${Math.round(f.maxDays)} days`));if(f.minDays)p.push(`${f.minDays}+ days`);if(f.days)p.push(`${f.days}-day`);return p.join(', ')}
function showResults(res,f,label){
  st.last=res;st.page=0;
  if(!res.length){return say(`I couldn't find a course matching that${fdesc(f)?` (${esc(fdesc(f))})`:''}. Try a product name like <b>DataStage</b>, <b>Maximo</b> or <b>Guardium</b>, or tell me your role and what you want to learn.`,['Help me choose','Browse all areas','Talk to a person'])}
  st.ctx=res[0].c;
  const n=res.length,top=res.slice(0,3);
  return say(`${(label||`I found <b>${n}</b> course${n>1?'s':''}`).replace(/\.$/,'')}${fdesc(f)?` <span style="color:var(--ink-3)">(${esc(fdesc(f))})</span>`:''}${n>3?'. Here are the best matches:':':'}`).then(()=>say(top.map(r=>ccard(r.c,r.why)).join(''),moreChips(n),'wide'));
}
function moreChips(n){const q=[];if(n>(st.page+1)*3)q.push('Show more');if(st.last.length>1)q.push('Compare top 2');q.push('Shortest first','Start over');return q}
function courseInfo(c){
  st.ctx=c;const a=AREAS[c.area]||AREAS.Data;
  return say(`<div class="bc" style="--c:${a.c}"><div class="t"><span>${esc(c.area)} · ${esc(c.product)}</span><span>${esc(c.code)}</span></div><h5>${esc(c.name)}</h5><div class="m"><span>⏱ ${dtxt(c.days)} (${hours(c.days)})</span><span>${lvlBars(c.level)} ${esc(c.level)}</span></div>
  <p style="margin-top:8px;font-size:13px;color:var(--ink-2)">${esc(c.desc.length>320?c.desc.slice(0,317).replace(/\s+\S*$/,'')+'…':c.desc)}</p>
  ${c.persona.length?`<p style="margin-top:8px;font-size:13px"><b>Who it's for:</b> ${esc(c.persona.slice(0,2).join('; '))}${c.persona.length>2?'…':''}</p>`:''}
  <div class="a"><a data-link href="/course/${encodeURIComponent(c.code)}" data-close>Full course page</a><a class="pri" data-link href="/contact?course=${encodeURIComponent(c.code)}" data-close>Ask for details</a></div></div>`,['Prerequisites?','Who should attend?','Similar courses','Get details'],'wide');
}
function compare(a,b){
  const row=(k,fn)=>`<tr><th>${k}</th><td>${fn(a)}</td><td>${fn(b)}</td></tr>`;
  return say(`<b>Side-by-side</b><table class="cmp" style="margin-top:8px"><tr><th></th><td><b>${esc(a.code)}</b></td><td><b>${esc(b.code)}</b></td></tr>${row('Course',c=>esc(c.name))}${row('Product',c=>esc(c.product))}${row('Duration',c=>dtxt(c.days))}${row('Level',c=>esc(c.level))}${row('Prereqs',c=>c.prereq.length?esc(c.prereq[0]).slice(0,90)+(c.prereq[0].length>90?'…':''):'None listed')}${row('Best for',c=>esc((c.persona[0]||'—')).slice(0,90))}</table>
  <p style="margin-top:8px;font-size:13px">${a.level!==b.level?`Start with <b>${esc(LEVELS.indexOf(a.level)<LEVELS.indexOf(b.level)?a.name:b.name)}</b> if you're newer to the topic.`:(a.days!==b.days?`<b>${esc((a.days??0)<(b.days??0)?a.name:b.name)}</b> is the shorter option.`:'Both are at the same level and length — pick by product focus.')}</p>`,[`Details on ${a.code}`,`Details on ${b.code}`,'Get details'],'wide');
}

/* ---------- guided flow ---------- */
function startFlow(){st.flow={step:'role'};return say("Happy to help you choose. First — which best describes you (or the team you're training)?",['Developer / engineer','Administrator / operations','Business user / analyst','Not sure'])}
function flowStep(t){
  const f=st.flow;
  if(f.step==='role'){
    f.track=/dev|engineer|architect/i.test(t)?'builders':/admin|oper|support/i.test(t)?'operators':/business|analyst|manager|lead/i.test(t)?'leaders':null;
    f.step='area';
    const areas=Object.keys(AREAS).filter(a=>!f.track||COURSES.some(c=>c.area===a&&c.tracks.includes(f.track)));
    return say('Great. Which technology area are you interested in?',areas.concat(['Any area']));
  }
  if(f.step==='area'){f.area=Object.keys(AREAS).find(a=>new RegExp('^'+a,'i').test(t.trim()))||null;f.step='level';return say("And how experienced are you with it?",['New to it','Some experience','Very experienced'])}
  if(f.step==='level'){
    f.level=/new|begin|none/i.test(t)?'Foundation':/some|inter/i.test(t)?'Intermediate':/very|adv|expert/i.test(t)?'Advanced':null;
    const ff={};if(f.track)ff.track=f.track;if(f.area)ff.area=f.area;
    st.flow=null;
    let list=applyF(COURSES,{...ff,level:f.level});let note='';
    if(!list.length){list=applyF(COURSES,ff);note=` There's no ${f.level?.toLowerCase()} course for that exact mix, so here's the full ladder instead.`}
    list.sort((a,b)=>LEVELS.indexOf(a.level)-LEVELS.indexOf(b.level)||(a.days??0)-(b.days??0));
    const label=`Here's your suggested path — <b>${list.length}</b> course${list.length>1?'s':''}${f.track?` for ${TRACKS[f.track].name}`:''}${f.area?` in ${f.area}`:''}, ordered from Foundation up.${note}`;
    return showResults(list.map(c=>({c,why:[]})),{},label);
  }
}

/* ---------- FAQ ---------- */
const FAQ=[
  [/\b(price|pricing|cost|costs|fee|fees|quote|quotation|how much|budget|discount)\b/i,()=>st.ctx?say(`Pricing depends on delivery format, group size and location, so we send a tailored quote. I can open the request form for <b>${esc(st.ctx.name)}</b> with everything pre-filled.`,['Yes, get details','Another course']):say("Pricing depends on the course, delivery format and group size, so our team sends a tailored quote. Which course are you interested in? Type a product or course name and I'll set it up.",['Help me choose'])],
  [/\b(online|virtual|remote|onsite|on-site|in person|classroom|delivery|deliver|format|live)\b/i,()=>say("Our courses are <b>instructor-led and hands-on</b>, with labs and exercises throughout. We can run public sessions, private sessions for your team and onsite delivery — just tell us what suits you when you request details.",['Request details','Find a course'])],
  [/\b(certif|certificate|certification|badge|exam|credential)/i,()=>say("Courses include hands-on labs and capstones that leave learners with working artefacts. For certificates of completion or exam preparation on a specific course, ask our team — they'll confirm what's included.",['Ask the team','Find a course'])],
  [/\b(custom|tailor|tailored|bespoke|private|team training|corporate|enterprise|whole team)\b/i,()=>say("Yes — we tailor programs to your product versions, integrations and use cases, and can combine several courses into one learning path. See <a class='lnk' data-link href='/services' data-close>Enterprise training</a> or tell me your team's focus.",['Help me choose','Contact the team'])],
  [/\b(mentor|mentorship|support after|coaching)\b/i,()=>say("Technical mentorship is part of how we train: ongoing, one-on-one support to help learners apply new skills inside your own environment and delivery constraints.")],
  [/\b(lab|labs|hands-on|hands on|capstone|practical)\b/i,()=>say("Every program is built around hands-on labs, peer reviews and capstone projects — the goal is working results, not just slides.")],
  [/\b(contact|email|phone|call|address|office|reach|talk to|human|person|someone|sales)\b/i,()=>say("You can reach the team at <a class='lnk' href='mailto:training@hazdemy.com'>training@hazdemy.com</a>, or our office at 251 Little Falls Drive, Wilmington, Delaware 19808. Want me to open the contact form?",['Open contact form'])],
  [/\b(who are you|what are you|what can you do|help|how does this work|commands)\b/i,()=>help()],
  [/\b(about hazdemy|who is hazdemy|company|why hazdemy)\b/i,()=>say(`Hazdemy is a global IT training partner — <b>98%</b> customer satisfaction, <b>3,000+</b> tailored training solutions and <b>750+</b> expert instructors. Today we offer <b>${COURSES.length}</b> courses across ${Object.keys(AREAS).length} technology areas.`,['Browse all areas','Help me choose'])],
  [/\b(areas|categories|topics|what do you (teach|offer)|catalog|catalogue|all courses|browse)\b/i,()=>say(`We teach across ${Object.keys(AREAS).length} areas:<ul>${Object.keys(AREAS).map(a=>`<li><b>${a}</b> — ${count('area',a)} courses</li>`).join('')}</ul>`,Object.keys(AREAS))],
  [/\b(levels?|difficulty)\b/i,()=>say(`Courses are tagged <b>Foundation</b> (${count('level','Foundation')}), <b>Intermediate</b> (${count('level','Intermediate')}) and <b>Advanced</b> (${count('level','Advanced')}). Every course page lists prerequisites.`,['Foundation courses','Advanced courses'])],
];
function help(){return say(`I'm <b>Haz</b>, Hazdemy's course advisor. I can:<ul><li>Find courses — <i>"DataStage for beginners"</i>, <i>"Guardium under 3 days"</i></li><li>Recommend a path for your role</li><li>Explain prerequisites and who a course is for</li><li>Compare courses — <i>"compare HAZ-CG-ADM and HAZ-CG-ARB"</i></li><li>Connect you to our team for details and pricing</li></ul>`,['Help me choose','Browse all areas','Short courses','Get details'])}

/* ---------- brain ---------- */
function reply(raw){
  const q=raw.trim();if(!q)return;
  const lq=norm(q);
  if(st.flow&&!/^(start over|reset|cancel)$/i.test(q))return flowStep(q);
  if(/^(hi|hello|hey|hii+|hola|namaste|good (morning|afternoon|evening)|yo)\b/i.test(q)&&q.split(' ').length<=4)return say(`Hi there! 👋 What would you like to learn? You can name a product, a skill or your role.`,['Help me choose','Browse all areas','Get details']);
  if(/^(thanks|thank you|thx|ty|great|awesome|perfect|cool|ok|okay)\b/i.test(q))return say("You're welcome! Anything else I can help you find?",['Help me choose','Contact the team']);
  if(/^(start over|reset|restart|clear|cancel)$/i.test(q)){st.ctx=null;st.last=[];st.flow=null;return say("Fresh start. What are you looking for?",['Help me choose','Browse all areas'])}
  if(/^(help me choose|recommend|suggest|where (do|should) i start|learning path|roadmap|not sure)/i.test(q)||/\b(recommend|suggest|roadmap|learning path|where to start|career)\b/i.test(q)&&!tokens(q).some(t=>VOCAB.includes(t)))return startFlow();
  if(/^browse all areas$/i.test(q))return FAQ.find(f=>f[0].test('areas'))[1]();
  if(/^(open contact form|contact the team|talk to a person|ask the team|request details)$/i.test(q)){navigate('/contact'+(st.ctx&&/request/i.test(q)?'?course='+encodeURIComponent(st.ctx.code):''));return say("I've opened the contact form for you.")}
  if(/^(yes,? (get|request) (details|a quote)|get (details|a quote))$/i.test(q)){if(st.ctx){navigate('/contact?course='+encodeURIComponent(st.ctx.code));return say(`Done — the contact form is open with <b>${esc(st.ctx.name)}</b> selected and the subject filled in. Just add your name and email.`)}navigate('/contact');return say("I've opened the contact page — tell our team which course you're interested in and they'll send details. Or name a course here and I'll pre-fill the form for you.")}
  if(/^another course$/i.test(q)){st.ctx=null;return say('Sure — which course or product?')}
  if(/^show more$/i.test(q)&&st.last.length){st.page++;const s=st.last.slice(st.page*3,st.page*3+3);if(!s.length)return say("That's everything I found.",['Start over']);return say(s.map(r=>ccard(r.c,r.why)).join(''),moreChips(st.last.length),'wide')}
  if(/^shortest first$/i.test(q)&&st.last.length){const r=[...st.last].sort((a,b)=>(a.c.days??0)-(b.c.days??0));return showResults(r,{},'Sorted by duration — shortest first')}
  if(/^short courses$/i.test(q))return showResults(search('',{maxDays:1}).res,{maxDays:1});
  if(/^(foundation|advanced) courses$/i.test(q))return showResults(search(q).res,parseFilters(q));
  const codes=[...q.matchAll(/haz-[a-z]{1,3}-[a-z0-9]+/gi)].map(m=>byCode[m[0].toUpperCase()]).filter(Boolean);
  if(/\bcompare\b|\bvs\.?\b|\bversus\b|difference between/i.test(q)){
    if(codes.length>=2)return compare(codes[0],codes[1]);
    if(/top 2|these|them|first two/i.test(q)&&st.last.length>=2)return compare(st.last[0].c,st.last[1].c);
    const parts=q.split(/\bvs\.?\b|\bversus\b|\band\b|,/i).map(s=>s.replace(/compare|difference between/ig,'').trim()).filter(Boolean);
    if(parts.length>=2){const a=search(parts[0]).res[0],b=search(parts[1]).res[0];if(a&&b&&a.c!==b.c)return compare(a.c,b.c)}
    return say("Tell me the two courses to compare — e.g. <i>compare HAZ-CG-ADM and HAZ-CG-ARB</i>, or search first and tap <b>Compare top 2</b>.");
  }
  if(/^find a course$/i.test(q))return say('What would you like to learn? Name a product (e.g. <b>Cognos</b>), a skill (e.g. <b>ETL</b>, <b>dashboards</b>) or your role.',['Help me choose','Browse all areas']);
  if(!st.ctx&&!codes.length&&/^(prerequisites\?|who should attend\?|similar courses|how long.*)$/i.test(q))return say('Which course do you mean? Type its name, product or course code.');
  const det=q.match(/^details on (\S+)/i);if(det&&byCode[det[1].toUpperCase()])return courseInfo(byCode[det[1].toUpperCase()]);
  if(codes.length===1)return courseInfo(codes[0]);
  if(st.ctx){
    const c=st.ctx;
    if(/prereq|pre-req|requirement|need to know|before (taking|i take)|prior/i.test(q))return say(c.prereq.length?`Prerequisites for <b>${esc(c.name)}</b>:<ul>${c.prereq.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`:`No formal prerequisites are listed for <b>${esc(c.name)}</b>.`,['Who should attend?','Get details']);
    if(/who (should|is it for|attend)|audience|persona|suitable|right for me/i.test(q))return say(c.persona.length?`<b>${esc(c.name)}</b> is designed for:<ul>${c.persona.map(p=>`<li>${esc(p)}</li>`).join('')}</ul>`:'The audience isn\'t specified for this course — our team can advise.',['Prerequisites?','Get details']);
    if(/how long|duration|how many (days|hours)|length/i.test(q))return say(`<b>${esc(c.name)}</b> runs for <b>${dtxt(c.days)}</b> (${hours(c.days)}).`,['Get details','Similar courses']);
    if(/level|difficult|hard|easy/i.test(q)&&!tokens(q).some(t=>VOCAB.includes(t)))return say(`It's an <b>${esc(c.level)}</b>-level course.`,['Prerequisites?']);
    if(/similar|related|alternative|next|after (this|that)|other/i.test(q)){const r=COURSES.filter(x=>x!==c&&(x.product===c.product||x.area===c.area)).sort((a,b)=>(b.product===c.product)-(a.product===c.product)||LEVELS.indexOf(a.level)-LEVELS.indexOf(b.level)).map(x=>({c:x,why:[x.product===c.product?'same product':'same area']}));const keep=c;const p=showResults(r,{},`Courses related to <b>${esc(c.name)}</b>`);st.ctx=keep;return p}
    if(/^(tell me more|more info|more|details)$/i.test(q))return courseInfo(c);
  }
  for(const [re,fn] of FAQ) if(re.test(q)&&(tokens(q).filter(t=>VOCAB.includes(fix(t))||SYN[t]).length===0||/price|cost|quote|fee/i.test(q)&&!st.ctx&&false)) return fn();
  if(/\b(price|pricing|cost|quote|fee)\b/i.test(q)){const r=search(q.replace(/price|pricing|cost|quote|fee|for|the/ig,'')).res;if(r.length){st.ctx=r[0].c;return say(`For <b>${esc(r[0].c.name)}</b> we'll send a tailored quote based on delivery format and group size.`,['Yes, get details','Another course'])}}
  const nav=q.match(/\b(go to|open|take me to|show me the)\s+(training|catalog|catalogue|contact|paths|learning paths|about|enterprise|careers|home)\b/i);
  if(nav){const map={training:'training',catalog:'training',catalogue:'training',contact:'contact',paths:'paths','learning paths':'paths',about:'about',enterprise:'services',careers:'careers',home:''};navigate('/'+map[nav[2].toLowerCase()]);return say(`Opening the ${esc(nav[2])} page.`)}
  const sr=search(q),{res,f,toks}=sr;
  if(sr.relaxed)return showResults(res,{},`Nothing matches <b>${esc(sr.relaxed)}</b> exactly, but here are the closest <b>${res.length}</b> course${res.length>1?'s':''}`);
  if(!res.length&&toks.length){
    const fixed=tokens(q).map(fix);const dm=fixed.join(' ')!==tokens(q).join(' ')?fixed.join(' '):null;
    return say(`I couldn't find a match for “${esc(q)}”.${dm?` Did you mean <b>${esc(dm)}</b>?`:''} Try a product (DataStage, Cognos, Maximo, Guardium, watsonx…) or tell me your role.`,dm?[dm,'Help me choose']:['Help me choose','Browse all areas']);
  }
  return showResults(res,f);
}


function greet(path=''){
  const m=path.match(/\/course\/([^?/]+)/);const c=m&&byCode[decodeURIComponent(m[1])];
  if(c){st.ctx=c;return say(`Hi! I'm <b>Haz</b>. I see you're looking at <b>${esc(c.name)}</b>. Want the prerequisites, who it's for, or full details?`,['Prerequisites?','Who should attend?','Similar courses','Get details'])}
  return say(`Hi! I'm <b>Haz</b>, Hazdemy's course advisor 👋<br>Tell me what you'd like to learn — a product, a skill or your role — and I'll find the right course from our ${COURSES.length}.`,['Help me choose','Browse all areas','Short courses','Get details']);
}

return { reply, greet, state: st };
}
