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
const isOpen=n=>n.classList.contains('open')||!!n.querySelector(':scope > [aria-expanded="true"]');
function listSnap(root){const m=new Map();root.querySelectorAll(KEYED).forEach(n=>{const r=n.getBoundingClientRect();if(r.height)m.set(keyOf(n),{r,n,open:isOpen(n)});});return m;}
function listPlay(root,before){
  if(!before||!motionOK())return;const now=new Map();root.querySelectorAll(KEYED).forEach(n=>now.set(keyOf(n),n));
  const added=[...now.keys()].filter(k=>!before.has(k)),gone=[...before.keys()].filter(k=>!now.has(k));
  if(added.length>14||gone.length>14)return;/* a whole new list, not an edit */
  const many=added.length>4;
  now.forEach((n,key)=>{
    const b=before.get(key),r=n.getBoundingClientRect();
    if(!b&&many){n.animate([{opacity:0},{opacity:1}],{duration:260,easing:EASE});return;}
    if(!b){const h=r.height;if(Date.now()-(App.state._restored||0)<1500)n.animate([{backgroundColor:'#E2EBE6'},{backgroundColor:getComputedStyle(n).backgroundColor||'transparent'}],{duration:1100,delay:300,easing:'ease-out'});n.style.overflow='hidden';n.animate([{height:'0px',opacity:0,transform:'translateY(-6px)'},{height:h+'px',opacity:1,transform:'none'}],{duration:360,easing:EASE}).onfinish=()=>{n.style.overflow='';};return;}
    const dy=b.r.top-r.top,dh=b.r.height-r.height;
    if(Math.abs(dh)>3){/* a row that opened or closed: ease its height, fade the details in */
      n.style.overflow='hidden';n.animate([{height:b.r.height+'px'},{height:r.height+'px'}],{duration:400,easing:EASE}).onfinish=()=>{n.style.overflow='';};
      const ch=n.querySelector('.chev');if(ch&&b.open!==isOpen(n))ch.animate([{transform:`rotate(${b.open?90:0}deg)`},{transform:`rotate(${b.open?0:90}deg)`}],{duration:380,easing:SOFT});
      if(!b.open&&isOpen(n)){const it=n.querySelector('.wkitems')||n.querySelector('.list,.anytime')||n.lastElementChild;it&&it.animate([{opacity:0,transform:'translateY(-4px)'},{opacity:1,transform:'none'}],{duration:300,delay:80,easing:EASE,fill:'backwards'});}
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
    const key=(n.dataset.roll==='inbox'?'':scope)+':'+n.dataset.roll,txt=n.textContent,m=txt.match(/\d+/),prev=ROLLS.get(key);ROLLS.set(key,txt);
    if(!m||!prev||!motionOK())return;const pm=prev.match(/\d+/);if(!pm||pm[0]===m[0]||prev.replace(/\d+/,'#')!==txt.replace(/\d+/,'#'))return;
    const up=+m[0]>+pm[0],i=m.index,after=txt.slice(i+m[0].length);
    const col=el('span',{class:'roll-col'},el('span',{},up?pm[0]:m[0]),el('span',{},up?m[0]:pm[0]));
    n.replaceChildren(txt.slice(0,i),el('span',{class:'roll-win'},col),after);
    col.animate([{transform:`translateY(${up?0:-50}%)`},{transform:`translateY(${up?-50:0}%)`}],{duration:520,easing:SOFT,fill:'forwards'}).onfinish=()=>{if(n.isConnected)n.textContent=txt;};
    if(n.classList.contains('badge'))n.animate([{transform:'scale(1)'},{transform:'scale(1.3)',offset:.4},{transform:'none'}],{duration:440,easing:SPRING});
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
    if(prev==null||n<=prev||!motionOK())return;const ons=[...m.querySelectorAll('i.on')];ons.slice(prev).forEach((d,i)=>d.animate([{transform:'scale(.5)'},{transform:'scale(1.55)',offset:.55},{transform:'none'}],{duration:500,delay:i*60,easing:SPRING}));ons.slice(0,prev).reverse().forEach((d,i)=>d.animate([{transform:'none'},{transform:'scale(1.3)',offset:.5},{transform:'none'}],{duration:320,delay:180+i*70,easing:EASE}));});
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

/* ---------- round 6 ---------- */
/* Big numbers count up the first time a page opens */
function countUp(root){
  if(!motionOK())return;
  root.querySelectorAll('.dstat .val,.bign .n,.stat3 b,[data-count]').forEach((n,idx)=>{
    const tn=[...n.childNodes].find(c=>c.nodeType===3&&/\d/.test(c.nodeValue));if(!tn)return;const raw=tn.nodeValue,m=raw.match(/-?[\d,]*\.?\d+/);if(!m)return;
    const target=parseFloat(m[0].replace(/,/g,'')),dec=(m[0].split('.')[1]||'').length,comma=m[0].includes(','),pre=raw.slice(0,m.index),post=raw.slice(m.index+m[0].length);if(!isFinite(target)||target===0)return;
    const fmt=v=>{let s=v.toFixed(dec);if(comma)s=Number(s).toLocaleString(undefined,{minimumFractionDigits:dec,maximumFractionDigits:dec});return pre+s+post;};
    const t0=performance.now()+idx*70,d=850;tn.nodeValue=fmt(0);
    const step=t=>{const k=Math.max(0,Math.min(1,(t-t0)/d)),e=1-Math.pow(1-k,3);tn.nodeValue=k>=1?raw:fmt(target*e);if(k<1&&tn.isConnected)requestAnimationFrame(step);};requestAnimationFrame(step);
  });
}
/* Bars rise one after another when a chart first appears (trend lines already draw in) */
function chartsIn(root){if(!motionOK())return;
  root.querySelectorAll('svg').forEach(sv=>{const bars=[...sv.querySelectorAll('.dbar')];bars.forEach((b,i)=>{b.style.transformBox='fill-box';b.style.transformOrigin='bottom';b.animate([{transform:'scaleY(0)'},{transform:'scaleY(1.05)',offset:.8},{transform:'none'}],{duration:600,delay:i*45,easing:EASE,fill:'backwards'});});});
  root.querySelectorAll('.calgrid button').forEach((b,i)=>b.animate([{transform:'scale(.3)',opacity:0},{transform:'none',opacity:1}],{duration:300,delay:i*14,easing:SOFT,fill:'backwards'}));
  root.querySelectorAll('.hmb i,.hmb .b').forEach((b,i)=>{b.style.transformOrigin='bottom';b.animate([{transform:'scaleY(0)'},{transform:'none'}],{duration:520,delay:i*40,easing:EASE,fill:'backwards'});});
}
/* Streak milestones flip in once per milestone */
function milestones(root){let seen;try{seen=new Set(JSON.parse(localStorage.getItem('lifeos-ms')||'[]'));}catch(e){seen=new Set();}let ch=false;
  root.querySelectorAll('.mstone[data-ms]').forEach(n=>{const k=n.dataset.ms;if(seen.has(k))return;seen.add(k);ch=true;if(motionOK())n.animate([{transform:'perspective(400px) rotateY(90deg) scale(.8)',opacity:0},{transform:'perspective(400px) rotateY(-12deg) scale(1.08)',opacity:1,offset:.65},{transform:'none',opacity:1}],{duration:700,delay:200,easing:EASE,fill:'backwards'});});
  if(ch)try{localStorage.setItem('lifeos-ms',JSON.stringify([...seen].slice(-200)));}catch(e){}}
/* Quarter -> Month: the small month grows into the big one */
function zoomGrid(r0){if(!r0||!motionOK())return;const g=$('#month-grid');if(!g)return;const r1=g.getBoundingClientRect();if(!r1.width)return;
  g.animate([{transformOrigin:'0 0',transform:`translate(${r0.left-r1.left}px,${r0.top-r1.top}px) scale(${r0.width/r1.width},${r0.height/r1.height})`},{transformOrigin:'0 0',transform:'none'}],{duration:520,easing:SOFT});
  const b=$('#cal-body');b&&[...b.children].filter(n=>!n.contains(g)).forEach((n,i)=>n.animate([{opacity:0},{opacity:1}],{duration:320,delay:160+i*40,fill:'backwards'}));}
/* Tidy up: drag the idea right to keep it for later, left to let it go; it tilts and flies off, the next one rises */
function deckSwipe(card,{right,left}){
  let x0=null,y0=0,dx=0,lock=null;const tagR=el('span',{class:'dtag r'},'LATER'),tagL=el('span',{class:'dtag l'},'DELETE');card.append(tagR,tagL);card.style.touchAction='pan-y';
  if(motionOK())card.animate([{transform:'translateY(12px) scale(.96)',opacity:.6},{transform:'none',opacity:1}],{duration:380,easing:SOFT});
  card.addEventListener('pointerdown',e=>{if(e.target.closest('a,button,.photo'))return;x0=e.clientX;y0=e.clientY;dx=0;lock=null;});
  card.addEventListener('pointermove',e=>{if(x0==null)return;const a=e.clientX-x0,b=e.clientY-y0;if(!lock){if(Math.abs(a)>8&&Math.abs(a)>Math.abs(b)){lock='x';card.setPointerCapture(e.pointerId);}else if(Math.abs(b)>8)lock='y';}if(lock!=='x')return;dx=a;card.style.transition='none';card.style.transform=`translateX(${dx}px) rotate(${dx/18}deg)`;tagR.style.opacity=Math.max(0,dx/90);tagL.style.opacity=Math.max(0,-dx/90);});
  const up=()=>{if(x0==null)return;x0=null;if(lock!=='x')return;
    if(Math.abs(dx)>90){const dir=dx>0?1:-1;card.style.transition='transform .34s cubic-bezier(.4,0,1,1),opacity .34s';card.style.transform=`translateX(${dir*innerWidth}px) rotate(${dir*20}deg)`;card.style.opacity='0';setTimeout(()=>dir>0?right():left(),260);}
    else{card.style.transition='transform .45s '+SOFT;card.style.transform='';tagR.style.opacity=0;tagL.style.opacity=0;}};
  card.addEventListener('pointerup',up);card.addEventListener('pointercancel',up);return card;
}

/* ---------- round 7 ---------- */
/* Drill-in pages: the new page slides over from the right while the old one eases back and dims; back reverses it */
function depthSlide(g,pg,dir){
  if(!g||!pg){g&&g.remove();return;}const W=innerWidth;g.style.zIndex=dir==='push'?'1':'9';pg.style.position='relative';pg.style.zIndex='2';if(dir==='push'){pg.style.background='var(--bg)';pg.style.minHeight=innerHeight+'px';}
  if(dir==='push'){
    g.animate([{transform:'none',filter:'brightness(1)'},{transform:`translateX(${-W*.28}px) scale(.97)`,filter:'brightness(.94)'}],{duration:440,easing:SOFT,fill:'forwards'}).onfinish=()=>g.remove();
    pg.animate([{transform:`translateX(${W}px)`,boxShadow:'-12px 0 30px rgba(20,30,25,.12)'},{transform:'none',boxShadow:'-12px 0 30px rgba(20,30,25,0)'}],{duration:440,easing:SOFT}).onfinish=()=>{pg.style.zIndex='';pg.style.position='';pg.style.background='';pg.style.minHeight='';};
  }else{
    g.style.background='var(--bg)';g.style.boxShadow='-12px 0 30px rgba(20,30,25,.12)';
    g.animate([{transform:'none'},{transform:`translateX(${W}px)`}],{duration:340,easing:EASE,fill:'forwards'}).onfinish=()=>g.remove();
    pg.animate([{transform:`translateX(${-W*.28}px) scale(.97)`,filter:'brightness(.94)'},{transform:'none',filter:'brightness(1)'}],{duration:340,easing:EASE}).onfinish=()=>{pg.style.zIndex='';pg.style.position='';};
  }
}
/* Photos: grow from the thumbnail you tapped; closing shrinks back into it */
let lastPhoto=null;
document.addEventListener('pointerdown',e=>{const p=e.target.closest&&e.target.closest('.photo,.thumb');if(p)lastPhoto={n:p,t:Date.now()};},{passive:true,capture:true});
function photoSrc(){const L=lastPhoto;lastPhoto=null;return L&&Date.now()-L.t<1500&&L.n.isConnected?L.n:null;}
function photoOpen(img,src){if(!src||!motionOK())return;const go=()=>{const a=src.getBoundingClientRect(),b=img.getBoundingClientRect();if(!b.width)return;
  img.animate([{transform:`translate(${a.left+a.width/2-(b.left+b.width/2)}px,${a.top+a.height/2-(b.top+b.height/2)}px) scale(${Math.max(a.width/b.width,a.height/b.height)})`,borderRadius:'12px'},{transform:'none',borderRadius:'0'}],{duration:440,easing:SOFT});};
  img.complete&&img.naturalWidth?go():img.addEventListener('load',go,{once:true});}
function photoBack(img,src,box){if(!src||!src.isConnected||!motionOK())return false;const a=src.getBoundingClientRect(),b=img.getBoundingClientRect();if(!b.width)return false;
  box.style.transition='background .3s';box.style.background='rgba(10,14,12,0)';[...box.children].forEach(c=>{if(!c.contains(img))c.style.opacity='0';});
  const cur=getComputedStyle(img).transform;img.style.transition='none';
  img.animate([{transform:cur==='none'?'none':cur},{transform:`translate(${a.left+a.width/2-(b.left+b.width/2)}px,${a.top+a.height/2-(b.top+b.height/2)}px) scale(${Math.max(a.width/b.width,a.height/b.height)})`,borderRadius:'12px'}],{duration:320,easing:EASE,fill:'forwards'}).onfinish=()=>box.remove();return true;}
/* Weekly review as story cards: full cards that advance on their own; numbers count up; tap sides to move, swipe down to close */
function storyPlay(cards,title){
  {const nz=cards.filter(c=>c[0]==null||c[0]>0);if(nz.length)cards=nz;}
  if(!cards.length)return;let i=-1,tm=null;const bars=cards.map(()=>el('span',{},el('i')));
  const close=()=>{clearTimeout(tm);removeEventListener('keydown',key);box.animate([{opacity:1,transform:'none'},{opacity:0,transform:'translateY(40px)'}],{duration:260,easing:EASE,fill:'forwards'}).onfinish=()=>box.remove();};
  const box=el('div',{class:'story',role:'dialog','aria-modal':'true','aria-label':title},el('div',{class:'st-bars'},bars),el('div',{class:'st-top'},el('span',{class:'lbl'},title),el('button',{class:'st-x','aria-label':'Close',html:ic('x',20,2.2),onclick:close})),
    el('button',{class:'st-tap l','aria-label':'Previous',onclick:()=>show(i-1,-1)}),el('button',{class:'st-tap r','aria-label':'Next',onclick:()=>i>=cards.length-1?close():show(i+1,1)}));
  const key=e=>{if(e.key==='Escape')close();else if(e.key==='ArrowRight')i>=cards.length-1?close():show(i+1,1);else if(e.key==='ArrowLeft')show(i-1,-1);};addEventListener('keydown',key);
  document.body.append(box);if(motionOK())box.animate([{opacity:0,transform:'scale(.96)'},{opacity:1,transform:'none'}],{duration:320,easing:SOFT});
  let y0=null;box.addEventListener('pointerdown',e=>{y0=e.clientY;});box.addEventListener('pointerup',e=>{if(y0!=null&&e.clientY-y0>90)close();y0=null;});
  function show(n,dir=1){if(n<0||n>=cards.length)return;const old=box.querySelector('.st-slide');i=n;
    bars.forEach((b,j)=>{const f=b.firstChild;f.getAnimations().forEach(a=>a.cancel());f.style.width=j<i?'100%':'0';});
    const [num,cap]=cards[i],big=el('div',{class:'st-big'}),sl=el('div',{class:'st-slide'},num!=null?big:null,el('div',{class:'st-cap'+(num==null?' solo':'')},cap));box.insertBefore(sl,box.querySelector('.st-tap'));
    if(old){if(motionOK())old.animate([{transform:'none',opacity:1},{transform:`translateX(${-dir*30}%)`,opacity:0}],{duration:280,easing:EASE,fill:'forwards'}).onfinish=()=>old.remove();else old.remove();}
    if(motionOK())sl.animate([{transform:`translateX(${dir*40}%)`,opacity:0},{transform:'none',opacity:1}],{duration:420,easing:SOFT});
    if(num!=null){const t0=performance.now();const st=t=>{const k=Math.min(1,(t-t0)/800),e=1-Math.pow(1-k,3);big.textContent=String(Math.round(num*(motionOK()?e:1)));if(k<1&&big.isConnected)requestAnimationFrame(st);};requestAnimationFrame(st);}
    bars[i].firstChild.animate([{width:'0%'},{width:'100%'}],{duration:3500,easing:'linear',fill:'forwards'});clearTimeout(tm);tm=setTimeout(()=>{if(i<cards.length-1)show(i+1,1);},3500);}
  show(0);
}

/* ---------- round 8 ---------- */
/* A sheet's Save/Add brightens with a tiny pop the moment there's something to save */
(function saveWake(){const seen=new WeakMap();
  const on=b=>!b.disabled&&!b.classList.contains('off');
  new MutationObserver(ms=>{ms.forEach(m=>{const b=m.target;if(!b.matches||!b.matches('.shead .r'))return;const was=seen.has(b)?seen.get(b):null,now=on(b);seen.set(b,now);if(was===false&&now&&motionOK())b.animate([{transform:'scale(.85)'},{transform:'scale(1.12)',offset:.6},{transform:'none'}],{duration:380,easing:SPRING});});}).observe(document.body,{subtree:true,attributes:true,attributeFilter:['disabled','class']});
  new MutationObserver(()=>{$$('.shead .r').forEach(b=>{if(!seen.has(b))seen.set(b,on(b));});}).observe(document.body,{subtree:true,childList:true});})();
/* Loading placeholders melt into the real content */
function skeletonMelt(gs,root){if(!gs.length)return;if(!motionOK()){gs.forEach(g=>g.remove());return;}
  gs.forEach(g=>g.animate([{opacity:1},{opacity:0}],{duration:380,easing:EASE,fill:'forwards'}).onfinish=()=>g.remove());
  const pg=root.firstElementChild;pg&&[...pg.children].slice(0,6).forEach((c,i)=>c.animate([{opacity:0,filter:'blur(3px)'},{opacity:1,filter:'blur(0)'}],{duration:440,delay:i*50,easing:EASE,fill:'backwards'}));}

/* ---------- round 9 ---------- */
const CKSVG='<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
/* Tapping a greyed-out Add/Save: the empty title field shakes and says what's missing */
document.addEventListener('click',e=>{const h=e.target.closest&&e.target.closest('.shead');if(!h)return;const r=h.querySelector('.r');if(!r||!(r.disabled||r.classList.contains('off')))return;const b=r.getBoundingClientRect();if(e.clientX<b.left-8||e.clientX>b.right+8||e.clientY<b.top-8||e.clientY>b.bottom+8)return;
  const sh=h.closest('.sheet'),f=sh&&sh.querySelector('.field');if(!f)return;f.classList.add('err');const inp=f.querySelector('input,textarea');
  let hint=sh.querySelector('.ehint');if(!hint){hint=el('div',{class:'ehint',role:'alert'},'Give it a title first.');f.after(hint);}requestAnimationFrame(()=>hint.classList.add('on'));
  if(motionOK())f.animate([{transform:'none'},{transform:'translateX(-8px)'},{transform:'translateX(7px)'},{transform:'translateX(-5px)'},{transform:'translateX(3px)'},{transform:'none'}],{duration:420,easing:'ease-out'});
  inp&&inp.focus();const clear=()=>{f.classList.remove('err');hint.classList.remove('on');inp&&inp.removeEventListener('input',clear);};inp&&inp.addEventListener('input',clear);},true);
/* Offline banner: slides down when the connection drops; turns green and slides away when it's back */
(function offlineBanner(){let b=null,t=null;const get=()=>b||(b=document.body.appendChild(el('div',{class:'netban',role:'status','aria-live':'polite'})));
  addEventListener('offline',()=>{clearTimeout(t);const n=get();n.className='netban off';n.textContent='Offline · changes are saved on this phone';requestAnimationFrame(()=>n.classList.add('on'));});
  addEventListener('online',()=>{const n=get();if(!n.classList.contains('on'))return;n.className='netban back on';n.textContent='Back online · syncing';motionOK()&&n.animate([{transform:'scale(1)'},{transform:'scale(1.04)',offset:.4},{transform:'none'}],{duration:400,easing:SPRING});t=setTimeout(()=>n.classList.remove('on'),1600);});
  if(navigator.onLine===false)setTimeout(()=>dispatchEvent(new Event('offline')),300);})();
/* First visit to a swipeable list: the top row peeks sideways once to show what's underneath */
function swipeHint(){try{if(localStorage.getItem('lifeos-swipehint'))return;}catch(e){return;}const w=$('#view .swr');if(!w||!motionOK())return;const n=w.querySelector('.li');if(!n)return;try{localStorage.setItem('lifeos-swipehint','1');}catch(e){}
  w.dataset.dir='l';n.animate([{transform:'none'},{transform:'translateX(-76px)',offset:.35},{transform:'translateX(-76px)',offset:.55},{transform:'none'}],{duration:1300,easing:EASE}).onfinish=()=>{w.dataset.dir='r';n.animate([{transform:'none'},{transform:'translateX(66px)',offset:.35},{transform:'translateX(66px)',offset:.55},{transform:'none'}],{duration:1200,easing:EASE}).onfinish=()=>{delete w.dataset.dir;};};}
/* Pinned shortcuts in edit mode: they jiggle, drag one to reorder */
function pinDrag(tile){tile.addEventListener('pointerdown',e=>{if(!App.state.pinEdit||e.target.closest('.pin-x'))return;const grid=tile.parentElement,cells=[...grid.children],i=cells.indexOf(tile),rs=cells.map(c=>c.getBoundingClientRect()),x0=e.clientX,y0=e.clientY;let to=i,moved=false;tile.setPointerCapture(e.pointerId);
  const step=rs.length>1?rs[1].left-rs[0].left:0;
  const mv=ev=>{const dx=ev.clientX-x0,dy=ev.clientY-y0;if(!moved&&Math.hypot(dx,dy)<6)return;moved=true;tile.classList.add('drag');tile.style.translate=`${dx}px ${dy}px`;const cx=rs[i].left+rs[i].width/2+dx;let best=i,bd=1e9;rs.forEach((r,j)=>{const d=Math.abs(r.left+r.width/2-cx);if(d<bd){bd=d;best=j;}});to=best;
    cells.forEach((c,j)=>{if(j===i)return;let s=0;if(i<to&&j>i&&j<=to)s=-1;if(i>to&&j<i&&j>=to)s=1;c.style.transition='translate .25s '+EASE;c.style.translate=s?`${s*step}px 0`:'';});};
  const up=()=>{tile.removeEventListener('pointermove',mv);tile.removeEventListener('pointerup',up);tile.removeEventListener('pointercancel',up);tile.classList.remove('drag');if(!moved)return;const ids=cells.map(c=>c.dataset.pin);const [m]=ids.splice(i,1);ids.splice(to,0,m);setSettings({pinned:ids});};
  tile.addEventListener('pointermove',mv);tile.addEventListener('pointerup',up);tile.addEventListener('pointercancel',up);});return tile;}
/* Chips: a newly chosen chip draws its check in */
const CHIPS=new Set();
function chipChecks(root){const now=new Set();root.querySelectorAll('.chip.on[data-ck]').forEach(c=>{const k=c.dataset.ck;now.add(k);if(!CHIPS.has(k)&&motionOK()){const p=c.querySelector('.chk path');p&&p.animate([{strokeDashoffset:24},{strokeDashoffset:0}],{duration:320,delay:60,easing:EASE,fill:'backwards'});const ck=c.querySelector('.chk');ck&&ck.animate([{width:'0px'},{width:'14px'}],{duration:240,easing:EASE});}});CHIPS.clear();now.forEach(k=>CHIPS.add(k));}
/* Share/copy: the button you used turns into a check for a moment */
let lastBtnRef=null;document.addEventListener('pointerdown',e=>{const b=e.target.closest&&e.target.closest('button');if(b)lastBtnRef={b,t:Date.now()};},{capture:true,passive:true});
function lastBtn(){return lastBtnRef&&Date.now()-lastBtnRef.t<15000?lastBtnRef.b:null;}
function doneMorph(btn){if(!btn||!btn.isConnected||btn._morph)return;btn._morph=true;const icon=btn.classList.contains('iconbtn')||!btn.textContent.trim();const old=btn.innerHTML;
  btn.innerHTML=icon?CKSVG:CKSVG+'<span>'+(/copy/i.test(btn.textContent)?'Copied':'Done')+'</span>';btn.classList.add('morph-ok');
  motionOK()&&btn.animate([{transform:'scale(.88)'},{transform:'scale(1.06)',offset:.6},{transform:'none'}],{duration:380,easing:SPRING});
  setTimeout(()=>{if(!btn.isConnected)return;btn.innerHTML=old;btn.classList.remove('morph-ok');btn._morph=false;motionOK()&&btn.animate([{opacity:0},{opacity:1}],{duration:200});},1400);}
/* Multi-step flows: the current step's dot stretches into a pill; pages slide between steps */
const STEPS=new Map();
function stepDots(n,cur,key){const prev=STEPS.has(key)?STEPS.get(key):cur;STEPS.set(key,cur);const box=el('div',{class:'stepdots','aria-hidden':'true'},Array.from({length:n},(_,j)=>el('i',{class:j===cur?'on':j<cur?'done':''})));
  if(prev!==cur&&motionOK())requestAnimationFrame(()=>{const a=box.children[cur],b=box.children[prev];a&&a.animate([{width:'8px'},{width:'28px'}],{duration:420,easing:SOFT});b&&b.animate([{width:'28px'},{width:'8px'}],{duration:420,easing:SOFT});});return box;}
function stepSwap(dir){daySwap(()=>{clearTimeout(App._r);App.render();scrollTo(0,0);},dir);}

/* ---------- round 10 ---------- */
/* A finished goal: the ring swells (core) and a few green petals drift up and fade */
function petals(ring){if(!motionOK()||!ring||!ring.isConnected)return;const r=ring.getBoundingClientRect(),cx=r.left+r.width/2,cy=r.top+r.height/2,cols=['#466B5A','#8FB09E','#BCD0C4'];
  for(let k=0;k<14;k++){const p=el('span',{class:'petal','aria-hidden':'true'});Object.assign(p.style,{left:cx-4+(Math.random()-.5)*30+'px',top:cy-6+'px',background:cols[k%3]});document.body.append(p);
    const dx=(Math.random()-.5)*220,dy=-50-Math.random()*100,rot=(Math.random()-.5)*360;
    p.animate([{transform:'translate(0,0) rotate(0)',opacity:0},{opacity:1,offset:.15},{transform:`translate(${dx}px,${dy}px) rotate(${rot}deg)`,opacity:0}],{duration:1300+Math.random()*500,delay:k*25,easing:'cubic-bezier(.2,.7,.3,1)',fill:'forwards'}).onfinish=()=>p.remove();}}
/* Project segments: a newly finished step fills its segment from the left */
const SEGS=new Map();
function segFill(root){root.querySelectorAll('.segs[data-seg]').forEach(b=>{const k=b.dataset.seg,on=b.querySelectorAll('i.on').length,prev=SEGS.get(k);SEGS.set(k,on);if(prev==null||on<=prev||!motionOK())return;[...b.querySelectorAll('i.on')].slice(prev).forEach((i,j)=>i.animate([{backgroundSize:'0% 100%'},{backgroundSize:'100% 100%'}],{duration:480,delay:j*80,easing:EASE,fill:'backwards'}));});}
/* Text size: the page grows or shrinks in place instead of snapping */
function textSizeGlide(a,b){if(!motionOK())return;const Z={default:1,large:1.1,larger:1.22},za=Z[a]||1,zb=Z[b]||1;if(za===zb)return;requestAnimationFrame(()=>{['#view','#layers'].forEach(sel=>{const n=$(sel);n&&n.animate([{transform:`scale(${za/zb})`,transformOrigin:'50% 0'},{transform:'none',transformOrigin:'50% 0'}],{duration:420,easing:EASE});});});}

/* ---------- round 11 ---------- */
/* Studio: items added in bulk drop into their days one day at a time */
function studioMark(){const m=new Set();$$('.slot').forEach(s=>s.querySelectorAll('.slot-items>*').forEach(n=>m.add(s.dataset.slot+'|'+n.textContent)));App.state._cascade=m;}
function studioCascade(){const m=App.state._cascade;if(!m)return;App.state._cascade=null;if(!motionOK())return;let k=0;
  $$('.slot').forEach((s,i)=>{let j=0;s.querySelectorAll('.slot-items>*').forEach(n=>{if(m.has(s.dataset.slot+'|'+n.textContent)||k>24)return;k++;n.animate([{opacity:0,transform:'translateY(-14px) scale(.92)'},{opacity:1,transform:'none'}],{duration:420,delay:i*110+j*60,easing:SPRING,fill:'backwards'});j++;});});}
/* Studio Suggest: each card lifts out of the dock and arcs into the day it chose */
function arcMark(){const m=new Map(),sy=scrollY;$$('#st-dock .scard[data-cid]').forEach(c=>{const r=c.getBoundingClientRect();m.set(c.dataset.cid,{x:Math.min(Math.max(r.left,8),innerWidth-r.width-8),y:r.top+sy,w:r.width,h:r.height,n:c.cloneNode(true)});});App.state._arc=m;}
function arcPlay(){const m=App.state._arc;if(!m)return;App.state._arc=null;if(!motionOK())return;
  const gs=[...document.querySelectorAll('.pl.ghosted[data-gid]')].filter(g=>m.has(g.dataset.gid));if(!gs.length)return;
  const sy=scrollY,first=gs[0].getBoundingClientRect().top+sy,dockY=Math.min(...[...m.values()].map(v=>v.y));
  let to=sy;if(first+60>sy+innerHeight)to=Math.max(sy,Math.min(first-innerHeight*.62,dockY-90));if(to!==sy)scrollTo({top:to,behavior:'smooth'});
  gs.filter(g=>g.getBoundingClientRect().top+sy<to+innerHeight+120).slice(0,8).forEach((g,i)=>{const src=m.get(g.dataset.gid),r=g.getBoundingClientRect(),bx=r.left,by=r.top+sy;
    const f=src.n.cloneNode(true);f.classList.remove('sel');Object.assign(f.style,{position:'absolute',left:src.x+'px',top:src.y+'px',width:src.w+'px',height:src.h+'px',margin:0,zIndex:60,pointerEvents:'none',transformOrigin:'0 0',boxShadow:'0 10px 24px rgba(20,30,25,.14)'});f.className+=' arcfly';document.body.append(f);
    const dx=bx-src.x,dy=by-src.y,sx=r.width/src.w,sc=r.height/src.h,lift=Math.min(110,40+Math.abs(dy)*.15);g.style.opacity='0';
    f.animate([{transform:'none'},{transform:`translate(${dx*.5}px,${dy*.5-lift}px) scale(1.04)`,offset:.45},{transform:`translate(${dx}px,${dy}px) scale(${sx},${sc})`,opacity:.4}],{duration:680,delay:120+i*110,easing:'cubic-bezier(.45,0,.3,1)',fill:'both'}).onfinish=()=>{f.remove();g.style.opacity='';g.animate([{transform:'scale(.7)'},{transform:'scale(1.06)',offset:.6},{transform:'none'}],{duration:380,easing:SPRING});};});}
/* a time block ticked done: a deeper tint sweeps across it */
function blockSweep(b){if(!motionOK())return;const s=document.createElement('span');s.className='blk-sw';b.append(s);s.animate([{transform:'scaleX(0)',opacity:1},{transform:'scaleX(1)',opacity:1,offset:.6},{transform:'scaleX(1)',opacity:0}],{duration:800,easing:EASE}).onfinish=()=>s.remove();}
/* a task with steps: a thin ring around its circle fills as the steps get done */
const SRING=new Map();
function stepRing(id,n,of){const C=2*Math.PI*15,p=of?n/of:0,prev=SRING.get(id);SRING.set(id,p);const s=document.createElement('span');s.className='sring';s.setAttribute('aria-hidden','true');
  s.innerHTML=`<svg viewBox="0 0 34 34" width="34" height="34"><circle cx="17" cy="17" r="15" class="tr"/><circle cx="17" cy="17" r="15" class="fl" stroke-dasharray="${C}" stroke-dashoffset="${C*(1-p)}"/></svg>`;
  if(prev!=null&&prev!==p&&motionOK())requestAnimationFrame(()=>{const c=s.querySelector('.fl');c&&c.animate([{strokeDashoffset:C*(1-prev)},{strokeDashoffset:C*(1-p)}],{duration:520,easing:SOFT});});
  return s;}
/* count habits: each +1 floats up from the button */
document.addEventListener('click',e=>{const b=e.target.closest&&e.target.closest('button');if(!b||!/^\+1\b/.test(b.textContent.trim())||!motionOK())return;const r=b.getBoundingClientRect();const f=document.createElement('span');f.className='plus1';f.textContent='+1';f.style.left=(r.left+r.width/2)+'px';f.style.top=(r.top-2)+'px';document.body.append(f);
  f.animate([{transform:'translate(-50%,0) scale(.9)',opacity:0},{transform:'translate(-50%,-10px) scale(1)',opacity:1,offset:.25},{transform:'translate(-50%,-38px)',opacity:0}],{duration:760,easing:'cubic-bezier(.2,.7,.3,1)',fill:'forwards'}).onfinish=()=>f.remove();},true);
/* Month: the band marking the selected week glides to its new row */
let WKBAND=null;
function weekBandGlide(){const g=$('#month-grid');if(!g){WKBAND=null;return;}const row=g.querySelector('.heat-row.selwk'),key=(g.querySelector('[data-slot]')||{}).dataset?.slot;if(!row){WKBAND={key,top:null};return;}
  const top=row.offsetTop,prev=WKBAND;WKBAND={key,top};if(!prev||prev.key!==key||prev.top==null||prev.top===top||!motionOK())return;
  const gh=document.createElement('div');gh.className='wkglide';Object.assign(gh.style,{top:top+'px',height:row.offsetHeight+'px'});g.prepend(gh);row.classList.add('gliding');
  gh.animate([{transform:`translateY(${prev.top-top}px)`},{transform:'none'}],{duration:440,easing:SOFT}).onfinish=()=>{gh.remove();row.classList.remove('gliding');};}

/* ---------- round 12 ---------- */
/* switches: the knob stretches while pressed (touch too), then springs across */
document.addEventListener('pointerdown',e=>{const s=e.target.closest&&e.target.closest('.sw[role="switch"],button.sw');if(!s)return;s.classList.add('press');const off=()=>{s.classList.remove('press');removeEventListener('pointerup',off);removeEventListener('pointercancel',off);};addEventListener('pointerup',off);addEventListener('pointercancel',off);},true);
/* Studio commit: a soft fill rises through each day in turn and a check lands on it */
function commitSweep(){if(!App.state._commitSweep)return;App.state._commitSweep=false;if(!motionOK())return;let i=0;
  $$('.slot').forEach(s=>{const r=s.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight+40)return;const d=i++*80;
    const t=document.createElement('span');t.className='cm-tint';s.append(t);t.animate([{transform:'scaleY(0)',opacity:1},{transform:'scaleY(1)',opacity:1,offset:.45},{transform:'scaleY(1)',opacity:1,offset:.75},{transform:'scaleY(1)',opacity:0}],{duration:1500,delay:d,easing:EASE,fill:'both'}).onfinish=()=>t.remove();
    const ok=document.createElement('span');ok.className='cm-ok';ok.innerHTML=ic('check',12,3);s.append(ok);ok.animate([{opacity:0,transform:'scale(.4)'},{opacity:1,transform:'scale(1.15)',offset:.15},{opacity:1,transform:'none',offset:.25},{opacity:1,transform:'none',offset:.8},{opacity:0,transform:'none'}],{duration:2000,delay:d+180,easing:'linear',fill:'both'}).onfinish=()=>ok.remove();});}
/* habit streaks: the count rolls up when a check-in extends it */
const STREAKS=new Map();
function streakSeen(id,n){const p=STREAKS.get(id);STREAKS.set(id,n);return p!=null&&p!==n?p:null;}
function streakRoll(root){root.querySelectorAll('[data-rollfrom]').forEach(n=>{const from=+n.dataset.rollfrom;n.removeAttribute('data-rollfrom');if(!motionOK())return;const up=+n.dataset.rollto>from;
  n.animate([{transform:`translateY(${up?10:-10}px)`,opacity:0},{transform:'none',opacity:1}],{duration:420,delay:120,easing:SOFT,fill:'backwards'});if(up)n.animate([{transform:'none'},{transform:'scale(1.12)',offset:.5},{transform:'none'}],{duration:480,delay:520,easing:SPRING});});}
/* empty states trace their little drawing in the first time they appear */
const EMPTYSEEN=new Set();
function emptyDraw(root){root.querySelectorAll('.empty .eart').forEach(s=>{const k=(s.parentElement.querySelector('b')||{}).textContent||'';if(EMPTYSEEN.has(k))return;EMPTYSEEN.add(k);if(!motionOK())return;
  s.querySelectorAll('path,rect,circle').forEach((p,i)=>{const L=p.getTotalLength?p.getTotalLength():120;p.style.strokeDasharray=L;p.animate([{strokeDashoffset:L},{strokeDashoffset:0}],{duration:650,delay:i*130,easing:EASE,fill:'backwards'}).onfinish=()=>{p.style.strokeDasharray='';};});
  [...s.parentElement.children].filter(c=>c!==s).forEach((c,i)=>c.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:420,delay:480+i*90,easing:EASE,fill:'backwards'}));});}
/* focus finished: the ring closes, a ripple spreads once, and the time reads Done for a moment */
let frDoneAt=0;
function focusRipple(rg){frDoneAt=Date.now();if(!motionOK())return;[0,1].forEach(i=>{const r=document.createElement('span');r.className='frip';rg.append(r);r.animate([{opacity:.55,transform:'scale(.92)'},{opacity:0,transform:'scale(1.32)'}],{duration:1200,delay:i*240,easing:'cubic-bezier(.2,.7,.3,1)',fill:'both'}).onfinish=()=>r.remove();});
  rg.animate([{transform:'none'},{transform:'scale(1.03)',offset:.4},{transform:'none'}],{duration:620,easing:SPRING});}

/* ---------- round 13 ---------- */
/* hold to confirm: for deletes that can't be undone, the button fills while held; let go early and it drains */
const hScale=n=>{const t=getComputedStyle(n).transform;return t&&t!=='none'?new DOMMatrix(t).a:0;};
function holdBtn(label,onDone){const f=el('span',{class:'hfill'}),b=el('button',{class:'btn danger holdb'},f,el('span',{class:'hl'},label));let a=null,done=false;
  const fire=()=>{done=true;buzz(14);b.classList.add('go');setTimeout(onDone,motionOK()?160:0);};
  const start=e=>{if(done||e.button>0)return;e.preventDefault();const sx=hScale(f);a&&a.cancel();a=f.animate([{transform:`scaleX(${sx})`},{transform:'scaleX(1)'}],{duration:1000*(1-sx)+1,easing:'linear',fill:'forwards'});a.onfinish=fire;};
  const stop=()=>{if(!a||done)return;const sx=hScale(f);a.onfinish=null;a.cancel();a=f.animate([{transform:`scaleX(${sx})`},{transform:'scaleX(0)'}],{duration:300,easing:EASE,fill:'forwards'});};
  b.addEventListener('pointerdown',start);['pointerup','pointerleave','pointercancel'].forEach(t=>b.addEventListener(t,stop));b.addEventListener('contextmenu',e=>e.preventDefault());
  b.addEventListener('click',e=>{if(e.detail===0&&!done)fire();});return b;}
/* tap the tab you're on: the page glides to the top and the icon gives a small nod */
function tabTop(){const i=$('.nav .tab.act .ic');if(i&&motionOK())i.animate([{transform:'none'},{transform:'translateY(-3px) scale(1.08)',offset:.4},{transform:'none'}],{duration:420,easing:SPRING});
  const y0=scrollY;if(!y0)return;if(!motionOK()){scrollTo(0,0);return;}const t0=performance.now(),D=Math.min(720,300+y0*.25);const step=t=>{const p=Math.min(1,(t-t0)/D),e=1-Math.pow(1-p,3);scrollTo(0,y0*(1-e));if(p<1)requestAnimationFrame(step);};requestAnimationFrame(step);}
/* section labels in long lists stick at the top and pick up a hairline while rows pass under */
(function stickyLines(){let raf=0;const run=()=>{raf=0;$$('.sh2.shstick').forEach(h=>{const top=parseFloat(getComputedStyle(h).top)||0,r=h.getBoundingClientRect(),nx=h.nextElementSibling;h.classList.toggle('stuck',scrollY>0&&Math.abs(r.top-top)<2&&!!nx&&nx.getBoundingClientRect().top<r.bottom-1);});};
  addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(run);},{passive:true});})();
/* quick add: the Add button grows out of the field once there's text */
function growBtn(b,show){if(!b)return;const cur=b._show!=null?b._show:!b.hidden;if(show===cur)return;b._show=show;b.getAnimations().forEach(x=>x.cancel());if(!motionOK()){b.hidden=!show;return;}
  if(show){b.hidden=false;const w=b.offsetWidth;b.animate([{width:'0px',opacity:0,paddingInline:'0px'},{width:w+'px',opacity:1}],{duration:320,easing:SOFT});}
  else{const w=b.offsetWidth;b.animate([{width:w+'px',opacity:1},{width:'0px',opacity:0,paddingInline:'0px'}],{duration:200,easing:EASE}).onfinish=()=>{if(!b._show)b.hidden=true;};}}
/* habit week dots: today's dot pops when it fills, and the run before it ripples once */
const DOTRUN=new Map();
function dotRipple(dots,i){dots[i].animate([{transform:'scale(.3)'},{transform:'scale(1.5)',offset:.55},{transform:'none'}],{duration:460,easing:SPRING});
  let j=i-1,n=0;while(j>=0&&dots[j].classList.contains('on')){dots[j].animate([{transform:'none'},{transform:'scale(1.3)',offset:.5},{transform:'none'}],{duration:320,delay:180+n*70,easing:EASE});j--;n++;}}
function dotRun(root){root.querySelectorAll('.odots[data-dk]').forEach(o=>{const dots=[...o.children],i=dots.findIndex(d=>d.classList.contains('td'));if(i<0)return;const on=dots[i].classList.contains('on'),prev=DOTRUN.get(o.dataset.dk);DOTRUN.set(o.dataset.dk,on);if(prev===false&&on&&motionOK())dotRipple(dots,i);});}

/* ---------- round 14 ---------- */
/* Inbox: an idea turned into something else morphs in its row (a circle checks in, the label rolls), then folds away */
function ideaBecame(id,kind){App.state._ideaMorph={id,kind,at:Date.now(),played:false};setTimeout(()=>{remove(id);},motionOK()?950:0);}
function ideaMorph(root){const M=App.state._ideaMorph;if(!M)return;if(Date.now()-M.at>1500){App.state._ideaMorph=null;return;}const row=root.querySelector(`[data-k="idea:${M.id}"]`);if(!row)return;
  const li=row.querySelector('.li')||row,btn=li.querySelector('.grow'),turn=li.querySelector('.oturn');const anim=!M.played&&motionOK();M.played=true;
  const c=el('span',{class:'imorph',html:ic('check',13,3)});btn&&btn.prepend(c);li.classList.add('morphed');
  if(turn){turn.innerHTML='';const roll=el('span',{class:'iroll'},el('span',{},`${M.kind} added`));turn.append(roll);}
  if(!anim)return;c.animate([{transform:'scale(.3) rotate(-30deg)',opacity:0},{transform:'scale(1.15)',opacity:1,offset:.6},{transform:'none',opacity:1}],{duration:460,easing:SPRING});
  turn&&turn.firstChild.animate([{transform:'translateY(100%)',opacity:0},{transform:'none',opacity:1}],{duration:360,delay:120,easing:EASE,fill:'backwards'});}
/* photos: new thumbnails drop in one after another; removing one closes the gap */
function photoDrop(box,born){if(!motionOK())return;const now=performance.now();[...box.querySelectorAll('.photo')].forEach((p,i)=>{const t0=born[i];if(t0==null)return;const e=now-t0;if(e>=480)return;p.animate([{opacity:0,transform:'translateY(-16px) scale(.86) rotate(-4deg)'},{opacity:1,transform:'translateY(2px) scale(1.02)',offset:.65},{opacity:1,transform:'none'}],{duration:480,delay:-e,easing:SOFT,fill:'backwards'});});}
function photoRects(box){return[...box.querySelectorAll('.photo,.addphoto')].map(n=>n.getBoundingClientRect());}
function photoClose(box,before,gone){if(!motionOK())return;const now=[...box.querySelectorAll('.photo,.addphoto')];now.forEach((n,j)=>{const b=before[j>=gone?j+1:j];if(!b)return;const a=n.getBoundingClientRect(),dx=b.left-a.left,dy=b.top-a.top;if(dx||dy)n.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'none'}],{duration:360,easing:SOFT});});}
/* Today: keep pulling up past the bottom and a Tomorrow card rises; let go once its ring is full to go to tomorrow */
(function pullTomorrow(){let y0=null,d=0,card=null,full=false;const C=2*Math.PI*10;
  const atBottom=()=>scrollY+innerHeight>=document.documentElement.scrollHeight-4;
  const make=()=>{const t=addK(App.state.sel||todayK(),1),dt=fromK(t),n=dayItems?(()=>{try{const x=dayItems(t);return x.timed.length+x.anytime.length+x.allDay.length;}catch(e){return 0;}})():0;
    card=el('div',{class:'tpeek','aria-hidden':'true'},el('span',{class:'dt'},el('small',{},DOW[dt.getDay()].slice(0,3).toUpperCase()),el('b',{},String(dt.getDate()))),el('span',{class:'grow'},el('b',{class:'serif'},App.state.sel===todayK()?'Tomorrow':DOW[dt.getDay()]),el('small',{class:'tpl'},n?`${n} planned · keep pulling`:'Keep pulling')));
    card.insertAdjacentHTML('beforeend',`<svg class="tring" viewBox="0 0 26 26" width="26" height="26"><circle cx="13" cy="13" r="10" class="tr"/><circle cx="13" cy="13" r="10" class="fl" stroke-dasharray="${C}" stroke-dashoffset="${C}" transform="rotate(-90 13 13)"/></svg>`);document.body.append(card);};
  const set=()=>{const p=Math.min(1,d/150);card.style.transform=`translateY(${-Math.min(d*.6,96)}px)`;card.style.opacity=Math.min(1,d/40);card.querySelector('.fl').setAttribute('stroke-dashoffset',C*(1-p));const wasFull=full;full=p>=1;if(full&&!wasFull){buzz(8);card.animate([{scale:'1'},{scale:'1.04'},{scale:'1'}],{duration:300,easing:SPRING});}if(full!==wasFull){const s=card.querySelector('.tpl');s.textContent=full?'Let go to open':s.textContent.replace('Let go to open','Keep pulling');}$('#view').style.transform=`translateY(${-Math.min(d,170)*.25}px)`;};
  const end=go=>{const c=card,v=$('#view');card=null;y0=null;if(v){v.style.transition='transform .35s cubic-bezier(.2,.8,.2,1)';v.style.transform='';setTimeout(()=>{v.style.transition='';},380);}if(!c)return;
    if(go){c.animate([{transform:c.style.transform,opacity:1},{transform:'translateY(-160px)',opacity:0}],{duration:320,easing:EASE,fill:'forwards'}).onfinish=()=>c.remove();goDay(addK(App.state.sel||todayK(),1));scrollTo(0,0);}
    else c.animate([{transform:c.style.transform,opacity:c.style.opacity},{transform:'none',opacity:0}],{duration:260,easing:EASE,fill:'forwards'}).onfinish=()=>c.remove();};
  addEventListener('touchstart',e=>{if(App.state.view!=='today'||e.touches.length>1||document.querySelector('.sheet.on,.confirm.on')||!atBottom()||!motionOK())return;y0=e.touches[0].clientY;d=0;full=false;},{passive:true});
  addEventListener('touchmove',e=>{if(y0==null)return;const dy=y0-e.touches[0].clientY;if(dy<=0&&!card)return;if(!atBottom()&&!card){y0=null;return;}d=Math.max(0,dy-10);if(!card&&d>4)make();if(card)set();},{passive:true});
  addEventListener('touchend',()=>{if(y0==null)return;if(card)end(full);else y0=null;},{passive:true});addEventListener('touchcancel',()=>{if(card)end(false);y0=null;},{passive:true});})();

/* ---------- round 15 ---------- */
/* mood: five circles that grow under your finger like a dock as you slide across */
function moodPicker(val,onPick){const order=MOODS.slice().reverse(),CL={Rough:'#B4683F',Low:'#C9A27A',Okay:'#AEB9B1',Good:'#8FB09E',Great:'#466B5A'};let cur=val,pick=null,down=false;
  const lab=el('div',{class:'mlab'},cur||'Slide across or tap');
  const bs=order.map(m=>el('button',{type:'button',class:'mood'+(cur===m?' on':''),style:`--mc:${CL[m]}`,'aria-label':m,'aria-pressed':String(cur===m),onclick:e=>{if(e.detail===0)choose(m);}}));
  const row=el('div',{class:'moods'},bs);
  const choose=m=>{cur=m;bs.forEach((b,i)=>{const on=order[i]===m;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));});lab.textContent=m;onPick(m);};
  const near=x=>{let best=0,bd=1e9;bs.forEach((b,i)=>{const r=b.getBoundingClientRect(),d=Math.abs(x-(r.left+r.width/2));if(d<bd){bd=d;best=i;}});return best;};
  const mag=x=>{if(motionOK())bs.forEach(b=>{const r=b.getBoundingClientRect(),d=Math.abs(x-(r.left+r.width/2));b.style.transform=`scale(${1+Math.max(0,.5-d/120)})`;});const i=near(x);if(i!==pick){pick=i;lab.textContent=order[i];buzz(3);}};
  const rel=()=>{if(!down)return;down=false;bs.forEach(b=>{b.style.transition='transform .35s cubic-bezier(.3,1.35,.5,1)';b.style.transform='';setTimeout(()=>{b.style.transition='';},360);});if(pick!=null)choose(order[pick]);pick=null;};
  row.addEventListener('pointerdown',e=>{down=true;row.setPointerCapture(e.pointerId);bs.forEach(b=>b.style.transition='');mag(e.clientX);});
  row.addEventListener('pointermove',e=>{if(down)mag(e.clientX);});row.addEventListener('pointerup',rel);row.addEventListener('pointercancel',rel);
  return el('div',{class:'moodpick'},row,lab);}
/* routine player: the step you leave lifts away and the next one slides up */
function stepOut(dir){const c=$('.card.player');if(!c||!motionOK())return;const h=c.querySelector('h2'),t=c.querySelector('.timer');[h,t].forEach(n=>{const g=ghostOf(n);if(!g)return;g.animate([{transform:'none',opacity:1},{transform:`translateY(${-28*dir}px)`,opacity:0}],{duration:300,easing:EASE,fill:'forwards'}).onfinish=()=>g.remove();});App.state._stepIn=dir;}
function stepIn(root){const d=App.state._stepIn;if(!d)return;App.state._stepIn=0;if(!motionOK())return;const c=root.querySelector('.card.player,.card.celebrate');if(!c)return;
  [...c.children].filter(n=>!n.classList.contains('rbars')).forEach((n,i)=>n.animate([{transform:`translateY(${36*d}px)`,opacity:0},{transform:'none',opacity:1}],{duration:440,delay:110+i*40,easing:SOFT,fill:'backwards'}));}
/* numbers that roll: each changed digit slides in from above */
function rollText(n,str){if(!n)return;str=String(str);const cur=n._rt;if(cur===str)return;const kids=n.children;
  if(!motionOK()||cur==null||cur.length!==str.length||kids.length!==str.length){n.textContent='';[...str].forEach(ch=>n.append(el('span',{class:'rd'},el('span',{},ch))));n._rt=str;n.setAttribute('aria-label',str);return;}
  [...str].forEach((ch,i)=>{if(cur[i]===ch)return;const box=kids[i],old=box.lastElementChild;const nw=el('span',{class:'rdn'},ch);box.append(nw);
    if(!/\d/.test(ch)||!/\d/.test(cur[i])){old&&old.remove();nw.className='';return;}
    nw.animate([{transform:'translateY(-100%)'},{transform:'none'}],{duration:380,easing:SOFT}).onfinish=()=>{nw.className='';};
    if(old)old.animate([{transform:'none',opacity:1},{transform:'translateY(60%)',opacity:0}],{duration:320,easing:EASE,fill:'forwards'}).onfinish=()=>old.remove();});
  n._rt=str;n.setAttribute('aria-label',str);}
/* sheets follow the keyboard: when it opens or closes, the sheet glides to its new spot instead of jumping */
function sheetGlide(fn){const sh=document.querySelector('.sheet.on');if(!sh){fn();return;}const a=sh.getBoundingClientRect().top;fn();if(!motionOK())return;const b=sh.getBoundingClientRect().top,dy=a-b;if(Math.abs(dy)<24)return;
  sh.animate([{translate:`0 ${dy}px`},{translate:'0 0'}],{duration:340,easing:'cubic-bezier(.2,.8,.2,1)',composite:'add'});}

/* ---------- round 16 ---------- */
/* Month: the day card slides in from the side you're moving toward */
function panelOut(dir){App.state._panelDir=dir;const p=$('.dpanel');const g=motionOK()&&ghostOf(p);if(!g)return;g.animate([{transform:'none',opacity:1},{transform:`translateX(${-36*dir}%)`,opacity:0}],{duration:300,easing:EASE,fill:'forwards'}).onfinish=()=>g.remove();}
function panelIn(root){const d=App.state._panelDir;if(!d)return;App.state._panelDir=0;const p=root.querySelector('.dpanel');if(!p||!motionOK())return;p.animate([{transform:`translateX(${46*d}%)`,opacity:0},{transform:'none',opacity:1}],{duration:380,easing:SOFT});}
/* charts: tap a bar and it lifts, with a small label for its value */
let barTip=null;
function closeBarTip(){if(!barTip)return;const{tip,bar}=barTip;barTip=null;bar.classList.remove('lift');if(motionOK())tip.animate([{opacity:1},{opacity:0}],{duration:150}).onfinish=()=>tip.remove();else tip.remove();}
document.addEventListener('click',e=>{const svg=e.target.closest&&e.target.closest('svg.dchart');if(!svg){closeBarTip();return;}const bars=[...svg.querySelectorAll('.dbar[data-t]')];if(!bars.length)return;
  let best=null,bd=1e9;bars.forEach(b=>{const r=b.getBoundingClientRect(),d=Math.abs(e.clientX-(r.left+r.width/2));if(d<bd){bd=d;best=b;}});const same=barTip&&barTip.bar===best;closeBarTip();if(same||!best)return;
  const host=svg.closest('.dchartw')||svg.parentElement;host.classList.add('tiphost');const hr=host.getBoundingClientRect(),br=best.getBoundingClientRect();best.classList.add('lift');
  const tip=el('span',{class:'bartip'},best.dataset.t);host.append(tip);tip.style.left=(br.left-hr.left+br.width/2)+'px';tip.style.top=(br.top-hr.top-34)+'px';barTip={tip,bar:best};buzz(4);
  if(motionOK())tip.animate([{opacity:0,transform:'translate(-50%,8px) scale(.8)'},{opacity:1,transform:'translate(-50%,0) scale(1)'}],{duration:320,easing:SPRING});});
/* search: the field grows out of the magnifier (or box) you tapped, and shrinks back into it on Cancel */
function searchFrom(n){const r=n.getBoundingClientRect();App.state._searchFrom={l:r.left,t:r.top,w:r.width,h:r.height};App.state._searchBack=App.state._searchFrom;}
function searchGrow(root){const F=App.state._searchFrom;if(!F)return;App.state._searchFrom=null;if(!motionOK())return;const box=root.querySelector('.searchbox');if(!box)return;const r=box.getBoundingClientRect();
  const L=Math.max(0,F.l-r.left),R=Math.max(0,r.right-(F.l+F.w)),T=Math.max(0,F.t-r.top),B=Math.max(0,r.bottom-(F.t+F.h));
  box.animate([{clipPath:`inset(${T}px ${R}px ${B}px ${L}px round ${Math.min(F.w,F.h)/2}px)`},{clipPath:'inset(0 0 0 0 round 14px)'}],{duration:380,easing:SOFT});
  [...root.firstElementChild.children].forEach((c,i)=>{if(i)c.animate([{opacity:0,transform:'translateY(6px)'},{opacity:1,transform:'none'}],{duration:300,delay:140+i*40,easing:EASE,fill:'backwards'});});
  const cx=box.nextElementSibling;cx&&cx.animate([{opacity:0},{opacity:1}],{duration:220,delay:180,fill:'backwards'});}
function searchShrink(done){const F=App.state._searchBack,box=$('.searchbox');App.state._searchBack=null;if(!F||!box||!motionOK()){done();return;}const r=box.getBoundingClientRect();
  const L=Math.max(0,F.l-r.left),R=Math.max(0,r.right-(F.l+F.w)),T=Math.max(0,F.t-r.top),B=Math.max(0,r.bottom-(F.t+F.h));const inp=box.querySelector('input');inp&&inp.blur();
  box.animate([{clipPath:'inset(0 0 0 0 round 14px)'},{clipPath:`inset(${T}px ${R}px ${B}px ${L}px round ${Math.min(F.w,F.h)/2}px)`,opacity:.5}],{duration:240,easing:EASE,fill:'forwards'}).onfinish=()=>{App.state.dir=null;App.state._noDepth=true;done();};}
/* Week view: "+ Task" grows a small add field inside the day instead of opening a sheet */
function wkRefocus(root){const dk=App.state._wkRefocus;if(!dk)return;App.state._wkRefocus=null;const c=root.querySelector(`.wkrow[data-slot="${dk}"] .chips .chip`);if(c)wkAdd(c,dk,true);}
function wkAdd(btn,dk,quiet){const host=btn.closest('.wkitems');if(!host)return;let f=host.querySelector('.wkaddf');if(f){f.querySelector('input').focus();return;}
  const inp=el('input',{id:'li-new-wk',placeholder:`Add to ${relDay(dk)}`,enterkeyhint:'done',autocomplete:'off','aria-label':`Add a task to ${relDay(dk)}`});
  const save=()=>{const raw=inp.value.trim();if(!raw)return false;const w=parseWhen(raw,fromK(dk));create('task',{notes:'',steps:[],repeat:{type:'never',end:null},remUnit:'minute',photos:[],title:w.title||raw,date:dk,time:w.time??null});inp.value='';return true;};
  const close=()=>{if(!f.isConnected)return;if(!motionOK()){f.remove();return;}const h=f.offsetHeight;f.animate([{height:h+'px',opacity:1},{height:'0px',opacity:0}],{duration:200,easing:EASE,fill:'forwards'}).onfinish=()=>f.remove();};
  f=el('div',{class:'wkaddf'},inp,el('button',{class:'chip on',onpointerdown:e=>e.preventDefault(),onclick:()=>{if(save()){App.state._wkRefocus=dk;App.refresh();}else close();}},'Add'));
  inp.addEventListener('keydown',e=>{if(e.key==='Enter'){if(save()){App.state._wkRefocus=dk;App.refresh();}else close();}if(e.key==='Escape')close();});inp.addEventListener('blur',()=>setTimeout(()=>{if(document.activeElement!==inp&&!inp.value.trim())close();},120));
  btn.closest('.chips').after(f);if(!quiet&&motionOK()){const h=f.offsetHeight;f.animate([{height:'0px',opacity:0},{height:h+'px',opacity:1}],{duration:300,easing:SOFT});}inp.focus({preventScroll:true});}
/* repeat days: picking a preset fills (or clears) the day circles one after another */
function wdFill(was,now){if(!motionOK())return;const bs=$$('.sheet.on .wdays button');if(bs.length!==7)return;let k=0;
  bs.forEach((b,i)=>{const a=was.includes(i),z=now.includes(i);if(a===z)return;b.classList.toggle('on',a);const d=k++*55;setTimeout(()=>{b.classList.toggle('on',z);if(z)b.animate([{transform:'scale(.8)'},{transform:'scale(1.12)',offset:.6},{transform:'none'}],{duration:340,easing:SPRING});},d);});}

/* ---------- round 17 ---------- */
/* habit history: a marked day fills from the middle out; unmarking drains it back */
function hcFill(root){const F=App.state._hcFill;if(!F)return;App.state._hcFill=null;if(!motionOK())return;const b=root.querySelector(`.calgrid button[data-hd="${F.dk}"]`);if(!b)return;
  b.style.background=`radial-gradient(circle,var(--accent) 49%,transparent 51%) center/${F.on?'0% 0%':'145% 145%'} no-repeat,${F.on?'var(--chip)':getComputedStyle(b).backgroundColor}`;if(F.on)b.style.color='var(--ink)';
  b.animate([{backgroundSize:F.on?'0% 0%, auto':'145% 145%, auto'},{backgroundSize:F.on?'145% 145%, auto':'0% 0%, auto'}],{duration:F.on?380:280,easing:F.on?SOFT:EASE}).onfinish=()=>{b.style.background='';b.style.color='';};
  if(F.on)setTimeout(()=>{b.style.color='';},150);}
/* goal milestones: a line joins them and fills down to the next one */
const MSL=new Map();
function msLine(root){root.querySelectorAll('.list.mstl').forEach(box=>{const rows=[...box.querySelectorAll(':scope>.li')];if(rows.length<2)return;const bt=box.getBoundingClientRect();
  const cs=rows.map(r=>{const t=r.querySelector('.tick');const q=(t||r).getBoundingClientRect();return{x:q.left+q.width/2-bt.left,y:q.top+q.height/2-bt.top,r:q.height/2};});
  const nx=rows.findIndex(r=>!r.classList.contains('done')),to=nx<0?rows.length-1:nx,top=cs[0].y,h=cs[to].y-top,full=cs[cs.length-1].y-top;
  const rail=el('span',{class:'msrail','aria-hidden':'true'}),fill=el('span',{class:'msfill','aria-hidden':'true'});[rail,fill].forEach(n=>{n.style.left=(cs[0].x-1)+'px';n.style.top=top+'px';});rail.style.height=full+'px';fill.style.height=Math.max(0,h)+'px';box.prepend(rail,fill);
  const key=box.dataset.gid,prev=MSL.get(key);MSL.set(key,h);if(prev!=null&&prev!==h&&motionOK())fill.animate([{height:prev+'px'},{height:Math.max(0,h)+'px'}],{duration:560,easing:SOFT});});}
/* time grid: when blocks share time they glide into side-by-side columns */
function blkSnap(){const m=new Map();$$('#grid .blk[data-bid]').forEach(b=>m.set(b.dataset.bid,{l:b.offsetLeft,w:b.offsetWidth,t:b.offsetTop}));return m;}
function blkFlip(before){if(!before||!before.size||!motionOK())return;$$('#grid .blk[data-bid]').forEach(b=>{const o=before.get(b.dataset.bid);if(!o||o.t!==b.offsetTop)return;const l=b.offsetLeft,w=b.offsetWidth;if(Math.abs(o.l-l)<2&&Math.abs(o.w-w)<2)return;
  b.animate([{left:o.l+'px',width:o.w+'px'},{left:l+'px',width:w+'px'}],{duration:420,easing:SOFT});});}
/* Today: tapping the date drops a small month calendar right under it */
function dateDropEl(dk){const c=formCtx(()=>{});const close=go=>dateDrop(false,go);
  return el('div',{class:'ddrop'},el('div',{class:'ddin'},c.calendar(dk,d=>{if(d)close(d);}),dk!==todayK()?el('button',{class:'linkbtn small',onclick:()=>close(todayK())},'Jump to today'):null));}
function dateDrop(want,go){const S=App.state,open=want===undefined?!S.dateDrop:want;
  if(open){S.dateDrop=true;S._ddIn=true;clearTimeout(App._r);App.render();return;}
  const d=$('.ddrop'),fin=()=>{S.dateDrop=false;if(go&&go!==S.sel)goDay(go);else{clearTimeout(App._r);App.render();}};
  if(!d||!motionOK()){fin();return;}const h=d.offsetHeight;$('.hd .date')&&$('.hd .date').classList.remove('open');d.animate([{height:h+'px',opacity:1},{height:'0px',opacity:0}],{duration:240,easing:EASE,fill:'forwards'}).onfinish=fin;}
function dateDropIn(root){if(!App.state._ddIn)return;App.state._ddIn=false;const d=root.querySelector('.ddrop');if(!d||!motionOK())return;const h=d.offsetHeight;
  d.animate([{height:'0px',opacity:0},{height:h+'px',opacity:1}],{duration:380,easing:SOFT});d.querySelectorAll('.ddin>*').forEach((n,i)=>n.animate([{opacity:0,transform:'translateY(-8px)'},{opacity:1,transform:'none'}],{duration:280,delay:60+i*50,easing:EASE,fill:'backwards'}));}
document.addEventListener('pointerdown',e=>{if(!App.state.dateDrop||App.state.view!=='today')return;if(e.target.closest('.ddrop,.hd .date'))return;dateDrop(false);},true);
