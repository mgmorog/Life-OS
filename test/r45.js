const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/page.html');await p.waitForTimeout(500);
let pass=0;const fails=[];const ok=(c,m)=>{if(c)pass++;else fails.push(m);};const R=(f,a)=>p.evaluate(f,a);const text=()=>p.locator('#view').innerText();
await R(()=>{const L=window.__lifeos;L.put(Object.assign({},L.get.settings(),{introDone:true}),{silent:true});L.App.go('lists');});await p.waitForTimeout(250);
ok(/Start from/i.test(await text()),'templates on empty');await p.locator('#view .chip',{hasText:'Packing'}).click();await p.waitForTimeout(400);
let t=await text();ok(/Packing/.test(t)&&/Chargers/.test(t),'template made');ok(await R(()=>{const l=window.__lifeos.get.all('list')[0];return l.reusable&&l.packTpl;}),'packing reusable');
await p.locator('.li',{hasText:'Chargers'}).locator('.tick').click();await p.waitForTimeout(300);ok(!(await p.locator('#toast.on').count()),'no toast on check');
await p.waitForTimeout(900);ok(/Checked · 1/i.test(await text()),'moved to checked');
ok(!errs.length,'errs '+errs);console.log(JSON.stringify({pass,fails},null,1));await b.close();})().catch(e=>{console.log('CRASH',e.message.slice(0,500));process.exit(1);});
