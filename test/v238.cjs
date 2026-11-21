const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+__dirname+'/page.html');await p.waitForTimeout(800);
await p.evaluate(()=>window.__lifeos.loadDemo&&window.__lifeos.loadDemo());await p.waitForTimeout(400);
const ok=(n,v,x)=>console.log((v?'PASS ':'FAIL ')+n+(x!==undefined&&!v?' → '+JSON.stringify(x):''));
ok('section label with count and action',await p.evaluate(()=>{const F=window.__lifeos.fx,s=F.SectionLabel('Overdue',{count:2,action:F.Button('Replan',{variant:'link',size:'sm'})});return s.querySelector('.scount').textContent==='2'&&!!s.querySelector('.linkbtn');}));
ok('check says done / not done',await p.evaluate(()=>{const F=window.__lifeos.fx;return F.Check({on:true}).getAttribute('aria-label')==='Done'&&F.Check({on:false}).getAttribute('aria-label')==='Not done';}));
const sf=await p.evaluate(()=>{let v='x';const s=window.__lifeos.fx.SearchField({onInput:x=>v=x});document.body.append(s);const i=s.input;i.value='abc';i.dispatchEvent(new Event('input'));const shown=!s.querySelector('.sfclear').hidden;i.dispatchEvent(new KeyboardEvent('keydown',{key:'Escape',bubbles:true}));const r=[shown,v,i.value];s.remove();return r;});
ok('search field clears with × and Escape',sf[0]&&sf[1]===''&&sf[2]==='',sf);
ok('filter row remembers',await p.evaluate(()=>{const F=window.__lifeos.fx;let got=null;const r=F.FilterRow([['a','A',3],['b','B']],'a',v=>got=v,{key:'t1'});r.querySelectorAll('button')[1].click();return got==='b'&&F.FilterRow.saved('t1','a')==='b'&&r.querySelector('.hcnt').textContent==='3';}));
ok('caption joins parts with dots',await p.evaluate(()=>window.__lifeos.fx.Caption(['27 days late','Home'],{tone:'late'}).textContent==='27 days late · Home'));
const fb=await p.evaluate(async()=>{const F=window.__lifeos.fx;const a=F.FloatingBar({content:'One'}),c=F.FloatingBar({content:'Two'});await new Promise(r=>setTimeout(r,100));const ra=a.getBoundingClientRect(),rc=c.getBoundingClientRect();const r=[a.parentElement===c.parentElement,ra.bottom<=rc.top+1];a.remove();c.remove();return r;});
ok('floating bars stack',fb[0]&&fb[1],fb);
// holidays
await p.evaluate(()=>{const X=window.__lifeos;const s=X.get.settings();s.holidays='US';X.put(s);});
const hol=await p.evaluate(()=>{const H=window.__lifeos.fx.Holidays;return [H.name('2026-11-26'),H.name('2026-05-25'),H.name('2027-01-18'),H.name('2026-07-04')];});
ok('US holidays computed',hol[0]==='Thanksgiving'&&hol[1]==='Memorial Day'&&hol[2]==='Martin Luther King Jr. Day'&&hol[3]==='Independence Day',hol);
ok('holiday shows on the day',await p.evaluate(()=>window.__lifeos.dayItems('2026-11-26').allDay.some(e=>e.title==='Thanksgiving')));
ok('UK Easter Monday 2027',await p.evaluate(()=>{const X=window.__lifeos;const s=X.get.settings();s.holidays='UK';X.put(s);X.fx.Holidays._c=null;return X.fx.Holidays.name('2027-03-29')==='Easter Monday';}));
await p.evaluate(()=>{const X=window.__lifeos;const s=X.get.settings();s.holidays='off';X.put(s);X.fx.Holidays._c=null;});
// second reminder
const rm=await p.evaluate(()=>{const X=window.__lifeos;const t=X.create('task',{title:'Dentist call',date:X.todayK(),time:23*60+30,reminder:30,reminders2:[10],steps:[],notes:'',repeat:{type:'never'}});return X.fx.PWA.upcoming().filter(x=>x.key.startsWith(t.id)).length;});
ok('second reminder is its own notification',rm===2,rm);
const tid=await p.evaluate(()=>{const X=window.__lifeos;return X.get.all('task').find(t=>t.title==='Dentist call').id;});
await p.evaluate(id=>window.__lifeos.sheets.task(window.__lifeos.get.id(id)),tid);await p.waitForTimeout(500);
ok('task sheet offers another reminder',await p.evaluate(()=>{const s=[...document.querySelectorAll('.sheet')].pop();return s.textContent.includes('Another reminder')&&s.textContent.includes('Add another reminder');}));
await p.keyboard.press('Escape');await p.waitForTimeout(400);
// places
const bid=await p.evaluate(()=>{const X=window.__lifeos;const r=X.create('block',{title:'Dentist',date:X.todayK(),start:23*60,dur:30,travel:15,place:'1050 Elmwood Ave, Buffalo',color:'green',repeat:{type:'never'}});return r.id;});
await p.evaluate(id=>window.__lifeos.fx.blockSheet(window.__lifeos.get.id(id)),bid);await p.waitForTimeout(500);
ok('block sheet has place and directions',await p.evaluate(()=>{const s=[...document.querySelectorAll('.sheet')].pop();return s.querySelector('#f-block-place').value.includes('Elmwood')&&[...s.querySelectorAll('.linkbtn')].some(b=>b.textContent.includes('Directions')&&!b.hidden);}));
await p.keyboard.press('Escape');await p.waitForTimeout(400);
ok('leave-now shows the place',await p.evaluate(()=>window.__lifeos.fx.PWA.upcoming().some(x=>x.key.startsWith('leave|')&&x.body.includes('Elmwood'))));
// every few days
const ev=await p.evaluate(()=>{const X=window.__lifeos,F=X.fx,tk=X.todayK();const ago=n=>{const d=new Date();d.setDate(d.getDate()-n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
  const h=X.create('habit',{title:'Mist the ferns',days:[0,1,2,3,4,5,6],everyN:3,logs:{[ago(1)]:true},target:7,startDate:ago(30)});const h2=X.create('habit',{title:'Rinse the filter',days:[0,1,2,3,4,5,6],everyN:3,logs:{[ago(5)]:true},target:7,startDate:ago(30)});
  return [F.habitEveryDue(h,tk),F.habitNextDue(h)>tk,F.habitEveryDue(h2,tk),F.habitNextDue(h2)===tk,X.dayItems(tk).anytime.concat(X.dayItems(tk).timed).some(e=>e.title==='Rinse the filter'),X.dayItems(tk).anytime.concat(X.dayItems(tk).timed).some(e=>e.title==='Mist the ferns')];});
ok('every-3-days: not due the day after, due when late',ev[0]===false&&ev[1]&&ev[2]&&ev[3]&&ev[4]&&!ev[5],ev);
await p.evaluate(()=>window.__lifeos.fx.habitSheet(null));await p.waitForTimeout(500);
ok('habit sheet has Every few days',await p.evaluate(()=>[...document.querySelectorAll('.sheet')].pop().textContent.includes('Every few days')));
await p.evaluate(()=>{const s=[...document.querySelectorAll('.sheet')].pop();[...s.querySelectorAll('.seg button')].find(b=>b.textContent==='Every few days').click();});await p.waitForTimeout(300);
ok('every-N stepper appears',await p.evaluate(()=>[...document.querySelectorAll('.sheet')].pop().textContent.includes('3 days')));
await p.keyboard.press('Escape');await p.waitForTimeout(400);await p.keyboard.press('Escape');await p.waitForTimeout(300);
// voice notes (saved path)
const vn=await p.evaluate(async()=>{const X=window.__lifeos;const blob=new Blob([new Uint8Array(2000)],{type:'audio/mp4'});const ok=await X.fx.saveVoiceNote(blob,4);const i=X.get.all('idea').find(x=>x.audio);return [ok,!!i,i&&i.audio.dur];});
ok('voice note lands in Inbox',vn[0]&&vn[1]&&vn[2]===4,vn);
await p.evaluate(()=>window.__lifeos.App.go('inbox'));await p.waitForTimeout(500);
ok('inbox shows a player',await p.evaluate(()=>!!document.querySelector('.vplayer .vplay')));
ok('mic offered for holding',await p.evaluate(async()=>{window.__lifeos.fx.captureSheet(null);await new Promise(r=>setTimeout(r,400));const m=document.querySelector('.capmic');return !!m&&/voice note/.test(m.getAttribute('aria-label'));}));
await p.keyboard.press('Escape');await p.waitForTimeout(400);
// timeline drag
await p.reload();await p.waitForTimeout(800);await p.evaluate(()=>window.__lifeos.loadDemo());await p.waitForTimeout(300);
await p.evaluate(()=>{const X=window.__lifeos;X.App.state.cal=null;localStorage.setItem('lifeos-cal-mode','week');localStorage.setItem('lifeos-cal-tl','1');X.App.go('calendar');});await p.waitForTimeout(600);
const bx=await p.evaluate(id=>{const X=window.__lifeos;const r=X.create('block',{title:'Board packet review',date:X.todayK(),start:14*60,dur:60,color:'green',repeat:{type:'never'}});X.App.refresh();return r.id;});await p.waitForTimeout(500);
const pos=await p.evaluate(()=>{const e=[...document.querySelectorAll('.tlev')].find(x=>x.textContent.includes('Board packet review'));e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+8};});
await p.mouse.move(pos.x,pos.y);await p.mouse.down();await p.waitForTimeout(250);await p.mouse.move(pos.x,pos.y+40,{steps:5});await p.mouse.move(pos.x,pos.y+88,{steps:5});await p.mouse.up();await p.waitForTimeout(500);
const moved=await p.evaluate(id=>window.__lifeos.get.id(id).start,bx);
ok('drag moves the block later',moved>14*60,moved);
ok('no page errors',errs.length===0,errs.slice(0,3));
await b.close();})();
