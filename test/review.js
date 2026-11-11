const {chromium}=require('playwright');const fs=require('fs');const out={};
const T='2026-11-03';const D=n=>{const x=new Date(T+'T12:00:00');x.setDate(x.getDate()+n);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,'0')}-${String(x.getDate()).padStart(2,'0')}`;};
(async()=>{
 fs.writeFileSync('test/page.html',fs.readFileSync('test/page.html','utf8').replace(/<body>[\s\S]*$/,'<body>')+fs.readFileSync('life-os.html','utf8')+'</body></html>');
 const b=await chromium.launch();const errs=[];
 const open=async(vp,touch)=>{const c=await b.newContext({viewport:vp,hasTouch:!!touch,isMobile:!!touch});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));await p.clock.install({time:new Date(T+'T10:07:00')});await p.goto('file://'+process.cwd()+'/test/page.html');await p.clock.runFor(400);return p;};
 const st=async(p,ms=400)=>{await p.waitForTimeout(40);await p.clock.runFor(ms);await p.waitForTimeout(40);};
 const go=async(p,v,params)=>{await p.evaluate(([v,params])=>window.__lifeos.App.go(v,params||{}),[v,params]);await st(p);};
 const p=await open({width:390,height:844},true);const rp={type:'never',end:null};
 // ---- Recurrence edge cases (pure)
 out.recurrence=await p.evaluate(()=>{const l=window.__lifeos;const on=(start,rep,dk)=>{const r=l.create('task',{title:'rc',steps:[],date:start,time:null,repeat:rep,priority:'normal'});const v=l.dayItems(dk).anytime.some(e=>e.id===r.id);l.remove(r.id,{silent:true});return v;};
  return{monthly31InNov:on('2026-10-31',{type:'custom',unit:'month',n:1},'2026-11-30'),monthly31InDec:on('2026-10-31',{type:'custom',unit:'month',n:1},'2026-12-31'),leapYearly:on('2028-02-29',{type:'custom',unit:'year',n:1},'2029-02-28'),biweeklyAcrossDST:on('2026-10-26',{type:'custom',unit:'week',n:2,days:[0]},'2026-11-09'),biweeklyOffWeek:on('2026-10-26',{type:'custom',unit:'week',n:2,days:[0]},'2026-11-02'),endRespected:on('2026-11-01',{type:'custom',unit:'day',n:1,end:'2026-11-05'},'2026-11-06')};});
 // ---- Tasks hub with repeating
 await p.evaluate(({D,rp})=>{},{});
 const seedRep=await p.evaluate(()=>window.__lifeos.create('task',{title:'Repeat water plants',steps:[],date:'2026-10-01',time:null,repeat:{type:'custom',unit:'day',n:1,end:null},priority:'normal'}).id);
 await go(p,'tasks');out.tasksRepeatingSub=await p.locator('.li',{hasText:'Repeat water plants'}).innerText();
 await p.locator('.li',{hasText:'Repeat water plants'}).locator('.tick').click();await st(p,700);out.tasksTickRepeatingMarks=await p.evaluate(id=>Object.keys(window.__lifeos.get.id(id).doneDates||{}),seedRep);
 await p.evaluate(id=>window.__lifeos.remove(id),seedRep);await st(p);
 // ---- Part-of links
 const ids=await p.evaluate(()=>{const l=window.__lifeos,rp={type:'never',end:null};const g=l.create('goal',{title:'Goal X',area:'Health',steps:[{id:'g1',t:'Step one',d:false},{id:'g2',t:'Step two',d:false}],status:'active',color:'sage'});const t=l.create('task',{title:'Linked task',steps:[],date:null,time:null,repeat:rp,part:g.id,priority:'normal'});const h=l.create('habit',{title:'Linked habit',target:3,dur:30,days:[],logs:{},sessions:{},part:g.id,color:'sage'});const pr=l.create('project',{title:'Linked project',steps:[{id:'p1',t:'P step',d:false}],part:g.id,color:'sage'});return{g:g.id,pr:pr.id};});
 await go(p,'plan',{id:ids.g});const planTxt=await p.locator('#view').innerText();out.goalShowsLinked={task:planTxt.includes('Linked task'),habit:planTxt.includes('Linked habit'),project:planTxt.includes('Linked project')};
 await p.screenshot({path:'test/r-plan.png'});
 for(const s of ['g1','g2']){await p.locator('.li',{hasText:s==='g1'?'Step one':'Step two'}).locator('.tick').click();await st(p,300);}await st(p);const pa=await p.locator('#view').innerText();out.goalAllDoneOffersComplete=/achieved/i.test(pa);
 // ---- Studio hand-down: quarter → month → week
 for(let i=0;i<2;i++){if(await p.locator('.sheet.on').count()){await p.keyboard.press('Escape');await st(p);}}await p.evaluate(()=>scrollTo(0,0));
 await p.evaluate(()=>{const l=window.__lifeos;const g=l.create('project',{title:'Handdown',steps:[],color:'sage'});const d=new Date();d.setDate(d.getDate()+60);l.create('task',{title:'Milestone A',notes:'',steps:[],date:null,time:null,deadline:l.todayK().slice(0,0)+d.toISOString().slice(0,10),repeat:{type:'never',end:null},priority:'normal',part:g.id,order:0});});
 const firstSlot=async()=>p.evaluate(()=>{const s=[...document.querySelectorAll('.slot:not(.past)')];return s.length?s[0].dataset.slot:null;});
 await p.evaluate(()=>{window.__lifeos.App.state.studio={mode:'q',anchor:null,selCard:null,ghosts:[]};});await go(p,'studio');
 await p.locator('.scard',{hasText:'Milestone A'}).first().focus();await p.keyboard.press('Enter');await st(p,60);let sl0=await firstSlot();await p.locator(`.slot[data-slot="${sl0}"]`).getByRole('button',{name:'Place here'}).click({force:true});await st(p);
 await p.getByRole('button',{name:'Month',exact:true}).click();await st(p);out.monthDockHasMilestone=await p.locator('.scard',{hasText:'Milestone A'}).count();
 await p.locator('.scard',{hasText:'Milestone A'}).first().focus();await p.keyboard.press('Enter');await st(p,60);sl0=await firstSlot();await p.locator(`.slot[data-slot="${sl0}"]`).getByRole('button',{name:'Place here'}).click({force:true});await st(p);
 await p.getByRole('button',{name:'Week',exact:true}).click();await st(p);out.weekThisHasMilestone=await p.locator('.scard',{hasText:'Milestone A'}).count();
 await p.getByRole('button',{name:'Next'}).click();await st(p);out.weekNextHasMilestone=await p.locator('.scard',{hasText:'Milestone A'}).count();
 await p.screenshot({path:'test/r-studio.png'});
 await p.evaluate(()=>scrollTo(0,0));
 // studio touch drag
 await p.evaluate(()=>{const l=window.__lifeos;l.App.state.studio.anchor='2026-11-02';l.App.refresh();});await st(p);
 const cdp=await p.context().newCDPSession(p);const touch=(t,x,y)=>cdp.send('Input.dispatchTouchEvent',{type:t,touchPoints:t==='touchEnd'?[]:[{x,y}]});
 const card=p.locator('.scard',{hasText:'Linked task'});const cb=await card.boundingBox();const sl=await p.locator('.slot:not(.past)').nth(1).boundingBox();
 out.dockAndSlotInView={card:cb&&cb.y,slot:sl&&sl.y,view:844};
 if(cb&&sl&&sl.y<760){await touch('touchStart',cb.x+50,cb.y+30);await st(p,350);await touch('touchMove',cb.x+50,cb.y+70);await st(p,50);await touch('touchMove',sl.x+80,sl.y+25);await st(p,80);await touch('touchEnd');await st(p,200);out.studioTouchPlaced=await p.evaluate(()=>window.__lifeos.get.all('task').find(t=>t.title==='Linked task').date);}
 const fab=await p.locator('.fab').boundingBox();const cbar=await p.locator('#commitbar').boundingBox();const cm=await p.locator('#commitbar .btn').boundingBox();out.commitBar={fabTop:fab.y,fabRight:fab.x+fab.width,fabLeft:fab.x,barTop:cbar.y,barBottom:cbar.y+cbar.height,btnLeft:cm.x,btnRight:cm.x+cm.width};
 await p.screenshot({path:'test/r-studio2.png'});
 // suggest honours working hours? placement by day only
 // ---- Idea → goal/habit/list: photos survive?
 const photo='data:image/gif;base64,R0lGODlhAQABAAAAACw=';
 for(const kind of ['Habit','Goal','Project','Resource','Time block','All-day','Task']){
  const id=await p.evaluate(u=>window.__lifeos.create('idea',{title:'Photo idea',notes:'',photos:[{id:null,url:u}],source:null}).id,photo);
  await p.evaluate(id=>{window.__lifeos.App.go('inbox');},id);await st(p);await p.locator('.li',{hasText:'Photo idea'}).click();await st(p,500);await p.locator('.sheet.on .tl',{hasText:kind}).first().click();await st(p,700);
  if(kind==='List item'){await p.fill('#f-newlist','L'+Math.random());await p.locator('.sheet.on').getByRole('button',{name:'Create list and add'}).click();}
  else await p.locator('.sheet.on').getByRole('button',{name:'Add',exact:true}).click();
  await st(p,800);
  const r=await p.evaluate(()=>{const l=window.__lifeos;const ideas=l.get.all('idea').filter(i=>i.title==='Photo idea').length;const found=[...l.recs.values()].filter(x=>x.kind!=='idea'&&x.title==='Photo idea');const f=found[found.length-1];found.forEach(x=>l.remove(x.id,{silent:true}));return{ideas,kind:f&&f.kind,photos:f?(f.photos||[]).length:null};});
  (out.ideaPhotos=out.ideaPhotos||{})[kind]=r;
  await p.evaluate(()=>{const l=window.__lifeos;l.get.all('idea').filter(i=>i.title==='Photo idea').forEach(i=>l.remove(i.id,{silent:true}));});await st(p);
 }
 // ---- Lists: rename, edit item?
 const lid=await p.evaluate(()=>window.__lifeos.create('list',{title:'My list',items:[{id:'i1',t:'Item 1',d:false}]}).id);await go(p,'list',{id:lid});out.listCanEditItem=await p.locator('.li input').count();await p.getByRole('button',{name:'List options'}).click();await st(p,100);out.listMenu=await p.locator('.menu').innerText();await st(p,500);await p.evaluate(()=>document.querySelector('.mscrim').click());await st(p);
 // ---- Routines on Today?
 const rid=await p.evaluate(()=>window.__lifeos.create('routine',{title:'Morning',steps:[{id:'a',t:'Water',min:1},{id:'b',t:'Stretch',min:1}]}).id);await go(p,'today');out.routineOnToday=(await p.locator('#view').innerText()).includes('Morning');
 await go(p,'routine',{id:rid});await p.getByRole('button',{name:'Run routine'}).click();await st(p);await p.clock.runFor(5000);await p.waitForTimeout(30);out.routineTimer=await p.locator('.timer').innerText();await p.getByRole('button',{name:'Done',exact:true}).click();await st(p);out.routineRunningAfterNext=await p.getByRole('button',{name:'Pause'}).count();await p.getByRole('button',{name:'Done',exact:true}).click();await st(p);out.routineDone=(await p.locator('#view').innerText()).includes('complete');await p.getByRole('button',{name:'Finish'}).click();await st(p);
 // ---- Search
 await go(p,'search');await p.fill('#q','step');await st(p,100);out.searchTypes=await p.locator('.fchips .chip').allInnerTexts();await p.screenshot({path:'test/r-search.png'});out.searchChipsRawText=(await p.locator('.fchips').innerText()).slice(0,200);await p.fill('#q','');
 await p.fill('#q','zzzz');await st(p,60);out.searchEmpty=await p.locator('.empty').innerText();await p.fill('#q','');await p.getByRole('button',{name:'Cancel'}).click();await st(p);
 // ---- Navigation with no Today/Calendar in bar
 await p.evaluate(()=>{const l=window.__lifeos,s=l.get.settings();l.put(Object.assign({},s,{id:'settings',kind:'settings',nav:['inbox','tasks','habits']}));});await go(p,'more');const moreT=await p.locator('#view').innerText();out.moreLinksToday=/Today/.test(moreT);out.moreLinksCalendar=/Calendar/.test(moreT);out.moreLinksStudio=/Studio/.test(moreT);
 await p.reload();await st(p);out.startViewWhenTodayNotInBar=await p.evaluate(()=>window.__lifeos.App.state.view);out.navActive=await p.locator('.nav .tab.act').innerText().catch(()=>null);
 await p.evaluate(()=>{const l=window.__lifeos,s=l.get.settings();l.put(Object.assign({},s,{id:'settings',kind:'settings',nav:['today','studio','calendar']}));});await st(p);
 // ---- long words / overflow
 const longW='Supercalifragilisticexpialidocious'.repeat(4);
 await p.evaluate(w=>{const l=window.__lifeos,rp={type:'never',end:null},t=l.todayK();l.create('task',{title:w,steps:[],date:t,time:null,repeat:rp,priority:'normal'});l.create('block',{title:w,date:t,start:600,dur:30,repeat:rp,color:'sage'});l.create('allday',{title:w,start:t,end:null,repeat:rp,color:'sage'});l.create('habit',{title:w,target:3,dur:30,days:[],logs:{},sessions:{},color:'sage'});l.create('goal',{title:w,steps:[{id:'z',t:w,d:false}],color:'sage'});l.create('list',{title:w,items:[{id:'q',t:w,d:false}]});l.create('idea',{title:w,photos:[],notes:''});},longW);
 out.overflow={};for(const v of ['today','studio','calendar','tasks','habits','goals','inbox','lists','search','more','areas','tools']){await go(p,v);if(await p.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1))out.overflow[v]=true;}
 out.overflowClipped=await p.evaluate(()=>0);
 // ---- contrast
 out.contrast=await p.evaluate(()=>{const lum=c=>{const a=c.match(/\d+(\.\d+)?/g).slice(0,3).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);});return .2126*a[0]+.7152*a[1]+.0722*a[2];};const ratio=(f,b)=>{const[x,y]=[lum(f),lum(b)].sort((a,b)=>b-a);return Math.round((x+.05)/(y+.05)*100)/100;};const v=n=>{const d=document.createElement('i');d.style.color=`var(${n})`;document.body.append(d);const c=getComputedStyle(d).color;d.remove();return c;};return{ink3OnBg:ratio(v('--ink-3'),v('--bg')),ink3OnCard:ratio(v('--ink-3'),v('--card')),ink2OnBg:ratio(v('--ink-2'),v('--bg')),accentTextOnBg:ratio(v('--accent-text'),v('--bg')),whiteOnH3:ratio('rgb(255,255,255)',v('--h3')),inkOnH3:ratio(v('--ink'),v('--h3')),ink2OnH2:ratio(v('--ink-2'),v('--h2')),whiteOnNow:ratio('rgb(255,255,255)',v('--now'))};});
 // ---- focus inside sheets
 await go(p,'today');await p.getByRole('button',{name:'+ Task'}).first().click();await st(p,500);const seq=[];for(let i=0;i<60;i++){await p.keyboard.press('Tab');const inSheet=await p.evaluate(()=>{const a=document.activeElement;return !!(a&&a.closest&&a.closest('.sheet'));});seq.push(inSheet);if(!inSheet)break;}out.tabLeavesSheet=seq.includes(false);await p.keyboard.press('Escape');await st(p,300);if(await p.getByRole('button',{name:'Discard'}).count())await p.getByRole('button',{name:'Discard'}).click();await st(p,500);
 // ---- targets under 44
 out.smallTargets=await p.evaluate(()=>{const seen={};document.querySelectorAll('#view button,.nav button').forEach(b=>{const r=b.getBoundingClientRect();if(r.width&&(r.height<40||r.width<32)){const k=b.className||b.getAttribute('aria-label')||b.innerText.slice(0,14);seen[k]=`${Math.round(r.width)}x${Math.round(r.height)}`;}});return seen;});
 // ---- Archive + backup
 const gid=await p.evaluate(()=>window.__lifeos.get.all('goal')[0].id);await p.evaluate(id=>{const l=window.__lifeos,g=l.get.id(id);g.archived=true;g.archivedAt=Date.now();l.put(g);},gid);await go(p,'archive');await p.screenshot({path:'test/r-archive.png'});out.archiveCount=await p.locator('.sw-wrap').count();
 await go(p,'prefs');await p.screenshot({path:'test/r-prefs.png',fullPage:true});out.settingsLabels=await p.locator('#view b').allInnerTexts();
 await go(p,'foundation');out.foundation=await p.locator('#view .li b').allInnerTexts();
 await go(p,'discover');await p.screenshot({path:'test/r-discover.png'});
 await go(p,'insights');out.insightsHasData=(await p.locator('#view').innerText()).slice(0,180);
 await go(p,'review');out.reviewStep1=(await p.locator('#view').innerText()).slice(0,120);
 out.errs=errs;
 console.log(JSON.stringify(out,null,1));await b.close();
})().catch(e=>{console.log('CRASH',e.message.slice(0,500));console.log(JSON.stringify(out,null,1));process.exit(1);});
