/* ---------- Quick capture: reads dates, repeats and links out of what you type ---------- */
const WEEKDAY=['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];
const MONTHS=['jan','feb','mar','apr','may','jun','jul','aug','sep','oct','nov','dec'];
const URL_RE=/\b(?:https?:\/\/|www\.)[^\s<>"']+/i;
function parseWhen(text,base=new Date()){
  const out={title:text||'',date:null,time:null,deadline:null,label:''};if(!text)return out;
  const day0=new Date(base.getFullYear(),base.getMonth(),base.getDate());
  let s=' '+text+' ',dateHit=null,by=false;
  /* links are never mistaken for dates */
  const link=(text.match(URL_RE)||[])[0];if(link)s=s.replace(link,' \u0001 ');
  const take=(re,fn)=>{if(dateHit)return;const m=s.match(re);if(!m)return;const d=fn(m);if(!d)return;by=/^\s*by\b/i.test(m[0]);dateHit=d;s=s.replace(m[0],' ');};
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
  if(m){let h=+m[1]%12;if(m[3].toLowerCase()==='pm')h+=12;if(+m[1]<=12&&(+m[2]||0)<60){out.time=h*60+(+m[2]||0);s=s.replace(m[0],' ');}}
  else if((m=s.match(/\bat\s+(\d{1,2})(?::(\d{2}))?(?![\w:/])/i))&&+m[1]<24&&(+m[2]||0)<60){let h=+m[1];if(h>=1&&h<=6)h+=12;out.time=h*60+(+m[2]||0);s=s.replace(m[0],' ');}
  else if((m=s.match(/\b(?:at\s+)?noon\b/i))){out.time=720;s=s.replace(m[0],' ');}
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
/* A best guess at what an idea is. Returns null when there's no good reason to guess. */
const eventStart=t=>/\bdinner|drinks\b/i.test(t)?19*60:/\b(lunch|brunch)\b/i.test(t)?12*60:null;
function suggestKind(title,notes,base){
  const t=(title||'').trim(),all=t+' '+(notes||'');if(!t&&!(notes||'').trim())return null;
  if(URL_RE.test(all))return{kind:'resource',why:'Link'};
  const rp=parseRepeat(t);if(rp)return{kind:'habit',why:rp.days?(rp.days.length===7?'Every day':rp.days.length===1?`Every ${DOW[(rp.days[0]+1)%7]}`:rp.days.length===5?'Weekdays':'Weekends'):rp.target===1?'Once a week':`${rp.target} times a week`};
  const w=parseWhen(t,base);
  if(/\b(birthday|anniversary|holiday|vacation|day off|time off|graduation)\b/i.test(t)&&(w.date||w.deadline)&&w.time==null)return{kind:'allday',why:w.label};
  if(/\b(meeting|appointment|appt|dinner|lunch|brunch|breakfast|drinks|coffee|workout|class|interview|session|dentist|doctor)\b/i.test(t)&&(w.time!=null||w.date))return{kind:'block',why:w.label};
  if(w.date||w.deadline||w.time!=null)return{kind:'task',why:w.label};
  if(/^(plan|organi[sz]e|renovate|redo|launch|move|build|set up)\b/i.test(t)&&t.split(/\s+/).length>2)return{kind:'project',why:''};
  if(/^(learn|get better at|lose|save \$?\d|run a|read \d+|become|improve)\b/i.test(t))return{kind:'goal',why:''};
  if(/^(call|email|text|book|schedule|pay|buy|order|fix|send|finish|clean|renew|cancel|return|reply|write|pick up|drop off|ask|check|submit|sign|print|mail|wash)\b/i.test(t))return{kind:'task',why:''};
  return null;
}
const kindName=id=>(TURN.find(x=>x[0]===id)||[])[2]||'';
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
  if(s.captureTo==='today'&&!from){const w=parseWhen(D.title==='Unnamed Idea'?'':D.title);const r=create('task',{title:w.title||D.title,notes:D.notes,photos:D.photos,steps:[],date:w.date||(w.deadline?null:todayK()),time:w.time,repeat:{type:'never',end:null},reminder:w.time!=null?0:null,remUnit:'minute',deadline:w.deadline,priority:'normal',part:null,area:null});if(s.captureToast)toast(w.date&&w.date!==todayK()?`Added to ${relDay(w.date)}`:'Added to Today',()=>remove(r.id));return r;}
  const r=create('idea',{title:D.title,notes:D.notes,photos:D.photos||[],source:from||null});flyToInbox(D.title==='Unnamed Idea'?((D.notes||'').split('\n')[0]||'Idea'):D.title);if(s.captureToast)toast('Saved to Inbox',()=>remove(r.id));return r;
}
function captureSheet(rec,{from=null,photo=false}={}){
  const isEdit=!!rec;
  const D=isEdit?clone(rec):{title:'',notes:'',photos:[],source:from};D.photos=D.photos||[];
  let inst,ph,T,notesBox,hint,grid,saved=0;
  const busy=()=>!!(ph&&ph._busy&&ph._busy());
  const can=()=>!busy()&&!!(D.title.trim()||D.notes.trim()||D.photos.length);
  const base=isEdit&&rec.createdAt?new Date(rec.createdAt):new Date();
  const commit=()=>{if(isEdit){tidyIdea(D);Object.assign(rec,D);put(rec);toast('Saved');}else{saveCapture(D,from);writeDraft(null);}};
  const refreshHint=()=>{const q=!isEdit&&!D.notes.trim()&&!(D.photos||[]).length?quickLog(D.title):null;if(q){hint.innerHTML='';hint.hidden=false;hint.append(el('button',{class:'caphint-b ql',onclick:()=>{q.run();writeDraft(null);inst.close();}},el('span',{class:'k',html:ic('check',16,2.2)}),el('span',{class:'grow'},q.label),el('span',{class:'qlgo'},'Log it')));if(grid)$$('.tl',grid).forEach(b=>b.classList.remove('sug'));return;}const g=suggestKind(D.title,D.notes,base);hint.innerHTML='';hint.hidden=!g;if(g)hint.append(el('button',{class:'caphint-b',onclick:()=>go(g.kind)},el('span',{class:'k',html:ic((TURN.find(x=>x[0]===g.kind)||[])[1],16,2)}),el('span',{class:'grow'},`Looks like a ${kindName(g.kind).toLowerCase()}`,g.why?el('b',{},` · ${g.why}`):null),el('span',{class:'chev',html:ic('chevr',14,2.2)})));if(grid)$$('.tl',grid).forEach(b=>b.classList.toggle('sug',!!g&&b.dataset.k===g.kind));};
  const go=kind=>{if(busy()){toast('Your photo is still uploading.');return;}const payload={title:D.title.trim(),notes:D.notes,photos:D.photos,createdAt:isEdit?rec.createdAt:Date.now()};routeInto(kind,payload,()=>{if(isEdit)remove(rec.id);else writeDraft(null);inst.close();});};
  const touched=()=>{writeDraft(isEdit?null:D);inst&&inst.rightBtn&&update_();refreshHint();};
  let update_=()=>{};
  inst=formSheet({title:isEdit?'Edit idea':'Quick capture',addLabel:'Save',D,word:'idea',isEdit,canAdd:can,commit,
    dirtyClose:isEdit?null:close=>{askConfirm({title:'Keep this idea?',body:'You can sort it out later.',yes:'Save to Inbox',danger:false,no:'Keep editing',alt:{label:'Discard',onclick:()=>{writeDraft(null);close();}},onYes:()=>{commit();close();}});},
    build:(body,update)=>{update_=update;
      const draft=!isEdit&&readDraft();if(draft){D.title=draft.title||'';D.notes=draft.notes||'';D.photos=draft.photos||[];}
      T=fieldTitle('f-cap-title','Idea',"What's on your mind?",D.title,v=>{D.title=v;touched();},()=>{if(can()){commit();inst.close();}});
      notesBox=fieldNotes('f-cap-notes','Notes','Details or a link',D.notes,v=>{D.notes=v;touched();},{rows:1,min:26});
      ph=photosEditor(D,{compact:true,onChange:touched});hint=el('div',{class:'caphint',hidden:true});
      const another=isEdit?null:el('button',{class:'btn quiet block keepkb',style:'height:44px',onclick:()=>{if(!can()){T.input.focus();return;}saveCapture(D,from);writeDraft(null);saved++;D.title='';D.notes='';D.photos=[];T.input.value='';T.input._size();const nt=$('#f-cap-notes');nt.value='';nt.style.height='';ph._redraw();touched();inst.titleEl.textContent=`Quick capture · ${saved} saved`;if(typingAtPress||!isTouch())T.input.focus({preventScroll:true});}},'Save and add another');
      grid=turnGrid(go,{compact:true});
      const smart=smartButton(D,()=>ph&&ph._files?ph._files():[],made=>{if(isEdit)remove(rec.id,{silent:true});else writeDraft(null);inst.close();App.refresh();toast(`${made.length} added`,()=>{made.forEach(r=>remove(r.id,{silent:true,hard:true}));if(isEdit)put(rec);App.refresh();});});
      body.append(T.wrap,hint,notesBox,ph,smart,another,el('div',{class:'sect'},isEdit?'Turn into':'Or save as'),grid,moreTurn(go,()=>({title:D.title.trim(),notes:D.notes,photos:D.photos}),()=>{if(isEdit)remove(rec.id);else writeDraft(null);inst.close();}));
      if(draft)body.prepend(el('div',{class:'note good',role:'status',html:ic('undo',16,2)+'<span>Picked up where you left off.</span>'}));
      if(isEdit){const u=(`${D.title} ${D.notes}`.match(URL_RE)||[])[0];if(u)body.insertBefore(el('a',{class:'btn line block',href:/^www\./i.test(u)?'https://'+u:u,target:'_blank',rel:'noopener'},'Open link'),grid.previousSibling);
        body.append(el('button',{class:'delete',onclick:()=>{const c=clone(rec);remove(rec.id);inst.close();toast('Idea deleted',()=>put(c));}},'Delete idea'));}
      else focusTitle(T.input);
      /* paste a screenshot straight in */
      body.addEventListener('paste',async e=>{const fs=[...(e.clipboardData&&e.clipboardData.files||[])].filter(f=>f.type.startsWith('image/'));if(fs.length){e.preventDefault();ph._add(fs);}});
      refreshHint();
      if(photo){const pi=ph.querySelector('input[type=file]');if(pi)pi.click();}
    }});
  return inst;
}
const TURN=[['task','task','Task','One action to finish'],['block','hour','Time block','Set aside the time'],['allday','cal','All-day','A date to remember'],['habit','habit','Habit','Something you repeat'],['goal','target','Goal','An outcome to work toward'],['project','project','Project','A bigger effort with steps'],['list','list','List item','Add to a list'],['resource','books','Resource','Keep it for reference']];
function turnGrid(on,{compact=false,suggest=null}={}){return el('div',{class:'saveas'+(compact?' compact':'')},TURN.map(([id,icon,n,s])=>el('button',{class:'tl'+(suggest===id?' sug':''),'data-k':id,html:ic(icon,compact?20:22,1.75)+`<b>${n}</b>`+(compact?'':`<small>${s}</small>`),onclick:()=>on(id)})));}
/* the same idea can land in any life area tool */
function moreTurn(on,getP,done){return el('button',{class:'linkbtn small',style:'justify-self:start;min-height:36px',onclick:()=>{const inst=openSheet({title:'Save it somewhere else',build:b=>{(get.settings().areas||AREAS).forEach(hub=>{const ts=toolsOf(hub).filter(t=>!t.wheel&&t.id!=='checkin'&&toolOn(hub,t.id));if(!ts.length)return;b.append(el('div',{class:'sect'},hub),el('div',{class:'chips'},ts.map(t=>el('button',{class:'chip',onclick:()=>{inst.close();entrySheet(hub,t,null,{seed:getP(),after:done});}},t.word[0].toUpperCase()+t.word.slice(1)))));});}});}},'More… career win, trip, book and others');}
function routeInto(kind,p,done){
  const notes=p.notes||'',raw=p.title&&p.title!=='Unnamed Idea'?p.title:'',base=p.createdAt?new Date(p.createdAt):new Date(),photos=p.photos||[];
  const after=()=>done&&done(),W=parseWhen(raw,base),t=W.title;
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
