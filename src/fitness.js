/* ---------- Fitness: exercises with sets, rest and muscles (after Hevy); habits linked to the Workouts log and routines ---------- */
const MUSCLES=['Chest','Back','Lats','Traps','Shoulders','Biceps','Triceps','Forearms','Abs','Lower back','Glutes','Quads','Hamstrings','Calves','Full body','Cardio'];
/* name: [primary, [secondary…], kind] — kind: weight (default), body, time */
const EX_LIB={'Bench press':['Chest',['Triceps','Shoulders']],'Incline dumbbell press':['Chest',['Shoulders','Triceps']],'Push-up':['Chest',['Triceps','Shoulders','Abs'],'body'],'Chest fly':['Chest',['Shoulders']],'Dips':['Triceps',['Chest','Shoulders'],'body'],
  'Overhead press':['Shoulders',['Triceps','Traps']],'Lateral raise':['Shoulders',[]],'Face pull':['Shoulders',['Traps','Back']],'Tricep pushdown':['Triceps',[]],'Skull crusher':['Triceps',[]],
  'Pull-up':['Lats',['Biceps','Back'],'body'],'Lat pulldown':['Lats',['Biceps','Back']],'Barbell row':['Back',['Lats','Biceps','Lower back']],'Seated cable row':['Back',['Lats','Biceps']],'Dumbbell row':['Back',['Lats','Biceps']],
  'Deadlift':['Hamstrings',['Glutes','Lower back','Back','Traps','Forearms']],'Shrug':['Traps',['Forearms']],'Bicep curl':['Biceps',['Forearms']],'Hammer curl':['Biceps',['Forearms']],
  'Squat':['Quads',['Glutes','Hamstrings','Lower back']],'Front squat':['Quads',['Glutes','Abs']],'Leg press':['Quads',['Glutes','Hamstrings']],'Lunge':['Quads',['Glutes','Hamstrings']],'Bulgarian split squat':['Quads',['Glutes','Hamstrings']],
  'Romanian deadlift':['Hamstrings',['Glutes','Lower back']],'Leg curl':['Hamstrings',[]],'Leg extension':['Quads',[]],'Hip thrust':['Glutes',['Hamstrings']],'Calf raise':['Calves',[]],
  'Plank':['Abs',['Shoulders','Lower back'],'time'],'Crunch':['Abs',[],'body'],'Hanging leg raise':['Abs',['Forearms'],'body'],'Kettlebell swing':['Glutes',['Hamstrings','Lower back','Shoulders']],'Burpee':['Full body',['Cardio'],'body'],'Rowing machine':['Cardio',['Back','Quads'],'time'],'Treadmill':['Cardio',['Quads','Calves'],'time']};
const SET_T={n:['','Normal'],w:['W','Warm-up'],d:['D','Drop set'],f:['F','To failure']};
const RESTS=[0,30,45,60,90,120,180];
const restLbl=s=>!s?'Rest off':s<60?`Rest ${s}s`:s%60?`Rest ${Math.floor(s/60)}:${pad2(s%60)}`:`Rest ${s/60} min`;
const DOTS='<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><circle cx="5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="19" cy="12" r="1.8"/></svg>';
const LINKI='<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/></svg>';
const wkCfg=()=>cfg('Health','workouts');
const fmtN=v=>Number.isInteger(v)?String(v):v.toFixed(1);
function exInfo(name){const c=wkCfg().f.exLib||{},q=String(name||'').trim().toLowerCase(),cu=Object.keys(c).find(x=>x.toLowerCase()===q);if(cu)return Object.assign({p:null,s:[],k:'weight'},c[cu]);const lk=Object.keys(EX_LIB).find(x=>x.toLowerCase()===q);if(lk){const[p,s,kd]=EX_LIB[lk];return{p,s,k:kd||'weight'};}return{p:null,s:[],k:'weight'};}
const musText=i=>i.p?[i.p,...(i.s||[])].join(' · '):'Add muscles';
function allExNames(){const set=new Map();const add=n=>{n=String(n||'').trim();if(n&&!set.has(n.toLowerCase()))set.set(n.toLowerCase(),n);};Object.keys(wkCfg().f.exLib||{}).forEach(add);Object.keys(EX_LIB).forEach(add);ofType('Health','workouts','routine').forEach(r=>planOf(r).forEach(e=>add(e.name)));return[...set.values()];}
function saveExInfo(name,info){const c=wkCfg();c.f.exLib=Object.assign({},c.f.exLib,{[name]:{p:info.p,s:info.s||[],k:info.k||'weight'}});put(c,{silent:true});}
/* a routine's exercises: structured plan, or the old "Bench press, 3 x 8, 140" lines */
function planOf(r){if(r.f.plan&&r.f.plan.length)return r.f.plan;return exParse(r.f.ex).map(e=>({id:uid('x'),name:e.name,rest:90,ss:null,sets:Array.from({length:e.n||3},()=>({t:'n',r:e.r||10,w:e.w??''}))}));}
const planText=plan=>plan.map(e=>{const s=e.sets.filter(x=>x.t!=='w'),f=s[0]||{};return `${e.name}, ${s.length||e.sets.length} x ${f.r||10}${f.w?`, ${f.w}`:''}`;}).join('\n');
function ssLetters(list){const m={};let n=0;list.forEach(e=>{if(e.ss&&!(e.ss in m))m[e.ss]=String.fromCharCode(65+n++);});return m;}
function ssNormalize(list){/* a superset is a run of neighbours; a lone member is just an exercise */const ids={};list.forEach((e,i)=>{if(!e.ss)return;(ids[e.ss]=ids[e.ss]||[]).push(i);});Object.values(ids).forEach(ix=>{if(ix.length<2){list[ix[0]].ss=null;return;}for(let j=1;j<ix.length;j++)if(ix[j]!==ix[j-1]+1)for(let q=j;q<ix.length;q++)list[ix[q]].ss=null;});}
function lastSetsOf(name){const q=String(name).toLowerCase(),L=wkLogs().filter(x=>(x.f.log||[]).some(e=>e.name.toLowerCase()===q)||Object.keys(x.f.detail||{}).some(n=>n.toLowerCase()===q)).sort((a,b)=>a.f.date<b.f.date?1:a.f.date>b.f.date?-1:(b.createdAt||0)-(a.createdAt||0))[0];if(!L)return[];const e=(L.f.log||[]).find(e=>e.name.toLowerCase()===q);if(e)return e.sets.filter(s=>s.t!=='w');const dk=Object.keys(L.f.detail||{}).find(n=>n.toLowerCase()===q);return dk?L.f.detail[dk]:[];}

/* ---------- muscles sheet: one primary, any number of secondaries ---------- */
function muscleSheet(name,onSave){const cur=exInfo(name);let p=cur.p,s=(cur.s||[]).slice(),inst;
  inst=openSheet({title:name,left:{label:'Cancel'},right:{label:'Save',onclick:()=>{if(!p){toast('Pick the main muscle');return;}saveExInfo(name,{p,s:s.filter(x=>x!==p),k:cur.k});inst.close();onSave&&onSave();}},build:b=>{const box=el('div',{});const draw=()=>{box.innerHTML='';
    box.append(el('p',{class:'muted small'},'Compound lifts work several muscles. Pick the main one, then any others it works.'),el('div',{class:'sect'},'Main muscle'),el('div',{class:'chips'},MUSCLES.map(m=>el('button',{class:'chip'+(p===m?' on':''),'aria-pressed':String(p===m),onclick:()=>{p=m;s=s.filter(x=>x!==m);draw();}},m))),
      el('div',{class:'sect'},'Also works'),el('div',{class:'chips'},MUSCLES.filter(m=>m!==p).map(m=>{const on=s.includes(m);return el('button',{class:'chip'+(on?' on':''),'aria-pressed':String(on),onclick:()=>{s=on?s.filter(x=>x!==m):[...s,m];draw();}},m);})));};draw();b.append(box);}});}

/* ---------- exercise picker: search the library, or name a new one ---------- */
function exercisePicker(onPick){let q='',inst;
  inst=openSheet({title:'Add exercise',left:{label:'Cancel'},build:b=>{const list=el('div',{});
    const pick=n=>{inst.close();onPick(n);};
    const paint=()=>{list.innerHTML='';const f=q.trim().toLowerCase(),names=allExNames(),hits=names.filter(n=>!f||n.toLowerCase().includes(f)||(exInfo(n).p||'').toLowerCase().includes(f));
      if(f&&!names.some(n=>n.toLowerCase()===f)){const nm=q.trim().replace(/^./,c=>c.toUpperCase());list.append(el('div',{class:'list'},el('button',{class:'li',style:'width:100%;text-align:left',onclick:()=>{inst.close();muscleSheet(nm,()=>onPick(nm));}},el('span',{class:'ib',html:ic('plus',18,2.2)}),el('span',{class:'grow'},el('b',{style:'font-weight:600'},`Add “${nm}”`),el('small',{},'A new exercise. You’ll pick its muscles next.')))));}
      const by={};hits.forEach(n=>{const g=exInfo(n).p||'Other';(by[g]=by[g]||[]).push(n);});
      [...MUSCLES,'Other'].forEach(g=>{if(!by[g])return;list.append(el('div',{class:'sect'},g),el('div',{class:'list'},by[g].sort().map(n=>{const i=exInfo(n);return el('button',{class:'li',style:'width:100%;text-align:left',onclick:()=>pick(n)},el('span',{class:'grow'},el('b',{style:'font-weight:500'},n),i.s&&i.s.length?el('small',{},`Also ${i.s.join(', ')}`):null));})));});
      if(!hits.length&&!f)list.append(emptySm('No exercises yet','Type a name above to add your first one.'));};
    b.append(el('label',{class:'field'},el('span',{class:'eyebrow'},'Exercise'),el('input',{id:'f-ex-q',type:'search',placeholder:'Search, or name a new one',autocomplete:'off',oninput:e=>{q=e.target.value;paint();}})),list);paint();}});}

/* ---------- routine editor: exercises, sets (type, reps, weight), rest, supersets ---------- */
function workoutRoutineSheet(rec,{after=null}={}){
  const isEdit=!!rec,D=isEdit?{what:rec.f.what||'',kind:rec.f.kind||'Strength',min:+rec.f.min||45,plan:clone(planOf(rec))}:{what:'',kind:'Strength',min:45,plan:[]};
  let render;
  const inst=formSheet({title:isEdit?'Edit routine':'New workout routine',addLabel:isEdit?'Save':'Add',D,word:'routine',isEdit,canAdd:()=>!!D.what.trim(),commit:()=>{ssNormalize(D.plan);const f={t:'routine',what:D.what.trim(),kind:D.kind,min:D.min,plan:D.plan,ex:planText(D.plan)};let r;if(isEdit){Object.assign(rec.f,f);r=put(rec);}else r=create('entry',{hub:'Health',tool:'workouts',f});toast('Saved');after&&after(r);},build:(body,update,i)=>{
    const ctx=formCtx(()=>render());const T=fieldTitle('f-wr-title','Routine name','Push day, Leg day, Full body…',D.what,v=>{D.what=v;update();});
    const head=el('div',{class:'group'}),box=el('div',{class:'wexs'});
    body.append(T.wrap,el('div',{class:'sect'},'Type'),head,el('div',{class:'sect'},'Exercises'),box,el('button',{class:'addstep',html:ic('plus',20,2)+'Add exercise',onclick:()=>exercisePicker(n=>{D.plan.push({id:uid('x'),name:n,rest:wkCfg().f.rest??90,ss:null,sets:[{t:'n',r:10,w:''},{t:'n',r:10,w:''},{t:'n',r:10,w:''}]});render();})}));
    render=()=>{head.innerHTML='';box.innerHTML='';
      head.append(el('div',{style:'padding:var(--s3) var(--pad)'},seg([['Strength','Strength'],['Cardio','Cardio'],['Other','Other']],D.kind,v=>{D.kind=v;render();})),ctx.row('min','hour','About how long',null,{expand:false,trailing:[ctx.stepper(D.min,5,240,v=>{D.min=v;},{step:5}),el('span',{class:'small muted'},'min')]}));
      ssNormalize(D.plan);const L=ssLetters(D.plan);
      if(!D.plan.length)box.append(el('p',{class:'muted small',style:'padding:var(--s1) 2px'},'Add the exercises you do, with sets, reps and rest. Pair two or more as a superset to do them back to back.'));
      D.plan.forEach((e,n)=>{const info=exInfo(e.name),nx=D.plan[n+1];let nNorm=0;
        const menu=ev=>{const r=ev.currentTarget.getBoundingClientRect();openMenu(r.left,r.bottom,[
          {label:'Muscles…',icon:'target',onclick:()=>muscleSheet(e.name,render)},
          nx&&!(e.ss&&e.ss===nx.ss)?{label:`Superset with ${nx.name}`,icon:'layers',onclick:()=>{const id=e.ss||nx.ss||uid('g');e.ss=id;nx.ss=id;render();}}:null,
          e.ss?{label:'Take out of superset',icon:'x',onclick:()=>{e.ss=null;render();}}:null,
          n>0?{label:'Move up',icon:'chevu',onclick:()=>{D.plan.splice(n,1);D.plan.splice(n-1,0,e);render();}}:null,
          nx?{label:'Move down',icon:'chevd',onclick:()=>{D.plan.splice(n,1);D.plan.splice(n+1,0,e);render();}}:null,
          {label:'Remove exercise',icon:'trash',danger:true,onclick:()=>{const at=D.plan.indexOf(e);D.plan.splice(at,1);render();toast(`${e.name} removed`,()=>{D.plan.splice(at,0,e);render();});}}]);};
        box.append(el('div',{class:'wex'+(e.ss?' inss':'')+(e.ss&&nx&&nx.ss===e.ss?' ssnext':'')},
          el('div',{class:'wexh'},el('div',{class:'grow'},el('b',{},e.name),el('button',{class:'wmus'+(info.p?'':' empty'),onclick:()=>muscleSheet(e.name,render)},musText(info))),e.ss?el('span',{class:'sspill'},`Superset ${L[e.ss]}`):null,el('button',{class:'iconbtn','aria-label':`More for ${e.name}`,html:DOTS,onclick:menu})),
          el('div',{class:'st hd'},el('span',{},'Set'),el('span',{},''),el('span',{class:'ctr'},'lb'),el('span',{class:'ctr'},'Reps'),el('span',{})),
          e.sets.map((s,j)=>{if(s.t!=='w')nNorm++;return el('div',{class:'st'},setBadge(s,s.t==='w'?null:nNorm,()=>render()),el('span',{class:'small muted'},SET_T[s.t][1]==='Normal'?'':SET_T[s.t][1]),
            el('input',{type:'number',inputmode:'decimal','aria-label':`${e.name} set ${j+1} weight`,placeholder:'–',value:s.w??'',oninput:x=>{s.w=x.target.value===''?'':+x.target.value;}}),
            el('input',{type:'number',inputmode:'numeric','aria-label':`${e.name} set ${j+1} reps`,value:s.r??'',oninput:x=>{s.r=x.target.value===''?'':+x.target.value;}}),
            el('button',{class:'iconbtn','aria-label':`Remove set ${j+1}`,html:ic('x',14,2.4),onclick:()=>{e.sets.splice(j,1);render();}}));}),
          el('div',{class:'wexf'},el('button',{onclick:()=>{const l=e.sets[e.sets.length-1]||{};e.sets.push({t:'n',r:l.r??10,w:l.w??''});render();}},'+ Add set'),restBtn(e,()=>render()))));});};
    render();
    if(isEdit)body.append(el('button',{class:'delete',onclick:()=>{const c=clone(rec);remove(rec.id);inst.close();toast('Routine deleted',()=>put(c));}},'Delete routine'));else focusIfKeyboard(T.input);}});
}
/* the set number doubles as its type: tap for warm-up, drop set or to failure */
function setBadge(s,num,after){return el('button',{class:'nb sty t-'+s.t,'aria-label':`Set ${num||''} ${SET_T[s.t][1]}. Change type`,onclick:ev=>{const r=ev.currentTarget.getBoundingClientRect();openMenu(r.left,r.bottom,Object.entries(SET_T).map(([k,[,n]])=>({label:n+(s.t===k?' ✓':''),onclick:()=>{s.t=k;after();}})));}},s.t==='n'?String(num||''):SET_T[s.t][0]);}
function restBtn(e,after){return el('button',{class:'restbtn','aria-label':`${restLbl(e.rest||0)}. Change`,onclick:()=>{const i=RESTS.indexOf(e.rest||0);e.rest=RESTS[(i+1)%RESTS.length];after();}},el('span',{style:'display:grid',html:ic('time',14,2.2)}),restLbl(e.rest||0));}

/* ---------- start and run a workout ---------- */
function runEx(e){const p=lastSetsOf(e.name),i=exInfo(e.name);let k=0;return{name:e.name,p:i.p,s:i.s||[],rest:e.rest??90,ss:e.ss||null,sets:(e.sets&&e.sets.length?e.sets:[{t:'n',r:10,w:''}]).map(s=>{const q=s.t==='w'?null:p[k++];return{t:s.t||'n',prev:q?(q.w!==''&&q.w!=null&&+q.w?`${q.w} × ${q.r}`:`× ${q.r}`):'',w:q&&q.w!==''&&q.w!=null?q.w:(s.w??''),r:q&&q.r?q.r:(s.r??''),d:false};})};}
function startWorkout(r){const c=wkCfg();if(c.f.run){App.go('tool',{hub:'Health',tool:'workouts'});if(c.f.run.rid!==r.id)toast(`${c.f.run.name} is still running`);return;}
  c.f.run={rid:r.id,name:r.f.what,start:Date.now(),ex:planOf(r).map(runEx)};put(c);App.go('tool',{hub:'Health',tool:'workouts'});}
function afterSet(run,ei,i){const e=run.ex[ei];run.restAt=0;run.focus=null;
  if(e.ss){const grp=run.ex.map((x,j)=>[x,j]).filter(([x])=>x.ss===e.ss),pos=grp.findIndex(([,j])=>j===ei),nextIn=grp.slice(pos+1).find(([x])=>x.sets.some(s=>!s.d));
    if(nextIn){run.focus=nextIn[1];return;}/* superset: straight to the next exercise, rest after the round */
    const r=grp[grp.length-1][0].rest||0,first=grp.find(([x])=>x.sets.some(s=>!s.d));if(r&&first){run.restAt=Date.now()+r*1000;run.restFor=r;}if(first)run.focus=first[1];return;}
  const nx=e.sets[i+1];if(nx&&nx.t==='d')return;/* no rest before a drop set */
  if(e.sets.every(s=>s.d)){const nxt=run.ex.findIndex((x,j)=>j>ei&&x.sets.some(s=>!s.d));if(nxt>=0)run.focus=nxt;}
  const r=e.rest||0;if(r&&run.ex.some(x=>x.sets.some(s=>!s.d))){run.restAt=Date.now()+r*1000;run.restFor=r;}}
function vWorkoutRun(page,hub,t,c){
  const run=c.f.run,all=run.ex.flatMap(e=>e.sets),done=all.filter(s=>s.d).length,L=ssLetters(run.ex);
  const finish=()=>{const min=Math.max(1,Math.round((Date.now()-run.start)/6e4));askFields({title:'Finish workout',addLabel:'Save',fields:[F('feel','How did it feel?','select',{opts:['Steady','Easy','Hard']}),F('min','Minutes','number'),F('miles','Distance (optional)','number',{blank:true})],D:{min},save:D=>{
    const log=run.ex.map(e=>({name:e.name,p:e.p,s:e.s,sets:e.sets.filter(x=>x.d).map(x=>({t:x.t,w:x.w,r:x.r}))})).filter(e=>e.sets.length),detail={};
    log.forEach(e=>{const s=e.sets.filter(x=>x.t!=='w').map(x=>({w:x.w,r:x.r}));if(s.length)detail[e.name]=s;});
    const vol=log.reduce((a,e)=>a+e.sets.filter(s=>s.t!=='w').reduce((b,s)=>b+(+s.w||0)*(+s.r||0),0),0),H=wkHabit();
    create('entry',{hub,tool:'workouts',f:{what:run.name,rid:run.rid,min:+D.min||min,feel:D.feel,miles:D.miles||'',sets:done,detail,log,vol,date:todayK(),src:'routine'}});delete c.f.run;put(c);
    toast(H?`${run.name} saved · counted for ${H.title}`:`${run.name} saved`,null,'Undo',{open:H?dest('habit',{id:H.id}):null});}});};
  page.append(el('div',{class:'runhead'},el('button',{class:'linkbtn',style:'color:var(--ink-2);min-height:44px',onclick:()=>askConfirm({title:'Cancel this workout?',body:'Nothing from this session will be saved.',yes:'Cancel workout',no:'Keep going',onYes:()=>{delete c.f.run;put(c);}})},'Cancel'),el('span',{class:'tnum runtime'},el('i',{}),el('span',{'data-since':String(run.start)},'0:00')),el('button',{class:'btn primary sm',onclick:finish},'Finish')));
  page.append(el('h1',{class:'pgtitle'},run.name),all.length?el('div',{class:'mrow'},meter(done/all.length),el('span',{class:'small muted tnum'},`${done} of ${all.length} sets`)):el('p',{class:'muted small'},'Timer’s running. Add exercises, or finish when you’re done.'));
  run.ex.forEach((e,ei)=>{let nNorm=0;const nx=run.ex[ei+1];
    const menu=ev=>{const r=ev.currentTarget.getBoundingClientRect();openMenu(r.left,r.bottom,[{label:'Muscles…',icon:'target',onclick:()=>muscleSheet(e.name,()=>{const i=exInfo(e.name);e.p=i.p;e.s=i.s;put(c);})},nx&&!(e.ss&&e.ss===nx.ss)?{label:`Superset with ${nx.name}`,icon:'layers',onclick:()=>{const id=e.ss||nx.ss||uid('g');e.ss=id;nx.ss=id;put(c);}}:null,e.ss?{label:'Take out of superset',icon:'x',onclick:()=>{e.ss=null;ssNormalize(run.ex);put(c);}}:null,{label:'Remove exercise',icon:'trash',danger:true,onclick:()=>{const at=run.ex.indexOf(e);run.ex.splice(at,1);ssNormalize(run.ex);put(c);toast(`${e.name} removed`,()=>{run.ex.splice(at,0,e);put(c);});}}]);};
    page.append(el('section',{class:'list extable'+(e.ss?' inss':'')+(e.ss&&nx&&nx.ss===e.ss?' ssnext':''),'data-ex':String(ei)},
      el('div',{class:'exh'},el('div',{class:'grow'},el('b',{},e.name),el('small',{class:'muted'},e.p?[e.p,...(e.s||[])].join(' · '):'')),el('button',{class:'iconbtn','aria-label':`More for ${e.name}`,html:DOTS,onclick:menu})),el('div',{class:'exmeta'},e.ss?el('span',{class:'sspill'},`Superset ${L[e.ss]}`):null,restBtn(e,()=>put(c))),
      el('div',{class:'st hd'},el('span',{},'Set'),el('span',{},'Previous'),el('span',{class:'ctr'},'lb'),el('span',{class:'ctr'},'Reps'),el('span',{})),
      e.sets.map((s,i)=>{if(s.t!=='w')nNorm++;return el('div',{class:'st'+(s.d?' done':'')},setBadge(s,s.t==='w'?null:nNorm,()=>put(c)),el('span',{class:'small muted'},s.prev||'–'),
        el('input',{id:`w${ei}-${i}`,type:'number',inputmode:'decimal','aria-label':`${e.name} set ${i+1} weight`,value:s.w??'',oninput:x=>{s.w=x.target.value===''?'':+x.target.value;put(c,{silent:true});}}),
        el('input',{id:`r${ei}-${i}`,type:'number',inputmode:'numeric','aria-label':`${e.name} set ${i+1} reps`,value:s.r??'',oninput:x=>{s.r=x.target.value===''?'':+x.target.value;put(c,{silent:true});}}),
        tk(s.d,on=>{s.d=on;if(on)afterSet(run,ei,i);else run.restAt=0;put(c,{silent:true});later();},'Complete set'));}),
      el('button',{class:'addset',onclick:()=>{const l=e.sets[e.sets.length-1]||{};e.sets.push({t:'n',prev:'',w:l.w??'',r:l.r??'',d:false});put(c);}},'+ Add set')));});
  page.append(el('button',{class:'btn line block',onclick:()=>exercisePicker(n=>{run.ex.push(runEx({name:n,rest:wkCfg().f.rest??90,sets:[{t:'n',r:10,w:''},{t:'n',r:10,w:''},{t:'n',r:10,w:''}]}));put(c);})},'+ Add exercise'));
  if(run.restAt&&run.restAt>Date.now())page.append(el('div',{class:'restbar',role:'status'},el('span',{class:'small'},'Rest'),el('b',{class:'tnum','data-until':String(run.restAt)},`${Math.ceil((run.restAt-Date.now())/1000)}`),el('span',{class:'grow'}),el('button',{onclick:()=>{run.restAt-=15000;put(c);}},'−15s'),el('button',{onclick:()=>{run.restAt+=15000;put(c);}},'+15s'),el('button',{onclick:()=>{run.restAt=0;put(c);}},'Skip')));
  if(run.focus!=null){const f=run.focus;run.focus=null;put(c,{silent:true});requestAnimationFrame(()=>{const n=document.querySelector(`[data-ex="${f}"]`);if(n)n.scrollIntoView({behavior:'smooth',block:'start'});});}
}
/* a logged workout: what you did, set by set */
function wkLogView(x){const hub='Health',t=toolOf?toolOf(hub,'workouts'):null;let inst;
  inst=openSheet({title:x.f.what,left:{label:'Close'},right:{label:'Edit',onclick:()=>{inst.close();entrySheet(hub,toolOf(hub,'workouts'),x);}},build:b=>{
    b.append(el('p',{class:'muted small'},[shortDay(x.f.date),x.f.min?`${x.f.min} min`:null,x.f.sets?`${x.f.sets} sets`:null,x.f.vol?`${Math.round(x.f.vol).toLocaleString()} lb lifted`:null,x.f.feel||null].filter(Boolean).join(' · ')));
    (x.f.log||[]).forEach(e=>{let n=0;b.append(el('div',{class:'sect'},e.name),el('div',{class:'list'},e.p?el('div',{class:'li',style:''},el('small',{class:'muted'},[e.p,...(e.s||[])].join(' · '))):null,e.sets.map(s=>{if(s.t!=='w')n++;return el('div',{class:'li',style:''},el('span',{class:'nb sty t-'+s.t,style:'width:30px'},s.t==='n'?String(n):SET_T[s.t][0]),el('span',{class:'grow'},`${s.w!==''&&s.w!=null&&+s.w?`${s.w} lb × `:''}${s.r||0} reps`),s.t!=='n'?el('small',{class:'muted'},SET_T[s.t][1]):null);})));});}});}

/* ---------- muscles and routine balance, last 30 days ---------- */
function wkMuscleCard(){const since=k(addD(today(),-29)),Ls=wkLogs().filter(x=>x.f.date>=since&&x.f.log);if(!Ls.length)return null;const m={};
  Ls.forEach(x=>x.f.log.forEach(e=>{const n=e.sets.filter(s=>s.t!=='w').length;if(!n)return;const i=e.p?e:exInfo(e.name);if(i.p)m[i.p]=(m[i.p]||0)+n;(i.s||[]).forEach(s=>{m[s]=(m[s]||0)+n/2;});}));
  const top=Object.entries(m).sort((a,b)=>b[1]-a[1]).slice(0,8);if(!top.length)return null;const mx=top[0][1];
  return el('section',{class:'card'},el('div',{class:'sh2',style:'padding:0 0 var(--s2)'},el('span',{class:'lbl'},'Muscles · last 30 days'),el('span',{class:'small muted'},'Sets')),el('div',{class:'mgrid'},top.flatMap(([n,v])=>[el('span',{},n),el('span',{class:'mbar'},el('i',{style:`width:${v/mx*100}%`})),el('b',{class:'tnum'},fmtN(v))])),el('p',{class:'small muted',style:'margin-top:var(--s2)'},'Warm-ups don’t count. Muscles a lift also works count as half a set.'));}
const wkCountR=(r,since)=>wkLogs().filter(x=>x.f.date>=since&&(x.f.rid===r.id||(!x.f.rid&&x.f.what===r.f.what))).length;
function wkBalanceCard(){const H=wkHabit(),rs=H?wkRoutines(H):[];if(rs.length<2)return null;const since=k(addD(today(),-29)),cnt=rs.map(r=>[r,wkCountR(r,since)]),other=wkLogs().filter(x=>x.f.date>=since&&!rs.some(r=>x.f.rid===r.id||(!x.f.rid&&x.f.what===r.f.what))).length,tot=cnt.reduce((a,x)=>a+x[1],0)+other,mx=Math.max(1,...cnt.map(x=>x[1]),other);
  const card=el('section',{class:'card'},el('div',{class:'sh2',style:'padding:0 0 var(--s2)'},el('span',{class:'lbl'},'Balance · last 30 days'),el('span',{class:'small muted'},`${tot} workout${tot===1?'':'s'}`)),el('div',{class:'mgrid'},[...cnt.map(([r,n])=>[r.f.what,n]),...(other?[['Other',other]]:[])].flatMap(([n,v])=>[el('span',{},n),el('span',{class:'mbar'},el('i',{style:`width:${v/mx*100}%`})),el('b',{class:'tnum'},String(v))])));
  const top=Math.max(...cnt.map(x=>x[1])),low=cnt.filter(x=>x[1]<top/2).sort((a,b)=>a[1]-b[1])[0];
  if(tot>=4&&low){const r=low[0],tk0=todayK(),days=[];for(let i=0;i<7;i++){const d=k(addD(weekStartOf(today()),i));if(d>=tk0)days.push(d);}const free=days.find(d=>(H.sessions||{})[d]&&!(H.sessions[d].rid));
    card.append(el('div',{class:'nudge'},el('b',{},`${r.f.what} is falling behind`),el('p',{class:'small muted'},`${low[1]} in the last 30 days, versus ${top} for your most-done routine.`),btnP(free?`Make ${DOW[fromK(free).getDay()]} ${r.f.what}`:`Plan ${r.f.what}`,()=>{if(free){H.sessions[free]=Object.assign({},H.sessions[free],{rid:r.id});put(H);toast(`${DOW[fromK(free).getDay()]} is ${r.f.what}`);}else habitPlanSheet(H);},{class:'btn primary sm'})));}
  return card;}

/* ---------- habits linked to the Workouts log and routines ---------- */
const wkHabit=()=>get.all('habit').find(h=>h.link&&h.link.log&&!h.paused&&!h.archived);
function wkRoutines(h){return((h&&h.link&&h.link.rs)||[]).map(id=>get.id(id)).filter(r=>r&&!r.archived);}
const wkLastDone=r=>wkLogs().filter(x=>x.f.rid===r.id||(!x.f.rid&&x.f.what===r.f.what)).map(x=>x.f.date).sort().pop()||'';
function wkOrdered(h){return wkRoutines(h).map((r,i)=>[r,wkLastDone(r),i]).sort((a,b)=>a[1]<b[1]?-1:a[1]>b[1]?1:a[2]-b[2]).map(x=>x[0]);}
const wkNextUp=h=>wkOrdered(h)[0]||null;/* next up = the one you've gone longest without */
function wkFor(h,dk){const s=(h.sessions||{})[dk],p=s&&s.rid&&get.id(s.rid);return p||wkNextUp(h);}
const shortR=r=>{const w=r.f.what.replace(/\s+day$/i,'').trim();return w.length>6?w.slice(0,5)+'.':w;};
/* any change to a logged workout keeps the linked habit honest for that day */
function wkHook(r){if(r&&r.kind==='entry'&&r.hub==='Health'&&r.tool==='workouts'&&r.f&&!r.f.t&&r.f.date){const d=r.f.date;queueMicrotask(()=>wkSyncDay(d));}}
function wkSyncDay(d){const h=wkHabit();if(!h)return;const has=wkLogs().some(x=>x.f.date===d),on=habitDone(h,d);h.logs=h.logs||{};
  if(has&&!on){h.logs[d]=true;put(h,{silent:true});syncHabitGoals(h);App.refresh();}else if(!has&&on){delete h.logs[d];put(h,{silent:true});syncHabitGoals(h);App.refresh();}}
/* checking a linked habit off logs a workout; unchecking takes back only what the check-off added */
function wkHabitToggle(h,dk){h.logs=h.logs||{};
  if(habitDone(h,dk)){const own=wkLogs().filter(x=>x.f.date===dk&&x.f.src==='habit'),other=wkLogs().filter(x=>x.f.date===dk&&x.f.src!=='habit');delete h.logs[dk];put(h,{silent:true});own.forEach(x=>remove(x.id,{silent:true,hard:true}));
    if(other.length){h.logs[dk]=true;put(h,{silent:true});toast(`Still counted: you logged ${other[0].f.what} that day`);}syncHabitGoals(h);return habitDone(h,dk);}
  h.logs[dk]=true;if(h.skips)delete h.skips[dk];if(dk===todayK()){const n=new Date();h.logT=Object.assign({},h.logT,{[dk]:n.getHours()*60+n.getMinutes()});}put(h,{silent:true});
  if(!wkLogs().some(x=>x.f.date===dk)){const last=wkLogs().slice().sort((a,b)=>a.f.date<b.f.date?1:-1)[0],n={id:uid('e'),kind:'entry',hub:'Health',tool:'workouts',f:{what:h.title,min:last&&+last.f.min||45,feel:'Steady',miles:'',date:dk,src:'habit',habit:h.id}};put(n,{silent:true});if(get.settings().wkAsk!==false)setTimeout(()=>wkDetailSheet(n,h),760);}
  syncHabitGoals(h);celebrateStreak(h,dk);return true;}
function wkDetailSheet(n,h){const D={what:n.f.what,min:+n.f.min||45,miles:n.f.miles||'',feel:n.f.feel||'Steady'};const ctx=formCtx(()=>{});let inst;
  const opts=[...new Set([...wkRoutines(h).map(r=>r.f.what),'Strength','Run','Walk','Bike','Yoga','Swim',h.title])];
  inst=openSheet({title:'Workout done',left:{label:'Skip'},right:{label:'Save',onclick:()=>{Object.assign(n.f,{what:String(D.what).trim()||h.title,min:+D.min||0,miles:D.miles,feel:D.feel});const r=wkRoutines(h).find(x=>x.f.what===n.f.what);if(r)n.f.rid=r.id;put(n);inst.close();toast('Saved to Workouts',null,'Undo',{open:dest('tool',{hub:'Health',tool:'workouts'})});}},build:b=>{const box=el('div',{class:'wksheet'});const draw=()=>{box.innerHTML='';
    box.append(el('p',{class:'muted small'},`${h.title} · ${habitWeek(h,todayK())} of ${h.target||1} this week. Add details for your Workouts log, or skip.`),el('div',{class:'sect'},'What you did'),el('div',{class:'chips'},opts.map(o=>el('button',{class:'chip'+(D.what===o?' on':''),'aria-pressed':String(D.what===o),onclick:()=>{D.what=o;draw();}},o))),
      el('div',{class:'group'},ctx.row('min','hour','Minutes',null,{expand:false,trailing:ctx.stepper(D.min,0,300,v=>{D.min=v;},{step:5})}),el('label',{class:'li',style:''},el('span',{class:'grow'},'Distance (optional)'),el('input',{type:'number',inputmode:'decimal',placeholder:'mi',value:D.miles,style:'width:80px;text-align:right;border:0;background:none;font:inherit',oninput:e=>{D.miles=e.target.value;}}))),
      el('div',{class:'sect'},'How it felt'),el('div',{style:'padding:0 2px'},seg([['Easy','Easy'],['Steady','Steady'],['Hard','Hard']],D.feel,v=>{D.feel=v;draw();})));};draw();b.append(box);}});}
function wkStart(h,dk=todayK()){const rs=wkRoutines(h);if(!rs.length||(h.link&&h.link.mode==='pick')){wkPickSheet(h,dk);return;}startWorkout(wkFor(h,dk));}
function wkPickSheet(h,dk=todayK()){const nx=wkNextUp(h);let inst;
  inst=openSheet({title:'Which workout today?',left:{label:'Cancel'},build:b=>{b.append(el('p',{class:'muted'},`Any of them counts toward ${h.target||1} this week.`),
    el('div',{class:'list'},[...wkOrdered(h).map(r=>{const ld=wkLastDone(r),n=planOf(r).length;return el('button',{class:'li',style:'width:100%;text-align:left',onclick:()=>{inst.close();startWorkout(r);}},el('span',{class:'ib',html:ic('play',16,2)}),el('span',{class:'grow'},el('b',{style:'font-weight:600'},r.f.what,r===nx?el('span',{class:'nextup'},'Next up'):null),el('small',{},[n?`${n} exercise${n>1?'s':''}`:null,r.f.min?`about ${r.f.min} min`:null,ld?`last ${relDay(ld)}`:'not done yet'].filter(Boolean).join(' · '))));}),
      el('button',{class:'li',style:'width:100%;text-align:left',onclick:()=>{inst.close();if(!habitDone(h,dk)){toggleItem({kind:'habit',rec:h},dk);App.refresh();}else{const n=create('entry',{hub:'Health',tool:'workouts',f:{what:'Workout',min:30,feel:'Steady',miles:'',date:dk,src:'habit',habit:h.id}});wkDetailSheet(n,h);}}},el('span',{class:'ib',html:ic('spark',16,2)}),el('span',{class:'grow'},el('b',{style:'font-weight:600'},'Something else'),el('small',{},'A run, a class… log it without a routine')))]),
    rsNote(h));}});}
const rsNote=h=>wkRoutines(h).length>1?el('p',{class:'small muted',style:'margin-top:10px'},'Next up is the routine you’ve gone longest without, so nothing gets skipped.'):null;
function wkStartBtn(h,dk=todayK()){const r=wkRoutines(h).length&&!(h.link.mode==='pick')?wkFor(h,dk):null;
  return el('div',{class:'splitbtn'},el('button',{class:'btn primary',onclick:()=>wkStart(h,dk)},el('span',{style:'display:grid',html:ic('play',16,2.2)}),r?`Start ${r.f.what}`:'Start a workout'),wkRoutines(h).length>1&&r?el('button',{class:'btn primary more','aria-label':'Pick another workout',onclick:()=>wkPickSheet(h,dk),html:ic('chevd',16,2.4)}):null);}
/* habit page: what this habit is linked to */
function wkLinkedSection(h){if(h.track&&h.track!=='check')return null;if(!(h.link&&h.link.log)&&!/workout|gym|lift|run|exercise|yoga|swim|bike|cycle|train|cardio|push|pull|legs|pilates|hiit|walk|steps|sport/i.test(h.title||''))return null;const box=el('div',{});
  if(!h.link||!h.link.log){box.append(el('div',{class:'sect'},'Linked to'),el('div',{class:'list'},el('button',{class:'li',style:'width:100%;text-align:left',onclick:()=>wkLinkSheet(h)},el('span',{class:'ib',html:LINKI}),el('span',{class:'grow'},el('b',{style:'font-weight:600'},'Link your Workouts log'),el('small',{},'A logged workout or a finished routine checks this off')),el('span',{style:'display:grid;color:var(--ink-2)',html:ic('chevr',16,2.2)}))));return box;}
  const rs=wkRoutines(h),nx=wkNextUp(h),other=wkHabit();
  const rmenu=(r,n)=>ev=>{const b=ev.currentTarget.getBoundingClientRect();openMenu(b.left,b.bottom,[{label:`Start ${r.f.what}`,icon:'play',onclick:()=>startWorkout(r)},{label:'Edit routine',icon:'edit',onclick:()=>workoutRoutineSheet(r)},n>0?{label:'Move up',icon:'chevu',onclick:()=>{h.link.rs.splice(n,1);h.link.rs.splice(n-1,0,r.id);put(h);}}:null,n<rs.length-1?{label:'Move down',icon:'chevd',onclick:()=>{h.link.rs.splice(n,1);h.link.rs.splice(n+1,0,r.id);put(h);}}:null,{label:'Unlink from this habit',icon:'x',danger:true,onclick:()=>{h.link.rs=h.link.rs.filter(x=>x!==r.id);put(h);}}]);};
  box.append(el('div',{class:'sect'},'Linked to'),el('div',{class:'list'},
    el('div',{class:'li',style:''},el('span',{class:'ib',html:ic('spark',18,2)}),el('button',{class:'grow',style:'text-align:left',onclick:()=>App.go('tool',{hub:'Health',tool:'workouts'})},el('b',{style:'font-weight:600'},'Workouts log'),el('small',{},'Health · uses this habit’s target')),el('button',{class:'iconbtn','aria-label':'Unlink Workouts log',html:DOTS,onclick:ev=>{const b=ev.currentTarget.getBoundingClientRect();openMenu(b.left,b.bottom,[{label:'Open Workouts',icon:'chevr',onclick:()=>App.go('tool',{hub:'Health',tool:'workouts'})},{label:'Unlink',icon:'x',danger:true,onclick:()=>{const was=h.link;h.link=null;put(h);toast('Unlinked',()=>{h.link=was;put(h);});}}]);}})),
    ...rs.map((r,n)=>{const ld=wkLastDone(r);return el('div',{class:'li',style:''},el('span',{class:'rnum'+(r===nx&&h.link.mode!=='pick'?' on':'')},String(n+1)),el('button',{class:'grow',style:'text-align:left',onclick:()=>workoutRoutineSheet(r)},el('b',{style:'font-weight:600'},r.f.what,r===nx&&rs.length>1&&h.link.mode!=='pick'?el('span',{class:'nextup'},'Next up'):null),el('small',{},[(n=>`${n} exercise${n===1?'':'s'}`)(planOf(r).length),ld?`last ${relDay(ld)}`:'not done yet'].join(' · '))),el('button',{class:'iconbtn','aria-label':`More for ${r.f.what}`,html:DOTS,onclick:rmenu(r,n)}));}),
    el('button',{class:'li',style:'width:100%;text-align:left;color:var(--accent-text)',onclick:()=>wkAddRoutineSheet(h)},el('span',{class:'ib',html:ic('plus',18,2.2)}),el('span',{class:'grow',style:'font-weight:500'},rs.length?'Link another routine':'Link a routine'))));
  if(rs.length>1)box.append(el('div',{style:'margin-top:10px'},seg([['turns','Take turns'],['pick','I’ll pick each time']],h.link.mode||'turns',v=>{h.link.mode=v;put(h);})),rsNote(h));
  if(other&&other!==h)box.append(el('p',{class:'small muted'},`${other.title} is also linked. The Workouts log follows the first one.`));
  return box;}
function wkLinkSheet(h){let inst;inst=openSheet({title:'Link to Workouts',left:{label:'Cancel'},build:b=>{b.append(el('p',{},`Link ${h.title} to your Workouts log in Health:`),el('div',{class:'list'},['Logging a workout, or finishing a workout routine, checks this off for that day.','Checking this off adds a workout to the log. You can add details, or skip.','The log uses this habit’s target, so both always agree.'].map(t=>el('div',{class:'li',style:''},el('span',{style:'display:grid;color:var(--accent-text)',html:ic('check',16,2.6)}),el('span',{class:'grow small'},t)))),
  btnP('Link it',()=>{h.link={log:true,rs:[],mode:'turns'};if(h.track&&h.track!=='check')h.track='check';put(h);inst.close();toast('Linked');setTimeout(()=>wkAddRoutineSheet(h),500);},{class:'btn primary block',style:'margin-top:14px'}));}});}
function wkAddRoutineSheet(h){const all=ofType('Health','workouts','routine'),have=new Set((h.link&&h.link.rs)||[]);let inst;
  inst=openSheet({title:'Link routines',left:{label:'Done'},build:b=>{const box=el('div',{});const draw=()=>{box.innerHTML='';
    box.append(el('p',{class:'muted small'},'Pick the workouts that count for this habit. With more than one, they take turns.'));
    if(all.length)box.append(el('div',{class:'list'},all.map(r=>{const on=h.link.rs.includes(r.id);return el('button',{class:'li',style:'width:100%;text-align:left','aria-pressed':String(on),onclick:()=>{if(on)h.link.rs=h.link.rs.filter(x=>x!==r.id);else h.link.rs.push(r.id);put(h,{silent:true});draw();}},el('span',{class:'tick'+(on?' on':''),html:ic('check',14,3)}),el('span',{class:'grow'},el('b',{style:'font-weight:500'},r.f.what),el('small',{},(n=>`${n} exercise${n===1?'':'s'}`)(planOf(r).length))));})));
    box.append(el('button',{class:'addstep',html:ic('plus',20,2)+'New workout routine',onclick:()=>workoutRoutineSheet(null,{after:r=>{if(!h.link.rs.includes(r.id))h.link.rs.push(r.id);put(h);draw();}})}));};draw();b.append(box);},onClose:()=>{put(h);App.refresh();}});void have;}
/* plan sheet for a day chip: which routine that day */
function wkPinSheet(h,d){const rs=wkRoutines(h),s=(h.sessions||{})[d];let inst;const dn=d===todayK()?'Today':DOW[fromK(d).getDay()];
  const set=rid=>{h.sessions=h.sessions||{};h.sessions[d]=Object.assign({time:h.setTime??null},h.sessions[d],{rid});put(h);inst.close();};
  inst=openSheet({title:`${dn}’s workout`,left:{label:'Cancel'},build:b=>{b.append(el('div',{class:'list'},
    el('button',{class:'li',style:'width:100%;text-align:left',onclick:()=>set(null)},el('span',{class:'grow'},'Whatever’s next up'),s&&!s.rid?el('span',{style:'display:grid;color:var(--accent-text)',html:ic('check',16,2.6)}):null),
    ...rs.map(r=>{const on=s&&s.rid===r.id,other=Object.entries(h.sessions||{}).find(([dd,x])=>dd!==d&&dd>=todayK()&&x&&x.rid===r.id);return el('button',{class:'li',style:'width:100%;text-align:left',onclick:()=>set(r.id)},el('span',{class:'grow'},r.f.what),other?el('small',{class:'muted'},`Planned ${DOW[fromK(other[0]).getDay()].slice(0,3)}`):null,on?el('span',{style:'display:grid;color:var(--accent-text)',html:ic('check',16,2.6)}):null);}),
    s?el('button',{class:'li',style:'width:100%;text-align:left;color:var(--danger)',onclick:()=>{delete h.sessions[d];put(h);inst.close();}},el('span',{class:'grow'},`Take ${dn==='Today'?'today':dn} off the plan`)):null));}});}
/* new habit sheet: offer the link when the name sounds like a workout */
function wkSuggest(box,D){if(!box)return;box.innerHTML='';if(D.track&&D.track!=='check')return;
  if(D.link){box.append(el('div',{class:'wksug on'},el('span',{style:'display:grid;color:var(--accent-text)',html:LINKI}),el('span',{class:'grow small'},'Linked to your Workouts log'),el('button',{class:'linkbtn small',onclick:()=>{D.link=null;D._noLink=true;wkSuggest(box,D);}},'Undo')));return;}
  if(D._noLink||!/(work ?out|gym|lift|exercis|training|strength|fitness|push.?pull|leg day)/i.test(D.title||'')||wkHabit())return;
  box.append(el('div',{class:'wksug'},el('div',{style:'display:flex;gap:var(--s3)'},el('span',{class:'ib',html:LINKI}),el('div',{class:'grow'},el('b',{style:'font-weight:600'},'Link to your Workouts log?'),el('p',{class:'small muted',style:'margin:2px 0 0'},'A logged workout checks this off, and the log uses this habit’s target. Add routines like Push, Pull and Legs after.'))),
    el('div',{style:'display:flex;gap:var(--s2);padding-left:48px;margin-top:10px'},el('button',{class:'btn primary sm',onclick:()=>{D.link={log:true,rs:[],mode:'turns'};D.track='check';wkSuggest(box,D);}},'Link it'),el('button',{class:'btn line sm',onclick:()=>{D._noLink=true;wkSuggest(box,D);}},'Not now'))));}
