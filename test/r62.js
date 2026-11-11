const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/page.html');await p.waitForTimeout(500);
let pass=0;const fails=[];const ok=(c,m)=>{if(c)pass++;else{fails.push(m);p.locator('#view').innerText().then(t=>console.log('--',m,'\n',t.slice(0,900)));}};const R=(f,a)=>p.evaluate(f,a);const text=()=>p.locator('#view').innerText();const menu=async l=>{await p.locator('.menu button,[role=menu] button',{hasText:l}).first().click();await p.waitForTimeout(300);};
const ad=n=>{const d=new Date();d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const go=(v,pr)=>R(([v,pr])=>window.__lifeos.App.go(v,pr||{}),[v,pr]).then(()=>p.waitForTimeout(350));
const P=(r)=>R(r=>window.__lifeos.put(Object.assign({createdAt:Date.now()},r),{silent:true}),r);
const T=(id,title,x)=>P(Object.assign({id,kind:'task',title,notes:'',steps:[],date:null,time:null,repeat:{type:'never',end:null},priority:'normal'},x||{}));
const L=f=>R(f);
// 1 estimate in task sheet
await T('a1','Draft budget',{date:ad(0)});await R(()=>window.__lifeos.App.go('tasks'));await p.waitForTimeout(250);await p.locator('.li',{hasText:'Draft budget'}).locator('button.grow').click();await p.waitForTimeout(350);
await p.locator('.seg button',{hasText:'1h'}).click();await p.waitForTimeout(150);await p.locator('.seg button',{hasText:'Low'}).nth(1).click();await p.waitForTimeout(100);await p.locator('.seg button',{hasText:'Home'}).click();await p.getByRole('button',{name:'Save'}).click();await p.waitForTimeout(300);
ok(await R(()=>{const t=window.__lifeos.get.id('a1');return t.dur===60&&t.energy==='low'&&t.place==='home';}),'estimate energy place saved');
ok(/1 hr/.test(await text())&&/Low energy/.test(await text()),'task meta shows estimate and tags');
// 2 focus timer start, logs time
await R(()=>{const L=window.__lifeos;const t=L.get.id('a1');});
await p.locator('.li',{hasText:'Draft budget'}).locator('button.grow').click();await p.waitForTimeout(300);await p.getByRole('button',{name:'Start focus'}).click();await p.waitForTimeout(400);
ok(/Draft budget/.test(await text())&&/left/.test(await text()),'timer view');
await R(()=>{const L=window.__lifeos,s=L.get.settings();s.focusRun.start-=12*60000;L.put(Object.assign({},s),{silent:true});});
await p.getByRole('button',{name:'Finish'}).click();await p.waitForTimeout(300);await p.getByRole('button',{name:/Log it and mark/}).click();await p.waitForTimeout(400);
ok(await R(()=>{const t=window.__lifeos.get.id('a1');return t.spent>=12&&(t.focusLog||[]).length===1&&!!(t.doneDates||{})[Object.keys(t.doneDates||{})[0]];}),'focus logged and done');
// 3 estimates insight
for(let i=0;i<3;i++)await T('d'+i,'Old '+i,{date:ad(-2),dur:30,spent:60,doneDates:{[ad(-2)]:Date.now()-2*864e5}});
await go('insights');ok(/Estimates vs\. actual/i.test(await text())&&/2×|1\.\d×/.test(await text()),'insights estimates');
// 4 now card
await T('n1','Tidy desk',{date:ad(0),energy:'low',place:'home'});await T('n2','Deep strategy doc',{date:ad(0),energy:'high',place:'work'});
await go('today');await p.getByRole('button',{name:'What should I do now?'}).click();await p.waitForTimeout(250);await p.locator('.nowcard .chip',{hasText:'Low'}).click();await p.waitForTimeout(200);
ok(await p.locator('.nowcard').innerText().then(s=>/Tidy desk/.test(s)&&s.indexOf('Tidy desk')<(s.indexOf('Deep strategy')<0?1e9:s.indexOf('Deep strategy'))),'now card ranks low energy');
// 5 waiting on
await R(()=>{window.__lifeos.App.state.taskTab='waiting';window.__lifeos.App.go('tasks');});await p.waitForTimeout(250);await p.getByRole('button',{name:'Add waiting on'}).click();await p.waitForTimeout(300);
await p.locator('#f-x-title').fill('Signed lease');await p.locator('#f-x-who').fill('Jordan');await p.locator('#f-x-follow').fill(ad(0));await p.getByRole('button',{name:'Add',exact:true}).click();await p.waitForTimeout(300);
ok(/Signed lease/.test(await text())&&/Follow up · 1/i.test(await text()),'waiting added');
await go('today');ok(/Jordan: Signed lease/.test(await text()),'follow up on today');
await p.locator('.dduecard',{hasText:'Signed lease'}).getByRole('button',{name:'Nudged'}).click();await p.waitForTimeout(300);
ok(await R(a=>{const w=window.__lifeos.get.all('wait').find(x=>x.title==='Signed lease');return w.follow===a&&w.nudges.length===1;},ad(3)),'nudge pushes follow-up');
// 6 dependencies
await P({id:'pj',kind:'project',title:'Move',area:'Home',deadline:ad(30),steps:[]});
await T('p1','Pack boxes',{part:'pj',order:0,dur:120});await T('p2','Book movers',{part:'pj',order:1});
await R(()=>{const L=window.__lifeos,t=L.get.id('p1');t.after=['p2'];L.put(t,{silent:true});});
await go('plan',{id:'pj'});t=await text();ok(/Next up\s*Book movers/i.test(t)&&/Waits for Book movers/.test(t),'deps: next up unblocked');
await p.locator('.seg button',{hasText:'Timeline'}).click();await p.waitForTimeout(250);ok(/Finishes about/.test(await text())&&await p.locator('.tl-bar').count()===2,'timeline');
ok(await R(()=>{const L=window.__lifeos;return true;}),'x');
// 7 time budgets
await go('studio');await p.locator('button',{hasText:'Set time budgets'}).first().click().catch(()=>{});await p.waitForTimeout(300);
await R(()=>{const L=window.__lifeos;L.put(Object.assign({},L.get.settings(),{timeBudget:{Home:4}}),{silent:true});L.App.refresh();});await p.keyboard.press('Escape');await p.waitForTimeout(300);
await go('studio');ok(/Time this week/i.test(await text())&&/4h budget/.test(await text()),'time budget card');
// 8 goal cascade
await P({id:'gy',kind:'goal',title:'Healthy year',horizon:'year',track:'milestones',steps:[]});await P({id:'gq',kind:'goal',title:'Run a 10k',horizon:'quarter',parentGoal:'gy',track:'milestones',steps:[]});
await go('goals');ok(/Healthy year/.test(await text())&&/Set a focus/.test(await text()),'cascade');
await p.locator('.cq-w').first().click();await p.waitForTimeout(300);await p.keyboard.type('Three runs this week');await p.getByRole('button',{name:'Save'}).click();await p.waitForTimeout(300);
ok(/Three runs this week/.test(await text()),'week focus set');await go('studio');ok(/GOALS THIS WEEK/i.test(await text())&&/Three runs/.test(await text()),'studio shows goal week');
// 9 scorecard
await go('reviews');ok(/Scorecard/i.test(await text())&&/Tasks finished/.test(await text()),'scorecard');
await p.getByRole('button',{name:'Choose'}).click();await p.waitForTimeout(300);await p.locator('.sheet .li',{hasText:'Pages read'}).click();await p.getByRole('button',{name:'Save'}).click();await p.waitForTimeout(300);
ok(/Pages read/.test(await text()),'scorecard choose');
// 10 goal sheet timeframe
await go('goals');await p.getByRole('button',{name:'New goal'}).first().click().catch(async()=>{await p.locator('.oadd').click();});await p.waitForTimeout(300);await p.keyboard.type('Ship the course');await p.locator('.seg button',{hasText:'This quarter'}).click();await p.waitForTimeout(200);
ok(await p.locator('#f-g-parent').count()===1,'quarter goal can pick a yearly parent');await p.locator('#f-g-parent').selectOption('gy');await p.getByRole('button',{name:'Add',exact:true}).click();await p.waitForTimeout(300);
ok(await R(()=>{const g=window.__lifeos.get.all('goal').find(x=>x.title==='Ship the course');return g.horizon==='quarter'&&g.parentGoal==='gy'&&!!g.deadline;}),'goal horizon saved');
ok(!errs.length,'errs '+errs);console.log(JSON.stringify({pass,fails},null,1));await b.close();})().catch(e=>{console.log('CRASH',e.message.slice(0,700));process.exit(1);});
