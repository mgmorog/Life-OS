const {chromium}=require('playwright');const fs=require('fs');
const fails=[],passes=[];const ok=(c,m)=>{(c?passes:fails).push(m);};
const offs=(n)=>{const d=new Date();d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const T=offs(0);
(async()=>{
 const b=await chromium.launch();
 // ---------- phone, real touch ----------
 const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.clock.install({time:new Date(T+'T10:07:00')});
 fs.writeFileSync('test/page.html',fs.readFileSync('test/page.html','utf8').replace(/<body>[\s\S]*$/,'<body>')+fs.readFileSync('life-os.html','utf8')+'</body></html>');
 await p.goto('file://'+process.cwd()+'/test/page.html');await p.clock.runFor(400);
 const cdp=await c.newCDPSession(p);
 const touch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}]});
 const L=f=>p.evaluate(f);const tick=async(ms=350)=>{await p.waitForTimeout(40);await p.clock.runFor(ms);await p.waitForTimeout(40);};
 await p.evaluate(({T})=>{const l=window.__lifeos;const rp={type:'never',end:null};
   l.create('block',{title:'Standup',notes:'',date:T,start:11*60,dur:60,repeat:rp,reminder:null,part:null,area:null,color:'sage',icon:null});
   l.create('task',{title:'Anytime one',notes:'',steps:[{id:'s1',t:'First',d:false},{id:'s2',t:'Second',d:false}],date:T,time:null,repeat:rp,reminder:null,deadline:null,priority:'normal',part:null,area:null});
   l.create('task',{title:'Undated thing',notes:'',steps:[],date:null,time:null,repeat:rp,reminder:null,deadline:null,priority:'normal'});
   l.create('task',{title:'Due today undated',notes:'',steps:[],date:null,time:null,repeat:rp,reminder:null,deadline:T,priority:'normal'});
 },{T});await tick();
 await p.locator('#grid').scrollIntoViewIfNeeded();await tick();
 const blk=()=>p.locator('.blk',{hasText:'Standup'});
 await p.evaluate(()=>{document.querySelector('.blk').scrollIntoView({block:'center'});scrollBy(0,0);});await tick();
 let bb=await blk().boundingBox();
 // long press, no move → menu, no pickup left behind
 await touch('touchStart',bb.x+150,bb.y+20);await tick(450);await touch('touchEnd');await tick(100);
 ok(await p.locator('.menu').count()===1,'touch: long-press opens the menu');ok(await p.locator('.blk.lift').count()===0,'touch: nothing left lifted');
 await p.screenshot({path:'test/t-menu.png'});
 await tick(500);await L(()=>document.querySelector('.mscrim').click());await tick(600);
 // tap → sheet, not menu
 await p.touchscreen.tap(bb.x+150,bb.y+15);await tick(500);
 ok((await p.locator('.sheet.on h2').innerText())==='Edit time block','touch: tap opens the item');
 await p.locator('.sheet.on').getByRole('button',{name:'Cancel'}).click();await tick(500);
 // long press then drag → moved
 bb=await blk().boundingBox();
 await touch('touchStart',bb.x+150,bb.y+20);await tick(350);await touch('touchMove',bb.x+150,bb.y+60);await tick(50);await touch('touchMove',bb.x+150,bb.y+90);await tick(100);
 await p.screenshot({path:'test/t-drag.png'});await touch('touchEnd');await tick(200);
 let st=await L(()=>window.__lifeos.get.all('block').find(r=>r.title==='Standup').start);ok(st>11*60&&st%15===0,'touch: drag moves the block to '+st);
 ok(await p.locator('.toast.on button',{hasText:'Undo'}).count()===1,'touch: move offers undo');
 await p.locator('.toast.on button').click();await tick();
 ok((await L(()=>window.__lifeos.get.all('block').find(r=>r.title==='Standup').start))===660,'undo restores the time');
 // anytime row onto grid
 await p.evaluate(()=>{window.scrollTo(0,0);});await tick();await p.evaluate(()=>{const r=document.querySelector('.anytime');window.scrollTo(0,r.getBoundingClientRect().top+scrollY-120);});await tick();
 let rb=await p.locator('.trow',{hasText:'Anytime one'}).boundingBox(),gb=await p.locator('#grid').boundingBox();
 await touch('touchStart',rb.x+120,rb.y+20);await tick(350);await touch('touchMove',rb.x+120,rb.y+60);await tick(50);await touch('touchMove',gb.x+200,Math.min(gb.y+120,780));await tick(120);await touch('touchEnd');await tick(200);
 ok((await L(()=>window.__lifeos.get.all('task').find(r=>r.title==='Anytime one').time))!=null,'touch: anytime row dragged onto a time');
 await L(()=>{const t=window.__lifeos.get.all('task').find(r=>r.title==='Anytime one');t.time=null;t.reminder=null;window.__lifeos.put(t);});await tick();
 // swipe must not change day after a drag
 ok((await L(()=>window.__lifeos.App.state.sel))===T,'day unchanged after dragging');
 // inline steps
 await p.locator('.trow',{hasText:'Anytime one'}).getByRole('button',{name:'Show steps'}).click();await tick();
 await p.locator('.stepin',{hasText:'First'}).locator('.tick').click();await tick(700);await p.locator('.stepin',{hasText:'Second'}).locator('.tick').click();await tick(200);
 ok(await p.locator('.toast.on button',{hasText:'Finish task'}).count()===1,'all steps done offers Finish task');await p.locator('.toast.on button').click();await tick(700);
 ok(await L(()=>{const l=window.__lifeos;const t=l.get.all('task').find(r=>r.title==='Anytime one');return !!(t.doneDates||{})[l.todayK()];}),'Finish task marks it done');
 // deadline surfaces; finishing an undated task sticks
 ok(await p.locator('.trow',{hasText:'Due today undated'}).count()===1,'undated task due today shows on Today');
 await p.locator('.trow',{hasText:'Due today undated'}).locator('.tick').click();await tick(700);
 ok(await L(()=>{const t=window.__lifeos.get.all('task').find(r=>r.title==='Due today undated');return t.date===window.__lifeos.todayK()&&!!t.doneDates[t.date];}),'finishing an undated task sticks');
 // on your plate
 await p.getByRole('button',{name:/On your plate/}).click();await tick();await p.screenshot({path:'test/t-plate.png',fullPage:true});
 await p.locator('.trow',{hasText:'Undated thing'}).getByRole('button',{name:'Today',exact:true}).click();await tick();
 ok((await L(()=>window.__lifeos.get.all('task').find(r=>r.title==='Undated thing').date))===T,'plate: move to today');
 // repeating: occurrences
 await p.evaluate(({s})=>window.__lifeos.create('task',{title:'Daily rep',notes:'',steps:[],date:s,time:null,repeat:{type:'custom',unit:'day',n:1,end:null},reminder:null,deadline:null,priority:'normal'}),{s:offs(-3)});await tick();
 await p.locator('.trow .t',{hasText:'Daily rep'}).click();await tick(500);
 ok((await p.locator('.sheet.on .row',{hasText:'Date'}).first().innerText()).includes('Today'),'repeating edit shows the day you opened');
 await p.fill('#f-task-title','Daily rep changed');await p.locator('.sheet.on').getByRole('button',{name:'Save'}).click();await tick(500);
 await p.screenshot({path:'test/t-occ.png'});
 await p.getByRole('button',{name:'Only this one'}).click();await tick(500);
 let r=await L(()=>window.__lifeos.get.all('task').filter(t=>/Daily rep/.test(t.title)).map(t=>({t:t.title,d:t.date,rep:t.repeat.type,skip:t.skip||[]})));
 ok(r.length===2&&r.some(x=>x.t==='Daily rep'&&x.skip.includes(T))&&r.some(x=>x.t==='Daily rep changed'&&x.d===T&&x.rep==='never'),'only this one '+JSON.stringify(r));
 await p.locator('.trow .t',{hasText:'Daily rep changed'}).click();await tick(450);await p.locator('.sheet.on').getByRole('button',{name:'Cancel'}).click();await tick(500);
 // go to tomorrow's occurrence, change for all → start stays
 await p.evaluate(()=>{});
 await L(()=>{const l=window.__lifeos;l.App.state.sel=null;});
 await p.evaluate(({d})=>{window.__lifeos.App.state.sel=d;window.__lifeos.App.refresh();},{d:offs(1)});await tick();
 await p.locator('.trow .t',{hasText:'Daily rep'}).click();await tick(500);await p.fill('#f-task-title','Daily all');await p.locator('.sheet.on').getByRole('button',{name:'Save'}).click();await tick(500);await p.getByRole('button',{name:'All of them'}).click();await tick(400);
 r=await L(()=>window.__lifeos.get.all('task').find(t=>t.title==='Daily all'));ok(r&&r.date===offs(-3),'all of them keeps the series start');
 // a moved occurrence lands on the right day
 await p.locator('.trow',{hasText:'Daily all'}).click({button:'right'}).catch(()=>{});await tick(500);await L(()=>{document.querySelector('.mscrim')?.click();});await tick();
 await p.evaluate(({T})=>{window.__lifeos.App.state.sel=T;window.__lifeos.App.refresh();},{T});await tick();
 // reminders
 await p.evaluate(({T})=>window.__lifeos.create('task',{title:'Call now',notes:'',steps:[],date:T,time:10*60,repeat:{type:'never',end:null},reminder:0,deadline:null,priority:'normal'}),{T});await tick();
 ok(await p.locator('.remcard',{hasText:'Call now'}).count()===1,'due reminder shows');await p.screenshot({path:'test/t-rem.png'});
 await p.locator('.remcard').getByRole('button',{name:'10 min'}).click();await tick();ok(await p.locator('.remcard').count()===0,'snooze hides it');
 await p.clock.runFor(11*60000);await p.waitForTimeout(50);ok(await p.locator('.remcard',{hasText:'Call now'}).count()===1,'snooze returns');
 await p.locator('.remcard').getByRole('button',{name:'Done'}).click();await tick();ok(await L(()=>{const l=window.__lifeos;return !!l.get.all('task').find(t=>t.title==='Call now').doneDates[l.todayK()];}),'reminder Done completes it');ok(await p.locator('.remcard').count()===0,'done clears it');
 // carried over
 await p.evaluate(({y})=>{const l=window.__lifeos;['Old A','Old B'].forEach(t=>l.create('task',{title:t,notes:'',steps:[],date:y,time:null,repeat:{type:'never',end:null},reminder:null,deadline:null,priority:'normal'}));},{y:offs(-2)});await tick();
 ok(await p.locator('.meta.late',{hasText:'From'}).count()>=2,'carried over shows');await p.getByRole('button',{name:'Move all to today'}).click();await tick();
 ok((await L(()=>window.__lifeos.get.all('task').filter(t=>/^Old/.test(t.title)).every(t=>t.date===window.__lifeos.todayK()))),'move all works');
 // share
 await p.getByRole('button',{name:'Share this day'}).click();await p.clock.runFor(500);await p.waitForTimeout(200);await p.clock.runFor(400);
 ok(await p.locator('.sheet.on img').count()===1,'share sheet shows the image');await p.screenshot({path:'test/t-share.png'});
 await p.locator('.sheet.on').getByRole('button',{name:'Close'}).click();await tick(500);
 // ---------- wide, mouse ----------
 const c2=await b.newContext({viewport:{width:1280,height:800}});const q=await c2.newPage();q.on('pageerror',e=>errs.push('W '+e.message));
 await q.clock.install({time:new Date(T+'T10:07:00')});
 await q.goto('file://'+process.cwd()+'/test/page.html');await q.clock.runFor(400);const tk=async(ms=300)=>{await q.waitForTimeout(40);await q.clock.runFor(ms);await q.waitForTimeout(40);};
 await q.evaluate(({T})=>window.__lifeos.create('block',{title:'Review',notes:'',date:T,start:11*60,dur:60,repeat:{type:'never',end:null},reminder:null,part:null,area:null,color:'sage',icon:null}),{T});await tk();
 // week strip mouse drag
 let wb=await q.locator('#week-strip').boundingBox();
 await q.mouse.move(wb.x+500,wb.y+30);await q.mouse.down();await q.mouse.move(wb.x+300,wb.y+30,{steps:5});await q.mouse.move(wb.x+100,wb.y+30,{steps:5});await q.mouse.up();await q.clock.runFor(700);await q.waitForTimeout(500);await q.clock.runFor(700);await q.waitForTimeout(100);
 ok((await q.evaluate(()=>window.__lifeos.App.state.sel))===offs(7),'mouse: dragging the week strip moves a week ('+await q.evaluate(()=>window.__lifeos.App.state.sel)+')');
 await q.keyboard.press('t');await tk();ok((await q.evaluate(()=>window.__lifeos.App.state.sel))===T,'keyboard: T returns to today');
 await q.keyboard.press('ArrowRight');await tk();ok((await q.evaluate(()=>window.__lifeos.App.state.sel))===offs(1),'keyboard: arrow changes day');await q.keyboard.press('t');await tk();
 // draw on empty grid
 const gg=await q.locator('#grid').boundingBox();await q.evaluate(()=>{document.querySelector('#grid').scrollTop=56*12});await tk();
 await q.mouse.move(gg.x+200,gg.y+60);await q.mouse.down();await q.mouse.move(gg.x+200,gg.y+150,{steps:6});await q.clock.runFor(60);await q.waitForTimeout(40);await q.screenshot({path:'test/t-draw.png'});await q.mouse.up();await tk(500);
 ok((await q.locator('.sheet.on h2').innerText())==='New time block','mouse: drawing opens a new block');
 const pv=await q.evaluate(()=>document.querySelector('#b-start').textContent+' – '+document.querySelector('#b-end').textContent);ok(/–/.test(pv)&&!/ 1 hr/.test(pv),'drawn range '+pv);
 await q.keyboard.press('Escape');await tk(500);
 // resize
 await q.locator('.blk',{hasText:'Review'}).scrollIntoViewIfNeeded();await q.evaluate(()=>{document.querySelector('#grid').scrollTop=56*10});await tk();
 const bk=await q.locator('.blk',{hasText:'Review'}).boundingBox();await q.mouse.move(bk.x+100,bk.y+bk.height-4);await q.mouse.down();await q.mouse.move(bk.x+100,bk.y+bk.height+52,{steps:4});await q.mouse.up();await tk();
 ok((await q.evaluate(()=>window.__lifeos.get.all('block').find(r=>r.title==='Review').dur))===120,'mouse: resize works');
 // minute refresh mid-drag must not drop it
 const bk2=await q.locator('.blk',{hasText:'Review'}).boundingBox();await q.mouse.move(bk2.x+100,bk2.y+30);await q.mouse.down();await q.mouse.move(bk2.x+100,bk2.y+60,{steps:3});await q.clock.runFor(61000);await q.waitForTimeout(30);ok(await q.locator('.blk.lift').count()===1,'a clock refresh does not break a drag');await q.mouse.up();await tk();
 // now jump
 await q.evaluate(()=>{document.querySelector('#grid').scrollTop=0});await tk();ok(await q.locator('.nowjump').isVisible(),'Now button appears when scrolled away');
 console.log(JSON.stringify({pass:passes.length,fails,errs},null,1));await b.close();
})().catch(e=>{console.log('CRASH',e.message.slice(0,500),'\nfails',fails,'\npasses',passes.length);process.exit(1);});
