// Today and Calendar screenshots with the demo data.
const {chromium}=require('playwright');const fs=require('fs');const OUT=process.argv[2];fs.mkdirSync(OUT,{recursive:true});
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 const url='file://'+process.cwd()+'/test/page.html';await p.goto(url);await p.waitForTimeout(400);await p.evaluate(()=>window.__lifeos.loadDemo(true));await p.waitForTimeout(300);
 const go=async(v,a)=>{await p.evaluate(([v,a])=>window.__lifeos.App.go(v,a),[v,a]);await p.waitForTimeout(400);};
 const shot=async(n,full=true)=>{await p.evaluate(()=>{const t=document.querySelector('#toast');if(t)t.style.display='none';});await p.screenshot({path:`${OUT}/${n}.png`,fullPage:full});};
 await go('today');await shot('today');
 await go('calendar');await shot('cal-default');
 for(const m of ['week','month','quarter']){await p.evaluate(m=>{const L=window.__lifeos;const S=L.App.state;S.cal=Object.assign(S.cal||{},{mode:m});L.App.refresh();},m);await p.waitForTimeout(400);await shot('cal-'+m);}
 console.log(errs.length+' errors '+JSON.stringify(errs).slice(0,300));await b.close();})();
