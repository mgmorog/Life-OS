const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:390,height:844}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));await p.goto('file://'+__dirname+'/page.html');await p.waitForTimeout(500);
let pass=0;const fails=[];const ok=(c,m)=>{if(c)pass++;else{fails.push(m);p.locator('#view').innerText().then(t=>console.log('--',m,'\n',t.slice(0,600)));}};const R=(f,a)=>p.evaluate(f,a);const text=()=>p.locator('#view').innerText();const menu=async l=>{await p.locator('.menu button,[role=menu] button',{hasText:l}).first().click();await p.waitForTimeout(300);};
const ad=n=>{const d=new Date();d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;};
const go=(v,pr)=>R(([v,pr])=>window.__lifeos.App.go(v,pr||{}),[v,pr]).then(()=>p.waitForTimeout(350));
const P=(r)=>R(r=>window.__lifeos.put(Object.assign({createdAt:Date.now()},r),{silent:true}),r);
const T=(id,title,x)=>P(Object.assign({id,kind:'task',title,notes:'',steps:[],date:null,time:null,repeat:{type:'never',end:null},priority:'normal'},x||{}));
const on={Home:['improve','roomspecs','inventory','plants','moving'],Relationships:['events','datenights','cards','sharewish'],Community:['faith'],Career:['sidebiz','network','perfprep','interview'],Finances:['taxes','invest'],Learning:['school'],Health:['records','symptoms','cycle']};
await R(o=>{const L=window.__lifeos;L.put(Object.assign({},L.get.settings(),{introDone:true,nudgeOff:true,planEve:false,hubShown:o}),{silent:true});},on);
const E=(id,hub,tool,f,ago=30)=>P({id,kind:'entry',hub,tool,f,createdAt:Date.now()-864e5*ago});
await R(()=>{window._sh=null;navigator.share=undefined;try{Object.defineProperty(navigator,'clipboard',{value:{writeText:async t=>{window._sh=t;}},configurable:true});}catch(e){}});
// improvements -> project
await E('im1','Home','improve',{what:'Repaint bedroom',status:'Planned',room:'Bedroom',cost:600,pri:'High',note:''});await go('tool',{hub:'Home',tool:'improve'});ok(/Planned cost/i.test(await text()),'improve head');
await p.getByRole('button',{name:'Start Repaint bedroom as a project'}).click();await p.waitForTimeout(400);ok(/Repaint bedroom/.test(await text())&&await R(()=>window.__lifeos.App.state.view==='plan'),'improvement became project');
// inventory export
await R(()=>{window.__lifeos.store.downloads={save:async o=>{window._saved=o;}};});await E('iv1','Home','inventory',{what:'TV',status:'Living room',val:1200,note:''});await go('tool',{hub:'Home',tool:'inventory'});await p.getByRole('button',{name:'Export for your insurer'}).click();await p.waitForTimeout(500);ok(await R(()=>!!window._saved&&/TV/.test(window._saved.data)),'inventory export');
// moving dates from move day
await E('mv1','Home','moving',{what:'Book movers',status:'To do',when:'8 weeks before',note:''});await go('tool',{hub:'Home',tool:'moving'});await p.getByRole('button',{name:'Set the date'}).click();await p.waitForTimeout(300);await p.locator('#f-x-d').fill(ad(60));await p.getByRole('button',{name:'Save'}).last().click();await p.waitForTimeout(300);
ok(await R(a=>window.__lifeos.get.id('mv1').f.due===a,ad(4)),'moving step dated');
// events countdown + rsvp
await E('ev1','Relationships','events',{what:'Holiday party',status:'Planning',date:ad(30),guests:'Sam - yes\nJo - maybe\nAlex',note:''});await go('tool',{hub:'Relationships',tool:'events'});ok(/3 invited · 1 yes/.test(await text()),'rsvp count');
await p.getByRole('button',{name:'Make a countdown for Holiday party'}).click();await p.waitForTimeout(400);ok(/Send invites/.test(await text()),'event countdown tasks');
// date night nudge
await E('dn1','Relationships','datenights',{what:'Sushi',status:'Idea',dates:[ad(-30)],note:''});await go('today');ok(/Time for a date night/.test(await text()),'date nudge');
await go('tool',{hub:'Relationships',tool:'datenights'});await p.getByRole('button',{name:'We did Sushi'}).click();await p.waitForTimeout(300);await go('today');ok(!/Time for a date night/.test(await text()),'nudge cleared');
// thank-yous
await E('ty1','Relationships','cards',{what:'Aunt May',status:'Thank-you owed',for:'Gift',note:''},5);await go('today');ok(/1 thank-you note to write/.test(await text()),'thank-you on today');
// sharewish
await E('sw1','Relationships','sharewish',{what:'Wool socks',status:'Want',size:'M',price:20,who:'',note:''});await go('tool',{hub:'Relationships',tool:'sharewish'});await p.getByRole('button',{name:/Share my list/}).click();await p.waitForTimeout(300);ok(await R(()=>/Wool socks \(M\)/.test(window._sh||'')),'share wishlist');
// side business
await E('sb1','Career','sidebiz',{what:'Consult',kind:'Invoice',client:'Acme',n:1500,paid:'No',note:'',date:ad(-5)});await E('sb2','Career','sidebiz',{what:'Drive',kind:'Mileage',miles:100,n:'',note:'',date:ad(-3)});
await go('tool',{hub:'Career',tool:'sidebiz'});ok(/Unpaid invoices\s*1 · \$1,500/i.test(await text())&&/100 · \$70/.test(await text()),'side biz head');await p.getByRole('button',{name:'Mark Consult paid'}).click();await p.waitForTimeout(300);ok(/\$1,500 net this year/.test(await text()),'invoice paid -> income');
// networking follow up
await E('nw1','Career','network',{what:'Dana Lee',status:'Warm',co:'VP',every:60,next:ad(-1),note:''});await go('today');ok(/Follow up with Dana Lee/.test(await text()),'network on today');
await go('tool',{hub:'Career',tool:'network'});await p.getByRole('button',{name:'Talked with Dana Lee'}).click();await p.waitForTimeout(300);ok(await R(a=>window.__lifeos.get.id('nw1').f.next===a,ad(60)),'talked pushes follow-up');
// review prep pulls wins
await E('wn1','Career','wins',{what:'Shipped the AP redesign',kind:'Project',impact:'30 to 14 days',date:ad(-40)});await go('tool',{hub:'Career',tool:'perfprep'});await p.getByRole('button',{name:/Pull in 1 win/}).click();await p.waitForTimeout(300);ok(/Shipped the AP redesign/.test(await text()),'wins pulled');
await p.getByRole('button',{name:/Copy my brief/}).click();await p.waitForTimeout(300);ok(await R(()=>/WINS/.test(window._sh||'')),'review brief');
// taxes pulls giving receipts
await R(()=>{const L=window.__lifeos,s=L.get.settings();L.put(Object.assign({},s,{hubShown:Object.assign({},s.hubShown,{Community:['faith','giving']})}),{silent:true});});
await E('gv1','Community','giving',{what:'Red Cross',n:100,receipt:'Yes',note:'',date:ad(-3)});await E('tx1','Finances','taxes',{what:'W-2',status:'Document',got:'No',note:''});await go('tool',{hub:'Finances',tool:'taxes'});ok(/Gifts with receipts\s*\$100/i.test(await text()),'taxes pull giving');
// investments limit pace
await E('in1','Finances','invest',{what:'401k',status:'401(k)',bal:1000,contrib:1000,limit:2000,note:''});await go('tool',{hub:'Finances',tool:'invest'});ok(/a month to max it out/.test(await text()),'invest pace');
// school
await E('sc1','Learning','school',{what:'Essay 2',status:'Assignment',cls:'English',due:ad(3),done:'No',note:''});await go('today');ok(/Essay 2/.test(await text()),'school due on today');
// private health modules stay out of search
await E('sy1','Health','symptoms',{what:'Migraine',sev:'Moderate',trig:'screens',note:'',date:ad(-1)});await go('search');await p.locator('#q').fill('Migraine');await p.waitForTimeout(400);ok(!/Symptoms log/.test(await text()),'private not in search');
await go('tool',{hub:'Health',tool:'symptoms'});await p.getByRole('button',{name:'Copy for your doctor'}).click();await p.waitForTimeout(300);ok(await R(()=>/Migraine \(moderate\)/.test(window._sh||'')),'symptom summary');
// cycle prediction
await E('cy1','Health','cycle',{what:'Period started',kind:'Period started',note:'',date:ad(-60)});await E('cy2','Health','cycle',{what:'Period started',kind:'Period started',note:'',date:ad(-32)});await E('cy3','Health','cycle',{what:'Period started',kind:'Period started',note:'',date:ad(-4)});
await go('tool',{hub:'Health',tool:'cycle'});ok(/28 days/.test(await text())&&/Cycle day\s*5/i.test(await text()),'cycle prediction');ok(!/Period started · Period started/.test(await text()),'no repeated label');
// faith streak
await E('fa1','Community','faith',{what:'Morning prayer',kind:'Prayer',n:10,note:'',date:ad(0)});await go('tool',{hub:'Community',tool:'faith'});ok(/Streak\s*1 day/i.test(await text()),'faith streak');
// bank csv import
await go('tool',{hub:'Finances',tool:'spending'});await p.getByRole('button',{name:'Spending options'}).click();await p.waitForTimeout(200);
const [fc]=await Promise.all([p.waitForEvent('filechooser'),menu('Import from a bank file')]);await fc.setFiles({name:'bank.csv',mimeType:'text/csv',buffer:Buffer.from('Date,Description,Amount\n11/02/2026,STARBUCKS #123,-6.45\n11/03/2026,PAYROLL,2500.00\n11/04/2026,"WEGMANS, AMHERST",-84.10\n')});await p.waitForTimeout(500);
t=await p.locator('.sheet').last().innerText();ok(/2 purchases/.test(t)&&/\$91/.test(t),'csv preview');await p.getByRole('button',{name:'Import'}).click();await p.waitForTimeout(400);
ok(await R(()=>{const l=window.__lifeos.get.all('entry').filter(x=>x.tool==='spending'&&x.f.src==='bank');return l.length===2&&l.some(x=>x.f.cat==='Dining out'&&x.f.amount===6.45)&&l.some(x=>x.f.cat==='Groceries'&&/WEGMANS, AMHERST/.test(x.f.what));}),'csv imported');
await p.getByRole('button',{name:'Spending options'}).click();await p.waitForTimeout(200);const [fc2]=await Promise.all([p.waitForEvent('filechooser'),menu('Import from a bank file')]);await fc2.setFiles({name:'bank.csv',mimeType:'text/csv',buffer:Buffer.from('Date,Description,Amount\n11/02/2026,STARBUCKS #123,-6.45\n')});await p.waitForTimeout(500);ok(/1 already in Spending/.test(await p.locator('.sheet').last().innerText()),'csv dedupe');await p.keyboard.press('Escape');await p.waitForTimeout(300);
// month letter
await go('reviews');await p.locator('.otidy',{hasText:/^Your /}).first().click();await p.waitForTimeout(300);ok(/Copy the letter/.test(await p.locator('.sheet').last().innerText()),'month letter');await p.keyboard.press('Escape');await p.waitForTimeout(200);
// chime setting exists and design tokens
ok(await R(()=>window.__lifeos.get.settings().chime===true),'chime default on');
ok(await R(()=>getComputedStyle(document.documentElement).getPropertyValue('--ink-3').trim().toUpperCase()==='#5E6762'),'contrast token');
ok(!errs.length,'errs '+errs);console.log(JSON.stringify({pass,fails},null,1));await b.close();})().catch(e=>{console.log('CRASH',e.message.slice(0,700));process.exit(1);});
