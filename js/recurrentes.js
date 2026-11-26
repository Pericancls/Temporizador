/* Actividades recurrentes (🔁) y su paso al Calendario */

/* ===================== ACTIVIDADES RECURRENTES ===================== */
const WD=['L','M','M','J','V','S','D'],WDN=['lunes','martes','miércoles','jueves','viernes','sábado','domingo'],NTH={1:'Primer',2:'Segundo',3:'Tercer',4:'Cuarto','-1':'Último'};
function kDate(k){const [y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d)}
function occurs(r,k){if(k<r.from||k>r.until)return false;const d=kDate(k),dim=new Date(d.getFullYear(),d.getMonth()+1,0).getDate(),wd=(d.getDay()+6)%7;
  if(r.type==='week')return(r.days||[]).includes(wd);
  if(r.type==='monthday')return d.getDate()===Math.min(r.md,dim);
  if(r.type==='nth')return wd===r.wd&&(r.nth>0?Math.ceil(d.getDate()/7)===r.nth:d.getDate()+7>dim);
  return false}
function recDur(r){if(r.start&&r.end){const [a,b]=r.start.split(':').map(Number),[c,e]=r.end.split(':').map(Number);let m=c*60+e-(a*60+b);if(m<=0)m+=1440;return m}return r.dur||30}
function materialize(k){if(!k||!recs.length||k<dkey(new Date()))return;let add=false;const l=plans[k]=plans[k]||[];
  recs.forEach(r=>{if(!occurs(r,k)||(r.skip||[]).includes(k)||l.some(a=>a.rid===r.id&&(a.rk||k)===k))return;
    l.push({n:r.n,m:recDur(r),id:uid(),rid:r.id,rk:k,...(r.start?{t:r.start}:{}),...(r.lk!=null?{lk:r.lk}:{}),...(r.tr?{tr:r.tr}:{})});add=true});
  if(add){if(k===planDay)acts=l;try{localStorage.setItem('plans',JSON.stringify(plans))}catch(e){}queueSync()}else if(!l.length)delete plans[k]}
function recSkip(id,k){const r=recs.find(x=>x.id===id);if(!r)return;r.skip=(r.skip||[]).concat(k);store('recs',recs)}
function recTxt(r){let t=r.type==='week'?((r.days||[]).length===7?'Todos los días':(r.days||[]).length===5&&!r.days.includes(5)&&!r.days.includes(6)?'Lunes a viernes':'Cada '+(r.days||[]).map(i=>WDN[i]).join(', ')):r.type==='monthday'?`Día ${r.md} de cada mes`:`${NTH[r.nth]} ${WDN[r.wd]} de cada mes`;
  return t+(r.start?` · ${fmt12(r.start)}${r.end?'–'+fmt12(r.end):''}`:'')+` · ${fmtMin(recDur(r))}`}
function recList(){
  modal(`<div class="detail"><h1 style="font-size:24px">🔁 Actividades recurrentes</h1>
  ${recs.length?recs.map(r=>`<div class="recrow"><div><b>${esc(r.n)}</b><div class="meta">${recTxt(r)}</div><div class="meta">Hasta ${kDate(r.until).toLocaleDateString('es-MX',{day:'numeric',month:'short',year:'numeric'})}</div></div><button onclick="recForm('${r.id}')">Editar</button></div>`).join(''):'<div class="muted" style="margin:14px 0">Aún no tienes actividades recurrentes. Por ejemplo: una junta cada lunes a las 9:00.</div>'}
  <div class="row"><button class="btn gray" onclick="closeModal()">Cerrar</button><button class="btn" onclick="recForm()">＋ Nueva</button></div></div>`)}
let rf=null;
function recForm(id){const r=id?recs.find(x=>x.id===id):null,t=dkey(new Date());
  rf=r?JSON.parse(JSON.stringify(r)):{id:uid(),n:'',type:'week',days:[(new Date().getDay()+6)%7],md:new Date().getDate(),nth:1,wd:(new Date().getDay()+6)%7,start:'',end:'',dur:'',from:t,until:new Date().getFullYear()+'-12-31'};
  modal(`<div class="detail"><h1 style="font-size:24px">${r?'Editar':'Nueva'} actividad recurrente</h1>
  <label>Actividad</label><input id="rfN" value="${esc(rf.n)}" placeholder="ej. Junta de equipo">
  <label>Se repite</label><div class="seg sm" id="rfT"></div><div id="rfOpt"></div>
  <div class="row" style="margin:0;gap:10px"><div style="flex:1"><label>Hora de inicio</label><input id="rfS" type="time" value="${rf.start||''}"></div><div style="flex:1"><label>Hora de fin</label><input id="rfE" type="time" value="${rf.end||''}"></div></div>
  <label>…o duración (min)</label><input id="rfD" type="number" inputmode="numeric" value="${rf.start&&rf.end?recDur(rf):(rf.dur||'')}" placeholder="ej. 60" style="width:100%">
  <div style="display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px"><div><label>Desde</label><input id="rfF" type="date" style="width:100%;min-width:0;box-sizing:border-box" value="${rf.from}"></div><div><label>Hasta</label><input id="rfU" type="date" style="width:100%;min-width:0;box-sizing:border-box" value="${rf.until}"></div></div>
  <div class="muted" style="font-size:13px;margin-top:6px">Si no cambias "Hasta", se repite hasta el 31 de diciembre.</div>
  <div id="rfPrev" class="ccnote"></div>
  <div class="row"><button class="btn gray" onclick="recList()">Cancelar</button><button class="btn" onclick="recSave(${r?'true':'false'})">✓ Guardar</button></div>
  ${r?`<button class="linkbtn" style="color:#ff453a;padding:10px 0 0" onclick="recDel('${r.id}')">Eliminar esta actividad recurrente</button>`:''}</div>`);
  ['rfS','rfE'].forEach(x=>$(x).addEventListener('input',()=>{const s_=$('rfS').value,e_=$('rfE').value;if(s_&&e_)$('rfD').value=recDur({start:s_,end:e_});rfPrev()}));
  $('rfD').addEventListener('input',()=>{const s_=$('rfS').value,d=parseFloat($('rfD').value);if(s_&&d>0){const [a,b]=s_.split(':').map(Number),m=(a*60+b+d)%1440;$('rfE').value=pad(Math.floor(m/60))+':'+pad(m%60)}rfPrev()});
  rfDraw()}
function rfDraw(){$('rfT').innerHTML=[['week','Días de la semana'],['monthday','Día del mes'],['nth','1er/2º/último…']].map(([k,l])=>`<button class="${rf.type===k?'on':''}" onclick="rf.type='${k}';rfDraw()">${l}</button>`).join('');
  let o='';
  if(rf.type==='week')o=`<div class="wdays">${WD.map((d,i)=>`<button class="${rf.days.includes(i)?'on':''}" onclick="rf.days=rf.days.includes(${i})?rf.days.filter(x=>x!==${i}):rf.days.concat(${i}).sort();rfDraw()">${d}</button>`).join('')}</div>`;
  if(rf.type==='monthday')o=`<div class="inl">El día <input id="rfMD" type="number" min="1" max="31" value="${rf.md}" oninput="rf.md=+this.value;rfPrev()"> de cada mes</div>`;
  if(rf.type==='nth')o=`<div class="inl">El <select class="selx" onchange="rf.nth=+this.value;rfPrev()">${[1,2,3,4,-1].map(n=>`<option value="${n}" ${rf.nth===n?'selected':''}>${NTH[n].toLowerCase()}</option>`).join('')}</select><select class="selx" onchange="rf.wd=+this.value;rfPrev()">${WDN.map((n,i)=>`<option value="${i}" ${rf.wd===i?'selected':''}>${n}</option>`).join('')}</select> de cada mes</div>`;
  $('rfOpt').innerHTML=o;rfPrev()}
function rfRead(){rf.n=$('rfN').value.trim();rf.start=$('rfS').value;rf.end=$('rfE').value;rf.dur=parseFloat($('rfD').value)||0;rf.from=$('rfF').value||dkey(new Date());rf.until=$('rfU').value||(new Date().getFullYear()+'-12-31')}
function rfPrev(){if(!$('rfPrev'))return;rfRead();const nx=[];let k=rf.from>dkey(new Date())?rf.from:dkey(new Date());for(let i=0;i<400&&nx.length<4;i++){if(occurs(rf,k))nx.push(k);k=shiftDay(k,1)}
  $('rfPrev').innerHTML=nx.length?'Próximas: '+nx.map(k=>`<b>${kDate(k).toLocaleDateString('es-MX',{weekday:'short',day:'numeric',month:'short'})}</b>`).join(', '):'⚠️ Con estas opciones no cae ningún día.'}
function recSave(isEdit){rfRead();if(!rf.n){$('rfN').style.borderColor='#ff3b30';return}
  if(rf.type==='week'&&!rf.days.length)return rfPrev();
  if(!(rf.start&&rf.end)&&!(rf.dur>0)){$('rfD').style.borderColor='#ff3b30';return}
  if(rf.start&&rf.end)rf.dur=recDur(rf);
  if(isEdit){recClean(rf.id);recs=recs.map(x=>x.id===rf.id?rf:x)}else recs.push(rf);
  store('recs',recs);setPlanDay(planDay);render();recList();if(rf.start)toast(`🔁 ${esc(rf.n)} guardada. 📅 ¿La agrego a tu Calendario?`,'Sí, agregar',`recCal('${rf.id}')`,10000);else toast(`🔁 ${esc(rf.n)} guardada`)}
function recClean(id){const t=dkey(new Date());Object.keys(plans).forEach(k=>{if(k<t)return;plans[k]=plans[k].filter(a=>!(a.rid===id&&!a.done&&!a.prog))});cleanPlans();store('plans',plans);setPlanDay(planDay)}
function recDel(id){modal(`<h1>¿Eliminar?</h1><div class="muted">Se quitan sus próximas apariciones de tus planes. Lo que ya registraste se queda.</div><div class="row"><button class="btn gray" onclick="recForm('${id}')">Cancelar</button><button class="btn red" onclick="recClean('${id}');recs=recs.filter(x=>x.id!=='${id}');store('recs',recs);render();recList()">Eliminar</button></div>`)}
