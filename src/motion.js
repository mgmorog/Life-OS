/* ---------- motion: small, calm movements that make changes easy to follow ----------
   Everything here runs on plain transforms and opacity (Web Animations), so it behaves the
   same on every iPhone. All of it switches off with Reduce motion. */
const EASE='cubic-bezier(.2,.8,.2,1)',SOFT='cubic-bezier(.3,1.15,.5,1)',SPRING='cubic-bezier(.3,1.35,.5,1)';

/* A copy of an element pinned where it is on screen, so the real one can be replaced underneath it */
function ghostOf(n){
  if(!n||!n.isConnected)return null;const r=n.getBoundingClientRect();if(!r.width||!r.height)return null;
  const g=n.cloneNode(true);g.removeAttribute('id');$$('[id]',g).forEach(x=>x.removeAttribute('id'));
  const cs=getComputedStyle(n);
  Object.assign(g.style,{position:'fixed',left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',margin:'0',zIndex:'9',pointerEvents:'none',boxSizing:'border-box',font:cs.font,color:cs.color});
  g.setAttribute('aria-hidden','true');g.classList.add('mo-ghost');document.body.append(g);return g;
}

/* Swap parts of the page with a glide: the old copy leaves toward where you came from, the new one
   arrives from where you're going. parts: [[selector,'x'|'y'],...]; dir: 1 forward, -1 back */
function glideSwap(update,parts,dir=1){
  if(!motionOK()){update();return;}
  const ghosts=parts.map(([s,ax])=>[ghostOf($(s)),s,ax]);
  update();
  ghosts.forEach(([g,s,ax])=>{
    const n=$(s),off=ax==='y'?24:28,out=ax==='y'?`translateY(${-dir*off*.8}px)`:`translateX(${-dir*off*.8}px)`,inn=ax==='y'?`translateY(${dir*off}px)`:`translateX(${dir*off}px)`;
    if(g)g.animate([{opacity:1,transform:'none'},{opacity:0,transform:out}],{duration:190,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'}).onfinish=()=>g.remove();
    if(n)n.animate([{opacity:0,transform:inn},{opacity:1,transform:'none'}],{duration:380,delay:50,easing:EASE,fill:'backwards'});
  });
}

/* Slide the white thumb of a segmented control from where it was to the new choice */
function segGlide(r0,seg){
  if(!r0||!seg||!motionOK())return;const th=seg.querySelector('.seg-thumb');if(!th)return;
  const r1=th.getBoundingClientRect();if(!r1.width)return;
  th.animate([{transform:`translateX(${r0.left-r1.left}px) scaleX(${r0.width/r1.width})`,transformOrigin:'left center'},{transform:'none',transformOrigin:'left center'}],{duration:420,easing:SOFT});
}

/* Bottom bar: the green pill slides between tabs and the new icon gives a small bounce */
function tabGlide(r0){
  if(!motionOK())return;const ic=$('.nav .tab.act .ic');if(!ic)return;
  ic.querySelector('svg')&&ic.querySelector('svg').animate([{transform:'scale(.82)'},{transform:'scale(1.14)',offset:.55},{transform:'none'}],{duration:450,easing:SPRING});
  if(!r0)return;const r1=ic.getBoundingClientRect();if(Math.abs(r0.left-r1.left)<2)return;
  const pill=el('span',{class:'tab-pill'});Object.assign(pill.style,{left:r0.left+'px',top:r1.top+'px',width:r1.width+'px',height:r1.height+'px'});document.body.append(pill);
  ic.classList.add('pill-wait');
  const a=pill.animate([{transform:'none'},{transform:`translateX(${r1.left-r0.left}px)`}],{duration:440,easing:SOFT,fill:'forwards'});
  a.onfinish=()=>{ic.classList.remove('pill-wait');pill.remove();};
}

/* Soft press: whatever you press sinks a little and springs back */
const PRESS='.btn,.chip,.li,.focus-chip,.tl,.tmr,.heat:not(.out),.dtile,.t3slot,.t3add,.iconbtn,.adchip,.mitem,.linkbtn,.saveas .tl';
document.addEventListener('pointerdown',e=>{
  if(!motionOK()||e.button>0)return;const n=e.target.closest&&e.target.closest(PRESS);if(!n||n.disabled||n.closest('.grid,.weekstrip,.dock,.blk'))return;
  const x0=e.clientX,y0=e.clientY;n.classList.add('pressing');
  const off=()=>{n.classList.remove('pressing');removeEventListener('pointerup',off,true);removeEventListener('pointercancel',off,true);removeEventListener('pointermove',mv,true);};
  const mv=ev=>{if(Math.abs(ev.clientX-x0)>10||Math.abs(ev.clientY-y0)>10)off();};
  addEventListener('pointerup',off,true);addEventListener('pointercancel',off,true);addEventListener('pointermove',mv,true);
},{passive:true});

/* Lists: rows that are new grow in, rows that left fold away, the rest glide to their new places.
   Keyed by data-id (task rows), data-slot (week rows) or data-k. */
const KEYED='.trow[data-id],.wkrow[data-slot],[data-k]';
const keyOf=n=>n.dataset.k||n.dataset.slot||n.dataset.id;
function listSnap(root){const m=new Map();root.querySelectorAll(KEYED).forEach(n=>{const r=n.getBoundingClientRect();if(r.height)m.set(keyOf(n),{r,n,open:n.classList.contains('open')});});return m;}
function listPlay(root,before){
  if(!before||!motionOK())return;const now=new Map();root.querySelectorAll(KEYED).forEach(n=>now.set(keyOf(n),n));
  const added=[...now.keys()].filter(k=>!before.has(k)),gone=[...before.keys()].filter(k=>!now.has(k));
  if(added.length>4||gone.length>4)return;/* a whole new list, not an edit */
  now.forEach((n,key)=>{
    const b=before.get(key),r=n.getBoundingClientRect();
    if(!b){const h=r.height;if(Date.now()-(App.state._restored||0)<1500)n.animate([{backgroundColor:'#E2EBE6'},{backgroundColor:getComputedStyle(n).backgroundColor||'transparent'}],{duration:1100,delay:300,easing:'ease-out'});n.style.overflow='hidden';n.animate([{height:'0px',opacity:0,transform:'translateY(-6px)'},{height:h+'px',opacity:1,transform:'none'}],{duration:360,easing:EASE}).onfinish=()=>{n.style.overflow='';};return;}
    const dy=b.r.top-r.top,dh=b.r.height-r.height;
    if(Math.abs(dh)>3){/* a row that opened or closed: ease its height, fade the details in */
      n.style.overflow='hidden';n.animate([{height:b.r.height+'px'},{height:r.height+'px'}],{duration:400,easing:EASE}).onfinish=()=>{n.style.overflow='';};
      const ch=n.querySelector('.chev');if(ch&&b.open!==n.classList.contains('open'))ch.animate([{transform:`rotate(${b.open?90:0}deg)`},{transform:`rotate(${b.open?0:90}deg)`}],{duration:380,easing:SOFT});
      if(!b.open&&n.classList.contains('open')){const it=n.querySelector('.wkitems');it&&it.animate([{opacity:0,transform:'translateY(-4px)'},{opacity:1,transform:'none'}],{duration:300,delay:80,easing:EASE,fill:'backwards'});}
    }
    if(Math.abs(dy)>1)n.animate([{transform:`translateY(${dy}px)`},{transform:'none'}],{duration:360,easing:EASE});
  });
  gone.forEach(k=>{const b=before.get(k);const g=document.createElement('div');g.className='mo-ghost';g.append(b.n);Object.assign(g.style,{position:'fixed',left:b.r.left+'px',top:b.r.top+'px',width:b.r.width+'px',height:b.r.height+'px',overflow:'hidden',pointerEvents:'none',zIndex:'9'});document.body.append(g);
    g.animate([{opacity:1,transform:'none',height:b.r.height+'px'},{opacity:0,transform:'translateX(28px)',height:'0px'}],{duration:320,easing:EASE,fill:'forwards'}).onfinish=()=>g.remove();});
}

/* Counts like "1 of 3" roll like an odometer when the first number changes (data-roll spans hold only text) */
const ROLLS=new Map();
function rollCounts(root,scope){
  root.querySelectorAll('[data-roll]').forEach(n=>{
    const key=scope+':'+n.dataset.roll,txt=n.textContent,m=txt.match(/\d+/),prev=ROLLS.get(key);ROLLS.set(key,txt);
    if(!m||!prev||!motionOK())return;const pm=prev.match(/\d+/);if(!pm||pm[0]===m[0]||prev.replace(/\d+/,'#')!==txt.replace(/\d+/,'#'))return;
    const up=+m[0]>+pm[0],i=m.index,after=txt.slice(i+m[0].length);
    const col=el('span',{class:'roll-col'},el('span',{},up?pm[0]:m[0]),el('span',{},up?m[0]:pm[0]));
    n.replaceChildren(txt.slice(0,i),el('span',{class:'roll-win'},col),after);
    col.animate([{transform:`translateY(${up?0:-50}%)`},{transform:`translateY(${up?-50:0}%)`}],{duration:520,easing:SOFT,fill:'forwards'}).onfinish=()=>{if(n.isConnected)n.textContent=txt;};
  });
}

/* The + opens a small menu: the + turns into an ×, the page dims, the options float up one by one */
function fabMenu(){
  const fab=$('#fab');if(!fab)return;if($('.fab-menu')){closeFabMenu();return;}
  const dk=App.state.view==='today'&&App.state.sel?App.state.sel:todayK();
  const go=fn=>()=>{closeFabMenu(true);setTimeout(fn,motionOK()?120:0);};
  const items=[['Quick capture','inbox',()=>captureSheet(null)],['All-day','sun',()=>alldaySheet(null,{start:dk})],['Time block','time',()=>blockSheet(null,{date:dk,start:dk===todayK()?nextQuarter():9*60})],['Task','task',()=>taskSheet(null,{date:dk})]];
  const r=fab.getBoundingClientRect();
  const scrim=el('div',{class:'fab-scrim',onclick:()=>closeFabMenu()});
  const menu=el('div',{class:'fab-menu',role:'menu'},items.map(([l,i,fn])=>el('button',{class:'mitem',role:'menuitem',onclick:go(fn)},el('span',{class:'d',html:ic(i,16,2)}),l)));
  const wide=innerWidth>=900;
  Object.assign(menu.style,wide?{left:(r.right+12)+'px',top:r.top+'px'}:{left:(r.left+r.width/2)+'px',bottom:(innerHeight-r.top+14)+'px'});
  if(wide)menu.classList.add('side');
  document.body.append(scrim,menu);fab.classList.add('open');fab.setAttribute('aria-expanded','true');
  requestAnimationFrame(()=>{scrim.classList.add('on');[...menu.children].reverse().forEach((b,j)=>{b.style.transitionDelay=(j*45)+'ms';});menu.classList.add('on');});
  const esc=e=>{if(e.key==='Escape')closeFabMenu();};addEventListener('keydown',esc);menu._esc=esc;
  setTimeout(()=>{const f=menu.querySelector('.mitem:last-child');f&&f.focus({preventScroll:true});},60);
}
function closeFabMenu(fast){
  const m=$('.fab-menu'),s=$('.fab-scrim'),fab=$('#fab');if(fab){fab.classList.remove('open');fab.setAttribute('aria-expanded','false');}
  if(m){removeEventListener('keydown',m._esc);[...m.children].forEach(b=>b.style.transitionDelay='0ms');m.classList.remove('on');setTimeout(()=>m.remove(),fast?120:260);}
  if(s){s.classList.remove('on');setTimeout(()=>s.remove(),260);}
}

/* Calendar: the page follows your finger sideways, then settles on the next period or springs back */
function dragSwipe(node,next,prev){
  let x0,y0,dx=0,lock=null,on=false;
  node.addEventListener('touchstart',e=>{if(e.touches.length!==1||App.dragging||sheetStack.length||e.target.closest('.weekstrip,.dock,input,textarea,.wkrow.open')){on=false;return;}x0=e.touches[0].clientX;y0=e.touches[0].clientY;dx=0;lock=null;on=true;},{passive:true});
  node.addEventListener('touchmove',e=>{if(!on)return;const t=e.touches[0],ddx=t.clientX-x0,ddy=t.clientY-y0;
    if(lock==null){if(Math.abs(ddx)>10&&Math.abs(ddx)>Math.abs(ddy)*1.3)lock='x';else if(Math.abs(ddy)>10)lock='y';}
    if(lock!=='x'||App.dragging)return;dx=ddx;if(!motionOK())return;node.style.transition='none';node.style.transform=`translate3d(${dx*.92}px,0,0)`;node.style.opacity=String(1-Math.min(.35,Math.abs(dx)/innerWidth*.6));},{passive:true});
  const end=()=>{if(!on)return;on=false;if(lock!=='x'){return;}const w=node.offsetWidth||innerWidth;
    if(App.dragging||Date.now()-(App._dragEnd||0)<400){node.style.transform='';node.style.opacity='';return;}
    if(Math.abs(dx)>Math.min(90,w*.22)){const dir=dx<0?1:-1;markGs&&markGs('swipe');
      if(!motionOK()){dir>0?next():prev();return;}
      const a=node.animate([{transform:`translate3d(${dx*.92}px,0,0)`,opacity:node.style.opacity||1},{transform:`translate3d(${-dir*w*.55}px,0,0)`,opacity:0}],{duration:170,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'});
      a.onfinish=()=>{App.state._swipeIn=dir;dir>0?next():prev();};
    }else{node.style.transition='transform .45s '+SOFT+',opacity .3s';node.style.transform='';node.style.opacity='';setTimeout(()=>{node.style.transition='';},460);}
  };
  node.addEventListener('touchend',end,{passive:true});node.addEventListener('touchcancel',end,{passive:true});
}
/* after a swipe re-renders the calendar, bring the new period in from the side you swiped toward */
function swipeArrive(){const dir=App.state._swipeIn;if(!dir)return;App.state._swipeIn=0;const b=$('#cal-body');if(!b)return;b.classList.remove('slide-l','slide-r');
  b.animate([{transform:`translate3d(${dir*innerWidth*.45}px,0,0)`,opacity:0},{transform:'none',opacity:1}],{duration:440,easing:SOFT});}

/* Toast: springs up with a thin timer line; flick it down to dismiss */
(function toastSwipe(){const t=()=>$('#toast');let y0=null,dy=0;
  document.addEventListener('pointerdown',e=>{const n=t();if(!n||!n.contains(e.target)||e.target.closest('button'))return;y0=e.clientY;dy=0;n.classList.add('drag');clearTimeout(toastT);});
  addEventListener('pointermove',e=>{if(y0==null)return;const n=t();dy=e.clientY-y0;n.style.transform=`translate(-50%,${dy>0?dy:dy*.2}px)`;n.style.opacity=String(1-Math.max(0,dy)/120);});
  const up=()=>{if(y0==null)return;y0=null;const n=t();n.classList.remove('drag');n.style.opacity='';n.style.transform='';if(dy>36)n.classList.remove('on');else toastT=setTimeout(()=>n.classList.remove('on'),1800);};
  addEventListener('pointerup',up);addEventListener('pointercancel',up);})();

/* Today: the big date shrinks and fades as you scroll, while the small bar firms up under the status bar */
function todayHeaderScroll(){
  const m=$('#mini');if(!m)return;
  if(App.state.view!=='today'||sheetStack.length){m.style.cssText='';return;}
  const d=$('#view .hd .date'),eb=$('#view .hd-eyebrow'),p=Math.max(0,Math.min(1,scrollY/110));
  if(d){d.style.transformOrigin='left center';d.style.transform=motionOK()?`scale(${1-.28*p})`:'';d.style.opacity=String(1-Math.max(0,(p-.55)/.45));}
  if(eb)eb.style.opacity=String(1-Math.min(1,p*1.8));
  Object.assign(m.style,{visibility:p>.02?'visible':'hidden',color:`rgba(30,38,34,${Math.max(0,(p-.6)/.4)})`,backgroundColor:`rgba(244,244,239,${p})`,borderBottomColor:`rgba(229,231,225,${p})`,pointerEvents:p>.9?'auto':'none',boxShadow:p>=1?'0 6px 14px -10px rgba(20,30,25,.22)':'none',transition:'none'});
}
addEventListener('scroll',todayHeaderScroll,{passive:true});

/* Today: moving to another day slides the cards in from that side and rolls the date */
function daySwap(update,dir){
  if(!motionOK()){update();return;}
  const vis=n=>{const r=n.getBoundingClientRect();return r.bottom>0&&r.top<innerHeight&&r.height>0;};
  const body=()=>$$('#view>.page>*').filter(n=>n.tagName!=='HEADER'&&vis(n));
  const gs=body().slice(0,6).map(ghostOf),gt=ghostOf($('#view .hd .date span')),ge=ghostOf($('#view .hd-eyebrow .eyebrow'));
  update();
  gs.forEach(g=>g&&g.animate([{opacity:1,transform:'none'},{opacity:0,transform:`translateX(${-dir*36}px)`}],{duration:200,easing:'cubic-bezier(.4,0,1,1)',fill:'forwards'}).finished.then(()=>g.remove()));
  body().slice(0,6).forEach((n,i)=>n.animate([{opacity:0,transform:`translateX(${dir*54}px)`},{opacity:1,transform:'none'}],{duration:420,delay:40+i*30,easing:EASE,fill:'backwards'}));
  [[gt,'#view .hd .date span'],[ge,'#view .hd-eyebrow .eyebrow']].forEach(([g,sel])=>{if(g)g.animate([{opacity:1,transform:'none'},{opacity:0,transform:`translateY(${-dir*22}px)`}],{duration:220,easing:EASE,fill:'forwards'}).finished.then(()=>g.remove());const n=$(sel);n&&n.animate([{opacity:0,transform:`translateY(${dir*26}px)`},{opacity:1,transform:'none'}],{duration:420,easing:SOFT,fill:'backwards'});});
}

/* Time grid: tapping an hour opens a placeholder block there first, then the sheet rises */
function hourPlaceholder(cv,start,dur,open){
  if(!motionOK()||!cv){open();return;}
  $$('.ph-blk',cv).forEach(n=>n.remove());
  const p=el('div',{class:'ph-blk','aria-hidden':'true'},fmtRange(start,start+dur));p.style.top=start/60*HH+12+'px';p.style.height=Math.max(dur/60*HH-2,26)+'px';cv.append(p);
  p.animate([{transform:'scaleY(.2)',opacity:0},{transform:'none',opacity:1}],{duration:420,easing:SPRING});
  setTimeout(open,190);
}

/* Drag on the time grid: the preview takes the block's look (lifted, tilted) and snaps between quarter hours */
let dropCarry=null;
function carryPreview(p,t){
  if(!dropCarry){p.classList.remove('carry');return;}
  if(!p.classList.contains('carry')){p.classList.add('carry');p.style.setProperty('--c',dropCarry.color||'var(--accent)');}
  if(p._t!==t){p._t=t;if(motionOK()&&p.animate)p.animate([{transform:'rotate(-1.2deg) scale(1.05)'},{transform:'rotate(-1.2deg) scale(1.03)'}],{duration:160,easing:EASE});}
}
function settleBlock(){const id=App.state._settle;if(!id)return;App.state._settle=null;const b=$(`.blk[data-bid="${id}"]`);if(b&&motionOK())b.animate([{transform:'scale(1.03)'},{transform:'scale(.985)',offset:.5},{transform:'none'}],{duration:460,easing:SPRING});}

/* ---------- round 3 ---------- */
/* A saved capture lifts off and lands in the Inbox icon; the badge bumps */
function flyToInbox(text){
  if(!motionOK())return;const from=$('.sheet.on .field input, .sheet.on textarea, .sheet.on .field');const tgt=$('#view .iconbtn[aria-label^="Inbox"]');
  if(!from||!tgt)return;const a=from.getBoundingClientRect(),b=tgt.getBoundingClientRect();if(b.bottom<0||b.top>innerHeight)return;
  const fl=el('div',{class:'flyer'},String(text||'Idea').slice(0,24)+(String(text||'').length>24?'…':''));Object.assign(fl.style,{left:a.left+12+'px',top:a.top+4+'px'});document.body.append(fl);
  const dx=b.left+b.width/2-(a.left+12)-24,dy=b.top+b.height/2-(a.top+4)-16;
  fl.animate([{transform:'none',opacity:1},{transform:`translate(${dx*.45}px,${dy*.55-50}px) scale(.8)`,opacity:1,offset:.5},{transform:`translate(${dx}px,${dy}px) scale(.15)`,opacity:.2}],{duration:640,delay:120,easing:'cubic-bezier(.5,0,.3,1)',fill:'both'}).onfinish=()=>{fl.remove();const t=$('#view .iconbtn[aria-label^="Inbox"]');if(!t)return;const bd=t.querySelector('.badge');(bd||t).animate([{transform:'scale(1)'},{transform:'scale(1.45)',offset:.4},{transform:'scale(1)'}],{duration:500,easing:SPRING});t.animate([{transform:'none'},{transform:'translateY(2px)'},{transform:'none'}],{duration:260});};
}

/* Habit dots: a newly filled dot pops */
const METERS=new Map();
function meterPops(root,scope){
  root.querySelectorAll('.meter[data-k]').forEach(m=>{const key=scope+':'+m.dataset.k,n=m.querySelectorAll('i.on').length,prev=METERS.get(key);METERS.set(key,n);
    if(prev==null||n<=prev||!motionOK())return;[...m.querySelectorAll('i.on')].slice(prev).forEach((d,i)=>d.animate([{transform:'scale(.5)'},{transform:'scale(1.55)',offset:.55},{transform:'none'}],{duration:500,delay:i*60,easing:SPRING}));});
}

/* Steppers slide their numbers; swatches spring their ring open */
document.addEventListener('click',e=>{
  if(!motionOK())return;const btn=e.target.closest&&e.target.closest('.stepper button,.stp button');
  if(btn){const st=btn.closest('.stepper,.stp'),all=$$('.stepper,.stp'),idx=all.indexOf(st),vEl=st.querySelector('b,.sv');if(!vEl)return;const old=vEl.textContent,dir=btn===st.querySelector('button')?-1:1,g=ghostOf(vEl);
    setTimeout(()=>{const ns=$$('.stepper,.stp')[idx],nv=ns&&ns.querySelector('b,.sv');if(!nv||nv.textContent===old){g&&g.remove();if(nv&&nv.textContent===old)nv.animate([{transform:'none'},{transform:'translateX(3px)'},{transform:'translateX(-3px)'},{transform:'none'}],{duration:240});return;}
      if(g)g.animate([{opacity:1,transform:'none'},{opacity:0,transform:`translateY(${-dir*14}px)`}],{duration:220,easing:EASE,fill:'forwards'}).onfinish=()=>g.remove();
      nv.style.display='inline-block';nv.animate([{opacity:0,transform:`translateY(${dir*14}px)`},{opacity:1,transform:'none'}],{duration:340,easing:SOFT});},0);return;}
  const sw=e.target.closest&&e.target.closest('.swatch');
  if(sw)setTimeout(()=>{const on=$$('.swatch.on').find(n=>n.getBoundingClientRect().width);if(on)on.animate([{boxShadow:'0 0 0 0 #fff,0 0 0 0 var(--c)',transform:'scale(.88)'},{boxShadow:'0 0 0 2px #fff,0 0 0 4px var(--c)',transform:'none'}],{duration:380,easing:SPRING});},0);
},true);

/* Studio: the day you drop on gives a little bounce and the new item pops in */
function studioPop(){const P=App.state._studioPop;if(!P)return;App.state._studioPop=null;if(!motionOK())return;const s=$(`[data-slot="${P.id}"]`);if(!s)return;
  s.animate([{transform:'scale(1.035)'},{transform:'scale(.99)',offset:.5},{transform:'none'}],{duration:460,easing:SPRING});
  if(P.title){const it=[...s.querySelectorAll('*')].filter(n=>n.children.length===0&&n.textContent.trim()===P.title).pop();const row=it&&(it.closest('button,.li,.sitem,div')||it);row&&row.animate([{transform:'scale(.6)',opacity:0},{transform:'scale(1.08)',opacity:1,offset:.6},{transform:'none',opacity:1}],{duration:480,easing:SPRING});}}

/* ---------- round 4 ---------- */
/* A sheet taking over from another grows or shrinks from the old one's height; title and fields settle in */
function morphSheetIn(sheet,h0){
  if(!motionOK())return;const h1=sheet.getBoundingClientRect().height;sheet.style.overflow='hidden';
  sheet.animate([{height:h0+'px'},{height:h1+'px'}],{duration:440,easing:EASE}).onfinish=()=>{sheet.style.overflow='';};
  const t=sheet.querySelector('.shead h2');t&&t.animate([{opacity:0,transform:'translateY(18px)'},{opacity:1,transform:'none'}],{duration:420,easing:SOFT});
  [...(sheet.querySelector('.sbody')||sheet).children].slice(0,8).forEach((c,i)=>c.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:360,delay:60+i*40,easing:EASE,fill:'backwards'}));
}
/* Lists that just changed under a search box: rows settle in one after another */
function settleIn(box){if(!motionOK()||!box)return;$$('.li,.lbl',box).slice(0,12).forEach((n,i)=>n.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:300,delay:i*35,easing:EASE,fill:'backwards'}));}
/* Tomorrow card: the day grows out of the card you tapped */
function zoomFrom(r,update){
  if(!motionOK()||!r){update();return;}
  /* a card-shaped panel grows from the card to the screen, then melts away over the new day */
  const box=el('div',{class:'zoom-box','aria-hidden':'true'});Object.assign(box.style,{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px'});document.body.append(box);
  const W=innerWidth,H=innerHeight;
  box.animate([{left:r.left+'px',top:r.top+'px',width:r.width+'px',height:r.height+'px',borderRadius:'22px'},{left:'0px',top:'0px',width:W+'px',height:H+'px',borderRadius:'0px'}],{duration:380,easing:SOFT,fill:'forwards'}).onfinish=()=>{
    update();const pg=$('#view>.page');pg&&[...pg.children].slice(0,6).forEach((c,i)=>c.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:340,delay:i*40,easing:EASE,fill:'backwards'}));
    box.animate([{opacity:1},{opacity:0}],{duration:260,easing:EASE,fill:'forwards'}).onfinish=()=>box.remove();};
}
/* "What should I do now?": spin through what's on your plate, land on the pick, then let the rest settle */
function nowReveal(){
  const card=$('.nowcard');if(!card||!motionOK())return;const first=card.querySelector('.list .li .tt');if(!first)return;
  const pool=(typeof nowPool==='function'?nowPool():[]).map(t=>t.title).filter(t=>t&&t!==first.textContent);const real=first.textContent;if(!pool.length)return;
  const seq=[];for(let i=0;i<8;i++)seq.push(pool[i%pool.length]);seq.push(real);
  const h=first.getBoundingClientRect().height||22,win=el('span',{class:'spin-win',style:`height:${h}px`}),col=el('span',{class:'spin-col'},seq.map(s=>el('span',{style:`height:${h}px;line-height:${h}px`},s)));win.append(col);
  first.replaceChildren(win);
  col.animate([{transform:'translateY(0)'},{transform:`translateY(${-(seq.length-1)*h}px)`}],{duration:1000,easing:'cubic-bezier(.15,.75,.25,1.03)',fill:'forwards'}).onfinish=()=>{first.textContent=real;};
  const rows=$$('.list .li',card);rows.forEach((r,i)=>{if(i===0){const m=r.querySelector('small');m&&m.animate([{opacity:0},{opacity:1}],{duration:300,delay:950,fill:'backwards'});return;}r.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:340,delay:1000+i*70,easing:EASE,fill:'backwards'});});
}

/* ---------- round 5 ---------- */
/* Time grid: ease down to the current hour on open; the now line draws in */
function gridGlide(g,gw,to,isToday){
  if(!motionOK()||!g.animate){g.scrollTop=to;return;}
  const from=Math.max(0,to-3*HH);g.scrollTop=from;const t0=performance.now(),d=650;
  const step=t=>{const k=Math.min(1,(t-t0)/d),e=1-Math.pow(1-k,3);g.scrollTop=from+(to-from)*e;if(k<1)requestAnimationFrame(step);};requestAnimationFrame(step);
  if(isToday){const b=gw.querySelector('.now .bar');b&&b.animate([{transform:'scaleX(0)'},{transform:'none'}],{duration:600,delay:420,easing:EASE,fill:'backwards'});}
}
/* Sheets that open from a row you just tapped unfold from that row */
let lastTap=null;
document.addEventListener('pointerdown',e=>{const n=e.target.closest&&e.target.closest('.trow,.t3row,.li,.blk,.wkrow .it,.dayline,.habit-mini,.stepin');if(!n)return;lastTap={r:n.getBoundingClientRect(),t:Date.now()};},{passive:true,capture:true});
function sheetFromRow(sheet,scrim){
  const L=lastTap;lastTap=null;if(!L||Date.now()-L.t>700||!motionOK()||innerWidth>=900)return false;
  sheet.style.transition='none';scrim.classList.add('on');sheet.classList.add('on');
  const s=sheet.getBoundingClientRect(),dy=L.r.top-s.top,cut=Math.max(0,s.height-L.r.height);
  sheet.animate([{transform:`translateY(${dy}px)`,clipPath:`inset(0 0 ${cut}px 0 round 14px)`},{transform:'none',clipPath:'inset(0 0 0 0 round 24px 24px 0 0)'}],{duration:460,easing:SOFT});
  [...sheet.children].forEach((c,i)=>c.animate([{opacity:0},{opacity:1}],{duration:260,delay:110+i*35,fill:'backwards'}));
  requestAnimationFrame(()=>requestAnimationFrame(()=>{sheet.style.transition='';}));return true;
}
/* Calendar: press and hold a day to peek at it; the card grows out of the square */
function dayPeek(dk,sq){
  closePeek(true);const r=sq.getBoundingClientRect(),di=dayItems(dk),lines=[];
  di.allDay.forEach(e=>lines.push(['All day',e.title,e.color]));di.timed.forEach(e=>lines.push([fmtT(e.time),e.title,e.color]));di.anytime.forEach(e=>lines.push(['Anytime',e.title]));
  const dim=el('div',{class:'peek-dim',onclick:()=>closePeek()});
  const go=fn=>()=>{closePeek(true);fn();};
  const card=el('div',{class:'peek',role:'dialog','aria-label':shortDay(dk)},el('div',{class:'lbl'},shortDay(dk)),
    lines.length?lines.slice(0,5).map(([t,ti,c])=>el('div',{class:'pk-l'},el('time',{},t),c?el('i',{style:`background:${c}`}):null,el('span',{},ti))):el('div',{class:'pk-l muted'},'Nothing planned'),
    lines.length>5?el('div',{class:'small muted',style:'padding-top:4px'},`+${lines.length-5} more`):null,
    el('div',{class:'pk-a'},el('button',{class:'chip',onclick:go(()=>{App.state.sel=dk;App.state._fresh=true;App.go('today');})},'Open in Today'),el('button',{class:'chip',onclick:go(()=>taskSheet(null,{date:dk}))},'+ Task'),el('button',{class:'chip',onclick:go(()=>blockSheet(null,{date:dk,start:9*60}))},'+ Block')));
  document.body.append(dim,card);
  const w=Math.min(310,innerWidth-24),h=card.offsetHeight,left=Math.max(12,Math.min(innerWidth-w-12,r.left+r.width/2-w/2)),above=r.top-h-10>12,top=above?r.top-h-10:Math.min(innerHeight-h-12,r.bottom+10);
  Object.assign(card.style,{left:left+'px',top:top+'px',width:w+'px',transformOrigin:`${r.left+r.width/2-left}px ${above?h:0}px`});
  requestAnimationFrame(()=>{dim.classList.add('on');card.classList.add('on');});
  card._esc=e=>{if(e.key==='Escape')closePeek();};addEventListener('keydown',card._esc);
}
function closePeek(fast){const c=$('.peek'),d=$('.peek-dim');if(c){removeEventListener('keydown',c._esc);c.classList.remove('on');setTimeout(()=>c.remove(),fast?0:220);}if(d){d.classList.remove('on');setTimeout(()=>d.remove(),fast?0:240);}}
/* Focus timer: one soft bloom when the planned time is up */
function focusBloom(rg){if(!motionOK())return;const b=rg.querySelector('.fbloom');if(!b)return;b.animate([{boxShadow:'0 0 0 0 rgba(70,107,90,.45)'},{boxShadow:'0 0 0 46px rgba(70,107,90,0)'}],{duration:1100,easing:EASE});const big=$('#fr-big');big&&big.animate([{transform:'scale(.85)',opacity:.4},{transform:'scale(1.08)',opacity:1,offset:.6},{transform:'none'}],{duration:560,easing:SPRING});}
/* Quiet sync status: a dot pulses by the date while saves are on their way, then "Up to date" for a moment */
(function syncStatus(){let shownAt=0,t1=null,t2=null,busy=false;
  const node=()=>{const host=$('#view .hd-eyebrow');if(!host)return null;let n=host.querySelector('.syncst');if(!n){n=el('span',{class:'syncst','aria-live':'polite'},el('i'),el('span',{class:'sl'}));const first=host.firstElementChild;first?first.after(n):host.append(n);}return n;};
  addEventListener('lifeos-sync',e=>{const p=e.detail&&e.detail.pending||0;
    if(p>0){clearTimeout(t2);if(!busy){busy=true;clearTimeout(t1);t1=setTimeout(()=>{if(!busy)return;const n=node();if(!n)return;n.className='syncst busy';n.querySelector('.sl').textContent='';shownAt=Date.now();},400);}}
    else{busy=false;clearTimeout(t1);const n=$('.syncst.busy');if(!n)return;n.className='syncst ok';n.querySelector('.sl').textContent='Up to date';t2=setTimeout(()=>{n.className='syncst';n.querySelector('.sl').textContent='';},1600);}
  });})();
