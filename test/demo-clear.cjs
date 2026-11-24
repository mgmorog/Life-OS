// v316 · Clear the demo removes everything the demo added or that was made from it, and keeps the user's own data.
// Run `bash mk.sh && node test/demo-clear.cjs` from the repo root. Exits 1 on any failure.
const {chromium}=require('playwright');
const path=require('path');
const CHROME=process.env.CHROME||'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome';
(async()=>{
  const b=await chromium.launch({executablePath:CHROME});
  const p=await (await b.newContext({viewport:{width:390,height:844}})).newPage();
  const errs=[];p.on('pageerror',x=>errs.push(x.message));
  await p.goto('file://'+path.join(__dirname,'page.html'));await p.waitForTimeout(800);
  let fails=0;const ok=(n,c,i)=>{console.log((c?'  ok   ':'  FAIL ')+n+(c?'':'  → '+JSON.stringify(i)));if(!c)fails++;};
  const ev=(fn,a)=>p.evaluate(fn,a);const W=m=>p.waitForTimeout(m);
  const confirm=async()=>{await W(400);const btn=await p.$('text=Clear demo');if(btn)await btn.click();await W(800);};
  const counts=()=>ev(()=>{const L=window.__lifeos,o={};[...L.recs.values()].forEach(r=>{if(r.kind!=='settings')o[r.kind]=(o[r.kind]||0)+1;});return o;});

  // my own data, made before the demo
  await ev(()=>{const L=window.__lifeos;L.create('task',{title:'My real task',date:null,repeat:{type:'never'},steps:[]});L.create('idea',{title:'My real idea',photos:[]});});
  await ev(()=>window.__lifeos.loadDemo());await W(1200);
  // what leaked before v316: step-to-task move, an idea turned into a task and an entry (reworded), a rewards record, an auto net-worth snap
  await ev(()=>{const L=window.__lifeos;L.recs.forEach(r=>{if(r.kind==='project'&&!(r.steps||[]).length)r.steps=[{id:'x'+Math.random().toString(36).slice(2),t:'Legacy step',d:false}];});L.migrate();
    L.create('task',{title:'Snow tires before Dec',date:null,repeat:{type:'never'},steps:[]});L.create('entry',{hub:'Recreation',tool:'queue',f:{what:'Hidden Brain episode on habits'}});
    L.create('entry',{hub:'Finances',tool:'networth',f:{t:'snap',auto:true,assets:8058,debts:0,date:'2026-11-21'}});
    L.put({id:'rewards',kind:'rewards',init:true,badges:{tasks100:'x'},seen:{},bests:{},frz:{n:1,got:{},used:0,asked:{}}},{silent:true});});
  const before=await counts();
  ok('demo loaded with step tasks',(before.task||0)>100,before);
  await ev(()=>window.__lifeos.clearDemo());await confirm();
  const left=await ev(()=>{const L=window.__lifeos;return [...L.recs.values()].filter(r=>!['settings','rewards'].includes(r.kind)).map(r=>r.title||(r.f&&r.f.what)||r.kind);});
  ok('only my own items are left',left.length===2&&left.includes('My real task')&&left.includes('My real idea'),left);
  const rw=await ev(()=>{const r=window.__lifeos.recs.get('rewards');return r?Object.keys(r.badges||{}):[];});
  ok('demo badges are gone',!rw.includes('tasks100'),rw);
  const st=await ev(()=>{const s=window.__lifeos.recs.get('settings');return{snap:s.demoSnap||null,top3:Object.keys(s.top3||{}).length};});
  ok('settings back and no stale priorities',!st.snap&&st.top3===0,st);

  // leftovers from an older clear (no demo flag, no snapshot) are still found and offered
  await ev(()=>{const L=window.__lifeos;L.put({id:'pt-old1',kind:'task',title:'Pick a paint color',part:'pgone',date:null,repeat:{type:'never'},steps:[]},{silent:true});L.create('task',{title:'Ask Jordan about the 2027 budget timeline',repeat:{type:'never'},steps:[]});});
  ok('leftovers detected without a demo loaded',(await ev(()=>window.__lifeos.demoSweep().length))===2);
  await ev(()=>window.__lifeos.clearDemo());await confirm();
  const left2=await ev(()=>[...window.__lifeos.recs.values()].filter(r=>!['settings','rewards'].includes(r.kind)).length);
  ok('legacy leftovers cleared, own data kept',left2===2,left2);
  ok('no page errors',!errs.length,errs);
  await b.close();process.exit(fails?1:0);
})();
