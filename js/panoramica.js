/* Vista panorámica: semana y mes */

/* ===== Visualización semanal / mensual ===== */
let wvMode='sem',wvRef=dkey(new Date()),wvHide=(()=>{try{return localStorage.getItem('wvHide')==='1'}catch(e){return false}})();
function wvHideSet(v){wvHide=v;try{localStorage.setItem('wvHide',v?'1':'0')}catch(e){}renderWeek()}const WV_H0=5,WV_H1=24;
const wvMon=k=>{const d=kDate(k),w=(d.getDay()+6)%7;d.setDate(d.getDate()-w);return dkey(d)};
const WD_S=['Lun','Mar','Mié','Jue','Vie','Sáb','Dom'],MES=['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function wvSet(m){wvMode=m;$('wvW').classList.toggle('on',m==='sem');$('wvM').classList.toggle('on',m==='mes');renderWeek()}
function wvMove(n){const d=kDate(wvRef);if(wvMode==='sem')d.setDate(d.getDate()+7*n);else{d.setDate(1);d.setMonth(d.getMonth()+n)}wvRef=dkey(d);renderWeek()}
function wvToday(){wvRef=dkey(new Date());renderWeek()}
function wvItems(k){materialize(k);const l=plans[k]||[];return wvHide?l.filter(a=>!a.done):l}
function wvHourH(){return innerWidth<700?40:48}
function renderWeek(){const hb=$('wvHide');if(hb)hb.checked=wvHide;if(wvMode==='mes')return renderMonth();
  const H=wvHourH(),mon=wvMon(wvRef),days=[...Array(7)].map((_,i)=>shiftDay(mon,i)),td=dkey(new Date());
  const d0=kDate(days[0]),d6=kDate(days[6]);
  $('wvLabel').textContent=d0.getMonth()===d6.getMonth()?`${d0.getDate()} – ${d6.getDate()} de ${MES[d6.getMonth()]}`:`${d0.getDate()} ${MES[d0.getMonth()].slice(0,3)} – ${d6.getDate()} ${MES[d6.getMonth()].slice(0,3)}`;
  $('wvHint').textContent='Pica un espacio vacío para crear una actividad de 30 min a esa hora. Pica una actividad para editarla.'+(wvHide?'':' En gris: lo que registraste.');
  const totH=(WV_H1-WV_H0)*H,y=(h,m)=>((h-WV_H0)*60+m)/60*H;
  let head='<div class="wkh corner"></div>',all='<div class="wkall lab">sin<br>hora</div>',axis='',cols='';
  for(let h=WV_H0+1;h<WV_H1;h++)axis+=`<span style="top:${y(h,0)}px">${fmt12(pad(h)+':00').replace(':00','')}</span>`;
  let lines='';for(let h=WV_H0;h<WV_H1;h++){lines+=`<div class="wkline" style="top:${y(h,0)}px"></div><div class="wkline half" style="top:${y(h,30)}px"></div>`}
  let planned=0,cnt=0;
  days.forEach((k,di)=>{const d=kDate(k),isT=k===td,items=wvItems(k);
    head+=`<div class="wkh${isT?' today':''}">${WD_S[di]}<b>${d.getDate()}</b></div>`;
    const untimed=items.map((a,i)=>({a,i})).filter(o=>!o.a.t);
    all+=`<div class="wkall" data-k="${k}">${untimed.map(o=>`<div class="wkchip${o.a.done?' done':''}${o.a.quick?' q':''}" onclick="event.stopPropagation();wvEdit('${k}','${o.a.id}')" title="${esc(o.a.n)}">${o.a.quick?'⚡ ':''}${esc(o.a.n)}</div>`).join('')}</div>`;
    items.forEach(a=>{if(!a.quick){planned+=+a.m||0;cnt++}});
    // registro (gris)
    let lg='';if(!wvHide)log.filter(e=>e.d===k||(e.segs||[]).some(sg=>dkey(new Date(sg.s))===k)).forEach(e=>(e.segs||[]).forEach(sg=>{if(sg.e==null)return;const s0=new Date(sg.s);if(dkey(s0)!==k)return;
      const top=Math.max(0,y(s0.getHours(),s0.getMinutes()+s0.getSeconds()/60)),ht=Math.max(6,(sg.e-sg.s)/60000/60*H);if(top>totH)return;
      lg+=`<div class="wklog" style="top:${top}px;height:${Math.min(ht,totH-top)}px">${ht>=16?esc(e.n):''}</div>`}));
    // actividades con hora, en columnas si se enciman
    const ev=items.filter(a=>a.t).map(a=>{const [hh,mm]=a.t.split(':').map(Number),st=hh*60+mm,en=st+(+a.m||30);return {a,st,en,top:Math.max(0,y(hh,mm)),ht:Math.max(18,(+a.m||30)/60*H-2)}}).sort((p,q)=>p.st-q.st||q.en-p.en);
    let grp=[],gEnd=-1;const flush=()=>{const c=[];grp.forEach(b=>{let j=c.findIndex(e=>e<=b.st);if(j<0){j=c.length;c.push(0)}c[j]=b.en;b.col=j});grp.forEach(b=>b.n=c.length);grp=[]};
    ev.forEach(b=>{if(grp.length&&b.st>=gEnd){flush();gEnd=-1}grp.push(b);gEnd=Math.max(gEnd,b.en)});flush();
    const evh=ev.map(b=>{const w=100/b.n;const tiny=b.ht<30;
      return `<div class="wkev${b.a.done?' done':''}${b.a.rid?' rec':''}" style="top:${b.top}px;height:${b.ht}px;left:calc(${w*b.col}% + 2px);width:calc(${w}% - 4px)" onclick="event.stopPropagation();wvEdit('${k}','${b.a.id}')" title="${esc(b.a.n)} · ${fmt12(b.a.t)} · ${b.a.m} min">${tiny?`<b>${esc(b.a.n)}</b> <span class="tm">${fmt12(b.a.t)}</span>`:`<div class="tm">${fmt12(b.a.t)} · ${b.a.m} min</div><b>${b.a.rid?'🔁 ':''}${esc(b.a.n)}</b>`}</div>`}).join('');
    let now='';if(isT){const n=new Date(),hy=y(n.getHours(),n.getMinutes());if(hy>=0&&hy<=totH)now=`<div class="wknow" style="top:${hy}px"></div>`}
    cols+=`<div class="wkcol${isT?' today':''}" data-k="${k}" style="height:${totH}px">${lines}${lg}${evh}${now}<div class="wkghost"></div></div>`});
  const sc=document.querySelector('#wvBody .wkscroll'),keep=sc?sc.scrollTop:null;
  $('wvBody').innerHTML=`<div class="wkscroll"><div class="wk">${head}${all}<div class="wkaxis" style="height:${totH}px">${axis}</div>${cols}</div></div>
    <div class="wvsum"><span>${cnt} actividades planeadas</span><span>${fmtMin(planned)} planeado en la semana</span></div>`;
  const sc2=document.querySelector('#wvBody .wkscroll');
  if(keep!=null)sc2.scrollTop=keep;else{const n=new Date();sc2.scrollTop=Math.max(0,y(Math.max(WV_H0,n.getHours()-2),0))}
  document.querySelectorAll('#wvBody .wkcol').forEach(c=>{const g=c.querySelector('.wkghost');
    const at=e=>{const r=c.getBoundingClientRect(),mins=Math.floor(((e.clientY-r.top)/H*60)/15)*15+WV_H0*60;return Math.max(WV_H0*60,Math.min(WV_H1*60-30,mins))};
    c.addEventListener('mousemove',e=>{if(e.target.closest('.wkev')){g.style.display='none';return}const m=at(e);g.style.display='block';g.style.top=y(0,m-WV_H0*60+WV_H0*60)-0+'px';g.style.top=((m-WV_H0*60)/60*H)+'px';g.style.height=(30/60*H-2)+'px';g.textContent='+ '+fmt12(pad(Math.floor(m/60))+':'+pad(m%60))});
    c.addEventListener('mouseleave',()=>g.style.display='none');
    c.addEventListener('click',e=>{if(e.target.closest('.wkev'))return;const m=at(e);wvCreate(c.dataset.k,pad(Math.floor(m/60))+':'+pad(m%60))})});
  document.querySelectorAll('#wvBody .wkall[data-k]').forEach(c=>c.addEventListener('click',e=>{if(e.target.closest('.wkchip'))return;wvCreate(c.dataset.k,null)}))}
function renderMonth(){const r=kDate(wvRef);r.setDate(1);const m=r.getMonth(),start=wvMon(dkey(r)),td=dkey(new Date());
  $('wvLabel').textContent=MES[m].charAt(0).toUpperCase()+MES[m].slice(1)+' '+r.getFullYear();
  $('wvHint').textContent='Pica un espacio vacío de un día para crear una actividad de 30 min. Pica el número del día para ver esa semana.';
  let h=WD_S.map(w=>`<div class="moh">${w}</div>`).join(''),planned=0,cnt=0;const last=new Date(r.getFullYear(),m+1,0);
  const weeks=Math.ceil((((r.getDay()+6)%7)+last.getDate())/7);
  for(let i=0;i<weeks*7;i++){const k=shiftDay(start,i),d=kDate(k),out=d.getMonth()!==m,items=(out?(plans[k]||[]).filter(a=>!wvHide||!a.done):wvItems(k)).slice().sort((a,b)=>(a.t||'99')<(b.t||'99')?-1:1);
    if(!out)items.forEach(a=>{if(!a.quick){planned+=+a.m||0;cnt++}});
    const show=items.slice(0,4);
    h+=`<div class="mocell${out?' out':''}${k===td?' today':''}" data-k="${k}"><span class="mon" onclick="event.stopPropagation();wvRef='${k}';wvSet('sem')">${d.getDate()}</span>${show.map(a=>`<div class="wkchip${a.done?' done':''}${a.quick?' q':''}" onclick="event.stopPropagation();wvEdit('${k}','${a.id}')" title="${esc(a.n)}">${a.t?`<span style="color:#8fb8e8">${fmt12(a.t).replace(' ','')}</span> `:''}${a.quick?'⚡ ':''}${esc(a.n)}</div>`).join('')}${items.length>4?`<div class="momore">+${items.length-4} más</div>`:''}</div>`}
  $('wvBody').innerHTML=`<div class="mo">${h}</div><div class="wvsum"><span>${cnt} actividades planeadas</span><span>${fmtMin(planned)} planeado en el mes</span></div>`;
  document.querySelectorAll('#wvBody .mocell').forEach(c=>c.addEventListener('click',e=>{if(e.target.closest('.wkchip,.mon,.momore'))return;wvCreate(c.dataset.k,null)}))}
function wvCreate(k,t){const it={n:'Nueva actividad',m:30,id:uid(),...(t?{t}:{})};plans[k]=plans[k]||[];plans[k].push(it);store('plans',plans);setPlanDay(planDay);renderWeek();wvEdit(k,it.id,true)}
function wvEdit(k,id,isNew){const a=(plans[k]||[]).find(x=>x.id===id);if(!a)return;
  modal(`<h1>${isNew?'Nueva actividad':'Editar actividad'}</h1><div class="muted" style="margin-bottom:6px">${cap(dayName(k))}${isNew?' · ya quedó guardada':''}</div>
  <label>Actividad</label><input id="wvN" value="${esc(a.n)}" style="width:100%">
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px"><div><label>Minutos</label><input id="wvMin" type="number" value="${a.quick?'':a.m}" placeholder="--" style="width:100%;box-sizing:border-box"></div>
  <div><label>Hora <small class="muted">(opcional)</small></label><input id="wvT" type="time" value="${a.t||''}" style="width:100%;box-sizing:border-box"></div></div>
  <div class="row"><button class="btn gray" style="color:#ff453a" onclick="wvDel('${k}','${id}')">Borrar</button><button class="btn" onclick="wvSave('${k}','${id}')">Aceptar</button></div>`);
  setTimeout(()=>{const n=$('wvN');n.focus();if(isNew)n.select();[n,$('wvMin')].forEach(x=>x.addEventListener('keydown',e=>{if(e.key==='Enter')wvSave(k,id)}))},60)}
function wvSave(k,id){const a=(plans[k]||[]).find(x=>x.id===id);if(!a)return closeModal();const n=$('wvN').value.trim()||a.n,m=parseFloat($('wvMin').value),t=$('wvT').value;
  a.n=n;if(m>0){a.m=m;delete a.quick}else{a.m=5;a.quick=true}if(t)a.t=t;else delete a.t;delete a.warned30;store('plans',plans);setPlanDay(planDay);closeModal();renderWeek()}
function wvDel(k,id){const l=plans[k]||[],j=l.findIndex(x=>x.id===id);if(j<0)return closeModal();const sn=snap(),a=l[j];if(a.rid)recSkip(a.rid,a.rk||k);l.splice(j,1);store('plans',plans);setPlanDay(planDay);closeModal();renderWeek();
  lastSnap=sn;toast(`Borrada: ${esc(a.n)}`,'Deshacer','undoSnap();renderWeek()')}
setInterval(()=>{if($('s4').classList.contains('on')&&wvMode==='sem'&&!$('modal').classList.contains('on'))renderWeek()},60000);
