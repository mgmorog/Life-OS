// Life areas, every tool page and the modules page, with the demo data.
const {chromium}=require('playwright');const fs=require('fs');const OUT=process.argv[2];fs.mkdirSync(OUT,{recursive:true});
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(p.url()+' '+e.message));
 const url='file://'+process.cwd()+'/test/page.html';await p.goto(url);await p.waitForTimeout(400);await p.evaluate(()=>window.__lifeos.loadDemo(true));await p.waitForTimeout(300);
 const go=async(v,a)=>{await p.evaluate(([v,a])=>window.__lifeos.App.go(v,a),[v,a]);await p.waitForTimeout(250);};
 const shot=async n=>{await p.evaluate(()=>{const t=document.querySelector('#toast');if(t)t.style.display='none';document.querySelectorAll('.sheet,.scrim').forEach(x=>x.remove());});await p.screenshot({path:`${OUT}/${n}.png`,fullPage:true});};
 for(const v of ['more','areas','modules'])await go(v),await shot('v-'+v);
 const plan=await p.evaluate(()=>{const L=window.__lifeos,s=L.get.settings();return (s.areas||[]).map(a=>({a,tools:(L.toolOf?[]:[])}));});
 const areas=await p.evaluate(()=>window.__lifeos.get.settings().areas||[]);
 const list=[];
 for(const a of areas){await go('area',{name:a});await shot('a-'+a.replace(/\W+/g,'_'));
   const tools=await p.evaluate(a=>window.__lifeos.toolsOf(a).filter(t=>!t.optIn||((window.__lifeos.get.settings().hubShown||{})[a]||[]).includes(t.id)).map(t=>t.id),a);list.push([a,tools]);for(const t of tools){await go('tool',{hub:a,tool:t});await shot('t-'+a.replace(/\W+/g,'_')+'-'+t);}}
 fs.writeFileSync(OUT+'/areas.json',JSON.stringify(list));
 console.log(errs.length+' errors',JSON.stringify(errs).slice(0,500));console.log(JSON.stringify(list).slice(0,800));await b.close();})();
