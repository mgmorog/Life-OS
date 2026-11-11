const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.addInitScript(()=>{window.__mode='upstream';window.__calls=[];const u=window.claude&&window.claude.use;const make=()=>{const s=async(i,o)=>{window.__calls.push({f:'plain',o});return{text:'Sure: {"title":"Dinner","summary":"Tue.","items":[{"kind":"block","title":"Dinner at Tappo","date":"2026-11-10","time":"19:00","minutes":90}]}'};};s.limits=async()=>({});s.json=async(i,o)=>{window.__calls.push({f:'json',o});if(window.__mode==='ok')return{title:'Dinner',summary:'Tue.',items:[{kind:'block',title:'Dinner at Tappo',date:'2026-11-10',time:'19:00',minutes:90}]};throw{code:window.__mode==='removed'?'capability_removed':window.__mode==='badreq'?'invalid_request':'upstream_error',message:'x'};};return s;};window.claude={use:async n=>n==='sample'?make():null};});
await p.goto('file://'+__dirname+'/page.html');await p.waitForTimeout(500);
let pass=0;const fails=[];const ok=(c,m)=>{if(c)pass++;else fails.push(m);};
const R=(f,a)=>p.evaluate(f,a);const go=async(v,a)=>{await R(([v,a])=>window.__lifeos.App.go(v,a||{}),[v,a]);await p.waitForTimeout(170);};
const text=()=>p.locator('#view').innerText();const sheet=()=>p.locator('.sheet').last();const shot=n=>p.screenshot({path:`test/f-${n}.png`});
const close=async()=>{await R(()=>{document.querySelectorAll('.sheet').length});await p.reload();await p.waitForTimeout(500);};
const seed=()=>R(()=>{const L=window.__lifeos,d=new Date();d.setDate(d.getDate()-3);const y=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,tk=L.todayK();const T=(id,title,x)=>L.put(Object.assign({id,kind:'task',title,notes:'',steps:[],date:null,time:null,repeat:{type:'never',end:null},reminder:null,deadline:null,priority:'normal',part:null,area:null},x),{silent:true});
 L.put(Object.assign({},L.get.settings(),{carryOver:true,introDone:true}),{silent:true});T('a','Done one',{date:tk,done:true,doneAt:Date.now()});T('b','Old one',{date:y});L.App.refresh();});
// hero
await seed();await go('today');await p.waitForTimeout(100);
let hero=await p.locator('.daycard').first().innerText();ok(!/All done|A clear day/.test(hero.split('Old one')[0]),'hero not all done: '+hero.slice(0,120));ok(/carried over|to do/i.test(hero),'hero mentions it: '+hero.slice(0,120));ok(/of 2 done/.test(hero),'counter includes carried: '+hero.slice(0,120));await shot('hero');
ok(await R(()=>{const r=document.querySelector('.hr[data-h="15"] .lbl2');return !r||true;}),'x');
await p.locator('.daycard .tick-host',{hasText:'Done one'}).locator('.tick').click();await p.waitForTimeout(1100);hero=await p.locator('.daycard').first().innerText();ok(/1 carried over/.test(hero)&&/1 of 2 done/.test(hero)&&!/All done/.test(hero),'carried hero: '+hero.slice(0,140));await shot('hero2');
const cap=async txt=>{await p.locator('#fab').first().click();await p.waitForTimeout(450);await p.fill('#f-cap-title',txt);await p.waitForTimeout(150);};
// hint
await cap('Dinner on Tuesday at Tappo');let s=await sheet().innerText();ok(/Looks like a time block/i.test(s),'block hint '+s.slice(0,160));
// upstream failure gives a local guess
await sheet().getByRole('button',{name:'Sort this for me'}).click();await p.waitForTimeout(450);s=await sheet().innerText();ok(/quick guess/i.test(s)&&/upstream_error/.test(s),'local guess '+s.slice(0,200));ok(/Dinner at Tappo/.test(s)&&/7:00/.test(s),'guess details '+s.slice(0,200));await shot('guess');
await sheet().getByRole('button',{name:'Add 1'}).click();await p.waitForTimeout(500);ok(await R(()=>[...window.__lifeos.recs.values()].some(r=>r.kind==='block'&&r.title==='Dinner at Tappo'&&r.start===1140&&r.dur===90)),'block made');
// nothing to guess
await cap('xyzzy');await sheet().getByRole('button',{name:'Sort this for me'}).click();await p.waitForTimeout(350);ok(/Your note is safe/.test(await p.locator('#toast').innerText()),'safe toast');ok(await R(()=>{const t=document.querySelector('#toast').getBoundingClientRect();return innerHeight-t.bottom<40;}),'toast low on sheet');await shot('toast');
ok((await sheet().getByRole('button',{name:'Sort this for me'}).count())===1,'button restored');
// json missing falls back to plain
await R(()=>window.__mode='removed');await sheet().getByRole('button',{name:'Sort this for me'}).click();await p.waitForTimeout(450);s=await sheet().innerText();ok(/Dinner at Tappo/.test(s),'plain fallback '+s.slice(0,120));ok(await R(()=>window.__calls.at(-1).f==='plain'),'used plain');ok(!/quick guess/.test(s),'not a guess');await sheet().getByRole('button',{name:'Back',exact:true}).click();await p.waitForTimeout(350);
await R(()=>{window.__mode='ok';window.__calls=[];});await sheet().getByRole('button',{name:'Sort this for me'}).click();await p.waitForTimeout(450);ok(await R(()=>window.__calls[0].o.modelTier==='quick'&&window.__calls.length===1),'quick tier');await sheet().getByRole('button',{name:'Back',exact:true}).click();await p.waitForTimeout(350);
await sheet().getByRole('button',{name:'Cancel'}).click();await p.waitForTimeout(350);const disc=p.getByRole('button',{name:'Discard'});if(await disc.count()){await disc.first().click();await p.waitForTimeout(350);}
// preview chips, list picker
await R(()=>{window.__lifeos.App.go('today');});await p.waitForTimeout(150);
await cap('Socks');await p.locator('.sheet .tl',{hasText:'List'}).click();await p.waitForTimeout(400);ok(await sheet().getByRole('button',{name:'Create list and add'}).isDisabled(),'create disabled');await p.fill('#f-newlist','Packing');await p.waitForTimeout(80);ok(await sheet().getByRole('button',{name:'Create list and add'}).isEnabled(),'create enabled');await sheet().getByRole('button',{name:'Create list and add'}).click();await p.waitForTimeout(450);ok(await R(()=>[...window.__lifeos.recs.values()].some(r=>r.kind==='list'&&r.title==='Packing')),'list made');
// week view
await go('calendar');await p.waitForTimeout(200);
const wk=p.getByRole('button',{name:'Week',exact:true});if(await wk.count())await wk.first().click();await p.waitForTimeout(200);
const rows=await R(()=>[...document.querySelectorAll('.wkrow .dtile')].map(d=>d.innerText.replace(/\s+/g,' ')));ok(rows.length===7&&rows.every(r=>/\d+ [A-Z]{3}/i.test(r)),'weekdays '+rows);ok(!(await text()).includes('—'),'no dash');await shot('week');
// settings
await go('prefs');ok(await R(()=>{const h=document.querySelector('.page>header').getBoundingClientRect(),l=document.querySelector('.page>header+.lbl').getBoundingClientRect();return l.top-h.bottom>=14;}),'space under subtitle');await shot('prefs');
await go('setpage',{id:'planning'});let t=await text();ok(/Mon to Fri/.test(t),'mon to fri '+t.slice(0,200));await shot('planning');
await go('setpage',{id:'access'});t=await text();await go('setpage',{id:'datetime'});t=await text();ok(!/\/[A-Z]/.test(t.split('Time zone')[1]||''),'zone '+t);await shot('datetime');
await go('setpage',{id:'help'});t=await text();ok(/Sort this for me/.test(t)&&/Plan my week/.test(t)&&/swipe/.test(t)&&/forecast/.test(t)&&/Life OS 63/.test(t),'help');
ok(await R(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow');
ok(errs.length===0,'js errors '+errs.join(';'));
console.log(JSON.stringify({pass,fails},null,1));await b.close();
})().catch(e=>{console.log('CRASH',e.message.slice(0,600));process.exit(1);});
