/* Hauntica phone remote helper. Run on the control-room computer:  node remote-server.js
   No installs needed beyond Node.js (nodejs.org, LTS). It does three things:
   1. serves a phone control page on your Wi-Fi,
   2. passes the phone's button presses to the Hauntica page in the control-room browser,
   3. shows the phone the current scenes. Everything stays on your own network. */
const http = require('http'), os = require('os');
const PORT = +process.env.PORT || 8787, PIN = process.env.PIN || String(1000 + Math.floor(Math.random() * 9000));
let state = { scenes: [], pads: [], zones: [], cur: null, events: false, show: '', t: 0 }; const clients = new Set();
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'content-type,x-pin', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Private-Network': 'true' };
const pinOk = (req, u) => (req.headers['x-pin'] || u.searchParams.get('pin')) === PIN;
const body = req => new Promise(r => { let b = ''; req.on('data', c => { b += c; if (b.length > 1e6) req.destroy(); }); req.on('end', () => r(b)); });
const PAGE = `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Hauntica remote</title>
<style>*{box-sizing:border-box}body{margin:0;background:#0c0608;color:#f6e9e3;font:16px system-ui}h2{color:#f0a030;margin:14px 10px 6px;font-size:15px}.g{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:0 10px}
button{background:#2a1218;color:#f6e9e3;border:1px solid #4a2229;border-radius:12px;padding:16px 8px;font:inherit;font-weight:700}button.on{background:linear-gradient(135deg,#ff4d2e,#f0a030);color:#1a0a02}button.p{border-color:#ff4d2e;color:#ff8a7a}
#top{position:sticky;top:0;background:#1a0c10;padding:8px 10px;display:flex;gap:8px;align-items:center;border-bottom:1px solid #4a2229}#top button{padding:10px 14px}#st{flex:1;font-size:12px;color:#b39690}
#pin{display:none;padding:30px 14px}#pin input{width:100%;font-size:28px;padding:12px;background:#1a0c10;color:#fff;border:1px solid #4a2229;border-radius:10px;margin:10px 0}</style></head><body>
<div id="pin"><h2>Hauntica remote</h2><div>Enter the PIN shown on the control-room computer:</div><input id="pi" inputmode="numeric" maxlength="8"><button onclick="go()" style="width:100%">Connect</button></div>
<div id="app" style="display:none"><div id="top"><button class="p" onclick="c({cmd:'panic'})">PANIC</button><button onclick="c({cmd:'stop'})">Stop all</button><div id="st">connecting...</div></div>
<h2>Scenes</h2><div class="g" id="sc"></div><h2>Jump scares</h2><div class="g"><button class="p" onclick="c({cmd:'hit',zone:'all'})">BIG HIT, all zones</button><button onclick="c({cmd:'pad',snd:'slam',zone:'all'})">Door slam</button><button onclick="c({cmd:'build'})">Riser then HIT</button><button id="ev" onclick="c({cmd:'evtoggle'})">Random scares</button></div>
<h2>Show</h2><div class="g"><button onclick="c({cmd:'showgo'})">Start show</button><button onclick="c({cmd:'shownext'})">Next step</button><button onclick="c({cmd:'showstop'})">Stop show</button></div><h2>Scare pads</h2><div class="g" id="pd"></div><div style="height:30px"></div></div>
<script>let pin=localStorage.getItem('hpin')||'';const q=s=>document.querySelector(s);
function c(o){fetch('/cmd',{method:'POST',headers:{'x-pin':pin,'content-type':'application/json'},body:JSON.stringify(o)}).then(r=>{if(r.status==401){pin='';localStorage.removeItem('hpin');init()}}).catch(()=>{q('#st').textContent='no connection'});if(navigator.vibrate)navigator.vibrate(20)}
function go(){pin=q('#pi').value.trim();localStorage.setItem('hpin',pin);init()}
function init(){if(!pin){q('#pin').style.display='block';q('#app').style.display='none';return}q('#pin').style.display='none';q('#app').style.display='block';poll()}
async function poll(){try{const r=await fetch('/state?pin='+encodeURIComponent(pin));if(r.status==401){pin='';localStorage.removeItem('hpin');init();return}const s=await r.json(),fresh=Date.now()-s.t<8000;
q('#st').textContent=fresh?(s.show||'Hauntica connected'):'Hauntica page is not connected on the control computer';
q('#sc').innerHTML=s.scenes.map(x=>'<button class="'+(x.id==s.cur?'on':'')+'" onclick="c({cmd:\\'scene\\',id:\\''+x.id+'\\'})">'+x.name+'</button>').join('');
q('#pd').innerHTML=s.pads.map(x=>'<button onclick="c({cmd:\\'pad\\',snd:\\''+x.id+'\\',zone:\\'all\\'})">'+x.name+'</button>').join('');q('#ev').className=s.events?'on':'';q('#ev').textContent='Random scares: '+(s.events?'ON':'off')}catch(e){q('#st').textContent='no connection'}setTimeout(poll,1500)}
init();</script></body></html>`;
http.createServer(async (req, res) => {
  const u = new URL(req.url, 'http://x');
  if (req.method === 'OPTIONS') { res.writeHead(204, cors); return res.end(); }
  if (u.pathname === '/') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(PAGE); }
  if (!pinOk(req, u)) { res.writeHead(401, cors); return res.end('bad pin'); }
  if (u.pathname === '/events') { res.writeHead(200, { ...cors, 'content-type': 'text/event-stream', 'cache-control': 'no-cache', connection: 'keep-alive' }); res.write('retry: 2000\n\n'); clients.add(res); const k = setInterval(() => res.write(': ping\n\n'), 15000); req.on('close', () => { clients.delete(res); clearInterval(k); }); return; }
  if (u.pathname === '/state' && req.method === 'GET') { res.writeHead(200, { ...cors, 'content-type': 'application/json' }); return res.end(JSON.stringify(state)); }
  if (u.pathname === '/state' && req.method === 'POST') { try { state = { ...JSON.parse(await body(req)), t: Date.now() }; } catch (e) { } res.writeHead(200, cors); return res.end('ok'); }
  if (u.pathname === '/cmd' && req.method === 'POST') { const b = await body(req); clients.forEach(c => c.write('data: ' + b + '\n\n')); res.writeHead(200, cors); return res.end('ok'); }
  res.writeHead(404, cors); res.end('no');
}).listen(PORT, '0.0.0.0', () => {
  const ips = Object.values(os.networkInterfaces()).flat().filter(i => i && i.family === 'IPv4' && !i.internal).map(i => i.address);
  console.log('\nHauntica remote is running.\n\n  PIN: ' + PIN + '\n\n  On your phone (same Wi-Fi) open:\n' + ips.map(i => '    http://' + i + ':' + PORT + '/').join('\n') + '\n\n  In Hauntica (Auto tab) enter the same PIN and press Connect.\n  Leave this window open. Close it to turn the remote off.\n');
});
