/* ---------- Today ---------- */
const HH=56;
function snapItem(e){const before=clone(e.rec),ids=new Set(get.all(before.kind).map(r=>r.id));return()=>{put(before,{silent:true});get.all(before.kind).forEach(r=>{if(!ids.has(r.id))remove(r.id,{silent:true});});App.refresh();};}
function pickProject(r){let inst;const ps=get.all('project').filter(p=>!p.finished&&p.id!==r.part);inst=openSheet({title:`Add “${r.title}” to`,left:{label:'Cancel'},build:b=>{b.append(el('div',{class:'list'},ps.map(p=>el('button',{class:'li',style:'min-height:54px',onclick:()=>{const was=r.part;r.part=p.id;if(!r.area&&p.area)r.area=p.area;put(r);inst.close();toast(`Added to ${p.title}`,()=>{r.part=was;put(r);});}},el('span',{class:'grow'},el('b',{style:'font-weight:500'},p.title),p.area?el('small',{},p.area):null),el('span',{class:'chev',html:ic('chevr',16,2)}))),r.part?el('button',{class:'li',style:'min-height:54px;color:var(--now)',onclick:()=>{const was=r.part;r.part=null;put(r);inst.close();toast('Removed from project',()=>{r.part=was;put(r);});}},'Remove from its project'):null));}});}
function itemMenu(e,dk,x,y){
  const r=e.rec;
  if(e.kind==='gcal'){openMenu(x,y,[{label:'See details',icon:'cal',onclick:()=>Gcal.details(e)}]);return;}
  if(e.kind==='routine'){openMenu(x,y,[{label:'Open routine',icon:'routine',onclick:()=>App.go('routine',{id:r.id})},{label:e.done?'Mark not done':'Mark done',icon:'task',onclick:()=>{toggleItem(e,dk);App.refresh();}}]);return;}
  const canDup=['task','block','allday'].includes(e.kind),movable=e.kind!=='allday';const occDay=e.kind==='allday'?allDayOccStart(r,dk):dk;
  openMenu(x,y,[
    {label:'Edit',icon:'edit',onclick:()=>openItem(e,dk)},
    e.kind!=='allday'?{label:e.done?'Mark not done':'Mark done',icon:'task',onclick:()=>{toggleItem(e,dk);App.refresh();}}:null,
    movable?{label:e.time!=null?'Change the time':'Set a time',icon:'time',onclick:()=>timeSheet(e,dk)}:null,
    {label:'Move to tomorrow',icon:'arrow',onclick:()=>{const u=snapItem(e),d=addK(occDay,1);moveItemDay(e,occDay,d);toast(`Moved to ${relDay(d)}`,u);}},
    movable&&e.kind==='task'?{label:'Move to this weekend',icon:'arrow',onclick:()=>{const u=snapItem(e),t=fromK(todayK()),d=k(addD(t,(6-t.getDay()+7)%7||(occDay===todayK()?7:0)));moveItemDay(e,occDay,d);toast(`Moved to ${relDay(d)}`,u);}}:null,
    movable&&e.kind==='task'?{label:'Move to next week',icon:'arrow',onclick:()=>{const u=snapItem(e),d=k(addD(weekStartOf(today()),7));moveItemDay(e,occDay,d);toast(`Moved to ${relDay(d)}`,u);}}:null,
    {label:'Move to another day',icon:'cal',onclick:()=>moveSheet(e,occDay)},
    e.time!=null&&e.kind!=='block'?{label:'Remove the time',icon:'x',onclick:()=>{const u=snapItem(e);setItemTime(e,dk,null);App.refresh();toast('Time removed',u);}}:null,
    e.kind==='task'?{label:r.priority==='high'?'Remove high priority':'Mark high priority',icon:'flag',onclick:()=>{const was=r.priority;r.priority=was==='high'?'normal':'high';put(r);toast(r.priority==='high'?'Marked high priority':'Priority cleared',()=>{r.priority=was;put(r);});}}:null,
    e.kind==='task'&&!e.done?{label:frNow()&&frNow().id===r.id?'Back to the timer':'Start focus',icon:'play',onclick:()=>startFocus(r)}:null,
    e.kind==='task'&&r.part&&(get.id(r.part)||{}).kind==='project'?{label:'Waits for…',icon:'layers',onclick:()=>depSheet(r)}:null,
    e.kind==='task'&&get.all('project').some(p=>!p.finished)?{label:r.part?'Move to another project':'Add to a project',icon:'project',onclick:()=>pickProject(r)}:null,
    canDup?{label:'Duplicate',icon:'copy',onclick:()=>{const c=clone(r);delete c.id;delete c.createdAt;delete c.doneDates;delete c.skip;delete c.stepDone;delete c.autoSteps;(c.steps||[]).forEach(x=>{x.d=false;x.doneAt=null;});if(c.repeat&&c.repeat.type!=='never'){c.repeat={type:'never',end:null};if(c.kind==='allday'){if(c.end)c.end=addK(occDay,daysBetween(c.start,c.end));c.start=occDay;}else c.date=dk;}const made=put(Object.assign({id:uid(r.kind[0])},c));toast('Duplicated',()=>remove(made.id));}}:null,
    e.kind==='habit'&&(r.sessions||{})[dk]?{label:'Remove from this day',icon:'x',danger:true,onclick:()=>{const u=snapItem(e);delete r.sessions[dk];put(r);toast('Removed from this day',u);}}:null,
    canDup?{label:'Delete',icon:'trash',danger:true,onclick:()=>deleteFlow(r,occDay)}:null,
  ]);
}
function openItem(e,dk){
  if(e.rec&&e.rec.tripId&&get.id(e.rec.tripId)){App.go('trip',{id:e.rec.tripId});return;}
  if(e.rec&&e.rec.bookId){const bk=get.id(e.rec.bookId);if(bk&&bk.f.trip&&get.id(bk.f.trip)){App.go('trip',{id:bk.f.trip});return;}}
  if(e.kind==='task')taskSheet(e.rec,{occ:dk});else if(e.kind==='block')blockSheet(e.rec,{occ:dk});else if(e.kind==='allday')alldaySheet(e.rec,{occ:dk});else if(e.kind==='habit')App.go('habit',{id:e.rec.id});else if(e.kind==='step')App.go('plan',{id:e.rec.id});else if(e.kind==='routine')App.go('routine',{id:e.rec.id});else if(e.kind==='gcal'){Gcal.details(e);return;}
  noteRecent(e.rec);
}
/* one occurrence of a repeating item becomes its own item on that day */
function detachIfRepeating(r,dk){if(r.repeat&&r.repeat.type!=='never'){r.skip=[...(r.skip||[]),dk];put(r,{silent:true});const c=clone(r);delete c.createdAt;delete c.skip;delete c.doneDates;delete c.autoSteps;const sd=(c.stepDone||{})[dk];delete c.stepDone;if(sd)(c.steps||[]).forEach(x=>{x.d=!!sd[x.id];});c.id=uid(r.kind[0]);c.repeat={type:'never',end:null};if(r.kind==='allday'){if(c.end)c.end=addK(dk,daysBetween(c.start,c.end));c.start=dk;}else c.date=dk;return put(c,{silent:true});}return r;}
function moveItemDay(e,dk,dest){
  if(e.kind==='task'||e.kind==='block'){const r=detachIfRepeating(e.rec,dk);r.date=dest;put(r);}
  else if(e.kind==='allday'){const r=detachIfRepeating(e.rec,dk);if(r.end)r.end=addK(dest,daysBetween(r.start,r.end));r.start=dest;put(r);}
  else if(e.kind==='step'){e.step.date=dest;put(e.rec);}
  else if(e.kind==='habit'){const h=e.rec;h.sessions=h.sessions||{};const se=h.sessions[dk];delete h.sessions[dk];h.sessions[dest]=se||{time:null};put(h);}
}
function setItemTime(e,dk,time){
  if(e.kind==='task'){const r=detachIfRepeating(e.rec,dk);r.time=time;r.date=r.date||dk;if(time!=null&&r.reminder==null)r.reminder=0;if(time==null)r.reminder=null;put(r,{silent:true});}
  else if(e.kind==='block'){const r=detachIfRepeating(e.rec,dk);if(time!=null)r.start=time;put(r,{silent:true});}
  else if(e.kind==='step'){e.step.time=time;e.step.date=e.step.date||dk;put(e.rec,{silent:true});}
  else if(e.kind==='habit'){const h=e.rec;h.sessions=h.sessions||{};h.sessions[dk]={time};put(h,{silent:true});}
}
function timeSheet(e,dk){
  let val=e.time!=null?e.time:(dk===todayK()?nextQuarter():9*60),inst;
  const c=formCtx(()=>{});const u=snapItem(e);
  inst=openSheet({title:e.time!=null?'Change the time':'Set a time',left:{label:'Cancel'},right:{label:'Done',onclick:()=>{setItemTime(e,dk,val);inst.close();toast(`Set for ${fmtT(val)}`,u);}},build:b=>{b.append(el('p',{class:'muted'},e.title),el('div',{class:'card'},c.wheel(()=>val,v=>{val=v;})));}});
}
function moveSheet(e,dk){
  let inst;const c=formCtx(()=>{});const u=snapItem(e);
  inst=openSheet({title:'Move to',build:b=>{b.append(el('p',{class:'muted'},e.title),el('div',{class:'card'},c.calendar(dk,d=>{if(!d||d===dk){inst.close();return;}moveItemDay(e,dk,d);inst.close();toast(`Moved to ${relDay(d)}`,u);})));}});
}
function goDay(dk){const S=App.state;if(dk===S.sel)return;const dir=dk>S.sel?1:-1;S._anim=null;S.sel=dk;S._fresh=true;S._gridTop=null;if(S.view!=='today'){App.refresh();return;}daySwap(()=>{clearTimeout(App._r);App.render();},dir);}
/* reminders: an alert in the app, never fired twice, kept until dealt with */
function inQuiet(d){const q=get.settings().quiet;if(!q||!q.on)return false;const m=d.getHours()*60+d.getMinutes();return q.from<q.to?(m>=q.from&&m<q.to):(m>=q.from||m<q.to);}
const remState=()=>get.id('remstate')||{id:'remstate',kind:'remstate',map:{}};
function dueReminders(){
  const now=Date.now(),tk=todayK(),st=remState(),out=[];
  for(let i=0;i<=14;i++){const dk=addK(tk,i),d=dayItems(dk);
    [...d.allDay,...d.timed].forEach(e=>{const m=e.rec.reminder;if(m==null||e.done||e.kind==='habit'||e.kind==='step'||e.kind==='gcal')return;if(e.kind==='allday'&&allDayOccStart(e.rec,dk)!==dk)return;
      const base=fromK(dk).getTime()+(e.time||0)*6e4;let fire=base-m*6e4;if(base-m*6e4>now)return;if(inQuiet(new Date(fire))&&inQuiet(new Date(now)))return;
      const key=e.id+'|'+dk,v=st.map[key];if(v==='x'||(typeof v==='number'&&v>now))return;
      out.push({e,dk,key,base});});}
  get.all('allday').forEach(r=>{if(r.reminder==null||r.reminder<14*1440)return;for(let i=15;i<=60;i++){const dk=addK(tk,i);if(!occursOn(r.start,r.repeat,dk,r.skip))continue;if(fromK(dk).getTime()-r.reminder*6e4>now)continue;const key=r.id+'|'+dk,v=st.map[key];if(v==='x'||(typeof v==='number'&&v>now))continue;out.push({e:{kind:'allday',id:r.id,rec:r,title:r.title,color:colorHex(r.color),icon:r.icon,area:r.area},dk,key,base:fromK(dk).getTime()});}});
  return out.sort((a,b)=>a.base-b.base);
}
function setRem(key,v){const st=remState(),tk=todayK();st.map[key]=v;for(const x in st.map){if(x.split('|')[1]<tk)delete st.map[x];}put(st);}
function reminderCard(){
  const due=dueReminders();if(!due.length)return null;
  return el('section',{class:'card remcard',role:'status'},el('div',{class:'eyebrow',style:'display:flex;gap:8px;align-items:center;color:var(--now)',html:ic('bell',16,2)+`<span>Reminder${due.length>1?'s':''}</span>`}),
    due.slice(0,4).map(({e,dk,key})=>el('div',{class:'remrow'},el('button',{class:'grow',style:'text-align:left',onclick:()=>{setRem(key,'x');openItem(e,dk);}},el('b',{},e.title),el('small',{},`${relDay(dk)}${e.time!=null?' · '+fmtT(e.time):' · All day'}`)),
      el('span',{class:'remacts'},e.kind!=='allday'?el('button',{class:'chip',onclick:()=>{toggleItem(e,dk);setRem(key,'x');buzz(8);}},'Done'):null,el('button',{class:'chip',onclick:()=>{setRem(key,Date.now()+10*6e4);toast('Reminding you in 10 minutes');}},'10 min'),el('button',{class:'iconbtn','aria-label':`Dismiss ${e.title}`,style:'width:36px;height:36px',html:ic('x',16,2.2),onclick:()=>setRem(key,'x')})))));
}
const toastedRem=new Set();
function checkReminders(){dueReminders().forEach(({e,key})=>{if(toastedRem.has(key))return;toastedRem.add(key);if(App.state.view==='today'&&!sheetStack.length){App.refresh();return;}buzz(30);toast(`Reminder: ${e.title}`);});}
function viewToday(root){
  const S=App.state,dk=S.sel,sel=fromK(dk),tk=todayK(),isToday=dk===tk;
  const first=!S._painted;
  const page=el('div',{class:'page'+(first?' firstpaint':'')});
  const inboxN=get.all('idea').length;
  page.append(el('header',{},
    el('div',{class:'hd-eyebrow'},el('div',{class:'eyebrow',style:'font-size:13px'},DOW[sel.getDay()]+(sel.getFullYear()!==today().getFullYear()?` · ${sel.getFullYear()}`:'')),!isToday?el('button',{class:'pill-today',onclick:()=>goDay(tk)},'Today'):((n)=>n&&!get.settings().carryOver?el('button',{class:'pill-today',style:'color:var(--now)',onclick:()=>{App.state.taskTab='today';App.go('tasks');}},`${n} overdue ›`):null)(carried().length)),
    el('div',{class:'hd'},
      el('button',{class:'date','aria-label':'Pick a date',onclick:()=>pickDay(),html:`<span>${MON[sel.getMonth()]} ${sel.getDate()}</span>`+ic('chevd',20,2)}),
      el('div',{class:'icons'},
        el('button',{class:'iconbtn','aria-label':`Inbox, ${inboxN} ideas`,html:ic('inbox',24)+(inboxN?`<span class="badge" data-roll="inbox">${inboxN}</span>`:''),onclick:()=>App.go('inbox')}),
        el('button',{class:'iconbtn','aria-label':'Share this day',html:ic('share',24),onclick:()=>shareDaySheet(dk)}))),
    weekStrip(dk)));
  if(S.loading&&!recs.size){page.append(el('section',{class:'card',style:'display:grid;gap:12px'},el('div',{class:'skel',style:'height:14px;width:30%'}),el('div',{class:'skel',style:'height:30px;width:70%'}),el('div',{class:'skel',style:'height:200px'})));root.append(page);return;}
  const s=get.settings();
  {const fc=focusRunChip();if(fc)page.append(fc);}
  if(!s.introDone&&!recs.size)page.append(introCard());
  if(isToday){const gc=gsCard();if(gc)page.append(gc);const pe=planEveCard(dk);if(pe)page.append(pe);}
  if(isToday||dk===addK(todayK(),1)){const t3=top3Card(dk);if(t3)page.append(t3);}
  {const nc=nowCard(dk);if(nc)page.append(nc);}
  const rem=reminderCard();if(rem)page.append(rem);
  if(isToday&&typeof s.seenVer==='number'&&s.seenVer<APP_VER)page.append(el('div',{class:'focus-chip'},el('button',{class:'grow small',style:'text-align:left;min-height:32px',onclick:whatsNew},`What’s new in Life OS ${APP_VER}`),el('button',{class:'fa',onclick:whatsNew},'See ›'),el('button',{class:'iconbtn','aria-label':'Dismiss',style:'width:32px;height:32px',html:ic('x',14,2.2),onclick:()=>setSettings({seenVer:APP_VER})})));
  if(isToday&&s.inboxNudge&&inboxN>=5&&s.nudgeOff!==weekKey(today()))page.append(el('div',{class:'focus-chip'},el('button',{class:'grow small',style:'text-align:left;min-height:32px',onclick:()=>App.go('inbox')},`${inboxN} ideas waiting in your Inbox`),el('button',{class:'fa',onclick:()=>App.go('inbox')},'Sort ›'),el('button',{class:'iconbtn','aria-label':'Dismiss for this week',style:'width:32px;height:32px',html:ic('x',14,2.2),onclick:()=>setSettings({nudgeOff:weekKey(today())})})));
  if(isToday&&s.checkinCard&&sel.getDay()===(s.reviewDay??0)&&s.checkinDone!==dk&&!(s.onboardedAt&&Date.now()-s.onboardedAt<6*864e5))page.append(s.checkinLater===dk?el('button',{class:'focus-chip',onclick:()=>App.go('review')},el('span',{class:'small'},'Weekly review'),el('span',{class:'fa'},'Start ›')):checkinCard(dk));
  if(isToday){const gz=goalPulseCard();if(gz)page.append(gz);const gc=goalCheckCard();if(gc)page.append(gc);const cf=cfg('Health','checkin').f;if(cf.rem&&!checkOn(dk)&&nowMin()>=(tMin(cf.at||'21:00')??1260))page.append(el('button',{class:'focus-chip',onclick:()=>App.go('tool',{hub:'Health',tool:'checkin'})},el('span',{class:'small'},'Daily check-in'),el('span',{class:'fa'},'Log ›')));}
  {const tc=tripTodayCard(dk);if(tc)page.append(tc);}
  if(isToday&&s.lessonCard!==false&&!hubHidden('Personal growth').includes('lessons')){const ls=lessonToday();if(ls&&ls.f.kept!==dk&&ls.f.seen!==dk)page.append(el('section',{class:'card res',style:'padding:14px 16px'},el('div',{class:'bl'},el('span',{class:'lbl',style:'color:var(--accent-text)'},'A lesson you wrote'),el('button',{class:'iconbtn','aria-label':'Hide for today',style:'width:32px;height:32px',html:ic('x',14,2.2),onclick:()=>{ls.f.seen=dk;put(ls);}})),el('p',{class:'serif',style:'font-size:20px;line-height:1.25;margin-top:6px'},ls.f.lesson),el('div',{style:'display:flex;gap:8px;margin-top:10px'},el('button',{class:'chip',onclick:()=>{ls.f.kept=dk;put(ls);toast('Kept. You’ll see it again in a few months.');}},'Still true'),el('button',{class:'chip line',onclick:()=>App.go('tool',{hub:'Personal growth',tool:'lessons'})},'All lessons'))));}
  page.append(dayCard(dk));
  {const pc=pinsCard(dk);if(pc)page.append(pc);}
  if(isToday&&s.areaDue!==false){const ad=areaDueCard(dk);if(ad)page.append(ad);}
  {const wc=waitCard(dk);if(wc)page.append(wc);}
  if(isToday){const pc=pinnedListsToday();if(pc)page.append(pc);const pl=plateCard(dk);if(pl)page.append(pl);}
  const tm=addD(sel,1),tmk=k(tm),td=dayItems(tmk),tl=[...td.allDay,...td.timed,...td.anytime],firstT=td.timed[0];
  page.append(el('section',{class:'card'+(first?' fade-up':''),style:first?'animation-delay:.12s':null},el('button',{class:'tmr',onclick:ev=>{const r=ev.currentTarget.closest('.card').getBoundingClientRect(),S2=App.state;zoomFrom(r,()=>{S2.sel=tmk;S2._fresh=true;S2._gridTop=null;S2._anim=null;scrollTo(0,0);clearTimeout(App._r);App.render();});}},
    el('div',{class:'tile'},el('small',{},DOW[tm.getDay()].slice(0,3).toUpperCase()),el('span',{},String(tm.getDate()))),
    el('div',{class:'grow'},el('h3',{},isToday?'Tomorrow':relDay(tmk)),el('p',{},tl.length?`${tl.length} planned${firstT?' · first at '+fmtT(firstT.time):''}`:'Nothing planned yet')),
    el('span',{class:'chev',html:ic('chevr',16,2.2)}))));
  root.append(page);
  S._painted=true;S._anim=null;
  const mini=$('#mini');mini.textContent=`${MON[sel.getMonth()]} ${sel.getDate()}`;mini.onclick=()=>scrollTo({top:0,behavior:'smooth'});
}
function weekStrip(dk){
  const sel=fromK(dk),start=weekStartOf(sel),tk=todayK();
  const strip=el('div',{class:'weekstrip',id:'week-strip','aria-label':'Choose a day'});
  [-7,0,7].forEach(off=>{const pg=el('div',{class:'wkpage'});for(let i=0;i<7;i++){const x=addD(start,off+i),xk=k(x),has=dayItems(xk),any=has.timed.length+has.anytime.length+has.allDay.length;
    pg.append(el('button',{class:(xk===dk?'sel ':'')+(xk===tk?'today ':'')+(any?'has':''),'aria-label':shortDay(xk),'aria-current':xk===dk?'date':null,onclick:()=>{if(strip._moved)return;goDay(xk);}},el('span',{class:'dl'},DOW[x.getDay()].slice(0,3).toUpperCase()),el('span',{class:'dn'},String(x.getDate()))));}strip.append(pg);});
  requestAnimationFrame(()=>{strip.scrollLeft=strip.clientWidth;strip._ready=true;});
  let t;strip.addEventListener('scroll',()=>{if(!strip._ready||strip._drag)return;clearTimeout(t);t=setTimeout(()=>{if(!strip.isConnected)return;const w=strip.clientWidth;if(!w)return;const p=Math.round(strip.scrollLeft/w);if((p!==0&&p!==2)||Math.abs(strip.scrollLeft-p*w)>2)return;goDay(addK(App.state.sel,p===0?-7:7));},110);},{passive:true});
  // mouse: drag the strip the way a finger does
  strip.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'||e.button)return;const x0=e.clientX,s0=strip.scrollLeft;let on=false;
    const mv=ev=>{const dx=ev.clientX-x0;if(!on&&Math.abs(dx)>5){on=true;strip._drag=true;strip._moved=true;strip.style.scrollSnapType='none';strip.style.cursor='grabbing';}if(on)strip.scrollLeft=s0-dx;};
    const up=ev=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);if(!on)return;const w=strip.clientWidth,dx=ev.clientX-x0,p=Math.abs(dx)>w*.18?(dx<0?2:0):1;strip._drag=false;strip.style.cursor='';strip.scrollTo({left:p*w,behavior:'smooth'});setTimeout(()=>{strip._moved=false;if(p===1)strip.style.scrollSnapType='';},320);};
    addEventListener('pointermove',mv);addEventListener('pointerup',up);});
  return strip;
}
function pickDay(){
  let inst;const c=formCtx(()=>{});
  inst=openSheet({title:'Go to a day',build:body=>{body.append(el('div',{class:'card'},c.calendar(App.state.sel,dk=>{if(dk){inst.close();goDay(dk);}})),el('button',{class:'btn quiet block',onclick:()=>{inst.close();goDay(todayK());}},'Jump to today'));}});
}
function dueExtras(dk,shown){
  const tk=todayK();return get.all('task').filter(t=>isOpenTask(t)&&t.deadline&&(t.deadline===dk||(dk===tk&&t.deadline<dk))&&!shown.has(t.id)&&!occursOn(t.date,t.repeat,dk,t.skip));
}
function dayCard(dk){
  const S=App.state,tk=todayK(),isToday=dk===tk,isPast=dk<tk;
  const{allDay,timed,anytime}=dayItems(dk);
  const nowM=nowMin(),all=[...timed,...anytime].filter(e=>e.kind!=='gcal'),open=all.filter(e=>!e.done),late=isToday&&get.settings().carryOver?carried():[],lateIn=late.filter(t=>!all.some(e=>e.id===t.id)),doneX=isToday?get.all('task').filter(t=>t.date&&t.date<tk&&(!t.repeat||t.repeat.type==='never')&&isDone(t,t.date)&&k(new Date(typeof t.doneDates[t.date]==='number'?t.doneDates[t.date]:0))===tk).length+get.all('habit').filter(h=>habitWeekly(h)&&!all.some(e=>e.id===h.id)&&habitDone(h,dk)).length:0,total=all.length+lateIn.length+doneX,left=open.length+lateIn.length;
  const next=isToday?timed.find(e=>!e.done&&e.time+(e.dur||30)>nowM):timed.find(e=>!e.done);
  let eye=isToday?'Today':relDay(dk),head=emptyDayHead(dk),sub=isPast?'':'Tap an hour below, or add something.';
  if(next){const during=isToday&&next.time<=nowM;eye=isToday?(during?'Happening now':'Up next'):eye;head=next.title;sub=next.kind==='task'?fmtT(next.time):fmtRange(next.time,next.time+(next.dur||30));
    if(isToday){const mins=during?next.time+(next.dur||30)-nowM:next.time-nowM;sub+=` · ${during?fmtDurS(mins)+' left':'in '+fmtDurS(mins)}`;}}
  else if(!open.length&&lateIn.length){const n=lateIn.length;head=`${n} carried over`;sub=all.length?'Today’s plan is done. Finish or move what’s left.':'Nothing else is planned. Finish or move it below.';}
  else if(isToday&&!open.length&&areaDueOpen(dk)){const n=areaDueOpen(dk);head=`${n} due from your life areas`;sub=all.length?'Today’s plan is done. They’re listed below.':'Nothing else is planned. They’re listed below.';}
  else if(total&&!left){head='All done';sub=isToday?'Nice work. Anything else can wait.':'Everything here is finished.';}
  else if(left){head=`${left} ${left===1?'thing':'things'} to do`;sub=isPast?'Left open on this day.':'Nothing else is scheduled. Tap an hour to block time.';}
  const first=!S._painted;
  const day=el('section',{class:'card daycard'+(first?' fade-up ':' ')+(S._anim||'')},
    el('div',{style:'display:flex;justify-content:space-between;gap:8px;align-items:baseline'},el('div',{class:'eyebrow'},eye),total?el('button',{class:'small muted tnum',style:'min-height:28px','aria-pressed':String(!!S.hideDone),'aria-label':S.hideDone?'Show finished items':'Hide finished items',onclick:()=>{S.hideDone=!S.hideDone;App.refresh();}},el('span',{'data-roll':'done'},`${total-left} of ${total} done`),total-left?el('span',{style:'margin-left:6px;color:var(--accent-text);font-weight:600'},S.hideDone?'Show':'Hide'):null):null),
    next?el('button',{style:'display:block;width:100%;text-align:left',onclick:()=>openItem(next,dk)},el('h2',{},head)):el('h2',{},head),sub?el('p',{class:'sub'},sub):null,
    el('div',{class:'chips'},
      el('button',{class:'chip',onclick:()=>taskSheet(null,{date:dk})},'+ Task'),
      el('button',{class:'chip',onclick:()=>blockSheet(null,{date:dk,start:isToday?nextQuarter():9*60})},'+ Time block'),
      el('button',{class:'chip',onclick:()=>alldaySheet(null,{start:dk})},'+ All-day')));
  onSwipe(day,()=>goDay(addK(S.sel,1)),()=>goDay(addK(S.sel,-1)));
  const adShow=allDay.filter(e=>!(e.rec&&e.rec.tripId));if(adShow.length)day.append(el('div',{class:'allday-row'},adShow.map(e=>{const b=el('button',{class:'adchip',style:`--c:${e.color}`,html:(e.icon?glyph(e.icon,16,2):'')+`<span>${esc(e.title)}</span>`,onclick:()=>openItem(e,dk)});onPress(b,(x,y)=>itemMenu(e,dk,x,y));return b;})));
  const shown=new Set([...late.map(t=>t.id),...all.map(e=>e.id)]);
  const due=dueExtras(dk,shown);
  if(late.length>1)day.append(el('div',{class:'sect-h'},el('span',{class:'lbl'},'Carried over'),el('button',{class:'linkbtn small',onclick:()=>{const before=late.map(t=>[t,t.date]);late.forEach(t=>{t.date=tk;t.moves=(t.moves||0)+1;put(t,{silent:true});});App.refresh();toast(`${late.length} moved to today`,()=>{before.forEach(([t,d])=>{t.date=d;put(t,{silent:true});});App.refresh();});}},'Move all to today')));
  const lateDone=isToday?get.all('task').filter(t=>t.date&&t.date<tk&&(!t.repeat||t.repeat.type==='never')&&isDone(t,t.date)&&k(new Date(typeof t.doneDates[t.date]==='number'?t.doneDates[t.date]:0))===tk):[];
  if(late.length||due.length||anytime.length||lateDone.length){
    const a=el('div',{class:'anytime'});
    late.forEach(t=>a.append(anyRow({kind:'task',id:t.id,rec:t,title:t.title,time:null,done:false},t.date,{late:relDay(t.date),target:dk})));
    due.forEach(t=>a.append(anyRow({kind:'task',id:t.id,rec:t,title:t.title,time:null,done:false},t.date||dk,{target:dk})));
    anytime.filter(e=>!e.done).forEach(e=>a.append(anyRow(e,dk,{target:dk})));
    if(!S.hideDone)anytime.filter(e=>e.done).forEach(e=>a.append(anyRow(e,dk,{target:dk})));
    if(!S.hideDone)lateDone.forEach(t=>a.append(anyRow({kind:'task',id:t.id,rec:t,title:t.title,time:null,done:true},t.date,{late:relDay(t.date),target:dk})));
    day.append(a);
  }
  const loose=isToday?get.all('habit').filter(h=>(h.target||0)>habitWeek(h,dk)-(habitDone(h,dk)?1:0)&&!(h.sessions||{})[dk]&&!occursHabit(h,dk)&&!(h.days&&h.days.length)):[];
  if(loose.length){day.append(el('div',{class:'sect-h'},el('span',{class:'lbl'},'This week'),el('button',{class:'linkbtn small',onclick:()=>App.go('habits')},'Habits')));
    const w=el('div',{});loose.slice(0,4).sort((a,b)=>habitDone(a,dk)-habitDone(b,dk)).forEach(h=>{const n=habitWeek(h,dk),on=habitDone(h,dk);const row=el('div',{class:'habit-mini tick-host'+(on?' done':'')},el('span',{class:'tick-hit'},tickBtn(on,()=>{toggleItem({kind:'habit',rec:h},dk);setTimeout(()=>App.refresh(),820);},'Log for today')),el('button',{class:'grow',style:'text-align:left;padding:10px 0',onclick:()=>App.go('habit',{id:h.id})},el('span',{class:'tt'},h.title)),el('span',{class:'meter','data-k':'hab:'+h.id,role:'img','aria-label':`${n} of ${h.target} this week`},Array.from({length:Math.min(h.target,7)},(_,i)=>el('i',{class:i<n?'on':''}))));w.append(row);});day.append(w);}
  day.append(timeGrid(dk,timed));
  return day;
}
function plateCard(dk){
  const S=App.state,list=get.all('task').filter(t=>!t.date&&isOpenTask(t)&&!(t.deadline&&t.deadline<=dk));if(!list.length)return null;
  const open=!!S.plateOpen;
  const c=el('section',{class:'card','data-k':'plate',style:'padding:6px 16px'},el('button',{class:'tmr',style:'min-height:48px','aria-expanded':String(open),onclick:()=>{S.plateOpen=!S.plateOpen;App.refresh();}},el('span',{class:'grow'},el('b',{style:'font-weight:600'},'On your plate'),el('span',{class:'small muted',style:'margin-left:8px'},`${list.length} unscheduled`)),el('span',{class:'chev'+(open?' open':''),style:open?'transform:rotate(90deg)':null,html:ic('chevr',16,2.2)})));
  if(open){const w=el('div',{class:'anytime',style:'margin-top:0'});list.slice(0,8).forEach(t=>{const e={kind:'task',id:t.id,rec:t,title:t.title,time:null,done:false};w.append(anyRow(e,dk,{target:dk,addToday:true}));});c.append(w,el('div',{style:'display:flex;justify-content:space-between;align-items:center;min-height:44px'},list.length>8?el('button',{class:'linkbtn small',onclick:()=>{S.taskTab='none';App.go('tasks');}},`All ${list.length}`):el('span'),el('button',{class:'linkbtn small',onclick:()=>{S.studio=Object.assign(S.studio||{},{mode:'w',anchor:null});App.go('studio');}},'Plan in Studio ›')));}
  return c;
}
function anyRow(e,dk,{late,target,addToday}={}){
  const S=App.state,steps=e.kind==='task'?(e.rec.steps||[]):[];S.expanded=S.expanded||{};
  const wrap=el('div',{class:'trow-wrap'});
  const row=el('div',{class:'trow tick-host'+(e.done?' done':''),'data-id':e.id},
    el('span',{class:'tick-hit'},tickBtn(e.done,on=>{row.classList.toggle('done',on);toggleItem(e,dk);setTimeout(()=>App.refresh(),820);})),
    el('button',{class:'t',onclick:()=>openItem(e,dk)},el('span',{class:'tt'},e.title),metaOf(e,late,dk)),
    e.kind==='habit'&&e.rec.track==='count'?el('button',{class:'chip',style:'height:36px','aria-label':`Add one to ${e.title}`,onclick:()=>{buzz(6);logHabit(e.rec,dk,1);}},'+1'):e.kind==='habit'&&e.rec.track==='time'?el('button',{class:'chip',style:'height:36px','aria-label':`Log time for ${e.title}`,onclick:()=>logTimeSheet(e.rec,dk)},'Log'):null,
    (late||addToday)?el('button',{class:'chip',style:'height:32px;font-size:14px',onclick:()=>{const before=e.rec.date;e.rec.date=target;e.rec.moves=(e.rec.moves||0)+1;put(e.rec);toast('Moved to today',()=>{e.rec.date=before;put(e.rec);});}},'Today'):null,
    steps.length?el('button',{class:'iconbtn',style:'width:36px;height:36px;color:var(--ink-3)','aria-label':S.expanded[e.id]?'Hide steps':'Show steps','aria-expanded':String(!!S.expanded[e.id]),html:ic(S.expanded[e.id]?'chevu':'chevd',16,2.2),onclick:()=>{S.expanded[e.id]=!S.expanded[e.id];App.refresh();}}):null);
  const menu=(x,y)=>itemMenu(e,target||e.occ||dk,x,y);
  row.addEventListener('contextmenu',ev=>{ev.preventDefault();if(lastPointer==='mouse')menu(ev.clientX,ev.clientY);});
  const lbl=el('span',{});
  draggable(row,{label:e.title,hold:menu,
    move:(x,y)=>{dropPreview(x,y,e.dur||30,0);autoscrollGrid(x,y);},
    drop:(x,y)=>{const t=gridTimeAt(x,y,0,e.dur||30);clearPreview();if(t==null)return;const u=snapItem(e),d=target||S.sel;if(e.kind==='task'&&e.rec.date!==d&&(!e.rec.repeat||e.rec.repeat.type==='never'))e.rec.date=d;setItemTime(e,d,t);App.refresh();toast(`Set for ${fmtT(t)}`,u);}});
  wrap.append(row);
  if(steps.length&&S.expanded[e.id]){wrap.append(el('div',{class:'stepsin'},steps.map(st=>{const was=stepDone(e.rec,st,dk);const r=el('div',{class:'stepin tick-host'+(was?' done':'')},el('span',{class:'tick-hit'},tickBtn(was,on=>{setStepDone(e.rec,st,dk,on);put(e.rec,{silent:true});r.classList.toggle('done',on);if(on&&steps.every(x=>stepDone(e.rec,x,dk))&&!isDone(e.rec,dk))toast('All steps done',()=>{toggleItem(e,dk);App.refresh();},'Finish task');else{if(!on)$('#toast').classList.remove('on');setTimeout(()=>App.refresh(),820);}},'Mark step done')),el('span',{class:'grow'},el('span',{class:'tt'},st.t)));return r;})));}
  return wrap;
}
function metaOf(e,late,dk){
  const bits=[];if(late)bits.push(el('span',{class:'meta late'},`From ${late}`));if(e.occ)bits.push(el('span',{class:'meta late'},`Missed · was due ${relDay(e.occ)}`));
  const m=[];let overdue=false;
  if((e.rec.photos||[]).length)m.push(`${e.rec.photos.length} photo${e.rec.photos.length>1?'s':''}`);
  if(e.kind==='task'){const r=e.rec,st=r.steps||[];if(st.length)m.push(`${st.filter(s=>stepDone(r,s,dk||App.state.sel)).length}/${st.length} steps`);if(r.deadline&&!e.done){overdue=r.deadline<todayK();m.push(overdue?`Overdue · was due ${relDay(r.deadline)}`:`Due ${relDay(r.deadline)}`);}if(r.priority==='high')m.push('High priority');}
  if(e.kind==='step')m.push(e.from);
  if(e.kind==='habit')m.push(habitMeta(e.rec,App.state.sel));
  if(e.kind==='routine')m.push(`Routine · ${fmtDurS(e.dur)}`);
  if(m.length)bits.push(el('span',{class:'meta'+(overdue?' late':'')},m.join(' · ')));
  const lk=(e.kind==='task'||e.kind==='habit')&&linkLabel(e.rec);if(lk&&!e.done)bits.push(el('span',{class:'ogtag'},lk));
  return bits;
}
function gridTimeAt(x,y,grab=0,dur=0){const g=$('#grid');if(!g)return null;const r=g.getBoundingClientRect();if(x<r.left||x>r.right||y<r.top||y>r.bottom)return null;const py=y-r.top+g.scrollTop-12,m=py/HH*60-grab;return Math.max(0,Math.min(1440-Math.max(dur,15),Math.round(m/15)*15));}
function dropPreview(x,y,dur=30,grab=0,text){const t=gridTimeAt(x,y,grab,dur);let p=$('#drop-prev');const cv=$('.gcanvas');if(t==null||!cv){p&&p.remove();return null;}if(!p){p=el('div',{class:'droptime',id:'drop-prev'});cv.append(p);}p.style.top=t/60*HH+12+'px';p.style.height=Math.max(dur/60*HH-2,24)+'px';p.textContent=(dropCarry&&dropCarry.title?dropCarry.title+' · ':'')+(text||(dur>=30?fmtRange(t,t+dur):fmtT(t)));carryPreview(p,t);return t;}
function clearPreview(){const p=$('#drop-prev');p&&p.remove();if(!App.dragging)dropCarry=null;}
function autoscrollGrid(x,y){const g=$('#grid');if(g){const r=g.getBoundingClientRect();if(x>=r.left&&x<=r.right){if(y<r.top+36&&y>r.top-20)g.scrollTop-=7;else if(y>r.bottom-36&&y<r.bottom+20)g.scrollTop+=7;}}if(y<70)scrollBy(0,-7);else if(y>innerHeight-(innerWidth<900?110:40))scrollBy(0,7);}
function timeGrid(dk,timed){
  const S=App.state,isToday=dk===todayK();
  const gw=el('div',{class:'gridwrap'}),g=el('div',{class:'grid',id:'grid',tabindex:0,'aria-label':'Time grid'}),cv=el('div',{class:'gcanvas'});
  for(let h=0;h<=24;h++){const lbl=get.settings().clock===24?`${pad2(h%24)}:00`:h===24?'12 AM':`${h%12||12} ${h<12?'AM':'PM'}`;
    const row=el(h<24?'button':'div',{class:'hr',style:`top:${h*HH+12}px`,'data-h':h,'aria-label':h<24?`Add a time block at ${lbl}`:null},el('span',{class:'lbl2'},lbl),el('span',{class:'ln'}));
    if(h<24)row.addEventListener('click',ev=>{const r=g.getBoundingClientRect(),y=ev.clientY-r.top+g.scrollTop-12,m=ev.detail&&ev.clientY?Math.floor(y/HH*2)/2*60:h*60,st=Math.max(0,Math.round(m));hourPlaceholder(cv,st,60,()=>blockSheet(null,{date:dk,start:st}));});
    cv.append(row);}
  // press and drag on empty space to draw a block
  let a0=null,rng=null;
  draggable(cv,{ghost:false,filter:ev=>!!ev.target.closest('.hr'),
    start:(x,y)=>{a0=gridTimeAt(x,y);rng=null;},
    move:(x,y)=>{autoscrollGrid(x,y);const t=gridTimeAt(x,y);if(t==null||a0==null)return;const s=Math.min(a0,t),e=Math.max(a0,t)+15;rng=[s,Math.max(e-s,15)];let p=$('#drop-prev');if(!p){p=el('div',{class:'droptime',id:'drop-prev'});cv.append(p);}p.style.top=s/60*HH+12+'px';p.style.height=Math.max(rng[1]/60*HH-2,20)+'px';p.textContent=fmtRange(s,s+rng[1]);},
    hold:(x,y)=>{clearPreview();if(a0!=null)blockSheet(null,{date:dk,start:a0,dur:60});},
    drop:()=>{clearPreview();if(rng)blockSheet(null,{date:dk,start:rng[0],dur:Math.max(rng[1],15)});}});
  const cols=[];const placed=[...spill(dk),...timed].sort((a,b)=>a.time-b.time).map(e=>{const dur=Math.max(e.dur||30,20);let c=cols.findIndex(end=>end<=e.time);if(c<0){c=cols.length;cols.push(0);}cols[c]=e.time+dur;return{e,dur,c};});
  placed.forEach(({e,dur,c})=>{
    const overlap=placed.filter(o=>o.e.time<e.time+dur&&o.e.time+o.dur>e.time),n=Math.max(...overlap.map(o=>o.c))+1;
    const top=e.time/60*HH+12,hgt=Math.max(Math.min(dur,1440-e.time)/60*HH-2,26);
    const edk=e.contFrom||dk,label=e.cont?`Until ${fmtT(e.dur)}`:e.kind==='task'?fmtT(e.time):fmtRange(e.time,e.time+e.dur);
    const bm=hgt>40?el('span',{class:'bm'},label):null;
    const b=el('div',{class:'blk tick-host'+(e.done?' done':''),'data-bid':e.id,style:`--c:${e.color};top:${top}px;height:${hgt}px;`+(n>1?`left:calc(60px + (100% - 70px)/${n}*${c});right:auto;width:calc((100% - 70px)/${n} - 3px);`:'')},
      e.kind==='gcal'?null:tickBtn(e.done,on=>{b.classList.toggle('done',on);toggleItem(e,edk);setTimeout(()=>App.refresh(),820);}),
      el('button',{class:'bt',onclick:()=>openItem(e,edk)},el('i',{html:(e.icon?glyph(e.icon,14):'')+`<span>${esc(e.title)}</span>`}),bm));
    if(e.kind==='block'&&!e.cont)b.append(el('span',{class:'rz','aria-hidden':'true'}));
    const menu=(x,y)=>itemMenu(e,edk,x,y);
    b.addEventListener('contextmenu',ev=>{ev.preventDefault();if(lastPointer==='mouse')menu(ev.clientX,ev.clientY);});
    let grab=0;const span=e.kind==='task'?30:(e.dur||30);
    if(e.kind==='gcal'||e.kind==='routine'||e.cont)draggable(b,{ghost:false,hold:menu,start:()=>{},move:()=>{},drop:()=>{}});
    else draggable(b,{ghost:false,hold:menu,
      start:(x,y)=>{const r=g.getBoundingClientRect();grab=Math.max(0,(y-r.top+g.scrollTop-12)/HH*60-e.time);dropCarry={color:e.color,title:e.title};},
      move:(x,y)=>{dropPreview(x,y,span,grab);autoscrollGrid(x,y);},
      drop:(x,y)=>{const t=gridTimeAt(x,y,grab,span);dropCarry=null;clearPreview();if(t==null||t===e.time){App.state._settle=e.id;settleBlock();return;}const u=snapItem(e);setItemTime(e,dk,t);App.state._settle=e.id;App.refresh();toast(`Moved to ${fmtT(t)}`,u);}});
    const rz=b.querySelector('.rz');
    if(rz)rz.addEventListener('pointerdown',ev=>{ev.stopPropagation();ev.preventDefault();const y0=ev.clientY,d0=e.dur;rz.setPointerCapture(ev.pointerId);App.dragging=true;let nd=d0;
      const mv=m=>{nd=Math.max(15,Math.min(1440,Math.round((d0+(m.clientY-y0)/HH*60)/15)*15));b.style.height=Math.max(Math.min(nd,1440-e.time)/60*HH-2,26)+'px';if(bm)bm.textContent=fmtRange(e.time,e.time+nd);};
      const up=()=>{rz.removeEventListener('pointermove',mv);rz.removeEventListener('pointerup',up);rz.removeEventListener('pointercancel',up);App.dragging=false;App._dragEnd=Date.now();if(nd!==d0){const u=snapItem(e),r=detachIfRepeating(e.rec,dk);r.dur=nd;put(r);toast(`Now ${fmtDur(nd)}`,u);}else App.refresh();};
      rz.addEventListener('pointermove',mv);rz.addEventListener('pointerup',up);rz.addEventListener('pointercancel',up);});
    cv.append(b);
  });
  if(isToday)cv.append(el('div',{class:'now',id:'now'},el('span',{class:'npill',id:'nowpill'}),el('span',{class:'bar'})));
  g.append(cv);gw.append(g);
  const nowTop=()=>{const t=nowMin()/60*HH+12-g.clientHeight/4,h=Math.max(0,Math.floor((t-12)/HH));return Math.max(0,h*HH+12-16);};
  let jump=null;
  if(isToday){jump=el('button',{class:'nowjump',hidden:true,onclick:()=>g.scrollTo({top:nowTop(),behavior:'smooth'})},'Now');gw.append(jump);}
  const syncJump=()=>{if(!jump)return;const y=nowMin()/60*HH+12;jump.hidden=y>g.scrollTop&&y<g.scrollTop+g.clientHeight;};
  requestAnimationFrame(()=>{
    if(S._gridTop!=null&&!S._fresh)g.scrollTop=S._gridTop;
    else{const to=isToday?nowTop():Math.max(0,Math.floor((timed[0]?timed[0].time:8*60)/60)*HH+12-16);S._fresh=false;gridGlide(g,gw,to,isToday);}
    tickNow();syncJump();
  });
  g.addEventListener('scroll',()=>{S._gridTop=g.scrollTop;syncJump();},{passive:true});
  return gw;
}
function tickNow(){const n=$('#now');if(!n)return;const m=nowMin();n.style.top=`${m/60*HH+12}px`;const p=$('#nowpill');if(p)p.textContent=fmtS(m);$$('.hr').forEach(r=>{const l=r.querySelector('.lbl2');if(l)l.style.opacity=Math.abs(r.dataset.h*60-m)/60*HH<20?0:1;});}
function reviewPeriod(dk){const d=fromK(dk),s=get.settings(),lastOfMonth=addD(d,7).getMonth()!==d.getMonth();if(!lastOfMonth)return 'week';if(s.quarterlyReview&&d.getMonth()%3===2)return 'quarter';return s.monthlyReview?'month':'week';}
function introCard(){return el('section',{class:'card fade-up'},el('div',{class:'eyebrow'},'Welcome'),el('h2',{},'Set up your foundation'),el('p',{class:'sub'},'Tell Life OS how you live, or look around with example data first. Examples are marked and can be cleared in one tap.'),
  el('div',{class:'btnrow'},el('button',{class:'btn primary',onclick:()=>App.go('foundation')},'Start'),el('button',{class:'btn text',onclick:()=>{loadExamples();}},'Load examples')));}
function checkinCard(dk){return el('section',{class:'card'},el('div',{class:'eyebrow'},'Weekly check-in'),el('h2',{},reviewPeriod(dk)==='week'?`${DOW[fromK(dk).getDay()]} check-in`:reviewPeriod(dk)==='month'?'Monthly review':'Quarterly review'),el('p',{class:'sub'},reviewPeriod(dk)==='week'?'Look back at this week, then plan the next one.':`Look back at this ${reviewPeriod(dk)}, then plan what comes next.`),
  el('div',{class:'btnrow'},el('button',{class:'btn primary',onclick:()=>App.go('review',{period:reviewPeriod(dk)})},'Start'),el('button',{class:'btn text',onclick:()=>{setSettings({checkinLater:dk});}},'Later')));}

/* ---------- share a day as an image, a PDF or text ---------- */
const emptyDayHead=dk=>{const tk=todayK();return dk<tk?'Nothing logged':dk===tk?'A clear day':'Nothing planned yet';};
function dayCanvas(dk){
  const{allDay,timed,anytime}=dayItems(dk),d=fromK(dk);
  const W=1080,rows=[...timed.map(e=>[e.kind==='task'?fmtT(e.time):fmtRange(e.time,e.time+e.dur),e.title,e.color,e.done]),...anytime.map(e=>['Anytime',e.title,'#97A09B',e.done])];
  const H=Math.max(720,330+(allDay.length?90:0)+Math.max(rows.length,1)*104+70);
  const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');
  x.fillStyle='#F4F4EF';x.fillRect(0,0,W,H);
  const f=(s,fam,w=400)=>`${w} ${s}px ${fam==='d'?'Newsreader,Palatino,Georgia,serif':'Figtree,system-ui,sans-serif'}`;
  x.fillStyle='#5B6560';x.font=f(30,'b',600);x.fillText(DOW[d.getDay()].toUpperCase(),72,110);
  x.fillStyle='#1E2622';x.font=f(104,'d',500);x.fillText(`${MONL[d.getMonth()]} ${d.getDate()}`,72,216);
  let y=280;
  if(allDay.length){let cx=72;x.font=f(30,'b',500);allDay.forEach(e=>{const w=x.measureText(e.title).width+44;x.fillStyle=e.color;rr(x,cx,y,w,58,14);x.fill();x.fillStyle='#fff';x.fillText(e.title,cx+22,y+40);cx+=w+14;});y+=90;}
  x.fillStyle='#fff';rr(x,48,y,W-96,Math.max(rows.length,1)*104+40,36);x.fill();y+=20;
  if(!rows.length){x.fillStyle='#5B6560';x.font=f(38,'d',500);x.fillText(emptyDayHead(dk),96,y+66);}
  rows.forEach(([t,title,col,dn],i)=>{const ry=y+i*104;x.fillStyle=col;rr(x,88,ry+20,8,64,4);x.fill();x.fillStyle='#5B6560';x.font=f(26,'b',500);x.fillText(t,116,ry+44);x.fillStyle=dn?'#97A09B':'#1E2622';x.font=f(36,'b',500);let tt=title;while(x.measureText(tt).width>W-240&&tt.length>4)tt=tt.slice(0,-2);if(tt!==title)tt+='…';x.fillText(tt,116,ry+86);});
  x.fillStyle='#97A09B';x.font=f(24,'b',500);x.fillText('Life OS',72,H-34);
  return c;
}
function rr(x,a,b,w,h,r){x.beginPath();x.moveTo(a+r,b);x.arcTo(a+w,b,a+w,b+h,r);x.arcTo(a+w,b+h,a,b+h,r);x.arcTo(a,b+h,a,b,r);x.arcTo(a,b,a+w,b,r);x.closePath();}
function dayText(dk){const{allDay,timed,anytime}=dayItems(dk);const L=[`${DOW[fromK(dk).getDay()]}, ${MONL[fromK(dk).getMonth()]} ${fromK(dk).getDate()}`];allDay.forEach(e=>L.push(`All day: ${e.title}`));timed.forEach(e=>L.push(`${fmtT(e.time)}  ${e.title}${e.done?' (done)':''}`));anytime.forEach(e=>L.push(`Anytime  ${e.title}${e.done?' (done)':''}`));if(L.length===1)L.push(emptyDayHead(dk));return L.join('\n');}
function pdfFromJpeg(bytes,w,h){const enc=new TextEncoder(),pw=612,ph=Math.round(612*h/w),parts=[],off=[];let len=0;const add=b=>{const u=typeof b==='string'?enc.encode(b):b;parts.push(u);len+=u.length;};const obj=(n,s)=>{off[n]=len;add(`${n} 0 obj\n${s}\nendobj\n`);};
  add('%PDF-1.4\n');obj(1,'<< /Type /Catalog /Pages 2 0 R >>');obj(2,'<< /Type /Pages /Kids [3 0 R] /Count 1 >>');obj(3,`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pw} ${ph}] /Resources << /XObject << /I 4 0 R >> >> /Contents 5 0 R >>`);
  off[4]=len;add(`4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${w} /Height ${h} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${bytes.length} >>\nstream\n`);add(bytes);add('\nendstream\nendobj\n');
  const cs=`q ${pw} 0 0 ${ph} 0 0 cm /I Do Q`;obj(5,`<< /Length ${cs.length} >>\nstream\n${cs}\nendstream`);
  const xr=len;add(`xref\n0 6\n0000000000 65535 f \n`);for(let i=1;i<=5;i++)add(String(off[i]).padStart(10,'0')+' 00000 n \n');add(`trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xr}\n%%EOF`);
  const out=new Uint8Array(len);let p=0;parts.forEach(u=>{out.set(u,p);p+=u.length;});return out;}
async function saveFile(filename,data){if(!store.downloads){toast('Saving files isn’t available here. Use Copy as text.');return;}const bz=busyNote(`Preparing ${filename.replace(/^Life-OS-/,'').replace(/-\d{4}-\d\d-\d\d/,'')}…`);try{await store.downloads.save({filename,data});bz();toast('Saved');}catch(e){bz();if(e&&e.code!=='declined')toast('That file could not be saved.');}}
function shareDaySheet(dk){
  Promise.resolve(document.fonts&&document.fonts.ready).then(()=>openSheet({title:'Share this day',build:body=>{
    const c=dayCanvas(dk),base=`Life-OS-${dk}`;
    const img=el('img',{alt:`Preview of ${shortDay(dk)}`,style:'width:100%;border-radius:16px;border:1px solid var(--line);display:block',src:c.toDataURL('image/png')});
    const copy=el('button',{class:'btn quiet block',onclick:async e=>{const t=dayText(dk),btn=e.currentTarget;try{await navigator.clipboard.writeText(t);toast('Copied');doneMorph(btn);}catch(e){ta.hidden=false;ta.value=t;ta.select();toast('Select the text below to copy it');}}},'Copy as text');
    const ta=el('textarea',{id:'share-text',hidden:true,rows:6,style:'width:100%;border:1px solid var(--line);border-radius:12px;padding:10px;background:#fff'});
    body.append(img,el('button',{class:'btn primary block',onclick:()=>c.toBlob(b=>saveFile(base+'.png',b),'image/png')},'Save image'),
      el('button',{class:'btn line block',onclick:()=>{const flat=document.createElement('canvas');flat.width=c.width;flat.height=c.height;flat.getContext('2d').drawImage(c,0,0);flat.toBlob(async b=>{const buf=new Uint8Array(await b.arrayBuffer());saveFile(base+'.pdf',new Blob([pdfFromJpeg(buf,c.width,c.height)],{type:'application/pdf'}));},'image/jpeg',.92);}},'Save PDF'),copy,ta);
  }}));
}
