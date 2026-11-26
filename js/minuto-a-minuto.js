/* Minuto a minuto: proyección del día (huecos, hora fija, candado, traslado) y botón MM en iPhone/iPad */

/* ===== Vista de computadora: tu día proyectado ===== */
const isDesk=()=>matchMedia('(min-width:1100px) and (pointer:fine)').matches;
function renderPrev(){placePrev();const box=$('dayPrev');if(!box||!(isDesk()||mmOn))return;
  const today=dkey(new Date()),isToday=planDay===today,now=new Date();now.setSeconds(0,0);
  const d5=(()=>{const d=kDate(planDay);d.setHours(5,0,0,0);return d.getTime()})(),liveNow=isToday&&$('run').classList.contains('on');
  let t0=isToday?(liveNow?now.getTime():Math.max(now.getTime(),d5)):d5;const atNow=isToday&&t0===now.getTime();
  const live=isToday&&$('run').classList.contains('on'),blocks=[];let t=t0;
  const push=(n,min,cls,a)=>{if(min<=0&&cls==='brk')return;const st=t;t+=Math.max(min,0)*60000;blocks.push({n,st,en:t,cls,a})};
  let skip=null;
  if(live){
    if(inBreak){push('Descanso',remain/60,'brk')}
    else if(cur&&cur.rest){push('Descanso',remain/60,'brk')}
    else if(cur){skip=cur.id;push(cur.n,inOver?0:remain/60,'cur',acts.find(x=>x.id===cur.id))}
  }
  const pend=acts.filter(a=>!a.done&&a.id!==skip&&!(a.quick&&!a.prog));
  const durOf=a=>(a.prog?Math.max(0,a.prog.rem)/60:a.m)*60000;
  const fixAt=a=>{if(!a.t)return null;const [hh,mm]=a.t.split(':').map(Number),d=kDate(planDay);d.setHours(hh,mm,0,0);const st=d.getTime();return !a.prog&&st+durOf(a)>t0?st:null};
  const fixed=[],flex=[];
  pend.forEach(a=>{const fs=fixAt(a);if(fs!=null){if(a.tr&&fs>t0)fixed.push({n:'🚗 Traslado',st:fs-a.tr*60000,en:fs,cls:'fix trv',a:{n:'Traslado',lk:true}});fixed.push({n:a.n,st:fs,en:fs+durOf(a),cls:'fix',a})}else flex.push(a)});
  fixed.sort((p,q)=>p.st-q.st);
  // las flexibles se acomodan en los huecos libres y se brincan los bloques con hora fija
  const B=brk*60000,fitAt=(s,dur)=>{for(let g=0;g<60;g++){const hit=fixed.find(f=>s<f.en&&s+dur>f.st);if(!hit)return s;s=hit.en+B}return s};
  const addB=(n,st,en,cls,a)=>{if(en<=st&&cls==='brk')return;blocks.push({n,st,en,cls,a})};
  flex.forEach(a=>{const dur=durOf(a),needB=blocks.length&&blocks[blocks.length-1].cls!=='brk',s0=t+(needB?B:0),s=fitAt(s0,dur);
    if(s===s0){if(needB)addB('Descanso',t,s0,'brk')}else addB('Descanso',s-B,s,'brk');
    addB(a.n,s,s+dur,a.prog?'pau':'',a);t=s+dur});
  const flowEnd=t;fixed.forEach(f=>{blocks.push(f);if(f.en>t)t=f.en});
  const clash=[],seen=new Set();fixed.forEach(f=>blocks.forEach(b=>{if(b!==f&&b.cls!=='brk'&&b.st<f.en&&b.en>f.st&&(isLk(f.a)||isLk(b.a))){f.lkx=b.lkx=true;const k=[f.n,b.n].sort().join('|');if(!seen.has(k)){seen.add(k);clash.push(isLk(f.a)?[b.n,f.n]:[f.n,b.n])}}}));
  const mid=kDate(planDay);mid.setDate(mid.getDate()+1);mid.setHours(0,0,0,0);const midT=mid.getTime();
  const tEnd=Math.max(t,midT),span=(tEnd-t0)/60000;
  const avail=Math.max(300,innerHeight-300),ppm=Math.max(0.6,Math.min(3,avail/Math.max(span,60)));
  const y=ts=>(ts-t0)/60000*ppm;
  let h='';
  for(let k=new Date(t0-1);;){k.setMinutes(0,0,0);k.setHours(k.getHours()+1);if(k.getTime()>tEnd)break;const kt=k.getTime(),isMid=kt===midT;
    h+=`<div class="dph${isMid?' mid':''}" style="top:${y(kt)}px"><span>${isMid?'12 am':fmt12(pad(k.getHours())+':00').replace(':00','')}</span></div>`}
  if(t>midT)h+=`<div class="dpnight" style="top:${y(midT)}px;height:${y(t)-y(midT)}px"></div>`;
  // acomodo en columnas cuando se enciman (como en un calendario)
  const vis=blocks.filter(b=>b.cls!=='brk').map(b=>{const top=Math.max(0,y(b.st));b.top=top;b.ht=Math.max(18,y(b.en)-top-2);return b}).sort((a,b)=>a.top-b.top||b.ht-a.ht);
  vis.sort((a,b)=>a.st-b.st||b.en-a.en);
  let grp=[],gEnd=-1;const flush=()=>{const cols=[];grp.forEach(b=>{let c=cols.findIndex(e=>e<=b.st);if(c<0){c=cols.length;cols.push(0)}cols[c]=b.en;b.col=c});grp.forEach(b=>b.ncol=cols.length);grp=[]};
  vis.forEach(b=>{if(grp.length&&b.st>=gEnd){flush();gEnd=-1}grp.push(b);gEnd=Math.max(gEnd,b.en)});flush();
  // que los bloques cortos no tapen al siguiente de su misma columna
  vis.forEach(b=>{const nx=vis.filter(o=>o!==b&&o.top>b.top&&o.st>=b.en&&(o.ncol>1||b.ncol>1?o.col===b.col:true)).reduce((m,o)=>Math.min(m,o.top),1e9);if(b.top+b.ht+2>nx)b.ht=Math.max(8,nx-b.top-2)});
  blocks.forEach(b=>{const top=b.cls==='brk'?y(b.st):b.top,ht=b.cls==='brk'?Math.max(3,y(b.en)-top):b.ht;
    const pos=b.cls==='brk'||!(b.ncol>1)?'':`left:calc(4px + (100% - 4px) * ${b.col} / ${b.ncol});right:auto;width:calc((100% - 4px) / ${b.ncol} - 3px);`;
    const hhmm=ts=>{const d=new Date(ts);return fmt12(pad(d.getHours())+':'+pad(d.getMinutes()))};
    if(b.cls==='brk'){h+=`<div class="dpb brk" style="top:${top}px;height:${ht}px" title="${b.n} ${hhmm(b.st)}–${hhmm(b.en)}">${ht>=14?'☕ '+fmtMin((b.en-b.st)/60000):''}</div>`;return}
    let late='';if(b.cls==='fix')late='';else if(b.a&&b.a.t){const [hh,mm]=b.a.t.split(':').map(Number),d=kDate(planDay);d.setHours(hh,mm,0,0);const diff=Math.round((b.st-d.getTime())/60000);
      late=diff>5?` <span class="late">⏰ ${fmt12(b.a.t)} · llegarías ${fmtMin(diff)} tarde</span>`:diff<-5?(b.a.prog?'':` <span class="early">⏰ es a las ${fmt12(b.a.t)} · aquí irías ${fmtMin(-diff)} antes</span>`):` <span class="tm">⏰ ${fmt12(b.a.t)}</span>`}
    const tiny=ht<34,min=(b.en-b.st)/60000;
    const lkI=isLk(b.a)&&b.cls!=='fix trv'?'🔒 ':'';h+=`<div class="dpb ${b.cls}${/traslado/i.test(b.n)&&!/trv/.test(b.cls)?' trv':''}${b.lkx?' lkx':''}${tiny?' tiny':''}${b.ncol>1?' narrow':''}" style="top:${top}px;height:${ht}px;${pos}" title="${esc(b.n)} · ${hhmm(b.st)}–${hhmm(b.en)}">${tiny?`<b>${lkI}${esc(b.n)}</b><span class="tm">${hhmm(b.st)}</span>${late}`:`<div class="tm">${hhmm(b.st)}–${hhmm(b.en)} · ${b.cls==='cur'?(inOver?'en tiempo extra':'en curso'):fmtMin(min)}</div><b>${lkI}${b.a&&b.a.rid?'🔁 ':''}${esc(b.n)}</b>${late?'<div>'+late+'</div>':''}`}</div>`});
  const endD=new Date(t),endTxt=fmt12(pad(endD.getHours())+':'+pad(endD.getMinutes()));
  const clTxt=clash.length?`<div class="late" style="color:#ff6961;font-size:13px;margin-top:4px">⚠️ ${clash.slice(0,3).map(c=>esc(c[0])+' choca con 🔒 '+esc(c[1])).join('; ')}${clash.length>3?'…':''}</div>`:'';
  const foot=(!blocks.length?'<div class="muted">No hay actividades pendientes.</div>':
    t>midT?`Terminarías <b>${endD.getHours()<5?'en la madrugada':'el día siguiente'}</b> a las <b>${endTxt}</b><div class="muted">Te pasas ${fmtMin((t-midT)/60000)} de la medianoche.</div>`:
    `Terminarías a las <b>${endTxt}</b><div class="muted">Te quedan ${fmtMin((midT-t)/60000)} libres antes de la medianoche.</div>`)+clTxt;
  const sc=box.querySelector('.dpscroll'),st=sc?sc.scrollTop:0;
  const qk=acts.map((a,i)=>({a,i})).filter(o=>o.a.quick&&!o.a.prog&&!o.a.done);
  box.innerHTML=`<h3>🕒 Minuto a minuto</h3>${qk.length?`<div class="dpq">${qk.map(o=>`<div class="dpqc" title="${esc(o.a.n)}"><button onclick="toggleDone(${o.i})" title="Marcar como hecha"></button><span>⚡ ${esc(o.a.n)}</span></div>`).join('')}</div>`:'<div style="height:8px"></div>'}
    <div class="dpscroll"><div class="dptl" style="height:${y(tEnd)+12}px">${atNow?'<div class="dpnow"><span>Ahora</span></div>':''}${h}</div></div><div class="dpfoot">${foot}</div>`;
  const sc2=box.querySelector('.dpscroll');if(sc2)sc2.scrollTop=st}
setInterval(()=>{if($('s1').classList.contains('on'))renderPrev()},20000);
window.addEventListener('resize',()=>{if($('s1').classList.contains('on'))renderPrev()});


/* ===== Minuto a minuto en iPhone/iPad (botón MM) ===== */
let mmOn=(()=>{try{return localStorage.getItem('mmOn')==='1'}catch(e){return false}})();
function mmToggle(){mmOn=!mmOn;try{localStorage.setItem('mmOn',mmOn?'1':'0')}catch(e){}render()}
function placePrev(){const p=$('dayPrev'),L=$('list');if(!p||!L)return;const desk=isDesk();
  if(desk){if(p.parentElement!==$('s1'))$('s1').appendChild(p);p.classList.remove('mmshow')}
  else{if(mmOn){if(p.nextElementSibling!==L)L.parentElement.insertBefore(p,L);p.classList.add('mmshow')}else p.classList.remove('mmshow')}
  const b=$('mmBtn');if(b)b.classList.toggle('on',mmOn)}
window.addEventListener('resize',placePrev);
