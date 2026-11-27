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
  ok('hub rows',JSON.stringify(hub.rows.filter(r=>r!=='Personalized foundation'))===JSON.stringify(['Today','Tasks, habits & capture','Reviews','Planning & availability','Life areas','Fields, tags & statuses','Bottom bar','Display & motion','Rewards','Calendars','Notifications','Data & help']),hub.rows);
  ok('no two hub icons alike',new Set(hub.icons).size===hub.icons.length,hub.icons.length);
  for(const id of ['fields','today','tasks','reviews','planning','areas','display','rewards','calendar','notify','data','holidays','connect']){await go('setpage',{id});const t=await p.evaluate(()=>document.querySelector('.page h1')?.textContent||'');ok('page '+id+' renders: '+t,!!t,t);}
  await go('setpage',{id:'connect'});ok('connect → Calendars',(await p.evaluate(()=>document.querySelector('.page h1').textContent)).includes('Calendars'));
  await go('setpage',{id:'notify'});const nt=await p.evaluate(()=>document.querySelector('.page').innerText);ok('notify has no duplicate on-Today toggles',!/Goal check-ins\n|Inbox nudge\n/.test(nt),nt);
  await go('setpage',{id:'tasks'});const tt=await p.evaluate(()=>document.querySelector('.page').innerText);ok('tasks has focus timer + check-in notes',/Focus timer/i.test(tt)&&/Check-in notes/.test(tt)&&/Timer chime/.test(tt));
  await go('setpage',{id:'display'});const dt=await p.evaluate(()=>document.querySelector('.page').innerText);ok('display no longer has timer/notes',!/Timer chime|Check-in notes/.test(dt));
  await go('prefs');await p.fill('#f-set-q','chime');await p.waitForTimeout(300);const r=await p.evaluate(()=>document.querySelector('.setres').innerText);ok('search finds chime in Tasks',/Timer chime[\s\S]*Tasks, habits/.test(r),r);
  await go('setpage',{id:'tasks'});const t2=await p.evaluate(()=>document.querySelector('.page').innerText);
  ok('v320 tasks page has sort, focus length and capture confirmation',/Sort tasks by/.test(t2)&&/Session length/.test(t2)&&/Confirm each capture/.test(t2),t2);
  const ord=['Tasks','Habits','Capture','Focus timer'].map(x=>t2.indexOf('\n'+x+'\n'));ok('v320 groups in order',ord.every((v,i)=>v>=0&&(i===0||v>ord[i-1])),ord);
  await p.evaluate(()=>window.__lifeos.t.setSettings({focusLen:45}));const fl=await p.evaluate(async()=>{window.__lifeos.t.focusLenSheet&&window.__lifeos.t.focusLenSheet(null);await new Promise(r=>setTimeout(r,400));return [...document.querySelectorAll('.sheet .flen button')].map(b=>b.textContent);});
  if(fl.length)ok('v320 focus sheet leads with your length',fl[0]==='45 min',fl);
  await go('setpage',{id:'reviews'});const rv=await p.evaluate(()=>document.querySelector('.page').innerText);
  ok('v322 reviews: which, when, contents',/Which reviews/.test(rv)&&/\nWhen\n/.test(rv)&&/In your weekly review/.test(rv)&&/Every Sunday/.test(rv),rv);
  await p.evaluate(()=>window.__lifeos.t.setSettings({rvHabits:false,rvNumbers:false}));await go('review');const rr=await p.evaluate(()=>document.querySelector('.page').innerText);
  ok('v322 turned-off sections leave the review',!/Habits this week/.test(rr),rr.slice(0,300));
  await p.evaluate(()=>window.__lifeos.t.setSettings({rvHabits:true,rvNumbers:true}));
  // v325 · back returns to the page you came from, even between two setpages
  await go('prefs');await go('setpage',{id:'planning'});await go('setpage',{id:'holidays'});
  const lab=await p.evaluate(()=>document.querySelector('#view .back').textContent.trim());ok('v325 back label names Planning',/Planning/.test(lab),lab);
  await p.evaluate(()=>document.querySelector('#view .back').click());await p.waitForTimeout(500);
  let h1=await p.evaluate(()=>document.querySelector('.page h1').textContent);ok('v325 back from Holidays lands on Planning',/Planning/.test(h1),h1);
  await p.evaluate(()=>document.querySelector('#view .back').click());await p.waitForTimeout(500);
  h1=await p.evaluate(()=>document.querySelector('.page h1').textContent);ok('v325 then back to Settings',/Settings/.test(h1),h1);
  // v336 · help page and onboarding
  await go('help');const hn=await p.evaluate(()=>document.querySelectorAll('.page .list .li, .page .list > *').length);ok('v336 help lists guides',hn>=13,hn);
  await p.fill('.page input[type=search]','swipe');await p.waitForTimeout(300);const hs=await p.evaluate(()=>document.querySelector('.page').innerText);ok('v336 help search finds Today',/Today/.test(hs)&&!/Photos and files/.test(hs),hs.slice(0,200));
  await p.evaluate(()=>{window.__lifeos.App.state.ob=null;window.__lifeos.App.go('welcome');});await p.waitForTimeout(400);ok('v336 welcome shows',/Welcome to Life OS/.test(await p.evaluate(()=>document.body.innerText)));
  await p.screenshot({path:'/tmp/set-hub.png'});
  // v337 · Look group, haptic strength, reset with undo
  await go('setpage',{id:'display'});const lk=await p.evaluate(()=>document.querySelector('.page').innerText);
  ok('v337 look rows',/Accent strength/.test(lk)&&/Corners/.test(lk)&&/Cards/.test(lk)&&/Body font/.test(lk)&&/Reset Display & motion to defaults/.test(lk),lk.slice(0,200));
  await p.evaluate(()=>window.__lifeos.t.setSettings({accentStr:'bold',corners:'crisp',cardStyle:'outlined',bodyFont:'rounded'}));await go('setpage',{id:'display'});
  const ds=await p.evaluate(()=>{const R=document.documentElement,cs=getComputedStyle(R);return {a:R.dataset.accent,c:R.dataset.corners,k:R.dataset.cards,b:R.dataset.body,rc:cs.getPropertyValue('--r-card').trim(),er:cs.getPropertyValue('--e-raised').trim(),body:cs.getPropertyValue('--body')};});
  ok('v337 attributes and tokens follow settings',ds.a==='bold'&&ds.c==='crisp'&&ds.k==='outlined'&&ds.b==='rounded'&&ds.rc==='12px'&&ds.er==='none'&&/rounded/.test(ds.body),ds);
  await p.evaluate(()=>[...document.querySelectorAll('.page button.li')].find(n=>/^Reset Display & motion to defaults$/.test(n.textContent.trim())).click());await p.waitForTimeout(400);
  await p.evaluate(()=>[...document.querySelectorAll('.sheet button, dialog button, .modal button, button')].find(n=>n.textContent.trim()==='Reset').click());await p.waitForTimeout(500);
  const rs=await p.evaluate(()=>{const s=window.__lifeos.t.get?window.__lifeos.t.get.settings():null;const R=document.documentElement;return {c:R.dataset.corners,a:R.dataset.accent};});
  ok('v337 reset puts display back',rs.c==='round'&&rs.a==='standard',rs);
  const ttx=await p.evaluate(()=>document.querySelector('#toast')?.innerText||'');ok('v337 reset toast has Undo',/reset/i.test(ttx)&&/Undo/.test(ttx),ttx);
  await go('setpage',{id:'notify'});ok('v337 no reset on Notifications',!/Reset .* to defaults/.test(await p.evaluate(()=>document.querySelector('.page').innerText)));
  // v338 · motion, colour-blind, relative dates, layout toggles, rename
  await p.evaluate(()=>window.__lifeos.t.setSettings({motionCalm:true,reduceMotion:false,cbSafe:true,hideEmpty:true,stickyHeads:true,relDates:true}));await go('setpage',{id:'display'});
  const cl=await p.evaluate(()=>document.documentElement.className);ok('v338 classes follow settings',/a-calm/.test(cl)&&/a-cb/.test(cl)&&/a-hideempty/.test(cl)&&/a-sticky/.test(cl)&&/a-fill/.test(cl),cl);
  const rd=await p.evaluate(()=>{const t=window.__lifeos.t,d=new Date();d.setDate(d.getDate()+9);const k=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');return t.relDay?t.relDay(k):null;});
  if(rd!==null)ok('v338 relative dates',rd==='In 9 days',rd);
  await p.evaluate(()=>window.__lifeos.t.setSettings({names:{studio:'Planner',areas:'Roles'}}));await go('studio');await p.waitForTimeout(300);
  const bar=await p.evaluate(()=>document.body.innerText);ok('v338 rename swaps Studio everywhere',/Planner/.test(bar)&&!/\bStudio\b/.test(bar),bar.match(/.{0,20}(Studio|Planner).{0,20}/g));
  await p.evaluate(()=>window.__lifeos.t.setSettings({names:{},motionCalm:false,cbSafe:false,hideEmpty:false,stickyHeads:false,relDates:false}));await go('today');await p.waitForTimeout(400);
  ok('v338 rename off brings names back',/Studio/.test(await p.evaluate(()=>document.body.innerText)));
  // v340 · four tabs, + menu, More sections, fiscal year, recently viewed, calendar display
  await p.evaluate(()=>window.__lifeos.t.setSettings({navFour:true}));await go('today');
  let nv=await p.evaluate(()=>({inBar:!!document.querySelector('#nav-in .fab'),float:!!document.querySelector('body > .fab.fabfloat'),cols:getComputedStyle(document.querySelector('.nav .in')).gridTemplateColumns.split(' ').length}));
  ok('v340 four tabs float the +',!nv.inBar&&nv.float&&nv.cols===4,nv);
  await p.evaluate(()=>window.__lifeos.t.setSettings({navFour:false}));await go('today');
  nv=await p.evaluate(()=>({inBar:!!document.querySelector('#nav-in .fab'),float:!!document.querySelector('body > .fab.fabfloat')}));ok('v340 back to five puts + in the bar',nv.inBar&&!nv.float,nv);
  await p.evaluate(()=>window.__lifeos.t.setSettings({moreSecs:[{id:'saved',hidden:false},{id:'pinned',hidden:false},{id:'views',hidden:true},{id:'areas',hidden:true},{id:'plan',hidden:false}]}));await go('more');
  const mt=await p.evaluate(()=>document.querySelector('.page').innerText);ok('v340 More follows your order and hides sections',mt.indexOf('Saved')>=0&&mt.indexOf('Saved')<mt.indexOf('Pinned')&&!/Life areas/.test(mt),mt.slice(0,300));
  await p.evaluate(()=>window.__lifeos.t.setSettings({moreSecs:null}));
  const tk=await p.evaluate(()=>{const L=window.__lifeos;const r=L.create('task',{title:'Renew passport',date:L.todayK()});return r.id;});
  await p.evaluate(id=>{try{localStorage.setItem('lifeos-recent',JSON.stringify([id]));}catch(e){}},tk);await go('search');
  ok('v340 search lists recently viewed',/Recently viewed[\s\S]*Renew passport/.test(await p.evaluate(()=>document.querySelector('.page').innerText)));
  await go('setpage',{id:'calendar'});const ct=await p.evaluate(()=>document.querySelector('.page').innerText);ok('v340 calendar display group',/Calendar display/.test(ct)&&/Opens to/.test(ct),ct.slice(0,200));
  await go('setpage',{id:'planning'});ok('v340 planning has fiscal year and Studio view',/Year starts in/.test(await p.evaluate(()=>document.querySelector('.page').innerText)));
  await go('setpage',{id:'tasks'});ok('v340 tasks has default length and reminder',/Default length[\s\S]*Default reminder/.test(await p.evaluate(()=>document.querySelector('.page').innerText)));
  // v341 · a tapped reminder opens Done / later / tomorrow; &do=done finishes it directly
  {const tk=await p.evaluate(()=>window.__lifeos.todayK());const id=await p.evaluate(()=>{const L=window.__lifeos;return L.create('task',{title:'Call the bank',date:L.todayK(),time:600,reminder:0}).id;});
   await p.evaluate(([id,tk])=>{location.hash='rem?k='+encodeURIComponent(id+'|'+tk);},[id,tk]);await p.waitForTimeout(900);
   ok('v341 reminder sheet offers actions',/Remind me in an hour/.test(await p.evaluate(()=>document.querySelector('.sheet')?.innerText||'')));
   await p.evaluate(()=>[...document.querySelectorAll('.sheet button')].find(b=>b.textContent.trim()==='Done').click());await p.waitForTimeout(500);
   ok('v341 Done in the sheet finishes it',await p.evaluate(([id,tk])=>!!(window.__lifeos.get.id(id).doneDates||{})[tk],[id,tk]));
   const id2=await p.evaluate(()=>{const L=window.__lifeos;return L.create('task',{title:'Water plants',date:L.todayK(),time:700,reminder:0}).id;});
   await p.evaluate(([id,tk])=>{location.hash='rem?k='+encodeURIComponent(id+'|'+tk)+'&do=done';},[id2,tk]);await p.waitForTimeout(900);
   ok('v341 the notification Done button finishes it',await p.evaluate(([id,tk])=>!!(window.__lifeos.get.id(id).doneDates||{})[tk],[id2,tk]));}
  // v343 · fields, statuses, tags, formulas, area defaults
  await p.evaluate(()=>window.__lifeos.t.setSettings({fields:[{id:'fc',name:'Cost',type:'money',on:['task'],row:true},{id:'fv',name:'Visits',type:'number',on:['task']},{id:'fp',name:'Per visit',type:'formula',expr:'{Cost} / {Visits}',fmt:'money',on:['task'],row:true}],statuses:[{id:'s1',name:'Waiting',sym:'⏸'}],tagGroups:[{id:'g1',name:'Context',tags:['@home','@office']}],areaDefaults:{Health:{dur:45,priority:'high',tags:['@home']}}}));
  {const id=await p.evaluate(()=>{const L=window.__lifeos;return L.create('task',{title:'Gym membership',steps:[],notes:'',photos:[],repeat:{type:'never'},priority:'normal',date:L.todayK(),cf:{fc:45,fv:9},status:'s1',tags:['@home']}).id;});
   await go('today');const row=await p.evaluate(()=>[...document.querySelectorAll('.trow')].map(r=>r.innerText).join(' '));ok('v343 rows show status, tags, fields and formula',/Waiting/.test(row)&&/@home/.test(row)&&/\$5\b/.test(row),row);
   await p.evaluate(()=>[...document.querySelectorAll('.trow .t')].find(b=>/Gym/.test(b.textContent)).click());await p.waitForTimeout(700);
   const sh=await p.evaluate(()=>document.querySelector('.sheet .cfbox')?.innerText||'');ok('v343 task sheet edits status, tags and fields',/Status/.test(sh)&&/Context/.test(sh)&&/Per visit/.test(sh),sh.slice(0,200));
   await p.evaluate(()=>document.querySelectorAll('.sheet button').forEach(b=>{if(b.textContent.trim()==='Cancel')b.click();}));await p.waitForTimeout(400);
   await go('setpage',{id:'fields'});const ft=await p.evaluate(()=>document.querySelector('.page').innerText);ok('v343 fields page lists fields, statuses, tags and area defaults',/Per visit/.test(ft)&&/Waiting/.test(ft)&&/Context/.test(ft)&&/45m · High · @home/.test(ft),ft.slice(0,300));
   await go('search');await p.fill('.searchbox input, #q','@home');await p.waitForTimeout(400);ok('v343 search finds tags',/Gym membership/.test(await p.evaluate(()=>document.querySelector('.page').innerText)));
   await p.evaluate(()=>window.__lifeos.t.setSettings({fields:[],statuses:[],tagGroups:[],areaDefaults:{}}));}
  // v344 · links, change history, layout history
  {const ids=await p.evaluate(()=>{const L=window.__lifeos,base={steps:[],notes:'',photos:[],repeat:{type:'never'},priority:'normal'};const a=L.create('task',Object.assign({title:'Book flights',date:L.todayK()},base)),g=L.create('goal',{title:'Japan trip',steps:[]});a.links=[g.id];L.put(a);return[a.id,g.id];});
   await go('today');await p.evaluate(()=>[...document.querySelectorAll('.trow .t')].find(b=>/Book flights/.test(b.textContent)).click());await p.waitForTimeout(700);
   ok('v344 task sheet shows its link',/Linked[\s\S]*Japan trip/.test(await p.evaluate(()=>document.querySelector('.sheet')?.innerText||'')));
   await p.evaluate(()=>document.querySelectorAll('.sheet button').forEach(b=>{if(b.textContent.trim()==='Cancel')b.click();}));await p.waitForTimeout(400);
   await p.evaluate(id=>{const L=window.__lifeos,r=L.get.id(id);r.title='Book flights to Tokyo';L.put(r);},ids[0]);await go('history');
   const ht=await p.evaluate(()=>document.querySelector('.page').innerText);ok('v344 change history lists the edit',/Book flights to Tokyo/.test(ht)&&/Edited/.test(ht),ht.slice(0,200));
   await p.evaluate(()=>[...document.querySelectorAll('.page button')].find(b=>b.textContent.trim()==='Undo').click());await p.waitForTimeout(400);
   ok('v344 undo puts the old title back',await p.evaluate(id=>window.__lifeos.get.id(id).title,ids[0])==='Book flights');
   await p.evaluate(()=>window.__lifeos.t.setSettings({hdIcons:['search']}));await p.evaluate(()=>window.__lifeos.t.setSettings({hdIcons:null}));
   ok('v344 layout history keeps the layout before',await p.evaluate(()=>{try{return JSON.parse(localStorage.getItem('lifeos-layouts')||'[]').length>0;}catch(e){return false;}}));}
  ok('no page errors',!errs.length,errs);await b.close();process.exit(fails?1:0);})();
