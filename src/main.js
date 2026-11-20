/* ---------- App shell + routing ---------- */
const TOPS=['today','studio','calendar','more'];
const App={
  state:{view:'today',sel:todayK(),params:{},loading:true,_fresh:true},
  go(view,params={}){const S=this.state;if(view!==S.view)S.trashSel=null;try{const tt=$('#toast');if(tt&&tt.classList.contains('on')&&Date.now()-toastAt>1200)tt.classList.remove('on');}catch(e){}if(S.view==='today'){const g=$('#grid');if(g)S._gridTop=g.scrollTop;}
    const y=scrollY;S.scrolls=S.scrolls||{};S.scrolls[S.view]=y;
    if(view==='today')S._fresh=S._fresh||S.view!=='today';
    try{const pg0=$('#view')&&$('#view').firstElementChild;if(pg0&&!TOPS.includes(view)){(this._snaps=this._snaps||{})[(S.stack||[]).length+1]={node:pg0.cloneNode(true),view:S.view,y};}}catch(e){}
    (S.stack=S.stack||[]).push({view:S.view,params:S.params,y});if(S.stack.length>30)S.stack.shift();
    if(view==='tasks')S.taskTab=params.tab||'all';S.view=view;S.params=params;S.entering=true;S.dir=TOPS.includes(view)?'tab':'push';
    try{if(/^[a-z-]+$/.test(view))history.replaceState(null,'','#'+(view==='settings'?'prefs':view));}catch(e){}
    this.render();window.scrollTo(0,0);
  },
  back(fallback){const S=this.state;const p=(S.stack||[]).pop();let y=0;if(p&&p.view!==S.view){S.view=p.view;S.params=p.params;y=p.y||0;}else{const[fv,fid]=String(fallback||'more').split(':');S.view=fv;S.params=fid?{id:fid}:{};}S.entering=true;S.dir=S._swiped?'swiped':'pop';S._swiped=false;this.render();window.scrollTo(0,y);},
  refresh(){clearTimeout(this._r);this._r=setTimeout(()=>this.render(),0);if(PWA.on)PWA.afterChange();},
  dataReady(){this.state.loading=false;try{mergeModules();}catch(e){console.warn(e);}try{Ical.load();setTimeout(()=>Ical.sync(),1500);}catch(e){}purgeTrash();migrate();{const s0=get.settings();if(!s0.tickHalo&&recs.has('settings'))put(Object.assign({},DEFAULT_SETTINGS,s0,{completed:'fade',celebrate:'flow',tickHalo:true}),{silent:true});}applyPrefs();{const s1=get.settings();if(s1.seenVer==null&&s1.introDone)setSettings({seenVer:APP_VER-1});let hv='';try{hv=location.hash.slice(1);}catch(e){}if(!hv&&this.state.view==='today'&&s1.startPage&&s1.startPage!=='today')this.state.view=s1.startPage;if(!hv&&!s1.introDone&&!OB_TEST()&&![...recs.values()].some(r=>r.kind!=='settings'))this.state.view='welcome';}try{travelMigrate();tripReturn();nwAutoSnap();}catch(e){console.warn(e);}Gcal.start();{const sd=get.settings();/* the demo no longer loads on its own: new accounts start empty (load it from Data & help) */if(false){setSettings({demoAuto:APP_VER});try{loadDemo(true);}catch(e){console.warn(e);}}else if(sd.demoSnap&&sd.demoVer!==6){try{demoRefresh();}catch(e){console.warn(e);}}}this.render();checkReminders();if(PWA.on)PWA.afterChange();},
  render(){
    const S=this.state,root=$('#view');
    if(this.dragging)return;
    applyPrefs();migrate();
    // keep focus and text while someone is typing in the page itself
    const act=document.activeElement;
    if(act&&root.contains(act)&&(act.tagName==='TEXTAREA'||(act.tagName==='INPUT'&&!act.id.startsWith('li-new')&&act.id!=='pt-new'&&act.id!=='q'))&&S.lastView===S.view){this.navbar();return;}
    if(act&&act.id==='q'&&S.view==='search'&&S.lastView==='search')return;
    const keepGrid=$('#grid');if(keepGrid&&S.view==='today')S._gridTop=keepGrid.scrollTop;
    const dockEl=$('#st-dock');const dockL=dockEl?dockEl.scrollLeft:0;
    const frag=document.createDocumentFragment(),P=S.params||{};
    document.body.classList.remove('has-commit');$('#commitbar').hidden=true;$('#mini').classList.remove('on');
    const views={welcome:viewWelcome,trip:r=>viewTrip(r,P.id),today:viewToday,studio:viewStudio,calendar:viewCalendar,more:viewMore,habit:r=>viewHabit(r,P.id),player:r=>viewPlayer(r,P.id),tool:r=>viewTool(r,P.hub,P.tool),setpage:r=>viewSetPage(r,P.id),search:viewSearch,planweek:r=>viewPlanWeek(r,P.anchor),organize:viewMore,reflect:viewMore,inbox:viewInbox,tasks:viewTasks,habits:viewHabits,goals:r=>viewPlans(r,'goal'),projects:r=>viewPlans(r,'project'),plan:r=>viewPlan(r,P.id),routines:viewRoutines,routine:r=>viewRoutine(r,P.id),lists:viewLists,list:r=>viewList(r,P.id),areas:viewAreas,area:r=>viewArea(r,P.name),reviews:viewReviews,review:viewReview,insights:viewInsights,discover:viewMore,tools:viewAreas,archive:viewArchive,trash:viewTrash,photos:viewPhotos,prefs:viewPrefs,foundation:viewFoundation,timer:viewTimer,modules:viewModules};
    document.body.classList.toggle('onboarding',S.view==='welcome');
    try{applyTheme();}catch(e){}(views[S.view]||viewToday)(frag);S._reveal=null;frag.querySelectorAll('.pgtitle').forEach(fitTitle);if(!frag.querySelector('h1')){const nm={today:'Today',calendar:'Calendar',search:'Search',studio:'Studio'}[S.view]||String(S.view||'Today').replace(/^./,c=>c.toUpperCase());const pg=frag.querySelector('.page')||frag;pg.prepend(el('h1',{class:'sr-only'},nm));}
    const C0=S.cal||{},scope=`${S.view}|${S.sel}|${C0.mode}|${C0.anchor}|${JSON.stringify(P)}`;
    const opened=S.lastView!==S.view||!!S.entering;
    const listBefore=S.lastView===S.view&&S._scope===scope&&!S.entering?listSnap(root):null;S._scope=scope;const blkBefore=listBefore?blkSnap():null;
    closeFabMenu(true);
    const skelG=root.querySelector('.skel')?$$('#view .page>*').filter(n=>n.querySelector('.skel')||n.classList.contains('skel')).map(ghostOf).filter(Boolean):[];
    const noDepth=S._noDepth;S._noDepth=false;const depthDir=!S._searchFrom&&!noDepth&&S.entering&&(S.dir==='push'||S.dir==='pop')&&S._painted?S.dir:null,depthGhost=null; /* v103: no two-page slide; the light CSS slide below runs smoothly on iPhone */
    root.replaceChildren(frag);try{a11yPass(root);}catch(e){}
    animateFills(root,S);
    listPlay(root,listBefore);
    rollCounts(root,`${S.view}|${S.sel}`);
    swipeArrive();settleBlock();todayHeaderScroll();meterPops(root,`${S.view}|${S.sel}`);studioPop();if(opened){countUp(root);chartsIn(root);}milestones(root);skeletonMelt(skelG,root);chipChecks(root);segFill(root);studioCascade();arcPlay();weekBandGlide();commitSweep();streakRoll(root);emptyDraw(root);dotRun(root);ideaMorph(root);stepIn(root);panelIn(root);searchGrow(root);wkRefocus(root);hcFill(root);msLine(root);blkFlip(blkBefore);dateDropIn(root);heldPlay(root);t3Roll(root);pinDropIn(root);
    if(depthGhost){depthSlide(depthGhost,root.firstElementChild,depthDir);S.dir=null;S.entering=false;}
    if(S.entering){const pg=root.firstElementChild;if(pg&&S._painted&&(S.view!=='today'||S.dir==='pop'||S.dir==='swiped'))if(!(S.dir==='swiped'&&S._under))pg.classList.add(S.dir==='push'?'viewin-push':S.dir==='pop'?'viewin-pop':S.dir==='swiped'?'viewin-swiped':'viewin');S._under=false;S.dir=null;S.entering=false;}
    S.lastView=S.view;
    const d2=$('#st-dock');if(d2)d2.scrollLeft=dockL;
    this.navbar();
  },
  navbar(){
    const S=this.state,s=get.settings(),nav=$('#nav-in');
    const fav=(s.nav&&s.nav.length===3?s.nav:DEFAULT_SETTINGS.nav);
    const group={inbox:'inbox',tasks:'tasks',habits:'habits',habit:'habits',goals:'goals',projects:'projects',plan:null,routines:'routines',routine:'routines',player:'routines',lists:'lists',list:'lists',reviews:'reviews',review:'reviews',insights:'insights'};
    const cur=S.view;
    const isAct=id=>id===cur||group[cur]===id||id===origin;
    let origin=null;
    if(!fav.some(id=>id===cur||group[cur]===id)&&!TOPS.includes(cur)){const st=S.stack||[];for(let i=st.length-1;i>=0;i--){const v=st[i].view;if(TOPS.includes(v)){if(fav.includes(v))origin=v;break;}}}
    const anyFav=fav.some(isAct)||!!origin;
    /* The bar is built once and kept, so the sliding highlight is never torn out mid-glide.
       It is only rebuilt when the chosen favorites change. */
    const sig=fav.join('|');
    if(nav._sig!==sig){
      nav.innerHTML='';nav._sig=sig;
      const tab=(id,label,icon)=>{const b=el('button',{class:'tab','data-tab':id,onclick:()=>{
        if(id===App.state.view){tabTop();return;}
        if(nav._pending===id)return;nav._pending=id;
        App.state.stack=[];tabPick(nav,id);
        /* let the highlight start moving first, then draw the page */
        requestAnimationFrame(()=>setTimeout(()=>{nav._pending=null;App.go(id);},0));
      }},el('span',{class:'ic',html:icon}),el('span',{class:'tl-lbl'},label));return b;};
      const iconOf=id=>id==='more'?sv('<circle cx="5" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.8" fill="currentColor" stroke="none"/>',22):ic(PLACES[id].i,22);
      const short=id=>({'tools':'Tools'})[id]||PLACES[id].n;
      nav.append(el('span',{class:'tab-ind','aria-hidden':'true'},el('i')),el('div',{class:'rail-brand'},'Life OS'),tab(fav[0],short(fav[0]),iconOf(fav[0])),tab(fav[1],short(fav[1]),iconOf(fav[1])),(()=>{let t=0,held=false;const f=el('button',{class:'fab',id:'fab','aria-label':'Quick capture. Press and hold for more',html:sv(P.plus,24,2.2),onclick:e=>{if(held){held=false;e.preventDefault();return;}captureSheet(null);},oncontextmenu:e=>e.preventDefault(),onpointerdown:e=>{held=false;clearTimeout(t);t=setTimeout(()=>{held=true;buzz(8);const r=f.getBoundingClientRect();openMenu(r.left+r.width/2,r.top-8,[{label:'Task',icon:'task',onclick:()=>taskSheet(null,{date:todayK()})},{label:'Time block',icon:'hour',onclick:()=>blockSheet(null,{date:todayK(),start:Math.min(22*60,Math.ceil((new Date().getHours()*60+new Date().getMinutes())/30)*30)})},{label:'All-day item',icon:'cal',onclick:()=>alldaySheet(null,{start:App.state.view==='today'&&App.state.sel?App.state.sel:todayK()})},{label:'Habit',icon:'habit',onclick:()=>habitSheet(null)},{label:'Goal',icon:'target',onclick:()=>goalSheet(null)},{label:'Idea for the Inbox',icon:'inbox',onclick:()=>captureSheet(null)}]);},450);},onpointerup:()=>clearTimeout(t),onpointerleave:()=>clearTimeout(t),onpointercancel:()=>clearTimeout(t)});return f;})(),tab(fav[2],short(fav[2]),iconOf(fav[2])),tab('more','More',iconOf('more')));
    }
    if(nav._pending)return;
    let actId=null;
    nav.querySelectorAll('.tab').forEach(b=>{const id=b.dataset.tab,on=id==='more'?!anyFav:isAct(id);b.classList.toggle('act',on);if(on){b.setAttribute('aria-current','page');actId=id;}else b.removeAttribute('aria-current');});
    tabInd(nav,actId);
  },
};
/* minute tick and day rollover */
let lastDay=todayK();
function clockTick(){tickNow();const tk=todayK();if(tk!==lastDay){if(App.state.sel===lastDay)App.state.sel=tk;lastDay=tk;try{tripReturn();}catch(e){}App.state._fresh=true;App.refresh();}else if(App.state.view==='today'&&!sheetStack.length&&!$('.menu')&&!App.dragging&&!(document.activeElement&&document.activeElement.matches&&document.activeElement.matches('input,textarea'))){App.refresh();}checkReminders();}
(function clock(){setTimeout(()=>{clockTick();clock();},60000-Date.now()%60000+50);})();
document.addEventListener('visibilitychange',()=>{if(!document.hidden){clockTick();Gcal.refreshIfStale();try{Ical.sync();}catch(e){}}});
/* keyboard on Today: arrows change day, T goes to today, N adds a task */
document.addEventListener('keydown',e=>{if((e.key==='c'||e.key==='C')&&!sheetStack.length&&!$('.menu')&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&!(e.target.matches&&e.target.matches('input,textarea,select'))){e.preventDefault();captureSheet(null);}});
document.addEventListener('keydown',e=>{if(App.state.view!=='calendar'||sheetStack.length||$('.menu')||e.metaKey||e.ctrlKey||e.altKey)return;if(e.target.matches&&e.target.matches('input,textarea,select'))return;
  if(e.key==='ArrowLeft'){calStep(-1);e.preventDefault();}else if(e.key==='ArrowRight'){calStep(1);e.preventDefault();}else if(e.key==='t'){calNow();}});
document.addEventListener('keydown',e=>{if(App.state.view!=='today'||sheetStack.length||$('.menu')||e.metaKey||e.ctrlKey||e.altKey)return;if(e.target.matches&&e.target.matches('input,textarea,select'))return;
  if(e.key==='ArrowLeft'){goDay(addK(App.state.sel,-1));e.preventDefault();}else if(e.key==='ArrowRight'){goDay(addK(App.state.sel,1));e.preventDefault();}else if(e.key==='t'){goDay(todayK());}else if(e.key==='n'){e.preventDefault();taskSheet(null,{date:App.state.sel});}});
/* the small Today bar follows the scroll in motion.js (todayHeaderScroll) */
addEventListener('hashchange',()=>{const v=location.hash.slice(1);if(v&&v!==App.state.view&&/^[a-z]+$/.test(v))App.go(v);});
/* boot: paint the shell from the saved copy at once, then let the live data arrive quietly */
const hadCache=loadCache();
App.state.loading=!hadCache;
try{const h=location.hash.slice(1);const simple=['today','studio','calendar','more','inbox','tasks','habits','goals','projects','routines','lists','areas','reviews','insights','discover','tools','archive','prefs'];if(simple.includes(h))App.state.view=h;}catch(e){}
App.render();
connect();
setTimeout(checkReminders,1500);

/* swipe in from the left edge to go back, like an iPhone app (pages with a back button only).
   v228: the page you came from sits underneath, shifted left and dimmed, and slides into place as you drag */
(()=>{const EDGE=26;let t=null;const V=()=>$('#view');
  const canBack=()=>!sheetStack.length&&!$('.menu')&&!$('.confirm.on')&&!TOPS.includes(App.state.view)&&!!document.querySelector('#view .pghead .back');
  const underFor=()=>{const S=App.state,st=S.stack||[],sn=(App._snaps||{})[st.length];if(!sn||!st.length||st[st.length-1].view!==sn.view)return null;
    const v=V(),cs=getComputedStyle(v),u=el('div',{class:'swipe-under','aria-hidden':'true',inert:''}),inner=el('div',{class:'su-in'}),dim=el('div',{class:'su-dim'});
    const c=sn.node.cloneNode(true);c.removeAttribute('id');c.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));
    inner.style.cssText=`max-width:${cs.maxWidth};margin-left:${cs.marginLeft};margin-right:${cs.marginRight};padding:${cs.padding};transform:translate3d(-30%,${-sn.y}px,0)`;inner.append(c);u.append(inner,dim);document.body.append(u);v.classList.add('swiping');return{u,inner,dim,y:sn.y};};
  const place=(un,f)=>{if(!un)return;un.inner.style.transform=`translate3d(${-30*(1-f)}%,${-un.y}px,0)`;un.dim.style.opacity=String(.08*(1-f));};
  const drop=(un,ms)=>{if(!un)return;setTimeout(()=>{un.u.remove();const v=V();if(v)v.classList.remove('swiping');},ms);};
  const reset=(v,anim)=>{v.style.transition=anim?'transform var(--dur-base) var(--ease),opacity var(--dur-base)':'';v.style.transform='';v.style.opacity='';if(anim)setTimeout(()=>{v.style.transition='';},300);};
  addEventListener('touchstart',e=>{if(e.touches.length!==1)return;const x=e.touches[0].clientX;if(x>EDGE||!canBack()){t=null;return;}t={x0:x,y0:e.touches[0].clientY,t0:Date.now(),on:false,dx:0,un:null};},{passive:true});
  addEventListener('touchmove',e=>{if(!t)return;const p=e.touches[0],dx=p.clientX-t.x0,dy=p.clientY-t.y0;
    if(!t.on){if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){t=null;return;}if(dx<8)return;t.on=true;try{if(motionOK())t.un=underFor();}catch(err){t.un=null;}}
    e.preventDefault();t.dx=Math.max(0,dx);const v=V(),w=innerWidth;v.style.transition='';v.style.transform=`translateX(${t.dx}px)`;if(!t.un)v.style.opacity=String(1-Math.min(.35,t.dx/w*.5));place(t.un,Math.min(1,t.dx/w));},{passive:false});
  const end=()=>{if(!t)return;const s=t;t=null;if(!s.on)return;const v=V(),w=innerWidth,vel=s.dx/Math.max(1,Date.now()-s.t0);
    if(s.dx>w*.33||(vel>.45&&s.dx>40)){v.style.transition='transform .22s var(--ease),opacity .22s';v.style.transform=`translateX(${w}px)`;if(!s.un)v.style.opacity='0';
      if(s.un){s.un.inner.style.transition='transform .22s var(--ease)';s.un.dim.style.transition='opacity .22s';place(s.un,1);}
      buzz(8);setTimeout(()=>{const b=document.querySelector('#view .pghead .back');App.state._swiped=true;App.state._under=!!s.un;reset(v,false);if(b)b.click();else App.back();drop(s.un,60);},210);}
    else{reset(v,true);if(s.un){s.un.inner.style.transition='transform var(--dur-base) var(--ease)';s.un.dim.style.transition='opacity var(--dur-base)';place(s.un,0);drop(s.un,300);}}};
  addEventListener('touchend',end,{passive:true});addEventListener('touchcancel',end,{passive:true});})();

try{matchMedia('(prefers-color-scheme: dark)').addEventListener('change',()=>{if(get.settings().mode==='auto')App.refresh();});}catch(e){}

/* v228 · re-lay Today when the window crosses the two-column width */
(()=>{let wide=innerWidth>=1100;addEventListener('resize',()=>{const w=innerWidth>=1100;if(w!==wide){wide=w;if(App.state.view==='today')App.refresh();}});})();
/* v228 · more keyboard shortcuts on a computer (C, N, T and arrows already live above): 1–4 switch tabs, / search, T anywhere goes to Today, ? lists them all */
(()=>{const typing=t=>t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  const keys=[['C','Quick capture'],['N','New task (Today)'],['T','Jump to today'],['← →','Previous or next day or period'],['1 2 3 4','Today, Studio, Calendar, More'],['/','Search'],['Esc','Close a sheet or menu'],['?','Show these shortcuts']];
  const help=()=>openSheet({title:'Keyboard shortcuts',build:b=>b.append(el('div',{class:'kbdlist'},keys.map(([k,t])=>el('div',{class:'kbdrow'},el('span',{},t),el('span',{class:'kbds'},k.split(' ').map(x=>el('kbd',{},x))))))) });
  addEventListener('keydown',e=>{if(e.metaKey||e.ctrlKey||e.altKey||e.defaultPrevented)return;
    if(typing(e.target)||sheetStack.length||App.dragging||$('.menu')||$('.confirm.on'))return;
    const S=App.state,k=e.key,tabs={'1':'today','2':'studio','3':'calendar','4':'more'};
    if(tabs[k]){e.preventDefault();if(S.view!==tabs[k])App.go(tabs[k]);}
    else if((k==='t'||k==='T')&&S.view!=='today'&&S.view!=='calendar'){e.preventDefault();S.sel=todayK();S._fresh=true;App.go('today');}
    else if(k==='/'){e.preventDefault();const f0=$('#view input[type=search]');if(f0){f0.focus();return;}App.go('more');setTimeout(()=>{const f=$('#view input[type=search],#view input');if(f)f.focus();},120);}
    else if(k==='?'){e.preventDefault();help();}
  });})();

/* v230 · arrow keys through lists on a computer: ↑ ↓ move, Enter opens, X checks off, Delete deletes (with Undo) */
(()=>{const ROWS=':is(.li,.dfact,.dayline,.ibrow)';const typing=t=>t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  const vis=n=>{const r=n.getBoundingClientRect();return r.height>0&&r.width>0&&getComputedStyle(n).visibility!=='hidden';};
  const rows=()=>[...document.querySelectorAll('#view '+ROWS)].filter(n=>!n.parentElement.closest(ROWS)&&vis(n));
  const cur=()=>{const a=document.activeElement;return a&&a.closest?a.closest('#view '+ROWS):null;};
  const mark=n=>{$$('.kfocus').forEach(x=>x.classList.remove('kfocus'));if(!n)return;if(!n.matches('button,a,[tabindex]'))n.setAttribute('tabindex','-1');n.classList.add('kfocus');n.focus({preventScroll:true});n.scrollIntoView({block:'nearest',behavior:motionOK()?'smooth':'auto'});};
  const sw=n=>[n,n&&n.parentElement].find(x=>x&&x._sw);
  addEventListener('pointerdown',()=>$$('.kfocus').forEach(x=>x.classList.remove('kfocus')),true);
  addEventListener('keydown',e=>{if(e.metaKey||e.ctrlKey||e.altKey||e.defaultPrevented)return;if(typing(e.target)||sheetStack.length||$('.menu')||$('.confirm.on'))return;
    const k=e.key;if(!['ArrowDown','ArrowUp','x','X','Delete','Backspace','Enter'].includes(k))return;
    const c=cur();
    if(k==='ArrowDown'||k==='ArrowUp'){const l=rows();if(!l.length)return;e.preventDefault();const i=c?l.indexOf(c):-1;mark(l[Math.max(0,Math.min(l.length-1,i<0?(k==='ArrowDown'?0:l.length-1):i+(k==='ArrowDown'?1:-1)))]);return;}
    if(!c)return;
    if(k==='Enter'){if(c.tagName==='BUTTON'||c.tagName==='A')return;e.preventDefault();const b=c.querySelector('button.grow,button:not(.tick):not(.tick-hit button),a');(b||c).click();return;}
    if(k==='x'||k==='X'){e.preventDefault();const s=sw(c);if(s&&s._sw.right&&!/open/i.test(s._sw.right.label)){s._sw.right.run();return;}const t=c.querySelector('.tick-hit button,.tick-hit .tick,button.tick');if(t)t.click();return;}
    if(k==='Delete'||k==='Backspace'){const s=sw(c);if(s&&s._sw.left&&/delete/i.test(s._sw.left.label)){e.preventDefault();s._sw.left.run();}}
  });})();
/* v230 · tooltips on icon-only buttons for mouse users: the button's name, and its shortcut if it has one */
(()=>{let tip=null,tm=null,on=null;const KEY=[[/capture/i,'C'],[/search/i,'/'],[/keyboard shortcuts/i,'?']];
  const hide=()=>{clearTimeout(tm);on=null;if(tip)tip.classList.remove('on');};
  addEventListener('pointerover',e=>{if(e.pointerType!=='mouse')return;const b=e.target.closest&&e.target.closest('button[aria-label],a[aria-label]');if(b===on)return;hide();if(!b||b.textContent.trim())return;on=b;
    tm=setTimeout(()=>{if(!b.isConnected)return;tip=tip||document.body.appendChild(el('div',{class:'tipx',role:'tooltip'}));const lab=b.getAttribute('aria-label'),k=(KEY.find(([re])=>re.test(lab))||[])[1];tip.innerHTML='';tip.append(lab,k?el('kbd',{},k):'');
      const r=b.getBoundingClientRect(),w=tip.offsetWidth,h=tip.offsetHeight;let x=r.left+r.width/2-w/2,y=r.bottom+8;if(y+h>innerHeight-8)y=r.top-h-8;tip.style.left=Math.max(8,Math.min(innerWidth-w-8,x))+'px';tip.style.top=y+'px';tip.classList.add('on');},450);},true);
  addEventListener('pointerout',e=>{if(on&&!on.contains(e.relatedTarget))hide();},true);addEventListener('pointerdown',hide,true);addEventListener('scroll',hide,{passive:true,capture:true});})();
