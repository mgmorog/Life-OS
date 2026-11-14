const {chromium}=require('playwright');
let pass=0;const fails=[];const ok=(c,m)=>{if(c)pass++;else fails.push(m);};
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:393,height:760},hasTouch:true,isMobile:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/test/page.html');await p.waitForTimeout(600);
const R=(f,a)=>p.evaluate(f,a);
await R(()=>{window.__s=[];window.__ind=document.querySelector('.tab-ind');(function f(){const i=document.querySelector('.tab-ind');window.__s.push({same:i===window.__ind,x:new DOMMatrix(getComputedStyle(i).transform).m41,o:getComputedStyle(i).opacity,act:document.querySelectorAll('.nav .tab.act').length,icbg:[...document.querySelectorAll('.nav .tab .ic')].filter(n=>getComputedStyle(n).backgroundColor!=='rgba(0, 0, 0, 0)').length});requestAnimationFrame(f);})();});
for(const n of ['Studio','Calendar','More','Today']){await p.locator('.nav .tab',{hasText:n}).click();await p.waitForTimeout(700);
  const v=await R(()=>{const a=document.querySelector('.nav .tab.act .ic').getBoundingClientRect(),i=document.querySelector('.tab-ind').getBoundingClientRect();return{d:Math.abs(a.left+a.width/2-(i.left+i.width/2)),view:window.__lifeos.App.state.view};});
  ok(v.d<1.5,n+' indicator lands under icon '+JSON.stringify(v));}
const s=await R(()=>window.__s);
ok(s.every(f=>f.same),'indicator element never replaced');ok(s.every(f=>f.o==='1'),'indicator never blinks');ok(s.every(f=>f.act===1),'exactly one active tab every frame');ok(s.every(f=>f.icbg===0),'no second highlight');
let jumps=0;for(let i=2;i<s.length;i++){if(Math.abs(s[i].x-s[i-1].x)>60)jumps++;}ok(jumps===0,'no teleporting frames '+jumps);
await p.locator('.nav .tab',{hasText:'Calendar'}).click();await p.waitForTimeout(90);await p.locator('.nav .tab',{hasText:'Studio'}).click();await p.waitForTimeout(800);
ok(await R(()=>window.__lifeos.App.state.view)==='studio','interrupt lands on studio');
await p.screenshot({path:'test/tabbar.png',clip:{x:0,y:680,width:393,height:80}});
ok(!errs.length,'no errors '+errs);console.log(pass+' passed',fails.length?'\nFAIL:\n'+fails.join('\n'):'');await b.close();})();
