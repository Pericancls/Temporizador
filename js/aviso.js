/* Avisos por inactividad: la app guarda en Firestore si estás haciendo algo (live) y la suscripción
   de notificaciones de cada dispositivo (push). El robot de GitHub (robot/aviso.mjs) revisa cada 10 min
   y, si no hay nada corriendo en 40 min, manda "¿Qué estás haciendo?". Al tocarla se abre ?nudge=1. */
const VAPID_PUB='BKcrVbQ62HCTyQhPRfae_8GL0adXkF-mymUT2zR4OIkjSdRPVUdTcKnDq_rkLs5-vrvoGS7zGCgUCWHuw6gdtAQ';
let pushSubs=(()=>{const v=load('pushSubs',{});return v&&typeof v==='object'?v:{}})();
let liveAt=Date.now();

function liveNow(){return{run:!!((typeof running!=='undefined'&&running)||(typeof inBreak!=='undefined'&&inBreak)||(typeof cur2!=='undefined'&&cur2)),at:liveAt}}
/* Cualquier toque cuenta como movimiento; se sube como mucho cada 3 min */
let liveSent=0;
function liveTouch(){liveAt=Date.now();if(Date.now()-liveSent>18e4){liveSent=Date.now();if(typeof queueSync==='function')queueSync()}}
document.addEventListener('click',liveTouch,true);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)liveTouch()});

function b64u(s){const p='='.repeat((4-s.length%4)%4),b=atob((s+p).replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from([...b].map(c=>c.charCodeAt(0)))}
const pushOk=()=>'serviceWorker' in navigator&&'PushManager' in window&&'Notification' in window;
const isStandalone=()=>matchMedia('(display-mode: standalone)').matches||navigator.standalone;

async function avisoOn(){
  if(!pushOk()){modal(`<h1>🔔 Avisos</h1><p>En iPhone primero agrega la app a tu pantalla de inicio:<br><b>Compartir ⬆️ → Agregar a inicio</b>.<br>Luego ábrela desde ese ícono, inicia sesión y toca otra vez 🔔.</p><div class="row"><button class="btn" onclick="closeModal()">Entendido</button></div>`);return}
  if(typeof user==='undefined'||!user){toast('Primero inicia sesión con Google');return}
  try{
    const reg=await navigator.serviceWorker.register('sw.js');
    if(await Notification.requestPermission()!=='granted'){toast('Sin permiso de notificaciones');return}
    const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64u(VAPID_PUB)});
    pushSubs[clkDev]=JSON.parse(JSON.stringify(sub));try{localStorage.setItem('pushSubs',JSON.stringify(pushSubs))}catch(e){}
    queueSync();avisoBtn();toast('🔔 Avisos activados')
  }catch(e){console.error(e);toast('No se pudo activar: '+(e.message||e))}
}
function avisoBtn(){const b=$('avisoBtn');if(b)b.style.display=pushSubs[clkDev]?'none':''}

/* Al abrir desde la notificación */
const FRENOS=[['📦','Falta de material'],['😰','Miedo'],['🧊','Parálisis'],['📚','Falta de preparación'],['☕','Estoy descansando']];
function nudgeOpen(){
  const nx=(plans[dkey(new Date())]||[]).find(a=>!a.done);
  modal(`<h1>🤔 ¿Qué estás haciendo?</h1><p class="muted">¿Qué te está frenando?</p>
  <div class="frn">${FRENOS.map(([e,t])=>`<button class="btn gray" onclick="nudgeSave('${e} ${t}')">${e} ${t}</button>`).join('')}</div>
  <textarea id="frTxt" placeholder="Algo más (opcional)"></textarea>
  ${nx?`<button class="btn" style="width:100%;margin-top:8px" onclick="nudgeGo()">▶ Empezar: ${esc(nx.n)}</button>`:''}
  <div class="row"><button class="btn gray" onclick="closeModal()">Cerrar</button></div>`)}
function nudgeSave(c){const t=($('frTxt')&&$('frTxt').value.trim())||'';
  notes.unshift({id:uid(),ts:Date.now(),txt:c+(t?' — '+t:''),act:'⏸ Freno',cause:c.slice(c.indexOf(' ')+1)});store('notes',notes);
  toast('Anotado: '+c);const nx=(plans[dkey(new Date())]||[]).find(a=>!a.done);if(!nx)closeModal()}
function nudgeGo(){closeModal();setPlanDay(dkey(new Date()));tab(1);const i=acts.findIndex(a=>!a.done);if(i>=0)resumeItem(i)}

if(new URLSearchParams(location.search).has('nudge'))setTimeout(()=>{if(typeof plans!=='undefined')nudgeOpen()},800);
if(pushOk()&&isStandalone())navigator.serviceWorker.register('sw.js').catch(()=>{});
setTimeout(avisoBtn,500);
