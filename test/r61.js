const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/page.html');await p.waitForTimeout(500);
let pass=0;const fails=[];const ok=(c,m)=>{if(c)pass++;else fails.push(m);};const R=(f,a)=>p.evaluate(f,a);const text=()=>p.locator('#view').innerText();const menu=async l=>{await p.locator('.menu button,[role=menu] button',{hasText:l}).first().click();await p.waitForTimeout(300);};
const ad=n=>{const d=new Date();d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const go=(v,pr)=>R(([v,pr])=>window.__lifeos.App.go(v,pr||{}),[v,pr]).then(()=>p.waitForTimeout(350));
const P=(r)=>R(r=>window.__lifeos.put(Object.assign({createdAt:Date.now()},r),{silent:true}),r);
const T=(id,title,x)=>P(Object.assign({id,kind:'task',title,notes:'',steps:[],date:null,time:null,repeat:{type:'never',end:null},priority:'normal'},x||{}));
await R(()=>{const L=window.__lifeos;L.put(Object.assign({},L.get.settings(),{introDone:true,nudgeOff:true,planEve:false}),{silent:true});});
await p.mouse.move(5,5);
// 1 inbox multi-select
await P({id:'i1',kind:'idea',title:'Fix gate',notes:''});await P({id:'i2',kind:'idea',title:'Call plumber',notes:''});await P({id:'i3',kind:'idea',title:'Old thought',notes:''});
await go('inbox');await p.getByRole('button',{name:/options|More/i}).first().click();await p.waitForTimeout(200);await menu('Select ideas');await p.locator('.tsel',{hasText:'Fix gate'}).click();await p.waitForTimeout(150);await p.locator('.tsel',{hasText:'Call plumber'}).click();await p.waitForTimeout(150);await p.locator('.selbar').getByRole('button',{name:'Make tasks'}).click();await p.waitForTimeout(300);
ok(await R(()=>{const L=window.__lifeos;return !L.get.id('i1')&&L.get.all('task').some(t=>t.title==='Fix gate')&&L.get.all('task').some(t=>t.title==='Call plumber')&&!!L.get.id('i3');}),'ideas to tasks');
// 2 step to task
await T('st','Plan party',{date:ad(1),steps:[{id:'s1',t:'Book venue',d:false},{id:'s2',t:'Send invites',d:false}]});await R(()=>window.__lifeos.App.go('tasks'));await p.waitForTimeout(200);
await R(()=>{const L=window.__lifeos;});
// open task sheet via openItem through tasks page upcoming
await R(()=>{window.__lifeos.App.state.taskTab='upcoming';window.__lifeos.App.refresh();});await p.waitForTimeout(300);await p.locator('#view .li',{hasText:'Plan party'}).getByText('Plan party').click();await p.waitForTimeout(500);
const stp=p.locator('.sheet').last().locator('.step').first();await stp.click({button:'right'});await p.waitForTimeout(250);await menu('Make it its own task');
ok(await R(()=>window.__lifeos.get.all('task').some(t=>t.title==='Book venue')),'step to task');await p.locator('.sheet').last().getByRole('button',{name:'Save'}).click();await p.waitForTimeout(400);ok(await R(()=>window.__lifeos.get.id('st').steps.length===1),'step removed on save');
// 3 copy last week
await P({id:'hb',kind:'habit',title:'Swim',days:[],target:2,dur:30,logs:{},sessions:{[ad(-7)]:{time:null},[ad(-6)]:{time:null}}});
await R(()=>{const L=window.__lifeos;L.put(Object.assign({},L.get.settings(),{studioHabits:true}),{silent:true});L.App.state.studio={mode:'w',anchor:null};L.App.go('studio');});await p.waitForTimeout(400);
await p.getByRole('button',{name:'Copy last week’s plan'}).click();await p.waitForTimeout(300);ok(await R(d=>!!window.__lifeos.get.id('hb').sessions[d],ad(0)),'copied last week');
// 4 plan in studio only
await P({id:'pj',kind:'project',title:'Garage',status:'active'});await T('pt1','Sort boxes',{part:'pj'});await T('pt2','Sweep floor',{part:'pj'});
await go('plan',{id:'pj'});await p.getByRole('button',{name:'Plan in Studio'}).click();await p.waitForTimeout(400);let t=await text();ok(/Showing Garage only/.test(t)&&/Sort boxes/.test(t)&&/Sweep floor/.test(t)&&!/Swim/.test(t.split('To plan')[1]||''),'studio only '+t.slice(0,300));
await R(()=>{window.__lifeos.App.state.studio.only=null;});
// 5 routine suggest time, 6 optional step
await P({id:'rt',kind:'routine',title:'Morning reset',days:[0,1,2,3,4,5,6],steps:[{id:'a',t:'Water',min:1},{id:'b',t:'Stretch',min:1,opt:true},{id:'c',t:'Plan',min:1}],runs:{}});
await go('routine',{id:'rt'});ok(/Give it a time/.test(await text()),'routine suggest');await p.getByRole('button',{name:/Set for 7:00 AM/}).click();await p.waitForTimeout(200);ok(await R(()=>window.__lifeos.get.id('rt').setTime===420),'routine time set');
await go('player',{id:'rt'});await p.getByRole('button',{name:'Done',exact:true}).click();await p.waitForTimeout(200);ok(/Optional/i.test(await text()),'optional label');await p.getByRole('button',{name:'Skip'}).click();await p.waitForTimeout(200);ok(await R(()=>!window.__lifeos.App.state.player.skipped[1]),'optional skip not counted');
await R(()=>{window.__lifeos.App.state.player=null;});
// 7 habit by month
const logs={};for(let i=0;i<70;i+=2)logs[ad(-i)]=true;await P({id:'hm',kind:'habit',title:'Read',days:[0,1,2,3,4,5,6],target:7,logs,sessions:{},startDate:ad(-75)});
await go('habit',{id:'hm'});ok(/By month/i.test(await text())&&await p.locator('.hmb').count()>=3,'habit by month');
// 8 habit goal
await P({id:'gl',kind:'goal',title:'50 reads',track:'number',numStart:0,numTarget:50,numCur:0,habitId:'hm',countFrom:ad(-10),status:'active'});await go('plan',{id:'gl'});ok(await R(()=>window.__lifeos.get.id('gl').numCur>=5),'goal counts habit');
// 9 project template
await go('plan',{id:'pj'});await p.getByRole('button',{name:'Options'}).first().click();await p.waitForTimeout(200);await menu('Save as template');ok(await R(()=>window.__lifeos.get.all('tpl').some(x=>x.tk==='project'&&x.items.length===2)),'project template saved');
await go('projects');await p.getByRole('button',{name:/options|More/i}).first().click();await p.waitForTimeout(200);await menu('New from a template');await p.locator('.sheet').last().locator('.li',{hasText:'Garage'}).click();await p.waitForTimeout(400);ok(await R(()=>window.__lifeos.get.all('project').filter(x=>x.title==='Garage').length===2),'project from template');
// 10 left to spend, 11 bill history
await P({id:'cfg-Finances-spending',kind:'entry',hub:'Finances',tool:'spending',f:{t:'cfg',plan:{Groceries:400}}});await P({id:'sp1',kind:'entry',hub:'Finances',tool:'spending',f:{what:'Market',amount:100,cat:'Groceries',date:ad(0)}});
await go('tool',{hub:'Finances',tool:'spending'});ok(/\$300 left to spend/.test(await text()),'left to spend');
await P({id:'bl',kind:'entry',hub:'Finances',tool:'bills',f:{what:'Water',amount:42,day:ad(3).slice(8),pay:'By hand'}});await go('tool',{hub:'Finances',tool:'bills'});await p.locator('#view .li',{hasText:'Water'}).first().click({button:'right'});await p.waitForTimeout(250);await menu('Payment history');ok(/Not marked/.test(await p.locator('.sheet').last().innerText()),'bill history');await p.keyboard.press('Escape');await p.waitForTimeout(300);
// 12 health week
await P({id:'w1',kind:'entry',hub:'Health',tool:'workouts',f:{what:'Run',min:30,date:ad(0)}});await go('area',{name:'Health'});ok(/This week/i.test(await text())&&/workouts/.test(await text()),'health week');
// 13 person notes
await P({id:'pp',kind:'entry',hub:'Relationships',tool:'people',f:{what:'Sam',every:14,touch:[{d:ad(-3),t:'a'},{d:ad(-2),t:'b'},{d:ad(-1),t:'c'}]}});await go('tool',{hub:'Relationships',tool:'people'});await p.getByRole('button',{name:'All 3 notes'}).click();await p.waitForTimeout(300);ok((await p.locator('.sheet').last().locator('.li').count())===3,'all notes');await p.keyboard.press('Escape');await p.waitForTimeout(300);
// 15 insights areas
for(let i=0;i<4;i++)await T('d'+i,'Done '+i,{date:ad(0),area:'Health',doneDates:{[ad(0)]:Date.now()}});await go('insights');ok(/vs\./.test(await text()),'area trends '+(await text()).slice(0,200));
// 16 search filters
await R(()=>{window.__lifeos.App.state.q='Done';});await go('search');await p.locator('#q').fill('Done');await p.waitForTimeout(200);await p.locator('.fsel').first().selectOption('Health');await p.waitForTimeout(200);ok(/Done 1/.test(await text()),'search area filter');
await R(()=>{const S=window.__lifeos.App.state;S.qArea=null;S.qWhen=null;S.q='';});
// 17 list sort
await P({id:'ls',kind:'list',title:'Groceries',items:[{id:'a',t:'pears',d:false},{id:'b',t:'apples',d:false},{id:'c',t:'milk',d:false}]});await go('list',{id:'ls'});await p.getByRole('button',{name:/options|More/i}).first().click();await p.waitForTimeout(200);await menu('Sort A to Z');ok(await R(()=>window.__lifeos.get.id('ls').items.map(i=>i.t).join()==='apples,milk,pears'),'list sorted');
// 18 photos filter
await P({id:'ph1',kind:'idea',title:'Pic idea',notes:'',photos:[{id:'x',url:'data:image/gif;base64,R0lGODlhAQABAAAAACw='}]});await P({id:'ph2',kind:'task',title:'Pic task',notes:'',steps:[],date:null,repeat:{type:'never'},photos:[{id:'y',url:'data:image/gif;base64,R0lGODlhAQABAAAAACw='}]});
await go('photos');await p.locator('.hscroll button',{hasText:'Tasks'}).click();await p.waitForTimeout(300);t=await text();ok(/Pic task/.test(t)&&!/Pic idea/.test(t),'photo filter');
ok(!errs.length,'errs '+errs);console.log(JSON.stringify({pass,fails},null,1));await b.close();})().catch(e=>{console.log('CRASH',e.message.slice(0,700));process.exit(1);});
