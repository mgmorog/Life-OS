// Screenshot every organize hub and subpage with the demo data (what the owner actually sees).
const {chromium}=require('playwright');const fs=require('fs');const OUT=process.argv[2];fs.mkdirSync(OUT,{recursive:true});
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:2});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 const url='file://'+process.cwd()+'/test/page.html';await p.goto(url);await p.waitForTimeout(400);await p.evaluate(()=>window.__lifeos.loadDemo(true));await p.waitForTimeout(300);
 const go=async(v,a)=>{await p.evaluate(([v,a])=>window.__lifeos.App.go(v,a),[v,a]);await p.waitForTimeout(300);};
 const shot=async n=>{await p.evaluate(()=>{const t=document.querySelector('#toast');if(t)t.style.display='none';});await p.screenshot({path:`${OUT}/${n}.png`,fullPage:true});};
 const ids=await p.evaluate(()=>{const g=window.__lifeos.get,f=(k,fn)=>{const r=g.all(k).find(fn||(()=>true));return r&&r.id;};return{proj:f('project',x=>/Q1 Workday/.test(x.title)),goal:f('goal',x=>(x.steps||[]).length>2),goalnum:f('goal',x=>x.track==='number'),routine:f('routine',x=>/Morning/.test(x.title)),list:f('list',x=>/Groc/.test(x.title)),habit:f('habit',x=>/Workout/.test(x.title))};});
 for(const v of ['inbox','tasks','habits','routines','projects','goals','lists'])await go(v),await shot('hub-'+v);
 for(const [n,v] of [['proj','plan'],['goal','plan'],['goalnum','plan'],['routine','routine'],['list','list'],['habit','habit']])if(ids[n])await go(v,{id:ids[n]}),await shot('sub-'+n);
 console.log(errs.length+' errors',JSON.stringify(ids));await b.close();})();
