/* ---------- Calendar: Quarter, Month, Week. One header, one heat map, one filter sheet ---------- */
function calState(){const S=App.state;if(!S.cal){let m='quarter';try{m=localStorage.getItem('lifeos-cal-mode')||'quarter';}catch(e){}{const dv=(get.settings().defView||{}).calendar;if(dv&&dv!=='last')m=dv;}if(!['quarter','month','week'].includes(m))m='quarter';let tl=false,mc=false;try{tl=!!localStorage.getItem('lifeos-cal-tl');mc=!!localStorage.getItem('lifeos-cal-mcal');}catch(e){}S.cal={mcal:mc,mode:m,anchor:todayK(),sel:todayK(),weekOpen:null,showEarlier:false,timeline:tl};}return S.cal;}
function calCommit(){App.render();scrollTo(0,0);}
const isCurrentFor=(mode,d)=>{const t=today();return mode==='quarter'?(d.getFullYear()===t.getFullYear()&&quarterOf(d)===quarterOf(t)):mode==='month'?monthKey(d)===monthKey(t):weekKey(d)===weekKey(t);};
function calStep(dir){
  const C=calState(),d=fromK(C.anchor);
  if(C.mode==='quarter')d.setMonth(d.getMonth()+3*dir,1);else if(C.mode==='month')d.setMonth(d.getMonth()+dir,1);else d.setDate(d.getDate()+7*dir);
  C.anchor=k(d);C.anim=dir>0?'slide-l':'slide-r';C.weekOpen=null;
  if(C.mode==='month')C.sel=isCurrentFor('month',d)?todayK():k(new Date(d.getFullYear(),d.getMonth(),1));
  calCommit();
}
function calNow(){const C=calState();C.anchor=todayK();C.sel=todayK();C.weekOpen=null;calCommit();}
function calRange(C){const a=fromK(C.anchor);if(C.mode==='quarter'){const q=quarterOf(a),y=a.getFullYear();return[k(new Date(y,q*3,1)),k(new Date(y,q*3+3,0))];}if(C.mode==='month')return[k(new Date(a.getFullYear(),a.getMonth(),1)),k(new Date(a.getFullYear(),a.getMonth()+1,0))];const s=weekStartOf(a);return[k(s),k(addD(s,6))];}
function viewCalendar(root){
  if(App.state.loading&&!recs.size){root.append(tabSkeleton('calendar'));return;}
  const C=calState(),a=fromK(C.anchor),mode=C.mode,y=a.getFullYear(),q=quarterOf(a),qM=[q*3,q*3+1,q*3+2];
  const current=isCurrentFor(mode,a),wS=weekStartOf(a),wE=addD(wS,6);
  const rangeD=wS.getMonth()===wE.getMonth()?`${mdS(wS)} – ${wE.getDate()}`:`${mdS(wS)} – ${mdS(wE)}`;
  const thisY=y===today().getFullYear()&&wE.getFullYear()===today().getFullYear(),eyebrow=mode==='quarter'?`${MON[qM[0]]} – ${MON[qM[2]]}${thisY?'':' '+y}`:thisY?'':String(mode==='week'?wE.getFullYear():y);App.state._tcId=null;
  const title=mode==='quarter'?`Q${q+1}`:mode==='month'?MONL[a.getMonth()]:rangeD;
  const miniTitle=mode==='quarter'?`Q${q+1} ${y}`:mode==='month'?`${MONL[a.getMonth()]} ${y}`:`${rangeD}, ${wE.getFullYear()}`;
  const f=get.settings().filters||{},filtered=(f.areas&&f.areas.length)||Object.values(f.types||{}).some(v=>v===false);
  const arrows=()=>el('div',{class:'arrows'},IconButton(`Previous ${mode}`,{cls:'green',html:ic('chevl',IC.md),onclick:()=>calStep(-1)}),IconButton(`Next ${mode}`,{cls:'green',html:ic('chevr',IC.md),onclick:()=>calStep(1)}),IconButton('Filters',{cls:'green',html:ic('filter',IC.md)+(filtered?'<span class="dot"></span>':''),onclick:e=>filterSheet({anchor:e.currentTarget.getBoundingClientRect()})}),moreB('Calendar options',e=>{const r=e.currentTarget.getBoundingClientRect(),ws=weekStartOf(fromK(C.sel||C.anchor||todayK()));openMenu(r.right,r.bottom+4,[mode==='week'?{label:C.timeline?'Show as a list':'Show as a timeline',icon:C.timeline?'list':'time',onclick:()=>{C.timeline=!C.timeline;try{localStorage.setItem('lifeos-cal-tl',C.timeline?'1':'');}catch(e){}calCommit();}}:null,{label:'Print this week',icon:'share',onclick:()=>printWeek(k(ws))}]);}));
  const ORDERM=['week','month','quarter'];const modeSeg=()=>seg([['week','Week'],['month','Month'],['quarter','Quarter']],mode,v=>{const[s,e]=calRange(C);if(C.sel&&C.sel>=s&&C.sel<=e)C.anchor=C.sel;const dir=ORDERM.indexOf(v)>ORDERM.indexOf(C.mode)?1:-1;C.mode=v;C.weekOpen=null;try{localStorage.setItem('lifeos-cal-mode',v);}catch(e){}glideSwap(()=>calCommit(),[['#cal-body','x'],['#cal-h .tbtn span','y'],['#cal-h .cal-eyebrow','y']],dir);});
  const pill=()=>!current?Chip('Today',{variant:'status',cls:'pill-today',onclick:calNow}):null;
  const page=el('div',{class:'page'});
  page.append(el('header',{class:'phead cal-h',id:'cal-h'},
    el('div',{class:'cal-title'},el('button',{class:'tbtn ptitle'+(mode==='week'?' mid':'')+(App.state.pdrop==='cal'?' open':''),'aria-label':`Choose ${mode}`,'aria-expanded':App.state.pdrop==='cal'?'true':'false',onclick:()=>periodDrop('cal'),html:`<span>${esc(title)}</span>`+ic('chevd',IC.md)}),arrows()),
    eyebrow||!current?el('div',{class:'cal-eyebrow hq'},eyebrow?el('span',{class:'hquiet'},eyebrow):el('span'),pill()):null,
    App.state.pdrop==='cal'?periodDropEl(mode,C.anchor,key=>{C.anchor=key;if(mode==='month')C.sel=isCurrentFor('month',fromK(key))?todayK():key;if(mode==='week'){C.sel=key;C.weekOpen=null;}periodDrop('cal',false);setTimeout(calCommit,MOT.base);}):null,
    el('div',{style:'margin-top:var(--s2)'},modeSeg())));
  const compact=el('div',{class:'cal-compact',id:'cal-compact'},el('div',{class:'cc-in'},
    el('div',{class:'cal-title',style:'min-height:var(--size-44)'},el('button',{class:'tbtn cc-title ptitle','aria-label':`Choose ${mode}`,onclick:()=>{scrollTo({top:0,behavior:motionOK()?'smooth':'auto'});if(App.state.pdrop!=='cal')periodDrop('cal',true);},html:`<span>${esc(miniTitle)}</span>`+ic('chevd',IC.sm)}),el('span',{style:'display:flex;align-items:center;gap:var(--nudge)'},pill(),arrows())),
    modeSeg(),mode==='month'?el('div',{class:'wd-row'},wdLabels().map(l=>el('span',{},l))):null));
  const body=el('div',{class:'page '+(C.anim||''),id:'cal-body'});C.anim=null;
  const fk=mode==='quarter'?`q-${y}-${q}`:mode==='month'?`m-${monthKey(a)}`:`w-${weekKey(a)}`;
  /* focus is set in Studio; Calendar only shows it, as one quiet line, once it exists */
  {const fr=focusRec(fk),ar=fr?fr.areas||[]:[],rg=calRange(C);if(ar.length)body.append(el('button',{class:'focus-quiet',onclick:()=>{App.state.studio=Object.assign(App.state.studio||{},{mode:mode==='quarter'?'q':mode==='month'?'m':'w',anchor:rg[0]});App.go('studio');}},el('span',{class:'k'},mode==='quarter'?`Q${q+1} focus`:mode==='month'?`${MONL[a.getMonth()]} focus`:'Week focus'),el('span',{},ar.join(', '))));}
  if(mode!=='week'){const tl=tripLine();if(tl)body.append(tl);}
  if(mode==='quarter')quarterBody(body,y,qM,C);else if(mode==='month'){body.append(el('div',{class:'tlswitch'},Segmented([['dots','Overview'],['cal','Calendar']],C.mcal?'cal':'dots',v=>{C.mcal=v==='cal';try{localStorage.setItem('lifeos-cal-mcal',C.mcal?'1':'');}catch(e){}calCommit();},{size:'sm'})));if(C.mcal)monthCalendar(body,a,C);else monthBody(body,a,C);}else{body.append(el('div',{class:'tlswitch'},Segmented([['list','List'],['tl','Timeline']],C.timeline?'tl':'list',v=>{C.timeline=v==='tl';try{localStorage.setItem('lifeos-cal-tl',C.timeline?'1':'');}catch(e){}calCommit();},{size:'sm'})));if(C.timeline)weekTimeline(body,wS,C);else weekBody(body,wS,C);}
  dragSwipe(body,()=>calStep(1),()=>calStep(-1));
  page.append(body);root.append(page,compact);
  const sync=()=>{const h=$('#cal-h'),c=$('#cal-compact');if(h&&c)c.classList.toggle('on',h.getBoundingClientRect().bottom<=(parseFloat(getComputedStyle(c).top)||0)+8);};
  removeEventListener('scroll',App._calS);App._calS=sync;addEventListener('scroll',sync,{passive:true});requestAnimationFrame(sync);
}
function isoWeek(d){const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()+3-((x.getDay()+6)%7));const w1=new Date(x.getFullYear(),0,4);return 1+Math.round(((x-w1)/864e5-3+((w1.getDay()+6)%7))/7);}
function wdLabels(){const ws=get.settings().weekStart??1;return Array.from({length:7},(_,i)=>DOW[(ws+i)%7][0]);}
function focusRec(fk){return get.id('focus-'+fk);}
/* Bars count goal steps finished in this period, out of those finished here plus those still open */
function focusChip(fk,label,mode,range){
  const f=focusRec(fk),areas=f?f.areas||[]:[];
  if(!areas.length)return el('button',{class:'focus-link',onclick:()=>focusSheet(fk,label)},el('span',{style:'display:grid',html:ic('plus',IC.xs)}),`Set a ${(n=>n==='Week'?'week':n)(label.replace(/ focus$/i,''))} focus`);
  const steps=allSteps(),inRange=s=>{if(!s.doneAt)return false;const d=k(new Date(s.doneAt));return d>=range[0]&&d<=range[1];};
  return el('div',{class:'bars'},
    el('div',{style:'display:flex;justify-content:space-between;align-items:center'},el('span',{class:'fl seclbl'},label),Button('Edit',{variant:'link',size:'sm',onclick:()=>focusSheet(fk,label)})),
    el('div',{class:'bars-plan'},Button('Plan in Studio ›',{variant:'link',size:'sm',onclick:()=>{App.state.studio=Object.assign(App.state.studio||{},{mode:mode==='quarter'?'q':mode==='month'?'m':'w',anchor:range[0]});App.go('studio');}})),
    areas.map(ar=>{const list=steps.filter(s=>s.parent.kind==='goal'&&s.parent.area===ar),done=list.filter(s=>s.step.d&&inRange(s.step)).length,open=list.filter(s=>!s.step.d).length,tot=done+open;return el('div',{class:'bar-row'},el('span',{class:'clip'},ar),Progress(tot?done/tot:0,{size:'lg','aria-label':`${done} of ${tot} goal steps finished this period`}),el('span',{class:'small muted tnum'},tot?`${done}/${tot}`:'—'));}));
}
function focusSheet(fk,label){
  const f=focusRec(fk)||{id:'focus-'+fk,kind:'focus',areas:[]};let D=[...(f.areas||[])],inst;
  inst=openSheet({title:'Choose a focus',right:{label:'Done',onclick:()=>{f.areas=D;put(f);inst.close();}},left:{label:'Cancel'},build:body=>{
    const box=el('div',{class:'chips'});const draw=()=>{box.innerHTML='';(get.settings().areas||AREAS).forEach(a=>box.append(el('button',{class:'chip'+(D.includes(a)?' on':''),'aria-pressed':String(D.includes(a)),onclick:()=>{if(D.includes(a))D=D.filter(x=>x!==a);else if(D.length<3)D.push(a);else toast('Pick up to 3 life areas');draw();}},a)));};draw();
    body.append(el('p',{class:'muted'},'Pick up to 3 life areas. Bars show goal steps finished in this period, out of those finished plus those still open.'),box);}});
}
/* gestures: the same language as Today */
function hoverCal(x,y){clearCalHover();const h=document.elementFromPoint(x,y);if(!h||!h.closest)return null;const s=h.closest('[data-slot]');if(s){s.classList.add('over');return s.getAttribute('data-slot');}return null;}
function clearCalHover(){$$('[data-slot].over').forEach(n=>n.classList.remove('over'));}
function moveAny(e,dk,dest){const u=snapItem(e);
  if(e.kind==='allday'){const occ=allDayOccStart(e.rec,dk),n=daysBetween(dk,dest);moveItemDay(e,occ,addK(occ,n));}
  else moveItemDay(e,dk,dest);
  toast(`Moved to ${relDay(dest)}`,u);}
function calGestures(node,e,dk){
  if(e.kind==='gcal'||e.kind==='routine'){onPress(node,(x,y)=>itemMenu(e,dk,x,y));return;}
  node.addEventListener('contextmenu',ev=>{ev.preventDefault();ev.stopPropagation();if(lastPointer==='mouse')itemMenu(e,dk,ev.clientX,ev.clientY);});
  draggable(node,{label:e.title,hold:(x,y)=>itemMenu(e,dk,x,y),move:(x,y)=>{hoverCal(x,y);autoscrollGrid(x,y);},drop:(x,y)=>{const d=hoverCal(x,y);clearCalHover();if(d&&d!==dk)moveAny(e,dk,d);}});
}
function dayMenu(dk,x,y){openMenu(x,y,[{label:'Open in Today',icon:'sun',onclick:()=>{App.state.sel=dk;App.state._fresh=true;App.go('today');}},{label:'Add a task',icon:'task',onclick:()=>taskSheet(null,{date:dk})},{label:'Add a time block',icon:'hour',onclick:()=>blockSheet(null,{date:dk,start:nextFreeSlot(dk)})},{label:'Add an all-day item',icon:'cal',onclick:()=>alldaySheet(null,{start:dk})}]);}
/* v278 · shared pieces so week, month and quarter look alike */
function adPills(adS,dk){return el('div',{class:'wkadrow'},adS.map(e=>{const b=el('button',{class:'wkadc',style:`--c:${e.color||'var(--ink-3)'}`,onclick:ev2=>{ev2.stopPropagation();if(e.holiday)App.go('setpage',{id:'holidays'});else openItem(e,dk);}},e.holiday?el('span',{class:'wkadi','aria-hidden':'true',html:ic(e.hicon||'holiday',IC.sm)}):el('i',{class:'wkadd','aria-hidden':'true'}),el('span',{class:'clip'},e.holiday?Holidays.name(dk):e.title));if(!e.holiday)calGestures(b,e,dk);return b;}));}
function holLine(y,m){if(typeof Holidays==='undefined')return null;const hs=Holidays.recs(y).filter(r=>fromK(r.off).getMonth()===m&&fromK(r.off).getFullYear()===y);if(!hs.length)return null;return el('div',{class:'qhol'},hs.map(r=>el('button',{class:'qholc',onclick:()=>App.go('setpage',{id:'holidays'})},el('span',{class:'wkadi','aria-hidden':'true',html:ic(HOL_ICON[r.id]||'holiday',IC.sm)}),`${r.n} · ${mdS(fromK(r.off))}`)));}
function heatCell(d,{month,tk,C,onTap,bars=false,showSel=true}){
  const dk=k(d),out=month!=null&&d.getMonth()!==month,past=dk<tk;
  if(out)return el('span',{class:'heat out','aria-hidden':'true'});
  const L=dayLoad(dk),isSel=showSel&&C.sel===dk,hn=typeof Holidays!=='undefined'?Holidays.name(dk):null;
  const unit=get.settings().capacity?.mode==='hours'?'hours':'items';
  const btn=el('button',{class:'heat '+(hn?'hol ':'')+(L.level?'l'+L.level+' ':'')+(past?'past ':'')+(dk===tk?'today ':'')+(isSel?'sel':''),'data-slot':dk,'aria-label':`${shortDay(dk)}${hn?`, ${hn}`:''}, ${Math.round(L.value*10)/10} ${unit}`,'aria-current':dk===tk?'date':null,'aria-pressed':showSel?String(isSel):null,onclick:()=>onTap(dk,false)},el('span',{class:'hn'},String(d.getDate())));
  const adB=L.allDay.filter(e=>!(e.rec&&e.rec.tripId));if(bars&&adB.length)btn.append(el('span',{class:'adbars'},adB.slice(0,2).map(e=>el('i',{style:`--c:${e.color}`}))));
  onPress(btn,(x,y)=>dayPeek(dk,btn));
  return btn;
}
function weeksOf(y,m){const first=new Date(y,m,1),last=new Date(y,m+1,0),start=weekStartOf(first),out=[];let d=start;while(d<=last){out.push(Array.from({length:7},(_,i)=>addD(d,i)));d=addD(d,7);}return out;}
function quarterBody(body,y,months,C){
  const tk=todayK(),curW=weekKey(today()),inQ=months.includes(today().getMonth())&&y===today().getFullYear();
  const earlier=new Set();months.forEach(m=>weeksOf(y,m).forEach(w=>{if(k(w[0])<curW)earlier.add(k(w[0]));}));
  if(inQ&&earlier.size)body.append(Button([C.showEarlier?'Hide earlier weeks':`Show ${earlier.size} earlier week${earlier.size>1?'s':''}`,el('span',{html:ic(C.showEarlier?'chevu':'chevd',IC.sm),style:'display:grid'})],{variant:'link',onclick:()=>{C.showEarlier=!C.showEarlier;App.refresh();}}));
  let firstShown=true;
  months.forEach(m=>{
    let weeks=weeksOf(y,m);
    if(inQ&&!C.showEarlier)weeks=weeks.filter(w=>k(w[0])>=curW);
    if(!weeks.length)return;
    const sec=el('section',{},el('button',{class:'m-head',onclick:()=>{const gr=sec.querySelector('.qgrid'),r0=gr&&gr.getBoundingClientRect();C.mode='month';C.anchor=k(new Date(y,m,1));const t=today();C.sel=(t.getFullYear()===y&&t.getMonth()===m)?tk:k(new Date(y,m,1));calCommit();zoomGrid(r0);}},MONL[m],el('span',{class:'m-go',html:ic('chevr',IC.xs)})));
    sec.append(el('div',{class:'wd-row',style:'margin:0 0 var(--s2)'},wdLabels().map(l=>el('span',{},l))));firstShown=false;
    const grid=el('div',{class:'qgrid',style:'display:grid;gap:var(--s2)'});
    weeks.forEach(w=>{const row=el('div',{class:'heat-row'+(k(w[0])===curW?' curwk':'')});w.forEach(d=>row.append(heatCell(d,{month:m,tk,C,showSel:false,onTap:()=>{C.mode='week';C.anchor=k(d);C.sel=k(d);C.weekOpen=k(d);calCommit();}})));grid.append(row);{const tl=tripBand(row,w);if(tl)grid.append(tl);}});
    sec.append(grid);{const hl=holLine(y,m);if(hl)sec.append(hl);}body.append(sec);
  });
}
function monthBody(body,a,C){
  const tk=todayK(),y=a.getFullYear(),m=a.getMonth(),grid=el('div',{id:'month-grid',style:'display:grid;gap:var(--s2)'});
  const selK=C.sel&&monthKey(fromK(C.sel))===monthKey(a)?C.sel:null;weeksOf(y,m).forEach(w=>{const row=el('div',{class:'heat-row'});w.forEach(d=>row.append(heatCell(d,{month:m,tk,C,bars:true,onTap:(dk,out)=>{if(out){C.anim=dk>C.anchor?'slide-l':'slide-r';C.anchor=dk;}else if(C.sel&&dk!==C.sel)panelOut(dk>C.sel?1:-1);C.sel=dk;App.refresh();}})));grid.append(row);{const tl=tripBand(row,w);if(tl)grid.append(tl);}});
  body.append(el('div',{class:'wd-row',style:'margin:0 0 calc(var(--s2) * -1)'},wdLabels().map(l=>el('span',{},l))),grid,holLine(y,m),dayPanel(C.sel&&monthKey(fromK(C.sel))===monthKey(a)?C.sel:k(new Date(y,m,1))));
}
/* v279 · Month as a calendar: each day shows its all-day items and first events by name */
function monthCalendar(body,a,C){
  const tk=todayK(),y=a.getFullYear(),m=a.getMonth(),grid=el('div',{class:'mcal',id:'month-cal'});
  /* anything on every day of the month is said once above the grid, not thirty times */
  const days=[];for(let d=new Date(y,m,1);d.getMonth()===m;d=addD(d,1))days.push(k(d));
  const idsOn=days.map(dk=>{const x=dayItems(dk,{filters:true});return new Set([...x.timed,...x.anytime].map(e=>e.rec&&e.rec.id).filter(Boolean));}),daily=[...idsOn[0]].filter(id=>idsOn.filter(st=>st.has(id)).length>=days.length-2);
  if(daily.length){const nm=daily.map(id=>get.id(id)).filter(Boolean).map(r=>r.title);if(nm.length)body.append(el('p',{class:'wkdaily'},el('b',{},'Every day'),` ${andList(nm)}`));}
  weeksOf(y,m).forEach(w=>w.forEach(d=>{const dk=k(d),out=d.getMonth()!==m;if(out){grid.append(el('span',{class:'mcc out','aria-hidden':'true'}));return;}
    const{allDay,timed,anytime}=dayItems(dk,{filters:true}),hn=typeof Holidays!=='undefined'?Holidays.name(dk):null;
    const ad=allDay.filter(e=>!(e.rec&&e.rec.tripId)),ev=[...timed,...anytime].filter(e=>e.kind!=='habit'&&(e.kind!=='task'||e.time!=null)&&!(e.rec&&daily.includes(e.rec.id))).sort((p,q)=>(p.time??9999)-(q.time??9999)),trip=typeof tripOn==='function'?tripOn(dk):null;
    const lines=[...(trip?[{t:trip.f.what,cls:'trip'}]:[]),...ad.map(e=>({t:e.holiday?hn:e.title,cls:'ad'+(e.holiday?' hol':''),c:e.color})),...ev.map(e=>({t:e.title,cls:e.kind==='task'?'td':'ev',c:e.color}))],shown=lines.slice(0,3),more=lines.length-shown.length;
    const isSel=C.sel===dk;
    const cell=el('button',{class:'mcc'+(dk===tk?' today':'')+(isSel?' sel':'')+(dk<tk?' past':''),'data-slot':dk,'aria-label':`${shortDay(dk)}${lines.length?`, ${lines.length} item${lines.length>1?'s':''}`:''}`,'aria-pressed':String(isSel),onclick:()=>{C.sel=dk;App.refresh();}},
      el('span',{class:'mcn'+(hn?' hol':'')},String(d.getDate())),...shown.map(x=>el('span',{class:'mcl '+x.cls,style:x.c?`--c:${x.c}`:null},x.t)),more>0?el('span',{class:'mcm'},`+${more}`):null);
    onPress(cell,()=>dayPeek(dk,cell));grid.append(cell);}));
  body.append(el('div',{class:'wd-row',style:'margin:0 0 var(--s1)'},wdLabels().map(l=>el('span',{},l))),grid,holLine(y,m),dayPanel(C.sel&&monthKey(fromK(C.sel))===monthKey(a)?C.sel:k(new Date(y,m,1))));
}
function dayLine(e,dk){
  const isTodo=['task','step','habit'].includes(e.kind);const row=el('div',{class:'dayline tick-host'+(e.done?' done':'')+(isTodo?'':' ev'),style:isTodo?null:`--c:${e.color||'var(--action)'}`},!isTodo?el('span',{class:'dlbar','aria-hidden':'true'}):el('span',{class:'tick-hit'},tickBtn(e.done,on=>{row.classList.toggle('done',on);toggleItem(e,dk);setTimeout(()=>App.refresh(),820);})),el('span',{class:'tm'},e.time!=null?fmtT(e.time):'Anytime'),el('button',{class:'grow clip',style:'text-align:left;min-height:var(--size-44)',onclick:()=>openItem(e,dk)},el('span',{class:'tt'},e.title),+(e.rec&&e.rec.travel)&&e.kind==='block'&&e.time!=null?el('small',{class:'trleave'},`Leave by ${fmtT(e.time-e.rec.travel)}`):null),e.kind==='block'&&e.rec&&e.rec.place?placeLink(e.rec.place):null);
  calGestures(row,e,dk);
  /* v228 · the same swipe language as Today: right = done, left = open */
  if(e.kind==='gcal'||e.done)return row;
  return swipeAct(row,{right:['task','step','habit'].includes(e.kind)?{label:'Done',color:'var(--accent)',run:()=>{row.classList.add('done');toggleItem(e,dk);setTimeout(()=>App.refresh(),420);}}:null,
    left:{label:'Open',color:'var(--ink-2)',run:()=>{openItem(e,dk);setTimeout(()=>{row.style.transition='transform var(--dur-base) var(--ease)';row.style.transform='';},250);}}});
}
function allDayChips(allDay,dk){return el('div',{class:'allday-row',style:'margin-top:0'},allDay.map(e=>{const b=el('button',{class:'adchip',style:`--c:${e.color}`,html:(e.hicon?ic(e.hicon,IC.sm):e.icon?glyph(e.icon,16,2):'')+`<span>${esc(e.title)}</span>`,onclick:()=>openItem(e,dk)});calGestures(b,e,dk);return b;}));}
const addChips=(dk,inline)=>el('div',{class:'chips'},Chip('+ Add',{onclick:e=>{const b=e.currentTarget,r=b.getBoundingClientRect();openMenu(r.left,r.bottom+4,[{label:'Task',icon:'task',onclick:()=>inline?wkAdd(b,dk):taskSheet(null,{date:dk})},{label:'Time block',icon:'time',onclick:()=>blockSheet(null,{date:dk,start:nextFreeSlot(dk)})},{label:'All-day',icon:'cal',onclick:()=>alldaySheet(null,{start:dk})}]);}}));
function weekBody(body,start,C){
  const tk=todayK(),list=el('div',{}),adS0=a=>a.filter(e=>!(e.rec&&e.rec.tripId)).length;
  /* anything on every day of the week is said once at the top, not seven times */
  const ids7=[...Array(7)].map((_,i)=>{const x=dayItems(k(addD(start,i)),{filters:true});return new Set([...x.timed,...x.anytime].map(e=>e.rec&&e.rec.id).filter(Boolean));}),daily=[...ids7[0]].filter(id=>ids7.every(s=>s.has(id)));
  if(daily.length){const nm=daily.map(id=>get.id(id)).filter(Boolean).map(r=>r.title);if(nm.length)list.append(el('p',{class:'wkdaily'},el('b',{},'Every day'),` ${andList(nm)}`));}
  for(let i=0;i<7;i++){const d=addD(start,i),dk=k(d),{allDay,timed,anytime}=dayItems(dk,{filters:true}),L=dayLoad(dk),items=[...timed,...anytime],past=dk<tk,empty=!items.length&&!allDay.length,open=C.weekOpen===dk;
    const toggle=()=>{C.weekOpen=open?null:dk;C.sel=dk;App.refresh();};
    const main=el('div',{class:'wkitems'}),trW=tripOn(dk);if(trW)main.append(el('button',{class:'dwk',onclick:ev=>{ev.stopPropagation();tripGo(trW);}},el('span',{style:'display:grid',html:ic('plane',IC.xs)}),`${trW.f.what} · Day ${daysBetween(trW.f.date,dk)+1} of ${tripDays(trW)}`));
    if(open){
      {const adS=allDay.filter(e=>!(e.rec&&e.rec.tripId));if(adS.length)main.append(allDayChips(adS,dk));}
      items.forEach(e=>main.append(dayLine(e,dk)));
      main.append(addChips(dk,true),Button('Open in Today ›',{variant:'link',size:'sm',style:'justify-self:start',onclick:()=>{App.state.sel=dk;App.state._fresh=true;App.go('today');}}));
    }else{
      /* v277 · three looks: all-day items are soft pills, timed events carry a colour bar, timed to-dos a small circle */
      {const adS=allDay.filter(e=>!(e.rec&&e.rec.tripId));if(adS.length)main.append(adPills(adS,dk));}
      const pv=items.filter(e=>!(e.rec&&daily.includes(e.rec.id))),ev=pv.filter(e=>(e.kind!=='task'&&e.kind!=='habit')||(e.kind==='task'&&e.time!=null)).sort((a,b)=>(a.time??9999)-(b.time??9999)),nTodo=pv.filter(e=>e.kind==='task'&&!e.done&&e.time==null).length;
      C.wkMore=C.wkMore||{};const mo=!!C.wkMore[dk],lim=mo?99:3;
      ev.slice(0,lim).forEach(e=>{const isT=e.kind==='task'||e.kind==='step';const r=el('span',{class:'it'+(isT?' task':' ev')+(e.done?' done':''),style:`--c:${e.color||'var(--action)'}`},el('time',{},e.time!=null?fmtT(e.time):'Anytime'),el('i',{class:isT?'itc':'itb','aria-hidden':'true'}),el('span',{class:'itt'},e.title));calGestures(r,e,dk);main.append(r);});
      if(ev.length>3)main.append(el('button',{class:'wkmore',onclick:ev2=>{ev2.stopPropagation();C.wkMore[dk]=!mo;App.refresh();}},mo?'Show less':`Show ${ev.length-3} more`));
      if(nTodo)main.append(el('button',{class:'wktodo',onclick:ev2=>{ev2.stopPropagation();App.state.sel=dk;App.state._fresh=true;App.go('today');}},`${dCount(nTodo,ev.some(x=>x.kind==='task')?'more to-do':'to-do')} ›`));
      if(!ev.length&&!nTodo&&!adS0(allDay)&&!empty&&!trW)main.append(el('span',{class:'ph'},'Habits only'));
      if(empty&&!trW)main.append(el('span',{class:'ph'+(past?'':' plan')},past?'':'Tap to plan'));
    }
    const r=el('div',{class:'wkrow'+(empty&&!open&&!trW?' slim':'')+(open?' sel open':'')+(trW?' wkaway':''),'data-slot':dk,onclick:ev=>{if(ev.target.closest('button,.dayline,.adchip'))return;toggle();}},
      el('button',{class:'dtile '+(L.level?'l'+L.level+' ':'')+(past?'past ':'')+(dk===tk?'today ':'')+(trW?'tripd':''),'aria-label':shortDay(dk),'aria-expanded':String(open),'aria-current':dk===tk?'date':null,onclick:toggle},el('small',{},DOW[d.getDay()].slice(0,3)),el('b',{},String(d.getDate()))),
      main);
    onPress(r,(x,y)=>dayMenu(dk,x,y),'.it,.minichip,.dayline,.adchip,.chip,.linkbtn');
    list.append(r);
  }
  body.append(list);
  const un=get.all('task').filter(t=>!t.date&&isOpenTask(t)).length;
  if(un)body.append(el('button',{class:'focus-chip',onclick:()=>{App.state.studio=Object.assign(App.state.studio||{},{mode:'w',anchor:k(start)});App.go('studio');}},el('span',{class:'small'},`${un} unscheduled task${un>1?'s':''}`),el('span',{class:'fa'},'Plan in Studio ›')));
}
function dayPanel(dk){
  const{allDay,timed,anytime}=dayItems(dk,{filters:true}),tk=todayK(),d=fromK(dk);
  const ev=[...timed,...anytime].filter(e=>e.kind!=='task'&&e.kind!=='habit'),todo=[...timed,...anytime].filter(e=>e.kind==='task'),nOpen=todo.filter(e=>!e.done).length;
  const goT=()=>{App.state.sel=dk;App.state._fresh=true;App.go('today');};
  const c=Card({as:'div',cls:'dpanel'},el('div',{style:'display:flex;align-items:baseline;justify-content:space-between;gap:var(--s2)'},el('div',{class:'serif dpdate'},`${DOW[d.getDay()]}, ${mdS(d)}`),Button('Open in Today ›',{variant:'link',size:'sm',onclick:goT})));
  const adS=allDay.filter(e=>!(e.rec&&e.rec.tripId));if(adS.length)c.append(el('div',{class:'dpad'},adPills(adS,dk)));
  if(ev.length){const lst=el('div',{style:'margin-top:var(--s2)'});ev.forEach(e=>lst.append(dayLine(e,dk)));c.append(lst);}
  if(todo.length)c.append(el('button',{class:'dptodo',onclick:goT},nOpen?`${dCount(nOpen,'to-do')} ›`:`All ${todo.length} to-dos done ›`));
  if(!ev.length&&!todo.length&&!adS.length)c.append(Caption(emptyDayHead(dk),{as:'p',style:'margin:var(--s2) 0 0'}));
  const ch=addChips(dk);ch.style.marginTop='12px';c.append(ch);
  return c;
}
function capLabels(full,unit){
  const b={1:[],2:[],3:[]};for(let n=1;n<full;n++){const l=levelOf(n,full);if(b[l])b[l].push(n);}
  const fmt=a=>!a.length?null:a.length===1?`${a[0]}${unit}`:`${a[0]}–${a[a.length-1]}${unit}`;
  return[['--h0','None'],['--h1',fmt(b[1])],['--h2',fmt(b[2])],['--h3',fmt(b[3])],['--h4',`${full}${unit}+`]].filter(x=>x[1]);
}
function filterSheet(opts={}){
  const s=get.settings(),f=clone(s.filters||DEFAULT_SETTINGS.filters),cap=clone(s.capacity||DEFAULT_SETTINGS.capacity);let inst,draw,step=opts.capacity?'cap':'main';
  const showHeat=calState().mode!=='week';
  inst=openSheet({anchor:opts.anchor,title:step==='cap'?'Daily capacity':'Filters',left:{label:step==='cap'?'Back':'Reset',onclick:()=>{if(step==='cap'){if(opts.capacity){inst.close();return;}step='main';draw();return;}setSettings({filters:clone(DEFAULT_SETTINGS.filters)});inst.close();}},right:{label:'Done',onclick:()=>{setSettings({filters:f,capacity:cap});inst.close();}},build:(body,i)=>{inst=i;
    const ctx=formCtx(()=>draw());const box=el('div',{style:'display:flex;flex-direction:column;gap:var(--s3)'});body.append(box);
    draw=()=>{box.innerHTML='';inst.titleEl.textContent=step==='cap'?'Daily capacity':'Filters';$('.l',inst.sheet).textContent=step==='cap'?(opts.capacity?'Close':'Back'):'Reset';
      if(step==='main'){
        const types=el('div',{class:'group'});[['task','task','Tasks and steps'],['block','hour','Time blocks'],['allday','cal','All-day items'],['habit','habit','Habits']].forEach(([id,icon,n])=>types.append(ctx.row(id,icon,n,null,{expand:false,trailing:ctx.sw(f.types[id]!==false,n,on=>{f.types[id]=on;draw();})})));
        box.append(SectionLabel('Show'),types,SectionLabel('Life areas'),el('div',{class:'chips'},[...(s.areas||AREAS),'None'].map(a=>el('button',{class:'chip ichip'+((f.areas||[]).includes(a)?' on':''),'aria-pressed':String((f.areas||[]).includes(a)),onclick:()=>{f.areas=f.areas||[];f.areas.includes(a)?f.areas=f.areas.filter(x=>x!==a):f.areas.push(a);draw();}},a!=='None'?areaChipIc(a):null,a))));
        if(showHeat){const g=el('div',{class:'group'});g.append(ctx.row('dc','grid','Daily capacity',cap.mode==='hours'?`${cap.hours} hours`:`${cap.full} items`,{tap:()=>{step='cap';draw();},expand:false,trailing:RowEnd('chevron')}));box.append(SectionLabel('Heat map'),g);}
      }else{
        const full=cap.mode==='hours'?cap.hours:cap.full,unit=cap.mode==='hours'?'h':'';
        const wrap=el('div',{class:box._step===step?'':'slide-l',style:'display:flex;flex-direction:column;gap:var(--s3)'});box._step=step;
        const g=el('div',{class:'group'});
        g.append(ctx.row('m','chart','Measure by',null,{expand:false,trailing:seg([['items','Items'],['hours','Hours']],cap.mode,v=>{cap.mode=v;draw();})}));
        g.append(ctx.row('fl','grid','A full day',null,{expand:false,trailing:el('span',{style:'display:flex;align-items:center;gap:var(--s2)'},cap.mode==='hours'?ctx.stepper(cap.hours,2,16,v=>{cap.hours=v;draw();}):ctx.stepper(cap.full,2,20,v=>{cap.full=v;draw();}),cap.mode==='hours'?'hrs':'items')}));
        g.append(ctx.row('lw','sun','Lighter weekends',null,{expand:false,trailing:ctx.sw(cap.lightWeekends,'Lighter weekends',on=>{cap.lightWeekends=on;draw();})}));
        const st=weekStartOf(today());
        const prev=el('div',{class:'heat-row capprev','aria-label':'Preview of this week'},Array.from({length:7},(_,i)=>{const d=addD(st,i),dk=k(d),it=dayItems(dk),v=cap.mode==='hours'?it.timed.reduce((n,e)=>n+(e.dur||30),0)/60:it.timed.length+it.anytime.length,wk=[0,6].includes(d.getDay())&&cap.lightWeekends?.5:1,l=levelOf(v,full*wk);return el('span',{class:'heat '+(l?'l'+l:''),'data-preview':l},el('span',{class:'hn'},String(d.getDate())));}));
        wrap.append(Caption('How much makes a day look full on the heat map. Nothing changes until you tap Save.',{as:'p'}),g,SectionLabel('This week'),prev,
          el('div',{class:'heat-key capkey',style:'justify-content:flex-start;gap:var(--s2) var(--s3)'},capLabels(full,unit).map(([v,t])=>el('span',{style:'display:inline-flex;gap:var(--s2);align-items:center'},el('i',{style:`background:var(${v})`}),t))));
        box.append(wrap);
      }
      inst.place&&inst.place();};
    draw();}});
}

/* v237 · print a week: one clean page with each day's times, to-dos and habits (Save as PDF from the print screen) */
function printWeek(startK){const days=Array.from({length:7},(_,i)=>addK(startK,i)),old=$('#printweek');if(old)old.remove();
  const line=(t,txt,done)=>el('li',{class:done?'done':''},el('span',{class:'pt'},t),txt);
  const day=dk=>{const it=dayItems(dk),d=fromK(dk);const hab=(it.timed||[]).concat(it.anytime||[]).filter(e=>e.kind==='habit'),tim=(it.timed||[]).filter(e=>e.kind!=='habit'&&e.time!=null),any=(it.anytime||[]).filter(e=>e.kind!=='habit');
    return el('section',{class:'pday'+(dk===todayK()?' ptoday':'')},el('h2',{},`${DOW[d.getDay()]} `,el('span',{},mdS(d))),
      (it.allDay||[]).length?el('p',{class:'pall'},(it.allDay||[]).map(e=>e.title).join(' · ')):null,
      el('ul',{},tim.map(e=>line(fmtT(e.time),e.title+(e.kind==='block'&&e.dur?` · ${fmtDurS(e.dur)}`:''),e.done)),any.map(e=>line('○',e.title,e.done))),
      hab.length?el('p',{class:'phab'},'Habits: ',hab.map(e=>`${e.done?'●':'○'} ${e.title}`).join('   ')):null,
      !tim.length&&!any.length&&!hab.length?el('p',{class:'pnone'},'Nothing planned'):null);};
  const box=el('div',{id:'printweek','aria-hidden':'true'},el('header',{},el('h1',{},`${shortDay(days[0])} – ${shortDay(days[6])}`),el('span',{},'Life OS')),el('div',{class:'pgrid'},days.map(day)),el('div',{class:'pnotes'},el('b',{},'Notes')));
  document.body.append(box);document.body.classList.add('printing');
  const done=()=>{document.body.classList.remove('printing');box.remove();removeEventListener('afterprint',done);};addEventListener('afterprint',done);
  setTimeout(()=>{try{window.print();}catch(e){done();}setTimeout(()=>{if(!matchMedia('print').matches&&document.body.classList.contains('printing'))done();},60000);},80);}

/* v237 · week timeline: seven columns by the hour on iPad and computer, three days at a time on iPhone */
function weekTimeline(body,start,C){return TimeGrid(body,start,C);}
/* one time grid for any run of days (Calendar's week; Today's day shares its hour height, lanes, travel bands and now-line) */
function TimeGrid(body,start,C){const tk=todayK(),wide=innerWidth>=BP.tablet,days=Array.from({length:7},(_,i)=>k(addD(start,i)));
  if(C.tlOff==null||C.tlWeek!==days[0]){const ti=days.indexOf(tk);C.tlOff=wide?0:Math.max(0,Math.min(4,ti<0?0:ti));C.tlWeek=days[0];}
  const show=wide?days:days.slice(C.tlOff,C.tlOff+3),its=show.map(dk=>{const x=dayItems(dk,{filters:true});return{dk,all:x.allDay||[],timed:(x.timed||[]).filter(e=>e.time!=null&&!e.cont)};});
  let h0=7,h1=21;its.forEach(o=>o.timed.forEach(e=>{h0=Math.min(h0,Math.floor((e.time-(+(e.rec&&e.rec.travel)||0))/60));h1=Math.max(h1,Math.ceil((e.time+(e.dur||30))/60));}));h0=Math.max(0,h0);h1=Math.min(24,h1);
  const cols=`44px repeat(${show.length},minmax(0,1fr))`,hours=[];for(let h=h0;h<=h1;h++)hours.push(h);
  const head=el('div',{class:'tlhead',style:`grid-template-columns:${cols}`},wide?el('span'):el('span',{class:'tlnav'},IconButton('Earlier days',{size:'sm',html:ic('chevl',IC.sm),disabled:C.tlOff<=0,onclick:()=>{C.tlOff=Math.max(0,C.tlOff-3);App.refresh();}})),
    ...show.map((dk,i)=>{const d=fromK(dk);return el('button',{class:'tlday'+(dk===tk?' today':'')+(dk===C.sel?' sel':''),onclick:()=>{App.state.sel=dk;App.state._fresh=true;App.go('today');},'aria-label':`Open ${shortDay(dk)} in Today`},el('i',{},DOW[d.getDay()].slice(0,3)),el('b',{},String(d.getDate())));}));
  if(!wide&&C.tlOff<4)head.append(el('span',{class:'tlnavr'},IconButton('Later days',{size:'sm',html:ic('chevr',IC.sm),onclick:()=>{C.tlOff=Math.min(4,C.tlOff+3);App.refresh();}})));
  const allRow=its.some(o=>o.all.length)?el('div',{class:'tlall',style:`grid-template-columns:${cols}`},el('span',{class:'tlhl'},'All day'),...its.map(o=>el('div',{},o.all.slice(0,3).map(e=>el('button',{class:'tlad',style:`--c:${e.color||'var(--action)'}`,onclick:()=>openItem(e,o.dk)},e.title))))):null;
  const grid=el('div',{class:'tlgrid',style:`grid-template-columns:${cols};height:${(h1-h0)*HH}px`});
  grid.append(el('div',{class:'tlhours'},hours.slice(0,-1).map(h=>el('span',{style:`top:${(h-h0)*HH}px`},get.settings().clock===24?`${pad2(h)}:00`:`${h%12||12} ${h<12?'AM':'PM'}`))));
  its.forEach(o=>{const col=el('div',{class:'tlcol'+(o.dk===tk?' today':''),'aria-label':`${shortDay(o.dk)} timeline`,'data-dk':o.dk});
    for(let h=h0;h<h1;h++)col.append(el('i',{class:'tlln',style:`top:${(h-h0)*HH}px`}));
    col.addEventListener('click',ev=>{if(ev.target.closest('.tlev'))return;const r=col.getBoundingClientRect(),m=Math.round(((ev.clientY-r.top)/HH*60+h0*60)/15)*15;blockSheet(null,{date:o.dk,start:Math.max(0,Math.min(23*60+45,m)),dur:60});});
    const ps=gridLanes(o.timed);
    ps.forEach(p=>{const n=p.n,e=p.e,top=(e.time-h0*60)/60*HH,ht=Math.max((Math.max(e.dur||30,20))/60*HH-2,18),tr=+(e.rec&&e.rec.travel)||0;const pos=`left:calc(${p.c}/${n}*100% + 1px);width:calc(100%/${n} - 3px)`;
      {const tb=travelBand(e,top,{pos:pos+';right:auto'});if(tb)col.append(tb);}
      const ev=el('button',{class:'tlev'+(e.done?' done':'')+(e.kind==='task'?' task':''),style:`top:${top}px;height:${ht}px;${pos};--c:${e.color||'var(--action)'}`,onclick:ev2=>{if(ev._dragged){ev._dragged=false;return;}openItem(e,o.dk);},'aria-label':`${fmtT(e.time)} ${e.title}`},el('b',{},e.title),ht>30?el('small',{},fmtT(e.time)):null);col.append(ev);if(e.kind==='block'&&e.rec&&!e.cont)tlDrag(ev,e,o.dk,{h0,HH,grid});});
    if(o.dk===tk){const nm=nowMin();if(nm>=h0*60&&nm<=h1*60)col.append(nowLine((nm-h0*60)/60*HH));}
    grid.append(col);});
  body.append(el('div',{class:'tlwrap'},head,allRow,grid));
  {const tr=tlTray(days,{h0,HH,grid});if(tr)body.append(tr);}}

/* v238 · drag in the week timeline: press and drag a block to another time or day, or drag its bottom edge */
function tlDrag(ev,e,dk,{h0,HH,grid}){const r=e.rec,rep=r.repeat&&r.repeat.type!=='never',grip=el('i',{class:'tlgrip','aria-hidden':'true'});ev.append(grip);
  let mode=null,t=null,sx=0,sy=0,top0=0,h0px=0,col0=null,target=null,moved=false;const q=HH/4,snap=v=>Math.round(v/q)*q;
  const label=()=>{const top=parseFloat(ev.style.top),ht=parseFloat(ev.style.height),s=h0*60+Math.round(top/HH*60),d=Math.round(ht/HH*60),sm=ev.querySelector('small');ev.dataset.tip=`${fmtT(s)} – ${fmtT(s+d)}`;if(sm)sm.textContent=fmtT(s);return{s,d};};
  const begin=(m,pe)=>{if(rep){toast('Open a repeating block to move it, so you can choose this one or all of them');return;}mode=m;moved=false;top0=parseFloat(ev.style.top);h0px=parseFloat(ev.style.height);col0=ev.parentElement;target=col0;ev.classList.add('lift');buzz(8);try{ev.setPointerCapture(pe);}catch(err){}grid.classList.add('dragging');};
  ev.addEventListener('pointerdown',pe=>{if(pe.button)return;sx=pe.clientX;sy=pe.clientY;const onGrip=pe.target===grip;clearTimeout(t);if(onGrip){pe.preventDefault();begin('size',pe.pointerId);}else t=setTimeout(()=>begin('move',pe.pointerId),pe.pointerType==='mouse'?120:300);});
  ev.addEventListener('pointermove',pe=>{if(!mode){if(Math.hypot(pe.clientX-sx,pe.clientY-sy)>8)clearTimeout(t);return;}pe.preventDefault();moved=true;const dy=pe.clientY-sy;
    if(mode==='size'){ev.style.height=Math.max(q*2,snap(h0px+dy))+'px';label();return;}
    ev.style.top=Math.max(0,snap(top0+dy))+'px';const hit=document.elementsFromPoint(pe.clientX,pe.clientY).find(n=>n.classList&&n.classList.contains('tlcol'));if(hit&&hit!==target){target=hit;hit.append(ev);ev.style.left='calc(0% + 1px)';ev.style.width='calc(100% - 3px)';}label();});
  const end=()=>{clearTimeout(t);if(!mode)return;const m=mode;mode=null;ev.classList.remove('lift');grid.classList.remove('dragging');if(!moved){ev._dragged=false;return;}ev._dragged=true;
    const{s,d}=label(),nd=target&&target.dataset.dk||dk,was={date:r.date,start:r.start,dur:r.dur};
    if(m==='size')r.dur=Math.max(15,d);else{r.start=Math.max(0,Math.min(1440-15,s));r.date=nd;}put(r);
    toast(m==='size'?`${r.title} · ${fmtDurS(r.dur)}`:`${r.title} moved to ${nd===dk?'':relDay(nd)+', '}${fmtT(r.start)}`,()=>{Object.assign(r,was);put(r);App.refresh();});App.refresh();};
  ev.addEventListener('pointerup',end);ev.addEventListener('pointercancel',end);
  ev.addEventListener('contextmenu',x=>x.preventDefault());}

/* v239 · a tray of unscheduled to-dos under the week timeline: drag one onto a day and hour */
function tlTray(days,{h0,HH,grid}){const set=new Set(days),ts=get.all('task').filter(t=>isOpenTask(t)&&t.time==null&&!(t.repeat&&t.repeat.type!=='never')&&(!t.date||set.has(t.date))).sort((a,b)=>(a.date||'9')<(b.date||'9')?-1:1).slice(0,12);
  if(!ts.length)return null;
  const chip=t=>{const c=el('button',{type:'button',class:'trchip','aria-label':`${t.title}. Drag onto the timeline to schedule`},t.title,t.date?el('small',{},shortDay(t.date)):null);let ghost=null,sx=0,sy=0,live=false,tm=null;
    const drop=(x,y)=>{const col=document.elementsFromPoint(x,y).find(n=>n.classList&&n.classList.contains('tlcol'));if(!col)return false;const r=col.getBoundingClientRect(),m=Math.max(0,Math.min(23*60+45,Math.round(((y-r.top)/HH*60+h0*60)/15)*15)),dk=col.dataset.dk,was={date:t.date,time:t.time};
      t.date=dk;t.time=m;if(!t.dur)t.dur=planMin(t)||30;put(t);toast(`${t.title} · ${relDay(dk)}, ${fmtT(m)}`,()=>{t.date=was.date;t.time=was.time;put(t);App.refresh();});App.refresh();return true;};
    c.addEventListener('pointerdown',e=>{if(e.button)return;sx=e.clientX;sy=e.clientY;try{c.setPointerCapture(e.pointerId);}catch(err){}tm=setTimeout(()=>{live=true;ghost=c.cloneNode(true);ghost.classList.add('trghost');ghost.style.left=sx+'px';ghost.style.top=sy+'px';document.body.append(ghost);c.classList.add('lifted');buzz(8);grid.classList.add('dropping');},e.pointerType==='mouse'?60:250);});
    c.addEventListener('pointermove',e=>{if(!live){if(Math.hypot(e.clientX-sx,e.clientY-sy)>8&&e.pointerType!=='mouse')clearTimeout(tm);return;}e.preventDefault();ghost.style.left=e.clientX+'px';ghost.style.top=e.clientY+'px';});
    const end=e=>{clearTimeout(tm);if(!live)return;live=false;c.classList.remove('lifted');grid.classList.remove('dropping');if(ghost){ghost.remove();ghost=null;}if(e&&e.type==='pointerup')drop(e.clientX,e.clientY);};
    c.addEventListener('pointerup',end);c.addEventListener('pointercancel',end);c.addEventListener('click',()=>{if(!live)openRec(t);});return c;};
  return el('div',{class:'tltray'},SectionLabel('Unscheduled',{count:ts.length,action:Caption('Drag onto the timeline')}),el('div',{class:'trlist'},ts.map(chip)));}
