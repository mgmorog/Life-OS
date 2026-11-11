const {chromium}=require('playwright');
let pass=0;const fails=[];const ok=(c,m)=>{if(c)pass++;else fails.push(m);};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.install({time:new Date('2026-11-03T12:40:00')});
await p.goto('file://'+process.cwd()+'/test/page.html');await p.waitForTimeout(300);await p.clock.runFor(500);
const tick=async n=>{await p.clock.runFor(n);await p.waitForTimeout(Math.min(n,300));};
const R=(f,a)=>p.evaluate(f,a);const sh=()=>p.locator('.sheet').last();const rs=k=>R(k=>[...window.__lifeos.recs.values()].filter(r=>r.kind===k),k);
const openCap=async()=>{await p.locator('#fab').click();await tick(450);};
const tile=n=>sh().locator('.saveas .tl',{hasText:n});
// keyboard stays up on capture, compact layout
await openCap();ok(await R(()=>!document.activeElement.matches('input,textarea')),'capture opens with the keyboard down');await p.screenshot({path:'test/cp-a.png'});
const ov=await sh().locator('.sbody').evaluate(n=>{const pad=parseFloat(getComputedStyle(n).paddingBottom);return[n.scrollHeight-pad,n.clientHeight];});ok(ov[0]<=ov[1]+2,'fits one screen '+ov);
// Parsing + hint + task
await p.fill('#f-cap-title','Call plumber tomorrow at 3pm');await tick(50);let hint=await sh().locator('.caphint').innerText();ok(/task/i.test(hint)&&/Tomorrow/.test(hint)&&/3:00/.test(hint),'hint '+hint);ok(await tile('Task').evaluate(n=>n.classList.contains('sug')),'tile suggested');await p.screenshot({path:'test/cp-b.png'});
await sh().locator('.caphint-b').click();await tick(450);ok(await p.inputValue('#f-task-title')==='Call plumber','clean title '+await p.inputValue('#f-task-title'));let tx=await sh().innerText();ok(tx.includes('Tomorrow')&&tx.includes('3:00 PM'),'form prefilled');await p.screenshot({path:'test/cp-c.png'});
// cancel form returns to capture with text
await sh().getByRole('button',{name:'Cancel'}).click();await tick(350);if(await p.getByRole('button',{name:'Discard'}).count()){await p.getByRole('button',{name:'Discard'}).click();await tick(350);}ok(await p.inputValue('#f-cap-title')==='Call plumber tomorrow at 3pm','text kept after cancel');
await sh().locator('.caphint-b').click();await tick(450);await sh().getByRole('button',{name:'Add',exact:true}).click();await tick(500);ok(await p.locator('.sheet').count()===0,'both sheets close');let t=(await rs('task')).find(x=>x.title==='Call plumber');ok(t&&t.date==='2026-11-04'&&t.time===900&&t.reminder===0,'task fields '+JSON.stringify(t&&[t.date,t.time]));ok((await rs('idea')).length===0,'no idea left');ok(await R(()=>!localStorage.getItem('lifeos-capture-draft')),'draft cleared');
// Plain save, Undo
await openCap();await p.fill('#f-cap-title','Plain thought');await p.keyboard.press('Enter');await tick(450);ok((await rs('idea')).length===1,'return saves');ok((await p.locator('#toast').innerText()).includes('Undo'),'undo offered');await p.locator('#toast').getByRole('button').click();await tick(100);ok((await rs('idea')).length===0,'undo works');
// Add another
await openCap();await p.fill('#f-cap-title','First');await sh().getByRole('button',{name:'Save and add another'}).click();await tick(100);ok(await p.inputValue('#f-cap-title')===''&&await R(()=>document.activeElement.id)==='f-cap-title','clears and refocuses');ok((await sh().innerText()).includes('1 saved'),'count');await p.keyboard.type('Second');await p.keyboard.press('Enter');await tick(450);ok((await rs('idea')).map(x=>x.title).sort().join()==='First,Second','two ideas');ok(await p.locator('.sheet').count()===0,'closed');
// Notes only: no duplicate
await openCap();await p.fill('#f-cap-notes','Top line\nRest of it');await sh().getByRole('button',{name:'Save',exact:true}).click();await tick(450);let n=(await rs('idea')).find(x=>x.title==='Top line');ok(n&&n.notes==='Rest of it','notes split '+JSON.stringify(n));
// Dismiss with text: offers save
await openCap();await p.fill('#f-cap-title','Dont lose me');await sh().getByRole('button',{name:'Cancel'}).click();await tick(350);ok((await p.locator('.confirm').innerText()).includes('Keep this idea?'),'keep prompt');await p.screenshot({path:'test/cp-d.png'});await p.locator('.confirm').getByRole('button',{name:'Save to Inbox'}).click();await tick(450);ok((await rs('idea')).some(x=>x.title==='Dont lose me'),'saved from prompt');
// Draft survives reload
await openCap();await p.fill('#f-cap-title','Half typed');await tick(30);await p.reload();await p.waitForTimeout(300);await tick(400);await openCap();ok(await p.inputValue('#f-cap-title')==='Half typed','draft restored');ok((await sh().innerText()).includes('Picked up'),'draft note');await sh().getByRole('button',{name:'Cancel'}).click();await tick(350);await p.locator('.confirm').getByRole('button',{name:'Discard'}).click();await tick(450);await openCap();ok(await p.inputValue('#f-cap-title')==='','discard clears draft');await sh().getByRole('button',{name:'Cancel'}).click();await tick(400);
// Parser table
const cases=await R(()=>0);
const t2=async(txt,chk,label)=>{await openCap();await p.fill('#f-cap-title',txt);await tick(30);const h=await sh().locator('.caphint').innerText().catch(()=>'' );const hid=await sh().locator('.caphint').evaluate(n=>n.hidden);ok(chk(hid?'':h),`${label||txt}: "${hid?'':h}"`);await sh().getByRole('button',{name:'Cancel'}).click();await tick(330);if(await p.locator('.confirm').count()){await p.locator('.confirm').getByRole('button',{name:'Discard'}).click();await tick(330);}};
await t2('Finish report by Friday',h=>/task/i.test(h)&&/Due/.test(h)&&/Fri/.test(h));
await t2('Dentist appointment Nov 12 at 2:30pm',h=>/time block/i.test(h)&&/Nov 12/.test(h)&&/2:30/.test(h));
await t2('Moms birthday on 12/25',h=>/all-day/i.test(h)&&/Dec 25/.test(h));
await t2('Walk every morning',h=>/habit/i.test(h)&&/Every day/.test(h));
await t2('Yoga 3 times a week',h=>/habit/i.test(h)&&/3 times/.test(h));
await t2('Take vitamins every Monday',h=>/habit/i.test(h)&&/Monday/.test(h));
await t2('https://example.com/article',h=>/resource/i.test(h));
await t2('Plan the kitchen remodel',h=>/project/i.test(h));
await t2('Learn Spanish',h=>/goal/i.test(h));
await t2('Book flights',h=>/task/i.test(h));
await t2('Sunday paper thoughts',h=>/task/i.test(h)&&/Nov 8|Sun/.test(h),'Sunday (a known false positive is fine, shows for checking)');
await t2('A thought about the universe',h=>h==='','no guess when nothing to go on');
await t2('Buy 3 apples',h=>/task/i.test(h)&&!/\d:\d/.test(h),'numbers are not times');
await t2('Meet at 5th avenue',h=>h==='','5th is not a time');
await t2('See https://a.com/2026/11/12 tomorrow',h=>/resource/i.test(h),'link wins');
// Link flow
await openCap();await p.fill('#f-cap-title','https://www.example.com/article');await tick(30);await sh().locator('.caphint-b').click();await tick(450);ok(await p.inputValue('#f-res-title')==='example.com','host as title '+await p.inputValue('#f-res-title'));ok((await p.inputValue('#f-res-url')).includes('example.com/article'),'url moved');await sh().getByRole('button',{name:'Add',exact:true}).click();await tick(500);ok(await p.locator('.sheet').count()===0,'resource closes both');
// Habit flow
await openCap();await p.fill('#f-cap-title','Walk every morning');await tick(30);await sh().locator('.caphint-b').click();await tick(450);ok(await p.inputValue('#f-habit-title')==='Walk','habit title');await sh().getByRole('button',{name:'Add',exact:true}).click();await tick(500);let h=(await rs('habit')).find(x=>x.title==='Walk');ok(h&&h.days.length===7&&h.tod==='morning','habit fields '+JSON.stringify(h&&[h.days,h.tod]));ok(await p.locator('.sheet').count()===0,'habit closes both');
// Time block + all-day close both
await openCap();await p.fill('#f-cap-title','Lunch with Sam tomorrow at noon');await tick(30);await tile('Time block').click();await tick(450);await sh().getByRole('button',{name:'Add',exact:true}).click();await tick(500);ok(await p.locator('.sheet').count()===0,'block closes both');let bl=(await rs('block')).find(x=>x.title==='Lunch with Sam');ok(bl&&bl.start===720&&bl.date==='2026-11-04','block fields '+JSON.stringify(bl&&[bl.start,bl.date]));
await openCap();await p.fill('#f-cap-title','Mom birthday Dec 1');await tick(30);await tile('All-day').click();await tick(450);await sh().getByRole('button',{name:'Add',exact:true}).click();await tick(500);ok(await p.locator('.sheet').count()===0,'all-day closes both');let ad=(await rs('allday')).find(x=>x.title==='Mom birthday');ok(ad&&ad.start==='2026-12-01','allday fields '+JSON.stringify(ad&&ad.start));ok(!ad||!('_after' in ad),'no stray field');
// List
await openCap();await p.fill('#f-cap-title','Milk');await tile('List item').click();await tick(450);await p.fill('#f-newlist','Groceries');await sh().getByRole('button',{name:'Create list and add'}).click();await tick(500);ok(await p.locator('.sheet').count()===0,'list closes both');
// More -> hub tool
await openCap();await p.fill('#f-cap-title','Weekend in Toronto');await p.fill('#f-cap-notes','Maybe in May');await sh().getByRole('button',{name:/More…/}).click();await tick(450);await p.screenshot({path:'test/cp-e.png'});await sh().getByRole('button',{name:'Trip',exact:true}).click();await tick(450);ok(await p.locator('.sheet').last().locator('input[type=text]').first().inputValue()==='Weekend in Toronto','hub title');await sh().getByRole('button',{name:'Add',exact:true}).click();await tick(500);ok(await p.locator('.sheet').count()===0,'hub closes all');ok((await rs('entry')).some(x=>x.tool==='trips'&&x.f.what==='Weekend in Toronto'&&x.f.note==='Maybe in May'),'hub entry');
// Capture to Today setting
await R(()=>{const L=window.__lifeos;L.put(Object.assign({},L.get.settings(),{captureTo:'today'}));});await openCap();await p.fill('#f-cap-title','Email Pat Friday 9am');await p.keyboard.press('Enter');await tick(450);let ct=(await rs('task')).find(x=>x.title==='Email Pat');ok(ct&&ct.date==='2026-11-06'&&ct.time===540,'capture to today parses '+JSON.stringify(ct&&[ct.title,ct.date]));ok((await p.locator('#toast').innerText()).includes('Nov 6')||(await p.locator('#toast').innerText()).includes('Fri'),'toast names day');await R(()=>{const L=window.__lifeos;L.put(Object.assign({},L.get.settings(),{captureTo:'inbox'}));});
// Inbox + tidy, relative to capture day
await R(()=>{const L=window.__lifeos;L.create('idea',{title:'Pay rent tomorrow',notes:'',photos:[],createdAt:0});const r=[...L.recs.values()].find(x=>x.title==='Pay rent tomorrow');r.createdAt=new Date('2026-11-01T09:00:00').getTime();L.put(r,{silent:true});L.create('idea',{title:'See this https://a.com',notes:'',photos:[]});L.App.go('inbox');});await tick(300);await p.screenshot({path:'test/cp-f.png'});tx=await R(()=>document.querySelector('#view').innerText);ok(tx.includes('Link'),'link tag');ok(/Task/.test(tx)&&/Resource/.test(tx),'type tags');
await p.getByText(/Tidy up/).click();await tick(450);await p.screenshot({path:'test/cp-g.png'});ok(await sh().locator('.tl.sug').count()===1,'tidy suggests');
const first=await sh().locator('.deck h2').innerText();ok(first==='Pay rent tomorrow','oldest first '+first);await sh().locator('.tl.sug').click();await tick(450);tx=await sh().innerText();ok(tx.includes('Yesterday'),'date from when it was captured: '+tx.slice(0,300).replace(/\n/g,' '));await sh().getByRole('button',{name:'Add',exact:true}).click();await tick(500);ok(!(await rs('idea')).some(x=>x.title==='Pay rent tomorrow'),'idea removed');ok((await sh().locator('.deck h2').innerText())!==first,'moves to next');
const cdp=await c.newCDPSession(p);const swipe=async(x0,x1)=>{await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:x0,y:300}]});for(let i=1;i<=6;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:x0+(x1-x0)*i/6,y:300}]});await p.waitForTimeout(15);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await tick(200);};
const a=await sh().locator('.deck h2').innerText();await swipe(320,80);const bb=await sh().locator('.deck h2').innerText();ok(a!==bb,'swipe next');await swipe(80,320);ok((await sh().locator('.deck h2').innerText())===a,'swipe back');await sh().getByRole('button',{name:'Close'}).click();await tick(400);
// Desktop key
const c2=await b.newContext({viewport:{width:1280,height:800}});const q=await c2.newPage();await q.goto('file://'+process.cwd()+'/test/page.html');await q.waitForTimeout(400);await q.keyboard.press('c');await q.waitForTimeout(400);ok(await q.evaluate(()=>document.activeElement.id)==='f-cap-title','c opens capture');await q.keyboard.type('xc');ok(await q.inputValue('#f-cap-title')==='xc','typing c stays in field');await q.screenshot({path:'test/cp-h.png'});
console.log(JSON.stringify({pass,fails,errs},null,1));await b.close();})().catch(e=>{console.log('CRASH',e.message.slice(0,600),JSON.stringify({pass,fails}));process.exit(1);});
