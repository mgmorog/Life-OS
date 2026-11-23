/* ---------- Quick capture: reads dates, repeats and links out of what you type ---------- */
const WEEKDAY=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const MONTHS=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const URL_RE=/\b(?:https?:\/\/|www\.)[^\s<>"']+/i;
function parseWhen(text,base=new Date()){
  const out={title:text||'',date:null,time:null,deadline:null,label:'',hits:[]};if(!text)return out;
  const day0=new Date(base.getFullYear(),base.getMonth(),base.getDate());
  let s=' '+text+' ',dateHit=null,by=false;
  /* links are never mistaken for dates */
  const link=(text.match(URL_RE)||[])[0];if(link)s=s.replace(link,' \u0001 ');
  const take=(re,fn)=>{if(dateHit)return;const m=s.match(re);if(!m)return;const d=fn(m);if(!d)return;by=/^\s*by\b/i.test(m[0]);dateHit=d;out.hits.push({k:'date',s:m[0].trim()});s=s.replace(m[0],' ');};
  const pre='(?:\\b(?:on|by|due|this)\\s+)?';
  take(new RegExp(`\\b(?:by\\s+)?(?:today|tonight)\\b`,'i'),()=>day0);
  take(new RegExp(`\\b(?:by\\s+)?(?:tomorrow|tmrw|tmw)\\b`,'i'),()=>addD(day0,1));
  take(/\bin\s+(\d{1,3}|a|an|one|two|three)\s+(day|week|month)s?\b/i,m=>{const n={a:1,an:1,one:1,two:2,three:3}[m[1].toLowerCase()]||+m[1];return m[2].toLowerCase()==='day'?addD(day0,n):m[2].toLowerCase()==='week'?addD(day0,n*7):new Date(day0.getFullYear(),day0.getMonth()+n,day0.getDate());});
  take(/\b(?:by\s+)?next\s+week\b/i,()=>addD(weekStartOf(day0),7));
  take(new RegExp(`\\b(?:by\\s+|on\\s+|due\\s+)?(next\\s+|this\\s+)?(${WEEKDAY.join('|')})\\b`,'i'),m=>{if(/\b(every|each)\s*$/i.test(s.slice(0,m.index)))return null;const w=WEEKDAY.indexOf(m[2].toLowerCase());let n=(w-day0.getDay()+7)%7||7;if(/next/i.test(m[1]||'')&&n<=(7-monIdx(day0)-1))n+=7;return addD(day0,n);});
  take(new RegExp(`\\b(?:by\\s+|on\\s+|due\\s+)?(${MONTHS.join('|')})[a-z]*\\.?\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b(?!:)`,'i'),m=>{const d=new Date(day0.getFullYear(),MONTHS.indexOf(m[1].toLowerCase()),+m[2]);if(+m[2]>31)return null;return d<day0?new Date(d.getFullYear()+1,d.getMonth(),d.getDate()):d;});
  take(/\b(?:by\s+|on\s+|due\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\b/i,m=>{const mo=+m[1],da=+m[2];if(mo<1||mo>12||da<1||da>31)return null;const y=m[3]?(+m[3]<100?2000+ +m[3]:+m[3]):day0.getFullYear();const d=new Date(y,mo-1,da);return !m[3]&&d<day0?new Date(y+1,mo-1,da):d;});
  /* time */
  let m=s.match(/\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if(m){let h=+m[1]%12;if(m[3].toLowerCase()==='pm')h+=12;if(+m[1]<=12&&(+m[2]||0)<60){out.time=h*60+(+m[2]||0);out.hits.push({k:'time',s:m[0].trim()});s=s.replace(m[0],' ');}}
  else if((m=s.match(/\bat\s+(\d{1,2})(?::(\d{2}))?(?![\w:/])/i))&&+m[1]<24&&(+m[2]||0)<60){let h=+m[1];if(h>=1&&h<=6)h+=12;out.time=h*60+(+m[2]||0);out.hits.push({k:'time',s:m[0].trim()});s=s.replace(m[0],' ');}
  else if((m=s.match(/\b(?:at\s+)?noon\b/i))){out.time=720;out.hits.push({k:'time',s:m[0].trim()});s=s.replace(m[0],' ');}
  if(by&&dateHit){out.deadline=k(dateHit);}else if(dateHit){out.date=k(dateHit);}
  else if(out.time!=null){const cur=base.getHours()*60+base.getMinutes();out.date=k(out.time>cur?day0:addD(day0,1));}
  if(link)s=s.replace('\u0001',link);
  out.title=s.replace(/\s+/g,' ').replace(/\s+[,;.]/g,m=>m.trim()).replace(/[\s,;-]+$/,'').replace(/\s+(?:at|on|by|due)$/i,'').trim();
  const bits=[];if(out.date)bits.push(relDay(out.date));if(out.time!=null)bits.push(fmtT(out.time));if(out.deadline)bits.push(`Due ${relDay(out.deadline)}`);out.label=bits.join(', ');
  return out;
}
function parseRepeat(text){
  const s=(text||'').toLowerCase();let m,days=null,target=null,tod=null;
  if(/\b(every\s*day|daily|each\s+day)\b/.test(s))days=[0,1,2,3,4,5,6];
  else if(/\b(every\s+weekday|on\s+weekdays|weekdays)\b/.test(s))days=[0,1,2,3,4];
  else if(/\b(every\s+weekend|on\s+weekends|weekends)\b/.test(s))days=[5,6];
  else if((m=s.match(new RegExp(`\\b(?:every|each)\\s+(${WEEKDAY.join('|')})\\b`))))days=[(WEEKDAY.indexOf(m[1])+6)%7];
  else if((m=s.match(/\b(\d|two|three|four|five|six)\s*(?:x|times?)\s*(?:a|per)\s*week\b/)))target={two:2,three:3,four:4,five:5,six:6}[m[1]]||+m[1];
  else if(/\b(every\s+week|weekly)\b/.test(s))target=1;
  if((m=s.match(/\b(?:every|each)\s+(morning|afternoon|evening|night)\b/))){tod=m[1]==='night'?'evening':m[1];if(!days)days=[0,1,2,3,4,5,6];}
  if(!days&&target==null)return null;
  const title=(text||'').replace(/\b(?:every\s*day|each\s+day|daily|every\s+weekday|on\s+weekdays|weekdays|every\s+weekend|on\s+weekends|weekends|every\s+week|weekly)\b/i,' ').replace(new RegExp(`\\b(?:every|each)\\s+(?:${WEEKDAY.join('|')}|morning|afternoon|evening|night)\\b`,'i'),' ').replace(/\b(?:\d|two|three|four|five|six)\s*(?:x|times?)\s*(?:a|per)\s*week\b/i,' ').replace(/\s+/g,' ').trim();
  return{days,target,tod,title};
}
/* Quick capture's reading of a line: dates and times (parseWhen), a time range or length, ! for important, #area,
   and any words the person chose to keep as plain text. hits are what it picked up, for the chips. */
function capRead(text,keep=[],base=new Date(),guess=false){let s=' '+(text||'')+' ';const hits=[];let hi=false,area=null,dur=null,range=null,remind=false;
  s=s.replace(/^\s*(remind me to|don[’']?t forget to|remember to)\s+/i,m=>{remind=true;hits.push({k:'rem',s:m.trim(),label:'Reminder'});return ' ';});
  (keep||[]).forEach((w,i)=>{if(w&&s.includes(w))s=s.replace(w,`\u0002${i}\u0003`);});
  s=s.replace(/(^|\s)!{1,3}(?=\s|$)/,m=>{hi=true;hits.push({k:'hi',s:m.trim(),label:'Important'});return ' ';});
  s=s.replace(/(^|\s)#([A-Za-z][\w-]*)/,(m,sp,tag)=>{const t=tag.toLowerCase().replace(/[-_]/g,''),a=(get.settings().areas||AREAS).find(x=>x.toLowerCase().replace(/\s/g,'').startsWith(t));if(a){area=a;hits.push({k:'area',s:m.trim(),label:a});return ' ';}return m;});
  let m=s.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if(m){const ap2=m[6].toLowerCase(),ap1=(m[3]||'').toLowerCase()||ap2;let h1=+m[1]%12+(ap1==='pm'?12:0),h2=+m[4]%12+(ap2==='pm'?12:0);if(!m[3]&&h1>h2)h1-=12;const a=h1*60+(+m[2]||0),b=h2*60+(+m[5]||0);if(b>a&&a>=0){range={start:a,dur:b-a};hits.push({k:'time',s:m[0].trim(),label:`${fmtT(a)}–${fmtT(b)}`});s=s.replace(m[0],' ');}}
  if((m=s.match(/\bfor\s+(\d+(?:\.\d+)?|an?|one|two|three)\s*(hours?|hrs?|minutes?|mins?)\b/i)||s.match(/\b(\d+(?:\.\d+)?|an?|one|two|three)\s*(hours?|hrs?|minutes?|mins?)\b/i))){const n={a:1,an:1,one:1,two:2,three:3}[m[1].toLowerCase()]||+m[1];dur=Math.round(/^h/i.test(m[2])?n*60:n);if(dur>0&&dur<=720){hits.push({k:'dur',s:m[0].trim(),label:fmtDurS(dur)});s=s.replace(m[0],' ');}else dur=null;}
  const w=parseWhen(s.replace(/\s+/g,' ').trim(),base);
  w.hits.forEach(h=>hits.push(Object.assign(h,{label:h.k==='time'?fmtT(w.time):w.deadline?`Due ${relDay(w.deadline)}`:relDay(w.date)})));
  if(range){w.time=range.start;dur=dur||range.dur;if(!w.date&&!w.deadline){const cur=base.getHours()*60+base.getMinutes();const d0=new Date(base.getFullYear(),base.getMonth(),base.getDate());w.date=k(range.start>cur?d0:addD(d0,1));}}
  if(guess&&!area){const g=capArea(String(w.title||'').replace(/\u0002(\d+)\u0003/g,(z,i)=>keep[+i]));if(g){area=g;hits.push({k:'area',s:null,guess:true,label:g});}}
  const back=x=>String(x||'').replace(/\u0002(\d+)\u0003/g,(z,i)=>keep[+i]).replace(/\s+/g,' ').trim();
  const bits=[];if(w.date)bits.push(relDay(w.date));if(w.time!=null)bits.push(fmtT(w.time));if(w.deadline)bits.push(`Due ${relDay(w.deadline)}`);
  return{title:back(w.title).replace(/^./,c=>c.toUpperCase()),date:w.date,time:w.time,deadline:w.deadline,dur,hi,area,remind,hits,label:bits.join(', '),raw:back(s)};}
/* "milk to groceries", "batteries on the Packing list" */
function capList(t){const m=(t||'').trim().match(/^(.+?)\s+(?:to|on)\s+(?:the\s+|my\s+)?(.+?)(?:\s+list)?$/i);if(!m)return null;const n=m[2].toLowerCase();const l=get.all('list').find(x=>x.title.toLowerCase()===n||x.title.toLowerCase()===n+' list');return l?{list:l,item:m[1].trim()}:null;}
const CAP_TASK=/^(call|email|e-mail|text|message|pay|buy|book|order|schedule|renew|cancel|send|reply|return|pick up|drop off|submit|sign|mail)\b/i;
/* which life area a line belongs to: plain words first, then where similar things went before */
const AREA_KW=[[/\b(dentist|doctor|dr\.?|gym|workout|run|pharmacy|meds|prescription|therapy|therapist|physio|yoga|vitamins?|checkup|eye exam)\b/i,'Health'],[/\b(invoice|bill|bills|rent|mortgage|bank|taxes?|budget|insurance|401k|ira|paycheck|venmo|refund|credit card)\b/i,'Finances'],[/\b(workday|manager|team|boss|resume|linkedin|interview|grant|audit|1:1|one on one|performance review|report)\b/i,'Career'],[/\b(laundry|dishes|vacuum|plumber|groceries|trash|lawn|furnace|filter|repair|clean)\b/i,'Home'],[/\b(mom|dad|grandma|grandpa|sister|brother|friend|birthday|anniversary|date night|wedding)\b/i,'Relationships'],[/\b(flight|hotel|trip|passport|airbnb|packing)\b/i,'Travel'],[/\b(course|class|lesson|study|book club|spanish|learn)\b/i,'Learning']];
const STOPW=new Set('the a an and or to for of on in at with my your call email text buy pay book get make send'.split(' '));
function capArea(t){const on=new Set(get.settings().areas||AREAS);const hit=AREA_KW.find(([r,a])=>on.has(a)&&r.test(t));if(hit)return hit[1];
  const words=(t||'').toLowerCase().split(/\W+/).filter(w=>w.length>3&&!STOPW.has(w));if(!words.length)return null;const n={};
  get.all('task',{archived:true}).slice(-400).forEach(x=>{const a=x.area||areaOfTask(x);if(!a||!on.has(a))return;const tw=(x.title||'').toLowerCase();if(words.some(w=>new RegExp(`\\b${w}\\b`).test(tw)))n[a]=(n[a]||0)+1;});
  const best=Object.entries(n).sort((a,b)=>b[1]-a[1])[0];return best&&best[1]>=2?best[0]:null;}
/* chores and bills that repeat: "pay rent every month on the 1st", "water plants every Sunday" */
const CHORE=/^(pay|water|clean|take out|put out|renew|change|replace|vacuum|mow|wash|feed|empty|refill|check|backup|back up|file|submit|send|order|charge|scrub|dust|do laundry|laundry|trash|recycling)\b/i;
const HABITW=/\b(run|running|read|reading|meditat\w*|stretch\w*|journal\w*|walk|workout|exercise|practice|study|yoga|floss|drink|gym|lift|pray|sleep)\b/i;
function capRepeat(t){const s=(t||'').toLowerCase();let rp=null,date=null,m,lab='',strip=[];
  if((m=s.match(/\b(?:every|each)\s+month\s+on\s+the\s+(\d{1,2})(?:st|nd|rd|th)?\b|\bmonthly\s+on\s+the\s+(\d{1,2})(?:st|nd|rd|th)?\b|\b(?:every|each|on\s+the)\s+(\d{1,2})(?:st|nd|rd|th)\s*(?:of\s+(?:the|every|each)\s+month)?\b/))){const d=+(m[1]||m[2]||m[3]);if(d>=1&&d<=31){const t0=today();let x=new Date(t0.getFullYear(),t0.getMonth(),d);if(x<t0)x=new Date(t0.getFullYear(),t0.getMonth()+1,d);rp={type:'custom',unit:'month',n:1,end:null};date=k(x);lab=`Monthly on the ${d}${[,'st','nd','rd'][d%10>3||Math.floor(d%100/10)===1?0:d%10]||'th'}`;strip.push(m[0]);}}
  else if((m=s.match(/\b(?:every|each)\s+month\b|\bmonthly\b/))){rp={type:'custom',unit:'month',n:1,end:null};lab='Monthly';strip.push(m[0]);}
  else if((m=s.match(/\b(?:every|each)\s+year\b|\byearly\b|\bannually\b/))){rp={type:'custom',unit:'year',n:1,end:null};lab='Yearly';strip.push(m[0]);}
  else if((m=s.match(/\bevery\s+(two|2|other)\s+weeks?\b|\bbiweekly\b/))){rp={type:'custom',unit:'week',n:2,end:null};lab='Every 2 weeks';strip.push(m[0]);}
  else{const r=parseRepeat(t);if(r&&r.days){if(r.days.length===7){rp={type:'custom',unit:'day',n:1,end:null};lab='Every day';}else{rp={type:'custom',unit:'week',n:1,days:r.days,end:null};lab=r.days.length===1?`Every ${DOW[(r.days[0]+1)%7]}`:r.days.length===5?'Weekdays':'Weekends';const t0=today();for(let i=0;i<7;i++){const x=addD(t0,i);if(r.days.includes(monIdx(x))){date=k(x);break;}}}return{repeat:rp,date:date||todayK(),title:r.title,label:lab};}
    if(r&&r.target===1){rp={type:'custom',unit:'week',n:1,end:null};lab='Weekly';return{repeat:rp,date:todayK(),title:r.title,label:lab};}}
  if(!rp)return null;let title=t;strip.forEach(x=>{title=title.replace(new RegExp(x.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'i'),' ');});return{repeat:rp,date:date||todayK(),title:title.replace(/\s+/g,' ').trim(),label:lab};}
/* the same thing already waiting somewhere */
function capDupe(t){const n=(t||'').trim().toLowerCase();if(n.length<3)return null;
  const tk=get.all('task').find(x=>isOpenTask(x)&&(x.title||'').trim().toLowerCase()===n);if(tk)return{label:`Already planned: ${tk.title}${tk.date?` · ${relDay(tk.date)}`:''}`,open:()=>taskSheet(tk)};
  for(const l of get.all('list')){const it=(l.items||[]).find(i=>!i.d&&(i.t||'').trim().toLowerCase()===n);if(it)return{label:`Already on ${l.title}`,open:()=>App.go('list',{id:l.id})};}
  const idea=get.all('idea').find(x=>(x.title||'').trim().toLowerCase()===n);if(idea)return{label:'Already in your Inbox',open:()=>captureSheet(idea)};return null;}
const CAP_EX=['Try “Milk to groceries”','Try “Call Sam Fri 3pm #work”','Try “Gym 6–7pm”','Try “Pay rent every month on the 1st”','Try “Remind me to email Pat tomorrow”','Try “Run 3 times a week”','Try “Book flights by Dec 1”'];
/* A best guess at what an idea is. Returns null when there's no good reason to guess. */
const eventStart=t=>/\bdinner|drinks\b/i.test(t)?19*60:/\b(lunch|brunch)\b/i.test(t)?12*60:null;
function suggestKind(title,notes,base,keep=[]){
  const t=(title||'').trim(),all=t+' '+(notes||'');if(!t&&!(notes||'').trim())return null;
  if(URL_RE.test(all))return{kind:'resource',why:'Link'};
  if(/^\s*(remind me to|don[’']?t forget to|remember to)\b/i.test(t)){const w0=capRead(t,keep,base);return{kind:'task',why:w0.label};}
  const crp=CHORE.test(t)&&!HABITW.test(t)?capRepeat(t):null;if(crp)return{kind:'task',rep:crp,why:crp.label};
  const rp=parseRepeat(t);if(rp)return{kind:'habit',rp,why:rp.days?(rp.days.length===7?'Every day':rp.days.length===1?`Every ${DOW[(rp.days[0]+1)%7]}`:rp.days.length===5?'Weekdays':'Weekends'):rp.target===1?'Once a week':`${rp.target} times a week`};
  const lm=capList(t);if(lm)return{kind:'list',why:lm.item,list:lm.list,item:lm.item};
  const w=capRead(t,keep,base);
  if(/\b(birthday|anniversary|holiday|vacation|day off|time off|graduation)\b/i.test(t)&&(w.date||w.deadline)&&w.time==null)return{kind:'allday',why:w.label};
  if(CAP_TASK.test(t))return{kind:'task',why:w.label};
  if(w.dur||/\b(gym|deep work|focus time|study|practice)\b/i.test(t)&&w.time!=null)return{kind:'block',why:[w.label,w.dur?fmtDurS(w.dur):''].filter(Boolean).join(', ')};
  if(/\b(meeting|appointment|appt|dinner|lunch|brunch|breakfast|drinks|coffee|workout|class|interview|session|dentist|doctor)\b/i.test(t)&&(w.time!=null||w.date))return{kind:'block',why:w.label};
  if(w.date||w.deadline||w.time!=null)return{kind:'task',why:w.label};
  if(/^(plan|organi[sz]e|renovate|redo|launch|move|build|set up)\b/i.test(t)&&t.split(/\s+/).length>2)return{kind:'project',why:''};
  if(/^(learn|get better at|lose|save \$?\d|run a|read \d+|become|improve)\b/i.test(t))return{kind:'goal',why:''};
  if(/^(call|email|text|book|schedule|pay|buy|order|fix|send|finish|clean|renew|cancel|return|reply|write|pick up|drop off|ask|check|submit|sign|print|mail|wash)\b/i.test(t))return{kind:'task',why:''};
  return null;
}
const TURN_USE='lifeos-turn-use';
const turnUse=()=>{try{return JSON.parse(localStorage.getItem(TURN_USE)||'{}');}catch(e){return{};}};
function markTurn(id){try{const u=turnUse();u.n=u.n||{};u.n[id]=(u.n[id]||0)+1;u.r=[id,...(u.r||[]).filter(x=>x!==id)].slice(0,6);localStorage.setItem(TURN_USE,JSON.stringify(u));}catch(e){}}
function topTurns(){const n=(turnUse().n)||{},def=['task','list','habit','goal'];return TURN.map(x=>x[0]).sort((a,b)=>((n[b]||0)-(n[a]||0))||((def.indexOf(a)+1||9)-(def.indexOf(b)+1||9))).slice(0,4);}
const kindName=id=>(TURN.find(x=>x[0]===id)||[])[2]||'';
/* the capture hint reads as an action: "Make it a task" */
const addIt=g=>g.kind==='list'?`Add to ${g.list.title}`:g.kind==='task'?(g.rep?'Add repeating task':'Add task'):g.kind==='habit'?'Add habit':g.kind==='block'?'Add time block':g.kind==='allday'?'Add all-day item':makeIt(g.kind);
const makeIt=k=>{const n=k==='allday'?'all-day item':kindName(k).toLowerCase();return `Make it ${/^[aeiou]/.test(n)?'an':'a'} ${n}`;};
const DRAFT='lifeos-capture-draft';
const readDraft=()=>{try{return JSON.parse(localStorage.getItem(DRAFT)||'null');}catch(e){return null;}};
const writeDraft=d=>{try{if(d&&(d.title.trim()||d.notes.trim()||(d.photos||[]).length))localStorage.setItem(DRAFT,JSON.stringify({title:d.title,notes:d.notes,photos:d.photos||[]}));else localStorage.removeItem(DRAFT);}catch(e){}};
/* notes alone become a title (first line) plus notes (the rest) */
function tidyIdea(D){const t=D.title.trim();D.title=t;if(!t&&D.notes.trim()){const ls=D.notes.trim().split('\n');D.title=ls[0].slice(0,120);D.notes=ls.slice(1).join('\n').trim();}if(!D.title&&(D.photos||[]).length)D.title='Unnamed Idea';return D;}
function saveCapture(D,from){
  markGs('capture');
  const s=get.settings();
  if(!D.title.trim()&&!(D.photos||[]).length){const ls=D.notes.split('\n').map(x=>x.trim()).filter(Boolean),bul=ls.every(x=>/^([-•*]|\d+[.)])\s+/.test(x));if(ls.length>=2&&(bul||(ls.length>=3&&ls.every(x=>x.length<=60)))){const made=ls.map(x=>create('idea',{title:x.replace(/^([-•*]|\d+[.)])\s+/,'').slice(0,120),notes:'',photos:[],source:from||null}));toast(`${made.length} ideas saved`,()=>made.forEach(r=>remove(r.id,{silent:true})));return made[0];}}
  tidyIdea(D);
  if(s.captureTo==='today'&&!from){const w=parseWhen(D.title==='Unnamed Idea'?'':D.title);const r=create('task',{title:w.title||D.title,notes:D.notes,photos:D.photos,steps:[],date:w.date||(w.deadline?null:todayK()),time:w.time,repeat:{type:'never',end:null},reminder:w.time!=null?0:null,remUnit:'minute',deadline:w.deadline,priority:'normal',part:null,area:null});if(s.captureToast)toast(w.date&&w.date!==todayK()?`Added to ${relDay(w.date)}`:'Added to Today',()=>remove(r.id),'Undo',{open:dayDest(w.date||todayK())});return r;}
  const r=create('idea',{title:D.title,notes:D.notes,photos:D.photos||[],source:from||null});flyToInbox(D.title==='Unnamed Idea'?((D.notes||'').split('\n')[0]||'Idea'):D.title);if(s.captureToast)toast('Saved to Inbox',()=>remove(r.id),'Undo',{open:dest('inbox')});return r;
}
function captureSheet(rec,{from=null,photo=false,listen=false}={}){
  const isEdit=!!rec;
  const D=isEdit?clone(rec):{title:'',notes:'',photos:[],source:from};D.photos=D.photos||[];D.keep=D.keep||[];
  let inst,ph,T,notesBox,hint,chips,dupe,ex,sess,saved=[],multi=false,showNotes=isEdit&&!!(D.notes||'').trim(),showPh=isEdit&&!!D.photos.length;D.noArea=false;
  const rd=()=>capRead(D.title,D.keep,base,!D.noArea);
  const busy=()=>!!(ph&&ph._busy&&ph._busy());
  const can=()=>!busy()&&!!(D.title.trim()||D.notes.trim()||D.photos.length);
  const base=isEdit&&rec.createdAt?new Date(rec.createdAt):new Date();
  const clean=()=>({title:D.title,notes:D.notes,photos:D.photos,source:D.source});
  const commit=()=>{if(isEdit){tidyIdea(D);delete D.keep;delete D.noArea;Object.assign(rec,D);put(rec);toast('Saved');}else{const x=clean();saveCapture(x,from);writeDraft(null);}};
  const lines=()=>[D.title,...D.notes.split('\n')].map(x=>x.replace(/^([-•*]|\d+[.)])\s+/,'').trim()).filter(Boolean);
  const done=()=>{if(isEdit)remove(rec.id,{silent:true});else writeDraft(null);inst.close();};
  /* one tap: make the thing right away; the toast offers Undo and Edit */
  const quick=g=>{if(busy()){toast('Your photo is still uploading.');return;}const r=rd(),title=r.title||D.title.trim(),notes=D.notes,photos=D.photos;let made=null,edit=null,msg='';
    if(g.kind==='list'){const l=g.list;l.items=l.items||[];const it={id:uid('i'),t:g.item,d:false,photos};l.items.push(it);put(l);markTurn('list');done();toast(`Added to ${l.title}`,()=>{l.items=l.items.filter(x=>x!==it);put(l);},'Undo',{open:dest('list',{id:l.id}),force:true});return;}
    if(g.kind==='task'&&g.rep){const t2=capRead(g.rep.title,[],base).title||g.rep.title;made=newTask(t2,{notes,photos,date:g.rep.date,repeat:g.rep.repeat,area:r.area||null,color:defCol()});edit=()=>taskSheet(made);msg=`Repeating task added · ${g.rep.label}`;}
    else if(g.kind==='task'){let tm=r.time??null,dt=r.date;if(r.remind&&tm==null&&(dt||r.deadline)){tm=540;dt=dt||r.deadline;}made=newTask(title,{notes,photos,date:dt,time:tm,deadline:r.deadline&&!(r.remind&&!r.date)?r.deadline:null,reminder:tm!=null?0:null,remUnit:'minute',priority:r.hi?'high':'normal',area:r.area||null,color:defCol()});edit=()=>taskSheet(made);msg=dt?`Added to ${relDay(dt)}${r.remind&&tm!=null?` · reminder at ${fmtT(tm)}`:''}`:'Task added';}
    else if(g.kind==='habit'&&g.rp){const rp=g.rp,ttl=(rp.title||title).replace(/^./,c=>c.toUpperCase()),kw=(typeof HAB_KW!=='undefined'?HAB_KW:[]).find(([re])=>re.test(ttl));made=create('habit',{title:ttl,notes,target:rp.days?rp.days.length:(rp.target||3),dur:30,days:rp.days||[],howOften:rp.days?'days':'times',tod:rp.tod||'anytime',setTime:null,startDate:todayK(),track:'check',goalN:8,unit:'',area:r.area||null,color:defCol(),icon:kw?kw[1]:null,logs:{},sessions:{},part:null,reminder:null,photos});edit=()=>App.go('habit',{id:made.id});msg=`Habit added · ${g.why}`;}
    else if(g.kind==='block'){const st=r.time!=null?r.time:eventStart(D.title);if(st==null){go('block');return;}made=create('block',{title,notes,date:r.date||todayK(),start:st,dur:r.dur||60,repeat:{type:'never',end:null},reminder:null,remUnit:'minute',part:null,area:r.area||null,color:defCol(),icon:null,photos});edit=()=>blockSheet(made);msg=`Time block added for ${relDay(made.date)}`;}
    else if(g.kind==='allday'&&(r.date||r.deadline)){made=create('allday',{title,notes,start:r.date||r.deadline,end:null,repeat:{type:'never',end:null},reminder:null,remUnit:'minute',area:r.area||null,color:defCol(),icon:null,photos});edit=()=>alldaySheet(made);msg=`Added to ${relDay(made.start)}`;}
    else{go(g.kind);return;}
    markTurn(g.kind);done();App.refresh();toast(msg,()=>{remove(made.id,{hard:true});App.refresh();},'Undo',{edit,force:true});};
  const multiMake=asTasks=>{const ls=lines();const made=ls.map(x=>asTasks?newTask(x.slice(0,120),{date:todayK(),color:defCol()}):create('idea',{title:x.slice(0,120),notes:'',photos:[],source:from||null}));done();App.refresh();toast(asTasks?`${made.length} tasks added for today`:`${made.length} ideas saved`,()=>{made.forEach(r=>remove(r.id,{hard:true}));App.refresh();},'Undo',{force:true});};
  const drawChips=()=>{if(!chips)return;chips.innerHTML='';const r=D.title.trim()?rd():null;const hs=r?r.hits:[];chips.hidden=!hs.length;
    hs.forEach(h=>chips.append(el('span',{class:'capchip'},h.label,el('button',{'aria-label':`Keep “${h.s}” as words`,html:ic('x',IC.xs),onclick:()=>{if(h.guess)D.noArea=true;else D.keep.push(h.s);touched();T.input.focus({preventScroll:true});}}))));};
  const refreshHint=()=>{drawChips();hint.innerHTML='';if(ex)ex.hidden=!!(D.title.trim()||D.notes.trim());
    if(dupe){const dd=D.title.trim()&&!multi?capDupe(rd().title||D.title):null;dupe.innerHTML='';dupe.hidden=!dd||(isEdit&&dd.label==='Already in your Inbox');if(dd)dupe.append(el('span',{class:'grow'},dd.label),Button('Open',{variant:'link',size:'sm',onclick:dd.open}));}
    if(!isEdit&&multi&&lines().length>=2){const n=lines().length;hint.hidden=false;hint.append(el('div',{class:'caphint2'},el('button',{class:'caphint-b',onclick:()=>multiMake(false)},el('span',{class:'k',html:ic('inbox',IC.sm)}),el('span',{class:'grow'},`Save as ${n} ideas`)),Button(`Add ${n} tasks for today`,{variant:'link',size:'sm',onclick:()=>multiMake(true)})));return;}
    const q=!isEdit&&!D.notes.trim()&&!(D.photos||[]).length?quickLog(D.title):null;if(q){hint.hidden=false;hint.append(el('button',{class:'caphint-b ql',onclick:()=>{q.run();done();}},el('span',{class:'k',html:ic('check',IC.sm)}),el('span',{class:'grow'},q.label),el('span',{class:'qlgo'},'Log it')));return;}
    const g=suggestKind(D.title,D.notes,base,D.keep);if(!g){/* v281 · once you type, say what Return does */if(!isEdit&&D.title.trim()){hint.hidden=false;hint.append(el('p',{class:'capret'},'Press Return to save it to Inbox'));}else hint.hidden=true;return;}hint.hidden=false;
    const one=['task','block','allday','list'].includes(g.kind)||(g.kind==='habit'&&!!g.rp);const why=g.kind==='list'?g.item:g.kind==='habit'||g.rep?g.why:(g.why||'').replace(/^.*?(\d+ times a week|Every .*|Weekdays|Weekends|Once a week)$/,'$1');
    hint.append(el('button',{class:'caphint-b',onclick:()=>one?quick(g):go(g.kind)},el('span',{class:'k',html:ic((TURN.find(x=>x[0]===g.kind)||[])[1],IC.sm)}),el('span',{class:'grow'},one?addIt(g):makeIt(g.kind),why&&!(one&&!['list','habit'].includes(g.kind)&&!g.rep)?el('span',{class:'cwhy'},` · ${why}`):null),el('span',{class:'chev',html:ic(one?'check':'chevr',IC.xs)})));};
  const go=kind=>{if(busy()){toast('Your photo is still uploading.');return;}markTurn(kind);const r=capRead(D.title,D.keep,base);const payload={title:D.title.trim(),notes:D.notes,photos:D.photos,createdAt:isEdit?rec.createdAt:Date.now(),keep:D.keep};routeInto(kind,payload,()=>{if(isEdit)remove(rec.id);else writeDraft(null);inst.close();});};
  const drawSess=()=>{if(!sess)return;sess.innerHTML='';sess.hidden=!saved.length;if(saved.length)sess.append(el('span',{},'Saved: '),...saved.slice().reverse().slice(0,6).flatMap((r,i)=>[i?', ':'',el('button',{class:'capsessb',onclick:()=>{const x=get.id(r.id);if(!x){toast('Already sorted');return;}x.kind==='task'?taskSheet(x):captureSheet(x);}},r.title)]));};
  const touched=()=>{writeDraft(isEdit?null:D);inst&&inst.rightBtn&&update_();if(notesBox)notesBox.hidden=!(showNotes||D.notes.trim());if(ph)ph.hidden=!(showPh||D.photos.length);refreshHint();};
  let update_=()=>{};
  const saveNext=()=>{if(!can()){T.input.focus();return;}const sr=saveCapture(clean(),from);writeDraft(null);if(sr&&sr.id)saved.push(sr);drawSess();D.title='';D.notes='';D.photos=[];D.keep=[];multi=false;showNotes=false;showPh=false;T.input.value='';T.input._size();const nt=$('#f-cap-notes');if(nt){nt.value='';nt.style.height='';}ph._redraw();touched();T.input.focus({preventScroll:true});};
  inst=formSheet({title:isEdit?'Idea':'Quick capture',addLabel:isEdit?'Save':get.settings().captureTo==='today'?'Add to Today':'Save to Inbox',D,word:'idea',isEdit,canAdd:can,commit,
    /* closing without Save keeps the text as a draft for next time */
    dirtyClose:isEdit?null:close=>{writeDraft(D);close();},
    build:(body,update)=>{update_=update;
      const draft=!isEdit&&readDraft();if(draft){D.title=draft.title||'';D.notes=draft.notes||'';D.photos=draft.photos||[];if(D.notes)showNotes=true;}
      T=fieldTitle('f-cap-title','',"What's on your mind?",D.title,v=>{D.title=v;D.keep=D.keep.filter(w=>v.includes(w));if(!v.trim())multi=false;touched();},()=>{if(isEdit){if(can()){commit();inst.close();}return;}saveNext();});
      T.wrap.classList.add('capone');
      /* v235 · talk to capture: a mic beside the field (where the device supports speech), and holding + opens this sheet already listening */
      if(voiceOK()||recOK()){const mic=el('button',{class:'capmic',type:'button','aria-label':voiceOK()?'Talk, or hold to record a voice note':'Hold to record a voice note','aria-pressed':'false',html:ic('mic',IC.md),onclick:e=>{e.preventDefault();if(mic._held){mic._held=false;return;}if(voiceOK())voiceToggle(T.input,mic);else toast('Hold the mic to record a voice note');}});micHold(mic,T.wrap,()=>inst);T.wrap.append(mic);T.wrap.classList.add('hasmic');if(listen&&voiceOK())setTimeout(()=>voiceStart(T.input,mic),120);}
      notesBox=fieldNotes('f-cap-notes','Notes','Details or a link',D.notes,v=>{D.notes=v;touched();},{rows:1,min:26});
      ph=photosEditor(D,{compact:true,onChange:touched});hint=el('div',{class:'caphint',hidden:true});chips=el('div',{class:'capchips',hidden:true});
      dupe=el('div',{class:'capdupe',hidden:true});sess=el('div',{class:'capsess',hidden:true});ex=isEdit?null:el('p',{class:'capex'},CAP_EX[Math.floor(Math.random()*CAP_EX.length)]);
      const extras=el('div',{class:'capx'},
        el('button',{class:'capxb',onclick:()=>{showNotes=true;touched();const n=$('#f-cap-notes');if(n)n.focus();}},el('span',{style:'display:grid',html:ic('edit',IC.sm)}),'Note'),
        el('button',{class:'capxb',onclick:()=>{showPh=true;touched();const pi=ph.querySelector('input[type=file]');if(pi)pi.click();}},el('span',{style:'display:grid',html:ic('image',IC.sm)}),'Photo'),
        isEdit?null:el('button',{class:'capxb',onclick:()=>importInvite(()=>inst&&inst.close())},el('span',{style:'display:grid',html:ic('cal',IC.sm)}),'Invite file'));
      const top=topTurns(),row=el('div',{class:'capturn'},top.map(id=>{const t=TURN.find(x=>x[0]===id);return Chip([el('span',{style:'display:grid',html:ic(t[1],IC.sm)}),t[2]],{'data-k':id,onclick:()=>go(id)});}),
        moreTurn(go,()=>({title:D.title.trim(),notes:D.notes,photos:D.photos}),()=>{if(isEdit)remove(rec.id);else writeDraft(null);inst.close();},top));
      const smart=smartButton(D,()=>ph&&ph._files?ph._files():[],made=>{if(isEdit)remove(rec.id,{silent:true});else writeDraft(null);inst.close();App.refresh();toast(`${made.length} added`,()=>{made.forEach(r=>remove(r.id,{silent:true,hard:true}));if(isEdit)put(rec);App.refresh();});});
      /* v291 · editing an idea: where should it go, using the same places as everywhere else */
      let row2=row;if(isEdit&&typeof ideaHome==='function'){const h0=ideaHome(rec),keep=()=>{rec.title=D.title.trim()||rec.title;rec.notes=D.notes;if(D.photos)rec.photos=D.photos;put(rec,{silent:true});},moveTo=h=>{keep();inst.close();if(h.tool)sendHome(rec,h);else go(h.kind);};
        const basics=['task','goal','habit'].filter(id=>!(h0&&!h0.tool&&h0.kind===id));
        row2=el('div',{class:'capturn'},h0?Chip([el('span',{style:'display:grid',html:ic(h0.tool?(h0.icon||'grid'):(TURN.find(x=>x[0]===h0.kind)||[])[1]||'task',IC.sm)}),`${h0.label} · suggested`],{selected:true,onclick:()=>h0.tool?moveTo(h0):go(h0.kind)}):null,...basics.map(id=>{const t=TURN.find(x=>x[0]===id);return Chip([el('span',{style:'display:grid',html:ic(t[1],IC.sm)}),t[2]],{'data-k':id,onclick:()=>go(id)});}),Chip(['All places',el('span',{style:'display:grid',html:ic('chevr',IC.xs)})],{onclick:()=>pickHome(rec,h0,h=>moveTo(h))}));}
      body.append(T.wrap,ex,chips,dupe,hint,sess,extras,notesBox,ph,smart,SectionLabel(isEdit?'Where should it go?':'Or save as'),row2);
      if(!isEdit)body.closest('.sheet').classList.add('pinned');
      kbTurnRow(body.closest('.sheet'),go,top,()=>{const m=body.querySelector('.capmore');if(m)m.click();});
      if(draft&&(draft.title||draft.notes))body.prepend(el('div',{class:'note good',role:'status',html:ic('undo',IC.sm)+'<span>Picked up where you left off.</span>'}));
      if(isEdit){const u=(`${D.title} ${D.notes}`.match(URL_RE)||[])[0];if(u)body.insertBefore(el('a',{class:'btn line block',href:/^www\./i.test(u)?'https://'+u:u,target:'_blank',rel:'noopener'},'Open link'),row.previousSibling);
        body.append(el('button',{class:'delete',onclick:()=>{const c=clone(rec);remove(rec.id);inst.close();toast('Idea deleted',()=>put(c));}},'Delete idea'));}
      else focusTitle(T.input);
      /* paste a screenshot straight in; paste several lines and each can be its own item */
      body.addEventListener('paste',async e=>{const fs=[...(e.clipboardData&&e.clipboardData.files||[])].filter(f=>f.type.startsWith('image/'));if(fs.length){e.preventDefault();showPh=true;ph._add(fs);touched();return;}
        const tx=e.clipboardData&&e.clipboardData.getData('text')||'';if(!isEdit&&e.target===T.input&&/\n/.test(tx.trim())){e.preventDefault();const ls=tx.split(/\r?\n/).map(x=>x.trim()).filter(Boolean);const cur=D.title.trim();D.title=cur?cur+' '+ls[0]:ls[0];D.notes=[D.notes.trim(),...ls.slice(1)].filter(Boolean).join('\n');T.input.value=D.title;T.input._size();const nt=$('#f-cap-notes');if(nt){nt.value=D.notes;nt.dispatchEvent(new Event('input'));}multi=true;showNotes=true;touched();}});
      touched();
      if(photo){showPh=true;touched();const pi=ph.querySelector('input[type=file]');if(pi)pi.click();}
    }});
  return inst;
}
const TURN=[['task','task','Task','One action to finish'],['block','hour','Time block','Set aside the time'],['allday','cal','All-day','A date to remember'],['habit','habit','Habit','Something you repeat'],['goal','target','Goal','An outcome to work toward'],['project','project','Project','A bigger effort with steps'],['list','list','List item','Add to a list'],['resource','books','Resource','Keep it for reference']];
/* A row of types that rides on top of the keyboard. It lives outside the sheet and is placed from the visible
   part of the screen (visualViewport), because on iPhone the keyboard's height can't be read reliably from the page. */
function kbTurnRow(sheet,go,top=null,more=null){
  const ts=top?top.map(id=>TURN.find(x=>x[0]===id)).filter(Boolean):TURN;
  const row=el('div',{class:'kbturn',role:'group','aria-label':'Save as'},ts.map(([id,icon,n])=>el('button',{onpointerdown:e=>e.preventDefault(),onclick:()=>go(id)},el('span',{html:ic(icon,IC.sm)}),n)),more?el('button',{onpointerdown:e=>e.preventDefault(),onclick:more},el('span',{html:ic('plus',IC.sm)}),'More'):null);
  const v=window.visualViewport;if(!v||!isTouch())return;let maxH=Math.max(innerHeight,v.height),lastSig='',movedAt=0;
  row.style.zIndex=String((parseInt(sheet.style.zIndex)||41)+1);$('#layers').append(row);
  const place=()=>{if(!sheet.isConnected||!sheet.classList.contains('on')&&sheet._wasOn){stop();return;}if(sheet.classList.contains('on'))sheet._wasOn=true;
    maxH=Math.max(maxH,innerHeight,v.height);const kb=maxH-v.height>140,f=document.activeElement,typing=f&&sheet.contains(f)&&f.matches('input,textarea');
    const show=kb&&typing,sig=Math.round(v.height)+':'+Math.round(v.offsetTop),now=Date.now();if(sig!==lastSig){lastSig=sig;movedAt=now;}const settled=now-movedAt>140;
    if(!show){row.classList.remove('on');return;}if(!settled){if(!row.classList.contains('on'))setTimeout(place,160);else row.style.top=(v.offsetTop+v.height-row.offsetHeight)+'px';return;}row.style.top=(v.offsetTop+v.height-row.offsetHeight)+'px';row.classList.add('on');};
  const stop=()=>{v.removeEventListener('resize',place);v.removeEventListener('scroll',place);clearInterval(tk);document.removeEventListener('focusin',place);document.removeEventListener('focusout',later);row.remove();};
  const later=()=>setTimeout(place,60);
  v.addEventListener('resize',place);v.addEventListener('scroll',place);document.addEventListener('focusin',place);document.addEventListener('focusout',later);
  const tk=setInterval(place,250);place();
}
function turnGrid(on,{compact=false,suggest=null}={}){return el('div',{class:'saveas'+(compact?' compact':'')},TURN.map(([id,icon,n,s])=>el('button',{class:'tl'+(suggest===id?' sug':''),'data-k':id,html:ic(icon,compact?20:22,1.75)+`<b>${n}</b>`+(compact?'':`<small>${s}</small>`),onclick:()=>on(id)})));}
/* the same idea can land in any life area tool */
function moreTurn(on,getP,done,top=null){return el('button',{class:top?'chip capmore':'linkbtn small',style:top?'':'justify-self:start;min-height:36px',onclick:()=>{const inst=openSheet({title:'Save it somewhere else',build:b=>{b.classList.add('mtsheet');
  const cap=w=>w[0].toUpperCase()+w.slice(1),secs=[];
  const pickTool=(hub,t)=>{markTurn(`${hub}|${t.id}`);inst.close();entrySheet(hub,t,null,{seed:getP(),after:done});};
  const pickBasic=id=>{inst.close();on(id);};
  const chip=(label,icon,fn,words)=>{const c=el('button',{class:'mtchip',onclick:fn},el('span',{style:'display:grid',html:ic(icon||'list',IC.sm)}),label);c._w=(label+' '+(words||'')).toLowerCase();return c;};
  const section=(title,icon,chs)=>{if(!chs.length)return null;const n=Card({cls:'mtcard'},el('div',{class:'mthead'},icon?el('span',{class:'mtic',html:ic(icon,IC.md)}):null,el('b',{},title)),el('div',{class:'mtchips'},chs));n._chips=chs;secs.push(n);return n;};
  const tools={};(get.settings().areas||AREAS).forEach(hub=>{toolsOf(hub).filter(t=>!t.wheel&&t.id!=='checkin'&&toolOn(hub,t.id)).forEach(t=>{tools[`${hub}|${t.id}`]={hub,t};});});
  const label=(hub,t)=>{const all=toolsOf(hub).filter(x=>x.word===t.word).length;return /^(entry|item|note|record|log)$/i.test(t.word)||all>1?t.name:cap(t.word);};
  /* search, then what you used last, then the basic types, then every life area */
  const qf=SearchField({placeholder:'Search types',cls:'mtsearch',onInput:()=>qf.input.dispatchEvent(new Event('qin'))}),q=qf.input;q.addEventListener('qin',()=>{const v=q.value.trim().toLowerCase();secs.forEach(n=>{let any=false;n._chips.forEach(c=>{const on=!v||c._w.includes(v);c.style.display=on?'':'none';if(on)any=true;});n.style.display=!any||(n._recent&&!!v)?'none':'';});});
  b.append(qf);
  const rec=((turnUse().r)||[]).map(id=>{if(tools[id]){const{hub,t}=tools[id];return chip(label(hub,t),t.icon,()=>pickTool(hub,t),hub);}const x=TURN.find(y=>y[0]===id);return x?chip(x[2],x[1],()=>pickBasic(x[0]),x[3]):null;}).filter(Boolean).slice(0,5);
  const rs=section('Recent',null,rec);if(rs){rs._recent=true;b.append(rs);}
  const bs=top&&section('Basics','plus',TURN.filter(x=>!(top||[]).includes(x[0])).map(x=>chip(x[2],x[1],()=>pickBasic(x[0]),x[3])));if(bs)b.append(bs);
  (get.settings().areas||AREAS).slice().sort((x,y)=>x.localeCompare(y)).forEach(hub=>{const ts=Object.values(tools).filter(v=>v.hub===hub);const n=section(hub,areaIcon(hub),ts.map(({t})=>chip(label(hub,t),t.icon,()=>pickTool(hub,t),hub+' '+t.name)));if(n)b.append(n);});}});}},top?'More':'More types');}
function routeInto(kind,p,done){
  const notes=p.notes||'',raw=p.title&&p.title!=='Unnamed Idea'?p.title:'',base=p.createdAt?new Date(p.createdAt):new Date(),photos=p.photos||[];
  const after=()=>done&&done(),W=capRead(raw,p.keep||[],base),t=W.title;
  App._morphNext=true;setTimeout(()=>{App._morphNext=false;},0);
  switch(kind){
    case 'task':taskSheet(null,{title:t,notes,photos,date:W.date,time:W.time,deadline:W.deadline,reminder:W.time!=null?0:null,_after:after});break;
    case 'block':blockSheet(null,Object.assign({title:t,notes,photos,_after:after},W.date?{date:W.date}:{},W.time!=null?{start:W.time}:eventStart(raw)!=null?{start:eventStart(raw)}:{}));break;
    case 'allday':alldaySheet(null,Object.assign({title:t,notes,photos,_after:after},W.date||W.deadline?{start:W.date||W.deadline}:{}));break;
    case 'habit':{const r=parseRepeat(raw);habitSheet(null,Object.assign({title:r?r.title:raw,notes,photos,after},r&&r.days?{days:r.days,howOften:'days',target:r.days.length}:{},r&&r.target?{target:r.target,howOften:'times'}:{},r&&r.tod?{tod:r.tod}:{}));break;}
    case 'goal':goalSheet(null,{seed:Object.assign({title:t,notes,photos},W.deadline||W.date?{deadline:W.deadline||W.date}:{}),after});break;
    case 'project':projectSheet(null,{seed:Object.assign({title:t,notes,photos},W.deadline||W.date?{deadline:W.deadline||W.date}:{}),after});break;
    case 'list':pickListSheet(raw||notes.slice(0,80)||(photos.length?'Photo':''),after,photos);break;
    case 'resource':{const u=(`${raw} ${notes}`.match(URL_RE)||[])[0]||'';const clean=u?raw.replace(u,'').replace(/\s+/g,' ').trim():raw;const host=u&&!clean?u.replace(/^https?:\/\//i,'').replace(/^www\./i,'').split('/')[0]:'';resourceSheet(null,{title:clean||host,notes:u?notes.replace(u,'').trim():notes,photos,url:u&&/^www\./i.test(u)?'https://'+u:u},after);break;}
  }
}

/* v235 · speech to text for Quick capture (Web Speech API; hidden where the device has none) */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
function voiceOK(){return !!SR;}
let VOICE=null;
function voiceStart(inp,btn){if(!SR||VOICE)return;try{const r=new SR();r.lang=navigator.language||'en-US';r.interimResults=true;r.continuous=true;const base=inp.value.trim();
  r.onresult=e=>{let t='';for(let i=0;i<e.results.length;i++)t+=e.results[i][0].transcript;inp.value=(base?base+' ':'')+t.trim();inp.dispatchEvent(new Event('input',{bubbles:true}));};
  r.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed')toast('Allow the microphone for Life OS to talk to capture.');voiceStop();};
  r.onend=()=>{if(VOICE&&VOICE.r===r)voiceStop();};
  r.start();VOICE={r,btn};if(btn){btn.classList.add('on');btn.setAttribute('aria-pressed','true');btn.setAttribute('aria-label','Stop listening');}buzz(6);}catch(e){VOICE=null;toast('Talking isn’t available here.');}}
function voiceStop(){if(!VOICE)return;const{r,btn}=VOICE;VOICE=null;try{r.stop();}catch(e){}if(btn){btn.classList.remove('on');btn.setAttribute('aria-pressed','false');btn.setAttribute('aria-label','Talk');}}
function voiceToggle(inp,btn){VOICE?voiceStop():voiceStart(inp,btn);}

/* v238 · voice notes: hold the mic to record; let go to keep it in Inbox, slide away to cancel */
const recOK=()=>!!(window.MediaRecorder&&navigator.mediaDevices&&navigator.mediaDevices.getUserMedia);
function micHold(mic,host,getInst){if(!recOK())return;let t=null,held=false,sx=0,sy=0,cancel=false,R=null,ui=null,tick=null,t0=0;
  const fmt=s=>`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;
  const show=()=>{ui=el('div',{class:'vrec',role:'status'},el('i',{class:'vdot','aria-hidden':'true'}),el('b',{class:'tnum'},'0:00'),el('span',{},'Let go to keep · slide away to cancel'));host.after(ui);tick=setInterval(()=>{if(ui)ui.querySelector('b').textContent=fmt(Math.floor((Date.now()-t0)/1000));},250);};
  const start=async()=>{held=true;mic._held=true;if(VOICE)voiceStop();try{const stream=await navigator.mediaDevices.getUserMedia({audio:true});if(!held){stream.getTracks().forEach(x=>x.stop());return;}
      const mt=['audio/mp4','audio/webm;codecs=opus','audio/webm'].find(x=>MediaRecorder.isTypeSupported&&MediaRecorder.isTypeSupported(x))||'';const rec=new MediaRecorder(stream,mt?{mimeType:mt}:{}),chunks=[];rec.ondataavailable=e=>{if(e.data&&e.data.size)chunks.push(e.data);};
      R={rec,stream,chunks};t0=Date.now();rec.start(250);buzz(10);mic.classList.add('on','rec');show();}
    catch(e){held=false;toast(e&&e.name==='NotAllowedError'?'Allow the microphone for Life OS to record voice notes.':'Couldn’t start recording on this device');}};
  const stop=()=>{clearInterval(tick);const r=R;R=null;held=false;mic.classList.remove('on','rec');if(ui){ui.remove();ui=null;}if(!r)return;const dur=Math.round((Date.now()-t0)/1000);
    r.rec.onstop=async()=>{r.stream.getTracks().forEach(x=>x.stop());if(cancel){toast('Recording discarded');return;}if(dur<1){toast('Hold a little longer to record');return;}
      const blob=new Blob(r.chunks,{type:r.rec.mimeType||'audio/mp4'});saveVoiceNote(blob,dur).then(ok=>{if(ok){const i=getInst();i&&i.close&&i.close();}});};try{r.rec.stop();}catch(e){}};
  mic.addEventListener('pointerdown',e=>{if(e.button)return;sx=e.clientX;sy=e.clientY;cancel=false;try{mic.setPointerCapture(e.pointerId);}catch(err){}t=setTimeout(start,450);});
  mic.addEventListener('pointermove',e=>{if(!held)return;const far=Math.hypot(e.clientX-sx,e.clientY-sy)>70;if(far!==cancel){cancel=far;if(ui){ui.classList.toggle('cancel',far);ui.querySelector('span').textContent=far?'Let go to cancel':'Let go to keep · slide away to cancel';}}});
  const up=()=>{clearTimeout(t);if(held)stop();};mic.addEventListener('pointerup',up);mic.addEventListener('pointercancel',()=>{cancel=true;up();});}
async function saveVoiceNote(blob,dur){let audio=null;
  try{if(store.assets){const a=await store.assets.upload(blob);audio={id:a.id,url:a.url};}}catch(e){}
  if(!audio){if(blob.size>3e6){toast('That recording is too long to keep on this device');return false;}audio={url:await new Promise(r=>{const f=new FileReader();f.onload=()=>r(f.result);f.readAsDataURL(blob);})};}
  Object.assign(audio,{dur,type:blob.type});const at=new Date();
  const r=create('idea',{title:`Voice note · ${fmtT(at.getHours()*60+at.getMinutes())}`,notes:'',photos:[],audio,source:'voice'});
  toast('Voice note saved to Inbox',()=>remove(r.id,{hard:true}),'Undo',{open:()=>App.go('inbox')});return true;}
/* a small player for a voice note */
function voicePlayer(a){const au=el('audio',{src:a.url,preload:'none'}),b=el('button',{type:'button',class:'vplay','aria-label':'Play voice note',html:ic('play',IC.xs)}),bar=el('i'),len=el('b',{class:'tnum'},`${Math.floor((a.dur||0)/60)}:${String((a.dur||0)%60).padStart(2,'0')}`);
  b.addEventListener('click',e=>{e.stopPropagation();if(au.paused){$$('audio').forEach(x=>{if(x!==au)x.pause();});au.play().catch(()=>toast('Couldn’t play this note'));}else au.pause();});
  au.addEventListener('play',()=>{b.innerHTML=ic('pause',IC.xs);b.setAttribute('aria-label','Pause voice note');});au.addEventListener('pause',()=>{b.innerHTML=ic('play',IC.xs);b.setAttribute('aria-label','Play voice note');});
  au.addEventListener('timeupdate',()=>{const d=au.duration&&isFinite(au.duration)?au.duration:(a.dur||1);bar.style.width=`${Math.min(100,au.currentTime/d*100)}%`;});au.addEventListener('ended',()=>{bar.style.width='0%';});
  return el('span',{class:'vplayer',onclick:e=>e.stopPropagation()},b,el('span',{class:'vtrack'},bar),len,au);}

/* v239 · import an invite (.ics) as a time block or all-day item, ready to edit */
function importInvite(done){const inp=el('input',{type:'file',accept:'.ics,text/calendar',hidden:true});document.body.append(inp);
  inp.addEventListener('change',async()=>{const f=inp.files[0];inp.remove();if(!f)return;let evs=[];try{evs=parseIcs(await f.text());}catch(e){}
    if(!evs.length){toast('That file has no event in it');return;}inviteSheet(evs[0],done);});inp.click();}
function inviteSheet(ev,done){const notes=String(ev.desc||'').trim();done&&done();
  if(ev.allDay){const s=ev.s.slice(0,10),e=ev.e?addK(String(ev.e).slice(0,10),-1):s;alldaySheet(null,{title:ev.sum||'Invite',notes,start:s,end:e>s?e:null});return;}
  const a=new Date(ev.s),b=ev.e?new Date(ev.e):new Date(a.getTime()+36e5),start=a.getHours()*60+a.getMinutes(),dur=Math.max(15,Math.round((b-a)/6e4));
  blockSheet(null,{title:ev.sum||'Invite',notes,date:k(a),start,dur:Math.min(dur,24*60),place:ev.loc||null});
  toast('Invite read. Check it, then Add');}
