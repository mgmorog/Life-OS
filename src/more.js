/* ---------- More, search, and every place behind it ---------- */
const PLACES={
 inbox:{n:'Inbox',i:'inbox',g:'organize'},tasks:{n:'Tasks',i:'task',g:'organize'},habits:{n:'Habits',i:'habit',g:'organize'},routines:{n:'Routines',i:'routine',g:'organize'},projects:{n:'Projects',i:'project',g:'organize'},goals:{n:'Goals',i:'target',g:'organize'},lists:{n:'Lists',i:'list',g:'organize'},
 photos:{n:'Photos',i:'image'},trash:{n:'Recently deleted',i:'trash'},
 reviews:{n:'Reviews',i:'clip',g:'reflect'},insights:{n:'Insights',i:'chart',g:'reflect'},discover:{n:'Discover',i:'compass'},tools:{n:'Tools & Resources',i:'books'},archive:{n:'Archive',i:'archive'},areas:{n:'Life Areas',i:'heart'},
 today:{n:'Today',i:'sun'},studio:{n:'Studio',i:'layers'},calendar:{n:'Calendar',i:'cal'},
};
const backBtn=(label='More',to='more')=>el('button',{class:'back',onclick:()=>App.back(to),html:ic('chevl',20,2.2)+esc(label)});
function pageHead(title,sub,{back='More',to='more',actions=null}={}){return el('header',{},el('div',{class:'pghead'},backBtn(back,to),actions?el('div',{style:'display:flex;gap:2px;align-items:center'},actions):null),el('h1',{class:'pgtitle',style:'margin-top:4px'},title),sub?el('div',{class:'small muted',style:'margin-top:4px'},sub):null);}
function placeCount(id){
  const tk=todayK();
  switch(id){
    case 'inbox':{const n=get.all('idea').length;return{c:n||'',s:n?`${n} idea${n>1?'s':''} to sort`:'Nothing to sort'};}
    case 'tasks':{const d=carried().length+get.all('task').filter(t=>t.date&&occursOn(t.date,t.repeat,tk,t.skip)&&!isDone(t,tk)).length;return{c:d?`${d} today`:'',s:d?`${d} left today`:`${get.all('task').filter(isOpenTask).length} open`};}
    case 'habits':{const hs=get.all('habit'),l=habitsToday().filter(h=>!habitDone(h,tk)).length;return{c:l?`${l} left`:'',s:hs.length?(l?`${l} left today`:`${hs.length} active`):'None yet'};}
    case 'routines':{const r=get.all('routine');return{c:'',s:r.length?`${r.length} routine${r.length>1?'s':''}`:'None yet'};}
    case 'projects':{const p=get.all('project');return{c:'',s:p.length?`${p.length} active`:'None yet'};}
    case 'goals':{const g=get.all('goal');return{c:'',s:g.length?`${g.length} active`:'None yet'};}
    case 'lists':{const l=get.all('list');return{c:'',s:l.length?`${l.length} list${l.length>1?'s':''}`:'Shopping, packing, anything'};}
    case 'reviews':return{c:'',s:`Weekly review due ${DOW[get.settings().reviewDay??0].slice(0,3)}`};
    case 'insights':return{c:'',s:'Plans vs. what happened'};
    default:return{c:'',s:''};
  }
}
const readRecent=()=>{try{return JSON.parse(localStorage.getItem('lifeos-recent')||'[]');}catch(e){return[];}};
function noteRecent(r){if(!r||!r.id)return;const list=readRecent().filter(x=>x!==r.id);list.unshift(r.id);try{localStorage.setItem('lifeos-recent',JSON.stringify(list.slice(0,6)));}catch(e){}}
const KINDN={task:'Task',block:'Time block',allday:'All-day',habit:'Habit',goal:'Goal',project:'Project',routine:'Routine',list:'List',idea:'Idea',resource:'Resource',wait:'Waiting on'};
const KINDI={task:'task',block:'hour',allday:'cal',habit:'habit',goal:'target',project:'project',routine:'routine',list:'list',idea:'inbox',resource:'books',wait:'time'};
function openRec(r){switch(r.kind){case 'task':taskSheet(r);break;case 'block':blockSheet(r);break;case 'allday':alldaySheet(r);break;case 'habit':App.go('habit',{id:r.id});break;case 'goal':App.go('plan',{id:r.id});break;case 'project':App.go('plan',{id:r.id});break;case 'routine':App.go('routine',{id:r.id});break;case 'list':App.go('list',{id:r.id});break;case 'idea':captureSheet(r);break;case 'resource':resourceSheet(r);break;case 'wait':waitSheet(r);break;}noteRecent(r);}
function viewMore(root){
  const S=get.settings(),page=el('div',{class:'page'});
  page.append(el('div',{class:'pghead'},el('h1',{class:'pgtitle',style:'font-size:54px;font-weight:400'},'More'),el('button',{class:'iconbtn green','aria-label':'Settings',html:ic('gear',24),onclick:()=>App.go('prefs')})));
  page.append(el('button',{class:'searchbox',style:'color:var(--ink-3);width:100%;flex:none',onclick:()=>{App.state.qType='All';App.go('search');},html:ic('search',20,2)+'<span>Search everything</span>'}));
  page.append(el('div',{class:'pghead'},el('span',{class:'lbl'},'Pinned'),el('button',{class:'linkbtn',onclick:editPins},'Edit')));
  page.append(el('div',{class:'pins'},(S.pinned||[]).map(id=>{const p=pinInfo(id);if(!p)return null;return el('button',{class:'ptile','aria-label':p.c?`${p.n}, ${p.c}`:p.n,onclick:p.go},el('span',{class:'ic',html:ic(p.i,22,1.7)}),el('span',{class:'clip',style:'max-width:100%'},p.n),p.c?el('span',{class:'cnt'},String(parseInt(p.c)||p.c)):null);})));
  const rec=readRecent().map(id=>get.id(id)).filter(r=>r&&!r.archived).slice(0,4);
  if(rec.length)page.append(el('div',{class:'lbl'},'Recent'),el('div',{class:'list'},rec.map(r=>el('button',{class:'li',style:'min-height:52px',onclick:()=>openRec(r)},el('span',{style:'color:var(--accent-text);display:grid',html:ic(KINDI[r.kind],18)}),el('span',{class:'grow clip'},r.title),el('small',{class:'small muted'},KINDN[r.kind])))));
  const absent=['today','studio','calendar'].filter(x=>!(S.nav||[]).includes(x));
  if(absent.length)page.append(el('div',{class:'lbl'},'Main views'),el('div',{class:'list'},absent.map(x=>el('button',{class:'li',style:'min-height:56px',onclick:()=>App.go(x)},el('span',{class:'sq',html:ic(PLACES[x].i,20,1.7)}),el('span',{class:'grow'},el('b',{},PLACES[x].n)),el('span',{class:'chev',html:ic('chevr',16,2)})))));
  page.append(el('div',{class:'lbl'},'Browse all'));
  const row=(i,n,s,on)=>el('button',{class:'li',onclick:on},el('span',{class:'sq',html:ic(i,20,1.7)}),el('span',{class:'grow'},el('b',{style:'font-size:17px'},n),el('small',{},s)),el('span',{class:'chev',html:ic('chevr',18,2)}));
  const areas=S.areas||AREAS,arch=[...recs.values()].filter(r=>r.archived).length,tools=get.all('resource').length;
  page.append(el('div',{class:'list'},
    row('grid','Organize','Inbox, Tasks, Habits + 4 more',()=>App.go('organize')),
    row('heart','Life Areas',`${areas.slice(0,3).join(', ')}${areas.length>3?` + ${areas.length-3} more`:''}`,()=>App.go('areas')),
    row('clip','Reflect',placeCount('reviews').s,()=>App.go('reflect')),
    row('compass','Discover','Ideas worth trying',()=>App.go('discover')),
    row('books','Tools & Resources',tools?`${tools} saved`:'Templates and references',()=>App.go('tools'))),
    el('div',{class:'lbl'},'Kept'),el('div',{class:'list'},
    row('image','Photos',(()=>{const n=allPhotos().length;return n?`${n} attached`:'Everything you’ve attached';})(),()=>App.go('photos')),
    row('archive','Archive',arch?`${arch} finished and hidden`:'Nothing archived',()=>App.go('archive')),
    row('trash','Recently deleted',(()=>{const n=get.all('trashed').length;return n?`${n} kept for 30 days`:'Kept for 30 days';})(),()=>App.go('trash'))));
  root.append(page);
}
/* choose a few places and put them in order: used by pins and the bottom bar */
function orderSheet({title,init,max,word,limit,groups,info,exact=false,onDone}){
  let D=init.slice(),inst,nudge='';
  inst=openSheet({title,left:{label:'Cancel'},right:{label:'Done',onclick:()=>{if(exact&&D.length!==max){nudge=`Pick ${max} to finish.`;draw();return;}onDone(D);inst.close();}},build:body=>{
    box=el('div',{style:'display:grid;gap:14px'});draw();body.append(box);}});
  var box;
  function toTop(){const sb=box.closest('.sbody');if(sb)sb.scrollTop=0;}
  function draw(){if(!box)return;box.innerHTML='';const full=D.length>=max;
    box.append(el('p',{class:'small',role:'status',style:nudge?'font-weight:600;color:var(--now)':'color:var(--ink-2)'},nudge||`${D.length} of ${max} ${word}. Drag to set the order.`));
    const icon=id=>el('span',{class:'sq',html:ic(info(id).i,20)});
    if(D.length){const list=el('div',{class:'list'});D.forEach((id,i)=>{const r=el('div',{class:'li',style:'min-height:54px','data-i':String(i)},icon(id),el('span',{class:'grow'},el('b',{style:'font-weight:500'},info(id).n)),el('button',{class:'iconbtn','aria-label':`Remove ${info(id).n}`,style:'width:40px;height:40px;color:var(--ink-3)',html:ic('x',16,2),onclick:()=>{D=D.filter(x=>x!==id);nudge='';draw();}}));const h=el('span',{class:'grip','aria-label':`Drag ${info(id).n} to reorder`,html:sv('<circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/>',18)});r.append(h);list.append(r);reorderable(h,r,list,()=>{const c=D.slice();D=[...list.children].map(n=>c[+n.dataset.i]);draw();});});box.append(list);}
    const pickRow=id=>el('button',{class:'li'+(full?' pinfull':''),style:'min-height:54px',onclick:()=>{if(full){nudge=limit;draw();toTop();return;}D.push(id);nudge='';draw();toTop();}},icon(id),el('span',{class:'grow'},el('b',{style:'font-weight:500'},info(id).n)),el('span',{style:'display:grid;color:var(--accent-text)',html:ic('plus',18,2)}));
    groups.forEach(([label,ids])=>{const f=ids.filter(x=>!D.includes(x));if(f.length)box.append(el('div',{class:'lbl'},label),el('div',{class:'list'},f.map(pickRow)));});}
  return inst;
}
const pinInfo=id=>{if(id&&id.startsWith('area:')){const a=id.slice(5);return (get.settings().areas||AREAS).includes(a)?{n:a,i:'leaf',go:()=>App.go('area',{name:a}),c:''}:null;}const p=PLACES[id];if(!p)return null;return{n:p.n,i:p.i,go:()=>App.go(id),c:placeCount(id).c};};
function editPins(){const s=get.settings();orderSheet({title:'Edit pinned',init:(s.pinned||[]).filter(pinInfo),max:4,word:'pinned',limit:'Four is the limit. Remove one to add another.',info:pinInfo,groups:[['Places',['inbox','tasks','habits','goals','projects','routines','lists','reviews','insights','discover','tools','photos','archive','trash','today','calendar','studio','areas']],['Life areas',(s.areas||AREAS).map(a=>'area:'+a)]],onDone:D=>setSettings({pinned:D})});}
/* search */
function searchIndex(){
  const out=[];const push=(type,t,sub,icon,go,n,m)=>out.push(Object.assign({type,t:t||'',sub,icon,go,n:n||''},m||{}));const cd=r=>r.createdAt?k(new Date(r.createdAt)):null;
  get.all('task').forEach(r=>push('Tasks',r.title,`${r.date?relDay(r.date):'No date'}${r.area?' · '+r.area:''}`,'task',()=>openRec(r),r.notes,{a:r.area,d:r.date||cd(r)}));
  [...get.all('block'),...get.all('allday')].forEach(r=>push('Events',r.title,`${relDay(r.date||r.start)}${r.kind==='block'?' · '+fmtT(r.start):''}`,'cal',()=>openRec(r),r.notes,{a:r.area,d:r.date||r.start}));
  get.all('habit').forEach(r=>push('Habits',r.title,`${r.target} times a week`,'habit',()=>openRec(r),r.notes,{a:r.area,d:cd(r)}));
  get.all('goal').forEach(r=>push('Goals',r.title,r.area||'Goal','target',()=>openRec(r),r.notes,{a:r.area,d:cd(r)}));
  get.all('project').forEach(r=>push('Projects',r.title,r.area||'Project','project',()=>openRec(r),r.notes,{a:r.area,d:cd(r)}));
  get.all('goal').forEach(p=>(p.steps||[]).forEach(s=>push('Steps',s.t,`Step in “${p.title}”`,'list',()=>openRec(p))));
  get.all('task').forEach(r=>(r.steps||[]).forEach(s=>push('Steps',s.t,`Step in “${r.title}”`,'list',()=>openRec(r))));
  get.all('idea').forEach(r=>push('Ideas',r.title||r.notes,'In your Inbox','inbox',()=>openRec(r),r.title?r.notes:'',{d:cd(r)}));
  get.all('list').forEach(l=>{push('Lists',l.title,`${(l.items||[]).length} items`,'list',()=>openRec(l));(l.items||[]).forEach(i=>push('Lists',i.t,`In “${l.title}”`,'list',()=>openRec(l),i.note));});
  get.all('routine').forEach(r=>push('Routines',r.title,'Routine','routine',()=>openRec(r)));
  get.all('wait').forEach(r=>push('Tasks',r.title,`Waiting on${r.who?' '+r.who:''}${r.done?' · received':''}`,'time',()=>openRec(r),r.notes,{d:r.since}));
  (get.settings().areas||AREAS).forEach(a=>{push('Hubs',a,'Life area','heart',()=>App.go('area',{name:a}));toolsOf(a).filter(t=>!hubHidden(a).includes(t.id)&&!t.priv).forEach(t=>push('Hubs',t.name,`In ${a}`,t.icon||'grid',()=>App.go('tool',{hub:a,tool:t.id})));});
  get.all('entry').filter(x=>!isCfg(x)).forEach(x=>{const t=toolOf(x.hub,x.tool);if(t&&!t.priv)push('Hubs',t.title(x),`${t.name} · ${x.hub}`,t.icon||'grid',()=>App.go('tool',{hub:x.hub,tool:x.tool}),x.f.secret==='Yes'?'':[x.f.note,x.f.how,x.f.ing,x.f.impact,x.f.result].filter(v=>typeof v==='string').join(' '),{a:x.hub,d:(x.f.date&&/^\d{4}-/.test(x.f.date)?x.f.date:cd(x))});});
  allPhotos().forEach(({r,title,what})=>{if(!out.some(o=>o.type==='Photos'&&o.t===title))push('Photos',title,`Photo · ${what}`,'image',()=>openPhotoRec(r));});
  get.all('resource').forEach(r=>push('Tools',r.title,r.area||'Resource','books',()=>openRec(r)));
  TEMPLATES.forEach(t=>push('Tools',t.t,'Template','books',()=>App.go('tools')));
  Object.entries(PLACES).forEach(([id,p])=>push('Places',p.n,'Open','arrow',()=>App.go(id)));
  return out;
}
const readSearches=()=>{try{return JSON.parse(localStorage.getItem('lifeos-searches')||'[]');}catch(e){return[];}};
function saveSearch(q){q=(q||'').trim();if(q.length<2)return;const l=readSearches().filter(x=>x.toLowerCase()!==q.toLowerCase());l.unshift(q);try{localStorage.setItem('lifeos-searches',JSON.stringify(l.slice(0,5)));}catch(e){}}
const readOpened=()=>{try{return JSON.parse(localStorage.getItem('lifeos-opened')||'[]');}catch(e){return[];}};
function saveOpened(h){const l=readOpened().filter(x=>!(x.type===h.type&&x.t===h.t));l.unshift({type:h.type,t:h.t});try{localStorage.setItem('lifeos-opened',JSON.stringify(l.slice(0,5)));}catch(e){}}
function viewSearch(root){
  const S=App.state;S.q=S.q||'';S.qType=S.qType||'All';
  const page=el('div',{class:'page'});
  const results=el('div',{class:'page',style:'gap:8px'}),chips=el('div',{class:'fchips'});
  const scoped=S.qType!=='All'?S.qType.toLowerCase():null;const input=el('input',{id:'q',placeholder:scoped?`Search ${scoped}`:'Search everything',value:S.q,autocomplete:'off',enterkeyhint:'search','aria-label':'Search everything',oninput:e=>{S.q=e.target.value;draw();}});
  const clr=el('button',{class:'iconbtn','aria-label':'Clear search',style:'width:32px;height:32px;margin-right:-6px;flex:none',hidden:!S.q,html:ic('x',16,2.2),onclick:()=>{S.q='';input.value='';clr.hidden=true;draw();input.focus();}});input.addEventListener('input',()=>{clr.hidden=!input.value;});
  page.append(el('div',{style:'display:flex;align-items:center;gap:10px'},el('label',{class:'searchbox',html:ic('search',20,2)},input,clr),el('button',{class:'linkbtn',onclick:()=>{S.q='';S.qType='All';App.back('more');}},'Cancel')),chips,results);
  const hl=(t,q)=>{const i=t.toLowerCase().indexOf(q);if(i<0)return esc(t);return esc(t.slice(0,i))+'<mark>'+esc(t.slice(i,i+q.length))+'</mark>'+esc(t.slice(i+q.length));};
  const draw=()=>{const q=S.q.trim().toLowerCase();chips.innerHTML='';results.innerHTML='';
    if(!q){const rs=readSearches();if(rs.length&&!scoped)results.append(el('div',{class:'sh2'},el('span',{class:'lbl'},'Recent'),lnk('Clear',()=>{try{localStorage.removeItem('lifeos-searches');}catch(e){}draw();})),el('div',{class:'list'},rs.map(x=>el('button',{class:'li',style:'min-height:48px',onclick:()=>{S.q=x;input.value=x;clr.hidden=false;draw();}},el('span',{style:'display:grid;color:var(--ink-3)',html:ic('search',16,2)}),el('span',{class:'grow'},x)))));{const op=readOpened(),idx=op.length&&!scoped?searchIndex():[],items=op.map(o=>idx.find(x=>x.type===o.type&&x.t===o.t)).filter(Boolean);if(items.length)results.append(el('div',{class:'sh2'},el('span',{class:'lbl'},'Recently opened')),el('div',{class:'list'},items.map(h=>el('button',{class:'li',style:'min-height:52px',onclick:()=>{saveOpened(h);h.go();}},el('span',{style:'color:var(--accent-text);display:grid',html:ic(h.icon,18)}),el('span',{class:'grow'},el('span',{style:'display:block'},h.t),el('small',{},h.sub))))));}
    results.append(el('p',{class:'muted',style:'padding:8px 4px'},scoped?`Type a word to find any of your ${scoped}.`:'Tasks, events, habits, goals, steps, hubs, tools. Type a word to find anything.'));return;}
    const hits=searchIndex().filter(x=>x.t.toLowerCase().includes(q)||(x.n&&x.n.toLowerCase().includes(q))).map(x=>{if(x.t.toLowerCase().includes(q))return x;const nl=x.n.replace(/\s+/g,' '),i=nl.toLowerCase().indexOf(q),a=Math.max(0,i-24);return Object.assign({},x,{sub:`${a?'…':''}${nl.slice(a,i+q.length+40)}${i+q.length+40<nl.length?'…':''}`,inNote:true});}).sort((a,b)=>(a.inNote?1:0)-(b.inNote?1:0));const tk0=todayK(),since={week:k(weekStartOf(today())),month:tk0.slice(0,8)+'01',year:tk0.slice(0,5)+'01-01'}[S.qWhen];const hits0=hits.length;hits.splice(0,hits.length,...hits.filter(x=>(!S.qArea||x.a===S.qArea)&&(!since||(x.d&&x.d>=since))));const by={};hits.forEach(h=>(by[h.type]=by[h.type]||[]).push(h));if(S.qType!=='All'&&!by[S.qType])S.qType='All';
    {const areas=[...new Set(searchIndex().map(x=>x.a).filter(Boolean))].filter(a=>AREAS.includes(a));const asel=el('select',{'aria-label':'Life area',class:'fsel',onchange:e=>{S.qArea=e.target.value||null;draw();}},el('option',{value:''},'Any area'),areas.map(a=>{const o=el('option',{value:a},a);if(S.qArea===a)o.selected=true;return o;}));const wsel=el('select',{'aria-label':'When',class:'fsel',onchange:e=>{S.qWhen=e.target.value||null;draw();}},[['','Any time'],['week','This week'],['month','This month'],['year','This year']].map(([v,l])=>{const o=el('option',{value:v},l);if((S.qWhen||'')===v)o.selected=true;return o;}));results.append(el('div',{class:'fsels'},asel,wsel,(S.qArea||S.qWhen)?el('button',{class:'linkbtn small',onclick:()=>{S.qArea=null;S.qWhen=null;draw();}},hits0-hits.length?`Clear · ${hits0-hits.length} hidden`:'Clear filters'):null));}
    chips.append(el('button',{class:'chip'+(S.qType==='All'?' on':''),onclick:()=>{S.qType='All';draw();}},`All · ${hits.length}`),...Object.keys(by).map(t=>el('button',{class:'chip'+(S.qType===t?' on':''),onclick:()=>{S.qType=t;draw();}},`${t} · ${by[t].length}`)));
    if(!hits.length){results.append(emptyState(`Nothing for “${S.q.trim()}”`,'Capture it so it isn’t lost.',el('button',{class:'btn line',onclick:()=>captureSheet(null)},'Quick capture')));return;}
    Object.keys(by).filter(t=>S.qType==='All'||S.qType===t).forEach(t=>{results.append(el('div',{class:'lbl',style:'margin:10px 0 0 4px'},t),el('div',{class:'list'},by[t].slice(0,S.qType==='All'?5:50).map(h=>el('button',{class:'li',style:'min-height:56px',onclick:()=>{saveSearch(S.q);saveOpened(h);h.go();}},el('span',{style:'color:var(--accent-text);display:grid',html:ic(h.icon,18)}),el('span',{class:'grow'},el('span',{style:'display:block',html:hl(h.t,q)}),h.inNote?el('small',{html:hl(h.sub,q)}):el('small',{},h.sub))))));});
  };
  draw();root.append(page);if(!isTouch())setTimeout(()=>input.focus({preventScroll:true}),60);
}
function subList(title,ids,root){
  const page=el('div',{class:'page'});page.append(pageHead(title));
  page.append(el('div',{class:'list'},ids.map(id=>{const p=PLACES[id],c=placeCount(id);return el('button',{class:'li',onclick:()=>App.go(id)},el('span',{class:'sq',html:ic(p.i,20)}),el('span',{class:'grow'},el('b',{style:'font-size:17px'},p.n),el('small',{},c.s)),el('span',{class:'chev',html:ic('chevr',16,2)}));})));
  root.append(page);
}
const viewOrganize=root=>subList('Organize',['inbox','tasks','habits','routines','projects','goals','lists'],root);
const viewReflect=root=>subList('Reflect',['reviews','insights'],root);

/* Inbox: oldest first, every entry is an idea */
function tidySheet(list){
  let i=0,inst;const ids=list.map(x=>x.id);
  inst=openSheet({title:'Tidy up',build:body=>{
    body.style.minHeight='min(600px,72dvh)';
    const alive=()=>ids.map(id=>get.id(id)).filter(Boolean);
    const next=dir=>{const n=i+dir;if(n<0)return;i=n;draw();};
    onSwipe(body,()=>next(1),()=>next(-1));
    const draw=()=>{body.innerHTML='';const ls=alive(),r=ls[i];
      if(!r){const skipped=ls.length;body.append(emptyState(skipped?'That’s the pile':'All sorted',skipped?`${skipped} idea${skipped>1?'s':''} kept for later.`:'That’s every idea.',el('button',{class:'btn primary',onclick:()=>inst.close()},'Done')));return;}
      const left=ls.length-i,prog=el('div',{style:'height:4px;border-radius:2px;background:var(--line-2);margin:6px 0 2px;overflow:hidden'},el('i',{style:`display:block;height:100%;width:${Math.round(i/Math.max(1,ls.length)*100)}%;background:var(--accent);transition:width .25s`})),g=suggestKind(r.title==='Unnamed Idea'?'':r.title,r.notes,new Date(r.createdAt)),u=(`${r.title} ${r.notes}`.match(URL_RE)||[])[0];
      const gone=()=>{remove(r.id);draw();};
      body.append(el('div',{style:'display:flex;justify-content:space-between;align-items:center'},el('span',{class:'lbl'},`${i+1} of ${ls.length}`),i>0?el('button',{class:'linkbtn small',onclick:()=>next(-1)},'Back'):null),prog,
        el('div',{class:'deck',style:'margin-bottom:6px'},el('h2',{style:'margin-top:0;overflow-wrap:anywhere'},ideaLabel(r)),r.notes?el('p',{class:'muted',style:'white-space:pre-wrap;overflow-wrap:anywhere'},...linkText(r.notes)):null,el('p',{class:'small muted',style:'margin-top:6px'},[r.source?`From ${r.source}`:null,timeAgo(r.createdAt)].filter(Boolean).join(' · ')),(r.photos||[]).length?el('div',{class:'photos',style:'margin-top:10px'},r.photos.map((p,n)=>el('div',{class:'photo',role:'button',tabindex:0,'aria-label':`Open photo ${n+1}`,style:`background-image:url("${p.url}")`,onclick:()=>photoViewer(r.photos,n)}))):null,u?el('a',{class:'linkbtn small',style:'display:inline-block;margin-top:8px',href:/^www\./i.test(u)?'https://'+u:u,target:'_blank',rel:'noopener'},'Open link'):null),
        el('div',{style:'display:flex;gap:8px'},el('button',{class:'btn line',style:'flex:1;color:var(--now)',onclick:()=>{const c=clone(r);remove(r.id);draw();toast('Idea deleted',()=>{put(c);draw();});}},'Delete'),el('button',{class:'btn quiet',style:'flex:1',onclick:()=>next(1)},g?'Later':'Keep for later'),g?el('button',{class:'btn primary',style:'flex:1','aria-label':`Turn into ${kindName(g.kind).toLowerCase()}`,onclick:()=>routeInto(g.kind,{title:r.title,notes:r.notes,photos:r.photos,createdAt:r.createdAt},gone)},kindName(g.kind),el('span',{style:'display:grid',html:ic('arrow',14,2.2)})):null),
        el('div',{class:'sect'},g?'Or turn into':'Turn into'),turnGrid(kind=>routeInto(kind,{title:r.title,notes:r.notes,photos:r.photos,createdAt:r.createdAt},gone),{compact:true,suggest:g&&g.kind}),moreTurn(null,()=>({title:r.title,notes:r.notes,photos:r.photos}),gone));};
    draw();}});
}
/* Tasks */
/* Reviews */
const rvTitle=r=>{const p=r.period||'week',d=fromK(r.week);return p==='month'?`${MONL[d.getMonth()]} ${d.getFullYear()} review`:p==='quarter'?`Q${quarterOf(d)+1} ${d.getFullYear()} review`:`Week of ${shortDay(r.week)}`;};
function rvText(r){const L=[rvTitle(r)];if(r.stats)L.push(`${r.stats.done} finished · ${r.stats.open} left open · ${r.stats.habit} habit sessions`);[['Wins',r.wins],['What got in the way',r.blocks],[(r.period||'week')==='week'?'Next week':'Next',r.next]].forEach(([t,v])=>{if(v)L.push('',t,v);});return L.join('\n');}
function viewReviews(root){
  const page=el('div',{class:'page'}),list=get.all('review').sort((a,b)=>b.createdAt-a.createdAt);
  const rd=get.settings().reviewDay??0,cw=k(today().getDay()===rd?weekStartOf(today()):addD(weekStartOf(today()),-7)),doneW=list.find(r=>(r.period||'week')==='week'&&r.week===cw),lastW=list.find(r=>(r.period||'week')==='week');
  const stk=(()=>{const ws=new Set(list.filter(r=>(r.period||'week')==='week').map(r=>r.week));let n=0,w=doneW?cw:k(addD(fromK(cw),-7));while(ws.has(w)){n++;w=k(addD(fromK(w),-7));}return n;})();
  page.append(pageHead('Reviews',(doneW?`This week’s review is done`:`Weekly review due ${DOW[rd]}${lastW?` · last one ${relDay(k(new Date(lastW.createdAt)))}`:''}`)+(stk>1?` · ${stk} weeks in a row`:''),{back:'Reflect',to:'reflect'}));
  page.append(el('button',{class:doneW?'btn line block':'btn primary block',onclick:()=>App.go('review')},doneW?'Review this week again':'Start weekly review'),el('div',{style:'display:flex;gap:8px'},el('button',{class:'btn line',style:'flex:1',onclick:()=>App.go('review',{period:'month'})},'Monthly'),el('button',{class:'btn line',style:'flex:1',onclick:()=>App.go('review',{period:'quarter'})},'Quarterly')));
  page.append(scorecardCard());
  page.append(monthLetterCard());
  page.append(el('button',{class:'otidy',onclick:()=>{if(!toolOn('Personal growth','yir'))setToolOn('Personal growth','yir',true);App.go('tool',{hub:'Personal growth',tool:'yir'});}},el('span',{class:'oric',html:ic('star',20)}),el('span',{class:'grow'},el('b',{},`${today().getFullYear()} in review`),el('small',{},'Your year across every module, and a theme for the next one')),el('span',{class:'chev',html:ic('chevr',16,2)})));
  if(list.length)page.append(el('div',{class:'lbl'},'Past reviews'),el('div',{class:'list'},list.map(r=>el('button',{class:'li',onclick:()=>{const inst=openSheet({title:rvTitle(r),left:{label:'Close'},right:{label:'Copy',onclick:()=>shareText(rvTitle(r),rvText(r),'Review copied')},build:b=>{if(r.stats)b.append(el('div',{class:'stat3'},el('div',{},el('b',{},String(r.stats.done)),el('small',{},'finished')),el('div',{},el('b',{},String(r.stats.open)),el('small',{},'left open')),el('div',{},el('b',{},String(r.stats.habit)),el('small',{},'habit sessions'))));[['Wins',r.wins],['What got in the way',r.blocks],[(r.period||'week')==='week'?'Next week':'Next',r.next]].forEach(([t,v])=>{if(v)b.append(el('div',{class:'sect'},t),el('p',{style:'white-space:pre-wrap'},v));});if(!r.wins&&!r.blocks&&!r.next&&!r.stats)b.append(el('p',{class:'muted'},'No notes saved.'));}});}},el('span',{class:'grow'},el('b',{},rvTitle(r)),el('small',{},r.wins||r.next||'No notes')),el('span',{class:'chev',html:ic('chevr',16,2)})))));
  root.append(page);
}
function viewReview(root){
  const S=App.state,per=(App.state.params||{}).period||'week';
  const last=weekStartOf(today()),ws=today().getDay()===(get.settings().reviewDay??0)?last:addD(last,-7),t0=today();
  const a=per==='month'?k(new Date(t0.getFullYear(),t0.getMonth(),1)):per==='quarter'?k(new Date(t0.getFullYear(),quarterOf(t0)*3,1)):k(ws),b=per==='week'?k(addD(ws,6)):todayK();
  if(!S.rv||S.rv.per!==per||S.rv.a!==a){let d=null;try{d=JSON.parse(localStorage.getItem('lo-rv-draft')||'null');}catch(e){}S.rv=d&&d.per===per&&d.a===a?d:{i:0,wins:'',blocks:'',next:'',per,a};S.rvAll=false;if(d&&d.per===per&&d.a===a&&(d.wins||d.blocks||d.next))setTimeout(()=>toast('Picked up where you left off'),300);}
  const R=S.rv,keep=()=>{try{localStorage.setItem('lo-rv-draft',JSON.stringify(R));}catch(e){}};
  const stats=weekStats(a,b);
  const steps=['Look back','Open loops','Set up next week'];
  const page=el('div',{class:'page'});
  page.append(pageHead(per==='month'?'Monthly review':per==='quarter'?'Quarterly review':'Weekly review',`Step ${R.i+1} of ${steps.length} · ${steps[R.i]}`,{back:'Reviews',to:'reviews'}));
  if(R.i===0){page.append(el('div',{class:'stat3'},el('div',{},el('b',{},String(stats.done)),el('small',{},'finished')),el('div',{},el('b',{},String(stats.open)),el('small',{},'left open')),el('div',{},el('b',{},String(stats.habit)),el('small',{},'habit sessions'))),t3WeekLine(a,b)?el('p',{class:'small',style:'margin:-4px 0 4px;color:var(--ink-2)'},t3WeekLine(a,b)):null,per==='week'?scorecardCard({a,b,title:'This week’s scorecard'}):null,per==='week'?modWeekCard(a,b):null,fieldNotes('f-rv-wins','Wins','What went well this week?',R.wins,v=>{R.wins=v;keep();}),fieldNotes('f-rv-blocks','What got in the way','What would you change?',R.blocks,v=>{R.blocks=v;keep();}));}
  if(R.i===1){const late=carried().slice().sort((x,y)=>x.date<y.date?1:-1),old=late.filter(t=>daysBetween(t.date,todayK())>14),shown=S.rvAll?late:late.slice(0,6),act=(t,fn,msg)=>{const c=clone(t);fn();put(t);toast(msg,()=>put(c));};
    if(late.length)page.append(el('div',{class:'sh2'},el('span',{class:'lbl'},`Left open · ${late.length}`),old.length?lnk(`Drop ${old.length} older than 2 weeks`,()=>{const cs=old.map(clone);old.forEach(t=>{t.archived=true;t.archivedAt=Date.now();put(t,{silent:true});});App.refresh();toast(`${old.length} dropped`,()=>{cs.forEach(c=>put(c,{silent:true}));App.refresh();});}):null));
    page.append(late.length?el('div',{class:'list'},shown.map(t=>el('div',{class:'li',style:'flex-wrap:wrap'},el('span',{class:'grow',style:'min-width:150px'},el('b',{style:'font-weight:500'},t.title),el('small',{},`From ${relDay(t.date)}`)),el('span',{style:'display:flex;gap:6px'},el('button',{class:'chip',onclick:()=>act(t,()=>{t.date=null;t.time=null;},'Moved to Anytime')},'To plan'),el('button',{class:'chip',onclick:()=>act(t,()=>{t.archived=true;t.archivedAt=Date.now();},'Dropped')},'Drop')))),late.length>shown.length?el('button',{class:'addset muted',onclick:()=>{S.rvAll=true;App.refresh();}},`Show all ${late.length}`):null):el('div',{class:'list'},emptyState('No open loops','Nothing left behind from past days.')));const gs=get.all('goal');if(gs.length)page.append(el('div',{class:'lbl'},'Goals'),el('div',{class:'list'},gs.map(g=>{const pc=goalProgress(g),pa=goalPace(g);return el('button',{class:'li',style:'min-height:52px',onclick:()=>App.go('plan',{id:g.id})},el('span',{class:'grow'},el('b',{style:'font-weight:500'},g.title),el('small',{},`${Math.round(pc*100)}% done`)),pa?el('span',{class:'pill'+(pa==='Behind'?' warn':pa==='A bit behind'?' quiet':'')},pa):null);})));const ideas=get.all('idea').length;if(ideas)page.append(el('button',{class:'focus-chip',onclick:()=>App.go('inbox')},el('span',{class:'small'},`${ideas} idea${ideas>1?'s':''} in your Inbox`),el('span',{class:'fa'},'Sort ›')));}
  if(R.i===2){page.append(fieldNotes('f-rv-next','Next','What matters most next?',R.next,v=>{R.next=v;keep();}));if(per==='week'){const fb=rvFocusBlock(k(addD(ws,7)));if(fb)page.append(fb);}}
  page.append(el('div',{style:'display:flex;gap:10px'},R.i>0?el('button',{class:'btn quiet',style:'flex:1',onclick:()=>{R.i--;keep();App.refresh();}},'Back'):null,R.i<steps.length-1?el('button',{class:'btn primary',style:'flex:2',onclick:()=>{R.i++;keep();App.refresh();}},'Next'):el('button',{class:'btn primary',style:'flex:2',onclick:()=>{try{localStorage.removeItem('lo-rv-draft');}catch(e){}create('review',{period:per,week:a,wins:R.wins,blocks:R.blocks,next:R.next,title:`Week of ${shortDay(a)}`,stats});setSettings({checkinDone:todayK()});S.rv=null;toast('Review saved');App.state.studio=Object.assign(App.state.studio||{},per==='week'?{mode:'w',anchor:k(addD(ws,7))}:{mode:per==='month'?'m':'q',anchor:null});App.go('studio');}},per==='week'?'Finish and plan the week':'Finish and plan ahead')));
  root.append(page);
}
function weekStats(a,b){let done=0,open=0,habit=0,dk=a,planned=0;while(dk<=b){const d=dayItems(dk);[...d.timed,...d.anytime].forEach(e=>{if(!['task','step','habit','routine'].includes(e.kind))return;if(e.kind==='habit'&&habitWeekly(e.rec)&&!e.done)return;planned++;if(e.kind==='habit'){if(e.done)habit++;}if(e.done)done++;else if(dk<=todayK())open++;});get.all('habit').forEach(h=>{if(h.logs&&h.logs[dk]&&!d.anytime.concat(d.timed).some(e=>e.id===h.id)){habit++;done++;}});dk=addK(dk,1);}return{done,open,habit,planned};}
/* Insights: only ever real numbers */
function viewInsights(root){
  const page=el('div',{class:'page'}),tk=todayK();
  page.append(pageHead('Insights','Plans vs. what happened',{back:'Reflect',to:'reflect'}));
  const weeks=[];let s=weekStartOf(today());for(let i=0;i<8;i++){const a=k(addD(s,-7*i)),st=weekStats(a,k(addD(fromK(a),6)));weeks.unshift({a,...st});}
  const total=weeks.reduce((n,w)=>n+w.planned,0);
  if(total<3){page.append(el('div',{class:'list'},emptyState('Not enough history yet','Plan and finish a few things. Patterns show up here after about a week.')));{const mi=typeof moodInsight==='function'?moodInsight():null;if(mi)page.append(mi);}root.append(page);return;}
  const max=Math.max(...weeks.map(w=>w.planned),1),W=320,H=120,bw=W/8;
  const chart=el('div',{class:'card'},el('div',{class:'lbl'},'Last 8 weeks'),el('div',{class:'serif',style:'font-size:24px;margin:4px 0 4px'},`${Math.round(weeks.reduce((n,w)=>n+w.done,0)/total*100)}% of planned items finished`),(()=>{const rate=ws=>{const p=ws.reduce((n,w)=>n+w.planned,0);return p?ws.reduce((n,w)=>n+w.done,0)/p:null;},r1=rate(weeks.slice(4)),r0=rate(weeks.slice(0,4));if(r1==null||r0==null)return el('div',{style:'height:6px'});const d=Math.round((r1-r0)*100);return el('p',{class:'small',style:`margin:0 0 10px;font-weight:600;color:${d>=0?'var(--accent-text)':'var(--now)'}`},d===0?'Same as the 4 weeks before':`${d>0?'Up':'Down'} ${Math.abs(d)} points on the 4 weeks before`);})(),el('div',{html:`<svg viewBox="0 0 ${W} ${H+20}" width="100%" role="img" aria-label="Planned and finished items per week">${weeks.map((w,i)=>{const h=w.planned/max*H,d=w.done/max*H;return `<rect x="${i*bw+6}" y="${H-h}" width="${bw-12}" height="${h}" rx="4" fill="#DCE5DF"/><rect x="${i*bw+6}" y="${H-d}" width="${bw-12}" height="${d}" rx="4" fill="#466B5A"/><text x="${i*bw+bw/2}" y="${H+15}" font-size="10" text-anchor="middle" fill="#5B6560" font-family="Figtree,sans-serif">${fromK(w.a).getMonth()+1}/${fromK(w.a).getDate()}</text><rect data-w="${i}" x="${i*bw}" y="0" width="${bw}" height="${H+20}" fill="transparent" style="cursor:pointer"><title>Week of ${shortDay(w.a)}</title></rect>`;}).join('')}</svg>`,onclick:e=>{const t=e.target.closest('[data-w]');if(!t)return;const w=weeks[+t.dataset.w];const inst=openSheet({title:`Week of ${shortDay(w.a)}`,left:{label:'Close'},build:b=>{b.append(el('div',{class:'stat3'},el('div',{},el('b',{},String(w.done)),el('small',{},'finished')),el('div',{},el('b',{},String(w.planned)),el('small',{},'planned')),el('div',{},el('b',{},w.planned?`${Math.round(w.done/w.planned*100)}%`:'–'),el('small',{},'done'))),el('p',{class:'small muted',style:'margin-top:10px'},`${w.habit} habit session${w.habit===1?'':'s'}${w.open?` · ${w.open} left open`:''}`),btnL('Open this week in Studio',()=>{inst.close();App.state.studio=Object.assign(App.state.studio||{},{mode:'w',anchor:w.a});App.go('studio');},{style:'width:100%;margin-top:12px'}));}});}}),(()=>{const cur=weeks[7],prev=weeks.slice(0,7).filter(w=>w.planned),avg=prev.length?prev.reduce((n,w)=>n+w.done,0)/prev.length:null;return avg==null?null:el('p',{class:'small',style:'margin:8px 0 0;color:var(--ink-2)'},`This week so far: ${cur.done} finished · your weekly average is ${Math.round(avg)}`);})(),el('div',{class:'heat-key',style:'justify-content:flex-start'},el('i',{style:'background:#466B5A'}),'Finished',el('i',{style:'background:#DCE5DF'}),'Planned'));
  page.append(chart);
  insightsExtras(page);
  const byArea={},byDow=[0,0,0,0,0,0,0];let dk=k(addD(today(),-55));while(dk<=tk){const d=dayItems(dk);[...d.timed,...d.anytime].forEach(e=>{if(e.done){byArea[e.area||'No area']=(byArea[e.area||'No area']||0)+1;byDow[fromK(dk).getDay()]++;}});dk=addK(dk,1);}
  const areas=Object.entries(byArea).sort((a,b)=>b[1]-a[1]),amax=areas[0]?areas[0][1]:1;
  if(areas.length)page.append(el('div',{class:'bars'},el('div',{class:'lbl'},'Finished by life area'),areas.map(([a,n])=>el('div',{class:'bar-row'},el('span',{class:'clip'},a),el('span',{class:'bar-track'},el('span',{class:'bar-fill',style:`display:block;width:${n/amax*100}%`})),el('span',{class:'small muted tnum'},String(n))))));
  {const t0=today(),dn=t0.getDate(),a1=k(new Date(t0.getFullYear(),t0.getMonth(),1)),b1=tk,lm=new Date(t0.getFullYear(),t0.getMonth()-1,1),a0=k(lm),b0=k(new Date(lm.getFullYear(),lm.getMonth(),Math.min(dn,new Date(lm.getFullYear(),lm.getMonth()+1,0).getDate())));
    const count=(a,b)=>{const m={};for(let d=a;d<=b;d=addK(d,1)){const di=dayItems(d);[...di.timed,...di.anytime].forEach(e=>{if(e.done&&e.area)m[e.area]=(m[e.area]||0)+1;});}get.all('entry').forEach(x=>{if(x.f&&x.f.t==='cfg')return;const d=x.f&&x.f.date||k(new Date(x.createdAt||0));if(d>=a&&d<=b&&x.hub)m[x.hub]=(m[x.hub]||0)+1;});return m;};
    const now=count(a1,b1),then=count(a0,b0),rowsA=(get.settings().areas||AREAS).filter(a=>now[a]||then[a]).map(a=>[a,now[a]||0,then[a]||0]).sort((x,y)=>(y[1]-y[2])-(x[1]-x[2]));
    if(rowsA.length)page.append(el('div',{class:'card'},el('div',{class:'lbl'},`Life areas · ${MONL[t0.getMonth()]} vs. ${MONL[lm.getMonth()]}`),el('p',{class:'small muted',style:'margin:2px 0 8px'},`Things done and logged in the first ${dn} day${dn>1?'s':''} of each month.`),el('div',{class:'list',style:'box-shadow:none;border:0'},rowsA.map(([a,n,p])=>{const d=n-p,dir=d>0?'up':d<0?'down':'flat';return el('button',{class:'li',style:'width:100%;text-align:left;min-height:48px;padding-inline:0',onclick:()=>App.go('area',{name:a})},el('span',{class:'grow'},el('span',{class:'tt'},a),el('small',{},`${n} this month · ${p} last month`)),el('span',{class:'atr '+dir},dir==='up'?`▲ ${d}`:dir==='down'?`▼ ${-d}`:'Same'));}))));}
  const hs=get.all('habit').filter(h=>!h.paused).map(h=>[h,habitRate(h)]).filter(x=>x[1]!=null).sort((a,b)=>b[1]-a[1]);
  if(hs.length)page.append(el('div',{class:'bars'},el('div',{class:'lbl'},'Habits kept · last 30 days'),hs.map(([h,r])=>el('button',{class:'bar-row',style:'width:100%;text-align:left',onclick:()=>App.go('habit',{id:h.id})},el('span',{class:'clip'},h.title),el('span',{class:'bar-track'},el('span',{class:'bar-fill',style:`display:block;width:${r*100}%`})),el('span',{class:'small muted tnum'},`${Math.round(r*100)}%`)))));
  const cl=carried();if(cl.length){const oldest=cl.reduce((m,t)=>t.date<m.date?t:m,cl[0]);page.append(el('div',{class:'card'},el('div',{class:'lbl'},'Still open from past days'),el('h2',{},`${cl.length} task${cl.length>1?'s':''}`),el('p',{class:'sub'},`The oldest, “${oldest.title}”, has waited since ${shortDay(oldest.date)}.`),el('div',{class:'btnrow'},el('button',{class:'btn line',onclick:()=>{App.state.rv=null;App.go('review');}},'Sort them in a review'))));}
  const bd=byDow.indexOf(Math.max(...byDow));if(byDow[bd])page.append(el('div',{class:'card'},el('div',{class:'lbl'},'Your strongest day'),el('h2',{},DOW[bd]),el('p',{class:'sub'},`${byDow[bd]} things finished on ${DOW[bd]}s in the last 8 weeks.`)));
  root.append(page);
}
/* Discover */
const IDEAS=[
['Health','tool','Add your medications and checkups','Get supply warnings and never lose track of when the dentist is due.','care'],
['Health','habit','Take a 20-minute walk','A short walk most days is the easiest movement to keep.'],
['Health','tool','Log a workout','Your week of movement shows up on the Health page.','workouts'],
['Health','habit','Stop screens 30 minutes before bed','Protect your sleep with a small boundary.'],
['Health','project','Organize your workout space','Make a small space easier to use for your routine.'],
['Home','tool','Set up your chores','Each one comes back on its own schedule, so nothing piles up.','chores'],
['Home','tool','Add home upkeep','Smoke alarms, filters, gutters. The app reminds you when each is due.','upkeep'],
['Home','project','Declutter one closet','Finish one small space before starting another.'],
['Home','habit','Do a 10-minute evening reset','Wake up to a calmer home.'],
['Home','tool','Save your home info','Wi-Fi, shutoffs, warranties and the plumber’s number in one place.','info'],
['Finances','tool','List your bills','See what’s due this week and what’s on autopay.','bills'],
['Finances','tool','Review your subscriptions','Add them to Bills and flag the ones you barely use.','bills'],
['Finances','tool','Start a savings goal','Set a target and a monthly amount. The app shows when you’ll get there.','savings'],
['Finances','habit','Do a weekly money check-in','Ten minutes keeps surprises small.'],
['Relationships','tool','Add the people you want to keep close','Pick how often to reach out. They show up when it’s been a while.','people'],
['Relationships','tool','Add birthdays and anniversaries','Get a heads-up with time to pick a gift.','dates'],
['Relationships','task','Plan a dinner with family','Pick a date and ask this week.'],
['Relationships','habit','Reach out to one friend a week','Small, regular contact keeps people close.'],
['Career','tool','Log a recent win','Reviews and resumes write themselves when you keep notes.','wins'],
['Career','task','Update your resume with this year’s wins','Easier while the details are fresh.'],
['Career','tool','Pick a skill to grow','Rate where you are and where you want to be.','skills'],
['Career','goal','Learn one skill for your next role','Name it, then break it into steps.'],
['Learning','tool','Start your reading list','Track what you’re reading and what’s next.','reading'],
['Learning','habit','Read for 20 minutes','A little most days adds up to a lot of books.'],
['Learning','tool','Add a course you’re taking','See progress and how much time is left.','courses'],
['Learning','project','Take a short online course','Pick one you can finish in a month.'],
['Recreation','tool','Save outing ideas','So the next free Saturday already has a plan.','outings'],
['Recreation','project','Plan a day trip within 2 hours','Somewhere you’ve never been.'],
['Recreation','tool','Track a hobby','Set how often you want to do it and see your time add up.','hobbies'],
['Recreation','habit','Protect one free evening a week','Nothing planned is a plan too.'],
['Travel','tool','Plan your next trip','Bookings, packing and days away all in one place.','trips'],
['Travel','tool','Save your travel documents','Passport expiry and traveler numbers, ready at the airport.','docs'],
['Travel','goal','Take one trip you’ve been putting off','Pick the place, then the month.'],
['Personal growth','tool','Write down your top values','A short compass for hard choices.','compass'],
['Personal growth','tool','Rate your life wheel','Two minutes shows which area needs you most.','wheel'],
['Personal growth','habit','Write three lines in a journal','Short is easier to keep.'],
['Personal growth','tool','Try a two-week experiment','Test one change and decide with real data.','experiments'],
['Personal growth','goal','Do one thing that scares you this quarter','Small counts.']];
const ideaDone=i=>{const[area,kind,title,,tool]=i;if(kind==='tool')return entries(area,tool).length>0;const t=title.toLowerCase();return get.all(kind).some(r=>(r.title||'').toLowerCase()===t);};
const andList=a=>a.length>1?`${a.slice(0,-1).join(', ')} and ${a[a.length-1]}`:a[0]||'';
function viewDiscover(root){
  const S=App.state,seen=get.id('discover')||{id:'discover',kind:'discover',seen:{}},areas=get.settings().areas||AREAS;S.discArea=S.discArea||null;
  const mix={};let dk=k(addD(today(),-13));while(dk<=todayK()){const d=dayItems(dk);[...d.timed,...d.anytime].forEach(e=>{if(!['task','step','habit','routine'].includes(e.kind))return;const a=e.area||'No area';mix[a]=(mix[a]||0)+1;});dk=addK(dk,1);}
  areas.forEach(a=>{const n=get.all('entry').filter(x=>x.hub===a&&(Date.now()-(x.updatedAt||x.createdAt||0))<14*864e5).length;if(n)mix[a]=(mix[a]||0)+n;});
  const base=IDEAS.filter(i=>areas.includes(i[0])&&!seen.seen[i[2]]&&!ideaDone(i)&&(!S.discArea||i[0]===S.discArea));
  const order=[...new Set(base.map(i=>i[0]))].sort((a,b)=>(mix[a]||0)-(mix[b]||0)),buckets=order.map(a=>base.filter(i=>i[0]===a)),pool=[];
  while(buckets.some(b=>b.length))buckets.forEach(b=>{if(b.length)pool.push(b.shift());});const fi=pool.findIndex(i=>i[2]===S.discFirst);if(fi>0)pool.unshift(pool.splice(fi,1)[0]);
  const page=el('div',{class:'page'});
  page.append(pageHead('Discover',`${pool.length} idea${pool.length===1?'':'s'} picked for you`,{back:'More',to:'more'}));
  page.append(el('div',{class:'chips',style:'flex-wrap:nowrap;overflow-x:auto;margin:0 -16px;padding:0 16px 2px;scrollbar-width:none'},[null,...areas].map(a=>el('button',{class:'chip'+(S.discArea===a?' on':''),style:'flex:none',onclick:()=>{S.discArea=a;App.refresh();}},a||'For you'))));
  const ent=Object.entries(mix).sort((a,b)=>b[1]-a[1]),tot=ent.reduce((n,e)=>n+e[1],0);
  if(tot&&!S.discArea){const shades=['#466B5A','#8BB09C','#B9CFC3','#DCE6E0'],top=ent.slice(0,3);const other=tot-top.reduce((n,e)=>n+e[1],0);const parts=[...top,...(other?[['Other',other]]:[])],quiet=areas.filter(a=>!mix[a]);
    page.append(el('div',{class:'card',style:'padding:12px 14px;border-radius:16px'},el('div',{style:'display:flex;justify-content:space-between'},el('span',{class:'lbl',style:'font-size:11px'},'Last 2 weeks'),el('span',{class:'small muted'},`Mostly ${top[0][0]}`)),el('div',{class:'mix'},parts.map((p,i)=>el('i',{style:`flex:${p[1]};background:${shades[i]}`}))),el('div',{class:'small muted',style:'display:flex;gap:10px;flex-wrap:wrap;margin-top:8px'},parts.map(p=>el('span',{},`${p[0]} ${Math.round(p[1]/tot*100)}%`))),quiet.length?el('p',{class:'small',style:'margin-top:8px;color:var(--ink-2)'},`Quiet lately: ${andList(quiet.slice(0,3))}${quiet.length>3?` and ${quiet.length-3} more`:''}.`):null));}
  if(!S.discArea){const dm=discoverMods();if(dm)page.append(dm);}
  const idea=pool[0];
  if(!idea){page.append(el('div',{class:'list'},emptyState(S.discArea?`Nothing new for ${S.discArea}`:'You’ve seen them all',S.discArea?'Try another area, or start over.':'Ideas you skipped can come back.',Object.keys(seen.seen).length?el('button',{class:'btn line',onclick:()=>{seen.seen={};put(seen);}},'Bring skipped ideas back'):null)));root.append(page);return;}
  const[area,kind,title,text,tool]=idea,T=kind==='tool'?toolOf(area,tool):null;
  const why=!mix[area]?`Nothing in ${area} has been on your plan for two weeks.`:kind==='tool'?`You haven’t set up ${T?T.name:'this'} in ${area} yet.`:`A small step to add to what you’re doing in ${area}.`;
  page.append(el('div',{class:'deck'},el('div',{class:'lbl',style:'color:var(--accent-text)'},`${area} · ${kind==='tool'?(T?T.name:'Tool'):kind[0].toUpperCase()+kind.slice(1)}`),el('h2',{},title),el('p',{class:'muted'},text),el('div',{class:'why'},el('b',{},'Why this: '),why)));
  const mark=()=>{seen.seen[title]=Date.now();S.discLast=title;put(seen);};
  page.append(el('div',{style:'display:flex;gap:8px'},
    el('button',{class:'btn line',style:'flex:1',onclick:()=>{mark();toast('Skipped',()=>{delete seen.seen[title];put(seen);});}},'Skip'),
    el('button',{class:'btn line',style:'flex:1',onclick:()=>{mark();create('idea',{title,notes:kind==='tool'?`${text}\nOpen ${area} › ${T?T.name:''} to set it up.`:text,photos:[],source:'Discover'});toast('Saved to Inbox');}},'Save'),
    el('button',{class:'btn primary',style:'flex:1.4',onclick:()=>{if(kind==='tool'){App.go('tool',{hub:area,tool});return;}watchCreate(kind,get.all(kind).length,mark);if(kind==='task')taskSheet(null,{title,notes:text,area,date:null});else if(kind==='habit')habitSheet(null,{title,notes:text,area});else if(kind==='goal')goalSheet(null,{seed:{title,notes:text,area}});else projectSheet(null,{seed:{title,notes:text,area}});}},kind==='tool'?`Open ${T?T.name:'it'}`:'Add to plan')));
  if(pool.length>1)page.append(el('div',{class:'lbl'},'Also for you'),el('div',{class:'list'},pool.slice(1,4).map(i=>el('button',{class:'li',style:'min-height:56px',onclick:()=>{S.discFirst=i[2];App.refresh();window.scrollTo({top:0,behavior:'smooth'});}},el('span',{class:'grow'},el('b',{style:'font-weight:500'},i[2]),el('small',{},`${i[0]} · ${i[1]==='tool'?((toolOf(i[0],i[4])||{}).name||'Tool'):i[1][0].toUpperCase()+i[1].slice(1)}`)),el('span',{class:'chev',html:ic('chevr',16,2)})))));
  root.append(page);
}
/* Tools */
const TEMPLATES=[{t:'Packing list',kind:'list',items:['Chargers','Toiletries','Medications','ID and wallet','Clothes for each day','Snacks']},{t:'Grocery staples',kind:'list',items:['Eggs','Milk','Bread','Coffee','Fruit','Vegetables','Rice or pasta']},{t:'Weekly reset',kind:'routine',steps:[['Empty Inbox',10],['Check next week’s calendar',5],['Clear the kitchen and desk',15],['Plan the week in Studio',15]]},{t:'Morning routine',kind:'routine',steps:[['Water and stretch',5],['Shower and dress',15],['Breakfast',15],['Look over Today',5]]},{t:'Shutdown routine',kind:'routine',steps:[['Capture loose ends',5],['Check tomorrow',5],['Set out what you need',5]]},{t:'Home upkeep basics',kind:'upkeep',items:[['Test smoke alarms',180],['Replace furnace filter',90],['Clean gutters',365],['Check fire extinguisher',365],['Clean dryer vent',365]]}];
function saveTemplate(kind,r){const name=r.title.replace(/ copy$/,'');const ex=get.all('tpl').find(x=>x.t===name&&x.tk===kind);const data=kind==='list'?{items:(r.items||[]).map(i=>i.t)}:kind==='project'?{items:projectTasks(r).map(t=>t.title),notes:r.notes||''}:{steps:(r.steps||[]).map(s=>[s.t,s.min||0])};if(ex){Object.assign(ex,data);put(ex);toast('Template updated');return;}create('tpl',Object.assign({t:name,tk:kind,title:name},data));toast(`Saved to Tools & Resources`);}
const userTpls=()=>get.all('tpl').map(x=>({t:x.t,kind:x.tk,items:x.items,steps:x.steps,notes:x.notes,id:x.id,mine:true}));
const tplHave=t=>t.kind==='upkeep'?t.items.every(([w])=>entries('Home','upkeep').some(x=>(x.f.what||'').toLowerCase()===w.toLowerCase())):get.all(t.kind).find(r=>r.title===(t.kind==='list'&&t.t==='Packing list'?'Packing list':t.t));
function addTemplate(t){
  if(t.kind==='upkeep'){const have=entries('Home','upkeep').map(x=>(x.f.what||'').toLowerCase());let n=0;t.items.forEach(([w,ev])=>{if(!have.includes(w.toLowerCase())){create('entry',{hub:'Home',tool:'upkeep',f:{what:w,every:ev,last:addK(todayK(),7*(n+1)-ev)}});n++;}});App.go('tool',{hub:'Home',tool:'upkeep'});toast(n>1?`${n} added, spread over the next ${n} weeks`:`${n} upkeep item added`);return;}
  if(t.kind==='project'){const r=create('project',{title:t.t,notes:t.notes||'',status:'active',color:'sage',createdAt:Date.now()});(t.items||[]).forEach((x,i)=>create('task',{title:x,notes:'',steps:[],date:null,time:null,repeat:{type:'never',end:null},priority:'normal',part:r.id,order:i}));App.go('plan',{id:r.id});toast(`${t.t} started with ${(t.items||[]).length} tasks`);return;}
  if(t.kind==='list'){const r=create('list',{title:t.t,items:t.items.map(x=>({id:uid('i'),t:x,d:false})),packTpl:t.t==='Packing list'?true:undefined,reusable:true});App.go('list',{id:r.id});}
  else{const r=create('routine',{title:t.t,steps:t.steps.map(([x,m])=>({id:uid('s'),t:x,min:m}))});App.go('routine',{id:r.id});}
  toast(`${t.t} added`);}
function viewTools(root){
  const S=App.state,all=get.all('resource').sort((a,b)=>(b.createdAt||0)-(a.createdAt||0)),page=el('div',{class:'page'});
  const used=[...new Set(all.map(r=>r.area).filter(Boolean))];if(S.resArea&&!used.includes(S.resArea))S.resArea=null;
  const res=S.resArea?all.filter(r=>r.area===S.resArea):all;
  page.append(pageHead('Tools & Resources',all.length?`${all.length} saved · ${TEMPLATES.length} templates`:'Templates and references',{actions:el('button',{class:'iconbtn green','aria-label':'New resource',html:ic('plus',22,2),onclick:()=>resourceSheet(null)})}));
  const host=u=>{try{return new URL(/^https?:/i.test(u)?u:'https://'+u).hostname.replace(/^www\./,'');}catch(e){return '';}};
  const meta=r=>{const nl=(r.notes||'').trim().split('\n')[0];return joinMeta([r.area,r.url?host(r.url):null,nl&&!r.url?(nl.length>34?nl.slice(0,32).trim()+'…':nl):null,(r.photos||[]).length?el('span',{class:'omi',html:ic('image',13,2)+` ${(r.photos||[]).length}`}):null].filter(Boolean));};
  page.append(el('div',{class:'lbl'},'Saved'));
  if(used.length>1)page.append(el('div',{class:'chips'},[null,...used].map(a=>el('button',{class:'chip'+(S.resArea===a?' on':''),onclick:()=>{S.resArea=a;App.refresh();}},a?`${a} · ${all.filter(r=>r.area===a).length}`:`All · ${all.length}`))));
  page.append(all.length?el('div',{class:'list'},res.map(r=>el('div',{class:'li',style:'min-height:56px'},el('button',{class:'grow',style:'text-align:left;min-width:0',onclick:()=>openRec(r)},el('b',{},r.title),el('small',{class:'ometa clip'},meta(r))),/^https?:\/\//i.test(r.url||'')?el('a',{href:r.url,target:'_blank',rel:'noopener',class:'chip',style:'height:32px;text-decoration:none;flex:none','aria-label':`Open ${r.title}`},'Open',el('span',{style:'display:grid;margin-left:4px',html:ic('arrow',12,2.2)})):null))):el('div',{class:'list'},emptyState('Nothing saved yet','Guides, links and notes you want to find again. Anything you capture with a link can land here.',el('button',{class:'btn line',onclick:()=>resourceSheet(null)},'Add a resource'))));
  const mine=userTpls();if(mine.length)page.append(el('div',{class:'lbl'},'Your templates'),el('div',{class:'list'},mine.map(t=>withPress(el('button',{class:'li',style:'min-height:56px',onclick:()=>addTemplate(t)},el('span',{class:'sq',html:ic(t.kind==='list'?'list':t.kind==='project'?'project':'routine',20)}),el('span',{class:'grow'},el('b',{},t.t),el('small',{},t.kind==='project'?`Project · ${t.items.length} task${t.items.length===1?'':'s'}`:t.kind==='list'?`List · ${t.items.slice(0,3).join(', ')}${t.items.length>3?'…':''}`:`Routine · ${t.steps.length} steps, ${t.steps.reduce((n,x)=>n+x[1],0)} min`)),el('span',{class:'linkbtn small'},'Use')),(x,y)=>openMenu(x,y,[{label:'Delete template',icon:'trash',danger:true,onclick:()=>{const c=clone(get.id(t.id));remove(t.id);toast('Template deleted',()=>put(c));}}])))));
  page.append(el('div',{class:'lbl'},'Start from a template'),el('div',{class:'list'},TEMPLATES.map(t=>{const have=tplHave(t);return el('button',{class:'li',style:'min-height:56px',onclick:()=>{if(have&&t.kind!=='upkeep'){App.go(t.kind,{id:have.id});return;}if(have){App.go('tool',{hub:'Home',tool:'upkeep'});return;}addTemplate(t);}},el('span',{class:'sq',html:ic(t.kind==='list'?'list':t.kind==='upkeep'?'leaf':'routine',20)}),el('span',{class:'grow'},el('b',{},t.t),el('small',{},t.kind==='list'?`List · ${t.items.slice(0,3).join(', ')}…`:t.kind==='upkeep'?`Home upkeep · ${t.items.length} on a schedule`:`Routine · ${t.steps.length} steps, ${t.steps.reduce((n,x)=>n+x[1],0)} min`)),have?el('span',{class:'small muted'},'Added ›'):el('span',{class:'linkbtn small'},'Add'));})));
  root.append(page);
}
/* Archive */
const trashTitle=t=>{const r=t.rec||{};if(r.kind==='entry'){const x=toolOf(r.hub,r.tool);return (x&&x.title(r))||'Item';}return r.title||r.notes||'Untitled';};
const trashWhat=t=>{const r=t.rec||{};if(r.kind==='entry'){const x=toolOf(r.hub,r.tool);return x?x.name:'Life area';}return KINDN[r.kind]||'Item';};
function purgeTrash(){const cut=Date.now()-30*864e5;get.all('trashed').forEach(t=>{if((t.deletedAt||0)<cut)remove(t.id,{silent:true,hard:true});});}
function viewTrash(root){
  purgeTrash();const list=get.all('trashed').slice().sort((a,b)=>(b.deletedAt||0)-(a.deletedAt||0)),page=el('div',{class:'page'});
  page.append(pageHead('Recently deleted',list.length?`${list.length} item${list.length===1?'':'s'} · kept for 30 days`:'Kept for 30 days'));
  if(!list.length){page.append(el('div',{class:'list'},emptyState('Nothing here','Things you delete stay here for 30 days, then they’re gone.')));root.append(page);return;}
  page.append(el('div',{class:'list'},list.map(t=>{const left=Math.max(1,30-Math.floor((Date.now()-t.deletedAt)/864e5));return el('div',{class:'li',style:'min-height:60px;flex-wrap:wrap'},el('span',{class:'grow',style:'min-width:150px'},el('b',{style:'font-weight:500'},trashTitle(t)),el('small',{},`${trashWhat(t)} · ${left} day${left===1?'':'s'} left`)),el('span',{style:'display:flex;gap:6px'},el('button',{class:'chip',onclick:()=>{put(t.rec);const cal=t.rec.f&&t.rec.f.calId&&get.id('del-'+t.rec.f.calId);if(cal)put(cal.rec);toast(`Restored to ${t.rec.kind==='entry'?`${t.rec.hub} › ${trashWhat(t)}`:(PLACES[t.rec.kind+'s']?PLACES[t.rec.kind+'s'].n:trashWhat(t))}`);}},'Restore'),el('button',{class:'chip',onclick:()=>askConfirm({title:'Delete for good?',body:`“${trashTitle(t)}” can’t be brought back.`,yes:'Delete',no:'Keep it',onYes:()=>remove(t.id,{hard:true})})},'Delete')));})));
  page.append(el('button',{class:'delete',onclick:()=>askConfirm({title:'Empty Recently deleted?',body:'Everything here will be gone for good.',yes:'Empty',no:'Keep it',onYes:()=>{list.forEach(t=>remove(t.id,{silent:true,hard:true}));App.refresh();}})},'Empty Recently deleted'));
  root.append(page);
}
/* 5: every photo you've attached, in one place */
function allPhotos(){const out=[];[...recs.values()].forEach(r=>{if(r.kind==='trashed')return;const ph=r.photos||(r.f&&r.f.photos);if(!(ph||[]).length)return;const t=r.kind==='entry'?toolOf(r.hub,r.tool):null,title=t?t.title(r):r.title||r.notes||'Untitled',what=t?t.name:(KINDN[r.kind]||'Item');ph.forEach(p=>out.push({p,r,title,what,at:r.updatedAt||0}));});return out.sort((a,b)=>b.at-a.at);}
const openPhotoRec=r=>{if(r.kind==='entry'){const t=toolOf(r.hub,r.tool);if(t)App.go('tool',{hub:r.hub,tool:r.tool});}else openRec(r);};
function removePhoto(r,p){const holder=r.photos?r:r.f;const before=clone(holder.photos);holder.photos=holder.photos.filter(q=>q!==p&&q.url!==p.url);put(r);toast('Photo removed',()=>{holder.photos=before;put(r);});}
function viewPhotos(root){
  const list=allPhotos(),page=el('div',{class:'page'});
  page.append(pageHead('Photos',list.length?`${list.length} photo${list.length===1?'':'s'}`:null));
  if(!list.length){page.append(el('div',{class:'list'},emptyState('No photos yet','Photos you add anywhere, like ideas, tasks, recipes or home info, all show up here.')));root.append(page);return;}
  const src=r=>r.kind==='idea'?'Ideas':r.kind==='task'?'Tasks':r.kind==='entry'?'Life areas':r.kind==='list'?'Lists':'Other',counts={};list.forEach(x=>{const k0=src(x.r);counts[k0]=(counts[k0]||0)+1;});const S=App.state;if(S.phSrc&&!counts[S.phSrc])S.phSrc=null;
  if(Object.keys(counts).length>1)page.append(chipsH([['All','All',list.length],...['Ideas','Tasks','Life areas','Lists','Other'].filter(k0=>counts[k0]).map(k0=>[k0,k0,counts[k0]])],S.phSrc||'All',v=>{S.phSrc=v==='All'?null:v;App.refresh();}));
  const groups=new Map();list.filter(x=>!S.phSrc||src(x.r)===S.phSrc).forEach((x,i)=>{const key=x.r.id;if(!groups.has(key))groups.set(key,{x,items:[]});groups.get(key).items.push(x.p);});
  groups.forEach(({x,items})=>{page.append(el('button',{class:'sh2',style:'text-align:left;width:100%',onclick:()=>openPhotoRec(x.r)},el('span',{class:'grow'},el('b',{style:'font-weight:600;display:block'},x.title),el('small',{class:'small muted'},x.what)),el('span',{class:'chev',html:ic('chevr',16,2)})),el('div',{class:'pgrid'},items.map((p,i)=>el('button',{class:'pcell',style:`background-image:url("${p.url}")`,'aria-label':`Open photo ${i+1} of ${x.title}`,onclick:()=>photoViewer(items,i,{onRemove:at=>removePhoto(x.r,items[at])})})).map((c,i)=>{onPress(c,(mx,my)=>openMenu(mx,my,[{label:`Open ${x.title}`,icon:'arrow',onclick:()=>openPhotoRec(x.r)},{label:'View photo',icon:'image',onclick:()=>photoViewer(items,i,{onRemove:at=>removePhoto(x.r,items[at])})},{label:'Delete photo',icon:'trash',danger:true,onclick:()=>removePhoto(x.r,items[i])}]));c.addEventListener('click',e=>{if(Date.now()-(c._pressed||0)<700){e.stopPropagation();e.preventDefault();}},true);return c;})));});
  root.append(page);
}
function viewArchive(root){
  const S=App.state;S.archType=S.archType||'all';S.archSort=S.archSort||'new';
  let all=[...recs.values()].filter(r=>r.archived);if(S.archType!=='all')all=all.filter(r=>r.kind===S.archType);
  all.sort((a,b)=>S.archSort==='new'?(b.archivedAt||0)-(a.archivedAt||0):(a.archivedAt||0)-(b.archivedAt||0));
  const page=el('div',{class:'page'});
  page.append(pageHead('Archive',`${all.length} item${all.length===1?'':'s'}`));
  const kinds=[...new Set([...recs.values()].filter(r=>r.archived).map(r=>r.kind))];
  page.append(el('div',{class:'chips'},el('button',{class:'chip line',onclick:e=>openMenu(e.clientX,e.clientY,[{label:'All types',onclick:()=>{S.archType='all';App.refresh();}},...kinds.map(x=>({label:x==='entry'?'Life areas':KINDN[x]||x,onclick:()=>{S.archType=x;App.refresh();}}))])},S.archType==='all'?'All types':S.archType==='entry'?'Life areas':KINDN[S.archType],el('span',{style:'display:grid',html:ic('chevd',14,2.2)})),el('button',{class:'chip line',onclick:()=>{S.archSort=S.archSort==='new'?'old':'new';App.refresh();}},S.archSort==='new'?'Newest first':'Oldest first')));
  if(!all.length){page.append(el('div',{class:'list'},emptyState('Nothing archived','Finished goals, habits you’ve set down and old projects rest here.')));root.append(page);return;}
  page.append(el('div',{class:'list'},all.map(r=>{
    const ttl=trashTitle({rec:r}),what=trashWhat({rec:r});const restore=()=>{r.archived=false;r.archivedAt=null;put(r);toast(`${ttl} restored`,()=>{r.archived=true;r.archivedAt=Date.now();put(r);});};
    const del=()=>askConfirm({title:'Delete this?',body:`“${ttl}” stays in Recently deleted for 30 days.`,yes:'Delete',no:'Keep it',onYes:()=>remove(r.id)});
    const front=el('button',{class:'li sw-front',onclick:e=>openMenu(e.clientX,e.clientY,[{label:'Open',icon:'arrow',onclick:()=>r.kind==='entry'?openPhotoRec(r):openRec(r)},{label:'Restore',icon:'undo',onclick:restore},{label:'Delete',icon:'trash',danger:true,onclick:del}])},el('span',{class:'sq',html:ic(KINDI[r.kind]||'archive',18)}),el('span',{class:'grow'},el('b',{},ttl),el('small',{},`${r.kind==='entry'?`${r.hub} · ${what}`:what} · Archived ${r.archivedAt?timeAgo(r.archivedAt):''}`)));
    const w=el('div',{class:'sw-wrap'},el('div',{class:'sw-acts'},el('button',{style:'background:var(--accent)',onclick:restore},'Restore'),el('button',{style:'background:var(--danger)',onclick:del},'Delete')),front);
    let x0,y0,dx=0,on=false;front.addEventListener('touchstart',e=>{x0=e.touches[0].clientX;y0=e.touches[0].clientY;on=true;},{passive:true});front.addEventListener('touchmove',e=>{if(!on)return;dx=e.touches[0].clientX-x0;if(Math.abs(dx)>Math.abs(e.touches[0].clientY-y0)&&dx<0)front.style.transform=`translateX(${Math.max(dx,-168)}px)`;},{passive:true});front.addEventListener('touchend',()=>{on=false;const open=dx<-70;document.querySelectorAll('.sw-front').forEach(f=>{if(f!==front&&f._open){f.style.transition='transform .2s';f.style.transform='';f._open=false;}});front.style.transform=open?'translateX(-168px)':'';front._open=open;dx=0;if(open){const shut=ev=>{if(w.contains(ev.target)&&ev.target.closest('.sw-acts'))return;front.style.transition='transform .2s';front.style.transform='';front._open=false;document.removeEventListener('pointerdown',shut,true);if(!w.contains(ev.target)){}else{ev.stopPropagation();ev.preventDefault();}};setTimeout(()=>document.addEventListener('pointerdown',shut,true),0);}});
    return w;})));
  page.append(el('p',{class:'small muted',style:'text-align:center'},'Swipe left on an item to restore or delete it, or tap it.'));
  root.append(page);
}
/* Settings */
function setRow(label,sub,val,on){return el('button',{class:'li',style:'min-height:56px',onclick:on},el('span',{class:'grow'},el('b',{style:'font-weight:500'},label),sub?el('small',{},sub):null),val?el('span',{class:'small muted'},val):null,el('span',{class:'chev',html:ic('chevr',16,2)}));}
function pickOne(title,opts,val,on){const inst=openSheet({title,build:b=>b.append(el('div',{class:'list'},opts.map(([v,l])=>el('button',{class:'li',style:'min-height:52px','aria-pressed':String(v===val),onclick:()=>{on(v);inst.close();}},el('span',{class:'grow'},l),v===val?el('span',{style:'color:var(--accent-text);display:grid',html:ic('check',18,2.6)}):null))))});}
function navSheet(){const s=get.settings();orderSheet({title:'Bottom bar',init:s.nav||[],max:3,exact:true,word:'chosen',limit:'Three is the limit. Remove one to add another.',info:id=>PLACES[id],groups:[['Places',['today','studio','calendar','inbox','tasks','habits','goals','projects','routines','lists','reviews','insights']]],onDone:D=>setSettings({nav:D})});}
function areasSheet(){
  const s=get.settings();let D=[...(s.areas||AREAS)];let v='';let inst;
  inst=openSheet({title:'Life areas',left:{label:'Cancel'},right:{label:'Done',onclick:()=>{setSettings({areas:D,foundation:{...(s.foundation||{}),areas:true}});inst.close();}},build:body=>{
    const box=el('div',{class:'chips'});const draw=()=>{box.innerHTML='';[...new Set([...AREAS,...OPT_AREAS,...D])].forEach(a=>box.append(el('button',{class:'chip'+(D.includes(a)?' on':''),'aria-pressed':String(D.includes(a)),onclick:()=>{D.includes(a)?D=D.filter(x=>x!==a):D.push(a);draw();}},a)));};draw();
    const T=fieldTitle('f-new-area','Add your own','Faith, pets, side business…','',x=>v=x,()=>{if(v.trim()&&!D.includes(v.trim())){D.push(v.trim());T.input.value='';v='';draw();}});
    body.append(el('p',{class:'muted small'},'Choose the parts of life you plan around.'),box,T.wrap);}});
}
/* a step counts as done when it's really done, wherever you did it */
function foundationDone(s){const f=s.foundation||{},d=DEFAULT_SETTINGS;return{areas:f.areas||JSON.stringify(s.areas)!==JSON.stringify(d.areas),work:f.work||JSON.stringify(s.work)!==JSON.stringify(d.work)||JSON.stringify(s.workDays)!==JSON.stringify(d.workDays),review:f.review||(s.reviewDay??0)!==d.reviewDay,goal:f.goal||get.all('goal').length>0,calendar:f.calendar||s.icsAdded===true||(s.icsAdded==null&&!!s.icsToken)||!!(s.calendar&&s.calendar.on)};}
function viewFoundation(root){
  const s=get.settings(),f=foundationDone(s),page=el('div',{class:'page'});
  const steps=[['areas','Choose your life areas','The parts of life you want to plan around',areasSheet],['work','Set your working hours','So Studio knows when you’re free',workSheet],['review','Pick your review day','When the weekly check-in shows up',()=>pickOne('Review day',DOW.map((d,i)=>[i,d]),s.reviewDay??0,v=>setSettings({reviewDay:v,foundation:{...(get.settings().foundation||{}),review:true}}))],['goal','Add your first goal','Something you are working toward this quarter',()=>goalSheet(null,{after:()=>setSettings({foundation:{...(get.settings().foundation||{}),goal:true}})})],['calendar','Connect a calendar',PWA.on?'See your plans in Apple Calendar':'Bring in events you already have',()=>App.go('setpage',{id:'calendar'})]];
  const done=steps.filter(x=>f[x[0]]).length;
  page.append(pageHead('Personalized foundation','Five short steps so plans and suggestions fit how you actually live.',{back:'Settings',to:'prefs'}));
  page.append(el('div',{class:'lbl'},`${done} of 5 done`),el('div',{class:'list'},steps.map(([id,t,sub,on])=>{const d=!!f[id];const next=!d&&steps.find(x=>!f[x[0]])[0]===id;return el('button',{class:'li',style:'min-height:64px',onclick:on},el('span',{class:'tick'+(d?' on':''),html:ic('check',14,3)}),el('span',{class:'grow'},el('b',{style:d?'color:var(--ink-2)':''},t),el('small',{},sub)),next?el('span',{class:'linkbtn small'},'Next'):null,el('span',{class:'chev',html:ic('chevr',16,2)}));})));
  if(done===5)page.append(el('button',{class:'btn primary block',onclick:()=>{setSettings({introDone:true});App.go('today');}},'Go to Today'));
  else if(!s.introDone)page.append(el('button',{class:'btn text',onclick:()=>{setSettings({introDone:true});App.go('today');}},'Skip for now'));
  root.append(page);
}
function photoRefs(list){const out=[];const walk=o=>{if(!o||typeof o!=='object')return;if(Array.isArray(o.photos))o.photos.forEach(ph=>{if(ph&&typeof ph==='object'&&ph.url)out.push(ph);});for(const k in o){const v=o[k];if(v&&typeof v==='object'&&k!=='photos')walk(v);}};list.forEach(walk);return out;}
const blobToData=b=>new Promise(res=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.onerror=()=>res(null);fr.readAsDataURL(b);});
async function exportData(withPhotos=false){let records=[...recs.values()];if(withPhotos){records=clone(records);const refs=photoRefs(records).filter(ph=>!/^data:/.test(ph.url));const bz=busyNote(`Packing ${refs.length} photo${refs.length===1?'':'s'}…`);let ok=0;for(const ph of refs){try{const r=await fetch(ph.url);if(r.ok){const d=await blobToData(await r.blob());if(d){ph.url=d;ph.id=null;ok++;}}}catch(e){}}bz();if(refs.length&&ok<refs.length)toast(`${refs.length-ok} photo${refs.length-ok===1?'':'s'} couldn’t be packed and keep their links`);}
  const data=JSON.stringify({app:'life-os',version:2,appVer:APP_VER,exportedAt:new Date().toISOString(),photos:withPhotos?'embedded':'linked',records},null,1);saveFile(`Life-OS-backup-${todayK()}${withPhotos?'-with-photos':''}.json`,data);}
async function importData(file){if(!file)return;let p;try{p=JSON.parse(await file.text());if(!p.records||p.app!=='life-os')throw 0;}catch(e){toast('That file isn’t a Life OS backup.');return;}
  const bz=busyNote('Restoring your backup…');let n=0;const added=[];p.records.forEach(r=>{if(r&&r.id&&r.kind&&r.kind!=='settings'&&!recs.has(r.id)){put(r,{silent:true});added.push(r);n++;}});
  const bs=p.records.find(r=>r&&r.kind==='settings');if(bs){const cur=get.settings(),patch={};const uniq=(a,b,key)=>{const m=new Map();[...(a||[]),...(b||[])].forEach(x=>m.set(key?x[key]:JSON.stringify(x),x));return[...m.values()];};
    patch.customMods=uniq(cur.customMods,bs.customMods,'id');patch.todayPins=uniq(cur.todayPins,bs.todayPins).slice(0,6);['hubShown','hubHidden','timeBudget','top3','skinLog','toolSeen'].forEach(k=>{if(bs[k]&&typeof bs[k]==='object')patch[k]=Object.assign({},bs[k],cur[k]||{});});
    Object.keys(bs).forEach(k=>{if(!(k in patch)&&!['id','kind','updatedAt','createdAt'].includes(k)&&(cur[k]===undefined||cur[k]===null))patch[k]=bs[k];});if(!cur.areas&&bs.areas)patch.areas=bs.areas;setSettings(patch);}
  let up=0;if(store.assets){for(const ph of photoRefs(added).filter(ph=>/^data:/.test(ph.url))){try{const b=await (await fetch(ph.url)).blob();const a=await store.assets.upload(b);ph.id=a.id;ph.url=a.url;up++;}catch(e){}}if(up)added.forEach(r=>put(r,{silent:true}));}
  bz();App.refresh();toast(`Added ${n} item${n===1?'':'s'}${bs?' and your settings':''}${up?`, ${up} photo${up===1?'':'s'}`:''}`);}
function clearExamples(){[...recs.values()].filter(r=>r.example).forEach(r=>remove(r.id,{silent:true,hard:true}));App.refresh();toast('Example data cleared');}
function loadExamples(){
  const t=todayK(),n=nowMin(),nx=Math.min(21*60,Math.ceil((n+45)/30)*30),ex={example:true};
  const mk=(kind,f)=>create(kind,Object.assign({},ex,f));
  mk('block',{title:'Focus time (example)',notes:'',date:t,start:nx,dur:60,repeat:{type:'never',end:null},reminder:null,part:null,area:'Career',color:'sage',icon:'focus'});
  mk('block',{title:'Dinner with Sam (example)',notes:'',date:addK(t,1),start:18*60+30,dur:90,repeat:{type:'never',end:null},reminder:null,part:null,area:'Relationships',color:'rose',icon:'meal'});
  mk('task',{title:'Call the pharmacy back (example)',notes:'',steps:[],date:t,time:null,repeat:{type:'never',end:null},reminder:null,deadline:null,priority:'high',part:null,area:'Health'});
  mk('task',{title:'Groceries for the week (example)',notes:'',steps:[{id:uid('s'),t:'Oat milk',d:false},{id:uid('s'),t:'Lemons',d:true},{id:uid('s'),t:'Coffee beans',d:false}],date:t,time:null,repeat:{type:'never',end:null},reminder:null,deadline:null,priority:'normal',part:null,area:'Home'});
  mk('task',{title:'Book dentist cleaning (example)',notes:'',steps:[],date:null,time:null,repeat:{type:'never',end:null},reminder:null,deadline:addK(t,5),priority:'normal',part:null,area:'Health'});
  mk('task',{title:'Pay water bill (example)',notes:'',steps:[],date:null,time:null,repeat:{type:'never',end:null},reminder:null,deadline:addK(t,3),priority:'normal',part:null,area:'Finances'});
  mk('allday',{title:'Mom’s birthday (example)',notes:'',start:addK(t,2),end:null,repeat:{type:'custom',unit:'year',n:1,end:null},reminder:null,area:'Relationships',color:'plum',icon:'cake'});
  mk('habit',{title:'Run (example)',notes:'',target:3,dur:45,days:[],area:'Health',color:'blue',icon:'dumbbell',logs:{},sessions:{},startDate:t});
  mk('habit',{title:'Read (example)',notes:'',target:4,dur:30,days:[],area:'Learning',color:'plum',icon:'book',logs:{},sessions:{},startDate:t});
  mk('goal',{title:'Run a 10K (example)',notes:'',area:'Health',deadline:addK(t,60),color:'blue',status:'active',steps:[{id:uid('s'),t:'Pick a training plan',d:true},{id:uid('s'),t:'Sign up for a race',d:false},{id:uid('s'),t:'Build to 5 miles',d:false}]});
  mk('project',{title:'Kitchen refresh (example)',notes:'',area:'Home',deadline:null,color:'clay',status:'active',part:null,steps:[{id:uid('s'),t:'Measure the cabinets',d:false},{id:uid('s'),t:'Choose a paint color',d:false}]});
  mk('idea',{title:'Look into a ceramics class (example)',notes:'',photos:[],source:null});
  mk('list',{title:'Packing (example)',items:[{id:uid('i'),t:'Chargers',d:false},{id:uid('i'),t:'Running shoes',d:true}]});
  setSettings({introDone:true});toast('Examples loaded');
}
