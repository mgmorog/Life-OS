const {chromium}=require('playwright');
let pass=0;const fails=[];const ok=(c,m)=>{if(c)pass++;else fails.push(m);};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/test/page.html');await p.waitForTimeout(400);
const R=(f,a)=>p.evaluate(f,a);const sh=()=>p.locator('.sheet').last();
const vals=()=>sh().locator('.step input').evaluateAll(n=>n.map(x=>x.value));
const cdp=await c.newCDPSession(p);
const drag=async(fromIdx,toIdx,opts={})=>{await p.waitForTimeout(220);await sh().locator('.sbody').evaluate(n=>n.scrollTop=0);await p.waitForTimeout(40);const hs=sh().locator('.step .h');const a=await hs.nth(fromIdx).boundingBox(),z=await hs.nth(toIdx).boundingBox();const x=a.x+a.width/2,y0=a.y+a.height/2,y1=z.y+z.height/2+(toIdx>fromIdx?8:-8);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:y0}]});for(let i=1;i<=10;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:y0+(y1-y0)*i/10}]});await p.waitForTimeout(25);}if(opts.shot){await p.waitForTimeout(300);await p.screenshot({path:opts.shot});}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(150);};
await p.getByRole('button',{name:'+ Task'}).first().click();await p.waitForTimeout(450);await p.fill('#f-task-title','Steps test');
// add
await p.locator('body').evaluate(()=>document.activeElement.blur());await sh().getByRole('button',{name:'Add a step'}).click();await p.waitForTimeout(80);ok(await R(()=>!document.activeElement.matches('input')),'keyboard stays down');await sh().locator('.step input').first().focus();ok(await sh().locator('.step .tick').count()===0,'no tick on a new task');
await p.keyboard.type('One');await p.keyboard.press('Enter');await p.waitForTimeout(40);await p.keyboard.type('Two');await p.keyboard.press('Enter');await p.waitForTimeout(40);await p.keyboard.type('Three');await p.keyboard.press('Enter');await p.waitForTimeout(40);await p.keyboard.type('Four');await p.keyboard.press('Enter');await p.waitForTimeout(40);
ok((await vals()).join()==='One,Two,Three,Four,','enter chain '+await vals());
await p.keyboard.press('Enter');await p.waitForTimeout(60);ok((await vals()).join()==='One,Two,Three,Four','enter on empty ends the list '+await vals());ok(await R(()=>!document.activeElement.matches('input')),'keyboard away');
await sh().getByRole('button',{name:'Add a step'}).click();await p.waitForTimeout(50);await sh().getByRole('button',{name:'Add a step'}).click();await p.waitForTimeout(50);ok((await vals()).length===5,'no pile of empties');await sh().locator('.step input').last().focus();await p.waitForTimeout(30);
await p.keyboard.press('Backspace');await p.waitForTimeout(50);ok((await vals()).length===4&&await R(()=>document.activeElement.value)==='Four','backspace removes and steps back');
// drag down, up, with a mid-drag shot
await p.locator('body').evaluate(()=>document.activeElement.blur());
await drag(0,2,{shot:'test/st-drag.png'});ok((await vals()).join()==='Two,Three,One,Four','drag down '+await vals());
await drag(3,0);ok((await vals()).join()==='Four,Two,Three,One','drag up '+await vals());
await drag(1,1);ok((await vals()).join()==='Four,Two,Three,One','no move no change');
ok(await R(()=>[...document.querySelectorAll('.step')].every(n=>!n.style.transform&&!n.classList.contains('drag'))),'no leftover drag state');
ok(await p.locator('.sheet').count()>0,'sheet did not swipe closed');
// typed text survives
await sh().locator('.step input').nth(1).fill('Two edited');await p.locator('body').evaluate(()=>document.activeElement.blur());await drag(1,3);ok((await vals()).join()==='Four,Three,One,Two edited','text survives drag '+await vals());
// remove + undo
await p.waitForTimeout(400);await sh().getByRole('button',{name:'Delete step 2'}).click();await p.waitForTimeout(120);ok((await vals()).join()==='Four,One,Two edited','removed');ok((await p.locator('#toast').innerText()).includes('Step removed'),'undo offered');await p.locator('#toast').getByRole('button').click();await p.waitForTimeout(120);ok((await vals()).join()==='Four,Three,One,Two edited','undo restores place '+await vals());
// keyboard arrows
await sh().locator('.step .h').nth(0).focus();await p.keyboard.press('ArrowDown');await p.waitForTimeout(40);ok((await vals())[1]==='Four','arrow moves');await p.keyboard.press('ArrowUp');await p.waitForTimeout(40);
// long list autoscroll
for(let i=0;i<12;i++){await sh().getByRole('button',{name:'Add a step'}).click();await p.waitForTimeout(15);await sh().locator('.step input').last().fill('S'+i);await p.waitForTimeout(15);}
await p.locator('body').evaluate(()=>document.activeElement.blur());await p.waitForTimeout(350);
await sh().locator('.sbody').evaluate(n=>n.scrollTop=0);await p.waitForTimeout(80);
const hb=await sh().locator('.step .h').nth(0).boundingBox();const x=hb.x+hb.width/2;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x,y:hb.y+20}]});for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x,y:hb.y+20+(790-hb.y)*i/8}]});await p.waitForTimeout(20);}await p.waitForTimeout(900);const st=await sh().locator('.sbody').evaluate(n=>n.scrollTop);ok(st>100,'autoscrolls at edge '+st);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(150);ok((await vals())[0]!=='Four','moved far '+(await vals()).join());
// empties dropped on save
await p.waitForTimeout(400);await sh().getByRole('button',{name:'Add a step'}).click();await p.locator('body').evaluate(()=>document.activeElement.blur());await sh().getByRole('button',{name:'Add',exact:true}).click();await p.waitForTimeout(450);
const t=await R(()=>[...window.__lifeos.recs.values()].find(r=>r.title==='Steps test'));ok(t&&t.steps.every(s=>s.t.trim())&&t.steps.length===16,'saved clean, order kept '+(t&&t.steps.length));
// repeating: steps restart each occurrence
const out=await R(()=>{const L=window.__lifeos;const k=L.todayK();const d=new Date();d.setDate(d.getDate()+1);const p=x=>String(x).padStart(2,'0');const tom=`${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;const r=L.create('task',{title:'Rep steps',date:k,time:null,repeat:{type:'custom',unit:'day',n:1,end:null},reminder:null,deadline:null,priority:'normal',steps:[{id:'a',t:'First',d:false},{id:'b',t:'Second',d:false}]});return tom;});
await p.waitForTimeout(100);await p.locator('.trow',{hasText:'Rep steps'}).getByRole('button',{name:'Show steps'}).click();await p.waitForTimeout(120);
await p.locator('.stepin',{hasText:'First'}).locator('.tick').click();await p.waitForTimeout(1100);
ok((await p.locator('.trow',{hasText:'Rep steps'}).innerText()).includes('1/2'),'today 1/2');
await R(k=>{window.__lifeos.App.state.sel=k;window.__lifeos.App.refresh();},out);await p.waitForTimeout(200);ok((await p.locator('.trow',{hasText:'Rep steps'}).innerText()).includes('0/2'),'tomorrow starts fresh');
// repeat hides the tick in edit
await p.locator('.trow',{hasText:'Rep steps'}).locator('.t').click();await p.waitForTimeout(450);ok(await sh().locator('.step .tick').count()===0,'no tick on repeating edit');await sh().getByRole('button',{name:'Cancel'}).click();await p.waitForTimeout(350);
// one-off edit shows tick
await R(()=>{window.__lifeos.App.state.sel=window.__lifeos.todayK();window.__lifeos.App.refresh();});await p.waitForTimeout(150);await p.locator('.trow',{hasText:'Steps test'}).locator('.t').click();await p.waitForTimeout(450);ok(await sh().locator('.step .tick').count()===16,'tick on one-off edit');await sh().getByRole('button',{name:'Cancel'}).click();await p.waitForTimeout(350);
// routine reorder
await R(()=>window.__lifeos.App.go('routines'));await p.waitForTimeout(150);await p.locator('button[aria-label="New routine"]').first().click();await p.waitForTimeout(450);await sh().getByRole('button',{name:'Morning',exact:true}).click();await p.waitForTimeout(120);await p.screenshot({path:'test/st-routine.png'});
const rv=()=>sh().locator('.rtstep .l1 input').evaluateAll(n=>n.map(x=>x.value));const before=await rv();const ha=await sh().locator('.rtstep .h').nth(0).boundingBox(),hz=await sh().locator('.rtstep .h').nth(1).boundingBox();const rx=ha.x+ha.width/2;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:rx,y:ha.y+20}]});for(let i=1;i<=8;i++){await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:rx,y:ha.y+20+(hz.y+34-ha.y)*i/8}]});await p.waitForTimeout(25);}await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.waitForTimeout(150);const after=await rv();ok(after[0]===before[1]&&after[1]===before[0],'routine reorder '+after);
console.log(JSON.stringify({pass,fails,errs},null,1));await b.close();})().catch(e=>{console.log('CRASH',e.message.slice(0,500),JSON.stringify({pass,fails}));process.exit(1);});
