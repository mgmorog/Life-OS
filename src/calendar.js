/* ---------- Calendar: Quarter, Month, Week. One header, one heat map, one filter sheet ---------- */
function calState(){const S=App.state;if(!S.cal)S.cal={mode:'quarter',anchor:todayK(),sel:todayK(),weekOpen:null,showEarlier:false};return S.cal;}
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
  const C=calState(),a=fromK(C.anchor),mode=C.mode,y=a.getFullYear(),q=quarterOf(a),qM=[q*3,q*3+1,q*3+2];
  const current=isCurrentFor(mode,a),wS=weekStartOf(a),wE=addD(wS,6);
  const rangeD=wS.getMonth()===wE.getMonth()?`${MON[wS.getMonth()]} ${wS.getDate()} – ${wE.getDate()}`:`${MON[wS.getMonth()]} ${wS.getDate()} – ${MON[wE.getMonth()]} ${wE.getDate()}`;
  const eyebrow=mode==='quarter'?`${MON[qM[0]]} – ${MON[qM[2]]} ${y}`:mode==='month'?String(y):`${wE.getFullYear()} · Week ${isoWeek(wS)}`;
  const title=mode==='quarter'?`Q${q+1}`:mode==='month'?MONL[a.getMonth()]:rangeD;
  const miniTitle=mode==='quarter'?`Q${q+1} ${y}`:mode==='month'?`${MONL[a.getMonth()]} ${y}`:`${rangeD}, ${wE.getFullYear()}`;
  const f=get.settings().filters||{},filtered=(f.areas&&f.areas.length)||Object.values(f.types||{}).some(v=>v===false);
  const arrows=()=>el('div',{class:'arrows'},el('button',{class:'iconbtn green','aria-label':`Previous ${mode}`,html:ic('chevl',20,2),onclick:()=>calStep(-1)}),el('button',{class:'iconbtn green','aria-label':`Next ${mode}`,html:ic('chevr',20,2),onclick:()=>calStep(1)}),el('button',{class:'iconbtn green','aria-label':'Filters',html:ic('filter',20,2)+(filtered?'<span class="dot"></span>':''),onclick:e=>filterSheet({anchor:e.currentTarget.getBoundingClientRect()})}));
  const modeSeg=()=>seg([['quarter','Quarter'],['month','Month'],['week','Week']],mode,v=>{const[s,e]=calRange(C);if(C.sel&&C.sel>=s&&C.sel<=e)C.anchor=C.sel;C.mode=v;C.weekOpen=null;calCommit();});
  const pill=()=>!current?el('button',{class:'pill-today',onclick:calNow},'Today'):null;
  const page=el('div',{class:'page'});
  page.append(el('header',{class:'cal-h',id:'cal-h'},
    el('div',{class:'cal-eyebrow'},el('span',{class:'eyebrow'},eyebrow),pill()),
    el('div',{class:'cal-title'},el('button',{class:'tbtn'+(mode==='week'?' mid':''),'aria-label':`Choose ${mode}`,onclick:e=>pickPeriod(e.currentTarget.getBoundingClientRect()),html:`<span>${esc(title)}</span>`+ic('chevd',18,2)}),arrows()),
    el('div',{style:'margin-top:6px'},modeSeg())));
  const compact=el('div',{class:'cal-compact',id:'cal-compact'},el('div',{class:'cc-in'},
    el('div',{class:'cal-title',style:'min-height:44px'},el('button',{class:'tbtn cc-title','aria-label':`Choose ${mode}`,onclick:e=>pickPeriod(e.currentTarget.getBoundingClientRect()),html:`<span>${esc(miniTitle)}</span>`+ic('chevd',16,2)}),el('span',{style:'display:flex;align-items:center;gap:2px'},pill(),arrows())),
    modeSeg(),mode!=='week'?el('div',{class:'wd-row'},wdLabels().map(l=>el('span',{},l))):null));
  const body=el('div',{class:'page '+(C.anim||''),id:'cal-body'});C.anim=null;
  const fk=mode==='quarter'?`q-${y}-${q}`:mode==='month'?`m-${monthKey(a)}`:`w-${weekKey(a)}`;
  body.append(focusChip(fk,mode==='quarter'?`Q${q+1} FOCUS`:mode==='month'?`${MONL[a.getMonth()].toUpperCase()} FOCUS`:'WEEK FOCUS',mode,calRange(C)));
  if(mode==='quarter')quarterBody(body,y,qM,C);else if(mode==='month')monthBody(body,a,C);else weekBody(body,wS,C);
  onSwipe(body,()=>calStep(1),()=>calStep(-1));
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
  if(!areas.length)return el('button',{class:'focus-chip',onclick:()=>focusSheet(fk,label)},el('span',{style:'display:flex;gap:10px;align-items:center;min-width:0'},el('span',{class:'fl'},label),el('span',{class:'fv clip'},'None yet')),el('span',{class:'fa'},'+ Choose'));
  const steps=allSteps(),inRange=s=>{if(!s.doneAt)return false;const d=k(new Date(s.doneAt));return d>=range[0]&&d<=range[1];};
  return el('div',{class:'bars'},
    el('div',{style:'display:flex;justify-content:space-between;align-items:center'},el('button',{class:'fl eyebrow',style:'font-size:11px',onclick:()=>focusSheet(fk,label)},label+' · Edit'),el('button',{class:'linkbtn small',onclick:()=>{App.state.studio=Object.assign(App.state.studio||{},{mode:mode==='quarter'?'q':mode==='month'?'m':'w',anchor:range[0]});App.go('studio');}},'Plan in Studio ›')),
    areas.map(ar=>{const list=steps.filter(s=>s.parent.kind==='goal'&&s.parent.area===ar),done=list.filter(s=>s.step.d&&inRange(s.step)).length,open=list.filter(s=>!s.step.d).length,tot=done+open;return el('div',{class:'bar-row'},el('span',{class:'clip'},ar),el('span',{class:'bar-track',role:'img','aria-label':`${done} of ${tot} goal steps finished this period`},el('span',{class:'bar-fill',style:`display:block;width:${tot?done/tot*100:0}%`})),el('span',{class:'small muted tnum'},tot?`${done}/${tot}`:'No open steps'));}));
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
function dayMenu(dk,x,y){openMenu(x,y,[{label:'Open in Today',icon:'sun',onclick:()=>{App.state.sel=dk;App.state._fresh=true;App.go('today');}},{label:'Add a task',icon:'task',onclick:()=>taskSheet(null,{date:dk})},{label:'Add a time block',icon:'hour',onclick:()=>blockSheet(null,{date:dk,start:9*60})},{label:'Add an all-day item',icon:'cal',onclick:()=>alldaySheet(null,{start:dk})}]);}
function heatCell(d,{month,tk,C,onTap,bars=false,showSel=true}){
  const dk=k(d),out=month!=null&&d.getMonth()!==month,past=dk<tk;
  if(out)return el('button',{class:'heat out tnum','aria-label':shortDay(dk),onclick:()=>onTap(dk,true)},el('span',{class:'hn'},String(d.getDate())));
  const L=dayLoad(dk),isSel=showSel&&C.sel===dk;
  const unit=get.settings().capacity?.mode==='hours'?'hours':'items';
  const btn=el('button',{class:'heat '+(L.level?'l'+L.level+' ':'')+(past?'past ':'')+(dk===tk?'today ':'')+(isSel?'sel':''),'data-slot':dk,'aria-label':`${shortDay(dk)}, ${Math.round(L.value*10)/10} ${unit}`,'aria-current':dk===tk?'date':null,'aria-pressed':showSel?String(isSel):null,onclick:()=>onTap(dk,false)},el('span',{class:'hn'},String(d.getDate())));
  const adB=L.allDay.filter(e=>!(e.rec&&e.rec.tripId));if(bars&&adB.length)btn.append(el('span',{class:'adbars'},adB.slice(0,2).map(e=>el('i',{style:`--c:${e.color}`}))));
  onPress(btn,(x,y)=>dayMenu(dk,x,y));
  return btn;
}
function weeksOf(y,m){const first=new Date(y,m,1),last=new Date(y,m+1,0),start=weekStartOf(first),out=[];let d=start;while(d<=last){out.push(Array.from({length:7},(_,i)=>addD(d,i)));d=addD(d,7);}return out;}
function heatKey(){return el('div',{class:'heat-key','aria-label':'Heat map key'},el('span',{},'Fewer'),['--h0','--h1','--h2','--h3','--h4'].map(v=>el('i',{style:`background:var(${v})`})),el('span',{},'More'));}
function quarterBody(body,y,months,C){
  const tk=todayK(),curW=weekKey(today()),inQ=months.includes(today().getMonth())&&y===today().getFullYear();
  const earlier=new Set();months.forEach(m=>weeksOf(y,m).forEach(w=>{if(k(w[0])<curW)earlier.add(k(w[0]));}));
  if(inQ&&earlier.size)body.append(el('button',{class:'linkbtn',onclick:()=>{C.showEarlier=!C.showEarlier;App.refresh();}},C.showEarlier?'Hide earlier weeks':`Show ${earlier.size} earlier week${earlier.size>1?'s':''}`,el('span',{html:ic(C.showEarlier?'chevu':'chevd',16,2.2),style:'display:grid'})));
  let firstShown=true;
  months.forEach(m=>{
    let weeks=weeksOf(y,m);
    if(inQ&&!C.showEarlier)weeks=weeks.filter(w=>k(w[0])>=curW);
    if(!weeks.length)return;
    const sec=el('section',{},el('button',{class:'m-head',onclick:()=>{C.mode='month';C.anchor=k(new Date(y,m,1));const t=today();C.sel=(t.getFullYear()===y&&t.getMonth()===m)?tk:k(new Date(y,m,1));calCommit();}},MONL[m],el('span',{html:ic('chevr',16,2),style:'display:grid'})));
    if(firstShown){sec.append(el('div',{class:'wd-row',style:'margin:0 0 8px'},wdLabels().map(l=>el('span',{},l))));firstShown=false;}
    const grid=el('div',{style:'display:grid;gap:6px'});
    weeks.forEach(w=>{const row=el('div',{class:'heat-row'+(k(w[0])===curW?' curwk':'')});w.forEach(d=>row.append(heatCell(d,{month:m,tk,C,showSel:false,onTap:()=>{C.mode='week';C.anchor=k(d);C.sel=k(d);C.weekOpen=k(d);calCommit();}})));tripBand(row,w);grid.append(row);});
    sec.append(grid);body.append(sec);
  });
  body.append(heatKey());
}
function monthBody(body,a,C){
  const tk=todayK(),y=a.getFullYear(),m=a.getMonth(),grid=el('div',{style:'display:grid;gap:6px'});
  weeksOf(y,m).forEach(w=>{const row=el('div',{class:'heat-row'});w.forEach(d=>row.append(heatCell(d,{month:m,tk,C,bars:true,onTap:(dk,out)=>{if(out){C.anim=dk>C.anchor?'slide-l':'slide-r';C.anchor=dk;}C.sel=dk;App.refresh();}})));tripBand(row,w);grid.append(row);});
  body.append(el('div',{class:'wd-row',style:'margin:0 0 -6px'},wdLabels().map(l=>el('span',{},l))),grid,heatKey(),dayPanel(C.sel&&monthKey(fromK(C.sel))===monthKey(a)?C.sel:k(new Date(y,m,1))));
}
function dayLine(e,dk){
  const row=el('div',{class:'dayline tick-host'+(e.done?' done':'')},e.kind==='gcal'?null:el('span',{class:'tick-hit'},tickBtn(e.done,on=>{row.classList.toggle('done',on);toggleItem(e,dk);setTimeout(()=>App.refresh(),820);})),el('span',{class:'tm'},e.time!=null?fmtT(e.time):'Anytime'),el('button',{class:'grow clip',style:'text-align:left;min-height:44px',onclick:()=>openItem(e,dk)},el('span',{class:'tt'},e.title)));
  calGestures(row,e,dk);return row;
}
function allDayChips(allDay,dk){return el('div',{class:'allday-row',style:'margin-top:0'},allDay.map(e=>{const b=el('button',{class:'adchip',style:`--c:${e.color}`,html:(e.icon?glyph(e.icon,16,2):'')+`<span>${esc(e.title)}</span>`,onclick:()=>openItem(e,dk)});calGestures(b,e,dk);return b;}));}
const addChips=dk=>el('div',{class:'chips'},el('button',{class:'chip',onclick:()=>taskSheet(null,{date:dk})},'+ Task'),el('button',{class:'chip',onclick:()=>blockSheet(null,{date:dk,start:9*60})},'+ Time block'),el('button',{class:'chip',onclick:()=>alldaySheet(null,{start:dk})},'+ All-day'));
function weekBody(body,start,C){
  const tk=todayK(),list=el('div',{});
  for(let i=0;i<7;i++){const d=addD(start,i),dk=k(d),{allDay,timed,anytime}=dayItems(dk,{filters:true}),L=dayLoad(dk),items=[...timed,...anytime],past=dk<tk,empty=!items.length&&!allDay.length,open=C.weekOpen===dk;
    const toggle=()=>{C.weekOpen=open?null:dk;C.sel=dk;App.refresh();};
    const main=el('div',{class:'wkitems'}),trW=tripOn(dk);if(trW)main.append(el('button',{class:'dwk',onclick:ev=>{ev.stopPropagation();tripGo(trW);}},`${trW.f.what} · Day ${daysBetween(trW.f.date,dk)+1} of ${tripDays(trW)}`));
    if(open){
      {const adS=allDay.filter(e=>!(e.rec&&e.rec.tripId));if(adS.length)main.append(allDayChips(adS,dk));}
      items.forEach(e=>main.append(dayLine(e,dk)));
      main.append(addChips(dk),el('button',{class:'linkbtn small',style:'justify-self:start',onclick:()=>{App.state.sel=dk;App.state._fresh=true;App.go('today');}},'Open in Today ›'));
    }else{
      {const adS=allDay.filter(e=>!(e.rec&&e.rec.tripId));if(adS.length)main.append(el('span',{style:'display:flex;gap:4px;flex-wrap:wrap'},adS.slice(0,3).map(e=>{const c=el('span',{class:'minichip',style:`--c:${e.color}`},e.title);calGestures(c,e,dk);return c;})));}
      items.slice(0,3).forEach(e=>{const r=el('span',{class:'it'},el('time',{},e.time!=null?fmtT(e.time):'Anytime'),el('span',{},e.title));calGestures(r,e,dk);main.append(r);});
      if(items.length>3)main.append(el('span',{class:'ph'},`+${items.length-3} more`));
      if(empty&&!trW)main.append(el('span',{class:'ph'+(dk===tk?' plan':'')},dk===tk?'Tap to plan':''));
    }
    const r=el('div',{class:'wkrow'+(empty&&!open&&!trW?' slim':'')+(open?' sel open':'')+(trW?' wkaway':''),'data-slot':dk,onclick:ev=>{if(ev.target.closest('button,.dayline,.adchip'))return;toggle();}},
      el('button',{class:'dtile '+(L.level?'l'+L.level+' ':'')+(past?'past ':'')+(dk===tk?'today':''),'aria-label':shortDay(dk),'aria-expanded':String(open),'aria-current':dk===tk?'date':null,onclick:toggle},el('b',{},String(d.getDate())),el('small',{},DOW[d.getDay()].slice(0,3).toUpperCase())),
      main,el('button',{class:'chev'+(open?' open':''),style:'align-self:center;min-width:32px;min-height:44px;place-items:center',tabindex:-1,'aria-hidden':'true',html:ic('chevr',16,2),onclick:toggle}));
    onPress(r,(x,y)=>dayMenu(dk,x,y),'.it,.minichip,.dayline,.adchip,.chip,.linkbtn');
    list.append(r);
  }
  body.append(list);
  const un=get.all('task').filter(t=>!t.date&&isOpenTask(t)).length;
  if(un)body.append(el('button',{class:'focus-chip',onclick:()=>{App.state.studio=Object.assign(App.state.studio||{},{mode:'w',anchor:k(start)});App.go('studio');}},el('span',{class:'small'},`${un} unscheduled task${un>1?'s':''}`),el('span',{class:'fa'},'Plan in Studio ›')));
}
function dayPanel(dk){
  const{allDay,timed,anytime}=dayItems(dk,{filters:true}),items=[...timed,...anytime],tk=todayK(),past=dk<tk;
  const c=el('div',{class:'card',style:'padding:16px 18px'},
    el('div',{style:'display:flex;align-items:baseline;justify-content:space-between;gap:8px'},el('span',{class:'eyebrow',style:'font-size:11px'},shortDay(dk).toUpperCase()+(dk===tk?' · TODAY':'')),el('button',{class:'linkbtn small',onclick:()=>{App.state.sel=dk;App.state._fresh=true;App.go('today');}},'Open in Today ›')),
    el('div',{class:'serif',style:'font-size:26px;line-height:1.2;margin-top:2px'},items.length||allDay.length?`${items.length+allDay.length} planned`:emptyDayHead(dk)));
  if(allDay.length){const a=allDayChips(allDay,dk);a.style.marginTop='10px';c.append(a);}
  if(items.length){const lst=el('div',{style:'margin-top:10px'});items.slice(0,3).forEach(e=>lst.append(dayLine(e,dk)));if(items.length>3)lst.append(el('button',{class:'linkbtn small',onclick:()=>{App.state.sel=dk;App.state._fresh=true;App.go('today');}},`+${items.length-3} more`));c.append(lst);}
  const ch=addChips(dk);ch.style.marginTop='12px';c.append(ch);
  return c;
}
function pickPeriod(anchor){
  const C=calState(),a=fromK(C.anchor),t=today();let inst,vy=a.getFullYear();
  inst=openSheet({anchor,title:C.mode==='quarter'?'Choose quarter':C.mode==='month'?'Choose month':'Choose week',build:body=>{
    const box=el('div',{});
    const pick=d=>{C.anchor=k(d);if(C.mode==='month')C.sel=isCurrentFor('month',d)?todayK():k(d);if(C.mode==='week'){C.sel=k(d);C.weekOpen=null;}inst.close();calCommit();};
    const draw=()=>{box.innerHTML='';
      if(C.mode==='week'){const c=formCtx(()=>{});box.append(el('div',{class:'card'},c.calendar(C.anchor,dk=>{if(dk)pick(fromK(dk));},{range:calRange(C)})));return;}
      box.append(el('div',{style:'display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;font-weight:600'},el('button',{class:'iconbtn green','aria-label':'Previous year',html:ic('chevl',20,2),onclick:()=>{vy--;draw();}}),String(vy),el('button',{class:'iconbtn green','aria-label':'Next year',html:ic('chevr',20,2),onclick:()=>{vy++;draw();}})));
      if(C.mode==='month')box.append(el('div',{class:'pick-grid'},MONL.map((n,i)=>el('button',{class:(vy===a.getFullYear()&&i===a.getMonth()?'on ':'')+(vy===t.getFullYear()&&i===t.getMonth()?'cur':''),onclick:()=>pick(new Date(vy,i,1))},n.slice(0,3)))));
      else box.append(el('div',{class:'pick-grid',style:'grid-template-columns:repeat(2,minmax(0,1fr))'},[0,1,2,3].map(i=>el('button',{class:(vy===a.getFullYear()&&i===quarterOf(a)?'on ':'')+(vy===t.getFullYear()&&i===quarterOf(t)?'cur':''),style:'height:68px',onclick:()=>pick(new Date(vy,i*3,1))},`Q${i+1}`,el('small',{},`${MON[i*3]} – ${MON[i*3+2]}`)))));};
    draw();body.append(box,el('button',{class:'btn quiet block',onclick:()=>{inst.close();calNow();}},'Jump to today'));}});
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
    const ctx=formCtx(()=>draw());const box=el('div',{style:'display:flex;flex-direction:column;gap:12px'});body.append(box);
    draw=()=>{box.innerHTML='';inst.titleEl.textContent=step==='cap'?'Daily capacity':'Filters';$('.l',inst.sheet).textContent=step==='cap'?(opts.capacity?'Close':'Back'):'Reset';
      if(step==='main'){
        const types=el('div',{class:'group'});[['task','task','Tasks and steps'],['block','hour','Time blocks'],['allday','cal','All-day items'],['habit','habit','Habits']].forEach(([id,icon,n])=>types.append(ctx.row(id,icon,n,null,{expand:false,trailing:ctx.sw(f.types[id]!==false,n,on=>{f.types[id]=on;draw();})})));
        box.append(el('div',{class:'sect'},'Show'),types,el('div',{class:'sect'},'Life areas'),el('div',{class:'chips'},[...(s.areas||AREAS),'None'].map(a=>el('button',{class:'chip'+((f.areas||[]).includes(a)?' on':''),'aria-pressed':String((f.areas||[]).includes(a)),onclick:()=>{f.areas=f.areas||[];f.areas.includes(a)?f.areas=f.areas.filter(x=>x!==a):f.areas.push(a);draw();}},a))));
        if(showHeat){const g=el('div',{class:'group'});g.append(ctx.row('dc','grid','Daily capacity',cap.mode==='hours'?`${cap.hours} hours`:`${cap.full} items`,{tap:()=>{step='cap';draw();},expand:false,trailing:el('span',{class:'chev',html:ic('chevr',16,2.2)})}));box.append(el('div',{class:'sect'},'Heat map'),g);}
      }else{
        const full=cap.mode==='hours'?cap.hours:cap.full,unit=cap.mode==='hours'?'h':'';
        const wrap=el('div',{class:'slide-l',style:'display:flex;flex-direction:column;gap:12px'});
        const g=el('div',{class:'group'});
        g.append(ctx.row('m','chart','Measure by',null,{expand:false,trailing:seg([['items','Items'],['hours','Hours']],cap.mode,v=>{cap.mode=v;draw();})}));
        g.append(ctx.row('fl','grid','A full day',null,{expand:false,trailing:el('span',{style:'display:flex;align-items:center;gap:8px'},cap.mode==='hours'?ctx.stepper(cap.hours,2,16,v=>{cap.hours=v;draw();}):ctx.stepper(cap.full,2,20,v=>{cap.full=v;draw();}),cap.mode==='hours'?'hrs':'items')}));
        g.append(ctx.row('lw','sun','Lighter weekends',null,{expand:false,trailing:ctx.sw(cap.lightWeekends,'Lighter weekends',on=>{cap.lightWeekends=on;draw();})}));
        const st=weekStartOf(today());
        const prev=el('div',{class:'heat-row','aria-label':'Preview of this week'},Array.from({length:7},(_,i)=>{const d=addD(st,i),dk=k(d),it=dayItems(dk),v=cap.mode==='hours'?it.timed.reduce((n,e)=>n+(e.dur||30),0)/60:it.timed.length+it.anytime.length,wk=[0,6].includes(d.getDay())&&cap.lightWeekends?.5:1,l=levelOf(v,full*wk);return el('span',{class:'heat '+(l?'l'+l:''),'data-preview':l},el('span',{class:'hn'},String(d.getDate())));}));
        wrap.append(el('p',{class:'muted small'},'How much makes a day look full on the heat map. Nothing changes until you tap Done.'),g,el('div',{class:'sect'},'This week'),prev,
          el('div',{class:'heat-key',style:'justify-content:flex-start;gap:6px 10px'},capLabels(full,unit).map(([v,t])=>el('span',{style:'display:inline-flex;gap:6px;align-items:center'},el('i',{style:`background:var(${v})`}),t))));
        box.append(wrap);
      }
      inst.place&&inst.place();};
    draw();}});
}
