/* ---------- New user setup: welcome flow, Getting started, and first use of each module ---------- */
const OB_TEST=()=>!!(window.__LIFEOS_TEST__??(location.protocol==='file:'));
const OB_HELP=[['tasks','Staying on top of things','Tasks, deadlines, inbox',[]],['habits','Building habits','Daily and weekly routines',['Personal growth']],['health','Health and fitness','Workouts, meals, care',['Health']],['money','Money','Spending, bills, savings',['Finances']],['home','Home','Chores and upkeep',['Home']],['people','Family and friends','Birthdays, staying in touch',['Relationships']],['career','Career','Wins, 1:1s, job search',['Career']],['learn','Learning','Books, courses, review',['Learning']],['travel','Travel','Trips and packing',['Travel']],['fun','Free time','Outings, hobbies, watchlist',['Recreation']],['growth','Personal growth','Values, experiments, lessons',['Personal growth']]];
const OB_AREA_SUB={'Life admin':'Renewals, documents, accounts',Family:'School, activities, sizes',Pets:'Pet care, walks',Community:'Volunteering, giving',Health:'Workouts, meals, care',Home:'Chores, upkeep, home info',Finances:'Spending, bills, savings',Relationships:'Birthdays, staying in touch',Career:'Wins, 1:1s, job search',Learning:'Books, courses, review cards',Recreation:'Outings, hobbies, watchlist',Travel:'Trips and packing lists','Personal growth':'Values, experiments, lessons'};
const OB_IDEAS=['Pay the rent on Friday','Pick up groceries tomorrow','Walk every day','Call Mom on Sunday','Dinner with Sam Saturday at 7'];
function obGuessArea(t){const l=(t||'').toLowerCase();if(/dentist|doctor|run\b|walk|gym|workout|meds|yoga|stretch|water|sleep|meal/.test(l))return'Health';if(/bill|rent|pay\b|budget|bank|tax|insurance/.test(l))return'Finances';if(/groceries|laundry|clean|fix|trash|vacuum|dishes|garden/.test(l))return'Home';if(/call|mom|dad|birthday|friend|sister|brother|grandma|text\b/.test(l))return'Relationships';if(/meeting|report|boss|resume|interview|email/.test(l))return'Career';if(/read|study|course|learn|practice/.test(l))return'Learning';return null;}
/* what a line of text becomes: a habit, an event, an all-day item or a task */
function obParse(raw){const t=(raw||'').trim();if(!t)return null;const rp=parseRepeat(t),area=obGuessArea(t);
  if(rp){const title=rp.title||t;return{kind:'habit',title:cap1(title),area,label:rp.days?(rp.days.length===7?'Every day':rp.days.length===5?'Weekdays':rp.days.length===2?'Weekends':`Every ${WDN[rp.days[0]]}`):rp.target===1?'Once a week':`${rp.target} times a week`,rp};}
  const w=parseWhen(t,new Date()),title=cap1(w.title||t),sk=suggestKind(t,'',new Date());
  if(w.time!=null){let start=w.time;if(start<8*60&&!/\b(am|a\.m\.)\b/i.test(t))start+=12*60;return{kind:'block',title,area,date:w.date||todayK(),start,label:`${relDay(w.date||todayK())} at ${fmtT(start)}`};}
  if(sk&&sk.kind==='allday'&&(w.date||w.deadline))return{kind:'allday',title,area,date:w.date||w.deadline,label:relDay(w.date||w.deadline)};
  return{kind:'task',title,area,date:w.date||null,deadline:w.deadline||null,label:w.date?relDay(w.date):w.deadline?`By ${relDay(w.deadline)}`:'Anytime'};}
const cap1=s=>s?s.charAt(0).toUpperCase()+s.slice(1):s;
const OB_KIND={task:'Task',habit:'Habit',block:'Event',allday:'All day'};
function obCreate(p){if(p.kind==='habit'){const d=p.rp.days;return create('habit',{title:p.title,notes:'',target:d?d.length:(p.rp.target||3),dur:30,days:d||[],howOften:d?'days':'times',tod:p.rp.tod||'anytime',setTime:null,startDate:todayK(),track:'check',goalN:8,unit:'',area:p.area,color:'sage',icon:null,logs:{},sessions:{},part:null,reminder:null,photos:[]});}
  if(p.kind==='block')return create('block',{title:p.title,notes:'',date:p.date,start:p.start,dur:60,repeat:{type:'never',end:null},reminder:null,part:null,area:p.area,color:'sage',icon:null});
  if(p.kind==='allday')return create('allday',{title:p.title,notes:'',start:p.date,end:null,repeat:{type:'never',end:null},reminder:null,area:p.area,color:'sage',icon:null});
  return newTask(p.title,{date:p.date,deadline:p.deadline,area:p.area});}
function viewWelcome(root){
  const S=App.state,s=get.settings();
  if(!S.ob)S.ob={step:0,name:s.userName||'',help:new Set(),areas:null,days:(s.workDays||[0,1,2,3,4]).slice(),start:(s.work||{}).start??540,end:(s.work||{}).end??1020,evenings:s.protectEvenings!==false,review:s.reviewDay??0,items:[],text:''};
  const O=S.ob,page=el('div',{class:'page ob'});root.append(page);
  const areasFrom=()=>{const set=new Set();O.help.forEach(id=>(OB_HELP.find(h=>h[0]===id)||[])[3].forEach(a=>set.add(a)));if(!set.size)['Health','Home','Finances'].forEach(a=>set.add(a));if(set.size<3)set.add('Home');return AREAS.filter(a=>set.has(a));};
  const go=n=>{if(n===2&&!O.areas)O.areas=areasFrom();O.step=n;draw();window.scrollTo(0,0);};
  const bar=()=>el('div',{class:'ob-top'},O.step>0?el('button',{class:'iconbtn','aria-label':'Back',html:ic('chevl',20,2.2),onclick:()=>go(O.step-1)}):el('span',{style:'width:8px'}),el('div',{class:'ob-prog','aria-label':`Step ${O.step+1} of 5`},[0,1,2,3,4].map(i=>el('i',{class:i<=O.step?'on':''}))),O.step>0?el('button',{class:'linkbtn',onclick:()=>O.step===4?finish():go(O.step+1)},'Skip'):el('span',{style:'width:8px'}));
  const head=(h,p)=>el('div',{class:'ob-head'},el('h1',{},h),p?el('p',{},p):null);
  const cta=(label,fn)=>el('div',{class:'ob-foot'},el('button',{class:'btn primary block ob-cta',onclick:fn},label));
  const chip=(on,label,fn,extra)=>el('button',{class:'ob-pill'+(on?' on':''),'aria-pressed':String(!!on),onclick:fn,...(extra||{})},label);
  function finish(){const made=O.items.map(obParse).filter(Boolean).map(obCreate);
    const cur=get.settings(),areas=O.areas||cur.areas;
    setSettings({userName:O.name.trim()||null,areas,workDays:O.days.slice().sort((a,b)=>a-b),work:Object.assign({},cur.work,{start:O.start,end:O.end}),protectEvenings:O.evenings,reviewDay:O.review,introDone:true,onboardedAt:Date.now(),seenVer:APP_VER,gs:{},foundation:{areas:true,work:true,review:true,goal:!!(cur.foundation||{}).goal,calendar:!!(cur.foundation||{}).calendar}});
    S.ob=null;S.stack=[];App.go('today');toast(made.length?`${made.length} thing${made.length>1?'s':''} added. Welcome${O.name.trim()?', '+O.name.trim():''}.`:`Welcome${O.name.trim()?', '+O.name.trim():''}.`);}
  function draw(){page.innerHTML='';page.append(bar());
    if(O.step===0){const name=el('input',{id:'ob-name',type:'text',placeholder:'Your first name',autocomplete:'given-name',value:O.name,oninput:e=>O.name=e.target.value,onkeydown:e=>{if(e.key==='Enter')go(1);}});
      page.append(el('div',{class:'ob-head'},el('h1',{class:'ob-big'},'Welcome to Life OS'),el('p',{},'One calm place for what needs you today, across your whole life.')),
        el('div',{class:'ob-why'},[['sun','Today shows what needs you','Tasks, habits, bills and plans in one list.'],['layers','Plan your week in a few taps','Studio finds room around your work hours.'],['rep','Look back once a week','See what got done and set up the next week.']].map(([i,a,b])=>el('div',{},el('span',{class:'ob-ic',html:ic(i,20)}),el('span',{},el('b',{},a),el('small',{},b))))),
        el('label',{class:'ob-field',for:'ob-name'},'What should we call you?',name),
        el('div',{class:'ob-foot'},el('button',{class:'btn primary block ob-cta',onclick:()=>go(1)},'Get started'),el('button',{class:'linkbtn',style:'min-height:44px;align-self:center',onclick:()=>{loadExamples();setSettings({onboardedAt:Date.now(),gs:{basics:true},seenVer:APP_VER});S.ob=null;App.go('today');}},'Look around with examples first'),el('p',{class:'small muted',style:'text-align:center'},'Takes about a minute. You can skip any step.')));}
    else if(O.step===1){const n=O.help.size;
      page.append(head('What do you want help with?','Pick as many as you like. We’ll set up the right places and keep the rest out of your way.'),
        el('div',{class:'ob-grid'},OB_HELP.map(([id,t,sub])=>el('button',{class:'ob-opt'+(O.help.has(id)?' on':''),'aria-pressed':String(O.help.has(id)),onclick:e=>{O.help.has(id)?O.help.delete(id):O.help.add(id);O.areas=null;draw();}},el('b',{},t),el('small',{},sub)))),
        cta(n?`Continue with ${n}`:'Continue',()=>go(2)));}
    else if(O.step===2){const why=a=>{const h=OB_HELP.find(x=>O.help.has(x[0])&&x[3].includes(a));return h?`From “${h[1]}”`:OB_AREA_SUB[a];};
      page.append(head('Your life areas','We turned these on from your answers. Each one gets its own page. Change them any time in Settings.'),
        el('div',{class:'list'},AREAS.map(a=>{const on=O.areas.includes(a);return el('div',{class:'li',style:'min-height:58px'},el('span',{class:'grow'},el('b',{style:'font-weight:600'},a),el('small',{},on?why(a):OB_AREA_SUB[a])),el('button',{class:'ob-sw'+(on?' on':''),role:'switch','aria-checked':String(on),'aria-label':a,onclick:()=>{O.areas=on?O.areas.filter(x=>x!==a):AREAS.filter(x=>x===a||O.areas.includes(x));draw();}},el('i')));})),
        cta('Continue',()=>{if(!O.areas.length){toast('Pick at least one area');return;}go(3);}));}
    else if(O.step===3){const tsel=(id,v,on)=>{const sl=el('select',{id,onchange:e=>on(+e.target.value)});for(let m=5*60;m<=23*60;m+=30){const o=el('option',{value:m},fmtT(m));if(m===v)o.selected=true;sl.append(o);}return sl;};
      page.append(head('Your week','So Studio plans around your work, and knows when to ask you to look back.'),
        el('section',{class:'card ob-card'},el('span',{class:'lbl'},'Work days'),el('div',{class:'ob-days'},WD.map((d,i)=>chip(O.days.includes(i),d,()=>{O.days=O.days.includes(i)?O.days.filter(x=>x!==i):[...O.days,i];draw();},{'aria-label':WDN[i]}))),
          el('span',{class:'lbl'},'Hours'),el('div',{class:'ob-2'},el('label',{class:'ob-field',for:'ob-st'},'Start',tsel('ob-st',O.start,v=>O.start=v)),el('label',{class:'ob-field',for:'ob-en'},'End',tsel('ob-en',O.end,v=>O.end=v))),
          el('label',{class:'ob-check'},el('input',{type:'checkbox',checked:O.evenings||null,onchange:e=>O.evenings=e.target.checked}),'Keep evenings free on work days')),
        el('section',{class:'card ob-card'},el('span',{class:'lbl'},'Weekly look back'),el('div',{class:'ob-row'},[5,6,0,1].map(d=>chip(O.review===d,DOW[d].slice(0,3),()=>{O.review=d;draw();},{'aria-label':DOW[d]}))),el('p',{class:'small muted'},'Your first one comes after you’ve used Life OS for a week, so there’s something to look back on.')),
        cta('Continue',()=>go(4)));}
    else{const list=el('div'),inp=el('input',{id:'ob-cap',type:'text',placeholder:'e.g. Call the dentist Thursday',autocomplete:'off',enterkeyhint:'done',value:O.text,oninput:e=>O.text=e.target.value,onkeydown:e=>{if(e.key==='Enter'){e.preventDefault();add(O.text);}}}),
        ctaBtn=el('button',{class:'btn primary block ob-cta',onclick:finish}),ideas=el('div',{class:'ob-row'});
      function add(t){t=(t||'').trim();if(!t){inp.focus();return;}O.items.push(t);O.text='';inp.value='';drawList();inp.focus({preventScroll:true});}
      function drawList(){list.innerHTML='';const ps=O.items.map(obParse);
        if(ps.length)list.append(el('div',{class:'list'},ps.map((p,i)=>el('div',{class:'li',style:'min-height:60px;padding-right:6px'},el('span',{class:'grow',style:'min-width:0'},el('b',{style:'font-weight:600;overflow-wrap:anywhere'},p.title),el('span',{class:'tags',style:'margin-top:5px'},pill(OB_KIND[p.kind],'soft'),pill(p.label,'neu'),p.area?pill(p.area,'neu'):null)),el('button',{class:'iconbtn','aria-label':`Remove ${p.title}`,html:ic('x',14,2.2),onclick:()=>{O.items.splice(i,1);drawList();}})))),el('p',{class:'small muted',style:'padding:0 4px'},'We read the type, day and area from your words. Tap an item later to change any of it.'));
        ideas.innerHTML='';OB_IDEAS.filter(x=>!O.items.includes(x)).forEach(x=>ideas.append(el('button',{class:'ob-pill',onclick:()=>add(x)},`+ ${x}`)));
        ctaBtn.textContent=O.items.length?`Add ${O.items.length} and open Today`:'Open Today';}
      page.append(head('What’s on your mind?','Add whatever you need to do or remember, one at a time. Type it the way you’d say it.'),
        el('div',{class:'ob-add'},el('label',{for:'ob-cap',class:'sr'},'Something on your mind'),inp,el('button',{class:'btn primary','aria-label':'Add it',html:ic('plus',22,2.4),onclick:()=>add(O.text)})),
        list,el('div',{class:'ob-ideas'},el('span',{class:'lbl'},'Need ideas? Tap to add'),ideas),el('div',{class:'ob-foot'},ctaBtn));drawList();}
  }
  draw();
}
/* ---------- Getting started on Today ---------- */
const GS_STEPS=[['basics','Set up your basics','Areas, work hours and review day'],['item','Add your first item','A task, habit or event'],['hold','Touch and hold anything','Edit, move or delete from the menu'],['swipe','Swipe a task','Right to finish it, left to move it to tomorrow'],['capture','Capture with +','Get a thought out of your head in two taps'],['area','Open one of your life areas','Each one suggests what to fill in first']];
function gsState(){const s=get.settings(),g=Object.assign({},s.gs);g.basics=g.basics||!!s.onboardedAt;g.item=g.item||[...recs.values()].some(r=>['task','habit','block','allday','goal','project'].includes(r.kind)&&!r.example);return g;}
function markGs(k){const s=get.settings();if(!s||!s.onboardedAt||s.gsOff||(s.gs||{})[k])return;put(Object.assign({},DEFAULT_SETTINGS,s,{gs:Object.assign({},s.gs,{[k]:true})}),{silent:true});}
function gsCard(){const s=get.settings();if(!s.onboardedAt||s.gsOff)return null;const g=gsState(),n=GS_STEPS.filter(x=>g[x[0]]).length;if(n===GS_STEPS.length)return null;
  return el('section',{class:'card gs'},el('div',{class:'bl'},el('span',{class:'lbl',style:'color:var(--accent-text)'},'Getting started'),el('span',{style:'display:flex;align-items:center;gap:4px'},el('span',{class:'small muted tnum'},`${n} of ${GS_STEPS.length}`),el('button',{class:'iconbtn','aria-label':'Hide Getting started',style:'width:32px;height:32px',html:ic('x',14,2.2),onclick:()=>{setSettings({gsOff:true});toast('Hidden. Find it again in Settings › Help.',()=>setSettings({gsOff:false}));}}))),meter(n/GS_STEPS.length),
    el('div',{class:'list',style:'box-shadow:none;border:0;background:none'},GS_STEPS.map(([k,t,sub])=>{const on=!!g[k];return el('div',{class:'li tick-host'+(on?' done':''),style:'min-height:52px;padding-inline:0'},el('span',{class:'tick-hit'},tickBtn(on,v=>{const cur=get.settings();setSettings({gs:Object.assign({},cur.gs,{[k]:v})});},on?`Mark not done: ${t}`:`Mark done: ${t}`)),el('button',{class:'grow',style:'text-align:left',onclick:()=>gsGo(k)},el('span',{class:'tt',style:'font-weight:600'},t),el('small',{},sub)));})));}
function gsGo(k){if(k==='basics')App.go('foundation');else if(k==='item'||k==='capture')captureSheet(null);else if(k==='area')App.go('areas');else if(k==='hold')toast(isTouch()?'Touch and hold any task, habit or list item':'Right-click any task, habit or list item');else if(k==='swipe')App.go('tasks');}
/* ---------- First use of a module ---------- */
const TI_W={T:['sun','Today'],C:['cal','Calendar'],R:['rep','Weekly review'],I:['chart','Insights'],S:['chart','Spending'],P:['heart','People'],F:['search','Search']};
const TOOL_INTRO={
 workouts:{say:'Log your workouts and watch your week fill in.',shows:[['T','Workouts you plan, and how your week is going'],['C','Any workout you give a time'],['R','Sessions and minutes, next to your habits']],add:'Log your first workout',ask:'workouts'},
 meals:{say:'Plan dinners for the week and keep the recipes you make again and again.',shows:[['T','Tonight’s dinner'],['R','Nights planned this week']],add:'Plan tonight’s dinner',run:(hub,t)=>planDinner(hub,t,todayK())},
 prep:{say:'Cook once, eat all week. Plan a batch, shop for it, then keep track of what’s in the fridge.',shows:[['T','Prep day, and anything to eat soon'],['S','Ingredients go on your grocery list']],add:'Add a dish to prep',ask:'prep',run:()=>prepAddDish(prepCfg())},
 measure:{say:'Track a number that matters to your health, like weight or blood pressure.',shows:[['I','A chart over time']],add:'Track your first number'},
 care:{say:'Checkups, appointments and medications in one place, so nothing slips.',shows:[['T','Doses to take and visits that are due'],['C','Appointments you book']],add:'Add an appointment'},
 spending:{say:'See where your money goes each month, and how it compares to your plan.',shows:[['I','This month by category'],['R','Spent vs. your plan']],add:'Add an expense',run:(hub,t)=>expenseSheet(hub,t)},
 income:{say:'Your paychecks and other income, counted on each payday.',shows:[['I','Money in vs. money out']],add:'Add your income'},
 bills:{say:'Every bill and when it’s due, so nothing sneaks up on you.',shows:[['T','Bills due in the next two days'],['S','Paid bills count toward spending']],add:'Add your first bill'},
 savings:{say:'Savings goals, with progress toward each one.',shows:[['I','Progress over time']],add:'Add a savings goal'},
 networth:{say:'Your accounts and debts, so you can watch your net worth grow.',shows:[['I','A monthly snapshot']],add:'Add an account'},
 chores:{say:'Chores that come back on their own schedule, so the house never falls behind.',shows:[['T','Chores that are due'],['R','Chores done this week']],add:'Add your first chore'},
 upkeep:{say:'Seasonal checks and home maintenance, from filters to gutters.',shows:[['T','Upkeep that’s due']],add:'Add a recurring task'},
 info:{say:'Appliances, warranties, the plumber’s number and the Wi-Fi details, in one place.',shows:[['F','Find any of it from search']],add:'Add an appliance'},
 vehicle:{say:'Service history and what’s due next for your car.',shows:[['T','Service that’s due soon']],add:'Log a service'},
 people:{say:'The people you want to stay close to, with a nudge when it’s been a while.',shows:[['T','Who to reach out to'],['R','People you were in touch with']],add:'Add someone'},
 dates:{say:'Birthdays and anniversaries, with time to prepare.',shows:[['C','Every date, each year'],['T','A heads-up a week before']],add:'Add a date'},
 gifts:{say:'Gift ideas for everyone, and a budget for the holidays.',shows:[['S','What you spend on gifts']],add:'Add a gift idea'},
 wins:{say:'Wins big and small, ready for your next review or résumé.',shows:[['R','Wins from the week']],add:'Log a win'},
 oneonones:{say:'1:1 meetings with an agenda that builds up between them.',shows:[['C','Your next 1:1'],['T','Action items you own']],add:'Add a 1:1 series'},
 skills:{say:'Skills you’re building, and how far along you are.',shows:[['R','Progress on each skill']],add:'Add a skill'},
 jobs:{say:'Job applications from saved to offer, with follow-ups.',shows:[['T','Follow-ups that are due']],add:'Add a job'},
 reading:{say:'What you’re reading, what’s next, and your goal for the year.',shows:[['R','Pages read this week'],['I','Books finished this year']],add:'Add a book',ask:'reading'},
 courses:{say:'Courses and lessons, with a weekly time goal.',shows:[['R','Time spent learning']],add:'Add a course'},
 review:{say:'Cards for things you want to remember, reviewed a few minutes a day.',shows:[['T','Cards due today']],add:'Add a card'},
 paths:{say:'A step-by-step plan for learning something new.',shows:[['R','Steps done']],add:'Start a path'},
 trips:{say:'Trips with bookings, a packing list and a budget.',shows:[['C','Trip days and bookings'],['T','What’s happening on the day']],add:'Add a trip'},
 docs:{say:'Passports, IDs and travel documents, with expiry dates.',shows:[['F','Find any of it from search']],add:'Add a document'},
 outings:{say:'Places to go and things to do on a free afternoon.',shows:[['C','Outings you plan']],add:'Add an idea'},
 hobbies:{say:'Time spent on the things you do for fun.',shows:[['I','Hours each week']],add:'Add a hobby'},
 queue:{say:'Shows, movies, games and podcasts to get to.',shows:[['F','Find any of it from search']],add:'Add something to watch'},
 experiments:{say:'Try a change for a set time, then decide with real data.',shows:[['T','Log each day of the experiment']],add:'Start an experiment',noCard:true},
 lessons:{say:'Lessons life has taught you, in your words, resurfaced now and then.',shows:[['T','One resurfaces on Today now and then']],add:'Write a lesson'},
};
const toolKey=(hub,id)=>`${hub}/${id}`;
function toolFresh(hub,t){if(OB_TEST()&&!window.__LIFEOS_INTROS__)return false;const s=get.settings(),key=toolKey(hub,t.id),ti=TOOL_INTRO[t.id]||t.intro;if(!ti||(s.toolSeen||{})[key])return false;
  if(t.id==='prep'&&(prepCfg().f.plan||[]).length)return false;if(t.id==='packing')return false;return entries(hub,t.id).length===0;}
function toolMark(field,key,v=true){const s=get.settings();put(Object.assign({},DEFAULT_SETTINGS,s,{[field]:Object.assign({},s[field],{[key]:v})}),{silent:true});}
function toolIntroPage(page,hub,t){const ti=TOOL_INTRO[t.id]||t.intro,key=toolKey(hub,t.id),c=cfg(hub,t.id);if(!(get.settings().toolFresh||{})[key])toolMark('toolFresh',key);
  toolHead(page,hub,t,{actions:[]});
  const ask=(()=>{if(ti.ask==='workouts'){const v=c.f.target||3;return[el('b',{style:'font-weight:600'},'How many workouts a week are you aiming for?'),el('div',{class:'ob-row'},[1,2,3,4,5].map(n=>el('button',{class:'ob-pill wide'+(c.f.target===n?' on':''),'aria-pressed':String(c.f.target===n),onclick:()=>{c.f.target=n;put(c);}},String(n))))];}
    if(ti.ask==='prep'){const d=c.f.day;return[el('b',{style:'font-weight:600'},'Which day do you usually prep?'),el('div',{class:'ob-row'},[0,6,1,3].map(n=>el('button',{class:'ob-pill'+(d===n?' on':''),'aria-pressed':String(d===n),onclick:()=>{c.f.day=n;put(c);}},DOW[n])))];}
    if(ti.ask==='reading'){return[el('b',{style:'font-weight:600'},'How many books would you like to read this year?'),el('div',{class:'ob-row'},[6,12,24,52].map(n=>el('button',{class:'ob-pill'+(c.f.goal===n?' on':''),'aria-pressed':String(c.f.goal===n),onclick:()=>{c.f.goal=n;put(c);}},String(n))))];}
    return null;})();
  page.append(el('section',{class:'card ob-card'},el('p',{class:'ob-say'},ti.say),el('span',{class:'lbl'},'Where it shows up'),el('div',{class:'ob-why'},ti.shows.map(([w,txt])=>el('div',{},el('span',{class:'ob-ic',html:ic(TI_W[w][0],18)}),el('span',{},el('b',{},TI_W[w][1]),el('small',{},txt)))))));
  if(ask)page.append(el('section',{class:'card ob-card'},...ask));
  const sb=starterBlock(hub,t);if(sb)page.append(sb);const pickN=((App.state.obPick||{})[pinKey(hub,t.id)]||[]).length;
  page.append(el('div',{style:'display:flex;flex-direction:column;gap:8px'},pickN?btnP(`Add ${pickN} and start`,()=>{const n=starterMake(hub,t);toolMark('toolSeen',key);toast(`${n} added`);App.refresh();},{style:'width:100%',icon:'check'}):btnP(ti.add,()=>{if(ti.run)ti.run(hub,t);else entrySheet(hub,t);},{style:'width:100%',icon:'plus'}),btnL('Look around first',()=>{toolMark('toolSeen',key);App.refresh();},{style:'width:100%'})));}
function toolAfterNote(hub,t){const s=get.settings(),key=toolKey(hub,t.id),ti=TOOL_INTRO[t.id]||t.intro;if(!ti||!(s.toolFresh||{})[key]||(s.toolNoted||{})[key])return null;const l=entries(hub,t.id);if(!l.length)return null;
  const first=l.slice().sort((a,b)=>(a.createdAt||0)-(b.createdAt||0))[0],name=t.title?t.title(first):(first.f.what||''),places=ti.shows.map(([w])=>TI_W[w][1]).filter(x=>x!=='Search');
  const where=places.length?`It shows up ${andList(places.map(p=>p==='Today'?'on Today':p==='Calendar'?'on your calendar':p==='Weekly review'?'in your weekly review':p==='People'?'on their People page':'in '+p))}.`:'Find it any time from search.';
  return el('section',{class:'card ob-note'},el('div',{style:'display:flex;gap:12px;align-items:flex-start'},el('span',{class:'ob-ok',html:ic('check',15,3)}),el('div',{style:'display:flex;flex-direction:column;gap:4px;min-width:0'},el('b',{style:'font-weight:600'},`${cap1(name||t.word)} added.`),el('p',{class:'small'},where))),el('button',{class:'btn primary sm',style:'align-self:flex-end',onclick:()=>{toolMark('toolNoted',key);App.refresh();}},'Got it'));}
