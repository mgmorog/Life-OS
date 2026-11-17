// Fill the app with extreme data and screenshot every organize hub and subpage.
const {chromium}=require('playwright');const fs=require('fs');const OUT=process.argv[2]||'/home/claude/stress/after';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message+' @ '+(e.stack||'').split('\n').slice(1,4).join(' | ')));
 const url='file://'+process.cwd()+'/test/page.html';
 const go=async(v,a)=>{await p.evaluate(([v,a])=>window.__lifeos.App.go(v,a),[v,a]);await p.waitForTimeout(300);};
 const shot=async n=>{await p.evaluate(()=>document.querySelectorAll('#toast').forEach(x=>x.style.display='none'));await p.screenshot({path:`${OUT}/${n}.png`,fullPage:true});};
 // empty states first
 await p.goto(url);await p.waitForTimeout(400);
 for(const v of ['inbox','tasks','habits','routines','projects','goals','lists']){await go(v);await shot('empty-'+v);}
 await p.goto(url);await p.waitForTimeout(400);await p.evaluate(()=>window.__lifeos.loadDemo(true));await p.waitForTimeout(300);
 const ids=await p.evaluate(fs.readFileSync(__dirname+'/stress-seed.js','utf8')+'()');
 for(const v of ['inbox','tasks','habits','routines','projects','goals','lists']){await go(v);await shot('full-'+v);}
 for(const [n,v,id] of [['proj','plan',ids.P],['projempty','plan',ids.E],['goal','plan',ids.G],['goalnum','plan',ids.GN],['goaldone','plan',ids.GD],['routine','routine',ids.R],['list','list',ids.L],['habit','habit',ids.H]]){await go(v,{id});await shot('sub-'+n);}
 // open folds on the big project
 await go('plan',{id:ids.P});await p.locator('.donefold').first().click().catch(()=>{});await p.waitForTimeout(300);await shot('sub-proj-done');
 // tidy
 await go('inbox');await p.locator('.otidy').first().click().catch(e=>errs.push('tidy '+e.message));await p.waitForTimeout(500);await p.screenshot({path:`${OUT}/act-tidy.png`});
 await p.getByRole('button',{name:'Something else…'}).click().catch(()=>{});await p.waitForTimeout(300);await p.screenshot({path:`${OUT}/act-tidy2.png`,fullPage:true});
 // edit sheets on extremes
 for(const [n,v,id] of [['editproj','plan',ids.P],['editgoal','plan',ids.G],['editroutine','routine',ids.R]]){await p.goto(url);await p.waitForTimeout(300);await go(v,{id});await p.locator('.pghead button').last().click().catch(()=>{});await p.waitForTimeout(400);await p.screenshot({path:`${OUT}/act-menu-${n}.png`});}
 fs.writeFileSync(`${OUT}/errs.json`,JSON.stringify(errs,null,1));console.log(errs.length+' errors',JSON.stringify(errs).slice(0,600));await b.close();})();
