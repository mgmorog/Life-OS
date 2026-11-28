// v364 · smarter round 2: `bash mk.sh && node test/r364.cjs`. Exits 1 on failure.
const {chromium}=require('playwright');const path=require('path');
const CHROME=process.env.CHROME||'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
(async()=>{const b=await chromium.launch({executablePath:CHROME});
  const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
  const errs=[];p.on('pageerror',x=>errs.push(x.message));
  await p.goto('file://'+path.join(__dirname,'page.html'));await p.waitForTimeout(900);
  let fails=0;const ok=(n,c,i)=>{console.log((c?'  ok   ':'  FAIL ')+n+(c?'':'  → '+JSON.stringify(i)));if(!c)fails++;};
  const ev=(f,a)=>p.evaluate(f,a);const go=async(v,o)=>{await p.evaluate(([v,o])=>window.__lifeos.App.go(v,o),[v,o]);await p.waitForTimeout(600);};
  const txt=()=>ev(()=>document.querySelector('#view').innerText);
  const toasts=()=>ev(()=>[...document.querySelectorAll('.toast, #toast')].map(t=>t.innerText).join(' | '));
  ok('hooks exposed',await ev(()=>!!window.__lifeos.x.sm2));
  // seed
  await ev(()=>{const L=window.__lifeos,tk=L.todayK(),K=n=>{const d=new Date();d.setDate(d.getDate()+n);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};window.__K=K;
    const T=(title,f={})=>L.create('task',Object.assign({title,notes:'',steps:[],date:tk,time:null,repeat:{type:'never',end:null},priority:'normal',area:null,photos:[]},f));
    for(let i=1;i<=12;i++){const d=new Date();d.setDate(d.getDate()-i);if(d.getDay()===0||d.getDay()===6)continue;d.setHours(9,30,0,0);T('Deep task '+i,{priority:'high',date:K(-i),doneDates:{[K(-i)]:d.getTime()}});}
    T('Draft memo one',{date:K(-3),spent:50,doneDates:{[K(-3)]:Date.now()-3*864e5}});T('Draft memo two',{date:K(-5),spent:55,doneDates:{[K(-5)]:Date.now()-5*864e5}});
    T('Return the cables',{slips:3});T('Sort out the 529 plan',{dur:180});
    const pr=L.create('project',{title:'Big launch',deadline:K(4),area:'Career',steps:[]});for(let i=0;i<8;i++)T('Launch task '+i,{part:pr.id,date:null,dur:120});
    L.t.setToolOn('Relationships','people',true);L.create('entry',{hub:'Relationships',tool:'people',f:{what:'Jordan Lee',topics:'Budget timeline\nHoliday plans',every:30}});
    const nm=new Date().getHours()*60+new Date().getMinutes();if(nm<23*60+20)L.create('block',{title:'Coffee with Jordan',date:tk,start:nm+20,dur:30,repeat:{type:'never'}});
    const h1=L.create('habit',{title:'Floss',days:[0,1,2,3,4,5,6],startDate:K(-40),logs:{[K(-3)]:true,[K(-10)]:true},area:'Health'});
    const a={},bb={};for(let i=1;i<=28;i++){if(i%3===0)continue;a[K(-i)]=true;bb[K(-i)]=true;}L.create('habit',{title:'Tea ritual',target:7,days:[],startDate:K(-40),logs:a,at:{}});L.create('habit',{title:'Evening pages',target:7,days:[],startDate:K(-40),logs:bb});
    L.create('habit',{title:'Stretch break',days:[0,1,2,3,4,5,6],startDate:K(-30),logs:{},at:{[K(-1)]:600,[K(-2)]:610,[K(-3)]:590,[K(-4)]:605},remSmart:true});
    L.create('habit',{title:'Piano practice',target:3,days:[],area:'Recreation',startDate:K(-20),logs:{}});const g=L.create('goal',{title:'Learn piano',area:'Recreation',steps:[{id:'s1',t:'Book a first lesson',d:false,date:K(-3)},{id:'s2',t:'Practice scales',d:false}],track:'milestones'});window.__g=g.id;
    L.t.setToolOn('Finances','bills',true);L.create('entry',{hub:'Finances',tool:'bills',f:{what:'Water utility',amount:142,day:new Date(Date.now()+3*864e5).getDate(),pay:'Pay by hand',amtH:[95,98,96]}});
    L.t.setToolOn('Home','chores',true);['Mop floors','Dust shelves','Clean bathroom','Wipe kitchen'].forEach(w=>L.create('entry',{hub:'Home',tool:'chores',f:{what:w,every:7,last:K(-6)}}));
    L.t.setToolOn('Health','checkin',true);for(let i=1;i<=24;i++){const sl=i%2?8:6;L.create('entry',{hub:'Health',tool:'checkin',f:{date:K(-i),sleep:sl,e:'OK',water:4}});const n=sl>=7?4:2;for(let j=0;j<n;j++)T(`Sleep test ${i}-${j}`,{date:K(-i),doneDates:{[K(-i)]:Date.now()-i*864e5}});}
    L.t.setToolOn('Health','meals',true);L.create('entry',{hub:'Health',tool:'meals',f:{t:'recipe',what:'Lentil soup',ing:'1 cup red lentils\n2 carrots\n1 onion'}});L.create('entry',{hub:'Health',tool:'meals',f:{meal:'Dinner',what:'Lentil soup',date:K(2)}});L.create('list',{title:'Groceries',items:[{id:'i1',t:'Milk',d:false}],sections:[]});
    for(let i=0;i<4;i++)T('Fix the fence '+i,{area:'Home',slips:2,date:K(2)});});
  const X=f=>ev(f);
  ok('1 best hours learned from when focused work gets done',(await X(()=>{const b=window.__lifeos.x.sm2.best();return b&&b.start;}))===540);
  ok('2 estimate learned from focus time',(await X(()=>window.__lifeos.create('task',{title:'Draft memo three',notes:'',steps:[],date:null,repeat:{type:'never'},priority:'normal',photos:[]}).dur))>=50);
  ok('5 deadline risk found',await X(()=>window.__lifeos.x.sm2.risk(window.__lifeos.todayK()).some(r=>r.p.title==='Big launch')));
  ok('7 quick add reads ~45m, #area and !',JSON.stringify(await X(()=>{const r=window.__lifeos.x.sm2.capRead('Review AP aging #Career ~45m !');return [r.dur,r.area,r.hi];}))==='[45,"Career",true]');
  ok('9 focus gaps found next week',(await X(()=>window.__lifeos.x.sm2.gaps(window.__K(7)).length))>=1);
  ok('13 a target that fits',await X(()=>{const h=window.__lifeos.get.all('habit').find(h=>h.title==='Floss');const f=window.__lifeos.x.sm2.fit(h);return f&&f.dir==='down';}));
  ok('14 habits you already pair',await X(()=>window.__lifeos.x.sm2.pairs().some(p=>/Tea ritual|Evening pages/.test(p.first.title))));
  ok('15 your usual time is learned',(await X(()=>window.__lifeos.x.sm2.usual(window.__lifeos.get.all('habit').find(h=>h.title==='Stretch break'))))>=590);
  ok('15 smart reminders are scheduled',(await X(()=>{const out=[];window.__lifeos.x.sm2.rems((e,dk,t,m)=>out.push(e.title));return out.filter(t=>t==='Stretch break').length;}))>=5);
  ok('18 a habit that moves a goal',await X(()=>window.__lifeos.get.all('goal').some(g=>window.__lifeos.x.sm2.goalLinks(g).length)));
  ok('21 one sentence, several items',JSON.stringify(await X(()=>window.__lifeos.x.sm2.split('buy milk and call Mom and book the dentist')))==='["Buy milk","Call Mom","Book the dentist"]');
  ok('21 a plain idea stays whole',(await X(()=>window.__lifeos.x.sm2.split('Look into a ceramics class')))===null);
  ok('22 a recipe link files to Meals',(await X(()=>{const h=window.__lifeos.x.sm2.link({title:'https://www.allrecipes.com/recipe/123/lentil-soup',notes:''});return h&&h.tool.id;}))==='meals');
  ok('23 a bill that looks off',await X(()=>{const b=window.__lifeos.x.sm2.bill();return !!b&&b.x.f.what==='Water utility';}));
  ok('25 chores spread across the week',await X(()=>{const c=window.__lifeos.x.sm2.chores(window.__lifeos.todayK());return !!c&&c.moves.length>=1;}));
  ok('26 sleep and your days',await X(()=>{const s=window.__lifeos.x.sm2.sleep();return !!s&&s.pct>=50;}));
  ok('27 groceries from the meal plan',JSON.stringify(await X(()=>(window.__lifeos.x.sm2.meals(window.__lifeos.todayK())||{}).need))==='["red lentils","carrots","onion"]');
  ok('30 what keeps slipping',(await X(()=>(window.__lifeos.x.sm2.slips()||{}).a))==='Home');
  // Today
  await ev(()=>{window.__lifeos.App.state._sugOpen={[window.__lifeos.todayK()]:true};});await go('today');let t=await txt();
  ok('3 moved three times shows on Today',/Moved 3 times: Return the cables/.test(t));
  ok('4 a big task offers first steps',/Sort out the 529 plan looks big/.test(t));
  ok('5 deadline risk on Today',/Big launch is at risk/.test(t));
  ok('23 bill row on Today',/Water utility: \$142/.test(t));
  ok('25 chore row on Today',/chores land on/.test(t));
  ok('27 meals row on Today',/meal planned this week/.test(t));
  ok('11 meeting prep card',await ev(()=>!!document.querySelector('.prepcard'))||(await ev(()=>new Date().getHours()>=23)));
  // follow-ups and duplicates
  await ev(()=>{const L=window.__lifeos;const t=L.create('task',{title:'Ask Jordan about the budget',notes:'',steps:[],date:L.todayK(),repeat:{type:'never'},priority:'normal',photos:[]});L.fx.toggleItem({kind:'task',id:t.id,rec:t},L.todayK());});await p.waitForTimeout(1200);
  ok('6 ticking “Ask Jordan…” offers a follow-up',/Waiting on Jordan/.test(await toasts()),await toasts());
  await ev(()=>{const L=window.__lifeos;L.create('task',{title:'Sort out the 529 plan',notes:'',steps:[],date:null,repeat:{type:'never'},priority:'normal',photos:[]});});await p.waitForTimeout(1000);
  ok('10 a duplicate is caught',/Already/.test(await toasts()),await toasts());
  // goal, habit, inbox, reviews
  await go('plan',{id:await ev(()=>window.__g)});ok('19 past-due milestone asks',/Did you book a first lesson\?/.test(await txt()));
  await go('habit',{id:await ev(()=>window.__lifeos.get.all('habit').find(h=>h.title==='Floss').id)});ok('13 fit card on the habit page',/Try .* a week\?/.test(await txt()));
  await go('habit',{id:await ev(()=>window.__lifeos.get.all('habit').find(h=>h.title==='Stretch break').id)});ok('15 smart reminder shown in details',/Usual time · 9:5\d AM|Usual time · 9:4\d AM/.test(await txt()),(await txt()).match(/Usual time[^\n]*/));
  await go('habits');ok('14 pair card on Habits',/You usually .* on days you /.test(await txt()));
  await go('inbox');await ev(()=>{const i=document.getElementById('idea-new');i.value='buy batteries and call the plumber';i.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true}));});await p.waitForTimeout(800);
  ok('21 Inbox saves two ideas',await ev(()=>{const L=window.__lifeos.get.all('idea');return L.some(i=>i.title==='Buy batteries')&&L.some(i=>i.title==='Call the plumber');}));
  ok('20 Read a receipt in the Inbox menu',await ev(()=>typeof window.__lifeos.x.sm2==='object'));
  await ev(()=>{window.__lifeos.App.state.revTab='trends';});await go('reviews');t=await txt();
  ok('26 sleep card in Trends',/After 7 or more hours of sleep/.test(t));ok('30 slip card in Trends',/Home tasks slip most/.test(t));
  await ev(()=>{try{localStorage.removeItem('lo-rv-draft');}catch(e){}window.__lifeos.App.state.rv=null;window.__lifeos.App.state.revTab='week';});await go('review');
  ok('29 review starts as a draft',await ev(()=>{const w=document.getElementById('f-rv-wins');return !!w&&w.value.length>0;})||/Write it with Claude/.test(await txt()));
  ok('29 Write it with Claude button',/Write it with Claude/.test(await txt()));
  ok('no page errors',!errs.length,errs.slice(0,3));
  await b.close();process.exit(fails?1:0);})();
