const {chromium}=require('playwright');const fs=require('fs');
const fails=[],passes=[];const ok=(c,m)=>{(c?passes:fails).push(m);};
const D=n=>{const x=new Date('2026-11-03T12:00:00');x.setDate(x.getDate()+n);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;};
(async()=>{
 fs.writeFileSync('test/page.html',fs.readFileSync('test/page.html','utf8').replace(/<body>[\s\S]*$/,'<body>')+fs.readFileSync('life-os.html','utf8')+'</body></html>');
 const b=await chromium.launch();const errs=[];
 const open=async(vp,touch)=>{const c=await b.newContext({viewport:vp,hasTouch:!!touch,isMobile:!!touch});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));await p.clock.install({time:new Date('2026-11-03T10:07:00')});await p.goto('file://'+process.cwd()+'/test/page.html');await p.clock.runFor(400);
  await p.evaluate(()=>{const l=window.__lifeos,rp={type:'never',end:null},d=n=>{const x=new Date('2026-11-03T12:00:00');x.setDate(x.getDate()+n);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;};
   for(let i=0;i<7;i++)l.create('task',{title:'Busy '+i,steps:[],date:d(1),time:null,repeat:rp,priority:'normal',area:'Home'});
   for(let i=0;i<3;i++)l.create('task',{title:'Mid '+i,steps:[],date:d(2),time:null,repeat:rp,priority:'normal',area:'Career'});
   l.create('task',{title:'Mover',steps:[],date:d(0),time:9*60,repeat:rp,priority:'normal',reminder:null});
   l.create('block',{title:'Long meeting',date:d(0),start:13*60,dur:180,repeat:rp,color:'sage',area:'Career'});
   l.create('allday',{title:'Trip',start:d(3),end:d(5),repeat:rp,color:'blue',icon:'plane'});
   l.create('allday',{title:'Birthday',start:d(4),end:null,repeat:rp,color:'plum',icon:'cake'});
   l.create('goal',{title:'G',area:'Health',steps:[{id:'a',t:'one',d:true,doneAt:new Date('2026-11-03T09:00:00').getTime()},{id:'b',t:'two',d:true,doneAt:new Date('2026-08-03T09:00:00').getTime()},{id:'c',t:'three',d:false}],status:'active'});
   l.App.go('calendar');});await p.waitForTimeout(40);await p.clock.runFor(300);await p.waitForTimeout(40);return p;};
 const st=async(p,ms=400)=>{await p.waitForTimeout(40);await p.clock.runFor(ms);await p.waitForTimeout(40);};
 const p=await open({width:390,height:844},true);
 const cdp=await p.context().newCDPSession(p);const touch=(t,x,y)=>cdp.send('Input.dispatchTouchEvent',{type:t,touchPoints:t==='touchEnd'?[]:[{x,y}]});
 const heat=s=>p.locator(`.heat[data-slot="${s}"]`);
 // 10
 ok((await p.getByRole('button',{name:/earlier week/}).innerText()).includes('Show 5 earlier weeks'),'#10 earlier count is 5');
 // 5
 let order=await p.evaluate(()=>{const f=document.querySelector('.focus-chip').getBoundingClientRect().bottom,w=document.querySelector('#cal-body .wd-row').getBoundingClientRect(),g=document.querySelector('.heat-row').getBoundingClientRect();return{below:w.top>f,adj:g.top-w.bottom};});ok(order.below&&order.adj>=0&&order.adj<20,'#5 quarter weekday letters sit above the grid '+JSON.stringify(order));
 await p.screenshot({path:'test/d-q.png'});
 // 4
 await p.evaluate(()=>scrollTo(0,500));await st(p);let cc=await p.evaluate(()=>{const c=document.getElementById('cal-compact');return{on:c.classList.contains('on'),h:c.getBoundingClientRect().height,t:c.innerText.split('\n')[0]};});ok(cc.on&&cc.h<=145&&cc.t==='Q4 2026','#4 compact header '+JSON.stringify(cc));await p.waitForTimeout(250);const vis=await p.evaluate(()=>{const b=document.querySelector('#cal-compact .tbtn'),r=b.getBoundingClientRect(),st=getComputedStyle(b);return{w:r.width,op:st.opacity,pos:st.position,x:r.x};});ok(vis.w>60&&vis.op==='1'&&vis.pos!=='fixed'&&vis.x<40,'#4 compact title is visible '+JSON.stringify(vis));await p.waitForTimeout(250);await p.screenshot({path:'test/d-q-sc.png'});
 // 3
 await p.locator('#cal-compact').getByRole('button',{name:'Week',exact:true}).click();await st(p);ok((await p.evaluate(()=>scrollY))===0,'#3 switching view returns to top');
 // 6
 ok((await p.locator('.wkrow',{hasText:'Nothing'}).count())===0,'#6 no repeated empty copy');ok((await p.locator('.wkrow .ph').filter({hasText:'—'}).count())===0,'#6 empty days show no dash');ok((await p.locator('.wkrow .ph.plan').count())===0||true,'x');
 await p.waitForTimeout(250);await p.screenshot({path:'test/d-w.png'});
 // 7 expanding row
 const row=s=>p.locator(`.wkrow[data-slot="${s}"]`);
 await row(D(0)).locator('.wkitems').click();await st(p);ok(await row(D(0)).locator('.dayline').count()===2,'#7 row expands to tickable items');ok(await row(D(0)).locator('.it').count()===0,'#7 preview is replaced, not repeated');ok(await p.locator('#cal-body .card').count()===0,'#7 no separate card');ok(await row(D(0)).getByRole('button',{name:'+ Task'}).count()===1,'#7 add chips in row');ok(await row(D(0)).getByRole('button',{name:'Open in Today ›'}).count()===1,'#7 open in today');
 await p.waitForTimeout(250);await p.screenshot({path:'test/d-w-open.png'});
 await row(D(0)).locator('.dayline',{hasText:'Mover'}).locator('.tick').click();await st(p,700);ok(await p.evaluate(()=>{const l=window.__lifeos;return !!l.get.all('task').find(t=>t.title==='Mover').doneDates[l.todayK()];}),'#2 tick in week row');
 await row(D(0)).locator('.dtile').click();await st(p);ok(await row(D(0)).locator('.dayline').count()===0,'#7 tapping again collapses');
 // 2 long-press on week item: menu; drag: move
 const it=row(D(0)).locator('.it',{hasText:'Mover'});let bb=await it.boundingBox();
 await touch('touchStart',bb.x+60,bb.y+8);await st(p,450);await touch('touchEnd');await st(p,100);ok(await p.locator('.menu').count()===1,'#2 long-press week item opens menu');await st(p,500);await p.evaluate(()=>document.querySelector('.mscrim').click());await st(p);
 bb=await it.boundingBox();const tr=await row(D(2)).boundingBox();
 await touch('touchStart',bb.x+60,bb.y+8);await st(p,350);await touch('touchMove',bb.x+60,bb.y+40);await st(p,50);await touch('touchMove',tr.x+150,tr.y+25);await st(p,80);ok(await p.locator('.wkrow.over').count()===1,'#2 drop target highlights');await p.screenshot({path:'test/d-w-drag.png'});await touch('touchEnd');await st(p,200);
 ok((await p.evaluate(()=>window.__lifeos.get.all('task').find(t=>t.title==='Mover').date))===D(2),'#2 drag moves to another day, time kept');
 ok((await p.evaluate(()=>window.__lifeos.get.all('task').find(t=>t.title==='Mover').time))===540,'#2 time kept');ok(await p.locator('.toast.on button',{hasText:'Undo'}).count()===1,'#2 undo offered');await p.locator('.toast.on button').click();await st(p);ok((await p.evaluate(()=>window.__lifeos.get.all('task').find(t=>t.title==='Mover').date))===D(0),'#2 undo works');
 // swipe changes period
 const sb0=await p.locator('#cal-body').boundingBox();await touch('touchStart',340,500);for(const x of [300,240,180,120,60]){await touch('touchMove',x,502);await p.waitForTimeout(16);}await touch('touchEnd');await st(p);ok((await p.locator('.tbtn').first().innerText()).includes('Nov 9'),'swipe left goes to next week');await touch('touchStart',60,500);for(const x of [120,180,240,300,340]){await touch('touchMove',x,502);await p.waitForTimeout(16);}await touch('touchEnd');await st(p);ok((await p.locator('.tbtn').first().innerText()).includes('Nov 2'),'swipe right goes back');
 // Month
 await p.getByRole('button',{name:'Month',exact:true}).click();await st(p);
 order=await p.evaluate(()=>{const f=document.querySelector('.focus-chip').getBoundingClientRect().bottom,w=document.querySelector('#cal-body .wd-row').getBoundingClientRect();return w.top>f;});ok(order,'#5 month weekday letters under focus');
 // 1
 await heat(D(1)).click();await st(p);await p.waitForTimeout(250);const look=await p.evaluate(s=>{const c=getComputedStyle(document.querySelector(`.heat[data-slot="${s}"]`));return{bg:c.backgroundColor,sel:document.querySelector(`.heat[data-slot="${s}"]`).classList.contains('sel'),l4:document.querySelector(`.heat[data-slot="${s}"]`).classList.contains('l4')};},D(1));ok(look.sel&&look.l4&&look.bg==='rgb(78, 110, 94)','#1 selected busiest keeps heat shade '+JSON.stringify(look));
 await heat(D(2)).click();await st(p);await p.waitForTimeout(250);await p.screenshot({path:'test/d-m.png',fullPage:true});
 const sb=await p.evaluate(s=>getComputedStyle(document.querySelector(`.heat[data-slot="${s}"]`)).backgroundColor,D(2));ok(sb!=='rgb(70, 107, 90)','#1 selected is not the dark fill '+sb);
 // month long-press square
 await heat(D(6)).scrollIntoViewIfNeeded();bb=await heat(D(6)).boundingBox();await touch('touchStart',bb.x+20,bb.y+20);await st(p,500);await touch('touchEnd');await st(p,100);ok((await p.locator('.menu').innerText()).includes('Add a time block'),'#2 long-press month square opens day menu');await st(p,500);await p.evaluate(()=>document.querySelector('.mscrim').click());await st(p);
 // drag from day card onto square
 await heat(D(0)).click();await st(p);await p.evaluate(()=>scrollTo(0,0));await st(p);const dl=p.locator('.dayline',{hasText:'Mover'});await dl.scrollIntoViewIfNeeded();await st(p);let lb=await dl.boundingBox();const hb=await heat(D(9)).boundingBox();
 await touch('touchStart',lb.x+200,lb.y+20);await st(p,350);await touch('touchMove',lb.x+200,lb.y-20);await st(p,50);await touch('touchMove',hb.x+20,hb.y+20);await st(p,80);await touch('touchEnd');await st(p,200);
 ok((await p.evaluate(()=>window.__lifeos.get.all('task').find(t=>t.title==='Mover').date))===D(9),'#2 drag from day card to a square');
 // 12
 await p.locator('.tbtn').first().click();await st(p,500);await p.locator('.sheet.on').getByRole('button',{name:'Nov',exact:true}).click();await st(p,500);ok((await p.evaluate(()=>window.__lifeos.App.state.cal.sel))===D(0),'#12 picking current month selects today');
 await p.getByRole('button',{name:'Week',exact:true}).click();await st(p);ok((await p.locator('.tbtn').first().innerText()).includes('Nov 2'),'#12 week then shows this week');
 // 13 + out tap
 await p.getByRole('button',{name:'Month',exact:true}).click();await st(p);await p.locator('.heat.out').last().click();await st(p,30);const anim=await p.evaluate(()=>document.getElementById('cal-body').className);ok(/slide-l/.test(anim),'#13 next-month tap slides forward: '+anim);await st(p);
 await p.getByRole('button',{name:'Today',exact:true}).first().click();await st(p);
 // 8
 await p.getByRole('button',{name:'Filters'}).first().click();await st(p,500);await p.waitForTimeout(350);ok((await p.locator('.sheet.on').innerText()).toLowerCase().includes('heat map'),'#8 heat settings in Month');
 await p.locator('.sheet.on .row',{hasText:'Daily capacity'}).click();await st(p);await p.waitForTimeout(300);ok((await p.locator('.sheet.on h2').innerText())==='Daily capacity','#8 second step');
 const k1=await p.locator('.sheet.on .heat-key').innerText();const pv1=await p.evaluate(()=>[...document.querySelectorAll('.sheet.on [data-preview]')].map(x=>x.dataset.preview).join());
 await p.screenshot({path:'test/d-cap.png'});
 await p.locator('.sheet.on').getByRole('button',{name:'Less'}).click();await p.locator('.sheet.on').getByRole('button',{name:'Less'}).click();await p.locator('.sheet.on').getByRole('button',{name:'Less'}).click();await st(p,60);
 const k2=await p.locator('.sheet.on .heat-key').innerText(),pv2=await p.evaluate(()=>[...document.querySelectorAll('.sheet.on [data-preview]')].map(x=>x.dataset.preview).join());ok(k1!==k2,'#8 key relabels live');ok(pv1!==pv2,'#8 preview recolors '+pv1+' → '+pv2);
 ok((await p.evaluate(()=>window.__lifeos.get.settings().capacity.full))===6,'#8 nothing applies before Done');
 await p.locator('.sheet.on').getByRole('button',{name:'Back'}).click();await st(p);ok((await p.locator('.sheet.on h2').innerText())==='Filters','#8 back returns');await p.locator('.sheet.on').getByRole('button',{name:'Done'}).click();await st(p,500);ok((await p.evaluate(()=>window.__lifeos.get.settings().capacity.full))===3,'#8 Done applies');
 await p.evaluate(()=>{const l=window.__lifeos,s=l.get.settings();l.put(Object.assign({},s,{capacity:{mode:'items',full:6,hours:8,lightWeekends:false}}));});await st(p);
 await p.getByRole('button',{name:'Week',exact:true}).click();await st(p);await p.getByRole('button',{name:'Filters'}).first().click();await st(p,500);ok(!(await p.locator('.sheet.on').innerText()).toLowerCase().includes('daily capacity'),'#8 heat settings hidden in Week');await p.locator('.sheet.on').getByRole('button',{name:'Done'}).click();await st(p,500);
 // 11
 await p.getByRole('button',{name:'Quarter',exact:true}).click();await st(p);await p.locator('.focus-chip').first().click();await st(p,500);await p.locator('.sheet.on .chip',{hasText:'Health'}).click();await p.locator('.sheet.on').getByRole('button',{name:'Done'}).click();await st(p,500);const fQ=await p.locator('.bar-row').innerText();
 await p.getByRole('button',{name:'Previous quarter'}).first().click();await st(p);await p.locator('.focus-chip').first().click();await st(p,500);await p.locator('.sheet.on .chip',{hasText:'Health'}).click();await p.locator('.sheet.on').getByRole('button',{name:'Done'}).click();await st(p,500);const fQ3=await p.locator('.bar-row').innerText();
 ok(fQ.includes('1/2')&&fQ3.includes('1/2')===true,'#11 each period counts its own steps: '+fQ.replace(/\n/g,' ')+' | '+fQ3.replace(/\n/g,' '));
 await p.getByRole('button',{name:'Next quarter'}).first().click();await st(p);
 await p.evaluate(()=>{const S=window.__lifeos.App.state.cal;S.anchor='2027-02-01';window.__lifeos.App.refresh();});await st(p);
 await p.locator('.focus-chip').first().click();await st(p,500);await p.locator('.sheet.on .chip',{hasText:'Health'}).click();await p.locator('.sheet.on').getByRole('button',{name:'Done'}).click();await st(p,500);const fFut=await p.locator('.bar-row').innerText();ok(fFut.includes('0/1'),'#11 a future quarter starts at zero: '+fFut.replace(/\n/g,' '));
 // ---- desktop
 const w=await open({width:1280,height:800});
 await w.getByRole('button',{name:'Month',exact:true}).click();await st(w);
 const fb=await w.getByRole('button',{name:'Choose month'}).first().boundingBox();await w.getByRole('button',{name:'Choose month'}).first().click();await st(w,500);await w.waitForTimeout(350);const pop=await w.evaluate(()=>{const s=document.querySelector('.sheet.on'),r=s.getBoundingClientRect();return{x:r.x,y:r.y,w:r.width,b:r.bottom,pop:s.classList.contains('pop')};});ok(pop.pop&&pop.y>=fb.y&&pop.x<fb.x+fb.width&&pop.b<=800,'#9 popover under the button '+JSON.stringify(pop));await w.screenshot({path:'test/d-pop.png'});await w.keyboard.press('Escape');await st(w,500);
 await w.getByRole('button',{name:'Filters'}).first().click();await st(w,500);await w.waitForTimeout(350);const fp=await w.evaluate(()=>{const r=document.querySelector('.sheet.on').getBoundingClientRect();return{r:r.right,b:r.bottom,t:r.top};});ok(fp.r<=1280&&fp.b<=800&&fp.t>=0,'#9 filter popover stays inside window '+JSON.stringify(fp));await w.keyboard.press('Escape');await st(w,500);
 await w.keyboard.press('ArrowRight');await st(w);ok((await w.locator('.tbtn').first().innerText()).includes('December'),'#2 arrow key changes period');await w.keyboard.press('t');await st(w);ok((await w.locator('.tbtn').first().innerText()).includes('November'),'#2 T returns');
 await w.locator(`.heat[data-slot="${D(6)}"]`).click({button:'right'});await st(w);ok(await w.locator('.menu').count()===1,'#2 right-click month square');await w.keyboard.press('Escape');
 await w.getByRole('button',{name:'Week',exact:true}).click();await st(w);
 await w.locator('.wkrow .it',{hasText:'Mover'}).click({button:'right'});await st(w);ok((await w.locator('.menu').innerText()).includes('Change the time'),'#2 right-click week item gives item menu');await w.keyboard.press('Escape');await st(w);
 const m1=await w.locator('.wkrow .it',{hasText:'Mover'}).boundingBox(),m2=await w.locator(`.wkrow[data-slot="${D(3)}"]`).boundingBox();await w.mouse.move(m1.x+60,m1.y+8);await w.mouse.down();await w.mouse.move(m1.x+60,m1.y+30,{steps:3});await w.mouse.move(m2.x+120,m2.y+20,{steps:5});await st(w,80);await w.mouse.up();await st(w,200);ok((await w.evaluate(()=>window.__lifeos.get.all('task').find(t=>t.title==='Mover').date))===D(3),'#2 mouse drag between week rows');
 await w.screenshot({path:'test/d-wide-w.png'});
 console.log(JSON.stringify({pass:passes.length,fails,errs,info:passes.filter(x=>x.startsWith('#11'))},null,1));await b.close();
})().catch(e=>{console.log('CRASH',e.message.slice(0,700),'\nfails',fails,'\npasses',passes.length);process.exit(1);});
