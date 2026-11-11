const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:1});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/test/page.html');await p.waitForTimeout(400);
const sheetH=async n=>{const sh=p.locator('.sheet').last();return await sh.evaluate(x=>({h:x.offsetHeight,sh:x.querySelector('.sbody')?.scrollHeight,cl:x.querySelector('.sbody')?.clientHeight,active:document.activeElement.id}));};
for(const[n,l]of [['task','+ Task'],['block','+ Time block'],['allday','+ All-day']]){await p.getByRole('button',{name:l}).first().click();await p.waitForTimeout(450);console.log(n,await sheetH());await p.screenshot({path:`test/fm-${n}.png`});
 const buf=await p.locator('.sheet').last().locator('.sbody').evaluate(x=>{x.style.maxHeight='none';return x.scrollHeight;});
 await p.keyboard.press('Escape');await p.waitForTimeout(350);if(await p.getByRole('button',{name:'Discard'}).count()){await p.getByRole('button',{name:'Discard'}).click();await p.waitForTimeout(300);}}

const R=(f,a)=>p.evaluate(f,a);const ok=(c,m)=>console.log(c?'ok  ':'FAIL',m);
const open=async l=>{await p.getByRole('button',{name:l}).first().click();await p.waitForTimeout(450);};
const close=async()=>{await p.locator('.sheet').last().getByRole('button',{name:'Cancel'}).click();await p.waitForTimeout(300);if(await p.getByRole('button',{name:'Discard'}).count()){await p.getByRole('button',{name:'Discard'}).click();await p.waitForTimeout(350);}};
// tap empty Add -> title focused, sheet stays
await open('+ Task');ok(await R(()=>!document.activeElement.matches('input,textarea')),'keyboard down on open');
await p.locator('.sheet').last().getByRole('button',{name:'Add',exact:true}).click({force:true});await p.waitForTimeout(100);ok(await R(()=>document.activeElement.id)==='f-task-title','empty Add goes to title');
await p.keyboard.type('Enter test');await p.keyboard.press('Enter');await p.waitForTimeout(250);ok(await p.locator('.sheet').count()>0&&await R(()=>document.activeElement.id!=='f-task-title'),'return puts keyboard away, form stays');
await p.getByRole('switch',{name:'Set a deadline'}).click();await p.waitForTimeout(100);
await p.getByRole('switch',{name:'Set a deadline'}).click();
await p.locator('.sheet').last().getByText('Date',{exact:true}).click();await p.waitForTimeout(150);await p.getByRole('button',{name:'No date'}).click();await p.waitForTimeout(150);await p.getByRole('switch',{name:'Repeat'}).click();await p.waitForTimeout(150);ok(!(await p.locator('.sheet').last().innerText()).includes('No date'),'repeat picks up a date');
await p.locator('#f-task-title').click();await p.waitForTimeout(60);await p.locator('.sheet').last().getByText('Deadline',{exact:true}).click();await p.waitForTimeout(120);ok(await R(()=>document.activeElement.id!=='f-task-title'),'tap a row blurs');
await p.locator('.sheet').last().getByRole('button',{name:'Add',exact:true}).click();await p.waitForTimeout(400);
const t=await R(()=>[...window.__lifeos.recs.values()].find(r=>r.title==='Enter test'));ok(t&&t.date&&t.repeat.type!=='never','saved repeating with date');
// block
await open('+ Time block');await p.locator('#f-block-title').fill('Late');const st=await p.locator('.sheet').last().screenshot({path:'test/fm-block2.png'});
await p.locator('.sheet').last().getByText('Life area').scrollIntoViewIfNeeded();await p.locator('.sheet').last().getByText('Appearance',{exact:true}).click();await p.waitForTimeout(150);await p.screenshot({path:'test/fm-block3.png'});
ok(await p.locator('.sheet').last().locator('.pvchip').isVisible(),'preview by color');await close();
// all-day multi labels
await open('+ All-day');await p.getByRole('switch',{name:'Multiple days'}).click();await p.waitForTimeout(150);const x=await p.locator('.sheet').last().innerText();ok(x.includes('First day')&&x.includes('Last day'),'first and last day');ok(!/\bnull\b/.test(x),'no stray null under calendar');await p.screenshot({path:'test/fm-ad2.png'});await close();
console.log(errs);await b.close();})();
