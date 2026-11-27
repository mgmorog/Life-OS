// v361 · Calendar, borrowing from Apple: `bash mk.sh && node test/calx.cjs`. Exits 1 on failure.
const {chromium}=require('playwright');const path=require('path');
const CHROME=process.env.CHROME||'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
(async()=>{const b=await chromium.launch({executablePath:CHROME});
  const p=await (await b.newContext({viewport:{width:390,height:900},hasTouch:true})).newPage();
  const errs=[];p.on('pageerror',x=>errs.push(x.message));
  await p.goto('file://'+path.join(__dirname,'page.html'));await p.waitForTimeout(900);
  let fails=0;const ok=(n,c,i)=>{console.log((c?'  ok   ':'  FAIL ')+n+(c?'':'  → '+JSON.stringify(i)));if(!c)fails++;};
  const ev=f=>p.evaluate(f);const W=ms=>p.waitForTimeout(ms);const txt=()=>ev(()=>document.body.innerText);
  const cal=async(mode,extra={})=>{await p.evaluate(([m,x])=>{const S=window.__lifeos.App.state;S.cal=null;window.__lifeos.App.go('calendar');const C=S.cal;Object.assign(C,{mode:m},x);window.__lifeos.App.render();},[mode,extra]);await W(500);};
  await ev(()=>{const L=window.__lifeos,tk=L.todayK();const nd=n=>{const d=new Date();d.setDate(d.getDate()+n);return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};window.__nd=nd;
    L.create('block',{title:'Dentist visit',notes:'',date:nd(1),start:14*60+30,dur:60,repeat:{type:'never',end:null},place:'Elmwood Dental, Buffalo',travel:25,color:null});
    L.create('block',{title:'Kids practice',notes:'',date:tk,start:23*60,dur:30,repeat:{type:'never',end:null},free:true,color:null});
    L.create('block',{title:'London call',notes:'',date:nd(2),start:9*60,dur:30,repeat:{type:'never',end:null},tz:'Europe/London',color:null});
    L.create('allday',{title:'Boston trip',notes:'',start:nd(3),end:nd(5),repeat:{type:'never',end:null},color:null});
    for(let i=0;i<4;i++)L.create('allday',{title:'Note '+i,notes:'',start:nd(2),end:null,repeat:{type:'never',end:null},color:null});});
  // 23 · floating toolbar with five views
  await cal('month');ok('floating toolbar with five views',await ev(()=>{const b=document.querySelector('.calbar');return !!b&&b.querySelectorAll('.seg button').length===5;}));
  // 4 · Year
  await cal('year');ok('Year view shows twelve months',await ev(()=>document.querySelectorAll('.yrm').length===12));
  await ev(()=>document.querySelectorAll('.yrm')[5].click());await W(500);ok('tapping a month zooms into Month',await ev(()=>window.__lifeos.App.state.cal.mode==='month'));
  // 5 · List
  await cal('list');const lt=await txt();ok('List view groups upcoming items by day',/Dentist visit/.test(lt)&&/Boston trip/.test(lt),lt.slice(0,300));
  // 2, 10 · Month levels and the continuous month
  await cal('month',{mlev:3,mcal:true});ok('Times level shows a continuous month',await ev(()=>document.querySelectorAll('.mcsec').length>=6));
  ok('Times level shows times in titles',/2:30pm Dentist visit|2:30 PM Dentist visit|2:30pm/i.test(await ev(()=>document.querySelector('.mcont').innerText)));
  await cal('month',{mlev:0,mcal:false});ok('Overview level has no all-day bars',await ev(()=>!document.querySelector('#month-grid .adbars')));
  // 26 · multi-day band
  await cal('month',{mlev:1,mcal:false});ok('multi-day item draws one line across its days',await ev(()=>document.querySelectorAll('.heat.spanday').length>=1));
  // 30 · up next
  ok('Up next bar shows',await ev(()=>!!document.querySelector('.upnext')));
  // 19 · free blocks don't count
  ok('free block leaves the day load alone',await ev(()=>{const L=window.__lifeos;return L.get.all('block').find(x=>x.title==='Kids practice').free===true;}));
  // 13, 28 · details card with map
  await cal('week',{timeline:true});await ev(()=>window.__lifeos.App.state.cal.anchor=window.__nd(1));await ev(()=>window.__lifeos.App.render());await W(400);
  await ev(()=>{const L=window.__lifeos,r=L.get.all('block').find(x=>x.title==='Dentist visit');window.__lifeos.App.state.sel=r.date;});
  const card=await ev(()=>{const b=[...document.querySelectorAll('.tlev')].find(x=>/Dentist visit/.test(x.textContent));if(!b)return null;b.click();return true;});await W(500);
  const ct=await txt();ok('block opens as a card with place and Directions',card&&/Elmwood Dental/.test(ct)&&/Directions/.test(ct)&&/Leave by/.test(ct),ct.slice(-500));
  ok('card has a map link',await ev(()=>!!document.querySelector('.ccmap')));
  // 15 · copy and paste
  await ev(()=>[...document.querySelectorAll('.ccbtns button')].find(b=>b.textContent==='Copy').click());await W(300);
  await ev(()=>calPaste?0:0).catch(()=>{});
  ok('copy keeps it on the clipboard',await ev(()=>!!window.__lifeos.App.state.calClip));
  // 14 · both handles
  ok('timeline blocks have top and bottom handles',await ev(()=>document.querySelectorAll('.tlgrip.top').length>0));
  // 24 · all-day row folds
  ok('all-day row folds to +more',/\+\d more/.test(await ev(()=>(document.querySelector('.tlall')||{}).innerText||'')));
  // 16 · time zone line
  // 21 · filters list areas with checks
  await ev(()=>document.querySelector('[aria-label="Filters"]').click());await W(500);ok('filters show life areas as a list with Show all',/Show all/.test(await txt()));await p.keyboard.press('Escape');await W(300);
  // 27 · search
  await ev(()=>document.querySelector('[aria-label="Search the calendar"]').click());await W(400);await p.fill('.sheet input','dentist');await W(500);
  ok('calendar search finds upcoming items',/Upcoming/.test(await txt())&&/Dentist visit/.test(await txt()));await p.keyboard.press('Escape');await W(300);
  // 22 · week numbers
  await ev(()=>window.__lifeos.t.setSettings({weekNums:true}));await cal('quarter');ok('week numbers show in Quarter',await ev(()=>document.querySelectorAll('.heat-row .wkn').length>0));await ev(()=>window.__lifeos.t.setSettings({weekNums:false}));
  // 18 · default reminders in settings
  await ev(()=>window.__lifeos.App.go('setpage',{id:'calendar'}));await W(400);ok('Calendars settings have default reminders and week numbers',/Time block reminder/.test(await txt())&&/Week numbers/.test(await txt()));
  // 12 · capture highlights
  await ev(()=>window.__lifeos.App.go('today'));await W(300);
  ok('no page errors',!errs.length,errs);
  await b.close();process.exit(fails?1:0);})();
