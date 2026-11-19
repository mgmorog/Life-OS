/* Full sweep: every view and sheet, light and dark, demo data and empty data.
   Flags page errors, horizontal overflow, white surfaces in dark mode, and low-contrast text. */
const {chromium}=require('playwright');const fs=require('fs');const OUT='/home/claude/sweep';fs.mkdirSync(OUT,{recursive:true});
const issues=[];const note=(where,what)=>issues.push(where+' :: '+what);
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true})).newPage();
let cur='boot';p.on('pageerror',e=>note(cur,'ERROR '+e.message));
await p.goto('file://'+process.cwd()+'/test/page.html');await p.waitForTimeout(400);
const set=async pt=>{await p.evaluate(pt=>{const L=window.__lifeos;L.put(Object.assign({},L.get.settings(),pt),{silent:true});},pt);};
const audit=async(where,dark)=>{cur=where;const r=await p.evaluate(dark=>{const out=[];const W=document.documentElement.clientWidth;
  const lum=c=>{const m=c.match(/[\d.]+/g);if(!m)return null;if(m.length>3&&+m[3]<0.5)return null;const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};return .2126*f(+m[0])+.7152*f(+m[1])+.0722*f(+m[2]);};
  const bgOf=e=>{for(let n=e;n;n=n.parentElement){const c=getComputedStyle(n).backgroundColor;const l=lum(c);if(l!=null)return l;}return dark?0.01:1;};
  const seen=new Set();
  document.querySelectorAll('body *').forEach(e=>{const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden'||+cs.opacity===0)return;const r=e.getBoundingClientRect();if(!r.width||!r.height)return;
    if(r.right>W+2&&!e.closest('[style*="overflow"],.hscroll,.wkstrip,.dayscroll,.chips,.scrollx')&&cs.position!=='fixed'){const k='overflow '+e.tagName+'.'+e.className;if(!seen.has(k)){seen.add(k);out.push(k+' right='+Math.round(r.right));}}
    if(dark){const l=lum(cs.backgroundColor);if(l!=null&&l>0.6&&r.width>40&&r.height>20){const k='white bg '+e.tagName+'.'+String(e.className).slice(0,40);if(!seen.has(k)){seen.add(k);out.push(k+' '+cs.backgroundColor);}}}
    const t=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());if(t&&r.top<4000){const fl=lum(cs.color),bl=bgOf(e);if(fl!=null){const c=(Math.max(fl,bl)+.05)/(Math.min(fl,bl)+.05);if(c<2.6){const k='lowcontrast '+e.tagName+'.'+String(e.className).slice(0,30)+' "'+e.textContent.trim().slice(0,24)+'"';if(!seen.has(k)){seen.add(k);out.push(k+' '+c.toFixed(2));}}}}});
  return out;},dark);r.forEach(x=>note(where,x));};
const shot=async n=>{await p.evaluate(()=>{const t=document.querySelector('#toast');if(t)t.style.display='none';});await p.screenshot({path:`${OUT}/${n}.png`,fullPage:true});};
const go=async(v,a)=>{cur=v+(a?JSON.stringify(a):'');await p.evaluate(([v,a])=>window.__lifeos.App.go(v,a),[v,a]);await p.waitForTimeout(250);};
const closeSheets=async()=>{await p.evaluate(()=>{document.querySelectorAll('.sheet,.sheetwrap,.scrim,.ov').forEach(n=>n.remove());});};

await p.evaluate(()=>window.__lifeos.loadDemo(true));await p.waitForTimeout(400);
const ids=await p.evaluate(()=>{const L=window.__lifeos,a=k=>(L.get.all(k)||[]);const plan=[...a('project'),...a('goal')];return{habit:(a('habit')[0]||{}).id,routine:(a('routine')[0]||{}).id,list:(a('list')[0]||{}).id,project:(a('project')[0]||{}).id,goal:(a('goal')[0]||{}).id,trip:(a('trip')[0]||{}).id,area:(L.get.settings().areas||[])[0]};});
const routes=[['today'],['studio'],['calendar'],['more'],['inbox'],['tasks'],['habits'],['goals'],['projects'],['routines'],['lists'],['areas'],['reviews'],['review'],['insights'],['archive'],['trash'],['photos'],['search'],['planweek'],['timer'],['modules'],['foundation'],
  ['habit',{id:ids.habit}],['routine',{id:ids.routine}],['list',{id:ids.list}],['plan',{id:ids.project}],['plan',{id:ids.goal}],['area',{name:ids.area}],['trip',{id:ids.trip}],
  ...['planning','tasks','reviews','calendar','areas','display','data','connect','notify'].map(id=>['setpage',{id}])].filter(r=>!r[1]||Object.values(r[1])[0]);
const calModes=['day','week','month','quarter','year'];
for(const mode of ['light','dark']){await set({mode,palette:'sage'});
  for(const [v,a] of routes){await go(v,a);await audit(mode+' '+v+(a?' '+Object.values(a)[0]:''),mode==='dark');await shot(`${mode}-${v}${a&&a.id?'-'+String(a.id).slice(0,6):a?'-'+Object.values(a)[0]:''}`);}
  for(const cm of calModes){await set({calView:cm});await go('calendar');await p.evaluate(cm=>{const b=[...document.querySelectorAll('button')].find(x=>x.textContent.trim().toLowerCase()===cm);if(b)b.click();},cm);await p.waitForTimeout(200);await audit(mode+' calendar-'+cm,mode==='dark');await shot(`${mode}-cal-${cm}`);}
  for(const sk of ['task','habit','goal','project','routine']){cur=mode+' sheet '+sk;await go('today');await p.evaluate(sk=>{const f=window.__lifeos.sheets[sk];f&&f(null);},sk);await p.waitForTimeout(400);await audit(mode+' sheet-'+sk,mode==='dark');await shot(`${mode}-sheet-${sk}`);await p.keyboard.press('Escape');await closeSheets();}
}
/* empty account */
await set({mode:'light'});await p.evaluate(()=>{const L=window.__lifeos;[...L.recs.values()].filter(r=>r.kind!=='settings').forEach(r=>L.remove(r.id,{silent:true,hard:true}));});
for(const [v] of routes.filter(r=>!r[1])){await go(v);await audit('empty '+v,false);}
await go('today');await shot('empty-today');
fs.writeFileSync(OUT+'/issues.txt',issues.join('\n'));console.log(issues.length+' issues');console.log(issues.slice(0,200).join('\n'));await b.close();})();
