// Robot de avisos: corre en GitHub Actions cada 10 min. Si no hay nada corriendo en la app
// y llevas 40 min sin moverle, manda una notificación "¿Qué estás haciendo?".
// Secretos: FIREBASE_SA (JSON de cuenta de servicio) y VAPID_PRIVATE.
import admin from 'firebase-admin';
import webpush from 'web-push';

const ESPERA = 40 * 60e3, ENTRE = 60 * 60e3;               // 30 min sin movimiento; máx. 1 aviso por hora
const VAPID_PUB = 'BKcrVbQ62HCTyQhPRfae_8GL0adXkF-mymUT2zR4OIkjSdRPVUdTcKnDq_rkLs5-vrvoGS7zGCgUCWHuw6gdtAQ';
const URL_APP = 'https://pericancls.github.io/Temporizador/?nudge=1';

const mx = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
const h = mx.getHours(), dow = mx.getDay();                // 0 = domingo
const hm = h * 60 + mx.getMinutes();
if (dow === 0 || hm < 6 * 60 || hm > 22 * 60 + 30) { console.log('Fuera de horario'); process.exit(0); }
const hoy = `${mx.getFullYear()}-${String(mx.getMonth() + 1).padStart(2, '0')}-${String(mx.getDate()).padStart(2, '0')}`;

admin.initializeApp({ credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SA)) });
webpush.setVapidDetails('mailto:avisos@temporizador.app', VAPID_PUB, process.env.VAPID_PRIVATE);
const db = admin.firestore(), now = Date.now();

for (const doc of (await db.collection('users').get()).docs) {
  const d = doc.data(), subs = d.push || {}, live = d.live;
  if (!Object.keys(subs).length || !live) continue;
  if (live.run || now - live.at < ESPERA) { console.log(doc.id, 'activo'); continue; }
  const mark = db.collection('avisos').doc(doc.id), last = (await mark.get()).data()?.at || 0;
  if (now - last < ENTRE) { console.log(doc.id, 'ya avisado'); continue; }
  const nx = (d.plans?.[hoy] || []).find(a => !a.done);
  const min = Math.round((now - live.at) / 60e3);
  const body = `Llevas ${min > 600 ? 'mucho' : min + ' min'} sin nada corriendo. ¿Qué te está frenando?` + (nx ? `\nSiguiente: ${nx.n}` : '');
  const msg = JSON.stringify({ title: '🤔 ¿Qué estás haciendo?', body, url: URL_APP });
  for (const [dev, sub] of Object.entries(subs)) {
    try { await webpush.sendNotification(sub, msg); console.log(doc.id, dev, 'enviado'); }
    catch (e) { console.log(doc.id, dev, 'error', e.statusCode || e.message); }
  }
  await mark.set({ at: now });
}
process.exit(0);
