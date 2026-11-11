const {chromium}=require('playwright');
const L='Reorganize the entire garage and donate everything we no longer use this year';
const W='Supercalifragilisticexpialidociousantidisestablishmentarianism';
(async()=>{
const b=await chromium.launch();const all={};const errs=[];
for(const width of (process.env.W||'320,375,390,430').split(',').map(Number)){
const c=await b.newContext({viewport:{width,height:844},deviceScaleFactor:1,hasTouch:true,isMobile:true});const p=await c.newPage();p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+__dirname+'/page.html');await p.waitForTimeout(450);
const R=(f,a)=>p.evaluate(f,a);
const load=p.getByRole('button',{name:/Load examples/}).first();if(await load.count()){await load.click().catch(()=>{});await p.waitForTimeout(600);}
await R(([L,W])=>{const A=window.__lifeos,tk=A.todayK(),ad=n=>{const d=new Date();d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;},dd=n=>Date.now()-n*864e5;
 const T=(id,title,x)=>A.put(Object.assign({id,kind:'task',title,notes:L,steps:[{id:'s'+id,t:L}],date:null,time:null,repeat:{type:'never',end:null},reminder:null,deadline:null,priority:'high',part:null,area:'Finances and paperwork'},x),{silent:true});
 A.put({id:'zg',kind:'goal',title:L,notes:L,area:'Finances and paperwork',deadline:ad(30),focus:true,track:'milestones',steps:[{id:'a',t:L,d:true,doneAt:dd(3)},{id:'b',t:W,d:false,date:ad(5)}],createdAt:dd(40),checks:[{date:tk,status:'Going well',note:L}],checkAt:tk},{silent:true});
 A.put({id:'zg2',kind:'goal',title:W,track:'number',numStart:0,numTarget:100000,numCur:30000,numUnit:'kilometers',createdAt:dd(40),checkAt:tk},{silent:true});
 A.put({id:'zp',kind:'project',title:L,notes:L,area:'Finances and paperwork',deadline:ad(40),part:'zg',createdAt:dd(30)},{silent:true});
 T('zt1',L,{date:ad(-1),part:'zp',deadline:ad(2)});T('zt2',W,{date:ad(-5),part:'zg'});T('zt3',L,{date:tk,time:600,dur:60,part:'zp'});T('zt4',W,{date:tk,part:'zp'});T('zt5',L,{part:'zp'});T('zt6',L,{date:ad(3),part:'zg'});T('zt7',W,{date:tk,doneDates:{[tk]:Date.now()}});
 A.put({id:'zh',kind:'habit',title:L,notes:L,days:[],target:7,dur:30,part:'zg',logs:{},color:'sage',area:'Finances and paperwork',createdAt:dd(30)},{silent:true});
 A.put({id:'zh2',kind:'habit',title:W,days:[0,1,2,3,4,5,6],tod:'morning',target:7,logs:{[ad(-3)]:true,[ad(-4)]:true},color:'sage',track:'count',goalN:12,unit:'glasses of water',createdAt:dd(30)},{silent:true});
 A.put({id:'zh3',kind:'habit',title:L,days:[0,1,2],paused:true,pausedAt:dd(3),pausedStreak:{n:30,unit:'day'},target:3,logs:{},color:'sage'},{silent:true});
 A.put({id:'zh4',kind:'habit',title:W,days:[0],archived:true,built:true,archivedAt:dd(3),target:1,logs:{}},{silent:true});
 const log=[...Array(6)].map((_,i)=>({at:dd(i+1),mins:90,marks:[true,false],skippedNames:[L]}));const runs={};log.forEach(x=>{const d=new Date(x.at);runs[`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`]=x.at;});
 A.put({id:'zr',kind:'routine',title:L,notes:L,days:[0,1,2,3,4,5,6],setTime:420,steps:[{id:'a',t:L,min:30},{id:'b',t:W,min:30},{id:'c',t:'Three',min:5},{id:'d',t:'Four',min:5}],runs,runLog:log,color:'sage',area:'Finances and paperwork'},{silent:true});
 A.put({id:'zl',kind:'list',title:L,pinned:true,reusable:true,sections:[{id:'s1',name:L}],items:[{id:'a',t:L,note:W,d:false,sec:'s1'},{id:'b',t:W,note:L,d:false},{id:'c',t:L,d:true}],hist:{x:{t:L,n:3,at:1},y:{t:W,n:3,at:1}}},{silent:true});
 A.put({id:'zl2',kind:'list',title:W,pinned:true,items:[{id:'a',t:W,d:false}]},{silent:true});A.put({id:'zl3',kind:'list',title:L,items:[{id:'a',t:W,d:false}]},{silent:true});
 A.put({id:'zi',kind:'idea',title:L,notes:W,photos:[],createdAt:dd(40)},{silent:true});A.put({id:'zi2',kind:'idea',title:W+' https://example.com/'+W,notes:'',photos:[],createdAt:dd(2)},{silent:true});
 A.put({id:'zb',kind:'block',title:L,notes:L,date:tk,start:840,dur:60,repeat:{type:'never',end:null},color:'sage'},{silent:true});A.put({id:'za',kind:'allday',title:L,notes:'',start:tk,end:null,repeat:{type:'never',end:null},color:'sage'},{silent:true});
 A.App.refresh();},[L,W]);await p.waitForTimeout(200);
/* screens */
const hubs=await R(()=>{try{return window.__lifeos.hubTools?window.__lifeos.hubTools():null;}catch(e){return null;}});
const screens=[['today'],['studio'],['calendar'],['more'],['organize'],['inbox'],['tasks'],['habits'],['routines'],['projects'],['goals'],['lists'],['search'],['trash'],['photos'],['archive'],['prefs'],['areas'],['foundation'],['reflect'],['plan',{id:'zg'}],['plan',{id:'zg2'}],['plan',{id:'zp'}],['habit',{id:'zh'}],['habit',{id:'zh2'}],['routine',{id:'zr'}],['player',{id:'zr'}],['list',{id:'zl'}],['list',{id:'zl3'}],['planweek',{anchor:(()=>{const d=new Date();d.setDate(d.getDate()+7);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;})()}]];
const subs={tasks:[/Upcoming/,/Anytime/,/^Done/],habits:[/All habits/,/Paused/],goals:[/On hold/,/^Done/],projects:[/On hold/,/^Done/]};
const check=()=>R(()=>{const vw=document.documentElement.clientWidth,out=[],root=document.querySelector('.sheet:last-of-type')&&[...document.querySelectorAll('.sheet')].pop()||document.querySelector('#view');
 if(document.documentElement.scrollWidth>vw+1)out.push(`PAGE WIDER ${document.documentElement.scrollWidth}>${vw}`);
 const scroller=n=>{for(let a=n.parentElement;a&&a!==document.body;a=a.parentElement){const o=getComputedStyle(a).overflowX;if(o==='auto'||o==='scroll')return a;}return null;};
 const name=n=>`${n.tagName.toLowerCase()}.${String(n.className&&n.className.baseVal===undefined?n.className:'').split(' ').slice(0,2).join('.')} "${(n.textContent||'').trim().slice(0,28)}"`;
 root.querySelectorAll('*').forEach(n=>{if(n.closest('svg')&&n.tagName!=='svg')return;const s=getComputedStyle(n);if(s.display==='none'||s.visibility==='hidden'||s.position==='fixed')return;const r=n.getBoundingClientRect();if(!r.width||!r.height)return;if(n.closest('[aria-hidden="true"]'))return;if(n.classList.contains('oswd'))return;
  const inScroll=scroller(n)||(()=>{for(let a=n.parentElement;a&&a!==root;a=a.parentElement){if(getComputedStyle(a).overflowX==='hidden'&&getComputedStyle(a).textOverflow==='ellipsis')return a;}return null;})();
  if(!inScroll&&(r.right>vw+1||r.left<-1))out.push(`OFFSCREEN ${Math.round(r.left)}-${Math.round(r.right)} ${name(n)}`);
  /* a child sticking out of its card */
  const card=n.parentElement&&n.parentElement.closest('.card,.list,.ocard,.group,.opin,.anytime,.upc');if(card&&!inScroll){const c=card.getBoundingClientRect();if(r.right>c.right+1||(r.left<c.left-1&&!n.closest('.tick-hit')))out.push(`OUT OF CARD ${Math.round(r.right-c.right)}px ${name(n)}`);}
  /* clipped text with no ellipsis */
  if(s.overflowX==='hidden'&&n.scrollWidth>n.clientWidth+1&&n.children.length===0&&s.textOverflow!=='ellipsis')out.push(`CLIPPED ${name(n)}`);
  /* text overlapping a sibling */
 });
 return [...new Set(out)].slice(0,14);});
const note=(k,v)=>{v.forEach(x=>{(all[`${k} :: ${x}`]=all[`${k} :: ${x}`]||[]).push(width);});};
for(const [v,a] of screens){await R(([v,a])=>window.__lifeos.App.go(v,a||{}),[v,a]);await p.waitForTimeout(160);note(v+(a&&a.id?':'+a.id:''),await check());if(width===390)await p.screenshot({path:`test/l-${v}${a&&a.id?'-'+a.id:''}.png`,fullPage:true});
 for(const s of subs[v]||[]){const bt=p.getByRole('button',{name:s}).first();if(await bt.count()){await bt.click({timeout:1500}).catch(()=>{});await p.waitForTimeout(120);note(v+' tab '+s,await check());}}
 if(v==='studio'||v==='calendar'){for(const m of ['Quarter','Month','Week']){const bt=p.getByRole('button',{name:m,exact:true}).first();if(await bt.count()){await bt.click({timeout:1500}).catch(()=>{});await p.waitForTimeout(150);note(v+' '+m,await check());if(width===390)await p.screenshot({path:`test/l-${v}-${m}.png`,fullPage:true});}}}
}
/* every tool */
const tools=await R(()=>{const H=window.__lifeos.HUBS;return H?Object.entries(H).flatMap(([h,x])=>x.tools.map(t=>[h,t.id])):[];});
for(const[h,t]of tools){await R(([h,t])=>window.__lifeos.App.go('tool',{hub:h,tool:t}),[h,t]);await p.waitForTimeout(90);note(`tool ${h}/${t}`,await check());}
const areas=await R(()=>Object.keys(window.__lifeos.HUBS||{}));for(const h of areas){await R(h=>window.__lifeos.App.go('area',{name:h}),h);await p.waitForTimeout(90);note('area '+h,await check());}
/* settings subpages */
await R(()=>window.__lifeos.App.go('prefs'));await p.waitForTimeout(150);const n=await p.locator('#view .li, #view .row').count();for(let i=0;i<n;i++){await R(()=>window.__lifeos.App.go('prefs'));await p.waitForTimeout(80);const it=p.locator('#view .li, #view .row').nth(i);const lb=(await it.innerText().catch(()=>'' )).split('\n')[0];await it.click({timeout:800}).catch(()=>{});await p.waitForTimeout(120);note('settings/'+lb,await check());if(width===390&&i<9)await p.screenshot({path:`test/l-set-${i}.png`,fullPage:true});await R(()=>{document.querySelectorAll('.scrim,.sheet-scrim').forEach(s=>s.click());});await p.waitForTimeout(60);}
/* forms */
const openSheetAudit=async(view,args,name,label)=>{await R(([v,a])=>window.__lifeos.App.go(v,a||{}),[view,args]);await p.waitForTimeout(120);const bt=p.getByRole('button',{name}).first();if(!(await bt.count())){note('form '+label,['NO BUTTON']);return;}await bt.click({timeout:1500}).catch(()=>{});await p.waitForTimeout(420);note('form '+label,await check());if(width===390)await p.screenshot({path:`test/l-form-${label}.png`});await R(()=>{[...document.querySelectorAll('.sheet')].reverse().forEach(s=>{const c=[...s.querySelectorAll('button')].find(x=>/^(Cancel|Close|Back)$/.test(x.textContent.trim()));c&&c.click();});});await p.waitForTimeout(280);const d=p.getByRole('button',{name:'Discard'}).first();if(await d.count())await d.click({timeout:800}).catch(()=>{});await p.waitForTimeout(280);};
for(const f of [['today',null,/^\+ ?Task/,'task'],['today',null,/^\+ ?Time block/,'block'],['today',null,/^\+ ?All-day/,'allday'],['habits',null,'New habit','habit'],['goals',null,'New goal','goal'],['projects',null,'New project','project'],['routines',null,'New routine','routine'],['lists',null,'New list','list'],['inbox',null,'Capture a photo','capture'],['tasks',null,'New task','task2']])await openSheetAudit(...f);
for(const id of ['zt3','zb','za','zh','zg','zp','zr']){await R(id=>{const A=window.__lifeos;A.App.go('today');},id);}
if(width===390)await p.screenshot({path:'test/l-last.png'});
await c.close();}
const lines=Object.entries(all).map(([k,w])=>`${w.join(',')}  ${k}`);console.log(lines.length+' findings');console.log(lines.slice(0,+process.env.N||90).join('\n'));console.log('errs',errs.slice(0,5));await b.close();
})().catch(e=>{console.log('CRASH',e.message.slice(0,500));process.exit(1);});
