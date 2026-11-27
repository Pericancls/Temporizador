/* Reportes: dónde se fue tu tiempo y uso del día hábil */

/* ===================== REPORTES ===================== */
const C_ACT='#2fb350',C_REST='#3b8ef5',C_GRAY='#6e6e73',C_BAD='#ff453a';
let rpMode='sem',rpOff=0;
function rpSet(m){rpMode=m;rpOff=0;$('rpW').classList.toggle('on',m==='sem');$('rpM').classList.toggle('on',m==='mes');renderRep()}
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
  const top=Object.entries(byN).sort((p,q)=>q[1]-p[1]).slice(0,6),topMax=top.length?top[0][1]:1;
  let h=`<div class="tiles">
    <div class="tile"><span>Tiempo en actividades</span><b>${fmtMin(totAct)}</b></div>
    <div class="tile"><span>Terminadas</span><b>${done.length}</b></div>
    <div class="tile"><span>Dentro de ±10% de lo estimado</span><b>${devs.length?Math.round(within/devs.length*100)+'%':'—'}</b></div>
    <div class="tile"><span>Desviación promedio</span><b class="${avgDev>10?'over':avgDev<-10?'under':''}">${avgDev==null?'—':(avgDev>0?'+':'')+Math.round(avgDev)+'%'}</b></div></div>`;
  if(top.length)h+=`<h3>Dónde se fue tu tiempo</h3><div class="hbars">${top.map(([n,v])=>`<div class="hb"><span class="hn">${esc(n)}</span><div class="ht"><i style="width:${Math.max(2,v/topMax*100)}%"></i></div><span class="hv">${fmtMin(v)}</span></div>`).join('')}</div>`;
  // ---- uso del día
  h+=`<h3>⏳ Uso de tu día hábil <small>(5:00 am – 11:00 pm, 18 h)</small></h3>`+dayUse(R,actIv,restIv);
  $('rpBody').innerHTML=(typeof baseReport==='function'?baseReport():'')+h+(typeof clkReport==='function'?clkReport():'');
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
