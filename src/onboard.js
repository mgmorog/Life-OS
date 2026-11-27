/* ---------- New user setup: welcome flow, Getting started, and first use of each module ---------- */
const OB_TEST=()=>!!(window.__LIFEOS_TEST__??(location.protocol==='file:'));
const OB_HELP=[['tasks','Staying on top of things','Tasks, deadlines, inbox',[]],['habits','Building habits','Daily and weekly routines',['Personal growth']],['health','Health and fitness','Workouts, meals, care',['Health']],['money','Money','Spending, bills, savings',['Finances']],['home','Home','Chores and upkeep',['Home']],['people','Family and friends','Birthdays, staying in touch',['Relationships']],['career','Career','Wins, 1:1s, job search',['Career']],['learn','Learning','Books, courses, review',['Learning']],['travel','Travel','Trips and packing',['Travel']],['fun','Free time','Outings, hobbies, watchlist',['Recreation']],['growth','Personal growth','Values, experiments, lessons',['Personal growth']]];
/* v313 · a starter set: plain choices that turn on a module and, for daily ones, a Today card. At most six modules and four cards; from Settings it only adds */
const TRACK_SET=[['energy','Energy and mood','A quick check-in each day','Health','checkin',1],['workouts','Workouts','What you did and for how long','Health','workouts',1],['sleep','Sleep','How long and how well','Health','sleep',1],['mindful','Meditation','Minutes, day by day','Health','mindful',1],['spending','Spending','Where the money goes','Finances','spending',1],['bills','Bills','What’s due and when','Finances','bills',0],['savings','Savings','Goals and how close you are','Finances','savings',0],['reading','Reading','Books and pages','Learning','reading',1],['cards','Flashcards','A few minutes of review','Learning','review',1],['chores','Chores','Who does what, how often','Home','chores',1],['plants','Plants','When each one needs water','Home','plants',1],['journal','Journal','A line or two a day','Personal growth','journal',1],['walks','Pet walks','Walks and how long','Pets','walks',1]];
function applyStarters(ids){const s=get.settings(),picks=TRACK_SET.filter(x=>ids.includes(x[0])).slice(0,6);let areas=(s.areas||AREAS).slice(),mods=0,cards=0;
  picks.forEach(([,,,h])=>{if(!areas.includes(h))areas.push(h);});if(areas.length!==(s.areas||AREAS).length)setSettings({areas:AREAS.filter(a=>areas.includes(a)).concat(areas.filter(a=>!AREAS.includes(a)))});
  picks.forEach(([,,,h,id])=>{let t=null;try{t=toolOf(h,id);}catch(e){}if(!t)return;if(!toolOn(h,id)){setToolOn(h,id,true);mods++;}});
  const want=picks.filter(x=>x[5]).slice(0,4).map(([,,,h,id])=>'m:'+pinKey(h,id));
  tdEach(L=>{let ch=false;want.forEach(key=>{if(L.some(x=>x.id===key)||L.filter(x=>x.id.startsWith('m:')).length>=6)return;const a=L.findIndex(x=>x.id==='also');L.splice(a>=0?a:L.length,0,{id:key,when:'always'});ch=true;});return ch?undefined:false;});
  cards=want.filter(key=>todayLayout().some(x=>x.id===key)).length;return{mods,cards};}
/* v319 · tiles carry the module's icon; from Settings, ones already on Today show as added */
function starterHave(h,tool){try{return toolOn(h,tool)&&todayLayout().some(x=>x.id==='m:'+pinKey(h,tool));}catch(e){return false;}}
function starterGrid(sel,max,onTap,opts={}){return el('div',{class:'ob-grid'},TRACK_SET.filter(x=>!opts.only||opts.only.includes(x[0])||sel.has(x[0])).map(([id,t,sub,h,tool])=>{const on=sel.has(id),have=opts.have&&starterHave(h,tool);let icn='grid';try{icn=(toolOf(h,tool)||{}).icon||'grid';}catch(e){}
  return el('button',{class:'ob-opt'+(on?' on':'')+(have?' have':''),'aria-pressed':String(on||have),disabled:have||null,onclick:()=>{if(!on&&sel.size>=max){toast(`Up to ${max} to start`);return;}on?sel.delete(id):sel.add(id);onTap();}},
    el('span',{class:'ob-oi','aria-hidden':'true',html:ic(icn,IC.md)}),el('span',{class:'ob-ock','aria-hidden':'true',html:ic('check',IC.xs)}),el('b',{},t),el('small',{},have?'On Today':sub));}));}
function starterSheet(){const sel=new Set(),L0=todayLayout();const inst=openSheet({title:'Starter set',left:{label:'Cancel'},right:{label:'Add',onclick:()=>{if(!sel.size){inst.close();return;}const before=clone({l:get.settings().todayLayout||null,p:get.settings().todayPins||[],h:get.settings().hubShown||{},x:get.settings().hubHidden||{},a:get.settings().areas});const r=applyStarters([...sel]);inst.close();App.refresh();toast(`${r.cards} card${r.cards===1?'':'s'} added to Today`,()=>{setSettings({todayLayout:before.l,todayPins:before.p,hubShown:before.h,hubHidden:before.x,areas:before.a});App.refresh();},'Undo',{force:true});}},build:b=>{const draw=()=>{b.innerHTML='';b.append(el('p',{class:'small muted',style:'margin:0 var(--s1) var(--s3)'},'Pick up to six things to keep track of. Daily ones get a card on Today. Nothing you already have changes.'),starterGrid(sel,6,draw,{have:true}));};draw();}});return inst;}

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
function obCreate(p){if(p.kind==='habit'){const d=p.rp.days;return create('habit',{title:p.title,notes:'',target:d?d.length:(p.rp.target||3),dur:30,days:d||[],howOften:d?'days':'times',tod:p.rp.tod||'anytime',setTime:null,startDate:todayK(),track:'check',goalN:8,unit:'',area:p.area,color:defCol(),icon:null,logs:{},sessions:{},part:null,reminder:null,photos:[]});}
  if(p.kind==='block')return create('block',{title:p.title,notes:'',date:p.date,start:p.start,dur:60,repeat:{type:'never',end:null},reminder:null,part:null,area:p.area,color:defCol(),icon:null});
  if(p.kind==='allday')return create('allday',{title:p.title,notes:'',start:p.date,end:null,repeat:{type:'never',end:null},reminder:null,area:p.area,color:defCol(),icon:null});
  return newTask(p.title,{date:p.date,deadline:p.deadline,area:p.area});}
/* v336 · new-person flow: welcome, name and a preview, then five named steps:
   areas, what to keep track of, your week, staying on track (notifications, calendars), what's on your mind */
const OB_STEPS=[['Areas','leaf','Your life areas'],['Tracking','spark','What to keep track of'],['Your week','cal','Your week'],['Reminders','bell','Reminders and calendars'],['Brain dump','task','What’s on your mind']];
function viewWelcome(root){
  const S=App.state,s=get.settings(),replay=!!s.onboardedAt;
  if(!S.ob)S.ob={step:replay?2:0,name:s.userName||'',areas:(s.areas||['Health','Home','Finances']).slice(),days:(s.workDays||[0,1,2,3,4]).slice(),start:(s.work||{}).start??540,end:(s.work||{}).end??1020,evenings:s.protectEvenings!==false,review:s.reviewDay??0,items:[],text:'',track:new Set(),nudge:(s.habitNudge||{}).on!==false,rev:s.revRemind!==false,digest:!!(s.digest||{}).on};
  if(!replay&&S.ob.step===0&&!S.ob._init){S.ob.areas=['Health','Home','Finances'];S.ob._init=1;}
  const O=S.ob,page=el('div',{class:'page ob'});root.append(page);const ctx=formCtx(()=>draw());
  const go=n=>{O.step=n;draw();window.scrollTo(0,0);};
  const bar=()=>{const k=O.step-1;if(O.step===0)return el('div',{class:'ob-top'});
    return el('div',{class:'ob-top'},IconButton('Back',{html:ic('chevl',IC.md),onclick:()=>O.step===2&&replay?(S.ob=null,App.back('prefs')):go(O.step-1)}),
      k>=1?el('div',{class:'ob-prog2'},el('span',{class:'obbar'},el('span',{style:`width:${k*20}%`})),el('span',{},`${k} of 5 · ${OB_STEPS[k-1][0]}`)):el('span',{class:'grow'}),
      k>=1?Button('Skip',{variant:'link',onclick:()=>O.step===6?finish():go(O.step+1)}):el('span',{style:'width:8px'}));};
  const head=(h,p)=>el('div',{class:'ob-head'},el('h1',{},h),p?el('p',{},p):null);
  const cta=(label,fn,more)=>el('div',{class:'ob-foot'},Button(label,{variant:'primary',full:true,cls:'ob-cta',onclick:fn}),more||null);
  const tile=(on,icon,t,sub,fn)=>el('button',{class:'ob-opt'+(on?' on':''),'aria-pressed':String(on),onclick:fn},el('span',{class:'ob-oi','aria-hidden':'true',html:ic(icon,IC.md)}),el('span',{class:'ob-ock','aria-hidden':'true',html:ic('check',IC.xs)}),el('b',{},t),el('small',{},sub));
  function finish(){const made=O.items.map(obParse).filter(Boolean).map(obCreate),cur=get.settings(),nm=O.name.trim();
    const hn=cur.habitNudge||{},dg=cur.digest||{},hasJobs=Array.isArray(cur.jobs)&&cur.jobs.length;
    setSettings({userName:nm||null,areas:O.areas.length?O.areas:cur.areas,...(hasJobs?{}:{workDays:O.days.slice().sort((a,b)=>a-b),work:Object.assign({},cur.work,{start:O.start,end:O.end})}),protectEvenings:O.evenings,reviewDay:O.review,introDone:true,onboardedAt:cur.onboardedAt||Date.now(),seenVer:APP_VER,gs:Object.assign({},cur.gs,{basics:true}),foundation:{...(cur.foundation||{}),areas:true,work:true,review:true},habitNudge:{...hn,on:O.nudge},revRemind:O.rev,digest:{...dg,on:O.digest}});
    let tr=0;if(O.track.size){tr=O.track.size;applyStarters([...O.track]);}
    S.ob=null;S.stack=[];App.go('today');
    const bits=[`${O.areas.length} area${O.areas.length===1?'':'s'}`,tr?`${tr} tracker${tr===1?'':'s'}`:null,made.length?`${made.length} item${made.length===1?'':'s'}`:null].filter(Boolean);
    toast(replay?'Setup updated':`Welcome${nm?', '+nm:''}. ${andList(bits)} ${bits.length>1||!/^1 /.test(bits[0])?'are':'is'} ready.`);}
  function draw(){page.innerHTML='';page.append(bar());
    if(O.step===0){
      page.append(el('div',{class:'ob-mark',html:ic('leaf',IC.xl)}),el('div',{class:'ob-head'},el('h1',{class:'ob-big'},'Welcome to Life OS'),el('p',{},'One calm place for what needs you today, across your whole life.')),
        el('div',{class:'list'},[['Today shows what needs you','Tasks, habits, bills and plans in one list'],['Plan your week in a few taps','Studio finds room around your work'],['Look back once a week','See what got done, set up the next']].map(([a,b])=>Row({as:'div'},el('span',{class:'grow'},el('b',{style:'font-weight:500'},a),el('small',{},b))))),
        cta('Set it up for me',()=>go(1),el('div',{style:'display:contents'},Button('Explore with the demo first',{variant:'text',full:true,onclick:()=>askConfirm({title:'Try the demo?',body:'Fills every area with realistic data so you can see the app at full use. Clear it any time from Data & help.',yes:'Load demo',danger:false,no:'Cancel',onYes:()=>{loadDemo();setSettings({onboardedAt:Date.now(),gs:{basics:true},seenVer:APP_VER,introDone:true});S.ob=null;App.go('today');}})}),Caption('About two minutes. Skip anything.',{as:'p',style:'text-align:center'}))));}
    else if(O.step===1){const name=el('input',{id:'ob-name',type:'text',placeholder:'Your first name',autocomplete:'given-name',value:O.name,oninput:e=>O.name=e.target.value,onkeydown:e=>{if(e.key==='Enter')go(2);}});
      page.append(head('Hi there','What should we call you?'),el('label',{class:'ob-field',for:'ob-name'},el('span',{class:'sr'},'Your first name'),name),
        SectionLabel('Next, five quick questions'),el('div',{class:'list'},OB_STEPS.map(([,i,t],k)=>Row({as:'div'},IconTile(null,{html:ic(i,IC.md)}),el('span',{class:'grow'},el('b',{style:'font-weight:500'},t)),Caption(String(k+1),{as:'span'})))),
        cta('Continue',()=>go(2)));setTimeout(()=>{if(!O.name&&!isTouch())name.focus();},50);}
    else if(O.step===2){const all=[...AREAS,...OPT_AREAS],sub=a=>OB_AREA_SUB[a]||'';
      page.append(head('Which parts of life?','Each one gets its own page. Change them any time in Settings.'),
        el('div',{class:'ob-grid'},all.map(a=>{const on=O.areas.includes(a);return tile(on,areaIcon(a),a,sub(a),()=>{O.areas=on?O.areas.filter(x=>x!==a):all.filter(x=>x===a||O.areas.includes(x));draw();});})),
        cta(O.areas.length?`Continue with ${O.areas.length}`:'Pick at least one',()=>{if(!O.areas.length){toast('Pick at least one area');return;}go(3);}));}
    else if(O.step===3){const n=O.track.size,only=TRACK_SET.filter(x=>O.areas.includes(x[3])).map(x=>x[0]);
      page.append(head('What do you want to keep track of?','Pick up to six. Daily ones get a card on Today.'),starterGrid(O.track,6,draw,{only:only.length>=3?only:null}),cta(n?`Continue with ${n}`:'Skip for now',()=>go(4)));}
    else if(O.step===4&&Array.isArray(get.settings().jobs)&&get.settings().jobs.length){const g=el('div',{class:'list'});g.append(setRow('Working hours',jobsSummary(get.settings()),null,workSheet));
      page.append(head('Your week','So Studio plans around your work.'),g,Card({cls:'ob-card'},el('span',{class:'lbl'},'Weekly look back'),el('div',{class:'ob-row'},[5,6,0,1].map(d=>Chip(DOW[d].slice(0,3),{selected:O.review===d,'aria-label':DOW[d],onclick:()=>{O.review=d;draw();}})))),cta('Continue',()=>go(5)));}
    else if(O.step===4){const g=el('div',{class:'list'});
      g.append(ctx.row('st','time','Start',fmtT(O.start),{valOn:true}));if(ctx.open==='st')g.append(ctx.panel('st','wide',ctx.wheel(()=>O.start,v=>{O.start=v;})));
      g.append(ctx.row('en','ends','End',fmtT(O.end),{valOn:true}));if(ctx.open==='en')g.append(ctx.panel('en','wide',ctx.wheel(()=>O.end,v=>{O.end=v;})));
      g.append(Switch({on:O.evenings,label:'Keep evenings free',sub:'Nothing planned after work',onChange:v=>{O.evenings=v;}}));
      page.append(head('Your week','So Studio plans around your work.'),
        Card({cls:'ob-card'},el('span',{class:'lbl'},'Work days'),el('div',{class:'wdays obwd'},wdMap((d,i)=>{const on=O.days.includes(i);return el('button',{class:on?'on':'','aria-label':WDN[i],'aria-pressed':String(on),onclick:()=>{O.days=on?O.days.filter(x=>x!==i):[...O.days,i];draw();}},d);}))),
        g,Card({cls:'ob-card'},el('span',{class:'lbl'},'Weekly look back'),el('div',{class:'ob-row'},[5,6,0,1].map(d=>Chip(DOW[d].slice(0,3),{selected:O.review===d,'aria-label':DOW[d],onclick:()=>{O.review=d;draw();}}))),Caption('Your first one comes after a week, so there’s something to look back on.',{as:'p'})),
        cta('Continue',()=>go(5)));}
    else if(O.step===5){const g=el('div',{class:'list'}),api=PWA.on&&PWA.api?PWA.api():null,p=api&&api.push,can=!!(p&&p.supported()),on=can&&p.wanted();
      if(PWA.on){if(can)g.append(Switch({on,label:'Turn on reminders',sub:on?'Notifications are on for this phone':'Allow notifications on this phone',onChange:async v=>{if(v){const r=await p.enable();if(r!=='ok')toast(r==='denied'?'Notifications are off for Life OS in your phone’s Settings.':'Couldn’t turn on notifications. Try again.');else{PWA.afterChange();toast('Reminders are on');}}else await p.disable();draw();}}));
        else g.append(Row({as:'div'},el('span',{class:'grow'},el('b',{style:'font-weight:500'},'Reminders'),el('small',{style:'white-space:normal'},p?p.why():'Add Life OS to your Home Screen to get reminders.'))));}
      g.append(Switch({on:O.nudge,label:'Evening habit nudge',sub:'8:00 PM, only if habits are still open',onChange:v=>{O.nudge=v;}}),Switch({on:O.rev,label:'Review reminder',sub:`${DOW[O.review]} ${fmtT(1080)}, while a review is waiting`,onChange:v=>{O.rev=v;}}),Switch({on:O.digest,label:'Morning digest',sub:'Your Top 3 and first commitment at 7:30 AM',onChange:v=>{O.digest=v;}}));
      const cal=el('div',{class:'list'});cal.append(Row({style:'',onclick:()=>PWA.on?icalFeedSheet(null):App.go('setpage',{id:'calendar'})},IconTile(null,{html:ic('cal',IC.md)}),el('span',{class:'grow',style:'text-align:left'},el('b',{style:'font-weight:500'},'Bring in a calendar'),el('small',{},`${(get.settings().icalFeeds||[]).length?(get.settings().icalFeeds||[]).length+' added · ':''}Google, iCloud or Outlook, read-only`)),RowEnd('chevron')));
      let standalone=false;try{standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}catch(e){}
      page.append(head('Stay on track','Life OS only nudges you when something needs you.'),g,cal,!PWA.on?Caption('Reminders show while Life OS is open. Notifications when it’s closed need the home-screen app.',{as:'p'}):null,
        PWA.on&&!standalone?Card({cls:'ob-card'},el('div',{style:'display:flex;gap:var(--s3);align-items:center'},el('span',{class:'ob-ic',html:ic('share',IC.md)}),el('small',{class:'muted'},'Not on your Home Screen yet? In Safari, tap Share, then Add to Home Screen.'))):null,
        cta('Continue',()=>go(6)));}
    else{const list=el('div'),inp=el('input',{id:'ob-cap',type:'text',placeholder:'e.g. Call the dentist Thursday',autocomplete:'off',enterkeyhint:'done',value:O.text,oninput:e=>O.text=e.target.value,onkeydown:e=>{if(e.key==='Enter'){e.preventDefault();add(O.text);}}}),
        ctaBtn=Button(null,{variant:'primary',full:true,cls:'ob-cta',onclick:finish}),ideas=el('div',{class:'ob-row'});
      function add(t){t=(t||'').trim();if(!t){inp.focus();return;}O.items.push(t);O.text='';inp.value='';drawList();inp.focus({preventScroll:true});}
      function drawList(){list.innerHTML='';const ps=O.items.map(obParse);
        if(ps.length)list.append(el('div',{class:'list'},ps.map((p,i)=>Row({as:'div',style:'padding-right:var(--s2)'},el('span',{class:'grow',style:'min-width:0'},el('b',{style:'font-weight:500;overflow-wrap:anywhere'},p.title),el('span',{class:'tags',style:'margin-top:var(--s1)'},pill(OB_KIND[p.kind],'soft'),pill(p.label,'neu'),p.area?pill(p.area,'neu'):null)),IconButton(`Remove ${p.title}`,{html:ic('x',IC.xs),onclick:()=>{O.items.splice(i,1);drawList();}})))),Caption('We read the type, day and area from your words. Tap an item later to change any of it.',{as:'p',style:'padding:0 var(--s1)'}));
        ideas.innerHTML='';OB_IDEAS.filter(x=>!O.items.includes(x)).forEach(x=>ideas.append(Chip(`+ ${x}`,{onclick:()=>add(x)})));
        ctaBtn.textContent=replay?(O.items.length?`Add ${O.items.length} and finish`:'Finish'):O.items.length?`Add ${O.items.length} and open Today`:'Open Today';}
      page.append(head('What’s on your mind?','One at a time, the way you’d say it.'),
        el('div',{class:'ob-add'},el('label',{for:'ob-cap',class:'sr'},'Something on your mind'),inp,Button(null,{variant:'primary','aria-label':'Add it',html:ic('plus',IC.lg),onclick:()=>add(O.text)})),
        list,el('div',{class:'ob-ideas'},el('span',{class:'lbl'},'Need ideas? Tap to add'),ideas),el('div',{class:'ob-foot'},ctaBtn));drawList();}
  }
  draw();
}
/* ---------- Getting started on Today ---------- */
/* v336 · one Getting started card: five steps, a ring, folds to one line after day one */
const GS_STEPS=[['basics','Set up your basics','Areas, your week and reminders'],['item','Add your first item','A task, habit or event'],['hold','Hold anything for options','Edit, move or delete from the menu'],['swipe','Swipe a task to tomorrow','Swipe left on any task'],['area','Open one of your life areas','Each one suggests what to fill in first']];
function gsState(){const s=get.settings(),g=Object.assign({},s.gs);g.basics=g.basics||!!s.onboardedAt;g.item=g.item||[...recs.values()].some(r=>['task','habit','block','allday','goal','project'].includes(r.kind)&&!r.example&&!r.demo);return g;}
function markGs(k){const s=get.settings();if(!s||!s.onboardedAt||s.gsOff||(s.gs||{})[k])return;put(Object.assign({},DEFAULT_SETTINGS,s,{gs:Object.assign({},s.gs,{[k]:true})}),{silent:true});}
function gsRing(p){const C=2*Math.PI*15;return el('span',{class:'gsring','aria-hidden':'true',html:`<svg viewBox="0 0 36 36" width="32" height="32"><circle cx="18" cy="18" r="15" fill="none" stroke="var(--track-bg)" stroke-width="4"/><circle cx="18" cy="18" r="15" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" stroke-dasharray="${(C*p).toFixed(1)} ${C.toFixed(1)}" transform="rotate(-90 18 18)"/></svg>`});}
function gsCard(){const s=get.settings();if(!s.onboardedAt||s.gsOff)return null;const g=gsState(),n=GS_STEPS.filter(x=>g[x[0]]).length,N=GS_STEPS.length;if(n===N)return null;
  const S=App.state,folded=!S.gsOpen&&Date.now()-s.onboardedAt>864e5,next=GS_STEPS.find(x=>!g[x[0]]);
  const hide=()=>{setSettings({gsOff:true});toast('Hidden. Bring it back from Data & help › How Life OS works.',()=>setSettings({gsOff:false}));};
  if(folded)return Card({cls:'gs gsf'},el('button',{class:'gsline',onclick:()=>{S.gsOpen=true;App.refresh();}},gsRing(n/N),el('span',{class:'grow'},el('b',{},`Getting started · ${n} of ${N}`),el('small',{},`Next: ${next[1].toLowerCase()}`)),RowEnd('chevron')));
  return Card({cls:'gs'},el('div',{class:'gsline'},gsRing(n/N),el('span',{class:'grow'},el('b',{},'Getting started'),el('small',{},`${n} of ${N} · about ${Math.max(1,N-n)} minute${N-n===1?'':'s'} left`)),Button('Hide',{variant:'link',size:'sm',onclick:hide})),
    el('div',{class:'list',style:'box-shadow:none;border:0;background:none'},GS_STEPS.map(([k,t,sub])=>{const on=!!g[k];return el('div',{class:'li tick-host'+(on?' done':''),style:'padding-inline:0'},el('span',{class:'tick-hit'},tickBtn(on,v=>{const cur=get.settings();setSettings({gs:Object.assign({},cur.gs,{[k]:v})});},on?`Mark not done: ${t}`:`Mark done: ${t}`)),el('button',{class:'grow',style:'text-align:left',onclick:()=>gsGo(k)},el('span',{class:'tt',style:'font-weight:500'},t),el('small',{},sub)));})));}
function gsGo(k){if(k==='basics'){App.state.ob=null;App.go('welcome');}else if(k==='item')captureSheet(null);else if(k==='area')App.go('more');else if(k==='hold')toast(isTouch()?'Touch and hold any task, habit or list item':'Right-click any task, habit or list item');else if(k==='swipe')App.go('tasks');}
/* v336 · tips where they happen: one at a time, at most one a day, only in the first week */
const TIPS=[['swipe','Swipe a task left to move it to tomorrow. Hold it for more.'],['hold','Touch and hold anything on Today to edit, move or delete it.'],['capture','Tap + to capture anything, in your own words.'],['top3','Pick your Top 3 to keep the day focused.']];
function tipCard(dk){const s=get.settings();if(dk!==todayK()||!s.onboardedAt||s.tipsOff||Date.now()-s.onboardedAt>7*864e5)return null;const seen=s.tipsSeen||{},tk=todayK();
  if(s.tipDay===tk&&s.tipShown&&seen[s.tipShown])return null;/* one a day */
  const t=TIPS.find(x=>!seen[x[0]]&&!(x[0]==='hold'&&!isTouch()));if(!t)return null;
  if(s.tipDay!==tk||s.tipShown!==t[0])setTimeout(()=>put(Object.assign({},DEFAULT_SETTINGS,get.settings(),{tipDay:tk,tipShown:t[0]}),{silent:true}),0);
  return el('div',{class:'tipb',role:'note'},el('span',{class:'grow'},t[1]),el('button',{class:'tipok',onclick:()=>{setSettings({tipsSeen:Object.assign({},get.settings().tipsSeen||{},{[t[0]]:1})});}},'Got it'));}
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
  const ask=(()=>{if(ti.ask==='workouts'){const v=c.f.target||3;return[el('b',{style:'font-weight:500'},'How many workouts a week are you aiming for?'),el('div',{class:'ob-row'},[1,2,3,4,5].map(n=>el('button',{class:'ob-pill wide'+(c.f.target===n?' on':''),'aria-pressed':String(c.f.target===n),onclick:()=>{c.f.target=n;put(c);}},String(n))))];}
    if(ti.ask==='prep'){const d=c.f.day;return[el('b',{style:'font-weight:500'},'Which day do you usually prep?'),el('div',{class:'ob-row'},[0,6,1,3].map(n=>el('button',{class:'ob-pill'+(d===n?' on':''),'aria-pressed':String(d===n),onclick:()=>{c.f.day=n;put(c);}},DOW[n])))];}
    if(ti.ask==='reading'){return[el('b',{style:'font-weight:500'},'How many books would you like to read this year?'),el('div',{class:'ob-row'},[6,12,24,52].map(n=>el('button',{class:'ob-pill'+(c.f.goal===n?' on':''),'aria-pressed':String(c.f.goal===n),onclick:()=>{c.f.goal=n;put(c);}},String(n))))];}
    return null;})();
  /* v336 · same four parts for every module: what it does, where it shows up, one question, starters */
  page.append(Card({cls:'ob-card'},el('p',{class:'ob-say'},ti.say),el('span',{class:'lbl'},'Shows up on'),el('div',{class:'ob-row'},ti.shows.map(([w,txt])=>Chip(TI_W[w][1],{as:'span',selected:true,icon:TI_W[w][0],title:txt})))));
  if(ask)page.append(Card({cls:'ob-card'},...ask));
  const sb=starterBlock(hub,t);if(sb)page.append(sb);const pickN=((App.state.obPick||{})[pinKey(hub,t.id)]||[]).length;
  page.append(el('div',{style:'display:flex;flex-direction:column;gap:var(--s2)'},pickN?btnP(`Add ${pickN} and start`,()=>{const n=starterMake(hub,t);toolMark('toolSeen',key);toast(`${n} added`);App.refresh();},{style:'width:100%',icon:'check'}):btnP(ti.add,()=>{if(ti.run)ti.run(hub,t);else entrySheet(hub,t);},{style:'width:100%',icon:'plus'}),btnL('Start empty',()=>{toolMark('toolSeen',key);App.refresh();},{style:'width:100%'})));}
function toolAfterNote(hub,t){const s=get.settings(),key=toolKey(hub,t.id),ti=TOOL_INTRO[t.id]||t.intro;if(!ti||!(s.toolFresh||{})[key]||(s.toolNoted||{})[key])return null;const l=entries(hub,t.id);if(!l.length)return null;
  const first=l.slice().sort((a,b)=>(a.createdAt||0)-(b.createdAt||0))[0],name=t.title?t.title(first):(first.f.what||''),places=ti.shows.map(([w])=>TI_W[w][1]).filter(x=>x!=='Search');
  const where=places.length?`It shows up ${andList(places.map(p=>p==='Today'?'on Today':p==='Calendar'?'on your calendar':p==='Weekly review'?'in your weekly review':p==='People'?'on their People page':'in '+p))}.`:'Find it any time from search.';
  return Card({cls:'ob-note'},el('div',{style:'display:flex;gap:var(--s3);align-items:flex-start'},el('span',{class:'ob-ok',html:ic('check',IC.sm)}),el('div',{style:'display:flex;flex-direction:column;gap:var(--s1);min-width:0'},el('b',{style:'font-weight:500'},`${cap1(name||t.word)} added.`),el('p',{class:'small'},where))),Button('Got it',{variant:'primary',size:'sm',style:'align-self:flex-end',onclick:()=>{toolMark('toolNoted',key);App.refresh();}}));}
