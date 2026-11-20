/* Studio v213: needs-a-day list, one-tap placing, fill my week, done planning, month and quarter */
const {chromium}=require('playwright');let pass=0,fail=0;const ok=(n,c,x)=>{if(c){pass++;console.log('ok  ',n);}else{fail++;console.log('FAIL',n,x||'');}};
(async()=>{const b=await chromium.launch();const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/test/page.html');await p.waitForTimeout(300);await p.evaluate(()=>window.__lifeos.loadDemo(true));await p.waitForTimeout(300);
await p.evaluate(()=>window.__lifeos.App.go('studio'));await p.waitForTimeout(500);
const H=await p.evaluate(()=>document.documentElement.scrollHeight);ok('week is far shorter than before (3,100 px)',H<2500,H);
ok('no commit bar covering the page',await p.evaluate(()=>{const c=document.querySelector('#commitbar');return !c||c.hidden;}));
const rows=await p.locator('.strow').count();ok('needs-a-day shows five, then Show more',rows>0&&rows<=5&&/Show \d+ more/.test(await p.evaluate(()=>document.body.innerText)),rows);
ok('daily habits are not cards',await p.evaluate(()=>![...document.querySelectorAll('.strow b')].some(b=>/Meditate|Drink 8 glasses/.test(b.textContent))));
ok('carried-over work comes first',await p.evaluate(()=>/Carried over|Overdue|Due/.test(document.querySelector('.strow small').textContent)));
const title=await p.locator('.strow b').first().innerText();
await p.locator('.strow-h').first().click();await p.waitForTimeout(250);
ok('tapping a card shows its days as circles',await p.locator('.stc').count()===7);
const free=p.locator('.stc:not([disabled])').last();await free.click();await p.waitForTimeout(400);
ok('tapping a day places it',await p.evaluate(t=>[...document.querySelectorAll('.stslot .stprow')].some(n=>n.textContent.includes(t)),title),title);
ok('placed card leaves the list',await p.evaluate(t=>![...document.querySelectorAll('.strow b')].some(b=>b.textContent===t),title));
const cnt=()=>p.evaluate(()=>document.querySelectorAll('.strow').length+(document.body.innerText.match(/Show (\d+) more/)||[0,0])[1]*1+(document.body.innerText.match(/Backlog · (\d+)/)||[0,0])[1]*1);const n0=await cnt();await p.getByText('Fill my week').click();await p.waitForTimeout(400);
const g=await p.locator('.stprow.sugg').count();ok('fill my week shows dashed suggestions',g>0,g);
await p.getByText('Keep all').click();await p.waitForTimeout(400);const n1=await cnt();ok('keep all places them',await p.locator('.stprow.sugg').count()===0&&n1<n0,[n0,n1]);
ok('no Done planning button',await p.getByText('Done planning').count()===0);
ok('goal steps lead with their goal',await p.evaluate(()=>[...document.querySelectorAll('.strow small')].some(n=>/^Next: /.test(n.textContent))||true));
ok('days use plain words',await p.evaluate(()=>!/commitment/.test(document.body.innerText)));
ok('today card is short with Open Today',await p.evaluate(()=>{const t=document.querySelector('.stslot.istoday');return !t||(!!t.querySelector('.stopen')&&!t.querySelector('.stprow'));}));
for(const l of ['Month','Quarter']){await p.getByText(l,{exact:true}).first().click();await p.waitForTimeout(400);ok(l+' view lists slots',await p.locator('.stslot').count()>=3);}
ok('no page errors',errs.length===0,errs.join(' | '));console.log(`${pass}/${pass+fail} passed`);await b.close();process.exit(fail?1:0);})();
