/* Buscar actualización y arranque de la app (siempre va al final) */

async function latestVer(){
  const r=await fetch(location.pathname+'?check='+Date.now(),{cache:'no-store'});const t=await r.text();
  const m=t.match(/const APP_VER=(\d+)/);return m?+m[1]:0;
}
function doUpdate(v){if($('run').classList.contains('on'))saveRun();location.replace(location.pathname+'?v='+v+'&t='+Date.now())}
document.addEventListener('DOMContentLoaded',()=>{const b=$('updBtn');if(b)b.textContent='⟳ Buscar actualización (tienes la v'+APP_VER+')'});
async function checkUpdate(manual){
  const b=$('updBtn');if(manual)b.textContent='⟳ Buscando…';
  try{const v=await latestVer();
    if(v>APP_VER){$('updBox').innerHTML=`<div class="upd"><span>Hay una versión nueva: <b>v${v}</b></span><button onclick="doUpdate(${v})">Actualizar</button></div>`;
      if(manual)doUpdate(v);else b.textContent=`⟳ Actualizar a la v${v}`;}
    else{$('updBox').innerHTML='';if(manual){b.textContent='✓ Ya tienes la versión más nueva (v'+APP_VER+')';setTimeout(()=>b.textContent='⟳ Buscar actualización (tienes la v'+APP_VER+')',3000)}}
  }catch(e){if(manual){b.textContent='Sin conexión, intenta de nuevo';setTimeout(()=>b.textContent='⟳ Buscar actualización (tienes la v'+APP_VER+')',3000)}}
}
if(/[?&](v|t)=/.test(location.search))history.replaceState(null,'',location.pathname);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)checkUpdate(false)});
initPlans();fixData();render();prev();setTimeout(checkRun,300);setTimeout(()=>checkUpdate(false),1500);
