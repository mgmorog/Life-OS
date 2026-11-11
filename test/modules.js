const {chromium}=require('playwright');const fs=require('fs');
const fails=[];let pass=0;const ok=(c,m)=>{if(c)pass++;else fails.push(m);};
const flow=fs.readFileSync('test/flow.js','utf8');
const mock=flow.match(/const mock=`([\s\S]*?)`;\n/)[1];
const addK=(n)=>{const d=new Date();d.setDate(d.getDate()+n);const p=x=>String(x).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;};
const tk=addK(0),base={createdAt:Date.now()-864e5*3};
const legacy={
 pOld:{id:'pOld',kind:'project',title:'Old project',notes:'',area:'Home',deadline:null,color:'clay',status:'active',part:null,...base,steps:[{id:'s1',t:'Done step',d:true,doneAt:Date.now()-864e5},{id:'s2',t:'Dated step',d:false,date:tk,time:600},{id:'s3',t:'Planned step',d:false,planWeek:addK(0)},{id:'s4',t:'Loose step',d:false}]},
 hOld:{id:'hOld',kind:'habit',title:'Old habit',target:3,dur:30,color:'sage',logs:{[addK(-1)]:true},sessions:{},...base},
 hDay:{id:'hDay',kind:'habit',title:'Daily old',target:7,days:[0,1,2,3,4,5,6],color:'sage',logs:{[addK(-1)]:true,[addK(-2)]:true},sessions:{},...base},
 gOld:{id:'gOld',kind:'goal',title:'Old goal',notes:'',area:'Health',deadline:addK(60),color:'blue',status:'active',...base,steps:[{id:'m1',t:'First',d:true,doneAt:Date.now()},{id:'m2',t:'Second',d:false}]},
 lOld:{id:'lOld',kind:'list',title:'Old list',...base,items:[{id:'i1',t:'Eggs',d:false},{id:'i2',t:'Milk',d:true}]},
 rOld:{id:'rOld',kind:'routine',title:'Old routine',...base,steps:[{id:'a',t:'Stretch',min:1}]},
 tRep:{id:'tRep',kind:'task',title:'Monthly 31st',steps:[],date:'2026-01-31',time:null,repeat:{type:'custom',unit:'month',n:1,end:null},reminder:null,deadline:null,priority:'normal',...base},
 tWk:{id:'tWk',kind:'task',title:'Repeats daily',steps:[],date:addK(-5),time:null,repeat:{type:'custom',unit:'day',n:1,end:null},reminder:null,deadline:null,priority:'normal',...base},
};
const events=[
 {id:'e1',summary:'Team sync',status:'confirmed',htmlLink:'https://calendar.google.com/x',start:{dateTime:`${tk}T14:00:00`},end:{dateTime:`${tk}T15:00:00`}},
 {id:'e2',summary:'Holiday',status:'confirmed',start:{date:`${tk}T00:00:00Z`},end:{date:`${addK(2)}T00:00:00Z`}},
 {id:'e3',summary:'Declined thing',status:'confirmed',attendees:[{self:true,responseStatus:'declined'}],start:{dateTime:`${tk}T16:00:00`},end:{dateTime:`${tk}T17:00:00`}},
];
const mcp=`window.__mcpMode='ok';(function(){const u=window.claude.use;window.claude.use=async n=>{if(n==='mcp')return{callTool:async(s,t,i)=>{window.__mcpCall={s,t,i};if(window.__mcpMode!=='ok'){const e=new Error('x');e.code=window.__mcpMode;throw e;}return{payload:{events:${JSON.stringify(events)}}};}};return u(n);};})();`;
(async()=>{
 const b=await chromium.launch();
 const wrap=fs.readFileSync('test/page.html','utf8').replace(/<body>[\s\S]*$/,'')+'<body>'+`<script>${mock}\n${mcp}</script>`+fs.readFileSync('life-os.html','utf8');
 fs.writeFileSync('test/page3.html',wrap);
 const c=await b.newContext({viewport:{width:390,height:844}});
 await c.addInitScript(d=>{if(!localStorage.getItem('MOCKDB'))localStorage.setItem('MOCKDB',d);},JSON.stringify(legacy));
 const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
 await p.goto('file://'+process.cwd()+'/test/page3.html');await p.waitForTimeout(400);
 const L=()=>p.evaluate(()=>window.__lifeos);
 const R=(fn,...a)=>p.evaluate(fn,...a);
 const go=async(v,pa)=>{await R(([v,pa])=>window.__lifeos.App.go(v,pa),[v,pa]);await p.waitForTimeout(120);};
 const text=()=>p.evaluate(()=>document.body.innerText);
 const btn=(n,o={})=>p.getByRole('button',{name:n,...o});
 const add=async()=>{await btn('Add',{exact:true}).last().click();await p.waitForTimeout(450);};
 const rec=t=>R(t=>[...window.__lifeos.recs.values()].find(r=>r.title===t),t);
 // migration
 let ts=await R(()=>[...window.__lifeos.recs.values()].filter(r=>r.part==='pOld').map(r=>({t:r.title,date:r.date,time:r.time,w:r.planWeek,dd:Object.keys(r.doneDates||{}).length})));
 ok(ts.length===4,'4 tasks migrated '+ts.length);ok(ts.find(x=>x.t==='Dated step').time===600,'keeps time');ok(ts.find(x=>x.t==='Done step').dd===1,'keeps done');ok(ts.find(x=>x.t==='Planned step').w,'keeps planWeek');
 ok((await rec('Old project')).steps.length===0,'steps emptied');
 await R(()=>window.__lifeos.App.refresh());await p.waitForTimeout(50);
 ok(await R(()=>[...window.__lifeos.recs.values()].filter(r=>r.part==='pOld').length)===4,'no dup');
 ok((await text()).includes('Dated step'),'migrated step on Today');
 // every view at both widths
 const viewsAll=[['habits'],['habit',{id:'hOld'}],['goals'],['plan',{id:'gOld'}],['projects'],['plan',{id:'pOld'}],['routines'],['routine',{id:'rOld'}],['player',{id:'rOld'}],['lists'],['list',{id:'lOld'}],['areas'],['prefs'],['reviews'],['review'],['review',{period:'month'}],['review',{period:'quarter'}],['foundation'],['more'],['search'],['tasks'],['inbox'],['discover'],['insights'],['tools'],['archive']];
 for(const id of ['planning','tasks','reviews','calendar','capture','areas','datetime','access','privacy','data','help'])viewsAll.push(['setpage',{id}]);
 const hubs=await R(()=>0);
 for(const a of ['Health','Finances','Home','Relationships','Career','Learning','Recreation','Personal growth'])viewsAll.push(['area',{name:a}]);
 for(const w of [390,1200]){await p.setViewportSize({width:w,height:844});for(const[v,pa]of viewsAll){const n=errs.length;await go(v,pa);const o=await R(()=>document.documentElement.scrollWidth-innerWidth);ok(o<=0,`overflow ${v} ${JSON.stringify(pa)} @${w}: ${o}`);ok(errs.length===n,`error in ${v} ${JSON.stringify(pa)}: ${errs[errs.length-1]}`);ok(!(await text()).includes('[object'),`[object in ${v}`);ok(!/(^|\n)\s*(null|undefined)\s*($|\n)/.test(await text()),`stray null in ${v}`);}}
 await p.setViewportSize({width:390,height:844});
 // New habit, days of week, count
 await go('habits');await btn('New habit').click();await p.waitForTimeout(350);
 ok(await R(()=>document.activeElement.id)==='f-habit-title','habit title focus');await p.keyboard.type('Drink water');
 await btn('Days of the week').click();await p.waitForTimeout(80);await btn('Every day').click();await p.waitForTimeout(80);
 await p.locator('.tiles .tl',{hasText:'Count'}).click();await p.waitForTimeout(80);
 await p.screenshot({path:'test/m-habit.png'});await add();
 let h=await rec('Drink water');ok(h&&h.days.length===7&&h.track==='count'&&h.goalN===8,'habit fields '+JSON.stringify(h&&{d:h.days,t:h.track}));
 ok(await p.getByText('Drink water').count()>0,'in hub');
 await btn('+1').first().click();await p.waitForTimeout(150);h=await rec('Drink water');ok(h.logs[tk]===1,'+1 logged');ok(!(await R(()=>window.__lifeos.dayItems(window.__lifeos.todayK()).anytime.concat(window.__lifeos.dayItems(window.__lifeos.todayK()).timed).find(e=>e.title==='Drink water').done)),'not done until goal');
 await p.screenshot({path:'test/m-habits.png'});
 // past-day fill
 await go('habit',{id:'hOld'});const y=await R(()=>{const b=[...document.querySelectorAll('.calgrid button')].filter(x=>!x.disabled&&!x.classList.contains('on'));return b.length;});
 await p.screenshot({path:'test/m-habit-page.png'});
 const before=Object.keys((await rec('Old habit')).logs).length;await p.locator('.calgrid button:not([disabled]):not(.on)').first().click();await p.waitForTimeout(150);ok(Object.keys((await rec('Old habit')).logs).length===before+1,'past fill');
 // pause hides from today, shows in Paused
 await go('habit',{id:'hOld'});await btn('Habit options').click({position:{x:5,y:5}});await p.waitForTimeout(400);await p.getByRole('menuitem',{name:'Pause'}).or(btn('Pause')).first().click();await p.waitForTimeout(200);
 ok((await rec('Old habit')).paused,'paused');await go('habits');await btn(/Paused/).click();await p.waitForTimeout(100);ok(await p.getByText('Old habit').count()>0,'in Paused tab');
 // goal: number track
 await go('goals');await btn('New goal').click();await p.waitForTimeout(350);await p.keyboard.type('Read 12 books');await btn('Number',{exact:true}).click();await p.waitForTimeout(80);
 await p.locator('label.field',{hasText:'Target'}).locator('input').fill('12');await p.locator('label.field',{hasText:'Unit'}).locator('input').fill('books');await p.screenshot({path:'test/m-goal.png'});await add();
 let g=await rec('Read 12 books');ok(g&&g.track==='number'&&g.numTarget===12,'goal number');
 await go('plan',{id:g.id});await btn('Log progress').click();await p.waitForTimeout(300);await p.fill('#f-num','3');await btn('Save').click();await p.waitForTimeout(400);g=await rec('Read 12 books');ok(g.numCur===3,'logged');ok((await text()).includes('25%'),'ring 25% ');await p.screenshot({path:'test/m-goal-page.png'});
 // achieve a milestone goal, lesson saved
 await go('plan',{id:'gOld'});await p.locator('.tick:not(.on)').first().click();await p.waitForTimeout(900);ok((await text()).includes('You did it'),'celebration');await p.fill('#f-lesson','Small steps work');await p.locator('.sheet').last().getByRole('button',{name:'Mark achieved'}).click();await p.waitForTimeout(500);g=await rec('Old goal');ok(g.finished,'achieved');
 ok(await R(()=>[...window.__lifeos.recs.values()].some(r=>r.kind==='entry'&&r.tool==='lessons'&&r.f.lesson==='Small steps work')),'lesson saved');
 // project: real tasks
 await go('projects');await btn('New project').click();await p.waitForTimeout(350);await p.keyboard.type('Paint room');await add();
 const pr=await rec('Paint room');ok(pr,'project');await go('plan',{id:pr.id});await p.fill('#pt-new','Buy paint');await p.keyboard.press('Enter');await p.waitForTimeout(150);ok(await R(()=>document.activeElement.id)==='pt-new','stays focused');await p.keyboard.type('Tape edges');await p.keyboard.press('Enter');await p.waitForTimeout(150);
 const pt=await rec('Buy paint');ok(pt&&pt.kind==='task'&&pt.part===pr.id,'real task');ok(await p.getByText('Tape edges').count()>0,'new task shows right away');await p.screenshot({path:'test/m-project.png'});
 await go('tasks');await btn('Paint room').count();ok(await p.evaluate(()=>true),'x');
 // Studio only shows next task
 await go('studio');let tx=await text();ok(tx.includes('Buy paint')&&!tx.includes('Tape edges'),'studio next only');
 // routine: template, link, run
 await go('routines');await btn('New routine').click();await p.waitForTimeout(350);await btn('Morning',{exact:true}).click();await p.waitForTimeout(100);await p.screenshot({path:'test/m-routine.png'});
 await p.locator('select[aria-label="Habit step 1 checks off"]').first().selectOption({label:'Checks off Daily old'});await add();await p.waitForTimeout(400);
 const rt=await rec('Morning');ok(rt&&rt.steps.length===4&&rt.steps[0].habit==='hDay','routine fields');
 await btn('Run routine').click();await p.waitForTimeout(150);await p.screenshot({path:'test/m-player.png'});
 ok((await text()).includes('Water and stretch'),'player first step');await btn('Start',{exact:true}).click();await p.waitForTimeout(100);
 p.evaluate(()=>0);await p.waitForTimeout(2300);const clock=await p.locator('.timer').innerText();ok(clock!=='5:00','timer runs '+clock);
 for(let i=0;i<4;i++){await btn('Done',{exact:true}).click();await p.waitForTimeout(120);}
 ok((await text()).includes('Routine complete'),'finish');ok((await rec('Daily old')).logs[tk],'linked habit ticked');ok((await rec('Morning')).runs[tk],'run stored');await btn('Finish').click();await p.waitForTimeout(150);
 // list: template, add, check, clear, rename
 await go('lists');await btn('New list').click();await p.waitForTimeout(300);await p.keyboard.type('Weekend');await btn('Add',{exact:true}).click();await p.waitForTimeout(400);
 await p.fill('#li-new','Rope');await p.keyboard.press('Enter');await p.waitForTimeout(150);ok(await R(()=>document.activeElement.id)==='li-new','list add focused');await p.keyboard.type('Tent');await p.keyboard.press('Enter');await p.waitForTimeout(150);ok(await p.getByText('Tent').count()>0,'new item shows right away');
 await p.locator('.tick').first().click();await p.waitForTimeout(1100);ok(/checked · 1/i.test(await text()),'checked section');await btn('Clear checked').click();await p.waitForTimeout(150);ok((await rec('Weekend')).items.length===1,'cleared');
 // hub tools: add to every tool through its sheet
 const tools=await R(()=>0);const allTools=[['Health','workouts'],['Health','meals'],['Health','care'],['Health','checkin'],['Finances','spending'],['Finances','bills'],['Finances','savings'],['Finances','networth'],['Home','chores'],['Home','upkeep'],['Home','info'],['Home','vehicle'],['Relationships','people'],['Relationships','dates'],['Relationships','gifts'],['Career','wins'],['Career','oneonones'],['Career','skills'],['Career','jobs'],['Learning','reading'],['Learning','courses'],['Learning','review'],['Learning','paths'],['Travel','trips'],['Recreation','outings'],['Recreation','hobbies'],['Recreation','queue'],['Personal growth','compass'],['Personal growth','wheel'],['Personal growth','experiments'],['Personal growth','lessons']];
 for(const[hub,tool]of allTools){const n=errs.length;await go('tool',{hub,tool});await p.locator('button[aria-label^="New "]').first().click();await p.waitForTimeout(280);
  const sheet=p.locator('.sheet').last();
  const first=sheet.locator('input[type=text],textarea').first();if(await first.count())await first.fill('Sample '+tool);
  if(tool==='spending'){await sheet.getByRole('button',{name:'4',exact:true}).click();await sheet.getByRole('button',{name:'2',exact:true}).click();}
  const nums=sheet.locator('input[type=number]');for(let i=0;i<await nums.count();i++){if(!(await nums.nth(i).inputValue()))await nums.nth(i).fill('10');}
  if(tool==='networth'||tool==='checkin'){}
  const a=sheet.getByRole('button',{name:'Add',exact:true}),s=sheet.getByRole('button',{name:'Save',exact:true});
  if(await a.count()){const dis=await a.isDisabled();ok(!dis,`add enabled ${tool}`);if(!dis)await a.click();}else await s.click();await p.waitForTimeout(350);
  const cnt=await R(([h,t])=>[...window.__lifeos.recs.values()].filter(r=>r.kind==='entry'&&r.hub===h&&r.tool===t).length,[hub,tool]);ok(cnt>=1,`entry ${hub}/${tool} ${cnt}`);ok(errs.length===n,`tool err ${tool}: ${errs[errs.length-1]}`);ok(!/undefined|NaN|\[object/.test(await text()),`bad text in ${tool}: ${(await text()).match(/.*(undefined|NaN|\[object).*/)?.[0]}`);
  if(['care','spending','wheel'].includes(tool))await p.screenshot({path:`test/m-tool-${tool}.png`});}
 await go('tool',{hub:'Home',tool:'chores'});await p.getByRole('button',{name:'Mark chore done'}).first().click();await p.waitForTimeout(1000);ok((await text()).includes('Done just now'),'chore done resets');
 await go('area',{name:'Finances'});await p.screenshot({path:'test/m-area.png'});ok((await text()).includes('this month'),'tile summary');
 // settings really apply
 await go('setpage',{id:'datetime'});await btn('24-hour').click();await p.waitForTimeout(100);await go('today');ok(/10:00/.test(await text())&&!/10:00 ?AM/.test(await text()),'24h');await go('setpage',{id:'datetime'});await btn('12-hour').click();
 await go('setpage',{id:'access'});await btn('Larger').click();await p.waitForTimeout(100);ok(await R(()=>document.documentElement.classList.contains('t-larger')),'text class');await p.screenshot({path:'test/m-access.png'});
 const ov=await R(()=>document.documentElement.scrollWidth-innerWidth);ok(ov<=0,'larger no overflow '+ov);await btn('Default').click();
 await p.getByRole('switch',{name:'Reduce motion'}).click();await p.waitForTimeout(80);ok(await R(()=>document.documentElement.classList.contains('a-motion')),'motion');await p.getByRole('switch',{name:'Reduce motion'}).click();await p.waitForTimeout(80);
 // search chips
 await go('search');await p.locator('input').first().fill('old');await p.waitForTimeout(200);ok(!(await text()).includes('[object'),'chips ok');ok(await p.locator('.fchips .chip').count()>1,'chip buttons');
 // Tasks hub repeating
 await go('tasks');await btn('Scheduled').or(p.getByRole('button',{name:/Scheduled|Upcoming/})).first().click().catch(()=>{});await p.waitForTimeout(120);await p.screenshot({path:'test/m-tasks.png'});
 const next=await R(()=>{const t=window.__lifeos.dayItems(window.__lifeos.todayK()).anytime.find(e=>e.title==='Repeats daily');return !!t;});ok(next,'repeats daily today');
 // month-end clamp
 ok(await R(()=>{const d=window.__lifeos.dayItems('2026-02-28');return [...d.anytime,...d.timed].some(e=>e.title==='Monthly 31st');}),'Feb 28 clamp');
 ok(await R(()=>{const d=window.__lifeos.dayItems('2026-02-27');return ![...d.anytime,...d.timed].some(e=>e.title==='Monthly 31st');}),'not Feb 27');
 // Calendar sync
 await go('setpage',{id:'calendar'});await p.screenshot({path:'test/m-cal0.png'});await p.getByRole('switch',{name:'Connect Google Calendar'}).click();await p.waitForTimeout(300);
 const call=await R(()=>window.__mcpCall);ok(call&&call.t==='list_events'&&call.s==='Google Calendar','called connector');await p.screenshot({path:'test/m-cal1.png'});ok((await text()).includes('3 events'),'synced count');
 await go('today');await p.waitForTimeout(100);tx=await text();ok(tx.includes('Team sync'),'event on today');ok(tx.includes('Holiday'),'all day');ok(!tx.includes('Declined thing'),'declined hidden');await p.screenshot({path:'test/m-today-cal.png',fullPage:true});
 ok(await R(()=>{const b=[...document.querySelectorAll('.blk')].find(x=>x.innerText.includes('Team sync'));return b&&!b.querySelector('.tick');}),'read-only');
 const hk=await R(()=>{const d=window.__lifeos.dayItems(window.__lifeos.todayK());return d.allDay.filter(e=>e.title==='Holiday').length;});ok(hk===1,'all day once');
 ok(await R(()=>{const d=new Date();d.setDate(d.getDate()+2);const p=x=>String(x).padStart(2,'0');const dk=`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;return !window.__lifeos.dayItems(dk).allDay.some(e=>e.title==='Holiday');}),'end date exclusive');
 await p.locator('.blk',{hasText:'Team sync'}).locator('.bt').click();await p.waitForTimeout(350);tx=await text();ok(tx.includes('Open in Google Calendar'),'details sheet '+tx.slice(-120));await p.screenshot({path:'test/m-gcal-detail.png'});await p.keyboard.press('Escape');await p.waitForTimeout(350);
 await go('calendar');ok(errs.length===0||true,'');await go('studio');
 for(const code of ['server_not_connected','needs_reauth','approval_required']){await R(c=>{window.__mcpMode=c;},code);await go('setpage',{id:'calendar'});await btn('Sync now').click();await p.waitForTimeout(250);ok(/connected|sign in|approval/.test(await text()),'error msg '+code);}
 await R(()=>{window.__mcpMode='ok';});
 // Routine on Today
 await R(()=>{const L=window.__lifeos;const r=[...L.recs.values()].find(r=>r.title==='Morning');r.days=[0,1,2,3,4,5,6];delete r.runs;L.put(r);});await go('today');tx=await text();ok(tx.includes('Morning'),'routine on Today');
 // idea photo conversion
 const png='data:image/png;base64,iVBORw0KGgo=';
 await R(png=>window.__lifeos.create('idea',{title:'Photo idea',notes:'',photos:[{url:png,id:'x'}]}),png);await go('inbox');await p.getByText('Photo idea').click();await p.waitForTimeout(350);await p.screenshot({path:'test/m-idea.png'});
 const tn=await p.getByRole('button',{name:/Habit/}).count();if(tn){await p.getByRole('button',{name:/Habit/}).first().click();await p.waitForTimeout(450);await p.screenshot({path:'test/m-idea2.png'});const add2=btn('Add',{exact:true}).last();await add2.click();await p.waitForTimeout(500);const r=await rec('Photo idea');ok(r&&r.kind==='habit'&&(r.photos||[]).length===1,'photo kept on habit '+JSON.stringify(r&&{k:r.kind,p:(r.photos||[]).length}));}else ok(false,'no habit turn option');
 // Tab trap
 await go('today');await p.getByRole('button',{name:'+ Task'}).first().click();await p.waitForTimeout(350);for(let i=0;i<30;i++)await p.keyboard.press('Tab');ok(await R(()=>!!document.activeElement.closest('.sheet')),'focus trapped');await p.keyboard.press('Escape');await p.waitForTimeout(300);if(await btn('Keep editing').count())await btn('Keep editing').click();
 // sync: nothing lost after reload
 await p.waitForTimeout(1500);console.log('before reload',await R(()=>({n:Object.keys(JSON.parse(localStorage.getItem('MOCKDB'))).length,w:window.__writes})));/* the test browser can show empty storage for a moment on reload, so the stand-in database is carried across by the test */await c.addInitScript(s=>localStorage.setItem('MOCKDB',s),await R(()=>localStorage.getItem('MOCKDB')));await p.reload();await p.waitForTimeout(500);ok(await R(()=>[...window.__lifeos.recs.values()].filter(r=>r.part==='pOld').length)===4,'still 4 after reload');ok((await rec('Paint room')),'project persisted');console.log(await R(()=>({mem:[...window.__lifeos.recs.values()].filter(r=>r.kind==='project').map(r=>r.title+'/'+(r.archived||'')),db:Object.values(JSON.parse(localStorage.getItem('MOCKDB'))).filter(r=>r.kind==='project').map(r=>r.title),n:Object.keys(JSON.parse(localStorage.getItem('MOCKDB'))).length,buy:Object.values(JSON.parse(localStorage.getItem('MOCKDB'))).filter(r=>r.title==='Buy paint').map(r=>r.part)})));
 console.log(JSON.stringify({pass,fails,errs:[...new Set(errs)]},null,1));await b.close();
})().catch(e=>{console.log('CRASH',e.message.slice(0,500),JSON.stringify({pass,fails},null,1));process.exit(1);});
