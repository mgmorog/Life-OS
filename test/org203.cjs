const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 fs.writeFileSync('test/page.html',fs.readFileSync('test/page.html','utf8').replace(/<body>[\s\S]*$/,'<body>')+fs.readFileSync('life-os.html','utf8')+'</body></html>');
 await p.goto('file://'+process.cwd()+'/test/page.html');await p.waitForTimeout(400);
 await p.evaluate(()=>window.__lifeos.loadDemo(true));await p.waitForTimeout(400);
 const L=window=>0;const go=async(v,a)=>{await p.evaluate(([v,a])=>window.__lifeos.App.go(v,a),[v,a]);await p.waitForTimeout(250);};
 const shot=async n=>{await p.screenshot({path:`/home/claude/shots/${n}.png`,fullPage:true});};
 const first=k=>p.evaluate(k=>{const g=window.__lifeos.get.all(k);const r=g.find(x=>k==='project'?window.__lifeos.get.all('task').some(t=>t.part===x.id):k==='goal'?(x.steps||[]).length:k==='list'?(x.items||[]).length:true)||g[0];return r&&r.id;},k);
 await go('plan',{id:await first('project')});await shot('project');
 await go('plan',{id:await first('goal')});await shot('goal');
 await go('routine',{id:await first('routine')});await shot('routine');
 await go('list',{id:await first('list')});await shot('list');
 await go('inbox');await shot('inbox');
 await p.locator('.otidy').first().click();await p.waitForTimeout(500);await shot('tidy');
 await p.getByRole('button',{name:'Something else…'}).click();await p.waitForTimeout(200);await shot('tidy2');
 await p.keyboard.press('Escape');await p.waitForTimeout(400);
 await p.evaluate(()=>{});
 for(const [n,v] of [['newproject','projects'],['newgoal','goals'],['newroutine','routines']]){await p.goto('file://'+process.cwd()+'/test/page.html');await p.waitForTimeout(300);await go(v);const btn=p.locator('.oadd').first();if(await btn.count()){await btn.click();await p.waitForTimeout(600);const sh=p.locator('.sheet').last();await sh.evaluate(x=>{x.style.maxHeight='none';x.style.height='auto';x.querySelectorAll('*').forEach(c=>{if(getComputedStyle(c).overflowY==='auto'){c.style.overflow='visible';c.style.maxHeight='none';}});});await p.setViewportSize({width:390,height:1700});await p.waitForTimeout(200);await shot(n);await p.setViewportSize({width:390,height:844});}else errs.push('no add '+v);}
 console.log(JSON.stringify(errs));await b.close();})();
