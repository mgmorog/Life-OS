const {chromium}=require('playwright');
let pass=0;const fails=[];const ok=(c,m)=>{if(c)pass++;else fails.push(m);};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-11-03T12:58:00')});
await p.goto('file://'+process.cwd()+'/test/page.html');await p.waitForTimeout(300);await p.clock.runFor(500);
const tick=async n=>{await p.clock.runFor(n);await p.waitForTimeout(Math.min(n,250));};
const R=(f,a)=>p.evaluate(f,a);const sh=()=>p.locator('.sheet').last();const rec=t=>R(t=>[...window.__lifeos.recs.values()].find(r=>r.title===t),t);const all=k=>R(k=>[...window.__lifeos.recs.values()].filter(r=>r.kind===k),k);
const openF=async l=>{await p.getByRole('button',{name:l}).first().click();await tick(450);};
const add=async()=>{await sh().getByRole('button',{name:'Add',exact:true}).click();await tick(450);};
const save=async()=>{await sh().getByRole('button',{name:'Save',exact:true}).click();await tick(450);};
const cancel=async()=>{await sh().getByRole('button',{name:'Cancel'}).click();await tick(350);if(await p.locator('.confirm').count()){await p.locator('.confirm').getByRole('button',{name:'Discard'}).click();await tick(350);}};
const sw=n=>sh().getByRole('switch',{name:n});
const row=n=>sh().locator('.row',{hasText:n}).first();
const cf=n=>p.locator('.confirm').getByRole('button',{name:n});
const pickDay=async(label)=>{await sh().getByRole('button',{name:label,exact:true}).first().click();await tick(150);};
const go=async dk=>{await R(k=>{window.__lifeos.App.state.sel=k;window.__lifeos.App.go('today');},dk);await tick(250);};
const rowT=t=>p.locator('.trow',{hasText:t});const openT=async t=>{await rowT(t).locator('.t').first().click();await tick(450);};
const undo=async()=>{await p.locator('#toast').getByRole('button').click();await tick(120);};
const days=(dk,kind)=>R(([d,kd])=>{const x=window.__lifeos.dayItems(d);return [...x.allDay,...x.timed,...x.anytime].filter(e=>!kd||e.kind===kd).map(e=>e.title);},[dk,kind]);

/* ---- ADD TASK ---- */
await openF('+ Task');
ok(await sh().getByRole('button',{name:'Add',exact:true}).getAttribute('aria-disabled')==='true','task: Add off with no title');
await p.fill('#f-task-title','   ');await tick(30);ok(await sh().getByRole('button',{name:'Add',exact:true}).getAttribute('aria-disabled')==='true','task: spaces are not a title');
await p.fill('#f-task-title','<b>Task A</b>');await p.fill('#f-task-notes','line1\nline2\nline3');await tick(40);ok(await p.locator('#f-task-notes').evaluate(n=>n.offsetHeight>50),'notes grow');
await row('Date').click();await tick(120);await pickDay('Fri, Nov 6');ok((await row('Date').innerText()).includes('Nov 6'),'date set');
await sw('Set a time').click();await tick(150);ok((await row('Reminder').innerText()).includes('At the time'),'time turns on reminder');
await sw('Remind me').click();await tick(80);ok(!(await row('Reminder').innerText()).includes('At the time'),'reminder off');await sw('Remind me').click();await tick(100);
await sh().getByRole('button',{name:'More'}).last().click();await tick(60);ok((await row('Reminder').innerText()).includes('1 min before'),'stepper');await sh().getByRole('button',{name:'Less'}).last().click();await tick(60);
await sw('Set a time').click();await tick(100);ok((await row('Reminder').innerText()).includes('Set a time first'),'time off dims reminder');
await row('Reminder').click();await tick(120);ok(await sw('Set a time').getAttribute('aria-checked')==='true','tapping dim reminder turns on time');
await sw('Repeat').click();await tick(120);ok((await row('Repeat').innerText()).includes('Fri'),'repeat follows date day');
await row('Date').click();await tick(120);await pickDay('Sat, Nov 7');ok((await row('Repeat').innerText()).includes('Sat'),'repeat follows moved date');
await row('End repeat').click();await tick(120);await sh().getByRole('button',{name:'On a date'}).click();await tick(120);await sh().locator('.cal').last().getByRole('button',{name:'Previous month'}).click();await tick(80);ok(await sh().locator('.cal').last().getByRole('button',{name:'Fri, Nov 6',exact:true}).isDisabled(),'end repeat cannot be before start');
await sh().getByRole('button',{name:'Never',exact:true}).click();await tick(100);await sw('Repeat').click();await tick(100);
await sw('Set a deadline').click();await tick(120);await sh().locator('.cal').last().getByRole('button',{name:'Thu, Nov 5',exact:true}).click();await tick(120);ok((await sh().innerText()).includes('deadline is before'),'deadline warning');
await sh().getByRole('button',{name:'High',exact:true}).first().click();await tick(60);
await row('Life area').click();await tick(100);await sh().getByRole('button',{name:'Health',exact:true}).click();await tick(100);ok((await row('Life area').innerText()).includes('Health'),'area');
await row('Life area').click();await tick(100);await sh().getByRole('button',{name:'Health',exact:true}).click();await tick(100);ok((await row('Life area').innerText()).includes('None'),'area clears');
await add();let t=await rec('<b>Task A</b>');ok(t&&t.date==='2026-11-07'&&t.priority==='high'&&t.time!=null,'saved task fields');
await go('2026-11-07');ok((await R(()=>document.querySelector('#view').innerHTML)).includes('&lt;b&gt;Task A'),'html is shown as text');await go('2026-11-03');
// no-date task + repeat
await openF('+ Task');await p.fill('#f-task-title','Nodate');await row('Date').click();await tick(120);await sh().getByRole('button',{name:'No date'}).click();await tick(120);ok((await row('Date').innerText()).includes('No date'),'no date');await add();t=await rec('Nodate');ok(t&&t.date===null,'nodate saved');
// weekly repeat first day
await openF('+ Task');await p.fill('#f-task-title','Thursdays only');await sw('Repeat').click();await tick(120);await sh().getByRole('button',{name:'Thu',exact:true}).click();await tick(60);await sh().getByRole('button',{name:'Tue',exact:true}).click();await tick(60);await add();t=await rec('Thursdays only');ok(t.date==='2026-11-05','starts on first covered day '+t.date);ok(!(await days('2026-11-03')).includes('Thursdays only'),'not on today');
/* wheel does not change a value by opening */
await go('2026-11-03');await R(()=>window.__lifeos.create('task',{title:'Odd time',date:'2026-11-03',time:607,steps:[],repeat:{type:'never',end:null},reminder:null,deadline:null,priority:'normal'}));await tick(150);
await p.locator('.blk',{hasText:'Odd time'}).locator('.bt').click();await tick(450);await row('Time').click();await tick(400);await p.waitForTimeout(200);await tick(200);await sh().getByRole('button',{name:'Cancel'}).click();await tick(350);ok(await p.locator('.confirm').count()===0,'opening the wheel is not a change');

/* ---- ADD TIME BLOCK ---- */
await openF('+ Time block');let tx=await sh().innerText();ok(tx.includes('1:00 PM'),'block starts next quarter');ok(tx.includes('2:00 PM'),'block ends +1h');
await p.fill('#f-block-title','Block A');await tick(40);ok((await sh().locator('.pvchip').innerText()).includes('Block A'),'chip live');
await row('Starts').click();await tick(120);await sh().getByRole('button',{name:'2h',exact:true}).click();await tick(120);ok(await sh().locator('.wheel').count()===0,'length closes wheel');ok((await row('Ends').innerText()).includes('3:00 PM'),'length sets end');
await row('Appearance').click();await tick(120);await sh().getByRole('button',{name:'Plum',exact:true}).click().catch(async()=>{await sh().locator('.swatch').nth(3).click();});await tick(100);await sh().locator('.icongrid button').nth(2).click();await tick(100);await sh().locator('.sbody').evaluate(n=>n.scrollTop=9999);await p.screenshot({path:'test/cr-look.png'});
await p.fill('#hex-input','123abc');await tick(60);ok((await sh().locator('.pvchip').getAttribute('style')).includes('123abc'),'hex without # works');
await add();let bl=await rec('Block A');ok(bl&&bl.dur===120&&bl.color==='#123abc'&&bl.icon&&!('lookTouched' in bl),'block saved '+JSON.stringify(bl&&[bl.dur,bl.color,bl.icon]));
// overlap against non-blocks + midnight
await R(()=>window.__lifeos.create('task',{title:'Timed T',date:'2026-11-04',time:600,steps:[],repeat:{type:'never',end:null},reminder:null,deadline:null,priority:'normal'}));await go('2026-11-04');await p.locator('.blk',{hasText:'Timed T'}).count();
await R(()=>window.__lifeos.create('block',{title:'Late',date:'2026-11-04',start:1380,dur:120,repeat:{type:'never',end:null},reminder:null,color:'sage',icon:null}));await tick(100);await p.locator('.blk',{hasText:'Late'}).locator('.bt').click();await tick(450);ok((await row('Ends').innerText()).includes('next day'),'next day label');await cancel();
// part fills
await R(()=>{const L=window.__lifeos;L.create('habit',{title:'Run',target:3,color:'plum',icon:'run',area:'Health',logs:{},sessions:{}});});await tick(100);await openF('+ Time block');await row('Part of').click();await tick(120);await p.screenshot({path:'test/cr-part.png'});await sh().getByRole('button',{name:/Run · /}).click();await tick(120);ok(await p.inputValue('#f-block-title')==='Run','part fills title');ok((await row('Life area').innerText()).includes('Health'),'part fills area');ok((await sh().innerText()).includes('sessions this week'),'habit note');await add();bl=await R(()=>[...window.__lifeos.recs.values()].find(r=>r.title==='Run'&&r.kind==='block'));ok(bl&&bl.kind==='block'&&bl.part&&bl.color==='plum','part look '+JSON.stringify(bl&&[bl.kind,bl.color]));await go('2026-11-03');

/* ---- ADD ALL-DAY ---- */
await openF('+ All-day');await p.fill('#f-ad-title','Trip');await sw('Multiple days').click();await tick(140);tx=await row('Last day').innerText();ok(tx.includes('Nov 5')&&tx.includes('3 days'),'multi default '+tx);await p.screenshot({path:'test/cr-ad.png'});ok(await sh().locator('.cal .inrange').count()===3,'range shaded');ok(await sh().locator('.cal').getByRole('button',{name:'Mon, Nov 2',exact:true}).isDisabled(),'last day cannot be before first');
await sh().locator('.cal').getByRole('button',{name:'Thu, Nov 5',exact:true}).click();await tick(100);await row('First day').click();await tick(120);await sh().locator('.cal').getByRole('button',{name:'Tue, Nov 10',exact:true}).click();await tick(120);ok((await row('Last day').innerText()).includes('Nov 12'),'moving first day moves last');
await sw('Repeat').click();await tick(140);ok((await row('Repeat').innerText()).toLowerCase().includes('year'),'all-day repeat starts yearly '+await row('Repeat').innerText());await sw('Repeat').click();await tick(100);
await sw('Remind me').click();await tick(160);ok((await row('Reminder').innerText()).includes('1 day · 9:00 AM'),'reminder design '+await row('Reminder').innerText());await sh().getByRole('button',{name:'Weeks',exact:true}).click();await tick(100);ok((await row('Reminder').innerText()).includes('1 week'),'weeks');await sh().getByRole('button',{name:'Days',exact:true}).click();await tick(100);await p.screenshot({path:'test/cr-ad2.png'});
await add();let ad=await rec('Trip');ok(ad&&ad.start==='2026-11-10'&&ad.end==='2026-11-12'&&ad.reminder===1440-540,'all-day saved '+JSON.stringify(ad&&[ad.start,ad.end,ad.reminder]));
ok((await days('2026-11-11')).includes('Trip'),'covers middle day');ok(!(await days('2026-11-13')).includes('Trip'),'not after');
// back to single
await openF('+ All-day');await p.fill('#f-ad-title','Solo');await sw('Multiple days').click();await tick(140);await sh().locator('.cal').getByRole('button',{name:'Tue, Nov 3',exact:true}).click();await tick(100);ok(await sw('Multiple days').getAttribute('aria-checked')==='false','pick first day = single');await add();
// repeating multi-day
await R(()=>window.__lifeos.create('allday',{title:'Yearly span',start:'2026-11-03',end:'2026-11-04',repeat:{type:'custom',unit:'year',n:1,end:null},reminder:0,color:'sage',icon:null}));await tick(100);ok((await days('2027-11-04')).includes('Yearly span'),'repeating span covers second day');ok(!(await days('2027-11-05')).includes('Yearly span'),'and stops');
// reminder fires once for a span, and at the chosen time
await R(()=>window.__lifeos.create('allday',{title:'Span rem',start:'2026-11-02',end:'2026-11-05',repeat:{type:'never',end:null},reminder:0,color:'sage',icon:null}));await go('2026-11-03');await tick(100);tx=await R(()=>document.querySelector('.remcard')?.innerText||'');ok((tx.match(/Span rem/g)||[]).length<=1,'span reminder once '+tx);

/* ---- EDIT ---- */
// title edit + undo + cancel on one-off
await R(()=>window.__lifeos.create('task',{title:'Edit me',date:'2026-11-03',time:null,steps:[{id:'s1',t:'Step',d:false}],repeat:{type:'never',end:null},reminder:null,deadline:null,priority:'normal',notes:'n'}));await tick(150);
await openT('Edit me');tx=await sh().innerText();ok(tx.includes('Edit task')&&tx.includes('Save')&&tx.includes('Delete task'),'edit chrome');ok(/of 1 done/i.test(tx),'step count');ok(await p.locator('#f-task-title').inputValue()==='Edit me','edit prefilled');ok(await R(()=>document.activeElement.id!=='f-task-title'),'edit keyboard down');
await sh().getByRole('button',{name:'Save',exact:true}).click();await tick(400);ok(await p.locator('.sheet').count()===0,'save with no change closes');
await openT('Edit me');await p.fill('#f-task-title','');await tick(30);await sh().getByRole('button',{name:'Save',exact:true}).click({force:true});await tick(80);ok(await p.locator('.sheet').count()===1,'empty title cannot save');await p.fill('#f-task-title','Edited');await save();ok(await rec('Edited'),'edit saved');await undo();ok(await rec('Edit me'),'edit undo');
await openT('Edit me');await p.fill('#f-task-title','Nope');await sh().getByRole('button',{name:'Cancel'}).click();await tick(350);ok((await p.locator('.confirm').innerText()).includes('Discard your changes?'),'discard prompt');await cf('Keep editing').click();await tick(300);ok(await p.inputValue('#f-task-title')==='Nope','keep editing keeps text');await cancel();ok(await rec('Edit me'),'discard leaves it');
// repeating task: Cancel keeps form
const rep={type:'custom',unit:'day',n:1,end:null};
await R(r=>window.__lifeos.create('task',{title:'Daily',date:'2026-11-01',time:null,steps:[{id:'q',t:'S',d:false}],repeat:r,reminder:null,deadline:null,priority:'normal',notes:''}),rep);await tick(150);
await openT('Daily');await p.fill('#f-task-title','Daily2');await sh().getByRole('button',{name:'Save',exact:true}).click();await tick(300);tx=await p.locator('.confirm').innerText();ok(tx.includes('Only this one')&&tx.includes('This and later ones')&&tx.includes('All of them'),'edit choices '+tx);await p.screenshot({path:'test/cr-edit.png'});await cf('Keep editing').click();await tick(300);ok(await p.locator('.sheet').count()===1&&await p.inputValue('#f-task-title')==='Daily2','cancel keeps your edit');
// only this one
await sh().getByRole('button',{name:'Save',exact:true}).click();await tick(300);await cf('Only this one').click();await tick(450);ok(await p.locator('.sheet').count()===0,'closed');t=await rec('Daily');ok(t&&t.skip.includes('2026-11-03'),'series skips today');ok((await days('2026-11-03')).includes('Daily2'),'copy today');ok((await days('2026-11-04')).includes('Daily'),'series tomorrow');await undo();ok(!(await rec('Daily2')),'undo removes copy');ok(!((await rec('Daily')).skip||[]).includes('2026-11-03'),'undo clears skip');
// this and later
await openT('Daily');await p.fill('#f-task-title','Daily3');await sh().getByRole('button',{name:'Save',exact:true}).click();await tick(300);await cf('This and later ones').click();await tick(450);ok((await rec('Daily')).repeat.end==='2026-11-02','old series ends');ok((await days('2026-11-02')).includes('Daily'),'old keeps past');ok((await days('2026-11-05')).includes('Daily3'),'new goes on');ok(!(await days('2026-11-05')).includes('Daily'),'old gone later');let d3=await rec('Daily3');ok(d3.date==='2026-11-03','new starts today '+d3.date);await undo();ok(!(await rec('Daily3')),'undo split');
// all
await openT('Daily');await p.fill('#f-task-title','DailyAll');await sh().getByRole('button',{name:'Save',exact:true}).click();await tick(300);await cf('All of them').click();await tick(450);t=await rec('DailyAll');ok(t&&t.date==='2026-11-01','all keeps start '+(t&&t.date));
// turn repeat off from an occurrence
await openT('DailyAll');await sw('Repeat').click();await tick(100);await save();ok(await p.locator('.confirm').count()===0,'turning off repeat asks nothing');t=await rec('DailyAll');ok(t.repeat.type==='never'&&t.date==='2026-11-03','repeat off stays on the day '+t.date);
// step tick from occurrence detaches into own steps
await R(r=>window.__lifeos.create('task',{title:'RS',date:'2026-11-01',time:null,steps:[{id:'a',t:'A',d:false}],repeat:r,reminder:null,deadline:null,priority:'normal',stepDone:{'2026-11-03':{a:true}},notes:''}),rep);await tick(120);await openT('RS');await p.fill('#f-task-title','RS2');await sh().getByRole('button',{name:'Save',exact:true}).click();await tick(300);await cf('Only this one').click();await tick(400);t=await rec('RS2');ok(t.steps[0].d===true&&!t.stepDone,'copy keeps that days steps');
// Block edit, repeating
await R(r=>window.__lifeos.create('block',{title:'BR',date:'2026-11-01',start:600,dur:60,repeat:r,reminder:null,color:'sage',icon:null,notes:''}),rep);await tick(120);await p.locator('.blk',{hasText:'BR'}).locator('.bt').click();await tick(450);tx=await sh().innerText();ok(tx.includes('Edit time block')&&tx.includes('Delete time block'),'block edit');ok(tx.includes('Today'),'shows the occurrence day');ok(!tx.includes('Overlaps BR'),'does not overlap itself');await row('Starts').click();await tick(100);await sh().getByRole('button',{name:'1.5h',exact:true}).click();await tick(100);await save();await cf('Only this one').click();await tick(400);let bs=await R(()=>[...window.__lifeos.recs.values()].filter(r=>r.title==='BR'));ok(bs.length===2&&bs.some(x=>x.dur===90&&x.date==='2026-11-03'&&x.repeat.type==='never'),'block only this one');
// All-day edit, repeating span
await go('2027-11-04');await p.locator('.adchip',{hasText:'Yearly span'}).click();await tick(450);tx=await sh().innerText();ok(tx.includes('Edit all-day item')&&tx.includes('Delete all-day item'),'allday edit');ok(tx.includes('Nov 3')&&tx.includes('Nov 4'),'edit shows that year '+tx.slice(0,220).replace(/\n/g,' '));await p.fill('#f-ad-title','YS2');await save();await cf('Only this one').click();await tick(450);let ys=await rec('YS2');ok(ys&&ys.start==='2027-11-03'&&ys.end==='2027-11-04','all-day only this one keeps span '+JSON.stringify(ys&&[ys.start,ys.end]));ok((await rec('Yearly span')).skip.includes('2027-11-03'),'series skips run');ok(!(await days('2027-11-04')).includes('Yearly span'),'second day gone from series');await go('2026-11-03');
// All-day menu move
await R(()=>window.__lifeos.create('allday',{title:'Mover',start:'2026-11-03',end:'2026-11-04',repeat:{type:'never',end:null},reminder:null,color:'sage',icon:null}));await tick(150);
const hold=async(sel,txt)=>{const box=await R(([s,t])=>{const n=[...document.querySelectorAll(s)].find(x=>x.innerText.includes(t));n.scrollIntoView({block:'center'});const r=n.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2};},[sel,txt]);await p.waitForTimeout(100);const s=await c.newCDPSession(p);await s.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[box]});await p.waitForTimeout(60);await p.clock.runFor(700);await p.waitForTimeout(100);await s.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await tick(400);};
await hold('.adchip','Mover');await p.screenshot({path:'test/cr-menu.png'});ok((await p.locator('.menu').innerText()).includes('Move to tomorrow'),'all-day can move');await p.locator('.menu').getByText('Move to tomorrow').click();await tick(300);let mv=await rec('Mover');ok(mv.start==='2026-11-04'&&mv.end==='2026-11-05','moves whole span '+JSON.stringify([mv.start,mv.end]));await undo();

/* ---- DELETE ---- */
for(const [lbl,kind,mk,openIt] of [['task','task',{date:'2026-11-03',time:null,steps:[],reminder:null,deadline:null,priority:'normal',notes:''},n=>openT(n)],['time block','block',{date:'2026-11-03',start:900,dur:60,reminder:null,color:'sage',icon:null,notes:''},async n=>{await p.locator('.blk',{hasText:n}).locator('.bt').click();await tick(450);}],['all-day item','allday',{start:'2026-11-03',end:null,reminder:null,color:'sage',icon:null,notes:''},async n=>{await p.locator('.adchip',{hasText:n}).click();await tick(450);}]]){
  const field=kind==='allday'?'start':'date';const nm='Del '+kind;
  await R(([k,m,n])=>window.__lifeos.create(k,Object.assign({title:n,repeat:{type:'never',end:null}},m)),[kind,mk,nm]);await tick(150);
  await openIt(nm);await p.fill(kind==='task'?'#f-task-title':kind==='block'?'#f-block-title':'#f-ad-title',nm+'x');await sh().getByRole('button',{name:`Delete ${lbl}`}).click();await tick(400);ok(!(await rec(nm)),`${lbl}: deleted one-off, no prompt`);ok(await p.locator('.sheet').count()===0,`${lbl}: closes`);ok(((await p.locator('#toast').innerText()).toLowerCase()).includes('deleted'),`${lbl}: toast`);await undo();ok(await rec(nm),`${lbl}: undo restores the original`);
  await R(n=>{const L=window.__lifeos;const r=[...L.recs.values()].find(x=>x.title===n);L.remove(r.id);},nm);
  const rn='DelR '+kind;await R(([k,m,n,f])=>{const o=Object.assign({title:n,repeat:{type:'custom',unit:'day',n:1,end:null}},m);o[f]='2026-11-01';window.__lifeos.create(k,o);},[kind,mk,rn,field]);await tick(150);
  await openIt(rn);await sh().getByRole('button',{name:`Delete ${lbl}`}).click();await tick(300);tx=await p.locator('.confirm').innerText();ok(tx.includes('today')&&tx.includes('Only this one')&&tx.includes('This and later ones')&&tx.includes('Delete all of them'),`${lbl}: choices ${tx}`);if(kind==='block')await p.screenshot({path:'test/cr-del.png'});await cf('Keep it').click();await tick(300);ok(await p.locator('.sheet').count()===1,`${lbl}: keep returns to form`);
  await sh().getByRole('button',{name:`Delete ${lbl}`}).click();await tick(300);await cf('Only this one').click();await tick(450);ok(!(await days('2026-11-03')).includes(rn),`${lbl}: gone today`);ok((await days('2026-11-04')).includes(rn),`${lbl}: stays tomorrow`);await undo();ok((await days('2026-11-03')).includes(rn),`${lbl}: only-this-one undo`);
  await openIt(rn);await sh().getByRole('button',{name:`Delete ${lbl}`}).click();await tick(300);await cf('This and later ones').click();await tick(450);ok(!(await days('2026-11-05')).includes(rn),`${lbl}: later gone`);ok((await days('2026-11-02')).includes(rn),`${lbl}: earlier stays`);await undo();ok((await days('2026-11-05')).includes(rn),`${lbl}: later undo`);
  await openIt(rn);await sh().getByRole('button',{name:`Delete ${lbl}`}).click();await tick(300);await cf('Delete all of them').click();await tick(450);ok(!(await rec(rn)),`${lbl}: all deleted`);await undo();ok(await rec(rn),`${lbl}: all undo`);
  await R(n=>{const L=window.__lifeos;const r=[...L.recs.values()].find(x=>x.title===n);L.remove(r.id);},rn);await tick(120);
}
// Delete from hub: repeating task picks next one, not the start
await R(r=>window.__lifeos.create('task',{title:'Hub rep',date:'2026-10-01',time:null,steps:[],repeat:r,reminder:null,deadline:null,priority:'normal',notes:''}),rep);await tick(100);await R(()=>window.__lifeos.App.go('tasks'));await tick(200);await p.getByText('Hub rep').click();await tick(450);await sh().getByRole('button',{name:'Delete task'}).click();await tick(300);tx=await p.locator('.confirm').innerText();ok(tx.includes('today'),'hub delete names next one '+tx);await cf('Keep it').click();await tick(250);await cancel();await go('2026-11-03');
// Delete while dirty does not save edits; menu delete
await hold('.trow','Edit me');ok((await p.locator('.menu').innerText()).includes('Delete'),'menu has delete');await p.locator('.menu').getByText('Delete').click();await tick(300);ok(!(await rec('Edit me')),'menu delete');await undo();
// high priority shows and sorts
await R(()=>{const L=window.__lifeos;L.create('task',{title:'ZZ low',date:'2026-11-03',time:null,steps:[],repeat:{type:'never',end:null},priority:'low'});L.create('task',{title:'ZZ high',date:'2026-11-03',time:null,steps:[],repeat:{type:'never',end:null},priority:'high'});});await tick(150);const ord=await R(()=>[...document.querySelectorAll('.anytime .trow .tt')].map(n=>n.textContent));ok(ord.indexOf('ZZ high')<ord.indexOf('Edit me')&&ord.indexOf('Edit me')<ord.indexOf('ZZ low'),'priority order '+ord);ok((await rowT('ZZ high').innerText()).includes('High priority'),'high priority shows');
console.log(JSON.stringify({pass,fails,errs},null,1));await b.close();})().catch(e=>{console.log('CRASH',e.message.slice(0,700),JSON.stringify({pass,fails},null,1));process.exit(1);});
