/* Actividades: lista del día, agregar/editar, hora de inicio, mover de día, aviso 30 min antes, reordenar, reset ↺ y tiempo en vivo en la fila */

/* ---- Plan ---- */
function render(){
  materialize(planDay);wkClean();
  {const qk=a=>a.quick&&!a.prog;if(acts.some((a,i)=>i>0&&qk(a)&&!qk(acts[i-1]))){const o=[...acts.filter(qk),...acts.filter(a=>!qk(a))];acts.splice(0,acts.length,...o);store('acts',acts)}}
  acts.forEach(a=>{if(!a.id)a.id=uid()});
  const ncnt={};notes.forEach(n=>{if(!n.del&&n.act)ncnt[n.act]=(ncnt[n.act]||0)+1});
  const nDone=acts.filter(a=>a.done).length,hb=$('hideBtn');if(hb){hb.innerHTML=hideDone?`👁<span class="lg"> Mostrar terminadas</span>${nDone?' ('+nDone+')':''}`:'<svg class="eyec" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M3 10c2.5 3.5 5.5 5 9 5s6.5-1.5 9-5"/><path d="M6.5 13.6 5 16M12 15v2.8M17.5 13.6 19 16"/></svg><span class="lg"> Ocultar terminadas</span>';hb.title=hideDone?'Mostrar terminadas':'Ocultar terminadas';hb.classList.toggle('on',hideDone)}
  $('list').innerHTML=acts.length?acts.map((a,i)=>hideDone&&a.done?'':`<li data-i="${i}" class="${a.done?'done':''}"><button class="chk" onclick="toggleDone(${i})">${a.done?'✓':''}</button><span class="ncol"><span class="n">${a.rid?'<span class="rico">🔁</span>':''}${esc(a.n)}</span><span class="lkcol">${a.t&&!a.done?`<button class="lkb${isLk(a)?' on':''}" onclick="toggleLock(${i})" title="${isLk(a)?'No se puede traslapar':'Se puede traslapar'}">${isLk(a)?'🔒':'🔓'}</button><button class="lkb trb${a.tr?' on':''}" onclick="toggleTr(${i})" title="${a.tr?'Sales '+a.tr+' min antes':'Agregar 30 min de traslado antes'}">🚗</button>`:''}<button class="ntb${ncnt[a.n]?' has':''}" onclick="notesOpen(${i})" title="Notas">📝${ncnt[a.n]?`<i>${ncnt[a.n]}</i>`:''}</button></span></span>${liveFor(a)}<span class="tcol">${a.prog&&!a.done?`${progFrac(a,i)}`:`<span class="t${a.quick?' quick':''}" onclick="${a.done?'':`editT(${i})`}">${a.quick?'⚡ <5 min':a.m+' min'}</span>`}<span class="tcrow">${a.done||(a.quick&&!a.prog)?'':`<span class="tchip tc2${a.t?'':' none'}" onclick="editTime(${i})">${a.t?fmt12(a.t):'🕒'}</span>`}</span></span>${a.prog&&!a.done?`<button class="rstb r2" onclick="resetLast(${i})" title="Borrar el último bloque">↺</button>`:''}${a.done||(a.quick&&!a.prog)||liveKind(a)?'':`<button class="playb${a.prog?' paused':''}" onclick="resumeItem(${i})" aria-label="Iniciar"><svg viewBox="0 0 24 24"><path d="M7 4v16l13-8z"/></svg></button>`}<button class="delb" onclick="del(${i})">✕</button></li>`).join('')+(hideDone&&nDone===acts.length?'<div class="empty">Todo lo de este día está terminado 🎉</div>':''):'<div class="empty">Agrega tus actividades</div>';
  const dn=dayName(planDay),[py,pm,pd]=planDay.split('-').map(Number);
  $('planTitle').textContent=/^(hoy|mañana|pasado mañana|ayer)$/.test(dn)?'Plan de '+dn:'Plan del '+dn;
  $('planDate').textContent=new Date(py,pm-1,pd).toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'});
  $('planPick').value=planDay;$('brkMin').value=brk;
  const nT=acts.filter(a=>a.t&&!a.done).length;
  $('calBox').innerHTML=nT?`<button class="calbtn" onclick="toCalendar()">📅 Agregar ${nT>1?`las ${nT} programadas`:'la programada'} a mi Calendario</button><div class="muted" style="font-size:13px;text-align:center">Con alerta 30 min antes, aunque la app esté cerrada.</div>`:'';
  $('copyBox').innerHTML=acts.length?`<div class="copyrow"><button onclick="copyPlan(1)">${acts.some(a=>a.done)?'Copiar pendientes al día siguiente':'Copiar al día siguiente'}</button><button onclick="clearPlan()">Vaciar este día</button></div>`:'';
  const pend=acts.filter(a=>!a.done),t=pend.reduce((s,a)=>s+(a.prog?Math.max(0,a.prog.rem)/60:a.m),0),nd=acts.length-pend.length;
  $('total').textContent=!acts.length?'':nd?`✓ ${nd} de ${acts.length} hechas · Pendiente: ${fmtMin(t)}`:(acts.some(a=>a.prog)?'Pendiente: ':'Total planeado: ')+fmtMin(t);
  const names=[...new Set(log.map(e=>e.n))];
  $('known').innerHTML=names.map(n=>`<option value="${esc(n)}">`).join('');
  renderPrev();renderBl();drawMcal();
}
$('aName').addEventListener('input',()=>{
  const s=stats()[$('aName').value.trim().toLowerCase()];
  if(s){$('hint').textContent=`Histórico: promedio real ${fmtMin(s.avg)} (${s.c} veces) · sin minutos = tarea rápida`}
  else $('hint').textContent='';
});
function add(){const n=$('aName').value.trim();let m=parseFloat($('aMin').value);if(!n)return;const tm=$('aTime').value;if(!(m>0)&&tm)m=30;const q=!(m>0);const nid=uid();acts.push({n,m:q?5:m,id:nid,...(q?{quick:true}:{}),...(tm&&!q?{t:tm}:{})});if(tm&&!q)setTimeout(()=>calAsk(planDay,nid),50);$('aName').value='';$('aMin').value='';$('aTime').value='';$('hint').textContent='';store('acts',acts);render()}
function uid(){return Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function toggleDone(i){const a=acts[i];if(!a)return;if(!a.done&&$('run').classList.contains('on')&&cur&&cur.id===a.id&&!isRest()){restoreRunView();return finish()}
  if(a.done){a.done=false;if(a.cid){log=log.filter(e=>e.cid!==a.cid);delete a.cid;store('log',log)}store('acts',acts);render();return}
  if(a.quick&&!a.prog){const e=Date.now(),st=e-5*60000,sd=new Date(st),cid=a.id+'|'+e;
    log.push({d:dkey(sd),h:pad(sd.getHours())+':'+pad(sd.getMinutes()),n:a.n,plan:5,real:5,ext:[],ok:true,quick:true,segs:[{s:st,e}],cid});
    a.done=true;a.cid=cid;store('log',log);store('acts',acts);render();toast(`⚡ Hecha: ${esc(a.n)} · ${hm(e)}`);return}
  const pr=a.prog,now=Date.now(),real=pr?Math.max(1,Math.round(pr.el/60)):a.m,st=pr&&pr.st?pr.st:now-real*60000,x=new Date(st);
  modal(`<h1>✓ Terminar actividad</h1><div class="muted">${esc(a.n)}</div>
  <div class="row" style="margin:0;gap:10px"><div style="flex:1"><label>Hora de inicio</label><input id="qdH" type="time" value="${pad(x.getHours())}:${pad(x.getMinutes())}"></div>
  <div style="flex:1"><label>Hora de terminación</label><input id="qdE" type="time"></div></div>
  <label>Tiempo real (min)</label><input id="qdR" type="number" inputmode="decimal" value="${real}" style="width:100%">
  <div class="muted" style="font-size:13px;margin-top:6px">Planeado: ${fmtMin(a.m)}. Se guarda en tu registro.</div>
  <div class="row"><button class="btn gray" onclick="closeModal()">Cancelar</button><button class="btn" style="background:#34c759" onclick="quickDone(${i},'${pad(x.getHours())}:${pad(x.getMinutes())}',${real})">✓ Terminada</button></div>
  <button class="linkbtn" style="padding:10px 0 0;color:#888" onclick="closeModal();acts[${i}].done=true;delete acts[${i}].prog;store('acts',acts);render()">Solo marcar, sin registrar</button>`);
  qdSync('r');$('qdH').addEventListener('input',()=>qdSync('r'));$('qdR').addEventListener('input',()=>qdSync('r'));$('qdE').addEventListener('input',()=>qdSync('e'))}
/* Inicio + tiempo real ⇄ hora de terminación */
function qdSync(src){const h=$('qdH').value;if(!h)return;const [hh,mi]=h.split(':').map(Number),st=hh*60+mi;
  if(src==='e'){const e=$('qdE').value;if(!e)return;const [eh,em]=e.split(':').map(Number);let d=eh*60+em-st;if(d<=0)d+=1440;$('qdR').value=d;$('qdR').style.borderColor=''}
  else{const r=parseFloat($('qdR').value);if(!(r>0))return;const t=Math.round(st+r)%1440;$('qdE').value=pad(Math.floor(t/60))+':'+pad(t%60)}}
function quickDone(i,h0,r0){const a=acts[i];if(!a)return closeModal();
  const h=$('qdH').value||h0,r=parseFloat($('qdR').value);if(!(r>0)){$('qdR').style.borderColor='#ff3b30';return}
  const pr=a.prog,t=new Date(),[hh,mi]=h.split(':').map(Number);let st=new Date(t.getFullYear(),t.getMonth(),t.getDate(),hh,mi).getTime();
  if(st>Date.now())st-=864e5;
  let segs=[{s:st,e:st+r*60000}];
  if(pr&&h===h0&&r===r0){const sg=normSegs(pr.segs).filter(x=>x.e!=null);if(sg.length)segs=sg}
  const sd=new Date(segs[0].s),cid=a.id+'|'+Date.now();
  log.push({d:dkey(sd),h:pad(sd.getHours())+':'+pad(sd.getMinutes()),n:a.n,plan:a.m,real:r,ext:pr?(pr.ext||[]):[],ok:true,segs,cid});
  a.done=true;a.cid=cid;delete a.prog;store('log',log);store('acts',acts);closeModal();render();
  toast(`Guardada en tu registro: ${esc(a.n)} · ${fmtMin(r)}`)}
function markDone(id){let hit=false;Object.values(plans).forEach(l=>l.forEach(a=>{if(a.id===id){a.done=true;delete a.prog;hit=true}}));if(hit){store('plans',plans);render()}}
function copyPlan(n){const k=shiftDay(planDay,n),src=acts.filter(a=>!a.done),cp=src.map(a=>({n:a.n,m:a.m,id:uid(),...(a.prog?{prog:a.prog}:{})}));plans[k]=(plans[k]||[]).concat(cp);store('plans',plans);
  modal(`<h1>Copiado ✅</h1><div class="muted">Se agregaron ${cp.length} actividades al plan de ${dayName(k)}.</div><div class="row"><button class="btn gray" onclick="closeModal()">Quedarme aquí</button><button class="btn" onclick="closeModal();setPlanDay('${k}');render()">Ir a ${dayName(k)}</button></div>`)}
function clearPlan(){modal(`<h1>¿Vaciar el plan?</h1><div class="muted">Se borran las actividades del plan de ${dayName(planDay)}. Tu registro no se toca.</div><div class="row"><button class="btn gray" onclick="closeModal()">Cancelar</button><button class="btn red" onclick="closeModal();acts=[];store('acts',acts);render()">Vaciar</button></div>`)}
/* ---- Mover una actividad a otro día (deslizando) ---- */
let lastMove=null,toastT=null;
function sendTo(i,k){const a=acts[i];if(!a||k===planDay)return;const from=planDay;if(a.rid&&(a.rk||from)===from)recSkip(a.rid,from);
  acts.splice(i,1);store('acts',acts);plans[k]=(plans[k]||[]).concat(a);store('plans',plans);render();
  lastMove={a,i,from,k};toast(`Movida a ${dayName(k)}: ${esc(a.n)}`,'Deshacer','undoMove()')}
function undoMove(){const m=lastMove;if(!m)return;lastMove=null;plans[m.k]=(plans[m.k]||[]).filter(x=>x!==m.a&&x.id!==m.a.id);
  plans[m.from]=plans[m.from]||[];plans[m.from].splice(Math.min(m.i,plans[m.from].length),0,m.a);store('plans',plans);setPlanDay(planDay);render();hideToast()}
function pickDayFor(i){const a=acts[i];if(!a)return;const t=dkey(new Date());
  const opts=[t,shiftDay(t,1),shiftDay(t,2)].filter(k=>k!==planDay);
  modal(`<h1>¿A qué día?</h1><div class="muted">${esc(a.n)}</div>
  <div class="picklist">${opts.map(k=>`<button onclick="closeModal();sendTo(${i},'${k}')"><span style="text-transform:capitalize">${dayName(k)}</span><span class="muted">${(()=>{const [y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d).toLocaleDateString('es-MX',{weekday:'short',day:'numeric',month:'short'})})()}</span></button>`).join('')}</div>
  ${isDesk()?`<button class="calbtn" style="margin-top:8px" onclick="closeModal();toBacklog(${i})">📥 Mandar al Backlog</button>`:''}
  <label>Otra fecha</label><input type="date" id="pkD" value="${shiftDay(planDay,1)}">
  <div class="row"><button class="btn gray" onclick="closeModal()">Cancelar</button><button class="btn" onclick="const v=$('pkD').value;if(v){closeModal();sendTo(${i},v)}">Mover</button></div>`)}
function toast(msg,btn,fn,ms){let t=$('toast');if(!t){t=document.createElement('div');t.id='toast';document.body.appendChild(t)}
  t.innerHTML=`<span>${msg}</span>${btn?`<button onclick="${fn}">${btn}</button>`:''}`;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(hideToast,ms||5000)}
function hideToast(){const t=$('toast');if(t)t.classList.remove('on')}
function progFrac(a,i){const el=Math.round(a.prog.el/60),tot=Math.round((a.prog.tot||a.m*60)/60),ov=a.prog.el>(a.prog.tot||a.m*60)+30;
  return`<span class="t tprog${ov?' over':''}" onclick="editT(${i})" title="Llevas ${el} de ${tot} min">${el}/${tot} min</span>`}
function isLk(a){return a&&(a.lk!=null?!!a.lk:/traslado/i.test(a.n||''))}
function toggleLock(i){const a=acts[i];if(!a)return;a.lk=!isLk(a);if(a.rid){const r=recs.find(x=>x.id===a.rid);if(r){r.lk=a.lk;store('recs',recs)}}store('acts',acts);render();toast(a.lk?'🔒 '+a.n+' no se puede traslapar':'🔓 '+a.n+' ya se puede traslapar')}
function toggleTr(i){const a=acts[i];if(!a)return;a.tr=a.tr?0:30;if(a.tr)a.lk=true;if(a.rid){const r=recs.find(x=>x.id===a.rid);if(r){r.tr=a.tr;if(a.tr)r.lk=true;store('recs',recs)}}store('acts',acts);render();
  if(a.tr&&a.t){const [h,m]=a.t.split(':').map(Number),x=((h*60+m-a.tr)%1440+1440)%1440;toast('🚗 Sales a las '+fmt12(pad(Math.floor(x/60))+':'+pad(x%60))+' · 30 min de traslado')}else toast(a.tr?'🚗 30 min de traslado':'🚗 Sin traslado')}
function del(i){const a=acts[i];if(a&&a.rid)recSkip(a.rid,a.rk||planDay);acts.splice(i,1);store('acts',acts);render()}
function fmt12(t){let [h,m]=t.split(':').map(Number);const ap=h>=12?'pm':'am';h=h%12||12;return h+':'+pad(m)+' '+ap}
function editTime(i){editAct(i,'t')}
function editAct(i,focus){const a=acts[i];
  modal(`<h1>Editar actividad</h1>
  <label>Actividad</label><input id="eN" value="${esc(a.n)}">
  <div class="row" style="margin:0;gap:10px"><div style="flex:1"><label>Tiempo (min)</label><input id="eM" type="number" inputmode="decimal" value="${a.m}"></div>
  <div style="flex:1"><label>⏰ Hora (opcional)</label><input id="eT" type="time" value="${a.t||''}"></div></div>
  ${a.t?`<button class="linkbtn" style="padding:8px 0;color:#ff453a" onclick="$('eT').value=''">Quitar hora</button>`:''}
  <div class="row"><button class="btn gray" onclick="closeModal()">Cancelar</button><button class="btn" onclick="saveEdit(${i})">✓ Aceptar</button></div>`);
  setTimeout(()=>{const e=$(focus==='t'?'eT':'eM');if(e&&focus!=='t'){e.focus();e.select&&e.select()}},60);
}
function saveEdit(i){const a=acts[i];if(!a)return closeModal();
  const n=$('eN').value.trim(),m=parseFloat($('eM').value),t=$('eT').value;
  if(!n){$('eN').style.borderColor='#ff3b30';return}if(!(m>0)){$('eM').style.borderColor='#ff3b30';return}
  if(a.quick&&m!==a.m)delete a.quick;a.n=n;a.m=m;if(t){if(a.t!==t)delete a.warned30;a.t=t}else delete a.t;
  store('acts',acts);closeModal();render()}
function toCalendar(){const ev=acts.filter(a=>a.t&&!a.done);if(!ev.length)return;calExport(ev.map(a=>({a,k:planDay})),'actividades-'+planDay)}
function calOne(k,id){hideToast();const a=(plans[k]||[]).find(x=>x.id===id);if(!a||!a.t)return;calExport([{a,k}],a.n.replace(/[^\wáéíóúñÁÉÍÓÚÑ -]/g,'').slice(0,40)||'actividad')}
function calAsk(k,id){const a=(plans[k]||[]).find(x=>x.id===id);if(!a||!a.t)return;toast(`📅 ¿Agrego "${esc(a.n)}" a tu Calendario?`,'Sí, agregar',`calOne('${k}','${id}')`,10000)}
const ICD=['MO','TU','WE','TH','FR','SA','SU'];
function recCal(id){hideToast();const r=recs.find(x=>x.id===id);if(!r||!r.start)return;
  let k=r.from,first=null;for(let i=0;i<400&&k<=r.until;i++){if(occurs(r,k)){first=k;break}k=shiftDay(k,1)}if(!first)return;
  let rule;if(r.type==='week')rule='FREQ=WEEKLY;BYDAY='+(r.days||[]).map(d=>ICD[d]).join(',');
  else if(r.type==='monthday')rule='FREQ=MONTHLY;'+(r.md<=28?'BYMONTHDAY='+r.md:'BYMONTHDAY='+Array.from({length:r.md-27},(_,i)=>28+i).join(',')+';BYSETPOS=-1');
  else rule='FREQ=MONTHLY;BYDAY='+ICD[r.wd]+';BYSETPOS='+r.nth;
  rule+=';UNTIL='+r.until.replace(/-/g,'')+'T235959';
  const a={id:r.id,n:r.n,t:r.start,m:recDur(r)};const ex=(r.skip||[]).filter(x=>x>=first);
  calExport([{a,k:first,rule,ex}],r.n.replace(/[^\wáéíóúñÁÉÍÓÚÑ -]/g,'').slice(0,40)||'actividad')}
function calExport(items,fname){
  const stamp0=new Date(),stamp=stamp0.getUTCFullYear()+pad(stamp0.getUTCMonth()+1)+pad(stamp0.getUTCDate())+'T'+pad(stamp0.getUTCHours())+pad(stamp0.getUTCMinutes())+'00Z';
  const L0=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Temporizador//ES','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
  const esc3=x=>String(x).replace(/[\\,;]/g,c=>'\\'+c);
  items.forEach(({a,k,rule,ex})=>{const d=k.replace(/-/g,''),st=(t,add)=>{const [y,mo,da]=k.split('-').map(Number),[h,m]=t.split(':').map(Number);const x=new Date(y,mo-1,da,h,m+(add||0));return x.getFullYear()+pad(x.getMonth()+1)+pad(x.getDate())+'T'+pad(x.getHours())+pad(x.getMinutes())+'00'};
    L0.push('BEGIN:VEVENT','UID:'+a.id+'-'+d+'@temporizador','DTSTAMP:'+stamp,'DTSTART:'+st(a.t),'DTEND:'+st(a.t,a.m),...(rule?['RRULE:'+rule]:[]),...((ex||[]).length?['EXDATE:'+ex.map(x=>{const [hh,mm]=a.t.split(':');return x.replace(/-/g,'')+'T'+hh+mm+'00'}).join(',')]:[]),'SUMMARY:'+esc3(a.n),'BEGIN:VALARM','ACTION:DISPLAY','DESCRIPTION:'+esc3(a.n),'TRIGGER:-PT30M','END:VALARM','END:VEVENT')});
  L0.push('END:VCALENDAR');calDownload(L0,fname)}
function calDownload(L,fname){
  const blob=new Blob([L.join('\r\n')],{type:'text/calendar'}),name=fname+'.ics';
  try{const f=new File([blob],name,{type:'text/calendar'});if(/iPhone|iPad|Macintosh/.test(navigator.userAgent)&&'ontouchend' in document){location.href=URL.createObjectURL(f);return}}catch(e){}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove()}
/* ---- Aviso 30 min antes de una actividad programada ---- */
let lastSched=0;
function checkSched(){
  const now=Date.now();if(now-lastSched<10000)return;lastSched=now;
  if($('modal').classList.contains('on'))return;
  const tk=dkey(new Date()),list=plans[tk]||[];
  for(const a of list){
    if(!a.t||a.done||a.warned30||(cur&&cur.id===a.id))continue;
    const [h,m]=a.t.split(':').map(Number),d=new Date();d.setHours(h,m,0,0);
    const mins=(d.getTime()-now)/60000;
    if(mins<=30&&mins>-5){
      a.warned30=true;store('plans',plans);
      const txt=mins>1?`en ${Math.round(mins)} minutos`:'ahora';
      beep();say(`Atención. ${txt.charAt(0).toUpperCase()+txt.slice(1)} tienes: ${a.n}`);
      modal(`<h1>⏰ Siguiente actividad</h1><div style="font-size:22px;font-weight:700;margin-top:10px">${esc(a.n)}</div><div class="muted" style="margin-top:6px">A las ${fmt12(a.t)} · ${txt}</div>
      <div class="row"><button class="btn" onclick="closeModal()">Entendido</button></div>`);
      return;
    }
  }
}
function editT(i){editAct(i,'m')}
/* Arrastrar para reordenar: mantén presionada la actividad y muévela */
(function(){
  const L=$('list');let holdT=null,drag=null,sx=0,sy=0,lastY=0,lastX=0,active=null,sw=null,isMouse=false;
  const swClear=()=>{L.querySelectorAll('.swh').forEach(h=>h.remove());if(sw){sw.li.style.transform='';sw.li.classList.remove('swiping')}sw=null};
  const startHold=(li,x,y)=>{sx=x;sy=y;lastY=y;lastX=x;active=li;clearTimeout(holdT);
    holdT=setTimeout(()=>{drag={li,from:+li.dataset.i,y0:y};li.classList.add('drag');try{navigator.vibrate&&navigator.vibrate(30)}catch(_){}},350)};
  const move=(x,y,ev)=>{if(!active)return;lastY=y;lastX=x;
    if(!drag){const dx=x-sx,dy=y-sy;
      if(!sw&&Math.abs(dx)>12&&Math.abs(dx)>Math.abs(dy)*1.5&&!active.classList.contains('done')){clearTimeout(holdT);
        sw={li:active,i:+active.dataset.i};const h=document.createElement('div');h.className='swh';h.style.top=active.offsetTop+'px';h.style.height=active.offsetHeight+'px';
        h.innerHTML=`<span class="swr">📅 ${planDay===dkey(new Date())?'Mañana':'Día siguiente'} ›</span><span class="swl">‹ 📥 Backlog</span>`;L.appendChild(h);active.classList.add('swiping')}
      if(sw){if(ev&&ev.cancelable)ev.preventDefault();sw.li.style.transform=`translateX(${dx}px)`;const h=L.querySelector('.swh');
        if(h){h.classList.toggle('r',dx>0);h.classList.toggle('l',dx<0);h.classList.toggle('go',Math.abs(dx)>90)}blHi(overBl(x,y));return}
      if(isMouse&&Math.abs(dy)>6&&Math.abs(dy)>Math.abs(dx)){clearTimeout(holdT);drag={li:active,from:+active.dataset.i,y0:sy};active.classList.add('drag')}
      else{if(Math.abs(dy)>8||Math.abs(dx)>8)clearTimeout(holdT);return}}
    {const dx=x-sx,dy=y-drag.y0;if(Math.abs(dx)>30&&Math.abs(dx)>Math.abs(dy)*1.5&&!drag.li.classList.contains('done')){const li=drag.li;drag=null;li.classList.remove('drag');li.style.transform='';
      L.querySelectorAll('li.over').forEach(o=>o.classList.remove('over'));active=li;return move(x,y,ev)}}
    if(ev&&ev.cancelable)ev.preventDefault();drag.li.style.transform=`translateY(${y-drag.y0}px)`;
    [...L.querySelectorAll('li')].forEach(o=>{if(o===drag.li)return;const r=o.getBoundingClientRect();o.classList.toggle('over',y>r.top&&y<r.bottom)})};
  const end=cancel=>{clearTimeout(holdT);active=null;
    if(sw){const dx=lastX-sx,i=sw.i;const ob=overBl(lastX,lastY);blHi(false);swClear();if(!cancel&&ob){toBacklog(i);return}if(!cancel){if(dx>90)sendTo(i,shiftDay(planDay,1));else if(dx<-90)toBacklog(i)}return}
    if(!drag)return;const d=drag;drag=null;
    L.querySelectorAll('li.over').forEach(o=>o.classList.remove('over'));
    if(cancel||Math.abs(lastY-d.y0)<10){d.li.classList.remove('drag');d.li.style.transform='';return}
    const items=[...L.querySelectorAll('li')].filter(o=>o!==d.li);let to=items.length;
    for(let k=0;k<items.length;k++){const r=items[k].getBoundingClientRect();if(lastY<r.top+r.height/2){to=k;break}}
    const ref=to<items.length?acts[+items[to].dataset.i]:null;const [a]=acts.splice(d.from,1);const j=ref?acts.indexOf(ref):acts.length;acts.splice(j<0?acts.length:j,0,a);store('acts',acts);render()};
  const ok=t=>{const li=t.closest&&t.closest('li');return li&&L.contains(li)&&!t.closest('button,input,.t,.tchip,.contb')?li:null};
  L.addEventListener('touchstart',e=>{isMouse=false;const li=ok(e.target);if(!li||e.touches.length>1)return;const t=e.touches[0];startHold(li,t.clientX,t.clientY)},{passive:true});
  L.addEventListener('touchmove',e=>{const t=e.touches[0];move(t.clientX,t.clientY,e)},{passive:false});
  L.addEventListener('touchend',()=>end(false));L.addEventListener('touchcancel',()=>end(true));
  L.addEventListener('mousedown',e=>{if(e.button!==0||isDesk())return;const li=ok(e.target);if(li){isMouse=true;e.preventDefault();startHold(li,e.clientX,e.clientY)}});
  L.addEventListener('dragstart',e=>e.preventDefault());
  window.addEventListener('mousemove',e=>move(e.clientX,e.clientY,e));window.addEventListener('mouseup',()=>end(false));
  L.addEventListener('contextmenu',e=>{if(e.target.closest('li'))e.preventDefault()});
})();
function mv(i,d){const j=i+d;if(j<0)return;[acts[i],acts[j]]=[acts[j],acts[i]];store('acts',acts);render()}
['aName','aMin','aTime'].forEach(x=>$(x).addEventListener('keydown',e=>{if(e.key==='Enter')add()}));
let hideDone=(()=>{try{return localStorage.getItem('hideDone')==='1'}catch(e){return false}})();
function toggleHideDone(){hideDone=!hideDone;try{localStorage.setItem('hideDone',hideDone?'1':'0')}catch(e){}render()}


/* ===== Reset: borra el último bloque de una actividad pausada ===== */
function resetLast(i){const a=acts[i];if(!a||!a.prog)return;const sn=snap(),p=a.prog;const segs=normSegs(p.segs||[]).filter(x=>x.e!=null);let msg;
  if(segs.length){const l=segs.pop(),d=(l.e-l.s)/1000;p.el=Math.max(0,(p.el||0)-d);p.rem=(p.rem||0)+d;p.segs=segs;msg=`↺ Borrado el bloque ${hm(l.s)}–${hm(l.e)} de ${esc(a.n)}`}
  else{p.el=0;msg=`↺ ${esc(a.n)} regresó a cero`}
  if(!p.segs||!p.segs.length||p.el<1){delete a.prog;msg+=segs.length?'':' · quedó sin empezar'}
  store('acts',acts);render();if($('s2').classList.contains('on'))renderLog();lastSnap=sn;toast(msg,'Deshacer','undoSnap()',8000)}


/* ===== Tiempo corriendo en la fila de la actividad ===== */
function liveKind(a){if(!a||a.done)return '';if(cur2&&cur2.id===a.id)return 'bg';if($('run').classList.contains('on')&&cur&&!cur.rest&&!inBreak&&cur.id===a.id)return 'main';return ''}
function liveTxt(k){let r;if(k==='bg')r=cur2?cur2.tot-c2El():0;else{if(inOver)r=-overSecs();else r=remain}
  const a=Math.abs(r),h=Math.floor(a/3600);return (r<0?'+':'')+(h?h+':'+pad(Math.floor(a%3600/60)):pad(Math.floor(a/60)))+':'+pad(Math.floor(a%60))}
function liveFor(a){const k=liveKind(a);if(!k)return '';return `<span class="livep${k==='bg'?' bg':''}${k==='main'&&!running?' pz':''}" data-live="${k}" onclick="${k==='bg'?'bgMenu()':'restoreRunView()'}">${k==='main'&&!running?'❚❚':'▶'} <b>${liveTxt(k)}</b></span>`}
let liveKey='';
setInterval(()=>{const key=(cur2?cur2.id:'')+'|'+($('run').classList.contains('on')&&cur&&!cur.rest&&!inBreak?cur.id+(running?'r':'p'):'');
  if(key!==liveKey){liveKey=key;if($('s1').classList.contains('on'))render();return}
  document.querySelectorAll('#list .livep').forEach(el=>{const b=el.querySelector('b'),t=liveTxt(el.dataset.live);if(b&&b.textContent!==t)b.textContent=t})},1000);
