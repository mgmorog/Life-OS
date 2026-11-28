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
  ok('hub rows',JSON.stringify(hub.rows.filter(r=>r!=='Personalized foundation'))===JSON.stringify(['Today','Tasks, habits & capture','Reviews','Planning & availability','Life areas','Fields, tags & statuses','Smart','Bottom bar & More','Appearance','Accessibility & motion','Formats & start','Rewards','Calendars','Notifications','Data & help']),hub.rows);
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
  ok('v337 look rows',/Accent strength/.test(lk)&&/Corners/.test(lk)&&/Cards/.test(lk)&&/Body font/.test(lk)&&/Reset Appearance to defaults/.test(lk),lk.slice(0,200));
  await p.evaluate(()=>window.__lifeos.t.setSettings({accentStr:'bold',corners:'crisp',cardStyle:'outlined',bodyFont:'rounded'}));await go('setpage',{id:'display'});
  const ds=await p.evaluate(()=>{const R=document.documentElement,cs=getComputedStyle(R);return {a:R.dataset.accent,c:R.dataset.corners,k:R.dataset.cards,b:R.dataset.body,rc:cs.getPropertyValue('--r-card').trim(),er:cs.getPropertyValue('--e-raised').trim(),body:cs.getPropertyValue('--body')};});
  ok('v337 attributes and tokens follow settings',ds.a==='bold'&&ds.c==='crisp'&&ds.k==='outlined'&&ds.b==='rounded'&&ds.rc==='12px'&&ds.er==='none'&&/rounded/.test(ds.body),ds);
  await p.evaluate(()=>[...document.querySelectorAll('.page button.li')].find(n=>/^Reset Appearance to defaults$/.test(n.textContent.trim())).click());await p.waitForTimeout(400);
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
   await go('setpage',{id:'fields'});const ft=await p.evaluate(()=>document.querySelector('.page').innerText);ok('v343 fields page lists fields, statuses, tags and area defaults',/Per visit/.test(ft)&&/Waiting/.test(ft)&&/Context/.test(ft)&&/Starting values by area/.test(ft),ft.slice(0,300));await go('setpage',{id:'areastart'});ok('v358 area starting values page',/45m · High · @home/.test(await p.evaluate(()=>document.querySelector('.page').innerText)));
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
  // v345 · app lock (whole app and private areas), sync status row
  {await p.evaluate(async()=>{const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('life-os|1234'));const h=[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');localStorage.setItem('lifeos-lock',JSON.stringify({hash:h}));});
   await p.evaluate(()=>window.__lifeos.t.setSettings({lockMode:'areas',lockAreas:['Finances']}));
   await p.evaluate(()=>window.__lifeos.App.go('tool',{hub:'Finances',tool:'bills'}));await p.waitForTimeout(500);
   ok('v345 a private area asks for the passcode',await p.evaluate(()=>!!document.querySelector('.lockscr')));
   for(const d of '1235'){await p.evaluate(d=>[...document.querySelectorAll('.lkk')].find(b=>b.textContent===d).click(),d);}await p.waitForTimeout(500);
   ok('v345 a wrong passcode keeps it locked',await p.evaluate(()=>!!document.querySelector('.lockscr')&&/Wrong/.test(document.querySelector('.lkmsg').textContent)));
   await p.waitForTimeout(300);for(const d of '1234'){await p.evaluate(d=>[...document.querySelectorAll('.lkk')].find(b=>b.textContent===d).click(),d);}await p.waitForTimeout(700);
   ok('v345 the right passcode opens the area',await p.evaluate(()=>!document.querySelector('.lockscr:not(.out)')&&window.__lifeos.App.state.view==='tool'));
   await p.evaluate(()=>{localStorage.removeItem('lifeos-lock');window.__lifeos.t.setSettings({lockMode:'off'});});
   await go('setpage',{id:'formats'});ok('v345 app lock row in Privacy',/App lock/.test(await p.evaluate(()=>document.querySelector('.page').innerText)));
   await go('setpage',{id:'data'});const dt=await p.evaluate(()=>document.querySelector('.page').innerText);ok('v345 data page has daily backups and history',/Daily backups/.test(dt)&&/Change history/.test(dt),dt.slice(0,200));}
  // v346 · views: table, board, gallery, timeline; save, pin to Today
  {await p.evaluate(()=>{const L=window.__lifeos,tk=L.todayK();L.t.setSettings({statuses:[{id:'s1',name:'In progress',sym:'◐'}]});const base={steps:[],notes:'',photos:[],repeat:{type:'never'},priority:'normal'};L.create('task',Object.assign({},base,{title:'View me',date:tk,deadline:tk,status:'s1',area:'Home'}));});
   for(const lay of ['table','board','gallery','timeline']){await p.evaluate(l=>{window.__lifeos.App.state._vw=null;window.__lifeos.App.go('view',{src:'task',fresh:true,layout:l,group:l==='board'?'status':'none'});},lay);await p.waitForTimeout(400);
     const got=await p.evaluate(l=>({t:!!document.querySelector(l==='table'?'.vwtbl':l==='board'?'.vwboard .vwcol':l==='gallery'?'.vwgal .vwcard':'.vwtl .vwbar'),txt:document.querySelector('.vwbody').innerText}),lay);ok(`v346 ${lay} view renders`,got.t&&/View me/.test(got.txt),got.txt.slice(0,120));}
   await p.evaluate(()=>[...document.querySelectorAll('.vwfoot button')].find(b=>/Save this view/.test(b.textContent)).click());await p.waitForTimeout(400);
   await p.fill('#f-x-n','Due soon');await p.waitForTimeout(200);await p.evaluate(()=>[...document.querySelectorAll('.sheet .sfoot-btn')].pop().click());await p.waitForTimeout(600);
   const vid=await p.evaluate(()=>(window.__lifeos.get.id('settings').views||[]).find(v=>v.name==='Due soon')?.id);ok('v346 view saved',!!vid,vid);
   await p.evaluate(id=>{const T=window.__lifeos.t;const L=T.todayLayout();L.splice(0,0,{id:'v:'+id});T.setTodayLayout(L);},vid);await go('today');
   ok('v346 a saved view can be a Today card',await p.evaluate(id=>!!document.querySelector(`[data-tk="v:${id}"]`)&&/View me/.test(document.querySelector(`[data-tk="v:${id}"]`).innerText),vid));
   await p.evaluate(id=>{const T=window.__lifeos.t;T.setTodayLayout(T.todayLayout().filter(x=>x.id!=='v:'+id));},vid);
   await go('more');ok('v346 More lists Views',/Views/.test(await p.evaluate(()=>document.querySelector('.page').innerText)));}
  // v347 · row details, task sheet parts, swipe choices, rename in place
  {await p.evaluate(()=>{const L=window.__lifeos,tk=L.todayK();L.create('task',{title:'Row test',steps:[],notes:'',photos:[],repeat:{type:'never'},priority:'normal',date:tk,area:'Home'});L.t.setSettings({rowHide:['area'],sheetHide:['notes','photos']});});
   await go('tasks');const rt=await p.evaluate(()=>[...document.querySelectorAll('[data-k^="t:"]')].map(r=>r.innerText).join('|'));ok('v347 row details hide the area',/Row test/.test(rt)&&!/Home/.test(rt.split('|').find(x=>/Row test/.test(x))||''),rt.slice(0,200));
   await p.evaluate(()=>[...document.querySelectorAll('[data-k^="t:"] button.grow')].find(b=>/Row test/.test(b.textContent)).click());await p.waitForTimeout(600);
   ok('v347 task sheet hides notes and photos',await p.evaluate(()=>{const sh=[...document.querySelectorAll('.sheet')].pop();return !!sh&&/Edit task/.test(sh.innerText)&&!sh.querySelector('#f-task-notes')&&!sh.querySelector('.addphoto');}));
   await p.evaluate(()=>document.querySelectorAll('.sheet button').forEach(b=>{if(b.textContent.trim()==='Cancel')b.click();}));await p.waitForTimeout(400);
   await go('setpage',{id:'tasks'});const tt=await p.evaluate(()=>document.querySelector('.page').innerText);ok('v347 tasks settings: rows, sheet, swipes',/Row details/.test(tt)&&/Swipe right/.test(tt)&&/Swipe left/.test(tt),tt.slice(0,200));
   await p.evaluate(()=>window.__lifeos.t.setSettings({rowHide:[],sheetHide:[]}));}
  // v348 · arrange a module page; tab hold shortcuts
  {await p.evaluate(()=>{window.__lifeos.t.setToolOn('Health','workouts',true);const L=window.__lifeos;L.create('entry',{hub:'Health',tool:'workouts',f:{what:'Run',min:30,date:L.todayK()}});});
   await p.evaluate(()=>window.__lifeos.App.go('tool',{hub:'Health',tool:'workouts'}));await p.waitForTimeout(500);
   const before=await p.evaluate(()=>[...document.querySelectorAll('#view .page > .slabel')].map(n=>(n.querySelector('.lbl')||n).textContent.replace(/\d+$/,'').trim()));
   if(before.length>=2){await p.evaluate(b=>{const T=window.__lifeos.t;T.setSettings({pageLayout:{'tool:Health|workouts':[{label:b[b.length-1],hidden:false},{label:b[0],hidden:true}]}});},before);await p.evaluate(()=>window.__lifeos.App.refresh());await p.waitForTimeout(400);
     const after=await p.evaluate(()=>[...document.querySelectorAll('#view .page > .slabel')].map(n=>(n.querySelector('.lbl')||n).textContent.replace(/\d+$/,'').trim()));
     ok('v348 arranged sections follow your order and hide',after[0]===before[before.length-1]&&!after.includes(before[0]),{before,after});
     await p.evaluate(()=>window.__lifeos.t.setSettings({pageLayout:{}}));}
   else ok('v348 module page has sections to arrange',false,before);
   await go('today');await p.evaluate(()=>{const b=document.querySelector('#nav-in .tab[data-tab="more"]');b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));});await p.waitForTimeout(650);
   ok('v348 holding a tab opens shortcuts',/Settings/.test(await p.evaluate(()=>document.querySelector('.menu,.ctxmenu,[role=menu]')?.innerText||'')));
   await p.evaluate(()=>{document.querySelector('#nav-in .tab[data-tab="more"]').dispatchEvent(new PointerEvent('pointerup',{bubbles:true}));document.body.click();});await p.keyboard.press('Escape');await p.waitForTimeout(300);}
  // v349 · modes hide other areas on Today; setup sharing rows
  {await p.evaluate(()=>{const L=window.__lifeos,tk=L.todayK(),base={steps:[],notes:'',photos:[],repeat:{type:'never'},priority:'normal',date:tk};L.create('task',Object.assign({title:'Work thing',area:'Career'},base));L.create('task',Object.assign({title:'Home thing',area:'Home'},base));L.t.setSettings({modes:[{id:'mw',name:'Work',areas:['Career'],quiet:true}],modeId:'mw'});const S=L.App.state;S._moreOpen=Object.assign({},S._moreOpen,{[tk]:true});});
   await go('today');let tt=await p.evaluate(()=>document.querySelector('#view .page').innerText);ok('v349 work mode shows only work tasks',/Work thing/.test(tt)&&!/Home thing/.test(tt),tt.slice(300,900));
   ok('v349 mode chip on Today',/Work/.test(await p.evaluate(()=>document.querySelector('.modechip')?.textContent||'')));
   await p.evaluate(()=>window.__lifeos.t.setSettings({modeId:null}));await go('today');tt=await p.evaluate(()=>document.querySelector('#view .page').innerText);ok('v349 no mode shows everything',/Home thing/.test(tt));
   await p.evaluate(()=>window.__lifeos.t.setSettings({modes:[]}));await go('setpage',{id:'data'});ok('v349 share your setup rows',/Share your setup[\s\S]*Use a setup/.test(await p.evaluate(()=>document.querySelector('.page').innerText)));}
  // v350 · learning: Noticed page, Smart settings, slips counted, usual next step learned
  {await go('noticed');ok('v350 Noticed page opens',/Noticed/.test(await p.evaluate(()=>document.querySelector('.page').innerText)));
   await go('setpage',{id:'smart'});await go('setpage',{id:'learners'});ok('v358 learners page',/Slip warning/.test(await p.evaluate(()=>document.querySelector('.page').innerText)));await go('setpage',{id:'smart'});const st=await p.evaluate(()=>document.querySelector('.page').innerText);ok('v350 Smart settings list learners',/Learn from my history/.test(st)&&/Learners/.test(st)&&/Reset what’s been learned/.test(st),st.slice(0,200));
   const sl=await p.evaluate(()=>{const L=window.__lifeos,tk=L.todayK();const t=L.create('task',{title:'Slippy',steps:[],notes:'',photos:[],repeat:{type:'never'},priority:'normal',date:tk});const add=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');};for(let i=1;i<=3;i++){t.date=add(i);L.put(t);}return L.get.id(t.id).slips;});
   ok('v350 moving a task forward counts slips',sl===3,sl);
   await go('noticed');ok('v350 slipping task is noticed',/Slippy has moved 3 times/.test(await p.evaluate(()=>document.querySelector('.page').innerText)));}
  // v351 · smarter repeat words and shorthand
  {const r=await p.evaluate(()=>{const T=window.__lifeos.t;return['Water plants every 3 days','Team sync every other tuesday','Gym mondays and thursdays','Review budget quarterly'].map(x=>{const v=T.capRepeat(x);return v&&v.label;});});
   ok('v351 repeat words',JSON.stringify(r)===JSON.stringify(['Every 3 days','Every other Tuesday','Mon, Thu','Every 3 months']),r);
   await p.evaluate(()=>window.__lifeos.t.setSettings({shorthand:[{w:'rx',to:'Medication refill'}]}));ok('v351 shorthand expands',await p.evaluate(()=>window.__lifeos.t.expandWords('rx for dad'))==='Medication refill for dad');
   await p.evaluate(()=>window.__lifeos.t.setSettings({shorthand:[]}));}
  // v352 · review draft, your questions, month story
  {await p.evaluate(()=>{const L=window.__lifeos,tk=L.todayK();const t=L.create('task',{title:'Draft me',steps:[],notes:'',photos:[],repeat:{type:'never'},priority:'high',date:tk});t.doneDates={[tk]:Date.now()};L.put(t);L.t.setSettings({rvQs:[{id:'q1',q:'What gave you energy?',per:[]}]});try{localStorage.removeItem('lo-rv-draft');}catch(e){}L.App.state.rv=null;L.App.go('review',{period:'month'});});await p.waitForTimeout(700);
   const r=await p.evaluate(()=>({wins:document.querySelector('#f-rv-wins')?.value||'',q:!!document.querySelector('#f-rvq-q1'),story:/Month story/.test(document.querySelector('.page').innerText)}));
   ok('v352 review drafts wins, asks your question, tells the month story',/Draft me/.test(r.wins)&&r.q&&r.story,r);
   await go('setpage',{id:'reviews'});ok('v352 reviews settings: your questions and drafts',/Your questions[\s\S]*Draft my review/.test(await p.evaluate(()=>document.querySelector('.page').innerText)));
   await p.evaluate(()=>{window.__lifeos.t.setSettings({rvQs:[]});try{localStorage.removeItem('lo-rv-draft');}catch(e){}window.__lifeos.App.state.rv=null;});}
  // v353 · reports, trackers, dashboard
  {await p.evaluate(()=>window.__lifeos.App.go('report',{id:'b:tasks'}));await p.waitForTimeout(500);ok('v353 a ready-made report draws a chart',await p.evaluate(()=>!!document.querySelector('.repage .dchart')));
   await p.evaluate(()=>{window.__lifeos.App.state._rep=null;window.__lifeos.App.go('report',{fresh:true});});await p.waitForTimeout(400);
   await p.evaluate(()=>[...document.querySelectorAll('#view .repage .chip')].find(b=>/^Bar|^Line|^Table/.test(b.textContent)).click());await p.waitForTimeout(300);await p.evaluate(()=>[...document.querySelectorAll('[role=menuitem]')].filter(b=>b.textContent.trim()==='Table').pop().click());await p.waitForTimeout(400);
   ok('v353 a report can be a table',await p.evaluate(()=>!!document.querySelector('#view .repage .reptbl')));
   await p.evaluate(()=>{const L=window.__lifeos;L.t.setToolOn('Health','measure',true);L.create('entry',{hub:'Health',tool:'measure',f:{t:'',what:'Water',unit:'cups',goal:8,agg:'sum',step:1,logs:[]}});});await go('trackers');
   await p.evaluate(()=>[...document.querySelectorAll('.trcard')].find(c=>/Water/.test(c.innerText)).querySelector('button.btn,button:last-child').click());await p.waitForTimeout(400);
   ok('v353 tracker + adds to today',/1 of 8 cups today/.test(await p.evaluate(()=>document.querySelector('.page').innerText)));
   await go('mydash');ok('v353 dashboard shows tiles',await p.evaluate(()=>document.querySelectorAll('.dashgrid > *').length>=2));
   await p.evaluate(()=>{window.__lifeos.App.state._vw=null;window.__lifeos.App.go('view',{src:'task',fresh:true,layout:'list'});});await p.waitForTimeout(400);await p.evaluate(()=>[...document.querySelectorAll('#view .vwlay')].find(b=>/Table/.test(b.textContent)).click());await p.waitForTimeout(400);ok('v353 switching layout on a new view sticks',await p.evaluate(()=>!!document.querySelector('#view .vwtbl')));
   await go('more');ok('v353 More lists Reports and Trackers',/Reports[\s\S]*Trackers/.test(await p.evaluate(()=>document.querySelector('.page').innerText)));}
  // v354 · goals overview, year at a glance, ask your data
  {await p.evaluate(()=>{const L=window.__lifeos,dl=new Date().getFullYear()+'-12-15';L.create('goal',{title:'Glance goal',steps:[],deadline:dl,area:'Health'});const tk=L.todayK();L.create('entry',{hub:'Health',tool:'workouts',f:{what:'Run',min:30,date:tk}});});
   await go('goalsboard');ok('v354 goals overview lists goals',/Glance goal/.test(await p.evaluate(()=>document.querySelector('.page').innerText)));
   await go('year');ok('v354 year at a glance shows the goal',/Glance goal/.test(await p.evaluate(()=>document.querySelector('.page').innerText)));
   await go('search');await p.fill('.searchbox input, #q','workouts this month');await p.waitForTimeout(400);ok('v354 ask your data answers',/Workouts this month/.test(await p.evaluate(()=>document.querySelector('.askcard')?.innerText||'')));}
  // v355 · planning settings, what if, shutdown, weather toggle
  {await go('setpage',{id:'planning'});const pt=await p.evaluate(()=>document.querySelector('.page').innerText);ok('v355 planning: theme days, breathing room',/Theme days[\s\S]*Breathing room/.test(pt),pt.slice(0,300));
   await go('studio');await p.evaluate(()=>{const b=document.querySelector('#view [aria-label="Studio options"]');b&&b.click();});await p.waitForTimeout(400);await p.evaluate(()=>{const b=[...document.querySelectorAll('button,[role=menuitem]')].find(b=>/What if/.test(b.textContent));b&&b.click();});await p.waitForTimeout(500);ok('v355 what-if shows the week',await p.evaluate(()=>document.querySelectorAll('.wifd').length===7));
   await p.evaluate(()=>document.querySelectorAll('.sheet button').forEach(b=>{if(b.textContent.trim()==='Close')b.click();}));await p.waitForTimeout(300);
   await go('setpage',{id:'today'});ok('v355 weather toggle on Today settings',/Weather on Today/.test(await p.evaluate(()=>document.querySelector('.page').innerText)));
   const tk=await p.evaluate(()=>window.__lifeos.todayK());await p.evaluate(tk=>window.__lifeos.t.setSettings({shutdownAt:tk}),tk);
   ok('v355 shutdown recorded',await p.evaluate(tk=>window.__lifeos.get.id('settings').shutdownAt===tk,tk));await p.evaluate(()=>window.__lifeos.t.setSettings({shutdownAt:null}));}
  // v356 · meeting notes to tasks, talk about next time
  {const n=await p.evaluate(()=>{const L=window.__lifeos,tk=L.todayK();const before=L.get.all('task').length;const b=L.create('block',{title:'Team sync',date:tk,start:600,dur:60,notes:'Q2 on track\n→ Send reminder to PIs\n-> Update the FAQ',repeat:{type:'never'}});return{before,id:b.id};});
   await p.evaluate(id=>{const L=window.__lifeos;},n.id);
   await go('today');await p.evaluate(id=>{const r=window.__lifeos.get.id(id);window.__lifeos.App.state.sel=window.__lifeos.todayK();},n.id);
   const made=await p.evaluate(()=>{const L=window.__lifeos;return L.get.all('task').filter(t=>/Send reminder to PIs|Update the FAQ/.test(t.title)).length;});
   ok('v356 notes arrows are not turned into tasks until saved',made===0,made);
   await p.evaluate(id=>window.__lifeos.sheets.block(window.__lifeos.get.id(id)),n.id);await p.waitForTimeout(600);await p.evaluate(()=>[...document.querySelectorAll('.sheet .sfoot-btn, .sheet button')].filter(b=>b.textContent.trim()==='Save').pop().click());await p.waitForTimeout(800);
   const made2=await p.evaluate(()=>window.__lifeos.get.all('task').filter(t=>/Send reminder to PIs|Update the FAQ/.test(t.title)).length);ok('v356 saving the event turns → lines into tasks',made2===2,made2);
   await p.evaluate(()=>{const L=window.__lifeos;L.t.setToolOn('Relationships','people',true);L.create('entry',{hub:'Relationships',tool:'people',f:{what:'Jordan Lee',topics:'Holiday plans\nThe album',every:30}});const tk=L.todayK();L.create('block',{title:'Coffee with Jordan',date:tk,start:900,dur:30,repeat:{type:'never'}});});
   await p.evaluate(()=>{window.__lifeos.App.state._sugOpen={[window.__lifeos.todayK()]:true};});await go('today');ok('v356 talk about next time shows on Today',/Talk to Jordan about holiday plans/i.test(await p.evaluate(()=>document.querySelector('#view .page').innerText)));}
  // v357 · cheers, receipt scanning, import wording
  {const c=await p.evaluate(()=>{const L=window.__lifeos;const n=L.t.cheerLine({cheers:[{by:'Sam',at:Date.now()},{by:'Ana',at:Date.now()},{by:'Sam',at:Date.now()-20*864e5}]});const old=L.t.cheerLine({cheers:[{by:'Sam',at:Date.now()-20*864e5}]});return [n&&n.textContent,old];});
   ok('v357 recent cheers are named once',/Sam, Ana cheered/.test(c[0])&&c[1]===null,c);
   await p.evaluate(()=>window.__lifeos.t.setToolOn('Finances','spending',true));
   await p.evaluate(()=>window.__lifeos.App.go('tool',{hub:'Finances',tool:'spending'}));await p.waitForTimeout(500);
   await p.evaluate(()=>{document.querySelectorAll('.sheet,.menu').forEach(x=>x.remove());const b=document.querySelector('#view [aria-label="Spending options"]');const r=b.getBoundingClientRect();b.dispatchEvent(new MouseEvent('click',{bubbles:true,clientX:r.left+5,clientY:r.bottom}));});await p.waitForTimeout(300);
   ok('v357 Spending offers Scan a receipt',await p.evaluate(()=>[...document.querySelectorAll('[role=menuitem]')].some(m=>m.textContent.trim()==='Scan a receipt')));
   await p.keyboard.press('Escape');await p.waitForTimeout(200);
   await go('more');ok('v357 import mentions Things and Reminders',/Things, Reminders/.test(await p.evaluate(()=>document.querySelector('#view').innerText)));}
  ok('no page errors',!errs.length,errs);await b.close();process.exit(fails?1:0);})();
