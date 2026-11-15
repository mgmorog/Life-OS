const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true,deviceScaleFactor:2});const p=await c.newPage();const errs=[];p.on('pageerror',e=>{errs.push(e.message);console.log('PAGEERR',e.message,e.stack.split('\n').slice(0,4).join(' | '));});
await p.clock.setFixedTime(new Date('2026-11-15T07:30:00'));
await p.goto('file://'+process.cwd()+'/test/page.html');await p.waitForTimeout(900);
const L=(fn,a)=>p.evaluate(fn,a);
const shot=async n=>{await p.waitForTimeout(500);await p.screenshot({path:`/tmp/f-${n}.png`});};
await L(()=>{const L=window.__lifeos,s=L.get.settings();s.weekStart=0;L.put(s);
 const mk=(what,plan,days)=>L.create('entry',{hub:'Health',tool:'workouts',f:{t:'routine',what,kind:'Strength',min:50,plan}});
 const S=(n,r,w,t='n')=>({t,r,w});
 window.__push=mk('Push day',[{id:'a',name:'Bench press',rest:90,ss:null,sets:[S(0,10,95,'w'),S(0,8,135),S(0,8,135),S(0,6,145,'f')]},{id:'b',name:'Lateral raise',rest:60,ss:'g1',sets:[S(0,12,20),S(0,12,20)]},{id:'c',name:'Tricep pushdown',rest:60,ss:'g1',sets:[S(0,12,50),S(0,10,50,'d')]}]).id;
 window.__pull=mk('Pull day',[{id:'d',name:'Pull-up',rest:120,ss:null,sets:[S(0,8,''),S(0,8,''),S(0,8,'')]},{id:'e',name:'Barbell row',rest:90,ss:null,sets:[S(0,8,115),S(0,8,115)]}]).id;
 window.__legs=mk('Leg day',[{id:'f',name:'Squat',rest:150,ss:null,sets:[S(0,5,185),S(0,5,185),S(0,5,185)]}]).id;
 // history
 L.create('entry',{hub:'Health',tool:'workouts',f:{what:'Push day',rid:window.__push,min:48,date:'2026-11-13',log:[{name:'Bench press',p:'Chest',s:['Triceps','Shoulders'],sets:[{t:'n',w:135,r:8},{t:'n',w:135,r:7}]}]}});
 L.create('entry',{hub:'Health',tool:'workouts',f:{what:'Pull day',rid:window.__pull,min:52,date:'2026-11-09'}});
 L.create('entry',{hub:'Health',tool:'workouts',f:{what:'Push day',rid:window.__push,min:45,date:'2026-11-02'}});
 L.create('entry',{hub:'Health',tool:'workouts',f:{what:'Pull day',rid:window.__pull,min:45,date:'2026-11-04'}});
 L.create('entry',{hub:'Health',tool:'workouts',f:{what:'Leg day',rid:window.__legs,min:55,date:'2026-10-25'}});
});
// new habit with suggestion
await L(()=>window.__lifeos.App.go('habits'));await p.waitForTimeout(600);
await p.getByRole('button',{name:'New habit'}).click();await p.waitForTimeout(600);
await p.fill('#f-habit-title','Workout');await p.waitForTimeout(300);
console.log('suggestion shown:',await p.locator('.wksug').count());
await shot('1-suggest');
await p.getByRole('button',{name:'Link it'}).click();await p.waitForTimeout(300);
await p.locator('.sheet').last().getByRole('button',{name:'Add',exact:true}).click();await p.waitForTimeout(700);
const hid=await L(()=>{const h=window.__lifeos.get.all('habit').find(x=>x.title==='Workout');h.link.rs=[window.__push,window.__pull,window.__legs];window.__lifeos.put(h);return h.id;});
console.log('habit link:',JSON.stringify(await L(()=>window.__lifeos.get.all('habit')[0].link)));
console.log('past logs counted:',await L(()=>{const h=window.__lifeos.get.all('habit')[0];return Object.keys(h.logs||{})}));
await L(id=>window.__lifeos.App.go('habit',{id}),hid);await p.waitForTimeout(700);
await shot('2-habit');
await p.evaluate(()=>window.scrollTo(0,600));await shot('2b-habit-linked');
console.log('start label:',await p.locator('.splitbtn .btn').first().textContent());
// start workout -> pull (longest without)
await p.locator('.splitbtn .btn').first().click();await p.waitForTimeout(800);
console.log('running:',await L(()=>{const c=window.__lifeos.get.id('cfg-Health-workouts');return c&&c.f.run&&c.f.run.name;}));
// try push via picker instead: cancel run
await L(()=>{const c=window.__lifeos.get.id('cfg-Health-workouts');delete c.f.run;window.__lifeos.put(c);});
await L(id=>window.__lifeos.App.go('habit',{id}),hid);await p.waitForTimeout(600);
await p.locator('.splitbtn .btn.more').click();await p.waitForTimeout(600);await shot('3-picker');
await p.locator('.sheet').last().getByText('Push day').first().click();await p.waitForTimeout(900);
await shot('4-run');
// complete bench warmup -> rest 90 ; then superset
const tick=async(ei,i)=>{await p.locator(`[data-ex="${ei}"] .st:not(.hd)`).nth(i).locator('.tick-hit button, .tick-hit').first().click();await p.waitForTimeout(900);};
await tick(0,0);
console.log('rest after bench set:',await L(()=>{const r=window.__lifeos.get.id('cfg-Health-workouts').f.run;return r.restAt?Math.round((r.restAt-Date.now())/1000):0;}));
await tick(1,0);
console.log('rest after lateral (superset, expect 0):',await L(()=>{const r=window.__lifeos.get.id('cfg-Health-workouts').f.run;return r.restAt?Math.round((r.restAt-Date.now())/1000):0;}));
await tick(2,0);
console.log('rest after pushdown (end of round, expect 60):',await L(()=>{const r=window.__lifeos.get.id('cfg-Health-workouts').f.run;return r.restAt?Math.round((r.restAt-Date.now())/1000):0;}));
await tick(0,1);await tick(0,2);
await shot('5-run-progress');
// finish
await p.getByRole('button',{name:'Finish',exact:true}).click();await p.waitForTimeout(600);
await p.locator('.sheet').last().getByRole('button',{name:'Save',exact:true}).click();await p.waitForTimeout(900);
console.log('toast:',await p.locator('#toast').textContent());
console.log('habit done today:',await L(()=>{const h=window.__lifeos.get.all('habit')[0];return !!(h.logs||{})['2026-11-15'];}));
const last=await L(()=>{const x=window.__lifeos.get.all('entry').filter(e=>e.tool==='workouts'&&e.f.date==='2026-11-15')[0];return x&&{sets:x.f.sets,vol:x.f.vol,ex:x.f.log.map(e=>e.name+':'+e.sets.map(s=>s.t+s.w+'x'+s.r).join(','))};});
console.log('logged:',JSON.stringify(last));
await L(()=>window.__lifeos.App.go('tool',{hub:'Health',tool:'workouts'}));await p.waitForTimeout(800);await shot('6-workouts');
await p.evaluate(()=>window.scrollTo(0,700));await shot('6b-workouts');
// uncheck habit today -> routine entry stays, still counted
await L(id=>window.__lifeos.App.go('habit',{id}),hid);await p.waitForTimeout(600);
// check off a different day via toggle (yesterday): adds an entry
await L(()=>{const L=window.__lifeos,h=L.get.all('habit')[0];});
// day chips with pins
await L(()=>window.__lifeos.App.go('habits'));await p.waitForTimeout(700);
await p.locator('[aria-label^="Plan Workout Monday"]').click();await p.waitForTimeout(400);
await p.locator('[aria-label^="Plan Workout Wednesday"]').click();await p.waitForTimeout(400);
await L(()=>{});
await p.locator('[aria-label^="Planned Workout Wednesday"]').dispatchEvent('contextmenu');await p.waitForTimeout(600);
const pin=await p.locator('.sheet').count();console.log('pin sheet open:',pin);
if(pin){await p.locator('.sheet').last().getByText('Leg day').click();await p.waitForTimeout(600);}
await shot('7-chips');
console.log('pins:',JSON.stringify(await L(()=>window.__lifeos.get.all('habit')[0].sessions)));
// routine editor
await L(id=>{const L=window.__lifeos;L.App.go('tool',{hub:'Health',tool:'workouts'});},hid);await p.waitForTimeout(600);
await p.getByText('Push day').first().click();await p.waitForTimeout(800);await shot('8-editor');
console.log('errs',errs);await b.close();})();
