// v365 · Claude and Life OS, in-app parts: `bash mk.sh && node test/r365.cjs`. Exits 1 on failure. (The connector itself is tested in test-pwa.)
const {chromium}=require('playwright');const path=require('path');
const CHROME=process.env.CHROME||'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
(async()=>{const b=await chromium.launch({executablePath:CHROME});
  const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
  const errs=[];p.on('pageerror',x=>errs.push(x.message));
  await p.goto('file://'+path.join(__dirname,'page.html'));await p.waitForTimeout(900);
  let fails=0;const ok=(n,c,i)=>{console.log((c?'  ok   ':'  FAIL ')+n+(c?'':'  → '+JSON.stringify(i)));if(!c)fails++;};
  const ev=(f,a)=>p.evaluate(f,a);const go=async(v,o)=>{await p.evaluate(([v,o])=>window.__lifeos.App.go(v,o),[v,o]);await p.waitForTimeout(600);};
  const txt=()=>ev(()=>document.querySelector('#view').innerText);
  await go('setpage',{id:'claude'});const t=await txt();
  ok('Settings › Claude exists',/Connect Claude/.test(t)&&/What Claude can see/.test(t)&&/Ready-made asks for Claude/.test(t));
  ok('outside the Home Screen app it says where to set it up',/Use the Home Screen app/.test(t));
  await ev(()=>{const L=window.__lifeos;L.put({id:'mcptok_x',kind:'mcptoken',name:'Claude',created:Date.now()-864e5,seen:Date.now()-6e4});});await go('setpage',{id:'claude'});
  ok('connections are listed with Disconnect',/Disconnect/.test(await txt()));
  // Claude's changes in the Autopilot log, with undo
  const id=await ev(()=>{const L=window.__lifeos;const t=L.create('task',{title:'Call the plumber',notes:'',steps:[],date:L.todayK(),repeat:{type:'never'},priority:'normal',photos:[]});L.put({id:'clx1',kind:'claudelog',at:Date.now(),what:'Added “Call the plumber”',target:t.id,old:null,created:true,via:'Claude'});return t.id;});
  await go('setpage',{id:'autolog'});ok('Claude’s change shows in the Autopilot log',/Added “Call the plumber”/.test(await txt()));
  await ev(()=>[...document.querySelectorAll('#view button')].find(x=>x.textContent==='Undo').click());await p.waitForTimeout(400);
  ok('Undo removes what Claude added',await ev(id=>!window.__lifeos.get.id(id),id));
  // access settings
  await go('setpage',{id:'claude'});await ev(()=>window.__lifeos.t.setSettings({claudeAccess:{mode:'read'}}));await go('setpage',{id:'claude'});
  ok('read-only mode is shown',await ev(()=>/Only read/.test(document.querySelector('#view').innerText)));
  // nightly tidy note and undo
  const tid=await ev(()=>{const L=window.__lifeos;const t=L.create('task',{title:'Moved by night',notes:'',steps:[],date:L.todayK(),repeat:{type:'never'},priority:'normal',photos:[]});L.t.setSettings({cxNight:{dk:L.todayK(),text:'moved 1 task off a crowded tomorrow',undo:[{id:t.id,old:{date:'2020-01-01'}}]}});window.App=L.App;L.App.state._sugOpen={[L.todayK()]:true};return t.id;});
  await go('today');ok('the overnight note shows on Today',/Overnight, Claude tidied up/.test(await txt()));
  // ask acts
  ok('no page errors',!errs.length,errs.slice(0,3));
  await b.close();process.exit(fails?1:0);})();
