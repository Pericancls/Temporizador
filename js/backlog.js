/* Backlog: lista, arrastre en compu, cuadro amarillo de fin de semana y versión iPhone */

/* ===== Backlog (solo computadora) ===== */
let blDrag=null;
function overBl(x,y){const b=$('blBox');if(!b||!isDesk())return false;const r=b.getBoundingClientRect();return r.width>0&&x>=r.left-10&&x<=r.right+10}
function blHi(on){const b=$('blBox');if(b)b.classList.toggle('dropok',!!on)}
function renderBl(){renderBlM();const box=$('blBox');if(!box||!isDesk())return;
  if(!box.dataset.init){box.dataset.init=1;
    box.innerHTML=`<div class="blhead"><h3>📥 Backlog</h3><a class="picum" href="https://airtable.com/appOfREf0mVgyWXXO/tblZVWZynzvKPNAHg/viwFGlnNqaotDFN3z?blocks=hide" target="_blank" rel="noopener" title="Pendientes de PICUM en Airtable"><img src="picum.png" alt="PICUM"></a></div>
    <div class="blin"><input class="n" id="blN" placeholder="Nueva tarea"><input class="m" id="blM" type="number" placeholder="--"><button class="btn" onclick="blAdd()">+</button></div>
    <ul id="blList"></ul><div class="blfoot" id="blFoot"></div><div class="wkz" id="wkZone"></div>`;
    ['blN','blM'].forEach(x=>$(x).addEventListener('keydown',e=>{if(e.key==='Enter')blAdd()}));
  }
  const now=Date.now(),main=bl.filter(b=>!b.wk),wkl=bl.filter(b=>b.wk).sort((a,b)=>a.wk.k<b.wk.k?-1:a.wk.k>b.wk.k?1:0);
  const row=(b,inWk)=>{const age=Math.floor((now-(b.c||now))/86400000);
    return `<li data-id="${b.id}"><span class="n">${esc(b.n)}${inWk?`<br><span class="wkd">${cap(wkLbl(b.wk.k))}</span>`:age>=7?`<br><span class="age">hace ${age} días</span>`:''}</span><span class="t${b.quick?' quick':''}" onclick="blEdit('${b.id}')" title="Editar">${b.quick?'⚡ <5 min':b.m+' min'}</span><button class="go" onclick="blToDay('${b.id}')" title="Agregar al final del plan">→</button><button onclick="${inWk?'wkDel':'blDel'}('${b.id}')" title="${inWk?'Quitar del fin de semana':'Borrar'}">✕</button></li>`};
  $('blList').innerHTML=main.length?main.map(b=>row(b,false)).join('')
    :'<div class="blempty">Vacío. Escribe arriba las tareas que quieras tener a la mano esta semana.</div>';
  const tot=main.reduce((s,b)=>s+(b.quick?5:(+b.m||0)),0);
  $('blFoot').textContent=main.length?`${main.length} tarea${main.length>1?'s':''} · ${fmtMin(tot)}`:'';
  const [sa,su]=wkDays();const full=wkCount(sa)>=WK_MAX&&wkCount(su)>=WK_MAX;$('wkZone').classList.toggle('full',full);$('wkZone').innerHTML=`<b>🏖️ Fin de semana</b><div class="wks">${cap(wkLbl(sa))}: ${wkCount(sa)}/${WK_MAX} · ${cap(wkLbl(su))}: ${wkCount(su)}/${WK_MAX}${full?' · <span class="fullt">¡Lleno!</span>':''}</div>`+
    (wkl.length?`<ul id="wkList">${wkl.map(b=>row(b,true)).join('')}</ul>`:`<div class="wks" style="margin-top:6px">Arrastra aquí para mandarla al ${wkLbl(sa)} o ${wkLbl(su)} · ${WK_MAX} por día</div><ul id="wkList"></ul>`)}
function dropIdx(y){const lis=[...$('list').querySelectorAll('li')];for(let k=0;k<lis.length;k++){const r=lis[k].getBoundingClientRect();if(y<r.top+r.height/2)return k}return lis.length}
function dropMark(y){const L=$('list'),ix=dropIdx(y),lis=[...L.querySelectorAll('li')];let d=L.querySelector('.dropline');if(!d){d=document.createElement('div');d.className='dropline';L.appendChild(d)}
  d.style.top=(lis.length?(ix<lis.length?lis[ix].offsetTop-5:lis[lis.length-1].offsetTop+lis[lis.length-1].offsetHeight+2):0)+'px'}
function dropClear(){const d=$('list').querySelector('.dropline');if(d)d.remove();const M=document.querySelector('.s1main');if(M)M.classList.remove('dropzone')}
function blAdd(){const n=$('blN').value.trim(),m=parseFloat($('blM').value);if(!n)return;const q=!(m>0);
  bl.push({id:uid(),n,m:q?5:m,...(q?{quick:true}:{}),c:Date.now()});$('blN').value='';$('blM').value='';$('blN').focus();store('bl',bl);renderBl()}
function blToDay(id,ix){const b=bl.find(x=>x.id===id);if(!b)return;const sn=snap();wkUnlink(b);const {c,wk,...it}=b;it.id=uid();
  if(ix==null||ix>acts.length)ix=acts.length;acts.splice(ix,0,it);const bi=bl.findIndex(x=>x.id===id);bl=bl.filter(x=>x.id!==id);store('bl',bl);store('acts',acts);render();
  lastSnap=sn;toast(`Agregada a ${dayName(planDay)}: ${esc(b.n)}`,'Deshacer','undoSnap()')}
let lastBl=null;
function blToDate(k0,k){const b=bl.find(x=>x.id===k0);if(!b)return;const sn=snap();wkUnlink(b);const {c,wk,...it}=b;it.id=uid();const bi=bl.findIndex(x=>x.id===k0);bl=bl.filter(x=>x.id!==k0);store('bl',bl);
  plans[k]=(plans[k]||[]).concat(it);store('plans',plans);render();lastSnap=sn;toast(`Mandada a ${dayName(k)}: ${esc(b.n)}`,'Deshacer','undoSnap()')}
function undoBl(){const m=lastBl;if(!m)return;lastBl=null;plans[m.k]=(plans[m.k]||[]).filter(x=>x.id!==m.id);store('plans',plans);bl.splice(Math.min(m.bi,bl.length),0,m.b);store('bl',bl);setPlanDay(planDay);render();hideToast()}
function toBacklog(i,bi){const a=acts[i];if(!a||a.done)return;const sn=snap();if(a.rid&&(a.rk||planDay)===planDay)recSkip(a.rid,planDay);
  acts.splice(i,1);store('acts',acts);const {done,rid,rk,warned30,t,cid,...rest}=a;const nb={...rest,id:uid(),c:Date.now()};if(bi==null)bl.unshift(nb);else bl.splice(Math.min(bi,bl.length),0,nb);store('bl',bl);render();
  lastSnap=sn;toast(`📥 Al backlog: ${esc(a.n)}`,'Deshacer','undoSnap()')}
function blDel(id){const b=bl.find(x=>x.id===id);if(!b)return;bl=bl.filter(x=>x.id!==id);store('bl',bl);renderBl();lastBlDel=b;toast(`Borrada: ${esc(b.n)}`,'Deshacer','bl.push(lastBlDel);store(\'bl\',bl);renderBl();hideToast()')}
let lastBlDel=null;
function wkDel(id){const b=bl.find(x=>x.id===id);if(!b)return;const sn=snap();wkUnlink(b);bl=bl.filter(x=>x.id!==id);store('bl',bl);render();lastSnap=sn;toast(`Quitada del fin de semana: ${esc(b.n)}`,'Deshacer','undoSnap()')}
function blEdit(id){const b=bl.find(x=>x.id===id);if(!b)return;
  modal(`<h1>Editar tarea</h1><label>Tarea</label><input id="beN" value="${esc(b.n)}" style="width:100%"><label>Minutos <small class="muted">(vacío = tarea rápida ⚡)</small></label><input id="beM" type="number" value="${b.quick?'':b.m}" placeholder="--" style="width:100%">
  <div class="row"><button class="btn gray" onclick="closeModal()">Cancelar</button><button class="btn" onclick="blSaveEd('${id}')">Aceptar</button></div>`);setTimeout(()=>$('beN').focus(),50)}
function blSaveEd(id){const b=bl.find(x=>x.id===id);if(!b)return;const n=$('beN').value.trim(),m=parseFloat($('beM').value);if(!n)return;b.n=n;if(m>0){b.m=m;delete b.quick}else{b.m=5;b.quick=true}store('bl',bl);closeModal();renderBl()}
window.addEventListener('resize',()=>{if($('s1').classList.contains('on'))renderBl()});

/* ===== Arrastre libre en computadora: plan ⇄ backlog, y deslizar a la derecha = día siguiente ===== */
(function(){
  let st=null;
  const skip=t=>t.closest('button,input,select,.t,.tchip,.contb,a');
  const itemsOf=(box,ex)=>[...box.querySelectorAll(':scope > li')].filter(x=>x!==ex);
  const idxAt=(its,y)=>{for(let k=0;k<its.length;k++){const r=its[k].getBoundingClientRect();if(y<r.top+r.height/2)return k}return its.length};
  const line=(box,its,ix)=>{box.querySelectorAll('.dropline').forEach(d=>d.remove());const d=document.createElement('div');d.className='dropline';
    d.style.top=(its.length?(ix<its.length?its[ix].offsetTop-5:its[its.length-1].offsetTop+its[its.length-1].offsetHeight+1):0)+'px';box.appendChild(d)};
  const clear=()=>{document.querySelectorAll('.dropline').forEach(d=>d.remove());blHi(false);const W=$('wkZone');if(W)W.classList.remove('over');const P=$('dayPrev');if(P)P.classList.remove('dropnext');const m=document.querySelector('.s1main');if(m)m.classList.remove('dropzone')};
  const target=(x,y)=>{const W=$('wkZone');if(W){const r=W.getBoundingClientRect();if(r.width&&x>=r.left-6&&x<=r.right+6&&y>=r.top-6&&y<=r.bottom+6)return 'wk'}const B=$('blBox');if(B){const r=B.getBoundingClientRect();if(x<r.right+14)return 'bl'}const M=document.querySelector('.s1main');if(M){const r=M.getBoundingClientRect();if(x>=r.left-14&&x<=r.right+14)return 'plan';if(x>r.right+14)return 'next'}return null};
  document.addEventListener('mousedown',e=>{if(e.button!==0||!isDesk()||!$('s1').classList.contains('on'))return;
    const li=e.target.closest('#list > li, #blList > li, #wkList > li');if(!li||skip(e.target))return;
    if(li.classList.contains('done')&&li.closest('#list'))return;
    e.preventDefault();const src=li.closest('#list')?'plan':'bl';
    st={li,src,i:src==='plan'?+li.dataset.i:null,id:src==='bl'?li.dataset.id:null,x0:e.clientX,y0:e.clientY,mode:null,ghost:null,tgt:null,ix:0}});
  window.addEventListener('mousemove',e=>{if(!st)return;const dx=e.clientX-st.x0,dy=e.clientY-st.y0;
    if(!st.mode){if(Math.hypot(dx,dy)<6)return;
      if(false){st.mode='swipe';const h=document.createElement('div');h.className='swh r';h.style.top=st.li.offsetTop+'px';h.style.height=st.li.offsetHeight+'px';
        h.innerHTML=`<span class="swr">📅 ${planDay===dkey(new Date())?'Mañana':'Día siguiente'} ›</span><span></span>`;$('list').appendChild(h);st.h=h;st.li.classList.add('swiping')}
      else{st.mode='drag';const r=st.li.getBoundingClientRect();const g=st.li.cloneNode(true);g.classList.add('dghost');g.style.width=r.width+'px';g.style.left=r.left+'px';g.style.top=r.top+'px';
        document.body.appendChild(g);st.ghost=g;st.ox=st.x0-r.left;st.oy=st.y0-r.top;st.li.classList.add('dsrc');document.body.classList.add('dragging')}}
    if(st.mode==='swipe'){const d=Math.max(0,dx);st.li.style.transform=`translateX(${d}px)`;st.h.classList.toggle('go',d>90);return}
    st.ghost.style.left=(e.clientX-st.ox)+'px';st.ghost.style.top=(e.clientY-st.oy)+'px';
    const t=target(e.clientX,e.clientY);st.tgt=t;clear();
    if(t==='bl'){blHi(true);const box=$('blList'),its=itemsOf(box,st.src==='bl'?st.li:null);st.ix=idxAt(its,e.clientY);st.bef=its[st.ix]?its[st.ix].dataset.id:null;line(box,its,st.ix)}
    else if(t==='wk'){$('wkZone').classList.add('over')}
    else if(t==='next'){const P=$('dayPrev');P.dataset.next=planDay===dkey(new Date())?'📅 Suelta aquí para mandarla a mañana':'📅 Suelta aquí para mandarla al día siguiente';P.classList.add('dropnext')}
    else if(t==='plan'){document.querySelector('.s1main').classList.add('dropzone');const box=$('list'),its=itemsOf(box,st.src==='plan'?st.li:null);st.ix=idxAt(its,e.clientY);st.ref=its[st.ix]?acts[+its[st.ix].dataset.i]:null;line(box,its,st.ix)}});
  window.addEventListener('mouseup',e=>{if(!st)return;const s0=st;st=null;
    if(s0.mode==='swipe'){const dx=e.clientX-s0.x0;s0.h.remove();s0.li.style.transform='';s0.li.classList.remove('swiping');if(dx>90)sendTo(s0.i,shiftDay(planDay,1));return}
    if(s0.mode!=='drag')return;
    s0.ghost.remove();s0.li.classList.remove('dsrc');document.body.classList.remove('dragging');clear();
    const sup=ev=>{ev.stopPropagation();ev.preventDefault()};window.addEventListener('click',sup,{capture:true,once:true});setTimeout(()=>window.removeEventListener('click',sup,{capture:true}),50);
    const t=s0.tgt,ix=s0.ix;if(!t)return;
    if(s0.src==='plan'&&t==='plan'){const [a]=acts.splice(s0.i,1);const j=s0.ref?acts.indexOf(s0.ref):acts.length;acts.splice(j<0?acts.length:j,0,a);store('acts',acts);render()}
    else if(s0.src==='plan'&&t==='bl'){const j=s0.bef?bl.findIndex(x=>x.id===s0.bef):-1;toBacklog(s0.i,j>=0?j:bl.length)}
    else if(s0.src==='bl'&&t==='plan'){const j=s0.ref?acts.indexOf(s0.ref):acts.length;blToDay(s0.id,j<0?acts.length:j)}
    else if(t==='wk'){if(s0.src==='plan')toWeekendPlan(s0.i);else{const b=bl.find(x=>x.id===s0.id);if(b&&!b.wk)toWeekendBl(s0.id)}}
    else if(s0.src==='plan'&&t==='next'){sendTo(s0.i,shiftDay(planDay,1))}
    else if(s0.src==='bl'&&t==='next'){blToDate(s0.id,shiftDay(planDay,1))}
    else if(s0.src==='bl'&&t==='bl'){const from=bl.findIndex(x=>x.id===s0.id);if(from<0)return;const sn=snap(),[b]=bl.splice(from,1),was=!!b.wk;if(was){wkUnlink(b);delete b.wk}const j=s0.bef?bl.findIndex(x=>x.id===s0.bef):-1;bl.splice(j>=0?j:bl.length,0,b);store('bl',bl);render();if(was){lastSnap=sn;toast(`${esc(b.n)} regresó al backlog`,'Deshacer','undoSnap()')}}});
})();

/* ===== Fin de semana (cuadro amarillo del backlog) ===== */
const WK_MAX=5;let lastSnap=null;
function snap(){return JSON.stringify({plans,bl})}
function undoSnap(){if(!lastSnap)return;const o=JSON.parse(lastSnap);lastSnap=null;plans=o.plans;bl=o.bl;store('plans',plans);store('bl',bl);setPlanDay(planDay);render();hideToast()}
function wkDays(n){const out=[],d=new Date();d.setHours(12,0,0,0);for(let i=0;i<70&&out.length<(n||2);i++){d.setDate(d.getDate()+1);const w=d.getDay();if(w===6||w===0)out.push(dkey(d))}return out}
const cap=x=>x.charAt(0).toUpperCase()+x.slice(1);
function wkLbl(k){const d=kDate(k);return (d.getDay()===6?'sábado ':'domingo ')+d.getDate()}
function wkCount(k){return (plans[k]||[]).filter(a=>!a.quick).length}
let wkForce=false,wkPend=null;
function wkPick(force){const ds=wkDays(force?8:2),k=ds.find(k=>wkCount(k)<WK_MAX);return k||(force?ds[ds.length-1]:null)}
function wkFull(p){wkPend=p;const [sa,su]=wkDays();
  modal(`<h1>🏖️ Fin de semana lleno</h1><div class="muted" style="margin:6px 0 4px">Ya tienes ${WK_MAX*2} actividades: ${cap(wkLbl(sa))} ${wkCount(sa)}/${WK_MAX} · ${cap(wkLbl(su))} ${wkCount(su)}/${WK_MAX}.</div><div class="muted">¿La mando al siguiente fin de semana?</div>
  <div class="row"><button class="btn gray" onclick="closeModal()">Cancelar</button><button class="btn" onclick="wkNext()">Siguiente fin</button></div>`)}
function wkNext(){closeModal();const p=wkPend;wkPend=null;if(!p)return;wkForce=true;try{if(p.src==='plan'){const i=acts.findIndex(x=>x.id===p.id);if(i>=0)toWeekendPlan(i)}else toWeekendBl(p.id)}finally{wkForce=false}}
function wkUnlink(b){if(!b||!b.wk)return;const l=plans[b.wk.k];if(l){const j=l.findIndex(x=>x.id===b.wk.pid);if(j>=0&&!l[j].done)l.splice(j,1)}store('plans',plans)}
function wkClean(){const td=dkey(new Date());let ch=false;
  bl=bl.filter(b=>{if(!b.wk)return true;if(b.wk.k<=td){ch=true;return false}
    if(!(plans[b.wk.k]||[]).some(x=>x.id===b.wk.pid)){delete b.wk;ch=true}return true});
  if(ch)store('bl',bl)}
function toWeekendPlan(i){const a=acts[i];if(!a||a.done)return;if(!wkForce&&!wkPick())return wkFull({src:'plan',id:a.id});const sn=snap();if(a.rid&&(a.rk||planDay)===planDay)recSkip(a.rid,planDay);
  acts.splice(i,1);store('acts',acts);const {done,rid,rk,warned30,t,cid,...rest}=a;wkPlace(rest,null,sn)}
function toWeekendBl(id){const b=bl.find(x=>x.id===id);if(!b)return;if(!wkForce&&!wkPick())return wkFull({src:'bl',id});const sn=snap();wkUnlink(b);const {c,wk,id:_,...rest}=b;wkPlace(rest,b,sn)}
function wkPlace(rest,b,sn){const k=wkPick(wkForce);plans[k]=plans[k]||[];const it={...rest,id:uid()};delete it.c;delete it.wk;plans[k].push(it);
  if(b)b.wk={k,pid:it.id};else bl.push({...rest,id:uid(),c:Date.now(),wk:{k,pid:it.id}});
  store('plans',plans);store('bl',bl);setPlanDay(planDay);render();lastSnap=sn;
  toast(`🏖️ ${esc(it.n)} → ${wkLbl(k)} (${wkCount(k)}/${WK_MAX})`,'Deshacer','undoSnap()')}


/* ===== Backlog en el iPhone ===== */
['bmN','bmM'].forEach(x=>{const e=$(x);if(e)e.addEventListener('keydown',ev=>{if(ev.key==='Enter')bmAdd()})});
function bmAdd(){const n=$('bmN').value.trim(),m=parseFloat($('bmM').value);if(!n)return;const q=!(m>0);
  bl.push({id:uid(),n,m:q?5:m,...(q?{quick:true}:{}),c:Date.now()});$('bmN').value='';$('bmM').value='';store('bl',bl);renderBlM();$('bmN').focus()}
function renderBlM(){const L=$('bmList');if(!L)return;const now=Date.now(),main=bl.filter(b=>!b.wk),wkl=bl.filter(b=>b.wk).sort((a,b)=>a.wk.k<b.wk.k?-1:1);
  const pill=b=>`<span class="t${b.quick?' quick':''}" onclick="blEdit('${b.id}')">${b.quick?'⚡ <5 min':b.m+' min'}</span>`;
  const dn=planDay===dkey(new Date())?'hoy':dayName(planDay);
  L.innerHTML=main.length?main.map(b=>{const age=Math.floor((now-(b.c||now))/86400000);
    return `<li><span class="n">${esc(b.n)}${age>=7?`<br><span class="age" style="font-size:12px;color:#ffb340">hace ${age} días</span>`:''}</span>${pill(b)}<button class="bmb wkb" onclick="toWeekendBl('${b.id}')" title="Al fin de semana">🏖️</button><button class="bmb go" onclick="blToDay('${b.id}')" title="Pasar a ${dn}">→</button><button class="bmb x" onclick="blDel('${b.id}')">✕</button></li>`}).join('')
    :'<div class="blempty">Vacío. Escribe arriba las tareas que quieras tener a la mano esta semana.</div>';
  const tot=main.reduce((s,b)=>s+(b.quick?5:(+b.m||0)),0);$('bmFoot').textContent=main.length?`${main.length} tarea${main.length>1?'s':''} · ${fmtMin(tot)} · → las pasa a ${dn}`:'';
  const [sa,su]=wkDays(),full=wkCount(sa)>=WK_MAX&&wkCount(su)>=WK_MAX;const W=$('bmWk');W.classList.toggle('full',full);
  W.innerHTML=`<b>🏖️ Fin de semana</b><div class="wks">${cap(wkLbl(sa))}: ${wkCount(sa)}/${WK_MAX} · ${cap(wkLbl(su))}: ${wkCount(su)}/${WK_MAX}${full?' · <span class="fullt">¡Lleno!</span>':''}</div>`+
    (wkl.length?`<ul id="bmWkL">${wkl.map(b=>`<li><span class="n">${esc(b.n)}<br><span class="wkd">${cap(wkLbl(b.wk.k))}</span></span>${pill(b)}<button class="bmb go" onclick="blToDay('${b.id}')">→</button><button class="bmb x" onclick="wkDel('${b.id}')">✕</button></li>`).join('')}</ul>`:`<div class="wks" style="margin-top:6px">Pícale 🏖️ a una tarea para mandarla al ${wkLbl(sa)} o ${wkLbl(su)}.</div>`)}
