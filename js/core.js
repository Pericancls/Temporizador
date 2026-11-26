/* Base: utilidades ($, guardar/cargar, fechas), datos del plan por día y cambio de pestañas */

const $=id=>document.getElementById(id);
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch(e){return d}};
const store=(k,v)=>{if(k==='brk'||k==='recs'||k==='bl'||k==='notes'||k==='dnotes'||k==='qb'){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){};return queueSync()}if(k==='acts'){plans[planDay]=acts;cleanPlans();k='plans';v=plans}try{localStorage.setItem(k,JSON.stringify(v))}catch(e){};if(k==='plans'||k==='log')queueSync()};
let dnotes=(()=>{const v=load('dnotes',{});return v&&typeof v==='object'&&!Array.isArray(v)?v:{}})(),notes=load('notes',[]),bl=load('bl',[]),recs=load('recs',[]),log=load('log',[]),plans={},acts=[],planDay='';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const pad=n=>String(n).padStart(2,'0');
const dkey=d=>d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate());
function initPlans(){
  plans=load('plans',null);
  if(!plans||typeof plans!=='object'){plans={};const old=load('acts',[]);if(old.length)plans[dkey(new Date())]=old}
  fixData();if(carryPaused())try{localStorage.setItem('plans',JSON.stringify(plans))}catch(e){}
  setPlanDay(dkey(new Date()));
}
/* Las actividades pausadas de días anteriores pasan solas al plan de hoy */
function carryPaused(){const t=dkey(new Date());let moved=[];
  Object.keys(plans).forEach(k=>{if(k>=t)return;const keep=[];(plans[k]||[]).forEach(a=>{if(a.prog&&!a.done)moved.push(a);else keep.push(a)});plans[k]=keep;if(!keep.length)delete plans[k]});
  if(!moved.length)return false;plans[t]=moved.concat((plans[t]||[]).filter(a=>!moved.some(m=>m.id===a.id)));return true}
function cleanPlans(){Object.keys(plans).forEach(k=>{if(!plans[k]||!plans[k].length)delete plans[k]})}
function setPlanDay(k){planDay=k;acts=plans[k]?plans[k]:[]}
function shiftDay(k,n){const [y,m,d]=k.split('-').map(Number);return dkey(new Date(y,m-1,d+n))}
function dayName(k){const t=dkey(new Date());if(k===t)return'hoy';if(k===shiftDay(t,1))return'mañana';if(k===shiftDay(t,2))return'pasado mañana';if(k===shiftDay(t,-1))return'ayer';
  const [y,m,d]=k.split('-').map(Number);return new Date(y,m-1,d).toLocaleDateString('es-MX',{weekday:'short',day:'numeric',month:'short'})}
function moveDay(n){setPlanDay(shiftDay(planDay,n));render()}
function pickDay(v){if(v){setPlanDay(v);render()}}
const fmtMin=m=>{m=Math.round(m);return m>=60?Math.floor(m/60)+'h '+(m%60)+'min':m+' min'};

function tab(i){if(i===5&&isDesk())i=1;[0,1,2,3,4,5].forEach(k=>{$('s'+k).classList.toggle('on',k===i);$('n'+k).classList.toggle('on',k===i)});if(i===2)renderLog();if(i===1)render();if(i===3)renderRep();if(i===4)renderWeek();if(i===5)renderBlM()}
