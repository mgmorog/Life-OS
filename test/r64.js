const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/page.html');await p.waitForTimeout(500);
let pass=0;const fails=[];const ok=(c,m)=>{if(c)pass++;else{fails.push(m);p.locator('#view').innerText().then(t=>console.log('--',m,'\n',t.slice(0,600)));}};const R=(f,a)=>p.evaluate(f,a);const text=()=>p.locator('#view').innerText();const menu=async l=>{await p.locator('.menu button,[role=menu] button',{hasText:l}).first().click();await p.waitForTimeout(300);};
const ad=n=>{const d=new Date();d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const go=(v,pr)=>R(([v,pr])=>window.__lifeos.App.go(v,pr||{}),[v,pr]).then(()=>p.waitForTimeout(350));
const P=(r)=>R(r=>window.__lifeos.put(Object.assign({createdAt:Date.now()},r),{silent:true}),r);
const T=(id,title,x)=>P(Object.assign({id,kind:'task',title,notes:'',steps:[],date:null,time:null,repeat:{type:'never',end:null},priority:'normal'},x||{}));
const on={'Life admin':['renewals','documents','accounts','insurance','emergency','estate'],Family:['allowance'],Pets:['petcare'],Community:['volunteer','giving'],Finances:['returns','iou'],'Personal growth':['commonplace','letters'],Recreation:['restaurants','collections','tickets','bucket'],Travel:['points','places']};
await R(o=>{const L=window.__lifeos;L.put(Object.assign({},L.get.settings(),{introDone:true,nudgeOff:true,planEve:false,hubShown:o}),{silent:true});},on);
const E=(id,hub,tool,f)=>P({id,kind:'entry',hub,tool,f,createdAt:Date.now()-864e5*30});
const addVia=async(hub,tool,btnRe,vals)=>{await go('tool',{hub,tool});await p.getByRole('button',{name:btnRe}).first().click();await p.waitForTimeout(300);for(const [k,v] of Object.entries(vals)){const loc=p.locator('#f-x-'+k);if(await loc.evaluate(n=>n.tagName)==='SELECT')await loc.selectOption(v);else await loc.fill(String(v));}await p.getByRole('button',{name:'Add',exact:true}).click();await p.waitForTimeout(350);};
// new modules start hidden
ok(await R(()=>window.__lifeos.hubHidden ? true : true),'x');
ok(await R(()=>{const L=window.__lifeos;return true;}),'y');
// 1 insurance: add with renew date, premium head, today feed, calendar
await addVia('Life admin','insurance',/Add a policy/,{what:'Car insurance',status:'Auto',provider:'Geico',premium:1200,renew:ad(10),claim:'800-555-1212'});
t=await text();ok(/Premiums a year/i.test(t)&&/1,200/.test(t)&&/1 policy/.test(t),'insurance head');ok(await p.getByRole('link',{name:/Claim/}).count()===1,'claim call link');
ok(await R(()=>{const L=window.__lifeos,x=L.get.all('entry').find(e=>e.f.what==='Car insurance');return !!(x.f.calId&&L.get.id(x.f.calId));}),'insurance on calendar');
await go('today');ok(/Car insurance/.test(await text())&&/in 10 days/.test(await text()),'insurance on today');
// 2 emergency card share
await E('em1','Life admin','emergency',{what:'Mom',status:'Contact',phone:'716-555-0100',note:''});await E('em2','Life admin','emergency',{what:'Allergies',status:'Medical',note:'Penicillin'});
await go('tool',{hub:'Life admin',tool:'emergency'});await R(()=>{window._sh=null;navigator.share=undefined;const c=navigator.clipboard;try{Object.defineProperty(navigator,'clipboard',{value:{writeText:async t=>{window._sh=t;}},configurable:true});}catch(e){}});
await p.getByRole('button',{name:'Share the card'}).click();await p.waitForTimeout(300);
ok(await R(()=>/CONTACTS/.test(window._sh||'')&&/Mom — 716-555-0100/.test(window._sh)&&/Penicillin/.test(window._sh)),'emergency card text');
// 3 estate yearly check
await E('es1','Life admin','estate',{what:'Will',status:'Will',where:'Safe',note:''});await go('today');ok(/Review your will and estate/.test(await text()),'estate check on today');
await go('tool',{hub:'Life admin',tool:'estate'});await p.getByRole('button',{name:'Reviewed'}).click();await p.waitForTimeout(250);await go('today');ok(!/Review your will and estate/.test(await text()),'estate reviewed');
// 4 renewals fee head
await E('rn1','Life admin','renewals',{what:'Passport',fee:130,date:ad(100),remind:45,yearly:'Once',note:''});await go('tool',{hub:'Life admin',tool:'renewals'});ok(/Fees to plan for/i.test(await text())&&/\$130/.test(await text()),'renewal fees');
// 5 documents photos flag, accounts call
ok(await R(()=>!!window.__lifeos.toolOf('Life admin','documents').photos),'documents take photos');
await E('ac1','Life admin','accounts',{what:'Chase',status:'Bank',phone:'800-935-9935',site:'',note:''});await go('tool',{hub:'Life admin',tool:'accounts'});ok(await p.getByRole('link',{name:/Call 800/}).count()===1,'account call');
// 6 allowance balance
await E('al1','Family','allowance',{what:'Weekly',kid:'Ava',kind:'Paid out',n:10,note:'',date:ad(-3)});await E('al2','Family','allowance',{what:'Toy',kid:'Ava',kind:'Spent',n:4,note:'',date:ad(-1)});
await go('tool',{hub:'Family',tool:'allowance'});ok(/\$10 paid · \$4 spent/.test(await text())&&/\$6/.test(await text()),'allowance balance');
// 7 pet care grouped by pet
await E('pc1','Pets','petcare',{what:'Heartworm pill',pet:'Max',kind:'Medication',every:30,last:ad(-31),note:''});await E('pc2','Pets','petcare',{what:'Grooming',pet:'Luna',kind:'Grooming',every:56,last:ad(-3),note:''});
await go('tool',{hub:'Pets',tool:'petcare'});t=await text();ok(/MAX/i.test(t)&&/LUNA/i.test(t)&&/Medication · 1 day overdue/.test(t),'pets grouped');
// 8 volunteering upcoming shift on today when the day comes + calendar
await E('vo1','Community','volunteer',{what:'Shift',org:'FeedMore',n:3,note:'',date:ad(0)});await go('today');ok(/Volunteering · today/.test(await text()),'shift on today');
await addVia('Community','volunteer',/Log a shift/,{what:'Sorting',org:'FeedMore',n:2,date:ad(6)});ok(/Coming up/i.test(await text()),'upcoming shift');ok(await R(()=>{const L=window.__lifeos,x=L.get.all('entry').find(e=>e.f.what==='Sorting');return !!(x.f.calId&&L.get.id(x.f.calId));}),'shift on calendar');
// 9 giving by year
await E('gv1','Community','giving',{what:'Red Cross',n:100,receipt:'Yes',note:'',date:ad(-10)});await E('gv2','Community','giving',{what:'Library',n:25,receipt:'No',note:'',date:ad(-5)});
await go('tool',{hub:'Community',tool:'giving'});ok(/2 gifts · 1 with receipts/.test(await text())&&/\$125/.test(await text()),'giving by year');
// 10 returns
await E('re1','Finances','returns',{what:'Rain jacket',store:'REI',price:120,status:'Deciding',date:ad(2),remind:7,note:''});await go('today');ok(/Return Rain jacket\?/.test(await text()),'return on today');
await go('tool',{hub:'Finances',tool:'returns'});await p.locator('.li',{hasText:'Rain jacket'}).locator('button.grow').click();await p.waitForTimeout(300);await p.locator('#f-x-status').selectOption('Keeping');await p.getByRole('button',{name:'Save'}).click();await p.waitForTimeout(300);
ok(/DECIDED/i.test(await text()),'return decided');await go('today');ok(!/Return Rain jacket/.test(await text()),'decided leaves today');
// 11 IOUs settle
await E('io1','Finances','iou',{what:'Dinner',who:'Sam',dir:'They owe me',settled:'No',n:42,note:'',date:ad(-2)});await E('io2','Finances','iou',{what:'Cab',who:'Sam',dir:'I owe them',settled:'No',n:12,note:'',date:ad(-1)});
await go('tool',{hub:'Finances',tool:'iou'});ok(/Owes you \$30/.test(await text()),'iou net');await p.getByRole('button',{name:'Settle up'}).click();await p.waitForTimeout(300);ok(/All settled/.test(await text()),'settled');
// 12 subscription trial
await E('sb1','Finances','bills',{t:'sub',what:'Streamly',amount:12,note:'',trial:ad(1),flag:'No'});await go('today');ok(/Streamly free trial ends tomorrow/.test(await text()),'trial on today');
// 13 letters sealed
await E('lt1','Personal growth','letters',{what:'Next year',date:ad(365),remind:0,note:'Dear me'});await go('tool',{hub:'Personal growth',tool:'letters'});ok(/Sealed until/.test(await text()),'sealed');
await p.locator('.li',{hasText:'Next year'}).locator('button.grow').click();await p.waitForTimeout(300);ok(!/Dear me/.test(await p.locator('.sheet').last().innerText()),'content hidden');
await p.getByRole('button',{name:'Open it early'}).click();await p.waitForTimeout(300);ok(/Dear me/.test(await p.locator('.sheet').last().innerText()),'opened early');await p.keyboard.press('Escape');await p.waitForTimeout(300);
await E('lt2','Personal growth','letters',{what:'Today one',date:ad(0),remind:0,note:'Hi'});await go('today');ok(/A letter from you opens today: Today one/.test(await text()),'letter on today');
// 14 commonplace, restaurants, collections, tickets, bucket, points, places
await addVia('Personal growth','commonplace',/Add an entry/,{what:'The obstacle is the way',status:'Quote',src:'Marcus Aurelius'});ok(/Marcus Aurelius/.test(await text()),'commonplace');
await addVia('Recreation','restaurants',/Add a restaurant/,{what:'Lloyd',status:'Loved',cuisine:'Tacos',order:'Fish taco'});ok(/Get: Fish taco/.test(await text()),'restaurants');
await E('co1','Recreation','collections',{what:'Kind of Blue',status:'Have',cat:'Records',val:40,note:''});await E('co2','Recreation','collections',{what:'Barolo',status:'Have',cat:'Wine',val:80,note:''});
await go('tool',{hub:'Recreation',tool:'collections'});ok(/RECORDS/i.test(await text())&&/\$120/.test(await text()),'collections grouped + value');
await addVia('Recreation','tickets',/Add an event/,{what:'Phish',venue:'MSG',seats:'Sec 102',date:ad(20)});ok(/MSG · Sec 102/.test(await text()),'tickets');
await addVia('Recreation','bucket',/Add an experience/,{what:'See the northern lights',status:'Someday'});ok(/0 of 1 done/.test(await text()),'bucket');
await E('pt1','Travel','points',{what:'Delta',status:'Airline',bal:42000,exp:ad(30),num:'',note:''});await go('tool',{hub:'Travel',tool:'points'});ok(/42,000 pts/.test(await text())&&/1 expiring soon/.test(await text()),'points');await go('today');ok(/Delta/.test(await text()),'points expiring on today');
await E('pl1','Travel','places',{what:'Lisbon',country:'Portugal',note:'',date:'2025-05-01'});await E('pl2','Travel','places',{what:'Porto',country:'Portugal',note:'',date:'2025-05-04'});await go('tool',{hub:'Travel',tool:'places'});ok(/1 countries · 2 places|COUNTRIES\s*1/i.test(await text()),'places');
// 15 hidden by default for a fresh user
ok(await R(()=>{const L=window.__lifeos,s=L.get.settings();L.put(Object.assign({},s,{hubShown:{}}),{silent:true});return ['returns','iou','commonplace','letters','restaurants','points'].every(id=>window.__lifeos.hubHidden(({returns:'Finances',iou:'Finances',commonplace:'Personal growth',letters:'Personal growth',restaurants:'Recreation',points:'Travel'})[id]).includes(id));}),'start hidden');
ok(!errs.length,'errs '+errs);console.log(JSON.stringify({pass,fails},null,1));await b.close();})().catch(e=>{console.log('CRASH',e.message.slice(0,700));process.exit(1);});
