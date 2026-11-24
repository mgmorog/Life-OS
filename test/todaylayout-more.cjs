// Cases added by later releases; loaded by test/todaylayout.cjs.
global.__todayMore=global.__todayMore||[];

// v309 · a real card for every module template
global.__todayMore.push(async({ev,ok,setL,today,base,W})=>{
  const pick=await ev(()=>{const L=window.__lifeos,out={};for(const h of ['Health','Home','Finances','Career','Family','Learning','Relationships','Recreation','Community','Life admin','Pets','Travel','Personal growth']){let ts=[];try{ts=L.toolsOf(h);}catch(e){}ts.forEach(t=>{if(t.tpl&&!out[t.tpl]&&!t.hide&&!(h==='Health'&&t.id==='checkin'))out[t.tpl]=[h,t.id];});}return out;});
  ok('v309 every template has a module to try',['log','checklist','countdown','collection'].every(k=>pick[k]),pick);
  const L=[...base.slice(0,3),...Object.values(pick).map(([h,id])=>({id:`m:${h}|${id}`})),{id:'also'}];
  await ev(()=>{});await setL(L);
  await ev(p=>{const T=window.__lifeos.t;Object.values(p).forEach(([h,id])=>T.setToolOn(h,id,true));},pick);await today();
  const seen=await ev(p=>Object.fromEntries(Object.entries(p).map(([k,[h,id]])=>{const c=document.querySelector(`[data-tk="m:${h}|${id}"]`);return[k,c?c.querySelector('.tmct small')?.textContent||'(no line)':null];})),pick);
  ok('v309 a card for each template',Object.values(seen).every(Boolean),seen);

  // checklist: make one item due, tick it from the card
  const [ch,cid]=pick.checklist;
  const made=await ev(([h,id])=>{const L=window.__lifeos;const r=L.create('entry',{hub:h,tool:id,f:{what:'Test filter',every:30,last:'2020-01-01',note:''}});return r.id;},[ch,cid]);
  await today();
  const ticked=await ev(([h,id,rid])=>{const c=document.querySelector(`[data-tk="m:${h}|${id}"]`);const row=[...c.querySelectorAll('.tmcli')].find(n=>n.textContent.includes('Test filter'));if(!row)return'no row';row.querySelector('.tick-hit button,.tick-hit [role=checkbox],.tick-hit *').click();return window.__lifeos.get.id(rid).f.last===window.__lifeos.todayK();},[ch,cid,made]);
  ok('v309 tick on a checklist card marks it done',ticked===true,ticked);
  await ev(id=>window.__lifeos.remove(id,{hard:true,silent:true}),made);

  // log: Log again adds one entry for today
  const [lh,lid]=pick.log;
  const r=await ev(([h,id])=>{const L=window.__lifeos,n0=L.t.entries(h,id).length;const t=L.toolOf(h,id);if(t.money)return{skip:true};L.create('entry',{hub:h,tool:id,f:{what:'Test log',n:'',note:'',date:'2020-01-02'}});return{n0:n0+1};},[lh,lid]);
  if(!r.skip){await today();
    const n1=await ev(([h,id])=>{const c=document.querySelector(`[data-tk="m:${h}|${id}"]`);const b=[...c.querySelectorAll('button')].find(x=>x.textContent==='Log again');if(!b)return -1;b.click();return window.__lifeos.t.entries(h,id).length;},[lh,lid]);
    ok('v309 Log again adds one entry',n1===r.n0+1,{n1,want:r.n0+1});
    await W(200);
    const undone=await ev(([h,id])=>{const u=[...document.querySelectorAll('.toast button,[class*=toast] button')].find(b=>/undo/i.test(b.textContent));if(!u)return'no undo';u.click();return window.__lifeos.t.entries(h,id).length;},[lh,lid]);
    ok('v309 and Undo takes it back',undone===r.n0,undone);
    await ev(([h,id])=>{window.__lifeos.t.entries(h,id).filter(x=>x.f.what==='Test log').forEach(x=>window.__lifeos.remove(x.id,{hard:true,silent:true}));},[lh,lid]);}
});

// v310 · log in plain words (capture)
global.__todayMore.push(async({ev,ok,today,W,p})=>{
  const table=[
    ['spent 42 at Wegmans','Finances|spending'],['paid 18 for lunch','Finances|spending'],['slept 7 hours','Health|checkin'],['ran 3 miles','Health|workouts'],
    ['did yoga','Health|workouts'],['read 20 pages','Learning|reading'],['weighed 172 lb','Health|measure'],['walked Biscuit 20 min','Pets|walks'],
    ['volunteered 3 hours at food bank','Community|volunteer'],['donated 50 to Red Cross','Community|giving'],['meditated 20 min','Health|mindful'],['20 minutes meditation','Health|mindful'],
    ['meditated','Health|mindful'],['journal: long day','Personal growth|journal'],['journaled','Personal growth|journal'],['prayed 15','Community|faith'],
    ['practiced 30 min spanish','Learning|lang'],['allowance 10 Maya','Family|allowance'],['side business 120 logo job','Career|sidebiz'],['symptom: headache','Health|symptoms'],
    ['pay 42 rent',null],['buy milk',null],['call mom tomorrow',null],['dinner with Sam friday',null],['journal entry tomorrow',null],
    ['meeting at 3',null],['gym 3 times a week',null],['read Dune',null],['taxes due April 15',null],['spent',null]];
  const got=await ev(tb=>tb.map(([x])=>{const q=window.__lifeos.t.quickLog(x);if(!q)return null;if(q.hub)return`${q.hub}|${q.tool}`;
    const L=q.label;return /^Log \$|on /.test(L)&&/^Log \$/.test(L)?'Finances|spending':/sleep/.test(L)?'Health|checkin':/workout/.test(L)?'Health|workouts':/pages/.test(L)?'Learning|reading':/weight/.test(L)?'Health|measure':/walk with/.test(L)?'Pets|walks':/volunteer/.test(L)?'Community|volunteer':/gift/.test(L)?'Community|giving':L;}),table);
  const bad=table.map(([x,want],i)=>[x,want,got[i]]).filter(([,w,g])=>(w||null)!==(g||null));
  ok(`v310 ${table.length} phrases go where expected`,!bad.length,bad);
  const cat=await ev(()=>{const L=window.__lifeos,r=L.create('entry',{hub:'Finances',tool:'spending',f:{what:'Corner Shop',amount:9,cat:'Household',date:L.todayK()}});const c=L.t.learnCat('corner shop');L.remove(r.id,{hard:true,silent:true});return c;});
  ok('v310 category learned from your history',cat==='Household',cat);
  const off=await ev(()=>{const T=window.__lifeos.t;T.setToolOn('Health','mindful',false);const q=T.quickLog('meditated 20 min');T.setToolOn('Health','mindful',true);return q;});
  ok('v310 turned-off modules are never matched',!off,off);
  // Return logs a sure phrase instead of saving to Inbox
  const before=await ev(()=>({n:window.__lifeos.t.entries('Pets','walks').length,i:window.__lifeos.get.all('idea').length}));
  await ev(()=>window.__lifeos.App.go('today'));await W(300);
  await p.click('.fab, button[aria-label="Quick capture"], button[aria-label="Capture"]').catch(()=>{});await W(500);
  const has=await p.locator('#f-cap-title').count();
  if(has){await p.fill('#f-cap-title','walked Biscuit 20 min');await W(200);await p.press('#f-cap-title','Enter');await W(400);
    const after=await ev(()=>({n:window.__lifeos.t.entries('Pets','walks').length,i:window.__lifeos.get.all('idea').length}));
    ok('v310 Return logs a sure phrase, not to Inbox',after.n===before.n+1&&after.i===before.i,{before,after});
    await p.keyboard.press('Escape');await W(300);}
  else ok('v310 capture sheet opens',false,'no capture field');
});

// v311 · Today by time of day
global.__todayMore.push(async({ev,ok,ids,setL,set,today,onPage,base,W})=>{
  await set({todayLayout:null,todayPins:[],work:{start:540,end:1020}});
  const w=await ev(()=>{const f=window.__lifeos.t.tdWindow;return[f(480),f(700),f(1019),f(1020),f(1300)];});
  ok('v311 windows: morning, day, evening',JSON.stringify(w)===JSON.stringify(['morning','day','day','evening','evening']),w);
  const plain=await ev(()=>Array.isArray(window.__lifeos.get.settings().todayLayout)||window.__lifeos.get.settings().todayLayout==null);
  await setL(base);
  ok('v311 off by default, stored as a plain list',plain&&await ev(()=>Array.isArray(window.__lifeos.get.settings().todayLayout)));
  await ev(()=>{const T=window.__lifeos.t;T.setTdByTime(true);T.setTodayLayout([{id:'habits'},{id:'tasks'},{id:'sched'},{id:'also'}],'morning');T.setTodayLayout([{id:'sched'},{id:'tasks'},{id:'habits'},{id:'also'}],'evening');});
  const orderAt=async win=>{await ev(w=>{const A=window.__lifeos.App;A.go('today');A.state._tdWin=w;A.refresh();},win);await W(400);const pg=await onPage();return pg.filter(x=>['tasks','habits','sched'].includes(x))[0];};
  const m=await orderAt('morning'),d=await orderAt('day'),e=await orderAt('evening');
  ok('v311 each time of day has its own order',m==='habits'&&d==='tasks'&&e==='sched',{m,d,e});
  // frozen while on screen: refresh keeps the window it drew
  await ev(()=>{const A=window.__lifeos.App;A.go('today');A.state._tdWin='morning';A.refresh();});await W(300);
  await ev(()=>{window.__lifeos.App.refresh();});await W(300);
  ok('v311 the order never changes while Today is on screen',(await onPage()).filter(x=>['tasks','habits','sched'].includes(x))[0]==='habits');
  // adding a card from a module page lands in every window
  await ev(()=>{const L=window.__lifeos;L.t.togglePin('Learning',L.toolOf('Learning','reading'));});
  const every=await ev(()=>['fixed','morning','day','evening'].map(w=>window.__lifeos.t.todayLayout(w).some(x=>x.id==='m:Learning|reading')));
  ok('v311 a card added from a module goes into every window',every.every(Boolean),every);
  // restore keeps a v2 layout
  const snap=await ev(()=>JSON.stringify({app:'life-os',version:2,records:[window.__lifeos.get.settings()]}));
  await set({todayLayout:null,todayPins:[]});
  await ev(async s=>{await window.__lifeos.t.importData({text:async()=>s});},snap);await W(300);
  const r=await ev(()=>{const t=window.__lifeos.t;return{by:window.__lifeos.get.settings().todayLayout.mode,ev:t.todayLayout('evening')[0].id};});
  ok('v311 restore keeps the time-of-day layout',r.by==='byTime'&&r.ev==='sched',r);
  // turning it off goes back to one order, which old versions can read
  await ev(()=>window.__lifeos.t.setTdByTime(false));
  const off=await ev(()=>({mode:window.__lifeos.get.settings().todayLayout.mode,pins:window.__lifeos.get.settings().todayPins}));
  ok('v311 turning it off returns to one order; pins kept for older versions',off.mode==='fixed'&&off.pins.includes('Learning|reading'),off);
  await set({todayLayout:null,todayPins:[]});
});

// v313 · starter set
global.__todayMore.push(async({ev,ok,set,setL,base,W,p})=>{
  await set({todayLayout:null,todayPins:[]});await setL(base);
  await ev(()=>window.__lifeos.t.setToolOn('Health','sleep',false));
  const r1=await ev(()=>window.__lifeos.t.applyStarters(['sleep','reading','bills']));
  const st=await ev(()=>{const t=window.__lifeos.t,L=t.todayLayout().map(x=>x.id);return{sleep:t.toolOn('Health','sleep'),bills:t.toolOn('Finances','bills'),L};});
  ok('v313 picks turn on modules and add daily cards only',st.sleep&&st.bills&&st.L.includes('m:Health|sleep')&&st.L.includes('m:Learning|reading')&&!st.L.includes('m:Finances|bills'),{r1,st});
  ok('v313 cards go before Also, built-ins keep their order',JSON.stringify(st.L)===JSON.stringify(['tasks','habits','sched','m:Health|sleep','m:Learning|reading','also']),st.L);
  const r2=await ev(()=>window.__lifeos.t.applyStarters(['sleep','reading','bills']));const L2=await ev(()=>window.__lifeos.t.todayLayout().map(x=>x.id));
  ok('v313 running it again adds nothing twice',JSON.stringify(L2)===JSON.stringify(st.L)&&r2.mods===0,{r2,L2});
  await setL([{id:'sched'},{id:'tasks'},{id:'m:Health|workouts'},{id:'habits'},{id:'also'}]);
  await ev(()=>window.__lifeos.t.applyStarters(['energy','workouts','sleep','reading','journal','walks']));const L3=await ev(()=>window.__lifeos.t.todayLayout().map(x=>x.id));
  ok('v313 from Settings it only adds: your order stays, at most four new cards',L3.slice(0,4).join()==='sched,tasks,m:Health|workouts,habits'&&L3.filter(x=>x.startsWith('m:')).length<=5,L3);
  await set({todayLayout:null,todayPins:[]});
});

// v313 · week in numbers (weekly review)
global.__todayMore.push(async({ev,ok,W})=>{
  const r=await ev(()=>{const L=window.__lifeos,t=L.t,d=L.todayK();const add=(n,dd)=>{const x=new Date(d+'T12:00');x.setDate(x.getDate()+n);return x.toISOString().slice(0,10);};
    const a='2031-03-03',b='2031-03-09';const mk=[];['2031-03-04','2031-03-05','2031-03-06'].forEach(dd=>mk.push(L.create('entry',{hub:'Health',tool:'workouts',f:{what:'Run',min:30,feel:'Steady',date:dd}})));
    mk.push(L.create('entry',{hub:'Health',tool:'workouts',f:{what:'Run',min:20,feel:'Steady',date:'2031-02-25'}}));
    const fr=t.weekNumbers(a,b,'week'),div=document.createElement('div');if(fr)div.append(fr);const txt=div.textContent;mk.forEach(x=>L.remove(x.id,{hard:true,silent:true}));
    const empty=t.weekNumbers('2040-01-01','2040-01-07','week');return{txt,empty:!!empty};});
  ok('v313 a line per module you used, against last week',/Workouts/.test(r.txt)&&/3 workouts/.test(r.txt)&&/2 workouts more than last week/.test(r.txt),r.txt);
  ok('v313 worth noticing when a change is big enough',/Worth noticing · Workouts went up/.test(r.txt),r.txt);
  ok('v313 a week with nothing logged shows no section',!r.empty);
});

// v314 · one area page for every area
global.__todayMore.push(async({ev,ok,W,p})=>{
  const names=await ev(()=>[...new Set([...(window.__lifeos.get.settings().areas||[]),'Health','Travel','Pets'])]);const bad=[];
  for(const n of names){await ev(n=>window.__lifeos.App.go('area',{name:n}),n);await W(250);
    const o=await ev(()=>{const pg=document.querySelector('.page');if(!pg)return null;const labs=[...pg.querySelectorAll('.lbl,.lblrow,.sh2')].map(x=>x.textContent.trim());const mi=labs.findIndex(t=>/^Modules/.test(t)),gi=labs.findIndex(t=>/^(Goals|Projects|Habits|Tasks)\b/.test(t));return{head:!!pg.querySelector('h1,.ph-title,.pagehead'),mi,gi};});
    if(!o||(o.gi>=0&&o.mi>=0&&o.gi>o.mi))bad.push([n,o]);}
  ok('v314 every area page: linked items, then modules',!bad.length,bad);
});

// v315 · the day ring: beside the date when something's due, gone when nothing is or it's turned off
global.__todayMore.push(async({p,ev,ok,set,today,W})=>{
  await set({rwOn:true,rwRing:true});await today();
  const st=await ev(()=>window.__lifeos.t.rw.day(window.__lifeos.todayK()));
  const has=await ev(()=>!!document.querySelector('.hd .icons .dring'));
  ok('v315 ring shows when something is due today',st.total>0?has:!has,{st,has});
  if(has){await p.click('.hd .icons .dring');await W(500);const sh=await ev(()=>[...document.querySelectorAll('.sheet,[role=dialog]')].some(n=>/Today so far/.test(n.textContent)));ok('v315 tapping the ring opens Today so far',sh);await p.keyboard.press('Escape');await W(400);
    await ev(()=>{document.querySelectorAll('.sheet .sheet-left,.sheet button').forEach(b=>{if(/^Close$/.test(b.textContent.trim()))b.click();});});await W(400);}
  await set({rwRing:false});await today();ok('v315 ring hides when turned off',!(await ev(()=>!!document.querySelector('.dring'))));
  await set({rwRing:true});await today();
  ok('v315 the ring never shows on another day',await ev(async()=>{const L=window.__lifeos;L.App.state.sel=L.todayK().slice(0,8)+'01'===L.todayK()?'2020-01-02':L.todayK().slice(0,8)+'01';L.App.go('today');await new Promise(r=>setTimeout(r,400));const none=!document.querySelector('.dring');L.App.state.sel=L.todayK();L.App.go('today');return none;}));
});
