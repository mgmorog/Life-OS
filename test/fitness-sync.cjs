const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.clock.setFixedTime(new Date('2026-11-15T07:30:00'));
await p.goto('file://'+process.cwd()+'/test/page.html');await p.waitForTimeout(900);
const L=(fn,a)=>p.evaluate(fn,a);
const hid=await L(()=>{const L=window.__lifeos;return L.create('habit',{title:'Workout',days:[],target:3,howOften:'times',track:'check',logs:{},sessions:{},link:{log:true,rs:[],mode:'turns'}}).id;});
const st=()=>L(id=>{const L=window.__lifeos,h=L.get.id(id);return {done:Object.keys(h.logs||{}),entries:L.get.all('entry').filter(e=>e.tool==='workouts'&&!e.f.t).map(e=>e.f.date+':'+e.f.what+':'+(e.f.src||''))};},hid);
await L(id=>window.__lifeos.App.go('habit',{id}),hid);await p.waitForTimeout(600);
await p.getByRole('button',{name:'Done today',exact:true}).click();await p.waitForTimeout(1300);
console.log('after check-off:',JSON.stringify(await st()),'detail sheet:',await p.locator('.sheet').last().locator('h2').textContent().catch(()=>'none'));
await p.screenshot({path:'/tmp/s1.png'});
await p.locator('.sheet').last().getByRole('button',{name:'Run'}).click();await p.locator('.sheet').last().getByRole('button',{name:'Save',exact:true}).click();await p.waitForTimeout(700);
console.log('after details:',JSON.stringify(await st()));
await p.getByRole('button',{name:/Done today/}).first().click();await p.waitForTimeout(1200);
console.log('after uncheck:',JSON.stringify(await st()));
// quick log in Health for yesterday-like: today via quick chip
await L(()=>window.__lifeos.App.go('tool',{hub:'Health',tool:'workouts'}));await p.waitForTimeout(600);
await p.getByRole('button',{name:'Yoga',exact:true}).click();await p.waitForTimeout(600);
console.log('after quick log:',JSON.stringify(await st()));
const eid=await L(()=>window.__lifeos.get.all('entry').find(e=>e.f.what==='Yoga').id);
await L(id=>window.__lifeos.remove(id),eid);await p.waitForTimeout(400);
console.log('after deleting log:',JSON.stringify(await st()));
// uncheck when another log exists: add yoga, check habit, then uncheck -> stays
await L(()=>window.__lifeos.create('entry',{hub:'Health',tool:'workouts',f:{what:'Yoga',min:30,date:'2026-11-15'}}));await p.waitForTimeout(300);
await L(id=>window.__lifeos.App.go('habit',{id}),hid);await p.waitForTimeout(600);
await p.getByRole('button',{name:/Done today/}).first().click();await p.waitForTimeout(1200);
console.log('uncheck with yoga logged:',JSON.stringify(await st()),await p.locator('#toast').textContent());
console.log(errs);await b.close();})();
