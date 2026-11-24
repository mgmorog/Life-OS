// Today layout test: run `bash mk.sh && node test/todaylayout.cjs` from the repo root.
// Exits 1 on any failure. Covers the layout Settings › Today edits (v308+).
const {chromium}=require('playwright');
const path=require('path');
const CHROME=process.env.CHROME||'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
(async()=>{
  const b=await chromium.launch({executablePath:CHROME});
  const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
  const errs=[];p.on('pageerror',x=>errs.push(x.message));
  await p.goto('file://'+path.join(__dirname,'page.html'));await p.waitForTimeout(800);
  await p.evaluate(()=>window.__lifeos.loadDemo());await p.waitForTimeout(1200);
  const W=m=>p.waitForTimeout(m);
  let fails=0;const ok=(name,cond,info)=>{console.log((cond?'  ok   ':'  FAIL ')+name+(cond||info===undefined?'':'  → '+JSON.stringify(info)));if(!cond)fails++;};
  const ev=(fn,arg)=>p.evaluate(fn,arg);
  const ids=()=>ev(()=>window.__lifeos.t.todayLayout().map(x=>x.id));
  const setL=L=>ev(L=>window.__lifeos.t.setTodayLayout(L),L);
  const set=o=>ev(o=>window.__lifeos.t.setSettings(o),o);
  const today=async()=>{await ev(()=>window.__lifeos.App.go('today'));await W(500);};
  const onPage=()=>ev(()=>[...document.querySelectorAll('.page [data-tk]')].map(n=>n.dataset.tk));
  const base=[{id:'tasks'},{id:'habits'},{id:'sched'},{id:'also'}];

  // 1 · defaults
  await set({todayLayout:null,todayPins:[]});
  const d=await ids();ok('1 new layout is tasks, habits, schedule, also',JSON.stringify(d.filter(x=>!x.startsWith('w:')))===JSON.stringify(['tasks','habits','sched','also']),d);

  // 2 · old pins migrate in front of "also"
  await set({todayLayout:null,todayPins:['Health|checkin','Learning|reading']});
  const m=await ids();ok('2 old pins become cards before Also',JSON.stringify(m)===JSON.stringify(['tasks','habits','sched','m:Health|checkin','m:Learning|reading','also']),m);

  // 3 · hide and show keep the place
  await setL(base.map(x=>x.id==='habits'?{...x,hidden:true}:x));await today();
  let pg=await onPage();ok('3a hidden section leaves Today',!pg.includes('habits'),pg);
  await setL(base);await today();pg=await onPage();
  ok('3b shown again in its place',pg.indexOf('habits')>pg.indexOf('tasks')&&(pg.indexOf('sched')<0||pg.indexOf('habits')<pg.indexOf('sched')),pg);

  // 4 · reorder
  await setL([{id:'sched'},{id:'tasks'},{id:'habits'},{id:'also'}]);await today();pg=await onPage();
  ok('4 reorder in Settings changes Today',pg.indexOf('sched')>=0&&pg.indexOf('sched')<pg.indexOf('tasks'),pg);

  // 5 · check-in "until done"
  await setL([...base.slice(0,3),{id:'m:Health|checkin',when:'until'},{id:'also'}]);
  await ev(()=>{const c=window.__lifeos.t.checkOn(window.__lifeos.todayK());if(c){delete c.f.eAt;window.__lifeos.put(c);}});await today();
  ok('5a until-done card shows before logging',(await onPage()).includes('m:Health|checkin'));
  await ev(()=>window.__lifeos.t.todayCheck(q=>{q.f.e='Good';q.f.eAt=Date.now();}));await today();
  ok('5b and leaves once logged',!(await onPage()).includes('m:Health|checkin'));
  const back=await ev(()=>{const t=window.__lifeos.toolOf('Health','checkin');const c=window.__lifeos.t.checkOn(window.__lifeos.todayK());const keep=c.f.eAt;c.f.date='2000-01-01';window.__lifeos.put(c);const r=!!window.__lifeos.t.todayModCard({id:'m:Health|checkin',when:'until'});c.f.date=window.__lifeos.todayK();c.f.eAt=keep;window.__lifeos.put(c);return r;});
  ok('5c a log from another day does not hide it',back);

  // 6 · one-line size
  await setL([...base.slice(0,3),{id:'m:Learning|reading',size:'line'},{id:'m:Health|workouts'},{id:'also'}]);await today();
  const sz=await ev(()=>{const a=document.querySelector('[data-tk="m:Learning|reading"]'),b=document.querySelector('[data-tk="m:Health|workouts"]');return a&&b?{line:a.classList.contains('line'),ha:a.offsetHeight,hb:b.offsetHeight}:null;});
  ok('6 one-line card is one line',sz&&sz.line&&sz.ha<sz.hb,sz);

  // 7 · six-card cap
  await setL(base);
  const cap=await ev(()=>{const L=window.__lifeos,t=L.t,picks=[];for(const h of ['Health','Learning','Finances','Home','Career','Relationships','Recreation']){try{for(const x of L.toolsOf(h)){if(picks.length<7&&!x.hide)picks.push([h,x]);}}catch(e){}}
    picks.forEach(([h,x])=>t.togglePin(h,x));return t.todayLayout().filter(x=>x.id.startsWith('m:')).length;});
  ok('7 a seventh card is refused',cap===6,cap);

  // 8 · module off and on
  await setL([...base.slice(0,3),{id:'m:Learning|reading'},{id:'also'}]);
  await ev(()=>window.__lifeos.t.setToolOn('Learning','reading',false));await today();
  ok('8a turning a module off removes its card',!(await onPage()).includes('m:Learning|reading'));
  await ev(()=>window.__lifeos.t.setToolOn('Learning','reading',true));await today();
  ok('8b turning it on brings it back',(await onPage()).includes('m:Learning|reading'));

  // 9 · backup then restore on a device with no layout
  const L9=[{id:'habits'},{id:'tasks'},{id:'m:Health|workouts',size:'line'},{id:'sched',hidden:true},{id:'also'}];await setL(L9);
  const snap=await ev(()=>JSON.stringify({app:'life-os',version:2,records:[window.__lifeos.get.settings()]}));
  await set({todayLayout:null,todayPins:[]});
  await ev(async s=>{await window.__lifeos.t.importData({text:async()=>s});},snap);await W(300);
  const r9=await ids();ok('9 restore brings the layout back',JSON.stringify(r9)===JSON.stringify(L9.map(x=>x.id)),r9);

  // extra cases added by later releases
  try{require('./todaylayout-more.cjs');}catch(e){if(e.code!=='MODULE_NOT_FOUND')throw e;}
  for(const f of (global.__todayMore||[]))await f({p,ev,ok,ids,setL,set,today,onPage,base,W});

  ok('no page errors',!errs.length,errs);
  await b.close();console.log(fails?`${fails} failed`:'all passed');process.exit(fails?1:0);
})();
