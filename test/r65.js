const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/page.html');await p.waitForTimeout(500);
let pass=0;const fails=[];const ok=(c,m)=>{if(c)pass++;else{fails.push(m);p.locator('#view').innerText().then(t=>console.log('--',m,'\n',t.slice(0,600)));}};const R=(f,a)=>p.evaluate(f,a);const text=()=>p.locator('#view').innerText();const menu=async l=>{await p.locator('.menu button,[role=menu] button',{hasText:l}).first().click();await p.waitForTimeout(300);};
const ad=n=>{const d=new Date();d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const go=(v,pr)=>R(([v,pr])=>window.__lifeos.App.go(v,pr||{}),[v,pr]).then(()=>p.waitForTimeout(350));
const P=(r)=>R(r=>window.__lifeos.put(Object.assign({createdAt:Date.now()},r),{silent:true}),r);
const T=(id,title,x)=>P(Object.assign({id,kind:'task',title,notes:'',steps:[],date:null,time:null,repeat:{type:'never',end:null},priority:'normal'},x||{}));
const on={Health:['sleep','mindful','skin','groom'],Finances:['debt','wish'],Home:['pantry'],Career:['certs'],Learning:['lang','curric'],'Personal growth':['journal','decisions','yir']};
await R(o=>{const L=window.__lifeos;L.put(Object.assign({},L.get.settings(),{introDone:true,nudgeOff:true,planEve:false,hubShown:o}),{silent:true});},on);
const E=(id,hub,tool,f,ago=30)=>P({id,kind:'entry',hub,tool,f,createdAt:Date.now()-864e5*ago});
const addVia=async(hub,tool,btnRe,vals)=>{await go('tool',{hub,tool});await p.getByRole('button',{name:btnRe}).first().click();await p.waitForTimeout(300);for(const [k,v] of Object.entries(vals)){const loc=p.locator('#f-x-'+k);if(await loc.evaluate(n=>n.tagName)==='SELECT')await loc.selectOption(v);else await loc.fill(String(v));}await p.getByRole('button',{name:'Add',exact:true}).click();await p.waitForTimeout(350);};
// sleep consistency
for(const [i,bd,w] of [[1,'22:45','06:40'],[2,'23:00','06:50'],[3,'22:50','06:45'],[4,'23:10','07:00']])await E('sl'+i,'Health','sleep',{what:'OK',bed:bd,wake:w,rested:'OK',note:'',date:ad(-i)});
await go('tool',{hub:'Health',tool:'sleep'});t=await text();ok(/Usual bedtime/i.test(t)&&/10:5\d PM/.test(t)&&/Steady/.test(t),'sleep consistency');
// mindfulness timer logs a session
await go('tool',{hub:'Health',tool:'mindful'});await p.locator('.ob-pill',{hasText:'10 min'}).click();await p.waitForTimeout(300);ok(/Meditation/.test(await text()),'mindful timer');
await R(()=>{const L=window.__lifeos,s=L.get.settings();s.focusRun.start-=10*60000;L.put(Object.assign({},s),{silent:true});});await p.getByRole('button',{name:'Finish'}).click();await p.waitForTimeout(250);await p.getByRole('button',{name:'Log it',exact:true}).click();await p.waitForTimeout(350);
ok(await R(()=>window.__lifeos.get.all('entry').some(x=>x.tool==='mindful'&&+x.f.n>=10)),'mindful session logged');
// skincare routine + expiry
await addVia('Health','skin',/Add a product/,{what:'Vitamin C',status:'Morning',step:'Serum',opened:ad(-170),pao:6});
ok(await R(()=>{const x=window.__lifeos.get.all('entry').find(e=>e.f.what==='Vitamin C');return !!x.f.exp;}),'skincare expiry computed');
ok(/MORNING/i.test(await text()),'routine card');await p.locator('.skr').first().getByRole('button',{name:'Done'}).click();await p.waitForTimeout(250);ok(/Done today/.test(await text()),'routine ticked');
await go('today');ok(/Replace or reorder Vitamin C/.test(await text()),'skincare on today');
// grooming nudge
await E('gr1','Health','groom',{what:'Haircut',who:'Marco',cost:45,every:42,last:ad(-45),note:''});await go('today');ok(/Haircut/.test(await text()),'grooming on today');
// debt payoff
await E('db1','Finances','debt',{what:'Visa',status:'Paying',bal:4200,apr:24,min:120,note:''});await E('db2','Finances','debt',{what:'Store card',status:'Paying',bal:600,apr:28,min:35,note:''});
await go('tool',{hub:'Finances',tool:'debt'});t=await text();ok(/Debt-free/i.test(t)&&/PAYOFF ORDER/i.test(t),'debt plan');
const order1=await p.locator('.olnum').first().locator('xpath=..').innerText();ok(/Store card/.test(order1),'smallest first');
await p.locator('.seg button',{hasText:'Highest interest first'}).click();await p.waitForTimeout(250);ok(/Store card/.test(await p.locator('.olnum').first().locator('xpath=..').innerText()),'avalanche (store card highest apr)');
await p.getByRole('button',{name:'Increase'}).first().click().catch(()=>{});await p.waitForTimeout(250);
ok(await R(()=>{const L=window.__lifeos;L.put(Object.assign({},L.get.settings(),{debtExtra:100}),{silent:true});L.App.refresh();return true;}),'x');await p.waitForTimeout(200);ok(/Saves \$\d/.test(await text()),'extra payment saves');
// wishlist waiting period
await addVia('Finances','wish',/Add something you want/,{what:'Espresso machine',price:650});ok(/Decide in 30 days/.test(await text()),'wish waiting');
await E('ws1','Finances','wish',{what:'Drone',status:'Waiting',price:900,ready:ad(-1),note:''});await go('today');ok(/Still want Drone\?/.test(await text()),'wish on today');
await go('tool',{hub:'Finances',tool:'wish'});await p.locator('.li',{hasText:'Drone'}).getByRole('button',{name:'Skip'}).click();await p.waitForTimeout(300);ok(/Didn.t buy\s*\$900/i.test(await text()),'skip counts not spent');
// pantry: groceries skip + recipes
await E('pa1','Home','pantry',{what:'Rice',status:'Pantry',qty:'2 lb',note:''});await E('rc1','Health','meals',{t:'recipe',what:'Chicken and rice',ing:'2 cups rice\n1 lb chicken',serves:4});
await go('tool',{hub:'Home',tool:'pantry'});ok(/Chicken and rice · 1 on hand/.test(await text()),'pantry suggests recipe');
// certifications pace
await E('ce1','Career','certs',{what:'CRA',status:'Active',need:80,renew:ad(500),org:'',log:[{n:20,what:'x',d:ad(-30)}],note:''});await go('tool',{hub:'Career',tool:'certs'});ok(/60 to go · about/.test(await text()),'cert pace');
await p.getByRole('button',{name:'Log credits for CRA'}).click();await p.waitForTimeout(300);await p.locator('#f-x-n').fill('5');await p.getByRole('button',{name:/Save|Add|Done/}).last().click();await p.waitForTimeout(300);ok(/25 of 80 credits/.test(await text()),'credits logged');
// language words become flashcards
await addVia('Learning','lang',/Log practice/,{what:'Duolingo',lang:'Italian',n:15,words:'ciao — hi\ngrazie — thanks'});
ok(await R(()=>window.__lifeos.get.all('entry').filter(x=>x.tool==='review'&&/ciao|grazie/.test(x.f.what)).length===2),'words to flashcards');
// curriculum focus single
await E('cu1','Learning','curric',{what:'Systems thinking',status:'Focus',note:''});await addVia('Learning','curric',/Add a subject|New subject/,{what:'Statistics',status:'Focus'});
ok(await R(()=>{const l=window.__lifeos.get.all('entry').filter(x=>x.tool==='curric');return l.filter(x=>x.f.status==='Focus').length===1&&l.find(x=>x.f.what==='Statistics').f.status==='Focus';}),'one focus subject');
// journal + mood insight
for(let i=0;i<6;i++)await E('jn'+i,'Personal growth','journal',{what:'Day',mood:['Great','Good','Okay','Good','Low','Great'][i],grat:'',body:'x',note:'',date:ad(-i)});
await go('tool',{hub:'Personal growth',tool:'journal'});ok(/Today.s prompt/i.test(await text())&&await p.locator('.moodrow i.m5').count()>=1,'journal head');
await go('insights');ok(/MOOD/i.test(await text()),'mood in insights');
// decision log check-back
await E('dc1','Personal growth','decisions',{what:'Take the role',conf:'Fairly sure',review:ad(-1),status:'Open',note:''},95);await go('today');ok(/How did “Take the role” turn out\?/.test(await text()),'decision check-back');
// year in review + theme
await go('reviews');await p.locator('.otidy',{hasText:'in review'}).click();await p.waitForTimeout(300);ok(/in review/.test(await text())&&/Journal entries/.test(await text()),'year in review');
await p.locator('#f-yir-theme').fill('Steady');await p.getByRole('button',{name:/next year.s theme/}).click();await p.waitForTimeout(250);
ok(await R(()=>{const c=window.__lifeos.get.id('cfg-Personalgrowth-compass');return c&&c.f.nextTheme==='Steady';}),'theme saved');
// project savings
await P({id:'pj',kind:'project',title:'Kitchen refresh',area:'Home',steps:[]});await go('plan',{id:'pj'});await p.locator('.otidy',{hasText:'Set money aside'}).click();await p.waitForTimeout(300);
await p.locator('#f-x-target').fill('3000');await p.locator('#f-x-saved').fill('500');await p.getByRole('button',{name:/Save|Add|Done/}).last().click();await p.waitForTimeout(300);
ok(/\$500\s*of \$3,000/.test(await text()),'project fund card');await go('tool',{hub:'Finances',tool:'savings'});ok(/Kitchen refresh/.test(await text()),'shows in savings');
// movies pick for tonight
await E('q1','Recreation','queue',{what:'Severance',type:'Show',status:'Up next',where:'Apple TV',note:''});await E('q2','Recreation','queue',{what:'Dune',type:'Movie',status:'Up next',where:'Max',note:''});
await go('tool',{hub:'Recreation',tool:'queue'});await p.getByRole('button',{name:'Pick something for tonight'}).click();await p.waitForTimeout(300);ok(/Severance|Dune/.test(await p.locator('.sheet').last().innerText())&&/on (Apple TV|Max)/.test(await p.locator('.sheet').last().innerText()),'pick for tonight');
ok(!errs.length,'errs '+errs);console.log(JSON.stringify({pass,fails},null,1));await b.close();})().catch(e=>{console.log('CRASH',e.message.slice(0,700));process.exit(1);});
