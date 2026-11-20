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
function capRead(text,keep=[],base=new Date()){let s=' '+(text||'')+' ';const hits=[];let hi=false,area=null,dur=null,range=null;
  (keep||[]).forEach((w,i)=>{if(w&&s.includes(w))s=s.replace(w,`\u0002${i}\u0003`);});
  s=s.replace(/(^|\s)!{1,3}(?=\s|$)/,m=>{hi=true;hits.push({k:'hi',s:m.trim(),label:'Important'});return ' ';});
  s=s.replace(/(^|\s)#([A-Za-z][\w-]*)/,(m,sp,tag)=>{const t=tag.toLowerCase().replace(/[-_]/g,''),a=(get.settings().areas||AREAS).find(x=>x.toLowerCase().replace(/\s/g,'').startsWith(t));if(a){area=a;hits.push({k:'area',s:m.trim(),label:a});return ' ';}return m;});
  let m=s.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|–|—|to)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i);
  if(m){const ap2=m[6].toLowerCase(),ap1=(m[3]||'').toLowerCase()||ap2;let h1=+m[1]%12+(ap1==='pm'?12:0),h2=+m[4]%12+(ap2==='pm'?12:0);if(!m[3]&&h1>h2)h1-=12;const a=h1*60+(+m[2]||0),b=h2*60+(+m[5]||0);if(b>a&&a>=0){range={start:a,dur:b-a};hits.push({k:'time',s:m[0].trim(),label:`${fmtT(a)}–${fmtT(b)}`});s=s.replace(m[0],' ');}}
  if((m=s.match(/\bfor\s+(\d+(?:\.\d+)?|an?|one|two|three)\s*(hours?|hrs?|minutes?|mins?)\b/i)||s.match(/\b(\d+(?:\.\d+)?|an?|one|two|three)\s*(hours?|hrs?|minutes?|mins?)\b/i))){const n={a:1,an:1,one:1,two:2,three:3}[m[1].toLowerCase()]||+m[1];dur=Math.round(/^h/i.test(m[2])?n*60:n);if(dur>0&&dur<=720){hits.push({k:'dur',s:m[0].trim(),label:fmtDurS(dur)});s=s.replace(m[0],' ');}else dur=null;}
  const w=parseWhen(s.replace(/\s+/g,' ').trim(),base);
  w.hits.forEach(h=>hits.push(Object.assign(h,{label:h.k==='time'?fmtT(w.time):w.deadline?`Due ${relDay(w.deadline)}`:relDay(w.date)})));
  if(range){w.time=range.start;dur=dur||range.dur;if(!w.date&&!w.deadline){const cur=base.getHours()*60+base.getMinutes();const d0=new Date(base.getFullYear(),base.getMonth(),base.getDate());w.date=k(range.start>cur?d0:addD(d0,1));}}
  const back=x=>String(x||'').replace(/\u0002(\d+)\u0003/g,(z,i)=>keep[+i]).replace(/\s+/g,' ').trim();
  const bits=[];if(w.date)bits.push(relDay(w.date));if(w.time!=null)bits.push(fmtT(w.time));if(w.deadline)bits.push(`Due ${relDay(w.deadline)}`);
  return{title:back(w.title),date:w.date,time:w.time,deadline:w.deadline,dur,hi,area,hits,label:bits.join(', '),raw:back(s)};}
/* "milk to groceries", "batteries on the Packing list" */
function capList(t){const m=(t||'').trim().match(/^(.+?)\s+(?:to|on)\s+(?:the\s+|my\s+)?(.+?)(?:\s+list)?$/i);if(!m)return null;const n=m[2].toLowerCase();const l=get.all('list').find(x=>x.title.toLowerCase()===n||x.title.toLowerCase()===n+' list');return l?{list:l,item:m[1].trim()}:null;}
const CAP_TASK=/^(call|email|e-mail|text|message|pay|buy|book|order|schedule|renew|cancel|send|reply|return|pick up|drop off|submit|sign|mail)\b/i;
/* A best guess at what an idea is. Returns null when there's no good reason to guess. */
const eventStart=t=>/\bdinner|drinks\b/i.test(t)?19*60:/\b(lunch|brunch)\b/i.test(t)?12*60:null;
function suggestKind(title,notes,base,keep=[]){
  const t=(title||'').trim(),all=t+' '+(notes||'');if(!t&&!(notes||'').trim())return null;
  if(URL_RE.test(all))return{kind:'resource',why:'Link'};
  const rp=parseRepeat(t);if(rp)return{kind:'habit',why:rp.days?(rp.days.length===7?'Every day':rp.days.length===1?`Every ${DOW[(rp.days[0]+1)%7]}`:rp.days.length===5?'Weekdays':'Weekends'):rp.target===1?'Once a week':`${rp.target} times a week`};
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
const addIt=g=>g.kind==='list'?`Add to ${g.list.title}`:g.kind==='task'?'Add task':g.kind==='block'?'Add time block':g.kind==='allday'?'Add all-day item':makeIt(g.kind);
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
function captureSheet(rec,{from=null,photo=false}={}){
  const isEdit=!!rec;
  const D=isEdit?clone(rec):{title:'',notes:'',photos:[],source:from};D.photos=D.photos||[];D.keep=D.keep||[];
  let inst,ph,T,notesBox,hint,chips,saved=0,multi=false,showNotes=isEdit,showPh=isEdit;
  const busy=()=>!!(ph&&ph._busy&&ph._busy());
  const can=()=>!busy()&&!!(D.title.trim()||D.notes.trim()||D.photos.length);
  const base=isEdit&&rec.createdAt?new Date(rec.createdAt):new Date();
  const clean=()=>({title:D.title,notes:D.notes,photos:D.photos,source:D.source});
  const commit=()=>{if(isEdit){tidyIdea(D);delete D.keep;Object.assign(rec,D);put(rec);toast('Saved');}else{const x=clean();saveCapture(x,from);writeDraft(null);}};
  const lines=()=>[D.title,...D.notes.split('\n')].map(x=>x.replace(/^([-•*]|\d+[.)])\s+/,'').trim()).filter(Boolean);
  const done=()=>{writeDraft(null);inst.close();};
  /* one tap: make the thing right away; the toast offers Undo and Edit */
  const quick=g=>{if(busy()){toast('Your photo is still uploading.');return;}const r=capRead(D.title,D.keep,base),title=r.title||D.title.trim(),notes=D.notes,photos=D.photos;let made=null,edit=null,msg='';
    if(g.kind==='list'){const l=g.list;l.items=l.items||[];const it={id:uid('i'),t:g.item,d:false,photos};l.items.push(it);put(l);markTurn('list');done();toast(`Added to ${l.title}`,()=>{l.items=l.items.filter(x=>x!==it);put(l);},'Undo',{open:dest('list',{id:l.id}),force:true});return;}
    if(g.kind==='task'){made=newTask(title,{notes,photos,date:r.date,time:r.time??null,deadline:r.deadline||null,reminder:r.time!=null?0:null,remUnit:'minute',priority:r.hi?'high':'normal',area:r.area||null,color:defCol()});edit=()=>taskSheet(made);msg=r.date?`Added to ${relDay(r.date)}`:'Task added';}
    else if(g.kind==='block'){const st=r.time!=null?r.time:eventStart(D.title);if(st==null){go('block');return;}made=create('block',{title,notes,date:r.date||todayK(),start:st,dur:r.dur||60,repeat:{type:'never',end:null},reminder:null,remUnit:'minute',part:null,area:r.area||null,color:defCol(),icon:null,photos});edit=()=>blockSheet(made);msg=`Time block added for ${relDay(made.date)}`;}
    else if(g.kind==='allday'&&(r.date||r.deadline)){made=create('allday',{title,notes,start:r.date||r.deadline,end:null,repeat:{type:'never',end:null},reminder:null,remUnit:'minute',area:r.area||null,color:defCol(),icon:null,photos});edit=()=>alldaySheet(made);msg=`Added to ${relDay(made.start)}`;}
    else{go(g.kind);return;}
    markTurn(g.kind);done();App.refresh();toast(msg,()=>{remove(made.id,{hard:true});App.refresh();},'Undo',{edit,force:true});};
  const multiMake=asTasks=>{const ls=lines();const made=ls.map(x=>asTasks?newTask(x.slice(0,120),{date:todayK(),color:defCol()}):create('idea',{title:x.slice(0,120),notes:'',photos:[],source:from||null}));done();App.refresh();toast(asTasks?`${made.length} tasks added for today`:`${made.length} ideas saved`,()=>{made.forEach(r=>remove(r.id,{hard:true}));App.refresh();},'Undo',{force:true});};
  const drawChips=()=>{if(!chips)return;chips.innerHTML='';const r=D.title.trim()?capRead(D.title,D.keep,base):null;const hs=r?r.hits:[];chips.hidden=!hs.length||isEdit;
    hs.forEach(h=>chips.append(el('span',{class:'capchip'},h.label,el('button',{'aria-label':`Keep “${h.s}” as words`,html:ic('x',12,2.4),onclick:()=>{D.keep.push(h.s);touched();T.input.focus({preventScroll:true});}}))));};
  const refreshHint=()=>{drawChips();hint.innerHTML='';
    if(!isEdit&&multi&&lines().length>=2){const n=lines().length;hint.hidden=false;hint.append(el('div',{class:'caphint2'},el('button',{class:'caphint-b',onclick:()=>multiMake(false)},el('span',{class:'k',html:ic('inbox',16,2)}),el('span',{class:'grow'},`Save as ${n} ideas`)),el('button',{class:'linkbtn small',onclick:()=>multiMake(true)},`Add ${n} tasks for today`)));return;}
    const q=!isEdit&&!D.notes.trim()&&!(D.photos||[]).length?quickLog(D.title):null;if(q){hint.hidden=false;hint.append(el('button',{class:'caphint-b ql',onclick:()=>{q.run();done();}},el('span',{class:'k',html:ic('check',16,2.2)}),el('span',{class:'grow'},q.label),el('span',{class:'qlgo'},'Log it')));return;}
    const g=suggestKind(D.title,D.notes,base,D.keep);hint.hidden=!g;if(!g)return;
    const one=!isEdit&&['task','block','allday','list'].includes(g.kind);const why=g.kind==='list'?g.item:(g.why||'').replace(/^.*?(\d+ times a week|Every .*|Weekdays|Weekends|Once a week)$/,'$1');
    hint.append(el('button',{class:'caphint-b',onclick:()=>one?quick(g):go(g.kind)},el('span',{class:'k',html:ic((TURN.find(x=>x[0]===g.kind)||[])[1],16,2)}),el('span',{class:'grow'},one?addIt(g):makeIt(g.kind),why&&!(one&&g.kind!=='list')?el('span',{class:'cwhy'},` · ${why}`):null),el('span',{class:'chev',html:ic(one?'check':'chevr',14,2.4)})));};
  const go=kind=>{if(busy()){toast('Your photo is still uploading.');return;}markTurn(kind);const r=capRead(D.title,D.keep,base);const payload={title:D.title.trim(),notes:D.notes,photos:D.photos,createdAt:isEdit?rec.createdAt:Date.now(),keep:D.keep};routeInto(kind,payload,()=>{if(isEdit)remove(rec.id);else writeDraft(null);inst.close();});};
  const touched=()=>{writeDraft(isEdit?null:D);inst&&inst.rightBtn&&update_();if(notesBox)notesBox.hidden=!(showNotes||D.notes.trim());if(ph)ph.hidden=!(showPh||D.photos.length);refreshHint();};
  let update_=()=>{};
  const saveNext=()=>{if(!can()){T.input.focus();return;}saveCapture(clean(),from);writeDraft(null);saved++;D.title='';D.notes='';D.photos=[];D.keep=[];multi=false;showNotes=false;showPh=false;T.input.value='';T.input._size();const nt=$('#f-cap-notes');if(nt){nt.value='';nt.style.height='';}ph._redraw();touched();inst.titleEl.textContent=`Quick capture · ${saved} saved`;T.input.focus({preventScroll:true});};
  inst=formSheet({title:isEdit?'Edit idea':'Quick capture',addLabel:'Save',D,word:'idea',isEdit,canAdd:can,commit,
    /* closing without Save keeps the text as a draft for next time */
    dirtyClose:isEdit?null:close=>{writeDraft(D);close();},
    build:(body,update)=>{update_=update;
      const draft=!isEdit&&readDraft();if(draft){D.title=draft.title||'';D.notes=draft.notes||'';D.photos=draft.photos||[];if(D.notes)showNotes=true;}
      T=fieldTitle('f-cap-title',isEdit?'Idea':'',"What's on your mind?",D.title,v=>{D.title=v;D.keep=D.keep.filter(w=>v.includes(w));if(!v.trim())multi=false;touched();},()=>{if(isEdit){if(can()){commit();inst.close();}return;}saveNext();});
      if(!isEdit)T.wrap.classList.add('capone');
      notesBox=fieldNotes('f-cap-notes','Notes','Details or a link',D.notes,v=>{D.notes=v;touched();},{rows:1,min:26});
      ph=photosEditor(D,{compact:true,onChange:touched});hint=el('div',{class:'caphint',hidden:true});chips=el('div',{class:'capchips',hidden:true});
      const extras=isEdit?null:el('div',{class:'capx'},
        el('button',{class:'capxb',onclick:()=>{showNotes=true;touched();const n=$('#f-cap-notes');if(n)n.focus();}},el('span',{style:'display:grid',html:ic('edit',15,2)}),'Note'),
        el('button',{class:'capxb',onclick:()=>{showPh=true;touched();const pi=ph.querySelector('input[type=file]');if(pi)pi.click();}},el('span',{style:'display:grid',html:ic('image',15,2)}),'Photo'));
      const top=topTurns(),row=el('div',{class:'capturn'},top.map(id=>{const t=TURN.find(x=>x[0]===id);return el('button',{class:'chip','data-k':id,onclick:()=>go(id)},el('span',{style:'display:grid',html:ic(t[1],15,2)}),t[2]);}),
        moreTurn(go,()=>({title:D.title.trim(),notes:D.notes,photos:D.photos}),()=>{if(isEdit)remove(rec.id);else writeDraft(null);inst.close();},top));
      const smart=smartButton(D,()=>ph&&ph._files?ph._files():[],made=>{if(isEdit)remove(rec.id,{silent:true});else writeDraft(null);inst.close();App.refresh();toast(`${made.length} added`,()=>{made.forEach(r=>remove(r.id,{silent:true,hard:true}));if(isEdit)put(rec);App.refresh();});});
      body.append(T.wrap,chips,hint,extras,notesBox,ph,smart,el('div',{class:'sect'},isEdit?'Or turn into':'Or save as'),row);
      if(!isEdit)body.closest('.sheet').classList.add('pinned');
      kbTurnRow(body.closest('.sheet'),go);
      if(draft&&(draft.title||draft.notes))body.prepend(el('div',{class:'note good',role:'status',html:ic('undo',16,2)+'<span>Picked up where you left off.</span>'}));
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
function kbTurnRow(sheet,go){
  const row=el('div',{class:'kbturn',role:'group','aria-label':'Save as'},TURN.map(([id,icon,n])=>el('button',{onpointerdown:e=>e.preventDefault(),onclick:()=>go(id)},el('span',{html:ic(icon,16,2)}),n)));
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
  const chip=(label,icon,fn,words)=>{const c=el('button',{class:'mtchip',onclick:fn},el('span',{style:'display:grid',html:ic(icon||'list',15,1.9)}),label);c._w=(label+' '+(words||'')).toLowerCase();return c;};
  const section=(title,icon,chs)=>{if(!chs.length)return null;const n=el('section',{class:'card mtcard'},el('div',{class:'mthead'},icon?el('span',{class:'mtic',html:ic(icon,17,1.9)}):null,el('b',{},title)),el('div',{class:'mtchips'},chs));n._chips=chs;secs.push(n);return n;};
  const tools={};(get.settings().areas||AREAS).forEach(hub=>{toolsOf(hub).filter(t=>!t.wheel&&t.id!=='checkin'&&toolOn(hub,t.id)).forEach(t=>{tools[`${hub}|${t.id}`]={hub,t};});});
  const label=(hub,t)=>{const all=toolsOf(hub).filter(x=>x.word===t.word).length;return /^(entry|item|note|record|log)$/i.test(t.word)||all>1?t.name:cap(t.word);};
  /* search, then what you used last, then the basic types, then every life area */
  const q=el('input',{class:'mtsearch',type:'search',placeholder:'Search types',autocomplete:'off','aria-label':'Search types',oninput:()=>{const v=q.value.trim().toLowerCase();secs.forEach(n=>{let any=false;n._chips.forEach(c=>{const on=!v||c._w.includes(v);c.style.display=on?'':'none';if(on)any=true;});n.style.display=!any||(n._recent&&!!v)?'none':'';});}});
  b.append(q);
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
