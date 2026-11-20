/* ---------- Organize: Inbox, Tasks, Habits, Routines, Projects, Goals, Lists ---------- */
/* Shared page parts */
function backInfo(){const st=App.state.stack||[],p=st[st.length-1];if(!p||p.view==='more')return['More','more'];const pl=PLACES[p.view];return[pl?pl.n:'Back','more'];}
/* sort choices get their own icon; the ⋯ menu only appears when it has other actions in it */
function orgHead(title,sub,{type,menu,menuLabel,sort}={}){
  const sorts=sort?sort().filter(Boolean):[],more=menu?menu().filter(Boolean):[];
  const[b,to]=backInfo();
  return el('header',{},el('div',{class:'pghead'},backBtn(b,to),el('div',{style:'display:flex;align-items:center'},
    el('button',{class:'iconbtn green','aria-label':`Search ${title.toLowerCase()}`,html:ic('search',21,1.9),onclick:e=>{searchFrom(e.currentTarget);App.state.q='';App.state.qType=type||'All';App.go('search');}}),
    sorts.length?el('button',{class:'iconbtn green','aria-label':sorts.length===1?sorts[0].label:`Sort ${title.toLowerCase()}`,html:ic('sort',21,1.9),onclick:e=>{if(sorts.length===1)return sorts[0].onclick();const r=e.currentTarget.getBoundingClientRect();openMenu(r.right,r.bottom+4,sorts);}}):null,
    more.length?moreB(menuLabel||`${title} options`,e=>{const r=e.currentTarget.getBoundingClientRect();openMenu(r.right,r.bottom+4,menu().filter(Boolean));}):null)),
    el('div',{class:'otitle'},el('h1',{class:'pgtitle'},title)));
}
const addBar=(label,aria,fn)=>el('button',{class:'oadd','aria-label':aria,onclick:fn},el('span',{style:'display:grid',html:ic('plus',20,2)}),label);
const areasIn=list=>[...new Set(list.map(r=>r.area).filter(Boolean))].sort();
/* one filter row: the life-area filter is a menu at the end, not a second row of chips */
function areaMenuChip(sel,areas){if(areas.length<2)return null;const lab=!sel.size?'Area':sel.size===1?[...sel][0]:`${sel.size} areas`;
  return el('button',{class:'fchip amenu'+(sel.size?' on':''),'aria-haspopup':'menu',onclick:e=>{const r=e.currentTarget.getBoundingClientRect();openMenu(r.left,r.bottom+4,[{label:'All areas',icon:sel.size?null:'check',onclick:()=>{sel.clear();App.refresh();}},...areas.map(a=>({label:a,icon:sel.has(a)?'check':areaIcon(a),onclick:()=>{sel.has(a)?sel.delete(a):(sel.clear(),sel.add(a));App.refresh();}}))]);}},lab,el('span',{style:'display:grid',html:ic('chevd',14,2.2)}));}
function viewsRow(items,val,on,key,pool){
  /* one header for every organize page: view chips, then area chips (tap to add, tap again to remove; none = all) */
  const S=App.state;if(!(S['af'+key] instanceof Set))S['af'+key]=new Set();const sel=S['af'+key],areas=areasIn(pool);
  return el('div',{class:'tstick'},el('div',{class:'fchips'},items.map(([v,l,n])=>el('button',{class:'fchip'+(val===v?' on':''),'aria-pressed':String(val===v),onclick:()=>on(v)},l)),areaMenuChip(sel,areas)));
}
function areaOnly(list,key){const S=App.state,cur=S['af'+key];if(!(cur instanceof Set)||!cur.size)return list;return list.filter(r=>cur.has(r.area));}
const areaNote=()=>null;
/* a life-area card with a fold, the same shape Habits uses */
function areaFold(page,key,a,rows,sub){const S=App.state;S['fold'+key]=S['fold'+key]||new Set();const shut=S['fold'+key].has(a);
  page.append(el('div',{class:'card hacard'+(shut?' shut':'')},el('button',{class:'hahead','aria-expanded':String(!shut),onclick:()=>{if(shut)S._reveal='af'+key+a;shut?S['fold'+key].delete(a):S['fold'+key].add(a);App.refresh();}},
    el('span',{class:'ring sm haring',style:`--p:${sub.p*100}`},el('span',{html:ic(a==='No area'?'grid':areaIcon(a),18,1.9)})),
    el('span',{class:'hatx'},el('b',{},a),el('small',{},sub.t)),el('span',{class:'hachev',html:ic('chevd',18,2.2)})),shut?null:el('div',{class:'habody'},Array.isArray(rows)?revealRows(capRows(rows,'af'+key+a,6),'af'+key+a):rows)));}
function byArea(list){const m=new Map();list.forEach(r=>{const a=r.area||'No area';if(!m.has(a))m.set(a,[]);m.get(a).push(r);});return[...m.entries()].sort((a,b)=>a[0]==='No area'?1:b[0]==='No area'?-1:a[0].localeCompare(b[0]));}
const withPress=(node,fn)=>{onPress(node,fn,'.tick-hit');node.addEventListener('click',e=>{if(Date.now()-(node._pressed||0)<700){e.stopPropagation();e.preventDefault();}},true);return node;};
/* an empty hub says so in one quiet line under its Add bar, not a big illustrated card */
const emptyOf=(t,s)=>el('p',{class:'oempty'},el('b',{},t),s?el('span',{},s):null);
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
  try{localStorage.setItem('lifeos-inboxSeen',String(Date.now()));}catch(e){}
  const S=App.state;S.inboxTab=S.inboxTab||'All';S.inboxSort=S.inboxSort||'old';
  const all=get.all('idea'),sorted=all.slice().sort((a,b)=>S.inboxSort==='old'?a.createdAt-b.createdAt:b.createdAt-a.createdAt),withPh=all.filter(i=>(i.photos||[]).length);
  if(S.inboxTab==='Photos'&&!withPh.length)S.inboxTab='All';
  const shown=sorted.filter(i=>S.inboxTab==='All'||(i.photos||[]).length),page=el('div',{class:'page'});
  page.append(orgHead('Inbox',all.length?`${all.length} to organize`:'',{type:'Ideas',sort:()=>all.length>1?[{label:S.inboxSort==='old'?'Show newest first':'Show oldest first',icon:'sort',onclick:()=>{S.inboxSort=S.inboxSort==='old'?'new':'old';App.refresh();toast(S.inboxSort==='old'?'Oldest first':'Newest first');}}]:[],menu:()=>[all.length>1?{label:'Select ideas',icon:'check',onclick:()=>{S.ideaSel=new Set();App.refresh();}}:null,(()=>{const old=all.filter(i=>Date.now()-(i.createdAt||0)>60*864e5);return old.length?{label:`Clear ${old.length} older than 60 days`,icon:'trash',danger:true,onclick:()=>askConfirm({title:`Clear ${old.length} old idea${old.length>1?'s':''}?`,body:'They stay in Recently deleted for 30 days.',yes:'Clear',no:'Keep them',onYes:()=>{const cs=old.map(clone);old.forEach(i=>remove(i.id,{silent:true}));App.refresh();toast(`${old.length} cleared`,()=>{cs.forEach(c=>put(c,{silent:true}));App.refresh();});}})}:null;})()]}));
  /* pending reviews and other things the app asks of you sit pinned on top; they aren't ideas, so Tidy up never counts them */
  flexDue().forEach(f=>page.append(el('button',{class:'otidy sysrow',onclick:()=>flexWeekSheet(f.job.id,f.from)},el('span',{class:'oric',html:glyph('brief',20)}),el('span',{class:'grow'},el('b',{},`Add your ${f.job.name&&f.job.name!=='Work'?f.job.name+' ':'work '}hours`),el('small',{},`${mdS(fromK(f.from))} – ${mdS(fromK(f.to))}`)),el('span',{class:'chev',html:ic('chevr',16,2)}))));
  {const pr=typeof pendingReviews==='function'?pendingReviews():[];if(pr.length)page.append(el('button',{class:'otidy sysrow',onclick:()=>App.go('reviews')},el('span',{class:'oric',html:ic('clip',20)}),el('span',{class:'grow'},el('b',{},pr.length===1?`${rvLabel(pr[0])} review to catch up on`:`${pr.length} reviews to catch up on`)),el('span',{class:'chev',html:ic('chevr',16,2)})));}
  page.append(el('div',{class:'ocap'},el('button',{class:'ocapt',onclick:()=>captureSheet(null)},"What's on your mind?"),el('button',{class:'ocapp','aria-label':'Capture a photo',html:ic('image',20),onclick:()=>captureSheet(null,{photo:true})})));
  {const wn=whatsNewCard();if(wn)page.append(wn);}
  const wasN=S._inboxN||0;S._inboxN=all.length;
  if(!all.length){const fresh=wasN>0&&motionOK();page.append(el('div',{class:'ozero'+(fresh?' fresh':'')},el('span',{class:'ozi',html:fresh?'<svg viewBox="0 0 80 80" width="64" height="64" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle class="zc" cx="40" cy="40" r="34"/><path class="zk" d="M26 41l9 9 19-21"/></svg>':ic('inbox',40,1.5)}),el('h2',{},'Inbox zero'),el('p',{},'Everything has a home. New ideas, photos and links land here.')));root.append(page);return;}
  /* older ideas are reviewed inside Tidy up rather than in their own card */
  const oldN=all.filter(i=>Date.now()-(i.createdAt||0)>30*864e5).length;
  if(all.length>1){const m=Math.max(1,Math.ceil(all.length*.4));page.append(el('button',{class:'otidy',onclick:()=>tidySheet(sorted)},el('span',{class:'oric',html:ic('spark',20)}),el('span',{class:'grow'},el('b',{},`Tidy up ${all.length} ideas`)),el('span',{class:'chev',html:ic('chevr',16,2)})));}
  if(withPh.length)page.append(viewsRow([['All','All',all.length],['Photos','Photos',withPh.length]],S.inboxTab,v=>{S.inboxTab=v;App.refresh();},'inb',[]));
  if(S.ideaSel){const ids=[...S.ideaSel].map(get.id).filter(Boolean),n=ids.length;
    page.append(el('div',{class:'selbar'},el('div',{class:'bl'},el('b',{},n?`${n} selected`:'Select ideas'),el('span',{style:'display:flex;gap:4px'},el('button',{class:'linkbtn',onclick:()=>{S.ideaSel=new Set(shown.map(i=>i.id));App.refresh();}},'All'),el('button',{class:'linkbtn',onclick:()=>{S.ideaSel=null;App.refresh();}},'Cancel'))),
      el('div',{class:'chips'},el('button',{class:'chip',onclick:()=>{if(!n){toast('Tap ideas to select them');return;}const made=ids.map(i=>{const t=newTask(i.title&&i.title!=='Unnamed Idea'?i.title:(i.notes||'Idea').split('\n')[0].slice(0,80),{});t.notes=i.title?i.notes||'':'';t.photos=i.photos||[];put(t,{silent:true});return t;}),cs=ids.map(clone);ids.forEach(i=>remove(i.id,{silent:true}));S.ideaSel=null;App.refresh();toast(`${n} turned into task${n>1?'s':''}`,()=>{made.forEach(t=>remove(t.id,{hard:true,silent:true}));cs.forEach(c=>put(c,{silent:true}));App.refresh();});}},'Make tasks'),
        el('button',{class:'chip line',style:'color:var(--danger,#A4503A)',onclick:()=>{if(!n){toast('Tap ideas to select them');return;}const cs=ids.map(clone);ids.forEach(i=>remove(i.id,{silent:true}));S.ideaSel=null;App.refresh();toast(`${n} deleted`,()=>{cs.forEach(c=>put(c,{silent:true}));App.refresh();});}},'Delete'))));
    page.append(el('div',{class:'list'},shown.map(i=>{const on=S.ideaSel.has(i.id);return el('button',{class:'li tsel'+(on?' on':''),'aria-pressed':String(on),style:'width:100%;text-align:left;min-height:56px',onclick:()=>{on?S.ideaSel.delete(i.id):S.ideaSel.add(i.id);App.refresh();}},el('span',{class:'selbox',html:on?ic('check',13,3):''}),el('span',{class:'grow'},el('span',{class:'tt'},i.title||(i.notes||'').split('\n')[0]),el('small',{},timeAgo(i.createdAt))));})));root.append(page);return;}
  setTimeout(swipeHint,500);
  page.append(el('div',{class:'list'},capRows(shown.map(i=>{
    const ph=(i.photos||[]).length,link=URL_RE.test(`${i.title} ${i.notes}`),meta=[];
    if(ph)meta.push(el('span',{class:'omi',html:ic('image',13,2)+`${ph}`}));
    if(link)meta.push(el('span',{class:'omi',html:ic('share',13,2)+'Link'}));
    if(i.source)meta.push(`From ${i.source}`);const nl=(i.notes||'').trim().split('\n')[0];if(nl&&!URL_RE.test(nl))meta.push(nl.length>36?nl.slice(0,34).trim()+'…':nl);meta.push(timeAgo(i.createdAt));
    const g=suggestKind(i.title==='Unnamed Idea'?'':i.title,i.notes,new Date(i.createdAt));
    const sw=swipeAct(withPress(el('div',{class:'li ibrow'},
      el('button',{class:'grow',style:'display:flex;align-items:center;gap:12px;text-align:left;min-width:0',onclick:()=>captureSheet(i)},ph?el('span',{class:'photo thumb',style:`background-image:url("${i.photos[0].url}")`,'aria-hidden':'true'}):link?el('span',{class:'iblink',html:ic('share',15,2)}):null,el('span',{class:'ibt'},ideaLabel(i)),el('span',{class:'ibage'},shortAgo(i.createdAt))),
),(x,y)=>openMenu(x,y,[{label:'Edit',icon:'edit',onclick:()=>captureSheet(i)},{label:'Turn into…',icon:'arrow',onclick:()=>tidySheet([i])},{label:'Delete',icon:'trash',danger:true,onclick:()=>{const c=clone(i);remove(i.id);toast('Idea deleted',()=>put(c));}}])),{left:{label:'Delete',color:'var(--danger)',run:()=>{const c=clone(i);remove(i.id);toast('Idea deleted',()=>put(c));}},right:{label:'Task',color:'var(--accent)',run:()=>routeInto('task',{title:i.title==='Unnamed Idea'?'':i.title,notes:i.notes,photos:i.photos,createdAt:i.createdAt},()=>ideaBecame(i.id,'Task'))}});sw.dataset.k='idea:'+i.id;return sw;
  }),'inbox',25)));
  root.append(page);
}
const shortAgo=t=>{const m=Math.max(0,(Date.now()-(t||0))/6e4);return m<60?`${Math.max(1,Math.round(m))}m`:m<1440?`${Math.round(m/60)}h`:m<10080?`${Math.round(m/1440)}d`:m<525600?`${Math.round(m/10080)}w`:`${Math.round(m/525600)}y`;};
/* text and small nodes joined with a middle dot */
function joinMeta(parts){const out=[];parts.filter(Boolean).forEach((p,i)=>{if(i)out.push(' · ');out.push(p);});return out;}

/* ---------- Tasks ---------- */
function taskRow(t,dk,{late=false,date=false,doneOn=null,grouped=false}={}){
  const done=isDone(t,dk),steps=(t.steps||[]).filter(s=>s.t),sd=steps.filter(s=>stepDone(t,s,dk)).length,proj=t.part&&get.id(t.part);
  const meta=[];
  if(late){const n=daysBetween(t.date,todayK());meta.push(n<=1?'1 day late':`${n} days late`);}
  if(doneOn)meta.push(`Done ${relDay(doneOn).replace(/^[A-Z](?=oday|omorrow|esterday)/,c=>c.toLowerCase())}`);
  if(date&&!late&&!doneOn)meta.push(t.date?relDay(dk):'No date');
  if(t.time!=null&&!doneOn)meta.push(el('span',{class:'otime'},fmtT(t.time)));
  if(t.dur&&!doneOn)meta.push(fmtDur(t.dur));
  if(t.deadline&&!doneOn){const dl=`Due ${relDay(t.deadline).replace(/^(Today|Tomorrow|Yesterday)$/,x=>x.toLowerCase())}`;meta.push(t.deadline<=todayK()&&!done?el('span',{class:'olate'},dl):dl);}
  if(!done&&!doneOn){const dm=depMeta(t);if(dm)meta.push(dm);}
  if(proj)meta.push(proj.title);
  if(!doneOn)tagMeta(t).forEach(x=>meta.push(x));
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
  const S=App.state;if(!['all','today','upcoming','anytime','waiting','done','hold'].includes(S.taskTab))S.taskTab='all';
  /* sort: due date (default), priority, or newest; ties fall back to due date */
  const SORT=get.settings().taskSort||'due',pw=t=>t&&t.priority==='high'?0:t&&t.priority==='low'?2:1,srt=(l,rec=x=>x,due=x=>(rec(x)&&(rec(x).date||rec(x).deadline))||'9999')=>SORT==='due'?l:l.slice().sort((a,b)=>{const A=rec(a),B=rec(b);if(SORT==='priority'){const d=pw(A)-pw(B);if(d)return d;}else{const d=((B&&B.createdAt)||0)-((A&&A.createdAt)||0);if(d)return d;}return due(a)<due(b)?-1:due(a)>due(b)?1:0;});
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
  const AI0=areaItems(tk),leftAll=todayOpen.length+AI0.filter(r=>!r.late&&!r.done).length,odAll=late.length+AI0.filter(r=>r.late).length;
  page.append(orgHead('Tasks',leftAll||odAll?[leftAll?`${leftAll} today`:null,odAll?`${odAll} overdue`:null].filter(Boolean).join(' · '):todayDone.length?'All done today':all.filter(isOpenTask).length?`${all.filter(isOpenTask).length} open`:'',{type:'Tasks',sort:()=>[['due','Due date'],['priority','Priority'],['new','Newest']].map(([k2,l2])=>({label:l2+((get.settings().taskSort||'due')===k2?' ✓':''),icon:'sort',onclick:()=>{setSettings({taskSort:k2});App.refresh();}})),menu:()=>[{label:'Waiting on someone',icon:'time',onclick:()=>{S.taskTab='waiting';App.refresh();}},{label:'Select tasks',icon:'check',onclick:()=>{S.taskSel=new Set();App.refresh();}},{label:S.taskGroup?'Stop grouping':'Group by life area',icon:'grid',onclick:()=>{S.taskGroup=!S.taskGroup;App.refresh();}},{label:'Archive',icon:'archive',onclick:()=>App.go('archive')}]}));
  if(S.taskSel)page.append(selBar());
  if(S.taskTab!=='waiting')taskQuickAdd(page,S.taskF&&S.taskF.has('today')?tk:null);
  /* filters: tap to add, tap again to remove; nothing picked means All. Waiting and Done stay as their own views */
  if(!(S.taskF instanceof Set))S.taskF=new Set(S.taskTab==='today'?['today']:S.taskTab==='upcoming'?['week']:S.taskTab==='anytime'?['anytime']:[]);if(!(S.taskA instanceof Set))S.taskA=new Set();
  if(!['waiting','done','hold'].includes(S.taskTab))S.taskTab='all';S.aftask=null;
  const AIt=AI0,areaSet=[...new Set([...all.filter(isOpenTask).map(t=>t.area),...AIt.map(r=>r.area)].filter(Boolean))].sort((a,b)=>a.localeCompare(b));
  const inA=a=>!S.taskA.size||S.taskA.has(a);
  const wk=addK(tk,7),cnt={overdue:late.length+AIt.filter(r=>r.late).length,today:todayOpen.length+AIt.filter(r=>!r.late&&!r.done).length,week:upcoming.filter(([,d])=>d<=wk).length,anytime:anytime.length};
  const fchip=(k,l,n,cls='')=>el('button',{class:'fchip'+cls+(k==='all'?(!S.taskF.size&&S.taskTab==='all'?' on':''):['waiting','done','hold'].includes(k)?(S.taskTab===k?' on':''):(S.taskTab==='all'&&S.taskF.has(k)?' on':'')),'aria-pressed':'false',onclick:()=>{if(k==='all'){S.taskF.clear();S.taskTab='all';}else if(['waiting','done','hold'].includes(k)){S.taskTab=S.taskTab===k?'all':k;S.taskF.clear();}else{S.taskTab='all';S.taskF.has(k)?S.taskF.delete(k):S.taskF.add(k);}App.refresh();}},l,n!=null?el('span',{class:'n'},String(n)):null);
  page.append(el('div',{class:'tstick'},
    el('div',{class:'fchips'},fchip('all','All',null),fchip('overdue','Overdue',null,cnt.overdue?' red':''),fchip('today','Today',null),fchip('week','Next 7',null),areaMenuChip(S.taskA,areaSet),
      (()=>{const views=[['anytime','Anytime'],get.all('wait').length||S.taskTab==='waiting'?['waiting','Waiting']:null,held||S.taskTab==='hold'?['hold','On hold']:null,['done','Done']].filter(Boolean),cur=views.find(([k])=>k==='anytime'?S.taskF.has('anytime'):S.taskTab===k);
        return el('button',{class:'fchip amenu'+(cur?' on':''),'aria-haspopup':'menu',onclick:e=>{const r=e.currentTarget.getBoundingClientRect();openMenu(r.left,r.bottom+4,views.map(([k,l])=>({label:l,icon:(cur&&cur[0]===k)?'check':null,onclick:()=>{if(k==='anytime'){S.taskTab='all';S.taskF.has(k)?S.taskF.delete(k):(S.taskF.clear(),S.taskF.add(k));}else{S.taskTab=S.taskTab===k?'all':k;S.taskF.clear();}App.refresh();}})));}},cur?cur[1]:'More',el('span',{style:'display:grid',html:ic('chevd',14,2.2)}));})())));
  const note=areaNote('task');if(note)page.append(note);
  
  const sec=(label,list,row0,cls)=>{if(!list.length)return;const row=S.taskSel?(t=>selRow(t)):row0;
    if(S.taskGroup){if(label)page.append(el('div',{class:'sh2 shstick'},el('span',{class:'lbl '+(cls||'')},`${label} · ${list.length}`)));byArea(list).forEach(([a,g])=>page.append(el('div',{class:'ogroup ichip'},a&&a!=='No area'?areaChipIc(a):null,a),el('div',{class:'list'},g.map(t=>row(t,true)))));return;}
    if(label)page.append(el('div',{class:'sh2 shstick'},el('span',{class:'lbl '+(cls||'')},`${label} · ${list.length}`)));page.append(el('div',{class:'list'},list.map(t=>row(t,false))));};
  if(S.taskTab==='waiting'){waitTab(page);
  }else if(S.taskTab==='hold'){
    /* to-dos in paused projects, grouped by project, with a way to resume each one */
    const hl=get.all('task').filter(t=>isOpenTask(t)&&onHold(t)&&(!S.taskA.size||S.taskA.has(t.area||areaOfTask(t))));const byP=new Map();hl.forEach(t=>{const pid=t.part;if(!byP.has(pid))byP.set(pid,[]);byP.get(pid).push(t);});
    if(!byP.size)page.append(emptySm('Nothing on hold','Tasks waiting on another task or a project step show up here.'));
    byP.forEach((l,pid)=>{const pr=get.id(pid);page.append(el('div',{class:'sh2'},el('span',{class:'lbl'},pr?pr.title:'Project'),el('button',{class:'linkbtn small',onclick:()=>{pr.paused=false;put(pr,{silent:true});App.refresh();toast(`${pr.title} resumed`,()=>{pr.paused=true;put(pr,{silent:true});App.refresh();});}},'Resume')),
      el('div',{class:'list'},l.map(t=>taskRow(t,t.date||tk))));});
  }else if(S.taskTab==='all'){
    const F=S.taskF.size?S.taskF:new Set(['overdue','today','week','anytime','later']),ta=t=>inA(t.area||areaOfTask(t));let any=false;
    const head=(label,n,right)=>page.append(el('div',{class:'sh2 shstick'},el('span',{class:'lbl'},label),right||null));
    const aRows=l=>l.map(r=>{const w=areaRow(r);w.classList.add('li');return w;});
    if(F.has('overdue')){const lt=late.filter(ta),la=AIt.filter(r=>r.late&&inA(r.area));if(lt.length||la.length){any=true;head(el('span',{style:'color:var(--now)'},'Overdue'),lt.length+la.length,el('button',{class:'linkbtn small',style:'color:var(--now)',onclick:()=>replanSheet(lt.filter(t=>t.date&&t.date<tk&&(!t.repeat||t.repeat.type==='never')),tk,{dueLate:lt.filter(t=>!(t.date&&t.date<tk)),area:la})},'Replan…'));
      /* oldest first: everything overdue, to-dos and life-area items together, by the date it was due */
      const aiDue=r=>{const sb=String(r.sub||'');const m=sb.match(/(\d+) days? (?:overdue|ago)/i);return m?addK(tk,-+m[1]):/yesterday/i.test(sb)?addK(tk,-1):addK(tk,-1);};
      const od=[...lt.map(t=>({t,d:t.date&&t.date<tk?t.date:(t.deadline||tk),n:(()=>{const r=S.taskSel?selRow(t):taskRow(t,t.date&&t.date<tk?t.date:tk,{late:!!(t.date&&t.date<tk)});return r;})()})),...la.map(r=>({d:aiDue(r),n:aRows([r])[0]}))].sort((x,y)=>x.d<y.d?-1:x.d>y.d?1:0);
      const od2=SORT==='due'?od:srt(od,x=>x.t,x=>x.d);page.append(el('div',{class:'list'},...capRows(od2.map(x=>x.n),'t-od')));}}
    if(F.has('today')){const lt=todayOpen.filter(t=>!late.includes(t)&&ta(t)),la=AIt.filter(r=>!r.late&&!r.done&&inA(r.area));if(lt.length||la.length){any=true;head('Today',lt.length+la.length);page.append(el('div',{class:'list'},...capRows([...srt(lt).map(t=>S.taskSel?selRow(t):taskRow(t,tk)),...aRows(la)],'t-today',12)));}}
    if(F.has('week')){const l=upcoming.filter(([t,d])=>d<=wk&&ta(t));if(l.length){any=true;const days=[...new Set(l.map(x=>x[1]))];days.forEach(d=>{const g=srt(l.filter(x=>x[1]===d),x=>x[0],x=>x[1]);head(relDay(d),g.length);page.append(el('div',{class:'list'},capRows(g.map(([t])=>S.taskSel?selRow(t):taskRow(t,d)),'t-'+d)));});}}
    if(!S.taskF.size){const l=upcoming.filter(([t,d])=>d>wk&&ta(t));if(l.length){any=true;head('Later',l.length);page.append(el('div',{class:'list'},capRows(srt(l,x=>x[0],x=>x[1]).map(([t,d])=>S.taskSel?selRow(t):taskRow(t,d,{date:true})),'t-later')));}}
    if(F.has('anytime')){const l=anytime.filter(ta);if(l.length){any=true;head('Anytime',l.length);page.append(el('div',{class:'list'},capRows(srt(l).map(t=>S.taskSel?selRow(t):taskRow(t,todayK())),'t-any')));}}
    if(!any)page.append(emptyOf('Nothing here',S.taskA.size?`Nothing matches ${andList([...S.taskA])} with these filters.`:'Try another filter, or add a task above.'));
  }else{
    if(!doneAll.length)page.append(emptyOf('Nothing finished yet','Ticked tasks collect here. You can untick one any time.'));
    else{const tk2=todayK(),y=addK(tk2,-1),wk=k(weekStartOf(new Date())),bucket=x=>{const d=k(new Date(x.ts));return d===tk2?'Today':d===y?'Yesterday':d>=wk?'Earlier this week':'Before that';};['Today','Yesterday','Earlier this week','Before that'].forEach(b=>{const g=doneAll.filter(x=>!S.taskA.size||S.taskA.has(x.t.area||areaOfTask(x.t))).slice(0,80).filter(x=>bucket(x)===b);if(g.length)page.append(el('div',{class:'sh2 shstick'},el('span',{class:'lbl'},b),el('span',{class:'small muted'},String(g.length))),el('div',{class:'list nodim'},g.map(x=>taskRow(x.t,x.d,{doneOn:k(new Date(x.ts))}))));});}
  }
  if(S.taskTab==='all'&&S.taskF.has('today')&&todayDone.length){const openD=S.taskDoneOpen!==false;page.append(el('button',{class:'donebar','aria-expanded':String(openD),onclick:()=>{S.taskDoneOpen=!openD;App.refresh();}},el('span',{},`Done today · ${todayDone.length}`),el('span',{style:'display:grid',html:ic(openD?'chevu':'chevd',16,2.2)})));if(openD)page.append(el('div',{class:'list'},todayDone.map(x=>taskRow(x.t,x.d))));}
  root.append(page);
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
function habitSched(h){const n=h.target||1;return habitWeekly(h)?(n>=7?'Every day':n===1?'Once a week':n===2?'Twice a week':`${n} times a week`):h.days.length===7?'Every day':h.days.slice().sort().map(i=>WDN[i].slice(0,3)).join(', ');}
function setHabitPaused(h,on){App.state._held=on?1:-1;if(on){h.paused=true;h.pausedAt=Date.now();h.pausedStreak=habitStreak(h);}else{
    /* days spent paused count as skips, so the streak survives */
    if(h.pausedAt&&!habitWeekly(h)){h.skips=h.skips||{};let d=k(new Date(h.pausedAt));const tk=todayK();for(let i=0;i<800&&d<tk;i++){if(!habitDone(h,d))h.skips[d]=true;d=addK(d,1);}}
    h.paused=false;h.pausedAt=null;h.pausedStreak=null;}put(h);}
function habitRow(h,dk){
  const done=habitDone(h,dk),skip=h.skips&&h.skips[dk],open=()=>App.go('habit',{id:h.id}),s=habitStreak(h);
  const row=el('div',{class:'li tick-host'+(done?' done':''),'data-k':'h:'+h.id,style:'min-height:60px'});
  const line=(()=>{if(skip)return el('small',{},'Skipped');
    if(!done&&dk===todayK()&&missedYesterday(h))return el('small',{class:'olate'},'Missed yesterday · Never miss twice');
    const parts=[];const dr=(h.target||1)>=7?dayRun(h,dk):0;if(habitWeekly(h)&&dr>1)parts.push(`${dr} days in a row`);else if(habitWeekly(h))parts.push(`${habitWeek(h,dk)} of ${h.target||1} this week`);
    const MS={day:{7:'1 week',30:'30 days',100:'100 days',365:'1 year'},week:{4:'1 month',12:'3 months',26:'6 months',52:'1 year'}},ms=(MS[s.unit]||{})[s.n];
    return el('small',{class:'ometa'},joinMeta([...parts,s.n>1?(()=>{const pf=streakSeen(h.id,s.n);return el('span',{class:'omi','data-rollfrom':pf!=null&&pf>1?pf:null,'data-rollto':s.n},flameI(),streakText(s));})():(streakSeen(h.id,s.n),null)]),ms?el('span',{class:'mstone','data-ms':`${h.id}:${s.unit}:${s.n}`},'★ '+ms):null);})();
  if(h.track==='count'||h.track==='time'){const v=typeof(h.logs||{})[dk]==='number'?h.logs[dk]:h.logs&&h.logs[dk]?h.goalN:0;
    row.append(v>=(h.goalN||1)?el('span',{class:'hcdone',html:ic('check',14,3)}):el('span',{class:'ring sm',style:`--p:${Math.min(100,v/(h.goalN||1)*100)}`},el('span',{})),el('button',{class:'grow',style:'text-align:left',onclick:open},el('b',{style:'font-weight:500'},h.title),el('small',{},habitWeekly(h)?((h.target||1)>=7&&dayRun(h,dk)>1?`${dayRun(h,dk)} days in a row`:`${habitWeek(h,dk)} of ${h.target||1} this week`):habitMeta(h,dk))),h.track==='count'&&v<(h.goalN||1)?el('span',{class:'hcnt'},`${v} of ${h.goalN}`):null,h.track==='count'?(()=>{const full=v>=(h.goalN||1);const c=el('button',{class:'chip'+(full?' hcfull':''),style:'height:36px',title:'Hold to type a number',onclick:()=>{if(full){habitCountSheet(h,dk);return;}buzz(6);logHabit(h,dk,1);}},full?`${v}/${h.goalN}`:'+1');onPress(c,()=>habitCountSheet(h,dk));c.addEventListener('pointerdown',e=>e.stopPropagation());return c;})():el('button',{class:'chip',style:'height:36px',onclick:()=>logTimeSheet(h,dk)},'Log'));}
  else row.append(el('span',{class:'tick-hit'},tickBtn(done,on=>{toggleItem({kind:'habit',rec:h},dk);if(on&&dk===todayK()&&allHabitsDone(dk)){buzz(12);toast('Every habit done today. Nice work.',()=>{toggleItem({kind:'habit',rec:h},dk);App.refresh();});}else if(on){const n=habitStreak(h);toast(n.n>1?`${h.title} · ${streakText(n)} in a row`:`${h.title} done`,()=>{toggleItem({kind:'habit',rec:h},dk);App.refresh();});}setTimeout(()=>App.refresh(),820);})),el('button',{class:'grow',style:'text-align:left',onclick:open},el('span',{class:'tt',style:'font-weight:500'},h.title),line));
  return withPress(row,(x,y)=>habitMenu(h,dk,x,y));
}
/* consecutive days done, counting back from today (or yesterday if today isn't done yet) */
function dayRun(h,dk=todayK()){let d=habitDone(h,dk)?dk:addK(dk,-1),n=0;for(let i=0;i<400&&habitDone(h,d);i++){n++;d=addK(d,-1);}return n;}
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
  const S=App.state;if(!(S.habF instanceof Set))S.habF=new Set();S.habDay=S.habDay&&S.habDay<=todayK()?S.habDay:todayK();
  const everyAll=get.all('habit',{every:true}).sort(habOrd),every=areaOnly(everyAll,'hab'),active=every.filter(h=>!h.paused),paused=every.filter(h=>h.paused),arch=get.all('habit',{archived:true,every:true}).filter(h=>h.archived),page=el('div',{class:'page habpg'}),tk=todayK(),dk=S.habDay;
  const counts=(h,d)=>habitDue(h,d)&&(!habitWeekly(h)||habitDone(h,d)||habitWeek(h,d)<(h.target||1));
  const todayList=active.filter(h=>counts(h,tk)),fin=todayList.filter(h=>habitDone(h,tk)).length;
  page.append(orgHead('Habits','',{type:'Habits',menu:()=>[active.length>1?{label:'Reorder habits',icon:'list',onclick:()=>reorderSheet({title:'Reorder habits',items:active.map(h=>({id:h.id,n:h.title,s:h.tod?h.tod[0].toUpperCase()+h.tod.slice(1):null})),onDone:D=>{D.forEach((x,i)=>{const h=get.id(x.id);if(h){h.order=i;put(h,{silent:true});}});App.refresh();toast('Order saved');}})}:null,{label:'Archive',icon:'archive',onclick:()=>App.go('archive')}]}));
  page.append(addBar('Add a habit','New habit',()=>habitSheet(null)));
  if(!everyAll.length&&!arch.length){page.append(emptyOf('Your first habit','Pick something small. Set how often, and it shows up on Today.'));root.append(page);return;}
  const dueNow=active.filter(h=>habitDue(h,dk));
  /* header matches Tasks: view chips, then area chips */
  if(!(S.habA instanceof Set))S.habA=new Set();
  const hAreas=[...new Set(active.map(h=>h.area).filter(Boolean))].sort((a,b)=>a.localeCompare(b)),inHA=h=>!S.habA.size||S.habA.has(h.area);
  /* filters work like Tasks: All is the default; tap Today or Paused to add it, tap again to take it off */
  const tdN=active.filter(h=>counts(h,tk)&&!habitDone(h,tk)).length;
  const vchip=(k,l,n)=>el('button',{class:'fchip'+(S.habF.has(k)?' on':''),'aria-pressed':String(S.habF.has(k)),onclick:()=>{S.habF.has(k)?S.habF.delete(k):S.habF.add(k);App.refresh();}},l,n!=null?el('span',{class:'n'},String(n)):null);
  page.append(el('div',{class:'tstick'},el('div',{class:'fchips'},el('button',{class:'fchip'+(!S.habF.size?' on':''),onclick:()=>{S.habF.clear();App.refresh();}},'All'),tdN&&tdN<active.length?vchip('today','Today',null):null,paused.length||S.habF.has('paused')?vchip('paused','Paused',null):null,areaMenuChip(S.habA,hAreas))));
  const note=areaNote('hab');if(note)page.append(note);
  const views=S.habF.size?['today','paused'].filter(v=>S.habF.has(v)):['all'];
  for(const T of views){if(views.length>1)page.append(el('div',{class:'sh2',style:'margin-top:14px'},el('span',{class:'lbl',style:'font-size:13px'},T==='today'?'Today':'Paused')));
  if(T==='today'){
    const st=weekStartOf(today());
    page.append(el('div',{class:'rings'},Array.from({length:7},(_,i)=>{const d=addD(st,i),x=k(d),list=active.filter(h=>counts(h,x)),f=list.filter(h=>habitDone(h,x)).length,pc=list.length?f/list.length*100:0;return el('button',{class:x===dk?'on':'',disabled:x>tk,'aria-label':`${shortDay(x)}, ${f} of ${list.length} done`,'aria-pressed':String(x===dk),onclick:()=>{S.habDay=x;App.refresh();}},DOW[d.getDay()][0],el('span',{class:'ring sm',style:`--p:${pc}`},el('span',{},String(d.getDate()))));})));
    if(dk!==tk)page.append(el('div',{class:'small muted',style:'padding-inline:4px'},`Filling in ${relDay(dk)==='Yesterday'?'yesterday':relDay(dk)}`));
    const due2=dueNow.filter(inHA);
    if(!due2.length)page.append(emptyOf('Nothing due','No habits are set for this day.'));
    /* one line per habit; finished ones fold into Done at the bottom */
    const open=due2.filter(h=>!habitDone(h,dk)),doneL=due2.filter(h=>habitDone(h,dk));
    const tods=[['morning','Morning'],['afternoon','Afternoon'],['evening','Evening'],['set','At a set time'],['anytime','Anytime']],onlyAny=open.every(h=>(h.tod||'anytime')==='anytime');
    const sect=(n,g)=>{if(g.length)page.append(el('div',{class:'sh2'},el('span',{class:'lbl'},n),el('span',{class:'small muted'},String(g.length))),el('div',{class:'list'},g.map(h=>habitRow(h,dk))));};
    if(onlyAny)sect('To do',open);else tods.forEach(([v,n])=>sect(n,open.filter(h=>(h.tod||'anytime')===v)));
    if(doneL.length){const op=!!S.habDoneOpen;page.append(el('button',{class:'donebar','aria-expanded':String(op),onclick:()=>{S.habDoneOpen=!op;App.refresh();}},el('span',{},`Done · ${doneL.length}`),el('span',{style:'display:grid',html:ic(op?'chevu':'chevd',16,2.2)})));if(op)page.append(el('div',{class:'list'},doneL.map(h=>habitRow(h,dk))));}
  }else if(T==='all'){
    if(!active.length)page.append(emptyOf('No active habits','Add one, or resume one from Paused.'));
    else{const rw=[...Array(7)].map((_,i)=>addK(tk,i-6));
      const oneRow=h=>{const s=habitStreak(h),dn=habitDone(h,tk),r=habitRate(h);
        /* tick on the left marks today; percent and streak share one tidy column on the right */
        const tick=el('span',{class:'tick-hit'},tickBtn(dn,on=>{if(h.track==='count'||h.track==='time'){h.logs=h.logs||{};if(on)h.logs[tk]=h.goalN||1;else delete h.logs[tk];put(h);}else toggleItem({kind:'habit',rec:h},tk);if(on){const n=habitStreak(h);toast(n.n>1?`${h.title} · ${streakText(n)} in a row`:`${h.title} done`,()=>{if(h.track==='count'||h.track==='time'){delete h.logs[tk];put(h);}else toggleItem({kind:'habit',rec:h},tk);App.refresh();});}setTimeout(()=>App.refresh(),700);}));
        const sh=(()=>{const n=h.target||1;return h.track==='count'?`${h.goalN}× a day`:habitWeekly(h)?(n>=7?'Daily':`${n}×/wk`):h.days.length===7?'Daily':`${h.days.length}×/wk`;})();
        return el('div',{class:'li ohab2 tick-host'+(dn?' done':'')},tick,el('button',{class:'grow ohbody',onclick:()=>App.go('habit',{id:h.id})},
          el('span',{class:'oh1'},el('b',{},h.title),s.n>1?el('span',{class:'ohs2','aria-label':`${streakText(s)} in a row`},flameI(),String(s.n)):null),
          el('span',{class:'oh2'},el('span',{class:'odots','aria-hidden':'true','data-dk':h.id},rw.map(d=>el('i',{class:habitDotState(h,d)+(d===tk?' td':'')}))),el('small',{},sh))));};
      /* grouped by life area: each area is a card with a ring for today, and folds when you tap its name */
      if(!(S.habShut instanceof Set))S.habShut=new Set();
      const L=active.filter(inHA),byA=new Map();L.forEach(h=>{const a=h.area||'Other';if(!byA.has(a))byA.set(a,[]);byA.get(a).push(h);});
      const aKeys=[...byA.keys()].sort((x,y)=>x==='Other'?1:y==='Other'?-1:x.localeCompare(y)),allShut=aKeys.every(a=>S.habShut.has(a));
      const fr=page.querySelector('.tstick .fchips');if(aKeys.length>1&&fr)fr.append(el('button',{class:'hafold','aria-label':allShut?'Expand all areas':'Collapse all areas',onclick:()=>{if(allShut)S.habShut.clear();else aKeys.forEach(a=>S.habShut.add(a));App.refresh();}},el('span',{style:'display:grid',html:ic(allShut?'chevd':'chevu',15,2.2)}),allShut?'Expand all':'Collapse all'));
      aKeys.forEach(a=>{const g=byA.get(a),due=g.filter(h=>counts(h,tk)),dn=due.filter(h=>habitDone(h,tk)).length,shut=S.habShut.has(a);
        const ord=[...g.filter(h=>!habitDone(h,tk)),...g.filter(h=>habitDone(h,tk))];
        page.append(el('div',{class:'card hacard'+(shut?' shut':'')},
          el('button',{class:'hahead','aria-expanded':String(!shut),onclick:()=>{if(shut)S._reveal='hab'+a;shut?S.habShut.delete(a):S.habShut.add(a);App.refresh();}},
            el('span',{class:'ring sm haring'+(due.length&&dn===due.length?' full':''),style:`--p:${due.length?dn/due.length*100:0}`},el('span',{html:ic(areaIcon(a),18,1.9)})),
            el('span',{class:'hatx'},el('b',{},a),el('small',{},due.length?(dn===due.length?`All ${due.length} done today`:`${dn} of ${due.length} done today`):`${g.length} habit${g.length>1?'s':''}`)),el('span',{class:'hachev',html:ic('chevd',18,2.2)})),
          shut?null:el('div',{class:'habody'},revealRows(ord.map(oneRow),'hab'+a))));});}
  }else{
    const pausedA=paused.filter(inHA);if(pausedA.length){
      pausedA.forEach(h=>{const ps=h.pausedStreak;page.append(el('div',{class:'card ohold'},el('button',{style:'display:block;width:100%;text-align:left',onclick:()=>App.go('habit',{id:h.id})},el('b',{},h.title),el('small',{},[h.pausedAt?`Paused ${relDay(k(new Date(h.pausedAt)))}`:'Paused',!habitWeekly(h)&&ps&&ps.n>1?`${ps.n}-day streak saved`:''].filter(Boolean).join(' · '))),btns(btnP('Resume',()=>{setHabitPaused(h,false);toast('Resumed');}),btnL('Archive',()=>archiveFlow(h)))));});}
    else if(!arch.length)page.append(emptyOf('Nothing paused','Pause a habit when life gets busy. Its history stays.'));
    if(arch.length)page.append(lblRow(`Archived · ${arch.length}`),el('div',{class:'list'},arch.map(h=>el('button',{class:'li',style:'min-height:56px',onclick:()=>App.go('habit',{id:h.id})},el('span',{class:'grow'},el('b',{style:'font-weight:500'},h.title),el('small',{},h.archivedAt?`Since ${relDay(k(new Date(h.archivedAt)))}`:'Archived')),pill(h.built?'Built':'Stopped',h.built?'soft':'neu')))));
  }
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
  const b=el('button',{class:'li ogr',onclick:()=>App.go('plan',{id:g.id})},el('span',{class:'ohn'},el('b',{},g.title),null),tr==='done'||empty?null:meter(pc),goalLate(g)?el('small',{class:'olate'},`Was due ${relDay(g.deadline)}`):stale?el('small',{class:'olate'},tr==='done'?'No check-in in 3 weeks':'No progress in 3 weeks'):el('small',{},empty?'No milestones yet':[g.deadline?`By ${fmtMD(g.deadline)}`:'',pa&&pa!=='On pace'?pa:null].filter(Boolean).join(' · ')||goalTrackText(g)||'Mark it achieved when it’s done'));
  return withPress(b,goalMenu(g));}
function holdCard(r,isGoal){const pc=isGoal?goalProgress(r):(()=>{const t=projectTasks(r);return t.length?t.filter(taskDone).length/t.length:0;})();
  return el('div',{class:'card ohold'},el('button',{style:'display:block;width:100%;text-align:left',onclick:()=>App.go('plan',{id:r.id})},el('span',{class:'ohn'},el('b',{},r.title),el('span',{class:'ohr'},`${Math.round(pc*100)}%`)),meter(pc),r.area?el('small',{},r.area):null),
    btns(btnP('Resume',()=>{r.paused=false;put(r);toast('Back in Active');}),isGoal?btnL('Let it go',()=>{r.archived=true;r.archivedAt=Date.now();r.status='letgo';r.focus=false;put(r);toast('Let go',()=>{r.archived=false;r.status='active';put(r);});}):btnL('Archive',()=>archiveFlow(r))));}
function doneBadge(){return el('span',{class:'obadge',html:ic('check',16,2.6)});}
function viewPlans(root,kind){
  const S=App.state,isGoal=kind==='goal',word=isGoal?'goal':'project',title=isGoal?'Goals':'Projects',sheet=isGoal?goalSheet:projectSheet,key='tab'+kind,afk=kind;S[key]=S[key]||'active';
  const every=get.all(kind,{every:true}),all=areaOnly(every,afk),page=el('div',{class:'page'});
  const groups={active:all.filter(r=>!r.paused&&!r.finished),hold:all.filter(r=>r.paused&&!r.finished),done:all.filter(r=>r.finished)},letgo=isGoal?get.all('goal',{archived:true,every:true}).filter(g=>g.archived&&g.status==='letgo'):[];
  page.append(orgHead(title,groups.active.length?`${groups.active.length} active`:'',{type:title,sort:()=>isGoal?[]:[['manual','Your order'],['due','Due date'],['prog','Progress'],['touched','Last touched'],['name','Name']].map(([k2,l2])=>({label:l2+((S.projSort||'manual')===k2?' ✓':''),icon:'sort',onclick:()=>{S.projSort=k2;try{localStorage.setItem('lo-projSort',k2);}catch(e){}App.refresh();}})),menu:()=>[...(isGoal?[]:userTpls().filter(t=>t.kind==='project').length?[{label:'New from a template',icon:'bookmark',onclick:()=>{const ts=userTpls().filter(t=>t.kind==='project');pickSheet('New project from a template',ts.map(t=>[t.id,t.t,`${t.items.length} tasks`]),id=>addTemplate(ts.find(t=>t.id===id)));}}]:[]),{label:'Archive',icon:'archive',onclick:()=>App.go('archive')}]}));
  page.append(addBar(`Add a ${word}`,`New ${word}`,()=>sheet(null)));
  if(!every.length&&!letgo.length){page.append(emptyOf(`Your first ${word}`,isGoal?'Name an outcome and choose how to track it.':'Name the effort and list the tasks. They show up everywhere tasks do.'));root.append(page);return;}
  page.append(viewsRow([['active','Active',S[key]==='active'?groups.active.length:0],['hold','On hold',groups.hold.length],['done','Done',S[key]==='done'?groups.done.length+letgo.length:0]],S[key],v=>{S[key]=v;App.refresh();},afk,[]));
  const note=areaNote(afk);if(note)page.append(note);
  const grouped=(list,wrap)=>{if(S['grp'+kind])byArea(list).forEach(([a,g])=>{page.append(el('div',{class:'ogroup'},a));wrap(g);});else wrap(list);};
  if(S[key]==='active'){
    if(!groups.active.length)page.append(emptyOf('Nothing active',`Add a ${word}, or bring one back from On hold.`));
    if(isGoal){const cc=cascadeCard();if(cc)page.append(cc);const focus=groups.active.filter(g=>g.focus),rest=groups.active.filter(g=>!g.focus);
      if(focus.length){page.append(lblRow(`Focus · ${focus.length}`,'Shown on Today'));focus.forEach(g=>page.append(goalFocusCard(g)));}
      if(rest.length){if(focus.length)page.append(lblRow(`Also active · ${rest.length}`));byArea(rest).forEach(([a,g])=>{const avg=g.reduce((n,x)=>n+goalProgress(x),0)/g.length;areaFold(page,'goal',a,g.map(goalRowActive),{p:avg,t:`${g.length} goal${g.length>1?'s':''}`});});}
    }else{if(!S.projSort){try{S.projSort=localStorage.getItem('lo-projSort')||'manual';}catch(e){S.projSort='manual';}}
      const pg=p=>{const ts=projectTasks(p);return ts.length?ts.filter(taskDone).length/ts.length:0;},srt={due:(a,b)=>(a.deadline||'9999')<(b.deadline||'9999')?-1:(a.deadline||'9999')>(b.deadline||'9999')?1:(a.order??0)-(b.order??0),prog:(a,b)=>pg(b)-pg(a),touched:(a,b)=>lastProgress(b)-lastProgress(a),name:(a,b)=>a.title.localeCompare(b.title)}[S.projSort]||null;
      const L=srt?groups.active.slice().sort(srt):groups.active;byArea(L).forEach(([a,g])=>{const tot=g.reduce((n,p)=>n+projectTasks(p).length,0),dn=g.reduce((n,p)=>n+projectTasks(p).filter(taskDone).length,0);areaFold(page,'proj',a,g.map(projRow),{p:tot?dn/tot:0,t:`${g.length} project${g.length>1?'s':''}`});});}
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
/* one compact row per project: title and progress, then the next task you can tick */
function projRow(r){const ts=projectTasks(r),d=ts.filter(taskDone).length,next=ts.find(t=>!taskDone(t)),pc=ts.length?d/ts.length:0,dl=r.deadline&&dayCount(r.deadline);
  const meta=[ts.length?`${d} of ${ts.length}`:'No tasks yet',r.deadline?(dl<0?el('span',{class:'olate'},`${-dl} day${dl<-1?'s':''} late`):`Due ${fmtMD(r.deadline)}`):null];
  const top=el('button',{class:'prow',onclick:()=>App.go('plan',{id:r.id})},el('span',{class:'prtop'},el('b',{},r.title)),ts.length?meter(pc):null,el('small',{class:'ometa'},joinMeta(meta)));
  const nx=next?el('div',{class:'prnext tick-host'},el('span',{class:'tick-hit'},tickBtn(false,on=>{setTaskDone(next,next.date||todayK(),on);toast(`${next.title} done`,()=>{setTaskDone(next,next.date||todayK(),false);App.refresh();});setTimeout(()=>App.refresh(),450);})),el('button',{class:'grow',style:'text-align:left;min-width:0',onclick:()=>openRec(next)},el('span',{class:'tt'},next.title))):null;
  return withPress(el('div',{class:'prwrap'},top,nx),(x,y)=>openMenu(x,y,[{label:'Open',icon:'chevr',onclick:()=>App.go('plan',{id:r.id})},{label:'Put on hold',icon:'time',onclick:()=>{r.paused=true;put(r);toast('On hold',()=>{r.paused=false;put(r);});}},{label:'Mark done',icon:'check',onclick:()=>{r.finished=true;r.finishedAt=Date.now();put(r);toast('Project done',()=>{r.finished=false;r.finishedAt=null;put(r);});}}]));}
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
    page.append(emptyOf('Your first routine','Line up the steps with a timer, then press play.'));{const mine=userTpls().filter(t=>t.kind==='routine');if(mine.length)page.append(lblRow('Your templates'),el('div',{class:'chips'},mine.map(t=>tplChip(t,()=>addTemplate(t)))));}
    root.append(page);return;}
  const next=today_.find(r=>!(r.runs||{})[tk]);
  if(next){const st=next.steps||[],m=rtMins(next);page.append(el('div',{class:'card upc'},el('div',{class:'lbl'},next.setTime!=null&&next.setTime<nowMin()?`Still to do · planned ${fmtT(next.setTime)}`:`Up next${next.setTime!=null?' · '+fmtT(next.setTime):''}`),el('button',{class:'oserif',style:'display:block;text-align:left;margin-top:6px',onclick:()=>App.go('routine',{id:next.id})},next.title),el('p',{class:'small muted',style:'margin-top:2px'},[`${st.length} step${st.length!==1?'s':''}`,m?fmtDur(m):''].filter(Boolean).join(' · ')),btns(btnP('Start now',()=>runRt(next),{icon:'play'}))));}
  fin.forEach(r=>page.append(el('button',{class:'donebar',style:'margin-top:0',onclick:()=>App.go('routine',{id:r.id})},el('span',{},`${r.title} done at ${clockOf(r.runs[tk])}`),el('span',{style:'display:grid',html:ic('check',16,2.4)}))));
  page.append(el('div',{class:'list'},list.map(r=>{const m=rtMins(r),s=rtStreak(r),runs=Object.keys(r.runs||{}).length;return el('div',{class:'li',style:'min-height:60px'},el('button',{class:'grow',style:'display:flex;align-items:center;gap:12px;text-align:left;min-width:0',onclick:()=>App.go('routine',{id:r.id})},el('span',{style:'min-width:0;display:block'},el('b',{},r.title),el('small',{class:'ometa'},joinMeta([(r.days||[]).length?rtWhen(r).replace(/^Every day/,'Daily'):'',m?fmtDur(m):'',(r.days||[]).length?(s>1?el('span',{class:'omi'},flameI(),String(s)):''):''].filter(Boolean))))),el('button',{class:'oplay','aria-label':`Run ${r.title}`,html:ic('play',18,2),onclick:()=>runRt(r)}));}).map((n,i)=>{const r=list[i];return withPress(n,(x,y)=>{const done=!!(r.runs||{})[tk];openMenu(x,y,[{label:'Run now',icon:'play',onclick:()=>runRt(r)},{label:done?'Mark not done today':'Mark done today',icon:'check',onclick:()=>{toggleItem({kind:'routine',rec:r},tk);App.refresh();toast(done?'Unmarked':`${r.title} done`,()=>{toggleItem({kind:'routine',rec:r},tk);App.refresh();});}},{label:'Edit',icon:'edit',onclick:()=>routineSheet(r)}]);});})));
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
    el('h1',{class:'pgtitle',style:'margin-top:6px'},r.title),r.notes?whyLine(r.notes):null));
  {const runs=rk.length,strk=sched?rtStreak(r):0;page.append(el('p',{class:'rtline'},[sched?rtWhen(r).split(' · ')[0]:null,mins?fmtDur(mins):null,strk>1?`${strk} in a row`:null].filter(Boolean).join(' · ')));}
  if(sched&&r.setTime==null){const sug=rtSuggestTime(r);page.append(el('section',{class:'card',style:'padding:14px 16px;display:flex;flex-direction:column;gap:10px'},el('b',{style:'font-weight:600'},'Give it a time'),el('p',{class:'small muted'},sug.why),el('div',{style:'display:flex;gap:8px'},btnP(`Set for ${fmtT(sug.m)}`,()=>{r.setTime=sug.m;put(r);toast(`${r.title} set for ${fmtT(sug.m)}`,()=>{r.setTime=null;put(r);});},{style:'flex:1'}),btnL('Pick a time',edit))));}
  page.append(el('button',{class:'btn primary block',html:ic('play',18,2)+(doneToday?'Run it again':'Run routine'),onclick:()=>runRt(r)}));
  if(doneToday)page.append(el('p',{class:'small muted',style:'text-align:center;margin-top:-6px'},typeof doneToday==='number'?`Done today at ${clockOf(doneToday)}`:'Done today'));
  else page.append(el('div',{style:'text-align:center;margin-top:-6px'},lnk('Already did it? Mark done',()=>{r.runs=Object.assign({},r.runs,{[tk]:Date.now()});put(r);toast(`${r.title} marked done`,()=>{const x=Object.assign({},r.runs);delete x[tk];r.runs=x;put(r);});})));
  {const card=el('section',{class:'card pcard'});card.append(el('div',{class:'pchead',style:'justify-content:space-between'},el('span',{class:'lbl',style:'font-size:12px;letter-spacing:.14em;font-weight:600;color:var(--ink-2)'},'STEPS'),steps.length>1?lnk('Reorder',edit):null));
    steps.forEach((s,i)=>{const h=s.habit&&get.id(s.habit);card.append(el('button',{class:'prow2',style:'width:100%;text-align:left',onclick:edit},el('span',{class:'rtnum'},String(i+1)),el('span',{class:'grow t'},el('span',{class:'tt'},s.t),h?el('small',{class:'otime',style:'display:block;font-size:12px'},`Checks off ${h.title}`):s.opt?el('small',{class:'muted',style:'display:block;font-size:12px'},'Optional'):null),s.min?el('span',{class:'tside'},`${s.min} min`):null));});
    card.append(el('button',{class:'paddrow',style:'width:100%;text-align:left;color:var(--ink-3);font-size:16.5px',onclick:edit},el('span',{class:'pplus',html:ic('plus',14,2.4)}),'Add a step'));
    page.append(card);}
  if(sched&&r.setTime!=null&&mins)page.append(el('p',{class:'small muted',style:'text-align:center;margin-top:-4px'},`Ends around ${fmtT((r.setTime+mins)%1440)}`));
  {const ins=routineInsights(r);if(ins.length)page.append(lblRow(`What your last ${log.length} runs show`),...ins);}
  const plain=rk.filter(d=>!log.some(x=>k(new Date(x.at))===d)).map(d=>({at:typeof r.runs[d]==='number'?r.runs[d]:fromK(d).getTime(),d})),recent=[...log,...plain].sort((a,b)=>b.at-a.at).slice(0,5);
  if(recent.length){const S2=App.state,op=!!S2._rRec,c=el('div',{class:'card dlcard'},el('button',{class:'donefold'+(op?' open':''),style:'border-top:0','aria-expanded':String(op),onclick:()=>{S2._rRec=!op;if(!op)S2._reveal='rRec';App.refresh();}},el('span',{},`Recent runs · ${rk.length}`),el('span',{class:'chev',html:ic('chevd',16,2.2)})));
    if(op)recent.forEach(x=>{const m=x.marks,sk=x.skippedNames||[];c.append(el('div',{class:'prow2'},el('span',{class:'grow t'},el('span',{class:'tt',style:'font-size:16px'},`${relDay(k(new Date(x.at)))}, ${clockOf(x.at)}`),el('small',{class:'muted',style:'display:block;font-size:12px'},m?`${x.mins} min · ${sk.length?`skipped ${sk.join(', ')}`:`all ${m.length} steps`}`:'Marked done')),m?el('span',{class:'odots ominid','aria-hidden':'true'},m.map(v=>el('i',{class:v?'on':'skip'}))):null));});
    revealRows([...c.children].slice(1),'rRec');page.append(c);}
  const drow=(icn,lab,val)=>el('button',{class:'dlrow',onclick:edit},el('span',{class:'dlic',html:ic(icn,19,1.9)}),el('span',{class:'grow'},lab),el('span',{class:'dlv'},val),el('span',{class:'dlch',html:ic('chevr',15,2.2)}));
  page.append(el('div',{class:'lbl dlhead'},'Details'),el('div',{class:'card dlcard'},sched&&r.setTime!=null?drow('time','Time',fmtT(r.setTime)):null,sched&&r.setTime!=null&&r.reminder!=null?drow('bell','Reminder',r.reminder?'Before the time':'At the time'):null,r.area?drow(areaIcon(r.area),'Life area',r.area):null,editRow(edit)));
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
  if(!ls.length){page.append(emptyOf('Your first list','Groceries, packing, gift ideas, anything.'));{const mine=userTpls().filter(t=>t.kind==='list');if(mine.length)page.append(lblRow('Your templates'),el('div',{class:'chips'},mine.map(t=>tplChip(t,()=>addTemplate(t)))));}root.append(page);return;}
  const go=l=>App.go('list',{id:l.id}),del=l=>{const c=clone(l);remove(l.id);toast('List deleted',()=>put(c));};
  if(pinned.length)page.append(lblRow('Pinned'),el('div',{class:'ogrid'},pinned.map(l=>{const it=l.items||[],open=it.filter(i=>!i.d);return withPress(el('button',{class:'opin','data-k':'lst:'+l.id,onclick:()=>go(l)},el('span',{class:'opinic','aria-hidden':'true',html:ic('pin',14,2)}),el('b',{},l.title),el('small',{class:'opc'},listSub(l)),l.reusable&&it.length?(open.length?meter((it.length-open.length)/it.length):el('span',{class:'chip',role:'button',style:'height:30px;margin-top:6px;align-self:flex-start',onclick:e=>{e.stopPropagation();const b=clone(l.items);l.items.forEach(i=>i.d=false);put(l);toast(`${l.title} reset`,()=>{l.items=b;put(l);});}},'Reset')):el('span',{class:'oprev'},open.slice(0,3).map(i=>el('span',{},el('i'),i.t)))),listMenu(l));})));
  if(rest.length){if(pinned.length)page.append(lblRow('All lists'));page.append(el('div',{class:'list'},rest.map(l=>{const when=timeAgo(l.updatedAt||l.createdAt),row=withPress(el('div',{class:'li',style:'min-height:60px;padding-right:6px','data-k':'lst:'+l.id},el('button',{class:'grow',style:'text-align:left;min-width:0',onclick:()=>go(l)},el('b',{},l.title),el('small',{},[listSub(l),when==='Today'?'':`Updated ${when.toLowerCase()}`,l.reusable?'Reusable':''].filter(Boolean).join(' · '))),el('span',{class:'aichev',html:ic('chevr',16,2.2)})),listMenu(l));swipeRow(row,l.title,()=>del(l));return row;})));}
  root.append(page);
}
function viewList(root,id){
  const l=get.id(id),S=App.state;if(!l){App.back('lists');return;}l.items=l.items||[];l.sections=l.sections||[];const page=el('div',{class:'page olist'});
  /* an item whose section is gone falls back to no section */
  const secOf=i=>l.sections.some(c=>c.id===i.sec)?i.sec:null;
  const open=l.items.filter(i=>!i.d),chk=l.items.filter(i=>i.d),refocus=S.listFocus,editing=S.listEdit===id;S.listFocus=null;if(S.listAddFor!==id){S.listAddSec=null;S.listAddFor=id;}
  const setEdit=on=>{S.listEdit=on?id:null;App.refresh();};
  page.append(pageHead(l.title,open.length?`${open.length} left${l.reusable?' · reusable':''}`:l.items.length?'All checked':'',{back:'Lists',to:'lists',actions:[(l.items.length||l.sections.length)?el('button',{class:'linkbtn olt','aria-pressed':String(editing),onclick:()=>setEdit(!editing)},editing?'Done':'Edit'):null,moreB('List options',e=>{const r=e.currentTarget.getBoundingClientRect();openMenu(r.right,r.bottom+4,listItems(l,{onPage:true}));})]}));
  const adder=(sec,ph)=>{const inputId=sec?`li-new-${sec}`:'li-new',save=()=>{const raw=inp.value.trim();if(!raw)return false;const m=raw.match(/^(.+?),\s+(.+)$/),t=m?m[1]:raw;listPush(l,t,m?m[2]:'',sec||listSecGuess(l,t));inp.value='';put(l,{silent:true});return true;},inp=el('input',{id:inputId,placeholder:ph,'aria-label':ph,autocomplete:'off',enterkeyhint:'done',onkeydown:e=>{if(e.key==='Enter'&&save()){S.listFocus=inputId;App.refresh();}},onpaste:e=>pasteLines(e,ls=>{ls.forEach(t=>listPush(l,t,'',sec||listSecGuess(l,t)));put(l,{silent:true});toast(`${ls.length} items added`);S.listFocus=inputId;App.refresh();}),onblur:()=>{const had=save();if(sec&&S.listAddSec===sec)S.listAddSec=null;if(had||sec)setTimeout(()=>{if(!(document.activeElement&&document.activeElement.id===inputId))App.refresh();},250);}});return inp;};
  let addRow=null,afterAdd=[];if(!editing){const top=adder(null,l.items.length?'Add an item':'Add an item, e.g. Eggs, 1 dozen'),sg=listSuggestBox(l,top,S);top.addEventListener('input',sg._draw);addRow=el('label',{class:'paddrow lstadd'},el('span',{class:'pplus',html:ic('plus',14,2.4)}),top);afterAdd=[sg];const us=listUsuals(l,S);if(us)afterAdd.push(...us);}
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
    else{if(addRow)box.append(addRow);if(box.children.length)page.append(box);page.append(...afterAdd);}};
  block(null);l.sections.forEach(block);
  if(editing)page.append(el('button',{class:'oaddsec',onclick:()=>sectionNameSheet(l)},el('span',{style:'display:grid',html:ic('plus',18,2)}),'Add a section'));
  if(!open.length&&chk.length)page.append(el('div',{class:'ozero',style:'padding-block:14px 2px'},el('span',{class:'ozi',style:'width:64px;height:64px',html:ic('check',28,2)}),el('h2',{style:'font-size:22px'},'Everything’s checked off'),l.reusable?el('p',{},'Uncheck all to use this list again.'):null));
  if(!editing)page.append(el('button',{class:'linkbtn small secadd',onclick:()=>sectionNameSheet(l)},el('span',{style:'display:grid',html:ic('plus',14,2.4)}),'Add a section'));
  if(chk.length){const openC=S.listChecked===true;page.append(el('div',{class:'osech'},el('button',{class:'ochkt','aria-expanded':String(openC),onclick:()=>{S.listChecked=!openC;if(!openC)S._reveal='lChk';App.refresh();}},el('span',{class:'lbl'},`Checked · ${chk.length}`),el('span',{style:'display:grid;color:var(--ink-3)',html:ic(openC?'chevu':'chevd',15,2.2)})),el('span',{style:'flex:1'}),openC?lnk('Uncheck all',()=>{const b=clone(l.items);l.items.forEach(i=>i.d=false);put(l);toast('Unchecked',()=>{l.items=b;put(l);});}):null,openC?lnk('Clear checked',()=>{const b=clone(l.items);l.items=l.items.filter(i=>!i.d);put(l);toast('Cleared',()=>{l.items=b;put(l);});}):null));
    if(openC)page.append(el('div',{class:'list'},revealRows(chk.map(row),'lChk')));}
  root.append(page);if(refocus)setTimeout(()=>{const n=document.getElementById(refocus);n&&n.focus({preventScroll:true});},30);
}

/* ---------- Shared page rows ---------- */
const detailRow=(icon,label,val,fn,{on=false,trailing=null}={})=>el(fn?'button':'div',{class:'row',onclick:fn||null},el('span',{class:'ic',html:ic(icon)}),el('span',{},label),trailing||el('span',{class:'ovalr'+(on?' on':'')},el('span',{class:'clip'},val),fn?el('span',{style:'display:grid',html:ic('chevr',16,2)}):null));
const switchEl=(on,label,fn)=>swMake(on,label,v=>fn(v));
const hideToast=()=>{const t=$('#toast');t&&t.classList.remove('on');};

/* ---------- One habit ---------- */
function habitBest(h){if(habitWeekly(h))return habitStreak(h).n;const ds=Object.keys(h.logs||{}).filter(d=>habitDone(h,d)).sort();if(!ds.length)return 0;let best=0,run=0,d=ds[0];const end=ds[ds.length-1];for(let i=0;i<4000&&d<=end;i++){if(h.days.includes(monIdx(fromK(d)))){if(habitDone(h,d)){run++;best=Math.max(best,run);}else if(!(h.skips&&h.skips[d]))run=0;}d=addK(d,1);}return Math.max(best,habitStreak(h).n);}
function habitMonthRate(h,y,m){const tk=todayK(),st=habitStart(h),len=new Date(y,m+1,0).getDate();let due=0,n=0;for(let i=1;i<=len;i++){const d=k(new Date(y,m,i));if(d>tk||d<st)continue;if(h.paused&&!habitDone(h,d)&&(!h.pausedAt||d>=k(new Date(h.pausedAt))))continue;if(habitWeekly(h)){due++;if(habitDone(h,d))n++;continue;}if(!h.days.includes(monIdx(fromK(d)))||(h.skips&&h.skips[d]))continue;const dn=habitDone(h,d);if(d===tk&&!dn)continue;due++;if(dn)n++;}if(!due)return null;return habitWeekly(h)?Math.min(1,n/Math.max(1,(h.target||1)*due/7)):n/due;}
function viewHabit(root,id){
  const h=get.id(id);if(!h){App.back('habits');return;}const S=App.state,tk=todayK(),page=el('div',{class:'page'+(h.paused?' held':'')});
  const v=S.habMonth||monthKey(today()),y=+v.slice(0,4),m=+v.slice(5)-1,s=h.paused&&h.pausedStreak?h.pausedStreak:habitStreak(h),weekly=habitWeekly(h),best=habitBest(h),rate=habitMonthRate(h,y,m),parent=h.part&&get.id(h.part),edit=()=>habitSheet(h);
  const skipped=!!(h.skips&&h.skips[tk]),done=habitDone(h,tk);
  const when=[h.track==='time'?`${h.goalN} min`:h.track==='count'?`${h.goalN} ${h.unit||'a day'}`:null,habitSched(h),h.setTime!=null?fmtT(h.setTime):null].filter(Boolean);
  page.append(el('header',{},el('div',{class:'pghead'},backBtn('Habits','habits'),moreB('Habit options',e=>openMenu(e.clientX,e.clientY,[{label:'Edit',icon:'edit',onclick:edit},(!h.track||h.track==='check')&&!(h.link&&h.link.log)&&typeof wkLinkSheet==='function'?{label:'Link a workout log',icon:'layers',onclick:()=>wkLinkSheet(h)}:null,{label:h.paused?'Resume':'Pause',icon:'time',onclick:()=>{setHabitPaused(h,!h.paused);toast(h.paused?'Paused. History kept.':'Resumed');}},{label:'Mark as built',icon:'star',onclick:()=>{h.archived=true;h.built=true;h.archivedAt=Date.now();put(h);App.back('habits');toast(`${h.title} is built. Find it in Archive.`);}},{label:'Archive',icon:'archive',onclick:()=>{archiveFlow(h);App.back('habits');}},{label:'Delete',icon:'trash',danger:true,onclick:()=>askConfirm({title:`Delete ${h.title}?`,body:'Its history goes too. It stays in Recently deleted for 30 days.',yes:'Delete',no:'Keep it',onYes:()=>{const c=clone(h);remove(h.id);App.back('habits');toast('Habit deleted',()=>put(c));}})}]))),
    h.paused?el('div',{class:'tags',style:'margin-top:4px'},(()=>{const p=pill('Paused','warn');p.dataset.hb='1';return p;})()):null,
    el('h1',{class:'pgtitle',style:'margin-top:6px'},h.title),h.notes?whyLine(h.notes):null,el('div',{class:'small muted hwhen',style:'margin-top:6px'},(weekly?[`${habitWeek(h,tk)} of ${h.target||1} this week`,s.n>1?`${s.n}-week streak`:null]:[s.n?`${s.n}-day streak`:'No streak yet',best>s.n?`best ${best}`:null]).filter(Boolean).join(' · '),!h.paused&&habitWeekly(h)&&(h.target||1)<7?(()=>{const up=Object.keys(h.sessions||{}).filter(d=>d>=tk).sort();return el('button',{class:'hplan',onclick:()=>habitPlanSheet(h)},el('span',{style:'display:grid',html:ic('cal',14,2)}),up.length?`Planned ${up.slice(0,2).map(d=>relDay(d)).join(', ')}${up.length>2?` +${up.length-2}`:''}`:'Plan a session');})():null)));
  const skipBtn=btnL(skipped?'Skipped':'Skip today',()=>{const was=clone(h.skips||{}),wasL=clone(h.logs||{});h.skips=h.skips||{};if(skipped)delete h.skips[tk];else{h.skips[tk]=true;if(h.logs)delete h.logs[tk];}put(h);toast(skipped?'Skip removed':'Skipped today. Your streak is safe.',()=>{h.skips=was;h.logs=wasL;put(h);});});
  const cnt=typeof (h.logs||{})[tk]==='number'?h.logs[tk]:(h.logs||{})[tk]?h.goalN:0;const mainBtn=h.track==='count'?(cnt>=(h.goalN||1)?el('button',{class:'btn line hdoneb',onclick:()=>habitCountSheet(h,tk)},el('span',{style:'display:inline-flex;align-items:center;gap:6px'},el('span',{style:'display:grid',html:ic('check',16,2.8)}),`Done today · ${cnt} of ${h.goalN}`)):btnP(`+1 · ${cnt} of ${h.goalN}`,()=>logHabit(h,tk,1))):h.track==='time'?btnP(`Log time · ${habitMeta(h,tk)}`,()=>logTimeSheet(h,tk)):el('button',{class:'btn '+(done?'line hdoneb':'primary'),onclick:()=>{toggleItem({kind:'habit',rec:h},tk);App.refresh();}},done?el('span',{style:'display:inline-flex;align-items:center;gap:6px'},el('span',{style:'display:grid;color:var(--accent-text)',html:ic('check',16,2.8)}),'Done today',el('span',{class:'muted',style:'font-weight:500'},'· Undo')):'Done today');
  const linkedRs=!h.paused&&h.link&&h.link.log&&!done;if(linkedRs&&mainBtn.classList)mainBtn.className='btn line';
  page.append(h.paused?el('div',{class:'ochk ohact'},btnP('Resume habit',()=>{setHabitPaused(h,false);toast('Resumed');App.refresh();},{style:'flex:1'})):el('div',{class:'ochk ohact'},linkedRs?wkStartBtn(h):(weekly?null:skipBtn),mainBtn));
  {const ls=h.link&&h.link.log?wkLinkedSection(h):null;if(ls)page.append(ls);}
  if(missedYesterday(h)&&!done)page.append(el('div',{class:'donebar warn',style:'margin-top:0'},'Missed yesterday. Never miss twice.'));
    {const start=h.startDate||k(new Date(h.createdAt||Date.now())),now=today(),ms=[];for(let i=11;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);if(k(new Date(d.getFullYear(),d.getMonth()+1,0))<start)continue;ms.push([d.getFullYear(),d.getMonth()]);}
    const rs=ms.map(([yy,mm])=>habitMonthRate(h,yy,mm));if(ms.length>=2&&rs.some(x=>x>0)){const bestI=rs.reduce((bi,r,i)=>(r||0)>(rs[bi]||0)?i:bi,0);
      page.append(lblRow('By month'),el('section',{class:'card hmonths'},el('div',{class:'hmbars'},ms.map(([yy,mm],i)=>{const r=rs[i],on=v===`${yy}-${String(mm+1).padStart(2,'0')}`;return el('button',{class:'hmb'+(on?' on':''),'aria-label':`${MONL[mm]} ${yy}: ${r==null?'no data':Math.round(r*100)+'%'}`,onclick:()=>{S.habMonth=`${yy}-${String(mm+1).padStart(2,'0')}`;App.refresh();}},el('span',{class:'hmv'},r==null?'–':`${Math.round(r*100)}`),el('i',{style:`height:${Math.max(3,Math.round((r||0)*64))}px`}),el('small',{},MONL[mm].slice(0,1)));}))));}}
/* history */
  const ws=get.settings().weekStart??1,first=new Date(y,m,1),lead=(first.getDay()-ws+7)%7,len=new Date(y,m+1,0).getDate(),g=el('div',{class:'calgrid'},Array.from({length:7},(_,i)=>el('span',{},DOW[(ws+i)%7][0])));
  for(let i=0;i<lead;i++)g.append(el('i'));
  for(let d=1;d<=len;d++){const dk=k(new Date(y,m,d)),on=habitDone(h,dk),sk=h.skips&&h.skips[dk],miss=habitDotState(h,dk)==='miss';g.append(el('button',{class:[on?'on':sk?'skip':miss?'miss':'',dk===tk?'isday':''].filter(Boolean).join(' '),disabled:dk>tk,'aria-label':shortDay(dk)+(dk===tk?', today':'')+(on?', done':sk?', skipped':miss?', missed':''),'aria-pressed':String(on),'data-hd':dk,onclick:()=>{if(h.track==='time'){logTimeSheet(h,dk);return;}App.state._hcFill={dk,on:!on};if(h.link&&h.link.log){wkHabitToggle(h,dk);App.refresh();toast(`${relDay(dk)} ${on?'cleared':'filled in'}`);return;}const was=clone(h.logs||{}),wasS=clone(h.skips||{});h.logs=h.logs||{};if(on)delete h.logs[dk];else{h.logs[dk]=h.track==='count'?h.goalN:true;if(h.skips)delete h.skips[dk];}put(h);const n=habitStreak(h);toast(`${relDay(dk)} ${on?'cleared':'filled in'}${n.n?` · ${n.n}-${n.unit} streak`:''}`,()=>{h.logs=was;h.skips=wasS;put(h);});}},String(d)));}
  const shift=n=>{const x=new Date(y,m+n,1);S.habMonth=monthKey(x);App.refresh();};
  page.append(el('div',{class:'sh2'},el('span',{class:'lbl'},'History')),el('div',{class:'card',style:'padding:14px'},el('div',{class:'pghead',style:'margin-bottom:8px'},el('button',{class:'iconbtn green','aria-label':'Previous month',html:ic('chevl',20,2),onclick:()=>shift(-1)}),el('b',{},`${MONL[m]} ${y}`),el('button',{class:'iconbtn green','aria-label':'Next month',disabled:v===monthKey(today()),html:ic('chevr',20,2),onclick:()=>shift(1)})),g,el('div',{class:'olegend',style:'margin-top:12px;padding:0'},[['on','Done'],['miss','Missed'],['skip','Skipped']].map(([c,t])=>el('span',{},el('span',{class:'odots'},el('i',{class:c})),t)))));
  if(parent)page.append(lblRow('Part of'),el('div',{class:'list'},el('button',{class:'li',style:'min-height:60px',onclick:()=>App.go('plan',{id:parent.id})},rtCircle('target','var(--accent)'),el('span',{class:'grow'},el('b',{style:'font-weight:500'},parent.title),el('small',{},[KINDN[parent.kind]||'Goal',parent.kind==='goal'?goalTrackText(parent):'',parent.kind==='goal'?goalPace(parent):''].filter(Boolean).join(' · '))),el('span',{class:'chev',html:ic('chevr',16,2)}))));
  {const tod=h.tod==='set'&&h.setTime!=null?fmtT(h.setTime):h.tod&&h.tod!=='anytime'?(TOD.find(t=>t[0]===h.tod)||[])[1]:null;
    page.append(lblRow('Details'),el('div',{class:'group'},detailRow('rep','How often',habitSched(h),edit),tod?detailRow('time','Time of day',tod,edit):null,h.track==='time'||h.track==='count'?detailRow('hour','Track by',h.track==='time'?`Time · ${h.goalN} min`:`Count · ${h.goalN}${h.unit?' '+h.unit:''}`,edit):null,h.reminder!=null&&h.setTime!=null?detailRow('bell','Reminder',h.reminder?'Before the time':`At ${fmtT(h.setTime)}`,edit):null,h.area?detailRow(areaIcon(h.area),'Life area',h.area,edit):null,h.paused?detailRow('play','Status','Paused',()=>{setHabitPaused(h,false);toast('Resumed');App.refresh();}):null,(()=>{const x=detailRow('edit','Edit details','',edit);x.classList.add('dledit');return x;})()));}
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
  /* one card (progress + milestones), one main button, then linked work and details as rows */
  const pc=goalProgress(r),pa=goalPace(r),tr=r.track||'milestones',st=r.steps||[],done=st.filter(s=>s.d).length,edit=()=>goalSheet(r),S2=App.state;
  const wk=r.deadline?Math.round(dayCount(r.deadline)/7):null;
  const card=el('section',{class:'card pcard'});
  card.append(el('div',{class:'pchead'},tr==='done'?el('span',{class:'oric',style:'width:58px;height:58px',html:ic(r.finished?'check':'target',26)}):el('span',{class:'ring',style:`--p:${pc*100}`},el('span',{},`${Math.round(pc*100)}%`)),el('span',{class:'grow'},el('b',{},tr==='milestones'?(st.length?`${done} of ${st.length} milestones`:'No milestones yet'):goalTrackText(r)||(r.finished?'Achieved':'Not achieved yet')),
    el('small',{class:goalLate(r)||pa==='Behind'?'olate':''},r.finished?'Achieved':r.deadline?(goalLate(r)?`Was due ${fmtMD(r.deadline)}`:[wk>1?`${wk} weeks left`:`Due ${relDay(r.deadline)}`,pa&&pa!=='On pace'?pa:null].filter(Boolean).join(' · ')):''))));
  if(tr==='milestones'){const open=st.filter(s=>!s.d),fin=st.filter(s=>s.d);
    const mrow=s=>{const when=s.date?sideDay(s.date):s.planWeek?`Wk of ${shortDay(s.planWeek)}`:s.planMonth?MON[+s.planMonth.slice(5)-1]:'';const x=el('div',{class:'prow2 tick-host'+(s.d?' done':'')},el('span',{class:'tick-hit'},tickBtn(s.d,on=>{x.classList.toggle('done',on);s.d=on;s.doneAt=on?Date.now():null;put(r,{silent:true});if(on&&!st.every(q=>q.d))toast('Milestone done',()=>{s.d=false;s.doneAt=null;put(r);});setTimeout(()=>{if(on&&st.every(q=>q.d)&&!r.finished)achieveSheet(r);else App.refresh();},on?430:200);})),el('button',{class:'grow t',onclick:()=>milestoneSheet(r,s)},el('span',{class:'tt'},s.t)),when&&!s.d?(typeof when==='string'?el('span',{class:'tside'},when):when):null);return x;};
    capRows(open.map(mrow),'g'+r.id,10).forEach(n=>card.append(n));
    if(!r.finished)card.append(el('button',{class:'paddrow',style:'width:100%;text-align:left;color:var(--ink-3);font-size:16.5px',onclick:()=>milestoneSheet(r)},el('span',{class:'pplus',html:ic('plus',14,2.4)}),'Add a milestone'));
    if(fin.length){const op=!!S2._gDone;card.append(el('button',{class:'donefold'+(op?' open':''),'aria-expanded':String(op),onclick:()=>{S2._gDone=!op;if(!op)S2._reveal='gDone';App.refresh();}},el('span',{},`Done · ${fin.length}`),el('span',{class:'chev',html:ic('chevd',16,2.2)})));if(op)revealRows(fin.map(mrow),'gDone').forEach(n=>card.append(n));}}
  page.append(card);
  if(!r.finished){const all=tr==='milestones'&&st.length&&done===st.length;
    page.append(tr==='number'?btnP('Log progress',()=>logNumberSheet(r)):all||tr==='done'?btnP('Mark achieved',()=>achieveSheet(r)):btnP('Check in',()=>goalCheckSheet(r)));
    if((r.checks||[]).length){const c=r.checks[r.checks.length-1];page.append(el('p',{class:'small muted',style:'text-align:center;margin-top:-4px'},`Last check-in ${relDay(c.date)}: ${c.status}`));}}
  const fc=forecastCard(r);if(fc)page.append(...fc);
  const L=linkedOf(r),items=[...L.projects.map(x=>[x,'project',`${projectTasks(x).filter(taskDone).length} of ${projectTasks(x).length} tasks`]),...L.habits.map(x=>{const hs=habitStreak(x);return[x,'habit',habitWeekly(x)?`${habitWeek(x,todayK())} of ${x.target} this week`:hs.n>1?`${hs.n}-${hs.unit} streak`:'Habit'];}),...L.tasks.map(x=>[x,'task',taskDone(x)?'Done':x.date?relDay(x.date):'No date'])];
  const drow=(icn,lab,val,fn,trail)=>el(fn?'button':'div',{class:'dlrow',onclick:fn||null},el('span',{class:'dlic',html:ic(icn,19,1.9)}),el('span',{class:'grow'},lab),trail||el('span',{class:'dlv'},val),trail?null:el('span',{class:'dlch',html:ic('chevr',15,2.2)}));
  if(items.length)page.append(el('div',{class:'lbl dlhead'},'Moves it forward'),el('div',{class:'card dlcard'},items.map(([x,kd,sub])=>drow(kd==='project'?'project':kd==='habit'?'habit':'task',x.title,sub,()=>openRec(x)))));
  const parent=r.part&&get.id(r.part);
  page.append(el('div',{class:'lbl dlhead'},'Details'),el('div',{class:'card dlcard'},r.area?drow(areaIcon(r.area),'Life area',r.area,edit):null,parent?drow('layers','Part of',parent.title,()=>App.go('plan',{id:parent.id})):null,r.checkIn==='monthly'||r.checkIn==='off'?drow('bell','Check in',r.checkIn==='off'?'Off':'Monthly',edit):null,editRow(edit)));
  const recent=[...st.filter(s=>s.d&&s.doneAt).map(s=>({at:s.doneAt,t:`Checked off ${s.t}`,w:relDay(k(new Date(s.doneAt)))})),...(r.checks||[]).map(c=>({at:fromK(c.date).getTime(),t:`Check-in: ${c.status}${c.note?`. “${c.note}”`:''}`,w:relDay(c.date)})),...(r.numLog||[]).map(x=>({at:x.at,t:`Logged ${x.v} ${r.numUnit||''}`.trim(),w:relDay(k(new Date(x.at)))}))].sort((a,b)=>b.at-a.at).slice(0,6);
  if(recent.length){const op=!!S2._gRec;const c=el('div',{class:'card dlcard'},el('button',{class:'donefold'+(op?' open':''),style:'border-top:0','aria-expanded':String(op),onclick:()=>{S2._gRec=!op;if(!op)S2._reveal='gRec';App.refresh();}},el('span',{},`Recent · ${recent.length}`),el('span',{class:'chev',html:ic('chevd',16,2.2)})));if(op)c.append(...revealRows([el('div',{class:'orecent',style:'padding-bottom:12px'},recent.map(x=>el('div',{},el('i'),el('span',{},el('span',{style:'display:block'},x.t),el('small',{},x.w)))))],'gRec'));page.append(c);}
}
const ptLate=t=>!taskDone(t)&&t.date&&(!t.repeat||t.repeat.type==='never')&&t.date<todayK();
const ptMeta=t=>{if(ptLate(t)){const n=daysBetween(t.date,todayK());return el('span',{class:'olate'},n<=1?'1 day late':`${n} days late`);}return ptWhen(t);};
const ptWhen=t=>t.date?relDay(nextOcc(t))+(t.time!=null?' · '+fmtT(t.time):''):t.planWeek?`Week of ${shortDay(t.planWeek)}`:'Not planned yet';
const habitsToday=(dk=todayK())=>get.all('habit').filter(h=>habitDue(h,dk)&&(!habitWeekly(h)||habitDone(h,dk)||habitWeek(h,dk)<(h.target||1)));
