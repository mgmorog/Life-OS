// Cases added by later releases; loaded by test/todaylayout.cjs.
global.__todayMore=global.__todayMore||[];

// v309 · a real card for every module template
global.__todayMore.push(async({ev,ok,setL,today,base,W})=>{
  const pick=await ev(()=>{const L=window.__lifeos,out={};for(const h of ['Health','Home','Finances','Career','Family','Learning','Relationships','Recreation','Community','Life admin','Pets','Travel','Personal growth']){let ts=[];try{ts=L.toolsOf(h);}catch(e){}ts.forEach(t=>{if(t.tpl&&!out[t.tpl]&&!t.hide&&!(h==='Health'&&t.id==='checkin'))out[t.tpl]=[h,t.id];});}return out;});
  ok('v309 every template has a module to try',['log','checklist','countdown','collection'].every(k=>pick[k]),pick);
  const L=[...base.slice(0,3),...Object.values(pick).map(([h,id])=>({id:`m:${h}|${id}`})),{id:'also'}];
  await ev(()=>{});await setL(L);
  await ev(p=>{const T=window.__lifeos.t;Object.values(p).forEach(([h,id])=>T.setToolOn(h,id,true));},pick);await today();
  const seen=await ev(p=>Object.fromEntries(Object.entries(p).map(([k,[h,id]])=>{const c=document.querySelector(`[data-tk="m:${h}|${id}"]`);return[k,c?c.querySelector('.tmct small')?.textContent||'(no line)':null];})),pick);
  ok('v309 a card for each template',Object.values(seen).every(Boolean),seen);

  // checklist: make one item due, tick it from the card
  const [ch,cid]=pick.checklist;
  const made=await ev(([h,id])=>{const L=window.__lifeos;const r=L.create('entry',{hub:h,tool:id,f:{what:'Test filter',every:30,last:'2020-01-01',note:''}});return r.id;},[ch,cid]);
  await today();
  const ticked=await ev(([h,id,rid])=>{const c=document.querySelector(`[data-tk="m:${h}|${id}"]`);const row=[...c.querySelectorAll('.tmcli')].find(n=>n.textContent.includes('Test filter'));if(!row)return'no row';row.querySelector('.tick-hit button,.tick-hit [role=checkbox],.tick-hit *').click();return window.__lifeos.get.id(rid).f.last===window.__lifeos.todayK();},[ch,cid,made]);
  ok('v309 tick on a checklist card marks it done',ticked===true,ticked);
  await ev(id=>window.__lifeos.remove(id,{hard:true,silent:true}),made);

  // log: Log again adds one entry for today
  const [lh,lid]=pick.log;
  const r=await ev(([h,id])=>{const L=window.__lifeos,n0=L.t.entries(h,id).length;const t=L.toolOf(h,id);if(t.money)return{skip:true};L.create('entry',{hub:h,tool:id,f:{what:'Test log',n:'',note:'',date:'2020-01-02'}});return{n0:n0+1};},[lh,lid]);
  if(!r.skip){await today();
    const n1=await ev(([h,id])=>{const c=document.querySelector(`[data-tk="m:${h}|${id}"]`);const b=[...c.querySelectorAll('button')].find(x=>x.textContent==='Log again');if(!b)return -1;b.click();return window.__lifeos.t.entries(h,id).length;},[lh,lid]);
    ok('v309 Log again adds one entry',n1===r.n0+1,{n1,want:r.n0+1});
    await W(200);
    const undone=await ev(([h,id])=>{const u=[...document.querySelectorAll('.toast button,[class*=toast] button')].find(b=>/undo/i.test(b.textContent));if(!u)return'no undo';u.click();return window.__lifeos.t.entries(h,id).length;},[lh,lid]);
    ok('v309 and Undo takes it back',undone===r.n0,undone);
    await ev(([h,id])=>{window.__lifeos.t.entries(h,id).filter(x=>x.f.what==='Test log').forEach(x=>window.__lifeos.remove(x.id,{hard:true,silent:true}));},[lh,lid]);}
});
