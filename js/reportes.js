/* Reportes: dónde se fue tu tiempo y uso del día hábil */

/* ===================== REPORTES ===================== */
const C_ACT='#2fb350',C_REST='#3b8ef5',C_GRAY='#6e6e73',C_BAD='#ff453a';
let rpMode='dia',rpOff=0;
function rpSet(m){rpMode=m;rpOff=0;$('rpD').classList.toggle('on',m==='dia');$('rpW').classList.toggle('on',m==='sem');$('rpM').classList.toggle('on',m==='mes');renderRep()}
function rpMove(n){rpOff+=n;renderRep()}
function rpRange(){const t=new Date();t.setHours(0,0,0,0);
  if(rpMode==='sem'){const dow=(t.getDay()+6)%7;const a=new Date(t.getFullYear(),t.getMonth(),t.getDate()-dow+7*rpOff);const b=new Date(a.getFullYear(),a.getMonth(),a.getDate()+7);return{a:a.getTime(),b:b.getTime(),days:7}}
  const a=new Date(t.getFullYear(),t.getMonth()+rpOff,1),b=new Date(a.getFullYear(),a.getMonth()+1,1);return{a:a.getTime(),b:b.getTime(),days:Math.round((b-a)/864e5)}}
const isRestN=n=>/^me merezco un descanso$/i.test(n);
function union(iv){iv=iv.filter(x=>x.e>x.s).sort((p,q)=>p.s-q.s);const out=[];iv.forEach(x=>{const l=out[out.length-1];if(l&&x.s<=l.e)l.e=Math.max(l.e,x.e);else out.push({...x})});return out}
function clip(iv,a,b){return iv.map(x=>({s:Math.max(x.s,a),e:Math.min(x.e,b)})).filter(x=>x.e>x.s)}
function sumMin(iv){return iv.reduce((p,x)=>p+(x.e-x.s),0)/60000}
function minus(A,B){const out=[];A.forEach(a=>{let segs=[{...a}];B.forEach(b=>{segs=segs.flatMap(x=>{if(b.e<=x.s||b.s>=x.e)return[x];const r=[];if(b.s>x.s)r.push({s:x.s,e:b.s});if(b.e<x.e)r.push({s:b.e,e:x.e});return r})});out.push(...segs)});return out}
function renderRep(){
  if(rpMode==='dia'){const k=shiftDay(dkey(new Date()),rpOff);$('rpLabel').textContent=dayName(k).replace(/^./,c=>c.toUpperCase());
    $('rpBody').innerHTML=(dayMetric(k)+dayGaps(k)+dayEst(k))||'<div class="empty">Sin registros este día</div>';return}
  const R=rpRange(),a0=new Date(R.a),b1=new Date(R.b-1);
  $('rpLabel').textContent=rpMode==='sem'?`${a0.getDate()} ${a0.toLocaleDateString('es-MX',{month:'short'})} – ${b1.getDate()} ${b1.toLocaleDateString('es-MX',{month:'short'})}`:a0.toLocaleDateString('es-MX',{month:'long',year:'numeric'});
  const ent=log.map((e,i)=>({...e,i,sg:segsOf(e)})).filter(e=>e.sg.length&&e.sg[0].s>=R.a&&e.sg[0].s<R.b);
  const actIv=[],restIv=[];
  log.forEach(e=>segsOf(e).forEach(x=>(isRestN(e.n)?restIv:actIv).push(x)));
  openWork().forEach(w=>w.segs.forEach(x=>(isRestN(w.n)?restIv:actIv).push(x)));
  const act=ent.filter(e=>!isRestN(e.n));
  // ---- resumen
  const actU=union(clip(actIv,R.a,R.b)),totAct=sumMin(actU);
  const done=act.filter(e=>e.ok),wp=done.filter(e=>e.plan>0);
  const devs=wp.map(e=>(e.real-e.plan)/e.plan*100),within=devs.filter(d=>Math.abs(d)<=10).length;
  const avgDev=devs.length?devs.reduce((p,q)=>p+q,0)/devs.length:null;
  const byN={};act.forEach(e=>{const k=e.n.trim();byN[k]=(byN[k]||0)+e.real});
  
  let h=rangeCharts(R);
  h+=paretoTime(byN)+frenosPareto(R)+imrCharts(R);
  // ---- uso del día
  h+=`<h3>⏳ Uso de tu día hábil <small>(5:00 am – 11:00 pm, 18 h)</small></h3>`+dayUse(R,actIv,restIv);
  $('rpBody').innerHTML=(typeof baseReport==='function'?baseReport():'')+h;
}
function dayUse(R,actIv,restIv){
  const WIN=1080,now=Date.now();let tA=0,tR=0,tW=0,cols=[];
  for(let k=0;k<R.days;k++){const d=new Date(R.a);d.setDate(d.getDate()+k);const ws=new Date(d.getFullYear(),d.getMonth(),d.getDate(),5,0).getTime(),we=new Date(d.getFullYear(),d.getMonth(),d.getDate(),23,0).getTime();
    if(ws>now){cols.push({d,fut:true});continue}
    const end=Math.min(we,now),win=(end-ws)/60000;
    const A=union(clip(actIv,ws,end)),Rs=minus(union(clip(restIv,ws,end)),A);
    const a=sumMin(A),r=sumMin(Rs);if(a+r<1){cols.push({d,empty:true});continue}const g=Math.max(0,win-a-r);tA+=a;tR+=r;tW+=win;cols.push({d,a,r,g,win,today:end<we})}
  if(!tW)return'<div class="empty">No hay registros en este periodo.</div>';
  const nD=cols.filter(c=>c.a!=null).length;
  const pc=v=>{const x=v/tW*100;return x>0&&x<1?x.toFixed(1):Math.round(x)};
  const W=640,H=200,L=8,T=8,B=26,cw=(W-L*2)/R.days,bw=Math.max(4,cw-2);
  let svg=`<svg viewBox="0 0 ${W} ${H}" class="cc" role="img" aria-label="Uso del día hábil por día">`;
  cols.forEach((c,k)=>{const x=L+k*cw+(cw-bw)/2,ph=H-T-B;
    if(c.fut||c.empty){svg+=`<rect x="${x}" y="${T}" width="${bw}" height="${ph}" rx="3" fill="#1c1c1e"/>`}else{
      const fr=v=>v/WIN*ph;let y=T+ph;
      [[c.a,C_ACT],[c.r,C_REST],[c.g,C_GRAY]].forEach(([v,col])=>{if(v<=0)return;const hh=fr(v);y-=hh;svg+=`<rect x="${x}" y="${y+1}" width="${bw}" height="${Math.max(0,hh-2)}" rx="3" fill="${col}"/>`});
      svg+=`<rect x="${x-1}" y="${T}" width="${bw+2}" height="${ph}" fill="transparent" class="hit" onmouseenter="duShow(${k})" onclick="duShow(${k})"/>`}
    if(R.days<=7||k%5===0||k===R.days-1)svg+=`<text x="${x+bw/2}" y="${H-8}" text-anchor="middle" class="ax">${R.days<=7?c.d.toLocaleDateString('es-MX',{weekday:'short'}).slice(0,3):c.d.getDate()}</text>`});
  svg+='</svg>';window._du=cols;
  return`<div class="tiles three"><div class="tile"><span><i class="dot" style="background:${C_ACT}"></i>En actividades</span><b>${pc(tA)}%</b><small>${fmtMin(tA)}</small></div>
  <div class="tile"><span><i class="dot" style="background:${C_REST}"></i>Descanso</span><b>${pc(tR)}%</b><small>${fmtMin(tR)}</small></div>
  <div class="tile"><span><i class="dot" style="background:${C_GRAY}"></i>Sin rastrear</span><b>${pc(tW-tA-tR)}%</b><small>${fmtMin(tW-tA-tR)}</small></div></div>
  ${svg}<div id="duInfo" class="ccinfo"></div>
  <div class="ccnote">Calculado sobre ${nD} día${nD>1?'s':''} con registros (los días vacíos no cuentan). "Sin rastrear" es el tiempo de tu día hábil que no quedó en ninguna actividad: traslados, comidas, pendientes chicos o tiempo perdido. Mientras más chico, más claro tienes en qué se te va el día.</div>`;
}
function duShow(k){const c=(window._du||[])[k];if(!c||c.fut||c.empty)return;
  $('duInfo').innerHTML=`<b style="text-transform:capitalize">${c.d.toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'short'})}</b>${c.today?' (hasta ahora)':''}<br><span style="color:${C_ACT}">■</span> Actividades ${fmtMin(c.a)} · <span style="color:${C_REST}">■</span> Descanso ${fmtMin(c.r)} · <span style="color:#aaa">■</span> Sin rastrear ${fmtMin(c.g)}`}

/* Pareto de dónde se fue el tiempo: barras ordenadas de mayor a menor + línea de % acumulado (referencia 80%) */
function paretoTime(byN,o){o=o||{};let E=Object.entries(byN).filter(e=>e[1]>0).sort((p,q)=>q[1]-p[1]);if(!E.length)return'';
  if(E.length>10){const o=E.slice(9).reduce((t,e)=>t+e[1],0);E=E.slice(0,9).concat([['Otros',o]])}
  const T=E.reduce((t,e)=>t+e[1],0),mx=E[0][1],W=340,H=200,B=H-46,LW=26,RW=34,n=E.length,cw=(W-LW-RW)/n,X=i=>LW+cw*i+cw/2,Y=v=>B-v/mx*(B-10),Yp=p=>B-p/100*(B-10);
  let s=`<svg viewBox="0 0 ${W} ${H}" class="gsvg">`,acc=0;const pts=[];
  [0,25,50,75,100].forEach(p=>s+=`<line x1="${LW}" x2="${W-RW}" y1="${Yp(p)}" y2="${Yp(p)}" stroke="#2a2a2a"/><text x="${W-RW+4}" y="${Yp(p)+3}" fill="#777" font-size="9">${p}%</text>`);
  [0,.5,1].forEach(f=>s+=`<text x="${LW-4}" y="${Y(mx*f)+3}" fill="#777" font-size="9" text-anchor="end">${o.ax?o.ax(mx*f):Math.round(mx*f/60)+'h'}</text>`);
  s+=`<line x1="${LW}" x2="${W-RW}" y1="${Yp(80)}" y2="${Yp(80)}" stroke="#ff9f0a" stroke-dasharray="4 3"/>`;
  E.forEach(([nm,v],i)=>{const before=acc;acc+=v;const p=acc/T*100;pts.push([X(i),Yp(p)]);const vital=before/T<.8;
    s+=`<rect x="${X(i)-cw*.35}" y="${Y(v)}" width="${cw*.7}" height="${B-Y(v)}" fill="${vital?'#0a84ff':'#3a3a3c'}" rx="2"/>
    <text transform="translate(${X(i)+3},${B+6}) rotate(45)" fill="#bbb" font-size="9">${esc(nm.length>11?nm.slice(0,10)+'…':nm)}</text>`});
  s+=`<polyline points="${pts.map(p=>p.join(',')).join(' ')}" fill="none" stroke="#ff9f0a" stroke-width="2"/>`+pts.map(p=>`<circle cx="${p[0]}" cy="${p[1]}" r="2.5" fill="#ff9f0a"/>`).join('')+'</svg>';
  const k=E.findIndex((e,i)=>E.slice(0,i+1).reduce((t,x)=>t+x[1],0)/T>=.8)+1;
  return`<div class="dmet"><h4>${o.t||'📊 Dónde se fue tu tiempo <small>(Pareto)</small>'}</h4>${s}
  <div class="dmleg"><span><i class="rl"></i>${o.k?o.k(k):k+' actividad'+(k>1?'es':'')+' = 80% de tu tiempo'}</span><span><i style="background:#ff9f0a"></i>% acumulado</span></div></div>`}

/* Pareto de frenos (causas del aviso ¿qué te frena?) en el periodo */
function frenosPareto(R){const c={};notes.filter(n=>!n.del&&n.cause&&n.cause!=='Estoy descansando'&&n.ts>=R.a&&n.ts<R.b).forEach(n=>c[n.cause]=(c[n.cause]||0)+1);
  const N=Object.values(c).reduce((a,b)=>a+b,0);
  if(!N)return`<div class="dmet"><h4>🧊 Qué te frena <small>(Pareto)</small></h4><div class="muted" style="font-size:13px">Aún no hay frenos registrados en este periodo. Se llenan cuando contestas el aviso "¿Qué te está frenando?".</div></div>`;
  return paretoTime(c,{t:`🧊 Qué te frena <small>(Pareto · ${N} registro${N>1?'s':''})</small>`,ax:v=>Math.round(v),k:k=>`${k} causa${k>1?'s':''} = 80% de tus frenos`})}

/* Carta de control I-MR (individuales + rango móvil). Límites fijos con la línea base; si aún no hay 2 días, provisionales con el periodo */
function imrLimits(v){const mr=v.slice(1).map((x,i)=>Math.abs(x-v[i])),m=avg(v),r=mr.length?avg(mr):0;return{m,r,ucl:m+2.66*r,lcl:Math.max(0,m-2.66*r),mrU:3.267*r}}
function imrCharts(R){const D=[];for(let i=0;i<R.days;i++){const d=new Date(R.a);d.setDate(d.getDate()+i);const n=dayNums(dkey(d));if(n&&(n.A>0||n.planned>0)&&!n.live)D.push({d,n})}
  const B=baseDays().filter(x=>!x.live);
  const one=(lab,get,col)=>{const pts=D.map(x=>({d:x.d,v:get(x.n)})).filter(x=>x.v!=null);if(pts.length<2)return'';
    const bv=B.map(get).filter(v=>v!=null),prov=bv.length<2||B.length<BASE.n,L=imrLimits(bv.length>=2?bv:pts.map(p=>p.v));
    const W=340,H=150,T=10,Bt=H-20,LW=30,RW=34,n=pts.length,X=i=>LW+(n>1?i*(W-LW-RW)/(n-1):0),hi=Math.max(100,L.ucl+5,...pts.map(p=>p.v)),Y=v=>Bt-v/hi*(Bt-T);
    let s=`<svg viewBox="0 0 ${W} ${H}" class="gsvg">`;
    [[L.ucl,'LCS','#ff453a'],[L.m,'X̄','#aaa'],[L.lcl,'LCI','#ff453a']].forEach(([v,t,c])=>s+=`<line x1="${LW}" x2="${W-RW}" y1="${Y(v)}" y2="${Y(v)}" stroke="${c}" stroke-dasharray="${t==='X̄'?'':'4 3'}"/><text x="${W-RW+3}" y="${Y(v)+3}" fill="${c}" font-size="8">${t} ${Math.round(v)}</text>`);
    [0,50,100].forEach(v=>s+=`<text x="${LW-4}" y="${Y(v)+3}" fill="#777" font-size="9" text-anchor="end">${v}%</text>`);
    s+=`<polyline points="${pts.map((p,i)=>X(i)+','+Y(p.v)).join(' ')}" fill="none" stroke="${col}" stroke-width="1.5"/>`;
    pts.forEach((p,i)=>{const out=p.v>L.ucl||p.v<L.lcl;s+=`<circle cx="${X(i)}" cy="${Y(p.v)}" r="${out?4:3}" fill="${out?'#ff453a':col}"/>`;if(n<=14)s+=`<text x="${X(i)}" y="${H-6}" fill="#888" font-size="8" text-anchor="middle">${p.d.getDate()}</text>`});
    s+='</svg>';
    const mr=pts.slice(1).map((p,i)=>Math.abs(p.v-pts[i].v)),hm=Math.max(L.mrU+5,...mr,10),Hm=80,Bm=Hm-8,Ym=v=>Bm-v/hm*(Bm-6);
    let m=`<svg viewBox="0 0 ${W} ${Hm}" class="gsvg"><line x1="${LW}" x2="${W-RW}" y1="${Ym(L.mrU)}" y2="${Ym(L.mrU)}" stroke="#ff453a" stroke-dasharray="4 3"/><text x="${W-RW+3}" y="${Ym(L.mrU)+3}" fill="#ff453a" font-size="8">LCS ${Math.round(L.mrU)}</text>
      <line x1="${LW}" x2="${W-RW}" y1="${Ym(L.r)}" y2="${Ym(L.r)}" stroke="#aaa"/><text x="${W-RW+3}" y="${Ym(L.r)+3}" fill="#aaa" font-size="8">R̄ ${Math.round(L.r)}</text><text x="${LW-4}" y="${Ym(0)+3}" fill="#777" font-size="9" text-anchor="end">MR</text>
      <polyline points="${mr.map((v,i)=>X(i+1)+','+Ym(v)).join(' ')}" fill="none" stroke="#888" stroke-width="1.2"/>${mr.map((v,i)=>`<circle cx="${X(i+1)}" cy="${Ym(v)}" r="2.5" fill="${v>L.mrU?'#ff453a':'#888'}"/>`).join('')}</svg>`;
    const outN=pts.filter(p=>p.v>L.ucl||p.v<L.lcl).length;
    return`<div class="dmet"><h4>${lab} <small>(carta I-MR${prov?' · límites provisionales':' · límites de la línea base'})</small></h4>${s}${m}
      <div class="dmleg"><span>${outN?`🔴 ${outN} día${outN>1?'s':''} fuera de control`:'✅ Todo dentro de control'}</span><span>Variación (R̄): ${Math.round(L.r)} pts</span></div></div>`};
  return one('⚡ Eficiencia',n=>n.efi,'#34c759')+one('🎯 Efectividad',n=>n.efe,'#0a84ff')}
