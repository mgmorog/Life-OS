const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});const p=await c.newPage();const url='file://'+process.cwd()+'/test/page.html';
 await p.goto(url);await p.waitForTimeout(400);await p.evaluate(()=>window.__lifeos.loadDemo(true));await p.waitForTimeout(300);
 const ids=await p.evaluate(fs.readFileSync(__dirname+'/stress-seed.js','utf8')+'()');
 const v=process.argv[2],arg=process.argv[3]?{id:ids[process.argv[3]]}:undefined;await p.evaluate(([v,a])=>window.__lifeos.App.go(v,a),[v,arg]);await p.waitForTimeout(300);
 console.log(await p.evaluate(process.argv[4]||'document.documentElement.scrollHeight'));await b.close();})();
