/* ---------- App shell + routing ---------- */
const TOPS=['today','studio','calendar','more'];
const App={
  state:{view:'today',sel:todayK(),params:{},loading:true,_fresh:true},
  go(view,params={}){const S=this.state;try{const tt=$('#toast');if(tt&&tt.classList.contains('on')&&Date.now()-toastAt>1200)tt.classList.remove('on');}catch(e){}if(S.view==='today'){const g=$('#grid');if(g)S._gridTop=g.scrollTop;}
    const y=scrollY;S.scrolls=S.scrolls||{};S.scrolls[S.view]=y;
    if(view==='today')S._fresh=S._fresh||S.view!=='today';
    (S.stack=S.stack||[]).push({view:S.view,params:S.params,y});if(S.stack.length>30)S.stack.shift();
    S.view=view;S.params=params;S.entering=true;S.dir=TOPS.includes(view)?'tab':'push';
    try{if(/^[a-z-]+$/.test(view))history.replaceState(null,'','#'+(view==='settings'?'prefs':view));}catch(e){}
    this.render();window.scrollTo(0,0);
  },
  back(fallback){const S=this.state;const p=(S.stack||[]).pop();let y=0;if(p&&p.view!==S.view){S.view=p.view;S.params=p.params;y=p.y||0;}else{S.view=fallback||'more';S.params={};}S.entering=true;S.dir=S._swiped?'swiped':'pop';S._swiped=false;this.render();window.scrollTo(0,y);},
  refresh(){clearTimeout(this._r);this._r=setTimeout(()=>this.render(),0);if(PWA.on)PWA.afterChange();},
  dataReady(){this.state.loading=false;purgeTrash();migrate();{const s0=get.settings();if(!s0.tickHalo&&recs.has('settings'))put(Object.assign({},DEFAULT_SETTINGS,s0,{completed:'fade',celebrate:'flow',tickHalo:true}),{silent:true});}applyPrefs();{const s1=get.settings();if(s1.seenVer==null&&s1.introDone)setSettings({seenVer:APP_VER-1});let hv='';try{hv=location.hash.slice(1);}catch(e){}if(!hv&&this.state.view==='today'&&s1.startPage&&s1.startPage!=='today')this.state.view=s1.startPage;if(!hv&&!s1.introDone&&!OB_TEST()&&![...recs.values()].some(r=>r.kind!=='settings'))this.state.view='welcome';}try{travelMigrate();tripReturn();nwAutoSnap();}catch(e){console.warn(e);}Gcal.start();this.render();checkReminders();if(PWA.on)PWA.afterChange();},
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
    const views={welcome:viewWelcome,trip:r=>viewTrip(r,P.id),today:viewToday,studio:viewStudio,calendar:viewCalendar,more:viewMore,habit:r=>viewHabit(r,P.id),player:r=>viewPlayer(r,P.id),tool:r=>viewTool(r,P.hub,P.tool),setpage:r=>viewSetPage(r,P.id),search:viewSearch,planweek:r=>viewPlanWeek(r,P.anchor),organize:viewOrganize,reflect:viewReflect,inbox:viewInbox,tasks:viewTasks,habits:viewHabits,goals:r=>viewPlans(r,'goal'),projects:r=>viewPlans(r,'project'),plan:r=>viewPlan(r,P.id),routines:viewRoutines,routine:r=>viewRoutine(r,P.id),lists:viewLists,list:r=>viewList(r,P.id),areas:viewAreas,area:r=>viewArea(r,P.name),reviews:viewReviews,review:viewReview,insights:viewInsights,discover:viewDiscover,tools:viewTools,archive:viewArchive,trash:viewTrash,photos:viewPhotos,prefs:viewPrefs,foundation:viewFoundation,timer:viewTimer,modules:viewModules};
    document.body.classList.toggle('onboarding',S.view==='welcome');
    (views[S.view]||viewToday)(frag);if(!frag.querySelector('h1')){const nm={today:'Today',calendar:'Calendar',search:'Search',studio:'Studio'}[S.view]||String(S.view||'Today').replace(/^./,c=>c.toUpperCase());const pg=frag.querySelector('.page')||frag;pg.prepend(el('h1',{class:'sr-only'},nm));}
    const C0=S.cal||{},scope=`${S.view}|${S.sel}|${C0.mode}|${C0.anchor}|${JSON.stringify(P)}`;
    const opened=S.lastView!==S.view||!!S.entering;
    const listBefore=S.lastView===S.view&&S._scope===scope&&!S.entering?listSnap(root):null;S._scope=scope;
    closeFabMenu(true);
    const skelG=root.querySelector('.skel')?$$('#view .page>*').filter(n=>n.querySelector('.skel')||n.classList.contains('skel')).map(ghostOf).filter(Boolean):[];
    const noDepth=S._noDepth;S._noDepth=false;const depthDir=!S._searchFrom&&!noDepth&&S.entering&&(S.dir==='push'||S.dir==='pop')&&S._painted?S.dir:null,depthGhost=depthDir&&motionOK()?ghostOf(root.firstElementChild):null;
    root.replaceChildren(frag);
    animateFills(root,S);
    listPlay(root,listBefore);
    rollCounts(root,`${S.view}|${S.sel}`);
    swipeArrive();settleBlock();todayHeaderScroll();meterPops(root,`${S.view}|${S.sel}`);studioPop();if(opened){countUp(root);chartsIn(root);}milestones(root);skeletonMelt(skelG,root);chipChecks(root);segFill(root);studioCascade();arcPlay();weekBandGlide();commitSweep();streakRoll(root);emptyDraw(root);dotRun(root);ideaMorph(root);stepIn(root);panelIn(root);searchGrow(root);wkRefocus(root);
    if(depthGhost){depthSlide(depthGhost,root.firstElementChild,depthDir);S.dir=null;S.entering=false;}
    if(S.entering){const pg=root.firstElementChild;if(pg&&S._painted&&(S.view!=='today'||S.dir==='pop'||S.dir==='swiped'))pg.classList.add(S.dir==='push'?'viewin-push':S.dir==='pop'?'viewin-pop':S.dir==='swiped'?'viewin-swiped':'viewin');S.dir=null;S.entering=false;}
    S.lastView=S.view;
    const d2=$('#st-dock');if(d2)d2.scrollLeft=dockL;
    this.navbar();
  },
  navbar(){
    const S=this.state,s=get.settings(),nav=$('#nav-in');nav.innerHTML='';
    const fav=(s.nav&&s.nav.length===3?s.nav:DEFAULT_SETTINGS.nav);
    const group={inbox:'inbox',tasks:'tasks',habits:'habits',habit:'habits',goals:'goals',projects:'projects',plan:null,routines:'routines',routine:'routines',player:'routines',lists:'lists',list:'lists',reviews:'reviews',review:'reviews',insights:'insights'};
    const cur=S.view;
    const isAct=id=>id===cur||group[cur]===id||id===origin;
    let origin=null;
    if(!fav.some(id=>id===cur||group[cur]===id)&&!TOPS.includes(cur)){const st=S.stack||[];for(let i=st.length-1;i>=0;i--){const v=st[i].view;if(TOPS.includes(v)){if(fav.includes(v))origin=v;break;}}}
    const anyFav=fav.some(isAct)||!!origin;
    const tab=(id,label,icon)=>el('button',{class:'tab'+((id==='more'?!anyFav:isAct(id))?' act':''),'aria-current':(id==='more'?!anyFav:isAct(id))?'page':null,onclick:()=>{if(id===cur){tabTop();return;}else{S.stack=[];const ic0=$('.nav .tab.act .ic'),r0=ic0&&ic0.getBoundingClientRect();App.go(id);tabGlide(r0);}}},el('span',{class:'ic',html:icon}),label);
    const iconOf=id=>id==='more'?sv('<circle cx="5" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.8" fill="currentColor" stroke="none"/>',22):ic(PLACES[id].i,22);
    const short=id=>({'tools':'Tools'})[id]||PLACES[id].n;
    nav.append(el('div',{class:'rail-brand'},'Life OS'),tab(fav[0],short(fav[0]),iconOf(fav[0])),tab(fav[1],short(fav[1]),iconOf(fav[1])),el('button',{class:'fab',id:'fab','aria-label':'Add','aria-haspopup':'menu','aria-expanded':'false',html:sv(P.plus,26,2.2),onclick:()=>fabMenu()}),tab(fav[2],short(fav[2]),iconOf(fav[2])),tab('more','More',iconOf('more')));
  },
};
/* minute tick and day rollover */
let lastDay=todayK();
function clockTick(){tickNow();const tk=todayK();if(tk!==lastDay){if(App.state.sel===lastDay)App.state.sel=tk;lastDay=tk;try{tripReturn();}catch(e){}App.state._fresh=true;App.refresh();}else if(App.state.view==='today'&&!sheetStack.length&&!$('.menu')&&!App.dragging&&!(document.activeElement&&document.activeElement.matches&&document.activeElement.matches('input,textarea'))){App.refresh();}checkReminders();}
(function clock(){setTimeout(()=>{clockTick();clock();},60000-Date.now()%60000+50);})();
document.addEventListener('visibilitychange',()=>{if(!document.hidden){clockTick();Gcal.refreshIfStale();}});
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

/* swipe in from the left edge to go back, like an iPhone app (pages with a back button only) */
(()=>{const EDGE=26;let t=null;const V=()=>$('#view');
  const canBack=()=>!sheetStack.length&&!$('.menu')&&!$('.confirm.on')&&!TOPS.includes(App.state.view)&&!!document.querySelector('#view .pghead .back');
  const reset=(v,anim)=>{v.style.transition=anim?'transform .28s cubic-bezier(.2,.8,.2,1),opacity .28s':'';v.style.transform='';v.style.opacity='';if(anim)setTimeout(()=>{v.style.transition='';},300);};
  addEventListener('touchstart',e=>{if(e.touches.length!==1)return;const x=e.touches[0].clientX;if(x>EDGE||!canBack()){t=null;return;}t={x0:x,y0:e.touches[0].clientY,t0:Date.now(),on:false,dx:0};},{passive:true});
  addEventListener('touchmove',e=>{if(!t)return;const p=e.touches[0],dx=p.clientX-t.x0,dy=p.clientY-t.y0;
    if(!t.on){if(Math.abs(dy)>10&&Math.abs(dy)>Math.abs(dx)){t=null;return;}if(dx<8)return;t.on=true;}
    e.preventDefault();t.dx=Math.max(0,dx);const v=V(),w=innerWidth;v.style.transition='';v.style.transform=`translateX(${t.dx}px)`;v.style.opacity=String(1-Math.min(.35,t.dx/w*.5));},{passive:false});
  const end=()=>{if(!t)return;const s=t;t=null;if(!s.on)return;const v=V(),w=innerWidth,vel=s.dx/Math.max(1,Date.now()-s.t0);
    if(s.dx>w*.33||(vel>.45&&s.dx>40)){v.style.transition='transform .2s cubic-bezier(.2,.8,.2,1),opacity .2s';v.style.transform=`translateX(${w}px)`;v.style.opacity='0';
      buzz(8);setTimeout(()=>{const b=document.querySelector('#view .pghead .back');App.state._swiped=true;reset(v,false);if(b)b.click();else App.back();},190);}
    else reset(v,true);};
  addEventListener('touchend',end,{passive:true});addEventListener('touchcancel',end,{passive:true});})();
