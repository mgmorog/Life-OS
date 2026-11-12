/* ---------- Life area hubs: each tool is real records you add to ---------- */
const money=v=>{const n=+v||0;return get.settings().hideAmounts?'••••':`${get.settings().currency||'$'}${n.toLocaleString(undefined,Number.isInteger(n)?{}:{minimumFractionDigits:2,maximumFractionDigits:2})}`;};
const money0=v=>{const n=+v||0;return get.settings().hideAmounts?'••••':`${n<0?'−':''}${get.settings().currency||'$'}${Math.abs(Math.round(n)).toLocaleString()}`;};
const moneyK=v=>{const n=+v||0;if(get.settings().hideAmounts)return '••••';return Math.abs(n)>=1000?`${n<0?'−':''}${get.settings().currency||'$'}${(Math.abs(n)/1000).toFixed(1).replace(/\.0$/,'')}k`:money0(n);};
/* a tool's own settings live in one record that never shows up as an item */
const isCfg=x=>x.f&&x.f.t==='cfg';
const entries=(hub,tool)=>get.all('entry').filter(x=>x.hub===hub&&x.tool===tool&&!isCfg(x));
const ofType=(hub,tool,ty)=>entries(hub,tool).filter(x=>(x.f.t||'')===(ty||''));
function cfg(hub,tool){const id=`cfg-${hub}-${tool}`.replace(/\s/g,'');return get.id(id)||{id,kind:'entry',hub,tool,f:{t:'cfg'}};}
const sumBy=(list,f)=>list.reduce((n,x)=>n+(+x.f[f]||0),0);
const thisMonth=x=>(x.f.date||'').slice(0,7)===monthKey(today());
const thisWeek=x=>{const[a,b]=weekRange(todayK());return (x.f.date||'')>=a&&(x.f.date||'')<=b;};
const dueState=(x,f='every')=>{const last=x.f.last,ev=+x.f[f]||0;if(!ev)return{txt:last?`Last ${relDay(last)}`:'',over:false};if(!last)return{txt:'Not done yet',over:true,left:-1};const left=daysBetween(todayK(),addK(last,ev));return{txt:left<0?(left<-60?`${Math.round(-left/30)} months overdue`:`${-left} day${left<-1?'s':''} overdue`):left===0?'Due today':left>45?`Due ${dueMonth(addK(last,ev))}`:`In ${left} day${left>1?'s':''}`,over:left<=0,left};};
const dueMonth=d=>{const x=fromK(d);return MONL[x.getMonth()]+(x.getFullYear()!==today().getFullYear()?` ${x.getFullYear()}`:'');};
const rec2cal=(title,date,color,yearly)=>{const r=create('allday',{title,notes:'',start:date,end:null,repeat:yearly?{type:'custom',unit:'year',n:1,end:null}:{type:'never',end:null},reminder:null,area:null,color,icon:null});toast('Added to your calendar');return r;};
/* keep one calendar item in step with a hub record */
function syncCal(x,{title,start,end=null,yearly=false,color='sage',reminder=null}){if(x.f.added&&!x.f.calId)return;if(!start)return;const c=x.f.calId&&get.id(x.f.calId);if(c){c.title=title;c.start=start;c.end=end;put(c,{silent:true});return;}const r=create('allday',{title,notes:'',start,end,repeat:yearly?{type:'custom',unit:'year',n:1,end:null}:{type:'never',end:null},reminder,area:x.hub,color,icon:null});x.f.calId=r.id;put(x,{silent:true});}
const newTask=(title,o={})=>create('task',Object.assign({title,notes:'',steps:[],date:null,time:null,repeat:{type:'never',end:null},reminder:null,deadline:null,priority:'normal',part:null,area:null,color:'sage',icon:null},o));
const GIFT_ST=['Idea','Bought','Wrapped','Given'],WIN_KINDS=['Shipped','Led','Improved','Helped','Learned'],JOB_ST=['Saved','Applied','Interviewing','Offer','Closed'];
const F=(id,label,type='text',extra={})=>Object.assign({id,label,type},extra);
const DATE=F('date','Date','date');
const doneAct={label:'Done',show:()=>true,run:x=>{x.f.last=todayK();put(x);toast('Marked done');}};

/* small pieces the tool screens are built from */
const later=()=>setTimeout(()=>App.refresh(),820);
const lblRow=(t,r)=>el('div',{class:'sh2'},el('span',{class:'lbl'},t),typeof r==='string'?el('span',{class:'small muted'},r):r||null);
const lnk=(label,fn,icon)=>el('button',{class:'linkbtn small',style:'min-height:44px;margin:-8px 0',onclick:fn},icon?el('span',{style:'display:grid',html:ic(icon,16,2)}):null,label);
const bigN=(v,rest)=>el('p',{class:'bign'},el('span',{class:'serif n'},String(v)),rest?el('span',{class:'muted'},' '+rest):null);
const pill=(t,c='')=>el('span',{class:'hpill '+c},t);
const AMBER='#D9A441',RUST='#C76A2E';
const meter=(f,{c,mark,tall}={})=>el('div',{class:'hmeter'+(tall?' tall':'')},el('i',{style:`width:${Math.max(0,Math.min(100,(f||0)*100))}%${c?`;background:${c}`:''}`}),mark!=null?el('b',{style:`left:${mark*100}%`}):null);
const paceC=f=>f>=1?RUST:f>=.75?AMBER:null;
const tk=(on,fn,label)=>el('span',{class:'tick-hit'},tickBtn(on,fn,label));
const rowX=({l,t,s,sc,r,on,strike,big,hold})=>{const n=el('div',{class:'li',style:'min-height:58px'},l||null,el(on?'button':'div',{class:'grow',style:'text-align:left',onclick:on||null},el('b',{style:`font-weight:${big?600:500}${strike?';color:var(--ink-3);text-decoration:line-through':''}`},t),s?el('small',{class:sc||null},s):null),r||null);return hold?withPress(n,hold):n;};
const rows=(list,fn)=>el('div',{class:'list'},list.map(fn));
const chipsH=(items,val,on)=>el('div',{class:'hscroll'},items.map(([v,l,n])=>el('button',{class:'chip line'+(v===val?' on':''),onclick:()=>on(v)},l,n?el('i',{class:'hcnt'},String(n)):null)));
const btnP=(label,fn,extra={})=>el('button',Object.assign({class:'btn primary',onclick:fn},extra),extra.icon?el('span',{style:'display:grid',html:ic(extra.icon,16,2.2)}):null,label);
const btnL=(label,fn,extra={})=>el('button',Object.assign({class:'btn line',onclick:fn},extra),label);
const btns=(...b)=>el('div',{class:'btnrow2'},b);
const dtile=(dk,c='')=>{const d=fromK(dk),n=daysBetween(todayK(),dk);return el('span',{class:'hdtile '+c},el('i',{},(n>=0&&n<=6?DOW[d.getDay()].slice(0,3):MON[d.getMonth()]).toUpperCase()),el('b',{},String(d.getDate())));};
const wkDays=dk=>{const a=weekRange(dk)[0];return Array.from({length:7},(_,i)=>addK(a,i));};
const PAL=['#F1D9C6','#DCE6F0','#E7E0F0','#E1EDE4','#F3E6CF','#DDE7EC','#EFDCE2'];
const avatar=(name,sz=36)=>{const s=String(name||'?'),h=[...s].reduce((n,c)=>n+c.charCodeAt(0),0);return el('span',{class:'avi',style:`width:${sz}px;height:${sz}px;background:${PAL[h%PAL.length]}`,'aria-hidden':'true'},s[0].toUpperCase());};
const fmtH=m=>{m=Math.round(m||0);return m<60?`${m}m`:`${Math.floor(m/60)}h ${pad2(m%60)}m`;};
const mD=d=>{const x=fromK(d);return `${MON[x.getMonth()]} ${x.getDate()}`;};
const nextYearly=d=>{const t=today(),x=fromK(d);let n=new Date(t.getFullYear(),x.getMonth(),x.getDate());if(k(n)<todayK())n=new Date(t.getFullYear()+1,x.getMonth(),x.getDate());return k(n);};
const seasonOf=d=>['Winter','Winter','Spring','Spring','Spring','Summer','Summer','Summer','Fall','Fall','Fall','Winter'][d.getMonth()];
const seasonEnd=d=>{const m=d.getMonth(),y=d.getFullYear();const e={Winter:new Date(m===11?y+1:y,1,28),Spring:new Date(y,4,31),Summer:new Date(y,7,31),Fall:new Date(y,10,30)}[seasonOf(d)];return k(e);};
const everyWord=n=>({1:'Daily',7:'Weekly',14:'Every 2 weeks',30:'Monthly',60:'Every 2 months',90:'Every 3 months',180:'Every 6 months',365:'Yearly'}[+n]||(+n%365===0?`Every ${+n/365} years`:+n%30===0?`Every ${+n/30} months`:+n%7===0?`Every ${+n/7} weeks`:`Every ${n} days`));
const stepper=(val,lo,hi,step,on,fmt=v=>v)=>el('span',{class:'stp'},el('button',{'aria-label':'Lower',html:ic('minus',16,2),onclick:()=>on(Math.max(lo,val-step))}),el('span',{class:'sv tnum'},String(fmt(val))),el('button',{'aria-label':'Raise',html:ic('plus',16,2),onclick:()=>on(Math.min(hi,val+step))}));
const toolHead=(page,hub,t,{sub,actions}={})=>page.append(pageHead(t.name,sub||null,{back:hub,to:'area',actions:actions||plusB(t.word,()=>entrySheet(hub,t))}));
const plusB=(word,fn)=>el('button',{class:'iconbtn green','aria-label':`New ${word}`,html:ic('plus',22,2),onclick:fn});
const moreB=(label,fn)=>el('button',{class:'iconbtn green','aria-label':label,html:sv('<circle cx="5" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.8" fill="currentColor" stroke="none"/>',22),onclick:fn});
const seedHub=name=>{App.state.params=Object.assign(App.state.params||{},{name});};
const sVal=(key,def)=>{const S=App.state;return S['t_'+key]===undefined?def:S['t_'+key];};
const sSet=(key,v)=>{App.state['t_'+key]=v;App.refresh();};
const fileUrl=u=>/^www\./i.test(u)?'https://'+u:u;

const HUBS={
 Health:{tools:[
  {id:'workouts',name:'Workouts',icon:'hour',word:'workout',view:vWorkouts,fields:[F('what','Workout'),F('min','Minutes','number'),F('miles','Distance (optional)','number',{blank:true}),F('feel','How it felt','select',{opts:['Steady','Easy','Hard']}),DATE],
   types:{routine:{word:'routine',fields:[F('what','Routine name'),F('kind','Type','select',{opts:['Strength','Cardio','Other']}),F('min','About how long (minutes)','number',{def:45}),F('ex','Exercises, one per line','area',{ph:'Bench press, 3 x 8, 140'})]}},
   title:x=>x.f.what,sub:x=>`${relDay(x.f.date)}${x.f.min?` · ${x.f.min} min`:''}`,sum:l=>`${l.filter(x=>!x.f.t).filter(thisWeek).length} this week`,tile:wkTile},
  {id:'meals',name:'Meals',icon:'list',word:'meal',view:vMeals,fields:[F('meal','Meal','select',{opts:['Dinner','Breakfast','Lunch','Snack']}),F('what','What'),F('tag','Tag','select',{opts:['None','Prep','Out']}),F('note','Note'),DATE],
   types:{recipe:{word:'recipe',fields:[F('what','Recipe'),F('min','Minutes','number',{blank:true}),F('serves','Serves','number',{blank:true}),F('ing','Ingredients, one per line','area'),F('how','Steps','area')]}},
   title:x=>x.f.what||x.f.meal,sub:x=>x.f.t==='recipe'?'Recipe':`${x.f.meal} · ${relDay(x.f.date)}`,sum:l=>`${l.filter(x=>x.f.date===todayK()).length} logged today`,tile:mealTile},
  {id:'prep',name:'Meal prep',icon:'layers',word:'batch',view:vPrep,fields:[F('what','Dish'),F('servings','Portions made','number',{def:4}),F('left','Portions left','number',{def:4}),F('where','Kept in','select',{opts:['Fridge','Freezer']}),F('date','Cooked on','date'),F('useBy','Eat by (optional)','date',{blank:true})],
   title:x=>x.f.what,sub:x=>`${x.f.left||0} left · ${x.f.where||'Fridge'}`,sum:l=>`${l.reduce((n,x)=>n+(x.f.tossed?0:(+x.f.left||0)),0)} portions ready`,tile:prepTile},
  {id:'measure',name:'Measurements',icon:'chart',word:'measurement',view:vMeasure,fields:[F('what','What you track (Blood pressure, top number)'),F('unit','Unit (mmHg, lb, bpm)')],title:x=>x.f.what,sub:x=>x.f.unit||'',sum:l=>`${l.length} tracked`,tile:()=>({v:'',sub:''})},
  {id:'care',name:'Care',icon:'heart',word:'appointment',view:vCare,recurring:true,fields:[F('what','Appointment or checkup'),F('who','Who it’s with'),F('date','Booked for','date',{blank:true}),F('time','Time','time',{blank:true}),F('every','Repeat every (days, optional)','number',{blank:true}),F('last','Last done','date',{blank:true}),F('qs','Questions to ask','area',{ph:'One per line'}),F('visit','Notes from the visit','area',{ph:'What they said, next steps'})],
   types:{med:{word:'medication',fields:[F('what','Name'),F('time','When','time',{def:'08:00'}),F('note','How (1 tablet, with food)'),F('supply','Days of supply left','number',{blank:true})]},provider:{word:'provider',fields:[F('what','Who'),F('note','Note'),F('phone','Phone')]},ins:{word:'insurance plan',photos:true,fields:[F('what','Plan (Medical, Dental, Vision)'),F('carrier','Insurance company'),F('member','Member ID'),F('group','Group number'),F('phone','Member services phone'),F('note','Note')]}},
   after:x=>{if(!x.f.t&&x.f.date)syncCal(x,{title:x.f.what,start:x.f.date,color:'plum'});},
   title:x=>x.f.what,sub:x=>[dueState(x).txt,x.f.who].filter(Boolean).join(' · '),sum:l=>{const n=l.filter(x=>!x.f.t&&dueState(x).over).length;return n?`${n} due`:'All up to date';},tile:careTile},
  {id:'checkin',name:'Daily check-in',icon:'clip',say:'Energy, water and sleep in a few taps each day.',word:'check-in',view:vCheckin,fields:[F('e','Energy','select',{opts:['OK','Low','Good']}),F('water','Water (glasses)','number',{def:0}),F('sleep','Sleep (hours)','number',{def:7}),F('note','A note'),DATE],
   title:x=>`Energy ${eOf(x)}`,sub:x=>`${relDay(x.f.date)} · ${x.f.sleep} hrs sleep${x.f.note?' · '+x.f.note:''}`,sum:l=>l.some(x=>x.f.date===todayK())?'Done today':'Not yet today'}],
  high:()=>{const c=cfg('Health','workouts').f.target||3,w=ofType('Health','workouts','').filter(thisWeek).length;return w?['chart',w>=c?`You hit your workout target this week`:`${w} of ${c} workouts this week`]:null;},up:healthUp},
 Finances:{tools:[
  {id:'spending',name:'Spending',icon:'chart',word:'expense',view:vSpending,fields:[F('what','What for'),F('amount','Amount','number'),F('cat','Category','select',{opts:()=>SPEND_CATS}),DATE],title:x=>x.f.what||x.f.cat,sub:x=>`${catOf(x)} · ${relDay(x.f.date)}`,trail:x=>money(x.f.amount),sum:l=>`${money(sumBy(l.filter(thisMonth),'amount'))} this month`,tile:spendTile},
  {id:'income',name:'Income',icon:'m_income',word:'income',view:vIncome,fields:[F('what','From'),F('amount','Amount','number'),DATE],types:{source:{word:'regular income',fields:[F('what','From (Paycheck)'),F('amount','Amount each time','number'),F('every','How often','select',{opts:['Every 2 weeks','Weekly','Twice a month','Monthly']}),F('start','First or most recent payday','date',{def:todayK()}),F('end','Ends (optional)','date',{blank:true})]}},title:x=>x.f.what,sub:x=>x.f.t?x.f.every:relDay(x.f.date),trail:x=>money(x.f.amount),sum:()=>`${money0(incIn(monthKey(today())))} this month`,tile:()=>({v:'',sub:''})},
  {id:'bills',name:'Bills',icon:'cal',word:'bill',view:vBills,fields:[F('what','Bill'),F('amount','Amount','number'),F('day','Due day of month','number',{def:1}),F('pay','How it’s paid','select',{opts:['Pay by hand','Autopay']}),F('acct','From account')],
   types:{sub:{word:'subscription',fields:[F('what','Subscription'),F('amount','Cost a month','number'),F('note','Note (renews, last used)'),F('trial','Free trial ends','date',{blank:true}),F('flag','Flag to review','select',{opts:['No','Yes']})]}},
   title:x=>x.f.what,sub:x=>x.f.t==='sub'?'Subscription':`Due on the ${x.f.day}`,trail:x=>money(x.f.amount),sum:l=>`${l.filter(x=>!x.f.t).length} bills`,tile:billTile},
  {id:'savings',name:'Savings',icon:'target',word:'savings goal',view:vSavings,fields:[F('what','Saving for'),F('target','Target','number'),F('saved','Saved so far','number',{def:0}),F('monthly','Plan each month','number',{blank:true}),F('by','By when','date',{blank:true})],title:x=>x.f.what,sub:x=>`${money(x.f.saved)} of ${money(x.f.target)}${x.f.proj&&get.id(x.f.proj)?' · for a project':''}`,sum:l=>`${money(sumBy(l,'saved'))} saved`,tile:saveTile},
  {id:'networth',name:'Net worth',icon:'m_worth',word:'account',view:vNetWorth,legacy:'snap',fields:[F('what','Account'),F('note','Note'),F('group','Type','select',{opts:['Cash','Investments','Debts']}),F('val','Balance (debts as a positive number)','number',{def:0})],t:'acct',
   types:{snap:{word:'snapshot',fields:[F('assets','Assets','number'),F('debts','Debts','number',{def:0}),DATE]}},
   title:x=>x.f.what||money((+x.f.assets||0)-(+x.f.debts||0)),sub:x=>x.f.what?(x.f.group||''):relDay(x.f.date),sum:l=>moneyK(nwNow().now),tile:nwTile}],
  high:()=>{const p=spendPlan(),s=spendSum(monthKey(today()));return p>0&&s<p?['chart',`${money0(p-s)} left in your spending plan`]:null;},up:finUp,eye:true},
 Home:{tools:[
  {id:'chores',name:'Chores',icon:'task',word:'chore',view:vChores,recurring:true,fields:[F('what','Chore'),F('room','Room','select',{opts:['Kitchen','Bathroom','Living','Bedroom','Laundry','Outdoor','Other']}),F('every','Every (days)','number',{def:7}),F('min','Minutes','number',{def:10}),F('last','Last done','date',{blank:true})],title:x=>x.f.what,sub:x=>dueState(x).txt,sum:l=>{const n=l.filter(x=>dueState(x).over).length;return n?`${n} due`:'All caught up';},tile:choreTile},
  {id:'upkeep',name:'Upkeep',icon:'gear',word:'upkeep item',view:vUpkeep,recurring:true,fields:[F('what','Upkeep item'),F('note','Note (filter size, how many)'),F('every','Every (days)','number',{def:90}),F('last','Last done','date',{blank:true})],
   types:{season:{word:'seasonal check',fields:[F('what','Check'),F('note','Note'),F('season','Season','select',{opts:()=>{const s=seasonOf(today());return [s,...['Spring','Summer','Fall','Winter'].filter(x=>x!==s)];}})]},service:{word:'service',photos:true,fields:[F('what','What was done'),F('note','Who or how'),F('cost','Cost','number',{def:0}),DATE]}},
   title:x=>x.f.what,sub:x=>dueState(x).txt,sum:l=>{const n=l.filter(x=>!x.f.t&&dueState(x).over).length;return n?`${n} due`:'Nothing due';},tile:upkeepTile},
  {id:'info',name:'Home info',icon:'books',word:'appliance',view:vInfo,legacy:'ess',t:'app',photos:true,fields:[F('what','Appliance'),F('room','Where'),F('warranty','Warranty ends','date',{blank:true}),F('model','Model'),F('serial','Serial'),F('bought','Bought','date',{blank:true}),F('part','Parts'),F('url','Manual link')],
   types:{pro:{word:'pro',fields:[F('what','What they do'),F('who','Name'),F('phone','Phone'),F('note','Last job'),F('again','Hire again','select',{opts:['Yes','No']})]},ess:{word:'detail',photos:true,fields:[F('what','What (Wi-Fi, water shutoff…)'),F('val','Details','area'),F('secret','Hide until tapped','select',{opts:['No','Yes']})]}},
   title:x=>x.f.what,sub:x=>x.f.val||x.f.room||x.f.who||'',sum:l=>`${l.length} saved`,tile:infoTile},
  {id:'vehicle',name:'Vehicle',icon:'hour',word:'service',view:vVehicle,photos:true,fields:[F('what','Service'),F('miles','Odometer','number',{blank:true}),F('cost','Cost','number',{blank:true}),F('note','Shop or DIY'),DATE],
   types:{due:{word:'upcoming item',fields:[F('what','What'),F('note','Note'),F('atMiles','At mileage','number',{blank:true}),F('date','Or by date','date',{blank:true})]}},
   title:x=>x.f.what,sub:x=>`${relDay(x.f.date)}${x.f.miles?` · ${(+x.f.miles).toLocaleString()} mi`:''}`,trail:x=>x.f.cost?money(x.f.cost):'',sum:l=>{const s=ofType('Home','vehicle','').sort((a,b)=>a.f.date<b.f.date?1:-1)[0];return s?`Last: ${s.f.what}`:'No service logged';},tile:vehicleTile}],
  high:()=>{const s=seasonOf(today()),a=ofType('Home','upkeep','season').filter(x=>x.f.season===s);if(!a.length)return null;const y=today().getFullYear(),d=a.filter(x=>(x.f.doneY||{})[y]).length,left=Math.ceil(daysBetween(todayK(),seasonEnd(today()))/7);return['leaf',`${s} checklist: ${d} of ${a.length} done${left>0?`, ${left} week${left>1?'s':''} left`:''}`];},up:homeUp},
 Relationships:{tools:[
  {id:'people',name:'People',icon:'heart',word:'person',view:vPeople,recurring:true,fields:[F('what','Name'),F('circle','Circle','select',{opts:['Family','Friends','Work','Other']}),F('phone','Phone'),F('every','Reach out every (days)','number',{def:30}),F('last','Last in touch','date',{blank:true}),F('note','Notes','area')],title:x=>x.f.what,sub:x=>[x.f.circle||x.f.rel,dueState(x).txt].filter(Boolean).join(' · '),sum:l=>{const n=l.filter(x=>dueState(x).over).length;return n?`${n} to reach out to`:`${l.length} people`;},tile:peopleTile},
  {id:'dates',name:'Dates',icon:'cal',word:'date',view:vDates,fields:[F('what','Whose or what (Mom’s birthday)'),F('kind','Kind','select',{opts:['Birthday','Anniversary','Milestone','Other']}),F('date','Date (use the real year if you know it)','date'),F('note','Note')],
   after:x=>syncCal(x,{title:x.f.what,start:x.f.date,yearly:true,color:'plum',reminder:6*1440+15*60}),title:x=>x.f.what,sub:x=>relDay(nextYearly(x.f.date)),sum:l=>`${l.length} saved`,tile:dateTile},
  {id:'gifts',name:'Gifts',icon:'star',word:'gift idea',view:vGifts,fields:[F('what','Gift'),F('who','For (leave empty to keep as an idea)'),F('occ','Occasion','select',{opts:['Holidays','Birthday','Other']}),F('price','Price','number',{blank:true}),F('status','Status','select',{opts:GIFT_ST})],title:x=>x.f.what,sub:x=>[x.f.who,x.f.status].filter(Boolean).join(' · '),sum:l=>`${l.filter(x=>x.f.status==='Idea').length} ideas`,tile:giftTile}],
  high:()=>{const[a,b]=weekRange(todayK()),n=ofType('Relationships','people','').filter(x=>(x.f.logs||[]).some(d=>d>=a&&d<=b)).length;return n?['heart',`You reached out to ${n} ${n===1?'person':'people'} this week`]:null;},up:relUp},
 Career:{tools:[
  {id:'wins',name:'Wins',icon:'star',word:'win',view:vWins,fields:[F('what','What you got done','area'),F('kind','Type','select',{opts:WIN_KINDS}),F('impact','Impact (optional)'),DATE],title:x=>x.f.what,sub:x=>relDay(x.f.date),sum:l=>`${l.filter(thisMonth).length} this month`,tile:winTile},
  {id:'oneonones',name:'1:1s',icon:'heart',word:'series',view:vOnes,legacy:'past',t:'series',fields:[F('what','With (Manager, Mentor…)'),F('every','Every (days)','number',{def:14}),F('date','Next one','date'),F('time','Time','time',{blank:true})],
   types:{past:{word:'past 1:1',fields:[F('what','With'),F('note','Notes and follow-ups','area'),DATE]}},
   title:x=>x.f.what,sub:x=>`${relDay(x.f.date)}${x.f.note?' · '+x.f.note:''}`,sum:l=>`${l.length} logged`,tile:oneTile},
  {id:'skills',name:'Skills',icon:'chart',word:'skill',view:vSkills,fields:[F('what','Skill'),F('level','Level (1–5)','number',{def:1}),F('target','Target level','number',{def:3}),F('focus','Focus now','select',{opts:['No','Yes']}),F('note','How you’re building it')],
   types:{cert:{word:'certification',fields:[F('what','Certification'),F('state','Status','select',{opts:['Studying','Held']}),F('exam','Exam date','date',{blank:true}),F('mods','Modules','number',{blank:true}),F('done','Modules done','number',{def:0}),F('plan','Hours planned','number',{blank:true}),F('hours','Hours so far','number',{def:0}),F('renew','Renew or valid until','date',{blank:true}),F('cneed','Credits needed to renew','number',{blank:true}),F('cgot','Credits so far','number',{blank:true}),F('note','Note')]}},
   title:x=>x.f.what,sub:x=>x.f.t?(x.f.state||'Certification'):`Level ${x.f.level} of 5${x.f.note?' · '+x.f.note:''}`,sum:l=>`${l.length} tracked`,tile:skillTile},
  {id:'jobs',name:'Job search',icon:'project',word:'role',view:vJobs,fields:[F('what','Role'),F('co','Company'),F('status','Stage','select',{opts:JOB_ST}),F('next','Next step'),F('url','Link'),F('note','Notes','area'),DATE],title:x=>x.f.what,sub:x=>[x.f.co,x.f.status].filter(Boolean).join(' · '),sum:l=>`${l.filter(x=>x.f.status!=='Closed').length} open`,tile:jobTile}],
  high:()=>{const n=winsIn(quarterKey(today())).length;return n?['star',`${n} win${n>1?'s':''} logged this quarter`]:null;},up:careerUp},
 Learning:{tools:[
  {id:'reading',name:'Reading',icon:'books',word:'book',view:vReading,fields:[F('what','Title'),F('by','Author'),F('status','Status','select',{opts:['To read','Reading','Finished']}),F('pages','Pages','number',{blank:true}),F('page','On page','number',{blank:true}),F('note','Why this book'),F('finOn','Finished on','date',{blank:true})],
   after:x=>{if(x.f.t)return;if(x.f.status==='Finished'&&!x.f.finOn){x.f.finOn=todayK();put(x,{silent:true});}},
   types:{note:{word:'reading note',fields:[F('what','The note','area'),F('book','From'),F('page','Page','number',{blank:true})]}},
   title:x=>x.f.what,sub:x=>[x.f.by,x.f.status].filter(Boolean).join(' · '),sum:l=>`${l.filter(x=>x.f.status==='Reading').length} reading now`,tile:readTile},
  {id:'courses',name:'Courses',icon:'project',word:'course',view:vCourses,fields:[F('what','Course'),F('type','Type','select',{opts:['Online course','Language app','In person','Other']}),F('lessons','Lessons','number',{blank:true}),F('done','Lessons done','number',{def:0}),F('min','Minutes a lesson','number',{def:20}),F('nextL','Next lesson'),F('url','Link')],title:x=>x.f.what,sub:x=>`${Math.round(coursePct(x)*100)}% done`,sum:l=>`${l.filter(x=>coursePct(x)<1).length} in progress`,tile:courseTile},
  {id:'review',name:'Review',icon:'rep',word:'card',view:vReview,recurring:true,fields:[F('what','Question or idea','area'),F('a','Answer','area'),F('src','From')],title:x=>x.f.what,sub:x=>dueState(x).txt,sum:l=>{const n=revDue().length;return n?`${n} to review`:'Nothing due';},tile:revTile},
  {id:'paths',name:'Paths',icon:'target',word:'path',view:vPaths,fields:[F('what','What you want to learn'),F('note','Steps, one per line (Book: Thinking in Systems)','area')],types:{interest:{word:'interest',fields:[F('what','What to learn next')]}},title:x=>x.f.what,sub:x=>x.f.t?'Interest':`${x.f.cur||0} of ${pathSteps(x).length} steps`,sum:l=>`${l.length} paths`,tile:pathTile}],
  high:()=>{const n=revStreak();return n>1?['spark',`Reviewed ${n} days in a row`]:null;},up:learnUp},
 Travel:{tools:[
  {id:'trips',name:'Trips',icon:'cal',word:'trip',view:vTrips,fields:[F('what','Where to'),F('kind','Kind of trip','select',{opts:['Personal','Work']}),F('status','Stage','select',{opts:['Planned','Dreaming','Done']}),F('date','Starts','date',{blank:true}),F('end','Ends','date',{blank:true}),F('who','Who with'),F('budget','Budget','number',{blank:true}),F('save','Saved so far (dreaming)','number',{blank:true}),F('note','Notes','area')],
   types:{book:{word:'booking',photos:true,fields:[F('bk','Type','select',{opts:()=>BK_TYPES}),F('what','What (Flight to Denver)'),F('date','Date','date'),F('time','Starts','time',{blank:true}),F('endT','Ends','time',{blank:true}),F('outDate','Check-out or return date','date',{blank:true}),F('outTime','Check-out or return time','time',{blank:true}),F('where','Where or flight number'),F('conf','Confirmation number'),F('cost','Cost','number',{blank:true}),F('need','Still needs booking','select',{opts:['No','Yes']}),F('note','Note','area')]}},
   after:tripAfter,onDelete:tripOnDelete,title:x=>x.f.what,sub:x=>[x.f.status,x.f.date?relDay(x.f.date):''].filter(Boolean).join(' · '),sum:()=>{const a=tripsAll(),n=a.filter(x=>tripLive(x)&&tripEnd(x)>=todayK()).length,d=a.filter(x=>x.f.status==='Dreaming').length;return [n?`${n} planned`:null,d?`${d} dreaming`:null].filter(Boolean).join(', ')||`${a.length} past`;},tile:()=>({v:'',sub:''})},
  {id:'packing',name:'Packing lists',icon:'list',word:'template',view:vPacking,always:true,fields:[F('what','Template')],title:x=>x.f.what,sub:()=>'',sum:()=>`${dCount(packTemplates().length,'template')}`,tile:()=>({v:'',sub:''})},
  {id:'docs',name:'Travel documents',icon:'books',word:'document',view:vDocs,photos:true,fields:[F('what','What (Passport, Known traveler number)'),F('val','Number or details'),F('secret','Hide until tapped','select',{opts:['No','Yes']}),F('expires','Expires','date',{blank:true}),F('note','Note')],title:x=>x.f.what,sub:x=>x.f.note||'',sum:l=>`${l.length} saved`,tile:()=>({v:'',sub:''})}],up:()=>null},
 Recreation:{tools:[
  {id:'outings',name:'Outings',icon:'compass',word:'outing',view:vOutings,fields:[F('what','Where to go or what to do'),F('mins','About how long (minutes)','number',{blank:true}),F('cost','Cost (Free, $, $45)'),F('where','Setting','select',{opts:['Outdoors','Indoors']}),F('who','With','select',{opts:['Anyone','Solo','With friends']}),F('bucket','Bucket list','select',{opts:['No','Yes']}),F('note','Notes')],title:x=>x.f.what,sub:x=>[x.f.status,x.f.note].filter(Boolean).join(' · '),sum:l=>`${l.filter(x=>x.f.status!=='Been').length} to try`,tile:outingTile},
  {id:'hobbies',name:'Hobbies',icon:'heart',word:'hobby',view:vHobbies,fields:[F('what','Hobby'),F('perWeek','Sessions a week (optional)','number',{blank:true}),F('next','Working on or next up'),F('every','Remind every (days, optional)','number',{blank:true}),F('last','Last time','date',{blank:true})],
   types:{sess:{word:'session',fields:[F('what','Hobby'),F('min','Minutes','number',{def:30}),DATE]}},title:x=>x.f.what,sub:x=>x.f.t?`${x.f.min} min · ${relDay(x.f.date)}`:dueState(x).txt,sum:l=>`${ofType('Recreation','hobbies','').length} hobbies`,tile:hobbyTile},
  {id:'queue',name:'Movies, TV & more',icon:'list',word:'queue item',view:vQueue,fields:[F('what','Show, movie, game…'),F('type','Type','select',{opts:['Show','Movie','Documentary','Game','Board game','Podcast','Album','Music','Other']}),F('status','Status','select',{opts:['Up next','In progress','Finished']}),F('eps','Episodes this season','number',{blank:true}),F('ep','Episodes watched','number',{blank:true}),F('note','Note (length, season)'),F('from','Who recommended it'),F('where','Where it streams'),F('with','Watching with'),F('season','Season','number',{blank:true})],title:x=>x.f.what,sub:x=>[x.f.type,x.f.status].filter(Boolean).join(' · '),sum:l=>`${l.filter(x=>x.f.status==='Up next').length} up next`,tile:queueTile}],
  high:()=>{const n=ofType('Recreation','outings','').filter(x=>(x.f.doneOn||'').slice(0,7)===monthKey(today())).length;return n?['spark',`${n} outing${n>1?'s':''} this month`]:null;},up:recUp},
 'Personal growth':{tools:[
  {id:'compass',name:'Compass',icon:'compass',say:'The values you want to live by, in your own words.',word:'value',view:vCompass,fields:[F('what','A value you live by'),F('note','What it means to you','area')],title:x=>x.f.what,sub:x=>x.f.note,sum:l=>`${l.length} values`,tile:compassTile},
  {id:'wheel',name:'Wheel',icon:'m_wheel',say:'Rate each life area now and then, and see where you stand.',word:'wheel check',view:vWheel,wheel:true,fields:[],title:x=>relDay(x.f.date),sub:x=>{const v=Object.entries(x.f.scores||{});return v.length?`Average ${(v.reduce((n,e)=>n+e[1],0)/v.length).toFixed(1)} of 10`:'';},sum:l=>{const s=l.slice().sort((a,b)=>a.f.date<b.f.date?1:-1)[0];return s?`Last check ${relDay(s.f.date)}`:'Not rated yet';},tile:wheelTile},
  {id:'experiments',name:'Experiments',icon:'spark',word:'experiment',view:vExperiments,fields:[F('what','I’ll try'),F('why','To find out'),F('len','How many days','number',{def:14}),F('status','Status','select',{opts:['Running','Finished']}),F('result','What happened','area'),F('date','Starts','date')],title:x=>x.f.what,sub:x=>[x.f.status,x.f.result||x.f.why].filter(Boolean).join(' · '),sum:l=>`${l.filter(x=>x.f.status==='Running').length} running`,tile:expTile},
  {id:'lessons',name:'Lessons',icon:'books',word:'lesson',view:vLessons,fields:[F('lesson','What you learned','area'),F('area','Area','select',{opts:()=>['Unsorted',...(get.settings().areas||AREAS)]}),F('from','Where it came from'),DATE],title:x=>x.f.lesson,sub:x=>[relDay(x.f.date),x.f.from].filter(Boolean).join(' · '),sum:l=>`${l.length} kept`,tile:lessonTile}],
  high:()=>{const c=cfg('Personal growth','compass').f;return c.theme?['compass',`${today().getFullYear()} theme: ${c.theme}`]:null;},up:growthUp},
};
const toolOf=(hub,id)=>toolsOf(hub).find(t=>t.id===id);
function viewAreas(root){
  const page=el('div',{class:'page'}),areas=get.settings().areas||AREAS;
  page.append(pageHead('Life Areas',`${areas.length} areas`,{actions:el('button',{class:'iconbtn green','aria-label':'Manage life areas',html:ic('gear',22),onclick:()=>App.go('setpage',{id:'areas'})})}));
  page.append(el('div',{class:'list'},areas.map(a=>{const c=areaRecords(a),n=c.tasks.length+c.habits.length+c.goals.length+c.projects.length+get.all('entry').filter(x=>x.hub===a&&!isCfg(x)).length;return el('button',{class:'li',onclick:()=>App.go('area',{name:a})},el('span',{class:'sq',style:`background:color-mix(in srgb,${AREA_COLOR[a]||'#466B5A'} 14%,#fff);color:${AREA_COLOR[a]||'#466B5A'}`,html:ic(areaIcon(a),20)}),el('span',{class:'grow'},el('b',{style:'font-size:17px'},a),el('small',{},areaLine(a)||(n?`${n} items`:'Nothing here yet'))),el('span',{class:'chev',html:ic('chevr',16,2)}));})));
  root.append(page);
}
function areaRecords(a){return{tasks:get.all('task').filter(r=>r.area===a&&isOpenTask(r)),habits:get.all('habit').filter(r=>r.area===a),goals:get.all('goal').filter(r=>r.area===a),projects:get.all('project').filter(r=>r.area===a),resources:get.all('resource').filter(r=>r.area===a)};}
function hubHidden(name){const s=get.settings(),off=(s.hubHidden||{})[name]||[],on=(s.hubShown||{})[name]||[];return[...off,...toolsOf(name).filter(t=>t.optIn&&!on.includes(t.id)).map(t=>t.id)];}
function editToolsSheet(name,hub){const inst=openSheet({title:'Modules',left:{label:'Done'},build:b=>{const draw=()=>{b.innerHTML='';b.append(el('p',{class:'muted small'},'Turn off a module you don’t use. Nothing in it is deleted.'),el('div',{class:'list'},toolsOf(name).map(t=>{const on=toolOn(name,t.id);return el('div',{class:'li',style:'min-height:56px'},el('span',{style:'display:grid;color:var(--accent-text)',html:ic(t.icon,20)}),el('span',{class:'grow'},t.name),el('button',{class:'sw'+(on?' on':''),role:'switch','aria-checked':String(on),'aria-label':t.name,onclick:()=>{setToolOn(name,t.id,!on);draw();}},el('i')));})),el('button',{class:'btn line block',style:'margin-top:12px',onclick:()=>{inst.close();App.state.params={name};modSheet(null);}},'Build your own module'),el('button',{class:'linkbtn small',style:'margin-top:4px',onclick:()=>{inst.close();App.go('modules');}},'All modules'));};draw();}});}
function toolTile(name,t){const l=entries(name,t.id),d=t.tile?t.tile(l,name):{v:String(l.length),sub:l.length?t.sum(l):'Nothing yet'};
  return el('button',{class:'tc'+(d.off?' off':''),'aria-label':`${t.name}${d.sub?', '+d.sub:''}`,onclick:()=>App.go('tool',{hub:name,tool:t.id})},
    el('span',{class:'tt2'},el('span',{class:'ib',html:ic(t.icon||'grid',19)}),d.tag?pill(d.tag,d.tagc||''):null),
    el('span',{class:'tb'},d.v!=null?el('span',{class:'tv serif'},String(d.v),d.small?el('small',{},' '+d.small):null):null,el('span',{class:'tn'},t.name),d.sub?el('span',{class:'ts clip'},d.sub):null,d.viz?el('span',{class:'vz'},d.viz):null));}
function viewArea(root,name){
  if(!name){viewAreas(root);return;}
  markGs('area');
  if(name==='Health'){viewHealth(root);return;}
  if(name==='Travel'){viewTravel(root);return;}
  if(DASH_SPECS[name]){viewDash(root,name);return;}
  viewDashPlain(root,name);
}
/* one form builder shared by every hub record */
const optsOf=f=>typeof f.opts==='function'?f.opts():f.opts;
function renderFields(body,fields,D,update){
  let firstInput=null;
  fields.forEach(f=>{const id=`f-x-${f.id}`;let input;
    if(f.type==='select'){const o=optsOf(f);input=el('select',{id,onchange:e=>{D[f.id]=e.target.value;update();}},o.map(x=>{const op=el('option',{value:x},x);if(D[f.id]===x)op.selected=true;return op;}));}
    else if(f.type==='area'){body.append(fieldNotes(id,f.label,f.ph||'',D[f.id]||'',v=>{D[f.id]=v;update();}));return;}
    else{input=el('input',{id,type:f.type==='number'?'number':f.type==='date'?'date':f.type==='time'?'time':'text',inputmode:f.type==='number'?'decimal':null,value:D[f.id]??'',autocomplete:'off',oninput:e=>{D[f.id]=f.type==='number'?(e.target.value===''?'':+e.target.value):e.target.value;update();}});if(!firstInput&&f.type==='text')firstInput=input;}
    body.append(el('label',{class:'field'},el('span',{class:'eyebrow'},f.label),input));});
  return firstInput;
}
function fieldDefaults(fields,D){fields.forEach(f=>{if(D[f.id]!==undefined)return;if(f.def!=null)D[f.id]=f.def;else if(f.type==='select')D[f.id]=optsOf(f)[0];else if(f.type==='date'&&f.id!=='last'&&!f.blank)D[f.id]=todayK();});return D;}
function askFields({title,fields,D={},save,addLabel='Save',word='change',isEdit=true,req=true}){fieldDefaults(fields,D);const titleF=fields.find(f=>f.type==='text'||f.type==='area');const can=()=>!req||!titleF||!!String(D[titleF.id]??'').trim();
  return formSheet({title,addLabel,D,word,isEdit,canAdd:can,commit:()=>save(D),build:(body,update)=>{renderFields(body,fields,D,update);}});}
function pickSheet(title,opts,on){const inst=openSheet({title,left:{label:'Cancel'},build:b=>b.append(el('div',{class:'list'},opts.map(([v,l,s])=>el('button',{class:'li',style:'min-height:54px',onclick:()=>{inst.close();on(v);}},el('span',{class:'grow'},el('b',{style:'font-weight:500'},l),s?el('small',{},s):null)))))});}
function entrySheet(hub,t,rec,{seed=null,after=null,type=null,preset=null}={}){
  if(t.wheel){wheelSheet(hub,t,rec);return;}
  const isEdit=!!rec,ty=type!==null?type:(isEdit?(rec.f.t||t.legacy||''):(t.t||'')),def=(t.types&&t.types[ty])||t,fields=def.fields,word=def.word||t.word,D=isEdit?clone(rec.f):fieldDefaults(fields,{});
  if(!isEdit&&ty)D.t=ty;
  if(!isEdit&&preset)Object.assign(D,preset);
  const titleF=fields[0].type==='select'?fields[1]:fields[0];
  if(seed){const raw=seed.title&&seed.title!=='Unnamed Idea'?seed.title:'',w=parseWhen(raw,new Date());D[titleF.id]=w.title||raw;const nf=fields.find(f=>['note','val','why','result'].includes(f.id)&&f.id!==titleF.id);if(nf&&seed.notes)D[nf.id]=seed.notes;const df=fields.find(f=>f.type==='date'&&f.id!=='last');if(df&&(w.date||w.deadline))D[df.id]=w.date||w.deadline;if((seed.photos||[]).length)D.photos=seed.photos;}
  const can=()=>titleF.type==='number'?true:!!String(D[titleF.id]??'').trim();
  const hasPhotos=def.photos||(t.photos&&def===t)||(D.photos||[]).length;
  formSheet({title:isEdit?`Edit ${word}`:`New ${word}`,addLabel:isEdit?'Save':'Add',D,word,isEdit,canAdd:can,commit:()=>{let r;if(isEdit){rec.f=D;r=rec;put(rec);toast('Saved');}else{r=create('entry',{hub,tool:t.id,f:D});toast('Added');after&&after();}if(t.after)t.after(r);},build:(body,update,i)=>{
    const short=!isEdit&&!(OB_TEST()&&!window.__LIFEOS_INTROS__)&&fields.length>3&&!entries(hub,t.id).some(x=>(x.f.t||'')===(ty||''));
    const first=renderFields(body,short?fields.slice(0,3):fields,D,update);
    if(short){const more=el('div',{hidden:true});renderFields(more,fields.slice(3),D,update);const tg=el('button',{class:'ob-more','aria-expanded':'false',onclick:()=>{more.hidden=!more.hidden;tg.setAttribute('aria-expanded',String(!more.hidden));tg.querySelector('.chev').style.transform=more.hidden?'':'rotate(90deg)';}},el('span',{class:'grow'},el('b',{style:'font-weight:500'},'More details'),el('small',{},andList(fields.slice(3).map(f=>f.label.replace(/\s*\(.*\)$/,'').toLowerCase())).replace(/^./,c=>c.toUpperCase()))),el('span',{class:'chev',html:ic('chevr',16,2)}));body.append(tg,more);}
    if(hasPhotos)body.append(el('div',{class:'sect'},'Photos'),photosEditor(D));
    if(isEdit)body.append(el('button',{class:'delete',onclick:()=>{const c=clone(rec),cal=rec.f.calId&&get.id(rec.f.calId),cc=cal&&clone(cal),un=t.onDelete?t.onDelete(rec):null;if(cal)remove(cal.id,{silent:true});remove(rec.id);i.close();toast('Deleted',()=>{put(c);if(cc)put(cc);if(un)un();App.refresh();});}},`Delete ${word}`));else if(first&&!first.value)focusIfKeyboard(first);}});
}
function wheelSheet(hub,t,rec){const areas=(get.settings().areas||AREAS),D=rec?clone(rec.f):{date:todayK(),scores:Object.fromEntries(areas.map(a=>[a,5]))},isEdit=!!rec;let box;const ctx=formCtx(()=>draw());const draw=()=>{box.innerHTML='';areas.forEach(a=>box.append(ctx.row(a,'leaf',a,null,{expand:false,trailing:ctx.stepper(D.scores[a]??5,1,10,v=>{D.scores[a]=v;draw();})})));};
  const inst=openSheet({title:'Rate your life areas',left:{label:'Cancel'},right:{label:'Save',onclick:()=>{if(isEdit){rec.f=D;put(rec);}else create('entry',{hub,tool:t.id,f:D});inst.close();toast('Saved');}},build:b=>{box=el('div',{class:'group'});b.append(el('p',{class:'muted small'},'1 is struggling. 10 is thriving. Be honest, it’s only for you.'),box);draw();}});}
function viewTool(root,hub,id){
  const t=toolOf(hub,id);if(!t){App.back('areas');return;}const page=el('div',{class:'page'});
  App.state.params=Object.assign({},App.state.params,{name:hub});
  if(toolFresh(hub,t))toolIntroPage(page,hub,t);else{t.view(page,hub,t);try{toolPageMenu(page,hub,t);}catch(e){console.warn(e);}const an=toolAfterNote(hub,t);if(an){const h=page.firstElementChild;if(h)h.after(an);else page.prepend(an);}}root.append(page);
}
