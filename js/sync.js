/* Sincronización con Firebase (login con Google y respaldo en la nube) */

/* ---- Sincronización con Firebase ---- */
const fbConfig={apiKey:"AIzaSyBjd6EOuM9VtEodZ7GtEeGY1KG66Umwzgo",authDomain:"temporizador-de-actividades.firebaseapp.com",projectId:"temporizador-de-actividades",storageBucket:"temporizador-de-actividades.firebasestorage.app",messagingSenderId:"150673495434",appId:"1:150673495434:web:468eb73e3bfde86f77a473"};
let lastErr='',fbAuth=null,fbDb=null,user=null,unsub=null,syncT=null,syncState='off',applying=false;
const keyOf=e=>e.d+'|'+e.h+'|'+e.n;
function mergeLogs(a,b){const m=new Map();a.concat(b).forEach(e=>m.set(keyOf(e),e));return [...m.values()]}
function setSync(st){syncState=st;drawSync()}
function drawSync(){
  let h;
  if(!fbAuth)h='<div class="dot err"></div><span>Sin conexión a la nube</span>';
  else if(!user)h='<div class="dot"></div><span>Solo en este dispositivo</span><button onclick="login()">Iniciar sesión</button>';
  else{const t={ok:'Sincronizado',busy:'Guardando…',err:'Error al sincronizar'+(lastErr?' ('+lastErr+')':'')}[syncState]||'Conectando…';
    h=`<div class="dot ${syncState}"></div><span>☁︎ ${t} · ${esc(user.email||'')}</span><button class="lnk" onclick="logout()">Salir</button>`}
  ['syncBar1','syncBar2'].forEach(id=>{const el=$(id);if(el)el.innerHTML=h});
}
function queueSync(){if(!user||applying)return;setSync('busy');clearTimeout(syncT);syncT=setTimeout(pushSync,800)}
function pushSync(){if(!user)return;fixData();fbDb.collection('users').doc(user.uid).set({plans,log,brk,recs,bl,notes,dnotes,acts:plans[dkey(new Date())]||[],updated:Date.now()}).then(()=>{lastErr='';setSync('ok')}).catch(e=>{console.error(e);lastErr=e&&(e.code||e.message)||'';setSync('err')})}
function applyRemote(d){applying=true;
  if(d.plans&&typeof d.plans==='object')plans=d.plans;else if(Array.isArray(d.acts)){plans={...plans};if(d.acts.length)plans[dkey(new Date())]=d.acts}
  log=d.log||[];if(Array.isArray(d.recs)){recs=d.recs;try{localStorage.setItem('recs',JSON.stringify(recs))}catch(e){}}if(Array.isArray(d.bl)){bl=d.bl;try{localStorage.setItem('bl',JSON.stringify(bl))}catch(e){}}if(Array.isArray(d.notes)){notes=d.notes;try{localStorage.setItem('notes',JSON.stringify(notes))}catch(e){}}if(d.dnotes&&typeof d.dnotes==='object'){dnotes=mergeDn(d.dnotes,dnotes);try{localStorage.setItem('dnotes',JSON.stringify(dnotes))}catch(e){}}fixData();const mv=carryPaused();if(mv)setTimeout(queueSync,50);if(typeof d.brk==='number'){brk=d.brk;try{localStorage.setItem('brk',JSON.stringify(brk))}catch(e){}}setPlanDay(planDay);
  try{localStorage.setItem('plans',JSON.stringify(plans));localStorage.setItem('log',JSON.stringify(log))}catch(e){}applying=false;
  render();if($('s2').classList.contains('on')){renderLog();renderAct()}}
async function onLogin(u){
  user=u;if(unsub){unsub();unsub=null}
  if(!u){setSync('off');return}
  setSync('busy');
  try{
    const ref=fbDb.collection('users').doc(u.uid),snap=await ref.get();
    if(snap.exists){const d=snap.data();
      const rp=(d.plans&&typeof d.plans==='object')?{...d.plans}:{};
      if(!d.plans&&d.acts&&d.acts.length)rp[dkey(new Date())]=d.acts;
      Object.keys(plans).forEach(k=>{if(!(rp[k]&&rp[k].length))rp[k]=plans[k]});
      applyRemote({plans:rp,log:mergeLogs(d.log||[],log),...(Array.isArray(d.recs)?{recs:d.recs}:{}),...(Array.isArray(d.bl)?{bl:d.bl}:{}),notes:mergeNotes(d.notes,notes),dnotes:mergeDn(d.dnotes,dnotes)});
      await ref.set({plans,log,recs,bl,notes,dnotes,acts:plans[dkey(new Date())]||[],updated:Date.now()});
    }else await ref.set({plans,log,recs,bl,acts:plans[dkey(new Date())]||[],updated:Date.now()});
    setSync('ok');
    unsub=ref.onSnapshot(s=>{if(!s.exists||s.metadata.hasPendingWrites)return;applyRemote(s.data());setSync('ok')},e=>{console.error(e);lastErr=e&&(e.code||e.message)||'';setSync('err')});
  }catch(e){console.error(e);lastErr=e&&(e.code||e.message)||'';setSync('err')}
}
function login(){const p=new firebase.auth.GoogleAuthProvider();p.setCustomParameters({prompt:'select_account'});
  fbAuth.signInWithPopup(p).catch(e=>{if(e&&e.code==='auth/popup-blocked')modal(`<h1>Safari bloqueó la ventana</h1><div class="muted">Ve a Ajustes → Apps → Safari y apaga <b>Bloquear ventanas</b>. Luego vuelve a tocar Iniciar sesión.</div><div class="row"><button class="btn" onclick="closeModal()">OK</button></div>`);else if(e&&e.code!=='auth/popup-closed-by-user'&&e.code!=='auth/cancelled-popup-request')modal(`<h1>No se pudo iniciar sesión</h1><div class="muted">${esc(e.message||e.code||'')}</div><div class="row"><button class="btn" onclick="closeModal()">OK</button></div>`)})}
function logout(){fbAuth.signOut()}
try{
  firebase.initializeApp(fbConfig);fbAuth=firebase.auth();fbDb=firebase.firestore();
  fbAuth.getRedirectResult().catch(()=>{});
  fbAuth.onAuthStateChanged(onLogin);
}catch(e){console.error(e)}
drawSync();
