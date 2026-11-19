const {chromium}=require('playwright');const fs=require('fs');const OUT=process.argv[2]||'/home/claude/la/before';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/test/page.html');await p.waitForTimeout(300);await p.evaluate(()=>window.__lifeos.loadDemo(true));await p.waitForTimeout(300);
const hubs=await p.evaluate(()=>{const L=window.__lifeos;return Object.fromEntries((L.get.settings().areas||[]).map(a=>[a,(L.toolsOf(a)||[]).map(t=>t.id)]));});
const shot=async n=>{await p.evaluate(()=>{const t=document.querySelector('#toast');if(t)t.style.display='none';window.scrollTo(0,0);});await p.waitForTimeout(150);await p.screenshot({path:`${OUT}/${n}.png`,fullPage:true});};
let i=0;for(const [a,ts] of Object.entries(hubs)){i++;const A=a.replace(/\s/g,'');await p.evaluate(a=>window.__lifeos.App.go('area',{name:a}),a);await p.waitForTimeout(400);await shot(`${i}-${A}-0area`);
  for(const t of ts){await p.evaluate(([a,t])=>window.__lifeos.App.go('tool',{hub:a,tool:t}),[a,t]);await p.waitForTimeout(350);await shot(`${i}-${A}-${t}`);}}
await p.evaluate(()=>window.__lifeos.App.go('areas'));await p.waitForTimeout(300);await shot('0-areas');
await p.evaluate(()=>window.__lifeos.App.go('modules'));await p.waitForTimeout(300);await shot('0-modules');
console.log(JSON.stringify(hubs));console.log('errors',errs);await b.close();})();
