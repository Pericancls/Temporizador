/* Registro: calendario, lista del día, línea de 24 h y edición de bloques */

/* ---- Registro ---- */
let cm=new Date();cm.setDate(1);let selDay=dkey(new Date());
function view(v){$('vCal').classList.toggle('on',v==='cal');$('vAct').classList.toggle('on',v==='act');$('calView').style.display=v==='cal'?'':'none';$('actView').style.display=v==='act'?'':'none';if(v==='act')renderAct()}
function month(d){cm.setMonth(cm.getMonth()+d);renderLog()}
function pick(k){selDay=k;renderLog()}
function renderLog(){
  $('mLabel').textContent=cm.toLocaleDateString('es-MX',{month:'long',year:'numeric'});
  const counts={};log.forEach(e=>counts[e.d]=(counts[e.d]||0)+1);
  const first=(cm.getDay()+6)%7, days=new Date(cm.getFullYear(),cm.getMonth()+1,0).getDate(), today=dkey(new Date());
  let h=['L','M','M','J','V','S','D'].map(x=>`<div class="dw">${x}</div>`).join('');
  for(let i=0;i<first;i++)h+='<div class="day blank"></div>';
  for(let d=1;d<=days;d++){const k=cm.getFullYear()+'-'+pad(cm.getMonth()+1)+'-'+pad(d);
    h+=`<div class="day${dnotes[k]&&dnotes[k].t?' nt':''}${counts[k]?' has':''}${k===today?' today':''}${k===selDay?' sel':''}" onclick="pick('${k}')">${d}${counts[k]?`<small>${counts[k]}</small>`:''}</div>`}
  $('grid').innerHTML=h;
  const [y,m,dd]=selDay.split('-').map(Number);
  $('dayTitle').textContent=new Date(y,m-1,dd).toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'});
  const items=log.map((e,i)=>({...e,i})).filter(e=>e.d===selDay).sort((a,b)=>a.h.localeCompare(b.h));
  renderTl();dnDraw();$('dayMet').innerHTML=dayMetric(selDay)+dayGaps(selDay)+dayEst(selDay);
  const d0=new Date(y,m-1,dd).getTime(),d1=new Date(y,m-1,dd+1).getTime();
  const ow=openWork().map(w=>({...w,day:w.segs.filter(x=>x.e>d0&&x.s<d1).map(x=>({s:Math.max(x.s,d0),e:Math.min(x.e,d1)}))})).filter(w=>w.day.length);
  const owHtml=ow.length?`<h3 style="font-size:16px">⏸ Sin terminar</h3>`+ow.map(w=>{const mins=w.day.reduce((a,x)=>a+(x.e-x.s),0)/60000;
    return`<div class="entry openw" onclick="tab(1)"><div class="top"><b>${w.kind==='curso'?'▶ ':'⏸ '}${esc(w.n)}</b><span class="over">${w.kind==='curso'?'en curso':'pausada'}</span></div>
    <div class="meta">Trabajado este día: ${fmtMin(mins)}${Math.abs(mins*60-w.el)>60?` · total llevas ${fmtMin(w.el/60)}`:''}</div><div class="meta">🕒 ${w.day.map(x=>hm(x.s)+'–'+hm(x.e)).join(' · ')}</div></div>`}).join(''):'';
  $('dayList').innerHTML=(items.length?items.map(entry).join('')+`<div class="muted" style="margin-top:6px">Total del día: ${fmtMin(items.reduce((s,e)=>s+e.real,0))}</div>`:(ow.length?'':'<div class="empty">Sin actividades este día</div>'))+owHtml;
}
const TLC=['#34c759','#0a84ff','#ff9f0a','#bf5af2','#ff375f','#64d2ff','#ffd60a','#30d158','#5e5ce6','#ac8e68'];
function tlColor(n){let h=0;for(const c of n.toLowerCase())h=(h*31+c.charCodeAt(0))>>>0;return TLC[h%TLC.length]}
/* Trabajo de actividades que aún no terminan (pausadas o corriendo): cada pausa cierra un bloque */
function openWork(){const out=[];
  Object.values(plans).forEach(l=>(l||[]).forEach(a=>{if(!a.prog||a.done)return;let sg=normSegs(a.prog.segs).filter(x=>x.e!=null);
    if(!sg.length&&a.prog.st&&a.prog.el>0)sg=[{s:a.prog.st,e:a.prog.st+a.prog.el*1000}];if(sg.length)out.push({n:a.n,segs:sg,kind:'pausa',el:a.prog.el})}));
  if(cur2){const sg=c2Segs();out.push({n:cur2.n,segs:sg,kind:'curso',el:c2El()})}
  if($('run').classList.contains('on')&&cur&&!inBreak){const now=Date.now();const sg=normSegs(cur.segs).map(x=>({s:x.s,e:x.e==null?now:x.e})).filter(x=>x.e>x.s);
    if(sg.length)out.push({n:cur.n,segs:sg,kind:'curso',el:cur.elapsed})}
  return out}
function renderTl(){
  const [y,m,d]=selDay.split('-').map(Number),d0=new Date(y,m-1,d).getTime(),d1=new Date(y,m-1,d+1).getTime(),H=24*36;
  const blocks=[];log.forEach((e,i)=>segsOf(e).forEach(sg=>{const a=Math.max(sg.s,d0),b=Math.min(sg.e,d1);if(b>a)blocks.push({i,n:e.n,a,b})}));
  openWork().forEach(w=>w.segs.forEach(sg=>{const a=Math.max(sg.s,d0),b=Math.min(sg.e,d1);if(b>a)blocks.push({i:-1,n:w.n,a,b,open:w.kind})}));
  if(!blocks.length){$('dayTl').innerHTML='';return}
  blocks.sort((p,q)=>p.a-q.a);
  const cmap={};blocks.forEach(x=>{if(!(x.n in cmap))cmap[x.n]=TLC[Object.keys(cmap).length%TLC.length]});const col=n=>cmap[n];
  const tot={};blocks.forEach(x=>tot[x.n]=(tot[x.n]||0)+(x.b-x.a));const sum=Object.values(tot).reduce((p,q)=>p+q,0)/60000;
  let hrs='';for(let h=0;h<24;h++)hrs+=`<div class="tlh" style="top:${h*36}px"><span>${fmt12(pad(h)+':00').replace(':00','')}</span></div>`;
  const bl=blocks.map(x=>{const top=(x.a-d0)/864e5*H,ht=Math.max(4,(x.b-x.a)/864e5*H),c=col(x.n);
    return`<div class="tlb${x.open?' open':''}" onclick="${x.open?'tab(1)':`openEntry(${x.i})`}" style="top:${top}px;height:${ht}px;background:${c}${x.open?'1f':'33'};border-left:4px solid ${c};${x.open?`outline:1.5px dashed ${c};outline-offset:-1.5px;`:''}">${ht>=11?`<b${ht<16?' style="font-size:10px;line-height:1"':''}>${x.open==='pausa'?'⏸ ':x.open==='curso'?'▶ ':''}${esc(x.n)}</b>${ht>=30?`<span>${hm(x.a)}–${hm(x.b)}</span>`:''}`:''}</div>`}).join('');
  const now=Date.now(),nl=now>d0&&now<d1?`<div class="tlnow" style="top:${(now-d0)/864e5*H}px"></div>`:'';
  const leg=Object.entries(tot).sort((p,q)=>q[1]-p[1]).map(([n,v])=>`<div class="tll"><i style="background:${col(n)}"></i><span>${esc(n)}</span><b>${fmtMin(v/60000)}</b></div>`).join('');
  $('dayTl').innerHTML=`<h3>🕒 Tu día en 24 horas</h3>
  <div class="tlsum">En actividades: <b>${fmtMin(sum)}</b> · <span>${Math.round(sum/14.4)}% del día</span></div>
  <div class="tlstrip">${blocks.map(x=>`<i style="left:${(x.a-d0)/864e5*100}%;width:${Math.max(.4,(x.b-x.a)/864e5*100)}%;background:${col(x.n)}"></i>`).join('')}</div>
  <div class="tlax"><span>12am</span><span>6am</span><span>12pm</span><span>6pm</span><span>12am</span></div>
  <div class="tlwrap" id="tlWrap"><div class="tl" style="height:${H}px">${hrs}${bl}${nl}</div></div>
  <div class="tlleg">${leg}</div>`;
  const w=$('tlWrap');if(w)w.scrollTop=Math.max(0,(blocks[0].a-d0)/864e5*H-40);
}
function entry(e){
  const diff=e.real-e.plan,extMin=(e.ext||[]).reduce((a,x)=>a+(+x.min||0),0),total=e.plan+extMin;
  const sg=segsOf(e),pn=(e.post||[]).length,G=90000;
  const an=notes.filter(n=>!n.del&&n.act===e.n);
  const extN=(e.ext||[]).filter(x=>x.note);
  const inB=n=>sg.some(b=>n.ts>=b.s-G&&n.ts<=b.e+G),gen=an.filter(n=>!inB(n)&&dkey(new Date(n.ts))===e.d).sort((a,c)=>a.ts-c.ts);
  const rows=sg.map((b,k)=>{const ns=an.filter(n=>n.ts>=b.s-G&&n.ts<=b.e+G).sort((a,c)=>a.ts-c.ts).map(n=>`<div class="ebnote">📝 ${esc(n.txt).replace(/\n/g,'<br>')}</div>`);
    if(k===sg.length-1)extN.forEach(x=>ns.push(`<div class="ebnote">📝 <span class="muted">al pedir +${x.min} min:</span> ${esc(x.note).replace(/\n/g,'<br>')}</div>`));
    return `<div class="ebt">🕒 ${hm(b.s)}–${hm(b.e)} <span class="muted">· ${fmtMin((b.e-b.s)/60000)}</span></div><div class="ebn">${ns.join('')||'<span class="ebnone">—</span>'}</div>`}).join('');
  return`<div class="entry" onclick="openEntry(${e.i})"><div class="top etop"><div><b>${esc(e.n)}</b>${e.manual?' <span class="muted">✍︎</span>':''}${e.ok?'':' <span class="over" style="font-size:13px">sin terminar</span>'}</div>
  <div class="enums"><span>Planeado <b>${fmtMin(e.plan)}</b></span><span>Real <b class="${diff>0.5?'over':'under'}">${fmtMin(e.real)}</b></span><span title="Planeado + tiempo extra que pediste">Total <b>${fmtMin(total)}</b></span></div></div>
  <div class="ebh"><span>Bloques</span><span>Notas por bloque</span></div><div class="eb">${rows}</div>
  ${gen.length?`<div class="ebh" style="grid-template-columns:1fr"><span>Notas generales</span></div>${gen.map(n=>`<div class="ebnote" style="margin-top:6px">📝 <span class="muted">${hm(n.ts)}</span> ${esc(n.txt).replace(/\n/g,'<br>')}</div>`).join('')}`:''}
  ${pn?`<div class="note post">🗒️ ${pn} nota${pn>1?'s':''} después</div>`:''}
  <div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px"><span class="muted" style="font-size:12px">Toca para ver y agregar notas</span><span><button class="edl" onclick="event.stopPropagation();editEntry(${e.i})">editar</button><button onclick="event.stopPropagation();rm(${e.i})" style="background:none;border:none;color:#666;font-size:13px">borrar</button></span></div></div>`;
}
function openEntry(i){const e=log[i];if(!e)return;
  const [y,m,d]=e.d.split('-').map(Number),fecha=new Date(y,m-1,d).toLocaleDateString('es-MX',{weekday:'long',day:'numeric',month:'long'});
  const dur=(e.ext||[]).filter(x=>x.note),post=e.post||[];
  const f=ts=>{const x=new Date(ts);return x.toLocaleDateString('es-MX',{day:'numeric',month:'short'})+' '+pad(x.getHours())+':'+pad(x.getMinutes())};
  modal(`<div class="detail"><h1 style="font-size:24px">${esc(e.n)}</h1><div class="muted" style="text-transform:capitalize">${fecha} · ${e.h}</div>
  <div class="meta" style="margin-top:6px">🕒 ${segsOf(e).length>1?'Sesiones: ':''}${segTxt(e)}</div><div class="meta" style="margin-top:4px">Planeado ${fmtMin(e.plan)} · Real ${fmtMin(e.real)}${e.ext&&e.ext.length?` · ${e.ext.length} extensión${e.ext.length>1?'es':''}`:''}</div>
  <h3>📝 Notas durante la actividad</h3>
  ${dur.length?dur.map(x=>`<div class="note"><div class="nh">Al pedir +${x.min} min${x.pct!=null?` · faltaba ${x.pct}%`:''}</div>${esc(x.note).replace(/\n/g,'<br>')}</div>`).join(''):'<div class="muted" style="font-size:14px">Sin notas</div>'}
  <h3>🗒️ Notas después</h3>
  ${post.length?post.map((x,k)=>`<div class="note post"><div class="nh">${f(x.ts)}<button onclick="delPost(${i},${k})">✕</button></div>${esc(x.txt).replace(/\n/g,'<br>')}</div>`).join(''):'<div class="muted" style="font-size:14px">Aún no hay notas</div>'}
  <textarea id="pNote" rows="3" placeholder="Agrega una nota o aprendizaje…" style="margin-top:10px"></textarea>
  <div class="row"><button class="btn gray" onclick="closeModal()">Cerrar</button><button class="btn" onclick="addPost(${i})">＋ Agregar nota</button></div>
  <button class="linkbtn" style="padding:12px 0 0" onclick="editEntry(${i})">✎ Editar este registro</button></div>`);
}
let eeBl=[],eeDay='';
function hhmm(ts){const x=new Date(ts);return pad(x.getHours())+':'+pad(x.getMinutes())}
function editEntry(i){const e=log[i];if(!e)return;eeDay=e.d;
  eeBl=segsOf(e).map(x=>({s:hhmm(x.s),e:hhmm(x.e)}));
  modal(`<h1>Editar registro</h1>
  <label>Actividad</label><input id="eeN" value="${esc(e.n)}">
  <label>Tiempo estimado (min)</label><input id="eeP" type="number" inputmode="decimal" value="${e.plan}" style="width:100%">
  <label>🕒 Bloques de trabajo</label><div id="eeB"></div>
  <button class="addbl" onclick="eeBl.push({s:'',e:''});eeDraw()">＋ Agregar otro bloque</button>
  <div class="eetot" id="eeT"></div>
  <label style="display:flex;align-items:center;gap:10px;color:#fff"><input id="eeOk" type="checkbox" ${e.ok?'checked':''} style="width:22px;height:22px"> La terminé</label>
  <button class="nowbtn" onclick="entryOngoing(${i})">⏱ Sigue en curso (pasarla a mi plan con la hora actual)</button>
  <div class="row"><button class="btn gray" onclick="openEntry(${i})">Cancelar</button><button class="btn" onclick="saveEntry(${i})">✓ Guardar</button></div>`);
  eeDraw();
}
function eeDraw(){$('eeB').innerHTML=eeBl.map((b,k)=>`<div class="blrow"><input type="time" value="${b.s}" oninput="eeBl[${k}].s=this.value;eeTot()"><span>a</span><input type="time" value="${b.e}" oninput="eeBl[${k}].e=this.value;eeTot()">${eeBl.length>1?`<button onclick="eeBl.splice(${k},1);eeDraw()">✕</button>`:''}</div>`).join('');eeTot()}
function eeSegs(){const [y,m,d]=eeDay.split('-').map(Number);return eeBl.filter(b=>b.s&&b.e).map(b=>{const [sh,sm]=b.s.split(':').map(Number),[eh,em]=b.e.split(':').map(Number);
  const s=new Date(y,m-1,d,sh,sm).getTime();let e=new Date(y,m-1,d,eh,em).getTime();if(e<=s)e+=864e5;return{s,e}}).sort((a,b)=>a.s-b.s)}
function eeTot(){const sg=eeSegs(),min=sg.reduce((a,x)=>a+(x.e-x.s),0)/60000;$('eeT').innerHTML=sg.length?`Tiempo real: <b>${fmtMin(min)}</b>${sg.length>1?` en ${sg.length} bloques`:''}`:'Pon la hora de inicio y de fin'}
function entryOngoing(i){const e=log[i];if(!e)return;
  const n=$('eeN').value.trim()||e.n,pl=parseFloat($('eeP').value)||e.plan;
  let sg=eeSegs();if(!sg.length)sg=segsOf(e).map(x=>({...x}));
  const now=Date.now();sg[sg.length-1].e=Math.max(sg[sg.length-1].e,now);
  const elS=sg.reduce((a,x)=>a+(x.e-x.s),0)/1000,tk=dkey(new Date()),id=uid();
  const it={n,m:pl,id,prog:{el:elS,rem:Math.max(0,pl*60-elS),tot:pl*60,ext:e.ext||[],mb:0,st:sg[0].s,segs:sg}};
  log.splice(i,1);plans[tk]=[it].concat(plans[tk]||[]);store('log',log);store('plans',plans);setPlanDay(tk);render();renderLog();
  modal(`<h1>Agregada a tu plan ✅</h1><div class="muted">${esc(n)} · llevas ${fmtMin(elS/60)}${it.prog.rem>0?` · quedan ${fmtMin(it.prog.rem/60)}`:' · ya pasó tu estimado'}</div>
  <div class="row"><button class="btn gray" onclick="closeModal()">Después</button><button class="btn" style="background:#ff9f0a;color:#000" onclick="closeModal();tab(1);resumeItem(acts.findIndex(a=>a.id==='${id}'))">▶ Continuar ahora</button></div>`);
}
function saveEntry(i){const e=log[i];if(!e)return closeModal();
  const n=$('eeN').value.trim(),pl=parseFloat($('eeP').value),sg=eeSegs();
  if(!n){$('eeN').style.borderColor='#ff3b30';return}if(!sg.length){$('eeT').style.color='#ff453a';return}
  const r=Math.round(sg.reduce((a,x)=>a+(x.e-x.s),0)/60000);
  e.n=n;e.real=r;e.plan=pl>0?pl:r;e.ok=$('eeOk').checked;e.segs=sg;e.h=hhmm(sg[0].s);
  store('log',log);renderLog();if($('vAct').classList.contains('on'))renderAct();openEntry(i)}
function addPost(i){const t=$('pNote').value.trim();if(!t){$('pNote').style.borderColor='#ff3b30';return}
  const e=log[i];e.post=(e.post||[]).concat({ts:Date.now(),txt:t});store('log',log);renderLog();openEntry(i)}
function delPost(i,k){const e=log[i];if(!e||!e.post)return;e.post.splice(k,1);if(!e.post.length)delete e.post;store('log',log);renderLog();openEntry(i)}
function rm(i){const e=log[i];if(!e)return;modal(`<h1>¿Borrar registro?</h1><div class="muted">${esc(e.n)} · ${e.h}. También se borran sus notas.</div><div class="row"><button class="btn gray" onclick="closeModal()">Cancelar</button><button class="btn red" onclick="closeModal();log.splice(${i},1);store('log',log);renderLog();renderAct()">Borrar</button></div>`)}
function confirmDel(){return true}
function stats(){const s={};log.filter(e=>e.ok).forEach(e=>{const k=e.n.toLowerCase();s[k]=s[k]||{n:e.n,c:0,sum:0,plan:0,min:1e9,max:0};const o=s[k];o.c++;o.sum+=e.real;o.plan+=e.plan;o.min=Math.min(o.min,e.real);o.max=Math.max(o.max,e.real)});
  Object.values(s).forEach(o=>{o.avg=o.sum/o.c;o.pavg=o.plan/o.c});return s}
function renderAct(){
  const s=Object.values(stats()).sort((a,b)=>b.c-a.c);
  $('actView').innerHTML=s.length?s.map(o=>{const r=o.avg/o.pavg;return`<div class="entry"><div class="top"><b>${esc(o.n)}</b><span class="muted">${o.c} ${o.c>1?'veces':'vez'}</span></div>
  <div class="meta">Promedio real <b style="color:#fff">${fmtMin(o.avg)}</b> · planeabas ${fmtMin(o.pavg)}</div>
  <div class="meta">Rango ${fmtMin(o.min)} – ${fmtMin(o.max)} · <span class="${r>1.05?'over':'under'}">${r>1.05?'tardas '+Math.round((r-1)*100)+'% más de lo que estimas':r<0.95?'terminas '+Math.round((1-r)*100)+'% antes':'estimas bien'}</span></div></div>`}).join(''):'<div class="empty">Aún no hay registros</div>';
}

function exportData(){
  const data=JSON.stringify({app:'temporizador',v:3,plans,log,recs,bl,notes,dnotes,qb,clk});
  const blob=new Blob([data],{type:'application/json'}),name='temporizador-'+dkey(new Date())+'.json';
  try{const f=new File([blob],name,{type:'application/json'});if(navigator.canShare&&navigator.canShare({files:[f]})){navigator.share({files:[f]}).catch(()=>{});return}}catch(e){}
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();
}
function importData(inp){
  const f=inp.files[0];if(!f)return;const r=new FileReader();
  r.onload=()=>{try{const d=JSON.parse(r.result);if(!Array.isArray(d.log))throw 0;
    const seen=new Set(log.map(e=>e.d+e.h+e.n));let n=0;d.log.forEach(e=>{if(!seen.has(e.d+e.h+e.n)){log.push(e);n++}});
    if(d.plans&&typeof d.plans==='object')Object.keys(d.plans).forEach(k=>{if(d.plans[k]&&d.plans[k].length)plans[k]=d.plans[k]});else if(Array.isArray(d.acts)&&d.acts.length)plans[dkey(new Date())]=d.acts;
    setPlanDay(planDay);store('log',log);store('plans',plans);render();renderLog();renderAct();
    modal(`<h1>Importado ✅</h1><div class="muted">${n} registros nuevos y tu plan del día.</div><div class="row"><button class="btn" onclick="closeModal()">OK</button></div>`)}
  catch(e){modal(`<h1>Archivo no válido</h1><div class="row"><button class="btn" onclick="closeModal()">OK</button></div>`)}inp.value=''};
  r.readAsText(f);
}

/* Métrica del día: actividad real sobre el día hábil de 18 h (5:00 am – 11:00 pm) */
function dayMetric(k){const [y,m,d]=k.split('-').map(Number),a=new Date(y,m-1,d,5).getTime(),b=new Date(y,m-1,d,23).getTime(),now=Date.now();
  if(a>now)return'';const act=[],rest=[];
  log.forEach(e=>segsOf(e).forEach(x=>(isRestN(e.n)?rest:act).push(x)));
  openWork().forEach(w=>w.segs.forEach(x=>(isRestN(w.n)?rest:act).push(x)));
  const A=sumMin(union(clip(act,a,b))),R=sumMin(union(clip(rest,a,b))),pct=Math.round(A/1080*100);
  const live=now<b,left=live?(b-now)/60000:0,sin=Math.max(0,1080-A-R-left);
  const hh=m=>(m/60).toFixed(1).replace('.0','')+' h';
  return`<div class="dmet"><div class="dmbig"><b>${hh(A)}</b><span> de 18 h · ${pct}%</span></div>
  <div class="dmbar"><i class="a" style="width:${A/10.8}%"></i><i class="r" style="width:${R/10.8}%"></i><i class="s" style="width:${sin/10.8}%"></i></div>
  <div class="dmleg"><span><i class="a"></i>Actividad ${hh(A)}</span><span><i class="r"></i>Descanso ${hh(R)}</span><span><i class="s"></i>Sin registrar ${hh(sin)}</span>${live?`<span>⏳ Quedan ${hh(left)}</span>`:''}</div></div>`}

/* Estimado vs real: solo las actividades que sí terminaste ese día */
function dayEst(k){const L=log.filter(e=>e.d===k&&e.ok&&e.plan>0&&!isRestN(e.n)).sort((a,b)=>a.h.localeCompare(b.h));if(!L.length)return'';
  const mx=Math.max(...L.map(e=>Math.max(e.plan,e.real))),P=L.reduce((s,e)=>s+e.plan,0),R=L.reduce((s,e)=>s+e.real,0),dv=Math.round((R-P)/P*100);
  return`<div class="dmet"><h4>🎯 Estimado vs real <small>(terminadas)</small></h4>${L.map(e=>{const d=Math.round((e.real-e.plan)/e.plan*100);
    return`<div class="ev"><div class="evn"><span>${esc(e.n)}</span><b class="${d>10?'over':d<-10?'under':''}">${fmtMin(e.plan)} → ${fmtMin(e.real)} (${d>0?'+':''}${d}%)</b></div>
    <div class="evb"><i class="p" style="width:${e.plan/mx*100}%"></i></div><div class="evb"><i class="rl ${d>10?'over':''}" style="width:${e.real/mx*100}%"></i></div></div>`}).join('')}
  <div class="dmleg"><span><i class="p"></i>Estimado</span><span><i class="rl"></i>Real</span><span>Total ${fmtMin(P)} → ${fmtMin(R)} (${dv>0?'+':''}${dv}%)</span></div></div>`}

/* Huecos entre actividades: tiempo sin nada corriendo entre que termina una y empieza la siguiente */
function dayGaps(k){const [y,m,d]=k.split('-').map(Number),a=new Date(y,m-1,d,5).getTime(),b=Math.min(new Date(y,m-1,d,23).getTime(),Date.now());
  const sg=[];log.forEach(e=>segsOf(e).forEach(x=>sg.push({...x,n:e.n})));openWork().forEach(w=>w.segs.forEach(x=>sg.push({...x,n:w.n})));
  const S=sg.map(x=>({s:Math.max(x.s,a),e:Math.min(x.e,b),n:x.n})).filter(x=>x.e>x.s).sort((p,q)=>p.s-q.s);if(S.length<2)return'';
  const gaps=[];let last=S[0];
  for(const x of S.slice(1)){if(x.s>last.e+60e3)gaps.push({s:last.e,e:x.s,from:last.n,to:x.n,fromLen:(last.e-last.s)/6e4});if(x.e>=last.e)last=x}
  const G=gaps.filter(g=>g.e-g.s>=5*60e3);if(!G.length)return'';
  const tot=G.reduce((s,g)=>s+(g.e-g.s),0)/6e4,big=G.filter(g=>g.e-g.s>=20*60e3);
  return`<div class="dmet"><h4>🕳️ Huecos entre actividades</h4><div class="dmbig"><b>${fmtMin(tot)}</b><span> en ${G.length} hueco${G.length>1?'s':''}${big.length?` · ${big.length} de más de 20 min`:''}</span></div>
  ${G.sort((p,q)=>(q.e-q.s)-(p.e-p.s)).slice(0,5).map(g=>{const mn=(g.e-g.s)/6e4;return`<div class="gp ${mn>=20?'over':''}"><b>${fmtMin(mn)}</b> ${hm(g.s)}–${hm(g.e)}<br><small>después de ${esc(g.from)}${g.fromLen>=60?' ('+fmtMin(g.fromLen)+')':''} → antes de ${esc(g.to)}</small></div>`}).join('')}</div>`}
