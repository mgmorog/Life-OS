/* ---------- Calendar: Quarter, Month, Week. One header, one heat map, one filter sheet ---------- */
function calState(){const S=App.state;if(!S.cal){let m='quarter';try{m=localStorage.getItem('lifeos-cal-mode')||'quarter';}catch(e){}if(!['quarter','month','week'].includes(m))m='quarter';let tl=false;try{tl=!!localStorage.getItem('lifeos-cal-tl');}catch(e){}S.cal={mode:m,anchor:todayK(),sel:todayK(),weekOpen:null,showEarlier:false,timeline:tl};}return S.cal;}
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
  const arrows=()=>el('div',{class:'arrows'},IconButton(`Previous ${mode}`,{cls:'green',html:ic('chevl',20,2),onclick:()=>calStep(-1)}),IconButton(`Next ${mode}`,{cls:'green',html:ic('chevr',20,2),onclick:()=>calStep(1)}),IconButton('Filters',{cls:'green',html:ic('filter',20,2)+(filtered?'<span class="dot"></span>':''),onclick:e=>filterSheet({anchor:e.currentTarget.getBoundingClientRect()})}),moreB('Calendar options',e=>{const r=e.currentTarget.getBoundingClientRect(),ws=weekStartOf(fromK(C.sel||C.anchor||todayK()));openMenu(r.right,r.bottom+4,[mode==='week'?{label:C.timeline?'Show as a list':'Show as a timeline',icon:C.timeline?'list':'time',onclick:()=>{C.timeline=!C.timeline;try{localStorage.setItem('lifeos-cal-tl',C.timeline?'1':'');}catch(e){}calCommit();}}:null,{label:'Print this week',icon:'share',onclick:()=>printWeek(k(ws))}]);}));
  const ORDERM=['quarter','month','week'];const modeSeg=()=>seg([['quarter','Quarter'],['month','Month'],['week','Week']],mode,v=>{const[s,e]=calRange(C);if(C.sel&&C.sel>=s&&C.sel<=e)C.anchor=C.sel;const dir=ORDERM.indexOf(v)>ORDERM.indexOf(C.mode)?1:-1;C.mode=v;C.weekOpen=null;try{localStorage.setItem('lifeos-cal-mode',v);}catch(e){}glideSwap(()=>calCommit(),[['#cal-body','x'],['#cal-h .tbtn span','y'],['#cal-h .cal-eyebrow','y']],dir);});
  const pill=()=>!current?Chip('Today',{variant:'status',cls:'pill-today',onclick:calNow}):null;
  const page=el('div',{class:'page'});
  page.append(el('header',{class:'phead cal-h',id:'cal-h'},
    el('div',{class:'cal-title'},el('button',{class:'tbtn'+(mode==='week'?' mid':''),'aria-label':`Choose ${mode}`,onclick:e=>pickPeriod(e.currentTarget.getBoundingClientRect()),html:`<span>${esc(title)}</span>`+ic('chevd',18,2)}),arrows()),
    eyebrow||!current?el('div',{class:'cal-eyebrow hq'},eyebrow?el('span',{class:'hquiet'},eyebrow):el('span'),pill()):null,
    el('div',{style:'margin-top:6px'},modeSeg())));
  const compact=el('div',{class:'cal-compact',id:'cal-compact'},el('div',{class:'cc-in'},
    el('div',{class:'cal-title',style:'min-height:44px'},el('button',{class:'tbtn cc-title','aria-label':`Choose ${mode}`,onclick:e=>pickPeriod(e.currentTarget.getBoundingClientRect()),html:`<span>${esc(miniTitle)}</span>`+ic('chevd',16,2)}),el('span',{style:'display:flex;align-items:center;gap:2px'},pill(),arrows())),
    modeSeg(),mode==='month'?el('div',{class:'wd-row'},wdLabels().map(l=>el('span',{},l))):null));
  const body=el('div',{class:'page '+(C.anim||''),id:'cal-body'});C.anim=null;
  const fk=mode==='quarter'?`q-${y}-${q}`:mode==='month'?`m-${monthKey(a)}`:`w-${weekKey(a)}`;
  /* focus is set in Studio; Calendar only shows it, as one quiet line, once it exists */
  {const fr=focusRec(fk),ar=fr?fr.areas||[]:[],rg=calRange(C);if(ar.length)body.append(el('button',{class:'focus-quiet',onclick:()=>{App.state.studio=Object.assign(App.state.studio||{},{mode:mode==='quarter'?'q':mode==='month'?'m':'w',anchor:rg[0]});App.go('studio');}},el('span',{class:'k'},mode==='quarter'?`Q${q+1} focus`:mode==='month'?`${MONL[a.getMonth()]} focus`:'Week focus'),el('span',{},ar.join(', '))));}
  if(mode!=='week'){const tl=tripLine();if(tl)body.append(tl);}
  if(mode==='quarter')quarterBody(body,y,qM,C);else if(mode==='month')monthBody(body,a,C);else{body.append(el('div',{class:'tlswitch'},Segmented([['list','List'],['tl','Timeline']],C.timeline?'tl':'list',v=>{C.timeline=v==='tl';try{localStorage.setItem('lifeos-cal-tl',C.timeline?'1':'');}catch(e){}calCommit();},{size:'sm'})));if(C.timeline)weekTimeline(body,wS,C);else weekBody(body,wS,C);}
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
  if(!areas.length)return el('button',{class:'focus-link',onclick:()=>focusSheet(fk,label)},el('span',{style:'display:grid',html:ic('plus',14,2.4)}),`Set a ${label.replace(/ FOCUS$/,'').replace(/^WEEK$/,'week').replace(/^([A-Z]+)$/,(m)=>m[0]+m.slice(1).toLowerCase())} focus`);
  const steps=allSteps(),inRange=s=>{if(!s.doneAt)return false;const d=k(new Date(s.doneAt));return d>=range[0]&&d<=range[1];};
  return el('div',{class:'bars'},
    el('div',{style:'display:flex;justify-content:space-between;align-items:center'},el('button',{class:'fl eyebrow',style:'font-size:var(--fs-caption)',onclick:()=>focusSheet(fk,label)},label+' · Edit'),Button('Plan in Studio ›',{variant:'link',size:'sm',onclick:()=>{App.state.studio=Object.assign(App.state.studio||{},{mode:mode==='quarter'?'q':mode==='month'?'m':'w',anchor:range[0]});App.go('studio');}})),
    areas.map(ar=>{const list=steps.filter(s=>s.parent.kind==='goal'&&s.parent.area===ar),done=list.filter(s=>s.step.d&&inRange(s.step)).length,open=list.filter(s=>!s.step.d).length,tot=done+open;return el('div',{class:'bar-row'},el('span',{class:'clip'},ar),Progress(tot?done/tot:0,{size:'lg','aria-label':`${done} of ${tot} goal steps finished this period`}),el('span',{class:'small muted tnum'},tot?`${done}/${tot}`:'No open steps'));}));
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
function heatCell(d,{month,tk,C,onTap,bars=false,showSel=true}){
  const dk=k(d),out=month!=null&&d.getMonth()!==month,past=dk<tk;
  if(out)return el('span',{class:'heat out','aria-hidden':'true'});
  const L=dayLoad(dk),isSel=showSel&&C.sel===dk;
  const unit=get.settings().capacity?.mode==='hours'?'hours':'items';
  const btn=el('button',{class:'heat '+(L.level?'l'+L.level+' ':'')+(past?'past ':'')+(dk===tk?'today ':'')+(isSel?'sel':''),'data-slot':dk,'aria-label':`${shortDay(dk)}, ${Math.round(L.value*10)/10} ${unit}`,'aria-current':dk===tk?'date':null,'aria-pressed':showSel?String(isSel):null,onclick:()=>onTap(dk,false)},el('span',{class:'hn'},String(d.getDate())));
  const adB=L.allDay.filter(e=>!(e.rec&&e.rec.tripId));if(bars&&adB.length)btn.append(el('span',{class:'adbars'},adB.slice(0,2).map(e=>el('i',{style:`--c:${e.color}`}))));
  onPress(btn,(x,y)=>dayPeek(dk,btn));
  return btn;
}
function weeksOf(y,m){const first=new Date(y,m,1),last=new Date(y,m+1,0),start=weekStartOf(first),out=[];let d=start;while(d<=last){out.push(Array.from({length:7},(_,i)=>addD(d,i)));d=addD(d,7);}return out;}
function heatKey(){return el('div',{class:'heat-key','aria-label':'Heat map key'},el('span',{},'Fewer'),['--h0','--h1','--h2','--h3','--h4'].map(v=>el('i',{style:`background:var(${v})`})),el('span',{},'More'));}
function quarterBody(body,y,months,C){
  const tk=todayK(),curW=weekKey(today()),inQ=months.includes(today().getMonth())&&y===today().getFullYear();
  const earlier=new Set();months.forEach(m=>weeksOf(y,m).forEach(w=>{if(k(w[0])<curW)earlier.add(k(w[0]));}));
  if(inQ&&earlier.size)body.append(Button([C.showEarlier?'Hide earlier weeks':`Show ${earlier.size} earlier week${earlier.size>1?'s':''}`,el('span',{html:ic(C.showEarlier?'chevu':'chevd',16,2.2),style:'display:grid'})],{variant:'link',onclick:()=>{C.showEarlier=!C.showEarlier;App.refresh();}}));
  let firstShown=true;
  months.forEach(m=>{
    let weeks=weeksOf(y,m);
    if(inQ&&!C.showEarlier)weeks=weeks.filter(w=>k(w[0])>=curW);
    if(!weeks.length)return;
    const sec=el('section',{},el('button',{class:'m-head',onclick:()=>{const gr=sec.querySelector('.qgrid'),r0=gr&&gr.getBoundingClientRect();C.mode='month';C.anchor=k(new Date(y,m,1));const t=today();C.sel=(t.getFullYear()===y&&t.getMonth()===m)?tk:k(new Date(y,m,1));calCommit();zoomGrid(r0);}},MONL[m],el('span',{class:'m-go',html:ic('chevr',14,2.4)})));
    sec.append(el('div',{class:'wd-row',style:'margin:0 0 var(--s2)'},wdLabels().map(l=>el('span',{},l))));firstShown=false;
    const grid=el('div',{class:'qgrid',style:'display:grid;gap:6px'});
    weeks.forEach(w=>{const row=el('div',{class:'heat-row'+(k(w[0])===curW?' curwk':'')});w.forEach(d=>row.append(heatCell(d,{month:m,tk,C,showSel:false,onTap:()=>{C.mode='week';C.anchor=k(d);C.sel=k(d);C.weekOpen=k(d);calCommit();}})));grid.append(row);{const tl=tripBand(row,w);if(tl)grid.append(tl);}});
    sec.append(grid);body.append(sec);
  });
}
function monthBody(body,a,C){
  const tk=todayK(),y=a.getFullYear(),m=a.getMonth(),grid=el('div',{id:'month-grid',style:'display:grid;gap:6px'});
  const selK=C.sel&&monthKey(fromK(C.sel))===monthKey(a)?C.sel:null;weeksOf(y,m).forEach(w=>{const row=el('div',{class:'heat-row'});w.forEach(d=>row.append(heatCell(d,{month:m,tk,C,bars:true,onTap:(dk,out)=>{if(out){C.anim=dk>C.anchor?'slide-l':'slide-r';C.anchor=dk;}else if(C.sel&&dk!==C.sel)panelOut(dk>C.sel?1:-1);C.sel=dk;App.refresh();}})));grid.append(row);{const tl=tripBand(row,w);if(tl)grid.append(tl);}});
  body.append(el('div',{class:'wd-row',style:'margin:0 0 -6px'},wdLabels().map(l=>el('span',{},l))),grid,dayPanel(C.sel&&monthKey(fromK(C.sel))===monthKey(a)?C.sel:k(new Date(y,m,1))));
}
function dayLine(e,dk){
  const row=el('div',{class:'dayline tick-host'+(e.done?' done':'')},e.kind==='gcal'?null:el('span',{class:'tick-hit'},tickBtn(e.done,on=>{row.classList.toggle('done',on);toggleItem(e,dk);setTimeout(()=>App.refresh(),820);})),el('span',{class:'tm'},e.time!=null?fmtT(e.time):'Anytime'),el('button',{class:'grow clip',style:'text-align:left;min-height:44px',onclick:()=>openItem(e,dk)},el('span',{class:'tt'},e.title),+(e.rec&&e.rec.travel)&&e.kind==='block'&&e.time!=null?el('small',{class:'trleave'},`Leave by ${fmtT(e.time-e.rec.travel)}`):null),e.kind==='block'&&e.rec&&e.rec.place?placeLink(e.rec.place):null);
  calGestures(row,e,dk);
  /* v228 · the same swipe language as Today: right = done, left = open */
  if(e.kind==='gcal'||e.done)return row;
  return swipeAct(row,{right:['task','step','habit'].includes(e.kind)?{label:'Done',color:'var(--accent)',run:()=>{row.classList.add('done');toggleItem(e,dk);setTimeout(()=>App.refresh(),420);}}:null,
    left:{label:'Open',color:'var(--ink-2)',run:()=>{openItem(e,dk);setTimeout(()=>{row.style.transition='transform var(--dur-base) var(--ease)';row.style.transform='';},250);}}});
}
function allDayChips(allDay,dk){return el('div',{class:'allday-row',style:'margin-top:0'},allDay.map(e=>{const b=el('button',{class:'adchip',style:`--c:${e.color}`,html:(e.icon?glyph(e.icon,16,2):'')+`<span>${esc(e.title)}</span>`,onclick:()=>openItem(e,dk)});calGestures(b,e,dk);return b;}));}
const addChips=(dk,inline)=>el('div',{class:'chips'},Chip('+ Add',{onclick:e=>{const b=e.currentTarget,r=b.getBoundingClientRect();openMenu(r.left,r.bottom+4,[{label:'Task',icon:'task',onclick:()=>inline?wkAdd(b,dk):taskSheet(null,{date:dk})},{label:'Time block',icon:'time',onclick:()=>blockSheet(null,{date:dk,start:nextFreeSlot(dk)})},{label:'All-day',icon:'cal',onclick:()=>alldaySheet(null,{start:dk})}]);}}));
function weekBody(body,start,C){
  const tk=todayK(),list=el('div',{}),adS0=a=>a.filter(e=>!(e.rec&&e.rec.tripId)).length;
  /* anything on every day of the week is said once at the top, not seven times */
  const ids7=[...Array(7)].map((_,i)=>{const x=dayItems(k(addD(start,i)),{filters:true});return new Set([...x.timed,...x.anytime].map(e=>e.rec&&e.rec.id).filter(Boolean));}),daily=[...ids7[0]].filter(id=>ids7.every(s=>s.has(id)));
  if(daily.length){const nm=daily.map(id=>get.id(id)).filter(Boolean).map(r=>r.title);if(nm.length)list.append(el('p',{class:'wkdaily'},el('b',{},'Every day'),` ${andList(nm)}`));}
  for(let i=0;i<7;i++){const d=addD(start,i),dk=k(d),{allDay,timed,anytime}=dayItems(dk,{filters:true}),L=dayLoad(dk),items=[...timed,...anytime],past=dk<tk,empty=!items.length&&!allDay.length,open=C.weekOpen===dk;
    const toggle=()=>{C.weekOpen=open?null:dk;C.sel=dk;App.refresh();};
    const main=el('div',{class:'wkitems'}),trW=tripOn(dk);if(trW)main.append(el('button',{class:'dwk',onclick:ev=>{ev.stopPropagation();tripGo(trW);}},el('span',{style:'display:grid',html:ic('plane',13,2.2)}),`${trW.f.what} · Day ${daysBetween(trW.f.date,dk)+1} of ${tripDays(trW)}`));
    if(open){
      {const adS=allDay.filter(e=>!(e.rec&&e.rec.tripId));if(adS.length)main.append(allDayChips(adS,dk));}
      items.forEach(e=>main.append(dayLine(e,dk)));
      main.append(addChips(dk,true),Button('Open in Today ›',{variant:'link',size:'sm',style:'justify-self:start',onclick:()=>{App.state.sel=dk;App.state._fresh=true;App.go('today');}}));
    }else{
      {const adS=allDay.filter(e=>!(e.rec&&e.rec.tripId));if(adS.length)main.append(el('span',{class:'wkad'},adS.map(e=>e.title).join(' · ')));}
      const pv=items.filter(e=>!(e.rec&&daily.includes(e.rec.id))),ev=pv.filter(e=>e.kind!=='task'&&e.kind!=='habit'),nTodo=pv.filter(e=>e.kind==='task'&&!e.done).length;
      C.wkMore=C.wkMore||{};const mo=!!C.wkMore[dk],lim=mo?99:3;
      ev.slice(0,lim).forEach(e=>{const r=el('span',{class:'it'},el('time',{},e.time!=null?fmtT(e.time):'All day'),el('span',{},e.title));calGestures(r,e,dk);main.append(r);});
      if(ev.length>3)main.append(el('button',{class:'wkmore',onclick:ev2=>{ev2.stopPropagation();C.wkMore[dk]=!mo;App.refresh();}},mo?'Show less':`+${ev.length-3} more`));
      if(nTodo)main.append(el('button',{class:'wktodo',onclick:ev2=>{ev2.stopPropagation();App.state.sel=dk;App.state._fresh=true;App.go('today');}},`${dCount(nTodo,'to-do')} ›`));
      if(!ev.length&&!nTodo&&!adS0(allDay)&&!empty&&!trW)main.append(el('span',{class:'ph'},'Habits only'));
      if(empty&&!trW)main.append(el('span',{class:'ph'+(past?'':' plan')},past?'':'Tap to plan'));
    }
    const r=el('div',{class:'wkrow'+(empty&&!open&&!trW?' slim':'')+(open?' sel open':'')+(trW?' wkaway':''),'data-slot':dk,onclick:ev=>{if(ev.target.closest('button,.dayline,.adchip'))return;toggle();}},
      el('button',{class:'dtile '+(L.level?'l'+L.level+' ':'')+(past?'past ':'')+(dk===tk?'today ':'')+(trW?'tripd':''),'aria-label':shortDay(dk),'aria-expanded':String(open),'aria-current':dk===tk?'date':null,onclick:toggle},el('small',{},DOW[d.getDay()].slice(0,3).toUpperCase()),el('b',{},String(d.getDate()))),
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
  const adS=allDay.filter(e=>!(e.rec&&e.rec.tripId));if(adS.length)c.append(el('div',{class:'dpad'},adS.map(e=>e.title).join(' · ')));
  if(ev.length){const lst=el('div',{style:'margin-top:var(--s2)'});ev.forEach(e=>lst.append(dayLine(e,dk)));c.append(lst);}
  if(todo.length)c.append(el('button',{class:'dptodo',onclick:goT},nOpen?`${dCount(nOpen,'to-do')} ›`:`All ${todo.length} to-dos done ›`));
  if(!ev.length&&!todo.length&&!adS.length)c.append(Caption(emptyDayHead(dk),{as:'p',style:'margin:6px 0 0'}));
  const ch=addChips(dk);ch.style.marginTop='12px';c.append(ch);
  return c;
}
function pickPeriod(anchor){
  const C=calState(),a=fromK(C.anchor),t=today();let inst,vy=a.getFullYear();
  inst=openSheet({anchor,title:C.mode==='quarter'?'Choose quarter':C.mode==='month'?'Choose month':'Choose week',build:body=>{
    const box=el('div',{});
    const pick=d=>{C.anchor=k(d);if(C.mode==='month')C.sel=isCurrentFor('month',d)?todayK():k(d);if(C.mode==='week'){C.sel=k(d);C.weekOpen=null;}inst.close();calCommit();};
    const draw=()=>{box.innerHTML='';
      if(C.mode==='week'){const c=formCtx(()=>{});box.append(Card({as:'div'},c.calendar(C.anchor,dk=>{if(dk)pick(fromK(dk));},{range:calRange(C)})));return;}
      box.append(el('div',{style:'display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;font-weight:600'},IconButton('Previous year',{cls:'green',html:ic('chevl',20,2),onclick:()=>{vy--;draw();}}),String(vy),IconButton('Next year',{cls:'green',html:ic('chevr',20,2),onclick:()=>{vy++;draw();}})));
      if(C.mode==='month')box.append(el('div',{class:'pick-grid'},MONL.map((n,i)=>el('button',{class:(vy===a.getFullYear()&&i===a.getMonth()?'on ':'')+(vy===t.getFullYear()&&i===t.getMonth()?'cur':''),onclick:()=>pick(new Date(vy,i,1))},n.slice(0,3)))));
      else box.append(el('div',{class:'pick-grid',style:'grid-template-columns:repeat(2,minmax(0,1fr))'},[0,1,2,3].map(i=>el('button',{class:(vy===a.getFullYear()&&i===quarterOf(a)?'on ':'')+(vy===t.getFullYear()&&i===quarterOf(t)?'cur':''),style:'height:68px',onclick:()=>pick(new Date(vy,i*3,1))},`Q${i+1}`,el('small',{},`${MON[i*3]} – ${MON[i*3+2]}`)))));};
    draw();body.append(box,Button('Jump to today',{variant:'quiet',full:true,onclick:()=>{inst.close();calNow();}}));}});
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
        if(showHeat){const g=el('div',{class:'group'});g.append(ctx.row('dc','grid','Daily capacity',cap.mode==='hours'?`${cap.hours} hours`:`${cap.full} items`,{tap:()=>{step='cap';draw();},expand:false,trailing:el('span',{class:'chev',html:ic('chevr',16,2.2)})}));box.append(SectionLabel('Heat map'),g);}
      }else{
        const full=cap.mode==='hours'?cap.hours:cap.full,unit=cap.mode==='hours'?'h':'';
        const wrap=el('div',{class:box._step===step?'':'slide-l',style:'display:flex;flex-direction:column;gap:var(--s3)'});box._step=step;
        const g=el('div',{class:'group'});
        g.append(ctx.row('m','chart','Measure by',null,{expand:false,trailing:seg([['items','Items'],['hours','Hours']],cap.mode,v=>{cap.mode=v;draw();})}));
        g.append(ctx.row('fl','grid','A full day',null,{expand:false,trailing:el('span',{style:'display:flex;align-items:center;gap:var(--s2)'},cap.mode==='hours'?ctx.stepper(cap.hours,2,16,v=>{cap.hours=v;draw();}):ctx.stepper(cap.full,2,20,v=>{cap.full=v;draw();}),cap.mode==='hours'?'hrs':'items')}));
        g.append(ctx.row('lw','sun','Lighter weekends',null,{expand:false,trailing:ctx.sw(cap.lightWeekends,'Lighter weekends',on=>{cap.lightWeekends=on;draw();})}));
        const st=weekStartOf(today());
        const prev=el('div',{class:'heat-row','aria-label':'Preview of this week'},Array.from({length:7},(_,i)=>{const d=addD(st,i),dk=k(d),it=dayItems(dk),v=cap.mode==='hours'?it.timed.reduce((n,e)=>n+(e.dur||30),0)/60:it.timed.length+it.anytime.length,wk=[0,6].includes(d.getDay())&&cap.lightWeekends?.5:1,l=levelOf(v,full*wk);return el('span',{class:'heat '+(l?'l'+l:''),'data-preview':l},el('span',{class:'hn'},String(d.getDate())));}));
        wrap.append(Caption('How much makes a day look full on the heat map. Nothing changes until you tap Done.',{as:'p'}),g,SectionLabel('This week'),prev,
          el('div',{class:'heat-key',style:'justify-content:flex-start;gap:6px 10px'},capLabels(full,unit).map(([v,t])=>el('span',{style:'display:inline-flex;gap:6px;align-items:center'},el('i',{style:`background:var(${v})`}),t))));
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
function weekTimeline(body,start,C){const tk=todayK(),wide=innerWidth>=BP.tablet,days=Array.from({length:7},(_,i)=>k(addD(start,i)));
  if(C.tlOff==null||C.tlWeek!==days[0]){const ti=days.indexOf(tk);C.tlOff=wide?0:Math.max(0,Math.min(4,ti<0?0:ti));C.tlWeek=days[0];}
  const show=wide?days:days.slice(C.tlOff,C.tlOff+3),HH=44,its=show.map(dk=>{const x=dayItems(dk,{filters:true});return{dk,all:x.allDay||[],timed:(x.timed||[]).filter(e=>e.time!=null&&!e.cont)};});
  let h0=7,h1=21;its.forEach(o=>o.timed.forEach(e=>{h0=Math.min(h0,Math.floor((e.time-(+(e.rec&&e.rec.travel)||0))/60));h1=Math.max(h1,Math.ceil((e.time+(e.dur||30))/60));}));h0=Math.max(0,h0);h1=Math.min(24,h1);
  const cols=`44px repeat(${show.length},minmax(0,1fr))`,hours=[];for(let h=h0;h<=h1;h++)hours.push(h);
  const head=el('div',{class:'tlhead',style:`grid-template-columns:${cols}`},wide?el('span'):el('span',{class:'tlnav'},IconButton('Earlier days',{size:'sm',html:ic('chevl',16,2.2),disabled:C.tlOff<=0,onclick:()=>{C.tlOff=Math.max(0,C.tlOff-3);App.refresh();}})),
    ...show.map((dk,i)=>{const d=fromK(dk);return el('button',{class:'tlday'+(dk===tk?' today':'')+(dk===C.sel?' sel':''),onclick:()=>{App.state.sel=dk;App.state._fresh=true;App.go('today');},'aria-label':`Open ${shortDay(dk)} in Today`},el('i',{},DOW[d.getDay()].slice(0,3)),el('b',{},String(d.getDate())));}));
  if(!wide&&C.tlOff<4)head.append(el('span',{class:'tlnavr'},IconButton('Later days',{size:'sm',html:ic('chevr',16,2.2),onclick:()=>{C.tlOff=Math.min(4,C.tlOff+3);App.refresh();}})));
  const allRow=its.some(o=>o.all.length)?el('div',{class:'tlall',style:`grid-template-columns:${cols}`},el('span',{class:'tlhl'},'All day'),...its.map(o=>el('div',{},o.all.slice(0,3).map(e=>el('button',{class:'tlad',style:`--c:${e.color||'var(--action)'}`,onclick:()=>openItem(e,o.dk)},e.title))))):null;
  const grid=el('div',{class:'tlgrid',style:`grid-template-columns:${cols};height:${(h1-h0)*HH}px`});
  grid.append(el('div',{class:'tlhours'},hours.slice(0,-1).map(h=>el('span',{style:`top:${(h-h0)*HH}px`},get.settings().clock===24?`${pad2(h)}:00`:`${h%12||12} ${h<12?'AM':'PM'}`))));
  its.forEach(o=>{const col=el('div',{class:'tlcol'+(o.dk===tk?' today':''),'aria-label':`${shortDay(o.dk)} timeline`,'data-dk':o.dk});
    for(let h=h0;h<h1;h++)col.append(el('i',{class:'tlln',style:`top:${(h-h0)*HH}px`}));
    col.addEventListener('click',ev=>{if(ev.target.closest('.tlev'))return;const r=col.getBoundingClientRect(),m=Math.round(((ev.clientY-r.top)/HH*60+h0*60)/15)*15;blockSheet(null,{date:o.dk,start:Math.max(0,Math.min(23*60+45,m)),dur:60});});
    const lanes=[];const ps=o.timed.slice().sort((a,b)=>a.time-b.time).map(e=>{const end=e.time+Math.max(e.dur||30,20);let c=lanes.findIndex(x=>x<=e.time);if(c<0){c=lanes.length;lanes.push(0);}lanes[c]=end;return{e,c,end};});
    ps.forEach(p=>{const n=Math.max(...ps.filter(q=>q.e.time<p.end&&q.end>p.e.time).map(q=>q.c))+1,e=p.e,top=(e.time-h0*60)/60*HH,ht=Math.max((Math.max(e.dur||30,20))/60*HH-2,18),tr=+(e.rec&&e.rec.travel)||0;const pos=`left:calc(${p.c}/${n}*100% + 1px);width:calc(100%/${n} - 3px)`;
      if(tr&&e.kind==='block')col.append(el('div',{class:'tltr',style:`top:${top-tr/60*HH}px;height:${tr/60*HH}px;${pos};--c:${e.color||'var(--action)'}`,'aria-hidden':'true'}));
      const ev=el('button',{class:'tlev'+(e.done?' done':'')+(e.kind==='task'?' task':''),style:`top:${top}px;height:${ht}px;${pos};--c:${e.color||'var(--action)'}`,onclick:ev2=>{if(ev._dragged){ev._dragged=false;return;}openItem(e,o.dk);},'aria-label':`${fmtT(e.time)} ${e.title}`},el('b',{},e.title),ht>30?el('small',{},fmtT(e.time)):null);col.append(ev);if(e.kind==='block'&&e.rec&&!e.cont)tlDrag(ev,e,o.dk,{h0,HH,grid});});
    if(o.dk===tk){const nm=nowMin();if(nm>=h0*60&&nm<=h1*60)col.append(el('i',{class:'tlnow',style:`top:${(nm-h0*60)/60*HH}px`}));}
    grid.append(col);});
  body.append(el('div',{class:'tlwrap'},head,allRow,grid));}

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
