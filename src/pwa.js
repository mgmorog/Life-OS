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
      if(!s.icsToken){g.append(setRow('Show Life OS in Apple Calendar','Your blocks, timed tasks and all-day items, updated about every hour',null,()=>{setSettings({icsToken:this.newToken()});this.afterChange();}));}
      else{const url=this.feedUrl(s.icsToken);
        g.append(el('a',{class:'li',href:url,style:'min-height:56px;color:var(--accent-text);font-weight:600;text-decoration:none'},'Subscribe in Calendar'),
          setRow('Copy the link','For a Mac, or another calendar app',null,async()=>{try{await navigator.clipboard.writeText(url.replace('webcal://','https://'));toast('Link copied');}catch(e){toast(url);}}),
          setRow('Turn off and make a new link','The old link stops working',null,()=>askConfirm({title:'Stop this calendar link?',body:'Calendars subscribed with the old link stop updating.',yes:'Make a new link',no:'Keep it',onYes:async()=>{const old=s.icsToken;await a.dropCalFeed(old).catch(()=>{});setSettings({icsToken:null});toast('Link turned off');}})));
        page.append(el('p',{class:'small muted',style:'padding:0 4px'},'Read-only. Changes in Life OS show up the next time your phone refreshes the calendar.'));}
    }else if(id==='data'){
      const g=group('Account');g.append(el('div',{class:'li',style:'min-height:56px'},el('span',{class:'grow'},el('b',{style:'font-weight:500'},'Signed in'),el('small',{},a.email()||''))),
        el('button',{class:'li',style:'min-height:52px;color:var(--now);font-weight:600',onclick:()=>askConfirm({title:'Sign out?',body:'Your data stays in your account. Unsynced changes on this device are sent first.',yes:'Sign out',no:'Stay signed in',onYes:async()=>{flushAll();await new Promise(r=>setTimeout(r,900));try{localStorage.removeItem(CACHE);}catch(e){}await a.signOut();location.reload();}})},'Sign out'));
      g.append(setRow('Check for updates',`Version ${APP_VER}`,null,async()=>{const r=await a.checkUpdate(true);if(!r)toast('You have the latest version');}));
    }
  },
};
