/* ---------- Organize: Inbox, Tasks, Habits, Routines, Projects, Goals, Lists ---------- */
/* Shared page parts */
function backInfo(){const st=App.state.stack||[],p=st[st.length-1];if(!p||p.view==='more')return['More','more'];if(p.view==='organize')return['Organize','organize'];const pl=PLACES[p.view];return[pl?pl.n:'Back','more'];}
function orgHead(title,sub,{type,menu,menuLabel}={}){
  const[b,to]=backInfo();
  return el('header',{},el('div',{class:'pghead'},backBtn(b,to),el('div',{style:'display:flex;align-items:center'},
    el('button',{class:'iconbtn green','aria-label':`Search ${title.toLowerCase()}`,html:ic('search',21,1.9),onclick:e=>{searchFrom(e.currentTarget);App.state.q='';App.state.qType=type||'All';App.go('search');}}),
    menu?moreB(menuLabel||`${title} options`,e=>{const r=e.currentTarget.getBoundingClientRect();openMenu(r.right,r.bottom+4,menu());}):null)),
    withIc((Object.values(PLACES).find(p=>p.n===title)||{}).i,el('div',{class:'otitle'},el('h1',{class:'pgtitle'},title),sub?el('span',{class:'osub'},sub):null)));
}
const addBar=(label,aria,fn)=>el('button',{class:'oadd','aria-label':aria,onclick:fn},el('span',{style:'display:grid',html:ic('plus',20,2)}),label);
const areasIn=list=>[...new Set(list.map(r=>r.area).filter(Boolean))].sort();
function viewsRow(items,val,on,key,pool){
  const S=App.state,cur=S['af'+key],areas=areasIn(pool);
  const f=(areas.length||cur)?el('button',{class:'ofilter'+(cur?' on':''),'aria-label':cur?`Showing ${cur}. Change life area`:'Filter by life area',html:ic('filter',18,2),onclick:()=>{const inst=openSheet({title:'Life area',build:b=>{const pick=a=>{S['af'+key]=a;inst.close();App.refresh();};b.append(el('div',{class:'list'},[[null,'All areas'],...areas.map(a=>[a,a])].map(([v,n])=>el('button',{class:'li',style:'min-height:52px','aria-pressed':String((cur||null)===v),onclick:()=>pick(v)},el('span',{class:'grow'},n),(cur||null)===v?el('span',{style:'display:grid;color:var(--accent-text)',html:ic('check',18,2.4)}):null))));}});}}):null;
  return el('div',{class:'oviews'},chipsH(items,val,on),f);
}
function areaOnly(list,key){const S=App.state,cur=S['af'+key];if(cur&&!areasIn(list).includes(cur)){S['af'+key]=null;return list;}return cur?list.filter(r=>r.area===cur):list;}
const areaNote=key=>{const S=App.state,cur=S['af'+key];return cur?el('div',{class:'ofnote'},el('span',{},`Showing ${cur}`),el('button',{class:'linkbtn small',onclick:()=>{S['af'+key]=null;App.refresh();}},'Show all')):null;};
function byArea(list){const m=new Map();list.forEach(r=>{const a=r.area||'No area';if(!m.has(a))m.set(a,[]);m.get(a).push(r);});return[...m.entries()].sort((a,b)=>a[0]==='No area'?1:b[0]==='No area'?-1:a[0].localeCompare(b[0]));}
const withPress=(node,fn)=>{onPress(node,fn,'.tick-hit');node.addEventListener('click',e=>{if(Date.now()-(node._pressed||0)<700){e.stopPropagation();e.preventDefault();}},true);return node;};
const emptyOf=(t,s)=>el('div',{class:'list'},emptyState(t,s));
const dayCount=dk=>daysBetween(todayK(),dk);
const span=ms=>{const d=Math.max(1,Math.round(ms/864e5));return d<14?`${d} day${d>1?'s':''}`:d<60?`${Math.round(d/7)} weeks`:d<700?`${Math.round(d/30)} months`:`${Math.round(d/365)} years`;};
const flameI=()=>el('span',{class:'oflame',html:ic('flame',13,2)});

/* ---------- Inbox ---------- */
/* Swipe a row: right for the main action, left to delete. The action label grows once you've pulled
   far enough; past three quarters the row resists; let go early and it springs back. */
function swipeAct(node,{left,right}){
  const lab=(o,side)=>o?el('span',{class:'swr-a '+side,style:`background:${o.color}`},el('b',{},o.label)):null;
  const wrap=el('div',{class:'swr'},el('div',{class:'swr-bg'},lab(right,'r'),lab(left,'l')),node);let x0,y0,dx=0,on=false,lock=null;
  const W=()=>wrap.offsetWidth||360,arm=()=>Math.max(90,W()*.35);
  node.addEventListener('touchstart',e=>{x0=e.touches[0].clientX;y0=e.touches[0].clientY;dx=0;on=true;lock=null;node.style.transition='none';},{passive:true});
  node.addEventListener('touchmove',e=>{if(!on)return;const mx=e.touches[0].clientX-x0,my=e.touches[0].clientY-y0;if(lock===null&&Math.hypot(mx,my)>8)lock=Math.abs(mx)>Math.abs(my)*1.3?'x':'y';if(lock!=='x')return;
    let d=mx;if((d<0&&!left)||(d>0&&!right))d*=.15;const lim=W()*.75;if(Math.abs(d)>lim)d=Math.sign(d)*(lim+(Math.abs(d)-lim)*.3);dx=d;
    node.style.transform=`translateX(${d}px)`;wrap.dataset.dir=d<0?'l':'r';const was=wrap.classList.contains('armed'),now=Math.abs(d)>arm()&&((d<0&&left)||(d>0&&right));wrap.classList.toggle('armed',now);if(now&&!was)buzz&&buzz(6);},{passive:true});
  node.addEventListener('touchend',()=>{if(!on)return;on=false;const go=wrap.classList.contains('armed');wrap.classList.remove('armed');
    if(go&&dx<0&&left){node.style.transition='transform .22s cubic-bezier(.4,0,1,1)';node.style.transform='translateX(-105%)';markGs('swipe');setTimeout(left.run,200);}
    else if(go&&dx>0&&right){markGs('swipe');node.style.transition='transform .5s var(--soft,cubic-bezier(.3,1.15,.5,1))';node.style.transform='';setTimeout(right.run,90);}
    else{node.style.transition='transform .45s var(--soft,cubic-bezier(.3,1.15,.5,1))';node.style.transform='';}
    if(Math.abs(dx)>8)node._pressed=Date.now();dx=0;});
  return wrap;}
function ideaLabel(i){const t=(i.title||'').trim();
  if(!t||t==='Unnamed Idea')return (i.photos||[]).length?`Photo from ${shortDay(k(new Date(i.createdAt||Date.now())))}`:'Untitled idea';
  const m=t.match(/^(?:https?:\/\/)?(?:www\.)?([^\/\s?#]+)([^\s]*)$/i);if(!m||!/\.[a-z]{2,}$/i.test(m[1])||!/^https?:|^www\./i.test(t))return t;
  const segs=m[2].split(/[?#]/)[0].split('/').filter(x=>x&&!/^\d+$/.test(x)),last=(segs.pop()||'').replace(/\.(html?|php|aspx?)$/i,'').replace(/[-_+]+/g,' ').trim();
  return last&&/[a-z]/i.test(last)?`${last.charAt(0).toUpperCase()+last.slice(1)} · ${m[1]}`:m[1];}
function viewInbox(root){
  const S=App.state;S.inboxTab=S.inboxTab||'All';S.inboxSort=S.inboxSort||'old';
  const all=get.all('idea'),sorted=all.slice().sort((a,b)=>S.inboxSort==='old'?a.createdAt-b.createdAt:b.createdAt-a.createdAt),withPh=all.filter(i=>(i.photos||[]).length);
  if(S.inboxTab==='Photos'&&!withPh.length)S.inboxTab='All';
  const shown=sorted.filter(i=>S.inboxTab==='All'||(i.photos||[]).length),page=el('div',{class:'page'});
  page.append(orgHead('Inbox',all.length?`${all.length} to organize`:'',{type:'Ideas',menu:()=>[all.length>1?{label:'Select ideas',icon:'check',onclick:()=>{S.ideaSel=new Set();App.refresh();}}:null,{label:S.inboxSort==='old'?'Show newest first':'Show oldest first',icon:'rep',onclick:()=>{S.inboxSort=S.inboxSort==='old'?'new':'old';App.refresh();}},(()=>{const old=all.filter(i=>Date.now()-(i.createdAt||0)>60*864e5);return old.length?{label:`Clear ${old.length} older than 60 days`,icon:'trash',danger:true,onclick:()=>askConfirm({title:`Clear ${old.length} old idea${old.length>1?'s':''}?`,body:'They stay in Recently deleted for 30 days.',yes:'Clear',no:'Keep them',onYes:()=>{const cs=old.map(clone);old.forEach(i=>remove(i.id,{silent:true}));App.refresh();toast(`${old.length} cleared`,()=>{cs.forEach(c=>put(c,{silent:true}));App.refresh();});}})}:null;})()]}));
  page.append(el('div',{class:'ocap'},el('button',{class:'ocapt',onclick:()=>captureSheet(null)},"What's on your mind?"),el('button',{class:'ocapp','aria-label':'Capture a photo',html:ic('image',20),onclick:()=>captureSheet(null,{photo:true})})));
  const wasN=S._inboxN||0;S._inboxN=all.length;
  if(!all.length){const fresh=wasN>0&&motionOK();page.append(el('div',{class:'ozero'+(fresh?' fresh':'')},el('span',{class:'ozi',html:fresh?'<svg viewBox="0 0 80 80" width="64" height="64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle class="zc" cx="40" cy="40" r="34"/><path class="zk" d="M26 41l9 9 19-21"/></svg>':ic('inbox',40,1.5)}),el('h2',{},'Inbox zero'),el('p',{},'Everything has a home. New ideas, photos and links land here.')));root.append(page);return;}
  {const old=sorted.slice().sort((a,b)=>a.createdAt-b.createdAt).filter(i=>Date.now()-(i.createdAt||0)>30*864e5&&(i.staleUntil||0)<Date.now()),i=old[0];
    if(i){const age=Math.floor((Date.now()-i.createdAt)/864e5),later=d=>{i.staleUntil=Date.now()+d*864e5;put(i);};page.append(el('section',{class:'card',style:'padding:16px'},el('div',{class:'lbl olate'},`Sitting for ${age} days`),el('div',{class:'oserif',style:'font-size:24px;line-height:29px;margin-top:6px'},`Still want “${ideaLabel(i)}”?`),el('div',{class:'ochk',style:'margin-top:12px'},btnL('Let it go',()=>{const c=clone(i);remove(i.id);toast('Let go',()=>put(c));}),btnL('Next month',()=>later(30)),btnP('Keep it',()=>later(90))),old.length>1?el('div',{class:'small muted',style:'margin-top:10px'},`1 of ${old.length} older ideas`):null));}}
  if(all.length>1){const m=Math.max(1,Math.ceil(all.length*.4));page.append(el('button',{class:'otidy',onclick:()=>tidySheet(sorted)},el('span',{class:'oric',html:ic('spark',20)}),el('span',{class:'grow'},el('b',{},`Tidy up in about ${m} minute${m>1?'s':''}`),el('small',{},`Swipe through ${all.length} ideas, ${S.inboxSort==='old'?'oldest':'newest'} first`)),el('span',{class:'chev',html:ic('chevr',16,2)})));}
  if(withPh.length)page.append(chipsH([['All','All',S.inboxTab==='All'?all.length:0],['Photos','Photos',S.inboxTab==='Photos'?withPh.length:0]],S.inboxTab,v=>{S.inboxTab=v;App.refresh();}));
  if(S.ideaSel){const ids=[...S.ideaSel].map(get.id).filter(Boolean),n=ids.length;
    page.append(el('div',{class:'selbar'},el('div',{class:'bl'},el('b',{},n?`${n} selected`:'Select ideas'),el('span',{style:'display:flex;gap:4px'},el('button',{class:'linkbtn',onclick:()=>{S.ideaSel=new Set(shown.map(i=>i.id));App.refresh();}},'All'),el('button',{class:'linkbtn',onclick:()=>{S.ideaSel=null;App.refresh();}},'Cancel'))),
      el('div',{class:'chips'},el('button',{class:'chip',onclick:()=>{if(!n){toast('Tap ideas to select them');return;}const made=ids.map(i=>{const t=newTask(i.title&&i.title!=='Unnamed Idea'?i.title:(i.notes||'Idea').split('\n')[0].slice(0,80),{});t.notes=i.title?i.notes||'':'';t.photos=i.photos||[];put(t,{silent:true});return t;}),cs=ids.map(clone);ids.forEach(i=>remove(i.id,{silent:true}));S.ideaSel=null;App.refresh();toast(`${n} turned into task${n>1?'s':''}`,()=>{made.forEach(t=>remove(t.id,{hard:true,silent:true}));cs.forEach(c=>put(c,{silent:true}));App.refresh();});}},'Make tasks'),
        el('button',{class:'chip line',style:'color:var(--danger,#A4503A)',onclick:()=>{if(!n){toast('Tap ideas to select them');return;}const cs=ids.map(clone);ids.forEach(i=>remove(i.id,{silent:true}));S.ideaSel=null;App.refresh();toast(`${n} deleted`,()=>{cs.forEach(c=>put(c,{silent:true}));App.refresh();});}},'Delete'))));
    page.append(el('div',{class:'list'},shown.map(i=>{const on=S.ideaSel.has(i.id);return el('button',{class:'li tsel'+(on?' on':''),'aria-pressed':String(on),style:'width:100%;text-align:left;min-height:56px',onclick:()=>{on?S.ideaSel.delete(i.id):S.ideaSel.add(i.id);App.refresh();}},el('span',{class:'selbox',html:on?ic('check',13,3):''}),el('span',{class:'grow'},el('span',{class:'tt'},i.title||(i.notes||'').split('\n')[0]),el('small',{},timeAgo(i.createdAt))));})));root.append(page);return;}
  setTimeout(swipeHint,500);
  page.append(el('div',{class:'list'},shown.map(i=>{
    const ph=(i.photos||[]).length,link=URL_RE.test(`${i.title} ${i.notes}`),meta=[];
    if(ph)meta.push(el('span',{class:'omi',html:ic('image',13,2)+`${ph}`}));
    if(link)meta.push(el('span',{class:'omi',html:ic('share',13,2)+'Link'}));
    if(i.source)meta.push(`From ${i.source}`);const nl=(i.notes||'').trim().split('\n')[0];if(nl&&!URL_RE.test(nl))meta.push(nl.length>36?nl.slice(0,34).trim()+'…':nl);meta.push(timeAgo(i.createdAt));
    const g=suggestKind(i.title==='Unnamed Idea'?'':i.title,i.notes,new Date(i.createdAt));
    const sw=swipeAct(withPress(el('div',{class:'li',style:'min-height:64px'},
      el('button',{class:'grow',style:'display:flex;align-items:center;gap:12px;text-align:left;min-width:0',onclick:()=>captureSheet(i)},ph?el('span',{class:'photo thumb',style:`background-image:url("${i.photos[0].url}")`,'aria-hidden':'true'}):null,el('span',{style:'min-width:0;display:block'},el('b',{},ideaLabel(i)),el('small',{class:'ometa'},joinMeta(meta)))),
),(x,y)=>openMenu(x,y,[{label:'Edit',icon:'edit',onclick:()=>captureSheet(i)},{label:'Turn into…',icon:'arrow',onclick:()=>tidySheet([i])},{label:'Delete',icon:'trash',danger:true,onclick:()=>{const c=clone(i);remove(i.id);toast('Idea deleted',()=>put(c));}}])),{left:{label:'Delete',color:'var(--danger)',run:()=>{const c=clone(i);remove(i.id);toast('Idea deleted',()=>put(c));}},right:{label:'Task',color:'var(--accent)',run:()=>routeInto('task',{title:i.title==='Unnamed Idea'?'':i.title,notes:i.notes,photos:i.photos,createdAt:i.createdAt},()=>ideaBecame(i.id,'Task'))}});sw.dataset.k='idea:'+i.id;return sw;
  })));
  root.append(page);
}
/* text and small nodes joined with a middle dot */
function joinMeta(parts){const out=[];parts.filter(Boolean).forEach((p,i)=>{if(i)out.push(' · ');out.push(p);});return out;}

/* ---------- Tasks ---------- */
function taskRow(t,dk,{late=false,date=false,doneOn=null,grouped=false}={}){
  const done=isDone(t,dk),steps=(t.steps||[]).filter(s=>s.t),sd=steps.filter(s=>stepDone(t,s,dk)).length,proj=t.part&&get.id(t.part);
  const meta=[];
  if(late){const n=daysBetween(t.date,todayK());meta.push(el('span',{class:'olate'},n<=1?'From yesterday':`${n} days late`));}
  if(doneOn)meta.push(`Done ${relDay(doneOn).replace(/^[A-Z](?=oday|omorrow|esterday)/,c=>c.toLowerCase())}`);
  if(date&&!late&&!doneOn)meta.push(t.date?relDay(dk):'No date');
  if(t.time!=null&&!doneOn)meta.push(el('span',{class:'otime'},fmtT(t.time)));
  if(t.dur&&!doneOn)meta.push(fmtDur(t.dur));
  if(t.repeat&&t.repeat.type!=='never')meta.push(repeatLabel(t.repeat));
  if(t.deadline&&!doneOn){const dl=`Due ${relDay(t.deadline).replace(/^(Today|Tomorrow|Yesterday)$/,x=>x.toLowerCase())}`;meta.push(t.deadline<=todayK()&&!done?el('span',{class:'olate'},dl):dl);}
  if(!done&&!doneOn){const dm=depMeta(t);if(dm)meta.push(dm);}
  if(proj)meta.push(proj.title);else if(t.area&&!grouped)meta.push(t.area);
  if(!doneOn)tagMeta(t).forEach(x=>meta.push(x));
  if((t.photos||[]).length)meta.push(`${t.photos.length} photo${t.photos.length>1?'s':''}`);
  if(steps.length)meta.push(`${sd} of ${steps.length} steps`);
  const hold=(x,y)=>itemMenu({kind:'task',id:t.id,rec:t,title:t.title,time:t.time,dur:t.dur||30,area:t.area,done},t.date&&!(t.repeat&&t.repeat.type!=='never')?t.date:dk,x,y);
  const r=el('div',{class:'li tick-host'+(done?' done':''),'data-k':'t:'+t.id+(doneOn?':d':''),style:'min-height:60px'},
    el('span',{class:'tick-hit'},tickBtn(done,on=>{r.classList.toggle('done',on);if(!on)hideToast();setTaskDone(t,dk,on);setTimeout(()=>App.refresh(),820);}),steps.length&&!done?stepRing(t.id,sd,steps.length):null),
    el('button',{class:'grow',style:'text-align:left',onclick:()=>openRec(t)},el('span',{class:'tt',style:'font-weight:500'},t.priority==='high'&&!done?el('span',{class:'oflag','aria-label':'High priority',html:ic('flag',13,2.4)}):null,t.title),meta.length?el('small',{class:'ometa'},joinMeta(meta)):null),!t.date&&t.deadline&&!done&&!doneOn?el('button',{class:'oturn','aria-label':`Do ${t.title} today`,onclick:()=>{t.date=todayK();put(t);toast('Added to today',()=>{t.date=null;put(t);});}},'Today'):null);
  if(doneOn)return withPress(r,hold);
  return swipeAct(withPress(r,hold),{right:done?null:{label:'Done',color:'var(--accent)',run:()=>{setTaskDone(t,dk,true);App.refresh();}},left:done||!t.date?null:{label:'Tomorrow',color:'#9A7B3F',run:()=>{const was=t.date;moveItemDay({kind:'task',id:t.id,rec:t},dk,addK(todayK(),1));toast('Moved to tomorrow',()=>{t.date=was;put(t);});}}});
}
/* select several tasks, then act on all of them at once */
function selRow(t){const S=App.state,on=S.taskSel.has(t.id);return el('button',{class:'li tsel'+(on?' on':''),'aria-pressed':String(on),style:'width:100%;text-align:left;min-height:56px',onclick:()=>{on?S.taskSel.delete(t.id):S.taskSel.add(t.id);App.refresh();}},el('span',{class:'selbox',html:on?ic('check',13,3):''}),el('span',{class:'grow'},el('span',{class:'tt'},t.title),el('small',{},[t.date?relDay(t.date):'Anytime',t.part&&get.id(t.part)?get.id(t.part).title:null].filter(Boolean).join(' · '))));}
function selBar(){const S=App.state,ids=[...S.taskSel],ts=ids.map(get.id).filter(Boolean),n=ts.length,tk=todayK();
  const act=(fn,msg)=>{if(!n){toast('Tap tasks to select them');return;}const before=ts.map(clone);ts.forEach(fn);ts.forEach(t=>put(t,{silent:true}));S.taskSel=null;App.refresh();toast(msg,()=>{before.forEach(b=>put(b,{silent:true}));App.refresh();});};
  const move=d=>act(t=>{if(t.repeat&&t.repeat.type!=='never')return;if(t.date&&t.date!==d)t.moves=(t.moves||0)+1;t.date=d;},`${n} moved to ${relDay(d).toLowerCase()}`);
  return el('div',{class:'selbar'},el('div',{class:'bl'},el('b',{},n?`${n} selected`:'Select tasks'),el('button',{class:'linkbtn',onclick:()=>{S.taskSel=null;App.refresh();}},'Cancel')),
    el('div',{class:'chips'},el('button',{class:'chip',onclick:()=>act(t=>setTaskDoneRaw(t,t.date&&occursOn(t.date,t.repeat,tk,t.skip)?tk:(t.date||tk),true,{quiet:true}),`${n} finished`)},'Done'),el('button',{class:'chip',onclick:()=>move(tk)},'Today'),el('button',{class:'chip',onclick:()=>move(addK(tk,1))},'Tomorrow'),el('button',{class:'chip',onclick:()=>{if(!n){toast('Tap tasks to select them');return;}askFields({title:`Move ${n} task${n>1?'s':''}`,fields:[F('d','Date','date')],D:{d:addK(tk,2)},addLabel:'Move',save:D=>{if(D.d)move(D.d);}});}},'Pick a date…'),el('button',{class:'chip line',style:'color:var(--danger,#A4503A)',onclick:()=>{if(!n){toast('Tap tasks to select them');return;}const cs=ts.map(clone);ts.forEach(t=>remove(t.id));S.taskSel=null;App.refresh();toast(`${n} deleted`,()=>{cs.forEach(c=>put(c));});}},'Delete')));}
/* one card to plan every weekly habit that's behind, instead of a note under each */
function weekPlanCard(hs){const tk=todayK(),ws=weekStartOf(today()),days=[];for(let i=0;i<7;i++){const d=k(addD(ws,i));if(d>tk)days.push(d);}
  const nm=d=>DOW[fromK(d).getDay()].slice(0,3);if(!days.length)return null;
  return el('section',{class:'card wkplan'},el('span',{class:'lbl'},'Plan the rest of your week'),el('p',{class:'small muted'},'Tap a day to plan a session. Tap it again to take it off.'),
    el('div',{class:'wkgrid',style:`grid-template-columns:minmax(0,1fr) repeat(${days.length},36px)`},el('span'),...days.map(d=>el('span',{class:'small muted',style:'text-align:center;font-weight:600'},nm(d))),
      ...hs.flatMap(h=>{const left=Math.max(0,(h.target||1)-habitWeek(h,tk)),pl=days.filter(d=>(h.sessions||{})[d]).length;return[el('span',{class:'wkname'},el('b',{},h.title),el('small',{class:pl>=left?'':'late'},pl>=left?'All planned':`${left-pl} to plan`)),...days.map(d=>{const on=!!(h.sessions||{})[d];return el('button',{class:'wkcell'+(on?' on':''),'aria-pressed':String(on),'aria-label':`${on?'Unplan':'Plan'} ${h.title} on ${DOW[fromK(d).getDay()]}`,onclick:()=>{h.sessions=h.sessions||{};if(on)delete h.sessions[d];else h.sessions[d]={time:h.setTime??null};put(h);}},on?el('span',{html:ic('check',13,3)}):null);})];})));}
function viewTasks(root){
  const S=App.state;if(!['all','today','upcoming','anytime','waiting','done'].includes(S.taskTab))S.taskTab='all';
  const tk=todayK(),all=get.all('task').filter(t=>!onHold(t)),tasks=areaOnly(all,'task'),page=el('div',{class:'page'}),held=get.all('task').filter(t=>isOpenTask(t)&&onHold(t)).length;
  const occToday=t=>t.date&&occursOn(t.date,t.repeat,tk,t.skip);
  const late0=carried().filter(t=>tasks.includes(t));
  const hi=t=>t.priority==='high'?0:t.priority==='low'?2:1;
  const dueNow=tasks.filter(t=>isOpenTask(t)&&t.deadline&&t.deadline<=tk&&!late0.includes(t)&&!occToday(t));
  const late=[...late0,...dueNow.filter(t=>t.deadline<tk)];
  const today=tasks.filter(occToday).sort((a,b)=>(a.time??9e9)-(b.time??9e9)||hi(a)-hi(b)),todayOpen=[...today.filter(t=>!isDone(t,tk)),...dueNow.filter(t=>t.deadline===tk)];
  const upcoming=tasks.filter(t=>t.date&&isOpenTask(t)&&!late.includes(t)&&!dueNow.includes(t)&&!(occToday(t)&&!isDone(t,tk))).map(t=>[t,nextOcc(t)]).filter(([,d])=>d>tk).sort((a,b)=>a[1]<b[1]?-1:a[1]>b[1]?1:(a[0].time??9e9)-(b[0].time??9e9));
  const anytime=tasks.filter(t=>!t.date&&isOpenTask(t)&&!dueNow.includes(t)).sort((a,b)=>(a.deadline||'9999')<(b.deadline||'9999')?-1:(a.deadline||'9999')>(b.deadline||'9999')?1:hi(a)-hi(b)||(a.createdAt||0)-(b.createdAt||0));
  const doneAll=[];tasks.forEach(t=>Object.entries(t.doneDates||{}).forEach(([d,at])=>{const ts=typeof at==='number'?at:fromK(d).getTime();const rep=t.repeat&&t.repeat.type!=='never';if(!rep||Date.now()-ts<30*864e5)doneAll.push({t,d,ts});}));doneAll.sort((a,b)=>b.ts-a.ts);
  const todayDone=doneAll.filter(x=>k(new Date(x.ts))===tk),left=late.length+todayOpen.length;
  page.append(orgHead('Tasks',left?`${left} left today`:todayDone.length?'All done today':all.filter(isOpenTask).length?`${all.filter(isOpenTask).length} open`:'',{type:'Tasks',menu:()=>[{label:'Waiting on someone',icon:'time',onclick:()=>{S.taskTab='waiting';App.refresh();}},{label:'Select tasks',icon:'check',onclick:()=>{S.taskSel=new Set();App.refresh();}},{label:S.taskGroup?'Stop grouping':'Group by life area',icon:'grid',onclick:()=>{S.taskGroup=!S.taskGroup;App.refresh();}},{label:'Archive',icon:'archive',onclick:()=>App.go('archive')}]}));
  if(S.taskSel)page.append(selBar());
  if(S.taskTab!=='waiting')taskQuickAdd(page,S.taskTab==='today'||S.taskTab==='done'?tk:S.taskTab==='upcoming'?addK(tk,1):null);
  page.append(viewsRow([['all','All',0],['today','Today',left],['upcoming','Upcoming',S.taskTab==='upcoming'?upcoming.length:0],['anytime','Anytime',S.taskTab==='anytime'?anytime.length:0],...(get.all('wait').length||S.taskTab==='waiting'?[['waiting','Waiting',waitOpen().filter(w=>w.follow&&w.follow<=tk).length]]:[]),['done','Done',0]],S.taskTab,v=>{S.taskTab=v;App.refresh();},'task',all));
  const note=areaNote('task');if(note)page.append(note);
  let cpId=null;if(S.taskTab==='today'){const cp=carriedPrompt(tasks);if(cp){page.append(cp);cpId=cp._tid;}}
  const sec=(label,list,row0,cls)=>{if(!list.length)return;const row=S.taskSel?(t=>selRow(t)):row0;
    if(S.taskGroup){if(label)page.append(el('div',{class:'sh2 shstick'},el('span',{class:'lbl '+(cls||'')},`${label} · ${list.length}`)));byArea(list).forEach(([a,g])=>page.append(el('div',{class:'ogroup'},a),el('div',{class:'list'},g.map(t=>row(t,true)))));return;}
    if(label)page.append(el('div',{class:'sh2 shstick'},el('span',{class:'lbl '+(cls||'')},`${label} · ${list.length}`)));page.append(el('div',{class:'list'},list.map(t=>row(t,false))));};
  if(S.taskTab==='all'){
    /* All open tasks: Anytime on top, then by date (overdue first) */
    const dated=[...late.map(t=>[t,t.date&&t.date<tk?t.date:(t.deadline||tk)]),...todayOpen.filter(t=>!late.includes(t)).map(t=>[t,tk]),...upcoming];
    if(!anytime.length&&!dated.length)page.append(emptyOf('No open tasks','Add one above, or capture an idea and make it a task.'));
    sec(dated.length?'Anytime':'',anytime,(t,g)=>taskRow(t,tk,{grouped:g}));
    sec('Overdue',late,(t,g)=>taskRow(t,t.date&&t.date<tk?t.date:tk,{late:!!(t.date&&t.date<tk),grouped:g}),'olate');
    const rest=dated.filter(([t])=>!late.includes(t)),days=[...new Set(rest.map(x=>x[1]))].sort();
    days.forEach(d=>{const g=rest.filter(x=>x[1]===d);page.append(el('div',{class:'sh2 shstick'},el('span',{class:'lbl'},relDay(d)),el('span',{class:'small muted'},String(g.length))),el('div',{class:'list'},g.map(([t])=>S.taskSel?selRow(t):taskRow(t,d))));});
  }else if(S.taskTab==='today'){
    sec('Overdue',late.filter(t=>t.id!==cpId),(t,g)=>taskRow(t,t.date&&t.date<tk?t.date:tk,{late:!!(t.date&&t.date<tk),grouped:g}),'olate');
    sec(late.length?'Today':'',todayOpen,(t,g)=>taskRow(t,tk,{grouped:g}));
    if(!late.length&&!todayOpen.length&&!todayDone.length)page.append(emptyOf('Nothing for today','Add a task, or pick one up from Anytime.'));
    if(!late.length&&!todayOpen.length&&todayDone.length)page.append(emptyOf('All done today','Nothing left. Enjoy it.'));
  }else if(S.taskTab==='upcoming'){
    if(!upcoming.length)page.append(emptyOf('Nothing coming up','Tasks with a future date show here.'));
    const days=[...new Set(upcoming.map(x=>x[1]))];days.forEach(d=>{const g=upcoming.filter(x=>x[1]===d);page.append(el('div',{class:'sh2 shstick'},el('span',{class:'lbl'},relDay(d)),el('span',{class:'small muted'},String(g.length))),el('div',{class:'list'},g.map(([t])=>S.taskSel?selRow(t):taskRow(t,d))));});
  }else if(S.taskTab==='waiting'){waitTab(page);
  }else if(S.taskTab==='anytime'){
    if(!anytime.length)page.append(emptyOf('Nothing waiting','Tasks without a date wait here for Studio.'));
    sec('',anytime,(t,g)=>taskRow(t,todayK(),{grouped:g}));
  }else{
    if(!doneAll.length)page.append(emptyOf('Nothing finished yet','Ticked tasks collect here. You can untick one any time.'));
    else{const tk2=todayK(),y=addK(tk2,-1),wk=k(weekStartOf(new Date())),bucket=x=>{const d=k(new Date(x.ts));return d===tk2?'Today':d===y?'Yesterday':d>=wk?'Earlier this week':'Before that';};['Today','Yesterday','Earlier this week','Before that'].forEach(b=>{const g=doneAll.slice(0,60).filter(x=>bucket(x)===b);if(g.length)page.append(el('div',{class:'sh2 shstick'},el('span',{class:'lbl'},b),el('span',{class:'small muted'},String(g.length))),el('div',{class:'list nodim'},g.map(x=>taskRow(x.t,x.d,{doneOn:k(new Date(x.ts))}))));});}
  }
  if(S.taskTab==='today'&&todayDone.length){const openD=S.taskDoneOpen!==false;page.append(el('button',{class:'donebar','aria-expanded':String(openD),onclick:()=>{S.taskDoneOpen=!openD;App.refresh();}},el('span',{},`Done today · ${todayDone.length}`),el('span',{style:'display:grid',html:ic(openD?'chevu':'chevd',16,2.2)})));if(openD)page.append(el('div',{class:'list'},todayDone.map(x=>taskRow(x.t,x.d))));}
  if(held)page.append(el('p',{class:'small muted',style:'padding:4px 6px'},`${held} task${held>1?'s':''} in projects on hold ${held>1?'aren’t':'isn’t'} shown here.`));root.append(page);
}

/* ---------- Habits ---------- */
const habitWeekly=h=>!(h.days&&h.days.length);
const habitStart=h=>h.startDate||(h.createdAt?k(new Date(h.createdAt)):'2000-01-01');
const habitDue=(h,d)=>(habitWeekly(h)||h.days.includes(monIdx(fromK(d))))&&d>=(h.startDate||'0');
function habitRate(h){const tk=todayK(),st=habitStart(h);
  if(habitWeekly(h)){let n=0,w=0;for(let i=0;i<30;i++){const d=addK(tk,-i);if(d<st)break;w++;if(habitDone(h,d))n++;}return w<7?null:Math.min(1,n/Math.max(1,(h.target||1)*w/7));}
  let due=0,n=0;for(let i=0;i<30;i++){const d=addK(tk,-i);if(d<st)break;if(!h.days.includes(monIdx(fromK(d)))||(h.skips&&h.skips[d]))continue;const dn=habitDone(h,d);if(d===tk&&!dn)continue;due++;if(dn)n++;}return due<3?null:n/due;}
function habitDotState(h,d){const tk=todayK();if(habitDone(h,d))return'on';if(h.skips&&h.skips[d])return'skip';if(h.paused&&(!h.pausedAt||d>=k(new Date(h.pausedAt))))return'off';if(!habitWeekly(h)&&h.days.includes(monIdx(fromK(d)))&&d>=habitStart(h)&&d<tk)return'miss';return'off';}
const streakText=s=>`${s.n} ${s.unit}${s.n>1?'s':''}`;
function habitSched(h){return habitWeekly(h)?`${h.target||1} times a week`:h.days.length===7?'Every day':h.days.slice().sort().map(i=>WDN[i].slice(0,3)).join(', ');}
function setHabitPaused(h,on){App.state._held=on?1:-1;if(on){h.paused=true;h.pausedAt=Date.now();h.pausedStreak=habitStreak(h);}else{
    /* days spent paused count as skips, so the streak survives */
    if(h.pausedAt&&!habitWeekly(h)){h.skips=h.skips||{};let d=k(new Date(h.pausedAt));const tk=todayK();for(let i=0;i<800&&d<tk;i++){if(!habitDone(h,d))h.skips[d]=true;d=addK(d,1);}}
    h.paused=false;h.pausedAt=null;h.pausedStreak=null;}put(h);}
function habitRow(h,dk){
  const done=habitDone(h,dk),skip=h.skips&&h.skips[dk],open=()=>App.go('habit',{id:h.id}),s=habitStreak(h);
  const row=el('div',{class:'li tick-host'+(done?' done':''),'data-k':'h:'+h.id,style:'min-height:60px'});
  const line=(()=>{if(skip)return el('small',{},'Skipped');
    if(!done&&dk===todayK()&&missedYesterday(h))return el('small',{class:'olate'},'Missed yesterday · Never miss twice');
    const parts=[];if(habitWeekly(h))parts.push(`${habitWeek(h,dk)} of ${h.target||1} this week`);
    const MS={day:{7:'1 week',30:'30 days',100:'100 days',365:'1 year'},week:{4:'1 month',12:'3 months',26:'6 months',52:'1 year'}},ms=(MS[s.unit]||{})[s.n];
    return el('small',{class:'ometa'},joinMeta([...parts,s.n>1?(()=>{const pf=streakSeen(h.id,s.n);return el('span',{class:'omi','data-rollfrom':pf!=null&&pf>1?pf:null,'data-rollto':s.n},flameI(),streakText(s));})():(streakSeen(h.id,s.n),null)]),ms?el('span',{class:'mstone','data-ms':`${h.id}:${s.unit}:${s.n}`},'★ '+ms):null);})();
  if(h.track==='count'||h.track==='time'){const v=typeof(h.logs||{})[dk]==='number'?h.logs[dk]:h.logs&&h.logs[dk]?h.goalN:0;
    row.append(el('span',{class:'ring sm',style:`--p:${Math.min(100,v/(h.goalN||1)*100)}`},el('span',{})),el('button',{class:'grow',style:'text-align:left',onclick:open},el('b',{style:'font-weight:500'},h.title),el('small',{},habitMeta(h,dk))),h.track==='count'?(()=>{const c=el('button',{class:'chip',style:'height:36px',title:'Hold to type a number',onclick:()=>{buzz(6);logHabit(h,dk,1);}},'+1');onPress(c,()=>habitCountSheet(h,dk));c.addEventListener('pointerdown',e=>e.stopPropagation());return c;})():el('button',{class:'chip',style:'height:36px',onclick:()=>logTimeSheet(h,dk)},'Log'));}
  else row.append(el('span',{class:'tick-hit'},tickBtn(done,on=>{toggleItem({kind:'habit',rec:h},dk);if(on&&dk===todayK()&&allHabitsDone(dk)){buzz(12);toast('Every habit done today. Nice work.',()=>{toggleItem({kind:'habit',rec:h},dk);App.refresh();});}else if(on){const n=habitStreak(h);toast(n.n>1?`${h.title} · ${streakText(n)} in a row`:`${h.title} done`,()=>{toggleItem({kind:'habit',rec:h},dk);App.refresh();});}setTimeout(()=>App.refresh(),820);})),el('button',{class:'grow',style:'text-align:left',onclick:open},el('span',{class:'tt',style:'font-weight:500'},h.title),line));
  return withPress(row,(x,y)=>habitMenu(h,dk,x,y));
}
function allHabitsDone(dk){const hs=get.all('habit').filter(h=>!h.paused&&habitDue(h,dk)&&!habitWeekly(h));return hs.length>1&&hs.every(h=>habitDone(h,dk)||(h.skips&&h.skips[dk]));}
function habitCountSheet(h,dk){const cur=typeof(h.logs||{})[dk]==='number'?h.logs[dk]:h.logs&&h.logs[dk]?h.goalN:0;let v=cur,inst;inst=openSheet({title:'Set the count',left:{label:'Cancel'},right:{label:'Save',onclick:()=>{const n=Math.max(0,Math.round(+v||0));logHabit(h,dk,0,{set:n});inst.close();toast(`${h.title} · ${n} of ${h.goalN}`);}},build:b=>{const i=el('input',{id:'f-hcount',type:'number',inputmode:'numeric',class:'big',value:cur,oninput:e=>v=e.target.value});b.append(el('p',{class:'muted'},`${h.title} · ${relDay(dk)}`),el('label',{class:'field'},el('span',{class:'eyebrow'},`How many${h.unit?' '+h.unit:''}`),i));if(!isTouch())i.focus({preventScroll:true});}});}
function habitMenu(h,dk,x,y){const y1=addK(dk,-1),skipped=!!(h.skips&&h.skips[dk]),yDone=habitDone(h,y1);
  const items=[];
  if(!habitWeekly(h))items.push({label:skipped?'Undo skip':`Skip ${dk===todayK()?'today':relDay(dk).toLowerCase()}`,icon:'time',onclick:()=>{const was=clone(h.skips||{}),wasL=clone(h.logs||{});h.skips=h.skips||{};if(skipped)delete h.skips[dk];else{h.skips[dk]=true;if(h.logs)delete h.logs[dk];}put(h);toast(skipped?'Skip removed':'Skipped. Your streak is safe.',()=>{h.skips=was;h.logs=wasL;put(h);});}});
  if(h.track==='count')items.push({label:'Set exact count',icon:'edit',onclick:()=>habitCountSheet(h,dk)});
  if(!yDone&&y1>=(h.createdAt?k(new Date(h.createdAt)):'0'))items.push({label:'Fill in yesterday',icon:'check',onclick:()=>{h.logs=h.logs||{};h.logs[y1]=h.track==='count'||h.track==='time'?(h.goalN||1):true;if(h.skips)delete h.skips[y1];put(h);toast(`Marked done for yesterday`,()=>{delete h.logs[y1];put(h);});}});
  items.push({label:'Edit',icon:'edit',onclick:()=>habitSheet(h)},{label:h.paused?'Resume':'Pause',icon:'time',onclick:()=>{setHabitPaused(h,!h.paused);toast(h.paused?'Paused. History kept.':'Resumed');App.refresh();}});
  openMenu(x,y,items);}
function usualTime(h){const v=Object.values(h.logT||{});if(v.length<5||h.setTime!=null)return null;const srt=v.slice(-30).sort((a,b)=>a-b),m=srt[srt.length>>1];return fmtT(Math.round(m/15)*15);}
const missedYesterday=h=>{if(habitWeekly(h))return false;const y=addK(todayK(),-1);return h.days.includes(monIdx(fromK(y)))&&(!h.startDate||y>=h.startDate)&&!habitDone(h,y)&&!(h.skips&&h.skips[y]);};
const habOrd=(a,b)=>(a.order??1e9)-(b.order??1e9)||(a.createdAt||0)-(b.createdAt||0);
function reorderSheet({title,items,onDone}){let D=items.slice(),inst,box;const draw=()=>{box.innerHTML='';box.append(el('p',{class:'small',style:'color:var(--ink-2)'},'Drag to set the order.'));const list=el('div',{class:'list'});D.forEach((x,i)=>{const r=el('div',{class:'li',style:'min-height:54px','data-i':String(i)},el('span',{class:'grow'},el('b',{style:'font-weight:500'},x.n),x.s?el('small',{},x.s):null));const h=el('span',{class:'grip','aria-label':`Drag ${x.n} to reorder`,html:sv('<circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/>',18)});r.append(h);list.append(r);reorderable(h,r,list,()=>{const c=D.slice();D=[...list.children].map(n=>c[+n.dataset.i]);draw();});});box.append(list);};inst=openSheet({title,left:{label:'Cancel'},right:{label:'Done',onclick:()=>{onDone(D);inst.close();}},build:b=>{box=el('div',{style:'display:grid;gap:12px'});b.append(box);draw();}});return inst;}
function viewHabits(root){
  const S=App.state;S.habTab=S.habTab||'today';S.habDay=S.habDay&&S.habDay<=todayK()?S.habDay:todayK();
  const everyAll=get.all('habit',{every:true}).sort(habOrd),every=areaOnly(everyAll,'hab'),active=every.filter(h=>!h.paused),paused=every.filter(h=>h.paused),arch=get.all('habit',{archived:true,every:true}).filter(h=>h.archived),page=el('div',{class:'page'}),tk=todayK(),dk=S.habDay;
  const counts=(h,d)=>habitDue(h,d)&&(!habitWeekly(h)||habitDone(h,d)||habitWeek(h,d)<(h.target||1));
  const todayList=active.filter(h=>counts(h,tk)),fin=todayList.filter(h=>habitDone(h,tk)).length;
  page.append(orgHead('Habits',todayList.length?(fin===todayList.length?'All done today':`${fin} of ${todayList.length} done today`):active.length?`${active.length} active`:'',{type:'Habits',menu:()=>[active.length>1?{label:'Reorder habits',icon:'list',onclick:()=>reorderSheet({title:'Reorder habits',items:active.map(h=>({id:h.id,n:h.title,s:h.tod?h.tod[0].toUpperCase()+h.tod.slice(1):null})),onDone:D=>{D.forEach((x,i)=>{const h=get.id(x.id);if(h){h.order=i;put(h,{silent:true});}});App.refresh();toast('Order saved');}})}:null,{label:'Archive',icon:'archive',onclick:()=>App.go('archive')}]}));
  page.append(addBar('Add a habit','New habit',()=>habitSheet(null)));
  if(!everyAll.length&&!arch.length){page.append(emptyOf('Your first habit','Pick something small. Set how often, and it shows up on Today.'));root.append(page);return;}
  const dueNow=active.filter(h=>habitDue(h,dk));
  page.append(viewsRow([['today','Today',S.habTab==='today'?active.filter(h=>counts(h,dk)).length:0],['all','All habits',S.habTab==='all'?active.length:0],['paused','Paused',paused.length]],S.habTab,v=>{S.habTab=v;App.refresh();},'hab',everyAll));
  const note=areaNote('hab');if(note)page.append(note);
  if(S.habTab==='today'){
    const st=weekStartOf(today());
    page.append(el('div',{class:'rings'},Array.from({length:7},(_,i)=>{const d=addD(st,i),x=k(d),list=active.filter(h=>counts(h,x)),f=list.filter(h=>habitDone(h,x)).length,pc=list.length?f/list.length*100:0;return el('button',{class:x===dk?'on':'',disabled:x>tk,'aria-label':`${shortDay(x)}, ${f} of ${list.length} done`,'aria-pressed':String(x===dk),onclick:()=>{S.habDay=x;App.refresh();}},DOW[d.getDay()][0],el('span',{class:'ring sm',style:`--p:${pc}`},el('span',{},String(d.getDate()))));})));
    if(dk!==tk)page.append(el('div',{class:'small muted',style:'padding-inline:4px'},`Filling in ${relDay(dk)==='Yesterday'?'yesterday':relDay(dk)}`));
    if(!dueNow.length)page.append(emptyOf('Nothing due','No habits are set for this day.'));
    const dayly=dueNow.filter(h=>!habitWeekly(h)),weekly=dueNow.filter(habitWeekly);
    const sect=(n,g0,right)=>{const g=g0.slice().sort((a,b)=>habitDone(a,dk)-habitDone(b,dk));if(g.length)page.append(el('div',{class:'sh2 shstick'},el('span',{class:'lbl'},n),el('span',{class:'small muted'},right)),el('div',{class:'list'},g.map(h=>{const r=habitRow(h,dk);if(dk!==tk||!habitWeekly(h)||habitDone(h,dk)||shared)return r;const nt=habitLeftNote(h);return nt?el('div',{},r,nt):r;})));};
    const needy=dk===tk?weekly.filter(h=>!habitDone(h,dk)&&habitLeftNote(h)):[],shared=needy.length>1;
    [['morning','Morning'],['afternoon','Afternoon'],['evening','Evening'],['set','At a set time'],['anytime','Anytime']].forEach(([v,n])=>{const g=dayly.filter(h=>(h.tod||'anytime')===v);sect(n,g,`${g.filter(h=>habitDone(h,dk)).length} of ${g.length}`);});
    sect('This week',weekly,`${weekly.filter(h=>habitWeek(h,dk)>=(h.target||1)).length} of ${weekly.length} met`);
    if(shared){const c=weekPlanCard(needy);if(c)page.append(c);}
  }else if(S.habTab==='all'){
    if(!active.length)page.append(emptyOf('No active habits','Add one, or resume one from Paused.'));
    else{const rw=[...Array(7)].map((_,i)=>addK(tk,i-6));
      page.append(el('div',{class:'list'},active.map(h=>{const s=habitStreak(h);return el('button',{class:'li ohab',onclick:()=>App.go('habit',{id:h.id})},el('span',{class:'grow'},el('span',{class:'ohn'},el('b',{},h.title),habitRate(h)==null?el('span',{class:'ohr'},'New'):el('span',{class:'ohr','aria-label':`${Math.round(habitRate(h)*100)} percent in the last 30 days`},`${Math.round(habitRate(h)*100)}%`)),el('small',{},[h.track==='count'?`${h.goalN} ${h.unit||'times'}`:h.track==='time'?`${h.goalN} min`:null,habitSched(h),h.area].filter(Boolean).join(' · ')),el('span',{class:'odots','aria-hidden':'true','data-dk':h.id},rw.map(d=>el('i',{class:habitDotState(h,d)+(d===tk?' td':'')})))),s.n?el('span',{class:'ohs'},flameI(),String(s.n)):null);})),
        el('div',{class:'olegend'},[['on','Done'],['miss','Missed'],['skip','Skipped'],['off','Not due']].map(([c,t])=>el('span',{},el('span',{class:'odots'},el('i',{class:c})),t))),el('p',{class:'small muted',style:'padding-inline:4px'},'Percent is the last 30 days. The flame is your current streak.'));}
  }else{
    if(paused.length){page.append(el('p',{class:'small muted',style:'padding-inline:4px'},'Paused habits stay off Today. Their history is kept, and a daily streak picks up where it stopped.'));
      paused.forEach(h=>{const ps=h.pausedStreak;page.append(el('div',{class:'card ohold'},el('button',{style:'display:block;width:100%;text-align:left',onclick:()=>App.go('habit',{id:h.id})},el('b',{},h.title),el('small',{},[h.pausedAt?`Paused ${relDay(k(new Date(h.pausedAt)))}`:'Paused',!habitWeekly(h)&&ps&&ps.n>1?`${ps.n}-day streak saved`:''].filter(Boolean).join(' · '))),btns(btnP('Resume',()=>{setHabitPaused(h,false);toast('Resumed');}),btnL('Archive',()=>archiveFlow(h)))));});}
    else if(!arch.length)page.append(emptyOf('Nothing paused','Pause a habit when life gets busy. Its history stays.'));
    if(arch.length)page.append(lblRow(`Archived · ${arch.length}`),el('div',{class:'list'},arch.map(h=>el('button',{class:'li',style:'min-height:56px',onclick:()=>App.go('habit',{id:h.id})},el('span',{class:'grow'},el('b',{style:'font-weight:500'},h.title),el('small',{},h.archivedAt?`Since ${relDay(k(new Date(h.archivedAt)))}`:'Archived')),pill(h.built?'Built':'Stopped',h.built?'soft':'neu')))));
  }
  root.append(page);
}

/* ---------- Goals ---------- */
const paceClass=pa=>pa==='Behind'||pa==='Overdue'?'warn':pa==='A bit behind'?'neu':'soft';
const gNum=(v,u)=>{const n=(+v||0).toLocaleString('en-US',{maximumFractionDigits:2});u=(u||'').trim();return /^[$€£¥]$/.test(u)?u+n:u?`${n} ${u}`:n;};
const goalNumText=g=>{const a=+g.numStart||0,b=+g.numTarget||0,c=+(g.numCur??a),u=g.numUnit,left=Math.abs(b-c),done=b>=a?c>=b:c<=b;return done?`${gNum(c,u)} · goal reached`:b>=a?`${gNum(c,u)} of ${gNum(b,u)}`:`${gNum(c,u)} now · ${gNum(left,u)} to go`;};
const goalLate=g=>g.deadline&&!g.finished&&g.deadline<todayK();
function goalTrackText(g){const tr=g.track||'milestones',st=g.steps||[];if(tr==='number')return goalNumText(g);if(tr==='milestones')return st.length?`${st.filter(s=>s.d).length} of ${st.length} milestones`:'No milestones yet';return tr==='linked'?'Linked work':'';}
const goalMenu=g=>(x,y)=>openMenu(x,y,[g.track==='number'?{label:'Log progress',icon:'plus',onclick:()=>logNumberSheet(g)}:null,{label:g.focus?'Remove from focus':'Make a focus goal',icon:'star',onclick:()=>setFocus(g,!g.focus)},{label:'Edit',icon:'edit',onclick:()=>goalSheet(g)},{label:'Put on hold',icon:'time',onclick:()=>{g.paused=true;g.focus=false;put(g);toast('On hold',()=>{g.paused=false;put(g);});}},{label:'Mark achieved',icon:'task',onclick:()=>achieveSheet(g)},{label:'Delete',icon:'trash',danger:true,onclick:()=>{const c=clone(g);remove(g.id);toast('Goal deleted',()=>put(c));}}]);
function goalFocusCard(g){
  const pc=goalProgress(g),pa=goalPace(g),st=g.steps||[],next=(g.track||'milestones')==='milestones'&&st.find(s=>!s.d),num=g.track==='number';
  const open=()=>App.go('plan',{id:g.id});
  const main=el('button',{class:'ocm',style:'display:flex;gap:14px;align-items:center',onclick:open},el('span',{class:'ring',style:`--p:${pc*100}`},el('span',{},`${Math.round(pc*100)}%`)),el('span',{class:'grow',style:'min-width:0'},el('span',{class:'oserif'},g.title),el('small',{class:'ometa'},joinMeta([g.area,g.deadline?(goalLate(g)?el('span',{class:'olate'},`Was due ${relDay(g.deadline)}`):`By ${relDay(g.deadline)}`):'',goalTrackText(g)].filter(Boolean))),pa&&pa!=='Overdue'?el('span',{class:'tags'},pill(pa,paceClass(pa))):null));
  withPress(main,goalMenu(g));
  const foot=next?el('div',{class:'ofoot tick-host',style:'gap:10px'},el('span',{class:'tick-hit'},tickBtn(false,on=>{next.d=on;next.doneAt=on?Date.now():null;put(g,{silent:true});toast(`${next.t} done`,()=>{next.d=false;next.doneAt=null;put(g);});setTimeout(()=>App.refresh(),820);})),el('span',{class:'grow'},`Next: ${next.t}`),next.date?el('span',{class:'small muted'},relDay(next.date)):null):num?el('div',{class:'ofoot'},el('button',{class:'linkbtn small',style:'min-height:32px',onclick:()=>logNumberSheet(g)},'Log progress')):null;
  return el('div',{class:'ocard'},main,foot);
}
function goalRowActive(g){const pc=goalProgress(g),tr=g.track||'milestones',empty=tr==='milestones'&&!(g.steps||[]).length,stale=!empty&&Date.now()-lastProgress(g)>21*864e5,pa=goalPace(g);
  const b=el('button',{class:'li ogr',onclick:()=>App.go('plan',{id:g.id})},el('span',{class:'ohn'},el('b',{},g.title),tr==='done'?null:el('span',{class:'ohr'},`${Math.round(pc*100)}%`)),tr==='done'?null:meter(pc),goalLate(g)?el('small',{class:'olate'},`Was due ${relDay(g.deadline)}`):stale?el('small',{class:'olate'},tr==='done'?'No check-in in 3 weeks':'No progress in 3 weeks'):el('small',{},empty?'No milestones yet':[g.area,g.deadline?`By ${relDay(g.deadline)}`:'',pa].filter(Boolean).join(' · ')||goalTrackText(g)||'Mark it achieved when it’s done'));
  return withPress(b,goalMenu(g));}
function holdCard(r,isGoal){const pc=isGoal?goalProgress(r):(()=>{const t=projectTasks(r);return t.length?t.filter(taskDone).length/t.length:0;})();
  return el('div',{class:'card ohold'},el('button',{style:'display:block;width:100%;text-align:left',onclick:()=>App.go('plan',{id:r.id})},el('span',{class:'ohn'},el('b',{},r.title),el('span',{class:'ohr'},`${Math.round(pc*100)}%`)),meter(pc),r.area?el('small',{},r.area):null),
    btns(btnP('Resume',()=>{r.paused=false;put(r);toast('Back in Active');}),isGoal?btnL('Let it go',()=>{r.archived=true;r.archivedAt=Date.now();r.status='letgo';r.focus=false;put(r);toast('Let go',()=>{r.archived=false;r.status='active';put(r);});}):btnL('Archive',()=>archiveFlow(r))));}
function doneBadge(){return el('span',{class:'obadge',html:ic('check',16,2.6)});}
function viewPlans(root,kind){
  const S=App.state,isGoal=kind==='goal',word=isGoal?'goal':'project',title=isGoal?'Goals':'Projects',sheet=isGoal?goalSheet:projectSheet,key='tab'+kind,afk=kind;S[key]=S[key]||'active';
  const every=get.all(kind,{every:true}),all=areaOnly(every,afk),page=el('div',{class:'page'});
  const groups={active:all.filter(r=>!r.paused&&!r.finished),hold:all.filter(r=>r.paused&&!r.finished),done:all.filter(r=>r.finished)},letgo=isGoal?get.all('goal',{archived:true,every:true}).filter(g=>g.archived&&g.status==='letgo'):[];
  page.append(orgHead(title,groups.active.length?`${groups.active.length} active`:'',{type:title,menu:()=>[...(isGoal?[]:userTpls().filter(t=>t.kind==='project').length?[{label:'New from a template',icon:'bookmark',onclick:()=>{const ts=userTpls().filter(t=>t.kind==='project');pickSheet('New project from a template',ts.map(t=>[t.id,t.t,`${t.items.length} tasks`]),id=>addTemplate(ts.find(t=>t.id===id)));}}]:[]),...(isGoal?[]:[{label:`Sort: ${({manual:'Your order',due:'Due date',prog:'Progress',touched:'Last touched',name:'Name'})[S.projSort||'manual']}`,icon:'list',onclick:()=>{const o=['manual','due','prog','touched','name'];S.projSort=o[(o.indexOf(S.projSort||'manual')+1)%o.length];try{localStorage.setItem('lo-projSort',S.projSort);}catch(e){}App.refresh();toast(`Sorted by ${({manual:'your order',due:'due date',prog:'progress',touched:'last touched',name:'name'})[S.projSort]}`);}}]),{label:S['grp'+kind]?'Stop grouping':'Group by life area',icon:'grid',onclick:()=>{S['grp'+kind]=!S['grp'+kind];App.refresh();}},{label:'Archive',icon:'archive',onclick:()=>App.go('archive')}]}));
  page.append(addBar(`Add a ${word}`,`New ${word}`,()=>sheet(null)));
  if(!every.length&&!letgo.length){page.append(emptyOf(`Your first ${word}`,isGoal?'Name an outcome and choose how to track it.':'Name the effort and list the tasks. They show up everywhere tasks do.'));root.append(page);return;}
  page.append(viewsRow([['active','Active',S[key]==='active'?groups.active.length:0],['hold','On hold',groups.hold.length],['done','Done',S[key]==='done'?groups.done.length+letgo.length:0]],S[key],v=>{S[key]=v;App.refresh();},afk,every));
  const note=areaNote(afk);if(note)page.append(note);
  const grouped=(list,wrap)=>{if(S['grp'+kind])byArea(list).forEach(([a,g])=>{page.append(el('div',{class:'ogroup'},a));wrap(g);});else wrap(list);};
  if(S[key]==='active'){
    if(!groups.active.length)page.append(emptyOf('Nothing active',`Add a ${word}, or bring one back from On hold.`));
    if(isGoal){const cc=cascadeCard();if(cc)page.append(cc);const focus=groups.active.filter(g=>g.focus),rest=groups.active.filter(g=>!g.focus);
      if(focus.length){page.append(lblRow(`Focus · ${focus.length}`,'Shown on Today'));focus.forEach(g=>page.append(goalFocusCard(g)));}
      if(rest.length){if(focus.length)page.append(lblRow(`Also active · ${rest.length}`));grouped(rest,g=>page.append(el('div',{class:'list'},g.map(goalRowActive))));}
      if(groups.active.length)page.append(el('p',{class:'small muted',style:'padding-inline:4px'},isTouch()?'Touch and hold a goal to focus it. Up to 3.':'Right-click a goal to focus it. Up to 3.'));
    }else{if(!S.projSort){try{S.projSort=localStorage.getItem('lo-projSort')||'manual';}catch(e){S.projSort='manual';}}
      const pg=p=>{const ts=projectTasks(p);return ts.length?ts.filter(taskDone).length/ts.length:0;},srt={due:(a,b)=>(a.deadline||'9999')<(b.deadline||'9999')?-1:(a.deadline||'9999')>(b.deadline||'9999')?1:(a.order??0)-(b.order??0),prog:(a,b)=>pg(b)-pg(a),touched:(a,b)=>lastProgress(b)-lastProgress(a),name:(a,b)=>a.title.localeCompare(b.title)}[S.projSort]||null;
      grouped(srt?groups.active.slice().sort(srt):groups.active,g=>g.forEach(p=>page.append(projectCard(p))));}
  }else if(S[key]==='hold'){
    if(groups.hold.length){page.append(el('p',{class:'small muted',style:'padding-inline:4px'},isGoal?'On hold means not now. These stay off Today and out of check-ins until you resume them.':'On hold means not now. Their tasks stay off Studio until you resume.'));groups.hold.forEach(r=>page.append(holdCard(r,isGoal)));}
    else page.append(emptyOf('Nothing on hold','Put something on hold when it’s not the moment.'));
  }else{
    const yr=today().getFullYear(),ach=groups.done.slice().sort((a,b)=>(b.finishedAt||0)-(a.finishedAt||0)),thisYr=ach.filter(r=>r.finishedAt&&new Date(r.finishedAt).getFullYear()===yr).length;
    if(thisYr)page.append(el('div',{class:'ocheer'},el('span',{class:'oric',html:ic('star',20)}),el('b',{},`${thisYr} ${word}${thisYr>1?'s':''} ${isGoal?'achieved':'finished'} this year`)));
    if(ach.length)page.append(lblRow(`${isGoal?'Achieved':'Finished'} · ${ach.length}`),el('div',{class:'list'},ach.map(r=>el('button',{class:'li',style:'min-height:60px',onclick:()=>App.go('plan',{id:r.id})},doneBadge(),el('span',{class:'grow'},el('b',{style:'font-weight:500'},r.title),el('small',{},[r.area,r.finishedAt?`${isGoal?'Achieved':'Finished'} ${relDay(k(new Date(r.finishedAt)))}`:'',r.finishedAt&&r.createdAt?`Took ${span(r.finishedAt-r.createdAt)}`:''].filter(Boolean).join(' · ')))))));
    if(letgo.length)page.append(lblRow(`Let go · ${letgo.length}`),el('div',{class:'list'},letgo.map(g=>el('div',{class:'li',style:'min-height:56px'},el('span',{class:'grow'},el('b',{style:'font-weight:500'},g.title),el('small',{},[g.area,g.archivedAt?`Let go ${relDay(k(new Date(g.archivedAt)))}`:''].filter(Boolean).join(' · '))),el('button',{class:'linkbtn small',style:'min-height:44px',onclick:()=>{g.archived=false;g.status='active';put(g);toast('Back in Active');}},'Restore')))));
    if(!ach.length&&!letgo.length)page.append(emptyOf('Nothing here yet','Finished work rests here.'));
  }
  root.append(page);
}

/* ---------- Projects ---------- */
function projectCard(r){
  const ts=projectTasks(r),d=ts.filter(taskDone).length,next=ts.find(t=>!taskDone(t)),pc=ts.length?d/ts.length:0,parent=r.part&&get.id(r.part),stale=next&&Date.now()-lastProgress(r)>14*864e5;
  const dl=r.deadline&&dayCount(r.deadline);
  const metaParts=[r.area,r.deadline?`Due ${relDay(r.deadline)}`:null,r.deadline?(dl<0?el('span',{class:'olate'},`${-dl} day${dl<-1?'s':''} late`):dl>1?`${dl} days left`:null):null,parent?`Part of ${parent.title}`:null,stale&&!(dl<0)?el('span',{class:'olate'},'No progress in 2 weeks'):null];
  const main=el('button',{class:'ocm',onclick:()=>App.go('plan',{id:r.id})},el('span',{class:'oserif'},r.title),metaParts.some(Boolean)?el('small',{class:'ometa'},joinMeta(metaParts)):null,ts.length?el('span',{class:'obar'},meter(pc),el('span',{class:'small muted tnum'},`${d} of ${ts.length}`)):null);
  let foot;
  if(!ts.length)foot=el('div',{class:'ofoot'},el('span',{class:'grow muted'},'No tasks yet'),el('button',{class:'linkbtn small',style:'min-height:32px',onclick:()=>App.go('plan',{id:r.id})},'Add a task'));
  else if(!next)foot=el('div',{class:'ofoot'},el('span',{class:'grow muted'},'Every task is done'),el('button',{class:'linkbtn small',style:'min-height:32px',onclick:()=>{r.finished=true;r.finishedAt=Date.now();put(r);toast('Project done',()=>{r.finished=false;r.finishedAt=null;put(r);});}},'Mark project done'));
  else{const row=el('div',{class:'ofoot tick-host'},el('span',{class:'tick-hit'},tickBtn(false,on=>{setTaskDone(next,next.date||todayK(),on);toast(`${next.title} done`,()=>{setTaskDone(next,next.date||todayK(),false);App.refresh();});setTimeout(()=>App.refresh(),820);})),el('button',{class:'grow',style:'text-align:left;min-width:0',onclick:()=>openRec(next)},el('span',{class:'tt'},next.title),el('small',{},'Next · ',ptMeta(next))));foot=row;}
  return withPress(el('div',{class:'ocard'},main,foot),(x,y)=>openMenu(x,y,[{label:'Open',icon:'arrow',onclick:()=>App.go('plan',{id:r.id})},{label:'Edit',icon:'edit',onclick:()=>projectSheet(r)},{label:r.paused?'Resume':'Put on hold',icon:'time',onclick:()=>{r.paused=!r.paused;put(r);toast(r.paused?'On hold':'Resumed');}},r.finished?{label:'Reopen',icon:'undo',onclick:()=>{r.finished=false;r.status='active';put(r);}}:{label:'Mark done',icon:'task',onclick:()=>finishProject(r)},{label:'Archive',icon:'archive',onclick:()=>archiveFlow(r)},{label:'Delete',icon:'trash',danger:true,onclick:()=>{const c=clone(r);remove(r.id);toast('Project deleted',()=>put(c));}}]));
}
function projectPace(r,pc){if(!r.deadline||r.finished||r.paused)return null;if(r.deadline<todayK())return'Overdue';const s=r.createdAt||Date.now(),e=fromK(r.deadline).getTime();if(e<=s)return'Behind';const used=Math.min(1,Math.max(0,(Date.now()-s)/(e-s)));if(used<.05)return'On pace';return pc>=used-.1?'On pace':pc>=used-.3?'A bit behind':'Behind';}

/* ---------- Routines ---------- */
const RT_LOOK={'Morning':['sun','#B5803A'],'Wind down':['time','#4F6D8F'],'Workout':['habit','#A24E36'],'Weekly reset':['rep','#466B5A'],'Focus block':['target','#7A5C86']};
const rtOn=(r,dk)=>(r.days||[]).includes(monIdx(fromK(dk)))&&(!r.startDate||dk>=r.startDate);
function rtStreak(r){let n=0,d=todayK();for(let i=0;i<800;i++){if(rtOn(r,d)){if((r.runs||{})[d])n++;else if(d!==todayK())break;}if(r.startDate&&d<r.startDate)break;d=addK(d,-1);}return n;}
function rtWhen(r){const ds=r.days||[];if(!ds.length)return'On demand';const set=ds.slice().sort().join('');return(set==='0123456'?'Every day':set==='01234'?'Weekdays':set==='56'?'Weekends':ds.slice().sort().map(i=>WDN[i].slice(0,3)).join(', '))+(r.setTime!=null?` · ${fmtT(r.setTime)}`:'');}
const rtMins=r=>(r.steps||[]).reduce((n,s)=>n+(s.min||0),0);
const rtCircle=(icon,c)=>el('span',{class:'oric',style:`--c:${c}`,html:ic(icon,20)});
const rtIcon=r=>el('span',{class:'oric',style:`--c:${colorHex(r.color)}`,html:r.icon&&glyph(r.icon,20)?glyph(r.icon,20):ic((RT_LOOK[r.title]||['routine'])[0],20)});
const runRt=r=>{App.state.player=null;App.go('player',{id:r.id});};
const clockOf=ts=>{const d=new Date(ts);return fmtT(d.getHours()*60+d.getMinutes());};
function viewRoutines(root){
  const list=areaOnly(get.all('routine'),'rt'),page=el('div',{class:'page'}),tk=todayK(),today_=list.filter(r=>rtOn(r,tk)).sort((a,b)=>(a.setTime??9e9)-(b.setTime??9e9)),fin=today_.filter(r=>(r.runs||{})[tk]);
  page.append(orgHead('Routines',today_.length?`${fin.length} of ${today_.length} done today`:list.length?`${list.length} routine${list.length>1?'s':''}`:'',{type:'Routines',menu:()=>[{label:'Archive',icon:'archive',onclick:()=>App.go('archive')}]}));
  page.append(addBar('Add a routine','New routine',()=>routineSheet(null)));
  if(!get.all('routine').length){
    page.append(emptyOf('Your first routine','Line up the steps with a timer, then press play. Life OS walks you through them.'),lblRow('Start from'),el('div',{class:'chips'},RT_TEMPLATES.map(([n,st])=>el('button',{class:'chip','aria-label':`${n} template, ${st.length} steps`,onclick:()=>routineSheet(null,{seed:{title:n,steps:st.map(([t,m])=>({id:uid('s'),t,min:m,habit:null}))}})},n))));
    root.append(page);return;}
  const next=today_.find(r=>!(r.runs||{})[tk]);
  if(next){const st=next.steps||[],m=rtMins(next);page.append(el('div',{class:'card upc'},el('div',{class:'lbl'},next.setTime!=null&&next.setTime<nowMin()?`Still to do · planned ${fmtT(next.setTime)}`:`Up next${next.setTime!=null?' · '+fmtT(next.setTime):''}`),el('button',{class:'oserif',style:'display:block;text-align:left;margin-top:6px',onclick:()=>App.go('routine',{id:next.id})},next.title),el('p',{class:'small muted',style:'margin-top:2px'},[`${st.length} step${st.length!==1?'s':''}`,m?fmtDur(m):''].filter(Boolean).join(' · ')),st.length?el('div',{class:'ostps'},st.slice(0,3).map(s=>el('span',{},s.t)),st.length>3?el('span',{},`+${st.length-3} more`):null):null,btns(btnP('Start now',()=>runRt(next),{icon:'play'}))));}
  fin.forEach(r=>page.append(el('button',{class:'donebar',style:'margin-top:0',onclick:()=>App.go('routine',{id:r.id})},el('span',{},`${r.title} done at ${clockOf(r.runs[tk])}`),el('span',{style:'display:grid',html:ic('check',16,2.4)}))));
  page.append(lblRow(`All routines · ${list.length}`),el('div',{class:'list'},list.map(r=>{const m=rtMins(r),s=rtStreak(r),runs=Object.keys(r.runs||{}).length;return el('div',{class:'li',style:'min-height:68px'},el('button',{class:'grow',style:'display:flex;align-items:center;gap:12px;text-align:left;min-width:0',onclick:()=>App.go('routine',{id:r.id})},rtIcon(r),el('span',{style:'min-width:0;display:block'},el('b',{},r.title),el('small',{class:'ometa'},joinMeta([rtWhen(r).replace(/^Every day/,'Daily'),m?fmtDur(m):'',(r.days||[]).length?(s>1?el('span',{class:'omi'},flameI(),String(s)):''):(runs?`${runs} run${runs>1?'s':''}`:'')].filter(Boolean))))),el('button',{class:'oplay','aria-label':`Run ${r.title}`,html:ic('play',18,2),onclick:()=>runRt(r)}));}).map((n,i)=>{const r=list[i];return withPress(n,(x,y)=>{const done=!!(r.runs||{})[tk];openMenu(x,y,[{label:'Run now',icon:'play',onclick:()=>runRt(r)},{label:done?'Mark not done today':'Mark done today',icon:'check',onclick:()=>{toggleItem({kind:'routine',rec:r},tk);App.refresh();toast(done?'Unmarked':`${r.title} done`,()=>{toggleItem({kind:'routine',rec:r},tk);App.refresh();});}},{label:'Edit',icon:'edit',onclick:()=>routineSheet(r)}]);});})));
  root.append(page);
}
const rtLog=r=>(r.runLog||[]).filter(x=>(r.runs||{})[k(new Date(x.at))]).sort((a,b)=>b.at-a.at);
/* a time for a routine that has none: from when you usually run it, else from its name */
function rtSuggestTime(r){const ts=Object.values(r.runs||{}).filter(v=>typeof v==='number').map(v=>{const d=new Date(v);return d.getHours()*60+d.getMinutes();}).sort((a,b)=>a-b);
  if(ts.length>=3){const m=Math.round(ts[ts.length>>1]/15)*15;return{m,why:`You usually start it around ${fmtT(m)}. With a time, it shows as Up next on Today.`};}
  const n=(r.title||'').toLowerCase(),m=/morning|wake|start/.test(n)?420:/wind|night|evening|bed|sleep/.test(n)?1290:/workout|gym|run|exercise/.test(n)?1080:/lunch|midday/.test(n)?720:/shutdown|end of day|work/.test(n)?1020:480;
  return{m,why:`Without a time it never becomes Up next on Today. ${fmtT(m)} suits a routine called “${r.title}”.`};}
function viewRoutine(root,id){
  const r=get.id(id);if(!r){App.back('routines');return;}const page=el('div',{class:'page'}),steps=r.steps||[],mins=rtMins(r),tk=todayK(),rk=Object.keys(r.runs||{}).sort().reverse(),log=rtLog(r),sched=(r.days||[]).length>0,doneToday=(r.runs||{})[tk],edit=()=>routineSheet(r);
  const avg=log.length?Math.round(log.reduce((n,x)=>n+x.mins,0)/log.length):null,tot=log.reduce((n,x)=>n+(x.marks||[]).length,0),fin=log.reduce((n,x)=>n+(x.marks||[]).filter(Boolean).length,0);
  page.append(el('header',{},el('div',{class:'pghead'},backBtn('Routines','routines'),moreB('Routine options',e=>openMenu(e.clientX,e.clientY,[{label:'Edit',icon:'edit',onclick:edit},{label:'Save as template',icon:'bookmark',onclick:()=>saveTemplate('routine',r)},{label:'Duplicate',icon:'copy',onclick:()=>{const c=create('routine',{title:`${r.title} copy`,steps:(r.steps||[]).map(s=>Object.assign({},s,{id:uid('s')})),days:[],color:r.color,icon:r.icon,area:r.area});App.go('routine',{id:c.id});toast('Routine duplicated');}},{label:'Archive',icon:'archive',onclick:()=>{archiveFlow(r);App.back('routines');}},{label:'Delete',icon:'trash',danger:true,onclick:()=>askConfirm({title:`Delete ${r.title}?`,body:'It stays in Recently deleted for 30 days.',yes:'Delete',no:'Keep it',onYes:()=>{const c=clone(r);remove(r.id);App.back('routines');toast('Routine deleted',()=>put(c));}})}]))),
    el('div',{class:'tags',style:'margin-top:4px'},r.area?pill(r.area,'soft'):null,pill(rtWhen(r),'neu')),el('h1',{class:'pgtitle',style:'margin-top:6px'},r.title),r.notes?el('p',{class:'muted',style:'margin-top:6px;white-space:pre-wrap'},...linkText(r.notes)):null));
  page.append(el('div',{class:'stat3'},el('div',{},el('b',{},String(sched?rtStreak(r):rk.length)),el('small',{},sched?'Runs in a row':'Runs')),el('div',{},el('b',{},avg==null?(mins?String(mins):'–'):String(avg)),el('small',{},avg==null?'Minutes planned':mins?`Average min · plan ${mins}`:'Average min')),el('div',{},el('b',{},tot?`${Math.round(fin/tot*100)}%`:'–'),el('small',{},'Steps finished'))));
  if(sched&&r.setTime==null){const sug=rtSuggestTime(r);page.append(el('section',{class:'card',style:'padding:14px 16px;display:flex;flex-direction:column;gap:10px'},el('b',{style:'font-weight:600'},'Give it a time'),el('p',{class:'small muted'},sug.why),el('div',{style:'display:flex;gap:8px'},btnP(`Set for ${fmtT(sug.m)}`,()=>{r.setTime=sug.m;put(r);toast(`${r.title} set for ${fmtT(sug.m)}`,()=>{r.setTime=null;put(r);});},{style:'flex:1'}),btnL('Pick a time',edit))));}
  page.append(el('button',{class:'btn primary block',html:ic('play',18,2)+(doneToday?'Run it again':'Run routine'),onclick:()=>runRt(r)}));
  if(doneToday)page.append(el('p',{class:'small muted',style:'text-align:center;margin-top:-6px'},typeof doneToday==='number'?`Done today at ${clockOf(doneToday)}`:'Done today'));
  else page.append(el('div',{style:'text-align:center;margin-top:-6px'},lnk('Already did it? Mark done',()=>{r.runs=Object.assign({},r.runs,{[tk]:Date.now()});put(r);toast(`${r.title} marked done`,()=>{const x=Object.assign({},r.runs);delete x[tk];r.runs=x;put(r);});})));
  {const ins=routineInsights(r);if(ins.length)page.append(lblRow(`What your last ${log.length} runs show`),...ins);}
  page.append(el('div',{class:'sh2'},el('span',{class:'lbl'},steps.length?`Steps · ${steps.length}`:'Steps'),lnk('Edit steps',edit)),steps.length?el('div',{class:'list'},steps.map((s,i)=>{const h=s.habit&&get.id(s.habit);return el('div',{class:'li',style:'min-height:56px'},el('span',{class:'onum'},String(i+1)),el('span',{class:'grow'},el('b',{style:'font-weight:500'},s.t),h?el('small',{class:'otime'},`Checks off ${h.title}`):null),s.min?el('small',{class:'small muted'},`${s.min} min`):null);})):el('p',{class:'muted'},'No steps yet.'));
  if(sched&&r.setTime!=null&&mins)page.append(el('p',{class:'small muted',style:'padding-inline:4px'},`Ends around ${fmtT((r.setTime+mins)%1440)}`));
  const plain=rk.filter(d=>!log.some(x=>k(new Date(x.at))===d)).map(d=>({at:typeof r.runs[d]==='number'?r.runs[d]:fromK(d).getTime(),d})),recent=[...log,...plain].sort((a,b)=>b.at-a.at).slice(0,5);
  page.append(lblRow('Recent runs'),recent.length?el('div',{class:'list'},recent.map(x=>{const m=x.marks,sk=x.skippedNames||[];return el('div',{class:'li',style:'min-height:60px'},el('span',{class:'grow'},el('b',{style:'font-weight:500'},`${relDay(k(new Date(x.at)))}, ${clockOf(x.at)}`),el('small',{},m?`${x.mins} min · ${sk.length?`skipped ${sk.join(', ')}`:`all ${m.length} steps`}`:'Marked done')),m?el('span',{class:'odots ominid','aria-hidden':'true'},m.map(v=>el('i',{class:v?'on':'skip'}))):null);})):el('p',{class:'small muted',style:'padding-inline:4px'},'Not run yet.'));
  page.append(lblRow('Details'),el('div',{class:'group'},detailRow('rep','How often',sched?rtWhen(r).split(' · ')[0]:'On demand',edit),sched?detailRow('time','Time of day',r.setTime!=null?fmtT(r.setTime):'Anytime',edit):null,sched&&r.setTime!=null?detailRow('bell','Reminder',r.reminder!=null?(r.reminder?'Before the time':`At ${fmtT(r.setTime)}`):'None',edit):null,detailRow('leaf','Life Area',r.area||'None',edit),detailRow('palette','Icon and color','',edit)));
  if(r.createdAt)page.append(el('p',{class:'small muted',style:'padding-inline:4px'},`Created ${relDay(k(new Date(r.createdAt)))}`));
  root.append(page);
}

/* ---------- Lists ---------- */
const listLeft=l=>(l.items||[]).filter(i=>!i.d).length;
const listSub=l=>{const it=l.items||[];return it.length?(listLeft(l)?`${listLeft(l)} left`:'All checked'):'Empty';};
function renameList(l){let v=l.title,inst;inst=openSheet({title:'Rename list',left:{label:'Cancel'},right:{label:'Done',onclick:()=>{if(v.trim()){l.title=v.trim();put(l);}inst.close();}},build:b=>{const T=fieldTitle('f-rename','Name','',v,x=>v=x);b.append(T.wrap);}});}
/* sort a list's items for good; sections keep their order, unticked items stay above ticked ones */
function sortList(l,how){const before=clone(l.items||[]),secs=(l.sections||[]).map(x=>x.id||x),si=i=>{const j=secs.indexOf(i.sec);return j<0?-1:j;},az=(a,b)=>a.t.localeCompare(b.t,undefined,{sensitivity:'base',numeric:true});
  l.items=(l.items||[]).slice().sort(how==='sec'?(a,b)=>si(a)-si(b)||(a.d-b.d)||az(a,b):(a,b)=>(a.d-b.d)||az(a,b));put(l);toast(how==='sec'?'Sorted by section':'Sorted A to Z',()=>{l.items=before;put(l);});}
function listItems(l,{onPage=false}={}){const leave=()=>{if(onPage)App.back('lists');};return[{label:'Rename',icon:'edit',onclick:()=>renameList(l)},onPage?{label:'Add a section',icon:'list',onclick:()=>sectionNameSheet(l)}:null,{label:l.pinned?'Unpin':'Pin to top',icon:'pin',onclick:()=>{l.pinned=!l.pinned;if(l.pinned)App.state._pinDrop=l.id;put(l);}},{label:l.reusable?'Stop reusing':'Make reusable',icon:'rep',onclick:()=>{l.reusable=!l.reusable;put(l);}},(l.items||[]).length>2?{label:'Sort A to Z',icon:'list',onclick:()=>sortList(l,'az')}:null,(l.items||[]).length>2&&(l.sections||[]).length?{label:'Sort by section',icon:'list',onclick:()=>sortList(l,'sec')}:null,{label:'Copy as text',icon:'list',onclick:()=>copyList(l)},{label:'Save as template',icon:'bookmark',onclick:()=>saveTemplate('list',l)},{label:'Duplicate',icon:'copy',onclick:()=>{const c=create('list',{title:`${l.title} copy`,items:(l.items||[]).map(i=>Object.assign({},i,{id:uid('i'),d:false})),sections:clone(l.sections||[]),reusable:l.reusable});toast('List duplicated',()=>remove(c.id,{silent:false}));App.go('list',{id:c.id});}},{label:'Archive list',icon:'archive',onclick:()=>{archiveFlow(l);leave();}},{label:'Delete list',icon:'trash',danger:true,onclick:()=>{const c=clone(l);remove(l.id);leave();toast('List deleted',()=>put(c));}}];}
const listMenu=l=>(x,y)=>openMenu(x,y,listItems(l));
function moveItemSheet(l,i){let inst;inst=openSheet({title:`Move “${i.t}”`,left:{label:'Cancel'},build:b=>{b.append(el('div',{class:'list'},get.all('list').filter(x=>x.id!==l.id).map(x=>el('button',{class:'li',style:'min-height:54px',onclick:()=>{const fromB=clone(l.items),toB=clone(x.items||[]);l.items=l.items.filter(y=>y.id!==i.id);x.items=[...(x.items||[]),Object.assign({},i,{sec:null})];put(l,{silent:true});put(x);inst.close();toast(`Moved to ${x.title}`,()=>{l.items=fromB;x.items=toB;put(l,{silent:true});put(x);},'Undo',{open:dest('list',{id:x.id})});}},el('span',{class:'grow'},el('b',{style:'font-weight:500'},x.title),el('small',{},listSub(x))),el('span',{class:'chev',html:ic('chevr',16,2)})))));}});}
function listText(l){const it=l.items||[],secs=l.sections||[],line=i=>`${i.d?'☑':'☐'} ${i.t}${i.note?` (${i.note})`:''}`;const out=[l.title,''];it.filter(i=>!i.sec||!secs.some(s=>s.id===i.sec)).forEach(i=>out.push(line(i)));secs.forEach(s=>{const g=it.filter(i=>i.sec===s.id);if(g.length){out.push('',s.name);g.forEach(i=>out.push(line(i)));}});return out.join('\n');}
async function copyList(l){const t=listText(l);try{if(navigator.share&&isTouch()){await navigator.share({title:l.title,text:t});return;}}catch(e){if(e&&e.name==='AbortError')return;}try{await navigator.clipboard.writeText(t);toast('List copied');}catch(e){toast('Copying isn’t available here.');}}
function sectionNameSheet(l,sec=null,after=null){let v=sec?sec.name:'',inst;const save=()=>{if(!v.trim())return;let made=sec;if(sec)sec.name=v.trim();else{made={id:uid('c'),name:v.trim()};l.sections=[...(l.sections||[]),made];}put(l);inst.close();after&&after(made);};inst=openSheet({title:sec?'Rename section':'New section',left:{label:'Cancel'},right:{label:sec?'Done':'Add',onclick:save},build:b=>{const T=fieldTitle('f-sec-name','Section name','Produce, Dairy, Carry-on…',v,x=>v=x,save);b.append(T.wrap);focusIfKeyboard(T.input);}});}
function qtyParts(t){const m=String(t).match(/^(.+?)\s*[x×]\s?(\d{1,3})$/i)||String(t).match(/^(\d{1,3})\s?[x×]\s+(.+)$/i);if(!m)return[el('span',{class:'tt'},t)];const[name,n]=/^\d/.test(m[1])?[m[2],m[1]]:[m[1],m[2]];return[el('span',{class:'tt'},name),el('span',{class:'qty','aria-label':`quantity ${n}`},`×${n}`)];}
function deleteItem(l,i){const before=l.items.slice();l.items=l.items.filter(x=>x!==i);put(l);toast(`${i.t} deleted`,()=>{l.items=before;put(l);});}
function itemSheet(l,i){let v=i.t,n=i.note||'',sec=i.sec||null,inst;const ph={photos:i.photos||[]};
  inst=openSheet({title:'Edit item',left:{label:'Cancel'},right:{label:'Save',onclick:()=>{if(v.trim())i.t=v.trim();i.note=n.trim();i.sec=sec;i.photos=ph.photos;put(l);inst.close();}},build:b=>{const T=fieldTitle('f-item','Item','',v,x=>v=x),N=fieldTitle('f-item-note','Detail','1 dozen, the good ones…',n,x=>n=x),chips=el('div',{class:'chips'});
    const draw=()=>{chips.innerHTML='';[{id:null,name:'No section'},...(l.sections||[])].forEach(c=>chips.append(el('button',{class:'chip'+(sec===c.id?' on':''),'aria-pressed':String(sec===c.id),onclick:()=>{sec=c.id;draw();}},c.name)));chips.append(el('button',{class:'chip dash',onclick:()=>sectionNameSheet(l,null,c=>{sec=c.id;draw();})},'+ New section'));};draw();
    b.append(T.wrap,N.wrap,el('div',{class:'sect'},'Section'),chips,el('div',{class:'sect'},'Attached'),photosEditor(ph),el('button',{class:'delete',onclick:()=>{inst.close();deleteItem(l,i);}},'Delete item'));}});}

/* Swipe a row left to show Delete. A long swipe deletes straight away. */
let swipeOpen=null;
function swipeRow(row,label,onDelete){
  row.classList.add('oswr');const btn=el('button',{class:'oswd',tabindex:-1,'aria-label':`Delete ${label}`,onclick:e=>{e.stopPropagation();onDelete();}},'Delete');row.append(btn);
  const W=84,set=(x,anim)=>{row.classList.toggle('oswa',!!anim);row.style.setProperty('--sx',`${x}px`);};
  const shut=()=>{set(0,true);row._open=false;if(swipeOpen===row)swipeOpen=null;};row._shut=shut;
  let sx,sy,on=false,armed=false,base=0,last=0,id=null;
  row.addEventListener('pointerdown',e=>{if(swipeOpen&&swipeOpen!==row)swipeOpen._shut();if(e.target.closest('.oswd,.grip,.tick-hit,.oix'))return;sx=e.clientX;sy=e.clientY;armed=true;on=false;id=e.pointerId;base=row._open?-W:0;last=base;});
  row.addEventListener('pointermove',e=>{if(!armed||e.pointerId!==id)return;const dx=e.clientX-sx,dy=e.clientY-sy;if(!on){if(Math.abs(dy)>10){armed=false;return;}if(Math.abs(dx)<10)return;on=true;row._swiped=Date.now();try{row.setPointerCapture(id);}catch(err){}}
    row._swiped=Date.now();last=Math.min(0,base+dx);set(last);});
  const end=()=>{if(!armed)return;armed=false;if(!on)return;row._swiped=Date.now();if(last<-row.offsetWidth*.6){set(-row.offsetWidth,true);setTimeout(onDelete,160);return;}if(last<-W/2){set(-W,true);row._open=true;swipeOpen=row;}else shut();};
  row.addEventListener('pointerup',end);row.addEventListener('pointercancel',end);
  row.addEventListener('click',e=>{if(e.target.closest('.oswd'))return;if(Date.now()-(row._swiped||0)<350||row._open){e.stopPropagation();e.preventDefault();if(row._open)shut();}},true);
}
function viewLists(root){
  const ls=get.all('list'),page=el('div',{class:'page'}),pinned=ls.filter(l=>l.pinned),rest=ls.filter(l=>!l.pinned).sort((a,b)=>(b.updatedAt||b.createdAt||0)-(a.updatedAt||a.createdAt||0));
  page.append(orgHead('Lists',ls.length?`${ls.length} list${ls.length>1?'s':''}`:'',{type:'Lists',menu:()=>[{label:'Archive',icon:'archive',onclick:()=>App.go('archive')}]}));
  page.append(addBar('Add a list','New list',newListSheet));
  if(!ls.length){page.append(emptyOf('Your first list','Groceries, packing, gift ideas, anything. Reusable lists uncheck in one tap for next time.'),lblRow('Start from'),el('div',{class:'chips'},LIST_TEMPLATES.map(([n,it,re])=>el('button',{class:'chip',onclick:()=>makeList(n,it,re)},n))));root.append(page);return;}
  const go=l=>App.go('list',{id:l.id}),del=l=>{const c=clone(l);remove(l.id);toast('List deleted',()=>put(c));};
  if(pinned.length)page.append(lblRow('Pinned'),el('div',{class:'ogrid'},pinned.map(l=>{const it=l.items||[],open=it.filter(i=>!i.d);return withPress(el('button',{class:'opin','data-k':'lst:'+l.id,onclick:()=>go(l)},el('span',{class:'opinic','aria-hidden':'true',html:ic('pin',14,2)}),el('b',{},l.title),el('small',{class:'opc'},listSub(l)),l.reusable&&it.length?(open.length?meter((it.length-open.length)/it.length):el('span',{class:'chip',role:'button',style:'height:30px;margin-top:6px;align-self:flex-start',onclick:e=>{e.stopPropagation();const b=clone(l.items);l.items.forEach(i=>i.d=false);put(l);toast(`${l.title} reset`,()=>{l.items=b;put(l);});}},'Reset')):el('span',{class:'oprev'},open.slice(0,3).map(i=>el('span',{},el('i'),i.t)))),listMenu(l));})));
  if(rest.length){if(pinned.length)page.append(lblRow('All lists'));page.append(el('div',{class:'list'},rest.map(l=>{const when=timeAgo(l.updatedAt||l.createdAt),row=withPress(el('div',{class:'li',style:'min-height:60px;padding-right:6px','data-k':'lst:'+l.id},el('button',{class:'grow',style:'text-align:left;min-width:0',onclick:()=>go(l)},el('b',{},l.title),el('small',{},[listSub(l),when==='Today'?'':`Updated ${when.toLowerCase()}`,l.reusable?'Reusable':''].filter(Boolean).join(' · '))),el('span',{class:'olm'},moreB(`${l.title} options`,e=>{e.stopPropagation();const r=e.currentTarget.getBoundingClientRect();openMenu(r.right,r.bottom+2,listItems(l));}))),listMenu(l));swipeRow(row,l.title,()=>del(l));return row;})));}
  root.append(page);
}
function viewList(root,id){
  const l=get.id(id),S=App.state;if(!l){App.back('lists');return;}l.items=l.items||[];l.sections=l.sections||[];const page=el('div',{class:'page olist'});
  /* an item whose section is gone falls back to no section */
  const secOf=i=>l.sections.some(c=>c.id===i.sec)?i.sec:null;
  const open=l.items.filter(i=>!i.d),chk=l.items.filter(i=>i.d),refocus=S.listFocus,editing=S.listEdit===id;S.listFocus=null;if(S.listAddFor!==id){S.listAddSec=null;S.listAddFor=id;}
  const setEdit=on=>{S.listEdit=on?id:null;App.refresh();};
  page.append(pageHead(l.title,open.length?`${open.length} left`:l.items.length?'All checked':'',{back:'Lists',to:'lists',actions:[(l.items.length||l.sections.length)?el('button',{class:'linkbtn olt','aria-pressed':String(editing),onclick:()=>setEdit(!editing)},editing?'Done':'Edit'):null,moreB('List options',e=>{const r=e.currentTarget.getBoundingClientRect();openMenu(r.right,r.bottom+4,listItems(l,{onPage:true}));})]}));
  const adder=(sec,ph)=>{const inputId=sec?`li-new-${sec}`:'li-new',save=()=>{const raw=inp.value.trim();if(!raw)return false;const m=raw.match(/^(.+?),\s+(.+)$/),t=m?m[1]:raw;listPush(l,t,m?m[2]:'',sec||listSecGuess(l,t));inp.value='';put(l,{silent:true});return true;},inp=el('input',{id:inputId,placeholder:ph,'aria-label':ph,autocomplete:'off',enterkeyhint:'done',onkeydown:e=>{if(e.key==='Enter'&&save()){S.listFocus=inputId;App.refresh();}},onpaste:e=>pasteLines(e,ls=>{ls.forEach(t=>listPush(l,t,'',sec||listSecGuess(l,t)));put(l,{silent:true});toast(`${ls.length} items added`);S.listFocus=inputId;App.refresh();}),onblur:()=>{const had=save();if(sec&&S.listAddSec===sec)S.listAddSec=null;if(had||sec)setTimeout(()=>{if(!(document.activeElement&&document.activeElement.id===inputId))App.refresh();},250);}});return inp;};
  if(!editing){const top=adder(null,'Add an item'),sg=listSuggestBox(l,top,S);top.addEventListener('input',sg._draw);page.append(el('label',{class:'oaddf'},el('span',{style:'display:grid',html:ic('plus',20,2)}),top),sg);const us=listUsuals(l,S);if(us)page.append(...us);}
  if(!l.items.length&&!l.sections.length)page.append(el('p',{class:'small muted',style:'padding-inline:4px;margin-top:-6px'},'Press return to keep adding. Add a detail with a comma: Eggs, 1 dozen'));
  const grip=t=>el('span',{class:'grip','aria-label':`Drag ${t} to reorder`,html:sv('<circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/>',18)});
  const row=i=>{const r=el('div',{class:'li tick-host'+(i.d?' done':''),style:'min-height:50px','data-k':'li:'+(i.id||i.t)},el('span',{class:'tick-hit'},tickBtn(i.d,on=>{r.classList.toggle('done',on);i.d=on;put(l,{silent:true});setTimeout(()=>App.refresh(),820);})),el('button',{class:'grow',style:'display:flex;align-items:center;justify-content:space-between;gap:10px;text-align:left;min-height:32px;min-width:0','aria-label':`Edit ${i.t}`,onclick:()=>itemSheet(l,i)},el('span',{style:'min-width:0'},...qtyParts(i.t),(i.photos||[]).length?el('small',{},`${i.photos.length} photo${i.photos.length>1?'s':''}`):null),i.note?el('span',{class:'small muted',style:'flex:none;max-width:45%;text-align:right'},i.note):null),editing?el('button',{class:'oix','aria-label':`Delete ${i.t}`,html:ic('x',15,2.2),onclick:()=>deleteItem(l,i)}):null);
    if(!editing)swipeRow(r,i.t,()=>deleteItem(l,i));
    onPress(r,(x,y)=>openMenu(x,y,[{label:'Edit',icon:'edit',onclick:()=>itemSheet(l,i)},{label:'Reorder',icon:'list',onclick:()=>setEdit(true)},get.all('list').length>1?{label:'Move to another list',icon:'arrow',onclick:()=>moveItemSheet(l,i)}:null,{label:'Delete',icon:'trash',danger:true,onclick:()=>deleteItem(l,i)}]),'.tick-hit,.grip,.oix,.oswd');r.addEventListener('click',e=>{if(Date.now()-(r._pressed||0)<700){e.stopPropagation();e.preventDefault();}},true);return r;};
  const block=sec=>{const sid=sec?sec.id:null,g=open.filter(i=>secOf(i)===sid),box=el('div',{class:'list'});
    g.forEach((i,n)=>{const r=row(i);if(editing&&g.length>1){r.setAttribute('data-i',String(n));const h=grip(i.t);r.append(h);reorderable(h,r,box,()=>{const o=[...box.children].filter(c=>c.hasAttribute('data-i')).map(c=>g[+c.dataset.i]);l.items=[...l.items.filter(x=>!g.includes(x)),...o];put(l);});}box.append(r);});
    if(sec){const at=l.sections.indexOf(sec),move=d=>{const j=at+d;[l.sections[at],l.sections[j]]=[l.sections[j],l.sections[at]];put(l);},more=e=>{const r=e.currentTarget.getBoundingClientRect();openMenu(r.right,r.bottom+2,[{label:'Rename section',icon:'edit',onclick:()=>sectionNameSheet(l,sec)},at>0?{label:'Move up',icon:'chevu',onclick:()=>move(-1)}:null,at<l.sections.length-1?{label:'Move down',icon:'chevd',onclick:()=>move(1)}:null,{label:'Delete section',icon:'trash',danger:true,onclick:()=>{const bS=l.sections.slice(),bI=clone(l.items);l.sections=l.sections.filter(c=>c!==sec);l.items.forEach(i=>{if(i.sec===sid)i.sec=null;});put(l);toast('Section deleted. Its items stayed.',()=>{l.sections=bS;l.items=bI;put(l);});}}]);};
      const addSec=()=>{S.listAddSec=sid;App.refresh();const n=document.getElementById(`li-new-${sid}`);if(n)n.focus();};
      page.append(el('div',{class:'osech'},el('span',{class:'lbl'},sec.name),g.length?el('span',{class:'small muted tnum'},String(g.length)):null,el('span',{style:'flex:1'}),editing?moreB(`${sec.name} options`,more):el('button',{class:'oplus','aria-label':`Add to ${sec.name}`,html:ic('plus',20,2),onclick:addSec})));
      if(S.listAddSec===sid)box.append(el('label',{class:'oaddi'},el('span',{style:'display:grid',html:ic('plus',18,2)}),adder(sid,`Add to ${sec.name}`)));
      if(box.children.length)page.append(box);}
    else if(g.length)page.append(box);};
  block(null);l.sections.forEach(block);
  if(editing)page.append(el('button',{class:'oaddsec',onclick:()=>sectionNameSheet(l)},el('span',{style:'display:grid',html:ic('plus',18,2)}),'Add a section'));
  if(!open.length&&chk.length)page.append(el('div',{class:'ozero',style:'padding-block:14px 2px'},el('span',{class:'ozi',style:'width:64px;height:64px',html:ic('check',28,2)}),el('h2',{style:'font-size:24px'},'Everything’s checked off'),l.reusable?el('p',{},'Uncheck all to use this list again.'):null));
  if(chk.length){const openC=S.listChecked!==false;page.append(el('div',{class:'osech'},el('button',{class:'ochkt','aria-expanded':String(openC),onclick:()=>{S.listChecked=!openC;App.refresh();}},el('span',{class:'lbl'},`Checked · ${chk.length}`),el('span',{style:'display:grid;color:var(--ink-3)',html:ic(openC?'chevu':'chevd',15,2.2)})),el('span',{style:'flex:1'}),openC?lnk('Uncheck all',()=>{const b=clone(l.items);l.items.forEach(i=>i.d=false);put(l);toast('Unchecked',()=>{l.items=b;put(l);});}):null,openC?lnk('Clear checked',()=>{const b=clone(l.items);l.items=l.items.filter(i=>!i.d);put(l);toast('Cleared',()=>{l.items=b;put(l);});}):null));
    if(openC)page.append(el('div',{class:'list'},chk.map(row)));}
  root.append(page);if(refocus)setTimeout(()=>{const n=document.getElementById(refocus);n&&n.focus({preventScroll:true});},30);
}

/* ---------- Shared page rows ---------- */
const detailRow=(icon,label,val,fn,{on=false,trailing=null}={})=>el(fn?'button':'div',{class:'row',onclick:fn||null},el('span',{class:'ic',html:ic(icon)}),el('span',{},label),trailing||el('span',{class:'ovalr'+(on?' on':'')},el('span',{class:'clip'},val),fn?el('span',{style:'display:grid',html:ic('chevr',16,2)}):null));
const switchEl=(on,label,fn)=>el('button',{class:'sw'+(on?' on':''),role:'switch','aria-checked':String(on),'aria-label':label,onclick:e=>{e.stopPropagation();fn(!on);}});
const hideToast=()=>{const t=$('#toast');t&&t.classList.remove('on');};

/* ---------- One habit ---------- */
function habitBest(h){if(habitWeekly(h))return habitStreak(h).n;const ds=Object.keys(h.logs||{}).filter(d=>habitDone(h,d)).sort();if(!ds.length)return 0;let best=0,run=0,d=ds[0];const end=ds[ds.length-1];for(let i=0;i<4000&&d<=end;i++){if(h.days.includes(monIdx(fromK(d)))){if(habitDone(h,d)){run++;best=Math.max(best,run);}else if(!(h.skips&&h.skips[d]))run=0;}d=addK(d,1);}return Math.max(best,habitStreak(h).n);}
function habitMonthRate(h,y,m){const tk=todayK(),st=habitStart(h),len=new Date(y,m+1,0).getDate();let due=0,n=0;for(let i=1;i<=len;i++){const d=k(new Date(y,m,i));if(d>tk||d<st)continue;if(h.paused&&!habitDone(h,d)&&(!h.pausedAt||d>=k(new Date(h.pausedAt))))continue;if(habitWeekly(h)){due++;if(habitDone(h,d))n++;continue;}if(!h.days.includes(monIdx(fromK(d)))||(h.skips&&h.skips[d]))continue;const dn=habitDone(h,d);if(d===tk&&!dn)continue;due++;if(dn)n++;}if(!due)return null;return habitWeekly(h)?Math.min(1,n/Math.max(1,(h.target||1)*due/7)):n/due;}
function viewHabit(root,id){
  const h=get.id(id);if(!h){App.back('habits');return;}const S=App.state,tk=todayK(),page=el('div',{class:'page'+(h.paused?' held':'')});
  const v=S.habMonth||monthKey(today()),y=+v.slice(0,4),m=+v.slice(5)-1,s=h.paused&&h.pausedStreak?h.pausedStreak:habitStreak(h),weekly=habitWeekly(h),best=habitBest(h),rate=habitMonthRate(h,y,m),parent=h.part&&get.id(h.part),edit=()=>habitSheet(h);
  const skipped=!!(h.skips&&h.skips[tk]),done=habitDone(h,tk);
  const when=[h.track==='time'?`${h.goalN} min`:h.track==='count'?`${h.goalN} ${h.unit||'a day'}`:null,habitSched(h),h.setTime!=null?fmtT(h.setTime):null].filter(Boolean);
  page.append(el('header',{},el('div',{class:'pghead'},backBtn('Habits','habits'),moreB('Habit options',e=>openMenu(e.clientX,e.clientY,[{label:'Edit',icon:'edit',onclick:edit},{label:h.paused?'Resume':'Pause',icon:'time',onclick:()=>{setHabitPaused(h,!h.paused);toast(h.paused?'Paused. History kept.':'Resumed');}},{label:'Mark as built',icon:'star',onclick:()=>{h.archived=true;h.built=true;h.archivedAt=Date.now();put(h);App.back('habits');toast(`${h.title} is built. Find it in Archive.`);}},{label:'Archive',icon:'archive',onclick:()=>{archiveFlow(h);App.back('habits');}},{label:'Delete',icon:'trash',danger:true,onclick:()=>askConfirm({title:`Delete ${h.title}?`,body:'Its history goes too. It stays in Recently deleted for 30 days.',yes:'Delete',no:'Keep it',onYes:()=>{const c=clone(h);remove(h.id);App.back('habits');toast('Habit deleted',()=>put(c));}})}]))),
    (h.area||h.paused||(h.tod&&h.tod!=='anytime'&&h.tod!=='set'))?el('div',{class:'tags',style:'margin-top:4px'},h.paused?(()=>{const p=pill('Paused','warn');p.dataset.hb='1';return p;})():null,h.area?pill(h.area,'soft'):null,h.tod&&h.tod!=='anytime'&&h.tod!=='set'?pill((TOD.find(t=>t[0]===h.tod)||[])[1],'neu'):null):null,
    el('h1',{class:'pgtitle',style:'margin-top:6px'},h.title),h.notes?el('p',{class:'muted',style:'margin-top:6px;white-space:pre-wrap'},...linkText(h.notes)):null,el('div',{class:'small muted',style:'margin-top:6px'},when.join(' · ')),usualTime(h)?el('div',{class:'small',style:'margin-top:4px;color:var(--ink-2)'},`You usually do this around ${usualTime(h)}`):null));
  page.append(el('div',{class:'stat3'},el('div',{},el('b',{},String(s.n)),el('small',{},weekly?'Week streak':'Day streak')),el('div',{},el('b',{},String(best)),el('small',{},'Best streak')),(()=>{const cur=v===monthKey(today()),r=cur?habitRate(h):rate;return el('div',{},el('b',{},r==null?'New':`${Math.round(r*100)}%`),el('small',{},cur?'Last 30 days':MONL[m]));})()));
  const skipBtn=btnL(skipped?'Skipped':'Skip today',()=>{const was=clone(h.skips||{}),wasL=clone(h.logs||{});h.skips=h.skips||{};if(skipped)delete h.skips[tk];else{h.skips[tk]=true;if(h.logs)delete h.logs[tk];}put(h);toast(skipped?'Skip removed':'Skipped today. Your streak is safe.',()=>{h.skips=was;h.logs=wasL;put(h);});});
  const mainBtn=h.track==='count'?btnP(`+1 · ${typeof (h.logs||{})[tk]==='number'?h.logs[tk]:0} of ${h.goalN}`,()=>logHabit(h,tk,1)):h.track==='time'?btnP(`Log time · ${habitMeta(h,tk)}`,()=>logTimeSheet(h,tk)):el('button',{class:'btn '+(done?'quiet':'primary'),onclick:()=>{toggleItem({kind:'habit',rec:h},tk);App.refresh();}},done?'Done today. Tap to undo':'Done today');
  page.append(h.paused?el('div',{class:'ochk ohact'},btnP('Resume habit',()=>{setHabitPaused(h,false);toast('Resumed');App.refresh();},{style:'flex:1'})):el('div',{class:'ochk ohact'},weekly?null:skipBtn,mainBtn));
  if(missedYesterday(h)&&!done)page.append(el('div',{class:'donebar warn',style:'margin-top:0'},'Missed yesterday. Never miss twice.'));
    {const start=h.startDate||k(new Date(h.createdAt||Date.now())),now=today(),ms=[];for(let i=11;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);if(k(new Date(d.getFullYear(),d.getMonth()+1,0))<start)continue;ms.push([d.getFullYear(),d.getMonth()]);}
    if(ms.length>=2){const rs=ms.map(([yy,mm])=>habitMonthRate(h,yy,mm)),bestI=rs.reduce((bi,r,i)=>(r||0)>(rs[bi]||0)?i:bi,0);
      page.append(lblRow('By month',`Best: ${MONL[ms[bestI][1]]}${rs[bestI]!=null?` · ${Math.round(rs[bestI]*100)}%`:''}`),el('section',{class:'card hmonths'},el('div',{class:'hmbars'},ms.map(([yy,mm],i)=>{const r=rs[i],on=v===`${yy}-${String(mm+1).padStart(2,'0')}`;return el('button',{class:'hmb'+(on?' on':''),'aria-label':`${MONL[mm]} ${yy}: ${r==null?'no data':Math.round(r*100)+'%'}`,onclick:()=>{S.habMonth=`${yy}-${String(mm+1).padStart(2,'0')}`;App.refresh();}},el('span',{class:'hmv'},r==null?'–':`${Math.round(r*100)}`),el('i',{style:`height:${Math.max(3,Math.round((r||0)*64))}px`}),el('small',{},MONL[mm].slice(0,1)));}))));}}
/* history */
  const ws=get.settings().weekStart??1,first=new Date(y,m,1),lead=(first.getDay()-ws+7)%7,len=new Date(y,m+1,0).getDate(),g=el('div',{class:'calgrid'},Array.from({length:7},(_,i)=>el('span',{},DOW[(ws+i)%7][0])));
  for(let i=0;i<lead;i++)g.append(el('i'));
  for(let d=1;d<=len;d++){const dk=k(new Date(y,m,d)),on=habitDone(h,dk),sk=h.skips&&h.skips[dk],miss=habitDotState(h,dk)==='miss';g.append(el('button',{class:[on?'on':sk?'skip':miss?'miss':'',dk===tk?'isday':''].filter(Boolean).join(' '),disabled:dk>tk,'aria-label':shortDay(dk)+(dk===tk?', today':'')+(on?', done':sk?', skipped':miss?', missed':''),'aria-pressed':String(on),'data-hd':dk,onclick:()=>{if(h.track==='time'){logTimeSheet(h,dk);return;}App.state._hcFill={dk,on:!on};const was=clone(h.logs||{}),wasS=clone(h.skips||{});h.logs=h.logs||{};if(on)delete h.logs[dk];else{h.logs[dk]=h.track==='count'?h.goalN:true;if(h.skips)delete h.skips[dk];}put(h);const n=habitStreak(h);toast(`${relDay(dk)} ${on?'cleared':'filled in'}${n.n?` · ${n.n}-${n.unit} streak`:''}`,()=>{h.logs=was;h.skips=wasS;put(h);});}},String(d)));}
  const shift=n=>{const x=new Date(y,m+n,1);S.habMonth=monthKey(x);App.refresh();};
  page.append(el('div',{class:'sh2'},el('span',{class:'lbl'},'History'),el('span',{class:'small muted'},'Tap a day to fill it in')),el('div',{class:'card',style:'padding:14px'},el('div',{class:'pghead',style:'margin-bottom:8px'},el('button',{class:'iconbtn green','aria-label':'Previous month',html:ic('chevl',20,2),onclick:()=>shift(-1)}),el('b',{},`${MONL[m]} ${y}`),el('button',{class:'iconbtn green','aria-label':'Next month',disabled:v===monthKey(today()),html:ic('chevr',20,2),onclick:()=>shift(1)})),g,el('div',{class:'olegend',style:'margin-top:12px;padding:0'},[['on','Done'],['miss','Missed'],['skip','Skipped']].map(([c,t])=>el('span',{},el('span',{class:'odots'},el('i',{class:c})),t)))));
  if(parent)page.append(lblRow('Part of'),el('div',{class:'list'},el('button',{class:'li',style:'min-height:60px',onclick:()=>App.go('plan',{id:parent.id})},rtCircle('target','#466B5A'),el('span',{class:'grow'},el('b',{style:'font-weight:500'},parent.title),el('small',{},[KINDN[parent.kind]||'Goal',parent.kind==='goal'?goalTrackText(parent):'',parent.kind==='goal'?goalPace(parent):''].filter(Boolean).join(' · '))),el('span',{class:'chev',html:ic('chevr',16,2)}))));
  page.append(lblRow('Details'),el('div',{class:'group'},detailRow('rep','How often',habitSched(h),edit),detailRow('time','Time of day',h.tod==='set'&&h.setTime!=null?fmtT(h.setTime):(TOD.find(t=>t[0]===(h.tod||'anytime'))||TOD[0])[1],edit),detailRow('hour','Track by',h.track==='time'?`Time · ${h.goalN} min`:h.track==='count'?`Count · ${h.goalN}${h.unit?' '+h.unit:''}`:'Check off',edit),detailRow('bell','Reminder',h.reminder!=null&&h.setTime!=null?(h.reminder?'Before the time':`At ${fmtT(h.setTime)}`):'None',edit),detailRow('leaf','Life Area',h.area||'None',edit),detailRow('play','Status',h.paused?'Paused':'Active',()=>{setHabitPaused(h,!h.paused);toast(h.paused?'Paused. History kept.':'Resumed');App.refresh();})));
  page.append(el('p',{class:'small muted',style:'padding-inline:4px'},`Started ${relDay(habitStart(h))}`));
  root.append(page);
}

/* ---------- One goal: the parts below the title ---------- */
function goalCheckSheet(g){let mood=null,note='',inst;const open=(g.steps||[]).filter(s=>!s.d).slice(0,2),picks=new Set();
  inst=openSheet({title:'Check in',left:{label:'Cancel'},right:{label:'Save',onclick:()=>{if(!mood&&!picks.size){toast('Pick how it’s going first');return;}picks.forEach(id=>{const s=g.steps.find(x=>x.id===id);if(s){s.d=true;s.doneAt=Date.now();}});g.checks=[...(g.checks||[]),{date:todayK(),status:mood||'Going well',note:note.trim()}];g.checkAt=todayK();put(g);inst.close();toast('Check-in saved');}},build:b=>{
    const moods=el('div',{class:'chips'}),draw=()=>{moods.innerHTML='';['Going well','A bit stuck','Off track'].forEach(m=>moods.append(el('button',{class:'chip'+(mood===m?' on':''),'aria-pressed':String(mood===m),onclick:()=>{mood=m;draw();}},m)));};draw();
    b.append(el('p',{class:'serif',style:'font-size:20px;overflow-wrap:anywhere'},g.title),el('div',{class:'sect'},'How’s it going?'),moods);
    if(open.length)b.append(el('div',{class:'sect'},'Anything to check off?'),el('div',{class:'list'},open.map(s=>el('div',{class:'li tick-host',style:'min-height:52px'},el('span',{class:'tick-hit'},tickBtn(false,on=>{if(on)picks.add(s.id);else picks.delete(s.id);})),el('span',{class:'grow'},el('span',{class:'tt'},s.t),s.date?el('small',{},relDay(s.date)):null)))));
    b.append(fieldNotes('f-ci-note','A quick note','What helped, what got in the way','',v=>note=v));}});}
function milestoneSheet(g,s=null){let v=s?s.t:'',inst;const save=()=>{if(!v.trim())return;if(s)s.t=v.trim();else g.steps=[...(g.steps||[]),{id:uid('s'),t:v.trim(),d:false}];put(g);inst.close();};inst=openSheet({title:s?'Edit milestone':'Add a milestone',left:{label:'Cancel'},right:{label:s?'Save':'Add',onclick:save},build:b=>{const T=fieldTitle('f-ms','Milestone','Run 5K without stopping',v,x=>v=x,save);b.append(T.wrap);if(s)b.append(el('button',{class:'delete',onclick:()=>{const before=g.steps.slice();g.steps=g.steps.filter(x=>x!==s);put(g);inst.close();toast('Milestone deleted',()=>{g.steps=before;put(g);});}},'Delete milestone'));else focusIfKeyboard(T.input);}});}
function goalBody(page,r){
  const pc=goalProgress(r),pa=goalPace(r),tr=r.track||'milestones',st=r.steps||[],done=st.filter(s=>s.d).length,edit=()=>goalSheet(r);
  const wk=r.deadline?Math.round(dayCount(r.deadline)/7):null;
  page.append(el('div',{class:'card',style:'display:flex;gap:16px;align-items:center;padding:16px'},tr==='done'?el('span',{class:'oric',style:'width:64px;height:64px',html:ic(r.finished?'check':'target',28)}):el('span',{class:'ring',style:`--p:${pc*100}`},el('span',{},`${Math.round(pc*100)}%`)),el('div',{class:'grow',style:'min-width:0'},el('b',{style:'font-weight:600'},goalTrackText(r)||(r.finished?'Achieved':'Not achieved yet')),r.deadline?(goalLate(r)?el('div',{class:'small olate',style:'margin-top:2px'},`Was due ${relDay(r.deadline)} · ${-dayCount(r.deadline)} days ago`):el('div',{class:'small muted',style:'margin-top:2px'},`By ${relDay(r.deadline)}${wk>1?` · ${wk} weeks left`:''}`)):null,pa&&pa!=='Overdue'?el('span',{class:'tags'},pill(pa,paceClass(pa))):null)));
  if(!r.finished)page.append(el('div',{class:'ochk ohact'},btnL('Check in',()=>goalCheckSheet(r)),btnP('Mark achieved',()=>achieveSheet(r))));
  if(!r.finished){const L=linkedOf(r);if(L.tasks.some(isOpenTask)||L.projects.some(p=>projectTasks(p).some(isOpenTask)))page.append(el('button',{class:'linkbtn small',style:'min-height:44px',onclick:()=>{App.state.studio=Object.assign(App.state.studio||{},{mode:'w',anchor:null,only:r.id});App.go('studio');}},'Plan this goal’s tasks in Studio ›'));}
  const fc=forecastCard(r);if(fc)page.append(...fc);
  if(tr==='milestones'&&st.length&&done===st.length&&!r.finished)page.append(el('div',{class:'ocheer',style:'justify-content:space-between'},el('b',{},'Every milestone is done. Ready to call it achieved?'),el('button',{class:'linkbtn small',style:'flex:none;min-height:44px',onclick:()=>achieveSheet(r)},'Mark achieved')));
  if((r.checks||[]).length){const c=r.checks[r.checks.length-1];page.append(el('p',{class:'small muted',style:'padding:0 4px'},`Last check-in ${relDay(c.date)}: ${c.status}`));}
  if(tr==='milestones'){const nextId=(st.find(s=>!s.d)||{}).id;
    page.append(lblRow('Milestones',st.length?`${done} of ${st.length}`:''));
    const box=el('div',{class:'list'+(st.length>1?' mstl':''),'data-gid':r.id},st.map(s=>{const isNext=s.id===nextId,when=s.date?relDay(s.date)+(s.time!=null?' · '+fmtT(s.time):''):s.planWeek?`Week of ${shortDay(s.planWeek)}`:s.planMonth?`Planned for ${MONL[+s.planMonth.slice(5)-1]}`:'Not planned yet';const row=el('div',{class:'li tick-host'+(s.d?' done':'')+(isNext?' onext':''),style:'min-height:56px'},el('span',{class:'tick-hit'},tickBtn(s.d,on=>{row.classList.toggle('done',on);s.d=on;s.doneAt=on?Date.now():null;put(r,{silent:true});if(on&&!st.every(x=>x.d))toast('Milestone done',()=>{s.d=false;s.doneAt=null;put(r);});setTimeout(()=>{if(on&&st.every(x=>x.d)&&!r.finished)achieveSheet(r);else App.refresh();},820);})),el('button',{class:'grow',style:'text-align:left','aria-label':`Edit ${s.t}`,onclick:()=>milestoneSheet(r,s)},el('span',{class:'tt',style:`font-weight:${isNext?600:500}`},s.t),el('small',{class:isNext?'otime':''},isNext?`Next · ${when}`:when)));return row;}));
    box.append(el('button',{class:'row oaddrow',onclick:()=>milestoneSheet(r)},el('span',{class:'ic',html:ic('plus',18,2)}),el('span',{},'Add a milestone')));page.append(box);}
  if(tr==='number')page.append(el('div',{class:'card'},el('div',{class:'lbl'},'Progress'),el('h2',{},goalNumText(r)),el('div',{class:'btnrow'},el('button',{class:'btn primary',onclick:()=>logNumberSheet(r)},'Log progress'))));
  const L=linkedOf(r),items=[...L.projects.map(x=>[x,'project',`Project · ${projectTasks(x).filter(taskDone).length} of ${projectTasks(x).length} tasks`]),...L.habits.map(x=>{const hs=habitStreak(x);return[x,'habit',['Habit',hs.n>1?`${hs.n}-${hs.unit} streak`:'',habitWeekly(x)?`${habitWeek(x,todayK())} of ${x.target} this week`:''].filter(Boolean).join(' · ')];}),...L.tasks.map(x=>[x,'task',`Task · ${taskDone(x)?'Done':x.date?relDay(x.date):'No date'}`])];
  page.append(lblRow('Moves it forward',items.length?`${items.length} linked`:''));
  const lk=el('div',{class:'list'},items.map(([x,kd,sub])=>el('button',{class:'li',style:'min-height:58px',onclick:()=>openRec(x)},rtCircle(kd==='project'?'project':kd,'#466B5A'),el('span',{class:'grow'},el('b',{style:'font-weight:500'},x.title),el('small',{},sub)),el('span',{class:'chev',html:ic('chevr',16,2)}))));
  lk.append(el('button',{class:'row oaddrow',onclick:()=>linkSheet(r)},el('span',{class:'ic',html:ic('plus',18,2)}),el('span',{},'Add or link a project, habit or task')));page.append(lk);
  const parent=r.part&&get.id(r.part);
  page.append(lblRow('Details'),el('div',{class:'group'},detailRow('target','By when',r.deadline?shortDay(r.deadline):'No date',edit),detailRow('chart','Track progress by',{milestones:'Milestones',number:'A number',linked:'Linked work',done:'Done or not'}[tr]||'Milestones',edit),detailRow('leaf','Life Area',r.area||'None',edit),parent?detailRow('layers','Part of',parent.title,()=>App.go('plan',{id:parent.id})):null,detailRow('star','Focus on this now',null,null,{trailing:switchEl(!!r.focus,'Focus on this now',on=>setFocus(r,on))}),detailRow('bell','Check in',r.checkIn==='off'?'Off':r.checkIn==='monthly'?'Monthly':'Weekly',edit),detailRow('layers','Plan in Studio','',()=>{App.state.studio=Object.assign(App.state.studio||{},{mode:'w',anchor:null});App.go('studio');})));
  const recent=[...st.filter(s=>s.d&&s.doneAt).map(s=>({at:s.doneAt,t:`Checked off ${s.t}`,w:relDay(k(new Date(s.doneAt)))})),...(r.checks||[]).map(c=>({at:fromK(c.date).getTime(),t:`Check-in: ${c.status}${c.note?`. “${c.note}”`:''}`,w:relDay(c.date)})),...(r.numLog||[]).map(x=>({at:x.at,t:`Logged ${x.v} ${r.numUnit||''}`.trim(),w:relDay(k(new Date(x.at)))}))].sort((a,b)=>b.at-a.at).slice(0,4);
  if(recent.length)page.append(lblRow('Recent'),el('div',{class:'orecent'},recent.map(x=>el('div',{},el('i'),el('span',{},el('span',{style:'display:block'},x.t),el('small',{},x.w))))));
  if(r.createdAt)page.append(el('p',{class:'small muted',style:'padding-inline:4px'},`Created ${relDay(k(new Date(r.createdAt)))}`));
}
const ptLate=t=>!taskDone(t)&&t.date&&(!t.repeat||t.repeat.type==='never')&&t.date<todayK();
const ptMeta=t=>{if(ptLate(t)){const n=daysBetween(t.date,todayK());return el('span',{class:'olate'},n<=1?'From yesterday':`${n} days late`);}return ptWhen(t);};
const ptWhen=t=>t.date?relDay(nextOcc(t))+(t.time!=null?' · '+fmtT(t.time):''):t.planWeek?`Week of ${shortDay(t.planWeek)}`:'Not planned yet';
const habitsToday=(dk=todayK())=>get.all('habit').filter(h=>habitDue(h,dk)&&(!habitWeekly(h)||habitDone(h,dk)||habitWeek(h,dk)<(h.target||1)));
