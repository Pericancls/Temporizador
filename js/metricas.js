/* Métricas por día y línea base.
   Eficiencia = min de actividad real (5:00–23:00) / 1080.  Efectividad = terminadas / planeadas del día.
   "Planeadas" se guarda en dst{fecha:{ids:[...]}} porque las pausadas se mudan solas al día siguiente. */
const BASE={a:'2026-11-27',n:14};
let dst=(()=>{const v=load('dst',{});return v&&typeof v==='object'&&!Array.isArray(v)?v:{}})();

function dstTrack(){const k=dkey(new Date()),L=(plans[k]||[]).filter(a=>!a.quick&&!isRestN(a.n));if(!L.length)return;
  const o=dst[k]||(dst[k]={ids:[]});let ch=false;L.forEach(a=>{if(!o.ids.includes(a.id)){o.ids.push(a.id);ch=true}});
  if(ch)try{localStorage.setItem('dst',JSON.stringify(dst))}catch(e){}}
function mergeDst(a,b){const o={};[a||{},b||{}].forEach(s=>Object.keys(s).forEach(k=>{const t=o[k]||(o[k]={ids:[]});((s[k]||{}).ids||[]).forEach(i=>{if(!t.ids.includes(i))t.ids.push(i)})}));return o}

function dayNums(k){const [y,m,d]=k.split('-').map(Number),a=new Date(y,m-1,d,5).getTime(),b=new Date(y,m-1,d,23).getTime(),now=Date.now();
  if(a>now)return null;const end=Math.min(b,now),act=[],rest=[],sg=[];
  log.forEach(e=>segsOf(e).forEach(x=>{(isRestN(e.n)?rest:act).push(x);sg.push({...x,n:e.n})}));
  openWork().forEach(w=>w.segs.forEach(x=>{(isRestN(w.n)?rest:act).push(x);sg.push({...x,n:w.n})}));
  const A=sumMin(union(clip(act,a,b))),R=sumMin(union(clip(rest,a,b)));
  const S=sg.map(x=>({s:Math.max(x.s,a),e:Math.min(x.e,end),n:x.n})).filter(x=>x.e>x.s).sort((p,q)=>p.s-q.s);
  const G=[];if(S.length>1){let l=S[0];for(const x of S.slice(1)){if(x.s>l.e+5*60e3)G.push({s:l.e,e:x.s,from:l.n,to:x.n,fromLen:(l.e-l.s)/6e4});if(x.e>=l.e)l=x}}
  const done=log.filter(e=>e.d===k&&e.ok&&!isRestN(e.n)),ids=new Set(((dst[k]||{}).ids)||[]);done.forEach(e=>e.id&&ids.add(e.id));
  const planned=Math.max(ids.size,done.length),fr={};notes.filter(n=>!n.del&&n.cause&&dkey(new Date(n.ts))===k).forEach(n=>fr[n.cause]=(fr[n.cause]||0)+1);
  const U=union(clip(act.concat(rest),a,end)),slp=U.length?(U[0].s-a)/6e4+(now<b?0:(b-U[U.length-1].e)/6e4):0,sin=Math.max(0,(end-a)/6e4-A-R-slp);
  const nx=a+864e5,lastAny=sg.filter(x=>x.e>a&&x.s<nx&&x.e!=null).reduce((m,x)=>Math.max(m,Math.min(x.e,nx)),0)||null,bed=new Date(y,m-1,d,23,15).getTime();
  return{k,A,R,G,sin,slp,lastAny,sleepOk:lastAny&&!(now<nx)?lastAny<=bed:null,gap:G.reduce((s,g)=>s+(g.e-g.s),0)/6e4,gap20:G.filter(g=>g.e-g.s>=20*60e3).length,
    efi:A/1080*100,efe:planned?done.length/planned*100:null,done:done.length,planned,fr,
    first:S.length?S[0].s:null,last:S.length?S[S.length-1].e:null,live:now<b,left:now<b?(b-now)/6e4:0}}

const avg=v=>v.reduce((s,x)=>s+x,0)/v.length,sd=v=>{if(v.length<2)return 0;const m=avg(v);return Math.sqrt(v.reduce((s,x)=>s+(x-m)**2,0)/(v.length-1))};
function baseDays(){const t=dkey(new Date()),out=[];for(let i=0;i<BASE.n;i++){const k=shiftDay(BASE.a,i);if(k>=t)break;out.push(dayNums(k))}return out.filter(d=>d&&(d.A>0||d.planned>0))}

function baseReport(){const D=baseDays(),t=dkey(new Date()),dn=Math.min(BASE.n,Math.max(0,Math.round((kDate(t)-kDate(BASE.a))/864e5)));
  const fmtD=k=>kDate(k).toLocaleDateString('es-MX',{day:'numeric',month:'short'});
  let h=`<h3>📏 Línea base <small>(${fmtD(BASE.a)} – ${fmtD(shiftDay(BASE.a,BASE.n-1))})</small></h3>`;
  if(t<BASE.a)return h+`<p class="muted">Empieza el ${fmtD(BASE.a)}. Estos 14 días usa la app normal, sin probar técnicas nuevas.</p>`;
  h+=`<p class="muted">Día ${Math.min(dn+1,BASE.n)} de ${BASE.n}${dn>=BASE.n?' · ✅ completa':' · no cambies nada todavía'}. Solo cuentan días ya terminados y con registros.</p>`;
  if(!D.length)return h;
  const row=(lb,v,u,dec=0)=>{const ok=v.filter(x=>x!=null);if(!ok.length)return`<tr><td>${lb}</td><td>—</td><td>—</td></tr>`;const m=avg(ok),s=sd(ok);return`<tr><td>${lb}</td><td>${m.toFixed(dec)}${u}</td><td>± ${s.toFixed(dec)}${u}</td></tr>`};
  h+=`<table class="clkt bst"><tr><td></td><td><b>Promedio</b></td><td><b>Variación</b></td></tr>
    ${row('⚡ Eficiencia',D.map(d=>d.efi),'%')}${row('🎯 Efectividad',D.map(d=>d.efe),'%')}${row('🕳️ Huecos',D.map(d=>d.gap),' min')}${row('Huecos >20 min',D.map(d=>d.gap20),'',1)}<tr><td>🛌 Dormir ≤11:15 pm</td><td>${(()=>{const v=D.map(d=>d.sleepOk).filter(x=>x!=null);return v.length?Math.round(v.filter(Boolean).length/v.length*100)+'% de los días':'—'})()}</td><td></td></tr></table>
  <table class="clkt bst"><tr><td><b>Día</b></td><td><b>Efic.</b></td><td><b>Efect.</b></td><td><b>Huecos</b></td></tr>
    ${D.map(d=>`<tr><td>${kDate(d.k).toLocaleDateString('es-MX',{weekday:'short',day:'numeric'})}</td><td>${Math.round(d.efi)}%</td><td>${d.efe==null?'—':Math.round(d.efe)+'%'} <small>${d.done}/${d.planned}</small></td><td>${Math.round(d.gap)} min</td></tr>`).join('')}</table>
  <button class="btn gray" style="width:100%;margin-top:8px" onclick="exportDays()">📤 Exportar días (CSV para Excel)</button>`;
  return h}

function exportDays(){const ks=new Set();log.forEach(e=>ks.add(e.d));Object.keys(dst).forEach(k=>ks.add(k));
  const C=['Falta de material','Miedo','Parálisis','Falta de preparación','Estoy descansando'];
  const rows=[['fecha','dia_semana','eficiencia_pct','efectividad_pct','terminadas','planeadas','min_actividad','min_descanso','min_sin_registrar','min_dormir','min_huecos','huecos_20','primer_bloque','ultimo_bloque','ultima_actividad','durmio_a_tiempo',...C.map(c=>'freno_'+c.toLowerCase().replace(/ /g,'_'))]];
  [...ks].sort().forEach(k=>{const d=dayNums(k);if(!d||d.live)return;const t=x=>x?new Date(x).toTimeString().slice(0,5):'';
    rows.push([k,kDate(k).toLocaleDateString('es-MX',{weekday:'long'}),d.efi.toFixed(1),d.efe==null?'':d.efe.toFixed(1),d.done,d.planned,Math.round(d.A),Math.round(d.R),Math.round(d.sin),Math.round(d.slp),Math.round(d.gap),d.gap20,t(d.first),t(d.last),t(d.lastAny),d.sleepOk==null?'':d.sleepOk?1:0,...C.map(c=>d.fr[c]||0)])});
  const csv='﻿'+rows.map(r=>r.map(x=>/[",\n]/.test(String(x))?'"'+String(x).replace(/"/g,'""')+'"':x).join(',')).join('\n');
  const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='temporizador-dias.csv';a.click();toast('📤 CSV listo')}
setTimeout(()=>{try{dstTrack()}catch(e){}},1000);
