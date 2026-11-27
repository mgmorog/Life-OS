// v315 · Rewards engine and screens. Run `bash mk.sh && node test/rewards.cjs` from the repo root. Exits 1 on any failure.
const {chromium}=require('playwright');
const path=require('path');
const CHROME=process.env.CHROME||'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
const SHOTS=process.env.SHOTS||'';
(async()=>{
  const b=await chromium.launch({executablePath:CHROME});
  const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2})).newPage();
  const errs=[];p.on('pageerror',x=>errs.push(x.message));
  await p.goto('file://'+path.join(__dirname,'page.html'));await p.waitForTimeout(800);
  await p.evaluate(()=>window.__lifeos.loadDemo());await p.waitForTimeout(1500);
  const W=m=>p.waitForTimeout(m);let fails=0;
  const ok=(name,cond,info)=>{console.log((cond?'  ok   ':'  FAIL ')+name+(cond||info===undefined?'':'  → '+JSON.stringify(info)));if(!cond)fails++;};
  const ev=(fn,arg)=>p.evaluate(fn,arg);
  const go=async(v,params)=>{await ev(([v,params])=>window.__lifeos.App.go(v,params||{}),[v,params]);await W(600);};
  const shot=async n=>{if(SHOTS)await p.screenshot({path:path.join(SHOTS,n+'.png')});};
  // helpers inside the page
  await ev(()=>{window.K=n=>{const d=new Date();d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};window.RW=window.__lifeos.t.rw;window.L=window.__lifeos;});

  // 1 · first run is silent: everything already earned is marked, nothing toasts
  await ev(()=>{RW.check();});await W(900);
  const r1=await ev(()=>{const r=RW.rec();return{init:r.init,badges:Object.keys(r.badges).length,seen:Object.keys(r.seen).length,toast:document.getElementById('toast').classList.contains('on')?document.getElementById('toast').textContent:''};});
  ok('1 first check sets up the rewards record',r1.init,r1);
  ok('1 badges earned on the first run are already seen',r1.badges===r1.seen,r1);
  ok('1 the first run shows no reward message',!/Badge|record|Level/.test(r1.toast),r1);

  // 2 · a level-up shows once a day
  const lv=await ev(()=>{const r=RW.rec();r.slot=null;L.put(r,{silent:true});const P=RW.points(),lv0=RW.level(P.Health||0),n=lv0.need-lv0.into+1;for(let i=0;i<n;i++)L.create('task',{title:'Lv test '+i,area:'Health',date:K(0),doneDates:{[K(0)]:Date.now()},repeat:{type:'never'},steps:[]});return{lv0:lv0.level,n};});
  await ev(()=>RW.check());await W(900);
  const t2=await ev(()=>({t:document.getElementById('toast').textContent,lv:RW.rec().levels.Health,slot:RW.rec().slot===K(0)}));
  ok('2 a life area levels up after enough progress',t2.lv===lv.lv0+1,{lv,t2});
  ok('2 the level-up is the day’s reward message',/Health reached Level/.test(t2.t)&&t2.slot,t2);
  await ev(()=>{const r=RW.rec();delete r.badges.tasks100;delete r.seen.tasks100;L.put(r,{silent:true});const P=RW.points(),l=RW.level(P.Health||0);for(let i=0;i<l.need+1;i++)L.create('task',{title:'Lv more '+i,area:'Health',date:K(0),doneDates:{[K(0)]:Date.now()},repeat:{type:'never'},steps:[]});document.getElementById('toast').classList.remove('on');document.getElementById('toast').textContent='';});
  await ev(()=>RW.check());await W(900);
  const t3=await ev(()=>({t:document.getElementById('toast').textContent,lv:RW.rec().levels.Health,unseen:RW.rec().badges.tasks100&&!RW.rec().seen.tasks100}));
  ok('2 a second reward the same day waits quietly',t3.t==='',t3);
  ok('2 it is still recorded (level and an unseen badge)',t3.lv===lv.lv0+2&&!!t3.unseen,t3);

  // 3 · daily habit: a missed day a freeze can cover
  const f=await ev(()=>{const logs={};for(let i=2;i<=7;i++)logs[K(-i)]=true;const h=L.create('habit',{title:'Read test',days:[0,1,2,3,4,5,6],logs,startDate:K(-10),track:'check'});const r=RW.rec();r.frz.n=1;r.frz.asked={};L.put(r,{silent:true});
    const before=RW.habitStreak(h).n;let o=null;for(let i=0;i<30;i++){o=RW.offer();if(!o||o.h.id===h.id)break;const q=RW.rec();q.frz.asked[o.h.id+'|'+o.day]=1;L.put(q,{silent:true});}return{id:h.id,before,offer:o&&{id:o.h.id,n:o.n,day:o.day,unit:o.unit}};});
  ok('3 a miss yesterday breaks the run before a freeze',f.before===0,f);
  await go('today');ok('3 the offer waits on Today as a card, not a pop-up',await ev(()=>!!document.querySelector('.page .rwfz')&&!document.querySelector('.scrim.on')));await shot('freeze');
  ok('3 the freeze offer is for that habit and day',f.offer&&f.offer.id===f.id&&f.offer.day===await ev(()=>K(-1))&&f.offer.n===6,f);
  const f2=await ev(id=>{const o=RW.offer();RW.use(o);const h=L.get.id(id);return{n:RW.habitStreak(h).n,left:RW.rec().frz.n,used:RW.rec().frz.used,mark:(h.skips||{})[K(-1)],again:!!RW.offer()};},f.id);
  ok('3 using it keeps the streak (6 days) and spends the freeze',f2.n===6&&f2.left===0&&f2.used>=1&&f2.mark==='freeze',f2);
  ok('3 no second offer without freezes left',!f2.again,f2);
  await go('habit',{id:f.id});ok('3 the frozen day shows on the habit page',await ev(()=>!!document.querySelector('.calgrid button.skip.frz')));

  // 4 · weekly habit: a frozen week keeps the run, and Best is the real best
  const w=await ev(()=>{const ws=L.__ws||null;const s=new Date();const wsd=L.get.settings().weekStart??1;const diff=(s.getDay()-wsd+7)%7;s.setDate(s.getDate()-diff);const wk=n=>{const d=new Date(s);d.setDate(d.getDate()-7*n);return d;};const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    const logs={};const put2=n=>{const d=wk(n);for(let j=0;j<2;j++){const x=new Date(d);x.setDate(x.getDate()+j);logs[key(x)]=true;}};[7,6,5,4,2].forEach(put2);
    const h=L.create('habit',{title:'Gym test',target:2,logs,startDate:key(wk(8)),track:'check'});const before=RW.habitStreak(h).n,best=RW.habitBest(h);
    h.wkFrz={[key(wk(1))]:true};L.put(h,{silent:true});const after=RW.habitStreak(h).n;return{before,best,after};});
  ok('4 weekly: a missed week breaks the run',w.before===0,w);
  ok('4 weekly: Best is the longest run, not the current one',w.best===4,w);
  ok('4 weekly: a frozen week carries the run without adding to it',w.after===1,w);

  // 5 · Done page
  await go('done');await shot('done');
  const d5=await ev(()=>({h:document.querySelector('h1')&&document.querySelector('h1').textContent,rows:document.querySelectorAll('.page .list .row,.page .list [class*=row]').length,sub:document.querySelector('.page header')&&document.querySelector('.page header').textContent}));
  ok('5 Done lists what you finished this week',d5.rows>0&&/Done/.test(d5.h||''),d5);

  // 6 · Reviews: badges and personal bests
  await go('reviews');await shot('reviews');
  const r6=await ev(()=>({bd:document.querySelectorAll('.rwbd').length,on:document.querySelectorAll('.rwbd.on').length,bests:[...document.querySelectorAll('.lbl,.sectlabel,h2,h3')].some(n=>/Personal bests/.test(n.textContent))}));
  ok('6 Reviews shows every badge, earned ones in color',r6.bd===22&&r6.on>=1,r6);
  ok('6 Reviews shows personal bests',r6.bests,r6);
  await ev(()=>document.querySelector('.rwbd.on').click());await W(600);ok('6 a badge opens its story',await ev(()=>!!document.querySelector('.rwbdbig')));await shot('badge');
  await ev(()=>{const x=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Close');x&&x.click();});await W(400);

  // 7 · area level card
  await go('area',{name:'Health'});await shot('area');
  ok('7 the area page shows its level',await ev(()=>/Level \d+/.test((document.querySelector('.rwlvl')||{}).textContent||'')));

  // 8 · project fill and the 100% card
  const pid=await ev(()=>{const pr=L.create('project',{title:'Kitchen refresh test',area:'Home',steps:[]});['Tiles','Quotes'].forEach(t=>L.create('task',{title:t,part:pr.id,date:K(0),doneDates:{[K(0)]:Date.now()},repeat:{type:'never'},steps:[]}));return pr.id;});
  await go('plan',{id:pid});await shot('project');
  await W(1000);const p8=await ev(()=>{const w=document.querySelector('.rwwash'),h=document.querySelector('.pchead');return{w:w&&Math.round(w.getBoundingClientRect().height),h:h&&Math.round(h.getBoundingClientRect().height),done:!!document.querySelector('.rwpdone')};});
  ok('8 a finished project fills its header and offers Mark it done',p8.w>=p8.h&&p8.h>0&&p8.done,p8);

  // 9 · the idea garden
  const g9=await ev(async()=>{const i=L.create('idea',{title:'Plant me',notes:'',photos:[]});await new Promise(r=>setTimeout(r,50));L.create('project',{title:'From an idea',area:'Learning',steps:[]});L.remove(i.id);await new Promise(r=>setTimeout(r,900));return RW.rec().planted.slice(-1)[0];});
  ok('9 an idea turned into a project plants a tree',g9&&g9.t==='tree',g9);
  await ev(()=>{L.get.all('idea').forEach(i=>L.remove(i.id,{silent:true}));});await go('inbox');await shot('inbox');
  ok('9 the empty Inbox shows the garden',await ev(()=>!!document.querySelector('.rwgarden svg')));

  // 10 · Sunday score in the weekly review
  await go('review');await shot('review');
  const s10=await ev(()=>({card:!!document.querySelector('.rwscore'),pc:(document.querySelector('.rwsn .serif')||{}).textContent}));
  ok('10 the weekly review opens with your score',s10.card&&/%$/.test(s10.pc||''),s10);

  // 11 · Plan tomorrow forecast
  await ev(()=>{L.t.setSettings({planEve:true,planAt:0,planDone:{}});});await go('today');await shot('today');
  ok('11 the Plan tomorrow card carries a forecast',await ev(()=>/(Light|Steady|Full) day/.test((document.querySelector('.rwfc')||{}).textContent||'')));

  // 12 · Settings › Rewards
  await go('setpage',{id:'rewards'});await shot('settings');
  const s12=await ev(()=>document.querySelectorAll('.page [role=switch],.page .switch,.page input[type=checkbox]').length);
  ok('12 Settings › Rewards lists the master switch and each feature (day ring and forecast live in Settings › Today)',s12>=8,s12);
  await ev(()=>L.t.setSettings({rwOn:false}));await go('today');
  ok('12 the master switch hides the ring',!(await ev(()=>!!document.querySelector('.dring'))));
  await ev(()=>L.t.setSettings({rwOn:true}));

  // 13 · earned palette
  await ev(()=>{const r=RW.rec();r.badges.planner=K(0);L.put(r,{silent:true});L.t.setSettings({palette:'moss'});});await go('setpage',{id:'display'});await shot('display');
  const c13=await ev(()=>({acc:getComputedStyle(document.documentElement).getPropertyValue('--accent').trim(),locked:document.querySelectorAll('.palsw.lockd').length}));
  ok('13 an earned palette repaints the app',c13.acc&&!/^#?466B5A$/i.test(c13.acc.replace('#','')),c13);
  ok('13 the other earned palettes stay locked',c13.locked===3,c13);
  await ev(()=>L.t.setSettings({palette:'sage'}));

  // 14 · Studio lock
  await ev(()=>{const s=new Date();const wsd=L.get.settings().weekStart??1;const diff=(s.getDay()-wsd+7)%7;s.setDate(s.getDate()-diff);const key=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;const n=new Date(s);n.setDate(n.getDate()+7);[s,n].forEach(d=>L.put({id:'plan-w-'+key(d),kind:'plan',key:'w-'+key(d),committed:true,committedAt:Date.now()},{silent:true}));});
  await go('studio');await shot('studio');ok('14 a committed week shows Locked in',await ev(()=>!!document.querySelector('.rwlockp')));

  // 15 · a new badge after the first run gets the message
  await ev(()=>{const r=RW.rec();r.slot=null;delete r.badges.review1;delete r.seen.review1;L.put(r,{silent:true});L.create('review',{period:'week',week:K(-7),title:'t',stats:{done:8,planned:10}});document.getElementById('toast').textContent='';});
  await ev(()=>RW.check());await W(900);
  ok('15 a new badge is announced',await ev(()=>/Badge earned/.test(document.getElementById('toast').textContent)));

  // 16 · year story
  await ev(()=>RW.story(new Date().getFullYear()));await W(800);await shot('story');
  ok('16 Play your year opens the story',await ev(()=>!!document.querySelector('.story')));
  await p.keyboard.press('Escape');await W(500);

  // 17 · habit card streak text
  await go('today');
  ok('17 habit rings show the streak',await ev(()=>[...document.querySelectorAll('.fhab .hstk')].some(n=>/^\d+ (days|wks)$/.test(n.textContent))));

  // 18 · a record is news once: beating an older run's best toasts; a run that keeps growing doesn't
  const r18=await ev(async()=>{L.put({id:'t-old-seed',kind:'task',title:'seed',createdAt:Date.now()-40*864e5,date:K(-40),repeat:{type:'never'},steps:[]},{silent:true});
    const logs={};for(let i=0;i<=5;i++)logs[K(-i)]=true;for(let i=12;i<=15;i++)logs[K(-i)]=true;const h=L.create('habit',{title:'Floss',days:[0,1,2,3,4,5,6],logs,startDate:K(-20),track:'check'});
    const toastT=()=>document.getElementById('toast').textContent;const reset=()=>{const r=RW.rec();r.slot=null;L.put(r,{silent:true});document.getElementById('toast').textContent='';};
    let r=RW.rec();r.bests['streak:'+h.id]={v:4,d:K(-12)};reset();RW.check();await new Promise(z=>setTimeout(z,900));const a=toastT();
    r=RW.rec();r.bests['streak:'+h.id]={v:5,d:K(-1)};reset();RW.check();await new Promise(z=>setTimeout(z,900));const b=toastT();
    return{a,b};});
  ok('18 passing an earlier run’s best is announced',/New record: 6-day Floss streak/.test(r18.a),r18);
  ok('18 a run that keeps growing is not announced again',!/Floss/.test(r18.b),r18);

  ok('no page errors',!errs.length,errs);
  await b.close();console.log(fails?`${fails} failed`:'all passed');process.exit(fails?1:0);
})();
