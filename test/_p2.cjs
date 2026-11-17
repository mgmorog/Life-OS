const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('file:///home/claude/life-os/test/page.html');await p.waitForTimeout(300);await p.evaluate(()=>window.__lifeos.loadDemo(true));
await p.evaluate(()=>window.__lifeos.App.go('tool',{hub:'Career',tool:'certs'}));await p.waitForTimeout(300);
console.log(await p.evaluate(()=>document.querySelector('.page header').outerHTML.slice(0,1500)));await b.close();})();
