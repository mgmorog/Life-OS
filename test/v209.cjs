/* v209 checks: calendar import parsing, shifts, week start, palettes, pending reviews, dark mode screens */
const {chromium}=require('playwright');const fs=require('fs');const OUT='/home/claude/v209';fs.mkdirSync(OUT,{recursive:true});
let pass=0,fail=0;const ok=(n,c,x)=>{if(c){pass++;console.log('ok  ',n);}else{fail++;console.log('FAIL',n,x||'');}};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/test/page.html');await p.waitForTimeout(400);
const go=async(v,a)=>{await p.evaluate(([v,a])=>window.__lifeos.App.go(v,a),[v,a]);await p.waitForTimeout(300);};
const shot=async n=>{await p.evaluate(()=>{const t=document.querySelector('#toast');if(t)t.style.display='none';});await p.screenshot({path:`${OUT}/${n}.png`,fullPage:true});};
const set=async patch=>{await p.evaluate(pt=>{const L=window.__lifeos;L.put(Object.assign({},L.get.settings(),pt),{silent:true});L.App.refresh&&L.App.refresh();},patch);await p.waitForTimeout(150);};

/* 1. iCal parsing */
const r=await p.evaluate(()=>{const F=window.__lifeos.fx;const ics=['BEGIN:VCALENDAR','BEGIN:VEVENT','UID:a1@google.com','DTSTART:20261116T150000Z','DTEND:20261116T160000Z','SUMMARY:Standup\\, team','RRULE:FREQ=WEEKLY;BYDAY=MO,WE;COUNT=4','EXDATE:20261118T150000Z','END:VEVENT',
  'BEGIN:VEVENT','UID:t1-2026-11-20@life-os','DTSTART;VALUE=DATE:20261120','SUMMARY:Mine','END:VEVENT',
  'BEGIN:VEVENT','UID:b2','DTSTART;VALUE=DATE:20261125','DTEND;VALUE=DATE:20261127','SUMMARY:Trip','LOCATION:Long',' er place','END:VEVENT','END:VCALENDAR'].join('\r\n');
  const ev=F.parseIcs(ics);const occ=F.icalOcc(ev[0],'2026-11-01','2026-12-31').map(x=>x[0].slice(0,10));const trip=F.icalOcc(ev[1],'2026-11-01','2026-12-31');
  return{n:ev.length,sum:ev[0].sum,loc:ev[1].loc,occ,trip};});
ok('ics: skips Life OS own events',r.n===2,r.n);ok('ics: unescapes text',r.sum==='Standup, team',r.sum);ok('ics: unfolds lines',r.loc==='Longer place',r.loc);
ok('ics: weekly BYDAY + COUNT + EXDATE',JSON.stringify(r.occ)===JSON.stringify(['2026-11-16','2026-11-23','2026-11-25']),JSON.stringify(r.occ));
ok('ics: multi-day all-day',r.trip.length===1&&r.trip[0][0]==='2026-11-25'&&r.trip[0][1]==='2026-11-27',JSON.stringify(r.trip));
const r2=await p.evaluate(()=>{const F=window.__lifeos.fx;const L=a=>a.join('\r\n');
  const ev=F.parseIcs(L(['BEGIN:VCALENDAR','BEGIN:VEVENT','UID:m1','DTSTART:20260113T090000','DTEND:20260113T100000','RRULE:FREQ=MONTHLY;BYDAY=2TU','SUMMARY:Board','END:VEVENT',
    'BEGIN:VEVENT','UID:m2','DTSTART:20260131T090000','DTEND:20260131T100000','RRULE:FREQ=MONTHLY;COUNT=3','SUMMARY:EOM','END:VEVENT',
    'BEGIN:VEVENT','UID:w1','DTSTART:20261102T090000','DTEND:20261102T093000','RRULE:FREQ=WEEKLY','SUMMARY:Sync','END:VEVENT',
    'BEGIN:VEVENT','UID:w1','RECURRENCE-ID:20261109T090000','DTSTART:20261110T140000','DTEND:20261110T143000','SUMMARY:Sync (moved)','END:VEVENT','END:VCALENDAR']));
  const d=e=>F.icalOcc(e,'2026-01-01','2026-11-30').map(x=>x[0].slice(0,10));const w=d(ev[2]);
  return{board:d(ev[0]).slice(0,4),eom:d(ev[1]),w9:w.includes('2026-11-09'),w16:w.includes('2026-11-16'),moved:d(ev[3])};});
ok('ics: 2nd Tuesday monthly',JSON.stringify(r2.board)==='["2026-01-13","2026-02-10","2026-03-10","2026-04-14"]',JSON.stringify(r2.board));
ok('ics: monthly on the 31st skips short months',JSON.stringify(r2.eom)==='["2026-01-31","2026-03-31","2026-05-31"]',JSON.stringify(r2.eom));
ok('ics: moved occurrence replaces the original',!r2.w9&&r2.w16&&JSON.stringify(r2.moved)==='["2026-11-10"]',JSON.stringify(r2));
/* cached import feeds dayItems */
const di=await p.evaluate(()=>{const L=window.__lifeos,F=L.fx;L.put(Object.assign({},L.get.settings(),{icalFeeds:[{id:'c1',name:'Work cal',url:'https://x.test/a.ics',on:true}]}),{silent:true});
  const tk=L.todayK();const y=tk.replace(/-/g,'');F.Ical.events={c1:F.parseIcs(`BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nUID:z\r\nDTSTART:${y}T140000\r\nDTEND:${y}T150000\r\nSUMMARY:Imported thing\r\nEND:VEVENT\r\nEND:VCALENDAR`)};F.Ical._by=null;
  const d=L.dayItems(tk);return d.timed.filter(e=>e.title==='Imported thing').map(e=>[e.time,e.dur]);});
ok('import shows on the day at the right time',JSON.stringify(di)==='[[840,60]]',JSON.stringify(di));
await go('today');await shot('today-import');
await go('setpage',{id:'connect'});await shot('connections');
ok('connections page lists the calendar',await p.evaluate(()=>/Work cal/.test(document.body.innerText)));
/* backups never carry the link */
const bk=await p.evaluate(()=>{const s=window.__lifeos.get.settings();return!!s.icalFeeds;});ok('feed saved in settings',bk);

/* 2. shifts */
await set({jobs:[{id:'j1',name:'Hospital',flex:false,cycle:'week',shifts:[{id:'a',days:[0,2],start:420,end:1140}]},{id:'j2',name:'Cafe',flex:false,cycle:'week',shifts:[{id:'b',days:[5],start:600,end:900}]}]});
const sh=await p.evaluate(()=>{const F=window.__lifeos.fx;const mon='2026-11-16',sat='2026-11-21',tue='2026-11-17';return[F.shiftsOn(mon).length,F.shiftsOn(sat).length,F.shiftsOn(tue).length];});
ok('shifts land on their days',JSON.stringify(sh)==='[1,1,0]',JSON.stringify(sh));
await set({jobs:[{id:'n1',name:'Nights',flex:false,cycle:'week',shifts:[{id:'a',days:[0],start:1140,end:420}]}],protectEvenings:true});
const ov=await p.evaluate(()=>{const F=window.__lifeos.fx;return[F.shiftsOn('2026-11-16').map(x=>x.start+'-'+x.end).join(),F.shiftsOn('2026-11-17').map(x=>x.start+'-'+x.end+(x.carry?'c':'')).join()];});
ok('overnight shift carries into the next morning',ov[0]==='1140-420'&&ov[1]==='0-420c',JSON.stringify(ov));
await set({jobs:[{id:'j3',name:'Gig',flex:true,cycle:'week',shifts:[]}],flexRemind:true});
const fd=await p.evaluate(()=>window.__lifeos.fx.flexDue().length);ok('flexible job asks for hours',fd>=1,fd);
await go('inbox');await shot('inbox-flex');
await go('setpage',{id:'planning'});await shot('planning');

/* 3. week start */
const ws=await p.evaluate(()=>{const F=window.__lifeos.fx,L=window.__lifeos;const out=[];[0,1,3,6].forEach(w=>{L.put(Object.assign({},L.get.settings(),{weekStart:w}),{silent:true});out.push(new Date(F.weekStartOf(new Date(2026,10,19))).getDay());});return out;});
ok('week starts on any day',JSON.stringify(ws)==='[0,1,3,6]',JSON.stringify(ws));await set({weekStart:1});

/* 4. palettes and contrast */
const pal=await p.evaluate(()=>{const F=window.__lifeos.fx;return[F.safeAccent('#FFE600').join(),F.safeAccent('#466B5A').join()];});
ok('custom color darkened for contrast',pal[0]!=='255,230,0'&&pal[1]==='70,107,90',JSON.stringify(pal));
for(const pp of ['ocean','plum','clay','slate']){await set({palette:pp,mode:'light'});await go('today');const a=await p.evaluate(()=>getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());ok('palette '+pp+' applies',!!a&&a.toLowerCase()!=='#466b5a',a);await shot('pal-'+pp);}
await set({palette:'sage',mode:'dark'});
for(const [v,a,n] of [['today',null,'dark-today'],['calendar',null,'dark-cal'],['more',null,'dark-more'],['inbox',null,'dark-inbox'],['setpage',{id:'display'},'dark-display'],['setpage',{id:'notify'},'dark-notify'],['setpage',{id:'connect'},'dark-connect']]){await go(v,a);await shot(n);}
const bg=await p.evaluate(()=>getComputedStyle(document.body).backgroundColor);ok('dark mode darkens the page',/rgb\((\d+)/.test(bg)&&+bg.match(/rgb\((\d+)/)[1]<60,bg);
await p.evaluate(()=>window.__lifeos.sheets.task&&window.__lifeos.sheets.task(null));await p.waitForTimeout(400);await shot('dark-tasksheet');
await set({mode:'light'});

/* 5. pending reviews */
await p.evaluate(()=>{const L=window.__lifeos;L.put(Object.assign({},L.get.settings(),{weeklyReview:true,onboardedAt:Date.now()-40*864e5}),{silent:true});const t=L.create?L.create('task',{title:'Old one'}):null;if(t){t.createdAt=Date.now()-40*864e5;L.put(t,{silent:true});}});
const pr=await p.evaluate(()=>window.__lifeos.fx.pendingReviews().length);ok('missed reviews are listed',pr>=3,pr);
await set({weeklyReview:false});const pr2=await p.evaluate(()=>window.__lifeos.fx.pendingReviews().filter(x=>x.per==='week').length);ok('weekly toggle hides weekly catch-up',pr2===0,pr2);

ok('no page errors',errs.length===0,errs.join(' | '));
console.log(`${pass}/${pass+fail} passed`);await b.close();process.exit(fail?1:0);})();
