/* Notas: notas por actividad (📝) y notas del día en Registro */

/* ===== Notas personales (qué siento / qué me frena) ===== */
function mergeNotes(r,l){const m=new Map();(Array.isArray(r)?r:[]).concat(l||[]).forEach(n=>{if(!n||!n.id)return;const o=m.get(n.id);if(!o||(n.del&&!o.del))m.set(n.id,n)});return [...m.values()].sort((a,b)=>b.ts-a.ts)}
let ntAct='';
function notesOpen(i){const a=acts[i];if(!a)return;notesOpenName(a.n)}
function runNote(){const n=(cur&&!cur.rest&&cur.n)||(queue[idx+1]&&queue[idx+1].n)||(queue[idx]&&queue[idx].n);if(n)notesOpenName(n)}
function notesOpenName(nm){const a={n:nm};ntAct=nm;
  modal(`<h1>📝 Notas</h1><div class="muted" style="margin-bottom:8px">${esc(a.n)}</div>
  <textarea id="ntTxt" placeholder="¿Qué sientes, qué piensas, qué te está frenando?"></textarea>
  <div class="row"><button class="btn gray" onclick="closeModal()">Cerrar</button><button class="btn" onclick="noteSave()">Guardar</button></div>
  <div class="ntl" id="ntList"></div>`);notesDraw();setTimeout(()=>$('ntTxt').focus(),60)}
function notesDraw(){const L=$('ntList');if(!L)return;const ns=notes.filter(n=>!n.del&&n.act===ntAct).sort((a,b)=>b.ts-a.ts);
  L.innerHTML=ns.length?ns.map(n=>{const d=new Date(n.ts);return `<div class="nti"><div class="nh"><span>${dayName(dkey(d))} · ${hm(n.ts)}</span><button onclick="noteDel('${n.id}')" title="Borrar">✕</button></div><div class="nb">${esc(n.txt)}</div></div>`}).join(''):'<div class="muted" style="font-size:13px">Aún no hay notas de esta actividad.</div>'}
function noteSave(){const t=$('ntTxt').value.trim();if(!t){$('ntTxt').focus();return}
  notes.unshift({id:uid(),ts:Date.now(),txt:t,act:ntAct});store('notes',notes);$('ntTxt').value='';notesDraw();render();toast('📝 Nota guardada')}
let lastNote=null;
function noteDel(id){const n=notes.find(x=>x.id===id);if(!n)return;n.del=true;lastNote=n;store('notes',notes);notesDraw();render();
  toast('Nota borrada','Deshacer','delete lastNote.del;store(\'notes\',notes);notesDraw();render();hideToast()')}


/* ===== Notas del día (Registro) ===== */
function mergeDn(r,l){const o={...(l||{})};Object.entries(r||{}).forEach(([k,v])=>{if(!v)return;if(!o[k]||(v.u||0)>(o[k].u||0))o[k]=v});return o}
let dnT=null,dnDay=null,dnFn=null;
function dnFlush(){if(dnFn){clearTimeout(dnT);const f=dnFn;dnFn=null;f()}}
window.addEventListener('pagehide',dnFlush);document.addEventListener('visibilitychange',()=>{if(document.hidden)dnFlush()});
function dnDraw(){const t=$('dnTxt');if(!t)return;if(document.activeElement===t&&dnDay===selDay)return;dnDay=selDay;const v=dnotes[selDay];t.value=v&&v.t||'';
  $('dnSt').textContent=v&&v.u?'Guardado · '+hm(v.u):''}
function dnInput(){const k=dnDay||selDay,v=$('dnTxt').value;$('dnSt').textContent='Guardando…';clearTimeout(dnT);
  dnFn=()=>{dnFn=null;if(v.trim())dnotes[k]={t:v,u:Date.now()};else dnotes[k]={t:'',u:Date.now()};store('dnotes',dnotes);$('dnSt').textContent='Guardado ✓';
    const cell=[...document.querySelectorAll('#grid .day')].find(c=>c.getAttribute('onclick')===`pick('${k}')`);if(cell)cell.classList.toggle('nt',!!v.trim())};dnT=setTimeout(()=>dnFn&&dnFn(),600)}
