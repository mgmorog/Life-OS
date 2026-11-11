const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/page.html');await p.waitForTimeout(500);
let pass=0;const fails=[];const ok=(c,m)=>{if(c)pass++;else{fails.push(m);p.locator('#view').innerText().then(t=>console.log('--',m,'\n',t.slice(0,700)));}};const R=(f,a)=>p.evaluate(f,a);const text=()=>p.locator('#view').innerText();const menu=async l=>{await p.locator('.menu button,[role=menu] button',{hasText:l}).first().click();await p.waitForTimeout(300);};
const ad=n=>{const d=new Date();d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const go=(v,pr)=>R(([v,pr])=>window.__lifeos.App.go(v,pr||{}),[v,pr]).then(()=>p.waitForTimeout(350));
const P=(r)=>R(r=>window.__lifeos.put(Object.assign({createdAt:Date.now()},r),{silent:true}),r);
const T=(id,title,x)=>P(Object.assign({id,kind:'task',title,notes:'',steps:[],date:null,time:null,repeat:{type:'never',end:null},priority:'normal'},x||{}));
await R(()=>{const L=window.__lifeos;L.put(Object.assign({},L.get.settings(),{introDone:true,nudgeOff:true,planEve:false}),{silent:true});});
const E=(id,hub,tool,f)=>P({id,kind:'entry',hub,tool,f});
// 1 modules page + toggle off
await go('prefs');ok(/Modules/.test(await text()),'settings row');await p.locator('.li',{hasText:'Turn modules on or off'}).click();await p.waitForTimeout(300);
ok(/Build your own module/.test(await text())&&/Measurements/.test(await text()),'modules page');
await p.getByRole('switch',{name:'Measurements on'}).click();await p.waitForTimeout(300);
ok(await R(()=>window.__lifeos.get.settings().hubHidden.Health.includes('measure')),'turned off');
await go('area',{name:'Health'});ok(!/Measurements/.test(await text()),'hidden on area');
// 2 optional area modules start hidden, turn on adds area
ok(await R(()=>!(window.__lifeos.get.settings().areas||[]).includes('Pets')),'pets not an area yet');
await go('modules');ok(/More life areas/i.test(await text())&&/Pet care/.test(await text()),'optional modules listed');
await p.getByRole('switch',{name:'Pet care off'}).click();await p.waitForTimeout(400);
ok(await R(()=>(window.__lifeos.get.settings().areas||[]).includes('Pets')),'turning on adds area');
// 3 first-open starter fills itself
await R(()=>{window.__LIFEOS_INTROS__=1;});await go('tool',{hub:'Pets',tool:'petcare'});ok(/What does your pet need/.test(await text()),'starter question');
await p.locator('.ob-pill',{hasText:'Flea and tick'}).click();await p.waitForTimeout(150);await p.locator('.ob-pill',{hasText:'Vet checkup'}).click();await p.waitForTimeout(200);
await p.getByRole('button',{name:'Add 2 and start'}).click();await p.waitForTimeout(400);
ok(await R(()=>window.__lifeos.get.all('entry').filter(x=>x.hub==='Pets'&&x.tool==='petcare').length===2),'starters created');
await R(()=>{window.__LIFEOS_INTROS__=0;});
// 4 contract: checklist due on Today, countdown on Today + calendar
await E('pc1','Pets','petcare',{what:'Nail trim',every:21,last:ad(-30),note:''});
await R(()=>{const L=window.__lifeos;const s=L.get.settings();L.put(Object.assign({},s,{hubShown:Object.assign({},s.hubShown,{'Life admin':['renewals']})}),{silent:true});});
await go('tool',{hub:'Life admin',tool:'renewals'});await p.getByRole('button',{name:/New renewal|Add a renewal/}).first().click();await p.waitForTimeout(300);
await p.locator('#f-x-what').fill('Passport');await p.locator('#f-x-date').fill(ad(20));await p.getByRole('button',{name:'Add',exact:true}).click();await p.waitForTimeout(400);
ok(await R(()=>{const L=window.__lifeos,x=L.get.all('entry').find(e=>e.f.what==='Passport');return !!(x&&x.f.calId&&L.get.id(x.f.calId));}),'countdown on calendar');
await go('today');t=await text();ok(/Nail trim/.test(t)&&/Passport/.test(t)&&/in 20 days/.test(t),'due on today');
// 5 pin to Today from tool page
await go('tool',{hub:'Pets',tool:'petcare'});await p.getByRole('button',{name:'Pet care options'}).click();await p.waitForTimeout(200);await menu('Pin to Today');
await go('today');ok(await p.locator('.tpins .tc',{hasText:'Pet care'}).count()===1,'pinned on today');
// 6 quick log
await go('today');await p.locator('#fab').click();await p.waitForTimeout(400);await p.keyboard.type('spent 12 on lunch');await p.waitForTimeout(200);
ok(/Log \$12 on lunch/.test(await p.locator('.caphint').innerText()),'quick log hint');await p.locator('.caphint-b.ql').click();await p.waitForTimeout(400);
ok(await R(()=>window.__lifeos.get.all('entry').some(x=>x.tool==='spending'&&+x.f.amount===12&&x.f.cat==='Dining out')),'expense logged');
await p.locator('#fab').click();await p.waitForTimeout(400);await p.keyboard.type('ran 3 miles in 28 min');await p.waitForTimeout(200);await p.locator('.caphint-b.ql').click();await p.waitForTimeout(400);
ok(await R(()=>window.__lifeos.get.all('entry').some(x=>x.tool==='workouts'&&x.f.what==='Run'&&+x.f.miles===3&&+x.f.min===28)),'workout logged');
await p.locator('#fab').click();await p.waitForTimeout(400);await p.keyboard.type('waiting on Priya for the slides');await p.waitForTimeout(200);await p.locator('.caphint-b.ql').click();await p.waitForTimeout(400);
ok(await R(()=>window.__lifeos.get.all('wait').some(w=>w.who==='Priya'&&/slides/i.test(w.title))),'waiting via capture');
// 7 build your own module
await go('modules');await p.locator('.otidy',{hasText:'Build your own module'}).click();await p.waitForTimeout(300);
await p.keyboard.type('Wine cellar');await p.locator('.sheet .li',{hasText:'Collection'}).click();await p.waitForTimeout(150);await p.locator('#f-mod-hub').selectOption('Recreation');await p.locator('#f-mod-word').fill('bottle');await p.locator('#f-mod-st').fill('In the cellar, Drank');
await p.getByRole('button',{name:'Create'}).click();await p.waitForTimeout(600);
ok(/Wine cellar/.test(await text()),'custom module page');
await R(()=>window.__lifeos.App.refresh());await p.waitForTimeout(200);
await p.getByRole('button',{name:/New bottle|Add a bottle/}).first().click();await p.waitForTimeout(300);await p.locator('#f-x-what').fill('Barolo 2016');await p.getByRole('button',{name:'Add',exact:true}).click();await p.waitForTimeout(400);
ok(/Barolo 2016/.test(await text())&&/In the cellar/.test(await text()),'custom entry');
await go('search');await p.locator('#q').fill('Barolo');await p.waitForTimeout(400);ok(/Wine cellar/.test(await text()),'custom entry searchable');
// 8 export
await R(()=>{window.__lifeos.store.downloads={save:async o=>{window._saved=o;}};});
await go('tool',{hub:'Finances',tool:'spending'});await p.getByRole('button',{name:'Spending options'}).click();await p.waitForTimeout(200);await menu('Export as spreadsheet');await p.waitForTimeout(300);
ok(await R(()=>!!window._saved&&/^"What for","Amount","Category","Date","Added"/.test(window._saved.data)&&/"lunch"|"Lunch"/.test(window._saved.data)),'export csv');
// 9 discover suggests a fitting module
await E('m1','Health','meals',{meal:'Dinner',what:'Tacos',tag:'None',note:'',date:ad(0)});
await R(()=>{const L=window.__lifeos;const s=L.get.settings();L.put(Object.assign({},s,{hubHidden:Object.assign({},s.hubHidden,{Health:['measure','prep']})}),{silent:true});});
await go('discover');ok(/Modules for you/i.test(await text())&&/Meal prep/.test(await text()),'discover suggests module');
await p.locator('.dmods .li',{hasText:'Meal prep'}).getByRole('button',{name:'Turn on'}).click();await p.waitForTimeout(400);ok(await R(()=>!window.__lifeos.get.settings().hubHidden.Health.includes('prep')),'turn on from discover');
// 10 weekly review lists modules
for(let i=1;i<=7;i++)await E('ws'+i,'Finances','spending',{what:'Thing '+i,amount:5,cat:'Other',date:ad(-i)});
await go('review');ok(/From your modules/i.test(await text())&&/expense/.test(await text()),'review from modules');
// 11 optional areas in settings
await go('setpage',{id:'areas'});ok(/Life admin/.test(await text())&&/New · optional/.test(await text()),'optional areas');
ok(!errs.length,'errs '+errs);console.log(JSON.stringify({pass,fails},null,1));await b.close();})().catch(e=>{console.log('CRASH',e.message.slice(0,700));process.exit(1);});
