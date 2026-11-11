const {chromium}=require('playwright');const fs=require('fs');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/test/page.html');await p.waitForTimeout(300);await p.getByRole('button',{name:'Load examples'}).click();await p.waitForTimeout(300);
const cdp=await c.newCDPSession(p);
const touch=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y}]});
// long-press a timed block on touch: what happens?
const bb=await p.locator('.blk').first().boundingBox();
await touch('touchStart',bb.x+120,bb.y+15);await p.waitForTimeout(600);
const during=await p.evaluate(()=>({menu:!!document.querySelector('.menu'),ghost:!!document.querySelector('.ghost')}));
await touch('touchEnd');await p.waitForTimeout(200);
console.log('long-press block',during,await p.evaluate(()=>({menu:!!document.querySelector('.menu'),ghost:!!document.querySelector('.ghost')})));
await p.evaluate(()=>{document.querySelector('.mscrim')?.click()});
// repeating item: move a later occurrence
const r=await p.evaluate(()=>{const L=window.__lifeos,t=L.todayK();const y=new Date(Date.now()-864e5*3);const sk=`${y.getFullYear()}-${String(y.getMonth()+1).padStart(2,'0')}-${String(y.getDate()).padStart(2,'0')}`;const rec=L.create('task',{title:'Repeating',steps:[],date:sk,time:null,repeat:{type:'custom',unit:'day',n:1,end:null},priority:'normal'});return{sk,t,id:rec.id};});
await p.waitForTimeout(100);
console.log('errs',errs);await b.close();})();
