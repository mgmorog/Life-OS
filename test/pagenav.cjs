const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const c=await b.newContext({viewport:{width:393,height:760},hasTouch:true,isMobile:true});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+process.cwd()+'/test/page.html');await p.waitForTimeout(600);
const cdp=await c.newCDPSession(p);await cdp.send('Emulation.setCPUThrottlingRate',{rate:4});
await p.evaluate(()=>window.__lifeos.App.go('more'));await p.waitForTimeout(800);
const run=async(label,fn)=>{
 await p.evaluate(()=>{const A=window.__lifeos.App;window.__r=[];if(!A._wr){A._wr=1;const o=A.render.bind(A);A.render=function(){const t=performance.now();o();window.__r.push([Math.round(t-window.__t0),Math.round(performance.now()-t),A.state.view]);};}
  window.__lt=[];new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__lt.push([Math.round(e.startTime-window.__t0),Math.round(e.duration)]))).observe({type:'longtask'});
  window.__f=[];window.__t0=performance.now();const t0=window.__t0;(function f(){const n=document.querySelector('#view .page .list, #view .page .card');window.__f.push([Math.round(performance.now()-t0),n?Math.round(n.getBoundingClientRect().top):null,document.querySelector('#view .page')&&document.querySelector('#view .page').dataset.k]);if(performance.now()-t0<900)requestAnimationFrame(f);})();});
 await fn();await p.waitForTimeout(1000);
 const o=await p.evaluate(()=>({r:window.__r,lt:window.__lt,f:window.__f}));console.log(label,JSON.stringify(o.r),'long',JSON.stringify(o.lt));console.log(o.f.map(x=>x[0]+':'+x[1]).join(' '));};
await run('push',()=>p.locator('.li',{hasText:'Organize'}).first().click());
await run('pop',()=>p.evaluate(()=>window.__lifeos.App.back()));
console.log('errs',errs);await b.close();})();
