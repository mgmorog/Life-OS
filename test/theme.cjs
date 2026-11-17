const {chromium}=require('playwright');const fs=require('fs');const OUT=process.argv[2]||'/home/claude/theme';fs.mkdirSync(OUT,{recursive:true});
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/test/page.html');await p.waitForTimeout(400);await p.evaluate(()=>window.__lifeos.loadDemo(true));await p.waitForTimeout(300);
const go=async(v,a)=>{await p.evaluate(([v,a])=>window.__lifeos.App.go(v,a),[v,a]);await p.waitForTimeout(350);};
const set=async o=>{await p.evaluate(o=>{const L=window.__lifeos;L.put(Object.assign({},L.get.settings(),o),{silent:true});L.App.refresh();},o);await p.waitForTimeout(250);};
const shot=async n=>{await p.evaluate(()=>{const t=document.querySelector('#toast');if(t)t.style.display='none';});await p.screenshot({path:`${OUT}/${n}.png`});};
const pages=[['today'],['habits'],['tasks'],['calendar'],['more'],['area',{name:'Health'}],['setpage',{id:'display'}]];
for(const [tag,o] of [['dark',{mode:'dark',palette:'sage'}],['ocean',{mode:'light',palette:'ocean'}],['darkplum',{mode:'dark',palette:'plum'}],['clay',{mode:'light',palette:'clay',titleFont:'sans',bgTone:'white'}]]){await set(o);for(const [v,a] of pages){await go(v,a);await shot(tag+'-'+v);}}
console.log(errs.length+' errors '+JSON.stringify(errs).slice(0,300));await b.close();})();
