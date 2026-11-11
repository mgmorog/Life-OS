const {chromium}=require('playwright');const fs=require('fs');
const out={};const fails=[];let pass=0;const ok=(c,m)=>{if(c)pass++;else fails.push(m);};
const flow=fs.readFileSync('test/flow.js','utf8');const mock=flow.match(/const mock=`([\s\S]*?)`;\n/)[1];
const mods=fs.readFileSync('test/modules.js','utf8');
const K=n=>{const d=new Date();d.setDate(d.getDate()+n);const p=x=>String(x).padStart(2,'0');return `${d.getFullYear()}-${p(d.getMonth()+1)}-${p(d.getDate())}`;};
const tk=K(0),rep={type:'never',end:null};
const t=(id,title,o)=>({id,kind:'task',title,steps:[],date:tk,time:null,repeat:rep,reminder:null,deadline:null,priority:'normal',createdAt:1,...o});
const seed={
 a:t('a','Past due task',{date:K(-2)}),b:t('b','Loose task',{}),c:t('c','Timed task',{time:600,reminder:0}),
 d:{id:'d',kind:'block',title:'Deep work',date:tk,start:840,dur:90,repeat:rep,reminder:null,color:'sage',createdAt:1},
 h1:{id:'h1',kind:'habit',title:'Stretch',days:[0,1,2,3,4,5,6],target:7,setTime:480,tod:'set',color:'sage',logs:{},sessions:{},createdAt:1},
 h2:{id:'h2',kind:'habit',title:'Water',days:[0,1,2,3,4,5,6],target:7,track:'count',goalN:4,unit:'glasses',color:'sage',logs:{[tk]:2},sessions:{},createdAt:1},
 h3:{id:'h3',kind:'habit',title:'Paused one',days:[0,1,2,3,4,5,6],target:7,paused:true,color:'sage',logs:{},sessions:{},createdAt:1},
 h4:{id:'h4',kind:'habit',title:'Run',target:3,color:'sage',logs:{},sessions:{},createdAt:1},
 r1:{id:'r1',kind:'routine',title:'Morning run-through',days:[0,1,2,3,4,5,6],setTime:420,steps:[{id:'x',t:'Stretch',min:10,habit:'h1'}],createdAt:1},
 r2:{id:'r2',kind:'routine',title:'Anytime reset',days:[0,1,2,3,4,5,6],steps:[{id:'y',t:'Tidy',min:5}],createdAt:1},
 p1:{id:'p1',kind:'project',title:'Held project',paused:true,steps:[],createdAt:1},pt:t('pt','Task in held project',{part:'p1'}),
 settings:{id:'settings',kind:'settings',calendar:{on:true,declined:false,chips:true,busy:true},nav:['today','studio','calendar'],weekStart:1,createdAt:1},
};
const events=[{id:'e1',summary:'Team sync',status:'confirmed',start:{dateTime:`${tk}T14:30:00`},end:{dateTime:`${tk}T15:30:00`}},{id:'e2',summary:'Conference',status:'confirmed',start:{date:`${tk}T00:00:00Z`},end:{date:`${K(1)}T00:00:00Z`}},{id:'e4',summary:'Overnight',status:'confirmed',start:{dateTime:`${tk}T23:00:00`},end:{dateTime:`${K(1)}T01:00:00`}}];
const mcp=`(function(){const u=window.claude.use;window.claude.use=async n=>{if(n==='mcp')return{callTool:async()=>({payload:{events:${JSON.stringify(events)}}})};return u(n);};})();`;
(async()=>{
 const b=await chromium.launch();
 const wrap=fs.readFileSync('test/page.html','utf8').replace(/<body>[\s\S]*$/,'')+'<body>'+`<script>${mock}\n${mcp}</script>`+fs.readFileSync('life-os.html','utf8');fs.writeFileSync('test/page4.html',wrap);
 const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1});
 await c.addInitScript(d=>{if(!localStorage.getItem('MOCKDB'))localStorage.setItem('MOCKDB',d);},JSON.stringify(seed));
 const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.clock.install({time:new Date(`${tk}T11:15:00`)});
 await p.goto('file://'+process.cwd()+'/test/page4.html');await p.waitForTimeout(400);await p.clock.runFor(1000);await p.waitForTimeout(300);
 const R=(f,a)=>p.evaluate(f,a),text=()=>R(()=>document.querySelector('#view').innerText);
 const tx=await text();out.head=tx.slice(tx.indexOf('TODAY'),tx.indexOf('TODAY')+120);
 await p.screenshot({path:'test/tf-1.png',fullPage:true});
 ok(tx.includes('Team sync'),'event');ok(tx.includes('Conference'),'all-day event');ok(tx.includes('Morning run-through'),'timed routine');ok(tx.includes('Anytime reset'),'anytime routine');ok(!tx.includes('Paused one'),'paused hidden');ok(tx.includes('1 of 4 glasses')||tx.includes('2 of 4 glasses'),'count habit meta');ok(tx.includes('Past due task'),'carried');
 out.heldProjectTaskShown=tx.includes('Task in held project');out.overnight=await R(()=>{const b=[...document.querySelectorAll('.blk')].find(x=>x.innerText.includes('Overnight'));return b&&{h:b.offsetHeight,t:b.offsetTop};});
 const cnt=await R(()=>{const d=window.__lifeos.dayItems(window.__lifeos.todayK());return{timed:d.timed.map(e=>e.kind+':'+e.title),any:d.anytime.map(e=>e.kind+':'+e.title),all:d.allDay.map(e=>e.kind+':'+e.title)};});out.items=cnt;
 const counter=tx.match(/\d+ of \d+ done/);out.counter=counter&&counter[0];
 const touch=async(sel,txt,ms)=>{const box=await R(([s,t])=>{const n=[...document.querySelectorAll(s)].find(x=>x.innerText.includes(t));if(!n)return null;n.scrollIntoView({block:'center'});const r=n.getBoundingClientRect();return{x:r.left+r.width/2,y:r.top+r.height/2,h:r.height};},[sel,txt]);if(!box)return null;await p.waitForTimeout(120);const s=await c.newCDPSession(p);await s.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:box.x,y:box.y}]});await p.clock.runFor(ms);await p.waitForTimeout(ms+60);await s.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await p.clock.runFor(420);await p.waitForTimeout(420);return box;};
 await touch('.blk','Team sync',650);out.gcalHold=await R(()=>document.querySelector('.menu')?.innerText||document.querySelector('.sheet')?.innerText?.slice(0,50)||null);await p.screenshot({path:'test/tf-2.png'});await p.keyboard.press('Escape');await p.clock.runFor(400);await p.waitForTimeout(300);await R(()=>document.querySelectorAll('.menu-scrim,.scrim').forEach(n=>n.click()));await p.clock.runFor(450);await p.waitForTimeout(300);
 await touch('.blk','Morning run-through',650);out.routineHold=await R(()=>document.querySelector('.menu')?.innerText||null);await p.keyboard.press('Escape');await R(()=>document.querySelectorAll('.menu-scrim,.scrim').forEach(n=>n.click()));await p.clock.runFor(450);await p.waitForTimeout(300);
 // tick routine then count habit from Today
 const tickRoutine=await R(()=>{const b=[...document.querySelectorAll('.blk')].find(x=>x.innerText.includes('Morning run-through'));const t=b&&b.querySelector('.tick');t&&t.click();return !!t;});await p.clock.runFor(700);await p.waitForTimeout(250);ok(tickRoutine&&await R(()=>!!window.__lifeos.get.id('r1').runs?.[window.__lifeos.todayK()]),'routine tick');
 const tickWater=await R(()=>{const r=[...document.querySelectorAll('.trow')].find(x=>x.innerText.includes('Water'));const t=r&&r.querySelector('.tick');t&&t.click();return !!t;});await p.clock.runFor(700);await p.waitForTimeout(250);out.waterAfterTick=await R(()=>window.__lifeos.get.id('h2').logs[window.__lifeos.todayK()]);
 // reminder: habit/routine set-time reminder shouldn't crash; timed task reminder at 10:00 is overdue today
 out.reminderCard=await R(()=>document.querySelector('.remcard,.reminder,.rem')?.innerText||null);
 // Share day text
 await p.getByRole('button',{name:/Share/}).first().click({timeout:1500}).catch(()=>{out.noShareBtn=true;});await p.clock.runFor(400);await p.waitForTimeout(300);await p.screenshot({path:'test/tf-3.png'});await R(()=>document.querySelectorAll('.scrim').forEach(n=>n.click()));await p.clock.runFor(450);await p.waitForTimeout(300);
 // tomorrow: overnight event + all-day ends; 24h label layout
 await R(()=>{const L=window.__lifeos;L.put(Object.assign({},L.get.settings(),{clock:24}));});await p.clock.runFor(100);await p.waitForTimeout(200);await p.screenshot({path:'test/tf-4.png'});
 const ov=await R(()=>document.documentElement.scrollWidth-innerWidth);ok(ov<=0,'24h overflow '+ov);
 await R(()=>{const L=window.__lifeos;L.put(Object.assign({},L.get.settings(),{clock:12}));});
 await p.setViewportSize({width:1280,height:900});await p.clock.runFor(300);await p.waitForTimeout(300);await p.screenshot({path:'test/tf-5.png'});
 // all gcal only day counter
 console.log(JSON.stringify({pass,fails,errs,out},null,1));await b.close();
})().catch(e=>{console.log('CRASH',e.message.slice(0,400),JSON.stringify({pass,fails,out},null,1));process.exit(1);});
