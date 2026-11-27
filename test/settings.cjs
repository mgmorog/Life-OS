// Settings hub + pages: `bash mk.sh && node test/settings.cjs`. Exits 1 on failure.
const {chromium}=require('playwright');const path=require('path');
const CHROME=process.env.CHROME||'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
(async()=>{const b=await chromium.launch({executablePath:CHROME});
  const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
  const errs=[];p.on('pageerror',x=>errs.push(x.message));
  await p.goto('file://'+path.join(__dirname,'page.html'));await p.waitForTimeout(800);
  let fails=0;const ok=(n,c,i)=>{console.log((c?'  ok   ':'  FAIL ')+n+(c?'':'  → '+JSON.stringify(i)));if(!c)fails++;};
  const go=async(v,o)=>{await p.evaluate(([v,o])=>window.__lifeos.App.go(v,o),[v,o]);await p.waitForTimeout(500);};
  await go('prefs');
  const hub=await p.evaluate(()=>({labels:[...document.querySelectorAll('.setbody .sectionlabel, .setbody .slabel, .setbody h2, .setbody h3')].map(n=>n.textContent.trim()),rows:[...document.querySelectorAll('.setbody .list b')].map(n=>n.textContent.trim()),icons:[...document.querySelectorAll('.setbody .list .li, .setbody .list > *')].map(r=>(r.querySelector('svg')||{}).innerHTML).filter(Boolean)}));
  ok('hub rows',JSON.stringify(hub.rows.filter(r=>r!=='Personalized foundation'))===JSON.stringify(['Today','Tasks, habits & capture','Reviews','Planning & availability','Life areas','Bottom bar','Display & motion','Rewards','Calendars','Notifications','Data & help']),hub.rows);
  ok('no two hub icons alike',new Set(hub.icons).size===hub.icons.length,hub.icons.length);
  for(const id of ['today','tasks','reviews','planning','areas','display','rewards','calendar','notify','data','holidays','connect']){await go('setpage',{id});const t=await p.evaluate(()=>document.querySelector('.page h1')?.textContent||'');ok('page '+id+' renders: '+t,!!t,t);}
  await go('setpage',{id:'connect'});ok('connect → Calendars',(await p.evaluate(()=>document.querySelector('.page h1').textContent)).includes('Calendars'));
  await go('setpage',{id:'notify'});const nt=await p.evaluate(()=>document.querySelector('.page').innerText);ok('notify has no duplicate on-Today toggles',!/Goal check-ins\n|Inbox nudge\n/.test(nt),nt);
  await go('setpage',{id:'tasks'});const tt=await p.evaluate(()=>document.querySelector('.page').innerText);ok('tasks has focus timer + check-in notes',/Focus timer/i.test(tt)&&/Check-in notes/.test(tt)&&/Timer chime/.test(tt));
  await go('setpage',{id:'display'});const dt=await p.evaluate(()=>document.querySelector('.page').innerText);ok('display no longer has timer/notes',!/Timer chime|Check-in notes/.test(dt));
  await go('prefs');await p.fill('#f-set-q','chime');await p.waitForTimeout(300);const r=await p.evaluate(()=>document.querySelector('.setres').innerText);ok('search finds chime in Tasks',/Timer chime[\s\S]*Tasks, habits/.test(r),r);
  await p.screenshot({path:'/tmp/set-hub.png'});
  ok('no page errors',!errs.length,errs);await b.close();process.exit(fails?1:0);})();
