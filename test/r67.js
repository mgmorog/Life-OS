const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/page.html');await p.waitForTimeout(500);
let pass=0;const fails=[];const ok=(c,m)=>{if(c)pass++;else fails.push(m);};const R=(f,a)=>p.evaluate(f,a);const text=()=>p.locator('#view').innerText();const menu=async l=>{await p.locator('.menu button,[role=menu] button',{hasText:l}).first().click();await p.waitForTimeout(300);};
const ad=n=>{const d=new Date();d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const go=(v,pr)=>R(([v,pr])=>window.__lifeos.App.go(v,pr||{}),[v,pr]).then(()=>p.waitForTimeout(350));
const P=(r)=>R(r=>window.__lifeos.put(Object.assign({createdAt:Date.now()},r),{silent:true}),r);
const T=(id,title,x)=>P(Object.assign({id,kind:'task',title,notes:'',steps:[],date:null,time:null,repeat:{type:'never',end:null},priority:'normal'},x||{}));
// seed a wide spread of data and settings
const px='data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQEBAQH/wAALCAABAAEBAREA/8QAFAABAAAAAAAAAAAAAAAAAAAACf/EABQQAQAAAAAAAAAAAAAAAAAAAAD/2gAIAQEAAD8AKp//2Q==';
await R(px=>{const L=window.__lifeos;const s=L.get.settings();L.put(Object.assign({},s,{introDone:true,customMods:[{id:'cmx',name:'Wine cellar',hub:'Recreation',tpl:'collection',word:'bottle',statuses:['In the cellar','Drank']}],hubShown:{Pets:['petcare']},timeBudget:{Home:5},scorecard:['tasks','habits','focus'],todayPins:['Health|workouts'],moveDate:'2027-01-15',debtMode:'avalanche'}),{silent:true});
 L.create('task',{title:'Backup task',notes:'',steps:[],date:null,repeat:{type:'never',end:null},dur:30,spent:45,energy:'low',focusLog:[{d:'2026-11-01',m:45}]});
 L.create('goal',{title:'Backup goal',horizon:'year',steps:[],weekFocus:{'2026-11-09':'Run'}});
 L.create('wait',{title:'Contract',who:'Sam',since:'2026-11-01',follow:'2026-11-12',done:false});
 L.create('entry',{hub:'Recreation',tool:'cmx',f:{what:'Barolo',status:'In the cellar',note:''}});
 L.create('entry',{hub:'Pets',tool:'petcare',f:{what:'Flea',every:30,last:'2026-11-01',note:''}});
 L.create('entry',{hub:'Life admin',tool:'documents',f:{what:'Passport',status:'In a safe',note:'',photos:[{id:null,url:px}]}});},px);
await R(()=>{window.__lifeos.store.downloads={save:async o=>{window._saved=o;}};});
const before=await R(()=>({n:window.__lifeos.recs.size,kinds:[...new Set([...window.__lifeos.recs.values()].map(r=>r.kind))].sort()}));
await go('setpage',{id:'data'});await p.locator('.li',{hasText:'Export with photos'}).click();await p.waitForTimeout(800);
const file=await R(()=>window._saved);ok(file&&/with-photos/.test(file.filename),'export with photos file');
const data=JSON.parse(file.data);ok(data.version===2&&data.photos==='embedded'&&data.records.length===before.n,'export has every record');
ok(data.records.some(r=>r.kind==='settings'&&r.customMods&&r.customMods.length===1),'settings in export');
// fresh app, then restore
const c2=await b.newContext({viewport:{width:390,height:844}});const q=await c2.newPage();q.on('pageerror',e=>errs.push(e.message));await q.route(/fonts\.g/,r=>r.abort());await q.goto('file://'+process.cwd()+'/test/page.html');await q.waitForTimeout(700);
await q.evaluate(()=>{const L=window.__lifeos;[...L.recs.values()].filter(r=>r.kind!=='settings').forEach(r=>L.remove(r.id,{silent:true,hard:true}));L.put(Object.assign({},L.get.settings(),{introDone:true}),{silent:true});L.App.go('setpage',{id:'data'});});await q.waitForTimeout(400);
require('fs').writeFileSync('/tmp/claude-0/bk.json',file.data);await q.locator('#import-file').setInputFiles('/tmp/claude-0/bk.json');await q.waitForTimeout(1200);
const after=await q.evaluate(()=>{const L=window.__lifeos,s=L.get.settings();return{n:L.recs.size,kinds:[...new Set([...L.recs.values()].map(r=>r.kind))].sort(),mods:(s.customMods||[]).length,tb:s.timeBudget,sc:s.scorecard,pins:s.todayPins,move:s.moveDate,shown:s.hubShown,doc:[...L.recs.values()].find(r=>r.kind==='entry'&&r.f&&r.f.what==='Passport'),task:[...L.recs.values()].find(r=>r.title==='Backup task'),goal:[...L.recs.values()].find(r=>r.title==='Backup goal')};});
ok(JSON.stringify(after.kinds)===JSON.stringify(before.kinds),'all record kinds back '+JSON.stringify([before.kinds,after.kinds]));
ok(after.mods===1&&after.tb&&after.tb.Home===5&&after.sc&&after.sc.length===3&&after.pins&&after.pins[0]==='Health|workouts'&&after.move==='2027-01-15'&&after.shown&&after.shown.Pets,'settings restored');
ok(after.doc&&after.doc.f.photos&&after.doc.f.photos[0]&&/^data:image/.test(after.doc.f.photos[0].url),'photo restored');
ok(after.task&&after.task.dur===30&&after.task.spent===45&&after.task.energy==='low','task details restored');ok(after.goal&&after.goal.horizon==='year'&&after.goal.weekFocus['2026-11-09']==='Run','goal cascade restored');
await q.evaluate(()=>window.__lifeos.App.go('tool',{hub:'Recreation',tool:'cmx'}));await q.waitForTimeout(400);ok(/Barolo/.test(await q.locator('#view').innerText()),'custom module works after restore');
// restoring twice adds nothing
await q.evaluate(()=>window.__lifeos.App.go('setpage',{id:'data'}));await q.waitForTimeout(300);const n1=await q.evaluate(()=>window.__lifeos.recs.size);await q.locator('#import-file').setInputFiles('/tmp/claude-0/bk.json');await q.waitForTimeout(900);ok(await q.evaluate(()=>window.__lifeos.recs.size)===n1,'restore is idempotent');
ok(!errs.length,'errs '+errs);console.log(JSON.stringify({pass,fails},null,1));await b.close();})().catch(e=>{console.log('CRASH',e.message.slice(0,700));process.exit(1);});
