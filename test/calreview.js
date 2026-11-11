const {chromium}=require('playwright');const fs=require('fs');
const off=n=>{const d=new Date('2026-11-03T12:00:00');d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const out={};
const seed=({off0})=>{};
(async()=>{
 const b=await chromium.launch();
 const open=async(vp,touch=false)=>{const c=await b.newContext({viewport:vp,hasTouch:touch,isMobile:touch});const p=await c.newPage();p._errs=[];p.on('pageerror',e=>p._errs.push(e.message));await p.clock.install({time:new Date('2026-11-03T10:07:00')});await p.goto('file://'+process.cwd()+'/test/page.html');await p.clock.runFor(400);
  await p.evaluate(()=>{const l=window.__lifeos,rp={type:'never',end:null},d=n=>{const x=new Date('2026-11-03T12:00:00');x.setDate(x.getDate()+n);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;};
   for(let i=0;i<7;i++)l.create('task',{title:'Busy '+i,steps:[],date:d(1),time:null,repeat:rp,priority:'normal',area:'Home'});
   for(let i=0;i<3;i++)l.create('task',{title:'Mid '+i,steps:[],date:d(2),time:null,repeat:rp,priority:'normal',area:'Career'});
   l.create('block',{title:'Long meeting',date:d(0),start:13*60,dur:180,repeat:rp,color:'sage',area:'Career'});
   l.create('allday',{title:'Trip',start:d(3),end:d(5),repeat:rp,color:'blue',icon:'plane'});
   l.create('allday',{title:'Birthday',start:d(4),end:null,repeat:rp,color:'plum',icon:'cake'});
   l.create('allday',{title:'Third',start:d(4),end:null,repeat:rp,color:'rose'});
   l.create('task',{title:'Past open',steps:[],date:d(-1),time:null,repeat:rp,priority:'normal'});
   l.create('task',{title:'No date',steps:[],date:null,time:null,repeat:rp,priority:'normal'});
   l.create('goal',{title:'G',area:'Health',steps:[{id:'a',t:'one',d:true},{id:'b',t:'two',d:false}],status:'active'});
   l.App.go('calendar');});await p.waitForTimeout(40);await p.clock.runFor(300);await p.waitForTimeout(40);return p;};
 const settle=async p=>{await p.waitForTimeout(40);await p.clock.runFor(400);await p.waitForTimeout(40);};
 const p=await open({width:390,height:844},true);
 await p.screenshot({path:'test/c-q.png'});
 out.earlierLabel=await p.getByRole('button',{name:/earlier weeks/}).innerText();
 out.stickyHeaderPx=await p.evaluate(()=>document.getElementById('cal-h').getBoundingClientRect().height);
 await p.getByRole('button',{name:/earlier weeks/}).click();await settle(p);
 out.rowsAfterExpand=await p.evaluate(()=>[...document.querySelectorAll('#cal-body section')].map(s=>({m:s.querySelector('.m-head').innerText,rows:s.querySelectorAll('.heat-row').length,first:s.querySelector('.heat-row').innerText.replace(/\s+/g,' ')})));
 await p.evaluate(()=>scrollTo(0,99999));await settle(p);
 out.lastClearsFab=await p.evaluate(()=>{const k=document.querySelector('.heat-key').getBoundingClientRect(),n=document.querySelector('.nav').getBoundingClientRect();return{keyBottom:k.bottom,navTop:n.top};});
 await p.screenshot({path:'test/c-q-scrolled.png'});
 out.stickyWhileScrolled=await p.evaluate(()=>document.getElementById('cal-h').getBoundingClientRect().height/innerHeight);
 // mode switch while scrolled
 await p.locator('#cal-h').getByRole('button',{name:'Week',exact:true}).click();await settle(p);out.scrollAfterSwitchToWeek=await p.evaluate(()=>scrollY);
 await p.screenshot({path:'test/c-w.png'});
 // week interactions
 const row=p.locator('.wkrow').nth(2);out.weekRowHasDrag=await p.evaluate(()=>!!document.querySelector('.wkrow .it'));
 await p.locator('.wkrow').nth(2).click();await settle(p);await p.screenshot({path:'test/c-w-open.png'});
 out.weekPanelOpened=await p.locator('#cal-body .card').count();
 const it=await p.locator('.wkrow .it').first().boundingBox();
 const cdp=await p.context().newCDPSession(p);
 if(it){await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:it.x+60,y:it.y+8}]});await p.waitForTimeout(40);await p.clock.runFor(600);await p.waitForTimeout(40);out.weekLongPress={menu:await p.locator('.menu').count(),lift:await p.locator('.lift').count()};await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await settle(p);await p.evaluate(()=>document.querySelector('.mscrim')?.click());await settle(p);}
 // month
 await p.evaluate(()=>scrollTo(0,0));await p.locator('#cal-h').getByRole('button',{name:'Month',exact:true}).click();await settle(p);await p.screenshot({path:'test/c-m.png',fullPage:true});
 out.monthCells=await p.evaluate(()=>{const c=document.querySelector('.heat');const r=c.getBoundingClientRect();return{w:r.width,h:r.height};});
 out.heatLevels=await p.evaluate(()=>[...document.querySelectorAll('.heat')].filter(x=>/l[1-4]/.test(x.className)).map(x=>x.innerText+':'+x.className.match(/l[1-4]/)[0]));
 out.adBars=await p.evaluate(()=>[...document.querySelectorAll('.heat')].filter(x=>x.querySelector('.adbars')).map(x=>x.innerText.trim()+':'+x.querySelectorAll('.adbars i').length));
 out.todayAndSel=await p.evaluate(()=>{const t=document.querySelector('.heat.today');return t.className;});
 // out-of-month tap
 const before=await p.evaluate(()=>window.__lifeos.App.state.cal.anchor);await p.locator('.heat.out').last().click();await settle(p);out.outTap={before,after:await p.evaluate(()=>window.__lifeos.App.state.cal.anchor),title:await p.locator('#cal-h .tbtn').innerText()};
 await p.getByRole('button',{name:'Today',exact:true}).first().click();await settle(p);
 // day card overflow
 await p.locator('.heat',{hasText:/^4$/}).first().click();await settle(p);out.dayCardBusy=await p.locator('#cal-body .card').innerText();
 // picker + filter sheets
 await p.locator('#cal-h .tbtn').click();await settle(p);await p.screenshot({path:'test/c-pick.png'});out.pickerNowPill=(await p.locator('.sheet.on').innerText()).includes('Now');await p.locator('.sheet.on').getByRole('button',{name:'Nov',exact:true}).click();await settle(p);out.pickCurrentMonthSel=await p.evaluate(()=>window.__lifeos.App.state.cal.sel);
 await p.getByRole('button',{name:'Filters'}).click();await settle(p);await p.screenshot({path:'test/c-filter.png'});
 out.filter=await p.evaluate(()=>{const s=document.querySelector('.sheet.on');return{h:s.getBoundingClientRect().height,hasHeat:s.innerText.includes('HEAT MAP')||s.innerText.includes('Heat map'),scroll:s.querySelector('.sbody').scrollHeight>s.querySelector('.sbody').clientHeight,buttons:[...s.querySelectorAll('.shead button')].map(x=>x.innerText)};});
 // filter by area hides, dot appears; does it affect Today?
 await p.locator('.sheet.on .chip',{hasText:'Career'}).click();await p.locator('.sheet.on').getByRole('button',{name:'Done'}).click();await settle(p);
 out.filterDot=await p.locator('.iconbtn .dot').count();
 out.filterEffect=await p.evaluate(()=>[...document.querySelectorAll('.heat')].filter(x=>/l[1-4]/.test(x.className)).map(x=>x.innerText));
 await p.evaluate(()=>window.__lifeos.App.go('today'));await settle(p);out.todayIgnoresFilter=await p.evaluate(()=>document.body.innerText.includes('Past open'));
 await p.evaluate(()=>window.__lifeos.App.go('calendar'));await settle(p);
 await p.getByRole('button',{name:'Filters'}).click();await settle(p);await p.locator('.sheet.on').getByRole('button',{name:'Reset'}).click();await settle(p);
 // focus
 await p.locator('#cal-h').getByRole('button',{name:'Week',exact:true}).click();await settle(p);await p.locator('.focus-chip').first().click();await settle(p);await p.locator('.sheet.on .chip',{hasText:'Health'}).click();await p.locator('.sheet.on').getByRole('button',{name:'Done'}).click();await settle(p);await p.screenshot({path:'test/c-focus.png'});out.weekFocus=await p.locator('.bars').innerText();
 await p.getByRole('button',{name:'Next week'}).click();await settle(p);out.nextWeekFocusEmpty=await p.locator('.focus-chip').count();await p.getByRole('button',{name:'Previous week'}).click();await settle(p);
 // Plan in Studio target
 await p.getByRole('button',{name:'Plan in Studio ›'}).first().click();await settle(p);out.planInStudio=await p.evaluate(()=>[window.__lifeos.App.state.view,window.__lifeos.App.state.studio.mode,window.__lifeos.App.state.studio.anchor]);
 await p.evaluate(()=>window.__lifeos.App.go('calendar'));await settle(p);
 // add from day card defaults
 await p.locator('.wkrow').nth(4).click();await settle(p);await p.getByRole('button',{name:'+ Time block'}).click();await settle(p);out.addBlockDate=((await p.locator('.sheet.on').innerText()).match(/(Mon|Tue|Wed|Thu|Fri|Sat|Sun|Today|Tomorrow)[a-z]*,? ?([A-Z][a-z]+ \d+)?/)||[''])[0];await p.locator('.sheet.on').getByRole('button',{name:'Cancel'}).click();await settle(p);
 out.phoneErrs=p._errs;
 // narrow: longest titles
 const n=await open({width:320,height:640},true);
 for(const [mode,anchor] of [['week','2026-12-30'],['week','2026-09-30'],['month','2026-09-15'],['quarter','2026-11-03']]){await n.evaluate(([m,a])=>{const S=window.__lifeos.App.state;S.cal.mode=m;S.cal.anchor=a;window.__lifeos.App.refresh();},[mode,anchor]);await settle(n);out['narrow-'+mode+anchor]=await n.evaluate(()=>{const t=document.querySelector('.cal-title'),a=t.querySelector('.tbtn').getBoundingClientRect(),b=t.querySelector('.arrows').getBoundingClientRect();return{overlap:a.right>b.left,overflow:document.documentElement.scrollWidth>innerWidth,tbtn:a.width,cell:document.querySelector('.heat')?document.querySelector('.heat').getBoundingClientRect().width:null};});}
 await n.screenshot({path:'test/c-narrow.png'});out.stickyAt640=await n.evaluate(()=>document.getElementById('cal-h').getBoundingClientRect().height);
 // Sunday start
 await n.evaluate(()=>{const l=window.__lifeos;const s=l.get.settings();l.put(Object.assign({},s,{id:'settings',kind:'settings',weekStart:0}));l.App.state.cal.anchor='2026-11-03';l.App.state.cal.mode='month';l.App.refresh();});await settle(n);out.sundayLabels=await n.locator('.wd-row').first().innerText();out.sundayFirstRow=await n.locator('.heat-row').first().innerText();
 // desktop
 const w=await open({width:1280,height:800});await w.screenshot({path:'test/c-wide-q.png'});
 await w.getByRole('button',{name:'Month',exact:true}).click();await settle(w);await w.screenshot({path:'test/c-wide-m.png'});
 await w.locator('.tbtn').first().click();await settle(w);out.widePicker=await w.evaluate(()=>{const s=document.querySelector('.sheet.on').getBoundingClientRect();return{x:s.x,y:s.y,w:s.width,h:s.height};});await w.keyboard.press('Escape');await settle(w);
 await w.keyboard.press('ArrowRight');await settle(w);out.wideArrowKey=await w.locator('.tbtn').first().innerText();
 const hc=w.locator('.heat',{hasText:/^4$/}).first();await hc.click({button:'right'});await settle(w);out.wideRightClickCell=await w.locator('.menu').count();await w.keyboard.press('Escape');await settle(w);
 await w.getByRole('button',{name:'Week',exact:true}).click();await settle(w);const wi=await w.locator('.wkrow .it').first().boundingBox({timeout:3000}).catch(()=>null);if(wi){await w.mouse.click(wi.x+60,wi.y+8,{button:'right'});await settle(w);out.wideRightClickWeekItem=await w.locator('.menu').count();await w.keyboard.press('Escape');
  const wr=await w.locator('.wkrow').nth(5).boundingBox({timeout:3000}).catch(()=>null);if(wr){await w.mouse.move(wi.x+60,wi.y+8);await w.mouse.down();await w.mouse.move(wr.x+80,wr.y+20,{steps:6});await w.mouse.up();await settle(w);}out.wideDragWeekItemGhost='no drag wired';}
 out.wideErrs=w._errs;
 // performance
 const f=await open({width:390,height:844});
 const t=await f.evaluate(()=>{const l=window.__lifeos,rp={type:'never',end:null};for(let i=0;i<1500;i++)l.put({id:'x'+i,kind:'task',title:'T'+i,steps:[],date:'2026-1'+(1+i%2)+'-'+String(1+i%28).padStart(2,'0'),time:null,repeat:i%20?rp:{type:'custom',unit:'day',n:1,end:null},priority:'normal',createdAt:1},{silent:true});const S=l.App.state,r={};for(const m of ['quarter','month','week']){S.cal.mode=m;const a=performance.now();l.App.render();r[m]=Math.round(performance.now()-a);}return r;});out.renderMs1500=t;
 console.log(JSON.stringify(out,null,1));await b.close();
})().catch(e=>{console.log('CRASH',e.message.slice(0,600));console.log(JSON.stringify(out,null,1));process.exit(1);});
