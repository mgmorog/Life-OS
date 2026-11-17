const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();await p.goto('file://'+process.cwd()+'/test/page.html');await p.waitForTimeout(400);
for(const [v,a] of [['setpage',{id:'areas'}],['areas',null]]){await p.evaluate(([v,a])=>window.__lifeos.App.go(v,a),[v,a]);await p.waitForTimeout(300);console.log(v,await p.evaluate(()=>[...document.querySelectorAll('.page header')].map(h=>h.textContent.slice(0,60))));}
await b.close();})();
