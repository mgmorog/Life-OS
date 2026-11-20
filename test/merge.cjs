/* v212: old Certifications, Personal curriculum, Room specs and Commonplace entries move to their new homes */
const {chromium}=require('playwright');let pass=0,fail=0;const ok=(n,c,x)=>{if(c){pass++;console.log('ok  ',n);}else{fail++;console.log('FAIL',n,x||'');}};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/test/page.html');await p.waitForTimeout(300);
const r=await p.evaluate(()=>{const L=window.__lifeos,c=(hub,tool,f)=>L.create('entry',{hub,tool,f});
  c('Career','certs',{what:'PMP',status:'Active',need:60,renew:'2027-03-01',org:'PMI',log:[{n:10},{n:5}]});c('Career','certs',{what:'CPA',status:'Planned'});
  c('Learning','curric',{what:'Economics',status:'Focus',why:'Read the news better',res:'Book: Basic Economics\nCourse: Khan Academy'});c('Learning','curric',{what:'Latin',status:'Want to learn'});
  c('Home','roomspecs',{what:'Office',status:'Downstairs',dims:'10 × 11',paint:'White Dove'});
  c('Personal growth','commonplace',{what:'Less but better.',status:'Quote',src:'Dieter Rams',note:'Design rule'});
  L.put(Object.assign({},L.get.settings(),{todayPins:['Career|certs','Health|workouts'],hubHidden:{Career:['skills']}}),{silent:true});
  const n1=L.fx.mergeModules(),n2=L.fx.mergeModules();const all=L.get.all('entry'),of=(h,t)=>all.filter(x=>x.hub===h&&x.tool===t);
  const s=L.get.settings();return{n1,n2,certs:of('Career','skills').filter(x=>x.f.t==='cert').map(x=>[x.f.what,x.f.state,x.f.cneed,x.f.cgot,x.f.note]),paths:of('Learning','paths').map(x=>[x.f.what,x.f.t||'',x.f.note,x.f.why||'']),rooms:of('Home','info').filter(x=>x.f.t==='room').map(x=>[x.f.what,x.f.floor,x.f.paint]),les:of('Personal growth','lessons').map(x=>[x.f.lesson,x.f.kind,x.f.from]),left:all.filter(x=>['certs','curric','roomspecs','commonplace'].includes(x.tool)).length,pins:s.todayPins,hid:(s.hubHidden||{}).Career,cat:['certs','curric','roomspecs','commonplace'].filter(id=>Object.values({Career:1,Learning:1,Home:1,'Personal growth':1}).length&&['Career','Learning','Home','Personal growth'].some(h=>L.toolsOf(h).some(t=>t.id===id)))};});
ok('moved 6, then nothing on a second pass',r.n1===6&&r.n2===0,JSON.stringify([r.n1,r.n2]));
ok('no entries left in old modules',r.left===0);
ok('certs became Skills certifications with credits',JSON.stringify(r.certs)===JSON.stringify([['PMP','Held',60,15,'Issued by PMI'],['CPA','Studying','','','']]),JSON.stringify(r.certs));
ok('curriculum became paths and an interest',r.paths.some(x=>x[0]==='Economics'&&x[2]==='Book: Basic Economics\nCourse: Khan Academy'&&x[3]==='Read the news better')&&r.paths.some(x=>x[0]==='Latin'&&x[1]==='interest'),JSON.stringify(r.paths));
ok('room specs became a Home info room',JSON.stringify(r.rooms)===JSON.stringify([['Office','Downstairs','White Dove']]),JSON.stringify(r.rooms));
ok('commonplace became a quote in Lessons',JSON.stringify(r.les)===JSON.stringify([['Less but better.','Quote','Dieter Rams']]),JSON.stringify(r.les));
ok('stale pin removed, other pin kept',JSON.stringify(r.pins)===JSON.stringify(['Health|workouts']),JSON.stringify(r.pins));
ok('Skills turned back on for someone who had Certifications',!(r.hid||[]).includes('skills'),JSON.stringify(r.hid));
ok('old modules gone from the catalog',r.cat.length===0,JSON.stringify(r.cat));
for(const [h,t,tab] of [['Home','info','room'],['Career','skills',null],['Learning','paths',null],['Personal growth','lessons',null]]){await p.evaluate(([h,t,tab])=>{if(tab){const L=window.__lifeos;}window.__lifeos.App.go('tool',{hub:h,tool:t});},[h,t,tab]);await p.waitForTimeout(300);}
await p.evaluate(()=>{window.__lifeos.App.go('tool',{hub:'Home',tool:'info'});});await p.waitForTimeout(200);await p.getByText('Rooms',{exact:true}).click();await p.waitForTimeout(300);
ok('Rooms tab lists the room',await p.getByText('Office',{exact:true}).count()>0);await p.screenshot({path:'/home/claude/la/rooms.png'});
ok('no page errors',errs.length===0,errs.join(' | '));console.log(`${pass}/${pass+fail} passed`);await b.close();process.exit(fail?1:0);})();
