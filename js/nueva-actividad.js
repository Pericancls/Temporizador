/* Mini calendario y formulario "Nueva actividad" estilo iPhone */

/* ===== Mini calendario + "Nueva actividad" estilo iPhone ===== */
function drawMcal(){const b=$('mcal');if(!b)return;const n=new Date(),y=n.getFullYear(),m=n.getMonth(),first=(new Date(y,m,1).getDay()+6)%7,dim=new Date(y,m+1,0).getDate();
  let g=['L','M','M','J','V','S','D'].map(x=>`<span class="w">${x}</span>`).join('');for(let i=0;i<first;i++)g+='<span class="o">.</span>';
  for(let d=1;d<=dim;d++)g+=`<span${d===n.getDate()?' class="t"':''}>${d}</span>`;
  b.innerHTML=`<div class="mh">${MES[m]}<i>＋</i></div><div class="mg">${g}</div><div class="mi"><span class="wd">${WD_S[(n.getDay()+6)%7]}</span><span class="d">${n.getDate()}</span></div>`}
function newEvent(){const td=dkey(new Date()),def=planDay>td?planDay:td,n=new Date();n.setMinutes(0,0,0);n.setHours(n.getHours()+1);const st=pad(n.getHours())+':00',en=pad(n.getHours())+':30';
  modal(`<div class="ev"><div class="evtop"><button onclick="closeModal()">Cancelar</button><b>Nueva actividad</b><button class="add" id="evAdd" onclick="evSave()" disabled>Agregar</button></div>
  <div class="evg"><div class="evr"><input class="full" id="evN" placeholder="Título" list="known" autocomplete="off"></div></div>
  <div class="evg">
    <div class="evr"><span>Sin hora</span><label class="sw"><input type="checkbox" id="evAll" onchange="evUpd()"><span></span></label></div>
    <div class="evr"><span>Fecha</span><input type="date" id="evD" value="${def}"></div>
    <div class="evr evt"><span>Empieza</span><input type="time" id="evS" value="${st}" oninput="evLink('s')"></div>
    <div class="evr evt"><span>Termina</span><input type="time" id="evE" value="${en}" oninput="evLink('e')"></div>
    <div class="evr"><span>Duración</span><span><input class="dur" type="number" id="evM" value="30" min="1" oninput="evLink('m')"> min</span></div>
    <div class="evr evq">${[30,40,60,120,180].map(v=>`<button type="button" data-v="${v}" class="${v===30?'on':''}" onclick="evQuick(${v})">${v<60?v+' min':v/60+' h'}</button>`).join('')}</div>
  </div>
  <div class="evg">
    <div class="evr"><span>Repetir</span><select id="evR" onchange="evUpd()"><option value="no">Nunca</option><option value="day">Cada día</option><option value="wkday">Entre semana (L–V)</option><option value="week">Cada semana</option><option value="month">Cada mes</option><option value="custom">Personalizar…</option></select></div>
    <div class="evr hide" id="evUr"><span>Termina la repetición</span><input type="date" id="evU" placeholder="fin de año"></div>
  </div>
  <div class="evg"><div class="evr"><textarea id="evNote" placeholder="Notas"></textarea></div></div>
  <button type="button" class="evbl" onclick="evToBacklog()">📥 Agregar a Backlog</button></div>`);
  $('evN').addEventListener('input',()=>{$('evAdd').disabled=!$('evN').value.trim()});$('evN').addEventListener('keydown',e=>{if(e.key==='Enter'&&$('evN').value.trim())evSave()});
  setTimeout(()=>$('evN').focus(),60)}
function evHi(){const v=parseFloat($('evM')&&$('evM').value);document.querySelectorAll('.evq button').forEach(b=>b.classList.toggle('on',+b.dataset.v===v))}
function evQuick(v){$('evM').value=v;evLink('m')}
function evToBacklog(){const n=$('evN').value.trim();if(!n){$('evN').focus();$('evN').placeholder='Escribe un título primero';return}const m=Math.max(1,parseFloat($('evM').value)||30),note=$('evNote').value.trim();
  bl.push({id:uid(),n,m,c:Date.now()});store('bl',bl);if(note){notes.unshift({id:uid(),ts:Date.now(),txt:note,act:n});store('notes',notes)}
  closeModal();render();toast(`📥 Al backlog: ${esc(n)} (${m} min)`)}
function evUpd(){const all=$('evAll').checked;document.querySelectorAll('.evt').forEach(r=>r.classList.toggle('hide',all));
  const r=$('evR').value;if(r==='custom'){const n=$('evN').value.trim();closeModal();recForm();setTimeout(()=>{if(n&&$('rfN'))$('rfN').value=n},50);return}
  $('evUr').classList.toggle('hide',r==='no')}
function evLink(w){setTimeout(evHi,0);const s=$('evS').value,e=$('evE').value,m=parseFloat($('evM').value);const tm=x=>{const [h,mm]=x.split(':').map(Number);return h*60+mm},ft=v=>{v=((v%1440)+1440)%1440;return pad(Math.floor(v/60))+':'+pad(v%60)};
  if((w==='s'||w==='m')&&s&&m>0)$('evE').value=ft(tm(s)+m);
  else if(w==='e'&&s&&e){let d=tm(e)-tm(s);if(d<=0)d+=1440;$('evM').value=d}}
function evSave(){const n=$('evN').value.trim();if(!n){$('evN').focus();return}const k=$('evD').value||dkey(new Date()),all=$('evAll').checked,s=all?'':$('evS').value,e=all?'':$('evE').value,m=Math.max(1,parseFloat($('evM').value)||30),r=$('evR').value,note=$('evNote').value.trim();
  let msg;
  let askId=null,askRec=null;if(r==='no'){const it={n,m,id:uid(),...(s?{t:s}:{})};plans[k]=plans[k]||[];plans[k].push(it);store('plans',plans);msg=`Agregada a ${dayName(k)}${s?' a las '+fmt12(s):''}`;if(s)askId=it.id}
  else{const d=kDate(k),wd=(d.getDay()+6)%7,yEnd=d.getFullYear()+'-12-31';
    const rec={id:uid(),n,type:r==='month'?'monthday':'week',days:r==='day'?[0,1,2,3,4,5,6]:r==='wkday'?[0,1,2,3,4]:r==='week'?[wd]:[],md:d.getDate(),nth:1,wd,start:s||'',end:s?e:'',dur:m,from:k,until:$('evU').value||yEnd,skip:[]};
    recs.push(rec);store('recs',recs);msg=`🔁 ${n} se repetirá desde ${dayName(k)}`;if(s)askRec=rec.id}
  if(note){notes.unshift({id:uid(),ts:Date.now(),txt:note,act:n});store('notes',notes)}
  closeModal();setPlanDay(planDay);render();if($('s4')&&$('s4').classList.contains('on'))renderWeek();if(askRec){toast(`${esc(msg)}. 📅 ¿La agrego a tu Calendario?`,'Sí, agregar',`recCal('${askRec}')`,10000)}else if(askId){toast(`${esc(msg)}. 📅 ¿La agrego a tu Calendario?`,'Sí, agregar',`calOne('${k}','${askId}')`,10000)}else toast(esc(msg))}
