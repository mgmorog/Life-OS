/* Click-through of the v209 sheets: Display, Working hours, flexible hours, Connections, Notifications */
const {chromium}=require('playwright');const fs=require('fs');const OUT='/home/claude/clicks';fs.mkdirSync(OUT,{recursive:true});
let pass=0,fail=0;const ok=(n,c,x)=>{if(c){pass++;console.log('ok  ',n);}else{fail++;console.log('FAIL',n,x||'');}};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/test/page.html');await p.waitForTimeout(400);
const S=()=>p.evaluate(()=>window.__lifeos.get.settings());
const go=async(v,a)=>{await p.evaluate(([v,a])=>window.__lifeos.App.go(v,a),[v,a]);await p.waitForTimeout(300);};
const tap=async(t,exact=true)=>{const l=p.getByText(t,{exact}).last();await l.scrollIntoViewIfNeeded();await l.click();await p.waitForTimeout(250);};
const shot=n=>p.screenshot({path:`${OUT}/${n}.png`});

/* Display */
await go('setpage',{id:'display'});
await tap('Dark');ok('mode Dark',(await S()).mode==='dark');ok('html has dark mode',await p.evaluate(()=>document.documentElement.dataset.mode==='dark'));
await tap('Ocean');ok('palette Ocean',(await S()).palette==='ocean');
await tap('Plum');await tap('Sans');ok('title font',(await S()).titleFont==='sans');await shot('display-dark');
await tap('Light');ok('back to light',await p.evaluate(()=>document.documentElement.dataset.mode!=='dark'));
await tap('Sage');

/* Working hours */
await go('setpage',{id:'planning'});await tap('Working hours');await p.waitForTimeout(300);await shot('work-1');
await tap('Add a shift',false);await tap('Add a job',false);await p.waitForTimeout(200);
await p.locator('input.jobname').nth(1).fill('Cafe');
await p.locator('.jobg').nth(1).getByText('Flexible',{exact:true}).click();await p.waitForTimeout(200);
await p.locator('.jobg').nth(1).getByText('Every two weeks',{exact:true}).click();await p.waitForTimeout(500);await shot('work-2');
await tap('Done');const jobs=(await S()).jobs||[];
ok('two jobs saved',jobs.length===2,JSON.stringify(jobs.map(j=>j.name)));ok('first job has two shifts',jobs[0]&&jobs[0].shifts.length===2);ok('second is flexible every two weeks',jobs[1]&&jobs[1].flex&&jobs[1].cycle==='2week'&&jobs[1].name==='Cafe');

/* flexible hours from Inbox */
await go('inbox');await shot('inbox');const hasDue=await p.getByText(/Add your Cafe hours/).count();ok('inbox asks for Cafe hours',hasDue>0);
if(hasDue){await p.getByText(/Add your Cafe hours/).first().click();await p.waitForTimeout(400);await shot('flex-sheet');
  const btns=await p.locator('.sheet button, [role=dialog] button').allInnerTexts();
  const add=p.getByText(/Add hours|Add a shift|Add/).filter({hasNotText:'Cancel'});
  const right=p.locator('.sheet-hd button, .shhd button').last();
  /* save whatever the sheet has: marks the period as handled */
  await p.getByText('Save',{exact:true}).last().click().catch(async()=>{await p.getByText('Done',{exact:true}).last().click();});await p.waitForTimeout(300);
  const after=await p.getByText(/Add your Cafe hours/).count();ok('saving clears the inbox ask',after===0,btns.join('|'));}

/* Connections */
await go('setpage',{id:'connect'});await shot('connect');ok('connections shows the outbound feed row',await p.getByText('Show Life OS in Apple or Google Calendar').count()>0);

/* Notifications */
await go('setpage',{id:'notify'});await tap('Quiet hours');ok('quiet hours toggles',(await S()).quiet.on===true);await shot('notify');
const wr=p.locator('button,[role=switch]').filter({hasText:''});
/* reviews link */
await tap('Review settings');ok('review settings link works',await p.evaluate(()=>/Weekly/.test(document.body.innerText)));

/* week start dropdown */
await go('setpage',{id:'planning'});await tap('Week starts on',false);await p.waitForTimeout(300);await shot('weekstart');await tap('Wednesday');ok('week starts Wednesday',(await S()).weekStart===3,(await S()).weekStart);
await go('calendar');await shot('cal-wed');const hdr=await p.evaluate(()=>{const r=document.querySelector('.wd-row');return r?r.innerText.replace(/\s+/g,''):'';});ok('calendar header starts on W',/^W/.test(hdr),hdr);

ok('no page errors',errs.length===0,errs.join(' | '));console.log(`${pass}/${pass+fail} passed`);await b.close();})();
