/* ---------- v315 · Rewards: one engine behind the day ring, Done, personal bests, streak freezes,
   area levels, badges, earned palettes and the idea garden. Everything is worked out from records you
   already keep; the one 'rewards' record only remembers what was earned and what's been shown. ---------- */
const RW_KEYS=[['rwRing','Day ring','A ring beside the date fills as today gets done'],['rwBests','Personal bests','A note when you beat your own record'],['rwStreaks','Streaks on habit cards','Days or weeks in a row, under each habit'],['rwFreeze','Streak freezes','Earn one every 7 days or 4 weeks in a row. Use it to cover a miss.'],['rwScore','Weekly score','Your week in one number at the start of the weekly review'],['rwLevels','Area levels','Life areas level up as you make progress'],['rwBadges','Badges','For planning ahead, closing loops and coming back'],['rwGarden','Idea garden','Ideas you turn into plans grow in your Inbox'],['rwForecast','Tomorrow forecast','A light, steady or full read on the Plan tomorrow card']];
const rwOn=key=>{const s=get.settings();return s.rwOn!==false&&(!key||s[key]!==false);};
const RW_FRZ_MAX=2;
function rwRec(){const r=get.id('rewards')||{id:'rewards',kind:'rewards'};
  r.bests=r.bests||{};r.badges=r.badges||{};r.seen=r.seen||{};r.frz=Object.assign({n:0,got:{},asked:{},used:0},r.frz);r.levels=r.levels||{};r.planted=r.planted||[];r.full=r.full||{};return r;}
/* history long enough for records to mean something: two weeks */
function rwSeasoned(){let t=null;try{t=rvFirstActive();}catch(e){}return !!t&&daysBetween(k(t),todayK())>=14;}

/* ---------- the day ring: what's due today, split into priorities, tasks and habits ---------- */
function rwDay(dk){
  const s=get.settings(),t3=s.top3On===false?[]:t3Get(dk).map(x=>t3Entry(x,dk)).filter(Boolean),ids=new Set(t3.map(x=>x.id)),d=dayItems(dk),seen=new Set();
  let tD=0,tN=0,hD=0,hN=0;
  [...d.timed,...d.anytime].forEach(e=>{if(ids.has(e.id)||seen.has(e.kind+e.id))return;seen.add(e.kind+e.id);
    if(e.kind==='task'||e.kind==='step'){tN++;if(e.done)tD++;}else if(e.kind==='habit'||e.kind==='routine'){hN++;if(e.done)hD++;}});
  /* a times-a-week habit done today counts, even with no session planned */
  get.all('habit').forEach(h=>{if(ids.has(h.id)||seen.has('habit'+h.id))return;if(habitWeekly(h)&&!h.everyN&&habitDone(h,dk)){hN++;hD++;}});
  const pN=t3.length,pD=t3.filter(x=>x.done).length;
  return{p:[pD,pN],t:[tD,tN],h:[hD,hN],done:pD+tD+hD,total:pN+tN+hN};}
const RW_RING=['var(--accent-deep)','var(--accent)','var(--accent-mid)'];
function rwRingSvg(st,size=40){const r=size/2-5,C=2*Math.PI*r,T=Math.max(st.total,1);let off=0;
  const segs=[st.p[0],st.t[0],st.h[0]].map((n,i)=>{const len=n/T*C,o=off;off+=len;return n?`<circle class="drs" cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="${RW_RING[i]}" stroke-width="5" stroke-dasharray="${len.toFixed(2)} ${C.toFixed(2)}" stroke-dashoffset="${(-o).toFixed(2)}"/>`:'';}).join('');
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="transform:rotate(-90deg)" aria-hidden="true"><circle cx="${size/2}" cy="${size/2}" r="${r}" fill="none" stroke="var(--line)" stroke-width="5"/>${segs}</svg>`;}
function rwRing(dk){if(!rwOn('rwRing'))return null;const st=rwDay(dk);if(!st.total)return null;const pc=Math.round(st.done/st.total*100);
  const b=el('button',{class:'dring'+(st.done===st.total?' full':''),'aria-label':`Today so far: ${pc}%`,onclick:()=>rwRingSheet(dk),html:rwRingSvg(st)});
  const was=App.state._ringPc;App.state._ringPc=pc;
  if(was!=null&&was<pc&&pc===100&&motionOK())requestAnimationFrame(()=>b.classList.add('glow'));
  return b;}
/* after a check-off, the ring catches up in place */
function rwRingSync(){const n=document.querySelector('.dring');if(!n||App.state.view!=='today')return;const dk=App.state.sel;if(dk!==todayK())return;const st=rwDay(dk);if(!st.total){n.remove();return;}
  const pc=Math.round(st.done/st.total*100),was=App.state._ringPc;App.state._ringPc=pc;n.innerHTML=rwRingSvg(st);n.setAttribute('aria-label',`Today so far: ${pc}%`);n.classList.toggle('full',pc===100);
  if(pc===100&&was!=null&&was<100&&motionOK()){n.classList.remove('glow');void n.offsetWidth;n.classList.add('glow');buzz(14);}}
function rwRingSheet(dk){const st=rwDay(dk),pc=Math.round(st.done/Math.max(st.total,1)*100);let inst;
  const row=(c,l,[a,b])=>b?Row({as:'div'},el('span',{class:'rwkey',style:`background:${c}`}),el('span',{class:'grow'},l),el('b',{class:'tnum'},`${a} of ${b}`)):null;
  inst=openSheet({title:'Today so far',left:{label:'Close'},build:b=>{
    b.append(el('div',{class:'rwbig'},el('span',{class:'serif'},`${pc}%`),el('small',{},st.done===st.total?'Everything due today is done.':`${st.total-st.done} still to go`)),
      el('div',{class:'list'},row(RW_RING[0],'Priorities',st.p),row(RW_RING[1],'Tasks',st.t),row(RW_RING[2],'Habits',st.h)),
      Caption('Counts what’s due today. Anytime tasks count once you add them to today.',{as:'p',style:'padding:var(--s2) var(--s1) 0'}),
      Button('See what you’ve done',{variant:'link',style:'margin-top:var(--s2)',onclick:()=>{inst.close();App.go('done');}}));}});}

/* ---------- Done: everything you finished, newest first ---------- */
function rwDoneItems(a,b){const out=[],inR=d=>d>=a&&d<=b,at=v=>typeof v==='number'&&v>1e12?new Date(v):null;
  get.all('task',{archived:true,every:true}).forEach(t=>{const p=t.part&&get.id(t.part);Object.entries(t.doneDates||{}).forEach(([d,v])=>{if(inR(d))out.push({d,at:at(v),title:t.title,type:'Task',area:t.area||(p&&p.area),go:()=>taskSheet(t)});});});
  [...get.all('goal',{archived:true,every:true}),...get.all('project',{archived:true,every:true})].forEach(g=>(g.steps||[]).forEach(s=>{if(!s.d||!s.doneAt)return;const d=k(new Date(s.doneAt));if(inR(d))out.push({d,at:new Date(s.doneAt),title:s.t,type:`Step · ${g.title}`,area:g.area,go:()=>App.go('plan',{id:g.id})});}));
  get.all('habit',{archived:true,every:true}).forEach(h=>Object.keys(h.logs||{}).forEach(d=>{if(inR(d)&&habitDone(h,d)){const m=(h.logT||{})[d];const t=m!=null?fromK(d):null;if(t)t.setHours(Math.floor(m/60),m%60);out.push({d,at:t,title:h.title,type:'Habit',area:h.area,go:()=>App.go('habit',{id:h.id})});}}));
  get.all('routine',{archived:true,every:true}).forEach(r=>Object.entries(r.runs||{}).forEach(([d,v])=>{if(inR(d))out.push({d,at:at(v),title:r.title,type:'Routine',area:r.area,go:()=>App.go('routine',{id:r.id})});}));
  get.all('plan').forEach(p=>{if(!p.committed||!p.committedAt)return;const d=k(new Date(p.committedAt));if(inR(d)&&/^w-/.test(p.key||''))out.push({d,at:new Date(p.committedAt),title:`Planned the week of ${mdS(fromK(p.key.slice(2)))}`,type:'Studio',go:()=>App.go('studio')});});
  return out.sort((x,y)=>x.d<y.d?1:x.d>y.d?-1:((y.at?y.at.getTime():0)-(x.at?x.at.getTime():0)));}
function viewDone(root){const S=App.state,tk=todayK(),per=S.donePer||'week';
  const ws=k(weekStartOf(today())),rng=per==='week'?[ws,tk]:per==='month'?[k(new Date(today().getFullYear(),today().getMonth(),1)),tk]:[addK(tk,-89),tk];
  const prev=per==='week'?[addK(ws,-7),addK(tk,-7)]:per==='month'?(()=>{const d=today(),a=new Date(d.getFullYear(),d.getMonth()-1,1);const e=new Date(d.getFullYear(),d.getMonth()-1,Math.min(d.getDate(),new Date(d.getFullYear(),d.getMonth(),0).getDate()));return[k(a),k(e)];})():null;
  const items=rwDoneItems(rng[0],rng[1]),pn=prev?rwDoneItems(prev[0],prev[1]).length:null;
  const page=el('div',{class:'page'}),word=per==='week'?'this week':per==='month'?'this month':'in the last 90 days';
  const cmp=pn==null?'':items.length>pn?` · ${items.length-pn} more than last ${per}`:items.length<pn&&pn?` · ${pn} last ${per}`:'';
  page.append(pageHead('Done',`${items.length} ${word}${cmp}`,{back:'More',to:'more',icon:'check'}));
  page.append(el('div',{style:'margin-bottom:var(--s3)'},seg([['week','This week'],['month','Month'],['all','90 days']],per,v=>{S.donePer=v;App.refresh();})));
  if(!items.length){page.append(el('div',{class:'list'},emptyState(per==='week'?'Nothing finished yet this week':'Nothing finished yet','Tick off a task or check in a habit and it lands here.')));root.append(page);return;}
  const by=new Map();items.forEach(x=>{if(!by.has(x.d))by.set(x.d,[]);by.get(x.d).push(x);});
  let shown=0;for(const [d,l] of by){if(shown>=300)break;shown+=l.length;
    page.append(lblRow(d===tk?'Today':relDay(d),String(l.length)),el('div',{class:'list'},l.map(x=>Row({onclick:x.go,cls:'rwdone'},el('span',{class:'tickp on','aria-hidden':'true',html:ic('check',IC.xs)}),el('span',{class:'grow'},el('b',{style:'font-weight:500'},x.title),el('small',{},[x.type,x.area,x.at&&d===k(x.at)?fmtT(x.at.getHours()*60+x.at.getMinutes()):null].filter(Boolean).join(' · ')))))));}
  root.append(page);}

/* ---------- personal bests ---------- */
function rwBestNow(){const out={};
  {const by={};get.all('task',{archived:true,every:true}).forEach(t=>Object.keys(t.doneDates||{}).forEach(d=>{by[d]=(by[d]||0)+1;}));let v=0,d=null;for(const x in by)if(by[x]>v||(by[x]===v&&x>d)){v=by[x];d=x;}if(v)out.tasksDay={v,d};}
  try{const by={};entries('Health','workouts').forEach(x=>{if(x.f&&x.f.date){const w=weekKey(fromK(x.f.date));by[w]=(by[w]||0)+1;}});let v=0,d=null;for(const x in by)if(by[x]>v){v=by[x];d=x;}if(v)out.wkWorkouts={v,d};}catch(e){}
  {const days=Object.keys(get.settings().top3||{}).sort();let run=0,best=0,bd=null,last=null;days.forEach(d=>{if(!t3AllDone(d)){run=0;last=d;return;}run=last&&addK(last,1)===d&&run?run+1:1;last=d;if(run>best){best=run;bd=d;}});if(best)out.top3Run={v:best,d:bd};}
  {let v=0,d=null;get.all('review').forEach(r=>{const sc=rwScoreOf(r);if(sc!=null&&sc>v){v=sc;d=r.week||k(new Date(r.createdAt));}});if(v)out.weekScore={v,d};}
  get.all('habit').forEach(h=>{const s=habitStreak(h);if(s.n)out['streak:'+h.id]={v:s.n,d:todayK(),name:h.title,unit:s.unit};});
  return out;}
/* a record is news once: the day you pass a best set on another day (or in an earlier run), not every day a run keeps growing */
function rwBestFresh(key,nv,old){const tk=todayK();if(key.startsWith('streak:')){const h=get.id(key.slice(7));if(!h)return false;let start;if(nv.unit==='week')start=addK(k(weekStartOf(today())),-7*nv.v);else{let n=0,d=tk;start=tk;for(let i=0;i<800&&n<nv.v;i++){if(habitDone(h,d)){n++;start=d;}d=addK(d,-1);}}return old.d<start;}
  if(key==='top3Run')return old.d<addK(nv.d||tk,-(nv.v-1));if(key==='tasksDay')return old.d!==tk;if(key==='wkWorkouts')return old.d!==nv.d;return true;}
const RW_BEST_MIN={tasksDay:3,wkWorkouts:2,top3Run:3,weekScore:50};
function rwBestText(key,nv,old){const o=old?` · your best was ${old.v}`:'';
  if(key==='tasksDay')return `New record: ${nv.v} tasks in one day${o}`;if(key==='wkWorkouts')return `New record: ${nv.v} workouts in a week${o}`;
  if(key==='top3Run')return `New record: ${nv.v} days in a row with your Top 3 done${o}`;if(key==='weekScore')return `New record: ${nv.v}% of your week done${o}`;
  return `New record: ${nv.v}-${nv.unit} ${nv.name} streak${o}`;}
const RW_BEST_L={tasksDay:'Tasks in a day',wkWorkouts:'Workouts in a week',top3Run:'Top 3 days in a row',weekScore:'Best weekly score'};
function rwScoreOf(r){if(r.score!=null)return r.score;const s=r.stats;if((r.period||'week')!=='week'||!s||!s.planned)return null;return Math.round(Math.min(1,s.done/s.planned)*100);}

/* ---------- area levels ---------- */
function rwPoints(){const by={},cap={};const add=(a,n,d,c)=>{if(!a)return;if(c){const key=a+'|'+d;if((cap[key]||0)>=5)return;cap[key]=(cap[key]||0)+1;}by[a]=(by[a]||0)+n;};
  get.all('task',{archived:true,every:true}).forEach(t=>{const p=t.part&&get.id(t.part),a=t.area||(p&&p.area);Object.keys(t.doneDates||{}).forEach(d=>add(a,1,d));});
  [...get.all('goal',{archived:true,every:true}),...get.all('project',{archived:true,every:true})].forEach(g=>(g.steps||[]).forEach(s=>{if(s.d)add(g.area,3);}));
  get.all('habit',{archived:true,every:true}).forEach(h=>Object.keys(h.logs||{}).forEach(d=>{if(habitDone(h,d))add(h.area,1,d,true);}));
  get.all('entry').forEach(x=>{if(x.hub&&x.f&&x.f.date&&!isCfg(x))add(x.hub,1,x.f.date,true);});
  return by;}
function rwLevel(p){let lv=1,need=15,left=p||0;while(left>=need){left-=need;lv++;need=10+5*lv;}return{level:lv,into:left,need,points:p||0};}
/* where this month's points came from, for the area page */
function rwAreaMonth(a){const m0=k(new Date(today().getFullYear(),today().getMonth(),1)),r={tasks:0,steps:0,logs:0},cap={};const c=d=>{const key=d;if((cap[key]||0)>=5)return false;cap[key]=(cap[key]||0)+1;return true;};
  get.all('task',{archived:true,every:true}).forEach(t=>{const p=t.part&&get.id(t.part);if((t.area||(p&&p.area))!==a)return;Object.keys(t.doneDates||{}).forEach(d=>{if(d>=m0)r.tasks++;});});
  [...get.all('goal',{archived:true,every:true}),...get.all('project',{archived:true,every:true})].forEach(g=>{if(g.area!==a)return;(g.steps||[]).forEach(s=>{if(s.d&&s.doneAt&&k(new Date(s.doneAt))>=m0)r.steps+=3;});});
  get.all('habit',{archived:true,every:true}).forEach(h=>{if(h.area!==a)return;Object.keys(h.logs||{}).forEach(d=>{if(d>=m0&&habitDone(h,d)&&c(d))r.logs++;});});
  get.all('entry').forEach(x=>{if(x.hub===a&&x.f&&x.f.date>=m0&&!isCfg(x)&&c(x.f.date))r.logs++;});
  return r;}
function rwAreaCard(a){if(!rwOn('rwLevels'))return null;const L=rwLevel(rwPoints()[a]||0),m=rwAreaMonth(a),tot=m.tasks+m.steps+m.logs;
  const c=AREA_COLOR[a]||'var(--accent)';
  return el('div',{class:'rwlvl',style:`--ac:${c}`},
    el('div',{class:'rwlh'},el('span',{class:'rwlp'},`Level ${L.level}`),el('small',{},`${L.into} of ${L.need} points · ${L.need-L.into} to Level ${L.level+1}`)),
    el('div',{class:'rwxp',role:'progressbar','aria-valuemin':'0','aria-valuemax':String(L.need),'aria-valuenow':String(L.into),'aria-label':`Level ${L.level} progress`},el('i',{style:`width:${Math.round(L.into/L.need*100)}%`})),
    tot?el('small',{class:'rwlm'},`This month: +${tot}`+[m.steps?` · goal steps ${m.steps}`:'',m.tasks?` · tasks ${m.tasks}`:'',m.logs?` · check-ins and logs ${m.logs}`:''].join('')):null);}

/* ---------- badges ---------- */
const RW_BADGES=[
  ['plan1','First Studio plan','Commit a week, month or quarter in Studio','cal',c=>c.plans.length>=1],
  ['planner','Planner','Commit 4 weeks before they start','layers',c=>c.plans.filter(p=>/^w-/.test(p.key||'')&&k(new Date(p.committedAt||0))<p.key.slice(2)).length>=4,'moss'],
  ['inbox0','Inbox zero','Sort 5 ideas, then empty your Inbox','inbox',c=>c.sorted>=5&&!get.all('idea').length],
  ['nooverdue','Nothing overdue','Finish every task dated last week (5 or more)','check',c=>c.lastWeekClear,'harbor'],
  ['top3x5','Full Top 3 · 5 days','Five days in a row with your Top 3 done','target',c=>(c.bests.top3Run||{}).v>=5],
  ['early','Early start','Top 3 done before noon on 5 days','sun',c=>c.early>=5],
  ['fullday','Full day','Close the day ring','spark',c=>c.full>=1],
  ['fullday10','Ten full days','Close the day ring 10 times','spark',c=>c.full>=10],
  ['comeback','Comeback','Rebuild a habit to 3 in a row after it broke','rep',c=>c.comeback],
  ['streak30','30 days','A 30-day habit streak','flame',c=>c.streakD>=30],
  ['streak12w','12 weeks','A 12-week habit streak','flame',c=>c.streakW>=12],
  ['freeze','Saved it','Use a freeze to keep a streak','shield',c=>c.frzUsed>=1],
  ['tasks100','100 done','Finish 100 tasks','task',c=>c.tasks>=100],
  ['tasks1000','1,000 done','Finish 1,000 tasks','crown',c=>c.tasks>=1000],
  ['review1','First review','Finish a weekly review','clip',c=>c.reviews>=1],
  ['reviews10','10 reviews','Finish 10 reviews','books',c=>c.reviews>=10,'dusk'],
  ['week90','90% week','Get 90% of a week done','star',c=>(c.bests.weekScore||{}).v>=90],
  ['goal1','Goal reached','Achieve a goal','flag',c=>c.goals>=1],
  ['finisher','Finisher','Finish a project','project',c=>c.projects>=1],
  ['plant10','Gardener','Turn 10 ideas into plans','leaf',c=>c.planted>=10],
  ['level5','Level 5','Get a life area to Level 5','medal',c=>c.topLevel>=5],
  ['level10','Level 10','Get a life area to Level 10','medal',c=>c.topLevel>=10,'ember']];
function rwCtx(r,bests,levels){const tk=todayK(),ws=k(weekStartOf(today())),la=addK(ws,-7),lb=addK(ws,-1);
  const tasks=get.all('task',{archived:true,every:true});
  const lw=tasks.filter(t=>t.date&&t.date>=la&&t.date<=lb&&(!t.repeat||t.repeat.type==='never'));
  let early=0;Object.keys(get.settings().top3||{}).forEach(d=>{if(!t3AllDone(d))return;const ts=t3Get(d).map(x=>{const q=get.id(x.id);if(!q)return null;if(q.kind==='task'){const v=(q.doneDates||{})[d];return typeof v==='number'&&v>1e12?new Date(v):null;}if(q.kind==='habit'){const m=(q.logT||{})[d];return m!=null?m:null;}return null;});if(ts.length&&ts.every(x=>x!=null&&(typeof x==='number'?x<720:x.getHours()<12)))early++;});
  let streakD=0,streakW=0,comeback=false;get.all('habit',{archived:true}).forEach(h=>{const s=habitStreak(h),b=rwHabitBest(h);if(s.unit==='week')streakW=Math.max(streakW,b);else streakD=Math.max(streakD,b);if(b>s.n&&s.n>=3)comeback=true;});
  return{plans:get.all('plan').filter(p=>p.committed),sorted:get.all('trashed').filter(t=>t.rec&&t.rec.kind==='idea').length+r.planted.length,
    lastWeekClear:lw.length>=5&&lw.every(t=>isDone(t,t.date)),bests,early,full:Object.keys(r.full).length,comeback,streakD,streakW,frzUsed:r.frz.used||0,
    tasks:tasks.reduce((n,t)=>n+Object.keys(t.doneDates||{}).length,0),reviews:get.all('review').length,
    goals:get.all('goal',{archived:true,every:true}).filter(g=>g.finished).length,projects:get.all('project',{archived:true,every:true}).filter(p=>p.finished).length,
    planted:r.planted.length,topLevel:Math.max(1,...Object.values(levels))};}
/* the real best run for a habit; weekly habits used to report their current run as the best */
function rwHabitBest(h){if(!habitWeekly(h)||h.everyN)return habitBest(h);const t=h.target||1,st=habitStart(h),end=k(weekStartOf(today()));let d=k(weekStartOf(fromK(st))),run=0,best=0;
  for(let i=0;i<260&&d<=end;i++){const hit=habitWeek(h,d)>=t,fz=(h.wkFrz||{})[d];if(hit)run++;else if(!fz&&d!==end)run=0;best=Math.max(best,run);d=addK(d,7);}return Math.max(best,habitStreak(h).n);}

/* ---------- earned palettes ---------- */
var RW_PALS=[['moss','Moss','#55703F','olive','planner'],['harbor','Harbor','#2E6B7A','blue','nooverdue'],['dusk','Dusk','#5B4A85','plum','reviews10'],['ember','Ember','#A24E36','rose','level10']];

/* ---------- the idea garden ---------- */
const RW_PLANT={project:'tree',goal:'flower',habit:'grass',routine:'grass'};
function rwPlantCheck(idea){if(!rwOn())return;const now=Date.now(),kinds=['task','habit','goal','project','routine','block','allday','list'];let best=null;
  recs.forEach(x=>{if(kinds.includes(x.kind)&&x.createdAt&&now-x.createdAt<12000&&(!best||x.createdAt>best.createdAt))best=x;});
  if(!best)return;const r=rwRec();if(r.planted.some(p=>p.id===best.id))return;r.planted.push({id:best.id,t:RW_PLANT[best.kind]||'sprout',a:best.area||idea.area||null,d:todayK()});if(r.planted.length>400)r.planted=r.planted.slice(-400);put(r,{silent:true});}
function rwGarden(){if(!rwOn('rwGarden'))return null;const r=rwRec(),from=addK(todayK(),-90),l=r.planted.filter(p=>p.d>=from).slice(-30);if(!l.length)return null;
  const W=300,H=150,base=128,n=l.length,gap=(W-28)/Math.max(n,1);let svg=`<rect x="0" y="${base}" width="${W}" height="${H-base}" fill="var(--accent-pale)"/><path d="M0 ${base+2} Q${W*.25} ${base-8} ${W/2} ${base} T${W} ${base-2} V${base+10} H0z" fill="var(--accent-light)"/>`;
  l.forEach((p,i)=>{const x=14+gap*(i+.5),y=base+(i%2)*3,c=AREA_COLOR[p.a]||'var(--accent)';const fade=` style="opacity:${(.55+.45*(i+1)/n).toFixed(2)}"`;
    if(p.t==='tree')svg+=`<g${fade}><rect x="${x-2}" y="${y-30}" width="4" height="30" rx="2" fill="var(--a-home)"/><circle cx="${x}" cy="${y-40}" r="15" fill="${c}"/><circle cx="${x-7}" cy="${y-33}" r="8" fill="${c}" opacity=".8"/></g>`;
    else if(p.t==='flower')svg+=`<g${fade}><path d="M${x} ${y}V${y-28}" stroke="var(--accent)" stroke-width="2.5"/><ellipse cx="${x-6}" cy="${y-13}" rx="6" ry="3" fill="var(--accent-mid)" transform="rotate(-30 ${x-6} ${y-13})"/><circle cx="${x}" cy="${y-31}" r="6.5" fill="${c}"/><circle cx="${x}" cy="${y-31}" r="2.4" fill="var(--amber-mid)"/></g>`;
    else if(p.t==='grass')svg+=`<g${fade}><path d="M${x-7} ${y}q3-13 2-19M${x} ${y}q0-15 1-22M${x+7} ${y}q-2-11-4-17" stroke="var(--accent-mid)" stroke-width="2.5" fill="none" stroke-linecap="round"/></g>`;
    else svg+=`<g${fade}><path d="M${x} ${y}V${y-15}" stroke="var(--accent)" stroke-width="2.5"/><ellipse cx="${x-5}" cy="${y-15}" rx="6" ry="3" fill="var(--accent-mid)" transform="rotate(-30 ${x-5} ${y-15})"/><ellipse cx="${x+5}" cy="${y-18}" rx="6" ry="3" fill="var(--accent-mid)" transform="rotate(30 ${x+5} ${y-18})"/></g>`;});
  const pj=l.filter(p=>p.t==='tree').length;
  return Card({cls:'rwgarden'},el('div',{class:'rwgsvg',html:`<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Your idea garden: ${n} plants">${svg}</svg>`}),
    el('div',{class:'rwgcap'},el('b',{class:'serif'},'Everything has a home'),el('small',{},`${n} idea${n===1?'':'s'} planted in the last 90 days${pj?` · ${pj} became project${pj===1?'':'s'}`:''}`)));}

/* ---------- streak freezes ---------- */
function rwFreezeEarn(r,first){let changed=false;
  get.all('habit').forEach(h=>{if(h.paused)return;const s=habitStreak(h),m=Math.floor(s.n/(s.unit==='week'?4:7)),got=r.frz.got[h.id]||0;
    if(m<got){r.frz.got[h.id]=m;changed=true;return;}
    if(m>got){r.frz.got[h.id]=m;changed=true;if(!first)r.frz.n=Math.min(RW_FRZ_MAX,r.frz.n+(m-got));}});
  return changed;}
/* a missed day (or week) that a freeze could cover, if the streak before it is worth saving */
function rwFreezeOffer(){if(!rwOn('rwFreeze'))return null;const r=rwRec();if(r.frz.n<1)return null;const tk=todayK(),y=addK(tk,-1);
  for(const h of get.all('habit')){if(h.paused||h.everyN)continue;
    if(!habitWeekly(h)){if(!occursHabit(h,y)||habitDone(h,y)||(h.skips||{})[y]||r.frz.asked[h.id+'|'+y])continue;
      h.skips=h.skips||{};h.skips[y]='freeze';const n=habitStreak(h).n;delete h.skips[y];if(n>=3)return{h,day:y,n,unit:'day'};}
    else{const lw=k(addD(weekStartOf(today()),-7));if(habitWeek(h,lw)>=(h.target||1)||(h.wkFrz||{})[lw]||r.frz.asked[h.id+'|'+lw])continue;
      h.wkFrz=h.wkFrz||{};h.wkFrz[lw]=true;const n=habitStreak(h).n;delete h.wkFrz[lw];if(n>=2)return{h,day:lw,n,unit:'week'};}}
  return null;}
function rwUseFreeze(o){const r=rwRec(),h=o.h;if(o.unit==='week'){h.wkFrz=Object.assign({},h.wkFrz,{[o.day]:true});}else{h.skips=Object.assign({},h.skips,{[o.day]:'freeze'});}put(h,{silent:true});
  r.frz.n=Math.max(0,r.frz.n-1);r.frz.used=(r.frz.used||0)+1;r.frz.asked[h.id+'|'+o.day]=1;put(r,{silent:true});App.refresh();rwSoon();}
/* the offer sits on Today as a card, never a pop-up: it waits until you get to it */
function rwFreezeCard(){const o=rwFreezeOffer();if(!o)return null;if(get.settings().rwFrzAuto){const ak=o.h.id+'|'+o.day;if(App.state._fzA===ak)return null;App.state._fzA=ak;setTimeout(()=>{rwUseFreeze(o);toast(`A freeze kept your ${o.n}-${o.unit} ${o.h.title} streak`,null,null,{force:true});},300);return null;}
  const r=rwRec(),key=o.h.id+'|'+o.day,when=o.unit==='week'?'last week':relDay(o.day).toLowerCase();
  return Card({cls:'rwfz'},el('div',{class:'rwfzh'},el('span',{class:'rwfzi',html:ic('shield',IC.md)}),el('span',{class:'grow'},el('b',{},`Keep your ${o.n}-${o.unit} ${o.h.title} streak?`),el('small',{},o.unit==='week'?`It didn’t hit its target ${when}. A freeze covers that week.`:`It wasn’t checked in ${when}. A freeze covers that day.`))),
    el('div',{class:'rwfzb'},Button(`Use a freeze · ${r.frz.n} left`,{variant:'primary',style:'flex:2',onclick:()=>{rwUseFreeze(o);toast('Streak kept',null,null,{force:true});}}),Button('Let it reset',{variant:'quiet',style:'flex:1',onclick:()=>{const q=rwRec();q.frz.asked[key]=1;put(q);}})));}

/* ---------- the check: runs after changes and once on open ---------- */
const RW_KINDS=new Set(['task','habit','goal','project','plan','review','idea','routine','entry','settings']);
let rwT=null,rwRT=null;
function rwSoon(){clearTimeout(rwT);rwT=setTimeout(()=>{try{rwCheck();}catch(e){console.warn(e);}},1200);}
function rwHook(r,gone){if(!r||r.kind==='rewards'||!RW_KINDS.has(r.kind))return;
  if(gone&&r.kind==='idea')setTimeout(()=>{try{rwPlantCheck(r);}catch(e){}},600);
  clearTimeout(rwRT);rwRT=setTimeout(()=>{try{rwRingSync();}catch(e){}},60);rwSoon();}
function rwCheck({quiet=false}={}){if(App.state.loading)return;const r=rwRec(),before=JSON.stringify(r),first=!r.init,tk=todayK(),seasoned=rwSeasoned(),msgs=[];
  /* bests */
  const B=rwBestNow();for(const key in B){const nv=B[key],old=r.bests[key];
    if(!old||nv.v>old.v){const min=key.startsWith('streak:')?3:RW_BEST_MIN[key];const celeb=key.startsWith('streak:')&&CELEB.includes(nv.v);
      if(old&&!first&&seasoned&&rwOn('rwBests')&&nv.v>=min&&!celeb&&rwBestFresh(key,nv,old))msgs.push([2,rwBestText(key,nv,old)]);r.bests[key]={v:nv.v,d:key.startsWith('streak:')||key==='top3Run'?tk:(nv.d||tk)};}}
  /* levels */
  const P=rwPoints(),lv={};(get.settings().areas||AREAS).forEach(a=>{lv[a]=rwLevel(P[a]||0).level;const prev=r.levels[a];
    r.lvMax=r.lvMax||{};if(prev==null||first){r.levels[a]=lv[a];r.lvMax[a]=Math.max(r.lvMax[a]||0,lv[a]);}else if(lv[a]>prev){r.levels[a]=lv[a];const nw=lv[a]>(r.lvMax[a]||prev);r.lvMax[a]=Math.max(r.lvMax[a]||0,lv[a]);if(nw&&rwOn('rwLevels'))msgs.push([3,`${a} reached Level ${lv[a]}`,()=>App.go('area',{name:a})]);}else if(lv[a]<prev)r.levels[a]=lv[a];});
  /* a closed ring today */
  {const st=rwDay(tk);if(st.total>=3&&st.done===st.total)r.full[tk]=1;const ks=Object.keys(r.full).sort();if(ks.length>400)ks.slice(0,ks.length-400).forEach(x=>delete r.full[x]);}
  /* freezes */
  const fz0=r.frz.n;rwFreezeEarn(r,first);if(first&&!r.frz.n&&get.all('habit').some(h=>habitStreak(h).n>=3))r.frz.n=1;
  if(r.frz.n>fz0&&!first&&rwOn('rwFreeze'))msgs.push([1,`You earned a streak freeze · ${r.frz.n} saved`,()=>App.go('setpage',{id:'rewards'})]);
  /* badges */
  const c=rwCtx(r,r.bests,lv);RW_BADGES.forEach(([id,n,,, test,pal])=>{if(r.badges[id])return;let ok=false;try{ok=test(c);}catch(e){}if(!ok)return;r.badges[id]=tk;
    if(first)r.seen[id]=1;else if(rwOn('rwBadges')){const p=pal&&RW_PALS.find(x=>x[0]===pal);msgs.push([4,`Badge earned: ${n}${p?` · ${p[1]} palette unlocked`:''}`,()=>App.go('reviews')]);}});
  r.init=true;
  /* one reward message a day; the rest wait in Reviews */
  if(msgs.length&&!quiet&&rwOn()&&r.slot!==tk&&App.state._painted&&!document.hidden){msgs.sort((a,b)=>b[0]-a[0]);const [,txt,go]=msgs[0];r.slot=tk;setTimeout(()=>toast(txt,null,null,{force:true,open:go||(()=>App.go('reviews'))}),400);}
  if(JSON.stringify(r)!==before)put(r,{silent:true});}
function rwBoot(){setTimeout(()=>{try{rwCheck();}catch(e){console.warn(e);}},2500);}

/* ---------- Reviews: badges and personal bests ---------- */
function rwBadgeTile(def,date,fresh){const [id,n,say,icn,,pal]=def,got=!!date;
  return el('button',{class:'rwbd'+(got?' on':'')+(fresh?' new':''),'aria-label':`${n}${got?', earned':', locked'}`,onclick:()=>{const p=pal&&RW_PALS.find(x=>x[0]===pal);
    openSheet({title:n,left:{label:'Close'},build:b=>b.append(el('div',{class:'rwbdbig'+(got?' on':'')},rwHex(icn)),el('p',{style:'text-align:center;margin:var(--s3) 0 var(--s1)'},say),Caption(got?`Earned ${relDay(date)==='Today'?'today':fmtMD(date)}`:'Not yet',{as:'p',style:'text-align:center'}),p?Caption(got?`Unlocked the ${p[1]} palette in Settings › Display & motion.`:`Unlocks the ${p[1]} palette.`,{as:'p',style:'text-align:center;margin-top:var(--s2)'}):null)});}},
    rwHex(icn),el('span',{},n));}
function rwHex(icn){return el('span',{class:'rwhex',html:`<svg viewBox="0 0 40 44" aria-hidden="true"><path d="M20 2l17 10v20L20 42 3 32V12z"/></svg>`+ic(icn,IC.md)});}
function rwReviewsSection(page){if(!rwOn())return;const r=rwRec();
  if(rwOn('rwBadges')){const got=RW_BADGES.filter(b=>r.badges[b[0]]).length,order=[...RW_BADGES].sort((a,b)=>(r.badges[b[0]]?1:0)-(r.badges[a[0]]?1:0));
    /* v334 · earned plus the next few to go for; the rest behind See all */
    const tile=b=>rwBadgeTile(b,r.badges[b[0]],r.badges[b[0]]&&!r.seen[b[0]]),earned=order.filter(b=>r.badges[b[0]]),next=order.filter(b=>!r.badges[b[0]]).slice(0,Math.max(3,Math.ceil((earned.length+1)/3)*3-earned.length)),shown=[...earned,...next];
    const all=()=>openSheet({title:`Badges · ${got} of ${RW_BADGES.length}`,left:{label:'Close'},build:b=>b.append(el('div',{class:'rwbdg'},order.map(tile)))});
    page.append(SectionLabel('Badges',{count:`${got} of ${RW_BADGES.length}`,action:shown.length<RW_BADGES.length?lnk('See all',all):null}),Card({cls:'rwbds'},el('div',{class:'rwbdg'},shown.map(tile))));
    const fresh=RW_BADGES.filter(b=>r.badges[b[0]]&&!r.seen[b[0]]);if(fresh.length)setTimeout(()=>{const q=rwRec();fresh.forEach(b=>q.seen[b[0]]=1);put(q,{silent:true});},1500);}
  if(rwOn('rwBests')){const rows=Object.entries(r.bests).filter(([key,v])=>RW_BEST_L[key]&&v.v>=(RW_BEST_MIN[key]||1)).map(([key,v])=>Row({as:'div'},el('span',{class:'grow'},el('b',{style:'font-weight:500'},RW_BEST_L[key]),el('small',{},relDay(v.d)==='Today'?'Today':fmtMD(v.d))),el('b',{class:'tnum'},key==='weekScore'?`${v.v}%`:String(v.v))));
    const hs=get.all('habit').map(h=>[h,rwHabitBest(h),habitStreak(h).unit]).filter(x=>x[1]>=3).sort((a,b)=>b[1]-a[1]).slice(0,3).map(([h,n,u])=>Row({as:'div'},el('span',{class:'grow'},el('b',{style:'font-weight:500'},`${h.title} streak`),el('small',{},'Longest run')),el('b',{class:'tnum'},`${n} ${u==='week'?'wk':'d'}`)));
    if(rows.length||hs.length)page.append(SectionLabel('Personal bests'),el('div',{class:'list'},...rows,...hs));}}
const rwBadgeDot=()=>{if(!rwOn('rwBadges'))return false;const r=get.id('rewards');return !!r&&RW_BADGES.some(b=>(r.badges||{})[b[0]]&&!(r.seen||{})[b[0]]);};

/* ---------- Sunday score: the opening card of the weekly review ---------- */
function rwScoreCard(a,b,stats){if(!rwOn('rwScore')||!stats.planned)return null;const pc=Math.round(Math.min(1,stats.done/stats.planned)*100);
  const days=[...Array(7)].map((_,i)=>{const d=addK(a,i);if(d>todayK())return[d,0];const it=dayItems(d);let n=0;[...it.timed,...it.anytime].forEach(e=>{if(['task','step','habit','routine'].includes(e.kind)&&e.done)n++;});return[d,n];});
  const mx=Math.max(1,...days.map(x=>x[1])),bi=days.reduce((bi,x,i)=>x[1]>days[bi][1]?i:bi,0);
  const list=get.all('review').filter(r=>(r.period||'week')==='week'),ws=new Set(list.map(r=>r.week));let run=0,w=addK(a,-7);while(ws.has(w)){run++;w=addK(w,-7);}
  const word=pc>=85?'A strong week':pc>=60?'A solid week':pc>=35?'A mixed week':'A light week';
  return Card({cls:'rwscore'},el('div',{class:'rwsh'},el('div',{},el('span',{class:'lbl'},`Week of ${mdS(fromK(a))}`),el('div',{class:'serif rwsw'},word)),el('div',{class:'rwsn'},el('span',{class:'serif tnum','data-count':String(pc)},`${pc}%`),el('small',{},'of your plan, done'))),
    el('div',{class:'rwbars','aria-hidden':'true'},days.map(([d,n],i)=>el('div',{class:i===bi&&days[bi][1]?'best':''},el('i',{style:`height:${Math.max(4,Math.round(n/mx*100))}%`}),el('span',{},i===bi&&days[bi][1]?'Best':DOW[fromK(d).getDay()].slice(0,1))))),
    el('small',{class:'rwsx'},[`${stats.done} done`,days[bi][1]?`${DOW[fromK(days[bi][0]).getDay()]} was your best day`:null,run?`${run+1} reviews in a row`:null].filter(Boolean).join(' · ')));}

/* ---------- Year in review as a story ---------- */
function rwYearStory(y){const H=yirHighlights(y),r=rwRec(),a=`${y}-01-01`,b=`${y}-12-31`,cards=[];
  if(H.tasks)cards.push([H.tasks,'tasks done']);
  if(H.streak)cards.push([H.streak.n,`${H.streak.weekly?'week':'day'} best streak · ${H.streak.name}`]);
  if(H.workouts)cards.push([H.workouts,'workouts']);
  if(H.month)cards.push([null,`Your busiest month was ${MONL[H.month.m]}`]);
  {const by={};get.all('task',{archived:true,every:true}).forEach(t=>{const p=t.part&&get.id(t.part),ar=t.area||(p&&p.area);if(!ar)return;Object.keys(t.doneDates||{}).forEach(d=>{if(d>=a&&d<=b)by[ar]=(by[ar]||0)+1;});});[...get.all('goal',{archived:true,every:true}),...get.all('project',{archived:true,every:true})].forEach(g=>(g.steps||[]).forEach(s=>{if(g.area&&s.d&&s.doneAt&&k(new Date(s.doneAt))>=a&&k(new Date(s.doneAt))<=b)by[g.area]=(by[g.area]||0)+3;}));const top=Object.entries(by).sort((p,q)=>q[1]-p[1])[0];if(top)cards.push([null,`Most growth: ${top[0]}, now Level ${rwLevel(rwPoints()[top[0]]||0).level}`]);}
  {const n=Object.values(r.bests).filter(v=>v.d>=a&&v.d<=b).length;if(n)cards.push([n,`personal best${n===1?'':'s'} set`]);}
  {const n=r.planted.filter(p=>p.d>=a&&p.d<=b).length;if(n)cards.push([n,`idea${n===1?'':'s'} turned into plans`]);}
  {const n=Object.values(r.badges).filter(d=>d>=a&&d<=b).length;if(n)cards.push([n,`badge${n===1?'':'s'} earned`]);}
  if(H.goals)cards.push([H.goals,`goal${H.goals===1?'':'s'} reached`]);
  if(!cards.length){toast('Your year fills in as you finish things');return;}
  cards.push([null,'Save the picture from this page to keep it.']);
  storyPlay(cards,`Your ${y}`);}

/* ---------- Tomorrow forecast on the Plan tomorrow card ---------- */
function rwForecast(dk){if(!rwOn('rwForecast'))return null;const tmk=addK(dk,1),L=dayLoad(tmk),t=dayItems(tmk).timed.filter(e=>e.time!=null&&e.kind!=='habit');
  const word=L.level<=1?'Light day':L.level===2?'Steady day':'Full day',from=7*60,to=22*60;
  const busy=t.reduce((n,e)=>n+Math.max(0,Math.min(to,e.time+(e.dur||30))-Math.max(from,e.time)),0),openH=Math.max(0,Math.round((to-from-busy)/60));
  const pick=L.level<=2?get.all('task').filter(x=>!x.date&&isOpenTask(x)&&!onHold(x)&&!x.archived).sort((p,q)=>(p.priority==='high'?0:1)-(q.priority==='high'?0:1)||p.createdAt-q.createdAt)[0]:null;
  const waited=pick?Math.floor((Date.now()-(pick.createdAt||Date.now()))/864e5):0;
  return el('div',{class:'rwfc'},el('div',{class:'rwfch'},el('span',{class:'pill-today'},word),el('small',{},`${t.length} event${t.length===1?'':'s'} · ${openH} open hour${openH===1?'':'s'}`)),
    el('div',{class:'rwtl','aria-hidden':'true'},t.map(e=>{const a=Math.max(from,e.time),b=Math.min(to,e.time+(e.dur||30));if(b<=a)return null;return el('i',{style:`left:${((a-from)/(to-from)*100).toFixed(1)}%;width:${Math.max(2,(b-a)/(to-from)*100).toFixed(1)}%`});})),
    pick?el('div',{class:'rwsug'},el('span',{class:'grow'},'A good day to knock out ',el('b',{},pick.title),waited>=7?`. It’s been waiting ${waited>=21?Math.round(waited/7)+' weeks':waited+' days'}.`:'.'),Button('Add',{variant:'primary',size:'sm',onclick:()=>{pick.date=tmk;put(pick);toast(`${pick.title} is on tomorrow`,null,null,{force:true});}})):null);}

/* ---------- Settings › Rewards ---------- */
function rwSettings(page,ctx){const s=get.settings(),r=rwRec();
  const g0=el('div',{class:'list'});page.append(g0);setToggle(ctx,g0,null,'Rewards','Rings, records, streaks, badges and levels',s.rwOn!==false,v=>setSettings({rwOn:v}));
  if(s.rwOn===false){page.append(Caption('Turned off. What you’ve earned is kept for when you turn it back on.',{as:'p',style:'padding:var(--s2) var(--s1)'}));return;}
  /* v332 · what you've earned first, then the switches grouped by where they show */
  {const got=RW_BADGES.filter(b=>r.badges[b[0]]).length,pals=RW_PALS.filter(p=>r.badges[p[4]]).length,gp=el('div',{class:'list'});page.append(SectionLabel('So far'),gp);
    gp.append(setRow('Badges and personal bests',`${got} of ${RW_BADGES.length} badges · ${pals} of ${RW_PALS.length} palettes`,null,()=>App.go('reviews')));}
  const K=Object.fromEntries(RW_KEYS.map(x=>[x[0],x])),grp=(t,keys)=>{const g=el('div',{class:'list'});page.append(SectionLabel(t),g);keys.forEach(k=>{const[key,l,sub]=K[k];setToggle(ctx,g,null,l,sub,s[key]!==false,v=>setSettings({[key]:v}));});return g;};
  grp('On Today',['rwRing','rwForecast']);
  const gh=grp('Habits',['rwStreaks','rwFreeze']);
  if(s.rwFreeze!==false){gh.append(condRow(Row({as:'div'},el('span',{class:'grow'},el('b',{style:'font-weight:500'},'Freezes saved'),el('small',{},`You can hold ${RW_FRZ_MAX}. ${r.frz.used?`Used ${r.frz.used} so far.`:'Each covers one missed day or week.'}`)),el('b',{class:'tnum'},String(r.frz.n)))));
    setToggle(ctx,gh,null,'Use freezes automatically','Spend one on a miss without asking',!!s.rwFrzAuto,v=>setSettings({rwFrzAuto:v}));}
  grp('Progress',['rwLevels','rwBadges','rwBests']);
  grp('Reviews and Inbox',['rwScore','rwGarden']);
  if(s.reduceMotion)page.append(Caption('Reduce motion is on, so rewards appear without animation.',{as:'p',style:'padding:var(--s2) var(--s1) 0'}));}
