/* Temporizador: botones rápidos, corredor, bloques de trabajo, descansos, terminar, guardar/recuperar lo que está corriendo, voz y alarma, barra superior y 2ª actividad en paralelo */

/* ---- Temporizador simple ---- */
function setT(m){$('tMin').value=m;prev()}
function prev(){const m=parseFloat($('tMin').value)||0;$('tPrev').textContent=pad(Math.floor(m))+':'+pad(Math.round((m%1)*60))}


/* ---- Corredor ---- */
let inOver=false,overStart=0,inBreak=false,brk=(()=>{const v=load('brk',10);return v>=0?v:10})(),warned=false,queue=[],idx=0,total=0,remain=0,running=false,last=0,timer=null,wake=null,cur=null;
function setBrk(v){v=parseFloat(v);brk=v>=0?v:10;$('brkMin').value=brk;store('brk',brk)}
function startList(){busyStop();if(!acts.length)return;const pend=acts.filter(a=>!a.done);
  if(!pend.length){modal(`<h1>¡Todo hecho! 🎉</h1><div class="muted">Ya terminaste todas las actividades de este plan.</div><div class="row"><button class="btn" onclick="closeModal()">OK</button></div>`);return}
  const runq=pend.filter(a=>!a.quick||a.prog);if(!runq.length){toast('Solo te quedan tareas rápidas ⚡: márcalas con el círculo');return}unlockAudio();queue=runq.map(a=>({...a}));go(0)}
function startRest(){busyStop();unlockAudio();queue=[{n:'Me merezco un descanso',m:10}];idx=0;inBreak=false;
  cur={n:'Me merezco un descanso',plan:10,start:Date.now(),elapsed:0,ext:[],mb:0,rest:true,segs:[]};segOpen();begin(600)}
function restDone(sound){running=false;clearInterval(timer);inOver=false;remain=Math.max(0,remain);
  if(sound){startAlarm();say('Se acabó tu descanso')}
  const el=cur.elapsed;if(el>=30)save(true);quit();
  modal(`<h1>☕ Descanso ${sound?'terminado':'registrado'}</h1><div class="muted">${el>=30?`Quedó en tu registro: ${fmtMin(el/60)}.`:'Fue muy corto, no se registró.'}</div><div class="row"><button class="btn" onclick="closeModal()">OK</button></div>`)}
function startQuick(n,m){if(dualAsk(()=>{unlockAudio();queue=[{n,m}];go(0)}))return;busyStop();unlockAudio();queue=[{n,m}];go(0)}
function startSingle(){if(dualAsk(()=>{unlockAudio();const m=parseFloat($('tMin').value)||20;queue=[{n:$('tName').value.trim()||'Temporizador',m}];go(0)}))return;busyStop();unlockAudio();const m=parseFloat($('tMin').value)||20;queue=[{n:$('tName').value.trim()||'Temporizador',m}];go(0)}
/* ---- Sesiones de trabajo (de qué hora a qué hora) ---- */
function normSegs(a){return(a||[]).map(x=>Array.isArray(x)?{s:x[0],e:x[1]}:x)}
function fixData(){let unf=false;log.forEach(e=>{if(e.segs)e.segs=normSegs(e.segs);if(typeof e.extra==='number'){e.real=Math.max(0,Math.round((e.real-e.extra)*10)/10);delete e.extra;unf=true}});if(unf)setTimeout(()=>store('log',log),50);Object.values(plans).forEach(l=>(l||[]).forEach(a=>{if(a.prog&&a.prog.segs)a.prog.segs=normSegs(a.prog.segs)}))}
function segOpen(){if(!cur)return;cur.segs=normSegs(cur.segs);const l=cur.segs[cur.segs.length-1];if(!l||l.e!=null)cur.segs.push({s:Date.now(),e:null});setTimeout(runTopUpd,0)}
function segClose(t){if(!cur||!cur.segs)return;cur.segs=normSegs(cur.segs);const l=cur.segs[cur.segs.length-1];if(l&&l.e==null)l.e=Math.max(l.s,t||Date.now());setTimeout(runTopUpd,0)}
function segsOf(e){if(e.segs&&e.segs.length)return normSegs(e.segs).filter(x=>x.e!=null);const [y,m,d]=e.d.split('-').map(Number),[h,mi]=e.h.split(':').map(Number);const st=new Date(y,m-1,d,h,mi).getTime();return[{s:st,e:st+e.real*60000}]}
function hm(ts){const x=new Date(ts);return fmt12(pad(x.getHours())+':'+pad(x.getMinutes()))}
function segTxt(e){return segsOf(e).map(x=>hm(x.s)+'–'+hm(x.e)).join(' · ')}
function go(i){
  inBreak=false;$('run').classList.remove('brk');
  idx=i;const a=queue[i];
  const pr=a.prog;
  cur={n:a.n,plan:a.m,start:pr?pr.st:Date.now(),elapsed:pr?pr.el:0,ext:pr?(pr.ext||[]):[],mb:pr?(pr.mb||0):0,id:a.id,segs:pr&&pr.segs?normSegs(pr.segs).map(x=>({...x})):[]};segOpen();
  if(pr){clearProg(a.id);delete a.prog;begin(pr.tot,pr.rem);return}
  begin(a.m*60);
}
function findItem(id){let r=null;Object.values(plans).forEach(l=>l.forEach(a=>{if(a.id===id)r=a}));return r}
function clearProg(id){const it=findItem(id);if(it&&it.prog){delete it.prog;store('plans',plans);render()}}
function pauseExit(){
  let it=cur.id&&findItem(cur.id);
  if(!it){const tk=dkey(new Date());plans[tk]=plans[tk]||[];it={n:cur.n,m:cur.plan,id:uid()};plans[tk].push(it);if(planDay===tk)acts=plans[tk]}
  segClose();it.prog={el:cur.elapsed,rem:Math.max(0,remain),tot:total,ext:cur.ext,mb:cur.mb||0,st:cur.start,segs:cur.segs||[]};it.done=false;
  store('plans',plans);closeModal();quit();render();
  toast(`⏸ Pausada: ${esc(cur.n)} · llevas ${fmtMin(cur.elapsed/60)}`);
}
function resumeItem(i){const a=acts[i];if(!a||a.done)return;if(cur2&&cur2.id===a.id)return bgMenu();if(mainBusy()&&cur.id===a.id){restoreRunView();return}if(dualAsk(()=>resumeItem0(a.id)))return;busyStop();resumeItem0(a.id)}
function resumeItem0(id){const a=acts.find(x=>x.id===id);if(!a||a.done)return;unlockAudio();
  queue=[a].concat(acts.filter(x=>!x.done&&x!==a&&(!x.quick||x.prog)&&!(cur2&&x.id===cur2.id))).map(x=>({...x}));go(0)}
function begin(secs,rem){
  restoreRunView();{const ba=$('brkAct');if(ba)ba.style.display='none'}
  inOver=false;total=secs;remain=rem!=null?rem:secs;warned=false;stopAlarm();
  $('run').classList.add('on');$('run').classList.toggle('brk',!!(cur&&cur.rest));$('clock').textContent='';requestAnimationFrame(fit);$('label').textContent=cur.n;subText();if(cur&&cur.rest)$('sub').textContent='☕ Disfrútalo, te lo ganaste';
  running=true;last=Date.now();setPP(true);clearInterval(timer);timer=setInterval(tick,200);lock();setTimeout(runTopUpd,0);
  if(remain<=0){timeUp(-remain);return}
  draw();saveRun();
}
function timeUp(ov){if($('run').classList.contains('mini'))restoreRunView();if(cur&&cur.rest)return restDone(true);inOver=true;overStart=Date.now()-ov*1000;remain=0;running=true;drawOver();saveRun();startAlarm();ask()}
function overSecs(){return Math.max(0,(Date.now()-overStart)/1000)}
function drawOver(){const s=Math.floor(overSecs()),txt='+'+pad(Math.floor(s/60))+':'+pad(s%60);const c=$('clock');
  if(c.textContent!==txt){const L=c.textContent.length;c.textContent=txt;if(L!==txt.length)fit()}c.style.color='rgb(255,59,48)';c.style.opacity=1;
  const o=$('otv');if(o)o.textContent=`⏱ Llevas ${txt.slice(1)} de más`}
function subText(){
  let s=queue.length>1?`${idx+1} de ${queue.length}`+(queue[idx+1]?` · Sigue: ${queue[idx+1].n}`:''):'';
  if(cur.ext.length)s=(s?s+' · ':'')+`Tiempo extra #${cur.ext.length}`;
  $('sub').textContent=s;
}
let lastSave=0;
function tick(){
  checkSched();if($('run').classList.contains('mini'))brkUpd();
  if(inOver){drawOver();const n=Date.now();if(n-lastSave>2000){lastSave=n;saveRun()}return}
  if(!running)return;const now=Date.now(),dt=(now-last)/1000;last=now;if(now-lastSave>2000){lastSave=now;saveRun()}
  remain-=dt;
  if(inBreak){if(remain<=0){remain=0;draw();endBreak(true)}else draw();return}
  cur.elapsed+=dt;
  if(!warned&&total>1800&&remain<=900&&remain>0){warned=true;say('Te faltan 15 minutos')}
  if(remain<=0){cur.elapsed+=remain;timeUp(-remain);return}
  draw();
}
function draw(){p5Upd();brkUpd();runTopUpd();endBtnUpd();const s=Math.ceil(remain),h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;
  const txt=s<0?'+'+pad(Math.floor(-s/60))+':'+pad(-s%60):pad(Math.floor(s/60))+':'+pad(x);if($('clock').textContent!==txt){const L=$('clock').textContent.length;$('clock').textContent=txt;if(L!==txt.length)fit()}
  const mm=document.querySelector('.mid');if(mm.clientWidth&&$('clock').scrollWidth>mm.clientWidth+2)fit();$('clock').style.color=(inBreak||(cur&&cur.rest))?'#fff':color(total?remain/total:0)}
function color(r){
  if(r>0.3)return'rgb(52,199,89)';
  if(r<=0.1)return'rgb(255,59,48)';
  const t=(0.3-r)/0.2,g=[52,199,89],y=[255,214,10];
  return`rgb(${g.map((v,k)=>Math.round(v+(y[k]-v)*t)).join(',')})`}
const PAUSE='<svg viewBox="0 0 24 24"><path d="M6 5h4v14H6zM14 5h4v14h-4z"/></svg>',PLAY='<svg viewBox="0 0 24 24"><path d="M7 4v16l13-8z"/></svg>';
function setPP(r){$('clock').style.opacity=r?1:.45}
function pause(){if(!inBreak&&!inOver)segClose();running=false;setPP(false);saveRun()}
function play(){if(!running&&remain>0){if(!inBreak)segOpen();running=true;last=Date.now();setPP(true);saveRun()}}
function fit(){const c=$('clock'),m=document.querySelector('.mid');if(!m.clientWidth)return;c.style.fontSize='100px';const w=c.scrollWidth,H=window.innerHeight;const fs=Math.min(100*m.clientWidth*0.96/w,H*((inBreak)?(window.innerHeight>window.innerWidth?0.3:0.42):(window.innerHeight>window.innerWidth?0.4:0.68)));c.style.fontSize=fs+'px'}
window.addEventListener('resize',fit);window.addEventListener('orientationchange',()=>setTimeout(fit,300));
function plus5(){if(!cur||inBreak||inOver||cur.p5)return;cur.p5=true;remain+=300;total+=300;
  (cur.ext=cur.ext||[]).push({pct:null,min:5,quick:true});draw();saveRun();
  try{navigator.vibrate&&navigator.vibrate(30)}catch(e){}}
function isRest(){return inBreak||!!(cur&&cur.rest&&$('run').classList.contains('on'))}
function busyStop(){if($('run').classList.contains('on')){try{stop()}catch(e){}}}
function exitKeep(){minimizeRun();tab(1)}
function minimizeRun(){if(!$('run').classList.contains('on'))return;$('run').classList.add('mini');document.body.classList.add('hasbar');brkUpd()}
function restoreRunView(){$('run').classList.remove('mini');document.body.classList.remove('hasbar');$('brkBar').style.display='none';requestAnimationFrame(fit)}
function brkUpd(){const lb=$('label');if(lb)lb.classList.toggle('long',lb.textContent.length>14);const mb=$('minBtn');if(mb)mb.style.display=isRest()?'flex':'none';
  const r=$('run'),bar=$('brkBar');
  if(!r.classList.contains('on')){if(r.classList.contains('mini'))restoreRunView();return}
  if(!r.classList.contains('mini')){bar.style.display='none';return}
  if(!isRest()){bar.classList.add('act');let t;if(inOver){const o=Math.floor(overSecs());t='+'+pad(Math.floor(o/60))+':'+pad(o%60)}else{const s2=Math.max(0,Math.ceil(remain)),h2=Math.floor(s2/3600);t=(h2?h2+':'+pad(Math.floor(s2%3600/60)):pad(Math.floor(s2/60)))+':'+pad(s2%60)}
    const nt=`<span class="bt">${running?'▶':'⏸'}</span><span class="bn">${esc(cur?cur.n:'')}</span><b>${t}</b><span class="bo">Abrir ›</span>`;if(bar._k!==nt){bar._k=nt;bar.innerHTML=nt}bar.style.display='flex';return}
  bar.classList.remove('act');
  const s=Math.max(0,Math.ceil(remain)),t=pad(Math.floor(s/60))+':'+pad(s%60);
  const nx=(cur&&cur.rest&&!inBreak)?'':(queue[idx+1]&&queue[idx+1].n);
  bar.style.display='flex';bar.innerHTML=`<span class="bt">☕ Descanso</span><b>${t}</b><span class="bn">${nx?'Sigue: '+esc(nx):''}</span><span class="bo">Abrir ›</span>`;
}
function p5Upd(){const b=$('p5');if(!b)return;const hide=!cur||inBreak||!!cur.rest;b.style.visibility=hide?'hidden':'visible';b.classList.toggle('used',!!(cur&&cur.p5)||inOver)}
function toggle(){running=!running;last=Date.now();setPP(running)}
function restart(){remain=total;last=Date.now();draw()}

/* Misión cumplida */
function ask(){
  modal(`<h1>¿Misión cumplida?</h1><div class="muted">${esc(cur.n)}</div><div id="otv" class="otv"></div>
  <div class="row"><button class="btn" style="background:#34c759" onclick="yes()">Sí ✅</button><button class="btn red" onclick="no()">No</button></div>`);
}
function no(){stopAlarm();
  modal(`<h1>¿Qué faltó?</h1><div class="muted">${esc(cur.n)}</div><div id="otv" class="otv"></div>
  <label>¿Cuánto te faltó? (%)</label><input id="pct" type="number" inputmode="numeric" placeholder="ej. 30">
  <label>¿Cuánto tiempo extra necesitas? (min)</label><input id="xmin" type="number" inputmode="numeric" placeholder="ej. 10">
  <label>Notas</label><textarea id="xnote" rows="3" placeholder="Qué faltó, qué aprendiste…"></textarea>
  <div class="row"><button class="btn gray" onclick="ask()">Atrás</button><button class="btn" onclick="extend()">Continuar ▶</button></div>`);
  let typed=false;$('xmin').addEventListener('input',()=>typed=true);
  $('pct').addEventListener('input',()=>{const v=sugExtra(parseFloat($('pct').value));if(v!=null&&!typed)$('xmin').value=v});
  setTimeout(()=>{const e=$('pct');if(e)e.focus()},50);
}
function sugExtra(p){const el=cur.elapsed;if(!(p>0&&p<100)||!(el>0))return null;const m=el/60*p/(100-p)-(inOver?overSecs()/60:0);if(m<=0)return 5;return Math.max(1,Math.round(m/5)*5||Math.ceil(m))}
function extend(){
  const p=parseFloat($('pct').value),x=parseFloat($('xmin').value);
  if(!(x>0)){$('xmin').style.borderColor='#ff3b30';return}
  const nt=$('xnote').value.trim();const ov=inOver?overSecs():0;if(inOver){cur.elapsed+=Math.min(ov,x*60);inOver=false}
  cur.ext.push({pct:isNaN(p)?null:p,min:x,...(nt?{note:nt}:{})});closeModal();begin(x*60,x*60-ov);
}
function yes(){if(inOver)segClose(overStart);inOver=false;running=false;clearInterval(timer);closeModal();save(true);advance()}
function endAct(){if(inBreak)return;if(isRest())return restDone(false);finish()}
function endBtnUpd(){const b=$('endBtn');if(!b)return;const show=!inBreak&&!!cur;const t=cur&&cur.rest?'✓ Terminar descanso':'✓ Terminar actividad';if(b._s!==show){b._s=show;b.style.display=show?'':'none'}if(b.textContent!==t)b.textContent=t}
function finish(){if(inBreak)return endBreak(false);running=false;clearInterval(timer);save(true);beep(true);advance()}
function skip(){running=false;clearInterval(timer);if(cur.elapsed>=60)save(false);if(cur&&cur.id){const it=findItem(cur.id);if(it&&it.prog){delete it.prog;store('plans',plans)}}advance()}
function advance(){if(idx+1<queue.length){if(brk>0)startBreak();else go(idx+1)}else{done()}}
function startBreak(){
  brkChosen=false;inBreak=true;cur=null;stopAlarm();total=brk*60;remain=total;
  const r=$('run');r.classList.add('on','brk');$('clock').textContent='';
  $('label').textContent='Descanso';brkSub();
  running=true;last=Date.now();setPP(true);draw();requestAnimationFrame(fit);clearInterval(timer);timer=setInterval(tick,200);lock();saveRun();
}
function brkSub(){const nx=queue[idx+1];const ba=$('brkAct');if(ba)ba.style.display=inBreak&&!brkChosen?'flex':'none';
  $('sub').innerHTML=`Sigue: <b>${esc(nx.n)}</b> (${nx.m} min)`+(queue.length-idx-1>1?` <button class="chg" onclick="pickNext()">Cambiar ▾</button>`:'');}
function pickNext(){
  const rest=queue.slice(idx+1);
  modal(`<h1>¿Qué sigue?</h1><div class="muted">Elige la siguiente actividad</div><div class="picklist">${rest.map((a,k)=>`<button class="${k?'':'on'}" onclick="setNext(${idx+1+k})"><span>${esc(a.n)}</span><span class="muted">${a.quick?'⚡ <5 min':a.m+' min'}</span></button>`).join('')}</div>
  <div class="row"><button class="btn gray" onclick="closeModal()">Cancelar</button></div>`);
}
function setNext(j){const [a]=queue.splice(j,1);queue.splice(idx+1,0,a);closeModal();brkSub();saveRun()}
let brkChosen=false;
function skipBreak(){if(!inBreak)return;brkChosen=false;$('brkAct').style.display='none';endBreak(false)}
function restChosen(){brkChosen=true;$('brkAct').style.display='none'}
function endBreak(sound){brkChosen=false;const ba=$('brkAct');if(ba)ba.style.display='none';running=false;clearInterval(timer);if(sound){beep();say('Se acabó el descanso');return brkWait()}go(idx+1)}
/* Al acabarse el descanso NO arranca la siguiente: espera a que le des ▶ (el tiempo de espera queda como hueco) */
function brkWait(){const nx=queue[idx+1];inBreak=false;cur=null;
  $('run').classList.remove('on','brk','mini');document.body.classList.remove('hasbar');$('brkBar').style.display='none';release();clearRun();
  modal(`<h1>☕ Se acabó el descanso</h1>${nx?`<div class="muted">Sigue:</div><h2 style="margin:4px 0 14px">${esc(nx.n)}</h2>
  <button class="btn big" style="width:100%" onclick="closeModal();brkGo('${nx.id}')">▶ Empezar</button>`:''}
  <div class="row"><button class="btn gray" onclick="closeModal();tab(1)">Elegir otra</button><button class="btn gray" onclick="closeModal()">Después</button></div>`)}
function brkGo(id){setPlanDay(dkey(new Date()));const i=acts.findIndex(a=>a.id===id);if(i>=0)resumeItem(i);else tab(1)}
function done(){
  $('run').classList.remove('mini');document.body.classList.remove('hasbar');$('brkBar').style.display='none';
  $('run').classList.remove('on');release();clearRun();
  modal(`<h1>¡Listo! 🎉</h1><div class="muted">Todo quedó guardado en el Registro.</div><div class="row"><button class="btn" onclick="closeModal();tab(2)">Ver registro</button><button class="btn gray" onclick="closeModal()">Cerrar</button></div>`);
}
function save(ok){
  segClose();const st=new Date(cur.start);
  log.push({d:dkey(st),h:pad(st.getHours())+':'+pad(st.getMinutes()),n:cur.n,plan:cur.plan,real:Math.round(cur.elapsed/6)/10,ext:cur.ext,ok,...(cur.segs&&cur.segs.length?{segs:normSegs(cur.segs).filter(x=>x.e!=null)}:{})});
  store('log',log);
  if(ok&&cur.id)markDone(cur.id);
}
function stop(){if(cur&&cur.rest&&!inBreak){segClose();running=false;clearInterval(timer);return restDone(false)}if(!inBreak&&!inOver)segClose();running=false;clearInterval(timer);
  if(inBreak){inBreak=false;$('run').classList.remove('brk');return quit()}
  if(cur&&cur.elapsed>=1)return pauseExit();
  else quit()}
function quit(){$('run').classList.remove('on','mini');document.body.classList.remove('hasbar');$('brkBar').style.display='none';release();clearRun()}
/* ---- Guardar estado en curso (por si se cierra la app) ---- */
function saveRun(){if(!$('run').classList.contains('on'))return;try{localStorage.setItem('run',JSON.stringify({queue,idx,inBreak,inOver,overStart,cur,total,remain,running,at:Date.now()}))}catch(e){}if(typeof liveRunSet==='function')liveRunSet()}
function clearRun(){if(typeof liveRunClear==='function')liveRunClear();try{localStorage.removeItem('run')}catch(e){}}
function checkRun(){if($('run').classList.contains('on'))return;
  const r=load('run',null);if(!r||!r.queue||Date.now()-r.at>24*3600e3){clearRun();return}
  const nm=r.inBreak?'Descanso':(r.cur&&r.cur.n);
  modal(`<h1>Tienes algo en curso</h1><div class="muted">${esc(nm||'')} — la app se cerró mientras corría.</div>
  <div class="row"><button class="btn gray" onclick="closeModal();clearRun()">Descartar</button><button class="btn" onclick="closeModal();restoreRun()">▶ Continuar</button></div>`);
}
function restoreRun(){
  const r=load('run',null);if(!r)return;
  queue=r.queue;idx=r.idx;inBreak=!!r.inBreak;cur=r.cur;total=r.total;remain=r.remain;
  const gone=r.running?(Date.now()-r.at)/1000:0;
  if(r.inOver&&r.overStart){$('run').classList.remove('brk');inBreak=false;begin(total,-(Date.now()-r.overStart)/1000);return}
  if(r.inMini&&r.miniSaved){inBreak=false;total=r.miniSaved.total;remain=r.miniSaved.remain;$('run').classList.remove('brk');begin(total,remain);pause();return} // estado viejo del mini descanso (ya no existe)
  remain-=gone;if(cur&&!inBreak)cur.elapsed+=gone;
  if(inBreak){if(remain<=0)return brkWait();startBreakAt(total,remain);return}
  $('run').classList.remove('brk');
  if(remain<=0){cur.elapsed+=remain;begin(total,remain);return}
  begin(total,remain);if(!r.running){pause();if(remain<0)draw()}
}
function startBreakAt(t,rem){brkChosen=false;inBreak=true;stopAlarm();total=t;remain=rem;const el=$('run');el.classList.add('on','brk');$('clock').textContent='';$('label').textContent='Descanso';brkSub();
  running=true;last=Date.now();setPP(true);draw();requestAnimationFrame(fit);clearInterval(timer);timer=setInterval(tick,200);lock();saveRun()}

/* ---- Recuperar actividad interrumpida (a mano) ---- */
function recoverForm(){
  setPlanDay(dkey(new Date()));render();
  const pend=acts.filter(a=>!a.done);
  const opts=[...new Set(log.map(e=>e.n).concat(acts.map(a=>a.n)))].map(n=>`<option value="${esc(n)}">`).join('');
  const sel=`<select id="rSel" class="selx">${pend.length?'<option value="">Elige una actividad…</option>':''}${pend.map((a,i)=>`<option value="${i}">${esc(a.n)} · ${a.m} min</option>`).join('')}<option value="__otra">Otra actividad (escribir)…</option></select>`;
  modal(`<h1>¿Se borró tu actividad?</h1><div class="muted">Dime cómo iba y la retomo donde te quedaste.</div>
  <label>Actividad</label>${sel}<input id="rN" list="rList" placeholder="Escribe la actividad" style="display:none;width:100%;margin-top:8px"><datalist id="rList">${opts}</datalist>
  <label>Tiempo estimado original (min)</label><input id="rP" type="number" inputmode="numeric" placeholder="ej. 40">
  <div class="row" style="margin:0;gap:10px"><div style="flex:1"><label>Hora en que empezaste</label><input id="rS" type="time"></div>
  <div style="flex:1"><label>…o hora en que se acabó el estimado</label><input id="rE" type="time"></div></div>
  <label>Tiempo extra que agregaste (min)</label><input id="rX" type="number" inputmode="numeric" placeholder="0">
  <div id="rPrev" class="muted" style="margin-top:12px;min-height:20px"></div>
  <div class="row"><button class="btn gray" onclick="closeModal()">Cancelar</button><button class="btn" style="background:#2c2c2e" onclick="recover(false)">Ya la terminé</button></div>
  <div class="row" style="margin-top:8px"><button class="btn" style="background:#34c759" onclick="recover(true)">▶ Continuar donde me quedé</button></div>`);
  ['rN','rP','rS','rE','rX'].forEach(id=>$(id).addEventListener('input',recPrev));
  $('rSel').addEventListener('change',()=>{const v=$('rSel').value;$('rSel').style.borderColor='';
    if(v==='__otra'){$('rN').style.display='block';$('rN').value='';$('rN').focus()}
    else{$('rN').style.display='none';const a=pend[+v];$('rN').value=a?a.n:'';if(a)$('rP').value=a.m}
    recPrev()});
  if(!pend.length){$('rSel').value='__otra';$('rN').style.display='block'}
  $('rN').addEventListener('input',()=>{const a=acts.find(a=>a.n.toLowerCase()===$('rN').value.trim().toLowerCase());if(a&&!$('rP').value)$('rP').value=a.m;recPrev()});
}
function recCalc(){
  const n=$('rN').value.trim(),P=parseFloat($('rP').value),X=parseFloat($('rX').value)||0;
  if(!n||!(P>0))return null;
  const t=($('rS').value||$('rE').value);if(!t)return null;
  const [h,m]=t.split(':').map(Number),d=new Date();d.setHours(h,m,0,0);
  let S=d.getTime();if(!$('rS').value)S-=P*60000;
  if(S>Date.now())S-=24*3600e3;
  const end=S+(P+X)*60000;return{n,P,X,S,end,left:(end-Date.now())/1000,el:(Date.now()-S)/1000};
}
function recPrev(){const c=recCalc();if(!c){$('rPrev').textContent='';return}
  const st=new Date(c.S),en=new Date(c.end),f=x=>pad(x.getHours())+':'+pad(x.getMinutes());
  $('rPrev').innerHTML=`Empezaste a las <b style="color:#fff">${f(st)}</b> · llevas <b style="color:#fff">${fmtMin(c.el/60)}</b><br>`+
   (c.left>0?`Tu tiempo termina a las <b style="color:#fff">${f(en)}</b> · te quedan <b style="color:#34c759">${fmtMin(c.left/60)}</b>`:`Tu tiempo se acabó a las <b style="color:#fff">${f(en)}</b>`)}
function recover(cont){
  const c=recCalc();if(!c){if(!$('rN').value)$('rSel').style.borderColor='#ff3b30';['rN','rP'].forEach(id=>{if(!$(id).value)$(id).style.borderColor='#ff3b30'});if(!$('rS').value&&!$('rE').value){$('rS').style.borderColor='#ff3b30';$('rE').style.borderColor='#ff3b30'}return}
  const ma=acts.find(a=>!a.done&&a.n.toLowerCase()===c.n.toLowerCase());cur={n:c.n,plan:c.P,start:c.S,elapsed:c.el,ext:c.X>0?[{pct:null,min:c.X}]:[],id:ma&&ma.id,segs:[{s:c.S,e:null}]};
  closeModal();unlockAudio();
  if(!cont){save(true);renderLog();modal(`<h1>Guardado ✅</h1><div class="muted">${esc(c.n)} · ${fmtMin(c.el/60)} reales</div><div class="row"><button class="btn" onclick="closeModal()">OK</button></div>`);return}
  const k=acts.findIndex(a=>!a.done&&a.n.toLowerCase()===c.n.toLowerCase());
  queue=k>=0?acts.slice(k).filter(a=>!a.done).map(a=>({...a})):[{n:c.n,m:c.P}];idx=0;queue[0]={n:c.n,m:c.P,id:cur.id};
  inBreak=false;$('run').classList.remove('brk');
  const seg=(c.X>0?c.X:c.P)*60;
  if(c.left<=0)cur.elapsed+=c.left;begin(seg,c.left);
}
function modal(h){$('mCard').innerHTML=h;$('modal').classList.add('on')}
function closeModal(){stopAlarm();$('modal').classList.remove('on')}
async function lock(){try{wake=await navigator.wakeLock.request('screen')}catch(e){}}
function release(){try{wake&&wake.release()}catch(e){}}
let ac;function beep(short){try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();(short?[0]:[0,.35,.7]).forEach(d=>{const o=ac.createOscillator(),g=ac.createGain();o.frequency.value=880;o.connect(g);g.connect(ac.destination);g.gain.setValueAtTime(.3,ac.currentTime+d);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+d+.3);o.start(ac.currentTime+d);o.stop(ac.currentTime+d+.3)})}catch(e){}
 try{navigator.vibrate&&navigator.vibrate([300,100,300])}catch(e){}}
document.addEventListener('click',()=>{try{ac=ac||new(window.AudioContext||window.webkitAudioContext)()}catch(e){}},{once:true});


/* ---- Voz y alarma ---- */
function unlockAudio(){
  try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume()}catch(e){}
  try{const u=new SpeechSynthesisUtterance(' ');u.volume=0;speechSynthesis.speak(u)}catch(e){}
}
function say(t){
  try{speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(t);u.lang='es-MX';u.rate=1;u.volume=1;
    const v=speechSynthesis.getVoices().find(v=>/^es(-|_)MX/i.test(v.lang))||speechSynthesis.getVoices().find(v=>/^es/i.test(v.lang));if(v)u.voice=v;
    speechSynthesis.speak(u)}catch(e){}
}
let alarmT=null,alarmEnd=0;
function alarmBurst(){
  try{ac=ac||new(window.AudioContext||window.webkitAudioContext)();if(ac.state==='suspended')ac.resume();
    const t0=ac.currentTime;
    [0,.18,.36,.54].forEach((d,i)=>{const o=ac.createOscillator(),g=ac.createGain();o.type='square';o.frequency.value=i%2?1050:880;o.connect(g);g.connect(ac.destination);
      g.gain.setValueAtTime(0.0001,t0+d);g.gain.exponentialRampToValueAtTime(0.5,t0+d+.02);g.gain.exponentialRampToValueAtTime(0.0001,t0+d+.15);o.start(t0+d);o.stop(t0+d+.16)})
  }catch(e){}
  try{navigator.vibrate&&navigator.vibrate([400,150,400])}catch(e){}
}
function startAlarm(){stopAlarm();alarmEnd=Date.now()+60000;alarmBurst();alarmT=setInterval(()=>{if(Date.now()>alarmEnd)return stopAlarm();alarmBurst()},1200)}
function stopAlarm(){if(alarmT){clearInterval(alarmT);alarmT=null}}
try{speechSynthesis.getVoices();speechSynthesis.onvoiceschanged=()=>speechSynthesis.getVoices()}catch(e){}




/* ===== Barra superior del temporizador: fecha + bloques, inicio editable ===== */
function runTopUpd(){const el=$('runTop');if(!el)return;
  if(!cur||cur.rest||inBreak||!$('run').classList.contains('on')){if(el._k!==''){el._k='';el.innerHTML='';el.style.display='none'}return}
  const sg=normSegs(cur.segs||[]);if(!sg.length){el.style.display='none';return}el.style.display='';
  const last=sg[sg.length-1],d=new Date(last.s);
  const prev=sg.slice(0,-1).map((b,k)=>`<button class="rtb" onclick="editBlock(${k})" title="Editar este bloque">${hm(b.s)}–${hm(b.e)} <i>✎</i></button>`).join('');
  const html=`<span class="rtd">${cap(dayName(dkey(d)))} · ${d.getDate()} ${MES[d.getMonth()].slice(0,3)}</span>${prev}<button class="rtb cur" onclick="editBlockStart()" title="Corregir la hora de inicio de este bloque">▶ ${hm(last.s)}${last.e!=null?'–'+hm(last.e):' · en curso'} <i>✎</i></button>`;if(el._k!==html){el._k=html;el.innerHTML=html}}
function editBlockStart(){const sg=normSegs(cur&&cur.segs||[]);if(!sg.length)return;const l=sg[sg.length-1],d=new Date(l.s);
  modal(`<h1>Inicio de este bloque</h1><div class="muted" style="margin-bottom:8px">${esc(cur.n)} · ${cap(dayName(dkey(d)))}</div>
  <input type="time" id="ebT" value="${pad(d.getHours())}:${pad(d.getMinutes())}" style="width:100%;font-size:28px;text-align:center">
  <div class="muted" id="ebMsg" style="margin-top:8px;font-size:14px;min-height:18px"></div>
  <div class="row"><button class="btn gray" onclick="closeModal()">Cancelar</button><button class="btn" onclick="saveBlockStart()">Guardar</button></div>`);
  setTimeout(()=>$('ebT').focus(),60)}
function editBlock(k){const sg=normSegs(cur&&cur.segs||[]),b=sg[k];if(!b||b.e==null)return;const ds=new Date(b.s),de=new Date(b.e);const f=d=>pad(d.getHours())+':'+pad(d.getMinutes());
  modal(`<h1>Editar bloque</h1><div class="muted" style="margin-bottom:8px">${esc(cur.n)} · ${cap(dayName(dkey(ds)))}</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><label>Inicio</label><input type="time" id="bkS" value="${f(ds)}" style="width:100%;box-sizing:border-box;font-size:22px;text-align:center"></div>
  <div><label>Fin</label><input type="time" id="bkE" value="${f(de)}" style="width:100%;box-sizing:border-box;font-size:22px;text-align:center"></div></div>
  <div class="muted" id="bkMsg" style="margin-top:8px;font-size:14px;min-height:18px"></div>
  <div class="row"><button class="btn gray" style="color:#ff453a" onclick="delBlock(${k})">Borrar bloque</button><button class="btn" onclick="saveBlock(${k})">Guardar</button></div>
  <div style="text-align:center"><button class="linkbtn" onclick="closeModal()">Cancelar</button></div>`)}
function blockApply(delta){cur.elapsed=Math.max(0,cur.elapsed+delta);if(!inOver)remain-=delta;cur.segs=normSegs(cur.segs);if(cur.segs.length)cur.start=cur.segs[0].s;saveRun();closeModal();draw&&draw();runTopUpd()}
function saveBlock(k){cur.segs=normSegs(cur.segs);const sg=cur.segs,b=sg[k];if(!b)return;const mk=(v,base)=>{const d=new Date(base);const [h,m]=v.split(':').map(Number);d.setHours(h,m,0,0);return d.getTime()};
  const sv=$('bkS').value,ev=$('bkE').value;if(!sv||!ev)return;const ns=mk(sv,b.s),ne=mk(ev,b.e);
  const msg=t=>{$('bkMsg').innerHTML='<span style="color:#ff453a">'+t+'</span>'};
  if(ne<=ns)return msg('El fin tiene que ser después del inicio.');
  const pv=sg[k-1],nx=sg[k+1];if(pv&&ns<pv.e)return msg('Se encima con el bloque anterior ('+hm(pv.s)+'–'+hm(pv.e)+').');if(nx&&ne>nx.s)return msg('Se encima con el bloque siguiente ('+hm(nx.s)+(nx.e!=null?'–'+hm(nx.e):'')+').');
  const delta=((ne-ns)-(b.e-b.s))/1000;b.s=ns;b.e=ne;blockApply(delta);toast(`Bloque ajustado: ${hm(ns)}–${hm(ne)} (${delta>=0?'+':''}${Math.round(delta/60)} min)`)}
function delBlock(k){cur.segs=normSegs(cur.segs);const b=cur.segs[k];if(!b)return;const d=(b.e-b.s)/1000;cur.segs.splice(k,1);blockApply(-d);toast(`Bloque ${hm(b.s)}–${hm(b.e)} borrado (−${Math.round(d/60)} min)`)}
function saveBlockStart(){const v=$('ebT').value;if(!v)return;cur.segs=normSegs(cur.segs);const sg=cur.segs,l=sg[sg.length-1],d=new Date(l.s);const [h,m]=v.split(':').map(Number);d.setHours(h,m,0,0);let ns=d.getTime();
  const lim=l.e!=null?l.e:Date.now(),prevEnd=sg.length>1?sg[sg.length-2].e:-Infinity;
  if(ns>lim){$('ebMsg').innerHTML='<span style="color:#ff453a">No puede ser después de '+(l.e!=null?'que terminó el bloque':'ahora')+'.</span>';return}
  if(ns<prevEnd){$('ebMsg').innerHTML='<span style="color:#ff453a">Se encima con el bloque anterior ('+hm(sg[sg.length-2].s)+'–'+hm(prevEnd)+').</span>';return}
  const delta=(l.s-ns)/1000;l.s=ns;cur.elapsed=Math.max(0,cur.elapsed+delta);if(!inOver)remain-=delta;if(sg.length===1)cur.start=ns;else cur.start=Math.min(cur.start,sg[0].s);
  saveRun();closeModal();draw&&draw();runTopUpd();toast(`Inicio corregido a ${hm(ns)} (${delta>=0?'+':''}${Math.round(delta/60)} min)`)}

/* ===== Segunda actividad corriendo en paralelo (2º plano) ===== */
let cur2=(()=>{try{const v=JSON.parse(localStorage.getItem('run2')||'null');return v&&v.id!=null?v:null}catch(e){return null}})(),c2T=null,dualFn=null;
function c2Save(){try{cur2?localStorage.setItem('run2',JSON.stringify(cur2)):localStorage.removeItem('run2')}catch(e){}}
function c2El(){if(!cur2)return 0;return cur2.el+(cur2.since?(Date.now()-cur2.since)/1000:0)}
function mainBusy(){return $('run').classList.contains('on')&&cur&&!cur.rest&&!inBreak}
function dualAsk(fn){if(!mainBusy())return false;dualFn=fn;
  if(cur2){modal(`<h1>Ya tienes dos corriendo</h1><div class="muted" style="margin-bottom:12px">Pausa una para empezar otra.</div>
    <div class="picklist"><button onclick="closeModal();busyStop();dualGo()">⏸ Pausar <b>${esc(cur.n)}</b><span class="muted">principal</span></button>
    <button onclick="closeModal();bgPause();dualMove()">⏸ Pausar <b>${esc(cur2.n)}</b><span class="muted">2º plano</span></button></div>
    <div class="row"><button class="btn gray" onclick="closeModal()">Cancelar</button></div>`);return true}
  modal(`<h1>Ya está corriendo</h1><div class="muted" style="margin-bottom:12px"><b style="color:#fff">${esc(cur.n)}</b> sigue activa. ¿Qué hago con ella?</div>
  <div class="picklist"><button onclick="closeModal();busyStop();dualGo()">⏸ Pausarla</button><button onclick="closeModal();dualMove()">▶▶ Que sigan corriendo las dos<span class="muted">pasa a 2º plano</span></button></div>
  <div class="row"><button class="btn gray" onclick="closeModal()">Cancelar</button></div>`);return true}
function dualGo(){const f=dualFn;dualFn=null;if(f)f()}
function dualMove(){if(!mainBusy()){dualGo();return}if(cur2){toast('Ya hay una en 2º plano');return}
  const segs=normSegs(cur.segs||[]);const last=segs[segs.length-1];if(!last||last.e!=null)segs.push({s:Date.now(),e:null});
  const el=cur.elapsed;cur2={id:cur.id,n:cur.n,plan:cur.plan,tot:inOver?total+overSecs():total,ext:cur.ext||[],st:cur.start,segs:segs.slice(0,-1),open:segs[segs.length-1].s,el,since:Date.now(),warned:inOver};
  running=false;clearInterval(timer);quit();c2Save();c2Start();dualGo()}
function c2Start(){clearInterval(c2T);if(!cur2){bar2Upd();return}c2T=setInterval(c2Tick,1000);c2Tick()}
function c2Tick(){if(!cur2){clearInterval(c2T);bar2Upd();return}const rem=cur2.tot-c2El();
  if(rem<=0&&!cur2.warned){cur2.warned=true;c2Save();try{beep()}catch(e){}try{say('Se acabó el tiempo de '+cur2.n)}catch(e){}toast(`⏰ Se acabó el tiempo de ${esc(cur2.n)} (2º plano)`,'Opciones','bgMenu()',10000)}
  bar2Upd()}
function bar2Upd(){const b=$('bar2');if(!b)return;if(!cur2){b.style.display='none';document.body.classList.remove('hasbar2');return}
  const rem=cur2.tot-c2El(),a=Math.abs(rem),h=Math.floor(a/3600),t=(rem<0?'+':'')+(h?h+':'+pad(Math.floor(a%3600/60)):pad(Math.floor(a/60)))+':'+pad(Math.floor(a%60));
  if(!b._init){b._init=1;b.innerHTML=`<span class="bt">▶▶</span><span class="bn"><span class="b2n"></span> <small>2º plano</small></span><b class="b2t"></b><button onclick="event.stopPropagation();bgPause()" title="Pausar">❚❚</button><button onclick="event.stopPropagation();bgFinish()" title="Terminar">✓</button>`;b.querySelector('.bn').onclick=bgMenu}
  const nn=b.querySelector('.b2n'),tt=b.querySelector('.b2t');if(nn.textContent!==cur2.n)nn.textContent=cur2.n;if(tt.textContent!==t)tt.textContent=t;tt.classList.toggle('ov',rem<0);
  b.style.display='flex';document.body.classList.add('hasbar2')}
function c2Segs(){const sg=normSegs(cur2.segs||[]).filter(x=>x.e!=null);sg.push({s:cur2.open,e:Date.now()});return sg}
function bgPause(){if(!cur2)return;const el=c2El(),sg=c2Segs();let it=findItem(cur2.id);
  if(!it){const tk=dkey(new Date());plans[tk]=plans[tk]||[];it={n:cur2.n,m:cur2.plan,id:cur2.id||uid()};plans[tk].push(it)}
  it.prog={el,rem:Math.max(0,cur2.tot-el),tot:cur2.tot,ext:cur2.ext||[],mb:0,st:cur2.st,segs:sg};it.done=false;const n=cur2.n;
  cur2=null;c2Save();clearInterval(c2T);bar2Upd();store('plans',plans);setPlanDay(planDay);render();toast(`⏸ Pausada: ${esc(n)} · llevas ${fmtMin(el/60)}`)}
function bgFinish(){if(!cur2)return;const el=c2El(),sg=c2Segs(),st=new Date(cur2.st||sg[0].s);
  log.push({d:dkey(st),h:pad(st.getHours())+':'+pad(st.getMinutes()),n:cur2.n,plan:cur2.plan,real:Math.round(el/6)/10,ext:cur2.ext||[],ok:true,segs:sg});store('log',log);
  const id=cur2.id,n=cur2.n;cur2=null;c2Save();clearInterval(c2T);bar2Upd();if(id)markDone(id);render();toast(`✓ ${esc(n)} registrada · ${fmtMin(el/60)}`)}
function bgMenu(){if(!cur2)return;modal(`<h1>▶▶ ${esc(cur2.n)}</h1><div class="muted" style="margin-bottom:12px">Corriendo en 2º plano · llevas ${fmtMin(c2El()/60)}</div>
  <div class="picklist"><button onclick="closeModal();bgFinish()">✓ Terminarla y registrar</button><button onclick="closeModal();bgPause()">⏸ Pausarla</button></div>
  <div class="row"><button class="btn gray" onclick="closeModal()">Cerrar</button></div>`)}
setTimeout(c2Start,400);

/* Respaldo del progreso mientras corre: cada 20 min y al salir de la app se guarda en el plan (como si fuera pausa, pero sigue corriendo).
   Si la app se cierra o algo falla, la actividad queda con su hora de inicio y lo que llevabas. */
let ckLast=Date.now();
function checkpoint(why){if(!cur||!cur.id||inBreak||!$('run').classList.contains('on'))return;const it=findItem(cur.id);if(!it||it.done)return;
  const now=Date.now(),sg=normSegs(cur.segs||[]).map(x=>({s:x.s,e:x.e==null?now:x.e}));
  if(it.prog&&it.prog.el>cur.elapsed+5)return; /* nunca bajar lo ya guardado */
  it.prog={el:cur.elapsed,rem:Math.max(0,remain),tot:total,ext:cur.ext,mb:cur.mb||0,st:cur.start,segs:sg};it.done=false;ckLast=now;store('plans',plans)}
setInterval(()=>{if(Date.now()-ckLast>=20*60e3)checkpoint('20min')},60e3);
document.addEventListener('visibilitychange',()=>{if(document.hidden)checkpoint('salir')});
window.addEventListener('pagehide',()=>checkpoint('salir'));
