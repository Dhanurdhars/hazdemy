// Dotted 3D globe on <canvas>: depth-shaded dots, flying data arcs, dust ring and orbiting product labels.
// Light palette on the cream hero, glowing palette in dark mode. initGlobe(container) returns a cleanup function.
const isDark=()=>{const t=document.documentElement.dataset.theme;return t?t==='dark':matchMedia('(prefers-color-scheme: dark)').matches};
export function initGlobe(el){
  let stopped=false,raf=0;
  const cv=el.querySelector('canvas'),ctx=cv.getContext('2d'),lab=el.querySelector('.glabels');
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let W=0,H=0,R=0;
  const size=()=>{const d=Math.min(2,devicePixelRatio||1);W=el.clientWidth;H=el.clientHeight;cv.width=W*d;cv.height=H*d;ctx.setTransform(d,0,0,d,0,0);R=Math.min(W,H)*.28};
  size(); const ro=new ResizeObserver(size); ro.observe(el);
  const N=950,pts=[];
  for(let i=0;i<N;i++){const y=1-2*(i+.5)/N,r=Math.sqrt(1-y*y),t=i*2.399963;pts.push([Math.cos(t)*r,y,Math.sin(t)*r])}
  const tz=.32,ring=[];
  for(let i=0;i<720;i++){const a=Math.random()*Math.PI*2,rr=1.38+Math.pow(Math.random(),1.6)*.24,x=Math.cos(a)*rr,y=(Math.random()-.5)*.025,z=Math.sin(a)*rr;
    ring.push([x*Math.cos(tz)-y*Math.sin(tz),x*Math.sin(tz)+y*Math.cos(tz),z,.35+Math.random()*.65])}
  const slerp=(a,b,u)=>{const d=Math.max(-1,Math.min(1,a[0]*b[0]+a[1]*b[1]+a[2]*b[2])),o=Math.acos(d),so=Math.sin(o)||1e-6,k1=Math.sin((1-u)*o)/so,k2=Math.sin(u*o)/so,h=1+.42*Math.sin(Math.PI*u)*o/2;
    return [(a[0]*k1+b[0]*k2)*h,(a[1]*k1+b[1]*k2)*h,(a[2]*k1+b[2]*k2)*h]};
  const newArc=()=>{let a,b;do{a=pts[Math.random()*N|0];b=pts[Math.random()*N|0]}while(a[0]*b[0]+a[1]*b[1]+a[2]*b[2]>.3);return{a,b,t:-Math.random()*.6,sp:.0025+Math.random()*.002,c:Math.random()<.55?[242,178,92]:[255,107,94],cl:Math.random()<.55?[194,65,12]:[142,27,30]}};
  const arcs=Array.from({length:8},()=>{const r=newArc();r.t=Math.random()*1.2;return r});
  const L=[['DataStage','#e0574f'],['watsonx.data','#f08a4b'],['Maximo','#14a36b'],['Guardium','#e5484d'],['Cognos','#e9a23b'],['webMethods','#ff7a45'],['Db2 for z/OS','#0eb3b3'],['Planning Analytics','#f2b25c']];
  lab.innerHTML=L.map(l=>`<span class="glabel"><i style="background:${l[1]};color:${l[1]}"></i>${l[0]}</span>`).join('');
  const lEls=[...lab.children];
  const orb=L.map((_,i)=>({r:1.42+(i%3)*.12,inc:(i%2?1:-1)*(.22+.14*(i%3)),a:i/L.length*Math.PI*2,sp:.0011+.00035*(i%3)}));
  let rx=-.32,ry=0,trx=-.32,drag=null,mx=0,my=0,vel=0;
  el.onpointerdown=e=>{drag={x:e.clientX,y:e.clientY,ry,rx:trx,lx:e.clientX};el.setPointerCapture(e.pointerId)};
  el.onpointermove=e=>{const b=el.getBoundingClientRect();mx=(e.clientX-b.left)/b.width-.5;my=(e.clientY-b.top)/b.height-.5;
    if(drag){ry=drag.ry+(e.clientX-drag.x)*.008;trx=Math.max(-1.1,Math.min(.7,drag.rx+(e.clientY-drag.y)*.006));vel=(e.clientX-drag.lx)*.008;drag.lx=e.clientX}};
  el.onpointerup=el.onpointercancel=()=>{drag=null};
  el.onpointerleave=()=>{mx=my=0};
  const F=3.6;
  function frame(){
    if(stopped)return;
    if(!drag){vel*=.95;ry+=(reduce?0:.0013)+vel*.25}
    rx+=((trx+my*.3)-rx)*.06;
    const ryy=ry+mx*.4,cy=Math.cos(ryy),sy=Math.sin(ryy),cx=Math.cos(rx),sx=Math.sin(rx);
    const rot=p=>{const x=p[0]*cy-p[2]*sy,z=p[0]*sy+p[2]*cy,y=p[1];return [x,y*cx-z*sx,y*sx+z*cx]};
    const pr=q=>{const s=F/(F-q[2]);return [W/2+q[0]*R*s,H/2+q[1]*R*s,s]};
    const behind=(q,P)=>q[2]<0&&Math.hypot(P[0]-W/2,P[1]-H/2)<R*1.02;
    ctx.clearRect(0,0,W,H);
    const LT=!!el.closest('.hero.light')&&!isDark();
    let g=ctx.createRadialGradient(W/2,H/2,R*.3,W/2,H/2,R*2);g.addColorStop(0,LT?'rgba(233,140,90,.22)':'rgba(200,50,40,.32)');g.addColorStop(.45,LT?'rgba(233,162,59,.08)':'rgba(140,25,20,.12)');g.addColorStop(1,'rgba(0,0,0,0)');
    ctx.fillStyle=g;ctx.fillRect(0,0,W,H);
    const back=[],front=[];
    for(const p of ring){const q=rot(p);(q[2]<0?back:front).push([q,0,p[3]])}
    for(const p of pts){const q=rot(p);(q[2]<0?back:front).push([q,1])}
    const draw=it=>{const q=it[0],P=pr(q),d=(q[2]+1)/2;ctx.beginPath();
      if(it[1]){ctx.fillStyle=LT?`hsla(${358+26*d},85%,${30+14*d}%,${.1+.9*d*d})`:`hsla(${6+34*d},92%,${42+26*d}%,${.12+.88*d*d})`;ctx.arc(P[0],P[1],(.5+1.5*d)*P[2],0,7)}
      else{ctx.fillStyle=LT?`rgba(${200-40*d|0},${90+30*d|0},30,${(.2+.65*d)*it[2]})`:`rgba(245,${150+40*d|0},92,${(.2+.7*d)*it[2]})`;ctx.arc(P[0],P[1],(.35+.8*it[2])*P[2],0,7)}
      ctx.fill()};
    back.sort((a,b)=>a[0][2]-b[0][2]).forEach(draw);
    g=ctx.createRadialGradient(W/2-R*.38,H/2-R*.42,R*.05,W/2,H/2,R*1.03);
    if(LT){g.addColorStop(0,'rgba(255,255,255,.95)');g.addColorStop(.55,'rgba(253,236,228,.93)');g.addColorStop(1,'rgba(244,205,192,.95)')}else{g.addColorStop(0,'rgba(170,45,42,.92)');g.addColorStop(.5,'rgba(80,10,12,.93)');g.addColorStop(1,'rgba(22,3,4,.96)')}
    ctx.beginPath();ctx.arc(W/2,H/2,R*1.02,0,7);ctx.fillStyle=g;ctx.fill();
    ctx.lineWidth=1.2;ctx.strokeStyle=LT?'rgba(142,27,30,.25)':'rgba(255,170,130,.22)';ctx.stroke();
    front.sort((a,b)=>a[0][2]-b[0][2]).forEach(draw);
    for(const ar of arcs){
      if(!reduce) ar.t+=ar.sp;
      if(ar.t>1.4){Object.assign(ar,newArc());continue}
      if(ar.t<0) continue;
      const t1=Math.min(1,ar.t),t0=Math.max(0,ar.t-.4);
      if(t1<=t0) continue;
      let prev=null;
      for(let k=0;k<=24;k++){const u=t0+(t1-t0)*k/24,q=rot(slerp(ar.a,ar.b,u)),P=pr(q);
        if(prev&&!behind(q,P)){ctx.beginPath();ctx.moveTo(prev[0],prev[1]);ctx.lineTo(P[0],P[1]);ctx.strokeStyle=`rgba(${LT?ar.cl:ar.c},${(k/24)*(q[2]<0?.25:.9)})`;ctx.lineWidth=1+1.4*k/24;ctx.stroke()}
        prev=P;
        if(k===24&&ar.t<=1&&!behind(q,P)){ctx.beginPath();ctx.arc(P[0],P[1],3.2,0,7);ctx.fillStyle=`rgb(${LT?ar.cl:ar.c})`;ctx.shadowColor=`rgb(${LT?ar.cl:ar.c})`;ctx.shadowBlur=14;ctx.fill();ctx.shadowBlur=0}}
      if(ar.t>1){const q=rot(ar.b),P=pr(q);if(!behind(q,P)){const f=(ar.t-1)/.4;ctx.beginPath();ctx.arc(P[0],P[1],3+f*16,0,7);ctx.strokeStyle=`rgba(${LT?ar.cl:ar.c},${.8*(1-f)})`;ctx.lineWidth=1.5;ctx.stroke()}}
    }
    orb.forEach((o,i)=>{
      if(!reduce) o.a+=o.sp;
      const c=Math.cos(o.a)*o.r,s=Math.sin(o.a)*o.r;
      const q=rot([c,s*Math.sin(o.inc),s*Math.cos(o.inc)]),P=pr(q);
      const hid=behind(q,P),e=lEls[i];
      e.style.transform=`translate(${P[0]}px,${P[1]}px) translate(-50%,-50%) scale(${(.72+.38*(P[2]-.75)).toFixed(3)})`;
      e.style.opacity=hid?.12:(q[2]<0?.55:1);
      e.style.zIndex=Math.round(q[2]*100)+200;
    });
    raf=requestAnimationFrame(frame);
  }
  frame();
  return ()=>{stopped=true;cancelAnimationFrame(raf);ro.disconnect();el.onpointerdown=el.onpointermove=el.onpointerup=el.onpointercancel=el.onpointerleave=null;};
}
