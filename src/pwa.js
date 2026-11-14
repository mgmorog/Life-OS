/* ---------- home-screen app hooks: dormant unless window.LIFEOS_PWA is set (the claude.ai page never sets it) ---------- */
const PWA={
  on:!!window.LIFEOS_PWA,
  api(){return window.lifeosPWA||null;},
  /* reminders that will fire in the next 14 days, for push notifications when the app is closed */
  upcoming(){
    const now=Date.now(),tk=todayK(),st=remState(),out=[],q=get.settings().quiet||{};
    const push=(e,dk,base,m)=>{const key=e.id+'|'+dk,v=st.map[key];if(v==='x')return;let fire=typeof v==='number'?v:base-m*6e4;if(fire<=now)return;
      if(e.kind==='allday'&&typeof v!=='number'){const d=new Date(fire),h=d.getHours();if(h<8||h>=21){const t=new Date(d.getFullYear(),d.getMonth(),d.getDate()+(h>=21?1:0),9,0);fire=t.getTime();if(fire<=now)return;}}
      if(q.on&&inQuiet(new Date(fire))){const d=new Date(fire);let t=new Date(d.getFullYear(),d.getMonth(),d.getDate(),Math.floor(q.to/60),q.to%60);if(t.getTime()<fire)t=new Date(t.getTime()+864e5);fire=t.getTime();}
      const when=e.kind==='allday'?(dk===tk?'Today':relDay(dk)):`${dk===tk?'':relDay(dk)+', '}${fmtT(e.time)}`;
      out.push({key,fire_at:new Date(fire).toISOString(),title:e.title,body:m>0&&e.kind!=='allday'?`${when} · ${remLabel(m).replace(' before','')} from now`:when,url:'/#today'});};
    for(let i=0;i<=14;i++){const dk=addK(tk,i),d=dayItems(dk);
      [...d.allDay,...d.timed].forEach(e=>{const m=e.rec.reminder;if(m==null||e.done||e.kind==='step'||e.kind==='gcal')return;if(e.kind==='habit'&&(e.rec.tod!=='set'||e.time==null))return;if(e.kind==='allday'&&allDayOccStart(e.rec,dk)!==dk)return;
        push(e,dk,fromK(dk).getTime()+(e.time||0)*6e4,m);});}
    get.all('allday').forEach(r=>{if(r.reminder==null||r.reminder<14*1440)return;for(let i=15;i<=60;i++){const dk=addK(tk,i);if(occursOn(r.start,r.repeat,dk,r.skip))push({kind:'allday',id:r.id,title:r.title},dk,fromK(dk).getTime(),r.reminder);}});
    return out.sort((a,b)=>a.fire_at<b.fire_at?-1:1).slice(0,300);
  },
  /* the next 90 days as an iCalendar file, for the subscribed calendar on iPhone */
  ics(){
    const esc=s=>String(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\r?\n/g,'\\n');
    const dt=(dk,min)=>dk.replace(/-/g,'')+(min==null?'':`T${String(Math.floor(min/60)%24).padStart(2,'0')}${String(min%60).padStart(2,'0')}00`);
    const fold=l=>{let o='';while(l.length>74){o+=l.slice(0,74)+'\r\n ';l=l.slice(74);}return o+l;};
    const stamp=new Date().toISOString().replace(/[-:]/g,'').replace(/\.\d+/,'');
    const L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Life OS//EN','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Life OS','X-PUBLISHED-TTL:PT1H','REFRESH-INTERVAL;VALUE=DURATION:PT1H'];
    const tk=todayK();
    for(let i=-30;i<=90;i++){const dk=addK(tk,i),d=dayItems(dk);
      d.allDay.forEach(e=>{if(allDayOccStart(e.rec,dk)!==dk)return;const span=e.rec.end?daysBetween(e.rec.start,e.rec.end):0;
        L.push('BEGIN:VEVENT',`UID:${e.id}-${dk}@life-os`,`DTSTAMP:${stamp}`,`DTSTART;VALUE=DATE:${dt(dk)}`,`DTEND;VALUE=DATE:${dt(addK(dk,span+1))}`,fold(`SUMMARY:${esc(e.title)}`),'TRANSP:TRANSPARENT','END:VEVENT');});
      d.timed.forEach(e=>{if(e.kind==='gcal'||e.time==null)return;const end=e.time+(e.dur||30),ed=end>=1440?addK(dk,1):dk;
        L.push('BEGIN:VEVENT',`UID:${e.id}-${dk}@life-os`,`DTSTAMP:${stamp}`,`DTSTART:${dt(dk,e.time)}`,`DTEND:${dt(ed,end%1440)}`,fold(`SUMMARY:${esc((e.done?'✓ ':'')+e.title)}`),e.area?fold(`CATEGORIES:${esc(e.area)}`):null,e.kind==='task'||e.kind==='habit'?'TRANSP:TRANSPARENT':'TRANSP:OPAQUE','END:VEVENT');});}
    L.push('END:VCALENDAR');return L.filter(Boolean).join('\r\n')+'\r\n';
  },
  _sig:{},_t:null,
  /* after any change, quietly send the reminder schedule and calendar feed up (only when they changed) */
  afterChange(){
    const a=this.api();if(!a||store.mode!=='synced')return;clearTimeout(this._t);
    this._t=setTimeout(()=>{try{
      const s=get.settings();
      if(a.push&&a.push.wanted()){const rs=this.upcoming(),sig=JSON.stringify(rs);if(sig!==this._sig.r){this._sig.r=sig;a.setReminders(rs).catch(()=>{this._sig.r=null;});}}
      if(s.icsToken){const ics=this.ics(),sig=ics.replace(/DTSTAMP:\S+/g,'');if(sig!==this._sig.c){this._sig.c=sig;a.setCalFeed(s.icsToken,ics).catch(()=>{this._sig.c=null;});}}
    }catch(e){console.warn(e);}},2500);
  },
  feedUrl(tok){return `webcal://${location.host}/cal/${tok}.ics`;},
  newToken(){const b=new Uint8Array(18);crypto.getRandomValues(b);return [...b].map(x=>x.toString(16).padStart(2,'0')).join('');},
  /* extra rows on Settings pages */
  settings(id,group,page,setRow,ctx){
    const a=this.api();if(!this.on||!a)return;const s=get.settings();
    if(id==='reviews'){
      const p=a.push,g=group('Notifications');
      if(!p.supported()){g.append(el('div',{class:'li',style:'min-height:60px'},el('span',{class:'grow'},el('b',{style:'font-weight:500'},'Notifications'),el('small',{},p.why()))));return;}
      const on=p.wanted();
      setToggle(ctx,g,null,'Reminders when the app is closed','Sent to this device',on,async v=>{if(v){const r=await p.enable();if(r!=='ok'){toast(r==='denied'?'Notifications are off for Life OS in your phone’s Settings.':'Couldn’t turn on notifications. Try again.');App.refresh();return;}this._sig.r=null;this.afterChange();toast('Reminders will reach you here');}else{await p.disable();toast('Notifications off on this device');}App.refresh();});
      if(on)g.append(el('button',{class:'li',style:'min-height:52px;color:var(--accent-text);font-weight:600',onclick:async()=>{const r=await p.test();toast(r?'Sent. It should arrive in a few seconds.':'Couldn’t send a test. Check your connection.');}},'Send a test notification'));
    }else if(id==='calendar'){
      const g=group('On your iPhone calendar');
      if(!s.icsToken){g.append(setRow('Show Life OS in Apple Calendar','Your blocks, timed tasks and all-day items, updated about every hour',null,()=>{setSettings({icsToken:this.newToken(),icsAdded:false});this.afterChange();}));}
      else{const url=this.feedUrl(s.icsToken);
        const markF=()=>setSettings({icsAdded:true,foundation:{...(get.settings().foundation||{}),calendar:true}});
        const added=s.icsAdded===true||(s.icsAdded==null&&!!s.icsToken);/* links made before v66 were already subscribed */
        if(!added)g.append(el('a',{class:'li',href:url,style:'min-height:56px;color:var(--accent-text);font-weight:600;text-decoration:none',onclick:()=>setTimeout(markF,400)},'Subscribe in Calendar'));
        else g.append(el('div',{class:'li',style:'min-height:60px'},el('span',{class:'tick on',html:ic('check',14,3)}),el('span',{class:'grow'},el('b',{style:'font-weight:500'},'Added to Apple Calendar'),el('small',{},'Shows as “Life OS” in the Calendar app'))),
          setRow('Add it again','Only if it’s missing from the Calendar app',null,()=>askConfirm({title:'Add Life OS again?',body:'If Life OS is already in your Calendar app, this makes a second copy. You can delete extras in Calendar › Calendars › ⓘ › Delete Calendar.',yes:'Add again',no:'Cancel',danger:false,onYes:()=>{location.href=url;}})));
        g.append(
          setRow('Copy the link','For a Mac, or another calendar app',null,async()=>{try{await navigator.clipboard.writeText(url.replace('webcal://','https://'));toast('Link copied');}catch(e){toast(url);}setSettings({foundation:{...(get.settings().foundation||{}),calendar:true}});}),
          setRow('Turn off and make a new link','The old link stops working',null,()=>askConfirm({title:'Stop this calendar link?',body:'Calendars subscribed with the old link stop updating.',yes:'Make a new link',no:'Keep it',onYes:async()=>{const old=s.icsToken;await a.dropCalFeed(old).catch(()=>{});setSettings({icsToken:null,icsAdded:false});toast('Link turned off. Delete Life OS in the Calendar app too.');}})));
        page.append(el('p',{class:'small muted',style:'padding:0 4px'},'Read-only. Changes in Life OS show up the next time your phone refreshes the calendar.'));}
    }else if(id==='data'){
      const g=group('Account');g.append(el('div',{class:'li',style:'min-height:56px'},el('span',{class:'grow'},el('b',{style:'font-weight:500'},'Signed in'),el('small',{},a.email()||''))),
        el('button',{class:'li',style:'min-height:52px;color:var(--now);font-weight:600',onclick:()=>askConfirm({title:'Sign out?',body:'Your data stays in your account. Unsynced changes on this device are sent first.',yes:'Sign out',no:'Stay signed in',onYes:async()=>{flushAll();await new Promise(r=>setTimeout(r,900));try{localStorage.removeItem(CACHE);}catch(e){}await a.signOut();location.reload();}})},'Sign out'));
      g.append(setRow('Check for updates',`Version ${APP_VER}`,null,async()=>{const r=await a.checkUpdate(true);if(!r)toast('You have the latest version');}));
    }
  },
};

/* ---------- pull down from the top of any page to refresh ---------- */
/* The page stretches down with the finger and a ring fills in the gap above it. Past the
   threshold the ring turns solid; on release the page holds open while it syncs, the ring
   becomes an "Up to date" check for a moment, then the page slides back up. */
const PTR={max:96,at:64,hold:56,okMs:1000};
function pullRefresh(){
  const C=2*Math.PI*10;
  let y0=0,x0=0,d=0,on=false,busy=false,dead=false,box=null,raf=0;
  const view=()=>$('#view');
  const node=()=>box||(box=document.body.appendChild(el('div',{id:'ptr','aria-hidden':'true',html:`<div class="p-ring"><svg viewBox="0 0 28 28" width="28" height="28" fill="none"><circle cx="14" cy="14" r="10" stroke="var(--accent-soft)" stroke-width="3"/><circle class="p-arc" cx="14" cy="14" r="10" stroke="var(--h3)" stroke-width="3" stroke-linecap="round" stroke-dasharray="${C.toFixed(1)}" stroke-dashoffset="${C.toFixed(1)}"/></svg></div><div class="p-done"><span class="p-ck">${ic('check',13,3.2)}</span>Up to date</div>`})));
  const place=(y,ease)=>{const v=view(),b=node(),r=b.firstChild;
    if(v){v.classList.toggle('ptr-ease',!!ease);v.classList.add('ptr-move');v.style.transform=y>0?`translate3d(0,${y}px,0)`:'';}
    b.classList.toggle('p-ease',!!ease);r.style.transform=`translateY(${Math.round(y/2-14)}px)`;};
  const paint=v=>{const b=node(),p=Math.min(1,v/PTR.at),arc=b.querySelector('.p-arc');
    place(v,false);b.firstChild.style.opacity=String(Math.min(1,v/24));
    arc.style.strokeDashoffset=(C*(1-p)).toFixed(1);arc.style.stroke=v>=PTR.at?'var(--accent)':'var(--h3)';};
  const close=()=>{const b=node();place(0,true);b.firstChild.style.opacity='0';
    /* the "Up to date" pill rides up with the page instead of sitting over the date */
    let fly=null;if(b.classList.contains('p-ok')){const pd=b.querySelector('.p-done');fly=pd.animate([{transform:'none',opacity:1},{transform:`translateY(${-PTR.hold}px)`,opacity:1,offset:.6},{transform:`translateY(${-PTR.hold-12}px)`,opacity:0}],{duration:360,easing:'cubic-bezier(.2,.8,.2,1)',fill:'forwards'});}
    setTimeout(()=>{if(fly)fly.cancel();if(on||busy)return;b.classList.remove('p-ok','p-spin','p-ease');const v=view();if(v){v.classList.remove('ptr-ease','ptr-move');v.style.transform='';}},380);};
  const reset=()=>{if(!box)return;close();};
  const blocked=t=>sheetStack.length||busy||!!document.querySelector('.menu,.ghost,.lift')||(t&&t.closest&&t.closest('input,textarea,select,[contenteditable],.grid,.weekstrip,.sbody,.wcol,.hscroll,.dock,.mscrim'));
  const top=()=>(document.scrollingElement||document.documentElement).scrollTop;
  document.addEventListener('touchstart',e=>{on=false;dead=true;if(e.touches.length!==1||top()>0||blocked(e.target))return;dead=false;y0=e.touches[0].clientY;x0=e.touches[0].clientX;d=0;},{passive:true});
  document.addEventListener('touchmove',e=>{if(dead)return;const t=e.touches[0],dy=t.clientY-y0,dx=Math.abs(t.clientX-x0);
    if(!on){if(dx>12&&dx>dy){dead=true;return;}if(dy<8)return;if(top()>0||blocked()){dead=true;return;}on=true;node().classList.remove('p-ok','p-spin');}
    d=Math.max(0,Math.min(PTR.max,(dy-8)*0.55));if(document.querySelector('.ghost,.lift')){dead=true;on=false;reset();return;}
    cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>paint(d));},{passive:true});
  const end=async()=>{if(!on){dead=true;return;}on=false;dead=true;cancelAnimationFrame(raf);if(d<PTR.at){reset();return;}
    busy=true;const b=node(),arc=b.querySelector('.p-arc');
    arc.style.stroke='var(--accent)';arc.style.strokeDashoffset=(C*0.7).toFixed(1);b.firstChild.style.opacity='1';
    b.classList.add('p-spin');place(PTR.hold,true);
    try{navigator.vibrate&&navigator.vibrate(8);}catch(e){}
    const t0=Date.now();try{const a=window.lifeosPWA;if(a&&a.refresh)await a.refresh();}catch(e){}
    App.refresh();await new Promise(r=>setTimeout(r,Math.max(0,700-(Date.now()-t0))));
    b.classList.remove('p-spin');b.classList.add('p-ok');try{navigator.vibrate&&navigator.vibrate(6);}catch(e){}
    await new Promise(r=>setTimeout(r,PTR.okMs));busy=false;close();};
  document.addEventListener('touchend',end,{passive:true});document.addEventListener('touchcancel',()=>{if(on){on=false;dead=true;reset();}},{passive:true});
}
pullRefresh();
