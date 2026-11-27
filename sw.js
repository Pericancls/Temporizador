/* Service worker: solo para notificaciones de inactividad (no guarda caché) */
self.addEventListener('install',()=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));
self.addEventListener('push',e=>{let d={};try{d=e.data.json()}catch(_){d={title:'Temporizador',body:e.data&&e.data.text()}}
  e.waitUntil(self.registration.showNotification(d.title||'¿Qué estás haciendo?',{body:d.body||'',icon:'icon.png',tag:'nudge',data:{url:d.url||'./?nudge=1'}}))});
self.addEventListener('notificationclick',e=>{e.notification.close();const url=new URL(e.notification.data.url,self.registration.scope).href;
  e.waitUntil(self.clients.matchAll({type:'window',includeUncontrolled:true}).then(cs=>{for(const c of cs){if('navigate' in c){return c.focus().then(()=>c.navigate(url))}}return self.clients.openWindow(url)}))});
