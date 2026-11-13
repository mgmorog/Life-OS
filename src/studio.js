/* ---------- Studio: plan a week, month or quarter. Studio picks the day, Today picks the time ---------- */
function stState(){const S=App.state;if(!S.studio)S.studio={mode:'w',anchor:null,selCard:null,ghosts:[]};if(!S.studio.ghosts)S.studio.ghosts=[];return S.studio;}
function stPeriod(st){
  const t=today(),a=st.anchor?fromK(st.anchor):null;
  if(st.mode==='w'){const base=a?weekStartOf(a):weekStartOf(addD(t,t.getDay()===(get.settings().reviewDay??0)?1:0));const s=base,e=addD(s,6);
    const slots=Array.from({length:7},(_,i)=>{const d=addD(s,i),dk=k(d);return{id:dk,a:DOW[d.getDay()].slice(0,3).toUpperCase(),b:String(d.getDate()),label:shortDay(dk),from:dk,to:dk,past:dk<todayK()};});
    return{key:'w-'+k(s),unit:'day',head:s.getMonth()===e.getMonth()?`${MON[s.getMonth()]} ${s.getDate()}–${e.getDate()}`:`${MON[s.getMonth()]} ${s.getDate()} – ${MON[e.getMonth()]} ${e.getDate()}`,eyebrow:weekKey(t)===k(s)?'This week':weekKey(addD(t,7))===k(s)?'Next week':`${s.getFullYear()} · Week ${isoWeek(s)}`,cap:get.settings().capacity?.full||6,slots,step:d=>k(addD(s,7*d)),commit:'Commit week',doneL:'Week committed',doneS:'Cards wait on each day’s Today page for a time.',hint:'Drag a card onto a day, or tap it then tap a day.'};}
  if(st.mode==='m'){const base=a||(t.getDate()>24?new Date(t.getFullYear(),t.getMonth()+1,1):new Date(t.getFullYear(),t.getMonth(),1));const y=base.getFullYear(),m=base.getMonth();
    const slots=weeksOf(y,m).map(w=>{const from=k(w[0]),to=k(w[6]);return{id:from,a:`${MON[w[0].getMonth()]} ${w[0].getDate()}`,b:`to ${w[0].getMonth()===w[6].getMonth()?w[6].getDate():MON[w[6].getMonth()]+' '+w[6].getDate()}`,label:`${MON[w[0].getMonth()]} ${w[0].getDate()}`,from,to,past:to<todayK(),heat:w.map(d=>dayLoad(k(d),false).level)};});
    return{key:'m-'+monthKey(base),unit:'week',head:MONL[m],eyebrow:monthKey(t)===monthKey(base)?'This month':String(y),cap:9,slots,step:d=>k(new Date(y,m+d,1)),commit:'Commit month',doneL:`${MONL[m]} committed`,doneS:'Each week’s cards wait in Week planning.',hint:'Drag steps and tasks onto a week.'};}
  const base=a||t,y=base.getFullYear(),q=quarterOf(base);
  const slots=[0,1,2].map(i=>{const m=q*3+i,f=new Date(y,m,1),l=new Date(y,m+1,0),from=k(f),to=k(l);return{id:monthKey(f),a:MONL[m],b:'',label:MON[m],from,to,past:to<todayK()};});
  return{key:'q-'+quarterKey(base),unit:'month',head:`Q${q+1} ${y}`,eyebrow:quarterKey(t)===quarterKey(base)?'This quarter':'Quarter',cap:99,slots,step:d=>k(new Date(y,(q+d)*3,1)),commit:'Commit quarter',doneL:`Q${q+1} committed`,doneS:'Each month’s cards wait in Month planning.',hint:'Drag milestones to the month they should land in.'};
}
/* cards come from real records */
function stCards0(st,P){
  const out=[],slotIds=new Set(P.slots.map(s=>s.id));
  const inP=(v)=>v&&slotIds.has(v);
  if(st.mode==='w'){
    (get.settings().studioHabits?get.all('habit'):[]).forEach(h=>{if(h.days&&h.days.length)return;const placed=P.slots.filter(s=>(h.sessions||{})[s.id]).length;const remain=Math.max((h.target||1)-placed,0);out.push({id:'h:'+h.id,type:'habit',rec:h,t:h.title,c:colorHex(h.color),m:fmtDurS(h.dur),q:remain,placedIn:P.slots.filter(s=>(h.sessions||{})[s.id]).map(s=>s.id),src:`${placed} of ${h.target} placed`});});
    get.all('task').forEach(t=>{if(!isOpenTask(t)||(t.repeat&&t.repeat.type!=='never'))return;const inWeek=t.date&&slotIds.has(t.date);const proj=t.part&&get.id(t.part);if(proj&&proj.kind==='project'&&(proj.paused||proj.finished)&&!t.date)return;if(proj&&proj.kind==='project'&&!t.date&&!t.planWeek&&!t.planMonth&&nextProjectTask(proj)!==t)return;const unscheduled=!t.date&&(!t.planWeek||t.planWeek===P.slots[0].id)&&(!t.planMonth||t.planMonth===monthKey(fromK(P.slots[0].id))||t.planMonth===monthKey(fromK(P.slots[6].id)));const late=t.date&&t.date<todayK();if(!inWeek&&!unscheduled&&!late)return;out.push({id:'t:'+t.id,type:'task',rec:t,t:t.title,c:colorHex(proj&&proj.color),m:t.deadline?`Due ${relDay(t.deadline)}`:(proj?proj.title:''),q:inWeek?0:1,placedIn:inWeek?[t.date]:[],tag:late?'Carried over':'',due:t.deadline});});
    allSteps().forEach(({parent,step})=>{if(step.d)return;const inWeek=step.date&&slotIds.has(step.date);const plannedHere=step.planWeek===P.slots[0].id;const next=(parent.steps||[]).find(s=>!s.d)===step&&!step.planWeek&&!step.date;const late=step.date&&step.date<P.slots[0].id;if(!inWeek&&!plannedHere&&!next&&!late)return;out.push({id:'s:'+step.id,type:'step',rec:parent,step,t:step.t,c:colorHex(parent.color),m:parent.title,q:inWeek?0:1,placedIn:inWeek?[step.date]:[],tag:late?'Carried over':'',due:parent.deadline});});
  }else if(st.mode==='m'){
    const mk=P.key.slice(2);
    get.all('task').forEach(t=>{if(!isOpenTask(t)||t.date||(t.repeat&&t.repeat.type!=='never'))return;if(t.planMonth&&t.planMonth!==mk)return;out.push({id:'t:'+t.id,type:'task',rec:t,t:t.title,c:colorHex(),m:t.deadline?`Due ${relDay(t.deadline)}`:'',q:inP(t.planWeek)?0:1,placedIn:inP(t.planWeek)?[t.planWeek]:[],due:t.deadline});});
    allSteps().forEach(({parent,step})=>{if(step.d||step.date)return;if(step.planMonth&&step.planMonth!==mk)return;out.push({id:'s:'+step.id,type:'step',rec:parent,step,t:step.t,c:colorHex(parent.color),m:parent.title,q:inP(step.planWeek)?0:1,placedIn:inP(step.planWeek)?[step.planWeek]:[],due:parent.deadline});});
  }else{
    allSteps().forEach(({parent,step})=>{if(step.d||step.date)return;out.push({id:'s:'+step.id,type:'step',rec:parent,step,t:step.t,c:colorHex(parent.color),m:parent.title,q:inP(step.planMonth)?0:1,placedIn:inP(step.planMonth)?[step.planMonth]:[],due:parent.deadline});});
    get.all('task').forEach(t=>{if(!isOpenTask(t)||t.date||!t.deadline)return;out.push({id:'t:'+t.id,type:'task',rec:t,t:t.title,c:colorHex(),m:`Due ${relDay(t.deadline)}`,q:inP(t.planMonth)?0:1,placedIn:inP(t.planMonth)?[t.planMonth]:[],due:t.deadline});});
  }
  if(st.only&&get.id(st.only)){const scope=new Set([st.only]);const o=get.id(st.only);if(o.kind==='goal')get.all('project').forEach(p=>{if(p.part===o.id)scope.add(p.id);});
    const mine=c=>c.type==='step'?scope.has(c.rec.id):c.type==='task'?scope.has(c.rec.part):c.type==='habit'?scope.has(c.rec.part):false;
    const res=out.filter(mine),slotIds2=new Set(P.slots.map(s=>s.id));
    if(st.mode==='w')get.all('task').forEach(t=>{if(!isOpenTask(t)||!scope.has(t.part)||res.some(c=>c.rec===t)||(t.repeat&&t.repeat.type!=='never'))return;if(t.date&&!slotIds2.has(t.date))return;res.push({id:'t:'+t.id,type:'task',rec:t,t:t.title,c:colorHex(),m:t.deadline?`Due ${relDay(t.deadline)}`:(get.id(t.part)||{}).title||'',q:t.date?0:1,placedIn:t.date?[t.date]:[],due:t.deadline});});
    return res;}
  return out;
}
/* copy last week's habit sessions and one-off time blocks into this week */
function copyLastWeek(P){const tk=todayK(),made=[],sess=[];P.slots.forEach(sl=>{const prev=addK(sl.id,-7);if(sl.id<tk)return;
  get.all('habit').forEach(h=>{if((h.sessions||{})[prev]&&!(h.sessions||{})[sl.id]){h.sessions[sl.id]=clone(h.sessions[prev]);sess.push([h,sl.id]);put(h,{silent:true});}});
  get.all('block').forEach(b=>{if(b.date===prev&&(!b.repeat||b.repeat.type==='never')&&!get.all('block').some(x=>x.date===sl.id&&x.title===b.title)){const c=create('block',Object.assign(clone(b),{id:undefined,date:sl.id,doneDates:{},createdAt:Date.now()}));made.push(c);}});});
  const n=made.length+sess.length;if(!n){toast('Nothing from last week to copy');return;}studioMark();App.refresh();toast(`Copied ${n} item${n>1?'s':''} from last week`,()=>{made.forEach(b=>remove(b.id,{hard:true,silent:true}));sess.forEach(([h,d])=>{delete h.sessions[d];put(h,{silent:true});});App.refresh();});}
function placeCard(card,slotId,st){
  if(card.type==='habit'){const h=card.rec;h.sessions=h.sessions||{};h.sessions[slotId]=h.sessions[slotId]||{time:null};put(h,{silent:true});}
  else if(card.type==='task'){const t=card.rec;if(st.mode==='w'){t.date=slotId;t.planWeek=null;}else if(st.mode==='m')t.planWeek=slotId;else t.planMonth=slotId;put(t,{silent:true});}
  else{const s=card.step;if(st.mode==='w'){s.date=slotId;}else if(st.mode==='m')s.planWeek=slotId;else s.planMonth=slotId;put(card.rec,{silent:true});}
}
function unplaceCard(card,slotId,st){
  if(card.type==='habit'){delete card.rec.sessions[slotId];put(card.rec,{silent:true});}
  else if(card.type==='task'){const t=card.rec;if(st.mode==='w'){t.date=null;t.time=null;}else if(st.mode==='m')t.planWeek=null;else t.planMonth=null;put(t,{silent:true});}
  else{const s=card.step;if(st.mode==='w'){s.date=null;s.time=null;}else if(st.mode==='m')s.planWeek=null;else s.planMonth=null;put(card.rec,{silent:true});}
}
function slotLoad(s,st,cards){
  let n=0;if(st.mode==='w'){const d=dayItems(s.id);n=d.timed.length+d.anytime.length;}
  else{let dk=s.from;while(dk<=s.to){const d=dayItems(dk);n+=d.timed.length+d.anytime.length;dk=addK(dk,1);}cards.forEach(c=>{if(c.placedIn.includes(s.id))n++;});}
  return n;
}
/* Suggest: usual days first, habits spaced out, nothing past a due date, lightest slots win */
function freeMinutes(dk){const s=get.settings(),d=fromK(dk),isWork=(s.workDays||[]).includes(monIdx(d)),w=s.work||{start:540,end:1020};let awake=[[420,1320]];
  if(isWork){awake=s.protectEvenings?[[420,w.start]]:[[420,w.start],[w.end,1320]];}
  let free=awake.reduce((n,[a,b])=>n+Math.max(0,b-a),0);dayItems(dk).timed.forEach(e=>{awake.forEach(([a,b])=>{const o=Math.max(0,Math.min(b,e.time+(e.dur||30))-Math.max(a,e.time));free-=o;});});return Math.max(0,free);}
function suggest(cards,P,st,jit=null){
  const load=new Map(P.slots.map(s=>[s.id,slotLoad(s,st,cards)])),open=P.slots.filter(s=>!s.past&&!(st.mode==='w'&&tripBlocked(s.id))),out=[];if(jit)open.forEach(s=>load.set(s.id,load.get(s.id)+jit(s.id)));
  if(!open.length)return out;
  const order=cards.filter(c=>c.q>0).sort((a,b)=>(b.due?1:0)-(a.due?1:0)||(b.q-a.q));
  order.forEach(c=>{
    let cand=open.filter(s=>!c.placedIn.includes(s.id));
    if(c.due)cand=cand.filter(s=>s.from<=c.due).concat(cand.length?[]:[]);
    if(!cand.length)cand=open;
    const roomy=cand.filter(s=>load.get(s.id)<P.cap);if(roomy.length)cand=roomy;
    if(c.type==='habit'){
      const lastWeek=habitPattern(c.rec,P);const n=c.q;let picks=[];
      lastWeek.forEach(i=>{const s=open.find(x=>monIdx(fromK(x.id))===i&&!c.placedIn.includes(x.id));if(s&&picks.length<n&&!picks.includes(s))picks.push(s);});
      const gap=Math.max(1,Math.floor(cand.length/Math.max(n,1)));let i=Math.floor(gap/2)+(jit?jit.n:0);
      while(picks.length<n&&i<cand.length*2){const s=cand[i%cand.length];if(!picks.includes(s))picks.push(s);i+=gap;}
      picks.forEach(s=>{out.push({card:c,slot:s.id,why:lastWeek.length?'Matches your usual days':'Spaced out across the week'});load.set(s.id,load.get(s.id)+1);});
    }else{
      const fr=x=>st.mode==='w'?freeMinutes(x.id):0,need=st.mode==='w'&&c.type==='task'?(planMin(c.rec)||0):0,fits=x=>need&&fr(x)>=need?1:0;const s=cand.slice().sort((a,b)=>fits(b)-fits(a)||load.get(a.id)-load.get(b.id)||fr(b)-fr(a)||(a.from<b.from?-1:1))[0];
      out.push({card:c,slot:s.id,why:c.due?`Lands before ${relDay(c.due)}`:st.mode==='w'?`${fmtDurS(fr(s))} free outside work`:`Lightest ${P.unit} with room`});load.set(s.id,load.get(s.id)+1);
    }
  });
  return out;
}
function habitPattern(h,P){const s=P.slots[0].id;const out=[];for(let i=-7;i<0;i++){const dk=addK(s,i);if((h.sessions||{})[dk]||(h.logs||{})[dk])out.push(monIdx(fromK(dk)));}return out;}
function repeatLast(P,st,cards){const made=[];cards.filter(c=>c.type==='habit').forEach(c=>{habitPattern(c.rec,P).forEach(i=>{const s=P.slots.find(x=>monIdx(fromK(x.id))===i&&!x.past);if(s&&!c.placedIn.includes(s.id))made.push({card:c,slot:s.id,why:'Same day as last week'});});});return made;}
function viewStudio(root){
  const st=stState(),P=stPeriod(st);const cards=stCards(st,P);
  const planRec=get.id('plan-'+P.key);const committed=planRec&&planRec.committed;
  const page=el('div',{class:'page studio-w'});
  const go=d=>{st.anchor=P.step(d);st.selCard=null;st.ghosts=[];App.refresh();};
  page.append(el('header',{},
    el('div',{class:'cal-eyebrow'},el('span',{class:'eyebrow'},`Studio · ${P.eyebrow}`),committed?el('span',{class:'pill-today'},'Committed'):null),
    el('div',{class:'cal-title'},el('h1',{class:'serif',style:'font-size:36px;line-height:1.05;letter-spacing:-.01em'},P.head),el('div',{class:'arrows'},el('button',{class:'iconbtn green','aria-label':'Previous','html':ic('chevl',20,2),onclick:()=>go(-1)}),el('button',{class:'iconbtn green','aria-label':'Next',html:ic('chevr',20,2),onclick:()=>go(1)}))),
    el('div',{style:'margin-top:6px'},seg([['q','Quarter'],['m','Month'],['w','Week']],st.mode,v=>{st.mode=v;st.anchor=null;st.selCard=null;st.ghosts=[];App.refresh();}))));
  const s=get.settings();
  if(st.mode==='w'&&today().getDay()===(s.reviewDay??0)&&s.checkinDone!==todayK())page.append(el('button',{class:'focus-chip',onclick:()=>checkinSheet(P,st,cards)},el('span',{style:'display:flex;gap:10px;align-items:center'},el('span',{class:'fl'},'CHECK-IN'),el('span',{class:'fv'},'Plan the week ahead')),el('span',{class:'fa'},'Start')));
  const fk=st.mode==='q'?P.key.replace('q-','q-').replace(/^q-(\d+)-Q(\d)/,(m,y,q)=>`q-${y}-${q-1}`):P.key;
  page.append(focusChip(fk,st.mode==='q'?`${P.head.split(' ')[0]} FOCUS`:st.mode==='m'?`${P.head.toUpperCase()} FOCUS`:'WEEK FOCUS',st.mode==='q'?'quarter':st.mode==='m'?'month':'week',st.mode==='m'?[`${P.key.slice(2)}-01`,k(new Date(+P.key.slice(2,6),+P.key.slice(7),0))]:[P.slots[0].from,P.slots[P.slots.length-1].to]));
  if(st.only){const o=get.id(st.only);if(!o)st.only=null;else page.append(el('div',{class:'focus-chip'},el('span',{class:'grow small',style:'text-align:left'},`Showing ${o.title} only`),el('button',{class:'fa',onclick:()=>{st.only=null;App.refresh();}},'Show all')));}
  if(st.mode==='w'&&!st.only&&!P.slots.every(s=>s.past)&&P.slots.some(sl=>{const pv=addK(sl.id,-7);return get.all('habit').some(h=>(h.sessions||{})[pv])||get.all('block').some(b=>b.date===pv&&(!b.repeat||b.repeat.type==='never'));}))page.append(el('button',{class:'linkbtn small',style:'align-self:flex-start;min-height:40px',onclick:()=>copyLastWeek(P)},'Copy last week’s plan'));
  studioExtras(page,st,P);
  const dockCards=cards.filter(c=>c.q>0&&!st.ghosts.some(g=>g.card.id===c.id&&(c.type!=='habit'||st.ghosts.filter(x=>x.card.id===c.id).length>=c.q)));
  const left=dockCards.reduce((n,c)=>n+c.q,0);
  if(st.mode==='w'&&!P.slots.every(s=>s.past))page.append(el('button',{class:'otidy',onclick:()=>App.go('planweek',{anchor:P.slots[0].id})},el('span',{class:'oric',html:ic('spark',20)}),el('span',{class:'grow'},el('b',{},'Plan my week'),el('small',{},'See a full plan, then change or keep it')),el('span',{class:'chev',html:ic('chevr',16,2)})));
  // dock
  const dockHead=el('div',{style:'display:flex;align-items:center;justify-content:space-between;gap:8px;flex-wrap:wrap'},
    el('span',{},el('b',{class:'serif',style:'font-size:22px'},'To plan'),el('span',{class:'muted small',style:'margin-left:8px'},left?`${left} left`:'')),
    el('span',{style:'display:flex;gap:6px'},
      st.ghosts.length?[el('button',{class:'chip sm',style:'height:32px',onclick:()=>{st.ghosts=[];App.refresh();}},'Clear'),el('button',{class:'chip on',style:'height:32px',onclick:()=>{const n=st.ghosts.length;const made=st.ghosts;made.forEach(g=>placeCard(g.card,g.slot,st));st.ghosts=[];App.refresh();toast(`${n} placed`,()=>{made.forEach(g=>unplaceCard(g.card,g.slot,st));App.refresh();});}},'Keep all')]:
      left&&get.settings().suggestOn?el('button',{class:'chip',style:'height:32px',onclick:()=>{arcMark();st.ghosts=suggest(cards,P,st);if(!st.ghosts.length)toast(`No open ${P.unit}s left to fill`);App.refresh();}},el('span',{style:'display:grid',html:ic('spark',15,2)}),'Suggest'):null,
      el('button',{class:'chip',style:'height:32px','aria-label':'New card',onclick:()=>newCardSheet(st,P)},'+ New')));
  const dock=el('div',{class:'dock',id:'st-dock','data-rail':'1'});
  dockCards.forEach(c=>dock.append(cardEl(c,st,P)));
  if(!dockCards.length&&!st.ghosts.length)dock.append(el('div',{class:'muted small',style:'padding:10px 0'},cards.length?'Everything has a place.':st.mode==='w'?'Add habits, tasks, goals or projects and they will show up here.':'Add goal or project steps and they will show up here.'));
  const dockW=el('div',{class:'dockwrap'},dockHead,el('div',{class:'small muted',style:'margin-top:2px'},st.selCard?`Now tap the ${P.unit} for “${(cards.find(c=>c.id===st.selCard)||{}).t||''}”.`:P.hint),dock);
  // slots
  const slots=el('div',{class:'slots'});
  P.slots.forEach(sl=>slots.append(slotEl(sl,st,P,cards)));
  page.append(el('div',{class:'studio-cols'},dockW,slots));
  studioBudget(page,st,P);
  root.append(page);
  // commit bar
  const placedN=cards.reduce((n,c)=>n+c.placedIn.length,0),total=placedN+left;
  document.body.classList.add('has-commit');
  $('#commitbar').hidden=false;
  const cb=$('#commitbar');cb.innerHTML='';
  cb.append(el('div',{class:'in'},committed?el('span',{class:'grow'},el('b',{style:'display:block;font-weight:600'},P.doneL),el('span',{class:'small muted'},P.doneS)):el('span',{class:'small muted'},total?`${placedN} of ${total} placed`:'Nothing to place yet'),
    committed?el('button',{class:'btn quiet',onclick:()=>{planRec.committed=false;put(planRec);}},'Replan'):el('button',{class:'btn primary',onclick:()=>reviewSheet(P,st,cards)},P.commit)));
}
function cardEl(c,st,P){
  const n=el('div',{class:'scard'+(st.selCard===c.id?' sel':''),'data-cid':c.id,style:`--c:${c.c}`,role:'button',tabindex:0,'aria-label':`${c.t}. Select, then choose a ${P.unit}.`,onclick:()=>{st.selCard=st.selCard===c.id?null:c.id;App.refresh();},onkeydown:e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();st.selCard=st.selCard===c.id?null:c.id;App.refresh();}}},
    el('span',{class:'k'},({habit:'HABIT',task:'TASK',step:'STEP'})[c.type]),el('span',{class:'n'},c.t),c.m||c.src||c.tag?el('span',{class:'m'},[c.tag,c.m,c.type==='habit'?c.src:''].filter(Boolean).join(' · ')):null,c.q>1?el('span',{class:'q'},`×${c.q}`):null);
  draggable(n,{label:c.t,pull:true,move:(x,y)=>hoverSlot(x,y),drop:(x,y)=>{const id=hoverSlot(x,y);clearHover();if(id&&id!=='rail'){const sl=P.slots.find(s=>s.id===id);doPlace(c,id,st,P,sl);}}});
  return n;
}
function doPlace(c,id,st,P,sl){
  if(sl&&sl.past){toast('That day has passed');return;}
  App.state._studioPop={id,title:c&&(c.title||(c.rec&&c.rec.title))};
  if(c.placedIn.includes(id)&&c.type==='habit'){toast('Already placed there');return;}
  placeCard(c,id,st);st.selCard=null;st.ghosts=st.ghosts.filter(g=>g.card.id!==c.id||c.type==='habit'&&g.slot!==id);buzz(6);App.refresh();
  const late=c.due&&sl&&sl.from>c.due;
  toast(late?`Heads up: that’s after it’s due (${relDay(c.due)})`:`Placed ${P.unit==='day'?'on':'in'} ${sl?sl.label:id}`,()=>{unplaceCard(c,id,st);App.refresh();});
}
function hoverSlot(x,y){const h=document.elementFromPoint(x,y);clearHover();if(!h||!h.closest)return null;const s=h.closest('[data-slot]');if(s){s.classList.add('over');return s.getAttribute('data-slot');}if(h.closest('[data-rail]'))return 'rail';return null;}
function clearHover(){$$('.slot.over').forEach(n=>n.classList.remove('over'));}
function slotEl(sl,st,P,cards){
  const selC=st.selCard&&cards.find(c=>c.id===st.selCard);
  const loadN=slotLoad(sl,st,cards),pct=Math.min(100,loadN/P.cap*100);
  const node=el('section',{class:'slot'+(selC&&!sl.past?' can':'')+(sl.past?' past':''),'data-slot':sl.id,onclick:e=>{if(selC&&!e.target.closest('button,.pl')){doPlace(selC,sl.id,st,P,sl);}}},
    el('div',{class:'slot-h'},el('span',{class:'d'},el('b',{},sl.a),sl.b?el('small',{},sl.b):null),
      P.cap<99?el('span',{class:'load'+(loadN>=P.cap?' full':''),role:'img','aria-label':`${loadN} planned`},el('i',{style:`width:${pct}%`})):el('span',{class:'small muted tnum'},`${loadN} planned`),
      sl.past?null:selC&&!sl.past?el('button',{class:'chip on',style:'height:32px',onclick:()=>doPlace(selC,sl.id,st,P,sl)},'Place here'):el('button',{class:'iconbtn green',style:'width:36px;height:36px','aria-label':`Add a commitment to ${sl.label}`,html:ic('plus',18,2),onclick:()=>commitmentSheet(sl,st)})));
  const items=el('div',{class:'slot-items'});
  // fixed items
  if(st.mode==='w'){const d=dayItems(sl.id);
    d.allDay.forEach(e=>items.append(el('button',{class:'fx',onclick:()=>openItem(e,sl.id)},el('time',{},e.rec&&e.rec.tripId?'Away':'All day'),el('span',{},e.title))));
    d.timed.filter(e=>e.kind==='block'||(e.kind==='gcal'&&get.settings().calendar.busy)).forEach(e=>items.append(el('button',{class:'fx',onclick:()=>openItem(e,sl.id)},el('time',{},fmtS(e.time)),el('span',{},e.title))));
    get.all('task').filter(t=>t.deadline===sl.id&&isOpenTask(t)).forEach(t=>items.append(el('button',{class:'fx',onclick:()=>taskSheet(t)},el('time',{style:'color:var(--now)'},'Due'),el('span',{},t.title))));
    // recurring habits/tasks that sit here on their own
    d.anytime.concat(d.timed).filter(e=>(e.kind==='task'&&e.rec.repeat&&e.rec.repeat.type!=='never')||(e.kind==='habit'&&e.rec.days&&e.rec.days.length)||e.kind==='routine').forEach(e=>items.append(el('button',{class:'fx',onclick:()=>openItem(e,sl.id)},el('time',{},'Repeat'),el('span',{},e.title))));
  }else if(st.mode==='m'&&sl.heat){items.append(el('div',{style:'display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:4px','aria-hidden':'true'},sl.heat.map(l=>el('i',{style:`display:block;height:8px;border-radius:2px;background:var(--h${l})`}))));}
  // placed cards
  cards.filter(c=>c.placedIn.includes(sl.id)).forEach(c=>{
    const n=el('div',{class:'pl',style:`--c:${c.c}`,role:'button',tabindex:0,onclick:()=>placedSheet(c,sl,st,P)},el('span',{class:'clip grow'},c.t),c.type==='habit'&&c.rec.dur?el('small',{},fmtDurS(c.rec.dur)):c.m?el('small',{class:'clip',style:'max-width:45%'},c.m):null);
    draggable(n,{label:c.t,move:(x,y)=>hoverSlot(x,y),drop:(x,y)=>{const id=hoverSlot(x,y);clearHover();if(!id||id===sl.id)return;if(id==='rail'){unplaceCard(c,sl.id,st);App.refresh();toast('Back in To plan',()=>{placeCard(c,sl.id,st);App.refresh();});return;}const to=P.slots.find(s=>s.id===id);if(to&&to.past){toast('That day has passed');return;}unplaceCard(c,sl.id,st);placeCard(c,id,st);App.refresh();toast(`Moved to ${to.label}`);}});
    items.append(n);
  });
  st.ghosts.filter(g=>g.slot===sl.id).forEach(g=>items.append(el('button',{class:'pl ghosted','data-gid':g.card.id,style:`--c:${g.card.c}`,title:g.why,onclick:()=>toast(g.why)},el('span',{class:'clip grow'},g.card.t),el('small',{},'Suggested'))));
  if(!items.children.length)items.append(el('div',{class:'small',style:'color:var(--ink-3);padding:2px 0 4px'},sl.past?'Passed':'Open'));
  node.append(items);
  return node;
}
function commitmentSheet(sl,st){
  const dk=sl.from;
  const inst=openSheet({title:'Add a commitment',build:body=>{body.append(el('p',{class:'muted'},`Something fixed on ${st.mode==='w'?sl.label:'or around '+sl.label}. Plans work around it.`),el('div',{class:'list'},
    el('button',{class:'li',onclick:()=>{inst.close();blockSheet(null,{date:dk,start:9*60});}},el('span',{class:'sq',html:ic('hour',20)}),el('span',{class:'grow'},el('b',{},'Time block'),el('small',{},'A meeting, appointment or fixed time'))),
    el('button',{class:'li',onclick:()=>{inst.close();alldaySheet(null,{start:dk});}},el('span',{class:'sq',html:ic('cal',20)}),el('span',{class:'grow'},el('b',{},'All-day item'),el('small',{},'A birthday, trip or day off'))),
    el('button',{class:'li',onclick:()=>{inst.close();taskSheet(null,{date:dk});}},el('span',{class:'sq',html:ic('task',20)}),el('span',{class:'grow'},el('b',{},'Task'),el('small',{},'Something that needs doing that day')))));}});
}
function newCardSheet(st,P){
  if(st.mode==='w'){const inst=openSheet({title:'New card',build:body=>{body.append(el('div',{class:'list'},
    el('button',{class:'li',onclick:()=>{inst.close();taskSheet(null,{date:null,planWeek:P.slots[0].id});}},el('span',{class:'sq',html:ic('task',20)}),el('span',{class:'grow'},el('b',{},'Task'),el('small',{},'One action to finish'))),
    el('button',{class:'li',onclick:()=>{inst.close();habitSheet(null);}},el('span',{class:'sq',html:ic('habit',20)}),el('span',{class:'grow'},el('b',{},'Habit'),el('small',{},'Something you repeat each week'))),
    el('button',{class:'li',onclick:()=>{inst.close();goalSheet(null);}},el('span',{class:'sq',html:ic('target',20)}),el('span',{class:'grow'},el('b',{},'Goal'),el('small',{},'An outcome with steps'))),
    el('button',{class:'li',onclick:()=>{inst.close();projectSheet(null);}},el('span',{class:'sq',html:ic('project',20)}),el('span',{class:'grow'},el('b',{},'Project'),el('small',{},'A bigger effort with steps')))));}});}
  else{const inst=openSheet({title:'New card',build:body=>{body.append(el('div',{class:'list'},
    el('button',{class:'li',onclick:()=>{inst.close();goalSheet(null);}},el('span',{class:'sq',html:ic('target',20)}),el('span',{class:'grow'},el('b',{},'Goal'),el('small',{},'An outcome with steps'))),
    el('button',{class:'li',onclick:()=>{inst.close();projectSheet(null);}},el('span',{class:'sq',html:ic('project',20)}),el('span',{class:'grow'},el('b',{},'Project'),el('small',{},'A bigger effort with steps'))),
    el('button',{class:'li',onclick:()=>{inst.close();taskSheet(null,{date:null,deadline:P.slots[P.slots.length-1].to});}},el('span',{class:'sq',html:ic('task',20)}),el('span',{class:'grow'},el('b',{},'Task with a deadline'),el('small',{},'Something due this period')))));}});}
}
function placedSheet(c,sl,st,P){
  const inst=openSheet({title:c.t,build:body=>{
    const ctx=formCtx(()=>{});
    const moves=P.slots.filter(s=>!s.past&&s.id!==sl.id);
    body.append(el('div',{class:'sect'},'Move to'),el('div',{class:'chips'},moves.map(s=>el('button',{class:'chip',onclick:()=>{unplaceCard(c,sl.id,st);placeCard(c,s.id,st);inst.close();toast(`Moved to ${s.label}`);}},s.label))),
      el('p',{class:'small muted'},`Tip: you can also drag it straight to another ${P.unit}.`));
    if(st.mode==='w'){const seT=c.type==='habit'?(c.rec.sessions[sl.id]||{}).time:c.type==='task'?c.rec.time:c.step.time;
      body.append(el('div',{class:'sect'},'Time (optional)'),el('p',{class:'small muted'},'Leave it blank and it waits at the top of that day’s Today page, ready to drag onto a time.'),
        el('button',{class:'btn line block',onclick:()=>{inst.close();const e=dayItems(sl.id);const it=[...e.timed,...e.anytime].find(x=>x.id===(c.type==='step'?c.step.id:c.rec.id));App.state.sel=sl.id;App.state._fresh=true;App.go('today');}},seT!=null?`Set for ${fmtT(seT)}. Open in Today`:'Open that day in Today'));}
    body.append(el('button',{class:'btn quiet block',onclick:()=>{unplaceCard(c,sl.id,st);inst.close();toast('Back in To plan',()=>{placeCard(c,sl.id,st);App.refresh();});}},'Back to To plan'),
      el('button',{class:'btn text',onclick:()=>{inst.close();if(c.type==='habit')App.go('habit',{id:c.rec.id});else if(c.type==='task')taskSheet(c.rec);else App.go('plan',{id:c.rec.id});}},`Edit ${({habit:'habit',task:'task',step:c.rec.kind})[c.type]}`));
  }});
}
function reviewSheet(P,st,cards){
  const unplaced=cards.filter(c=>c.q>0),placedN=cards.reduce((n,c)=>n+c.placedIn.length,0);
  let fixed=0;P.slots.forEach(s=>{let dk=s.from;while(dk<=s.to){const d=dayItems(dk);fixed+=d.allDay.length+d.timed.filter(e=>e.kind==='block').length;dk=addK(dk,1);}});
  const busy=P.slots.filter(s=>slotLoad(s,st,cards)>=P.cap).length;
  const late=cards.filter(c=>c.due&&c.placedIn.some(id=>{const s=P.slots.find(x=>x.id===id);return s&&s.from>c.due;})).length;
  const inst=openSheet({title:`Review ${P.head}`,build:body=>{
    body.append(el('div',{class:'stat3'},el('div',{},el('b',{},String(placedN)),el('small',{},'planned')),el('div',{},el('b',{},String(fixed)),el('small',{},'commitments')),el('div',{},el('b',{},String(P.slots.filter(s=>!slotLoad(s,st,cards)).length)),el('small',{},`open ${P.unit}s`))));
    if(busy)body.append(el('p',{class:'small',style:'color:var(--now)'},`${busy} ${P.unit}${busy>1?'s are':' is'} over your capacity.`));
    if(late)body.append(el('p',{class:'small',style:'color:var(--now)'},`${late} card${late>1?'s land':' lands'} after the due date.`));
    if(unplaced.length){body.append(el('div',{class:'sect'},`Not placed · ${unplaced.length}`));body.append(el('div',{class:'list'},unplaced.map(c=>el('div',{class:'li',style:'min-height:52px'},el('span',{class:'grow'},el('b',{style:'font-weight:500'},c.t),el('small',{},c.type==='habit'?'Sessions left this week':'Stays in To plan'))))));}
    body.append(el('button',{class:'btn primary block',onclick:()=>{const r=get.id('plan-'+P.key)||{id:'plan-'+P.key,kind:'plan',key:P.key};r.committed=true;r.committedAt=Date.now();put(r);if(st.mode==='w')setSettings({checkinDone:todayK()});inst.close();buzz(12);toast(P.doneL);}},P.commit),el('button',{class:'btn quiet block',onclick:()=>inst.close()},'Keep planning'));
  }});
}
function checkinSheet(P,st,cards){
  const made=repeatLast(P,st,cards);const late=cards.filter(c=>c.tag==='Carried over');
  const inst=openSheet({title:'Sunday check-in',build:body=>{
    body.append(
      el('div',{class:'cistep'},el('i',{},'1'),el('div',{},el('b',{},'Repeat last week’s rhythm'),el('p',{class:'small muted',style:'margin-top:2px'},made.length?made.map(m=>`${m.card.t} on ${m.slot&&DOW[fromK(m.slot).getDay()].slice(0,3)}`).join(', '):'No habit pattern from last week yet.'),made.length?el('button',{class:'btn line',style:'margin-top:8px',onclick:()=>{inst.close();studioMark();made.forEach(g=>placeCard(g.card,g.slot,st));App.refresh();toast(`${made.length} placed`);}},'Repeat it'):null)),
      el('div',{class:'cistep'},el('i',{},'2'),el('div',{},el('b',{},'Check what carried over'),el('p',{class:'small muted',style:'margin-top:2px'},late.length?late.map(c=>c.t).join(', '):'Nothing carried over.'))),
      el('div',{class:'cistep'},el('i',{},'3'),el('div',{},el('b',{},'Fill the rest'),el('p',{class:'small muted',style:'margin-top:2px'},'Suggest uses your usual days, spaces habits out, skips full days and lands things before they’re due.'),el('button',{class:'btn line',style:'margin-top:8px',onclick:()=>{arcMark();const c2=stCards(st,P);st.ghosts=suggest(c2,P,st);inst.close();App.refresh();}},'Suggest the rest'))),
      el('button',{class:'btn primary block',onclick:()=>{setSettings({checkinDone:todayK()});inst.close();}},'Go to my week'));
  }});
}
