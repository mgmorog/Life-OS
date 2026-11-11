const {chromium}=require('playwright');const fs=require('fs');
const fails=[];const ok=(c,m)=>{if(!c)fails.push(m);};
// in-memory stand-in for the db + user capabilities, to exercise the real sync path
const mock=`window.__docs=window.__docs||{};(function(){const docs=JSON.parse(localStorage.getItem('MOCKDB')||'{}');window.__writes=0;const subs=[];
function snap(){const ds=Object.keys(docs).map(id=>({id,data:()=>Object.freeze(JSON.parse(JSON.stringify(docs[id]))),metadata:{fromCache:false}}));return{docs:ds,size:ds.length,empty:!ds.length,metadata:{fromCache:false},docChanges:()=>[]};}
const persist=()=>localStorage.setItem('MOCKDB',JSON.stringify(docs));
const coll={doc:id=>({set:async d=>{docs[id]=d;window.__writes++;persist();},delete:async()=>{delete docs[id];persist();}}),onSnapshot:(n)=>{setTimeout(()=>n(snap()),30);return()=>{};}};
window.claude={use:async n=>n==='user'?{id:async()=>'u1'}:n==='db'?{collection:p=>{if(p!=='data/users/u1')throw new Error('bad path '+p);return coll;}}:null};})();`;
(async()=>{
 const b=await chromium.launch();
 const wrap=fs.readFileSync('test/page.html','utf8').replace(/<body>[\s\S]*$/,'')+'<body>'+`<script>${mock}</script>`+fs.readFileSync('life-os.html','utf8')+'</body></html>';
 fs.writeFileSync('test/page2.html',wrap);
 const c=await b.newContext({viewport:{width:390,height:844},hasTouch:false});
 const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+process.cwd()+'/test/page2.html');await p.waitForTimeout(300);
 const text=()=>p.evaluate(()=>document.body.innerText);
 // task
 await p.getByRole('button',{name:'+ Task'}).first().click();await p.waitForTimeout(400);
 ok(await p.evaluate(()=>document.activeElement.id)==='f-task-title','title focused');
 await p.keyboard.type('Buy stamps');
 await p.getByRole('button',{name:'Add a step'}).click();await p.keyboard.type('Find a post office');await p.keyboard.press('Enter');await p.keyboard.type('Go');
 await p.getByRole('switch',{name:'Set a time'}).click();await p.waitForTimeout(250);
 await p.screenshot({path:'test/f-task.png'});
 await p.getByRole('switch',{name:'Repeat'}).click();await p.waitForTimeout(250);await p.screenshot({path:'test/f-task2.png'});
 await p.getByRole('switch',{name:'Repeat'}).click();
 await p.getByRole('switch',{name:'Set a deadline'}).click();await p.getByRole('switch',{name:'Set a deadline'}).click();
 await p.getByRole('button',{name:'Add',exact:true}).click();await p.waitForTimeout(500);
 await p.screenshot({path:'test/f-after.png'});ok((await text()).includes('Buy stamps'),'task in today');
 // reminder default on timed task, steps stored
 let t=await p.evaluate(()=>[...window.__lifeos.recs.values()].find(r=>r.title==='Buy stamps'));ok(t&&t.time!=null&&t.steps.length===2&&t.reminder===0,'task fields '+JSON.stringify(t));
 // discard guard
 await p.getByRole('button',{name:'+ Task'}).first().click();await p.waitForTimeout(350);await p.keyboard.type('x');await p.getByRole('button',{name:'Cancel'}).click();await p.waitForTimeout(350);
 ok((await text()).includes('Discard this task?'),'discard prompt');await p.getByRole('button',{name:'Discard'}).click();await p.waitForTimeout(450);
 ok(await p.evaluate(()=>![...window.__lifeos.recs.values()].some(r=>r.title==='x')),'discarded');
 // block + custom hex + icon
 await p.getByRole('button',{name:'+ Time block'}).first().click();await p.waitForTimeout(350);await p.keyboard.type('Deep work');
 await p.getByText('Appearance',{exact:true}).click();await p.waitForTimeout(150);await p.fill('#hex-input','#123ABC');await p.getByText('Icon',{exact:true}).click();await p.waitForTimeout(150);await p.getByRole('button',{name:'Work',exact:true}).click();await p.waitForTimeout(100);
 await p.screenshot({path:'test/f-block.png'});
 await p.getByRole('button',{name:'Add',exact:true}).click();await p.waitForTimeout(500);
 t=await p.evaluate(()=>[...window.__lifeos.recs.values()].find(r=>r.title==='Deep work'));ok(t&&t.color==='#123ABC'&&t.icon==='brief','block look '+JSON.stringify(t));
 // all-day
 await p.getByRole('button',{name:'+ All-day'}).first().click();await p.waitForTimeout(350);await p.keyboard.type('Anniversary');await p.getByRole('switch',{name:'Repeat'}).click();await p.waitForTimeout(100);await p.getByRole('button',{name:'Yearly'}).click();await p.screenshot({path:'test/f-allday.png'});await p.getByRole('button',{name:'Add',exact:true}).click();await p.waitForTimeout(500);
 ok((await p.locator('.adchip').count())===1,'all-day chip');
 // capture → inbox, photo-less, then turn into task
 await p.getByRole('button',{name:'Quick capture'}).click();await p.waitForTimeout(350);await p.keyboard.type('Ceramics class');await p.screenshot({path:'test/f-capture.png'});await p.getByRole('button',{name:'Save',exact:true}).click();await p.waitForTimeout(500);
 ok(await p.locator('.badge').first().innerText()==='1','inbox badge');
 await p.getByRole('button',{name:/Inbox, 1/}).click();await p.waitForTimeout(250);await p.getByText('Ceramics class').click();await p.waitForTimeout(400);await p.screenshot({path:'test/f-idea.png'});
 await p.locator('.sheet.on .tl',{hasText:'Task'}).first().click();await p.waitForTimeout(700);await p.getByRole('button',{name:'Add',exact:true}).click();await p.waitForTimeout(500);
 const st=await p.evaluate(()=>({ideas:window.__lifeos.get.all('idea').length,t:window.__lifeos.get.all('task').some(r=>r.title==='Ceramics class'&&r.date===null)}));ok(st.ideas===0&&st.t,'idea→task '+JSON.stringify(st));
 // tick
 await p.evaluate(()=>window.__lifeos.App.go('today'));await p.waitForTimeout(250);
 await p.evaluate(()=>{const n=window.__lifeos.create('task',{title:'Tick me',steps:[],date:window.__lifeos.todayK(),time:null,repeat:{type:'never',end:null},priority:'normal'});});await p.waitForTimeout(100);

 await p.locator('.trow',{hasText:'Tick me'}).locator('.tick').click({timeout:4000});await p.waitForTimeout(800);
 ok(await p.evaluate(()=>{const t=window.__lifeos.get.all('task').find(r=>r.title==='Tick me');return !!t.doneDates[window.__lifeos.todayK()];}),'tick stored');
 // studio tap-to-place
 await p.evaluate(()=>window.__lifeos.App.go('studio'));await p.waitForTimeout(250);
 await p.locator('.scard',{hasText:'Ceramics class'}).click();await p.waitForTimeout(120);
 await p.locator('.slot:not(.past)').last().getByRole('button',{name:'Place here'}).click();await p.waitForTimeout(250);
 ok(await p.evaluate(()=>!!window.__lifeos.get.all('task').find(r=>r.title==='Ceramics class').date),'studio placed');
 // bottom bar + persistence after reload, from real writes
 await p.evaluate(()=>window.__lifeos.App.go('prefs'));await p.waitForTimeout(200);await p.getByText('Bottom bar').click();await p.waitForTimeout(350);await p.locator('.sheet.on').getByRole('button',{name:'Remove Studio'}).click();await p.waitForTimeout(120);await p.locator('.sheet.on .li',{hasText:'Inbox'}).click();await p.waitForTimeout(120);await p.getByRole('button',{name:'Done'}).click();await p.waitForTimeout(600);
 ok((await p.locator('.nav .tab',{hasText:'Inbox'}).count())===1,'nav favorite');
 await p.waitForTimeout(600);
 const w=await p.evaluate(()=>window.__writes);ok(w>5,'writes reached db '+w);
 await p.evaluate(()=>localStorage.removeItem('lifeos-v1'));
 await p.reload();await p.waitForTimeout(500);
 ok((await p.evaluate(()=>window.__lifeos.store.mode))==='synced','synced');
 ok(await p.evaluate(()=>window.__lifeos.get.all('task').some(r=>r.title==='Buy stamps')),'task survives reload with no local copy');
 ok((await p.locator('.nav .tab',{hasText:'Inbox'}).count())===1,'nav survives');
 // wide: mouse drag in Studio and Today
 const c2=await b.newContext({viewport:{width:1280,height:800}});const q=await c2.newPage();q.on('pageerror',e=>errs.push('W '+e.message));
 await q.goto('file://'+process.cwd()+'/test/page.html');await q.waitForTimeout(300);await q.getByRole('button',{name:'Load examples'}).click();await q.waitForTimeout(200);
 const anyT=await q.locator('.trow',{hasText:'pharmacy'}).boundingBox(),g=await q.locator('#grid').boundingBox();
 await q.mouse.move(anyT.x+150,anyT.y+20);await q.mouse.down();await q.mouse.move(anyT.x+160,anyT.y+40,{steps:3});await q.mouse.move(g.x+200,g.y+100,{steps:6});await q.waitForTimeout(100);await q.screenshot({path:'test/f-drag.png'});await q.mouse.up();await q.waitForTimeout(250);
 ok(await q.evaluate(()=>window.__lifeos.get.all('task').find(r=>/pharmacy/.test(r.title)).time!=null),'drag onto grid sets a time');
 await q.evaluate(()=>window.__lifeos.App.go('studio'));await q.waitForTimeout(250);
 const cd=await q.locator('.scard',{hasText:'Run (example)'}).first().boundingBox(),sl=await q.locator('.slot:not(.past)').last().boundingBox();
 await q.mouse.move(cd.x+40,cd.y+20);await q.mouse.down();await q.mouse.move(cd.x+60,cd.y+30,{steps:3});await q.mouse.move(sl.x+50,sl.y+30,{steps:6});await q.mouse.up();await q.waitForTimeout(250);
 ok(await q.evaluate(()=>Object.keys(window.__lifeos.get.all('habit').find(h=>/Run/.test(h.title)).sessions).length===1),'studio drag places a habit');
 await q.getByRole('button',{name:/Suggest/}).click();await q.waitForTimeout(200);await q.screenshot({path:'test/f-suggest.png'});
 ok((await q.locator('.pl.ghosted').count())>0,'suggest shows ghosts');await q.getByRole('button',{name:'Keep all'}).click();await q.waitForTimeout(200);
 await q.getByRole('button',{name:'Commit week'}).click();await q.waitForTimeout(350);await q.screenshot({path:'test/f-review.png'});await q.locator('.sheet.on').getByRole('button',{name:'Commit week'}).click();await q.waitForTimeout(500);ok((await q.getByRole('button',{name:'Replan'}).count())===1,'commit');
 // context menu
 await q.evaluate(()=>window.__lifeos.App.go('today'));await q.waitForTimeout(200);await q.locator('.blk').first().click({button:'right'});await q.waitForTimeout(120);ok(await q.locator('.menu').count()===1,'right-click menu');await q.keyboard.press('Escape');
 console.log(JSON.stringify({fails,errs,sel:await q.evaluate(()=>window.__lifeos.App.state.sel===window.__lifeos.todayK())},null,1));await b.close();
})().catch(e=>{console.log('CRASH',e.message,JSON.stringify(fails));process.exit(1);});
