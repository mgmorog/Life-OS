// node sheetshots.cjs <appdir> <outdir>  — screenshots of sheets and pages touched by the v207 fixes
const {chromium}=require('playwright');const fs=require('fs');
const DIR=process.argv[2],OUT=process.argv[3];fs.mkdirSync(OUT,{recursive:true});
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 const url='file://'+DIR+'/test/page.html';
 const go=async(v,a)=>{await p.evaluate(([v,a])=>window.__lifeos.App.go(v,a),[v,a]);await p.waitForTimeout(350);};
 const hideToast=()=>p.evaluate(()=>{const t=document.querySelector('#toast');if(t)t.style.display='none';});
 const shot=async(n,full=false)=>{await hideToast();await p.screenshot({path:`${OUT}/${n}.png`,fullPage:full});};
 const sheetShot=async n=>{await p.waitForTimeout(500);await hideToast();await p.evaluate(()=>{const sh=[...document.querySelectorAll('.sheet')].pop();if(!sh)return;sh.style.maxHeight='none';sh.style.height='auto';sh.style.position='absolute';sh.style.top='0';sh.style.bottom='auto';sh.querySelectorAll('*').forEach(x=>{const cs=getComputedStyle(x);if(cs.overflowY==='auto'||cs.overflowY==='scroll'){x.style.overflow='visible';x.style.maxHeight='none';x.style.height='auto';}});});await p.waitForTimeout(150);
   const h=await p.evaluate(()=>{const sh=[...document.querySelectorAll('.sheet')].pop();return sh?Math.ceil(sh.getBoundingClientRect().bottom)+20:900;});await p.setViewportSize({width:390,height:Math.max(844,h)});await p.waitForTimeout(200);await p.screenshot({path:`${OUT}/${n}.png`});await p.setViewportSize({width:390,height:844});};
 const close=async()=>{await p.goto(url);await p.waitForTimeout(350);};
 // empty states
 await p.goto(url);await p.waitForTimeout(400);
 for(const v of ['inbox','routines','lists'])await go(v),await shot('empty-'+v);
 await p.evaluate(()=>window.__lifeos.loadDemo(true));await p.waitForTimeout(300);
 await go('tasks');await shot('hub-tasks');await go('projects');await shot('hub-projects');await go('inbox');await shot('hub-inbox');
 const S=n=>p.evaluate(n=>window.__lifeos.sheets[n](null),n);
 // task with repeat on
 await close();await S('task');await p.waitForTimeout(500);
 await p.evaluate(()=>{const rows=[...document.querySelectorAll('.sheet .row')];const r=rows.find(x=>/Repeat/.test(x.textContent));const sw=r&&r.querySelector('.sw,[role=switch],input[type=checkbox],button.switch');if(sw)sw.click();});await p.waitForTimeout(500);await sheetShot('sheet-task');
 await close();await S('habit');await p.waitForTimeout(500);
 await p.evaluate(()=>{const b=[...document.querySelectorAll('.sheet button,.sheet .row')].find(x=>/^Days of the week$|^Specific days$|^On set days$/.test(x.textContent.trim()));if(b)b.click();});await p.waitForTimeout(300);
 await p.evaluate(()=>{const r=[...document.querySelectorAll('.sheet .row')].find(x=>/Appearance/.test(x.textContent));if(r)r.click();});await p.waitForTimeout(400);await sheetShot('sheet-habit');
 await close();await S('goal');await sheetShot('sheet-goal');
 await close();await S('project');await sheetShot('sheet-project');
 await close();await S('routine');await p.waitForTimeout(400);
 await p.evaluate(()=>{const b=[...document.querySelectorAll('.sheet button')].find(x=>x.textContent.trim()==='Days of the week');if(b)b.click();});await p.waitForTimeout(400);await sheetShot('sheet-routine');
  await close();
 // pages
 const ids=await p.evaluate(()=>{const g=window.__lifeos.get,f=(k,fn)=>{const r=g.all(k).find(fn||(()=>true));return r&&r.id;};const P=f('project',x=>/Q1 Workday/.test(x.title));const pr=g.id(P);if(pr&&!pr.notes){pr.notes='Grants are live in the new system and every report matches.';window.__lifeos.put(pr,{silent:true});}const G=f('goal',x=>(x.steps||[]).length>2);const gr=g.id(G);if(gr&&!gr.notes){gr.notes='So I can run without stopping by spring.';window.__lifeos.put(gr,{silent:true});}const L=window.__lifeos.create('list',{title:'Test',items:[],reusable:false});return{P,G,L:L.id};});
 await go('plan',{id:ids.P});await shot('page-project',true);await go('plan',{id:ids.G});await shot('page-goal',true);await go('list',{id:ids.L});await shot('page-list');
 console.log(errs.length+' errors '+JSON.stringify(errs).slice(0,300));await b.close();})();
