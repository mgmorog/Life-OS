/* ---------- v361 · Calendar, borrowing from Apple: Year and List views, a floating toolbar, zoom between views,
   pinch Month for detail, a continuous Month, details as a card, copy and paste, time zones, busy or free,
   up next, search by date, week numbers. Everything stays in Life OS colors, light mode, circles. ---------- */

/* ---------- 23 · a floating toolbar: Today, the view switch, search and + ---------- */
function calBar(C,mode,current,modeSeg){const add=e=>{const r=e.currentTarget.getBoundingClientRect(),dk=C.sel||todayK();openMenu(r.left,r.top-8,[{label:'Task',icon:'task',onclick:()=>taskSheet(null,{date:dk})},{label:'Time block',icon:'hour',onclick:()=>blockSheet(null,{date:dk,start:nextFreeSlot(dk)})},{label:'All-day item',icon:'cal',onclick:()=>alldaySheet(null,{start:dk})}]);};
  const sg=modeSeg();sg.classList.add('sm');
  return el('div',{class:'calbar',role:'toolbar','aria-label':'Calendar'},el('button',{class:'cbtoday'+(current&&mode!=='list'?' quiet':''),onclick:()=>{const c=calState();c.zoom={dir:-1};calNow();}},'Today'),el('div',{class:'cbseg'},sg),IconButton('Search the calendar',{cls:'cbic',html:ic('search',IC.md),onclick:calSearchSheet}),el('button',{class:'cbadd','aria-label':'Add',html:ic('plus',IC.md),onclick:add}));}

/* ---------- 1 · zoom between views ---------- */
function calZoomIn(body,C){const z=C.zoom;C.zoom=null;if(!z||!motionOK())return;const o=z.r?`${z.r.left+z.r.width/2}px ${z.r.top+z.r.height/2-body.getBoundingClientRect().top}px`:'50% 30%';
  try{body.animate([{transform:`scale(${z.dir>0?.72:1.18})`,opacity:0,transformOrigin:o},{transform:'none',opacity:1,transformOrigin:o}],{duration:MOT&&MOT.base?Math.max(260,MOT.base+60):300,easing:'cubic-bezier(.2,.8,.2,1)'});}catch(e){}}
const calGo=(C,mode,anchor,sel,node)=>{C.zoom={dir:1,r:node?node.getBoundingClientRect():null};C.mode=mode;C.anchor=anchor;if(sel)C.sel=sel;C.weekOpen=mode==='week'?sel:null;try{localStorage.setItem('lifeos-cal-mode',mode);}catch(e){}calCommit();};

/* ---------- 2 · pinch Month: overview, bars, titles, titles with times ---------- */
function calLevel(C){return C.mlev??(C.mcal?2:1);}
function calSetLevel(C,v){v=Math.max(0,Math.min(3,v));if(v===calLevel(C))return;C.mlev=v;C.mcal=v>=2;try{localStorage.setItem('lifeos-cal-mlev',String(v));localStorage.setItem('lifeos-cal-mcal',C.mcal?'1':'');}catch(e){}buzz(6);calCommit();}
function calPinch(body,C){let d0=0,done=false;const dist=t=>Math.hypot(t[0].clientX-t[1].clientX,t[0].clientY-t[1].clientY);
  body.addEventListener('touchstart',e=>{if(e.touches.length===2){d0=dist(e.touches);done=false;}},{passive:true});
  body.addEventListener('touchmove',e=>{if(e.touches.length!==2||!d0||done)return;const r=dist(e.touches)/d0;if(r>1.25){done=true;calSetLevel(C,calLevel(C)+1);}else if(r<.8){done=true;calSetLevel(C,calLevel(C)-1);}},{passive:true});
  body.addEventListener('wheel',e=>{if(!e.ctrlKey)return;e.preventDefault();clearTimeout(body._pz);body._pz=setTimeout(()=>calSetLevel(C,calLevel(C)+(e.deltaY<0?1:-1)),60);},{passive:false});}

/* ---------- 10 · Month as one continuous column, the month name pinned in the bar above ---------- */
function monthCont(body,a,C){const tk=todayK(),showT=calLevel(C)>=3,wrap=el('div',{class:'mcont'});const y0=a.getFullYear(),m0=a.getMonth();
  for(let i=-1;i<=5;i++){const d=new Date(y0,m0+i,1),y=d.getFullYear(),m=d.getMonth();const sec=el('section',{class:'mcsec','data-m':`${MONL[m]} ${y}`,'data-mk':monthKey(d)});sec.append(el('h3',{class:'mchd'+(monthKey(d)===monthKey(today())?' cur':'')},`${MONL[m]}${y!==today().getFullYear()?' '+y:''}`));
    const grid=el('div',{class:'mcal'});weeksOf(y,m).forEach(w=>{if(get.settings().weekNums)grid.append(el('span',{class:'mcwn','aria-hidden':'true'},String(isoWeek(w[0]))));w.forEach(dd=>grid.append(monthCell(dd,m,tk,C,showT)));});if(get.settings().weekNums)grid.classList.add('wn');
    sec.append(grid);{const hl=holLine(y,m);if(hl)sec.append(hl);}wrap.append(sec);}
  body.append(el('div',{class:'wd-row',style:'margin:0 0 var(--s1)'},wdLabels().map(l=>el('span',{},l))),wrap);
  if(C.sel)body.append(el('div',{class:'mcpanel'},dayPanel(C.sel)));
  /* scroll so the anchor month sits at the top, then keep the bar's title on the month in view */
  requestAnimationFrame(()=>{const s=wrap.querySelector(`[data-mk="${monthKey(a)}"]`);if(s&&!C._mcScrolled){C._mcScrolled=true;const top=s.getBoundingClientRect().top+scrollY-120;if(top>40)scrollTo(0,top);}});
  const onS=()=>{const secs=[...wrap.children];let cur=secs[0];for(const s of secs){if(s.getBoundingClientRect().top<140)cur=s;}const t=document.querySelector('#cal-compact .cc-title span');if(t&&cur)t.textContent=cur.dataset.m;const pill=document.querySelector('.calbar .cbtoday');if(pill)pill.classList.toggle('quiet',cur&&cur.dataset.mk===monthKey(today()));};
  removeEventListener('scroll',App._mcS);App._mcS=onS;addEventListener('scroll',onS,{passive:true});setTimeout(onS,50);}
function monthCell(d,m,tk,C,showT){const dk=k(d);if(d.getMonth()!==m)return el('span',{class:'mcc out','aria-hidden':'true'});
  const{allDay,timed,anytime}=dayItems(dk,{filters:true}),hn=typeof Holidays!=='undefined'?Holidays.name(dk):null;
  const ad=allDay.filter(e=>!(e.rec&&e.rec.tripId)&&!calMulti(e)),ev=[...timed,...anytime].filter(e=>e.kind!=='habit'&&(e.kind!=='task'||e.time!=null)).sort((p,q)=>(p.time??9999)-(q.time??9999)),trip=typeof tripOn==='function'?tripOn(dk):null,multi=allDay.filter(calMulti);
  const lines=[...(trip?[{t:trip.f.what,cls:'trip'}]:[]),...multi.map(e=>({t:e.title,cls:'ad span'+(allDayOccStart(e.rec,dk)===dk||d.getDay()===(get.settings().weekStart??1)?' first':''),c:e.color})),...ad.map(e=>({t:e.holiday?hn:(e.rec&&e.rec.icon==='cake'?'🎂 ':'')+e.title,cls:'ad'+(e.holiday?' hol':''),c:e.color})),...ev.map(e=>({t:(showT&&e.time!=null?fmtT(e.time).replace(':00','').replace(' ','').toLowerCase()+' ':'')+e.title,cls:e.kind==='task'?'td':'ev'+(e.rec&&e.rec.free?' free':''),c:e.color}))],shown=lines.slice(0,3),more=lines.length-shown.length,isSel=C.sel===dk;
  const cell=el('button',{class:'mcc'+(dk===tk?' today':'')+(isSel?' sel':'')+(dk<tk?' past':''),'data-slot':dk,'aria-label':`${shortDay(dk)}${lines.length?`, ${lines.length} item${lines.length>1?'s':''}`:''}`,'aria-pressed':String(isSel),onclick:()=>{C.sel=dk;App.refresh();}},
    el('span',{class:'mcn'+(hn?' hol':'')},String(d.getDate())),...shown.map(x=>el('span',{class:'mcl '+x.cls,style:x.c?`--c:${x.c}`:null},x.cls.includes('span')&&!x.cls.includes('first')?' ':x.t)),more>0?el('span',{class:'mcm'},`+${more}`):null);
  onPress(cell,()=>dayPeek(dk,cell));return cell;}
/* ---------- 26 · things that run over several days draw as one long bar ---------- */
const calMulti=e=>e.kind==='allday'&&e.rec&&e.rec.end&&e.rec.end>e.rec.start&&!(e.rec.tripId);

/* ---------- 3 · when you scroll past Month, the bar shows just your week ---------- */
function calWeekStrip(C){const sel=C.sel||todayK(),s=weekStartOf(fromK(sel)),tk=todayK();return el('div',{class:'cwstrip'},Array.from({length:7},(_,i)=>{const d=addD(s,i),dk=k(d),L=dayLoad(dk);return el('button',{class:'cws'+(dk===sel?' sel':'')+(dk===tk?' today':'')+(L.level?' l'+L.level:''),onclick:()=>{C.sel=dk;if(monthKey(d)!==monthKey(fromK(C.anchor)))C.anchor=dk;App.refresh();}},el('i',{},DOW[d.getDay()].slice(0,1)),el('b',{},String(d.getDate())));}));}

/* ---------- 4 · a Year view: twelve small months, busy days shaded ---------- */
function yearBody(body,y,C){const tk=todayK(),wn=!!get.settings().weekNums,grid=el('div',{class:'yrgrid'});
  for(let m=0;m<12;m++){const mk=el('div',{class:'yrmini'}),cells=el('div',{class:'yrcells'});weeksOf(y,m).forEach(w=>w.forEach(d=>{if(d.getMonth()!==m){cells.append(el('i',{class:'out'}));return;}const dk=k(d),L=dayLoad(dk);cells.append(el('i',{class:(L.level?'l'+L.level:'')+(dk===tk?' today':''),title:shortDay(dk)},String(d.getDate())));}));
    const btn=el('button',{class:'yrm'+(y===today().getFullYear()&&m===today().getMonth()?' cur':''),onclick:e=>{const t=today();calGo(C,'month',k(new Date(y,m,1)),t.getFullYear()===y&&t.getMonth()===m?tk:k(new Date(y,m,1)),e.currentTarget);}},el('b',{},MON[m]),el('div',{class:'wd-row yrwd'},wdLabels().map(l=>el('span',{},l))),cells);mk.append(btn);grid.append(mk);}
  body.append(grid,el('p',{class:'yrkey'},'Darker days are busier. Tap a month to open it.'));}

/* ---------- 5 · a List view: everything coming up, by day ---------- */
function listBody(body,C){const tk=todayK(),n=C.listN||45;let shown=0;const box=el('div',{class:'lstv'});
  for(let i=0;i<n;i++){const dk=addK(tk,i),{allDay,timed,anytime}=dayItems(dk,{filters:true}),items=[...allDay.filter(e=>!(e.rec&&e.rec.tripId)),...timed.filter(e=>e.kind!=='habit'),...anytime.filter(e=>e.kind==='task'&&!e.done)];if(!items.length)continue;shown++;
    const dd=fromK(dk),head=dk===tk?'Today':dk===addK(tk,1)?'Tomorrow':DOW[dd.getDay()];const ads=items.filter(e=>e.kind==='allday'||e.holiday),rest=items.filter(e=>!(e.kind==='allday'||e.holiday));
    box.append(el('div',{class:'lsthd'+(dk===tk?' today':'')},el('b',{},head),el('small',{},mdS(dd)+(dd.getFullYear()!==today().getFullYear()?`, ${dd.getFullYear()}`:''))),el('div',{class:'lstday'},ads.length?adPills(ads,dk):null,...rest.map(e=>dayLine(e,dk))));}
  if(!shown)box.append(Empty({title:'Nothing coming up',body:'Your next six weeks are clear.'}));body.append(box,Button(`Show more`,{variant:'link',full:true,onclick:()=>{C.listN=n+45;App.refresh();}}));}

/* ---------- 30 · up next, at the top ---------- */
function calUpNext(){const tk=todayK(),now=nowMin();for(const dk of [tk,addK(tk,1)]){const e=dayItems(dk,{filters:true}).timed.find(x=>x.kind!=='habit'&&!x.done&&!x.cont&&x.time!=null&&(dk!==tk||x.time+(x.dur||30)>now));if(!e)continue;
    const mins=dk===tk?e.time-now:null,when=mins==null?`Tomorrow, ${fmtT(e.time)}`:mins<=0?'Now':mins<60?`In ${mins} min`:`In ${Math.floor(mins/60)} h${mins%60?` ${mins%60} min`:''}`;
    return el('button',{class:'upnext',onclick:()=>openItem(e,dk)},el('span',{class:'unk'},when),el('span',{class:'unt clip'},e.title),el('span',{class:'uns clip'},[mins!=null?fmtT(e.time):null,e.rec&&e.rec.place?String(e.rec.place).split(',')[0]:null].filter(Boolean).join(' · ')));}return null;}

/* ---------- 13, 28 · details as a card, with a map and the weather for places ---------- */
function calCard(e,dk){const r=e.rec,isB=e.kind==='block';let inst;const tz=isB&&r.tz?tzLine(r,dk):null,ent=e.kind==='allday'?[...recs.values()].find(x=>x.kind==='entry'&&x.f&&x.f.calId===r.id):null;
  const line=(icn,main,sub,extra)=>el('div',{class:'ccln'},el('span',{class:'ccic',html:ic(icn,IC.sm)}),el('span',{class:'grow'},el('b',{},main),sub?el('small',{},sub):null),extra||null);
  const rep=r.repeat&&r.repeat.type!=='never'?(typeof repeatLabel==='function'?repeatLabel(r.repeat):'Repeats'):null;
  const remTxt=r.reminder!=null?(typeof remLabel==='function'?remLabel(r.reminder):`${r.reminder} min before`):null;
  const when=isB?`${shortDay(dk)} · ${fmtRange(r.start,r.start+r.dur)}`:r.end&&r.end>r.start?`${shortDay(r.start)} – ${shortDay(r.end)}`:`${shortDay(dk)} · All day`;
  let wx=null;try{const w=wxCache();if(w&&w.hi!=null&&r.place){if(dk===todayK())wx=`${WX_CODE(w.code)[0]}, ${w.hi}° / ${w.lo}°`;else if(dk===addK(todayK(),1)&&w.tHi!=null)wx=`${WX_CODE(w.tCode)[0]}, ${w.tHi}°`;}}catch(x){}
  inst=openSheet({title:'',left:{label:'Close'},build:b=>{b.classList.add('ccard');b.append(el('div',{class:'cchead',style:`--c:${e.color||'var(--action)'}`},el('i',{class:'ccbar'}),el('h2',{},(r.icon==='cake'?'🎂 ':'')+e.title)),
    el('div',{class:'list ccl'},line('time',when,tz),isB&&+r.travel?line('car',`Leave by ${fmtT(r.start-r.travel)}`,`${fmtDurS(r.travel)} travel`):null,r.place?line('pin',r.place,wx,Button('Directions',{variant:'link',size:'sm',onclick:()=>openMaps(r.place)})):null,rep?line('undo',rep):null,remTxt?line('bell',remTxt):null,r.area?line(areaIcon(r.area),r.area):null,isB&&r.free?line('sun','Shown as free','Doesn’t count toward a full day'):null,r.notes?line('edit',r.notes.slice(0,240)):null),
    r.place?el('a',{class:'ccmap',href:mapsUrl(r.place),target:'_blank',rel:'noopener'},el('span',{html:ic('pin',IC.md)}),el('b',{},String(r.place).split(',')[0]),el('small',{},'Open in Maps')):null,
    el('div',{class:'ccbtns'},Button('Edit',{variant:'primary',onclick:()=>{inst.close();setTimeout(()=>openItem(Object.assign({},e,{_edit:true}),dk),120);}}),ent?Button(ent.f.kind==='Birthday'?'Open person':'Open',{variant:'secondary',onclick:()=>{inst.close();App.go('tool',{hub:ent.hub,tool:ent.tool});}}):null,Button('Copy',{variant:'secondary',onclick:()=>{calCopy(e);inst.close();}})));}});}

/* ---------- 15 · copy and paste ---------- */
function calCopy(e){const r=e.rec;if(!r||!['block','allday','task'].includes(e.kind))return;App.state.calClip={kind:e.kind,rec:clone(r)};toast(`Copied ${r.title}. Hold an empty time or day to paste.`,null,'Undo',{force:true});}
function calPaste(dk,start){const c=App.state.calClip;if(!c)return;const r=clone(c.rec);delete r.id;delete r.doneDates;delete r.updatedAt;delete r.createdAt;delete r.skip;r.repeat={type:'never',end:null};
  if(c.kind==='block'){r.date=dk;if(start!=null)r.start=start;}else if(c.kind==='allday'){const len=r.end&&r.end>r.start?daysBetween(r.start,r.end):0;r.start=dk;r.end=len?addK(dk,len):null;}else{r.date=dk;if(start!=null&&r.time!=null)r.time=start;}
  const n=create(c.kind,r);toast(`Pasted ${n.title} · ${relDay(dk)}${c.kind==='block'?`, ${fmtT(n.start)}`:''}`,()=>{remove(n.id);App.refresh();},'Undo',{force:true});App.refresh();}

/* ---------- 16 · time zones ---------- */
const CAL_TZ=[['','This phone’s time'],['America/New_York','New York'],['America/Chicago','Chicago'],['America/Denver','Denver'],['America/Los_Angeles','Los Angeles'],['America/Toronto','Toronto'],['Europe/London','London'],['Europe/Paris','Paris'],['Europe/Berlin','Berlin'],['Asia/Kolkata','India'],['Asia/Tokyo','Tokyo'],['Asia/Shanghai','China'],['Australia/Sydney','Sydney']];
function tzOff(tz,date){try{const d=date||new Date(),p=new Intl.DateTimeFormat('en-US',{timeZone:tz,hour12:false,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit'}).formatToParts(d),g=t=>+p.find(x=>x.type===t).value;const asUTC=Date.UTC(g('year'),g('month')-1,g('day'),g('hour')%24,g('minute'));return Math.round((asUTC-d.getTime())/6e4);}catch(e){return 0;}}
function tzLine(r,dk){if(!r.tz)return null;const d=fromK(dk);d.setMinutes(r.start||0);const diff=tzOff(r.tz,d)+d.getTimezoneOffset();if(!diff)return null;let m=((r.start||0)+diff)%1440;if(m<0)m+=1440;const nm=(CAL_TZ.find(x=>x[0]===r.tz)||[0,r.tz.split('/').pop().replace(/_/g,' ')])[1];return`${fmtT(m)} in ${nm}`;}

/* ---------- 27 · search by date ---------- */
function calSearchSheet(){let inst,q='',idx=null;const tk=todayK();
  const build=()=>{if(idx)return idx;idx=[];const seen=new Set();for(let i=-180;i<=365;i++){const dk=addK(tk,i),x=dayItems(dk);[...x.allDay,...x.timed,...x.anytime].forEach(e=>{if(e.kind==='habit'||e.holiday)return;const key=(e.id||e.title)+'|'+dk;if(seen.has(key))return;seen.add(key);idx.push({e,dk,t:String(e.title||'').toLowerCase()});});}return idx;};
  const draw=b=>{const v=q.trim().toLowerCase();const box=b.querySelector('.csres');box.replaceChildren();if(v.length<2){box.append(Caption('Search everything on your calendar, a year ahead and six months back.',{as:'p',style:'padding:var(--s3) var(--s1)'}));return;}
    const hits=build().filter(x=>x.t.includes(v)),up=hits.filter(x=>x.dk>=tk).slice(0,25),past=hits.filter(x=>x.dk<tk).sort((a,c)=>a.dk<c.dk?1:-1).slice(0,25);
    const row=x=>Row({onclick:()=>{inst.close();openItem(x.e,x.dk);}},el('span',{class:'grow'},el('b',{style:'font-weight:500'},x.e.title),el('small',{},`${shortDay(x.dk)}${x.e.time!=null?` · ${fmtT(x.e.time)}`:''}${x.dk<tk?` · ${timeAgo(fromK(x.dk).getTime())}`:''}`)),RowEnd('chevron'));
    if(!hits.length){box.append(Caption(`Nothing matches “${q.trim()}”.`,{as:'p',style:'padding:var(--s3) var(--s1)'}));return;}
    if(up.length)box.append(SectionLabel('Upcoming'),el('div',{class:'list'},up.map(row)));if(past.length)box.append(SectionLabel('Past'),el('div',{class:'list'},past.map(row)));};
  inst=openSheet({title:'Search the calendar',left:{label:'Close'},build:b=>{b.append(SearchField({placeholder:'Dentist, trip, birthday…',label:'Search the calendar',onInput:v=>{q=v;clearTimeout(b._t);b._t=setTimeout(()=>draw(b),180);}}),el('div',{class:'csres'}));draw(b);setTimeout(()=>{const i=b.querySelector('input');if(i)i.focus();},250);}});}

/* ---------- 20 · birthdays carry a cake ---------- */
function calBirthdays(){try{get.all('entry').filter(x=>x.tool==='dates'&&x.f&&x.f.kind==='Birthday'&&x.f.calId).forEach(x=>{const r=get.id(x.f.calId);if(r&&!r.icon){r.icon='cake';put(r,{silent:true});}});}catch(e){}}

/* ---------- 21 · show or hide life areas, like Apple’s Calendars list ---------- */
function calAreaList(f,draw){const s=get.settings(),all=[...(s.areas||AREAS),'None'],shown=a=>!(f.areas&&f.areas.length)||f.areas.includes(a);
  const set=(a,on)=>{let L=(f.areas&&f.areas.length)?f.areas.slice():all.slice();L=on?[...new Set([...L,a])]:L.filter(x=>x!==a);f.areas=L.length===all.length?[]:L.length?L:['__none'];draw();};
  return el('div',{},el('div',{class:'list'},all.map(a=>Row({onclick:()=>set(a,!shown(a))},el('i',{class:'cadot',style:`--c:var(--a-${String(a).toLowerCase().replace(/[^a-z]/g,'')},var(--ink-3))`}),el('span',{class:'grow'},a==='None'?'No life area':a),shown(a)?el('span',{style:'color:var(--action-text);display:grid',html:ic('check',IC.md)}):null))),
    el('div',{class:'cabtns'},Button('Show all',{variant:'link',size:'sm',onclick:()=>{f.areas=[];draw();}}),Button('Hide all',{variant:'link',size:'sm',onclick:()=>{f.areas=['__none'];draw();}})));}

/* ---------- 11, 15 · press and drag on empty time to make a block; hold to paste ---------- */
function tlCreate(col,dk,{h0,HH}){let t=null,sy=0,live=false,ghost=null,a=0;const at=y=>{const r=col.getBoundingClientRect();return Math.max(0,Math.min(23*60+45,Math.round(((y-r.top)/HH*60+h0*60)/15)*15));};
  const upd=b=>{const s=Math.min(a,b),e=Math.max(a+15,b,s+15);ghost.style.top=((s-h0*60)/60*HH)+'px';ghost.style.height=((e-s)/60*HH)+'px';const tip=`${fmtT(s)} – ${fmtT(e)}`;if(ghost._t!==tip){if(ghost._t)buzz(3);ghost._t=tip;ghost.firstChild.textContent=tip;}ghost._s=s;ghost._e=e;};
  col.addEventListener('pointerdown',pe=>{if(pe.button||pe.target.closest('.tlev'))return;sy=pe.clientY;a=at(pe.clientY);clearTimeout(t);const pid=pe.pointerId;t=setTimeout(()=>{live=true;buzz(8);try{col.setPointerCapture(pid);}catch(e){}ghost=el('div',{class:'tlmake'},el('span',{}));col.append(ghost);upd(a+60);},pe.pointerType==='mouse'?160:380);});
  col.addEventListener('pointermove',pe=>{if(!live){if(Math.abs(pe.clientY-sy)>8)clearTimeout(t);return;}pe.preventDefault();upd(at(pe.clientY));});
  col.addEventListener('touchmove',e=>{if(live)e.preventDefault();},{passive:false});
  const end=pe=>{clearTimeout(t);if(!live)return;live=false;col._made=true;const s=ghost._s,e=ghost._e,moved=Math.abs(pe.clientY-sy)>10;ghost.remove();ghost=null;
    if(!moved&&App.state.calClip){openMenu(pe.clientX,pe.clientY,[{label:`Paste ${App.state.calClip.rec.title}`,icon:'copy',onclick:()=>calPaste(dk,s)},{label:'New time block',icon:'hour',onclick:()=>blockSheet(null,{date:dk,start:s,dur:60})}]);return;}
    blockSheet(null,{date:dk,start:s,dur:Math.max(15,e-s)});};
  col.addEventListener('pointerup',end);col.addEventListener('pointercancel',()=>{clearTimeout(t);if(ghost){ghost.remove();ghost=null;}live=false;});}

/* ---------- 12 · what quick capture understood lights up right in the words ---------- */
function capMarks(inp,hs){if(!inp||!inp.parentElement)return;let m=inp._mir;const p=inp.parentElement;
  if(!m){if(getComputedStyle(p).position==='static')p.style.position='relative';m=el('div',{class:'capmir','aria-hidden':'true'});p.insertBefore(m,inp);inp._mir=m;inp.classList.add('capmirred');inp.addEventListener('scroll',()=>{m.scrollTop=inp.scrollTop;});}
  const cs=getComputedStyle(inp);['fontSize','fontFamily','fontWeight','lineHeight','letterSpacing','paddingTop','paddingRight','paddingBottom','paddingLeft','borderTopWidth','borderRightWidth','borderBottomWidth','borderLeftWidth','textIndent'].forEach(k2=>m.style[k2]=cs[k2]);
  m.style.left=inp.offsetLeft+'px';m.style.top=inp.offsetTop+'px';m.style.width=inp.offsetWidth+'px';m.style.height=inp.offsetHeight+'px';
  let html=esc(inp.value);(hs||[]).filter(h=>h&&h.s&&!h.guess).map(h=>esc(h.s)).sort((a,b)=>b.length-a.length).forEach(e=>{const i=html.toLowerCase().indexOf(e.toLowerCase());if(i<0)return;const before=html.slice(0,i);if((before.match(/<mark>/g)||[]).length!==(before.match(/<\/mark>/g)||[]).length)return;html=before+'<mark>'+html.slice(i,i+e.length)+'</mark>'+html.slice(i+e.length);});
  m.innerHTML=html+'​';m.scrollTop=inp.scrollTop;}

/* ---------- 26 · multi-day all-day items get one band under the week they start in ---------- */
function adBand(row,week){const cells=[...row.children].filter(n=>!n.classList.contains('wkn')),dks=week.map(k);get.all('allday').forEach(r=>{if(!r.end||r.end<=r.start||r.tripId||(r.repeat&&r.repeat.type!=='never'))return;if(r.end<dks[0]||r.start>dks[6])return;const c=colorHex(r.color);
  dks.forEach((d,i)=>{const n=cells[i];if(!n||n.classList.contains('out')||d<r.start||d>r.end||n.classList.contains('spanday'))return;n.classList.add('spanday');n.style.setProperty('--sc',c);if(d===r.start||i===0)n.classList.add('spanfirst');if(d===r.end||i===6)n.classList.add('spanlast');n.title=r.title;});});}
