// v360 · the smarter round: `bash mk.sh && node test/smart.cjs`. Exits 1 on failure.
const {chromium}=require('playwright');const path=require('path');
const CHROME=process.env.CHROME||'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
(async()=>{const b=await chromium.launch({executablePath:CHROME});
  const p=await (await b.newContext({viewport:{width:390,height:900}})).newPage();
  const errs=[];p.on('pageerror',x=>errs.push(x.message));
  await p.goto('file://'+path.join(__dirname,'page.html'));await p.waitForTimeout(900);
  let fails=0;const ok=(n,c,i)=>{console.log((c?'  ok   ':'  FAIL ')+n+(c?'':'  → '+JSON.stringify(i)));if(!c)fails++;};
  const ev=f=>p.evaluate(f);const go=async(v,o)=>{await p.evaluate(([v,o])=>window.__lifeos.App.go(v,o),[v,o]);await p.waitForTimeout(500);};
  ok('smart hooks exposed',await ev(()=>!!window.__lifeos.sm));
  // seed
  await ev(()=>{const L=window.__lifeos,tk=L.todayK(),add=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.toISOString().slice(0,10).replace(/T.*/,'')};const K=n=>{const d=new Date();d.setDate(d.getDate()+n);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
    const T=(title,f={})=>L.create('task',Object.assign({title,notes:'',steps:[],date:tk,time:null,repeat:{type:'never',end:null},priority:'normal',area:null,photos:[]},f));
    T('Call pharmacy');T('Call insurance');T('Call vet');
    T('Grant report',{date:null,deadline:K(2),dur:360});
    T('Old carried task',{date:K(-2)});
    T('Pay electric bill',{area:'Finances',dur:10,date:null});
    window.__smK=K;});
  // 6 · overnight replan
  await ev(()=>window.__lifeos.t.setSettings({smReplanAt:null}));const moved=await ev(()=>window.__lifeos.sm.replan());
  ok('overnight replan moves carried tasks',moved===true&&await ev(()=>window.__lifeos.get.all('task').find(t=>t.title==='Old carried task').date>=window.__lifeos.todayK()));
  await p.waitForTimeout(1200);ok('replan writes the autopilot log',(await ev(()=>(window.__lifeos.get.settings().autoLog||[]).length))>=1);
  // 10 · fill in from similar
  const filled=await ev(()=>{const f={title:'Pay electric bill again'};const g=window.__lifeos.sm.fill(f);return{g,f};});
  ok('fills area and length from a similar task',filled.f.area==='Finances'&&filled.f.dur===10,filled);
  // 3, 4 · batches and start-by
  ok('three calls batch together',(await ev(()=>window.__lifeos.sm.batches(window.__lifeos.todayK()).map(b=>b.name))).includes('calls'));
  ok('start-by finds the 6 h task due soon',(await ev(()=>window.__lifeos.sm.startBy(window.__lifeos.todayK()).map(x=>x.t.title))).includes('Grant report'));
  // 7 · suggested top 3
  ok('suggested Top 3 has picks',(await ev(()=>window.__lifeos.sm.top3(window.__lifeos.todayK()).length))>=1);
  // 8 · clash
  await ev(()=>{const L=window.__lifeos,tk=L.todayK();L.create('block',{title:'Deep work',notes:'',date:tk,start:23*60-120,dur:90,repeat:{type:'never',end:null},color:null});L.create('block',{title:'Late sync',notes:'',date:tk,start:23*60-90,dur:30,repeat:{type:'never',end:null},color:null});});
  const cl=await ev(()=>{const c=window.__lifeos.sm.clash(window.__lifeos.todayK());return c&&[c.a.title,c.b.title];});ok('clash check finds the overlap',!!cl&&cl.includes('Late sync')&&cl.includes('Deep work'),cl);
  // 9 · free slots
  ok('free slots for an hour this week',(await ev(()=>window.__lifeos.sm.slots(60).length))>=1);
  // 20 · running low
  await ev(()=>{const L=window.__lifeos,d=864e5,n=Date.now();L.create('list',{title:'Groceries',items:[],reusable:false,hist:{'coffee beans':{t:'Coffee beans',n:4,ds:[n-63*d,n-42*d,n-21*d],at:n-21*d}}});});
  ok('running low suggests coffee',(await ev(()=>{const r=window.__lifeos.sm.low();return r&&r.items.map(h=>h.t);})||[]).includes('Coffee beans'));
  // 21 · keep in touch
  await ev(()=>{window.__lifeos.create('entry',{hub:'Relationships',tool:'people',f:{what:'Jordan Test',circle:'Friends',phone:'555',every:14,last:window.__smK(-35),note:''}});});
  ok('keep in touch finds Jordan',(await ev(()=>{const t=window.__lifeos.sm.touch(window.__lifeos.todayK());return t&&t.x.f.what;}))==='Jordan Test');
  // 23 · subscription learner
  await ev(()=>{for(let i=1;i<=3;i++){const d=new Date();d.setMonth(d.getMonth()-i+1);d.setDate(Math.min(d.getDate(),20));window.__lifeos.create('entry',{hub:'Finances',tool:'spending',f:{what:'Streamly',amount:15.99,cat:'Other',date:`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}});}});
  ok('subscription spotter flags Streamly',(await ev(()=>window.__lifeos.sm.learnSubs().map(x=>x.title).join('|'))).includes('Streamly'));
  // 24 · set aside
  await ev(()=>window.__lifeos.t.setSettings({yearlyCosts:[{what:'Car insurance',amount:840,month:2}]}));ok('set-aside totals yearly costs',(await ev(()=>window.__lifeos.sm.yearly().reduce((n,x)=>n+x.amount,0)))>=840);
  // Today shows the rows
  await ev(()=>{const S=window.__lifeos.App.state;S._sugOpen={[window.__lifeos.todayK()]:true};});await go('today');const tt=await ev(()=>document.querySelector('#view').innerText);
  ok('Today shows smart rows',/3 calls/.test(tt)&&/Start Grant report today/.test(tt)&&/overlap/.test(tt),tt.slice(0,600));
  ok('Today shows keep in touch and running low',/Jordan Test/.test(tt)&&/running low/i.test(tt));
  // 2 · low-energy mode orders short tasks first
  await ev(()=>window.__lifeos.t.setSettings({lowE:window.__lifeos.todayK()}));await go('today');ok('low-energy chip shows',/Low energy/.test(await ev(()=>document.querySelector('#view').innerText)));
  await ev(()=>window.__lifeos.t.setSettings({lowE:null}));
  // sheets open without errors
  await ev(()=>window.__lifeos.sm.fit());await p.waitForTimeout(500);ok('Find a free slot sheet opens',/When can I fit it/.test(await ev(()=>document.body.innerText)));await p.keyboard.press('Escape');await p.waitForTimeout(300);
  await ev(()=>window.__lifeos.sm.dump());await p.waitForTimeout(400);ok('Brain dump sheet opens',/Sort it out/.test(await ev(()=>document.body.innerText)));await p.keyboard.press('Escape');await p.waitForTimeout(300);
  await ev(()=>window.__lifeos.sm.talk());await p.waitForTimeout(400);ok('Plan by talking sheet opens',/Draft my week/.test(await ev(()=>document.body.innerText)));await p.keyboard.press('Escape');await p.waitForTimeout(300);
  // settings pages
  await go('setpage',{id:'autolog'});ok('Autopilot log lists moves with Undo',/Old carried task/.test(await ev(()=>document.querySelector('#view').innerText)));
  await go('setpage',{id:'today'});const st=await ev(()=>document.querySelector('#view').innerText);ok('Today settings list the new nudges',/Leave-by times/.test(st)&&/Keep in touch/.test(st)&&/Heads-up when a day is full/.test(st));
  await go('setpage',{id:'smart'});ok('Smart settings have Autopilot',/Overnight replan/.test(await ev(()=>document.querySelector('#view').innerText)));
  await go('setpage',{id:'notify'});ok('Notifications have Fewer pings',/Bunch small reminders/.test(await ev(()=>document.querySelector('#view').innerText)));
  ok('no page errors',!errs.length,errs);
  await b.close();process.exit(fails?1:0);})();
