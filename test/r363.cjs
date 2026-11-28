// v363 · the round of 40: `bash mk.sh && node test/r363.cjs`. Exits 1 on failure.
const {chromium}=require('playwright');const path=require('path');
const CHROME=process.env.CHROME||'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
(async()=>{const b=await chromium.launch({executablePath:CHROME});
  const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
  const errs=[];p.on('pageerror',x=>errs.push(x.message));
  await p.goto('file://'+path.join(__dirname,'page.html'));await p.waitForTimeout(900);
  let fails=0;const ok=(n,c,i)=>{console.log((c?'  ok   ':'  FAIL ')+n+(c?'':'  → '+JSON.stringify(i)));if(!c)fails++;};
  const ev=(f,a)=>p.evaluate(f,a);const go=async(v,o)=>{await p.evaluate(([v,o])=>window.__lifeos.App.go(v,o),[v,o]);await p.waitForTimeout(600);};
  const txt=()=>ev(()=>document.querySelector('#view').innerText);
  await ev(()=>window.__lifeos.loadDemo(true));await p.waitForTimeout(1300);
  // Today
  await go('today');
  ok('1 week strip opens on the week holding today',await ev(()=>{const s=document.getElementById('week-strip');return [...s.querySelectorAll('button')].some(x=>{const r=x.getBoundingClientRect();return x.classList.contains('today')&&r.left>=0&&r.right<=innerWidth;});}));
  ok('3 overlaps are one Fix row, no per-row tags',await ev(()=>!!document.querySelector('.upclash')&&!document.querySelector('.ovtag')));
  ok('4 one Suggestions card with Noticed inside',await ev(()=>{const c=document.querySelector('.sugcard');return !!c&&!!c.querySelector('.ncard')&&!document.querySelector('.lbl.alsol');}));
  ok('4 Suggestions shows three, the rest behind more',await ev(()=>{const c=document.querySelector('.sugcard');return c.querySelector('.suglist').children.length<=3&&/more/.test(c.textContent);}));
  ok('6 carried over counts tasks only',/\b4 carried over/.test(await txt()),(await txt()).match(/\d+ carried over/));
  ok('7 jump bar lists the sections',await ev(()=>{const j=document.querySelector('.jumpbar');return !!j&&/Schedule/.test(j.textContent)&&/Suggestions/.test(j.textContent);}));
  ok('8 talk suggestion says what about',/Talk to Alex about \S+/.test(await txt()));
  {const before=await ev(()=>scrollY);await ev(()=>[...document.querySelectorAll('.jchip')].find(x=>x.textContent==='Schedule').click());await p.waitForTimeout(900);ok('7 a chip scrolls to its section',(await ev(()=>scrollY))>before);await ev(()=>scrollTo(0,0));}
  {const n0=await ev(()=>document.querySelectorAll('.fhab').length);await ev(()=>document.querySelector('.fhab:not(.done)').click());await p.waitForTimeout(800);ok('5 a done habit stays in the grid',(await ev(()=>document.querySelectorAll('.fhab').length))===n0&&await ev(()=>!!document.querySelector('.fhab.done')));}
  // chores
  ok('13 a missed chore moves to its next date',await ev(()=>{const L=window.__lifeos,x=L.get.all('entry').find(e=>e.f&&/sheets/i.test(e.f.what||''));const c=L.x.choreNext(x,L.todayK());return c.d>=L.todayK()&&c.missed>=1;}));
  ok('13 no chore is late in area items',await ev(()=>!window.__lifeos.x.areaDueRows(window.__lifeos.todayK()).some(r=>r.late&&/^Chore/.test(r.sub||''))));
  // Studio
  await go('studio');
  ok('10 week load strip with seven days',await ev(()=>document.querySelectorAll('.stload .stlb').length===7));
  ok('11 Needs a day rows have a grip',await ev(()=>!!document.querySelector('.strow .stgrip')));
  ok('12 week focus counts what was done',/\d+ done/.test(await ev(()=>(document.querySelector('.bars')||{}).textContent||'')));
  {await ev(()=>[...document.querySelectorAll('.smgoal button')].find(x=>/Add a step/.test(x.textContent)).click());await p.waitForTimeout(600);const sh=await ev(()=>document.querySelector('.sheet')?.innerText||'');ok('9 goal steps sheet suggests a day each',/Give each goal a step/.test(sh)&&/Next:/.test(sh)&&/Place all/.test(sh),sh.slice(0,120));await ev(()=>{const c=[...document.querySelectorAll('.sheet button')].find(x=>x.textContent==='Close');c&&c.click();});await p.waitForTimeout(500);}
  // Tasks
  await go('tasks');
  ok('15 tool chips have words',await ev(()=>{const t=[...document.querySelectorAll('.fchip.flab')].map(x=>x.textContent).join('|');return /Filter/.test(t)&&/Group: Day/.test(t)&&/Search/.test(t);}));
  ok('14 Next 7 days folds by day',await ev(()=>document.querySelectorAll('.tweek .tdfold').length>=3&&!document.querySelector('.tweek .tdfold.open')));
  {await ev(()=>document.querySelector('.tweek .tdname').click());await p.waitForTimeout(500);ok('14 tapping a day opens it',await ev(()=>!!document.querySelector('.tweek .tdfold.open')));}
  ok('16 Also today uses the section heading style',await ev(()=>!document.querySelector('.tday:not(.tdfold):not(.tsub)')));
  // Habits
  await go('habits');
  ok('17 group chip on Habits',await ev(()=>/Group: Life area/.test(document.querySelector('#view').textContent)));
  await ev(()=>window.__lifeos.t.setSettings({habGroup:'tod'}));await go('habits');
  ok('17 group by time of day',await ev(()=>[...document.querySelectorAll('.hagrp b')].some(x=>/Morning|Anytime|Evening/.test(x.textContent))));
  await ev(()=>window.__lifeos.t.setSettings({habGroup:'area'}));
  await go('habit',{id:await ev(()=>window.__lifeos.get.all('habit').find(h=>h.title==='Workout').id)});
  ok('18 eight weeks as columns that fit',await ev(()=>{const w=document.querySelector('.rwwks');return !!w&&[...w.children].every(i=>i.getBoundingClientRect().height<=49);}));
  // Goals
  await go('goals');
  ok('21 pace on every goal',(await ev(()=>document.querySelectorAll('.gpace').length))>=5);
  await go('plan',{id:await ev(()=>window.__lifeos.get.all('goal').find(g=>g.title==='Run a half marathon').id)});
  ok('22 done milestones fold away',await ev(()=>!!document.querySelector('.msfold')&&!document.querySelector('.prow2.done')));
  ok('23 weekly check-in card',await ev(()=>!!document.querySelector('.gcheck .gmood')));
  {await ev(()=>document.querySelector('.gcheck .gmood').click());await p.waitForTimeout(600);ok('23 one tap saves a check-in',await ev(()=>{const g=window.__lifeos.get.all('goal').find(g=>g.title==='Run a half marathon');return (g.checks||[]).some(c=>c.date===window.__lifeos.todayK());}));}
  // Projects
  await go('plan',{id:await ev(()=>window.__lifeos.get.all('project').find(g=>g.title==='Kitchen refresh').id)});
  ok('24 thin progress line, no wash band',await ev(()=>!!document.querySelector('.pcline')&&!document.querySelector('.pchead .rwwash')));
  ok('25 By when and Next step rows',/By when/.test(await txt())&&/Next step/.test(await txt()));
  await ev(()=>{const L=window.__lifeos,p=L.get.all('project').find(x=>x.title==='Kitchen refresh');p.createdAt=Date.now()-60*864e5;L.get.all('task').filter(t=>t.part===p.id).forEach(t=>{Object.keys(t.doneDates||{}).forEach(d=>t.doneDates[d]=Date.now()-40*864e5);L.put(t,{silent:true});});L.put(p,{silent:true});});
  await go('projects');
  ok('26 a stalled project says so',/No progress in \d+ weeks/.test(await txt()));
  // Inbox
  await go('inbox');
  ok('27 Sort button',/Sort \d+ ideas/.test(await txt()));
  ok('29 older ideas fold into one line',/Older than 2 months/.test(await txt()));
  ok('28 a guess instead of Choose a place',await ev(()=>{const g=window.__lifeos.x.ideaGuess({title:'Automate the AP intake form with a Workday web service',notes:''});return !!g&&/Workday/.test(g.label);}));
  // More, lists, areas
  await go('more');ok('30 life areas wrap as a grid',await ev(()=>{const g=document.querySelector('.arail.agrid');return !!g&&g.scrollWidth<=g.clientWidth+1;}));
  await go('list',{id:await ev(()=>window.__lifeos.get.all('list').find(l=>l.title==='Groceries').id)});
  ok('32 groceries by aisle',/Produce/.test(await txt())&&/Dairy and eggs/.test(await txt()));
  ok('33 you usually buy',/You usually buy/.test(await txt()));
  await go('area',{name:'Health'});
  ok('35 compact level header',await ev(()=>!!document.querySelector('.rwlvl2 .rwlring')));
  ok('36 modules that need you come first',/Needs you today/.test(await txt()));
  // Reviews
  await go('reviews');ok('37 three tabs',await ev(()=>/This week/.test(document.querySelector('.revtabs').textContent)&&/Trends/.test(document.querySelector('.revtabs').textContent)));
  await ev(()=>{window.__lifeos.App.state.revTab='trends';window.__lifeos.App.refresh();});await p.waitForTimeout(600);
  {const t=await txt();ok('38 no rows of 0m done',!/0m done/.test(t));ok('39 the 8-week insight reads clearly',!/points on the 4 weeks/.test(t)&&/You finished/.test(t));}
  await ev(()=>{window.__lifeos.App.state.revTab='week';});
  ok('no page errors',!errs.length,errs.slice(0,3));
  await b.close();process.exit(fails?1:0);})();
