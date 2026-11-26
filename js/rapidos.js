/* Botones rápidos del Temporizador (Ejercicio, Desayuno, Baño…): los que tú agregas, editas y borras */

const QB_COLORS={
  naranja:{bg:'#2a1508',fg:'#ff9f0a',bd:'#a85a0c',sm:'#ffc56b'},
  amarillo:{bg:'#2a2306',fg:'#ffd60a',bd:'#a8890c',sm:'#ffe27a'},
  azul:{bg:'#0e1f33',fg:'#64d2ff',bd:'#1f5f8f',sm:'#9fdcff'},
  morado:{bg:'#1d1d24',fg:'#c7c7ff',bd:'#5e5ce6',sm:'#a5a3ff'},
  verde:{bg:'#0d2615',fg:'#30d158',bd:'#1f7a3a',sm:'#8fe3a6'},
  rojo:{bg:'#2d0f0d',fg:'#ff6961',bd:'#a3241c',sm:'#ff9a92'},
  gris:{bg:'#1c1c1e',fg:'#e5e5ea',bd:'#48484a',sm:'#aeaeb2'}
};
const QB_DEFAULT=[
  {id:'qb1',e:'🏋️',n:'Ejercicio',m:25,c:'naranja'},
  {id:'qb2',e:'🍳',n:'Desayuno',m:40,c:'amarillo'},
  {id:'qb3',e:'🛠️',n:'Mejorar la app',m:30,c:'azul'},
  {id:'qb4',e:'🚻',n:'Baño',m:10,c:'morado'}
];
let qb=(()=>{const v=load('qb',null);return Array.isArray(v)?v:QB_DEFAULT.map(x=>({...x}))})(),qbEdit=false;

function renderQb(){
  const box=$('qbList');if(!box)return;
  box.innerHTML=qb.map((b,i)=>{const c=QB_COLORS[b.c]||QB_COLORS.gris;
    return`<div class="qbrow"><button class="exbtn qb" style="background:${c.bg};color:${c.fg};border-color:${c.bd}" onclick="${qbEdit?`qbForm(${i})`:`startQuick(${esc(JSON.stringify(b.n)).replace(/'/g,'&#39;')},${b.m})`}">${esc(b.e||'⏱️')} ${esc(b.n)} <small style="color:${c.sm}">${b.m} min</small></button>${qbEdit?`<button class="qbx" onclick="qbDel(${i})" aria-label="Borrar">✕</button>`:''}</div>`}).join('')
    +`<div class="qbbar"><button class="linkbtn" onclick="qbForm(-1)">＋ Agregar botón rápido</button>${qb.length?`<button class="linkbtn" onclick="qbEdit=!qbEdit;renderQb()">${qbEdit?'✓ Listo':'✎ Editar'}</button>`:''}</div>`
    +(qbEdit?'<div class="muted" style="text-align:center;font-size:13px">Toca un botón para cambiarlo o ✕ para borrarlo.</div>':'');
}

function qbForm(i){
  const b=i>=0?qb[i]:{e:'',n:'',m:15,c:'azul'};let col=b.c||'azul';
  modal(`<h1>${i>=0?'Editar botón rápido':'Nuevo botón rápido'}</h1>
    <div class="row" style="gap:8px"><input id="qbE" maxlength="4" placeholder="🙂" value="${esc(b.e||'')}" style="width:64px;text-align:center;font-size:22px"><input id="qbN" placeholder="Nombre (ej. Comida)" value="${esc(b.n)}" style="flex:1"></div>
    <div class="qbms">${[5,10,15,20,25,30,40,45,60,90].map(m=>`<button class="qbm${m===b.m?' on':''}" onclick="qbPickM(${m})">${m}</button>`).join('')}</div>
    <div class="row" style="gap:8px;align-items:center"><input id="qbM" type="number" inputmode="numeric" min="1" value="${b.m}" style="width:90px;text-align:center"><span class="muted">minutos</span></div>
    <div class="qbcs">${Object.keys(QB_COLORS).map(k=>`<button class="qbc${k===col?' on':''}" data-c="${k}" style="background:${QB_COLORS[k].bg};border-color:${QB_COLORS[k].bd};color:${QB_COLORS[k].fg}" onclick="qbPickC('${k}')">●</button>`).join('')}</div>
    <div id="qbMsg" class="muted" style="color:#ff6961"></div>
    <div class="row"><button class="btn gray" onclick="closeModal()">Cancelar</button><button class="btn" onclick="qbSave(${i})">Guardar</button></div>`);
  setTimeout(()=>{const n=$('qbN');if(n&&!b.n)n.focus()},50);
}
function qbPickM(m){$('qbM').value=m;document.querySelectorAll('.qbm').forEach(x=>x.classList.toggle('on',+x.textContent===m))}
function qbPickC(k){document.querySelectorAll('.qbc').forEach(x=>x.classList.toggle('on',x.dataset.c===k))}
function qbSave(i){
  const n=$('qbN').value.trim(),m=Math.round(parseFloat($('qbM').value)),e=$('qbE').value.trim(),c=(document.querySelector('.qbc.on')||{}).dataset;
  if(!n){$('qbMsg').textContent='Ponle un nombre.';return}
  if(!(m>0&&m<=600)){$('qbMsg').textContent='Pon los minutos (1 a 600).';return}
  const it={id:i>=0?qb[i].id:'qb'+Date.now().toString(36),e:e||'⏱️',n,m,c:c&&c.c||'azul'};
  if(i>=0)qb[i]=it;else qb.push(it);
  store('qb',qb);closeModal();renderQb();toast(i>=0?'✓ Botón actualizado':'✓ Botón agregado: '+esc(n));
}
function qbDel(i){const b=qb[i];if(!b)return;qb.splice(i,1);store('qb',qb);renderQb();
  qbUndo={i,b};toast('Borrado: '+esc(b.n),'Deshacer','qbUndoDo()')}
let qbUndo=null;
function qbUndoDo(){if(!qbUndo)return;const {i,b}=qbUndo;qbUndo=null;qb.splice(Math.min(i,qb.length),0,b);store('qb',qb);renderQb();hideToast()}

renderQb();
