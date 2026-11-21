const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:390,height:844},hasTouch:true});
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+__dirname+'/page.html');await p.waitForTimeout(800);
await p.evaluate(()=>window.__lifeos.loadDemo&&window.__lifeos.loadDemo());await p.waitForTimeout(400);
const ok=(n,v,x)=>console.log((v?'PASS ':'FAIL ')+n+(x!==undefined&&!v?' → '+JSON.stringify(x):''));
const L='window.__lifeos';
// Field date opens the Life OS calendar
await p.evaluate(()=>{const X=window.__lifeos.fx;window._saved=null;X.askFields({title:'Test',fields:[X.F('what','Name'),X.F('when','When','date'),X.F('at','At','time')],D:{what:'x'},save:D=>window._saved=D});});
await p.waitForTimeout(400);
ok('no native date/time inputs in forms',await p.evaluate(()=>!document.querySelector('.sheet input[type=date],.sheet input[type=time]')));
await p.click('.fpk >> nth=0');await p.waitForTimeout(400);
ok('calendar sheet opens',await p.evaluate(()=>!!document.querySelector('.cal .cg')));
await p.evaluate(()=>{const bs=[...document.querySelectorAll('.cal .cg button:not(.out)')];bs[14].click();});await p.waitForTimeout(500);
ok('date picked shows on field',await p.evaluate(()=>!document.querySelector('.fpk').classList.contains('empty')),await p.evaluate(()=>document.querySelector('.fpk').textContent));
await p.screenshot({path:'/tmp/v236_field.png'});
await p.keyboard.press('Escape');await p.waitForTimeout(400);await p.keyboard.press('Escape');await p.waitForTimeout(400);
// Picker
await p.evaluate(()=>{window._pick=null;window.__lifeos.fx.Picker({title:'Pick',items:Array.from({length:12},(_,i)=>[i,'Item '+i]),onPick:v=>window._pick=v});});await p.waitForTimeout(400);
ok('picker has search past 8',await p.evaluate(()=>!!document.querySelector('.sheet .sfield input')));
await p.fill('.sheet .sfield input','m 11');await p.waitForTimeout(200);
await p.evaluate(()=>{const r=[...document.querySelectorAll('.sheet .li')].find(x=>x.textContent.includes('Item 11'));r&&r.click();});await p.waitForTimeout(400);
ok('picker returns pick',await p.evaluate(()=>window._pick===11),await p.evaluate(()=>window._pick));
await p.evaluate(()=>{window.__lifeos.fx.scPickSheet();});await p.waitForTimeout(400);
ok('multi picker has one Save button',await p.evaluate(()=>[...[...document.querySelectorAll('.sheet')].pop().querySelectorAll('button')].filter(b=>/^(Save|Done)$/.test(b.textContent.trim())).length===1));
await p.keyboard.press('Escape');await p.waitForTimeout(400);
// Switch: whole row toggles
const sw=await p.evaluate(()=>{let v=null;const r=window.__lifeos.fx.Switch({on:false,label:'Test',onChange:x=>v=x});document.body.append(r);r.querySelector('.grow').click();const k=r.querySelector('.sw');const out=[v,k.getAttribute('aria-checked'),k.getAttribute('role')];r.remove();return out;});
ok('tapping the row flips the switch',sw[0]===true&&sw[1]==='true'&&sw[2]==='switch',sw);
// Segmented arrow keys
await p.evaluate(()=>window.__lifeos.App.go('calendar'));await p.waitForTimeout(400);
const seg=await p.evaluate(async()=>{const s=document.querySelector('#view .seg');const bs=[...s.querySelectorAll('button')];const i=bs.findIndex(b=>b.classList.contains('on'));bs[i].focus();s.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true}));return i;});
await p.waitForTimeout(500);
ok('arrow key moves segment',await p.evaluate(i=>{const s=document.querySelector('#view .seg');const bs=[...s.querySelectorAll('button')];return bs.findIndex(b=>b.classList.contains('on'))!==i;},seg));
// Focus timer
const tid=await p.evaluate(()=>{const X=window.__lifeos;const t=X.create('task',{title:'Write grant summary',date:X.todayK()});return t.id;});
await p.evaluate(id=>window.__lifeos.fx.focusLenSheet(window.__lifeos.get.id(id)),tid);await p.waitForTimeout(400);
ok('focus length sheet offers 25 and 50',await p.evaluate(()=>{const t=[...document.querySelectorAll('.sheet')].pop().textContent;return t.includes('25 min')&&t.includes('50 min')&&t.includes('Your own');}));
await p.evaluate(()=>[...document.querySelectorAll('.sheet button')].find(b=>b.textContent.trim()==='50 min').click());await p.waitForTimeout(600);
ok('timer runs with 50 min',await p.evaluate(()=>{const fr=window.__lifeos.get.settings().focusRun;return fr&&fr.plan===50;}));
await p.evaluate(()=>window.__lifeos.App.go('tasks'));await p.waitForTimeout(500);
ok('countdown pill on other pages',await p.evaluate(()=>{const n=document.querySelector('#fr-top');return n&&/\d+:\d\d/.test(n.textContent);}),await p.evaluate(()=>document.querySelector('#fr-top')&&document.querySelector('#fr-top').textContent));
await p.screenshot({path:'/tmp/v236_focus.png'});
ok('PWA schedule includes focus end',await p.evaluate(()=>window.__lifeos.fx.PWA.upcoming().some(x=>x.key.startsWith('focus|'))));
await p.evaluate(()=>window.__lifeos.fx.finishFocus({discard:true}));await p.waitForTimeout(300);
// Select several: tasks hold menu Select + project move
await p.evaluate(()=>{const X=window.__lifeos;X.create('project',{title:'Q4 closeouts'});X.App.state.taskSel=new Set();X.App.refresh();});await p.waitForTimeout(500);
await p.evaluate(()=>{const rows=[...document.querySelectorAll('#view .tsel')];rows.slice(0,2).forEach(r=>r.click());});await p.waitForTimeout(300);
await p.evaluate(()=>{const rows=[...document.querySelectorAll('#view .tsel')];rows[1]&&rows[1].click();});await p.waitForTimeout(300);
const selN=await p.evaluate(()=>window.__lifeos.App.state.taskSel.size);
const bar=await p.evaluate(()=>{const s=document.querySelector('.selbar');if(!s)return null;const r=s.getBoundingClientRect();return {bottom:r.bottom,h:innerHeight,txt:s.textContent};});
ok('selection bar at the bottom',bar&&bar.bottom>bar.h-140,bar);
await p.screenshot({path:'/tmp/v236_select.png'});
await p.evaluate(()=>[...document.querySelectorAll('.selbar .chip')].find(c=>c.textContent.startsWith('Project')).click());await p.waitForTimeout(400);
await p.evaluate(()=>{const r=[...document.querySelectorAll('.sheet .li')].find(x=>x.textContent.includes('Q4 closeouts'));r.click();});await p.waitForTimeout(500);
ok('tasks moved to project',await p.evaluate(n=>{const X=window.__lifeos,pr=X.get.all('project').find(p=>p.title==='Q4 closeouts');return X.get.all('task').filter(t=>t.part===pr.id).length===n&&n>0;},selN),selN);
// list select
const lid=await p.evaluate(()=>{const X=window.__lifeos;const l=X.create('list',{title:'Groceries test',items:[{id:'a',t:'Eggs',d:false},{id:'b',t:'Milk',d:false},{id:'c',t:'Bread',d:false}],sections:[]});X.App.go('list',{id:l.id});return l.id;});await p.waitForTimeout(500);
await p.evaluate(id=>{window.__lifeos.App.state.listSel={id,set:new Set(['a','b'])};window.__lifeos.App.refresh();},lid);await p.waitForTimeout(400);
await p.evaluate(()=>[...document.querySelectorAll('.selbar .chip')].find(c=>c.textContent==='Check off').click());await p.waitForTimeout(400);
ok('list items checked off together',await p.evaluate(id=>window.__lifeos.get.id(id).items.filter(i=>i.d).length===2,lid));
// travel time
const bid=await p.evaluate(()=>{const X=window.__lifeos;const r=X.create('block',{title:'Dentist',date:X.todayK(),start:23*60,dur:30,travel:30,color:'green',repeat:{type:'never'}});return r.id;});
await p.evaluate(()=>{window.__lifeos.App.state.sel=window.__lifeos.todayK();window.__lifeos.App.state.gridOpen=true;window.__lifeos.App.go('today');});await p.waitForTimeout(600);
ok('travel band before the block',await p.evaluate(()=>!!document.querySelector('.travelband')),null);
ok('leave-now reminder scheduled',await p.evaluate(()=>window.__lifeos.fx.PWA.upcoming().some(x=>x.key.startsWith('leave|'))));
ok('next free slot respects travel',await p.evaluate(()=>{const X=window.__lifeos,s=X.fx.nextFreeSlot(X.todayK(),60);return !(s<23*60+30&&s+60>22*60+30);}));
await p.evaluate(id=>window.__lifeos.fx.blockSheet(window.__lifeos.get.id(id)),bid);await p.waitForTimeout(500);
ok('block sheet has Travel time row',await p.evaluate(()=>[...document.querySelectorAll('.sheet')].pop().textContent.includes('Travel time')));
await p.keyboard.press('Escape');await p.waitForTimeout(300);
// year in review
ok('year highlights compute',await p.evaluate(()=>{const h=window.__lifeos.fx.yirHighlights(new Date().getFullYear());return h&&typeof h==='object';}),await p.evaluate(()=>window.__lifeos.fx.yirHighlights(new Date().getFullYear())));
await p.evaluate(()=>{const X=window.__lifeos;X.App.state.yirYear=new Date().getFullYear();X.App.go('tool',{hub:'Personal growth',tool:'yir'});});await p.waitForTimeout(600);
ok('highlights card on the review page',await p.evaluate(()=>document.body.textContent.includes('Highlights')&&document.body.textContent.includes('Save as image')));
await p.screenshot({path:'/tmp/v236_yir.png',fullPage:false});
ok('no page errors',errs.length===0,errs.slice(0,3));
await b.close();})();
