/* ---------- v364 · a smarter Life OS, round 2: learns from your own history, and Claude when you tap ----------
   Every nudge here has a switch in Settings › Today (Nudges and Moments). Claude only runs when you tap. */
SM_TODAY.push(
 ['best','Your best hours','Mornings: block your Top 3 when you do your best work','Nudges'],
 ['moved','Tasks you keep moving','After three moves, a question','Nudges'],
 ['big','Break big tasks down','Tasks over two hours get first steps','Nudges'],
 ['risk','Deadline risk','When a project has more work than time','Nudges'],
 ['place','Tasks for where you are','Home tasks on work-from-home days','Moments'],
 ['focus','Protect focus time','Sundays, when next week has little deep-work time','Moments'],
 ['prep','Meeting prep','Before a meeting with someone in People','Nudges'],
 ['save','Evening save','A habit still open past its usual time','Nudges'],
 ['bills','Bills that look off','A bill well above its usual','Moments'],
 ['pace','Spending pace','A category running ahead of usual','Moments'],
 ['chores','Spread chores','When one day has too many','Moments'],
 ['meals','Groceries from meals','Ingredients for the meals you planned','Moments']);
SET_INDEX.push(...SM_TODAY.slice(-12).map(([,l])=>[l,'today']));
const sm2Rel=d=>{const r=relDay(d);return /^(Today|Tomorrow|Yesterday)$/.test(r)?r.toLowerCase():r;};
const sm2Day=k2=>{const s=get.settings();return s['sm2_'+k2]===todayK();},sm2Mark=k2=>setSettings({['sm2_'+k2]:todayK()});

/* ---------- shared: when things get done ---------- */
const sm2DoneAt=t=>Object.values(t.doneDates||{}).filter(v=>typeof v==='number'&&v>1e12);
const sm2Med=L=>{if(!L.length)return null;const s=L.slice().sort((a,b)=>a-b);return s[Math.floor(s.length/2)];};

/* ---------- 1 · your best hours ---------- */
function sm2BestHours(){const H=new Array(24).fill(0);let n=0;get.all('task',{archived:true}).forEach(t=>{if(!(t.priority==='high'||(+t.dur||0)>=45||(+t.spent||0)>=30))return;sm2DoneAt(t).forEach(ts=>{const d=new Date(ts);if(d.getDay()===0||d.getDay()===6)return;H[d.getHours()]++;n++;});});
  if(n<8)return null;let best=7,bv=-1;for(let h=6;h<=19;h++){const v=H[h]+H[h+1];if(v>bv||(v===bv&&H[h]>H[best])){bv=v;best=h;}}return{start:best*60,end:(best+2)*60,n};}
function sm2BestRow(tk,aRow){if(!smOn('best')||sm2Day('best'))return;const bh=sm2BestHours();if(!bh||nowMin()>bh.start-15)return;let L=[];try{L=t3Get(tk).map(x=>get.id(x.id)).filter(t=>t&&t.kind==='task'&&isOpenTask(t)&&t.time==null);}catch(e){}if(!L.length)return;
  aRow(`Your best hours are ${fmtT(bh.start)}–${fmtT(bh.end)}`,`You finish most focused work then. Block it for ${L.length===1?L[0].title:`your ${L.length} priorities`}?`,()=>{const made=[];let at=bh.start;L.slice(0,2).forEach(t=>{const d=Math.min(120,+t.dur||60);made.push(create('block',{title:`Focus: ${t.title}`,date:tk,start:at,dur:d,repeat:{type:'never'},area:t.area||null,links:[t.id]}));at+=d;});sm2Mark('best');App.refresh();toast(`${dCount(made.length,'focus block')} on your calendar`,()=>{made.forEach(b=>remove(b.id,{hard:true,silent:true}));App.refresh();},'Undo',{force:true});});}

/* ---------- 2 · estimates that learn from focus time ---------- */
function sm2LearnDur(title){const L=get.all('task',{archived:true}).filter(t=>+t.spent>0&&!isOpenTask(t)&&simT(t.title,title)>=0.5);if(L.length<2)return null;const m=sm2Med(L.map(t=>+t.spent));return m?{min:Math.round(m/5)*5||5,n:L.length}:null;}

/* ---------- 3 · the task you keep moving, and 4 · break it down with Claude ---------- */
function sm2MovedRow(tk,aRow){if(!smOn('moved'))return;const no=get.settings().sm2MovedNo||[];const t=get.all('task').filter(t=>isOpenTask(t)&&(t.slips||0)>=3&&!no.includes(t.id)).sort((a,b)=>(b.slips||0)-(a.slips||0))[0];if(!t)return;
  aRow(`Moved ${t.slips} times: ${t.title}`,'What would make it happen?',()=>sm2MovedSheet(t));}
function sm2MovedSheet(t){let inst;inst=openSheet({title:t.title,left:{label:'Close'},build:b=>{b.append(Caption(`You’ve moved this ${t.slips} times. Pick one.`,{as:'p',style:'padding:0 var(--s1) var(--s3)'}),el('div',{class:'list'},
  Row({onclick:()=>{inst.close();sm2BreakSheet(t);}},el('span',{class:'grow'},el('b',{style:'font-weight:500'},'Break it down'),el('small',{},'Three small first steps')),RowEnd('chevron')),
  Row({onclick:()=>{inst.close();taskSheet(t);}},el('span',{class:'grow'},el('b',{style:'font-weight:500'},'Give it a time'),el('small',{},'A day and time you’ll keep')),RowEnd('chevron')),
  Row({onclick:()=>{inst.close();const c=clone(t);t.archived=true;t.archivedAt=Date.now();put(t);toast('Let go. It’s in Archive.',()=>{put(c);App.refresh();},'Undo',{force:true});}},el('span',{class:'grow'},el('b',{style:'font-weight:500'},'Let it go'),el('small',{},'Archive it, no guilt')),RowEnd('chevron'))),
  Button('Keep it as it is',{variant:'text',full:true,onclick:()=>{setSettings({sm2MovedNo:[...(get.settings().sm2MovedNo||[]),t.id].slice(-50)});inst.close();App.refresh();}}));}});}
const SM2_VAGUE=/^(sort out|figure out|deal with|work on|look into|handle|organi[sz]e|plan|research|prepare|prep|clean up|fix up|get on top of)\b/i;
function sm2BigRow(tk,aRow){if(!smOn('big'))return;const no=get.settings().sm2BigNo||[];const t=smTasksOn(tk).map(e=>e.rec).find(t=>!(t.steps||[]).length&&!no.includes(t.id)&&((+t.dur||0)>=120||SM2_VAGUE.test(t.title)));if(!t)return;
  aRow(`${t.title} looks big`,'Break it into three first steps',()=>sm2BreakSheet(t));}
async function sm2BreakSheet(t){let inst,L=null;const draw=b=>{b.replaceChildren();if(!L){smBusy(b,'Claude is writing first steps…');return;}
    b.append(Caption('Keep the ones you want. They become steps on the task.',{as:'p',style:'padding:0 var(--s1) var(--s3)'}),el('div',{class:'list'},L.map(x=>Row({as:'div',cls:'tick-host'},el('span',{class:'tick-hit'},tickBtn(x.on,v=>{x.on=v;})),el('span',{class:'grow'},el('b',{style:'font-weight:500'},x.t),el('small',{},fmtDurS(x.min)))))));};
  inst=openSheet({title:`First steps: ${t.title}`,left:{label:'Cancel',onclick:()=>{setSettings({sm2BigNo:[...(get.settings().sm2BigNo||[]),t.id].slice(-50)});inst.close();}},right:{label:'Add',onclick:()=>{if(!L)return;const add=L.filter(x=>x.on);if(!add.length){inst.close();return;}const c=clone(t);t.steps=[...(t.steps||[]),...add.map(x=>({id:uid('s'),t:x.t,d:false}))];put(t);inst.close();toast(`${dCount(add.length,'step')} added`,()=>{put(c);App.refresh();},'Undo',{force:true});}},build:b=>draw(b)});
  const j=await smAsk(`Break this to-do into 3 small, concrete first steps someone could start today. To-do: "${t.title}"${t.notes?`. Notes: ${String(t.notes).slice(0,400)}`:''}. Reply as JSON: {"steps":[{"t":"step, under 8 words, starting with a verb","min":minutes}]}`);
  L=((j&&j.steps)||[]).filter(x=>x&&x.t).slice(0,5).map(x=>({t:String(x.t).slice(0,90),min:Math.max(5,Math.min(240,+x.min||15)),on:true}));if(!L.length){inst.close();return;}draw(inst.body);}

/* ---------- 5 · deadline risk, early ---------- */
function sm2Risk(tk){const out=[];get.all('project').filter(p=>!p.finished&&!p.paused&&p.deadline&&p.deadline>tk).forEach(p=>{const open=projectTasks(p).filter(t=>!taskDone(t));if(!open.length)return;const need=open.reduce((n,t)=>n+(+t.dur||30),0);
  let free=0;for(let d=tk;d<p.deadline;d=addK(d,1)){try{free+=Math.max(0,freeMinutes(d)-smTasksOn(d).reduce((n,e)=>n+(+e.rec.dur||30),0))*0.15;}catch(e){}}
  if(need>free&&need>=120)out.push({p,need,free:Math.round(free)});});return out.sort((a,b)=>a.p.deadline<b.p.deadline?-1:1);}
function sm2RiskRow(tk,aRow){if(!smOn('risk'))return;const no=get.settings().sm2RiskNo||{};const r=sm2Risk(tk).find(x=>!(no[x.p.id]&&daysBetween(no[x.p.id],tk)<7));if(!r)return;
  aRow(`${r.p.title} is at risk`,`About ${fmtDurS(r.need)} of tasks left, ${fmtDurS(r.free)} of free time before ${relDay(r.p.deadline)}`,()=>{let inst;inst=openSheet({title:`${r.p.title} is at risk`,left:{label:'Close'},build:b=>{b.append(Caption(`Open tasks add up to about ${fmtDurS(r.need)}. Before ${sm2Rel(r.p.deadline)} you have roughly ${fmtDurS(r.free)} of time you usually give one project.`,{as:'p',style:'padding:0 var(--s1) var(--s3)'}),el('div',{class:'list'},
    Row({onclick:()=>{inst.close();projectSheet(r.p);}},el('span',{class:'grow'},el('b',{style:'font-weight:500'},'Move the date')),RowEnd('chevron')),
    Row({onclick:()=>{inst.close();try{smFitSheet();}catch(e){App.go('studio');}}},el('span',{class:'grow'},el('b',{style:'font-weight:500'},'Find time'),el('small',{},'Free slots this week')),RowEnd('chevron')),
    Row({onclick:()=>{inst.close();App.go('plan',{id:r.p.id});}},el('span',{class:'grow'},el('b',{style:'font-weight:500'},'Trim tasks'),el('small',{},'Open the project')),RowEnd('chevron'))),
    Button('Remind me next week',{variant:'text',full:true,onclick:()=>{setSettings({sm2RiskNo:Object.assign({},no,{[r.p.id]:tk})});inst.close();App.refresh();}}));}});});}

/* ---------- 6 · follow-ups make themselves, and 17 · what's next on a project ---------- */
const SM2_ASK=/^(ask|email|e-mail|text|message|ping|call|check with|follow up with|remind)\s+([A-Z][\w'’-]+)/;
function sm2Done(t){if(!t||t.kind!=='task')return;setTimeout(()=>{if(isOpenTask(t))return;
  const tt=String(t.title||''),m=SM2_ASK.exec(tt.charAt(0).toLowerCase()+tt.slice(1));if(m&&get.settings().sm2Follow!==false&&!/^(Mom|Dad)$/.test(m[2])){const who=m[2],fu=addK(todayK(),3);toast(`Waiting on ${who}? Follow up ${sm2Rel(fu)}.`,()=>{create('wait',{title:t.title.replace(/^(ask|email|e-mail|text|message|ping|call|check with|follow up with|remind)\s+/i,''),who,since:todayK(),follow:fu,notes:'',done:false});toast(`Added to Waiting · ${who}`);},'Yes',{force:true});return;}
  const p=t.part&&get.id(t.part);if(p&&p.kind==='project'&&!p.finished&&projectTasks(p).length>1&&!projectTasks(p).some(x=>!taskDone(x))&&get.settings().sm2Next!==false)sm2NextSheet(p,t);},700);}
function sm2NextSheet(p,last){let inst,sug=null;const add=title=>{create('task',{title,notes:'',steps:[],date:null,time:null,repeat:{type:'never',end:null},priority:'normal',part:p.id,area:p.area||null,photos:[]});inst.close();toast(`Added to ${p.title}`);App.refresh();};
  const draw=b=>{b.replaceChildren(Caption(`You finished ${last.title}. Nothing else is open on ${p.title}.`,{as:'p',style:'padding:0 var(--s1) var(--s3)'}));
    if(sug)b.append(el('div',{class:'list'},sug.map(s=>Row({onclick:()=>add(s)},el('span',{class:'grow'},el('b',{style:'font-weight:500'},s)),RowEnd('chevron')))));
    else b.append(Button('Suggest next steps with Claude',{variant:'secondary',full:true,onclick:async()=>{smBusy(b,'Thinking about what comes next…');const j=await smAsk(`A project called "${p.title}" just had its last open task done: "${last.title}". Done earlier: ${projectTasks(p).map(x=>x.title).slice(0,12).join('; ')}. Suggest the 3 most likely next tasks, each under 7 words, starting with a verb. JSON: {"next":["..."]}`);sug=((j&&j.next)||[]).filter(Boolean).slice(0,3).map(String);if(!sug.length)sug=null;draw(b);}}));
    b.append(el('div',{class:'list',style:'margin-top:var(--s3)'},Row({onclick:()=>{inst.close();App.state._focusPt=true;App.go('plan',{id:p.id});}},el('span',{class:'grow'},el('b',{style:'font-weight:500'},'Add my own')),RowEnd('chevron')),Row({onclick:()=>{inst.close();finishProject(p);}},el('span',{class:'grow'},el('b',{style:'font-weight:500'},'Mark the project done')),RowEnd('chevron'))));};
  inst=openSheet({title:`${p.title}: what’s next?`,left:{label:'Not now'},build:b=>draw(b)});}

/* ---------- 8 · tasks for where you are ---------- */
function sm2WfhToday(tk){const d=dayItems(tk);return d.allDay.some(e=>/work(ing)? from home|wfh|remote day/i.test(e.title||''))||(()=>{try{return shiftsOn(tk).some(x=>/home|remote/i.test(x.job||x.where||''));}catch(e){return false;}})();}
function sm2PlaceRow(tk,aRow){if(!smOn('place')||!sm2WfhToday(tk)||nowMin()>17*60)return;const shown=new Set(smTasksOn(tk).map(e=>e.id));const L=get.all('task').filter(t=>isOpenTask(t)&&!shown.has(t.id)&&(t.area||areaOfTask(t))==='Home'&&(+t.dur||30)<=30&&(!t.date||t.date<=addK(tk,7))).slice(0,4);if(!L.length)return;
  aRow(`Working from home: ${dCount(L.length,'home task')} fit your gaps`,L.slice(0,3).map(t=>`${t.title} · ${fmtDurS(+t.dur||30)}`).join(', '),()=>{let inst;inst=openSheet({title:'Home tasks for today',left:{label:'Close'},build:b=>b.append(el('div',{class:'list'},L.map(t=>Row({as:'div'},el('span',{class:'grow'},el('b',{style:'font-weight:500'},t.title),el('small',{},fmtDurS(+t.dur||30))),Button('Today',{variant:'secondary',size:'sm',onclick:e=>{const old=t.date;t.date=tk;put(t);e.currentTarget.textContent='Added';e.currentTarget.disabled=true;toast(`${t.title} is on today`,()=>{t.date=old;put(t);},'Undo',{force:true});}})))))});});}

/* ---------- 9 · protect focus time ---------- */
function sm2FocusGaps(from){const out=[];for(let i=0;i<7;i++){const d=addK(from,i),wd=fromK(d).getDay();if(wd===0||wd===6)continue;if(Holidays&&Holidays.off&&Holidays.off(d))continue;const busy=dayItems(d).timed.filter(e=>e.kind!=='task'&&e.kind!=='habit').map(e=>[e.time,e.time+(e.dur||30)]).sort((a,b)=>a[0]-b[0]);let t=9*60;busy.concat([[17*60,17*60]]).forEach(([a,b])=>{if(a-t>=90)out.push({d,start:t,len:Math.min(a-t,180)});t=Math.max(t,b);});}return out;}
function sm2FocusRow(tk,aRow){if(!smOn('focus'))return;const wd=new Date().getDay();if(!(wd===0||(wd===6&&nowMin()>=12*60))||sm2Day('focus'))return;const nx=k(addD(weekStartOf(today()),7)),G=sm2FocusGaps(nx),tot=G.reduce((n,g)=>n+g.len,0);if(tot>=240||!G.length)return;
  const pick=G.slice().sort((a,b)=>b.len-a.len).slice(0,2);aRow(`Next week has ${fmtDurS(tot)} of deep-work time`,`Book two focus blocks? ${pick.map(g=>`${DOW[fromK(g.d).getDay()].slice(0,3)} ${fmtT(g.start)}`).join(' and ')}`,()=>{const made=pick.map(g=>create('block',{title:'Focus time',date:g.d,start:g.start,dur:Math.min(g.len,120),repeat:{type:'never'}}));sm2Mark('focus');App.refresh();toast(`${dCount(made.length,'focus block')} booked`,()=>{made.forEach(b=>remove(b.id,{hard:true,silent:true}));App.refresh();},'Undo',{force:true});});}

/* ---------- 10 · catch duplicates ---------- */
function sm2Dupe(r){if(!r||r.kind!=='task'||r.example||App.state.loading||get.settings().sm2Dupes===false)return;if(smCreates.filter(x=>Date.now()-x<700).length>1)return;const o=get.all('task').find(t=>t.id!==r.id&&isOpenTask(t)&&normT(t.title)===normT(r.title)||t.id!==r.id&&isOpenTask(t)&&simT(t.title,r.title)>=0.9);if(!o)return;
  setTimeout(()=>toast(`Already ${o.date?`on ${sm2Rel(o.date)}`:'on your list'}: ${o.title}`,()=>{remove(r.id,{silent:true});App.refresh();taskSheet(o);},'Open that one',{force:true}),650);}

/* ---------- 11 · meeting prep from your notes ---------- */
function sm2Prep(tk,extras){if(!smOn('prep'))return;const now=nowMin();let P=[];try{P=entries('Relationships','people');}catch(e){}if(!P.length)return;
  const e=dayItems(tk).timed.filter(x=>x.kind!=='task'&&x.kind!=='habit'&&!x.done&&x.time>now&&x.time-now<=30).sort((a,b)=>a.time-b.time)[0];if(!e)return;
  const x=P.find(p=>{const f=String(p.f.what||'').trim().split(/\s+/)[0];return f.length>=3&&new RegExp(`\\b${f.replace(/[.*+?^${}()|[\]\\]/g,'')}\\b`,'i').test(e.title);});if(!x)return;
  const topics=String(x.f.topics||'').split('\n').map(s=>s.trim()).filter(Boolean),last=(x.f.touch||[]).slice(-1)[0];if(!topics.length&&!last)return;
  extras.unshift(el('section',{class:'card prepcard',role:'status'},el('div',{class:'bl'},el('span',{class:'lbl'},`${e.title} in ${fmtDurS(e.time-now)}`)),topics.length?el('p',{class:'small',style:'margin:var(--nudge) 0 0'},el('b',{style:'font-weight:500'},'You wanted to raise: '),topics.slice(0,3).join(' · ')):null,last?Caption(`Last time (${sm2Rel(last.d)}): ${last.t}`,{as:'p',style:'margin:var(--nudge) 0 0'}):null,Button('Open notes',{variant:'link',size:'sm',onclick:()=>App.go('tool',{hub:'Relationships',tool:'people'})})));}

/* ---------- 13 · targets that fit, and 14 · stack habits you already pair ---------- */
function sm2HabitFit(h){if(h.paused||h.everyN||h.track==='count'||h.track==='time')return null;const tgt=habitWeekly(h)?(h.target||1):(h.days&&h.days.length?h.days.length:7);const w0=weekStartOf(today()),wk=i=>k(addD(w0,-7*i)),got=i=>habitWeek(h,wk(i));
  const age=daysBetween(habitStart(h),todayK());if(age<21)return null;const r3=[1,2,3].map(got).reduce((n,x)=>n+x,0)/(3*tgt);
  if(r3<0.4&&tgt>1){const to=Math.max(1,Math.round(r3*tgt*1.3)||1);return{dir:'down',to:Math.min(to,tgt-1),rate:Math.round(r3*100),tgt};}
  if(tgt<7&&[1,2,3,4,5,6].every(i=>got(i)>=tgt))return{dir:'up',to:tgt+1,tgt};return null;}
function sm2HabitFitCard(h){const f=sm2HabitFit(h),no=(get.settings().sm2FitNo||{})[h.id];if(!f||(no&&daysBetween(no,todayK())<28))return null;
  const apply=()=>{const c=clone(h);h.days=[];h.target=f.to;h.howOften='times';put(h);toast(`${h.title}: ${f.to===1?'once':`${f.to} times`} a week`,()=>{put(c);App.refresh();},'Undo',{force:true});App.refresh();};
  return el('div',{class:'stghost smfit'},el('span',{class:'grow'},el('b',{},f.dir==='down'?`${f.rate}% over the last 3 weeks`:`Every week for 6 weeks`),el('small',{},f.dir==='down'?`Try ${f.to===1?'once':`${f.to} times`} a week? Easier to keep, and you can raise it later.`:`Step up to ${f.to} times a week?`)),Button(f.dir==='down'?`Make it ${f.to} a week`:`Go to ${f.to}`,{variant:'secondary',size:'sm',onclick:apply}),Button('Keep it',{variant:'link',size:'sm',onclick:()=>{setSettings({sm2FitNo:Object.assign({},get.settings().sm2FitNo||{},{[h.id]:todayK()})});App.refresh();}}));}
function sm2Pairs(){const hs=get.all('habit').filter(h=>!h.paused&&!h.stack),tk=todayK(),days=[...Array(28)].map((_,i)=>addK(tk,-i-1)),out=[];
  for(let i=0;i<hs.length;i++)for(let j=0;j<hs.length;j++){if(i===j)continue;const a=hs[i],b=hs[j];const da=days.filter(d=>habitDone(a,d)),both=da.filter(d=>habitDone(b,d)),notA=days.filter(d=>!habitDone(a,d)&&(habitWeekly(a)||occursHabit(a,d))),bNotA=notA.filter(d=>habitDone(b,d));/* they go together: b follows a, and mostly doesn't happen without it */if(da.length>=8&&da.length<=24&&notA.length>=4&&both.length/da.length>=0.8&&bNotA.length/notA.length<=0.3){const at=Object.assign({},a.logT,a.at),bt=Object.assign({},b.logT,b.at);const order=both.filter(d=>at[d]!=null&&bt[d]!=null);const after=order.length>=3?order.filter(d=>bt[d]>at[d]).length/order.length>=0.7:j>i;if(after)out.push({first:a,then:b,n:both.length});}}
  const no=get.settings().sm2PairNo||[];return out.filter(p=>!no.includes(p.first.id+'>'+p.then.id)).sort((x,y)=>y.n-x.n);}
function sm2PairCard(){const p=sm2Pairs()[0];if(!p)return null;return el('div',{class:'stghost smfit'},el('span',{class:'grow'},el('b',{},`You usually ${p.then.title} on days you ${p.first.title}`),el('small',{},`Link them? ${p.then.title} shows up when ${p.first.title} is done.`)),Button('Link them',{variant:'secondary',size:'sm',onclick:()=>{const c=clone(p.then);p.then.stack=p.first.id;put(p.then);toast(`${p.then.title} now follows ${p.first.title}`,()=>{put(c);App.refresh();},'Undo',{force:true});App.refresh();}}),Button('No thanks',{variant:'link',size:'sm',onclick:()=>{setSettings({sm2PairNo:[...(get.settings().sm2PairNo||[]),p.first.id+'>'+p.then.id]});App.refresh();}}));}

/* ---------- 15 · reminders at your real time, and 16 · an evening save ---------- */
const sm2UsualAt=h=>{const L=Object.entries(Object.assign({},h.logT,h.at)).sort((a,b)=>a[0]<b[0]?1:-1).slice(0,14).map(x=>+x[1]).filter(v=>v>=0);return L.length>=4?sm2Med(L):null;};
function sm2HabitRems(push){const tk=todayK();get.all('habit').filter(h=>h.remSmart&&!h.paused).forEach(h=>{const u=sm2UsualAt(h);if(u==null)return;for(let i=0;i<7;i++){const dk=addK(tk,i);if(!occursHabit(h,dk)||habitDone(h,dk))continue;push({kind:'habit',id:h.id+'-smart',rec:h,title:h.title},dk,fromK(dk).getTime()+Math.max(0,u-10)*6e4,0);}});}
function sm2SaveRow(tk,aRow){if(!smOn('save'))return;const now=nowMin();if(now<15*60)return;const no=get.settings().sm2SaveNo;const L=get.all('habit').filter(h=>!h.paused&&occursHabit(h,tk)&&!habitDone(h,tk)&&!(h.skips||{})[tk]&&no!==tk+h.id).map(h=>({h,u:sm2UsualAt(h),s:habitStreak(h)})).filter(x=>x.u!=null&&now>x.u+30&&x.s.n>=2).sort((a,b)=>b.s.n-a.s.n);if(!L.length)return;const{h,u,s}=L[0];
  aRow(`${h.title} is still open`,`You usually do it by ${fmtT(Math.round(u/15)*15)}. A few minutes keeps your ${s.n}-${s.unit==='week'?'week':'day'} streak.`,()=>{toggleItem({kind:'habit',id:h.id,rec:h},tk);buzz(10);App.refresh();toast(`${h.title} done`,()=>{toggleItem({kind:'habit',id:h.id,rec:h},tk);App.refresh();},'Undo',{force:true});});}

/* ---------- 18 · link the habits that move a goal, and 19 · past-due milestones ---------- */
function sm2GoalLinks(g){if(g.finished)return[];const L=linkedOf(g);if(L.habits.length)return[];const gw=new Set((normT(g.title).match(/[a-z]{4,}/g)||[]));const no=g.sm2LinkNo||[];
  return get.all('habit').filter(h=>!h.paused&&!h.part&&!no.includes(h.id)&&(h.area&&h.area===g.area)).map(h=>({h,score:(normT(h.title).match(/[a-z]{4,}/g)||[]).filter(w=>gw.has(w)).length+(/run|race|marathon|5k|10k/i.test(g.title)&&/workout|run|exercise|gym/i.test(h.title)?2:0)+(/save|fund|money|debt|loan/i.test(g.title)&&/budget|spend|save/i.test(h.title)?2:0)})).filter(x=>x.score>=1).sort((a,b)=>b.score-a.score).map(x=>x.h).slice(0,1);}
function sm2GoalCards(g){const out=[];sm2GoalLinks(g).forEach(h=>out.push(el('div',{class:'stghost smfit'},el('span',{class:'grow'},el('b',{},`${h.title} looks like it moves this goal`),el('small',{},'Link them so every check-in shows here')),Button('Link',{variant:'secondary',size:'sm',onclick:()=>{const c=clone(h);h.part=g.id;put(h);toast(`${h.title} linked`,()=>{put(c);App.refresh();},'Undo',{force:true});App.refresh();}}),Button('Not related',{variant:'link',size:'sm',onclick:()=>{g.sm2LinkNo=[...(g.sm2LinkNo||[]),h.id];put(g);}}))));
  sm2PastSteps(g).slice(0,1).forEach(s=>out.push(sm2PastCard(g,s)));return out;}
const sm2PastSteps=g=>(g.steps||[]).filter(s=>!s.d&&s.date&&s.date<todayK()&&s.askedOn!==todayK());
function sm2PastCard(g,s){return el('div',{class:'stghost smfit'},el('span',{class:'grow'},el('b',{},`Did you ${s.t.charAt(0).toLowerCase()+s.t.slice(1)}?`),el('small',{},`It was planned for ${sm2Rel(s.date)} · ${g.title}`)),
  Button('Yes, tick it',{variant:'secondary',size:'sm',onclick:()=>{s.d=true;s.doneAt=Date.now();put(g);toast(`${s.t} done`,()=>{s.d=false;s.doneAt=null;put(g);App.refresh();},'Undo',{force:true});App.refresh();}}),
  Button('Not yet',{variant:'link',size:'sm',onclick:()=>{s.askedOn=todayK();s.date=null;put(g);App.refresh();}}),Button('Move it',{variant:'link',size:'sm',onclick:()=>msDateSheet(g,s)}));}
function sm2PastRow(tk,aRow){const g=get.all('goal').find(g=>!g.finished&&!g.paused&&sm2PastSteps(g).length);if(!g)return;const s=sm2PastSteps(g)[0];aRow(`Did you ${s.t.charAt(0).toLowerCase()+s.t.slice(1)}?`,`Planned for ${sm2Rel(s.date)} · ${g.title}`,()=>App.go('plan',{id:g.id}));}

/* ---------- 20 · receipts read themselves ---------- */
function sm2ReceiptPick(){const inp=el('input',{type:'file',accept:'image/*',capture:'environment',style:'display:none'});document.body.append(inp);inp.onchange=()=>{const f=inp.files&&inp.files[0];inp.remove();if(!f)return;const rd=new FileReader();rd.onload=()=>sm2Receipt(String(rd.result));rd.readAsDataURL(f);};inp.click();}
async function sm2Receipt(url){let inst,D=null;const draw=b=>{b.replaceChildren();if(!D){smBusy(b,'Reading the receipt…');return;}
    b.append(el('div',{class:'photo',style:`background-image:url("${url}");height:140px;border-radius:var(--r-row);background-size:cover;background-position:center;margin-bottom:var(--s3)`}),el('div',{class:'list'},Row({as:'div'},el('span',{class:'grow'},el('b',{style:'font-weight:500'},D.what||'Receipt'),el('small',{},[D.cat,relDay(D.date)].filter(Boolean).join(' · '))),el('b',{class:'tnum'},money(D.amount)))));};
  inst=openSheet({title:'Receipt',left:{label:'Cancel'},right:{label:'Add to Spending',onclick:()=>{if(!D)return;inst.close();try{setToolOn('Finances','spending',true);}catch(e){}const r=create('entry',{hub:'Finances',tool:'spending',f:{what:D.what||'Receipt',amount:+D.amount||0,cat:D.cat||'',date:D.date||todayK(),tax:''},photos:[{url}]});toast(`${money(D.amount)} added to Spending`,()=>{remove(r.id,{hard:true,silent:true});App.refresh();},'Undo',{force:true});}},build:b=>draw(b)});
  const cats=(typeof SPEND_CATS==='function'?SPEND_CATS():SPEND_CATS)||[];const j=await smAsk(`Read this receipt. Reply as JSON: {"what":"store name","amount":total as a number,"date":"YYYY-MM-DD or empty","cat":"one of: ${[].concat(cats).join(', ')}"}`,{images:[url]});
  if(!j){inst.close();return;}D={what:String(j.what||'').slice(0,60),amount:+j.amount||0,date:/^\d{4}-\d\d-\d\d$/.test(j.date||'')?j.date:todayK(),cat:[].concat(cats).includes(j.cat)?j.cat:''};draw(inst.body);}

/* ---------- 21 · one sentence, several items ---------- */
const SM2_VERB='buy|get|call|book|email|text|pick up|pay|schedule|send|order|make|fix|ask|return|renew|cancel|clean|cook|plan|write|read|check|drop off|mail';
function sm2Split(v){const s=String(v||'').trim();if(s.length<12||/https?:\/\//i.test(s))return null;const re=new RegExp(`\\s*(?:,\\s*(?:and\\s+)?|;\\s*|\\s+and\\s+(?=(?:${SM2_VERB})\\b)|\\s+then\\s+)`,'i');const parts=s.split(re).map(x=>x.trim()).filter(Boolean);
  if(parts.length<2||parts.length>6)return null;if(!parts.every(p=>new RegExp(`^(${SM2_VERB})\\b`,'i').test(p)||p.split(/\s+/).length<=3))return null;if(!new RegExp(`^(${SM2_VERB})\\b`,'i').test(parts[0]))return null;
  /* "buy milk, eggs and bread": the verb carries over to bare items */const v0=(parts[0].match(new RegExp(`^(${SM2_VERB})\\b`,'i'))||[])[0];return parts.map(p=>new RegExp(`^(${SM2_VERB})\\b`,'i').test(p)?p:`${v0} ${p}`).map(p=>p.charAt(0).toUpperCase()+p.slice(1));}

/* ---------- 22 · links that file themselves ---------- */
function sm2LinkHome(i){const all=`${i.title||''} ${i.notes||''} ${i.lt||''} ${i.lsite||''}`;if(!URL_RE.test(all))return null;const low=all.toLowerCase();
  const kind=/recipe|allrecipes|cooking|food52|seriouseats|bonappetit|epicurious|budgetbytes|smittenkitchen/.test(low)?'meals':/amazon\.|etsy\.|target\.com|walmart\.|bestbuy|wayfair|uncommongoods|\/product|\/dp\//.test(low)?'gifts':/youtube\.|vimeo|spotify|podcast|netflix|hulu|imdb/.test(low)?'queue':/medium\.com|substack|nytimes|theatlantic|newyorker|wired\.|hbr\.org|article|blog|\/20\d\d\//.test(low)?'reading':null;
  if(!kind)return null;for(const hub of Object.keys(HUBS)){if(!(get.settings().areas||AREAS).includes(hub))continue;const tl=toolsOf(hub).find(x=>x.id===kind&&!hubHidden(hub).includes(x.id));if(tl)return{hub,tool:tl,label:kind==='queue'?'Watch & listen':tl.name,icon:tl.icon||'grid',title:i.lt||ideaTitle(i),f:null};}return null;}

/* ---------- 23 · bills that look off, and 24 · spending pace ---------- */
function sm2BillOff(){let L=[];try{L=billDays();}catch(e){return null;}const tk=todayK(),no=get.settings().sm2BillNo||{};for(const o of L){if(daysBetween(tk,o.d)>10)continue;const x=o.x,amt=+x.f.amount||0;if(!amt||no[x.id]===o.d)continue;
  const name=normT(x.f.what||'');let H=(x.f.amtH||[]).map(Number).filter(Boolean);try{H=H.concat(entries('Finances','spending').filter(e=>name&&simT(e.f.what||'',x.f.what||'')>=0.6).map(e=>+e.f.amount).filter(Boolean));}catch(e){}
  if(H.length<2)continue;const m=sm2Med(H);if(m&&amt>m*1.3&&amt-m>=10)return{x,d:o.d,amt,m};}return null;}
function sm2BillRow(tk,aRow){if(!smOn('bills'))return;const b=sm2BillOff();if(!b)return;aRow(`${b.x.f.what}: ${money0(b.amt)}`,`Usually about ${money0(b.m)}. Worth a look before ${sm2Rel(b.d)}.`,()=>{let inst;inst=openSheet({title:b.x.f.what,left:{label:'Close'},build:bd=>bd.append(Caption(`This bill is ${money0(b.amt)}. It’s usually about ${money0(b.m)}.`,{as:'p',style:'padding:0 var(--s1) var(--s3)'}),Button('Open the bill',{variant:'secondary',full:true,onclick:()=>{inst.close();App.go('tool',{hub:'Finances',tool:'bills'});}}),Button('It’s right',{variant:'text',full:true,onclick:()=>{setSettings({sm2BillNo:Object.assign({},get.settings().sm2BillNo||{},{[b.x.id]:b.d})});inst.close();App.refresh();}}))});});}
function sm2Pace(){let L=[];try{L=entries('Finances','spending');}catch(e){return null;}const t=today(),day=t.getDate(),dim=new Date(t.getFullYear(),t.getMonth()+1,0).getDate();if(day<8||day>dim-3)return null;const ym=k(t).slice(0,7),by={},prev={};
  L.forEach(x=>{const d=x.f.date||'',c=catOf(x),a=+x.f.amount||0;if(!a)return;if(d.startsWith(ym))by[c]=(by[c]||0)+a;else{for(let i=1;i<=3;i++){const p=k(new Date(t.getFullYear(),t.getMonth()-i,1)).slice(0,7);if(d.startsWith(p))prev[c]=(prev[c]||0)+a/3;}}});
  const out=Object.keys(by).map(c=>{const u=prev[c]||0,proj=by[c]/day*dim;return{c,spent:by[c],usual:u,over:proj-u,left:dim-day};}).filter(x=>x.usual>=50&&x.over>=Math.max(40,x.usual*0.25)).sort((a,b)=>b.over-a.over);return out[0]||null;}
function sm2PaceRow(tk,aRow){if(!smOn('pace')||get.settings().sm2PaceNo===k(today()).slice(0,7))return;const p=sm2Pace();if(!p)return;aRow(`${p.c}: ${money0(p.spent)} so far`,`Usually about ${money0(p.usual)} a month. At this pace, about ${money0(p.over)} over · ${dCount(p.left,'day')} left`,()=>{setSettings({sm2PaceNo:k(today()).slice(0,7)});App.go('tool',{hub:'Finances',tool:'spending'});});}

/* ---------- 25 · chores spread across the week ---------- */
function sm2ChorePlan(tk){let L=[];try{L=ofType('Home','chores','').filter(x=>+x.f.every);}catch(e){return null;}const days={};L.forEach(x=>{let d=choreNext(x,tk).d;const ev=+x.f.every;for(;d<=addK(tk,6);d=addK(d,ev)){if(d>=tk)(days[d]=days[d]||[]).push(x);if(ev<1)break;}});
  const heavy=Object.keys(days).sort().find(d=>days[d].length>2);if(!heavy)return null;const moves=[];const load=d=>(days[d]||[]).length+moves.filter(m=>m.to===d).length-moves.filter(m=>m.from===d).length;
  days[heavy].filter(x=>+x.f.every>=4).slice(2).forEach(x=>{for(const off of [1,-1,2,-2,3]){const d=addK(heavy,off);if(d<tk)continue;if(load(d)<2){moves.push({x,from:heavy,to:d,off});break;}}});return moves.length?{heavy,n:days[heavy].length,moves}:null;}
function sm2ChoreRow(tk,aRow){if(!smOn('chores'))return;const p=sm2ChorePlan(tk);if(!p)return;aRow(`${p.n} chores land on ${relDay(p.heavy)}`,`Spread them so no day has more than two: ${p.moves.map(m=>`${m.x.f.what} → ${DOW[fromK(m.to).getDay()].slice(0,3)}`).join(', ')}`,()=>{p.moves.forEach(m=>{const old=m.x.f.last;m.x.f.last=addK(m.x.f.last||addK(m.from,-(+m.x.f.every)),m.off);autoLog(`Moved ${m.x.f.what} to ${sm2Rel(m.to)}`,'Spread chores',m.x.id,{f:clone(Object.assign({},m.x.f,{last:old}))});put(m.x,{silent:true});});App.refresh();toast('Chores spread across the week');});}

/* ---------- 26 · what sleep does for your day ---------- */
function sm2Sleep(){let L=[];try{L=entries('Health','checkin').filter(x=>+x.f.sleep>0&&x.f.date);}catch(e){return null;}if(L.length<14)return null;const doneOn={};get.all('task',{archived:true}).forEach(t=>Object.keys(t.doneDates||{}).forEach(d=>{doneOn[d]=(doneOn[d]||0)+1;}));
  const hi=L.filter(x=>+x.f.sleep>=7).map(x=>doneOn[x.f.date]||0),lo=L.filter(x=>+x.f.sleep<7).map(x=>doneOn[x.f.date]||0);if(hi.length<5||lo.length<5)return null;const av=a=>a.reduce((n,x)=>n+x,0)/a.length,A=av(hi),B=av(lo);if(!B||A<=B*1.1)return null;
  const pct=Math.round((A/B-1)*100);return{pct,n:L.length,line:pct>=30&&pct<=40?'about a third more':`about ${pct}% more`};}
function sm2SleepCard(){const s=sm2Sleep();if(!s)return null;return Card({title:'Sleep and your days',as:'div'},el('div',{class:'serif',style:'font-size:var(--fs-title);margin:var(--s1) 0'},`After 7 or more hours of sleep you finish ${s.line}.`),Caption(`From ${s.n} days of check-ins.`,{as:'p',style:'margin:0'}));}

/* ---------- 27 · groceries from your meal plan ---------- */
function sm2MealNeeds(tk){let M=[],R=[];try{M=entries('Health','meals').filter(x=>x.f.t!=='recipe'&&x.f.date>=tk&&x.f.date<=addK(tk,7));R=ofType('Health','meals','recipe');}catch(e){return null;}if(!M.length)return null;const l=get.all('list').find(x=>/grocer/i.test(x.title));if(!l)return null;
  const have=new Set((l.items||[]).filter(i=>!i.d).map(i=>normT(i.t)));let pan=[];try{pan=pantryLive().map(x=>normT(x.f.what||''));}catch(e){}const need=[],meals=[];
  M.forEach(m=>{const r=R.find(r=>simT(r.f.what||'',m.f.what||'')>=0.7);if(!r)return;meals.push(m.f.what);String(r.f.ing||'').split('\n').map(s=>s.trim()).filter(Boolean).forEach(s=>{const n=normT(s.replace(/^[\d½¼¾\/.\s]+(cups?|tbsp|tsp|lbs?|oz|g|kg|cloves?|cans?)?\s*/i,''));if(n&&!have.has(n)&&!pan.includes(n)&&!need.some(x=>normT(x)===n))need.push(s.replace(/^[\d½¼¾\/.\s]+(cups?|tbsp|tsp|lbs?|oz|g|kg|cloves?|cans?)?\s*/i,'')||s);});});
  return need.length?{l,need,meals:[...new Set(meals)]}:null;}
function sm2MealRow(tk,aRow){if(!smOn('meals')||sm2Day('meals'))return;const m=sm2MealNeeds(tk);if(!m)return;aRow(`${dCount(m.meals.length,'meal')} planned this week`,`${dCount(m.need.length,'ingredient')} aren’t on ${m.l.title} yet: ${m.need.slice(0,3).join(', ')}${m.need.length>3?'…':''}`,()=>{const c=clone(m.l.items||[]);m.need.forEach(t=>listPush(m.l,t,'',listSecGuess(m.l,t)));put(m.l);sm2Mark('meals');App.refresh();toast(`${m.need.length} added to ${m.l.title}`,()=>{m.l.items=c;put(m.l);App.refresh();},'Undo',{force:true});});}

/* ---------- 29 · the review writes its first draft (Claude) ---------- */
async function sm2ReviewDraft(R,a,b,after){const st=weekStats(a,b),wins=draftWins(a,b),blocks=draftBlocks(a,b);const done=[];get.all('task',{archived:true}).forEach(t=>Object.keys(t.doneDates||{}).forEach(d=>{if(d>=a&&d<=b)done.push(t.title);}));
  const j=await smAsk(`Write a short first draft of a weekly review in plain, warm, first-person sentences (no lists, no headings). Week ${a} to ${b}. Finished ${st.done} things, ${st.open} left open, ${st.habit} habit sessions. Things finished: ${[...new Set(done)].slice(0,15).join('; ')}. Kept moving: ${blocks||'nothing notable'}. JSON: {"wins":"2-3 sentences","blocks":"1-2 sentences"}`);
  if(!j)return;R.wins=String(j.wins||wins||'').trim();R.blocks=String(j.blocks||blocks||'').trim();after&&after();}

/* ---------- 30 · what keeps slipping ---------- */
function sm2Slips(){const by={},tot={};get.all('task',{archived:true}).forEach(t=>{const a=t.area||areaOfTask(t)||null;if(!a)return;const recent=(t.updatedAt||0)>Date.now()-35*864e5;if(!recent)return;tot[a]=(tot[a]||0)+1;if((t.slips||0)>=1)by[a]=(by[a]||0)+1;});
  const A=Object.keys(by).filter(a=>by[a]>=3).sort((x,y)=>by[y]/tot[y]-by[x]/tot[x])[0];return A?{a:A,n:by[A],of:tot[A]}:null;}
function sm2SlipCard(){const s=sm2Slips();if(!s)return null;return Card({title:'What slips',as:'div'},el('div',{class:'serif',style:'font-size:var(--fs-title);margin:var(--s1) 0'},`${s.a} tasks slip most: ${s.n} of ${s.of} moved this month.`),Caption('Try a fixed slot for them, like Saturday at 10.',{as:'p',style:'margin:0 0 var(--s2)'}),Button(`Add a weekly ${s.a} slot`,{variant:'link',size:'sm',onclick:()=>{const d0=today(),sat=k(addD(d0,(6-d0.getDay()+7)%7||7));const r=create('block',{title:`${s.a} time`,date:sat,start:600,dur:60,area:s.a,repeat:{type:'weekly',end:null}});toast(`${s.a} time · Saturdays at 10`,()=>{remove(r.id,{hard:true,silent:true});App.refresh();},'Undo',{force:true});}}));}

/* ---------- hooks ---------- */
/* put(): habit check-in times, and bill amount history */
function sm2Put(prev,r){if(!r)return;try{if(r.kind==='habit'){const tk=todayK(),p=prev?JSON.parse(prev):null,was=p&&p.logs&&p.logs[tk],now=r.logs&&r.logs[tk];if(now&&!was){r.at=Object.assign({},r.at);r.at[tk]=nowMin();const ks=Object.keys(r.at).sort();if(ks.length>40)ks.slice(0,ks.length-40).forEach(x=>delete r.at[x]);}}
  if(r.kind==='entry'&&r.hub==='Finances'&&r.tool==='bills'&&prev){const p=JSON.parse(prev);const a0=+((p.f||{}).amount),a1=+((r.f||{}).amount);if(a0&&a1&&a0!==a1)r.f.amtH=[...(r.f.amtH||[]),a0].slice(-12);}}catch(e){}}
/* Today: every row lives in Suggestions */
function smart2TodayRows(dk,aRow,extras){const tk=todayK();if(dk!==tk)return;[()=>sm2Prep(tk,extras),()=>sm2BestRow(tk,aRow),()=>sm2RiskRow(tk,aRow),()=>sm2MovedRow(tk,aRow),()=>sm2BigRow(tk,aRow),()=>sm2SaveRow(tk,aRow),()=>sm2PastRow(tk,aRow),()=>sm2PlaceRow(tk,aRow),()=>sm2FocusRow(tk,aRow),()=>sm2BillRow(tk,aRow),()=>sm2PaceRow(tk,aRow),()=>sm2ChoreRow(tk,aRow),()=>sm2MealRow(tk,aRow),()=>cxTodayRows(tk,aRow)].forEach(f=>{try{f();}catch(e){console.warn(e);}});}

/* Settings › Smart: the helpers that act when you tick, type or add */
function sm2Settings(group,ctx,s){const g=group('Helpers');[['sm2Follow','Follow-ups','Ticking “Ask Jordan…” offers a follow-up in three days'],['sm2Next','What’s next on a project','When its last task is done'],['sm2Dupes','Catch duplicates','When you add a task you already have'],['sm2Split','One sentence, several ideas','“Buy milk and call Mom” saves as two']].forEach(([k2,l,sub])=>setToggle(ctx,g,null,l,sub,s[k2]!==false,v=>setSettings({[k2]:v})));}
SET_INDEX.push(['Follow-ups','smart'],['Catch duplicates','smart'],['One sentence, several ideas','smart'],['What’s next on a project','smart']);
