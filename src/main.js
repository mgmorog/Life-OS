/* ---------- App shell + routing ---------- */
const TOPS=['today','studio','calendar','more'];
const App={
  state:{view:'today',sel:todayK(),params:{},loading:true,_fresh:true},
  go(view,params={}){const S=this.state;if(view!==S.view)S.trashSel=null;try{const tt=$('#toast');if(tt&&tt.classList.contains('on')&&Date.now()-toastAt>1200)tt.classList.remove('on');}catch(e){}if(S.view==='today'){const g=$('#grid');if(g)S._gridTop=g.scrollTop;}
    const y=scrollY;S.scrolls=S.scrolls||{};S.scrolls[S.view]=y;
    if(view==='today')S._fresh=S._fresh||S.view!=='today';
    /* v232 · remember the row this page grows out of */
    try{const tp=App._tap;S._zoomFrom=null;if(tp&&Date.now()-tp.t<900&&tp.el.isConnected&&!TOPS.includes(view)&&motionOK()){const r=tp.el.getBoundingClientRect(),tt=tp.el.querySelector('b,.tt,.t3n')||tp.el;const tr=tt.getBoundingClientRect();if(r.height<160&&r.bottom>0&&r.top<innerHeight)S._zoomFrom={r,tr,fs:parseFloat(getComputedStyle(tt).fontSize)||16,label:(tt.textContent||'').trim().slice(0,80)};}App._tap=null;}catch(e){S._zoomFrom=null;}
    try{const pg0=$('#view')&&$('#view').firstElementChild;if(pg0&&!TOPS.includes(view)){(this._snaps=this._snaps||{})[(S.stack||[]).length+1]={node:pg0.cloneNode(true),view:S.view,y};}}catch(e){}
    (S.stack=S.stack||[]).push({view:S.view,params:S.params,y});if(S.stack.length>30)S.stack.shift();
    if(view==='tasks')S.taskTab=params.tab||'all';S.view=view;S.params=params;S.entering=true;S.dir=TOPS.includes(view)?'tab':'push';
    try{if(/^[a-z-]+$/.test(view))history.replaceState(null,'','#'+(view==='settings'?'prefs':view));}catch(e){}
    this.render();window.scrollTo(0,0);
  },
  back(fallback){const S=this.state;
    let zc=null,zl=null;try{const zs=S._zoomStack||[],top=zs[zs.length-1],st=S.stack||[];if(top&&!S._swiped&&motionOK()&&st.length&&st[st.length-1].view===top.view){zs.pop();zl=top.label;const v=$('#view'),pg=v&&v.firstElementChild;if(pg){const R=pg.getBoundingClientRect();zc=el('div',{class:'zoom-out','aria-hidden':'true'});const c=pg.cloneNode(true);c.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));c.style.cssText=`position:absolute;left:${R.left}px;top:${R.top}px;width:${R.width}px`;zc.append(c);document.body.append(zc);}}else if(top&&st.length&&st[st.length-1].view!==top.view)zs.length=0;}catch(e){zc=null;}const p=(S.stack||[]).pop();let y=0;if(p&&p.view!==S.view){S.view=p.view;S.params=p.params;y=p.y||0;}else{const[fv,fid]=String(fallback||'more').split(':');S.view=fv;S.params=fid?{id:fid}:{};}S.entering=true;S.dir=S._swiped?'swiped':'pop';S._swiped=false;if(zc)S._noAnim=true;this.render();window.scrollTo(0,y);if(zc)requestAnimationFrame(()=>rowZoomOut(zc,zl));},
  refresh(){clearTimeout(this._r);this._r=setTimeout(()=>this.render(),0);if(PWA.on)PWA.afterChange();},
  dataReady(){this.state.loading=false;try{mergeModules();}catch(e){console.warn(e);}try{Ical.load();setTimeout(()=>Ical.sync(),1500);}catch(e){}purgeTrash();migrate();{const s0=get.settings();if(!s0.tickHalo&&recs.has('settings'))put(Object.assign({},DEFAULT_SETTINGS,s0,{completed:'fade',celebrate:'flow',tickHalo:true}),{silent:true});}applyPrefs();{const s1=get.settings();if(s1.seenVer==null&&s1.introDone)setSettings({seenVer:APP_VER-1});let hv='';try{hv=location.hash.slice(1);}catch(e){}if(!hv&&this.state.view==='today'&&s1.startPage&&s1.startPage!=='today')this.state.view=s1.startPage;if(!hv&&!s1.introDone&&!OB_TEST()&&![...recs.values()].some(r=>r.kind!=='settings'))this.state.view='welcome';}try{travelMigrate();tripReturn();nwAutoSnap();}catch(e){console.warn(e);}Gcal.start();{const sd=get.settings();/* the demo no longer loads on its own: new accounts start empty (load it from Data & help) */if(false){setSettings({demoAuto:APP_VER});try{loadDemo(true);}catch(e){console.warn(e);}}else if(sd.demoSnap&&sd.demoVer!==6){try{demoRefresh();}catch(e){console.warn(e);}}}this.render();checkReminders();if(PWA.on)PWA.afterChange();},
  render(){
    const S=this.state,root=$('#view');
    if(this.dragging)return;
    $$('.floatstack>[data-page]').forEach(n=>n.remove());
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
    swipeArrive();settleBlock();todayHeaderScroll();meterPops(root,`${S.view}|${S.sel}`);try{focusTopBar();}catch(e){}if(S._qaFocus){const id=S._qaFocus;S._qaFocus=null;setTimeout(()=>{const n=document.getElementById(id);if(n&&document.activeElement!==n)n.focus({preventScroll:true});},30);}studioPop();if(opened){countUp(root);chartsIn(root);}milestones(root);skeletonMelt(skelG,root);chipChecks(root);segFill(root);studioCascade();arcPlay();weekBandGlide();commitSweep();streakRoll(root);emptyDraw(root);dotRun(root);ideaMorph(root);stepIn(root);panelIn(root);searchGrow(root);wkRefocus(root);hcFill(root);msLine(root);blkFlip(blkBefore);dateDropIn(root);heldPlay(root);t3Roll(root);pinDropIn(root);
    if(depthGhost){depthSlide(depthGhost,root.firstElementChild,depthDir);S.dir=null;S.entering=false;}
    if(S.entering){const pg=root.firstElementChild;if(pg&&S._painted&&(S.view!=='today'||S.dir==='pop'||S.dir==='swiped'))if(S._noAnim){S._noAnim=false;}else if(S.dir==='push'&&S._zoomFrom&&pg&&S._painted){rowZoomIn(pg,S._zoomFrom);(S._zoomStack=S._zoomStack||[]).push({view:S.lastView,label:S._zoomFrom.label});S._zoomFrom=null;}else if(!(S.dir==='swiped'&&S._under))pg.classList.add(S.dir==='push'?'viewin-push':S.dir==='pop'?'viewin-pop':S.dir==='swiped'?'viewin-swiped':'viewin');S._under=false;S.dir=null;S.entering=false;}
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
        /* v231 · each tab keeps its own page and scroll; tapping the tab you're in goes back to its top page */
        const S=App.state,curTab=(nav.querySelector('.tab.act')||{dataset:{}}).dataset.tab;S.tabMem=S.tabMem||{};
        if(curTab&&curTab!==id)S.tabMem[curTab]={view:S.view,params:S.params,stack:(S.stack||[]).slice(),y:scrollY,sel:S.sel};
        const mem=curTab===id?null:S.tabMem[id];if(curTab===id)S.tabMem[id]=null;
        App.state.stack=[];tabPick(nav,id);
        /* let the highlight start moving first, then draw the page */
        requestAnimationFrame(()=>setTimeout(()=>{nav._pending=null;
          if(mem&&mem.view!==id&&!TOPS.includes(mem.view)){S.view=mem.view;S.params=mem.params;S.stack=mem.stack;S.entering=true;S.dir='tab';App.render();scrollTo(0,mem.y||0);}
          else{App.go(id);if(mem&&mem.y)scrollTo(0,mem.y);}},0));
      }},el('span',{class:'ic',html:icon}),el('span',{class:'tl-lbl'},label));return b;};
      const iconOf=id=>id==='more'?sv('<circle cx="5" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.8" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.8" fill="currentColor" stroke="none"/>',22):ic(PLACES[id].i,22);
      const short=id=>({'tools':'Tools'})[id]||PLACES[id].n;
      nav.append(el('span',{class:'tab-ind','aria-hidden':'true'},el('i')),el('div',{class:'rail-brand'},'Life OS'),tab(fav[0],short(fav[0]),iconOf(fav[0])),tab(fav[1],short(fav[1]),iconOf(fav[1])),(()=>{let t=0,held=false;const f=el('button',{class:'fab',id:'fab','aria-label':'Quick capture. Press and hold for more',html:sv(P.plus,24,2.2),onclick:e=>{if(held){held=false;e.preventDefault();return;}captureSheet(null);},oncontextmenu:e=>e.preventDefault(),onpointerdown:e=>{held=false;clearTimeout(t);t=setTimeout(()=>{held=true;buzz(8);if(voiceOK()&&get.settings().holdToTalk!==false){captureSheet(null,{listen:true});const up=()=>{removeEventListener('pointerup',up,true);removeEventListener('pointercancel',up,true);setTimeout(voiceStop,350);};addEventListener('pointerup',up,true);addEventListener('pointercancel',up,true);return;}const r=f.getBoundingClientRect();openMenu(r.left+r.width/2,r.top-8,[{label:'Task',icon:'task',onclick:()=>taskSheet(null,{date:todayK()})},{label:'Time block',icon:'hour',onclick:()=>blockSheet(null,{date:todayK(),start:nextFreeSlot(todayK())})},{label:'All-day item',icon:'cal',onclick:()=>alldaySheet(null,{start:App.state.view==='today'&&App.state.sel?App.state.sel:todayK()})},{label:'Habit',icon:'habit',onclick:()=>habitSheet(null)},{label:'Goal',icon:'target',onclick:()=>goalSheet(null)},{label:'Idea for the Inbox',icon:'inbox',onclick:()=>captureSheet(null)}]);},450);},onpointerup:()=>clearTimeout(t),onpointerleave:()=>clearTimeout(t),onpointercancel:()=>clearTimeout(t)});return f;})(),tab(fav[2],short(fav[2]),iconOf(fav[2])),tab('more','More',iconOf('more')));
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
addEventListener('hashchange',()=>{const v=location.hash.slice(1);if(shortcutAction(v))return;if(v&&v!==App.state.view&&/^[a-z]+$/.test(v))App.go(v);});
/* v232 · Shortcuts links: /#capture, /#capture?text=…, /#new-task?text=…, /#new-block, /#new-allday, /#new-habit open straight into that sheet (for iPhone Shortcuts, the Action button and Back Tap) */
const SHORTCUT_LINKS=[['Quick capture','capture'],['Capture with text','capture?text=Call%20Pat'],['New task','new-task'],['New time block','new-block'],['New all-day item','new-allday'],['New habit','new-habit'],['Open Today','today']];
function shortcutAction(h){const m=/^(capture|new-task|new-block|new-allday|new-habit)(?:\?(.*))?$/.exec(h||'');if(!m)return false;
  let text='';try{text=new URLSearchParams(m[2]||'').get('text')||'';}catch(e){}
  try{history.replaceState(null,'','#'+(App.state.view||'today'));}catch(e){}
  const run=()=>{while(sheetStack.length)sheetStack[sheetStack.length-1].close();const dk=todayK();
    if(m[1]==='capture'){if(text)try{localStorage.setItem('lifeos-capture-draft',JSON.stringify({title:text,notes:'',photos:[]}));}catch(e){}captureSheet(null);}
    else if(m[1]==='new-task')taskSheet(null,{title:text,date:dk});
    else if(m[1]==='new-block')blockSheet(null,{date:dk,start:nextFreeSlot(dk),title:text});
    else if(m[1]==='new-allday')alldaySheet(null,{start:dk,title:text});
    else if(m[1]==='new-habit')habitSheet(null,text?{title:text}:{});};
  if(App.state.loading){const t=setInterval(()=>{if(!App.state.loading){clearInterval(t);setTimeout(run,200);}},150);setTimeout(()=>clearInterval(t),15000);}else setTimeout(run,250);
  return true;}
/* boot: paint the shell from the saved copy at once, then let the live data arrive quietly */
const hadCache=loadCache();
App.state.loading=!hadCache;
try{const h=location.hash.slice(1);const simple=['today','studio','calendar','more','inbox','tasks','habits','goals','projects','routines','lists','areas','reviews','insights','discover','tools','archive','prefs'];if(simple.includes(h))App.state.view=h;}catch(e){}
{const h0=location.hash.slice(1);App.render();connect();shortcutAction(h0);}
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
(()=>{const two=()=>innerWidth>=BP.tablet&&!(innerWidth>=BP.desktop&&innerWidth<BP.wide);let wide=two();addEventListener('resize',()=>{const w=two();if(w!==wide){wide=w;if(App.state.view==='today')App.refresh();}});})();
/* v228 · more keyboard shortcuts on a computer (C, N, T and arrows already live above): 1–4 switch tabs, / search, T anywhere goes to Today, ? lists them all */
(()=>{const typing=t=>t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
  const keys=[['C','Quick capture'],['N','New task (Today)'],['T','Jump to today'],['← →','Previous or next day or period'],['1 2 3 4','Today, Studio, Calendar, More'],['/','Search'],['Esc','Close a sheet or menu'],['⌘K','Command bar: search and run anything'],['?','Show these shortcuts']];
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

/* v232 · row-to-page zoom: the tapped row grows into the page, its title flies up to the page title; going back shrinks the page into its row */
addEventListener('pointerdown',e=>{const n=e.target.closest&&e.target.closest('#view :is(.li,.dfact,.ptile,.scard,.tile,.trow)');App._tap=n?{el:n,t:Date.now()}:null;},true);
function rowZoomIn(pg,z){try{const P=pg.getBoundingClientRect(),r=z.r,ease='cubic-bezier(.2,.8,.2,1)';
  const ins=`inset(${Math.max(0,r.top-P.top)}px ${Math.max(0,P.right-r.right)}px ${Math.max(0,P.bottom-r.bottom)}px ${Math.max(0,r.left-P.left)}px round 12px)`;
  pg.animate([{clipPath:ins,opacity:.6},{clipPath:'inset(0 0 0 0 round 0px)',opacity:1}],{duration:MOT.slow,easing:ease});
  const h=pg.querySelector('.pgtitle');if(h){const H=h.getBoundingClientRect(),s=z.fs/(parseFloat(getComputedStyle(h).fontSize)||34);
    h.animate([{transform:`translate(${z.tr.left-H.left}px,${z.tr.top-H.top}px) scale(${s})`,transformOrigin:'left top'},{transform:'none',transformOrigin:'left top'}],{duration:MOT.slow,easing:ease});}
  [...pg.children].filter(n=>!n.contains(h)).forEach((n,i)=>n.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:MOT.base,delay:140+Math.min(i,6)*30,easing:ease,fill:'backwards'}));}catch(e){}}
function rowZoomOut(clone,label){try{const rows=[...document.querySelectorAll('#view :is(.li,.dfact,.ptile,.scard,.tile,.trow)')];const row=rows.find(n=>{const t=(n.querySelector('b,.tt,.t3n')||n).textContent.trim();return t&&label&&t.slice(0,80)===label;});
  if(!row){clone.animate([{opacity:1},{opacity:0}],{duration:MOT.fast}).onfinish=()=>clone.remove();return;}
  const r=row.getBoundingClientRect(),ins=`inset(${Math.max(0,r.top)}px ${Math.max(0,innerWidth-r.right)}px ${Math.max(0,innerHeight-r.bottom)}px ${Math.max(0,r.left)}px round 12px)`;
  clone.animate([{clipPath:'inset(0 0 0 0 round 0px)',opacity:1},{clipPath:ins,opacity:0}],{duration:MOT.base,easing:MOT.ease}).onfinish=()=>clone.remove();
  row.animate([{opacity:.3},{opacity:1}],{duration:MOT.base,delay:120,fill:'backwards'});}catch(e){clone.remove();}}

/* v232 · command bar on a computer: ⌘K (Ctrl K) searches everything and runs actions */
function cmdBar(){if($('.cmdk'))return;const prevFocus=document.activeElement;
  const acts=[['New task','task',()=>taskSheet(null,{date:App.state.sel||todayK()})],['New time block','hour',()=>{const dk=App.state.sel||todayK();blockSheet(null,{date:dk,start:nextFreeSlot(dk)});}],['New all-day item','cal',()=>alldaySheet(null,{start:App.state.sel||todayK()})],['New habit','routine',()=>habitSheet(null)],['New goal','target',()=>goalSheet(null)],['New project','project',()=>projectSheet(null)],['Quick capture','plus',()=>captureSheet(null)]].map(([t,icon,go])=>({t,icon,go,kind:'Action'}));
  const pages=[['Today','today'],['Studio','studio'],['Calendar','calendar'],['More','more'],['Tasks','tasks'],['Inbox','inbox'],['Habits','habits'],['Goals','goals'],['Projects','projects'],['Routines','routines'],['Lists','lists'],['Life areas','areas'],['Reviews','reviews'],['Archive','archive'],['Settings','prefs']].map(([t,v])=>({t:'Go to '+t,icon:'arrow',kind:'Page',go:()=>App.go(v,{})}));
  const areas=(get.settings().areas||AREAS).map(a=>({t:'Go to '+a,icon:'leaf',kind:'Life area',go:()=>App.go('area',{name:a})}));
  const tools=Object.keys(HUBS).flatMap(h=>{try{return toolsOf(h).filter(t=>typeof toolOn!=='function'||toolOn(h,t.id)).map(t=>({t:'Go to '+t.name,sub:h,icon:t.icon||'arrow',kind:'Tool',go:()=>App.go('tool',{hub:h,tool:t.id})}));}catch(e){return[];}});
  const sets=(typeof SET_PAGES!=='undefined'?SET_PAGES:[]).map(([id,t])=>({t:'Settings: '+t,icon:'gear',kind:'Setting',go:()=>App.go('setpage',{id})}));
  let idx=[];try{idx=searchIndex().map(x=>({t:x.t,sub:x.sub,icon:x.icon,kind:(x.type||'').replace(/s$/,''),go:x.go,n:x.n}));}catch(e){}
  const base=[...acts,...pages,...areas,...tools,...sets];
  const scrim=el('div',{class:'cmdk-scrim'}),inp=el('input',{type:'text',placeholder:'Type a command or search',autocomplete:'off','aria-label':'Command','aria-controls':'cmdk-list'}),list=el('div',{class:'cmdk-list',id:'cmdk-list',role:'listbox'}),box=el('div',{class:'cmdk',role:'dialog','aria-label':'Command bar'},el('div',{class:'cmdk-in',html:ic('search',18,2)},inp),list,el('div',{class:'cmdk-foot'},el('span',{},el('kbd',{},'↑'),el('kbd',{},'↓'),' move'),el('span',{},el('kbd',{},'↵'),' run'),el('span',{},el('kbd',{},'esc'),' close')));
  let res=[],sel=0;
  const close=()=>{scrim.remove();box.remove();removeEventListener('keydown',key,true);if(prevFocus&&prevFocus.focus)prevFocus.focus({preventScroll:true});};
  const run=i=>{const r=res[i];if(!r)return;close();setTimeout(()=>r.go&&r.go(),30);};
  const draw=()=>{const q=inp.value.trim();list.innerHTML='';
    if(!q)res=[...acts,...pages.slice(0,4)];else{const goQ=/^(go( to)?|open)\s+/i.test(q);const qq=q.replace(/^(go( to)?|open)\s+/i,'');const pool=[...base,...idx];res=pool.map(x=>{const tt=/^go to /i.test(x.t)?x.t.slice(6):x.t;let s=fuzzyScore(goQ?tt:x.t,goQ?qq:q);if(s<0&&!goQ&&tt!==x.t)s=fuzzyScore(tt,q);if(goQ&&tt===x.t)s=-1;if(s<0&&/^go to |^settings: /i.test(x.t)===false&&x.n){const n2=fuzzyScore(x.n,q);s=n2<0?-1:n2+10;}return s<0?null:[s+(x.kind==='Action'?-.5:0),x];}).filter(Boolean).sort((a,b)=>a[0]-b[0]).slice(0,9).map(x=>x[1]);}
    sel=Math.min(sel,Math.max(0,res.length-1));
    if(!res.length){list.append(el('div',{class:'cmdk-none'},`Nothing for “${q}”. Press ↵ to capture it.`));res=[{t:q,go:()=>{try{localStorage.setItem('lifeos-capture-draft',JSON.stringify({title:q,notes:'',photos:[]}));}catch(e){}captureSheet(null);}}];return;}
    res.forEach((r,i)=>list.append(el('button',{class:'cmdk-row'+(i===sel?' on':''),role:'option','aria-selected':String(i===sel),onmousemove:()=>{if(sel!==i){sel=i;mark();}},onclick:()=>run(i)},el('span',{class:'ci',html:ic(r.icon||'arrow',16,2)}),el('span',{class:'grow clip'},r.t,r.sub?el('small',{},r.sub):null),el('span',{class:'ck'},r.kind||''))));};
  const mark=()=>[...list.children].forEach((n,i)=>{n.classList.toggle('on',i===sel);n.setAttribute('aria-selected',String(i===sel));if(i===sel)n.scrollIntoView({block:'nearest'});});
  const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}else if(e.key==='ArrowDown'){e.preventDefault();e.stopPropagation();sel=Math.min(res.length-1,sel+1);mark();}else if(e.key==='ArrowUp'){e.preventDefault();e.stopPropagation();sel=Math.max(0,sel-1);mark();}else if(e.key==='Enter'){e.preventDefault();e.stopPropagation();run(sel);}};
  inp.addEventListener('input',()=>{sel=0;draw();});scrim.addEventListener('click',close);addEventListener('keydown',key,true);
  document.body.append(scrim,box);draw();inp.focus();}
addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&!e.altKey&&(e.key==='k'||e.key==='K')){e.preventDefault();if($('.cmdk')){$('.cmdk-scrim').click();return;}while(sheetStack.length)sheetStack[sheetStack.length-1].close();cmdBar();}});
