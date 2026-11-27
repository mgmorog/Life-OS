try{if(!document.documentElement.lang)document.documentElement.lang='en';}catch(e){}
/* append skips empty slots and accepts lists, so a missing optional piece never prints as text */
{const native=Element.prototype.append;Element.prototype.append=function(...k){native.apply(this,k.flat(Infinity).filter(x=>x!=null&&x!==false));};}
/* ---------- DOM helpers ---------- */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const el=(t,a={},...kids)=>{const e=document.createElement(t);for(const k in a){const v=a[k];if(v==null||v===false)continue;if(k==='class')e.className=v;else if(k==='html')e.innerHTML=v;else if(k==='style')e.setAttribute('style',v);else if(k==='value')e.value=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else e.setAttribute(k,v===true?'':v);}for(const c of kids.flat(Infinity)){if(c==null||c===false)continue;e.append(c.nodeType?c:document.createTextNode(c));}return e;};
/* ---- Components: every button, row, chip, icon button and page header in the app is drawn by one of these ---- */
const BTN_V={primary:'primary',tonal:'tonal',secondary:'line',quiet:'quiet',danger:'line danger',text:'text',link:'link'};
function Button(label,{variant='secondary',size='md',icon=null,full=false,tone=null,cls='',...rest}={}){
  if(variant==='link'){const chev=rest.chevron;delete rest.chevron;const k=['linkbtn',size==='sm'?'small':'',tone==='danger'?'danger':'',cls].filter(Boolean).join(' ');
    return el(rest.href?'a':'button',{type:rest.href?null:'button',...rest,class:k},icon?el('span',{style:'display:grid',html:ic(icon,size==='sm'?14:16,2.2)}):null,label,chev?el('span',{class:'lchev',html:ic('chevr',size==='sm'?12:14,2.4)}):null);}
  const c=['btn',BTN_V[variant]||'line',size==='sm'?'sm':size==='lg'?'lg':'',full?'block':'',tone==='danger'&&variant!=='danger'?'danger':'',cls].filter(Boolean).join(' ');
  if(icon&&rest.html==null)rest.html=ic(icon,size==='sm'?14:16)+(label!=null&&typeof label!=='object'?esc(String(label)):'');
  return el(rest.href?'a':'button',{type:rest.href?null:'button',...rest,class:c},rest.html!=null&&icon?null:label);
}
function IconButton(label,{size='md',icon=null,cls='',...rest}={},...kids){
  const c=['iconbtn',size==='sm'?'sm':'',cls].filter(Boolean).join(' ');
  if(icon&&rest.html==null)rest.html=ic(icon,size==='sm'?18:20);
  return el('button',{type:'button',...rest,class:c,'aria-label':label},...kids);
}
function Chip(label,{variant='filter',selected=false,icon=null,as='button',cls='',...rest}={}){
  const c=['chip',variant,selected?'on':'',cls].filter(Boolean).join(' ');
  if(icon&&rest.html==null)rest.html=ic(icon,IC.xs)+(label!=null&&typeof label!=='object'?esc(String(label)):'');
  return el(as,{...(as==='button'?{type:'button'}:{}),...rest,class:c},rest.html!=null&&icon?null:label);
}
/* v239 · the end of a row: a chevron, a value, a count or a small button, always the same distance from the edge */
function RowEnd(t){if(t==null||t===false)return null;if(t==='chevron')return el('span',{class:'rend chev','aria-hidden':'true',html:ic('chevr',IC.sm)});if(t&&t.nodeType)return el('span',{class:'rend'},t);if(typeof t==='object'){if('count' in t)return el('span',{class:'rend n tnum'},String(t.count));if('value' in t)return el('span',{class:'rend v tnum'},t.value);if('button' in t)return el('span',{class:'rend'},t.button);}return el('span',{class:'rend v'},String(t));}
function Row({lead=null,title=null,sub=null,trail=null,onOpen=null,swipe=null,menu=null,as=null,cls='',...rest}={},...kids){
  const tag=as||(onOpen||rest.onclick?'button':'div');
  const n=el(tag,{...(tag==='button'?{type:'button'}:{}),...rest,class:['li',cls].filter(Boolean).join(' '),onclick:onOpen||rest.onclick||null});
  if(title!=null)n.append(...[lead,el('span',{class:'grow'},el('b',{class:'rt'},title),sub!=null&&sub!==''?el('small',{},sub):null),trail&&(typeof trail==='string'||(!trail.nodeType&&!Array.isArray(trail)))?RowEnd(trail):trail].filter(x=>x!=null&&x!==false));
  for(const k of kids.flat(Infinity))if(k!=null&&k!==false)n.append(k.nodeType?k:document.createTextNode(k));
  if(swipe&&typeof swipeAct==='function')swipeAct(n,swipe);
  if(menu)holdMenu(n,typeof menu==='function'?()=>menu():menu);
  return n;
}
function PageHeader({back=null,title,subtitle=null,actions=null,controls=null,cls='',titleClass='',titleStyle=null,rowClass='',after=null}={}){
  const bk=back?(back.nodeType?back:backBtn(back.label||'More',back.to||'more')):null;
  const acts=(Array.isArray(actions)?actions:[actions]).flat(Infinity).filter(Boolean);
  const top=bk||acts.length?el('div',{class:'pghead'},bk||el('span'),acts.length?el('div',{class:'pgacts'},...acts):null):null;
  const h=el('h1',{class:['pgtitle',titleClass].filter(Boolean).join(' '),style:titleStyle},title);
  return el('header',{class:['phead',cls].filter(Boolean).join(' ')},top,el('div',{class:[controls?'otitle phead-ctl':'otitle',rowClass].filter(Boolean).join(' ')},h,controls),subtitle?el('div',{class:'small muted pgsub'},subtitle):null,after);
}
/* v238 · SectionLabel, Check, SearchField, FilterRow, Caption and FloatingBar */
function SectionLabel(text,{count=null,action=null,sticky=false,cls='',...rest}={}){
  return el('div',{...rest,class:['slabel',sticky?'shstick':'',cls].filter(Boolean).join(' ')},el('span',{class:'lbl'},text,count!=null&&count!==''?el('i',{class:'scount tnum'},String(count)):null),el('span',{class:'sgrow'}),action||null);
}
/* one check circle; static when there's nothing to toggle */
function Check({on=false,label='',size='md',onChange=null,cls=''}={}){
  if(onChange){const b=tickBtn(on,onChange,label?`Mark ${label} done`:'Mark done');if(size==='sm')b.classList.add('sm');if(cls)b.classList.add(...cls.split(' '));return b;}
  return el('span',{class:['tick',on?'on':'',size==='sm'?'sm':'',cls].filter(Boolean).join(' '),role:'img','aria-label':on?'Done':'Not done',html:ic('check',size==='sm'?12:14,3)});
}
function SearchField({placeholder='Search',value='',onInput=null,id=null,label=null,cls='',onEnter=null}={}){
  const inp=el('input',{id,type:'search',placeholder,value,'aria-label':label||placeholder,autocomplete:'off',autocorrect:'off',spellcheck:'false',enterkeyhint:'search'});
  const x=el('button',{type:'button',class:'sfclear','aria-label':'Clear search',hidden:!value,html:ic('x',IC.xs)});
  const fire=()=>{x.hidden=!inp.value;onInput&&onInput(inp.value);};
  inp.addEventListener('input',fire);
  inp.addEventListener('keydown',e=>{if(e.key==='Escape'&&inp.value){e.preventDefault();e.stopPropagation();inp.value='';fire();}else if(e.key==='Enter'&&onEnter){onEnter(inp.value);}});
  x.addEventListener('click',e=>{e.preventDefault();inp.value='';fire();inp.focus();});
  const w=el('label',{class:['sfield',cls].filter(Boolean).join(' ')},el('span',{class:'sfic',html:ic('search',IC.md)}),inp,x);w.input=inp;return w;
}
/* a sideways row of filter pills: counts in one place, a soft fade at the edge, and an optional memory */
function FilterRow(options,value,onChange,{multi=false,key=null,cls='',extra=null}={}){
  const opts=options.map(o=>Array.isArray(o)?{value:o[0],label:o[1],count:o[2]}:o);
  const isOn=v=>multi?(value instanceof Set?value.has(v):(value||[]).includes(v)):value===v;
  const row=el('div',{class:['frow',cls].filter(Boolean).join(' '),role:'group'},opts.map(o=>el('button',{type:'button',class:'chip filter'+(isOn(o.value)?' on':''),'aria-pressed':String(isOn(o.value)),onclick:()=>{if(key)try{localStorage.setItem('lifeos-fr-'+key,JSON.stringify(o.value));}catch(e){}onChange(o.value);}},o.label,o.count!=null&&o.count!==''?el('i',{class:'hcnt'},String(o.count)):null)),extra);
  requestAnimationFrame(()=>{const on=row.querySelector('.on');if(on&&row.scrollWidth>row.clientWidth&&on.offsetLeft+on.offsetWidth>row.clientWidth)row.scrollLeft=on.offsetLeft-24;const fade=()=>row.classList.toggle('more',row.scrollLeft+row.clientWidth<row.scrollWidth-4);fade();row.addEventListener('scroll',fade,{passive:true});});
  return row;
}
FilterRow.saved=(key,def)=>{try{const v=localStorage.getItem('lifeos-fr-'+key);return v==null?def:JSON.parse(v);}catch(e){return def;}};
function Caption(text,{tone='muted',as='small',cls='',...rest}={}){
  const parts=Array.isArray(text)&&text.every(x=>x==null||x===false||typeof x==='string'||typeof x==='number')?text.filter(x=>x!=null&&x!==''&&x!==false):null;
  return el(as,{...rest,class:['cap',tone!=='muted'?tone:'',cls].filter(Boolean).join(' ')},parts?parts.flatMap((p,i)=>i?[' · ',p]:[p]):text);
}
/* floating bars stack in one place above the tab bar and never cover each other */
function floatStack(place='bottom'){let s=$('#floatstack-'+place);if(!s){s=el('div',{id:'floatstack-'+place,class:'floatstack '+place,'aria-live':'polite'});document.body.append(s);if(place==='bottom'&&window.ResizeObserver)new ResizeObserver(()=>{const h=s.offsetHeight;document.documentElement.style.setProperty('--float-h',h?h+8+'px':'0px');document.body.classList.toggle('hasfloat',h>0);}).observe(s);}return s;}
function mountFloat(node,place='bottom'){node.dataset.page='1';node.classList.add('fbar2');floatStack(place).append(node);return node;}
function FloatingBar({content,actions=null,place='bottom',id=null,page=false,cls='',onClose=null,label=null}={}){
  if(id){const old=document.getElementById(id);if(old)old.remove();}
  const b=el('div',{id,class:['fbar2',cls].filter(Boolean).join(' '),role:'group','aria-label':label,'data-page':page?'1':null},content,actions?el('div',{class:'fbacts'},actions):null);
  b.close=()=>{if(!b.isConnected)return;b.classList.add('out');setTimeout(()=>{b.remove();onClose&&onClose();},220);};
  floatStack(place).append(b);document.body.classList.add('hasfloat');return b;
}
/* v239 · a row of stats: equal columns with dividers; wraps to two rows on a narrow phone */
function StatRow(stats,{cls='',size='md',...rest}={}){const items=stats.filter(Boolean).map(x=>x&&x.nodeType?x:Array.isArray(x)?Stat({value:x[0],label:x[1],trend:x[2],size}):Stat(Object.assign({size},x)));return el('div',{...rest,class:['statrow',items.length>3?'many':'',cls].filter(Boolean).join(' ')},items);}
/* v237 · Stat, QuickAdd, IconTile, Stepper and DateBadge (links are Button({variant:'link'})) */
function Stat({value,label=null,size='md',trend=null,cls='',...rest}={}){
  const tr=trend==null||trend===''?null:typeof trend==='object'?trend:{dir:/^-|^−|▼/.test(String(trend))?'down':'up',text:String(trend).replace(/^[+\-−▲▼]\s*/,'')};
  return el('div',{...rest,class:['stat',size,cls].filter(Boolean).join(' ')},el('b',{class:'stv tnum'},value==null?'–':String(value)),label!=null||tr?el('span',{class:'stl'},label,tr?el('em',{class:'str '+tr.dir,'aria-label':`${tr.dir==='down'?'down':'up'} ${tr.text}`},`${tr.dir==='down'?'▼':'▲'} ${tr.text}`):null):null);
}
/* one add row: Return adds and keeps the keyboard up, pasted lines add one each, dates like "Friday" are picked up */
function QuickAdd({placeholder='Add',onAdd,parse=true,id=null,base=null,value='',label=null,cls='',oninput=null}={}){
  const inp=el('input',{id,placeholder,'aria-label':label||placeholder,enterkeyhint:'done',autocomplete:'off',autocapitalize:'sentences',value,oninput});
  const add=raw=>{raw=String(raw||'').trim();if(!raw)return false;const w=parse?parseWhen(raw,base?fromK(base):new Date()):{};return onAdd(w.title||raw,Object.assign({raw},w))!==false;};
  const refocus=()=>{if(!id)return;App.state._qaFocus=id;};
  inp.addEventListener('keydown',e=>{if(e.key!=='Enter'||e.isComposing)return;e.preventDefault();if(add(inp.value)){inp.value='';refocus();if(inp.isConnected)inp.focus({preventScroll:true});}});
  inp.addEventListener('paste',e=>{const t=(e.clipboardData||window.clipboardData)?.getData('text')||'';if(!/\n/.test(t.trim()))return;pasteLines(e,ls=>{let n=0;ls.forEach(l=>{if(add(l))n++;});if(n>1)toast(`${n} added`);refocus();});});
  const row=el('label',{class:['qadd-row',cls].filter(Boolean).join(' ')},el('span',{class:'pplus',html:ic('plus',IC.xs)}),inp);row.input=inp;return row;
}
function IconTile(icon,{size='md',tone=null,html=null,cls='',style=null,...rest}={}){
  const px={sm:14,md:18,lg:24}[size]||18;
  return el('span',{...rest,class:['itile',size,cls].filter(Boolean).join(' '),style:[tone?`--c:${tone}`:'',style||''].filter(Boolean).join(';')||null,html:html!=null?html:(icon?ic(icon,px,1.9):'')});
}
/* a stepper that updates as you tap, repeats while held, and says its value */
function Stepper(value,{min=0,max=999,step=1,format=v=>v,onChange=null,label='Value',cls=''}={}){
  let v=+value||0;const out=el('b',{class:'sv tnum','aria-live':'polite'},String(format(v)));
  const lo=el('button',{type:'button','aria-label':`Less ${label.toLowerCase()}`,html:ic('minus',IC.sm)}),hi=el('button',{type:'button','aria-label':`More ${label.toLowerCase()}`,html:ic('plus',IC.sm)});
  const sync=()=>{out.textContent=String(format(v));lo.disabled=v<=min;hi.disabled=v>=max;};
  const go=d=>{const n=Math.max(min,Math.min(max,Math.round((v+d*step)*1000)/1000));if(n===v)return false;v=n;sync();out.classList.remove('bump');void out.offsetWidth;out.classList.add('bump');buzz&&buzz(4);onChange&&onChange(v);return true;};
  [[lo,-1],[hi,1]].forEach(([b,d])=>{let t,iv;const stop=()=>{clearTimeout(t);clearInterval(iv);};
    b.addEventListener('pointerdown',e=>{e.preventDefault();e.stopPropagation();go(d);t=setTimeout(()=>{iv=setInterval(()=>{if(!b.isConnected||!go(d))stop();},110);},420);});
    ['pointerup','pointerleave','pointercancel'].forEach(x=>b.addEventListener(x,stop));
    b.addEventListener('click',e=>{e.stopPropagation();if(e.detail===0)go(d);});});
  const n=el('span',{class:['stp',cls].filter(Boolean).join(' '),role:'group','aria-label':label},lo,out,hi);sync();n.value=()=>v;return n;
}
/* month over day number; Today and Tomorrow in words; red when it's overdue */
function DateBadge(dk,{tone=null,cls='',...rest}={}){
  const d=fromK(dk),n=daysBetween(todayK(),dk),top=n===0?'Today':n===1?'Tmrw':MON[d.getMonth()].slice(0,3);
  const t=n<0?'late':(tone||(n===0?'today':''));
  return el('span',{...rest,class:['dbadge',t,cls].filter(Boolean).join(' '),'aria-label':shortDay(dk)},el('i',{},top),n===0?null:el('b',{class:'tnum'},String(d.getDate())));
}
/* v236 · Card, Field, Switch, Segmented, Progress and Picker: the rest of the shared pieces */
function Card({title=null,action=null,onAction=null,tone='plain',flush=false,as='section',cls='',...rest}={},...kids){
  const act=action==null?null:(action.nodeType||Array.isArray(action))?action:el('button',{type:'button',class:'linkbtn small chact',onclick:onAction},action);
  const head=title!=null||act?el('div',{class:'bl chead'},title!=null?(title.nodeType?title:el('span',{class:'lbl'},title)):el('span'),act):null;
  return el(as,{...rest,class:['card',tone==='tinted'?'tinted':tone==='alert'?'alert':'',flush?'flush':'',cls].filter(Boolean).join(' ')},head,...kids);
}
const toMinT=v=>{const m=/^(\d{1,2}):(\d{2})/.exec(v||'');return m?+m[1]*60+ +m[2]:null;};
const fromMinT=m=>`${pad2(Math.floor(m/60)%24)}:${pad2(m%60)}`;
/* dates and times open the Life OS calendar and wheel, never the phone's own */
function pickControl(type,value,on,{id=null,placeholder=null,min=null,label='',clear=true,cls=''}={}){
  let v=value==null?'':String(value);
  const b=el('button',{type:'button',class:['fpk',cls].filter(Boolean).join(' '),id,'aria-haspopup':'dialog'});
  const show=()=>{b.textContent=v?(type==='date'?shortDay(v):fmtT(toMinT(v))):(placeholder||(type==='date'?'Pick a date':'Pick a time'));b.classList.toggle('empty',!v);b.value=v;};
  const set=x=>{v=x||'';show();on(v);};
  b.addEventListener('click',e=>{e.preventDefault();e.stopPropagation();const ctx=formCtx(()=>{});let inst;
    if(type==='date')inst=openSheet({title:label||'Date',left:{label:'Cancel'},right:clear&&v?{label:'Clear',onclick:()=>{set('');inst.close();}}:null,build:bd=>bd.append(ctx.calendar(v||null,dk=>{set(dk);inst.close();},{minK:min}))});
    else{let m=v?toMinT(v):nextHour();inst=openSheet({title:label||'Time',left:{label:'Cancel'},right:{label:'Done',onclick:()=>{set(fromMinT(m));inst.close();}},build:bd=>bd.append(ctx.wheel(()=>m,x=>{m=x;}))});}});
  show();b._set=set;return b;
}
function Field({label=null,type='text',value='',hint=null,error=null,placeholder=null,options=null,onInput=null,control=null,id=null,cls='',style=null,rows=3,min=null,clear=true,...attrs}={}){
  const fire=v=>onInput&&onInput(v);let c=control;
  if(!c){
    if(type==='choice'){c=el('select',{id,...attrs,onchange:e=>fire(e.target.value)},(options||[]).map(o=>{const[v,l]=Array.isArray(o)?o:[o,o];const op=el('option',{value:v},l);if(String(value)===String(v))op.selected=true;return op;}));}
    else if(type==='long'){c=el('textarea',{id,rows,placeholder,...attrs,oninput:e=>fire(e.target.value)});c.value=value??'';}
    else if(type==='date'||type==='time')c=pickControl(type,value,fire,{id,placeholder,min,label:typeof label==='string'?label:'',clear});
    else c=el('input',{id,type:type==='number'?'text':type,inputmode:type==='number'?'decimal':null,placeholder,value:value??'',autocomplete:'off',...attrs,oninput:e=>fire(e.target.value)});
  }
  if(error)c.setAttribute('aria-invalid','true');
  return el(type==='date'||type==='time'?'div':'label',{class:['field',error?'bad':'',cls].filter(Boolean).join(' '),style},label!=null?el('span',{class:'eyebrow'},label):null,c,error?el('small',{class:'ferr',role:'alert'},error):hint?el('small',{class:'fhint'},hint):null);
}
function Switch({on=false,label,sub=null,lead=null,onChange=null,flip=true,weight=500,cls='',...rest}={}){
  const k=swMake(!!on,typeof label==='string'?label:(rest['aria-label']||''),(v,e)=>onChange&&onChange(v,e),flip);
  const r=Row({as:'div',cls,...rest},lead,el('span',{class:'grow'},el('b',{style:`font-weight:${weight}`},label),sub?el('small',{},sub):null),k);
  r.style.cursor='pointer';r.addEventListener('click',e=>{if(e.target.closest('.sw,a,button,input,select,textarea'))return;k.click();});return r;
}
function Segmented(options,value,onChange,{size='md'}={}){const s=seg(options.map(o=>Array.isArray(o)?o:[o,o]),value,onChange);if(size==='sm')s.classList.add('sm');return s;}
function Progress(value,{kind='bar',size='md',tone=null,label=null,icon=null,cls='',mark=null,steps=0,cur=false,onStep=null,stepWord='Step',...rest}={}){
  const f=Math.max(0,Math.min(1,+value||0)),sz=size==='sm'?'sm':size==='lg'?'lg':'';
  if(kind==='ring')return el('span',{...rest,class:['ring',sz,cls].filter(Boolean).join(' '),style:`--p:${+(f*100).toFixed(2)}`+(tone?`;--ring-c:${tone}`:'')},icon?el('span',{html:icon}):el('span',{},label));
  if(kind==='steps'){const d=Math.round(f*steps);return el('div',{...rest,class:['segs',sz,cls].filter(Boolean).join(' '),style:tone?`--seg-c:${tone}`:null},Array.from({length:steps},(_,i)=>{const c=i<d?'on':(cur&&i===d?'cur':'');return onStep?el('button',{type:'button',class:c,'aria-label':`${stepWord} ${i+1}`,onclick:()=>onStep(i)}):el('i',{class:c});}));}
  return el('div',{role:'progressbar','aria-valuemin':'0','aria-valuemax':'100','aria-valuenow':String(Math.round(f*100)),...rest,class:['hmeter',sz==='lg'?'tall':sz,cls].filter(Boolean).join(' ')},el('i',{style:`width:${+(f*100).toFixed(2)}%`+(tone?`;background:${tone}`:'')}),mark!=null?el('b',{style:`left:${mark*100}%`}):null);
}
/* one picker sheet: search on top, recent picks first, ticks for several, Done when it's more than one */
function Picker({title,items,search=null,multi=false,selected=[],onPick,recentKey=null,max=null,min=0,footer=null,note=null,left='Cancel',emptyText='No matches'}){
  const its=items.map(x=>Array.isArray(x)?{value:x[0],label:x[1],sub:x[2]}:x);
  let rec=[];if(recentKey){try{rec=JSON.parse(localStorage.getItem('lifeos-pick-'+recentKey)||'[]');}catch(e){}}
  const remember=v=>{if(!recentKey)return;try{localStorage.setItem('lifeos-pick-'+recentKey,JSON.stringify([v,...rec.filter(x=>x!==v)].slice(0,4)));}catch(e){}};
  const sel=new Set(multi?selected:[]);let q='',inst;const box=el('div',{});
  const useSearch=search??its.length>8;
  const draw=()=>{box.innerHTML='';const f=q.trim();
    let xs=f?its.map(x=>[x,Math.max(fuzzyScore(String(x.label),f),x.sub?fuzzyScore(String(x.sub),f)*.6:0)]).filter(p=>p[1]>0).sort((a,b)=>b[1]-a[1]).map(p=>p[0]):its;
    const recent=!f&&rec.length&&its.length>6?rec.map(v=>its.find(x=>x.value===v)).filter(Boolean):[];
    const row=x=>{const on=multi?sel.has(x.value):selected.includes(x.value);return Row({style:'','aria-pressed':multi||selected.length?String(on):null,cls:x.cls||'',onclick:()=>{if(x.disabled)return;if(multi){if(on)sel.delete(x.value);else{if(max&&sel.size>=max){toast(`${max} at most`);return;}sel.add(x.value);}draw();return;}remember(x.value);inst.close();onPick(x.value);}},
      multi?Check({on,size:'sm'}):(x.icon?IconTile(null,{html:ic(x.icon,IC.md)}):null),el('span',{class:'grow'},el('b',{style:'font-weight:500'},x.label),x.sub?el('small',{},x.sub):null),!multi&&on?el('span',{style:'color:var(--action-text);display:grid',html:ic('check',IC.md)}):(x.trail||null));};
    if(recent.length){box.append(SectionLabel('Recent'),el('div',{class:'list'},recent.map(row)),SectionLabel('All'));}
    box.append(xs.length?el('div',{class:'list'},xs.map(row)):Caption(emptyText,{as:'p',style:'margin:var(--s2) var(--nudge)'}));};
  inst=openSheet({title,left:{label:left},right:multi?{label:'Done',onclick:()=>{if(sel.size<min){toast(`Pick at least ${min}`);return;}inst.close();onPick([...sel]);}}:null,build:b=>{
    if(note)b.append(Caption(note,{as:'p'}));
    if(useSearch)b.append(SearchField({placeholder:'Search',label:`Search ${String(title).toLowerCase()}`,cls:'psearchf',onInput:v=>{q=v;draw();}}));
    draw();b.append(box);if(footer)b.append(footer);}});try{inst.sheet.classList.add('picker');}catch(e){}
  return inst;
}
/* v230 · three icon weights: regular 1.8, bold 2.4 (small or active), 2.8 for the checkmark only */
const swN=s=>s>=2.7?2.8:s>=2.1?2.4:1.8;
/* v234 · breakpoints and motion tokens for the code: the same values the stylesheet uses */
/* breakpoints come from the --bp-* tokens in style.css (the same values the build writes into media queries) */
const BP=(()=>{const D={compact:380,narrow:420,tablet:700,desktop:900,wide:1100};try{const cs=getComputedStyle(document.documentElement);for(const k in D){const v=parseFloat(cs.getPropertyValue('--bp-'+k));if(v)D[k]=v;}}catch(e){}return D;})();
const MOT=(()=>{const cs=()=>getComputedStyle(document.documentElement),ms=(n,fb)=>{const v=cs().getPropertyValue(n).trim();if(!v)return fb;return v.endsWith('ms')?parseFloat(v):parseFloat(v)*1000;},cv=(n,fb)=>cs().getPropertyValue(n).trim()||fb;
  return{get fast(){return ms('--dur-fast',160);},get base(){return ms('--dur-base',280);},get slow(){return ms('--dur-slow',480);},get ease(){return cv('--ease','cubic-bezier(.2,.8,.2,1)');},get spring(){return cv('--spring','cubic-bezier(.3,1.35,.5,1)');},get exit(){return cv('--exit','cubic-bezier(.4,0,1,1)');},get soft(){return cv('--soft','cubic-bezier(.3,1.1,.5,1)');},get celebrate(){return ms('--dur-celebrate',1100);},get celebrateLong(){return ms('--dur-celebrate-long',3500);},get linger(){return ms('--dur-linger',2000);},get toast(){return ms('--dur-toast',2000);},get toastUndo(){return ms('--dur-toast-undo',4500);}};})();
/* icon sizes and line weights come from the --icon-* and --stroke* tokens (read once) */
const IC=(()=>{let c=null;const D={xs:14,sm:16,md:20,lg:24,xl:28,hero:40};const g=k=>{if(!c){c={...D};try{const cs=getComputedStyle(document.documentElement);for(const n in D){const v=parseFloat(cs.getPropertyValue('--icon-'+n));if(v)c[n]=v;}}catch(e){}}return c[k];};return{get xs(){return g('xs')},get sm(){return g('sm')},get md(){return g('md')},get lg(){return g('lg')},get xl(){return g('xl')},get hero(){return g('hero')}};})();
const SW=(()=>{let c=null;const D={reg:1.8,sm:2.2,check:2.8};const g=k=>{if(!c){c={...D};try{const cs=getComputedStyle(document.documentElement);const m={reg:'--stroke',sm:'--stroke-sm',check:'--stroke-check'};for(const n in m){const v=parseFloat(cs.getPropertyValue(m[n]));if(v)c[n]=v;}}catch(e){}}return c[k];};return{get reg(){return g('reg')},get sm(){return g('sm')},get check(){return g('check')}};})();
const sv=(p,w=22,sw=1.8,extra='')=>`<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${swN(sw)}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${p}</svg>`;
const P={turkey:'<path d="M3.5 14.5a3 3 0 0 1 2.2-4.6 3 3 0 0 1 3.2-4.1 3.2 3.2 0 0 1 6.2 0 3 3 0 0 1 3.2 4.1 3 3 0 0 1 2.2 4.6"/><circle cx="12" cy="15.5" r="4"/><circle cx="12" cy="10.5" r="1.8"/><path d="M10.5 19.5V22M13.5 19.5V22"/>',tree:'<path d="M12 3 7 10h3l-4 6h12l-4-6h3z"/><path d="M12 16v5"/>',fireworks:'<path d="M12 2v4M12 18v4M2 12h4M18 12h4M4.9 4.9l2.8 2.8M16.3 16.3l2.8 2.8M4.9 19.1l2.8-2.8M16.3 7.7l2.8-2.8"/><circle cx="12" cy="12" r="1.2"/>',medal:'<path d="M7.5 2 10 9.6M16.5 2 14 9.6"/><circle cx="12" cy="15" r="5.5"/><path d="m12 12.6.8 1.6 1.7.2-1.2 1.2.3 1.7-1.6-.8-1.6.8.3-1.7-1.2-1.2 1.7-.2z"/>',capitol:'<path d="M2 10h20L12 4z"/><path d="M5 10v9M9.7 10v9M14.3 10v9M19 10v9M3 21h18"/>',gift:'<rect x="3" y="8" width="18" height="4" rx="1"/><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7"/><path d="M12 8C10.5 5 7 4 6.5 6S9 8 12 8c3 0 6-.5 5.5-2S13.5 5 12 8"/>',egg:'<path d="M12 3c-3.5 0-6.5 6-6.5 10.5a6.5 6.5 0 0 0 13 0C18.5 9 15.5 3 12 3z"/>',hammer:'<path d="m14 10-8.6 8.6a2 2 0 0 1-2.8-2.8L11.2 7.2"/><path d="m10 6 4-3 7 7-3 4z"/>',poppy:'<path d="M12 12c-4 0-6-2-6-4.5S8 4 10 5c.5-2 3.5-2 4 0 2-1 4 .5 4 3S16 12 12 12z"/><path d="M12 12v9M12 17c1.8 0 3-1 3.5-2.5"/>',crown:'<path d="M3 7l4.5 5L12 5l4.5 7L21 7l-2 11H5z"/>',holiday:'<path d="M5.8 11.3 2 22l10.7-3.8"/><path d="M4 3h.01M22 8h.01M15 2h.01M22 20h.01"/><path d="m22 2-2.2.8a2.9 2.9 0 0 0-2 3.1c.1.9-.6 1.6-1.4 1.6h-.4c-.9 0-1.6.6-1.8 1.4L14 10"/><path d="m22 13-.8-.3c-.9-.3-1.8.2-2 1.1-.1.7-.7 1.2-1.4 1.2H17"/><path d="m11 2 .3.8c.3.9-.2 1.8-1.1 2-.7.1-1.2.7-1.2 1.4V7"/><path d="M11 13c1.9 1.9 2.8 4.2 2 5s-3.1-.1-5-2-2.8-4.2-2-5 3.1.1 5 2Z"/>',pause:'<path d="M8 5v14M16 5v14"/>',mic:'<path d="M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zM5 11a7 7 0 0 0 14 0M12 18v3"/>',
 drop:'<path d="M12 3.5c3 3.6 6 7 6 10.5a6 6 0 0 1-12 0c0-3.5 3-6.9 6-10.5Z"/>',
 moon:'<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
 flame:'<path d=\"M12 3c1 3.5 5 5.5 5 10.5a5 5 0 0 1-10 0c0-1.8.8-3 1.8-4 .3 1.4 1 2.2 1.9 2.5C10.3 9 10.5 6 12 3Z\"/>',
 sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
 layers:'<path d="m12 3 9 5-9 5-9-5z"/><path d="m3 13 9 5 9-5"/>',
 cal:'<rect x="3.5" y="5" width="17" height="15" rx="2"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
minus:'<path d="M5 12h14"/>',
 plus:'<path d="M12 5v14M5 12h14"/>',
 inbox:'<path d="M3 13h5l1.5 2.5h5L16 13h5"/><path d="M5.5 6h13L21 13v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-5z"/>',
 share:'<path d="M12 15V3m0 0L7.5 7.5M12 3l4.5 4.5"/><path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7"/>',
 chevd:'<path d="m6 9 6 6 6-6"/>',chevr:'<path d="m9 6 6 6-6 6"/>',chevl:'<path d="m15 6-6 6 6 6"/>',chevu:'<path d="m6 15 6-6 6 6"/>',
 x:'<path d="M6 6l12 12M18 6 6 18"/>',check:'<path d="m5 12.5 4.5 4.5L19 7.5"/>',
 time:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',ends:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12H8"/>',
 /* durations use a stopwatch everywhere (the clock means a time of day) */
  hour:'<circle cx="12" cy="13.5" r="7.5"/><path d="M12 13.5V10M10 2.5h4M12 2.5V6M18 7l1.5-1.5"/>',
  sort:'<path d="M7 4v16m0 0-3-3m3 3 3-3M17 20V4m0 0-3 3m3-3 3 3"/>',
 rep:'<path d="M4 11V9a3 3 0 0 1 3-3h12m0 0-3-3m3 3-3 3M20 13v2a3 3 0 0 1-3 3H5m0 0 3 3m-3-3 3-3"/>',
 endrep:'<path d="M4 12h12m0 0-4-4m4 4-4 4M20 5v14"/>',
 bell:'<path d="M6 16V11a6 6 0 0 1 12 0v5l1.5 2h-15z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
 target:'<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.4" fill="currentColor"/>',
 flag:'<path d="M5 21V4m0 0h11l-2 4.5 2 4.5H5"/>',
 a_health:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/><path d="M8 12h2l1-2 2 4 1-2h2"/>',
 a_home:'<path d="M4 11l8-6 8 6"/><path d="M6 9.5V19h12V9.5"/><path d="M10 19v-5h4v5"/>',
 a_money:'<rect x="3.5" y="6.5" width="17" height="12" rx="2"/><path d="M3.5 10h17"/><circle cx="16" cy="14.5" r="1" fill="currentColor"/>',
 a_people:'<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><circle cx="16.5" cy="9.5" r="2.5"/><path d="M15.5 14.2A4.5 4.5 0 0 1 20.5 19"/>',
 a_career:'<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 12.5h17"/>',
 a_learn:'<path d="M12 6.5C10 5 7 4.5 4 5v13c3-.5 6 0 8 1.5 2-1.5 5-2 8-1.5V5c-3-.5-6 0-8 1.5z"/><path d="M12 6.5v13"/>',
 a_rec:'<path d="M3 19l6-10 4 6 2-3 6 7z"/><circle cx="17" cy="6.5" r="1.8"/>',
 a_growth:'<path d="M12 20v-8"/><path d="M12 12c0-4 3-6 7-6 0 4-3 6-7 6z"/><path d="M12 14c0-3-2.5-5-6-5 0 3 2.5 5 6 5z"/>',
 a_admin:'<path d="M4 7.5V18a1.5 1.5 0 0 0 1.5 1.5h13A1.5 1.5 0 0 0 20 18V9.5A1.5 1.5 0 0 0 18.5 8H12l-2-2.5H5.5A1.5 1.5 0 0 0 4 7v.5z"/>',
 a_family:'<path d="M4 11l8-6 8 6"/><path d="M6 9.5V19h12V9.5"/><path d="M12 17s-3-1.8-3-4a1.6 1.6 0 0 1 3-.9 1.6 1.6 0 0 1 3 .9c0 2.2-3 4-3 4z"/>',
 a_pets:'<path d="M12 12.5c-2.6 0-5 2.6-5 4.8 0 1.5 1.2 2.2 2.6 2.2.9 0 1.6-.4 2.4-.4s1.5.4 2.4.4c1.4 0 2.6-.7 2.6-2.2 0-2.2-2.4-4.8-5-4.8z"/><circle cx="5" cy="10.5" r="1.8"/><circle cx="9" cy="6" r="1.8"/><circle cx="15" cy="6" r="1.8"/><circle cx="19" cy="10.5" r="1.8"/>',
 a_travel:'<path d="M10.5 9.5V5a1.5 1.5 0 0 1 3 0v4.5l7 4v2l-7-2V18l2 1.5V21l-3.5-1-3.5 1v-1.5l2-1.5v-4.5l-7 2v-2z" stroke-linejoin="round"/>',
 a_comm:'<circle cx="12" cy="7" r="2.5"/><circle cx="5.5" cy="10" r="2"/><circle cx="18.5" cy="10" r="2"/><path d="M7.5 19a4.5 4.5 0 0 1 9 0M2.5 18a3 3 0 0 1 5-2.2M21.5 18a3 3 0 0 0-5-2.2"/>',
 m_income:'<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5v8M8.5 12.5l3.5 3.5 3.5-3.5"/>',
 m_worth:'<path d="M4 20h16M6.5 20v-5M10.5 20v-8M14.5 20v-6M18.5 20V6"/>',
 m_will:'<path d="M6 3.5h8.5L18 7v13.5H6z"/><path d="M14 3.5V7.5h4M9 16c1-1.6 2-1.6 2.6 0s1.6 1.4 3.4-.8"/>',
 m_wheel:'<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17M3.5 12h17M6 6l12 12M18 6 6 18"/>',
 leaf:'<path d="M5 19c0-8 5-13 15-14-1 10-6 15-14 15"/><path d="M5 19 13 11"/>',
 palette:'<path d="M12 3.5a8.5 8.5 0 1 0 0 17c1.2 0 1.8-.8 1.8-1.7 0-1.3-1-1.6-1-2.6s.8-1.7 1.9-1.7h2.1a3.7 3.7 0 0 0 3.7-3.7c0-4.2-3.8-7.3-8.5-7.3z"/><circle cx="7.8" cy="11.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="10.5" cy="7.6" r="1.1" fill="currentColor" stroke="none"/><circle cx="15" cy="7.8" r="1.1" fill="currentColor" stroke="none"/>',
 shapes:'<rect x="4" y="4" width="7" height="7" rx="2"/><rect x="13" y="4" width="7" height="7" rx="2"/><rect x="4" y="13" width="7" height="7" rx="2"/><circle cx="16.5" cy="16.5" r="3.5"/>',
 handle:'<circle cx="9" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="6" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="9" cy="18" r="1.4" fill="currentColor" stroke="none"/><circle cx="15" cy="18" r="1.4" fill="currentColor" stroke="none"/>',
 search:'<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
 gear:'<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
 filter:'<path d="M4 7h16M4 12h16M4 17h16M15 5v4M9 10v4M13 15v4"/>',
 task:'<circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/>',
 habit:'<path d="m17 2 3 3-3 3M4 11V9a4 4 0 0 1 4-4h12M7 22l-3-3 3-3M20 13v2a4 4 0 0 1-4 4H4"/>',
 project:'<path d="M3 6h7l2 2h9v11H3z"/>',
 routine:'<path d="M4 6h16M4 12h9M4 18h7"/><path d="M16 14.5v6l5-3z" stroke-linejoin="round"/>',
 list:'<path d="M9 6h11M9 12h11M9 18h11M5 6h.01M5 12h.01M5 18h.01"/>',
 grid:'<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
 heart:'<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z"/>',
 clip:'<path d="M5 4h14v17H5zM9 4V3h6v1M9 13l2 2 4-4"/>',
 plane:'<path d="M3 13l18-8-6 16-3-7z"/><path d="M12 14l3-3"/>',bed:'<path d="M3 18V7M3 14h18v4M21 14v-2a3 3 0 0 0-3-3h-8v5"/><circle cx="6.5" cy="10.5" r="1.5"/>',car:'<path d="M4 16v-3l2-5h12l2 5v3zM4 16v2M20 16v2"/><path d="M7.5 13h.01M16.5 13h.01"/>',
 compass:'<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z"/>',
 books:'<path d="M5 4v16M9 4v16M13 4v16M16 5l4 15"/>',
 archive:'<rect x="3" y="4" width="18" height="4" rx="1"/><path d="M5 8v11h14V8M10 12h4"/>',
 chart:'<path d="M4 4v16h16M8 14l3-3 3 3 5-6"/>',
 image:'<rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.1-3.1a2 2 0 0 0-2.8 0L6 21"/>',
 edit:'<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',trash:'<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
 copy:'<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M4 16V6a2 2 0 0 1 2-2h10"/>',arrow:'<path d="M5 12h14M13 6l6 6-6 6"/>',
 undo:'<path d="M9 14 4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>',play:'<path d="M7 4l13 8-13 8z"/>',pin:'<path d="M12 17v5M8 3h8l-1 7 3 4H6l3-4z"/>',
 spark:'<path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>',bookmark:'<path d="M6 3h12v18l-6-4-6 4z"/>',link:'<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
 shield:'<path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z"/>',coins:'<circle cx="9" cy="9" r="5.5"/><path d="M15.5 9.6a5.5 5.5 0 1 1-6 6"/>',users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.7.8 2.8 2.6 3 5.2"/>',globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',lock:'<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',star:'<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
};
/* v233 · four icon sizes, each with its weight: small 14 and regular 16 at 2.4, medium 20 and large 24 at 1.8 (checkmark 2.8; 28+ stays as drawn) */
const icSize=w=>w<=14?14:w<=17?16:w<=21?20:w<=27?24:w;
const ic=(n,w=22,s=1.8)=>{const z=icSize(w);return sv(P[n]||'',z,n==='check'?SW.check:z<=16?SW.sm:SW.reg);};
const GLYPHS=[['lotus','Meditate','<path d="M12 20.5c-4.2 0-8-2.2-9.2-5.3 3.2-1 6.4-.1 9.2 2.4 2.8-2.5 6-3.4 9.2-2.4-1.2 3.1-5 5.3-9.2 5.3z"/><path d="M12 17.6c-2.6-2.6-3-6.6 0-11.6 3 5 2.6 9 0 11.6z"/><path d="M8.6 14.6C6.8 13 6.3 10.6 6.6 9c1.6.3 3 1.2 4 2.6M15.4 14.6c1.8-1.6 2.3-4 2-5.6-1.6.3-3 1.2-4 2.6"/>'],['glass','Water','<path d="M6 3h12l-1.6 16.2a2 2 0 0 1-2 1.8H9.6a2 2 0 0 1-2-1.8z"/><path d="M6.7 10h10.6"/>'],['phoneoff','No phone','<rect x="7" y="2.5" width="10" height="19" rx="2.5"/><path d="M11 18.5h2M3.5 3.5l17 17"/>'],['chat','Language','<path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1.4-4.7A8.5 8.5 0 1 1 21 11.5z"/><path d="M8.5 11.5h.01M12.2 11.5h.01M15.9 11.5h.01"/>'],['stretch','Stretch','<circle cx="12" cy="4.2" r="1.8"/><path d="M4.5 6.5 12 9.5l7.5-3M12 9.5v5M12 14.5 8.5 21M12 14.5l3.5 6.5"/>'],['notebook','Journal','<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18M12.5 8h3M12.5 12h3"/>'],['focus','Focus','<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'],['brief','Work','<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 12.5h17"/>'],['dumbbell','Workout','<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>'],['book','Reading','<path d="M2.5 5.5c3-1.3 6.5-1.3 9.5.9v13.1c-3-2-6.5-2-9.5-.8z"/><path d="M21.5 5.5c-3-1.3-6.5-1.3-9.5.9v13.1c3-2 6.5-2 9.5-.8z"/>'],['pencil','Writing','<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'],['users','People','<circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 7M21 20a6 6 0 0 0-3.5-5.5"/>'],['phone','Call','<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'],['coffee','Coffee','<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17M8 3.5v2.5M12 3.5v2.5"/>'],['meal','Meal','<path d="M7 3v18M4 3v5a3 3 0 0 0 6 0V3M17 21V3c-2 1-3 4-3 8h3"/>'],['heart','Care',P.heart],['music','Music','<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>'],['car','Travel','<path d="M5 16.5h14M5.5 12l1.6-4.2A2 2 0 0 1 9 6.5h6a2 2 0 0 1 1.9 1.3l1.6 4.2"/><rect x="3.5" y="12" width="17" height="5.5" rx="1.5"/><path d="M6.5 17.5V19M17.5 17.5V19"/>'],['cake','Birthday','<path d="M4 20h16M5 20v-6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6"/><path d="M5 16c1.5 1 2.5 1 3.5 0s2-1 3.5 0 2.5 1 3.5 0 2-1 3.5 0"/><path d="M12 12V9"/><path d="M12 4.5c.9.9 1 1.9 0 2.8-1-.9-.9-1.9 0-2.8z"/>'],['gift','Gift','<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11"/><path d="M12 9C10.5 5 7 5 7 7s3 2 5 2c2 0 5 0 5-2s-3.5-2-5 2z"/>'],['plane','Trip','<path d="M10.5 13.5 4 12l-1 1.5 5.5 3M10.5 13.5l-2 4.5 1.5 1 4.5-5.5M10.5 13.5 18 6c1-1 2.5-1.2 3-.7s.3 2-.7 3L13 16"/>'],['flag','Deadline',P.flag],['home','Home','<path d="M4 11 12 4.5l8 6.5M6 9.5V20h12V9.5M10 20v-5h4v5"/>'],['cap','Graduation','<path d="m12 5 9.5 4.5L12 14 2.5 9.5z"/><path d="M6.5 11.5V16c1.5 1.5 3.5 2 5.5 2s4-.5 5.5-2v-4.5M21.5 9.5V15"/>'],['health','Appointment','<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/>'],['ticket','Event','<path d="M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/>'],['sun','Day off',P.sun],['pay','Bill due','<rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="M3.5 10h17M7 14.5h3"/>'],['leaf','Outdoors',P.leaf],['drop','Water',P.drop],['moon','Night',P.moon],['star','Special',P.star],['pill','Medicine','<rect x="3" y="8.5" width="18" height="7" rx="3.5" transform="rotate(-45 12 12)"/><path d="m9.5 9.5 5 5"/>'],['walk','Walk','<circle cx="13" cy="4.5" r="1.8"/><path d="M9 21l2.5-6 2.5 2.5V21M11.5 15 12.5 9l-3 1.5L8 13.5M12.5 9l2 3 3 1"/>'],['paw','Pets','<circle cx="6.5" cy="10.5" r="1.8"/><circle cx="10" cy="6.5" r="1.8"/><circle cx="14" cy="6.5" r="1.8"/><circle cx="17.5" cy="10.5" r="1.8"/><path d="M8 17.5c0-2.5 1.8-4.5 4-4.5s4 2 4 4.5c0 1.5-1.2 2.5-2.5 2.5-.6 0-1-.3-1.5-.3s-.9.3-1.5.3C9.2 20 8 19 8 17.5z"/>']];
const GL=Object.fromEntries(GLYPHS.map(([id,n,p])=>[id,{n,p}]));
const glyph=(id,w=18,s=1.8)=>GL[id]?sv(GL[id].p,w,s):'';
/* colours you can give a habit, block or event: each reads a life-area token, so they follow style.css */
const COLORS=[['sage','Sage','--accent'],['blue','Blue','--a-career'],['plum','Plum','--a-learning'],['rose','Rose','--a-relationships'],['clay','Clay','--a-home'],['ochre','Ochre','--a-recreation'],['olive','Olive','--a-finances'],['slate','Slate','--a-personal']];
let COLOR_HEX=null;const colorHexOf=v=>COLOR_HEX&&COLOR_HEX[v]||(COLOR_HEX=Object.fromEntries(COLORS.map(x=>[x[2],tok(x[2])])))[v];
const colorHex=c=>!c?colorHexOf(COLORS[0][2]):c[0]==='#'?c:colorHexOf((COLORS.find(x=>x[0]===c)||COLORS[0])[2]);
const AREA_ICON={Health:'a_health',Home:'a_home',Finances:'a_money',Relationships:'a_people',Career:'a_career',Learning:'a_learn',Recreation:'a_rec',Travel:'a_travel','Personal growth':'a_growth','Life admin':'a_admin',Family:'a_family',Pets:'a_pets',Community:'a_comm'};
const noLeadDate=s=>s==null?s:Array.isArray(s)?(typeof s[0]==='string'&&!noLeadDate(s[0])?s.slice(2):s):String(s).replace(/^(?:(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,? )?(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]* \d{1,2}(?:, \d{4})?(?: · |$)/,'');
const weekOf=(n,t)=>n>=t&&t>0?`Goal met · ${n} this week`:`${n} of ${t} this week`;
const areaIcon=a=>AREA_ICON[a]||((get.settings().areaIcons||{})[a])||'leaf';
const AREAS=['Health','Home','Finances','Relationships','Career','Learning','Recreation','Travel','Personal growth'];
/* v233 · area colours live in style.css as --a-<area>; code points at them */
const AREA_COLOR={Health:'var(--a-health)',Home:'var(--a-home)',Finances:'var(--a-finances)',Relationships:'var(--a-relationships)',Career:'var(--a-career)',Learning:'var(--a-learning)',Recreation:'var(--a-recreation)',Travel:'var(--a-travel)','Personal growth':'var(--a-personal)'};

/* ---------- dates ---------- */
const DOW=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MON=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const MONL=['January','February','March','April','May','June','July','August','September','October','November','December'];
const WD=['M','T','W','T','F','S','S'],WDN=['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
const pad2=n=>String(n).padStart(2,'0');
const k=d=>`${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
const fromK=s=>{const[y,m,d]=s.split('-').map(Number);return new Date(y,m-1,d);};
const addD=(d,n)=>{const x=new Date(d);x.setDate(x.getDate()+n);return x;};
const addK=(s,n)=>k(addD(fromK(s),n));
const today=()=>{const n=new Date();return new Date(n.getFullYear(),n.getMonth(),n.getDate());};
const todayK=()=>k(today());
const monIdx=d=>(d.getDay()+6)%7;
const nowMin=()=>{const d=new Date();return d.getHours()*60+d.getMinutes();};
/* a change of week start applies from the next week on; earlier weeks keep the start they had (settings.wsHist) */
const wsAt=d=>{const s=get.settings(),h=s.wsHist||[],key=k(d);let ws=null;for(const x of h)if(x.from<=key)ws=x.ws;else if(ws==null)ws=x.prev;return ws??(s.weekStart??1);};
const weekStartOf=d=>{const ws=get.settings().weekStart??1;const diff=(d.getDay()-ws+7)%7;return addD(d,-diff);};
const habWeekStart=d=>{const ws=wsAt(d);return addD(d,-((d.getDay()-ws+7)%7));};
const weekKey=d=>k(weekStartOf(d));
const monthKey=d=>`${d.getFullYear()}-${pad2(d.getMonth()+1)}`;
const quarterOf=d=>Math.floor(d.getMonth()/3);
/* v340 · fiscal year: quarters for reviews start in the month you choose (Settings › Planning) */
const fyM=()=>+(get.settings().fyStart||0);
const fqStart=d=>{const off=(d.getMonth()-fyM()+12)%12;return new Date(d.getFullYear(),d.getMonth()-off%3,1);};
const fqLabel=d=>{const m=fyM(),off=(d.getMonth()-m+12)%12,q=Math.floor(off/3)+1;if(!m)return `Q${q} ${d.getFullYear()}`;const sy=d.getMonth()>=m?d.getFullYear():d.getFullYear()-1;return `Q${q} FY${String(sy+1).slice(2)}`;};
const quarterKey=d=>`${d.getFullYear()}-Q${quarterOf(d)+1}`;
const fmtT=m=>{m=((m%1440)+1440)%1440;const h=Math.floor(m/60),mm=m%60;if(get.settings().clock===24)return `${pad2(h)}:${pad2(mm)}`;return `${h%12||12}:${pad2(mm)} ${h<12?'AM':'PM'}`;};
const fmtS=m=>{m=((m%1440)+1440)%1440;const h=Math.floor(m/60),mm=m%60;if(get.settings().clock===24)return `${pad2(h)}:${pad2(mm)}`;return `${h%12||12}:${pad2(mm)}`;};
const fmtRange=(s,e)=>{const a=fmtT(s),b=fmtT(e);if(get.settings().clock===24)return `${a} – ${b}`;return a.slice(-2)===b.slice(-2)?`${a.slice(0,-3)} – ${b}`:`${a} – ${b}`;};
const fmtDur=d=>{const h=Math.floor(d/60),m=d%60;return h&&m?`${h} hr ${m} min`:h?`${h} hr`:`${m} min`;};
const fmtDurS=d=>{if(!d)return '';const h=Math.floor(d/60),m=d%60;return h&&m?`${h}h ${m}m`:h?`${h}h`:`${m}m`;};
const daysBetween=(a,b)=>Math.round((fromK(b)-fromK(a))/864e5);
const mdS=d=>get.settings().dateFmt==='dm'?`${d.getDate()} ${MON[d.getMonth()]}`:MON[d.getMonth()]+' '+d.getDate();
/* one way to write a date: Nov 23, with the year only when it isn't this year */
const shortDay=s=>{const d=fromK(s);return mdS(d)+(d.getFullYear()!==today().getFullYear()?`, ${d.getFullYear()}`:'');};
const relDay=s=>{if(!s)return 'No date';const diff=daysBetween(todayK(),s);if(diff===0)return 'Today';if(diff===1)return 'Tomorrow';if(diff===-1)return 'Yesterday';if(get.settings().relDates&&Math.abs(diff)<=31)return diff>0?`In ${diff} days`:`${-diff} days ago`;if(diff>1&&diff<=6)return DOW[fromK(s).getDay()];return shortDay(s);};
const timeAgo=ts=>{const days=daysBetween(k(new Date(ts)),todayK());if(days<=0)return 'Today';if(days===1)return 'Yesterday';if(days<7)return `${days} days ago`;if(days<30)return `${Math.floor(days/7)} wk ago`;return shortDay(k(new Date(ts)));};

/* ---------- store: one document per record, private to the signed-in person ---------- */
const CACHE='lifeos-v1';
const recs=new Map();
const dirty=new Set();
const deleted=new Set();
const store={db:null,uid:null,coll:null,assets:null,downloads:null,ready:false,mode:'starting',lastError:null};
const uid=(p='r')=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const DEFAULT_SETTINGS={id:'settings',kind:'settings',top3On:true,chime:true,planEve:true,planAt:1140,areaDue:true,weekStart:1,nav:['today','studio','calendar'],pinned:['inbox','tasks','habits','goals'],recent:[],capacity:{mode:'items',full:6,hours:8,lightWeekends:false},filters:{types:{task:true,block:true,allday:true,habit:true},areas:[]},reviewDay:0,grid:{startScroll:null},work:{start:540,end:1020},areas:AREAS.slice(),foundation:{},haptics:true,clock:12,textSize:'auto',bold:false,borders:false,contrast:false,reduceMotion:false,celebrate:'flow',completed:'fade',carryOver:true,defaultHabitTarget:3,studioHabits:true,suggestOn:true,checkinCard:true,workDays:[0,1,2,3,4],protectEvenings:false,monthlyReview:true,quarterlyReview:true,inboxNudge:true,quiet:{on:false,from:1320,to:420},captureTo:'inbox',captureToast:true,calendar:{on:false,declined:false,chips:true,busy:true},currency:'$',hideAmounts:false};
const get={
  settings(){const r=recs.get('settings');if(!r)return DEFAULT_SETTINGS;if(r!==get._s){get._s=r;get._m=Object.assign({},DEFAULT_SETTINGS,r);}return get._m;},
  all(kind,{archived=false,every=false}={}){const out=[];recs.forEach(r=>{if(r.kind===kind&&(archived||!r.archived)&&(every||(!r.paused&&!r.finished)))out.push(r);});return out;},
  id(id){return recs.get(id);},
};
function cacheNow(){try{localStorage.setItem(CACHE,JSON.stringify({uid:store.uid,recs:[...recs.values()],dirty:[...dirty],deleted:[...deleted]}));}catch(e){}}
let cacheT;const scheduleCache=()=>{clearTimeout(cacheT);cacheT=setTimeout(cacheNow,250);};
function loadCache(){try{const raw=localStorage.getItem(CACHE);if(!raw)return false;const p=JSON.parse(raw);(p.recs||[]).forEach(r=>recs.set(r.id,r));(p.dirty||[]).forEach(i=>dirty.add(i));(p.deleted||[]).forEach(i=>deleted.add(i));store.cachedUid=p.uid;return recs.size>0;}catch(e){return false;}}
const timers=new Map();
function queueWrite(id){dirty.add(id);if(navigator.onLine===false){const nb=document.querySelector('.netban.off');if(nb){const c=dirty.size+deleted.size;nb.textContent=`Offline · ${c} change${c===1?'':'s'} saved on this phone`;}}scheduleCache();clearTimeout(timers.get(id));timers.set(id,setTimeout(()=>flush(id),350));}
async function flush(id,attempt=0){
  if(!store.coll)return;
  const ref=store.coll.doc(id),r=recs.get(id);
  try{
    if(deleted.has(id)){await ref.delete();deleted.delete(id);}
    else if(r){const at=r.updatedAt;await ref.set(JSON.parse(JSON.stringify(r)));if((recs.get(id)||{}).updatedAt===at)dirty.delete(id);}
    else dirty.delete(id);
    scheduleCache();store.lastError=null;
  }catch(e){
    store.lastError=e&&e.code;
    if(e&&e.code==='unavailable'&&attempt<1){setTimeout(()=>flush(id,attempt+1),800+Math.random()*700);return;}
    if(e&&e.code==='quota_exceeded')toast('Storage is full. Delete some items to keep saving.');
    else if(!flush.warned){flush.warned=true;toast('Saved on this device. It will sync when the connection returns.');setTimeout(()=>flush.warned=false,60000);}
  }
}
function flushAll(){[...dirty,...deleted].forEach(id=>flush(id));}
addEventListener('online',flushAll);
document.addEventListener('visibilitychange',()=>{if(document.hidden){cacheNow();flushAll();}else{App.refresh();}});
function put(r,{silent=false}={}){try{histNote(r);}catch(e){}r.updatedAt=Date.now();if(!r.createdAt)r.createdAt=r.updatedAt;recs.set(r.id,r);deleted.delete(r.id);queueWrite(r.id);const tr='del-'+r.id;if(recs.has(tr)){recs.delete(tr);deleted.add(tr);queueWrite(tr);}if(typeof wkHook==='function')wkHook(r);if(typeof rwHook==='function')rwHook(r);if(!silent)App.refresh();return r;}
function create(kind,fields){return put(Object.assign({id:uid(kind[0]),kind},fields));}
const NO_TRASH=new Set(['settings','remstate','focus','plan','trashed','areanote','discover','rewards']);
function remove(id,{silent=false,hard=false}={}){const was=recs.get(id);try{if(was)histNote(was,true);}catch(e){}if(was&&!hard&&!NO_TRASH.has(was.kind)&&!(was.f&&was.f.t==='cfg')&&!was.example){const tr={id:'del-'+id,kind:'trashed',rec:JSON.parse(JSON.stringify(was)),deletedAt:Date.now(),createdAt:Date.now(),updatedAt:Date.now()};recs.set(tr.id,tr);deleted.delete(tr.id);queueWrite(tr.id);}recs.delete(id);deleted.add(id);queueWrite(id);if(was&&typeof wkHook==='function')wkHook(was);if(was&&typeof rwHook==='function')rwHook(was,true);if(!silent)App.refresh();}
function setSettings(patch){const cur=get.settings();try{if(typeof layoutNote==='function')layoutNote(cur,patch);}catch(e){}const s=Object.assign({},DEFAULT_SETTINGS,cur,patch);put(s);}
async function connect(){
  const claude=window.claude;
  if(!claude||!claude.use){store.mode='local';App.dataReady();return;}
  try{
    const[user,db]=await Promise.all([claude.use('user'),claude.use('db')]);
    store.assets=await claude.use('assets').catch(()=>null);
    store.downloads=await claude.use('downloads').catch(()=>null);
    const id=user?await user.id():null;
    if(!db||!id){store.mode='local';App.dataReady();return;}
    if(store.cachedUid&&store.cachedUid!==id){recs.clear();dirty.clear();deleted.clear();}
    store.db=db;store.uid=id;store.coll=db.collection('data/users/'+id);
    let settled=false;const guard=setTimeout(()=>{if(!settled){store.mode='local';App.dataReady();}},10000);
    store.coll.onSnapshot(snap=>{
      clearTimeout(guard);
      const seen=new Set();let changed=false;
      snap.docs.forEach(d=>{const raw=d.data();if(!raw)return;seen.add(d.id);if(deleted.has(d.id))return;const cur=recs.get(d.id);if(!cur||(raw.updatedAt||0)>(cur.updatedAt||0)){const r=JSON.parse(JSON.stringify(raw));r.id=d.id;recs.set(d.id,r);dirty.delete(d.id);changed=true;}});
      if(!settled){if(!snap.metadata.fromCache)recs.forEach((r,i)=>{if(!seen.has(i)&&!dirty.has(i)){recs.delete(i);changed=true;}});}
      else snap.docChanges().forEach(c=>{if(c.type==='removed'&&!dirty.has(c.doc.id)&&recs.has(c.doc.id)){recs.delete(c.doc.id);changed=true;}});
      if(!settled&&!snap.metadata.fromCache){settled=true;store.mode='synced';[...dirty,...deleted].forEach(i=>flush(i));App.dataReady();}
      else if(changed)App.refresh();
      scheduleCache();
    },err=>{clearTimeout(guard);store.lastError=err&&err.code;if(!settled){settled=true;store.mode='local';App.dataReady();}});
  }catch(e){store.mode='local';App.dataReady();}
}

/* ---------- recurrence + what is on a day ---------- */
/* the first day of the run this date falls in, or null */
function allDayOccStart(r,dk,strict=false){const span=r.end?daysBetween(r.start,r.end):0;for(let i=0;i<=span;i++){const s=addK(dk,-i);if(occursOn(r.start,r.repeat,s,r.skip))return s;}return strict?null:dk;}
function occursOn(startK,rep,dk,skip){
  if(!startK||dk<startK)return false;
  if(skip&&skip.includes(dk))return false;
  if(rep&&rep.skipHol&&dk!==startK&&typeof Holidays!=='undefined'&&Holidays.name(dk))return false;
  if(dk===startK)return true;
  const r=rep||{type:'never'};
  if(r.type==='never')return false;
  if(r.end&&dk>r.end)return false;
  const d=fromK(dk),s=fromK(startK),days=daysBetween(startK,dk),n=Math.max(1,r.n||1),u=r.unit||'week';
  if(u==='day')return days%n===0;
  if(u==='week'){const wk=Math.floor((addD(d,-monIdx(d))-addD(s,-monIdx(s)))/(7*864e5)+.01);return wk%n===0&&(r.days||[monIdx(s)]).includes(monIdx(d));}
  if(u==='month'){const mo=(d.getFullYear()-s.getFullYear())*12+d.getMonth()-s.getMonth();if(mo%n!==0)return false;const dim=new Date(d.getFullYear(),d.getMonth()+1,0).getDate();
    if(r.by==='last')return d.getDate()===dim;
    if(r.by==='nth'){const wd=r.wd??monIdx(s),nth=r.nth??Math.ceil(s.getDate()/7);if(monIdx(d)!==wd)return false;return nth===-1?d.getDate()+7>dim:Math.ceil(d.getDate()/7)===nth;}
    return d.getDate()===Math.min(s.getDate(),dim);}
  if(u==='year')return (d.getFullYear()-s.getFullYear())%n===0&&d.getMonth()===s.getMonth()&&d.getDate()===Math.min(s.getDate(),new Date(d.getFullYear(),d.getMonth()+1,0).getDate());
  return false;
}
function repeatLabel(r){if(!r||r.type==='never')return 'Never';const n=r.n||1,u=r.unit||'week';if(u==='week'){const ds=(r.days||[]).slice().sort().map(i=>WDN[i]);const on=ds.length===7?'every day':ds.length===5&&!r.days.includes(5)&&!r.days.includes(6)?'weekdays':ds.length>3?`${ds.length} days`:ds.join(', ');return n===1?`Weekly, ${on}`:`Every ${n} weeks, ${on}`;}const nm={day:'day',month:'month',year:'year'}[u];if(u==='month'&&r.by){const ord=['','first','second','third','fourth'],on=r.by==='last'?'on the last day':`on the ${r.nth===-1?'last':ord[r.nth||1]} ${WDN[r.wd??0]}`;return n===1?`Monthly, ${on}`:`Every ${n} months, ${on}`;}return n===1?{day:'Daily',month:'Monthly',year:'Yearly'}[u]:`Every ${n} ${nm}s`;}
function remLabel(m){if(m==null)return 'None';if(m===0)return 'At the time';if(m%1440===0){const d=m/1440;return `${d} day${d>1?'s':''} before`;}if(m%60===0){const h=m/60;return `${h} hr before`;}return `${m} min before`;}
const isDone=(r,dk)=>{if(r.kind==='step')return !!r.step.d;return !!(r.doneDates&&r.doneDates[dk]);};
const allSteps=()=>{const out=[];[...get.all('goal'),...get.all('project')].forEach(p=>(p.steps||[]).forEach(s=>out.push({parent:p,step:s})));return out;};
const matchesFilter=(type,area,useFilters)=>{if(!useFilters)return true;const f=get.settings().filters||{};if(f.types&&f.types[type]===false)return false;if(f.areas&&f.areas.length&&!f.areas.includes(area||'None'))return false;return true;};
/* Normalised view of a day. Every entry: {kind,id,rec,title,time,dur,color,icon,area,done,step?} */
/* tasks inside a project that's on hold stay out of Today and Tasks until it resumes */
function onHold(r){const p=r&&r.part&&get.id(r.part);return !!(p&&p.kind==='project'&&p.paused&&!p.finished);}
/* a monthly or yearly repeat that was missed stays on Today until it's done or skipped; daily and weekly ones just roll on */
function missedOcc(r,dk){const rp=r.repeat;if(!rp||rp.type==='never'||!['month','year'].includes(rp.unit)||!r.date||r.date>=dk)return null;const back=rp.unit==='year'?370*(rp.n||1):32*(rp.n||1)+1;for(let i=1;i<=back;i++){const d=addK(dk,-i);if(d<r.date)break;if(occursOn(r.date,rp,d,null))return isDone(r,d)||(r.skip||[]).includes(d)?null:d;}return null;}
function dayItems(dk,{filters=false}={}){
  const allDay=[],timed=[],anytime=[];
  get.all('allday').forEach(r=>{if(!matchesFilter('allday',r.area,filters))return;if(allDayOccStart(r,dk,true))allDay.push({kind:'allday',id:r.id,rec:r,title:r.title,color:colorHex(r.color),icon:r.icon,area:r.area});});
  get.all('block').forEach(r=>{if(!matchesFilter('block',r.area,filters))return;if(occursOn(r.date,r.repeat,dk,r.skip))timed.push({kind:'block',id:r.id,rec:r,title:r.title,time:r.start,dur:r.dur,color:colorHex(r.color),icon:r.icon,area:r.area,done:isDone(r,dk)});});
  get.all('task').forEach(r=>{if(!matchesFilter('task',r.area,filters)||onHold(r))return;if(occursOn(r.date,r.repeat,dk,r.skip)){const e={kind:'task',id:r.id,rec:r,title:r.title,time:r.time,dur:30,color:colorHex(),area:r.area,done:isDone(r,dk)};(r.time!=null?timed:anytime).push(e);}else if(dk===todayK()){const mo=missedOcc(r,dk);if(mo)anytime.push({kind:'task',id:r.id,rec:r,title:r.title,time:null,dur:30,color:colorHex(),area:r.area,done:false,occ:mo});}});
  allSteps().forEach(({parent,step})=>{if(step.date===dk&&matchesFilter('task',parent.area,filters)&&!(parent.kind==='project'&&parent.paused)&&!onHold(parent)){const e={kind:'step',id:step.id,rec:parent,step,title:step.t,time:step.time??null,dur:step.dur||30,color:colorHex(parent.color),area:parent.area,done:!!step.d,from:parent.title};(step.time!=null?timed:anytime).push(e);}});
  get.all('habit').forEach(h=>{if(!matchesFilter('habit',h.area,filters))return;const se=(h.sessions||{})[dk];const onDay=se!==undefined||occursHabit(h,dk);if(!onDay)return;if(se===undefined&&!habitDone(h,dk)&&tripPauseHabits(dk))return;const time=se&&se.time!=null?se.time:(h.setTime??null);const e={kind:'habit',id:h.id,rec:h,title:h.title,time,dur:h.dur||30,color:colorHex(h.color),icon:h.icon,area:h.area,done:habitDone(h,dk)};(time!=null?timed:anytime).push(e);});
  get.all('routine').forEach(r=>{if(!matchesFilter('habit',r.area,filters)||!r.days||!r.days.length||!r.days.includes(monIdx(fromK(dk)))||(r.startDate&&dk<r.startDate))return;const mins=(r.steps||[]).reduce((n,s)=>n+(s.min||0),0)||30;const e={kind:'routine',id:r.id,rec:r,title:r.title,time:r.setTime??null,dur:mins,color:colorHex(r.color),area:r.area,done:!!(r.runs&&r.runs[dk])};(e.time!=null?timed:anytime).push(e);});
  if(typeof Gcal!=='undefined')Gcal.on(dk).forEach(e=>{if(!matchesFilter(e.time==null?'allday':'block',null,filters))return;(e.time==null?allDay:timed).push(e);});
  if(typeof Ical!=='undefined')Ical.on(dk).forEach(e=>{if(!matchesFilter(e.time==null?'allday':'block',null,filters))return;(e.time==null?allDay:timed).push(e);});
  if(typeof Holidays!=='undefined'&&matchesFilter('allday',null,filters))allDay.push(...Holidays.on(dk));
  timed.sort((a,b)=>a.time-b.time);
  const pr=e=>e.rec.priority==='high'?0:e.rec.priority==='low'?2:1;anytime.sort((a,b)=>(a.done-b.done)||(pr(a)-pr(b)));
  return{allDay,timed,anytime};
}
/* a time block running past midnight carries on at the top of the next day's grid */
function spill(dk){const prev=addK(dk,-1),out=[];get.all('block').forEach(r=>{if(r.start+r.dur>1440&&occursOn(r.date,r.repeat,prev,r.skip))out.push({kind:'block',id:r.id,rec:r,title:r.title,time:0,dur:r.start+r.dur-1440,color:colorHex(r.color),icon:r.icon,area:r.area,done:isDone(r,prev),cont:true,contFrom:prev});});return out;}
/* v238 · every-few-days habits: due when it's been everyN days since the last check-in (or now, if late) */
function habitEveryDue(h,dk){if(h.startDate&&dk<h.startDate)return false;if(habitDone(h,dk))return true;let last=null;for(const d of Object.keys(h.logs||{})){if(d<dk&&habitDone(h,d)&&(!last||d>last))last=d;}if(!last)return true;return daysBetween(last,dk)>=(h.everyN||2);}
function habitNextDue(h){const tk=todayK();let last=null;for(const d of Object.keys(h.logs||{})){if(d<=tk&&habitDone(h,d)&&(!last||d>last))last=d;}if(!last)return tk;const n=addK(last,h.everyN||2);return n<tk?tk:n;}
const occursHabit=(h,dk)=>h.everyN?habitEveryDue(h,dk):(h.days&&h.days.length)?(h.days.includes(monIdx(fromK(dk)))&&(!h.startDate||dk>=h.startDate)):false;
function weekRange(dk){const s=weekStartOf(fromK(dk));return[k(s),k(addD(s,6))];}
const habitDone=(h,dk)=>{const v=h.logs&&h.logs[dk];if(!v)return false;return h.track==='count'||h.track==='time'?(v===true||v>=(h.goalN||1)):true;};
function habitWeek(h,dk){const s0=habWeekStart(fromK(dk)),a=k(s0),b=k(addD(s0,6));let n=0;for(const d in(h.logs||{}))if(d>=a&&d<=b&&habitDone(h,d))n++;return n;}
function habitPlanned(h,dk){const[a,b]=weekRange(dk);let n=0;for(const d in(h.sessions||{}))if(d>=a&&d<=b)n++;return n;}
/* finishing a task ticks whatever steps are still open, and un-finishing puts back only those */
function setTaskDone(r,dk,on,opts){return goalPulseAround(r,on,()=>setTaskDoneRaw(r,dk,on,opts));}
function setTaskDoneRaw(r,dk,on,{quiet=false}={}){
  if(!r.date)r.date=dk;r.doneDates=r.doneDates||{};r.autoSteps=r.autoSteps||{};const steps=r.steps||[];
  if(on){const open=steps.filter(s=>s.t&&!stepDone(r,s,dk));r.doneDates[dk]=Date.now();
    if(open.length){open.forEach(s=>setStepDone(r,s,dk,true));r.autoSteps[dk]=open.map(s=>s.id);}
    put(r,{silent:true});
    if(open.length&&!quiet)toast(`Finished, with ${open.length} open step${open.length>1?'s':''} ticked`,()=>{setTaskDone(r,dk,false);App.refresh();});}
  else{delete r.doneDates[dk];(r.autoSteps[dk]||[]).forEach(id=>{const s=steps.find(x=>x.id===id);if(s)setStepDone(r,s,dk,false);});delete r.autoSteps[dk];put(r,{silent:true});}
  if(!Object.keys(r.autoSteps).length)delete r.autoSteps;
  return !!r.doneDates[dk];
}
function toggleItem(e,dk){
  if(e.kind==='step'){const g0=e.rec.kind==='goal'?e.rec:goalFor(e.rec),a0=g0?goalProgress(g0):0;e.step.d=!e.step.d;e.step.doneAt=e.step.d?Date.now():null;put(e.rec,{silent:true});if(g0&&e.step.d&&goalProgress(g0)>a0){App.state.goalPulse={id:g0.id,from:a0,to:goalProgress(g0),at:Date.now()};toast(`${e.step.t}. ${g0.title} is now at ${Math.round(goalProgress(g0)*100)}%.`);}return e.step.d;}
  if(e.kind==='gcal')return false;
  if(e.kind==='routine'){const r=e.rec;r.runs=r.runs||{};if(r.runs[dk])delete r.runs[dk];else r.runs[dk]=Date.now();put(r,{silent:true});return !!r.runs[dk];}
  if(e.kind==='habit'&&e.rec.link&&e.rec.link.log&&(!e.rec.track||e.rec.track==='check')&&typeof wkHabitToggle==='function')return wkHabitToggle(e.rec,dk);
  if(e.kind==='habit'){const h=e.rec;h.logs=h.logs||{};if(habitDone(h,dk))delete h.logs[dk];else{h.logs[dk]=h.track==='count'||h.track==='time'?(h.goalN||1):true;if(h.skips)delete h.skips[dk];if(dk===todayK()){const n=new Date();h.logT=Object.assign({},h.logT,{[dk]:n.getHours()*60+n.getMinutes()});}}put(h,{silent:true});syncHabitGoals(h);celebrateStreak(h,dk);const dn=habitDone(h,dk);if(dn&&typeof habitNotePrompt==='function')setTimeout(()=>habitNotePrompt(h,dk),700);return dn;}
  const r=e.rec;if(e.kind==='task'){const d=e.occ||dk;return setTaskDone(r,d,!(r.doneDates&&r.doneDates[d]));}r.doneDates=r.doneDates||{};if(r.doneDates[dk])delete r.doneDates[dk];else r.doneDates[dk]=Date.now();
  if(e.kind==='block'&&r.part){const h=get.id(r.part);if(h&&h.kind==='habit'){h.logs=h.logs||{};if(r.doneDates[dk])h.logs[dk]=true;else delete h.logs[dk];put(h,{silent:true});}}
  put(r,{silent:true});return !!r.doneDates[dk];
}
function carried(){const tk=todayK(),out=[];get.all('task').forEach(t=>{if(t.date&&t.date<tk&&(!t.repeat||t.repeat.type==='never')&&!isDone(t,t.date)&&!onHold(t))out.push(t);});return out.sort((a,b)=>a.date<b.date?-1:1);}
const stepDone=(r,st,dk)=>r.repeat&&r.repeat.type!=='never'?!!((r.stepDone||{})[dk]||{})[st.id]:!!st.d;
function setStepDone(r,st,dk,on){if(r.repeat&&r.repeat.type!=='never'){r.stepDone=r.stepDone||{};const m=Object.assign({},r.stepDone[dk]);if(on)m[st.id]=true;else delete m[st.id];r.stepDone[dk]=m;}else{st.d=on;st.doneAt=on?Date.now():null;}}
function isOpenTask(t){if(!t.date)return !(t.doneDates&&Object.keys(t.doneDates).length);return (!t.repeat||t.repeat.type==='never')?!isDone(t,t.date):true;}
/* heat level 0-4 */
function dayLoad(dk,filters=true){const{allDay,timed,anytime}=dayItems(dk,{filters});const c=get.settings().capacity||DEFAULT_SETTINGS.capacity;const wk=([0,6].includes(fromK(dk).getDay())&&c.lightWeekends?.5:1)*(typeof holCapFactor==='function'?Math.max(holCapFactor(dk),.25):1);
  if(c.mode==='hours'){const mins=timed.filter(e=>e.kind!=='habit').reduce((n,e)=>n+(e.dur||30),0);return{value:mins/60,level:levelOf(mins/60,(c.hours||8)*wk),allDay};}
  /* habits repeat every day, so they don't make a day look busier */const n=timed.filter(e=>e.kind!=='habit').length+anytime.filter(e=>e.kind!=='habit').length;return{value:n,level:levelOf(n,(c.full||6)*wk),allDay};}
function levelOf(v,full){if(v<=0)return 0;const r=v/Math.max(full,.5);return r>=1?4:r>=.66?3:r>=.33?2:1;}

/* ---------- small shared UI ---------- */
let toastT,toastAt=0;
function linkText(s){const out=[],re=/(https?:\/\/[^\s]+|www\.[^\s]+)/gi;let last=0,m;s=String(s||'');while((m=re.exec(s))){if(m.index>last)out.push(s.slice(last,m.index));const u=m[0].replace(/[).,;:!?]+$/,'');out.push(el('a',{href:/^www\./i.test(u)?'https://'+u:u,target:'_blank',rel:'noopener',style:'color:var(--action-text);overflow-wrap:anywhere',onclick:e=>e.stopPropagation()},u));last=m.index+u.length;}if(last<s.length)out.push(s.slice(last));return out;}
/* Where a toast should take you. null when you're already there, so the toast shows no › */
const dest=(v,p={})=>{const S=App.state;if(S.view===v&&JSON.stringify(S.params||{})===JSON.stringify(p))return null;return()=>App.go(v,p);};
const dayDest=d=>()=>{if(d)App.state.sel=d;App.state._fresh=true;App.go('today');};
const taskDest=r=>r&&r.date?dayDest(r.date):dest('tasks');
/* toast(msg, undo, label, {open}) — with open, tapping the toast takes you to where the thing went */
/* moving or reordering things gets no message: the move itself is the feedback */
const QUIET_MOVE=/^(Moved to (?!Archive|Finished)|Set for |Planned for |Date moved|Order saved|\d+ moved to today)/;
/* Undo is only for things you can't take back with one more tap: deleting, clearing, archiving, and anything
   that changed several things at once. A switch, a check, a pin, a priority or a log is undone by tapping it again,
   so those get no Undo (and the ones whose control already shows the change get no message at all). */
const UNDO_KEEP=/^\d|deleted|removed|cleared|erased|let go|dropped|tossed|used up|archive|retired|reset|unlinked|turned into|imported|is now (a project|its own task)|Finished, with|Settled up|Added \d|Copied \d|from this day on/i;
const QUIET_TAP=/( is (on|off)| pinned to Today| unpinned)$|^(Marked high priority|Priority cleared|Unchecked|Unmarked|Skip removed|Marked not done|Back on your list|Saved|Saved for this day)$/;
function toast(msg,undo,label='Undo',{open=null,edit=null,force=false}={}){if(!force&&typeof msg==='string'&&(QUIET_MOVE.test(msg)||(QUIET_TAP.test(msg)&&!open)))return;if(!force&&undo&&label==='Undo'&&typeof msg==='string'&&!UNDO_KEEP.test(msg))undo=null;const t=$('#toast');
  /* v231 · a toast with an Undo that is still showing moves up instead of being replaced, so up to three Undos stay reachable */
  if(t.classList.contains('on')&&t.querySelector('button')&&!t.classList.contains('drag')){const s=el('div',{class:'toast tstk on',role:'status'});t.querySelectorAll('.life').forEach(x=>x.remove());while(t.firstChild)s.append(t.firstChild);s.className='toast tstk on'+(t.classList.contains('go')?' go':'');if(t.onclick){s.onclick=t.onclick;}document.body.append(s);toastRestack();const left=Math.max(1500,4500-(Date.now()-toastAt));setTimeout(()=>{s.classList.remove('on');setTimeout(()=>{s.remove();toastRestack();},320);},left);}
  toastAt=Date.now();t.innerHTML='';t.classList.toggle('go',!!open);t.onclick=open?e=>{if(e.target.closest('button'))return;t.classList.remove('on');clearTimeout(toastT);while(sheetStack.length)sheetStack[sheetStack.length-1].close();open();}:null;t.setAttribute('role',open?'button':'status');t.append(el('span',{},msg));if(open)t.append(el('span',{class:'tgo','aria-hidden':'true',html:ic('chevr',IC.xs)}));if(undo)t.append(el('button',{onclick:e=>{App.state._restored=Date.now();undo();const h=e.currentTarget.closest('.toast');if(h&&h.classList.contains('tstk')){h.remove();toastRestack();}else t.classList.remove('on');}},label));if(edit)t.append(el('button',{onclick:()=>{t.classList.remove('on');clearTimeout(toastT);edit();}},'Edit'));const ms=undo?MOT.toastUndo:MOT.toast;t.style.setProperty('--life',ms+'ms');t.append(el('i',{class:'life'}));t.classList.remove('on');void t.offsetWidth;t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),ms);}
/* iPhone has no vibrate API; toggling a hidden switch control gives a light system tap (iOS 18+) */
const IOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const iosTap=(()=>{let l=null;return()=>{if(!l){const i=document.createElement('input');i.type='checkbox';i.setAttribute('switch','');i.id='hx-tap';i.tabIndex=-1;i.setAttribute('aria-hidden','true');i.style.display='none';l=document.createElement('label');l.htmlFor='hx-tap';l.style.display='none';l.setAttribute('aria-hidden','true');const stop=e=>e.stopPropagation();i.addEventListener('click',stop);l.addEventListener('click',stop);document.body.append(i,l);}l.click();};})();
const canBuzz=()=>!!navigator.vibrate||IOS;
const buzz=ms=>{const st=get.settings();if(!st.haptics)return;const firm=st.hapticLevel==='firm';try{if(navigator.vibrate)navigator.vibrate(firm?[ms*2,40,ms*2]:ms);else if(IOS){iosTap();if(firm)setTimeout(iosTap,70);}}catch(e){}};
/* v339 · celebration per type: task, habit, big (goals and plans); older single setting fills all three */
const celebOf=s=>{const d=s.celebrate||'flow',b=s.celebBy||{};return{task:b.task||d,habit:b.habit||d,big:b.big||d};};
function flowTick(btn){const m=celebOf(get.settings())[btn&&btn.closest&&btn.closest('.habcard,.fcard,.habdot,.hrow,[data-kind=habit]')?'habit':'task'];buzz(8);if(m==='off')return;btn.classList.remove('flow');void btn.offsetWidth;btn.classList.add('flow');if(m==='subtle')btn.classList.add('subtle');}
function tickBtn(on,onToggle,label='Mark done'){
  const b=el('button',{class:'tick'+(on?' on':''),'aria-label':on?'Mark not done':label,'aria-pressed':String(!!on),html:ic('check',IC.xs),onclick:e=>{e.stopPropagation();const nowOn=!b.classList.contains('on');b.classList.toggle('on',nowOn);b.setAttribute('aria-pressed',String(nowOn));const row=b.parentElement;if(row&&row.classList.contains('tick-host'))row.classList.toggle('done',nowOn);if(nowOn)flowTick(b);App.state._flipUntil=Date.now()+1600;onToggle(nowOn);}});
  return b;
}
/* Sheets: bottom sheet on phones, centred dialog on wide screens. */
const sheetStack=[];
function openSheet({title,full=false,left,right,build,onClose,tryClose,raw=false,anchor=null}){const tEl=$('#toast');if(tEl)tEl.classList.remove('on');
  const scrim=el('div',{class:'scrim'}),sheet=el('section',{class:'sheet'+(full?' full':''),role:'dialog','aria-modal':'true','aria-label':title||'Sheet'});
  const body=el('div',{class:'sbody'});
  const grab=el('div',{class:'grab'},el('i'));
  const inst={sheet,body,scrim,close,requestClose};
  const opener=document.activeElement;
  const zBase=parseInt(getComputedStyle(document.documentElement).getPropertyValue('--z-sheet'))||40,z=zBase+1+sheetStack.length*2;scrim.style.zIndex=z-1;sheet.style.zIndex=z;
  sheet.append(grab);
  let head=null;
  if(title!==undefined&&!raw){
    /* v228 · one sheet vocabulary: new things say Add, changes say Save, forms cancel with Cancel, read-only sheets close with a round × */
    if(right&&!right.keepLabel&&/^(Save|Done|Create|Update)$/i.test(String(right.label||'').trim()))right={...right,label:/^(New|Add)\b/i.test(String(title||''))?'Add':'Save'};
    const formy=right&&(/^(Save|Add|Create|Done|Update|Log|Set|Keep|Plan it|Book it|Start)$/i.test(String(right.label||'').trim())||right.foot);
    const plainL=!left||/^(Close|Done|Cancel)$/i.test(String(left.label||'').trim());
    if(formy&&plainL)left={...(left||{}),label:'Cancel'};
    if(!left||!left.label)left={...(left||{}),label:'Close'};
    const xClose=false;/* every sheet names its way out in words (Cancel or Close), never a bare ✕ */
    const lb=xClose?el('button',{class:'l sx','aria-label':'Close',onclick:()=>left&&left.onclick?left.onclick():requestClose()},el('span',{html:ic('x',IC.xs)})):el('button',{class:'l',onclick:()=>left&&left.onclick?left.onclick():requestClose()},left.label);
    const rb=right?el('button',{class:formy?'btn primary block sfoot-btn':'r',disabled:right.disabled,onclick:right.onclick},right.label):el('span');
    head=el('div',{class:'shead'},lb,el('h2',{},title),formy?el('span',{class:'r'}):rb);inst.rightBtn=rb;inst.titleEl=head.children[1];
    sheet.append(head);inst._foot=formy?el('div',{class:'sfoot'},rb):null;
  }
  sheet.append(body);if(inst._foot)sheet.append(inst._foot);
  $('#layers').append(scrim,sheet);
  const pop=anchor&&innerWidth>=BP.desktop;
  inst.place=()=>{if(!pop)return;const w=380,h=sheet.offsetHeight;sheet.style.left=Math.max(12,Math.min(anchor.left,innerWidth-w-12))+'px';sheet.style.top=Math.max(12,Math.min(anchor.bottom+6,innerHeight-h-12))+'px';};
  if(pop){sheet.classList.add('pop');scrim.classList.add('clear');}
  build&&build(body,inst);inst.place();try{a11yPass(sheet);}catch(e){}
  /* any sheet you type in opens at full height on phones and stays put while the keyboard slides over it */
  if(!pop&&innerWidth<BP.tablet&&!sheet.classList.contains('full')&&body.querySelector('textarea,input:not([type]),input[type=text],input[type=search],input[type=url],input[type=email],input[type=tel],input[type=number]'))sheet.classList.add('full');
  body.addEventListener('scroll',()=>head&&head.classList.toggle('edge',body.scrollTop>0),{passive:true});
  void sheet.offsetWidth;
  /* Opened from Quick capture's "Save as": reshape the sheet underneath instead of stacking a new one */
  const under=App._morphNext&&sheetStack.length&&!pop&&motionOK()?sheetStack[sheetStack.length-1]:null;App._morphNext=false;
  if(under){const h0=under.sheet.getBoundingClientRect().height;under.sheet.style.visibility='hidden';scrim.classList.add('clear','on');sheet.style.transition='none';sheet.classList.add('on');morphSheetIn(sheet,h0);requestAnimationFrame(()=>requestAnimationFrame(()=>{sheet.style.transition='';}));}
  else if(!pop&&sheetFromRow(sheet,scrim)){}
  else requestAnimationFrame(()=>{scrim.classList.add('on');sheet.classList.add('on');});
  scrim.addEventListener('click',()=>requestClose());
  sheetStack.push(inst);lockScroll(true);
  // swipe down to close, from the grab bar or the header
  /* v229 · detents: a sheet that opens at its natural height can be dragged up to full height and back down again; dragging further down closes it */
  const fullH=()=>(window.visualViewport?visualViewport.height:innerHeight)-44;
  const toH=(h,after)=>{sheet.style.transition='height var(--dur-slow) var(--spring),transform var(--dur-base) var(--ease)';sheet.style.maxHeight='none';sheet.style.height=h+'px';setTimeout(()=>{sheet.style.transition='';after&&after();},440);};
  const dragZone=e=>{if(e.button!=null&&e.button!==0)return;if(e.target.closest('button'))return;const y0=e.clientY;let dy=0,raw=0,mv,up;sheet.classList.add('nodrag');
    const isFull=sheet.classList.contains('full'),canGrow=!isFull&&!sheet.classList.contains('pop'),h0=sheet.offsetHeight,F=fullH(),natH=sheet._natH||0;
    scrim.style.transition='none';mv=ev=>{raw=ev.clientY-y0;dy=Math.max(0,raw);
      if(raw<0&&canGrow&&F>h0+40){sheet.style.transition='none';sheet.style.maxHeight='none';sheet.style.height=Math.min(F,h0-raw)+'px';sheet.style.transform='';return;}
      const d=raw>0?raw:raw*.15;sheet.style.transform=`translate3d(0,${d}px,0)`;scrim.style.opacity=String(Math.max(0,1-dy/(sheet.offsetHeight||400)));};
    up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);sheet.classList.remove('nodrag');scrim.style.transition='';scrim.style.opacity='';
      if(raw<0&&canGrow&&F>h0+40){if(-raw>70){sheet._natH=h0;buzz&&buzz(6);toH(F,()=>{sheet.classList.add('full');sheet.style.height='';sheet.style.maxHeight='';});}else toH(h0,()=>{sheet.style.height='';sheet.style.maxHeight='';});return;}
      sheet.style.transform='';
      if(isFull&&natH&&dy>90&&dy<h0*.55){sheet.style.height=h0+'px';sheet.style.maxHeight='none';sheet.classList.remove('full');sheet._natH=0;buzz&&buzz(6);requestAnimationFrame(()=>toH(natH,()=>{sheet.style.height='';sheet.style.maxHeight='';}));return;}
      if(dy>110)requestClose();};
    addEventListener('pointermove',mv);addEventListener('pointerup',up);addEventListener('pointercancel',up);};
  if(innerWidth<BP.tablet){grab.addEventListener('pointerdown',dragZone);head&&head.addEventListener('pointerdown',dragZone);}
  function requestClose(){if(tryClose&&tryClose()===false)return;close();}
  function close(){const i=sheetStack.indexOf(inst);if(i<0)return;sheetStack.splice(i,1);if(under){const h1=sheet.getBoundingClientRect().height;sheet.style.transition='none';sheet.style.opacity='0';setTimeout(()=>{if(sheetStack.includes(under)){under.sheet.style.visibility='';morphSheetIn(under.sheet,h1);}},30);}scrim.classList.remove('on');sheet.classList.remove('on');document.activeElement&&document.activeElement.blur&&document.activeElement.blur();setTimeout(()=>{scrim.remove();sheet.remove();},340);lockScroll(false);onClose&&onClose();App.refresh();setTimeout(()=>{if(opener&&opener.isConnected&&opener.focus&&!(isTouch()&&opener.matches('input,textarea')))opener.focus({preventScroll:true});},30);}
  return inst;
}
let savedY=0,lockN=0;
function lockScroll(on){lockN+=on?1:-1;document.documentElement.classList.toggle('sheet-up',lockN>0);if(on&&lockN===1){savedY=scrollY;document.body.style.cssText=`position:fixed;top:-${savedY}px;left:0;right:0;overflow:hidden`;}else if(!on&&lockN===0){document.body.style.cssText='';scrollTo(0,savedY);}}
document.addEventListener('keydown',e=>{if(e.key==='Tab'&&sheetStack.length&&!$('.confirm.on')){const box=sheetStack[sheetStack.length-1].sheet,f=[...box.querySelectorAll('button,input,textarea,select,[tabindex="0"]')].filter(n=>!n.disabled&&n.offsetParent!==null);if(f.length){const a=document.activeElement,i=f.indexOf(a);if(e.shiftKey&&i<=0){e.preventDefault();f[f.length-1].focus();}else if(!e.shiftKey&&(i<0||i===f.length-1)){e.preventDefault();f[0].focus();}}}});
/* keep sheets above the on-screen keyboard */
function syncViewport(){const v=window.visualViewport,root=document.documentElement;const h=v?v.height:innerHeight;const kb=Math.max(0,innerHeight-h-(v?v.offsetTop:0));sheetGlide(()=>{root.style.setProperty('--vvh',h+'px');root.style.setProperty('--kb',kb+'px');root.classList.toggle('kb-up',kb>120);});}
if(window.visualViewport){visualViewport.addEventListener('resize',syncViewport);visualViewport.addEventListener('scroll',syncViewport);}addEventListener('resize',syncViewport);syncViewport();
/* Inside the app the keyboard covers the page without resizing it, and the phone then pushes the whole sheet up to reveal a low field, taking Cancel and Add with it.
   So when typing starts: give the sheet more height, and bring the field up under the header before the phone needs to move anything. */
document.addEventListener('focusin',e=>{const t=e.target;if(!t.matches||!t.matches('input:not([type=color]):not([type=file]):not([type=date]),textarea'))return;const sh=t.closest('.sheet');if(!sh)return;
  if(!isTouch()){setTimeout(()=>t.scrollIntoView({block:'nearest',behavior:'smooth'}),300);return;}
  sheetGlide(()=>sh.classList.add('typing'));const b=sh.querySelector('.sbody');if(!b||!sh.classList.contains('full'))return;
  const tr=t.getBoundingClientRect(),rel=tr.top-b.getBoundingClientRect().top;if(rel>12)b.scrollTop+=rel-6;});
/* The phone leaves a field alone only when it sits as high as the Title field; anywhere lower and it shifts the whole page, taking Cancel and Add with it. So any field moves up to that spot first, and only then takes focus. */
let tapMoved=false,tapX=0,tapY=0;
document.addEventListener('touchstart',e=>{const p=e.touches[0];tapMoved=e.touches.length>1;tapX=p.clientX;tapY=p.clientY;},{capture:true,passive:true});
document.addEventListener('touchmove',e=>{const p=e.touches[0];if(Math.hypot(p.clientX-tapX,p.clientY-tapY)>10)tapMoved=true;},{capture:true,passive:true});
document.addEventListener('touchend',e=>{const t=e.target;if(tapMoved||!t.matches||!t.matches('input:not([type=color]):not([type=file]):not([type=date]),textarea')||document.activeElement===t)return;const sh=t.closest('.sheet.full');if(!sh||innerWidth>=BP.desktop)return;const b=sh.querySelector('.sbody');if(!b)return;const tr=t.getBoundingClientRect(),rel=tr.top-b.getBoundingClientRect().top;if(rel<=12)return;e.preventDefault();sh.classList.add('typing');b.scrollTop+=rel-6;t.focus({preventScroll:true});},{capture:true,passive:false});
document.addEventListener('focusout',e=>{const sh=e.target.closest&&e.target.closest('.sheet');if(!sh||!sh.classList.contains('typing'))return;setTimeout(()=>{const a=document.activeElement;if(!(a&&sh.contains(a)&&a.matches('input,textarea'))&&!sh.querySelector('.drag'))sh.classList.remove('typing');},140);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const m=$('.menu');if(m){closeMenu();return;}const c=$('.confirm.on');if(c){c._no&&c._no();return;}const s=sheetStack[sheetStack.length-1];if(s)s.requestClose();}});
function askConfirm({title,body,yes='Discard',no='Keep editing',danger=true,alt,alts,onYes,hold=false}){
  const others=[alt,...(alts||[])].filter(Boolean);
  $('#toast').classList.remove('on');
  const cs=el('div',{class:'cscrim'}),box=el('div',{class:'confirm',role:'alertdialog','aria-label':title});
  const off=()=>{cs.classList.remove('on');box.classList.remove('on');setTimeout(()=>{cs.remove();box.remove();},280);};
  box._no=off;cs.onclick=off;
  box.append(el('div',{class:'box'},el('h3',{},title),body?el('p',{},body):null,hold?holdBtn(`Hold to ${yes.toLowerCase()}`,()=>{off();onYes();}):Button(yes,{variant:'primary',cls:danger?'danger':'',onclick:()=>{off();onYes();}}),others.map(a=>Button(a.label,{variant:'quiet',tone:a.danger?'danger':null,onclick:()=>{off();a.onclick();}})),Button(no,{variant:'quiet',onclick:off})));
  $('#layers').append(cs,box);void box.offsetWidth;requestAnimationFrame(()=>{cs.classList.add('on');box.classList.add('on');});
}
function closeMenu(){const m=$('.menu'),s=$('.mscrim');m&&m.remove();s&&s.remove();}
let LASTPT={x:innerWidth/2,y:innerHeight/2};document.addEventListener('pointerdown',e=>{LASTPT={x:e.clientX,y:e.clientY};},true);
/* four choices or fewer: a small menu where you tapped, not a sheet */
const menuAt=items=>Menu(items);
/* v239 · one menu: Menu(items,{at}) opens it at an element, an event or the last tap; holdMenu() attaches it to hold and right-click */
function Menu(items,{at=null}={}){let x=LASTPT.x,y=LASTPT.y;if(at&&at.getBoundingClientRect){const r=at.getBoundingClientRect();x=r.right;y=r.bottom+4;}else if(at&&at.clientX!=null){x=at.clientX;y=at.clientY;}else if(at&&at.x!=null){x=at.x;y=at.y;}openMenu(x,y,typeof items==='function'?items():items);}
function holdMenu(node,items,{skip=null}={}){onPress(node,(x,y)=>typeof items==='function'&&items.length>=2?items(x,y):openMenu(x,y,typeof items==='function'?items():items),skip);node.addEventListener('click',e=>{if(Date.now()-(node._pressed||0)<700){e.stopPropagation();e.preventDefault();}},true);return node;}
function openMenu(x,y,items){
  closeMenu();{const tEl=$('#toast');if(tEl)tEl.classList.remove('on');}/* the lift of the finger that opened the menu must not close it or pick an item, however long it was held */let armed=false;document.addEventListener('pointerdown',()=>{armed=true;},{capture:true,once:true});const stray=e=>e.detail>0&&!armed;const scrim=el('div',{class:'mscrim',onclick:e=>{if(!stray(e))closeMenu();},oncontextmenu:e=>{e.preventDefault();closeMenu();}}),m=el('div',{class:'menu',role:'menu'});m.addEventListener('click',e=>{if(stray(e)){e.stopPropagation();e.preventDefault();}},true);
  /* v286 · every hold menu reads the same way: Open first, the rest as given, Delete last */
  {const L=items.filter(Boolean),rk=it=>it.header?-1:/^(Open|See details)\b/.test(it.label)?0:it.danger||/^Delete\b/.test(it.label)?2:1;items=L.map((it,i)=>[it,i]).sort((a,b)=>rk(a[0])-rk(b[0])||a[1]-b[1]).map(x=>{if(!x[0].header&&/^Delete\b/.test(x[0].label))x[0].danger=true;return x[0];});}
  items.filter(Boolean).forEach(it=>m.append(it.header?el('div',{class:'mhead'},it.header):el('button',{role:'menuitem',class:it.danger?'danger':'',html:(it.icon?ic(it.icon,IC.md):'')+`<span>${esc(it.label)}</span>`,onclick:()=>{closeMenu();it.onclick();}})));
  m.setAttribute('aria-orientation','vertical');m.addEventListener('keydown',e=>{const bs=[...m.querySelectorAll('button')],i=bs.indexOf(document.activeElement);if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const n=bs[(i+(e.key==='ArrowDown'?1:-1)+bs.length)%bs.length];n&&n.focus();}else if(e.key==='Home'||e.key==='End'){e.preventDefault();(e.key==='Home'?bs[0]:bs[bs.length-1]).focus();}else if(e.key==='Escape'||e.key==='Tab'){e.preventDefault();closeMenu();}});
  document.body.append(scrim,m);const vw=document.documentElement.clientWidth||innerWidth;m.style.left=Math.max(12,Math.min(x,vw-m.offsetWidth-12))+'px';m.style.top=Math.max(8,Math.min(y,innerHeight-m.offsetHeight-8))+'px';const f=m.querySelector('button');f&&f.focus({preventScroll:true});
}
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* press: right-click opens the menu with a mouse, long-press opens it on touch */
let lastPointer='mouse';
addEventListener('pointerdown',e=>{lastPointer=e.pointerType||'mouse';},true);
async function shareText(title,t,msg='Copied'){const btn=typeof lastBtn!=='undefined'?lastBtn():null;try{if(navigator.share&&isTouch()){await navigator.share({title,text:t});doneMorph(btn);return;}}catch(e){if(e&&e.name==='AbortError')return;}try{await navigator.clipboard.writeText(t);toast(msg);doneMorph(btn);}catch(e){toast('Copying isn’t available here.');}}
/* a clipped title expands on the first tap, then taps work as usual */
addEventListener('click',e=>{const c=e.target.closest&&e.target.closest('.clip');if(!c||c.classList.contains('unclip')||c.scrollWidth<=c.clientWidth+1)return;c.classList.add('unclip');e.preventDefault();e.stopPropagation();},true);
/* paste several lines into an add box: one item per line */
function pasteLines(e,fn){const t=(e.clipboardData||window.clipboardData)?.getData('text')||'';const ls=t.split(/\r?\n/).map(x=>x.replace(/^\s*(?:[-*•▢☐]|\[[ x]?\]|\d+[.)])\s*/i,'').trim()).filter(Boolean);if(ls.length<2)return;e.preventDefault();fn(ls);}
function onPress(node,fn,skip){
  node.addEventListener('keydown',e=>{if(e.key==='ContextMenu'||(e.shiftKey&&e.key==='F10')){if(e.target!==node&&!node.contains(e.target))return;e.preventDefault();const r=(e.target.getBoundingClientRect?e.target:node).getBoundingClientRect();fn(r.left+16,r.bottom);}});
  node.addEventListener('contextmenu',e=>{e.preventDefault();if(lastPointer==='mouse'){markGs('hold');fn(e.clientX,e.clientY);}});
  let t,sx,sy;
  node.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'||(skip&&e.target.closest(skip)))return;sx=e.clientX;sy=e.clientY;clearTimeout(t);t=setTimeout(()=>{buzz(8);node._pressed=Date.now();try{getSelection().removeAllRanges();}catch(err){}markGs('hold');fn(sx,sy);},420);});
  const clear=()=>clearTimeout(t);
  node.addEventListener('pointerup',clear);node.addEventListener('pointercancel',clear);
  node.addEventListener('pointermove',e=>{if(Math.hypot(e.clientX-sx,e.clientY-sy)>8)clear();});
  node.addEventListener('click',e=>{if(node._pressed&&Date.now()-node._pressed<500){e.stopPropagation();e.preventDefault();}},true);
}
function onSwipe(node,left,right){
  let x0,y0,on=false;
  node.addEventListener('touchstart',e=>{if(e.touches.length!==1||App.dragging||e.target.closest('.weekstrip,.dock')){on=false;return;}x0=e.touches[0].clientX;y0=e.touches[0].clientY;on=true;},{passive:true});
  node.addEventListener('touchend',e=>{if(!on)return;on=false;if(App.dragging||Date.now()-(App._dragEnd||0)<400)return;const t=e.changedTouches[0],dx=t.clientX-x0,dy=t.clientY-y0;if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy)*2){markGs('swipe');dx<0?left():right();}},{passive:true});
}
/* pick up and drop. Mouse: after a small move. Touch: after a long press; letting go without moving is a "hold" (opens the menu). */
function draggable(node,{label,start,move,drop,hold,filter,ghost:useGhost=true,canTouch=true,pull=false}){
  node.addEventListener('pointerdown',e=>{
    if(e.button!=null&&e.button!==0)return;if(e.target.closest('.tick,.tick-hit,input,.rz,.chip,.iconbtn'))return;if(filter&&!filter(e))return;
    const pt=e.pointerType||'mouse',x0=e.clientX,y0=e.clientY;let on=false,moved=false,ghost=null,lp,cx=x0,cy=y0,raf;
    const place=()=>{if(ghost){ghost.style.left=cx-30+'px';ghost.style.top=cy-36+'px';}move&&move(cx,cy);};
    let zone=0;const loop=()=>{if(!on)return;const H=innerHeight,lo=H-170,hi=90,inZ=cy>lo||(cy<hi&&scrollY>0);if(!inZ)zone=0;else{if(!zone)zone=performance.now();if(performance.now()-zone>350){if(cy>lo)scrollBy(0,Math.min(16,(cy-lo)/5));else scrollBy(0,-Math.min(16,(hi-cy)/5));}}place();raf=requestAnimationFrame(loop);};
    const begin=()=>{on=true;App.dragging=true;document.body.classList.add('is-dragging');clearTimeout(lp);if(useGhost&&label){ghost=el('div',{class:'ghost'},label);document.body.append(ghost);}node.classList.add('lift');buzz(8);start&&start(x0,y0);loop();};
    const mv=ev=>{cx=ev.clientX;cy=ev.clientY;const dx=cx-x0,dy=cy-y0,far=Math.hypot(dx,dy)>=6;
      if(!on){if(!far)return;
        if(pt==='mouse'){begin();moved=true;}
        else if(pull&&dy>0&&Math.abs(dy)>Math.abs(dx)*1.2){begin();moved=true;}
        else{off();return;}}
      else if(far)moved=true;
      if(ev.cancelable)ev.preventDefault();};
    const tm=ev=>{if(on&&ev.cancelable)ev.preventDefault();};
    const off=()=>{clearTimeout(lp);cancelAnimationFrame(raf);removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',cancel);removeEventListener('touchmove',tm);};
    const finish=()=>{on=false;off();App.dragging=false;document.body.classList.remove('is-dragging');App._dragEnd=Date.now();node._dragged=Date.now();ghost&&ghost.remove();node.classList.remove('lift');};
    const up=ev=>{if(!on){off();return;}finish();if(!moved&&hold&&pt!=='mouse')hold(x0,y0);else if(moved)drop&&drop(ev.clientX,ev.clientY);App.refresh();};
    const cancel=()=>{if(on){finish();clearPreviewSafe();App.refresh();}else off();};
    addEventListener('pointermove',mv,{passive:false});addEventListener('pointerup',up);addEventListener('pointercancel',cancel);addEventListener('touchmove',tm,{passive:false});
    if(pt!=='mouse'&&canTouch)lp=setTimeout(begin,300);
  });
  node.addEventListener('click',e=>{if(node._dragged&&Date.now()-node._dragged<300){e.stopPropagation();e.preventDefault();}},true);
}
const clearPreviewSafe=()=>{const p=document.getElementById('drop-prev');p&&p.remove();};
const EMPTY_ART='<svg class="eart" width="72" height="56" viewBox="0 0 88 70" aria-hidden="true"><path d="M53 60H24a10 10 0 0 1-10-10V20a10 10 0 0 1 10-10h40a10 10 0 0 1 10 10v19"/><path d="M26 28h36M26 40h22"/><circle cx="66" cy="52" r="11"/><path d="M61.2 52.2l3.3 3.3 6.3-6.8"/></svg>';
/* v229 · the compact form of the same empty state, for spots inside cards and sheets */
/* v239 · one empty state: Empty({icon, title, body, action, size}) */
/* v342 · illustrated empty states: a soft backdrop and a drawing that matches what's empty */
const EART=(body)=>`<svg class="eart ill" width="88" height="70" viewBox="0 0 88 70" aria-hidden="true"><circle class="ebg" cx="44" cy="36" r="31"/>${body}</svg>`;
const EMPTY_ARTS=[
 [/^nothing for|search|no match|find/i,'<circle cx="40" cy="33" r="13"/><path d="M50 43l11 11"/>'],
 [/inbox|idea|captur/i,'<path d="M22 40l7-17h30l7 17v10a4 4 0 0 1-4 4H26a4 4 0 0 1-4-4z"/><path d="M22 40h13l3 5h12l3-5h13"/><path d="M66 13v6M63 16h6"/>'],
 [/task|to do|to-do|left|done|finish|checklist|step/i,'<rect x="24" y="14" width="40" height="44" rx="7"/><path d="M32 27l3 3 6-6M46 27h10M32 41l3 3 6-6M46 41h10"/>'],
 [/habit|streak|routine/i,'<path d="M30 30a14 14 0 0 1 25-8M58 42a14 14 0 0 1-25 8"/><path d="M55 15v7h-7M33 57v-7h7"/><circle cx="44" cy="36" r="3"/>'],
 [/goal|aim|target|plan/i,'<circle cx="42" cy="38" r="17"/><circle cx="42" cy="38" r="9"/><path d="M42 38l16-16M53 21h5v5"/>'],
 [/calendar|event|schedul|day|week|month|date|holiday/i,'<rect x="22" y="18" width="44" height="38" rx="7"/><path d="M22 29h44M32 13v9M56 13v9"/><path d="M38 43l4 4 8-8"/>'],
 [/photo|image|picture/i,'<rect x="20" y="18" width="48" height="36" rx="7"/><circle cx="34" cy="30" r="4"/><path d="M22 50l14-12 10 8 8-6 12 10"/>'],
 [/money|spend|bill|budget|income|saving|expense|\$|subscri|net worth|tax/i,'<ellipse cx="44" cy="24" rx="16" ry="6"/><path d="M28 24v10c0 3.3 7.2 6 16 6s16-2.7 16-6V24M28 34v10c0 3.3 7.2 6 16 6s16-2.7 16-6V34"/>'],
 [/people|person|friend|family|contact|gift|birthday/i,'<circle cx="35" cy="28" r="7"/><circle cx="55" cy="30" r="6"/><path d="M22 54c1-9 6-14 13-14s12 5 13 14M48 54c1-7 4-11 8-11s8 4 9 11"/>'],
 [/trip|travel|pack|flight/i,'<rect x="22" y="24" width="44" height="30" rx="6"/><path d="M36 24v-6a3 3 0 0 1 3-3h10a3 3 0 0 1 3 3v6M22 36h44"/>'],
 [/book|read|course|learn|note|journal/i,'<path d="M44 20c-6-4-14-5-22-4v36c8-1 16 0 22 4 6-4 14-5 22-4V16c-8-1-16 0-22 4z"/><path d="M44 20v36"/>'],
];
function emptyArt(t,b){const m=EMPTY_ARTS.find(([re])=>re.test(t||''))||EMPTY_ARTS.find(([re])=>re.test(b||''));return m?EART(m[1]):EART('<path d="M53 60H24a10 10 0 0 1-10-10V20a10 10 0 0 1 10-10h40a10 10 0 0 1 10 10v19"/><path d="M26 28h36M26 40h22"/><circle cx="66" cy="52" r="11"/><path d="M61.2 52.2l3.3 3.3 6.3-6.8"/>');}
function Empty({icon=null,title,body=null,action=null,size='lg',cls=''}={}){let art;if(icon)art=IconTile(icon,{size:size==='sm'?'md':'lg',cls:'eic'});else{const a=document.createElement('span');a.innerHTML=emptyArt(String(title||''),String(typeof body==='string'?body:''));art=a.firstChild;}
  return el('div',{class:['empty',size==='sm'?'sm':'',cls].filter(Boolean).join(' ')},art,el('b',{},title),body?el('div',{},body):null,action?el('div',{class:'eact'},action):null);}
function emptySm(title,text,action){return Empty({title,body:text,action,size:'sm'});}
function emptyState(title,text,action){return Empty({title,body:text,action});}
/* ---------- smooth transitions ----------
   vt(update,{dir}) runs a DOM update inside a View Transition when the browser has one
   (iOS 18+, Chrome), so the page cross-fades and named parts (the segmented thumb, the
   calendar body) glide instead of jumping. Without support, or with Reduce motion on, it
   just runs the update. */
const motionOK=()=>!document.documentElement.classList.contains('a-motion')&&!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
/* kept for callers: page changes now animate with plain transforms (motion.js), not View Transitions */
function vt(update){update();return null;}
/* Every switch: it flips itself the moment it's tapped (so the knob starts gliding on the element you touched),
   then hands the new value to fire. motion.js keeps this same element through any redraw that follows.
   flip:false for switches whose tap may be cancelled (they flip when the redraw says so). */
function swMake(on,label,fire,flip=true){const b=el('button',{class:'sw'+(on?' on':''),role:'switch','aria-checked':String(on),'aria-label':label});b._fire=fire;b._flip=flip;
  b.addEventListener('click',e=>{e.stopPropagation();const me=e.currentTarget,nv=!me.classList.contains('on');
    if(me._flip){me.classList.toggle('on',nv);me.setAttribute('aria-checked',String(nv));}
    me._fire(nv,e);});
  return b;}
function seg(opts,val,on){
  const idx=Math.max(0,opts.findIndex(([v])=>v===val));
  const root=el('div',{class:'seg',role:'group',onclick:e=>e.stopPropagation()});
  const th=el('span',{class:'seg-thumb','aria-hidden':'true',style:`grid-column:${idx+1}`+(opts.some(([v])=>v===val)?'':';visibility:hidden')});
  const btns=opts.map(([v,l],i)=>el('button',{class:val===v?'on':'','aria-pressed':String(val===v),style:`grid-column:${i+1};grid-row:1`,onclick:e=>{e.stopPropagation();
    const from=btns.findIndex(b=>b.classList.contains('on'));if(from===i)return;
    const all=$$('.seg'),at=all.indexOf(root),r0=root.querySelector('.seg-thumb').getBoundingClientRect();
    on(v);
    if(root.isConnected){btns.forEach((b,j)=>{b.classList.toggle('on',j===i);b.setAttribute('aria-pressed',String(j===i));});th.style.gridColumn=String(i+1);const wasHid=th.style.visibility==='hidden';th.style.visibility='';if(!wasHid)segGlide(r0,root);} /* redrawn: motion.js glides the new one */
  }},el('span',{class:'seg-l'},l)));
  root.addEventListener('keydown',e=>{if(e.key!=='ArrowLeft'&&e.key!=='ArrowRight')return;const i=btns.indexOf(document.activeElement);if(i<0)return;const n=btns[(i+(e.key==='ArrowRight'?1:-1)+btns.length)%btns.length];e.preventDefault();e.stopPropagation();n.focus();n.click();});
  root.append(th,...btns);return root;
}
/* on a phone nothing ever opens with the keyboard up: it comes up when you tap a field */
function focusTitle(input){focusIfKeyboard(input);}
/* was a field in use when this tap began? then the keyboard is already up, and the next field can keep it */
let typingAtPress=false;document.addEventListener('pointerdown',()=>{const a=document.activeElement;typingAtPress=!!(a&&a.matches&&a.matches('input,textarea'));},true);
const isTouch=()=>matchMedia('(hover:none),(pointer:coarse)').matches;
/* phones open a form with the keyboard down; a computer can start typing straight away */
function focusIfKeyboard(input){if(!isTouch()&&!input.value)input.focus({preventScroll:true});}
/* Bars and rings are rebuilt on every render, so each remembers its last value and glides from there */
const FILLS=new Map();const FILLS_SEEN=new Set();
function animateFills(root,S){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const P=S.params||{},scope=`${S.view}:${P.id||P.tool||P.name||''}`;
  [...root.querySelectorAll('.ring:not([data-self]),.hmeter>i,.progress>i')].forEach((n,i)=>{
    const ring=n.classList.contains('ring'),target=parseFloat(ring?n.style.getPropertyValue('--p'):n.style.width)||0,key=`${scope}:${i}`,from=FILLS.has(key)?FILLS.get(key):0;
    FILLS.set(key,target);if(Math.abs(from-target)<.01){FILLS_SEEN.add(key);return;}
    const set=v=>{if(ring)n.style.setProperty('--p',String(v));else n.style.width=`${v}%`;};
    n.style.transition='none';set(from);void n.offsetWidth;n.style.transition='';set(target);
    /* the glow marks real progress, so it only plays when a value you've already seen goes up */
    if(target>=100&&from<100&&FILLS_SEEN.has(key)&&motionOK()&&S.view==='plan'&&ring&&celebOf(get.settings()).big!=='off')setTimeout(()=>petals(n),600);
    if(target>=100&&from<100&&FILLS_SEEN.has(key)&&motionOK())setTimeout(()=>n.animate([{filter:'drop-shadow(0 0 0 rgba(70,107,90,0))',transform:'scale(1)'},{filter:'drop-shadow(0 0 8px rgba(70,107,90,.55))',transform:'scale(1.06)',offset:.4},{filter:'drop-shadow(0 0 0 rgba(70,107,90,0))',transform:'none'}],{duration:MOT.slow,easing:MOT.spring}),650);
    if(FILLS_SEEN.has(key)&&target>from){n.classList.add('oglow');n.addEventListener('animationend',()=>n.classList.remove('oglow'),{once:true});}FILLS_SEEN.add(key);
  });
}

/* page titles step down in size as they get longer, and stop at three lines, so a long name never takes over the page */
function fitTitle(h){const n=(h.textContent||'').trim().length;h.classList.remove('tm','tl','tx');if(n>60)h.classList.add('tx');else if(n>34)h.classList.add('tl');else if(n>18)h.classList.add('tm');if(n>18){h.title=h.textContent.trim();}}
/* long lists show their first rows and one quiet "Show N more" row; the choice lasts until the app is closed */
function capRows(nodes,key,n=8){const S=App.state;S._more=S._more||{};if(nodes.length<=n+2)return nodes;if(S._more[key]){revealRows(nodes.slice(n),'more:'+key);return nodes;}const rest=nodes.length-n;return[...nodes.slice(0,n),el('button',{class:'showmore',onclick:()=>{S._more[key]=true;S._reveal='more:'+key;App.refresh();}},el('span',{},`Show ${rest} more`),el('span',{class:'chev',html:ic('chevd',IC.sm)}))];}
/* the short date at the right end of a row: red when it has passed, a weekday this week, otherwise "Mar 4" */
function sideDay(dk){const tk=todayK(),n=daysBetween(tk,dk);if(n<0)return el('span',{class:'tside olate'},n===-1?'Yesterday':`${-n} days late`);return el('span',{class:'tside'},n<2?relDay(dk):n<7?DOW[fromK(dk).getDay()].slice(0,3):fmtMD(dk));}
/* the last row of a Details card: one way in to change everything else */
function editRow(fn,label='Edit details'){return el('button',{class:'dlrow dledit',onclick:fn},el('span',{class:'dlic',html:ic('edit',IC.md)}),el('span',{class:'grow'},label),el('span',{class:'dlch',html:ic('chevr',IC.sm)}));}
/* the three shortcuts above every row of day circles; the one matching the current days lights up */
function dayChips(days,apply){const P=[['Every day',[0,1,2,3,4,5,6]],['Weekdays',[0,1,2,3,4]],['Weekends',[5,6]]],key=a=>a.slice().sort().join();
  return el('div',{class:'chips daychips'},P.map(([n,v])=>el('button',{class:'chip'+(key(days||[])===key(v)?' on':''),'aria-pressed':String(key(days||[])===key(v)),onclick:e=>{e.stopPropagation();const was=(days||[]).slice();apply(v.slice());if(typeof wdFill==='function')wdFill(was,v);}},n)));}
/* every life area chip carries the area's own icon */
function areaChipIc(a){return el('span',{class:'cic','aria-hidden':'true',html:ic(areaIcon(a),IC.sm)});}
/* the reason or outcome a person wrote, shown quietly under the title of its page */
function whyLine(t){return el('p',{class:'pwhy'},...linkText(t));}
/* folds open with the same calm motion as the sheets: the rows that just appeared slide in, one after another */
function revealRows(nodes,key){if(App.state._reveal!==key||typeof motionOK!=='function'||!motionOK())return nodes;nodes.forEach((n,i)=>{if(n&&n.classList){n.classList.add('revealin');n.style.setProperty('--ri',String(Math.min(i,10)));}});return nodes;}
/* day circles start on the day the week starts (WD and its index stay Monday-first underneath) */
const wdOrd=()=>{const ws=get.settings().weekStart??1,f=(ws+6)%7;return[0,1,2,3,4,5,6].map(i=>(f+i)%7);};
const wdMap=fn=>wdOrd().map(i=>fn(WD[i],i));

/* ---------- palettes and light/dark: one accent color drives every green in the app ---------- */
/* the palettes in Settings: their colours are the --palette-* tokens */
const PALETTES=[['sage','Sage','','sage'],['ocean','Ocean','','blue'],['plum','Plum','','plum'],['clay','Clay','','clay'],['slate','Slate','','slate']];
const palHex=id=>tok('--palette-'+id,'#466B5A');
const hx2rgb=h=>{h=String(h||'').replace('#','');if(h.length===3)h=h.split('').map(c=>c+c).join('');const n=parseInt(h,16);return isNaN(n)||h.length!==6?null:[n>>16&255,n>>8&255,n&255];};
const rgb2hx=c=>'#'+c.map(v=>Math.max(0,Math.min(255,Math.round(v))).toString(16).padStart(2,'0')).join('').toUpperCase();
const lum=c=>{const f=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);};return .2126*f(c[0])+.7152*f(c[1])+.0722*f(c[2]);};
const contrast=(a,b)=>{const x=lum(a),y=lum(b);return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
const mixC=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
/* the accent is darkened until white text on it, and it as text on white, both read clearly */
function safeAccent(h){let c=hx2rgb(h)||hx2rgb(palHex('sage'));for(let i=0;i<30&&contrast(c,[255,255,255])<4.6;i++)c=mixC(c,[0,0,0],.06);return c;}
const themeOf=s=>{const p=PALETTES.find(x=>x[0]===(s.palette||'sage'));if(p)return palHex(p[0]);const e=typeof RW_PALS!=='undefined'&&RW_PALS.find(x=>x[0]===s.palette);if(e)return e[2];return (s.palette==='custom'&&s.customAccent)||palHex('sage');};
const defCol=()=>{const s=get.settings(),p=PALETTES.find(x=>x[0]===(s.palette||'sage'))||(typeof RW_PALS!=='undefined'&&RW_PALS.find(x=>x[0]===s.palette));return p?p[3]:'sage';};
function applyTheme(){const s=get.settings(),R=document.documentElement,dark=s.mode==='dark'||(s.mode==='auto'&&matchMedia('(prefers-color-scheme: dark)').matches);
  R.dataset.mode=dark?'dark':'light';R.dataset.font=s.titleFont||'serif';R.dataset.bg=s.bgTone||'warm';R.dataset.density=s.density||'comfortable';R.dataset.labels=s.tabLabels===false?'off':'on';
  /* v337 · look: accent strength, corners, card style, body font */R.dataset.accent=s.accentStr||'standard';R.dataset.corners=s.corners||'round';R.dataset.cards=s.cardStyle||'lifted';R.dataset.body=s.bodyFont||'figtree';R.dataset.four=s.navFour?'on':'off';
  /* v342 · Home Screen icon: iPhone reads it when you add the app */try{const li=document.querySelector('link[rel=apple-touch-icon]');if(li){const want=s.appIcon&&s.appIcon!=='sage'?`/icons/apple-touch-icon-${s.appIcon}.png`:'/icons/apple-touch-icon.png';if(li.getAttribute('href')!==want)li.setAttribute('href',want);}}catch(e){}
  const a=safeAccent(themeOf(s)),W=[255,255,255],K=[0,0,0],st=R.style,set=(k,c)=>st.setProperty(k,typeof c==='string'?c:rgb2hx(c));
  const isDefault=(s.palette||'sage')==='sage'&&!dark;
  const RAMP=[[50,W,.93],[100,W,.85],[200,W,.74],[300,W,.6],[400,W,.48],[500,W,.22],[600,null,0],[700,K,.1],[800,K,.32],[900,K,.5]];const OLD=['--accent','--accent-text','--accent-deep','--accent-soft','--accent-wash','--accent-mid','--accent-light','--accent-pale','--h0','--h1','--h2','--h3','--h4','--tint-1','--tint-3'];
  if(isDefault){[...OLD,...RAMP.map(r=>'--sage-'+r[0])].forEach(k=>st.removeProperty(k));}
  else if(!dark){OLD.forEach(k=>st.removeProperty(k));/* one ramp: every green token reads from it, so a palette reaches charts, heat and circles too */RAMP.forEach(([n,to,f])=>set('--sage-'+n,to?mixC(a,to,f):a));}
  else{RAMP.forEach(r=>st.removeProperty('--sage-'+r[0]));const card=[27,32,30],lift=mixC(a,W,.12);let txt=mixC(a,W,.45);for(let i=0;i<20&&contrast(txt,card)<4.6;i++)txt=mixC(txt,W,.1);
    set('--accent',lift);set('--accent-text',txt);set('--accent-deep',mixC(a,W,.6));set('--accent-soft',mixC(card,a,.28));set('--tint-1',mixC(card,a,.14));set('--tint-3',mixC(card,a,.4));set('--h1',mixC(card,a,.2));set('--h2',mixC(card,a,.36));set('--h3',mixC(card,a,.55));set('--h4',lift);}
  const m=document.querySelector('meta[name=theme-color]');if(m)m.setAttribute('content',tok(s.bgTone==='white'&&!dark?'--white':'--paper'));COLOR_HEX=null;}

/* ---------- work: jobs and shifts (older single work hours become one job called Work) ---------- */
function jobsOf(s){if(Array.isArray(s.jobs)&&s.jobs.length)return s.jobs;const w=s.work||{start:540,end:1020};return[{id:'work',name:'Work',flex:false,cycle:'week',shifts:[{id:'s1',days:(s.workDays||[0,1,2,3,4]).slice(),start:w.start,end:w.end}]}];}
function jobsSummary(s){const J=jobsOf(s),f=J.filter(j=>j.flex).length;if(J.length===1&&!f){const sh=J[0].shifts;return sh.length===1?`${workDaysText(sh[0].days)} · ${fmtT(sh[0].start)} – ${fmtT(sh[0].end)}`:`${sh.length} shifts`;}return[`${J.length} job${J.length>1?'s':''}`,f?`${f} flexible`:null].filter(Boolean).join(' · ');}
const flexStart=(j,dk)=>{const ws=weekStartOf(fromK(dk));if(j.cycle!=='2week')return k(ws);const ref=weekStartOf(new Date(2026,0,5)),n=Math.round((ws-ref)/(7*864e5));return k(((n%2)+2)%2===0?ws:addD(ws,-7));};
/* shifts on a day: [{job,start,end}] ; null means a flexible job whose hours aren't in yet */
/* v267 · a holiday you take off has no shifts; .holiday names it and .had says work was due that day */
function shiftsOn(dk,raw){if(!raw&&typeof Holidays!=='undefined'&&Holidays.off(dk)){const r=shiftsOn(dk,true),o=[];o.unknown=false;o.holiday=Holidays.name(dk);o.had=r.length>0||!!r.unknown;return o;}
  const s=get.settings(),d=fromK(dk),mi=monIdx(d),out=[];let unknown=false;
  jobsOf(s).forEach(j=>{if(j.flex){const m=(s.flexHours||{})[j.id]||{};if(m[dk])m[dk].forEach(x=>out.push({job:j.name||'Work',start:x.start,end:x.end}));else if(!m['_'+flexStart(j,dk)])unknown=true;}
    else{const pm=(mi+6)%7;j.shifts.forEach(x=>{if(x.days.includes(mi))out.push({job:j.name||'Work',start:x.start,end:x.end});
      /* an overnight shift from yesterday runs into this morning */
      if(x.end<x.start&&x.end>0&&x.days.includes(pm))out.push({job:j.name||'Work',start:0,end:x.end,carry:true});});}});
  out.sort((a,b)=>a.start-b.start);out.unknown=unknown;return out;}
/* flexible jobs whose next period needs hours (from four days before it starts) */
function flexDue(){const s=get.settings(),out=[],tk=todayK();if(s.flexRemind===false)return out;jobsOf(s).filter(j=>j.flex).forEach(j=>{const len=j.cycle==='2week'?14:7;let st=flexStart(j,tk);const m=(s.flexHours||{})[j.id]||{};
  if(m['_'+st]){st=k(addD(fromK(st),len));if(daysBetween(tk,st)>4||m['_'+st])return;}out.push({job:j,from:st,to:k(addD(fromK(st),len-1))});});return out;}

/* v230 · section labels are real headings, and every role=button can be reached and pressed from the keyboard */
function a11yPass(root){if(!root||!root.querySelectorAll)return;
  root.querySelectorAll('.lbl,.lbl3,.sect,.secl,.dlhead').forEach(n=>{if(/^H[1-6]$/.test(n.tagName)||n.hasAttribute('role')||n.closest('button,a,label,.li,.chip,[role=button]'))return;n.setAttribute('role','heading');n.setAttribute('aria-level','2');});
  root.querySelectorAll('[role=button]:not([tabindex])').forEach(n=>n.setAttribute('tabindex','0'));}
document.addEventListener('keydown',e=>{const t=e.target;if((e.key==='Enter'||e.key===' ')&&!e.defaultPrevented&&t&&t.getAttribute&&t.getAttribute('role')==='button'&&t.tagName!=='BUTTON'){e.preventDefault();t.click();}});

function toastRestack(){const l=[...document.querySelectorAll('.toast.tstk')];while(l.length>0)l.shift().remove();l.reverse().forEach((n,i)=>n.style.setProperty('--i',i+1));}

/* v232 · forgiving match: every word can match anywhere, in any order, with a small typo; lower score = better, -1 = no match */
function editDist(a,b){if(a===b)return 0;const m=Array.from({length:a.length+1},(_,i)=>[i]);for(let j=1;j<=b.length;j++)m[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)m[i][j]=Math.min(m[i-1][j]+1,m[i][j-1]+1,m[i-1][j-1]+(a[i-1]===b[j-1]?0:1));return m[a.length][b.length];}
function fuzzyScore(text,q){const T=String(text||'').toLowerCase(),Q=String(q||'').toLowerCase().trim();if(!Q)return 0;if(!T)return -1;
  if(T.startsWith(Q))return 0;if(T.includes(Q))return 1;
  const toks=T.split(/[^a-z0-9À-ɏ]+/).filter(Boolean),ws=Q.split(/\s+/).filter(Boolean);let s=2;
  for(const w of ws){let best=99;for(const t of toks){if(t.startsWith(w)){best=0;break;}if(t.includes(w))best=Math.min(best,1);else if(w.length>=4){const d=Math.min(editDist(w,t.slice(0,w.length)),editDist(w,t));if(d<=(w.length>=7?2:1))best=Math.min(best,2+d);}}
    if(best===99)return -1;s+=best;}
  return s;}

/* v232 · where a new time block should start: the next free half hour that day (from now, if it's today), or 9:00 on an open day */
function nextFreeSlot(dk,dur=30){try{if(typeof Holidays!=='undefined'&&Holidays.off(dk)&&dk!==todayK())return 10*60;const items=dayItems(dk).timed.filter(e=>e.time!=null&&e.kind!=='task'),busy=items.map(e=>[e.time-(+(e.rec&&e.rec.travel)||0),e.time+(e.dur||30)]);
  const isT=dk===todayK();let t=isT?Math.max(0,Math.ceil(nowMin()/30)*30):9*60;if(!busy.length&&!isT)return 9*60;if(!isT)t=Math.min(t,9*60);
  for(;t+dur<=23*60;t+=30){if(!busy.some(([a,b])=>t<b&&t+dur>a))return t;}return isT?Math.min(22*60,Math.ceil(nowMin()/30)*30):9*60;}catch(e){return 9*60;}}

/* v233 · read a CSS token from code (for canvas drawing, where var() can't be used) */
const tok=(n,fb='')=>{try{return getComputedStyle(document.documentElement).getPropertyValue(n).trim()||fb;}catch(e){return fb;}};
/* v286 · chip rows that run past the edge fade out on the right, so you know there's more */
(()=>{let t=0;const mark=()=>{document.querySelectorAll('.fchips,.ibfilters,.ibstart').forEach(n=>{n.classList.remove('ovf');n.classList.toggle('ovf',n.scrollWidth>n.clientWidth+2);});};const go=()=>{clearTimeout(t);t=setTimeout(mark,60);};try{new MutationObserver(go).observe(document.documentElement,{childList:true,subtree:true});addEventListener('resize',go);}catch(e){}})();

/* v290 · life-area choices carry their icons */
function areaOpts(){return [{value:'',label:'None',icon:'leaf'},...(get.settings().areas||AREAS).map(a=>({value:a,label:a,icon:areaIcon(a)}))];}
/* v291 · a sticky bar only draws its line once it is actually stuck */
(()=>{let raf=0;const chk=()=>{raf=0;document.querySelectorAll('.tstick').forEach(n=>{const t=parseFloat(getComputedStyle(n).top)||0;n.classList.toggle('stuck',scrollY>4&&n.getBoundingClientRect().top<=t+1);});};try{addEventListener('scroll',()=>{if(!raf)raf=requestAnimationFrame(chk);},{passive:true});}catch(e){}})();
