/* Contador silencioso de botones: cuenta cada toque por pantalla y función.
   clk = {dispositivo:{since, c:{clave:n}, l:{clave:texto}}}; se suma entre dispositivos. */
const SEC={s0:'Temporizador',s1:'Actividades',s2:'Registro',s3:'Reportes',s4:'Panorámica',s5:'Backlog'};
let clk=(()=>{const v=load('clk',{});return v&&typeof v==='object'&&!Array.isArray(v)?v:{}})();
const clkDev=(()=>{let d=localStorage.getItem('clkDev');if(!d){d='d'+Math.random().toString(36).slice(2,8);try{localStorage.setItem('clkDev',d)}catch(e){}}return d})();

function clkKey(el){
  const oc=(el.getAttribute('onclick')||'').match(/^[\s\w.]*?(\w+)\s*\(/);
  const fn=oc?oc[1]:(el.id||'');
  const txt=(el.textContent||el.title||el.value||'').replace(/\s+/g,' ').trim().slice(0,28);
  const sec=el.closest('section[id^="s"]');
  const where=el.closest('nav')?'Barra':sec?(SEC[sec.id]||sec.id):'Ventanas';
  const name=/^(tab|rpSet|tabAt)$/.test(fn)&&txt?txt:(fn||txt||'?');
  return {k:where+' · '+name,t:txt};
}
function clkCount(ev){
  const el=ev.target.closest('button,[onclick],a,input[type=checkbox],label');if(!el)return;
  const {k,t}=clkKey(el);const d=clk[clkDev]||(clk[clkDev]={since:Date.now(),c:{},l:{}});
  d.c[k]=(d.c[k]||0)+1;if(t&&!d.l[k])d.l[k]=t;
  try{localStorage.setItem('clk',JSON.stringify(clk))}catch(e){}
  clearTimeout(clkCount.t);clkCount.t=setTimeout(()=>{if(typeof queueSync==='function')queueSync()},4000);
}
document.addEventListener('click',clkCount,true);

/* Une lo remoto con lo local: por dispositivo y por clave gana el número mayor */
function mergeClk(a,b){const o={};[a||{},b||{}].forEach(src=>Object.keys(src).forEach(dv=>{const s=src[dv];if(!s||typeof s!=='object')return;
  const t=o[dv]||(o[dv]={since:s.since||Date.now(),c:{},l:{}});t.since=Math.min(t.since,s.since||t.since);
  Object.keys(s.c||{}).forEach(k=>{t.c[k]=Math.max(t.c[k]||0,s.c[k])});Object.assign(t.l,s.l||{})}));return o}

function clkReport(){
  const tot={},lbl={};let since=Date.now();
  Object.values(clk).forEach(d=>{since=Math.min(since,d.since||since);Object.keys(d.c||{}).forEach(k=>{tot[k]=(tot[k]||0)+d.c[k]});Object.assign(lbl,d.l||{})});
  const rows=Object.keys(tot).sort((a,b)=>tot[b]-tot[a]);
  if(!rows.length)return '';
  const days=Math.max(1,Math.round((Date.now()-since)/864e5));
  return `<h3>🖱️ Botones más usados</h3><p class="muted">Desde hace ${days} día${days>1?'s':''} · ${rows.reduce((s,k)=>s+tot[k],0)} toques</p>
  <table class="clkt">${rows.slice(0,25).map(k=>`<tr><td>${esc(k)}${lbl[k]&&!k.endsWith(lbl[k])?`<br><small>${esc(lbl[k])}</small>`:''}</td><td>${tot[k]}</td></tr>`).join('')}</table>`;
}
