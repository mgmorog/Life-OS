/* ---------- Studio: plan a week, month or quarter. Studio picks the day, Today picks the time ---------- */
function stState(){const S=App.state;if(!S.studio)S.studio={mode:'w',anchor:null,selCard:null,ghosts:[]};if(!S.studio.ghosts)S.studio.ghosts=[];return S.studio;}
function stPeriod(st){
  const t=today(),a=st.anchor?fromK(st.anchor):null;
  if(st.mode==='w'){const base=a?weekStartOf(a):weekStartOf(addD(t,t.getDay()===(get.settings().reviewDay??0)?1:0));const s=base,e=addD(s,6);
    const slots=Array.from({length:7},(_,i)=>{const d=addD(s,i),dk=k(d);return{id:dk,a:DOW[d.getDay()].slice(0,3).toUpperCase(),b:String(d.getDate()),label:shortDay(dk),from:dk,to:dk,past:dk<todayK()};});
    return{key:'w-'+k(s),unit:'day',head:s.getMonth()===e.getMonth()?`${mdS(s)}–${e.getDate()}`:`${mdS(s)} – ${mdS(e)}`,eyebrow:weekKey(t)===k(s)?'This week':weekKey(addD(t,7))===k(s)?'Next week':`${s.getFullYear()} · Week ${isoWeek(s)}`,cap:get.settings().capacity?.full||6,slots,step:d=>k(addD(s,7*d)),commit:'Commit week',doneL:'Week committed',doneS:'Cards wait on each day’s Today page for a time.',hint:'Drag a card onto a day, or tap it then tap a day.'};}
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
    (get.settings().studioHabits?get.all('habit'):[]).forEach(h=>{if(h.days&&h.days.length)return;const placed=P.slots.filter(s=>(h.sessions||{})[s.id]).length;const remain=Math.max((h.target||1)-placed,0);out.push({id:'h:'+h.id,type:'habit',rec:h,t:h.title,c:colorHex(h.color),m:fmtDurS(h.dur),q:remain,placedIn:P.slots.filter(s=>(h.sessions||{})[s.id]).map(s=>s.id),src:`${placed} of ${h.target} this week`});});
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
/* free time on a day: waking hours minus every shift (and, with Protect evenings, the time after the last shift);
   a flexible job with no hours yet counts as half the day so Studio doesn't plan on it either way */
function freeMinutes(dk){const s=get.settings(),sh=shiftsOn(dk);let awake=[[420,1320]];
  const cut=(a,b)=>{awake=awake.flatMap(([x,y])=>b<=x||a>=y?[[x,y]]:[[x,Math.max(x,a)],[Math.min(y,b),y]]).filter(([x,y])=>y>x);};
  sh.forEach(x=>{if(x.end>x.start)cut(x.start,x.end);else cut(x.start,1440);});
  if(s.protectEvenings&&sh.some(x=>!x.carry)){const last=Math.max(...sh.filter(x=>!x.carry).map(x=>x.end>x.start?x.end:1440));cut(last,1440);}
  let free=awake.reduce((n,[a,b])=>n+Math.max(0,b-a),0);if(sh.unknown)free=Math.round(free/2);dayItems(dk).timed.forEach(e=>{awake.forEach(([a,b])=>{const o=Math.max(0,Math.min(b,e.time+(e.dur||30))-Math.max(a,e.time));free-=o;});});return Math.max(0,free);}
function suggest(cards,P,st,jit=null){
  const load=new Map(P.slots.map(s=>[s.id,slotLoad(s,st,cards)])),open=P.slots.filter(s=>!s.past&&!(st.mode==='w'&&tripBlocked(s.id))),out=[];if(jit)open.forEach(s=>load.set(s.id,load.get(s.id)+jit(s.id)));
  if(!open.length)return out;
  const order=cards.filter(c=>c.q>0).sort((a,b)=>(b.due?1:0)-(a.due?1:0)||(b.q-a.q));
  order.forEach(c=>{
    let cand=open.filter(s=>!c.placedIn.includes(s.id));
    if(c.due)cand=cand.filter(s=>s.from<=c.due).concat(cand.length?[]:[]);
    if(!cand.length){if(c.type==='habit')return;cand=open;}
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
/* ---------- Studio (v213): what needs a day, then the week. Tap a card, tap a day. ---------- */
/* why a card is on the list, best first; anything else waits in the backlog */
function stRank(c,P,st){const end=P.slots[P.slots.length-1].to;
  if(c.tag==='Carried over')return[0,'Carried over'];
  if(c.due&&c.due<=addK(end,st.mode==='w'?7:14))return[1,c.due<todayK()?'Overdue':`Due ${relDay(c.due)}`];
  if(c.type==='task'&&c.rec.priority==='high')return[2,'High priority'];
  if(c.type==='task'&&(c.rec.planWeek===P.slots[0].id||(st.mode!=='w'&&c.rec.planMonth===P.key.slice(2))))return[3,`For this ${st.mode==='w'?'week':'month'}`];
  if(c.type==='habit')return[(+c.rec.target||1)>=7?99:6,''];
  if(c.type==='step')return[4,'Next step'];
  return[9,''];}
function stArea(c){const r=c.rec;if(!r)return null;if(c.type==='task')return areaOfTask(r);if(r.area)return r.area;const p=r.part&&get.id(r.part);return p&&(p.area||(p.part&&(get.id(p.part)||{}).area))||null;}
function stAi(c){return el('span',{class:'stai','aria-hidden':'true',html:ic(areaIcon(stArea(c)),14,2)});}
function stOpen(c){if(c.type==='habit')App.go('habit',{id:c.rec.id});else if(c.type==='task')taskSheet(c.rec);else App.go('plan',{id:c.rec.id});}
function stFreeBar(dk,over,frac){const f=frac!=null?frac:freeMinutes(dk)/900;return el('span',{class:'stbar'+(over?' over':''),'aria-hidden':'true'},el('i',{style:`width:${Math.max(over?100:0,Math.min(100,f*100)).toFixed(0)}%`}));}
/* Fill my week: tasks and goal steps only, two a slot at most, freest slots first, before any due date */
function fillFew(list,P,st){const open=P.slots.filter(x=>!x.past&&!(st.mode==='w'&&tripBlocked(x.id)));const used=new Map(),out=[];
  const fr=x=>st.mode==='w'?freeMinutes(x.id):-(slotLoad(x,st,[])||0);
  list.forEach(c=>{let cand=open.filter(x=>(used.get(x.id)||0)<2&&!c.placedIn.includes(x.id));const before=c.due?cand.filter(x=>x.from<=c.due):cand;if(before.length)cand=before;if(!cand.length)return;
    const x=cand.slice().sort((a,b)=>fr(b)-fr(a)||(a.from<b.from?-1:1))[0];used.set(x.id,(used.get(x.id)||0)+1);
    out.push({card:c,slot:x.id,why:c.due?`Lands before ${relDay(c.due)}`:st.mode==='w'?`${fmtDurS(freeMinutes(x.id))} free that day`:`Lightest ${P.unit} with room`});});
  return out;}
/* how much the to-dos on a day ask for: their estimates, or 30 minutes each */
function stNeedMin(placed){return placed.filter(c=>c.type!=='habit').reduce((n,c)=>n+((c.type==='task'&&planMin(c.rec))||30),0);}
/* a short summary of a stretch of days: all-day highlights, events, to-dos and free time */
function stSpan(from,to){let ev=0,td=0,fr=0,n=0;const ad=[];for(let d=from;d<=to;d=addK(d,1)){const x=dayItems(d);ev+=x.timed.filter(e=>e.kind==='block'||e.kind==='gcal').length;td+=x.timed.concat(x.anytime).filter(e=>e.kind==='task'&&!e.done).length;x.allDay.forEach(e=>{if(!ad.includes(e.title))ad.push(e.title);});if(d>=todayK()){fr+=freeMinutes(d);n++;}}return{ev,td,fr,n,ad};}
function stFreeLine(dk){const f=freeMinutes(dk);return f<60?['Full','full']:[`${fmtDurS(f)} free`,''];}
function viewStudio(root){
  if(App.state.loading&&!recs.size){root.append(tabSkeleton('studio'));return;}
  const st=stState(),P=stPeriod(st),cards=stCards(st,P),planRec=get.id('plan-'+P.key),committed=planRec&&planRec.committed,s=get.settings();
  document.body.classList.remove('has-commit');const cbar=$('#commitbar');if(cbar)cbar.hidden=true;
  const page=el('div',{class:'page studio2'});
  const go=d=>{st.anchor=P.step(d);st.selCard=null;st.ghosts=[];st.open=null;App.refresh();};
  const menu=e=>Menu([st.mode==='w'&&!P.slots.every(x=>x.past)?{label:'Copy last week’s plan',icon:'rep',onclick:()=>copyLastWeek(P)}:null,{label:'New task, habit or goal',icon:'plus',onclick:()=>newCardSheet(st,P)},committed?{label:'Replan',icon:'edit',onclick:()=>{planRec.committed=false;put(planRec);}}:null].filter(Boolean),{at:e});
  page.append(PageHeader({title:P.head,titleClass:'serif',titleStyle:'font-size:34px;line-height:1.05;letter-spacing:-.01em;margin:0',rowClass:'cal-title',
    controls:el('div',{class:'arrows'},IconButton('Previous',{cls:'green',html:ic('chevl',20,2),onclick:()=>go(-1)}),IconButton('Next',{cls:'green',html:ic('chevr',20,2),onclick:()=>go(1)}),moreB('Studio options',menu)),
    after:[el('span',{class:'hquiet'},P.eyebrow),
    el('div',{style:'margin-top:10px'},seg([['w','Week'],['m','Month'],['q','Quarter']],st.mode,v=>{st.mode=v;st.anchor=null;st.selCard=null;st.ghosts=[];st.open=null;App.refresh();}))]}));
  const fk=st.mode==='q'?P.key.replace(/^q-(\d+)-Q(\d)/,(m,y,q)=>`q-${y}-${q-1}`):P.key;
  page.append(focusChip(fk,st.mode==='q'?`${P.head.split(' ')[0]} focus`:st.mode==='m'?`${P.head} focus`:'Week focus',st.mode==='q'?'quarter':st.mode==='m'?'month':'week',st.mode==='m'?[`${P.key.slice(2)}-01`,k(new Date(+P.key.slice(2,6),+P.key.slice(7),0))]:[P.slots[0].from,P.slots[P.slots.length-1].to]));
  if(st.only){const o=get.id(st.only);if(!o)st.only=null;else page.append(el('div',{class:'focus-chip'},el('span',{class:'grow small',style:'text-align:left'},`Showing ${o.title} only`),el('button',{class:'fa',onclick:()=>{st.only=null;App.refresh();}},'Show all')));}
  studioExtras(page,st,P);
  const allPast=P.slots.every(x=>x.past);
  /* ---- what needs a day ---- */
  const ghostIds=new Set(st.ghosts.map(g=>g.card.id));
  const need=cards.filter(c=>c.q>0&&!(ghostIds.has(c.id)&&(c.type!=='habit'||st.ghosts.filter(g=>g.card.id===c.id).length>=c.q))).map(c=>({c,r:stRank(c,P,st)})).sort((a,b)=>a.r[0]-b.r[0]||((a.c.due||'9')<(b.c.due||'9')?-1:1));
  const openW=P.slots.filter(s=>!s.past&&!(st.mode==='w'&&tripBlocked(s.id))).map(s=>s.id);const habNeed=st.mode==='w'?need.filter(x=>x.c.type==='habit'&&openW.some(id=>!x.c.placedIn.includes(id))):[];const seenG=new Set();const need1=need.filter(x=>{if(st.mode==='w'&&x.c.type==='habit')return false;if(x.c.type!=='step')return true;if(seenG.has(x.c.rec.id))return false;seenG.add(x.c.rec.id);x.c.more=need.filter(y=>y.c.type==='step'&&y.c.rec.id===x.c.rec.id).length;return true;});
  const need2=need1.filter(x=>x.r[0]<99),top=need2.filter(x=>x.r[0]<9),back=need2.filter(x=>x.r[0]>=9&&x.r[0]<99),showBack=!!st.showBack;
  if(!allPast){
    if(st.ghosts.length)page.append(el('div',{class:'stghost'},el('span',{class:'grow'},el('b',{},`${st.ghosts.length} suggested`),el('small',{},'Shown in your week below, dashed')),Button('Clear',{variant:'quiet',size:'sm',onclick:()=>{st.ghosts=[];App.refresh();}}),Button('Keep all',{variant:'primary',size:'sm',onclick:()=>{const n=st.ghosts.length,made=st.ghosts;made.forEach(g=>placeCard(g.card,g.slot,st));st.ghosts=[];App.refresh();toast(`${n} placed`,()=>{made.forEach(g=>unplaceCard(g.card,g.slot,st));App.refresh();});}})));
    page.append(lblRow(`Needs a ${P.unit}${need2.length?` · ${need2.length}`:''}`,need2.length&&!st.ghosts.length&&s.suggestOn!==false?lnk(`Fill my ${st.mode==='w'?'week':st.mode==='m'?'month':'quarter'}`,()=>{arcMark();st.ghosts=fillFew(top.map(x=>x.c),P,st);if(!st.ghosts.length)toast(`No open ${P.unit}s left to fill`);App.refresh();},'spark'):null));
    const list=el('div',{class:'list stneed',id:'st-dock','data-rail':'1'});
    const shown=[...top,...(showBack||!top.length?back:[])];
    const more=!!st.showMore,lim=more||showBack?400:5,nTop=top.length?top.length:shown.length;
    shown.slice(0,lim).forEach(({c,r})=>list.append(stRow(c,r[1],st,P)));
    if(!more&&!showBack&&nTop>5)list.append(el('button',{class:'addset muted',onclick:()=>{st.showMore=true;App.refresh();}},`Show ${nTop-5} more`));
    else if(back.length&&top.length)list.append(el('button',{class:'addset muted',onclick:()=>{st.showBack=!showBack;if(showBack)st.showMore=false;App.refresh();}},showBack?'Hide the backlog':`Backlog · ${back.length} more without a date`));
    else if(more&&nTop>5)list.append(el('button',{class:'addset muted',onclick:()=>{st.showMore=false;App.refresh();}},'Show fewer'));
    if(habNeed.length){const hb=Row({as:'div',cls:'strow sthab'},el('button',{class:'strow-h','aria-expanded':String(!!st.habOpen),onclick:()=>{st.habOpen=!st.habOpen;App.refresh();}},el('span',{class:'stai','aria-hidden':'true',html:ic('rep',14,2)}),el('span',{class:'grow'},el('b',{},`${dCount(habNeed.length,'habit')} to spread`),el('small',{},st.habOpen?'Tap one to place it':habNeed.slice(0,2).map(x=>x.c.t).join(', ')+(habNeed.length>2?` and ${habNeed.length-2} more`:'')))),Button('Spread them',{variant:'link',size:'sm',onclick:ev=>{ev.stopPropagation();const g=suggest(habNeed.map(x=>x.c),P,st);if(!g.length){toast('No open days left');return;}g.forEach(x=>placeCard(x.card,x.slot,st));App.refresh();toast(`${g.length} sessions placed`,()=>{g.forEach(x=>unplaceCard(x.card,x.slot,st));App.refresh();});}}));
      list.prepend(hb);}
    if(st.habOpen&&habNeed.length){const anchor=list.querySelector('.sthab');[...habNeed].reverse().forEach(({c,r})=>{const n=stRow(c,r[1],st,P);n.classList.add('sthabrow');anchor.after(n);});}
    if(need2.length||habNeed.length)page.append(list);
    if(!need2.length)page.append(el('p',{class:'stplanned'},cards.length?`Everything has a ${P.unit}. Your ${st.mode==='w'?'week':st.mode==='m'?'month':'quarter'} is planned.`:'Nothing waiting. New tasks, habits and goal steps show up here.'));}
  /* ---- the period ---- */
  page.append(lblRow(st.mode==='w'?'Your week':st.mode==='m'?'Weeks':'Months'));
  const box=el('div',{class:'stslots'});const past=P.slots.filter(x=>x.past);
  if((past.length>1||(past.length&&st.mode!=='w'))&&!allPast){const a0=past[0],a1=past[past.length-1],nm=x=>x.a.slice(0,1)+x.a.slice(1,3).toLowerCase();const nd=get.all('task',{archived:true}).filter(t=>t.date&&t.date>=a0.from&&t.date<=a1.to&&!isOpenTask(t)).length;
    const lab=st.mode==='w'?`${nm(a0)}–${nm(a1)}`:st.mode==='m'?`${shortDay(a0.from)} – ${shortDay(a1.to)} · ${dCount(past.length,'week')}`:past.length>1?`${a0.label}–${a1.label}`:a0.a;
    box.append(el('button',{class:'stpastline','aria-expanded':String(!!st.showPast),onclick:()=>{st.showPast=!st.showPast;App.refresh();}},el('span',{class:'grow'},`${lab}${nd?` · ${nd} done`:''}`),el('span',{style:'display:grid',html:ic(st.showPast?'chevu':'chevr',14,2.2)})));
    P.slots.forEach(sl=>{if(sl.past&&!st.showPast)return;box.append(slotRow(sl,st,P,cards));});}
  else P.slots.forEach(sl=>box.append(slotRow(sl,st,P,cards)));page.append(box);
  if(st.mode==='w'){const n0=addK(P.slots[6].id,1),n6=addK(n0,6),sp=stSpan(n0,n6),pw=get.all('task').filter(t=>isOpenTask(t)&&!t.date&&t.planWeek===n0).length,np=sp.td+pw;
    const hi=(()=>{for(let d=n0;d<=n6;d=addK(d,1)){const a=dayItems(d).allDay.find(e=>e.kind!=='trip'&&!/work/i.test(e.title));if(a)return `${a.title} ${DOW[fromK(d).getDay()].slice(0,3)}`;}return '';})();
    box.append(el('button',{class:'stpastline stnext',onclick:()=>go(1)},el('span',{class:'grow'},['Next week',np?`${np} planned`:'nothing planned yet',hi].filter(Boolean).join(' · ')),el('span',{style:'display:grid',html:ic('chevr',14,2.2)})));}
  studioBudget(page,st,P);
  /* ---- done ---- */
  root.append(page);
}
/* one card in Needs a day: tap to open its day circles, tap a circle to place it */
function stRow(c,why,st,P){const open=st.open===c.id;
  const head=el('button',{class:'strow-h','aria-expanded':String(open),onclick:()=>{st.open=open?null:c.id;App.refresh();}},stAi(c),el('span',{class:'grow'},el('b',{},c.type==='step'?c.m:c.t),el('small',{class:/Overdue|Carried/.test(why)?'late':null},c.type==='step'?[why==='Next step'?'':why,`Next: ${c.t}`,c.more>1?`${c.more} steps`:''].filter(Boolean).join(' · '):[why,c.type==='habit'?c.src:(/^Due /.test(why)&&/^Due /.test(c.m||'')?String(c.m).split(' · ').slice(1).join(' · '):c.m)].filter(Boolean).join(' · '))));
  const n=el('div',{class:'li strow'+(open?' open':''),'data-cid':c.id},head);
  if(open){n.append(el('div',{class:'stpick'},P.slots.map(sl=>{const done=c.placedIn.includes(sl.id),late=c.due&&sl.from>c.due;const fm=st.mode==='w'&&!sl.past?freeMinutes(sl.id):null;return el('button',{class:'stc'+(done?' on':'')+(late?' late':'')+(fm!=null&&fm<60?' full':''),disabled:sl.past||(done&&c.type!=='habit')||null,'aria-label':`${sl.label}${done?', placed':''}`,onclick:()=>{if(done){unplaceCard(c,sl.id,st);App.refresh();return;}st.open=c.type==='habit'&&c.q>1?c.id:null;doPlace(c,sl.id,st,P,sl);}},el('b',{},st.mode==='w'?sl.a[0]:st.mode==='m'?String(fromK(sl.from).getDate()):sl.a.slice(0,3)),st.mode==='w'?el('small',{},sl.past?sl.b:fm<60?'Full':`${Math.round(fm/60)}h`):null);})),
    el('div',{class:'stacts'},Button('Open',{variant:'link',size:'sm',onclick:()=>stOpen(c)}),c.type==='task'&&st.mode==='w'?Button('Next week',{variant:'link',size:'sm',onclick:()=>{c.rec.planWeek=addK(P.slots[0].id,7);put(c.rec);toast('Moved to next week',()=>{c.rec.planWeek=null;put(c.rec);});}}):null));}
  draggable(head,{label:c.t,pull:true,move:(x,y)=>hoverSlot(x,y),drop:(x,y)=>{const id=hoverSlot(x,y);clearHover();if(id&&id!=='rail'){const sl=P.slots.find(z=>z.id===id);doPlace(c,id,st,P,sl);}}});
  return n;}
/* one day (or week, or month): what you placed, what's fixed in one line, and how much room is left */
function slotRow(sl,st,P,cards){
  let placed=cards.filter(c=>c.placedIn.includes(sl.id)),ghosts=st.ghosts.filter(g=>g.slot===sl.id),isToday=st.mode==='w'&&sl.id===todayK();
  if(sl.past&&!placed.length)return el('div',{class:'stslot past','data-slot':sl.id},el('div',{class:'stslot-h'},el('b',{},st.mode==='w'?`${sl.a.slice(0,1)+sl.a.slice(1).toLowerCase()} ${sl.b}`:sl.label),el('small',{},'Passed')));
  let fixed='';if(st.mode==='w'){const d=dayItems(sl.id),busy=d.timed.filter(e=>e.kind==='block'||e.kind==='gcal'),ad=d.allDay.map(e=>e.title);const nt=placed.filter(c=>c.type!=='habit').length;fixed=[ad[0]||null,busy.length?dCount(busy.length,'event'):null,nt?dCount(nt,'to-do'):null].filter(Boolean).join(' · ');}
  /* v250 · the bar shows what's planned against your daily capacity, not free hours */
  const ld=sl.past?0:slotLoad(sl,st,cards),cap=P.cap||6;let [fr,frc]=st.mode==='w'&&!sl.past?[ld?`${ld} of ${cap} planned`:'Nothing planned',ld>cap?'full':'']:['',''];const over=st.mode==='w'&&!sl.past&&(ld>cap||(placed.length&&stNeedMin(placed)>freeMinutes(sl.id)));
  let span=null;if(st.mode==='m'){span=stSpan(sl.from,sl.to);const nt=span.td+placed.filter(c=>c.type!=='habit').length;fixed=[span.ad[0]||null,span.ev?dCount(span.ev,'event'):null,nt?dCount(nt,'to-do'):null].filter(Boolean).join(' · ');if(!sl.past&&span.n)fr=`${fmtDurS(span.fr)} free`;}
  const dues=st.mode==='w'?get.all('task').filter(t=>t.deadline===sl.id&&isOpenTask(t)).map(t=>t.title):[];
  const node=el('section',{class:'stslot'+(isToday?' istoday':'')+(sl.past?' past':'')+(st.mode==='m'&&!sl.past?' tapweek':''),'data-slot':sl.id,onclick:st.mode==='m'&&!sl.past?ev=>{if(ev.target.closest('button'))return;st.mode='w';st.anchor=sl.from;st.ghosts=[];st.open=null;App.refresh();}:null},
    el('div',{class:'stslot-h'},el('b',{},st.mode==='w'?`${sl.a.slice(0,1)+sl.a.slice(1).toLowerCase()} ${sl.b}`:st.mode==='m'?`${sl.a} – ${sl.b.replace(/^to /,'')}`:sl.a),el('small',{class:frc==='full'?'warn':null},fr),sl.past?null:IconButton(`Add to ${sl.label}`,{size:'sm',cls:'green',style:'margin-right:calc(var(--s2) * -1)',html:ic('plus',18,2),onclick:()=>st.mode==='w'?commitmentSheet(sl,st):newCardSheet(st,P)})),
    st.mode==='w'&&!sl.past?stFreeBar(sl.id,over,ld/cap):st.mode==='m'&&!sl.past&&span&&span.n?stFreeBar(null,false,span.fr/(span.n*900)):null,
    fixed||over?el('p',{class:'stfixed'},fixed,over?el('span',{class:'stover'},`${fixed?' · ':''}More than fits`):null):null,
    dues.length?el('p',{class:'stdue'},`Due: ${dues.slice(0,2).join(', ')}${dues.length>2?` +${dues.length-2}`:''}`):null);
  if(isToday){node.append(Button('Open Today ›',{variant:'link',size:'sm',cls:'stopen',onclick:()=>App.go('today',{})}));placed=[];}
  const hab=placed.filter(c=>c.type==='habit');placed=placed.filter(c=>c.type!=='habit');
  if(hab.length&&!isToday)node.append(el('p',{class:'stfixed'},hab.length>2?`${hab.length} habits: ${hab.slice(0,2).map(c=>c.t).join(', ')}…`:hab.map(c=>c.t).join(', ')));
  if(placed.length||ghosts.length){const it=el('div',{class:'stitems'});
    placed.forEach(c=>{const n=el('button',{class:'stprow',onclick:()=>stOpen(c)},stAi(c),el('span',{class:'clip grow'},c.type==='step'?`${c.m} · ${c.t}`:c.t));draggable(n,{label:c.t,move:(x,y)=>hoverSlot(x,y),drop:(x,y)=>{const id=hoverSlot(x,y);clearHover();if(!id||id===sl.id)return;if(id==='rail'){unplaceCard(c,sl.id,st);App.refresh();toast('Back in Needs a day',()=>{placeCard(c,sl.id,st);App.refresh();});return;}const to=P.slots.find(z=>z.id===id);if(to&&to.past){toast('That day has passed');return;}unplaceCard(c,sl.id,st);placeCard(c,id,st);App.refresh();toast(`Moved to ${to.label}`);}});it.append(n);});
    ghosts.forEach(g=>it.append(el('div',{class:'stprow sugg'},stAi(g.card),el('button',{class:'clip grow',style:'text-align:left',onclick:()=>toast(g.why)},g.card.type==='step'?`${g.card.m} · ${g.card.t}`:g.card.t),
      Button('Keep',{variant:'link',size:'sm',onclick:()=>{placeCard(g.card,g.slot,st);st.ghosts=st.ghosts.filter(x=>x!==g);App.refresh();}}),
      IconButton('Drop this suggestion',{size:'sm',style:'color:var(--ink-3)',html:ic('x',14,2.2),onclick:()=>{st.ghosts=st.ghosts.filter(x=>x!==g);App.refresh();}}))));
    node.append(it);}
  return node;}
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
      sl.past?null:selC&&!sl.past?Chip('Place here',{selected:true,style:'height:32px',onclick:()=>doPlace(selC,sl.id,st,P,sl)}):IconButton(`Add a commitment to ${sl.label}`,{size:'sm',cls:'green',html:ic('plus',18,2),onclick:()=>commitmentSheet(sl,st)})));
  const items=el('div',{class:'slot-items'});
  // fixed items
  if(st.mode==='w'){const d=dayItems(sl.id);
    d.allDay.forEach(e=>items.append(el('button',{class:'fx',onclick:()=>openItem(e,sl.id)},el('time',{},e.rec&&e.rec.tripId?'Away':'All day'),el('span',{},e.title))));
    d.timed.filter(e=>e.kind==='block'||(e.kind==='gcal'&&get.settings().calendar.busy)).forEach(e=>items.append(el('button',{class:'fx',onclick:()=>openItem(e,sl.id)},el('time',{},fmtS(e.time)),el('span',{},e.title))));
    get.all('task').filter(t=>t.deadline===sl.id&&isOpenTask(t)).forEach(t=>items.append(el('button',{class:'fx',onclick:()=>taskSheet(t)},el('time',{style:'color:var(--overdue)'},'Due'),el('span',{},t.title))));
    // recurring habits/tasks that sit here on their own
    d.anytime.concat(d.timed).filter(e=>(e.kind==='task'&&e.rec.repeat&&e.rec.repeat.type!=='never')||(e.kind==='habit'&&e.rec.days&&e.rec.days.length)||e.kind==='routine').forEach(e=>items.append(el('button',{class:'fx',onclick:()=>openItem(e,sl.id)},el('time',{},'Repeat'),el('span',{},e.title))));
  }else if(st.mode==='m'&&sl.heat){items.append(el('div',{style:'display:grid;grid-template-columns:repeat(7,1fr);gap:3px;margin-bottom:var(--s1)','aria-hidden':'true'},sl.heat.map(l=>el('i',{style:`display:block;height:8px;border-radius:2px;background:var(--h${l})`}))));}
  // placed cards
  cards.filter(c=>c.placedIn.includes(sl.id)).forEach(c=>{
    const n=el('div',{class:'pl',style:`--c:${c.c}`,role:'button',tabindex:0,onclick:()=>placedSheet(c,sl,st,P)},el('span',{class:'clip grow'},c.t),c.type==='habit'&&c.rec.dur?el('small',{},fmtDurS(c.rec.dur)):c.m?el('small',{class:'clip',style:'max-width:45%'},c.m):null);
    draggable(n,{label:c.t,move:(x,y)=>hoverSlot(x,y),drop:(x,y)=>{const id=hoverSlot(x,y);clearHover();if(!id||id===sl.id)return;if(id==='rail'){unplaceCard(c,sl.id,st);App.refresh();toast('Back in To plan',()=>{placeCard(c,sl.id,st);App.refresh();});return;}const to=P.slots.find(s=>s.id===id);if(to&&to.past){toast('That day has passed');return;}unplaceCard(c,sl.id,st);placeCard(c,id,st);App.refresh();toast(`Moved to ${to.label}`);}});
    items.append(n);
  });
  st.ghosts.filter(g=>g.slot===sl.id).forEach(g=>items.append(el('button',{class:'pl ghosted','data-gid':g.card.id,style:`--c:${g.card.c}`,title:g.why,onclick:()=>toast(g.why)},el('span',{class:'clip grow'},g.card.type==='step'?`${g.card.t} · ${g.card.m}`:g.card.t),el('small',{},'Suggested'))));
  if(!items.children.length)items.append(el('div',{class:'small',style:'color:var(--ink-3);padding:2px 0 var(--s1)'},sl.past?'Passed':'Open'));
  node.append(items);
  return node;
}
function commitmentSheet(sl,st){
  const dk=sl.from;menuAt([{label:'Time block',icon:'hour',onclick:()=>blockSheet(null,{date:dk,start:nextFreeSlot(dk)})},{label:'All-day item',icon:'cal',onclick:()=>alldaySheet(null,{start:dk})},{label:'Task',icon:'task',onclick:()=>taskSheet(null,{date:dk})}]);return;
  const inst=openSheet({title:'Add a commitment',build:body=>{body.append(el('p',{class:'muted'},`Something fixed on ${st.mode==='w'?sl.label:'or around '+sl.label}. Plans work around it.`),el('div',{class:'list'},
    Row({onclick:()=>{inst.close();blockSheet(null,{date:dk,start:nextFreeSlot(dk)});}},IconTile(null,{html:ic('hour',20)}),el('span',{class:'grow'},el('b',{},'Time block'),el('small',{},'A meeting, appointment or fixed time'))),
    Row({onclick:()=>{inst.close();alldaySheet(null,{start:dk});}},IconTile(null,{html:ic('cal',20)}),el('span',{class:'grow'},el('b',{},'All-day item'),el('small',{},'A birthday, trip or day off'))),
    Row({onclick:()=>{inst.close();taskSheet(null,{date:dk});}},IconTile(null,{html:ic('task',20)}),el('span',{class:'grow'},el('b',{},'Task'),el('small',{},'Something that needs doing that day')))));}});
}
function newCardSheet(st,P){menuAt(st.mode==='w'?[{label:'Task',icon:'task',onclick:()=>taskSheet(null,{date:null,planWeek:P.slots[0].id})},{label:'Habit',icon:'habit',onclick:()=>habitSheet(null)},{label:'Goal',icon:'target',onclick:()=>goalSheet(null)},{label:'Project',icon:'project',onclick:()=>projectSheet(null)}]:[{label:'Goal',icon:'target',onclick:()=>goalSheet(null)},{label:'Project',icon:'project',onclick:()=>projectSheet(null)},{label:'Task with a deadline',icon:'task',onclick:()=>taskSheet(null,{date:null,deadline:P.slots[P.slots.length-1].to})}]);return;
  if(st.mode==='w'){const inst=openSheet({title:'New card',build:body=>{body.append(el('div',{class:'list'},
    Row({onclick:()=>{inst.close();taskSheet(null,{date:null,planWeek:P.slots[0].id});}},IconTile(null,{html:ic('task',20)}),el('span',{class:'grow'},el('b',{},'Task'),el('small',{},'One action to finish'))),
    Row({onclick:()=>{inst.close();habitSheet(null);}},IconTile(null,{html:ic('habit',20)}),el('span',{class:'grow'},el('b',{},'Habit'),el('small',{},'Something you repeat each week'))),
    Row({onclick:()=>{inst.close();goalSheet(null);}},IconTile(null,{html:ic('target',20)}),el('span',{class:'grow'},el('b',{},'Goal'),el('small',{},'An outcome with steps'))),
    Row({onclick:()=>{inst.close();projectSheet(null);}},IconTile(null,{html:ic('project',20)}),el('span',{class:'grow'},el('b',{},'Project'),el('small',{},'A bigger effort with steps')))));}});}
  else{const inst=openSheet({title:'New card',build:body=>{body.append(el('div',{class:'list'},
    Row({onclick:()=>{inst.close();goalSheet(null);}},IconTile(null,{html:ic('target',20)}),el('span',{class:'grow'},el('b',{},'Goal'),el('small',{},'An outcome with steps'))),
    Row({onclick:()=>{inst.close();projectSheet(null);}},IconTile(null,{html:ic('project',20)}),el('span',{class:'grow'},el('b',{},'Project'),el('small',{},'A bigger effort with steps'))),
    Row({onclick:()=>{inst.close();taskSheet(null,{date:null,deadline:P.slots[P.slots.length-1].to});}},IconTile(null,{html:ic('task',20)}),el('span',{class:'grow'},el('b',{},'Task with a deadline'),el('small',{},'Something due this period')))));}});}
}
function placedSheet(c,sl,st,P){
  const inst=openSheet({title:c.t,build:body=>{
    const ctx=formCtx(()=>{});
    const moves=P.slots.filter(s=>!s.past&&s.id!==sl.id);
    body.append(SectionLabel('Move to'),el('div',{class:'chips'},moves.map(s=>Chip(s.label,{onclick:()=>{unplaceCard(c,sl.id,st);placeCard(c,s.id,st);inst.close();toast(`Moved to ${s.label}`);}}))),
      Caption(`Tip: you can also drag it straight to another ${P.unit}.`,{as:'p'}));
    if(st.mode==='w'){const seT=c.type==='habit'?(c.rec.sessions[sl.id]||{}).time:c.type==='task'?c.rec.time:c.step.time;
      body.append(SectionLabel('Time (optional)'),Caption('Leave it blank and it waits at the top of that day’s Today page, ready to drag onto a time.',{as:'p'}),
        Button(seT!=null?`Set for ${fmtT(seT)}. Open in Today`:'Open that day in Today',{variant:'secondary',full:true,onclick:()=>{inst.close();const e=dayItems(sl.id);const it=[...e.timed,...e.anytime].find(x=>x.id===(c.type==='step'?c.step.id:c.rec.id));App.state.sel=sl.id;App.state._fresh=true;App.go('today');}}));}
    body.append(Button('Back to To plan',{variant:'quiet',full:true,onclick:()=>{unplaceCard(c,sl.id,st);inst.close();toast('Back in To plan',()=>{placeCard(c,sl.id,st);App.refresh();});}}),
      Button(`Edit ${({habit:'habit',task:'task',step:c.rec.kind})[c.type]}`,{variant:'text',onclick:()=>{inst.close();if(c.type==='habit')App.go('habit',{id:c.rec.id});else if(c.type==='task')taskSheet(c.rec);else App.go('plan',{id:c.rec.id});}}));
  }});
}
function reviewSheet(P,st,cards){
  const unplaced=cards.filter(c=>c.q>0),placedN=cards.reduce((n,c)=>n+c.placedIn.length,0);
  let fixed=0;P.slots.forEach(s=>{let dk=s.from;while(dk<=s.to){const d=dayItems(dk);fixed+=d.allDay.length+d.timed.filter(e=>e.kind==='block').length;dk=addK(dk,1);}});
  const busy=P.slots.filter(s=>slotLoad(s,st,cards)>=P.cap).length;
  const late=cards.filter(c=>c.due&&c.placedIn.some(id=>{const s=P.slots.find(x=>x.id===id);return s&&s.from>c.due;})).length;
  const inst=openSheet({title:`Review ${P.head}`,build:body=>{
    body.append(StatRow([[String(placedN),'planned'],[String(fixed),'commitments'],[String(P.slots.filter(s=>!slotLoad(s,st,cards)).length),`open ${P.unit}s`]],{cls:'stat3'}));
    if(busy)body.append(el('p',{class:'small',style:'color:var(--overdue)'},`${busy} ${P.unit}${busy>1?'s are':' is'} over your capacity.`));
    if(late)body.append(el('p',{class:'small',style:'color:var(--overdue)'},`${late} card${late>1?'s land':' lands'} after the due date.`));
    if(unplaced.length){body.append(SectionLabel(`Not placed · ${unplaced.length}`));body.append(el('div',{class:'list'},unplaced.map(c=>Row({as:'div',style:''},el('span',{class:'grow'},el('b',{style:'font-weight:500'},c.t),el('small',{},c.type==='habit'?'Sessions left this week':'Stays in To plan'))))));}
    body.append(Button(P.commit,{variant:'primary',full:true,onclick:()=>{const r=get.id('plan-'+P.key)||{id:'plan-'+P.key,kind:'plan',key:P.key};r.committed=true;r.committedAt=Date.now();App.state._commitSweep=true;put(r);if(st.mode==='w')setSettings({checkinDone:todayK()});inst.close();buzz(12);toast(P.doneL);}}),Button('Keep planning',{variant:'quiet',full:true,onclick:()=>inst.close()}));
  }});
}
function checkinSheet(P,st,cards){
  const made=repeatLast(P,st,cards);const late=cards.filter(c=>c.tag==='Carried over');
  const inst=openSheet({title:'Sunday check-in',build:body=>{
    body.append(
      el('div',{class:'cistep'},el('i',{},'1'),el('div',{},el('b',{},'Repeat last week’s rhythm'),Caption(made.length?made.map(m=>`${m.card.t} on ${m.slot&&DOW[fromK(m.slot).getDay()].slice(0,3)}`).join(', '):'No habit pattern from last week yet.',{as:'p',style:'margin-top:2px'}),made.length?Button('Repeat it',{variant:'secondary',style:'margin-top:var(--s2)',onclick:()=>{inst.close();studioMark();made.forEach(g=>placeCard(g.card,g.slot,st));App.refresh();toast(`${made.length} placed`);}}):null)),
      el('div',{class:'cistep'},el('i',{},'2'),el('div',{},el('b',{},'Check what carried over'),Caption(late.length?late.map(c=>c.t).join(', '):'Nothing carried over.',{as:'p',style:'margin-top:2px'}))),
      el('div',{class:'cistep'},el('i',{},'3'),el('div',{},el('b',{},'Fill the rest'),Caption('Suggest uses your usual days, spaces habits out, skips full days and lands things before they’re due.',{as:'p',style:'margin-top:2px'}),Button('Suggest the rest',{variant:'secondary',style:'margin-top:var(--s2)',onclick:()=>{arcMark();const c2=stCards(st,P);st.ghosts=suggest(c2,P,st);inst.close();App.refresh();}}))),
      Button('Go to my week',{variant:'primary',full:true,onclick:()=>{setSettings({checkinDone:todayK()});inst.close();}}));
  }});
}
