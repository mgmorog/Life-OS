const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
const fresh=async()=>{await p.goto('file://'+__dirname+'/page.html');await p.waitForTimeout(800);await p.evaluate(()=>window.__lifeos.loadDemo&&window.__lifeos.loadDemo());await p.waitForTimeout(300);};
await fresh();
const ok=(n,v,x)=>console.log((v?'PASS ':'FAIL ')+n+(x!==undefined&&!v?' → '+JSON.stringify(x):''));
ok('status pill tones',await p.evaluate(()=>{const c=window.__lifeos.fx;const n=document.createElement('div');return true;}));
ok('stat row',await p.evaluate(()=>{const r=window.__lifeos.fx.StatRow([[12,'done'],[3,'left'],[5,'trips']]);return r.classList.contains('statrow')&&r.children.length===3;}));
ok('row end',await p.evaluate(()=>{const F=window.__lifeos.fx;return F.RowEnd('chevron').classList.contains('chev')&&F.RowEnd({value:'$51'}).textContent==='$51'&&F.RowEnd({count:4}).classList.contains('n');}));
ok('empty with icon and action',await p.evaluate(()=>{const F=window.__lifeos.fx;const e=F.Empty({icon:'task',title:'No books yet',body:'Add one',action:F.Button('Add a book',{variant:'primary'}),size:'sm'});return !!e.querySelector('.itile')&&!!e.querySelector('.eact .btn');}));
const mk=await p.evaluate(async()=>{window.__lifeos.fx.Menu([{label:'Edit',onclick:()=>{}},{label:'Delete',onclick:()=>{}}],{at:{x:50,y:50}});await new Promise(r=>setTimeout(r,100));const m=document.querySelector('.menu');const b=[...m.querySelectorAll('button')];const f0=document.activeElement===b[0];m.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));const f1=document.activeElement===b[1];m.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));return [f0,f1,!document.querySelector('.menu')];});
ok('menu arrow keys and Escape',mk.every(Boolean),mk);
// import
const im=await p.evaluate(()=>{const F=window.__lifeos.fx;const td='TYPE,CONTENT,DESCRIPTION,PRIORITY,INDENT,AUTHOR,RESPONSIBLE,DATE,DATE_LANG,TIMEZONE\nsection,Errands,,,,,,,,\ntask,Renew passport,Form DS-82,4,1,,,Dec 3,en,\ntask,Call plumber @home,,1,1,,,tomorrow,en,\n';const a=F.importRowsFromCsv(td,'Home stuff.csv');
  const tt='"Date: 2026-11-20"\n"Version: 7.1"\n"Folder Name","List Name","Title","Kind","Tags","Content","Is Check list","Start Date","Due Date","Reminder","Repeat","Priority","Status"\n"","Work","Draft Q1 goals","TEXT","","","N","","2026-12-10T15:00:00+0000","","","5","0"\n"","Work","Old done","TEXT","","","N","","","","","0","2"\n';const b=F.importRowsFromCsv(tt,'ticktick.csv');
  const c=F.importRowsFromText('- Buy milk\n- Call Sam friday\n');return [a.src,a.tasks.length,a.tasks[0].title,a.tasks[0].high,!!a.tasks[0].date,a.tasks[1].title,a.tasks[0].project,b.src,b.tasks.length,b.tasks[0].high,b.tasks[0].date,c.tasks.length,!!c.tasks[1].date];});
ok('Todoist, TickTick and pasted lists parse',im[0]==='Todoist'&&im[1]===2&&im[2]==='Renew passport'&&im[3]&&im[4]&&im[5]==='Call plumber'&&im[6]==='Home stuff'&&im[7]==='TickTick'&&im[8]===1&&im[9]&&im[10]==='2026-12-10'&&im[11]===2&&im[12],im);
await p.evaluate(()=>window.__lifeos.fx.importTasksSheet());await p.waitForTimeout(400);
await p.fill('.sheet textarea','Pick up cake saturday\nBook dentist\nRenew car registration');await p.waitForTimeout(300);
ok('import preview shows count',await p.evaluate(()=>[...document.querySelectorAll('.sheet')].pop().textContent.includes('3 tasks from your list')));
const before=await p.evaluate(()=>window.__lifeos.get.all('task').length);
await p.evaluate(()=>[...[...document.querySelectorAll('.sheet')].pop().querySelectorAll('button')].find(b=>/^Add 3 tasks/.test(b.textContent)).click());await p.waitForTimeout(500);
ok('import adds tasks',await p.evaluate(n=>window.__lifeos.get.all('task').length===n+3,before));
// nudge
const nd=await p.evaluate(()=>{const X=window.__lifeos;const tk=X.todayK();const h=X.create('habit',{title:'Stretch',days:[0,1,2,3,4,5,6],logs:{},target:7,startDate:tk});const s=X.get.settings();s.habitNudge={on:true,time:23*60+55};X.put(s);const a=X.fx.PWA.upcoming().find(x=>x.key==='hnudge|'+tk);X.fx.toggleItem({kind:'habit',rec:h,id:h.id},tk);const b=X.fx.PWA.upcoming().find(x=>x.key==='hnudge|'+tk);return [!!a&&a.body.includes('Stretch'),!b||!b.body.includes('Stretch')];});
ok('evening nudge lists open habits and drops done ones',nd[0]&&nd[1],nd);
await fresh();
// skip holidays
const sk=await p.evaluate(()=>{const X=window.__lifeos,F=X.fx;const s=X.get.settings();s.holidays='US';X.put(s);F.Holidays._c=null;
  const r={type:'custom',unit:'week',n:1,days:[0],end:null,skipHol:true};const t=X.create('task',{title:'Team standup',date:'2026-05-04',time:540,repeat:r,steps:[],notes:''});
  const onMem=F.occursOn('2026-05-04',r,'2026-05-25',null),onNext=F.occursOn('2026-05-04',r,'2026-06-01',null);const hol=X.dayItems('2026-05-25').allDay.find(e=>e.title.startsWith('Memorial Day'));return [onMem,onNext,hol&&hol.title];});
ok('repeat skips the holiday and the holiday says so',sk[0]===false&&sk[1]===true&&/Team standup skipped/.test(sk[2]||''),sk);
// tray
await p.evaluate(()=>{const X=window.__lifeos;X.create('task',{title:'Write award letter',date:X.todayK(),time:null,steps:[],notes:'',repeat:{type:'never'}});X.App.state.cal=null;localStorage.setItem('lifeos-cal-mode','week');localStorage.setItem('lifeos-cal-tl','1');X.App.go('calendar');});await p.waitForTimeout(700);
ok('tray lists unscheduled to-dos',await p.evaluate(()=>[...document.querySelectorAll('.trchip')].some(c=>c.textContent.includes('Write award letter'))));
const tp=await p.evaluate(()=>{const c=[...document.querySelectorAll('.trchip')].find(c=>c.textContent.includes('Write award letter'));const r=c.getBoundingClientRect();const col=document.querySelector('.tlcol');col.scrollIntoView({block:'center'});const cr=col.getBoundingClientRect();c.scrollIntoView({block:'center'});const r2=c.getBoundingClientRect();return {cx:r2.left+r2.width/2,cy:r2.top+r2.height/2};});
await p.mouse.move(tp.cx,tp.cy);await p.mouse.down();await p.waitForTimeout(150);
const target=await p.evaluate(()=>{const col=document.querySelectorAll('.tlcol')[0];const cr=col.getBoundingClientRect();return {x:cr.left+cr.width/2,y:Math.min(cr.bottom-30,innerHeight-200)};});
await p.mouse.move(target.x,target.y,{steps:8});await p.mouse.up();await p.waitForTimeout(500);
ok('dragging a to-do gives it a time',await p.evaluate(()=>{const t=window.__lifeos.get.all('task').find(t=>t.title==='Write award letter');return t.time!=null;}));
// priority grid
await fresh();
await p.evaluate(()=>{const X=window.__lifeos;const tk=X.todayK();X.create('task',{title:'Expense report',date:null,deadline:tk,priority:'high',steps:[],notes:'',repeat:{type:'never'}});X.App.go('tasks',{tab:'priority'});});await p.waitForTimeout(600);
ok('priority grid has four boxes',await p.evaluate(()=>document.querySelectorAll('.pq').length===4&&[...document.querySelectorAll('.pq-now .pqcard')].some(c=>c.textContent.includes('Expense report'))));
await p.screenshot({path:'/tmp/v239_pq.png'});
ok('moving to Later clears urgency',await p.evaluate(()=>{const X=window.__lifeos;const t=X.get.all('task').find(t=>t.title==='Expense report');X.fx.pqMove(t,'later');return X.fx.pqOf(t)==='later'&&t.priority!=='high';}));
// invite
await p.evaluate(()=>{const X=window.__lifeos;const evs=X.fx.parseIcs('BEGIN:VCALENDAR\nBEGIN:VEVENT\nUID:abc\nSUMMARY:Grant kickoff\nLOCATION:Roswell Park\\, Room 2B\nDESCRIPTION:Agenda attached\nDTSTART:20261203T150000Z\nDTEND:20261203T160000Z\nEND:VEVENT\nEND:VCALENDAR');X.fx.inviteSheet(evs[0]);});await p.waitForTimeout(600);
ok('invite opens as a block with place',await p.evaluate(()=>{const s=[...document.querySelectorAll('.sheet')].pop();return s.querySelector('#f-block-title').value==='Grant kickoff'&&s.querySelector('#f-block-place').value.includes('Room 2B');}));
ok('no page errors',errs.length===0,errs.slice(0,3));
await b.close();})();
