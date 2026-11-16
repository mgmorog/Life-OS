/* ---------- Full demo data (v162) ----------
   Fills every area and module with realistic, messy, real-world data, including edge cases
   (long titles, overdue and repeating items, overlapping blocks, multi-day all-days, big money, empty notes).
   Everything it makes is marked example:true and demo:true, and the settings it touches are saved in
   settings.demoSnap, so "Clear demo data" puts the app back exactly as it was. */
function demoRand(seed){let x=seed||7;return()=>{x=(x*16807)%2147483647;return(x-1)/2147483646;};}
const DEMO_BANK={
  workouts:['Upper body + core','5K easy run','Leg day','Spin class','Long run · 8 mi','Yoga flow','Hill repeats','Swim · 1,500 m'],
  meals:['Overnight oats','Chicken grain bowl','Salmon, rice and greens','Leftover chili','Turkey wrap','Greek yogurt + berries','Pad thai (takeout)'],
  prep:['Chicken thighs','Turkey chili','Roasted vegetables','Quinoa','Breakfast burritos'],
  measure:['Weight','Resting heart rate','Waist','Sleep score'],
  care:['Vitamin D','Allergy spray','Physical therapy stretches','Annual physical','Dentist cleaning'],
  checkin:['Energy','Mood','Stress'],
  sleep:['Weeknight','Weekend','Late night'],mindful:['Box breathing','Body scan','Walking meditation','Calm app · 10 min'],
  skin:['Morning routine','Night routine','Sunscreen'],groom:['Haircut','Beard trim','Nails'],
  records:['Flu shot','Blood work','Eye exam','Tetanus booster'],symptoms:['Headache','Lower back','Seasonal allergies'],cycle:['Cycle day'],
  spending:['Wegmans groceries','Gas · Sunoco','Coffee','Amazon order','Dinner at Oliver’s','Uber to airport','Target run','Spotify'],
  income:['Paycheck','Freelance invoice #1042','Tax refund','Venmo from Sam'],
  bills:['Rent','National Grid electric','Spectrum internet','Car insurance','Phone','Gym membership','Student loan'],
  savings:['Emergency fund','Japan trip','New car','House down payment'],
  networth:['Checking','High-yield savings','401(k)','Roth IRA','Car loan','Credit card'],
  debt:['Student loan','Car loan','Visa card'],wish:['Noise-cancelling headphones','Standing desk','Cast iron pan','Rain jacket'],
  returns:['Running shoes (wrong size)','Lamp from Target','Amazon cables'],iou:['Concert tickets · Sam','Dinner split · Alex','Cabin weekend'],
  taxes:['Charitable receipts','HSA contributions','Home office'],invest:['401(k) match','Roth IRA','Brokerage'],
  chores:['Vacuum','Laundry','Clean bathroom','Take out recycling','Change sheets','Water plants'],
  upkeep:['Replace furnace filter','Test smoke detectors','Clean gutters','Flush water heater','Service the AC'],
  info:['Wi-Fi password','Paint color · living room','Landlord contact','Trash day'],
  vehicle:['Oil change','Tire rotation','Inspection','Registration renewal'],
  pantry:['Frozen dumplings','Ground beef','Pesto','Chicken stock'],improve:['Paint the bedroom','New kitchen faucet','Build bookshelf'],
  roomspecs:['Living room','Bedroom','Office'],inventory:['TV','Laptop','Bike','Couch'],plants:['Monstera','Snake plant','Basil'],moving:['Book movers','Change address','Pack kitchen'],
  people:['Sam Rivera','Alex Chen','Mom','Dad','Jordan (work)','Priya Patel','Grandma Rose'],
  dates:['Mom’s birthday','Anniversary','Alex’s birthday','Dad’s birthday'],gifts:['Candle set for Mom','Book for Alex','Concert tickets'],
  events:['Friendsgiving','Sam’s 30th','Holiday party'],datenights:['Cooking class','Jazz bar','Picnic at Delaware Park'],cards:['Holiday cards','Thank-you · Priya'],sharewish:['Birthday list','Holiday list'],
  wins:['Closed out 1,600 grants migration','Got promoted to Manager','Presented to the board','Cut PO turnaround to 2 weeks'],
  oneonones:['Jordan','Taylor','Morgan','Casey'],skills:['Workday reporting','SQL','Public speaking','Excel modeling'],
  jobs:['Senior Manager · Workday','Process Improvement Lead','Grants Systems Analyst'],certs:['Workday Pro','CRA'],
  sidebiz:['Logo for Starring Buffalo','Consulting call'],network:['Coffee with Lee','Alumni mixer'],perfprep:['Q4 self-review'],interview:['Tell me about a time…','Biggest failure'],
  reading:['Atomic Habits','The Body Keeps the Score','Project Hail Mary','Four Thousand Weeks'],courses:['SQL for Analysts','Workday Adaptive'],
  review:['Spanish verbs','Workday terms'],paths:['Learn SQL','Run a half marathon'],lang:['Spanish','Duolingo streak'],curric:['Economics','Stoicism'],
  trips:['Japan · spring','Chicago weekend','Outer Banks','Toronto'],packing:['Beach weekend','Work trip','Ski trip'],docs:['Passport','Global Entry','Travel insurance'],
  points:['Delta SkyMiles','Marriott Bonvoy','Chase Sapphire'],places:['Tokyo','Lisbon','Montreal','Nashville'],
  outings:['Niagara Falls day trip','Art museum','Bills game','Farmers market'],hobbies:['Guitar','Photography','Pottery'],
  queue:['Severance','The Bear','Dune: Part Two','Shōgun'],restaurants:['Oliver’s','Toutant','Las Puertas','Ted’s Hot Dogs'],
  collections:['Vinyl','Wine','Sneakers'],tickets:['Hamilton','Bills vs. Dolphins','Taylor Swift'],bucket:['See the northern lights','Run a marathon','Visit all national parks'],
  experiments:['No phone before 9','Cold showers','Walking 1:1s'],lessons:['Ask for help earlier','Write things down'],
  journal:['Morning pages','Gratitude','Weekly reflection'],decisions:['Take the promotion','Lease vs buy car'],commonplace:['“The obstacle is the way.”','Hofstadter’s law'],letters:['To me in 2030'],
  renewals:['Driver’s license','Passport','Car registration','Amazon Prime'],documents:['Birth certificate','Lease','Car title'],
  accounts:['M&T Bank','Fidelity','Verizon'],insurance:['Renters','Auto','Health'],emergency:['Emergency contacts'],estate:['Will','Beneficiaries'],
  school:['Soccer practice','Parent-teacher night'],familyinfo:['Shoe sizes','Allergies'],allowance:['Weekly allowance'],
  petcare:['Heartworm pill','Vet checkup','Flea treatment'],walks:['Morning walk','Park loop'],
  volunteer:['Food bank shift','Habitat build'],giving:['Red Cross','Local food bank'],faith:['Sunday service','Evening prayer']
};
const DEMO_NOTES=['','Bring the receipt.','Ask about the weekend rate.','This one keeps slipping — do it first thing.','Compare with last year before deciding. Check the folder in Drive called “Archive 2025” and the email from October.'];
function demoFill(t,i,r,t0){const f={};const fs=Array.isArray(t.fields)?t.fields:[];const bank=DEMO_BANK[t.id]||[];
  const pick=a=>a[Math.floor(r()*a.length)];
  fs.forEach((d,k)=>{const L=(d.label||'').toLowerCase();
    if(d.id==='what'||(k===0&&(!d.type||d.type==='text')))f[d.id]=bank.length?bank[i%bank.length]:`${capW(t.word||'item')} ${i+1}`;
    else if(d.type==='select'&&d.opts&&d.opts.length)f[d.id]=pick(d.opts);
    else if(d.type==='date'){const past=t.tpl==='log'||/last|done|bought|logged|started|when/.test(L);f[d.id]=past?addK(t0,-Math.floor(r()*45)):addK(t0,Math.floor(r()*120)-10);}
    else if(d.type==='number'){if(d.def!=null&&r()<.5)f[d.id]=d.def;else if(/cost|price|amount|budget|\$|balance|paid|value|saved|goal|limit|income|owed/.test(L))f[d.id]=Math.round(r()*r()*2400+12);else if(/min|hour|time/.test(L))f[d.id]=Math.round(r()*80+10);else if(/every/.test(L))f[d.id]=pick([7,14,30,90,180,365]);else f[d.id]=Math.round(r()*9+1);}
    else if(d.type==='time')f[d.id]=pick(['07:00','08:30','12:15','17:45','20:00']);
    else if(d.type==='area')f[d.id]=pick(DEMO_NOTES);
    else if(/who|with|person|name|contact/.test(L))f[d.id]=pick(['Sam','Alex','Mom','Priya','Jordan']);
    else if(/where|place|store|location|city/.test(L))f[d.id]=pick(['Buffalo','Elmwood Ave','Wegmans','Downtown','Online']);
    else if(r()<.6)f[d.id]=pick(['Blue','Large','Weekly','Online','2nd floor','Shared','Annual','Morning']);
  });
  if(t.tpl==='log'&&!f.date)f.date=addK(t0,-Math.floor(r()*30));
  return f;}
function loadDemo(){
  const s0=get.settings();if(s0.demoSnap){toast('The demo is already loaded');return;}
  const snap={};['areas','hubHidden','hubShown','top3','todayPins','areaExtra','areaIcons','introDone','onboardedAt','gsOff','foundationOff'].forEach(k=>snap[k]=s0[k]===undefined?null:JSON.parse(JSON.stringify(s0[k])));
  const r=demoRand(42),t=todayK(),ex={example:true,demo:true},mk=(kind,f)=>create(kind,Object.assign({},ex,f)),pick=a=>a[Math.floor(r()*a.length)];
  const NR={type:'never',end:null},AR=AREAS;
  /* every area on, every module on */
  const allAreas=[...new Set([...AREAS,...OPT_AREAS])];const shown={};allAreas.forEach(a=>shown[a]=toolsOf(a).filter(x=>x.optIn).map(x=>x.id));
  setSettings({areas:allAreas.slice().sort((a,b)=>a.localeCompare(b)),hubHidden:{},hubShown:shown,introDone:true,foundationOff:true,demoSnap:snap});
  /* projects first, so tasks can belong to them */
  const projs=[['Kitchen refresh','Home',['Measure the cabinets','Pick a paint color','Order hardware','Paint weekend']],['Q1 Workday release','Career',['Write test scripts','UAT with grant managers','Sign-off from Finance','Go-live checklist','Train AP team']],['Japan trip','Travel',['Book flights','Book Kyoto ryokan','Get JR pass','Pocket wifi']],['Move to the new office','Career',[]],['Garage cleanout (paused)','Home',['Sort donations','Sell the old bike']]];
  const P=projs.map(([title,area,steps],i)=>mk('project',{title,notes:i===1?'Release target is the first week of February. Keep Finance in the loop on every change to costing allocations.':'',area,deadline:i===2?addK(t,120):i===1?addK(t,40):null,color:pick(['sage','clay','blue','plum','rose']),status:'active',paused:i===4,part:null,steps:steps.map((x,j)=>({id:uid('s'),t:x,d:j===0&&i!==3}))}));
  /* tasks: today, carried over, upcoming, someday, history */
  const T=(title,o={})=>mk('task',Object.assign({title,notes:'',steps:[],date:null,time:null,repeat:NR,reminder:null,deadline:null,priority:'normal',part:null,area:null,doneDates:{}},o));
  const done=(d)=>({[d]:fromK(d).getTime()+(9+Math.floor(r()*9))*36e5});
  const today=[T('Finish budget variance review',{date:t,area:'Finances',priority:'high',part:null}),T('Call Dr. Lee’s office about the referral',{date:t,area:'Health'}),T('Draft Q1 goals for the AP team',{date:t,area:'Career',part:P[1].id}),
    T('Reply to Sam about Friendsgiving',{date:t,area:'Relationships'}),T('Pick up dry cleaning',{date:t,time:17*60+30,area:'Home'}),T('Book flights',{date:t,area:'Travel',part:P[2].id,steps:[{id:uid('s'),t:'Compare Delta vs. United',d:true},{id:uid('s'),t:'Check SkyMiles balance',d:false},{id:uid('s'),t:'Book seats',d:false}]}),
    T('Water plants',{date:t,area:'Home',doneDates:done(t)}),T('Submit timesheet',{date:t,area:'Career',doneDates:done(t)}),
    T('This is a deliberately very long task title to see how the card handles wrapping when someone writes a whole sentence instead of a short to-do',{date:t})];
  T('Renew car registration',{date:addK(t,-3),area:'Home',priority:'high'});T('Send thank-you note to Priya',{date:addK(t,-1),area:'Relationships'});T('Return Amazon cables',{date:addK(t,-6),area:'Finances'});
  for(let i=1;i<=14;i++){const n=1+Math.floor(r()*3);for(let j=0;j<n;j++)T(pick(['Grocery run','Prep slides for staff meeting','Call the bank','Schedule haircut','Review AP aging report','Pay credit card','Plan date night','Update resume bullets','Clean out email','Order contact lenses','Workday config review','1:1 prep','Laundry','Text Grandma Rose']),{date:addK(t,i),area:pick(AR),time:r()<.3?(8+Math.floor(r()*10))*60:null,priority:r()<.15?'high':'normal'});}
  T('Gym',{date:addK(t,-14),time:6*60+30,area:'Health',repeat:{type:'custom',unit:'week',n:1,days:[0,2,4],end:null}});
  T('Take out trash',{date:addK(t,-20),area:'Home',repeat:{type:'custom',unit:'week',n:1,days:[1],end:null}});
  T('Pay rent',{date:addK(t,-40),area:'Finances',repeat:{type:'custom',unit:'month',n:1,end:null},priority:'high'});
  ['Learn to make sourdough','Clean out the closet','Look into a ceramics class','Back up phone photos','Donate old clothes','Fix the squeaky door'].forEach((x,i)=>T(x,{area:pick(AR),deadline:i<2?addK(t,4+i*3):null}));
  for(let d=1;d<=56;d++){const k=addK(t,-d),n=Math.floor(r()*4);for(let j=0;j<n;j++)T(pick(['Inbox zero','Grant reconciliation','Workout','Meal prep','Reply to emails','Team standup notes','Call Mom','Pay bills']),{date:k,area:pick(AR),doneDates:r()<.95?done(k):{}});}
  P[1].steps.length&&[0,1,2].forEach(i=>T(['Fix costing allocation rule','Test spend authorization BP','Write release notes'][i],{date:addK(t,i+2),area:'Career',part:P[1].id,doneDates:i===0?done(addK(t,-1)):{}}));
  /* priorities: 3 today (one done), 2 tomorrow */
  const s1=get.settings();const tops=Object.assign({},s1.top3||{});tops[t]=[{id:today[0].id},{id:today[1].id},{id:today[2].id}];tops[addK(t,1)]=[{id:today[3].id},{id:today[5].id}];
  for(let d=1;d<=14;d++)tops[addK(t,-d)]=[];
  setSettings({top3:tops});today[1].doneDates=done(t);put(today[1],{silent:true});
  /* blocks: today (overlap on purpose), this week, repeating */
  const B=(title,date,start,dur,o={})=>mk('block',Object.assign({title,notes:'',date,start,dur,repeat:NR,reminder:null,part:null,area:null,color:'sage',icon:'focus'},o));
  B('Staff meeting',t,9*60,60,{area:'Career',color:'blue'});B('Deep work: grant closeouts',t,10*60+30,120,{area:'Career'});B('Lunch with Alex',t,12*60,60,{area:'Relationships',color:'rose',icon:'meal'});B('Dentist',t,12*60+30,45,{area:'Health',color:'plum'});
  B('Run club',t,18*60,60,{area:'Health',color:'blue',icon:'dumbbell'});B('Late call with Tokyo vendor',t,22*60+30,60,{area:'Career'});
  for(let i=1;i<=10;i++)B(pick(['Focus block','Workday sprint planning','Coffee with Lee','Haircut','Pottery class','Family dinner','Budget review']),addK(t,i),(8+Math.floor(r()*11))*60,pick([30,45,60,90,120]),{area:pick(AR),color:pick(['sage','blue','rose','plum','clay'])});
  B('Morning pages',addK(t,-30),6*60,20,{area:'Personal growth',repeat:{type:'custom',unit:'day',n:1,end:null}});
  /* all-day: single, multi-day trip, yearly, holiday, a past one */
  const A=(title,start,end,o={})=>mk('allday',Object.assign({title,notes:'',start,end,repeat:NR,reminder:null,area:null,color:'sage',icon:'cal'},o));
  A('Mom’s birthday',addK(t,2),null,{area:'Relationships',color:'plum',icon:'cake',repeat:{type:'custom',unit:'year',n:1,end:null}});
  A('Chicago weekend',addK(t,5),addK(t,7),{area:'Travel',color:'blue',icon:'plane'});A('Office closed',addK(t,11),null,{area:'Career'});A('Work from home',t,null,{area:'Career'});
  A('Japan · spring trip',addK(t,120),addK(t,133),{area:'Travel',color:'clay',icon:'plane'});A('Conference (last week)',addK(t,-9),addK(t,-7),{area:'Career'});
  /* habits: check, count, time; good and bad streaks */
  const H=(title,o)=>{const h=mk('habit',Object.assign({title,notes:'',target:3,dur:30,days:[],area:'Health',color:'blue',icon:'habit',logs:{},sessions:{},startDate:addK(t,-60)},o));const rate=o.rate||.6;for(let d=1;d<=60;d++)if(r()<rate)h.logs[addK(t,-d)]=o.track==='count'?o.goalN+Math.floor(r()*3)-1:true;put(h,{silent:true});return h;};
  H('Workout',{target:4,icon:'dumbbell',rate:.55});H('Read 20 pages',{target:5,area:'Learning',color:'plum',icon:'book',rate:.7});H('Meditate',{target:7,area:'Personal growth',color:'sage',rate:.4,dur:10});
  H('Drink 8 glasses of water',{target:7,track:'count',goalN:8,rate:.8});H('No phone after 10pm',{target:5,area:'Personal growth',rate:.3});H('Spanish practice',{target:5,area:'Learning',rate:.85,dur:15});H('Call a friend',{target:1,area:'Relationships',color:'rose',rate:.15});
  /* goals */
  const G=(title,area,dl,steps)=>mk('goal',{title,notes:'',area,deadline:dl,color:pick(['blue','sage','plum']),status:'active',steps:steps.map((x,i)=>({id:uid('s'),t:x,d:i<Math.ceil(steps.length/2)}))});
  G('Run a half marathon','Health',addK(t,150),['Pick a plan','Run 10K','Run 15K','Sign up','Race day']);G('Save $10,000 emergency fund','Finances',addK(t,300),['Open HYSA','Auto-transfer $400','Hit $5K','Hit $10K']);
  G('Land a Senior Manager role','Career',addK(t,200),['Update LinkedIn','Resume refresh','10 coffee chats','Apply to 5 roles']);G('Read 24 books this year','Learning',addK(t,45),['Q1: 6','Q2: 12','Q3: 18','Q4: 24']);
  /* routines */
  const R=(title,steps,o={})=>{const x=mk('routine',Object.assign({title,notes:'',steps:steps.map(([s,m])=>({id:uid('s'),t:s,min:m,habit:null})),days:[],setTime:null,startDate:addK(t,-30),reminder:null,area:'Personal growth',color:'sage',runs:{}},o));for(let d=1;d<=30;d++)if(r()<.5)x.runs[addK(t,-d)]=true;put(x,{silent:true});};
  R('Morning routine',[['Make bed',2],['Stretch',10],['Coffee + journal',15],['Review Today',5]],{setTime:6*60+15});R('Shutdown routine',[['Inbox to zero',10],['Plan tomorrow',5],['Close laptop',1]],{area:'Career'});
  /* lists */
  const Lst=(title,items)=>mk('list',{title,items:items.map((x,i)=>({id:uid('i'),t:x,d:i%4===1}))});
  Lst('Groceries',['Oat milk','Lemons','Coffee beans','Spinach','Chicken thighs','Rice','Greek yogurt','Bananas','Olive oil','Parmesan','Eggs','Sourdough']);Lst('Books to read',['Project Hail Mary','Tomorrow, and Tomorrow, and Tomorrow','Thinking, Fast and Slow']);
  Lst('Gift ideas',['Candle set','Cookbook','Concert tickets','Plant']);Lst('Packing · Chicago',['Chargers','Running shoes','Jacket','Passport? (no)','Toiletries']);Lst('Empty list',[]);
  /* inbox ideas */
  ['Look into a ceramics class','Podcast: Hidden Brain episode on habits','Idea: automate the AP intake form with a Workday web service','Gift for Sam — that vinyl he mentioned','Try the new ramen place on Elmwood','Ask Jordan about the 2027 budget timeline','Read: “Four Thousand Weeks” notes','Fix bathroom fan','https://www.workday.com/en-us/products/grants.html'].forEach((x,i)=>mk('idea',{title:x,notes:'',photos:[],source:null,createdAt:Date.now()-i*3*864e5-(i>6?40*864e5:0)}));
  /* every module in every area */
  let n=0;allAreas.forEach(a=>toolsOf(a).forEach(tool=>{if(tool.hide||!Array.isArray(tool.fields))return;
    if(tool.id==='wheel'){for(let i=0;i<4;i++){const sc={};AREAS.forEach(x=>sc[x]=3+Math.floor(r()*8));mk('entry',{hub:a,tool:'wheel',f:{date:addK(t,-i*30),scores:sc}});n++;}return;}
    if(!tool.fields.length)return;const cnt=3+Math.floor(r()*5);for(let i=0;i<cnt;i++){mk('entry',{hub:a,tool:tool.id,f:demoFill(tool,i,r,t)});n++;}}));
  /* area notes */
  allAreas.forEach(a=>{if(!get.id('area-'+a))put(Object.assign({id:'area-'+a,kind:'areanote',text:pick(['','Focus this quarter: consistency over intensity.','Keep it simple.'])},ex),{silent:true});});
  App.refresh();toast(`Demo loaded: ${n} module entries plus tasks, habits, goals and more`);
}
function clearDemo(){const s=get.settings(),snap=s.demoSnap;
  askConfirm({title:'Clear the demo?',body:'Removes everything the demo added and puts your settings back. Your own data stays.',yes:'Clear demo',no:'Keep it',onYes:()=>{
    [...recs.values()].filter(r=>r.demo||(r.example&&snap)).forEach(r=>remove(r.id,{silent:true,hard:true}));
    if(snap){const back={demoSnap:null};Object.keys(snap).forEach(k=>back[k]=snap[k]===null?undefined:snap[k]);const top=Object.assign({},get.settings().top3||{});Object.keys(top).forEach(d=>{top[d]=(top[d]||[]).filter(x=>get.id(x.id));});if(snap.top3==null)back.top3=top;setSettings(back);}
    App.refresh();toast('Demo cleared');}});}
