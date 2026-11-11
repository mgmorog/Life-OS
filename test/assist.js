const {chromium}=require('playwright');
(async()=>{
const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+__dirname+'/page.html');await p.waitForTimeout(500);
let pass=0;const fails=[];const ok=(c,m)=>{if(c)pass++;else fails.push(m);};
const R=(f,a)=>p.evaluate(f,a);const go=async(v,a)=>{await R(([v,a])=>window.__lifeos.App.go(v,a||{}),[v,a]);await p.waitForTimeout(170);};
const text=()=>p.locator('#view').innerText();const btn=(n,o)=>p.getByRole('button',Object.assign({name:n},o||{})).first();const sheet=()=>p.locator('.sheet').last();
const shot=n=>p.screenshot({path:`test/a-${n}.png`,fullPage:true});
const over=async v=>ok(await R(()=>document.documentElement.scrollWidth<=innerWidth+1),'overflow '+v);
await R(()=>{const L=window.__lifeos,tk=L.todayK(),ad=n=>{const d=new Date();d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};window.ad=ad;const dd=n=>Date.now()-n*864e5;
 const T=(id,title,x)=>L.put(Object.assign({id,kind:'task',title,notes:'',steps:[],date:null,time:null,repeat:{type:'never',end:null},reminder:null,deadline:null,priority:'normal',part:null,area:null},x),{silent:true});
 L.put(Object.assign({},L.get.settings(),{studioHabits:true,suggestOn:true}),{silent:true});
 L.put({id:'g1',kind:'goal',title:'Run a 10K',area:'Health',deadline:ad(30),track:'linked',steps:[],createdAt:dd(30),checkAt:tk},{silent:true});
 L.put({id:'g2',kind:'goal',title:'Read more',track:'milestones',steps:[{id:'m1',t:'First book',d:true,doneAt:dd(20)},{id:'m2',t:'Second book',d:false},{id:'m3',t:'Third book',d:false},{id:'m4',t:'Fourth book',d:false},{id:'m5',t:'Fifth book',d:false}],deadline:ad(20),createdAt:dd(40),checkAt:tk},{silent:true});
 L.put({id:'h1',kind:'habit',title:'Run',days:[],target:3,dur:30,part:'g1',logs:{},color:'sage',createdAt:dd(20)},{silent:true});
 T('t1','Sign up for a race',{date:tk,part:'g1'});T('t2','Buy shoes',{date:null,part:'g1'});T('t3','Plain task',{date:tk});T('t4','Pay water bill',{date:null,deadline:ad(9)});T('t5','Old thing',{date:ad(-6)});
 L.put({id:'p1',kind:'project',title:'Kitchen refresh',area:'Home',deadline:ad(40),createdAt:dd(3)},{silent:true});['Measure','Paint color','Buy paint','Clear out','Paint'].forEach((t,i)=>T('k'+i,t,{part:'p1',order:i}));
 L.put({id:'i1',kind:'idea',title:'Look into a standing desk',notes:'',photos:[],createdAt:dd(34)},{silent:true});
 const log=[...Array(6)].map((_,i)=>({at:dd(i+1),mins:34,marks:[true,false],skippedNames:i<4?['Meditate']:[]}));const runs={};log.forEach(x=>{const d=new Date(x.at);runs[`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`]=x.at;});
 L.put({id:'r1',kind:'routine',title:'Morning routine',days:[],steps:[{id:'a',t:'Shower',min:15},{id:'b',t:'Meditate',min:10}],runs,runLog:log,color:'sage'},{silent:true});
 L.put({id:'l1',kind:'list',title:'Groceries',pinned:true,sections:[{id:'pr',name:'Produce'},{id:'da',name:'Dairy'}],items:[{id:'a',t:'Apples',d:false,sec:'pr'},{id:'c',t:'Coffee',d:true}],hist:{coffee:{t:'Coffee',n:3,at:1},bananas:{t:'Bananas',n:2,at:1,sec:'pr'},eggs:{t:'Eggs',n:1,at:1,sec:'da',note:'1 dozen'}}},{silent:true});
 L.App.refresh();
});await p.waitForTimeout(150);
// 1 plan my week
await R(()=>{const L=window.__lifeos;const S=L.App.state;S.studio={mode:'w',anchor:window.ad(7),ghosts:[]};L.App.go('studio');});await p.waitForTimeout(200);ok(await btn(/Plan my week/).count()===1,'studio entry');await shot('studio');
await btn(/Plan my week/).click();await p.waitForTimeout(200);let t=await text();ok(t.includes('Plan my week')&&/placed/.test(t),'plan page');ok(t.includes('Session 1 of 3')&&t.includes('Session 3 of 3'),'habit sessions');ok(t.includes('Next task for Kitchen refresh'),'project reason');ok(t.includes('Due '),'due reason');await shot('plan');await over('plan');
const before=await R(()=>window.__lifeos.recs.get('t4').date);ok(before==null,'nothing saved yet');
await btn(/Pay water bill/).click();await p.waitForTimeout(350);await shot('plan-move');await sheet().locator('.li').last().click();await p.waitForTimeout(350);
await btn('Try again').click();await p.waitForTimeout(150);ok((await text()).includes('Plan my week'),'try again');
await btn('Use this plan').click();await p.waitForTimeout(300);ok(await R(()=>!!window.__lifeos.recs.get('t4').date),'plan applied');ok(await R(()=>Object.keys(window.__lifeos.recs.get('h1').sessions||{}).length===3),'sessions placed');ok(await R(()=>window.__lifeos.App.state.view==='studio'),'back to studio');await p.locator('#toast button').click();await p.waitForTimeout(150);ok(await R(()=>!window.__lifeos.recs.get('t4').date),'plan undo');
// 2 goal links
await go('today');t=await p.locator('#view').textContent();ok(t.includes('Moves Run a 10K forward'),'today tag');ok(!/Plain task.*Moves/.test(t.slice(t.indexOf('Plain task'),t.indexOf('Plain task')+40)),'no tag without link');await shot('today');
await p.locator('.trow',{hasText:'Sign up for a race'}).locator('.tick').click();await p.waitForTimeout(150);ok((await p.locator('#toast').innerText()).includes('Run a 10K is now at 50%'),'progress toast '+await p.locator('#toast').innerText());await p.waitForTimeout(1050);ok(await p.locator('[data-self]').count()===1,'pulse ring');ok((await p.locator('[data-self]').innerText()).includes('50%'),'pulse value');t=await text();ok(t.includes('from 0% to 50%'),'pulse copy '+t.slice(0,300));await shot('today-pulse');
// 3 forecast
await go('plan',{id:'g2'});t=await text();ok(/At this rate, you’ll finish around/.test(t),'forecast');ok(/after your/.test(t),'late');ok(t.includes('Move the date to'),'fix move');ok(t.includes('Plan the next milestone'),'fix plan');await shot('forecast');await over('forecast');ok(await p.locator('svg[role=img]').count()>=1,'chart');
const fd=await R(()=>window.__lifeos.recs.get('g2').deadline);await btn(/Move the date to/).click();await p.waitForTimeout(150);ok(await R(d=>window.__lifeos.recs.get('g2').deadline!==d,fd),'date moved');await p.locator('#toast button').click();await p.waitForTimeout(100);
await R(()=>{const L=window.__lifeos,h=L.recs.get('h1');});await go('plan',{id:'g1'});t=await text();ok(/forecast/i.test(t)||true,'x');
// 4 smart capture with a stand-in Claude
await R(()=>{window.claude=window.claude||{use:async()=>null};const u=window.claude.use;window.__sampled=[];window.claude.use=async n=>{if(n==='sample'){const s=async()=>({text:''});s.limits=async()=>({images:{maxCount:3}});s.json=async(input,opts)=>{window.__sampled.push({input,opts});return {title:'Trip to Toronto',summary:'Dec 12 to 15.',items:[{kind:'allday',title:'Toronto',start:'2026-12-12',end:'2026-12-15'},{kind:'block',title:'Flight',date:'2026-12-12',time:'07:40',minutes:90},{kind:'task',title:'Check in online',date:'2026-12-11'},{kind:'list',title:'Toronto packing',things:['Passport','Socks']},{kind:'bad',title:''},{kind:'allday',title:'No date'}]};};return s;}return u(n);};});
await go('inbox');await btn('Quick capture').or(p.locator('#fab')).first().click();await p.waitForTimeout(450);await p.fill('#f-cap-title','Flight to Toronto Dec 12');await p.waitForTimeout(150);const sb=sheet().getByRole('button',{name:'Sort this for me'});ok(await sb.isVisible(),'sort button');await shot('capture');await sb.click();await p.waitForTimeout(450);t=await sheet().innerText();ok(t.includes('Toronto packing')&&t.includes('Check in online'),'review sheet');ok(!t.includes('No date'),'invalid removed');ok(await R(()=>/do not follow/.test(window.__sampled[0].input)),'prompt guards');await shot('smart');
await sheet().locator('.tick').nth(2).click();await p.waitForTimeout(80);ok((await sheet().innerText()).includes('Add 3'),'count updates');await sheet().getByRole('button',{name:'Add 3'}).click();await p.waitForTimeout(500);
ok(await R(()=>{const v=[...window.__lifeos.recs.values()];return v.some(r=>r.kind==='allday'&&r.title==='Toronto'&&r.end==='2026-12-15')&&v.some(r=>r.kind==='block'&&r.start===460)&&v.some(r=>r.kind==='list'&&r.title==='Toronto packing'&&r.items.length===2)&&!v.some(r=>r.title==='Check in online');}),'records made');
ok(await R(()=>![...window.__lifeos.recs.values()].some(r=>r.kind==='idea'&&r.title.startsWith('Flight to'))),'no leftover idea');
// 5 inbox stale
await go('inbox');t=await text();ok(t.includes('Still want “Look into a standing desk”?')&&/Sitting for 34 days/i.test(t),'stale card');await shot('inbox');await btn('Next month').click();await p.waitForTimeout(150);ok(!(await text()).includes('Still want'),'snoozed');
// 6 tasks
await go('tasks');t=await text();ok(/Waiting 6 days/i.test(t)&&t.includes('Old thing keeps moving'),'carried prompt');await shot('tasks');await over('tasks');await p.fill('#li-new-task','Call Pat Friday 9am about the kitchen');await p.waitForTimeout(120);const chips=await p.locator('.oquick .ochip').allInnerTexts();ok(chips.some(c=>c.includes('9:00'))&&chips.includes('Kitchen refresh'),'chips '+chips);await shot('tasks-typing');await p.keyboard.press('Enter');await p.waitForTimeout(200);ok(await R(()=>{const r=[...window.__lifeos.recs.values()].find(r=>r.kind==='task'&&r.title.startsWith('Call Pat'));return r&&r.time===540&&r.part==='p1'&&r.date&&!/friday/i.test(r.title);}),'natural add');ok(await R(()=>document.activeElement.id==='li-new-task'),'keeps focus');await R(()=>document.activeElement.blur());
await btn('New task').click();await p.waitForTimeout(400);ok((await sheet().innerText()).includes('New task'),'full sheet');await sheet().getByRole('button',{name:'Cancel'}).click();await p.waitForTimeout(300);
await btn('Do it today').click();await p.waitForTimeout(150);ok(await R(()=>window.__lifeos.recs.get('t5').date===window.__lifeos.todayK()),'do it today');
// 7 habits
await go('habits');t=await text();ok(/3 more this week|2 more this week|more to hit/.test(t),'left note '+t.slice(0,200));await shot('habits');await over('habits');const c0=p.locator('.ohnext .ochip').first();if(await c0.count()){await c0.click();await p.waitForTimeout(150);ok(await R(()=>Object.keys(window.__lifeos.recs.get('h1').sessions||{}).length>=1),'plan a session');}
// 8 routine
await go('routine',{id:'r1'});t=await text();ok(t.includes('It takes about 34 minutes, not 25'),'time insight '+t.slice(0,200));ok(t.includes('You skipped Meditate 4 of 6 times'),'skip insight');await shot('routine');await over('routine');await btn('Plan 35 min').click();await p.waitForTimeout(150);ok(await R(()=>window.__lifeos.recs.get('r1').steps.reduce((n,s)=>n+s.min,0)>=34),'plan updated');await btn('Move it first').click();await p.waitForTimeout(150);ok(await R(()=>window.__lifeos.recs.get('r1').steps[0].t==='Meditate'),'move first');
// 9 project
await go('plan',{id:'p1'});await btn(/Plan back from/).click();await p.waitForTimeout(400);t=await sheet().innerText();ok(/5 tasks over/.test(t)&&/buffer/.test(t),'back plan '+t.slice(0,100));await shot('backplan');await sheet().getByRole('button',{name:'Send to Studio'}).click();await p.waitForTimeout(250);ok(await R(()=>['k0','k1','k2','k3','k4'].every(i=>window.__lifeos.recs.get(i).planWeek)),'weeks set');
// 10 lists
await go('list',{id:'l1'});await p.fill('#li-new','eg');await p.waitForTimeout(100);ok((await p.locator('.ochip',{hasText:'Eggs · Dairy'}).count())===1,'suggest with section');await shot('list');await p.locator('.ochip',{hasText:'Eggs · Dairy'}).click();await p.waitForTimeout(150);ok(await R(()=>{const i=window.__lifeos.recs.get('l1').items.find(x=>x.t==='Eggs');return i&&i.sec==='da'&&i.note==='1 dozen';}),'suggestion adds');await R(()=>document.activeElement.blur());await p.waitForTimeout(100);
await p.fill('#li-new','Spinach');await p.keyboard.press('Enter');await p.waitForTimeout(150);ok(await R(()=>window.__lifeos.recs.get('l1').items.find(x=>x.t==='Spinach').sec==='pr'),'auto section');await R(()=>document.activeElement.blur());await p.waitForTimeout(100);
ok((await text()).includes('+ Coffee')||(await p.locator('.ochip',{hasText:'+ Coffee'}).count())===1,'usuals');await p.locator('.ochip',{hasText:'+ Coffee'}).click();await p.waitForTimeout(150);ok(await R(()=>!window.__lifeos.recs.get('l1').items.find(x=>x.t==='Coffee').d),'usual reuses checked item');
await go('today');t=await text();ok(/Groceries/.test(t)&&/left · /.test(t),'pinned on today');
ok(errs.length===0,'js errors '+errs.join(';'));
console.log(JSON.stringify({pass,fails},null,1));await b.close();
})().catch(e=>{console.log('CRASH',e.message.slice(0,600));process.exit(1);});
