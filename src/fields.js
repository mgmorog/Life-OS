/* ---------- v343 · your own fields, statuses and tags ----------
   Definitions live in settings (fields, statuses, tagGroups, areaDefaults); values live on each record:
   r.cf = {fieldId: value}, r.status = statusId, r.tags = ['tag', …]. */
const CF_TYPES=[['text','Text','Aa'],['number','Number','#'],['money','Money','$'],['date','Date','▦'],['choice','Choice','◉'],['rating','Rating','★'],['check','Checkbox','☑'],['link','Link','↗'],['file','Attachments','⎘'],['formula','Formula','ƒ']];
const CF_KINDS=[['task','Tasks'],['habit','Habits'],['goal','Goals'],['project','Projects']];
const cfDefs=()=>get.settings().fields||[];
const cfFor=kind=>cfDefs().filter(f=>(f.on||[]).includes(kind));
const cfById=id=>cfDefs().find(f=>f.id===id);
const cfTypeName=t=>(CF_TYPES.find(x=>x[0]===t)||CF_TYPES[0])[1];
const stDefs=()=>get.settings().statuses||[];
const stOf=r=>r&&r.status?stDefs().find(x=>x.id===r.status)||null:null;
const tagGroups=()=>get.settings().tagGroups||[];
const allTags=()=>{const out=[];tagGroups().forEach(g=>(g.tags||[]).forEach(t=>{if(!out.includes(t))out.push(t);}));(get.settings().tags||[]).forEach(t=>{if(!out.includes(t))out.push(t);});get.all('task').forEach(r=>(r.tags||[]).forEach(t=>{if(!out.includes(t))out.push(t);}));return out;};

/* formulas: {Field name}, numbers, + - * / ( ), and daysUntil() round() min() max() abs() */
const CF_BUILTIN={'due date':r=>r.deadline||r.date||null,'length':r=>+r.dur||null,'time spent':r=>+r.spent||0,'steps done %':r=>{const s=(r.steps||[]).filter(x=>x.t);return s.length?Math.round(100*s.filter(x=>x.d).length/s.length):0;}};
function cfRaw(r,f,depth=0){if(!f)return null;if(f.type==='formula')return depth>4?null:cfFormula(r,f.expr||'',depth+1);const v=(r.cf||{})[f.id];return v===undefined?null:v;}
function cfRef(r,name,depth){const n=String(name).trim().toLowerCase();const f=cfDefs().find(x=>x.name.trim().toLowerCase()===n);let v=f?cfRaw(r,f,depth):CF_BUILTIN[n]?CF_BUILTIN[n](r):null;if(v==null||v==='')return null;if(typeof v==='boolean')return v?1:0;if(typeof v==='string'&&/^\d{4}-\d\d-\d\d$/.test(v))return{date:v};const x=+v;return isNaN(x)?null:x;}
function cfFormula(r,expr,depth=0){try{let i=0;const s=String(expr);const ws=()=>{while(i<s.length&&/\s/.test(s[i]))i++;};
  const num=v=>v&&typeof v==='object'?daysBetween(todayK(),v.date):v;
  const prim=()=>{ws();const c=s[i];if(c==='('){i++;const v=add();ws();if(s[i]===')')i++;return v;}if(c==='-'){i++;const v=num(prim());return v==null?null:-v;}
    if(c==='{'){const j=s.indexOf('}',i);const n=s.slice(i+1,j<0?s.length:j);i=j<0?s.length:j+1;return cfRef(r,n,depth);}
    const m=/^[0-9]*\.?[0-9]+/.exec(s.slice(i));if(m){i+=m[0].length;return +m[0];}
    const fn=/^([a-zA-Z]+)\s*\(/.exec(s.slice(i));if(fn){i+=fn[0].length;const args=[];ws();while(i<s.length&&s[i]!==')'){args.push(add());ws();if(s[i]===',')i++;ws();}i++;const F=fn[1].toLowerCase();
      if(F==='daysuntil'){const a=args[0];return a&&typeof a==='object'?daysBetween(todayK(),a.date):null;}const ns=args.map(num);if(ns.some(x=>x==null))return null;
      if(F==='round')return ns.length>1?Math.round(ns[0]*10**ns[1])/10**ns[1]:Math.round(ns[0]);if(F==='min')return Math.min(...ns);if(F==='max')return Math.max(...ns);if(F==='abs')return Math.abs(ns[0]);return null;}
    i=s.length;return null;};
  const mul=()=>{let v=num(prim());for(;;){ws();const c=s[i];if(c!=='*'&&c!=='/')return v;i++;const w=num(prim());if(v==null||w==null){v=null;continue;}v=c==='*'?v*w:(w===0?null:v/w);}};
  const add=()=>{let v=mul();for(;;){ws();const c=s[i];if(c!=='+'&&c!=='-')return v;i++;const w=mul();if(v==null||w==null){v=null;continue;}v=num(v);v=c==='+'?v+w:v-w;}};
  const out=add();return out==null||!isFinite(out)?null:Math.round(out*100)/100;}catch(e){return null;}}
function cfText(r,f){const v=cfRaw(r,f);if(v==null||v===''||(Array.isArray(v)&&!v.length))return '';
  switch(f.type){case 'money':return money(+v);case 'date':return shortDay(v);case 'rating':return '★'.repeat(+v||0);case 'check':return v?'Yes':'';case 'file':return `${v.length} file${v.length===1?'':'s'}`;case 'link':return String(v).replace(/^https?:\/\/(www\.)?/,'').slice(0,28);case 'formula':return (f.fmt==='money'?(get.settings().currency||'$'):'')+String(v)+(f.fmt==='pct'?'%':f.fmt==='days'?' days':'');default:return String(v);}}

/* the editor block inside task, habit, goal and project sheets */
function cfEditor(D,kind,onChange){const defs=cfFor(kind),sts=kind==='task'?stDefs():[],tags=kind==='task'?allTags():[];if(!defs.length&&!sts.length&&!tags.length&&!(kind==='task'&&tagGroups().length))return null;
  const box=el('div',{class:'cfbox'});const changed=()=>{onChange&&onChange();draw();};D.cf=D.cf||{};
  const draw=()=>{box.replaceChildren();
    if(sts.length){box.append(SectionLabel('Status'),el('div',{class:'cfchips',role:'group','aria-label':'Status'},[{id:null,name:'None',sym:''},...sts].map(st=>el('button',{type:'button',class:'chip'+((D.status||null)===st.id?' on':''),'aria-pressed':String((D.status||null)===st.id),onclick:()=>{D.status=st.id;changed();}},st.sym?`${st.sym} ${st.name}`:st.name))));}
    if(kind==='task'&&(tags.length||tagGroups().length)){const cur=new Set(D.tags||[]);const tg=t=>el('button',{type:'button',class:'chip'+(cur.has(t)?' on':''),'aria-pressed':String(cur.has(t)),onclick:()=>{cur.has(t)?cur.delete(t):cur.add(t);D.tags=[...cur];changed();}},t);
      const grouped=new Set();const parts=[];tagGroups().forEach(g=>{(g.tags||[]).forEach(t=>grouped.add(t));if((g.tags||[]).length)parts.push(el('div',{class:'cftg'},el('span',{class:'cftgl'},g.name),el('div',{class:'cfchips'},g.tags.map(tg))));});
      const loose=tags.filter(t=>!grouped.has(t));parts.push(el('div',{class:'cfchips'},...loose.map(tg),el('button',{type:'button',class:'chip cfadd',onclick:()=>askFields({title:'New tag',req:true,D:{t:''},fields:[F('t','Tag','text',{ph:'@home, waiting, quick win'})],save:v=>{const t=String(v.t||'').trim().slice(0,30);if(!t)return;D.tags=[...new Set([...(D.tags||[]),t])];const s=get.settings();if(!allTags().includes(t))setSettings({tags:[...(s.tags||[]),t]});changed();}})},'+ Tag')));
      box.append(SectionLabel('Tags'),...parts);}
    if(defs.length){const l=el('div',{class:'group cfgroup'});defs.forEach(f=>l.append(cfRow(D,f,changed)));box.append(SectionLabel('Fields'),l);}};
  draw();return box;}
function cfRow(D,f,changed){const v=D.cf[f.id],set=x=>{if(x===''||x==null||(Array.isArray(x)&&!x.length))delete D.cf[f.id];else D.cf[f.id]=x;changed();};
  const lab=el('span',{class:'cflab'},f.name);let ctl;
  if(f.type==='text'||f.type==='link'){ctl=el('input',{class:'cfin',type:f.type==='link'?'url':'text',value:v||'',placeholder:f.type==='link'?'https://':'',onchange:e=>set(e.target.value.trim())});}
  else if(f.type==='number'||f.type==='money'){ctl=el('input',{class:'cfin tnum',inputmode:'decimal',value:v??'',placeholder:'0',onchange:e=>{const n=numIn(e.target.value);set(n===''?null:n);}});if(f.type==='money')ctl=el('span',{class:'cfmoney'},el('span',{class:'cfcur'},get.settings().currency||'$'),ctl);}
  else if(f.type==='date'){ctl=el('input',{class:'cfin',type:'date',value:v||'',onchange:e=>set(e.target.value||null)});}
  else if(f.type==='choice'){ctl=el('div',{class:'cfchips'},(f.opts||[]).map(o=>el('button',{type:'button',class:'chip'+(v===o?' on':''),'aria-pressed':String(v===o),onclick:()=>set(v===o?null:o)},o)));}
  else if(f.type==='rating'){ctl=el('div',{class:'cfstars',role:'group','aria-label':f.name},[1,2,3,4,5].map(n=>el('button',{type:'button',class:'cfstar'+((+v||0)>=n?' on':''),'aria-label':`${n} star${n>1?'s':''}`,onclick:()=>set((+v||0)===n?null:n)},'★')));}
  else if(f.type==='check'){return el('div',{class:'cfrow'},Switch({on:!!v,label:f.name,onChange:x=>set(x||null)}));}
  else if(f.type==='file'){const P={photos:(v||[]).slice()};ctl=photosEditor(P,{compact:true,onChange:()=>{D.cf[f.id]=P.photos.slice();if(!P.photos.length)delete D.cf[f.id];onChangeQuiet();}});}
  else if(f.type==='formula'){const x=cfText(D,f);ctl=el('span',{class:'cfval'},x||'—');}
  function onChangeQuiet(){}
  return el('div',{class:'cfrow cf-'+f.type},lab,ctl);}

/* new tasks pick up the starting values of their area */
function applyAreaDefaults(D){const a=D.area,d=a&&(get.settings().areaDefaults||{})[a];if(!d)return D;if(d.dur&&!D.dur)D.dur=d.dur;if(d.priority&&(!D.priority||D.priority==='normal'))D.priority=d.priority;if(d.status&&!D.status)D.status=d.status;if(d.tags&&d.tags.length)D.tags=[...new Set([...(D.tags||[]),...d.tags])];return D;}

/* a compact line for rows: status, tags and up to two fields marked "show on rows" */
function cfMeta(r){const out=[];const rs=id=>typeof rowShown!=='function'||rowShown(id);const st=stOf(r);if(st&&rs('status'))out.push(`${st.sym?st.sym+' ':''}${st.name}`);if(rs('tags'))(r.tags||[]).slice(0,3).forEach(t=>out.push(t.startsWith('@')||t.startsWith('#')?t:'#'+t));if(rs('fields'))cfFor(r.kind).filter(f=>f.row).slice(0,2).forEach(f=>{const t=cfText(r,f);if(t)out.push(f.type==='rating'||f.type==='check'?`${f.name} ${t}`:t);});return out;}

/* ---------- Settings › Fields, tags & statuses ---------- */
function fieldsSettings(page,group,ctx){const s=get.settings();
  let g=group('Fields');const defs=cfDefs();
  /* v359 · fields and statuses drag into the order you want */const dragCommit=(box,key,list)=>()=>{const c=list.slice();setSettings({[key]:[...box.children].filter(n=>n.dataset.i!=null).map(n=>c[+n.dataset.i])});};const grab=(r,i,label,box,key,list)=>{r.dataset.i=String(i);const h=gripEl(label);r.prepend(h);reorderable(h,r,box,dragCommit(box,key,list));return r;};const noDrag=()=>Date.now()-(App._dragEnd||0)<400;
  defs.forEach((f,i)=>g.append(grab(Row({style:'',onclick:()=>{if(!noDrag())fieldSheet(f);}},el('span',{class:'cfic','aria-hidden':'true'},(CF_TYPES.find(x=>x[0]===f.type)||CF_TYPES[0])[2]),el('span',{class:'grow'},el('b',{style:'font-weight:500'},f.name),el('small',{},`${cfTypeName(f.type)} · ${(f.on||[]).map(k=>(CF_KINDS.find(x=>x[0]===k)||[k,k])[1]).join(', ')||'Not used yet'}${f.row?' · on rows':''}`)),RowEnd('chevron')),i,f.name,g,'fields',defs)));
  g.append(Row({style:'',onclick:()=>fieldSheet(null)},el('span',{class:'pplus',html:ic('plus',IC.xs)}),el('span',{class:'grow',style:'text-align:left'},el('b',{style:'font-weight:500;color:var(--action-text)'},'Add a field'),el('small',{},'Text, number, money, date, choice, rating, checkbox, link, attachments or a formula'))));
  g=group('Task statuses');{const SD=stDefs(),gs=g;SD.forEach((st,i)=>gs.append(grab(Row({style:'',onclick:()=>{if(!noDrag())statusSheet(st);}},el('span',{class:'cfic'},st.sym||'○'),el('span',{class:'grow'},el('b',{style:'font-weight:500'},st.name)),el('span',{class:'stchip','aria-hidden':'true'},`${st.sym||'○'} ${st.name}`),RowEnd('chevron')),i,st.name,gs,'statuses',SD)));}
  g.append(Row({style:'',onclick:()=>statusSheet(null)},el('span',{class:'pplus',html:ic('plus',IC.xs)}),el('span',{class:'grow',style:'text-align:left'},el('b',{style:'font-weight:500;color:var(--action-text)'},'Add a status'),el('small',{},stDefs().length?'Shown beside To do and Done':'In progress, Waiting, Blocked…'))));
  if(!stDefs().length)g.append(quickRow('Use In progress, Waiting and Blocked','Three common statuses in one tap',()=>setSettings({statuses:[{id:'s'+uid('').slice(1),name:'In progress',sym:'◐'},{id:'s'+uid('').slice(1),name:'Waiting',sym:'⏸'},{id:'s'+uid('').slice(1),name:'Blocked',sym:'⊘'}]})));
  g=group('Tags');tagGroups().forEach(tg=>g.append(Row({style:'',onclick:()=>tagGroupSheet(tg)},el('span',{class:'cfic',html:ic('bookmark',IC.sm)}),el('span',{class:'grow'},el('b',{style:'font-weight:500'},tg.name),el('small',{},(tg.tags||[]).join(', ')||'No tags yet')),RowEnd('chevron'))));
  g.append(Row({style:'',onclick:()=>tagGroupSheet(null)},el('span',{class:'pplus',html:ic('plus',IC.xs)}),el('span',{class:'grow',style:'text-align:left'},el('b',{style:'font-weight:500;color:var(--action-text)'},'Add a tag group'),el('small',{},'Context: @home, @office · Energy: low, high'))));
  {const loose=(s.tags||[]).filter(t=>!tagGroups().some(x=>(x.tags||[]).includes(t)));if(loose.length)g.append(Row({as:'div',style:''},el('span',{class:'grow'},el('b',{style:'font-weight:500'},'Other tags'),el('small',{},loose.join(', ')))));}
  /* v358 · one row here; the per-area list is its own page */{const n=(s.areas||AREAS).filter(a=>Object.values((s.areaDefaults||{})[a]||{}).some(v=>v&&(!Array.isArray(v)||v.length)&&v!=='normal')).length;g=group('New tasks');g.append(setRow('Starting values by area',n?`${n} area${n===1?'':'s'} set`:'Every area starts plain',null,()=>App.go('setpage',{id:'areastart'})));}}
function areaStartSettings(page,group){const s=get.settings();
  page.append(Caption('Length, priority, status or tags a new task gets when you give it this area.',{as:'p',style:'padding:0 var(--s1) var(--s2)'}));let g=group();(s.areas||AREAS).forEach(a=>{const d=(s.areaDefaults||{})[a]||{},bits=[d.dur?fmtDurS(d.dur):null,d.priority&&d.priority!=='normal'?(d.priority==='high'?'High':'Low'):null,d.status?(stDefs().find(x=>x.id===d.status)||{}).name:null,(d.tags||[]).join(' ')||null].filter(Boolean);g.append(setRow(a,bits.length?bits.join(' · '):'New tasks start plain',null,()=>areaDefaultsSheet(a)));});}
function fieldSheet(f){const isEdit=!!f,D=isEdit?clone(f):{name:'',type:'text',on:['task'],opts:[],row:false,expr:'',fmt:'num'};let render;
  const inst=formSheet({title:isEdit?'Edit field':'New field',addLabel:isEdit?'Save':'Add',D,word:'field',isEdit,canAdd:()=>!!String(D.name||'').trim()&&(!!D.on.length),commit:()=>{const s=get.settings(),out={id:isEdit?f.id:'f'+uid('').slice(1),name:D.name.trim().slice(0,40),type:D.type,on:D.on.slice(),row:!!D.row};if(D.type==='choice')out.opts=(typeof D.opts==='string'?D.opts.split(','):D.opts).map(x=>String(x).trim()).filter(Boolean);if(D.type==='formula'){out.expr=String(D.expr||'').trim();out.fmt=D.fmt||'num';}
      const L=(s.fields||[]).filter(x=>x.id!==out.id);L.push(out);if(isEdit){const i=(s.fields||[]).findIndex(x=>x.id===out.id);L.splice(L.length-1,1);L.splice(i,0,out);}setSettings({fields:L});App.refresh();},
    build:(body,update)=>{const T=fieldTitle('f-cf-name','Name','e.g. Cost',D.name,v=>{D.name=v;update();});const box=el('div',{});body.append(T.wrap,box);
      render=()=>{box.replaceChildren(SectionLabel('Type'),el('div',{class:'cftypes'},CF_TYPES.map(([id,n,sy])=>el('button',{type:'button',class:'chip'+(D.type===id?' on':''),'aria-pressed':String(D.type===id),onclick:()=>{D.type=id;render();update();}},`${sy} ${n}`))));
        if(D.type==='choice')box.append(SectionLabel('Choices'),fieldNotes('f-cf-opts','Choices, separated by commas','Not started, Draft, Final',Array.isArray(D.opts)?D.opts.join(', '):D.opts,v=>{D.opts=v;},{rows:1}));
        if(D.type==='formula'){box.append(SectionLabel('Formula'),fieldNotes('f-cf-expr','Formula','{Cost} / {Visits}',D.expr,v=>{D.expr=v;prev();},{rows:1}),el('p',{class:'small muted',style:'margin:var(--s2) var(--s1)'},`Use field names in braces, + − × ÷ and brackets. Also {Due date}, {Length}, {Time spent}, {Steps done %}, daysUntil({Due date}) and round(x).`));
          const pv=el('p',{class:'small',style:'margin:0 var(--s1) var(--s2)'});const prev=()=>{const sample=get.all('task').find(t=>t.cf)||{cf:{},kind:'task'};const v=cfFormula(sample,D.expr||'');pv.textContent=D.expr?(v==null?'Can’t work this out yet. Check the field names.':`With your first item: ${v}`):'';};prev();box.append(pv);
          const fl=el('div',{class:'group'});box.append(fl);setSeg(fl,'Show as',null,[['num','Number'],['money','Money'],['pct','Percent'],['days','Days']],D.fmt||'num',v=>{D.fmt=v;});}
        const gl=el('div',{class:'group'});box.append(SectionLabel('Use on'),gl);CF_KINDS.forEach(([k,n])=>gl.append(Switch({on:D.on.includes(k),label:n,onChange:v=>{D.on=v?[...new Set([...D.on,k])]:D.on.filter(x=>x!==k);update();}})));
        const gr=el('div',{class:'group'});box.append(gr);gr.append(Switch({on:!!D.row,label:'Show on rows',sub:'Under the title in lists, up to two fields',onChange:v=>{D.row=v;}}));
        if(isEdit)box.append(el('button',{class:'delete',onclick:()=>askConfirm({title:`Delete ${f.name}?`,body:'The field goes away from every item. Values already typed are kept in your backups but no longer shown.',yes:'Delete field',onYes:()=>{const s=get.settings(),before=clone(s.fields||[]);setSettings({fields:(s.fields||[]).filter(x=>x.id!==f.id)});inst.close();toast('Field deleted',()=>setSettings({fields:before}));}})},'Delete field'));};render();}});return inst;}
function statusSheet(st){const isEdit=!!st,D={name:st?st.name:'',sym:st?st.sym:'◐'};const SYM=['○','◐','◑','◕','⏸','⊘','!','?','→','★'];
  formSheet({title:isEdit?'Edit status':'New status',addLabel:isEdit?'Save':'Add',D,word:'status',isEdit,canAdd:()=>!!D.name.trim(),commit:()=>{const s=get.settings(),out={id:isEdit?st.id:'s'+uid('').slice(1),name:D.name.trim().slice(0,24),sym:D.sym};const L=(s.statuses||[]).map(x=>x.id===out.id?out:x);if(!isEdit)L.push(out);setSettings({statuses:L});},
    build:(body,update)=>{const T=fieldTitle('f-st-name','Name','e.g. Waiting',D.name,v=>{D.name=v;update();});const sy=el('div',{class:'cfchips'});const draw=()=>sy.replaceChildren(...SYM.map(x=>el('button',{type:'button',class:'chip'+(D.sym===x?' on':''),onclick:()=>{D.sym=x;draw();}},x)));draw();body.append(T.wrap,SectionLabel('Symbol'),sy);
      if(isEdit)body.append(el('button',{class:'delete',onclick:()=>{const s=get.settings(),before=clone(s.statuses||[]);setSettings({statuses:(s.statuses||[]).filter(x=>x.id!==st.id)});get.all('task').filter(t=>t.status===st.id).forEach(t=>{delete t.status;put(t,{silent:true});});App.refresh();toast('Status deleted',()=>setSettings({statuses:before}));}},'Delete status'));}});}
function tagGroupSheet(tg){const isEdit=!!tg,D={name:tg?tg.name:'',tags:tg?(tg.tags||[]).join(', '):''};
  formSheet({title:isEdit?'Edit tag group':'New tag group',addLabel:isEdit?'Save':'Add',D,word:'tag group',isEdit,canAdd:()=>!!D.name.trim(),commit:()=>{const s=get.settings(),out={id:isEdit?tg.id:'g'+uid('').slice(1),name:D.name.trim().slice(0,30),tags:[...new Set(String(D.tags||'').split(',').map(x=>x.trim()).filter(Boolean))]};const L=(s.tagGroups||[]).map(x=>x.id===out.id?out:x);if(!isEdit)L.push(out);setSettings({tagGroups:L});},
    build:(body,update)=>{const T=fieldTitle('f-tg-name','Group name','e.g. Context',D.name,v=>{D.name=v;update();});body.append(T.wrap,fieldNotes('f-tg-tags','Tags, separated by commas','@home, @office, @errands',D.tags,v=>{D.tags=v;},{rows:2}));
      if(isEdit)body.append(el('button',{class:'delete',onclick:()=>{const s=get.settings();setSettings({tagGroups:(s.tagGroups||[]).filter(x=>x.id!==tg.id),tags:[...new Set([...(s.tags||[]),...(tg.tags||[])])]});App.refresh();toast('Tag group removed. Its tags stay.');}},'Delete group'));}});}
function areaDefaultsSheet(a){const s=get.settings(),cur=(s.areaDefaults||{})[a]||{},D={dur:cur.dur||0,priority:cur.priority||'normal',status:cur.status||null,tags:(cur.tags||[]).join(', ')};
  formSheet({title:`New ${a} tasks`,addLabel:'Save',D,word:'defaults',isEdit:true,canAdd:()=>true,commit:()=>{const out={dur:+D.dur||null,priority:D.priority!=='normal'?D.priority:null,status:D.status||null,tags:String(D.tags||'').split(',').map(x=>x.trim()).filter(Boolean)};const all=Object.assign({},get.settings().areaDefaults||{});if(!out.dur&&!out.priority&&!out.status&&!out.tags.length)delete all[a];else all[a]=out;setSettings({areaDefaults:all});},
    build:body=>{const g=el('div',{class:'group'});body.append(g);setSeg(g,'Length',null,[[0,'None'],[15,'15m'],[30,'30m'],[60,'1h']],D.dur||0,v=>{D.dur=+v;});setSeg(g,'Priority',null,[['low','Low'],['normal','Normal'],['high','High']],D.priority,v=>{D.priority=v;});
      if(stDefs().length)setSeg(g,'Status',null,[[null,'None'],...stDefs().slice(0,3).map(x=>[x.id,x.name])],D.status,v=>{D.status=v;});
      body.append(fieldNotes('f-ad-tags','Tags, separated by commas','@office',D.tags,v=>{D.tags=v;},{rows:1}),el('p',{class:'small muted',style:'margin:var(--s2) var(--s1)'},`New tasks in ${a} start with these. You can still change each one.`));}});}

/* v344 · item types: a custom module can carry your fields (they become its form fields) */
function cfToFields(ids){return(ids||[]).map(id=>cfById(id)).filter(f=>f&&f.type!=='file'&&f.type!=='formula').map(f=>f.type==='number'||f.type==='money'?F(f.id,f.type==='money'?`${f.name} (${get.settings().currency||'$'})`:f.name,'number',{blank:true}):f.type==='date'?F(f.id,f.name,'date',{blank:true}):f.type==='choice'?F(f.id,f.name,'select',{opts:['',...(f.opts||[])]}):f.type==='rating'?F(f.id,f.name,'select',{opts:['','★','★★','★★★','★★★★','★★★★★']}):f.type==='check'?F(f.id,f.name,'select',{opts:['','Yes','No']}):F(f.id,f.name,'text'));}

/* ---------- v344 · link anything: r.links = [id, …] on either side; backlinks found by search ---------- */
const LINK_KINDS={task:'Task',habit:'Habit',goal:'Goal',project:'Project',list:'List',routine:'Routine',entry:'Item',idea:'Idea',block:'Event',allday:'All-day item'};
const linksOf=r=>{if(!r)return[];const out=new Set((r.links||[]).filter(id=>get.id(id)));recs.forEach(x=>{if(x&&x!==r&&!x.deleted&&(x.links||[]).includes(r.id))out.add(x.id);});return[...out].map(id=>get.id(id)).filter(Boolean);};
const linkTitle=x=>x.title||(x.f&&(x.f.what||x.f.name))||x.text||'Untitled';
function linkOpen(x){if(x.kind==='entry'){App.go('tool',{hub:x.hub,tool:x.tool});return;}openRec(x);}
function linkPicker(r,onDone){const pool=[...recs.values()].filter(x=>x&&x.id!==r.id&&!x.deleted&&!x.example&&LINK_KINDS[x.kind]&&linkTitle(x)).sort((a,b)=>(b.updatedAt||0)-(a.updatedAt||0)).slice(0,400);let q='',inst;const cur=new Set(r.links||[]);
  const list=el('div',{class:'list'});const draw=()=>{const ql=q.trim().toLowerCase();list.replaceChildren(...pool.filter(x=>!ql||linkTitle(x).toLowerCase().includes(ql)).slice(0,40).map(x=>Row({style:'',onclick:()=>{cur.has(x.id)?cur.delete(x.id):cur.add(x.id);draw();}},el('span',{class:'ckb round'+(cur.has(x.id)?' on':''),html:cur.has(x.id)?ic('check',IC.xs):''}),el('span',{class:'grow'},el('b',{style:'font-weight:500'},linkTitle(x)),el('small',{},LINK_KINDS[x.kind]+(x.kind==='entry'&&x.tool?` · ${x.tool}`:''))))));};
  inst=openSheet({title:'Link to…',left:{label:'Cancel'},right:{label:'Done',onclick:()=>{inst.close();r.links=[...cur];put(r);onDone&&onDone();}},build:b=>{const sf=SearchField({id:'linkq',placeholder:'Find anything',label:'Find anything',value:'',onInput:v=>{q=v;draw();}});b.append(sf,list);draw();}});}
function linksBlock(r,{onChange=null}={}){if(!r||!r.id)return null;const L=linksOf(r);const box=el('div',{class:'linksb'});
  box.append(SectionLabel('Linked',{count:L.length||null,action:Button('Link',{variant:'link',size:'sm',onclick:()=>linkPicker(r,()=>{onChange?onChange():App.refresh();})})}));
  if(L.length)box.append(el('div',{class:'list'},L.map(x=>Row({style:'',onclick:()=>linkOpen(x)},el('span',{class:'grow'},el('b',{style:'font-weight:500'},linkTitle(x)),el('small',{},LINK_KINDS[x.kind]||x.kind)),IconButton(`Unlink ${linkTitle(x)}`,{size:'sm',html:ic('x',IC.xs),onclick:e=>{e.stopPropagation();r.links=(r.links||[]).filter(id=>id!==x.id);x.links=(x.links||[]).filter(id=>id!==r.id);put(r);put(x);toast('Unlinked',()=>{r.links=[...(r.links||[]),x.id];put(r);});onChange?onChange():App.refresh();}})))));
  return box;}

/* ---------- v344 · change history: what changed lately, each one undoable ---------- */
const HIST_KINDS=new Set(['task','habit','goal','project','block','allday','list','routine','idea','entry','wait','resource','plan']);
const histShadow=new Map();let histLog=[];let histReady=false;
function histInit(){if(histReady)return;histReady=true;recs.forEach((r,id)=>{if(r&&HIST_KINDS.has(r.kind))histShadow.set(id,JSON.stringify(r));});try{histLog=JSON.parse(localStorage.getItem('lifeos-hist')||'[]');}catch(e){histLog=[];}}
function histNote(r,gone=false){if(!histReady||!r||!HIST_KINDS.has(r.kind)||histNote.off)return;const prev=histShadow.get(r.id)||null,now=gone?null:JSON.stringify(r);if(prev===now)return;
  const last=histLog[0],t=Date.now();if(last&&last.id===r.id&&t-last.at<4000&&!gone){last.at=t;last.title=linkTitle(r);}else histLog.unshift({id:r.id,kind:r.kind,title:linkTitle(r),prev,what:gone?'deleted':prev?'edited':'added',at:t});
  if(gone)histShadow.delete(r.id);else histShadow.set(r.id,now);histLog=histLog.slice(0,60);clearTimeout(histNote._t);histNote._t=setTimeout(()=>{try{localStorage.setItem('lifeos-hist',JSON.stringify(histLog));}catch(e){histLog=histLog.slice(0,20);}},800);}
function histUndo(h){histNote.off=true;try{if(h.what==='added'){remove(h.id,{silent:true});}else if(h.prev){const r=JSON.parse(h.prev);put(r);}}finally{histNote.off=false;}histShadow.set(h.id,h.prev||'');histLog=histLog.filter(x=>x!==h);try{localStorage.setItem('lifeos-hist',JSON.stringify(histLog));}catch(e){}App.refresh();toast(`Undone · ${h.title}`);}
function viewHistory(root){histInit();const page=el('div',{class:'page'});page.append(pageHead('Change history',null,{back:'Data',to:'setpage'}));
  if(!histLog.length){page.append(Empty({title:'No changes yet',body:'Your last 60 edits, additions and deletions show up here, each one undoable.'}));root.append(page);return;}
  const byDay={};histLog.forEach(h=>{const d=k(new Date(h.at));(byDay[d]=byDay[d]||[]).push(h);});
  Object.keys(byDay).forEach(d=>{page.append(SectionLabel(d===todayK()?'Today':relDay(d)),el('div',{class:'list'},byDay[d].map(h=>Row({as:'div',style:''},el('span',{class:'grow'},el('b',{style:'font-weight:500'},h.title),el('small',{},`${h.what[0].toUpperCase()+h.what.slice(1)} · ${new Date(h.at).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}`)),Button('Undo',{variant:'secondary',size:'sm',onclick:()=>histUndo(h)})))));});
  root.append(page);}

/* ---------- v344 · layout history: Today, the bottom bar, More and pins, saved before each change ---------- */
const LAYOUT_KEYS=['todayLayout','nav','pinned','moreSecs','plusMenu','hdIcons','todayFold','navFour','tabLabels'];
function layoutNote(before,patch){if(!patch||!LAYOUT_KEYS.some(k=>k in patch))return;const snap={};LAYOUT_KEYS.forEach(k=>{if(before[k]!==undefined)snap[k]=before[k];});const what=LAYOUT_KEYS.filter(k=>k in patch&&JSON.stringify(before[k])!==JSON.stringify(patch[k]));if(!what.length)return;
  let L=[];try{L=JSON.parse(localStorage.getItem('lifeos-layouts')||'[]');}catch(e){}const last=L[0];if(last&&Date.now()-last.at<5000&&last.what.join()===what.join())return;L.unshift({at:Date.now(),what,snap:JSON.parse(JSON.stringify(snap))});try{localStorage.setItem('lifeos-layouts',JSON.stringify(L.slice(0,20)));}catch(e){}}
const LAYOUT_NAMES={todayLayout:'Today cards',nav:'Bottom bar',pinned:'Pinned',moreSecs:'More page',plusMenu:'+ menu',hdIcons:'Today header',todayFold:'Folded cards',navFour:'Four tabs',tabLabels:'Tab labels'};
function layoutHistorySheet(){let L=[];try{L=JSON.parse(localStorage.getItem('lifeos-layouts')||'[]');}catch(e){}const inst=openSheet({title:'Layout history',left:{label:'Close'},build:b=>{if(!L.length){b.append(Caption('Each time you change Today, the bottom bar, More or pins, the layout before it is kept here.',{as:'p',style:'padding:var(--s2) var(--s1)'}));return;}
  b.append(el('div',{class:'list'},L.map(x=>Row({as:'div',style:''},el('span',{class:'grow'},el('b',{style:'font-weight:500'},x.what.map(w=>LAYOUT_NAMES[w]||w).join(', ')),el('small',{},`Before ${timeAgo(x.at)==='Today'?new Date(x.at).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}):timeAgo(x.at)}`)),Button('Restore',{variant:'secondary',size:'sm',onclick:()=>{const cur={};LAYOUT_KEYS.forEach(k=>cur[k]=get.settings()[k]);const patch={};x.what.forEach(k=>patch[k]=x.snap[k]);setSettings(patch);inst.close();App.refresh();toast('Layout restored',()=>{const u={};x.what.forEach(k=>u[k]=cur[k]);setSettings(u);App.refresh();});}})))));}});}
