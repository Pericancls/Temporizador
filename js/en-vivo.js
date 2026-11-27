/* Actividad corriendo en vivo entre dispositivos.
   El que corre sube liveRun={dev,at,run} (el mismo "run" que se guarda local).
   El otro, si no tiene nada corriendo, lo retoma con restoreRun(): cuenta los minutos desde 'at' hasta ahora.
   Si un dispositivo pausa o termina, sube liveRun=null y el otro se detiene solo. */
let liveRun=null,lrSent=0,lrStopped=[];
const lrKey=r=>r&&r.queue?((r.cur&&r.cur.id)||'brk')+'|'+((r.cur&&r.cur.start)||((r.queue[r.idx+1]||{}).id)||''):'';
function liveRunSet(){const r=load('run',null);if(!r)return;liveRun={dev:clkDev,at:Date.now(),run:r};
  if(Date.now()-lrSent>60e3){lrSent=Date.now();if(typeof queueSync==='function')queueSync()}}
function liveRunClear(){const r=load('run',null);if(r)lrStopped.push(lrKey(r));if(liveRun){liveRun=null;lrSent=0;if(typeof queueSync==='function')queueSync()}}
function lrLocalOn(){return $('run').classList.contains('on')}
function liveRunRemote(L){
  if(L&&L.dev===clkDev)return;
  if(L&&L.run&&L.run.running){
    if(lrLocalOn()||lrStopped.includes(lrKey(L.run))||Date.now()-L.at>12*3600e3)return;
    liveRun=L;try{localStorage.setItem('run',JSON.stringify(L.run))}catch(e){}
    closeModal&&closeModal();restoreRun();toast('▶ Retomado de tu otro dispositivo');return}
  /* El otro lo pausó o terminó: aquí se detiene sin guardar (el otro ya guardó) */
  if(lrLocalOn()&&load('run',{}).running!==false&&(typeof user!=='undefined'&&user)){
    running=false;clearInterval(timer);inBreak=false;inOver=false;cur=null;
    $('run').classList.remove('on','brk','mini');document.body.classList.remove('hasbar');const bb=$('brkBar');if(bb)bb.style.display='none';
    release();try{localStorage.removeItem('run')}catch(e){}liveRun=null;render();toast('⏸ Se detuvo en tu otro dispositivo')}
  else if(!lrLocalOn())liveRun=L||null;
}
