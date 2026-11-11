const {chromium}=require('playwright');
(async()=>{
 const b=await chromium.launch();
 const results=[];
 for(const [name,vp,touch] of [['phone',{width:390,height:844},true],['wide',{width:1280,height:800},false]]){
  const c=await b.newContext({viewport:vp,hasTouch:touch,isMobile:touch});
  const p=await c.newPage();const errs=[];
  p.on('pageerror',e=>errs.push('PAGEERR '+e.message));p.on('console',m=>{if(m.type()==='error'&&!/fonts|ERR_|Failed to load/.test(m.text()))errs.push('CONSOLE '+m.text());});
  const wrap=`<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;box-sizing:border-box}body{margin:0;font:14px sans-serif}img{max-width:100%}[hidden]{display:none!important}</style></head><body>`+require('fs').readFileSync('life-os.html','utf8')+`</body></html>`;
  require('fs').writeFileSync('test/page.html',wrap);
  await p.goto('file://'+process.cwd()+'/test/page.html');await p.waitForTimeout(400);
  await p.screenshot({path:`test/${name}-empty.png`});
  // load examples
  await p.evaluate(()=>{});
  await p.getByRole('button',{name:'Load examples'}).click();await p.waitForTimeout(300);
  await p.screenshot({path:`test/${name}-today.png`,fullPage:true});
  const views=['studio','calendar','more','inbox','tasks','habits','goals','projects','routines','lists','areas','reviews','review','insights','discover','tools','archive','prefs','foundation','search','organize','reflect'];
  for(const v of views){await p.evaluate(x=>window.__lifeos.App.go(x),v);await p.waitForTimeout(120);
   const o=await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);if(o)errs.push('OVERFLOW '+v);
   if(['studio','calendar','more','discover','prefs','inbox','habits','search'].includes(v))await p.screenshot({path:`test/${name}-${v}.png`,fullPage:true});}
  // calendar modes
  await p.evaluate(()=>window.__lifeos.App.go('calendar'));
  for(const m of ['Month','Week']){await p.getByRole('button',{name:m,exact:true}).click();await p.waitForTimeout(150);await p.screenshot({path:`test/${name}-cal-${m}.png`,fullPage:true});if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))errs.push('OVERFLOW cal '+m);}
  results.push([name,errs]);await c.close();
 }
 console.log(JSON.stringify(results,null,1));await b.close();
})();
