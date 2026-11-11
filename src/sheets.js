/* ---------- form pieces shared by every create sheet, so they can't drift apart ---------- */
function formCtx(rerender){
  const ctx={open:null,rerender};
  ctx.row=(id,icon,label,val,{tap=null,trailing=null,valOn=false,dim=false,expand=true}={})=>{
    const isOpen=ctx.open===id;if(ctx.open==null)ctx._shown=null;
    const v=val==null?null:val.nodeType?val:el('span',{class:valOn?'on':''},val);
    const r=el('div',{class:'row'+(expand||tap?' tap':'')+(dim?' dim':''),role:expand?'button':null,tabindex:expand?0:null,'aria-expanded':expand?String(isOpen):null},
      el('span',{class:'ic',html:ic(icon)}),el('span',{class:'lab'},label),
      el('span',{class:'val'},v,trailing,expand?el('span',{class:'chev'+(isOpen?' open':''),html:ic('chevr',16,2.2)}):null));
    const go=tap||(expand?()=>{ctx.open=isOpen?null:id;rerender();}:null);
    if(go){r.addEventListener('click',e=>{if(e.target.closest('.sw,.seg'))return;go();});r.addEventListener('keydown',e=>{if(e.target!==r)return;if(e.key==='Enter'||e.key===' '){e.preventDefault();go();}});}
    return r;
  };
  ctx.panel=(id,cls,...kids)=>{if(ctx.open!==id)return null;const fresh=ctx._shown!==id;ctx._shown=id;return el('div',{class:'panel '+cls+(fresh?'':' still')},kids);};
  ctx.sw=(on,label,fn)=>{const b=el('button',{class:'sw'+(on?' on':''),role:'switch','aria-checked':String(on),'aria-label':label,onclick:e=>{e.stopPropagation();fn(!on);}});return b;};
  ctx.stepper=(v,min,max,fn)=>el('span',{class:'stepper'},el('button',{'aria-label':'Less',disabled:v<=min,onclick:e=>{e.stopPropagation();fn(v-1);}},'−'),el('b',{},String(v)),el('button',{'aria-label':'More',disabled:v>=max,onclick:e=>{e.stopPropagation();fn(v+1);}},'+'));
  ctx.calendar=(val,fn,{noDate=false,minK=null,range=null}={})=>{
    const base=val?fromK(val):today();let vy=base.getFullYear(),vm=base.getMonth();const wrap=el('div',{class:'cal',onclick:e=>e.stopPropagation()});
    const draw=()=>{wrap.innerHTML='';const first=new Date(vy,vm,1),ws=get.settings().weekStart??1,lead=(first.getDay()-ws+7)%7,start=addD(first,-lead),tk=todayK();
      const labels=[];for(let i=0;i<7;i++)labels.push(DOW[(ws+i)%7][0]);
      const g=el('div',{class:'cg'},labels.map(l=>el('span',{},l)));
      for(let i=0;i<42;i++){const d=addD(start,i),dk=k(d);if(i>=35&&d.getMonth()!==vm)break;g.append(el('button',{class:(d.getMonth()!==vm?'out ':'')+(dk===tk?'td ':'')+(dk===val?'on ':'')+(range&&dk>=range[0]&&dk<=range[1]?'inrange':''),disabled:!!(minK&&dk<minK),'aria-label':shortDay(dk),onclick:e=>{e.stopPropagation();fn(dk);}},String(d.getDate())));}
      wrap.append(el('div',{class:'ch'},el('button',{'aria-label':'Previous month',html:ic('chevl',20,2),onclick:e=>{e.stopPropagation();vm--;if(vm<0){vm=11;vy--;}draw();}}),el('span',{},`${MONL[vm]} ${vy}`),el('button',{'aria-label':'Next month',html:ic('chevr',20,2),onclick:e=>{e.stopPropagation();vm++;if(vm>11){vm=0;vy++;}draw();}})),g,
        noDate?el('button',{class:'linkbtn',style:'margin-top:6px',onclick:e=>{e.stopPropagation();fn(null);}},'No date'):null);};
    draw();return wrap;
  };
  ctx.wheel=(get_,set)=>{
    const wrap=el('div',{class:'wheel',onclick:e=>e.stopPropagation()});
    const make=(vals,idx0,on)=>{let idx=idx0;const c=el('div',{class:'wcol',tabindex:0},el('div',{class:'sp'}),vals.map((v,i)=>el('div',{'data-i':i,onclick:()=>c.scrollTo({top:i*40,behavior:'smooth'})},v)),el('div',{class:'sp'}));
      requestAnimationFrame(()=>{c.scrollTop=idx*40;c._ready=true;});let t;c.addEventListener('scroll',()=>{if(!c._ready)return;clearTimeout(t);t=setTimeout(()=>{const i=Math.max(0,Math.min(vals.length-1,Math.round(c.scrollTop/40)));if(i===idx)return;idx=i;on(i);},90);},{passive:true});return c;};
    const m=get_(),h=Math.floor(m/60),mi=m%60,step=5;
    let hh=h%12,mm=Math.round(mi/step)%12,ap=h>=12?1:0;
    const push=()=>set((hh%12+(ap?12:0))*60+mm*step);
    if(get.settings().clock===24){let h24=h;const p24=()=>set(h24*60+mm*step);wrap.append(make(Array.from({length:24},(_,i)=>pad2(i)),h24,i=>{h24=i;p24();}),make(Array.from({length:12},(_,i)=>pad2(i*step)),mm,i=>{mm=i;p24();}));return wrap;}
    wrap.append(make(['12','1','2','3','4','5','6','7','8','9','10','11'],hh,i=>{hh=i;push();}),make(Array.from({length:12},(_,i)=>pad2(i*step)),mm,i=>{mm=i;push();}),make(['AM','PM'],ap,i=>{ap=i;push();}));
    return wrap;
  };
  ctx.customRepeat=(D,dateK)=>{const r=D.repeat,u=r.unit||'week',n=r.n||1;
    return el('div',{class:'sub'},
      el('div',{class:'lbl3'},'Frequency'),seg([['day','Daily'],['week','Weekly'],['month','Monthly'],['year','Yearly']],u,v=>{r.unit=v;if(v==='week'&&!(r.days||[]).length)r.days=[monIdx(fromK(dateK))];rerender();}),
      el('div',{class:'subrow'},el('span',{},'Every'),ctx.stepper(n,1,30,v=>{r.n=v;rerender();}),el('span',{},({day:'day',week:'week',month:'month',year:'year'})[u]+(n===1?'':'s'))),
      u==='day'||u==='week'?el('div',{class:'chips',style:'margin-top:8px'},el('button',{class:'chip'+(u==='week'&&n===1&&(r.days||[]).length===5&&[0,1,2,3,4].every(i=>r.days.includes(i))?' on':''),onclick:e=>{e.stopPropagation();r.unit='week';r.n=1;r.days=[0,1,2,3,4];rerender();}},'Every weekday'),el('button',{class:'chip'+(u==='week'&&n===1&&(r.days||[]).length===2&&r.days.includes(5)&&r.days.includes(6)?' on':''),onclick:e=>{e.stopPropagation();r.unit='week';r.n=1;r.days=[5,6];rerender();}},'Weekends')):null,
      u==='month'?(()=>{const sd=fromK(dateK),nth=Math.ceil(sd.getDate()/7),ord=['','first','second','third','fourth','fifth'],isLastWk=sd.getDate()+7>new Date(sd.getFullYear(),sd.getMonth()+1,0).getDate(),wdN=WDN[monIdx(sd)];const by=r.by||'date';
        const opts=[['date',`On the ${sd.getDate()}${['th','st','nd','rd'][(sd.getDate()%10>3||[11,12,13].includes(sd.getDate()))?0:sd.getDate()%10]}`],['nth',`On the ${nth<=4?ord[nth]:'last'} ${wdN}`],['last','On the last day']];if(isLastWk&&nth<=4)opts.splice(2,0,['nthlast',`On the last ${wdN}`]);
        return el('div',{class:'chips',style:'margin-top:8px'},opts.map(([v,l])=>el('button',{class:'chip'+((v==='nthlast'?by==='nth'&&r.nth===-1:v==='nth'?by==='nth'&&r.nth!==-1:by===v)?' on':''),onclick:e=>{e.stopPropagation();if(v==='date'){delete r.by;delete r.nth;delete r.wd;}else if(v==='last'){r.by='last';delete r.nth;delete r.wd;}else{r.by='nth';r.wd=monIdx(sd);r.nth=v==='nthlast'||nth>4?-1:nth;}rerender();}},l)));})():null,
      u==='week'?el('div',{class:'lbl3'},'On'):null,
      u==='week'?el('div',{class:'wdays',role:'group'},WD.map((d,i)=>{const on=(r.days||[]).includes(i);return el('button',{class:on?'on':'','aria-label':WDN[i],'aria-pressed':String(on),onclick:e=>{e.stopPropagation();r.days=r.days||[];const j=r.days.indexOf(i);if(j>=0){if(r.days.length>1)r.days.splice(j,1);else{toast('Pick at least one day');return;}}else r.days.push(i);rerender();}},d);})):null);};
  ctx.repeatRows=(w,D,dateK,{unit='week'}={})=>{const hasRep=D.repeat&&D.repeat.type!=='never';
    w.append(ctx.row('repeat','rep','Repeat',null,{expand:false,tap:hasRep?()=>{ctx.open=ctx.open==='repeat'?null:'repeat';rerender();}:null,trailing:[hasRep?el('span',{class:'on clip',style:'max-width:150px'},repeatLabel(D.repeat)):null,ctx.sw(hasRep,'Repeat',on=>{if(on){if('date' in D&&!D.date)D.date=dateK();D.repeat={type:'custom',unit,n:1,days:[monIdx(fromK(dateK()))],end:null};ctx.open='repeat';}else{D.repeat={type:'never',end:null};if(['repeat','rend'].includes(ctx.open))ctx.open=null;}rerender();})]}));
    if(hasRep){const p=ctx.panel('repeat','',ctx.customRepeat(D,dateK()));p&&w.append(p);
      w.append(ctx.row('rend','endrep','End repeat',D.repeat.end?relDay(D.repeat.end):'Never',{valOn:!!D.repeat.end}));
      const pe=ctx.panel('rend','',el('div',{class:'chips'},el('button',{class:'chip'+(!D.repeat.end?' on':''),onclick:e=>{e.stopPropagation();D.repeat.end=null;ctx.open=null;rerender();}},'Never'),el('button',{class:'chip'+(D.repeat.end?' on':''),onclick:e=>{e.stopPropagation();if(!D.repeat.end)D.repeat.end=k(addD(fromK(dateK()),D.repeat.unit==='year'?365:30));rerender();}},'On a date')),D.repeat.end?el('div',{style:'margin-top:12px'},ctx.calendar(D.repeat.end,dk=>{D.repeat.end=dk;ctx.open=null;rerender();},{minK:dateK()})):null);pe&&w.append(pe);}
  };
  ctx.followDate=(D,dk)=>{const r=D.repeat;if(!r||r.type==='never'||!dk)return;if(r.unit==='week'&&(r.days||[]).length===1)r.days=[monIdx(fromK(dk))];if(r.end&&r.end<dk)r.end=null;};
  ctx.reminderRow=(w,D,{noTime=false,onNeedTime=null,word='the time'}={})=>{const hasRem=!noTime&&D.reminder!=null;
    w.append(ctx.row('rem','bell','Reminder',noTime?'Set a time first':null,{dim:noTime,expand:false,tap:noTime?onNeedTime:hasRem?()=>{ctx.open=ctx.open==='rem'?null:'rem';rerender();}:null,trailing:noTime?null:[hasRem?el('span',{class:'on'},remLabel(D.reminder)):null,ctx.sw(hasRem,'Remind me',on=>{if(on){D.reminder=0;D.remUnit='minute';ctx.open='rem';}else{D.reminder=null;if(ctx.open==='rem')ctx.open=null;}rerender();})]}));
    if(hasRem&&ctx.open==='rem'){const unit=D.remUnit||'minute',per={minute:1,hour:60,day:1440}[unit],amt=Math.round(D.reminder/per),max={minute:59,hour:23,day:14}[unit];
      w.append(ctx.panel('rem','',el('div',{class:'sub'},el('div',{class:'lbl3'},'Remind me'),el('div',{class:'subrow'},ctx.stepper(amt,0,max,n=>{D.reminder=n*per;rerender();}),el('span',{},amt===0?`at ${word}`:`${unit}${amt===1?'':'s'} before`)),seg([['minute','Minutes'],['hour','Hours'],['day','Days']],unit,u=>{const p={minute:1,hour:60,day:1440}[u];D.remUnit=u;D.reminder=Math.min(amt,{minute:59,hour:23,day:14}[u])*p;rerender();}))));}
  };
  ctx.partRow=(g,D,{types=['goal','project','habit'],onPick=null}={})=>{const p=D.part?get.id(D.part):null;
    g.append(ctx.row('part','layers','Part of',p?el('span',{class:'on clip',style:'max-width:170px;display:flex;gap:8px;align-items:center'},p.title):'None'));
    if(ctx.open==='part'){const pick=o=>e=>{e.stopPropagation();const prev=D.part?get.id(D.part):null;D.part=o&&D.part!==o.id?o.id:null;if(!D.area&&o&&o.area&&D.part)D.area=o.area;ctx.open=null;onPick&&onPick(D.part?o:null,prev);rerender();};const any=types.some(t=>get.all(t).length);const name={goal:'Goals',project:'Projects',habit:'Habits'};
      const pp=ctx.panel('part','',any?types.filter(t=>get.all(t).length).map(t=>el('div',{style:'margin-bottom:10px'},el('div',{class:'lbl3'},name[t]),el('div',{class:'chips'},get.all(t).map(o=>el('button',{class:'chip'+(D.part===o.id?' on':''),'aria-pressed':String(D.part===o.id),onclick:pick(o)},t==='habit'?`${o.title} · ${habitWeek(o,todayK())} of ${o.target}`:o.title))))):el('p',{class:'muted small',style:'margin-bottom:8px'},`No ${types.map(t=>name[t].toLowerCase()).join(' or ')} yet`),
        el('div',{style:'display:flex;flex-wrap:wrap;gap:4px 18px;margin-top:8px'},D.part?el('button',{class:'linkbtn',onclick:pick(null)},'None'):null,types.includes('goal')?el('button',{class:'linkbtn',onclick:e=>{e.stopPropagation();goalSheet(null,{after:r=>{D.part=r.id;rerender();}});}},'+ New goal'):null,types.includes('project')?el('button',{class:'linkbtn',onclick:e=>{e.stopPropagation();projectSheet(null,{after:r=>{D.part=r.id;rerender();}});}},'+ New project'):null));g.append(pp);}
  };
  ctx.areaRow=(g,D)=>{g.append(ctx.row('area','leaf','Life area',D.area||'None',{valOn:!!D.area}));
    if(ctx.open==='area')g.append(ctx.panel('area','',el('div',{class:'chips'},(get.settings().areas||AREAS).map(a=>el('button',{class:'chip'+(D.area===a?' on':''),'aria-pressed':String(D.area===a),onclick:e=>{e.stopPropagation();D.area=D.area===a?null:a;ctx.open=null;rerender();}},a)))));};
  /* one Appearance row: a live preview in the row, color and icon in its panel */
  ctx.appearanceRow=(g,D,chip)=>{const cur=D.color||'sage';
    const live=el('span',{class:'lookchip'},chip());ctx.refreshLook=()=>{live.innerHTML='';live.append(chip());};liveLook=ctx.refreshLook;
    g.append(ctx.row('look','palette','Appearance',live));
    if(ctx.open==='look'){const hx=el('input',{type:'text',id:'hex-input','aria-label':'Hex color',value:colorHex(cur).toUpperCase(),maxlength:7,autocomplete:'off',spellcheck:'false',oninput:e=>{let v=e.target.value.trim();if(v&&v[0]!=='#')v='#'+v;if(/^#[0-9a-f]{6}$/i.test(v)){D.color=v;D.lookTouched=true;$$('.swatch').forEach(x=>{x.classList.remove('on');x.innerHTML='';});ctx.refreshLook();}},onclick:e=>e.stopPropagation()});
      g.append(ctx.panel('look','wide',el('div',{class:'lbl3'},'Color'),el('div',{class:'swatches'},COLORS.map(([id,n,h])=>el('button',{class:'swatch'+(cur===id?' on':''),style:`--c:${h}`,'aria-label':n,'aria-pressed':String(cur===id),html:cur===id?ic('check',16,3):'',onclick:e=>{e.stopPropagation();D.color=id;D.lookTouched=true;rerender();}}))),
        el('div',{class:'hexrow',onclick:e=>e.stopPropagation()},el('input',{type:'color','aria-label':'Color wheel',value:colorHex(cur),oninput:e=>{D.color=e.target.value;D.lookTouched=true;hx.value=e.target.value.toUpperCase();$$('.swatch').forEach(x=>{x.classList.remove('on');x.innerHTML='';});ctx.refreshLook();}}),hx,el('span',{class:'small muted'},'Any color')),
        el('div',{class:'lbl3',style:'margin-top:12px'},'Icon'),el('div',{class:'icongrid'},el('button',{class:!D.icon?'on':'','aria-label':'No icon','aria-pressed':String(!D.icon),html:sv('<circle cx="12" cy="12" r="8"/><path d="m6.5 6.5 11 11"/>',20),onclick:e=>{e.stopPropagation();D.icon=null;D.lookTouched=true;rerender();}}),GLYPHS.map(([id,n])=>el('button',{class:D.icon===id?'on':'','aria-label':n,title:n,'aria-pressed':String(D.icon===id),html:glyph(id,20),onclick:e=>{e.stopPropagation();D.icon=id;D.lookTouched=true;rerender();}})))));}
  };
  ctx.lookRows=(g,D)=>ctx.appearanceRow(g,D,()=>el('span',{class:'pvchip',style:`--c:${colorHex(D.color||'sage')}`,html:(D.icon?glyph(D.icon,14):'')+`<span>${esc((D.title||'').trim()||'Preview')}</span>`}));
  return ctx;
}
function fieldTitle(id,label,ph,val,onIn,onEnter){const inp=el('textarea',{id,class:'big',rows:1,placeholder:ph,autocomplete:'off',enterkeyhint:'done',autocapitalize:'sentences',oninput:e=>{const v=e.target.value.replace(/\s*\n\s*/g,' ');if(v!==e.target.value)e.target.value=v;size();onIn(v);liveLook&&liveLook();},onkeydown:e=>{if(e.key==='Enter'){e.preventDefault();onEnter&&onEnter();}}});inp.value=val||'';const size=()=>{inp.style.height='auto';inp.style.height=Math.max(26,inp.scrollHeight)+'px';};inp._size=size;requestAnimationFrame(size);return{wrap:el('label',{class:'field'},el('span',{class:'eyebrow'},label),inp),input:inp};}
let liveLook=null;
function fieldNotes(id,label,ph,val,onIn,{rows=1,min=26}={}){const links=el('span',{class:'nlinks'});const drawLinks=v=>{links.innerHTML='';const found=String(v||'').match(new RegExp(URL_RE.source,'gi'))||[];[...new Set(found)].slice(0,4).forEach(u=>{const clean=u.replace(/[).,;:!?]+$/,'');links.append(el('a',{class:'nlink',href:/^www\./i.test(clean)?'https://'+clean:clean,target:'_blank',rel:'noopener'},el('span',{style:'display:grid',html:ic('arrow',14,2)}),clean.replace(/^https?:\/\//i,'').replace(/^www\./i,'').slice(0,44)));});};drawLinks(val);const t=el('textarea',{id,rows,style:`min-height:${min}px`,placeholder:ph,oninput:e=>{onIn(e.target.value);size();drawLinks(e.target.value);}});t.value=val||'';const size=()=>{t.style.height='auto';t.style.height=Math.max(min,t.scrollHeight)+'px';};requestAnimationFrame(size);return el('label',{class:'field'},el('span',{class:'eyebrow'},label),t,links);}
/* press a handle and drag: the row follows the finger, the others slide out of the way, and the sheet scrolls at its edges */
/* a finger lifted after a drag can land on a delete button; ignore taps for a moment */
function dragQuiet(){const stop=ev=>{ev.stopPropagation();ev.preventDefault();};window.addEventListener('click',stop,true);setTimeout(()=>window.removeEventListener('click',stop,true),350);}
function reorderable(h,row,box,commit){
  const isItem=n=>n&&n.hasAttribute('data-i');
  const slide=n=>{const a=n.getBoundingClientRect().top;return()=>{const b=n.getBoundingClientRect().top;if(a===b)return;n.style.transition='none';n.style.transform=`translateY(${a-b}px)`;requestAnimationFrame(()=>{n.style.transition='transform .16s ease';n.style.transform='';});};};
  h.addEventListener('pointerdown',e=>{if(e.button)return;e.preventDefault();e.stopPropagation();const a=document.activeElement;if(a&&a.matches('input,textarea'))a.blur();
    try{h.setPointerCapture(e.pointerId);}catch(err){}row.classList.add('drag');box.classList.add('dragging');buzz(8);let y=e.clientY,moved=false,live=true;const y0=y;const sc=row.closest('.sbody');
    const place=()=>{row.style.transform='';const r=row.getBoundingClientRect(),mid=r.top+r.height/2,prev=row.previousElementSibling,next=row.nextElementSibling;
      if(isItem(prev)&&y<prev.getBoundingClientRect().top+prev.offsetHeight/2){const f=slide(prev);box.insertBefore(row,prev);f();moved=true;buzz(4);}
      else if(isItem(next)&&y>next.getBoundingClientRect().top+next.offsetHeight/2){const f=slide(next);box.insertBefore(next,row);f();moved=true;buzz(4);}
      const r2=row.getBoundingClientRect();row.style.transform=`translateY(${y-(r2.top+r2.height/2)}px)`;};
    const loop=()=>{if(!live)return;if(!row.isConnected){up();return;}if(sc){const b=sc.getBoundingClientRect(),edge=64;if(y<b.top+edge&&y<y0-8)sc.scrollTop-=7;else if(y>b.bottom-edge&&y>y0+8)sc.scrollTop+=7;}place();requestAnimationFrame(loop);};
    const mv=ev=>{if(ev.pointerId===e.pointerId)y=ev.clientY;};
    const ends=['pointerup','pointercancel','touchend','touchcancel'];
    /* Moving a row up the page takes it out of the document for a moment, and the phone then stops telling the handle about the finger. So listen on the window, where the finger always reports */
    const lost=ev=>{if(ev.target===window)up();};
    const up=()=>{if(!live)return;live=false;window.removeEventListener('pointermove',mv,true);window.removeEventListener('blur',lost);ends.forEach(n=>window.removeEventListener(n,up,true));row.classList.remove('drag');box.classList.remove('dragging');row.style.transform='';const shh=row.closest('.sheet');if(shh)shh.classList.remove('typing');if(moved){dragQuiet();commit();}};
    window.addEventListener('pointermove',mv,true);window.addEventListener('blur',lost);ends.forEach(n=>window.addEventListener(n,up,true));loop();});
}
function stepsEditor(D,{tick=true,word='step'}={}){const Word=word[0].toUpperCase()+word.slice(1);
  const wrap=el('div',{style:'display:grid;gap:8px'}),box=el('div',{class:'steps'});
  const newStep=()=>({id:uid('s'),t:'',d:false});
  const count=el('div',{class:'eyebrow',style:'font-size:11px;padding:0 4px',hidden:true});
  const recount=()=>{const t=D.steps.filter(x=>x.t.trim()),show=tick&&!(D.repeat&&D.repeat.type!=='never')&&t.length;count.hidden=!show;if(show)count.textContent=`${Word}s · ${t.filter(x=>x.d).length} of ${t.length} done`;};
  const draw=focus=>{box.innerHTML='';recount();const showTick=tick&&!(D.repeat&&D.repeat.type!=='never');D.steps.forEach((s,i)=>{
    const inp=el('input',{value:s.t,placeholder:Word,'aria-label':`${Word} ${i+1}`,enterkeyhint:'next',autocapitalize:'sentences'});
    inp.addEventListener('input',()=>{s.t=inp.value;recount();});
    inp.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();if(!inp.value.trim()){D.steps.splice(i,1);draw();return;}D.steps.splice(i+1,0,newStep());draw(i+1);}else if(e.key==='Backspace'&&!inp.value){e.preventDefault();D.steps.splice(i,1);draw(i>0?i-1:null);}});
    inp.addEventListener('blur',()=>setTimeout(()=>{if(!s.t.trim()&&D.steps.includes(s)&&!box.querySelector('.drag')&&!box.contains(document.activeElement)){D.steps.splice(D.steps.indexOf(s),1);draw();}},150));
    const del=()=>{const at=D.steps.indexOf(s);D.steps.splice(at,1);draw();if(s.t.trim())toast(`${Word} removed`,()=>{D.steps.splice(at,0,s);draw();});};
    const row=el('div',{class:'step tick-host'+(s.d?' done':'')+(showTick?'':' notick'),'data-i':i},showTick?tickBtn(s.d,on=>{s.d=on;s.doneAt=on?Date.now():null;row.classList.toggle('done',on);recount();},`Mark ${word} done`):null,inp,el('button',{class:'x','aria-label':`Delete ${word} ${i+1}`,html:ic('x',14,2.4),onclick:del}),el('span',{class:'h','aria-label':`Move ${word} ${i+1}. Drag, or use the up and down arrow keys.`,role:'button',tabindex:0,html:ic('handle',18)}));
    if(word==='step')onPress(row,(x,y)=>{if(!s.t.trim())return;openMenu(x,y,[{label:'Make it its own task',icon:'task',onclick:()=>{const at=D.steps.indexOf(s),t=newTask(s.t.trim(),{date:D.date&&!(D.repeat&&D.repeat.type!=='never')?D.date:null,area:D.area||null});if(D.kind==='project'&&D.id)t.part=D.id;else if(D.part)t.part=D.part;put(t,{silent:true});D.steps.splice(at,1);draw();toast(`“${t.title}” is now its own task`,()=>{remove(t.id,{hard:true,silent:true});D.steps.splice(at,0,s);draw();});}}]);});
    box.append(row);const h=row.querySelector('.h');
    reorderable(h,row,box,()=>{const copy=D.steps.slice();D.steps=[...box.children].map(n=>copy[+n.dataset.i]);draw();});
    h.addEventListener('keydown',e=>{const j=D.steps.indexOf(s);if(e.key==='ArrowUp'&&j>0){e.preventDefault();D.steps.splice(j,1);D.steps.splice(j-1,0,s);draw();box.children[j-1].querySelector('.h').focus();}if(e.key==='ArrowDown'&&j<D.steps.length-1){e.preventDefault();D.steps.splice(j,1);D.steps.splice(j+1,0,s);draw();box.children[j+1].querySelector('.h').focus();}});
  });
  if(focus!=null&&box.children[focus])box.children[focus].querySelector('input').focus();};
  draw();
  wrap.append(count,box,el('button',{class:'addstep',html:ic('plus',20,2)+`Add a ${word}`,onclick:()=>{const last=D.steps[D.steps.length-1];if(!last||last.t.trim())D.steps.push(newStep());draw(typingAtPress||!isTouch()?D.steps.length-1:null);}}));
  wrap._redraw=()=>draw();
  return wrap;
}
function photosEditor(D,{compact=false,onChange=null}={}){
  const box=el('div',{class:'photos'+(compact?' compact':'')});let pending=0;
  let lastFiles=[];const add=async files=>{const list=[...files];lastFiles=lastFiles.concat(list.filter(f=>f&&f.type)).slice(-3);pending+=list.length;draw();changed();for(const f of list){const ph=await savePhoto(f,D);pending--;if(ph){D.photos=D.photos||[];D.photos.push(ph);}draw();changed();}};
  const changed=()=>onChange&&onChange();
  const removeAt=i=>{const gone=D.photos.splice(i,1)[0];draw();changed();toast('Photo removed',()=>{D.photos.splice(i,0,gone);draw();changed();});};
  const draw=()=>{box.innerHTML='';(D.photos||[]).forEach((p,i)=>{const open=()=>photoViewer(D.photos,i,{onRemove:removeAt});box.append(el('div',{class:'photo',style:`background-image:url("${p.url}")`,role:'button',tabindex:0,'aria-label':`Open photo ${i+1}`,onclick:open,onkeydown:e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();open();}}},el('button',{'aria-label':`Remove photo ${i+1}`,html:ic('x',12,2.6),onclick:e=>{e.preventDefault();e.stopPropagation();removeAt(i);}})));});
    for(let n=0;n<pending;n++)box.append(el('div',{class:'photo loading',role:'status','aria-label':'Uploading photo'},el('i')));
    const inp=el('input',{type:'file',accept:'image/*',multiple:true,hidden:true,id:'photo-input-'+uid('p'),onchange:e=>add(e.target.files)});
    box.append(el('label',{class:'addphoto',html:ic('image',20)+'<span>Add photo</span>'},inp));};
  box._files=()=>lastFiles;box._busy=()=>pending>0;box._redraw=draw;box._add=add;
  draw();return box;
}
/* full-screen photo: swipe between photos, swipe down to close, pinch or double-tap to zoom */
function photoViewer(photos,start=0,{onRemove=null}={}){
  let i=start,scale=1,tx=0,ty=0;const list=photos.slice();
  const img=el('img',{alt:'',draggable:'false'}),count=el('span',{class:'pv-count'});
  const stage=el('div',{class:'pv-stage'},img);
  const apply=(anim)=>{img.style.transition=anim?'transform .2s ease':'none';img.style.transform=`translate(${tx}px,${ty}px) scale(${scale})`;};
  const show=()=>{img.src=list[i].url;img.alt=`Photo ${i+1} of ${list.length}`;count.textContent=list.length>1?`${i+1} of ${list.length}`:'';scale=1;tx=0;ty=0;apply();prev.hidden=next.hidden=list.length<2;};
  const go=d=>{if(list.length<2)return;i=(i+d+list.length)%list.length;show();};
  const close=()=>{removeEventListener('keydown',key,true);box.classList.remove('on');setTimeout(()=>box.remove(),200);};
  const key=e=>{if(e.key==='Escape'){e.preventDefault();e.stopPropagation();close();}else if(e.key==='ArrowLeft'){e.stopPropagation();go(-1);}else if(e.key==='ArrowRight'){e.stopPropagation();go(1);}};
  const prev=el('button',{class:'pv-nav l','aria-label':'Previous photo',html:ic('chevl',24,2),onclick:()=>go(-1)}),next=el('button',{class:'pv-nav r','aria-label':'Next photo',html:ic('chevr',24,2),onclick:()=>go(1)});
  const save=async()=>{try{const b=await (await fetch(list[i].url)).blob();await saveFile(`Life-OS-photo-${todayK()}-${i+1}.jpg`,b);}catch(e){toast('That photo could not be saved.');}};
  const box=el('div',{class:'pv',role:'dialog','aria-modal':'true','aria-label':'Photo'},
    el('div',{class:'pv-top'},el('button',{'aria-label':'Close photo',html:ic('x',22,2.2),onclick:close}),count,el('span',{style:'display:flex;gap:6px'},store.downloads?el('button',{'aria-label':'Save photo',html:sv('<path d="M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 20h14"/>',22,2),onclick:save}):null,onRemove?el('button',{'aria-label':'Remove photo',html:ic('trash',20,2),onclick:()=>{const at=photos.indexOf(list[i]);close();if(at>=0)onRemove(at);}}):null)),
    stage,prev,next);
  const pts=new Map();let startD=0,startS=1,sx=0,sy=0,bx=0,by=0,moved=false,lastTap=0,pinched=false;
  stage.addEventListener('pointerdown',e=>{stage.setPointerCapture(e.pointerId);pts.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pts.size===1){sx=e.clientX;sy=e.clientY;bx=tx;by=ty;moved=false;pinched=false;}if(pts.size===2){const[a,b]=[...pts.values()];startD=Math.hypot(a.x-b.x,a.y-b.y);startS=scale;pinched=true;}});
  stage.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,{x:e.clientX,y:e.clientY});
    if(pts.size>=2){const[a,b]=[...pts.values()];scale=Math.max(1,Math.min(4,startS*Math.hypot(a.x-b.x,a.y-b.y)/(startD||1)));if(scale===1){tx=0;ty=0;}apply();return;}
    const dx=e.clientX-sx,dy=e.clientY-sy;if(Math.hypot(dx,dy)>8)moved=true;
    if(scale>1){tx=bx+dx;ty=by+dy;apply();}else if(!pinched&&dy>0&&Math.abs(dy)>Math.abs(dx)){ty=dy;box.style.background=`rgba(10,14,12,${Math.max(.4,1-dy/500)})`;apply();}});
  const end=e=>{if(!pts.has(e.pointerId))return;pts.delete(e.pointerId);if(pts.size)return;const dx=e.clientX-sx,dy=e.clientY-sy;box.style.background='';
    if(pinched)return;
    if(scale>1){if(!moved&&Date.now()-lastTap<300){scale=1;tx=0;ty=0;apply(true);lastTap=0;}else if(!moved)lastTap=Date.now();return;}
    if(!moved){if(Date.now()-lastTap<300){scale=2.5;apply(true);lastTap=0;}else lastTap=Date.now();return;}
    if(dy>90&&Math.abs(dy)>Math.abs(dx)){close();return;}
    ty=0;apply(true);if(Math.abs(dx)>60&&Math.abs(dx)>Math.abs(dy))go(dx<0?1:-1);};
  stage.addEventListener('pointerup',end);stage.addEventListener('pointercancel',end);
  $('#layers').append(box);addEventListener('keydown',key,true);show();void box.offsetWidth;box.classList.add('on');box.querySelector('button').focus({preventScroll:true});
}
function resizeImage(file,max=1400){return new Promise(res=>{const img=new Image();img.onload=()=>{const s=Math.min(1,max/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=img.width*s;c.height=img.height*s;c.getContext('2d').drawImage(img,0,0,c.width,c.height);c.toBlob(b=>res({blob:b,dataUrl:c.toDataURL('image/jpeg',.72)}),'image/jpeg',.82);URL.revokeObjectURL(img.src);};img.onerror=()=>res(null);img.src=URL.createObjectURL(file);});}
async function savePhoto(file,D){
  const r=await resizeImage(file);if(!r){toast('That image could not be read.');return null;}
  if(store.assets){try{const a=await store.assets.upload(r.blob);return{id:a.id,url:a.url};}catch(e){}}
  const small=await resizeImage(file,640);if(!small)return null;const used=JSON.stringify((D&&D.photos)||[]).length;if(used+small.dataUrl.length>170000){toast('That’s as many photos as this item can hold right now.');return null;}return{id:null,url:small.dataUrl};
}
/* Shared sheet flow: Cancel / title / Add, discard check when anything changed. */
function formSheet({title,addLabel,D,build,commit,canAdd,word,isEdit,onDelete,deleteLabel,dirtyClose}){
  const baseline=JSON.stringify(D);let inst;
  const dirtyNow=()=>JSON.stringify(D)!==baseline;
  const update=()=>{if(inst&&inst.rightBtn){const off=!canAdd();inst.rightBtn.classList.toggle('off',off);inst.rightBtn.setAttribute('aria-disabled',String(off));}};
  inst=openSheet({title,full:true,left:{label:'Cancel'},right:{label:addLabel,onclick:()=>{if(!canAdd()){const t=inst.body.querySelector('.big');if(t)t.focus();return;}if(inst.body.querySelector('.photo.loading')){toast('Your photo is still uploading.');return;}delete D.lookTouched;if(commit()!==false)inst.close();}},
    tryClose:()=>{if(dirtyNow()&&dirtyClose){dirtyClose(()=>inst.close());return false;}if(dirtyNow()){askConfirm({title:isEdit?'Discard your changes?':`Discard this ${word}?`,body:isEdit?`The ${word} will stay as it was.`:"What you've entered won't be saved.",onYes:()=>inst.close()});return false;}return true;},
    build:(body,i)=>{inst=i;build(body,update,i);update();
      /* tapping anywhere else in the form puts the keyboard away */
      body.addEventListener('pointerdown',e=>{if(!isTouch())return;const a=document.activeElement;if(a&&a.matches('input,textarea')&&body.contains(a)&&!e.target.closest('input,textarea,label,.addstep,.keepkb'))a.blur();});}});
  return inst;
}
const clone=o=>JSON.parse(JSON.stringify(o));
/* saving one day of a repeating item: ask whether it applies to all of them */
/* the sheet stays open until a choice is made, so Cancel goes back to your edits */
function saveOcc(rec,D,occ,field,word,close){
  const start=rec[field];
  const before=clone(rec);before[field]=occ;if(rec.end)before.end=addK(occ,daysBetween(rec.start,rec.end));
  if(JSON.stringify(before)===JSON.stringify(Object.assign(clone(rec),D)))return;
  const off=!D.repeat||D.repeat.type==='never';
  if(off){const u=clone(rec);Object.assign(rec,D);put(rec);toast('Saved',()=>put(u));return;}
  const span=rec.end?daysBetween(rec.start,rec.end):null;
  const detached=(c,on)=>{delete c.id;delete c.createdAt;delete c.skip;delete c.doneDates;delete c.autoSteps;const sd=(c.stepDone||{})[occ];delete c.stepDone;if(sd)(c.steps||[]).forEach(x=>{x.d=!!sd[x.id];});if(on)c.repeat={type:'never',end:null};return c;};
  const when=occ===todayK()?'today':'on '+shortDay(occ);
  const restore=(u,ids)=>()=>{put(u,{silent:true});get.all(u.kind).forEach(x=>{if(!ids.has(x.id))remove(x.id,{silent:true});});App.refresh();};
  askConfirm({title:`Change this repeating ${word}?`,body:`Apply it to every repeat, or only ${when}?`,yes:'All of them',danger:false,no:'Keep editing',
    alts:[{label:'Only this one',onclick:()=>{const u=clone(rec),ids=new Set(get.all(rec.kind).map(x=>x.id));rec.skip=[...(rec.skip||[]),occ];put(rec,{silent:true});const dn=rec.doneDates&&rec.doneDates[occ];const c=detached(clone(D),true);if(dn)c.doneDates={[D[field]]:dn};put(Object.assign({id:uid(rec.kind[0]),kind:rec.kind},c));close();toast('Saved for this day',restore(u,ids));}},
      occ>start?{label:'This and later ones',onclick:()=>{const u=clone(rec),ids=new Set(get.all(rec.kind).map(x=>x.id));rec.repeat=Object.assign({},rec.repeat,{end:addK(occ,-1)});put(rec,{silent:true});const c=detached(clone(D),false);put(Object.assign({id:uid(rec.kind[0]),kind:rec.kind},c));close();toast('Saved from this day on',restore(u,ids));}}:null],
    onYes:()=>{const u=clone(rec);if(D[field]===occ){D[field]=start;if(span!=null&&D.end)D.end=addK(start,span);}Object.assign(rec,D);put(rec);close();toast('Saved',()=>put(u));}});
  return false;
}
/* the first day of the run: a weekly repeat starts on a day it actually covers */
function firstOccurrence(D,field){const r=D.repeat;if(!r||r.type==='never'||r.unit!=='week'||!(r.days||[]).length||!D[field])return;let d=D[field];for(let i=0;i<7&&!r.days.includes(monIdx(fromK(d)));i++)d=addK(d,1);if(d!==D[field]){if(D.end)D.end=addK(d,daysBetween(D[field],D.end));D[field]=d;return d;}}
/* edits to one-off items can be taken back */
function saveEdit(rec,D){const u=clone(rec);Object.assign(rec,D);put(rec);toast('Saved',()=>put(u));}
const nextHour=()=>Math.min(23*60,(Math.floor(nowMin()/60)+1)*60);
const nextQuarter=()=>{const s=Math.ceil(nowMin()/15)*15;return s>=1440?1425:s;};

/* ---------- New task ---------- */
function taskSheet(rec,seed={}){
  const isEdit=!!rec;
  const D=isEdit?clone(rec):Object.assign({title:'',notes:'',steps:[],date:App.state.sel,time:null,repeat:{type:'never',end:null},reminder:null,remUnit:'minute',deadline:null,priority:'normal',part:null,area:null,photos:[]},seed);
  delete D._after;delete D.occ;
  const occ=isEdit&&seed.occ&&rec.repeat&&rec.repeat.type!=='never'?seed.occ:null;if(occ)D.date=occ;
  let ctxRender,stepsEd,when,details;
  const inst=formSheet({title:isEdit?'Edit task':'New task',addLabel:isEdit?'Save':'Add',D,word:'task',isEdit,canAdd:()=>!!D.title.trim(),
    commit:()=>commit(),
    build:(body,update)=>{
      const ctx=formCtx(()=>ctxRender());
      const T=fieldTitle('f-task-title','Title','What needs doing?',D.title,v=>{D.title=v;update();},()=>{if(isTouch()){T.input.blur();return;}if(D.title.trim()&&commit()!==false)inst.close();});
      stepsEd=stepsEditor(D,{tick:isEdit});let wasRep=D.repeat&&D.repeat.type!=='never';
      when=el('div',{class:'group'});details=el('div',{class:'group'});
      body.append(T.wrap,fieldNotes('f-task-notes','Notes','Details or a link',D.notes,v=>D.notes=v,{rows:1,min:26}),photosEditor(D,{compact:true}),stepsEd,el('div',{class:'sect'},'When'),when,el('div',{class:'sect'},'Details'),details);
      ctxRender=()=>{
        const nowRep=D.repeat&&D.repeat.type!=='never';if(nowRep!==wasRep){wasRep=nowRep;stepsEd._redraw();}
        when.innerHTML='';details.innerHTML='';
        when.append(ctx.row('date','cal','Date',relDay(D.date),{valOn:!!D.date}));
        if(ctx.open==='date')when.append(ctx.panel('date','wide',ctx.calendar(D.date,dk=>{D.date=dk;if(!dk){D.time=null;D.reminder=null;D.repeat={type:'never',end:null};}else ctx.followDate(D,dk);ctx.open=null;ctxRender();},{noDate:true})));
        const hasTime=D.time!=null;
        when.append(ctx.row('time','time','Time',null,{expand:false,tap:hasTime?()=>{ctx.open=ctx.open==='time'?null:'time';ctxRender();}:null,trailing:[hasTime?el('span',{class:'on',id:'task-time-val'},fmtT(D.time)):null,ctx.sw(hasTime,'Set a time',on=>{if(on){if(!D.date)D.date=App.state.sel;D.time=nextHour();if(D.reminder==null)D.reminder=0;ctx.open='time';}else{D.time=null;D.reminder=null;if(['time','rem'].includes(ctx.open))ctx.open=null;}ctxRender();})]}));
        if(hasTime&&ctx.open==='time')when.append(ctx.panel('time','wide',ctx.wheel(()=>D.time,v=>{D.time=v;const t=$('#task-time-val');if(t)t.textContent=fmtT(v);})));
        ctx.repeatRows(when,D,()=>D.date||App.state.sel);
        ctx.reminderRow(when,D,{noTime:D.time==null,word:'the task time',onNeedTime:()=>{if(!D.date)D.date=App.state.sel;D.time=nextHour();D.reminder=0;D.remUnit='minute';ctx.open='time';ctxRender();toast('Time turned on');}});
        const hasDead=!!D.deadline;
        when.append(ctx.row('dead','target','Deadline',null,{expand:false,tap:hasDead?()=>{ctx.open=ctx.open==='dead'?null:'dead';ctxRender();}:null,trailing:[hasDead?el('span',{class:'on'},relDay(D.deadline)):null,ctx.sw(hasDead,'Set a deadline',on=>{if(on){D.deadline=k(addD(D.date?fromK(D.date):today(),7));ctx.open='dead';}else{D.deadline=null;if(ctx.open==='dead')ctx.open=null;}ctxRender();})]}));
        if(hasDead&&ctx.open==='dead')when.append(ctx.panel('dead','wide',ctx.calendar(D.deadline,dk=>{if(dk){D.deadline=dk;ctx.open=null;ctxRender();}})));
        if(D.deadline&&D.date&&D.deadline<D.date)when.append(el('div',{class:'note warn',role:'status'},`The deadline is before the date you picked.`));
        details.append(ctx.row('pri','flag','Priority',null,{expand:false,trailing:seg([['low','Low'],['normal','Normal'],['high','High']],D.priority,v=>{D.priority=v;ctxRender();})}));
        details.append(ctx.row('est','hour','Estimate',null,{expand:false,trailing:seg(EST_OPTS,+D.dur||0,v=>{D.dur=v||null;ctxRender();})}));
        if(isEdit&&(+D.dur||+D.spent))details.append(ctx.row('spent','time','Time spent',null,{expand:false,trailing:stepper(+D.spent||0,0,6000,5,v=>{D.spent=v;ctxRender();},v=>v?fmtDurS(v):'None')}));
        details.append(ctx.row('en','spark','Energy',null,{expand:false,trailing:seg(ENERGY,D.energy||null,v=>{D.energy=D.energy===v?null:v;ctxRender();})}));
        details.append(ctx.row('pl','pin','Where',null,{expand:false,trailing:seg(TPLACE,D.place||null,v=>{D.place=D.place===v?null:v;ctxRender();})}));
        ctx.partRow(details,D,{types:['goal','project']});ctx.areaRow(details,D);
        if(isEdit&&D.part&&(get.id(D.part)||{}).kind==='project')details.append(ctx.row('dep','layers','Waits for',blockedBy(rec).length?`${blockedBy(rec).length} task${blockedBy(rec).length>1?'s':''}`:depsOf(rec).length?'All done':'Nothing',{tap:()=>{inst.close();depSheet(rec);}}));
      };
      ctxRender();
      if(isEdit&&isOpenTask(rec))body.append(el('button',{class:'btn line block',style:'margin-top:6px',onclick:()=>{inst.close();startFocus(rec);}},el('span',{style:'display:grid',html:ic('play',15,2.2)}),frNow()&&frNow().id===rec.id?'Back to the timer':'Start focus'));
      if(isEdit){const dk=occ||rec.date||todayK(),dn=isDone(rec,dk);body.append(el('button',{class:'btn line block',style:'margin-top:6px',onclick:()=>{setTaskDone(rec,dk,!dn,{quiet:true});inst.close();App.refresh();toast(dn?'Marked not done':'Done',()=>{setTaskDone(rec,dk,dn,{quiet:true});App.refresh();});}},el('span',{style:'display:grid',html:ic(dn?'undo':'check',16,2.2)}),dn?'Mark not done':'Mark done'));}
      if(isEdit)body.append(el('button',{class:'delete',onclick:()=>deleteFlow(rec,occ||null,inst)},'Delete task'));
      if(!isEdit)focusIfKeyboard(T.input);
    }});
  function commit(){D.title=D.title.trim();D.steps=(D.steps||[]).filter(s=>s.t.trim());const moved=!occ&&firstOccurrence(D,'date');if(isEdit){if(occ)return saveOcc(rec,D,occ,'date','task',()=>inst.close());saveEdit(rec,D);}else{const r=create('task',D);toast(moved?`Starts ${relDay(D.date)}`:D.date?(D.date===App.state.sel?'Task added':`Added to ${relDay(D.date)}`):'Task added');seed._after&&seed._after(r);if(!seed._after&&D.date&&App.state.view==='today'&&D.date!==App.state.sel){App.state.sel=D.date;App.refresh();}}}
  return inst;
}
function deleteFlow(rec,occ,inst){
  const word={task:'task',block:'time block',allday:'all-day item'}[rec.kind],Word=word[0].toUpperCase()+word.slice(1);
  const repeating=rec.repeat&&rec.repeat.type!=='never',field=rec.kind==='allday'?'start':'date';
  const doAll=()=>{const copy=clone(rec);remove(rec.id);inst&&inst.close();toast(`${Word} deleted`,()=>{put(copy);});};
  if(!repeating){doAll();return;}
  const dk=occ||(rec.kind==='task'?nextOcc(rec):rec[field]),when=dk===todayK()?'today':'on '+shortDay(dk);
  const change=(fn,msg)=>{const u=clone(rec);fn();put(rec);inst&&inst.close();toast(msg,()=>put(u));};
  askConfirm({title:`Delete this repeating ${word}?`,body:`Remove every repeat, or only the one ${when}?`,yes:'Delete all of them',no:'Keep it',
    alts:[{label:'Only this one',onclick:()=>change(()=>{rec.skip=[...(rec.skip||[]),dk];},'Removed from this day')},dk>rec[field]?{label:'This and later ones',onclick:()=>change(()=>{rec.repeat=Object.assign({},rec.repeat,{end:addK(dk,-1)});},`Ended before ${relDay(dk)}`)}:null],onYes:doAll});
}

/* ---------- New time block ---------- */
function blockSheet(rec,seed={}){
  const isEdit=!!rec;const lateNight=seed.start==null&&App.state.sel===todayK()&&Math.ceil(nowMin()/15)*15>=1440,n=lateNight?0:nextQuarter();
  const D=isEdit?clone(rec):Object.assign({title:'',notes:'',date:lateNight?addK(todayK(),1):App.state.sel,start:n,dur:60,repeat:{type:'never',end:null},reminder:null,remUnit:'minute',part:null,area:null,color:'sage',icon:null},seed);
  delete D.occ;delete D._after;const occ=isEdit&&seed.occ&&rec.repeat&&rec.repeat.type!=='never'?seed.occ:null;if(occ)D.date=occ;
  let render;
  const inst=formSheet({title:isEdit?'Edit time block':'New time block',addLabel:isEdit?'Save':'Add',D,word:'time block',isEdit,canAdd:()=>!!D.title.trim(),commit:()=>commit(),
    build:(body,update)=>{
      const ctx=formCtx(()=>render());
      const chip=()=>el('span',{class:'pvchip',style:`--c:${colorHex(D.color)}`,html:(D.icon?glyph(D.icon,14):'')+`<span>${esc(D.title.trim()||'Preview')}</span>`});
      const refreshPv=()=>ctx.refreshLook&&ctx.refreshLook();
      const T=fieldTitle('f-block-title','Title','What is this time for?',D.title,v=>{D.title=v;update();refreshPv();},()=>{if(isTouch()){T.input.blur();return;}if(D.title.trim()&&commit()!==false)inst.close();});
      const when=el('div',{class:'group'}),det=el('div',{class:'group'});
      body.append(T.wrap,fieldNotes('f-block-notes','Notes','Details or a link',D.notes,v=>D.notes=v,{rows:1,min:26}),photosEditor(D,{compact:true}),el('div',{class:'sect'},'When'),when,el('div',{class:'sect'},'Details'),det);
      const endLabel=()=>fmtT(D.start+D.dur)+(D.start+D.dur>1440?' next day':'');
      const refreshTimes=()=>{const s=$('#b-start'),e=$('#b-end');if(s)s.textContent=fmtT(D.start);if(e)e.textContent=endLabel();refreshPv();const seg=$('#b-len');if(seg)$$('button',seg).forEach(b=>b.classList.toggle('on',+b.dataset.v===D.dur));overlapNote();};
      const overlapNote=()=>{const o=$('#b-ovl');if(!o)return;const hit=dayItems(D.date).timed.filter(e=>e.id!==(rec&&rec.id)&&e.time<D.start+D.dur&&e.time+(e.dur||30)>D.start);o.hidden=!hit.length;o.textContent=hit.length?`Overlaps ${hit[0].title} (${fmtRange(hit[0].time,hit[0].time+(hit[0].dur||30))})`:'';};
      render=()=>{
        when.innerHTML='';det.innerHTML='';refreshPv();
        when.append(ctx.row('date','cal','Date',relDay(D.date),{valOn:true}));
        if(ctx.open==='date')when.append(ctx.panel('date','wide',ctx.calendar(D.date,dk=>{D.date=dk;ctx.followDate(D,dk);ctx.open=null;render();})));
        when.append(ctx.row('start','time','Starts',el('span',{class:'on',id:'b-start'},fmtT(D.start))));
        if(ctx.open==='start')when.append(ctx.panel('start','wide',ctx.wheel(()=>D.start,v=>{D.start=v;refreshTimes();})));
        when.append(ctx.row('end','ends','Ends',el('span',{class:'on',id:'b-end'},endLabel())));
        if(ctx.open==='end')when.append(ctx.panel('end','wide',ctx.wheel(()=>(D.start+D.dur)%1440,v=>{let d=(v-D.start+1440)%1440;if(!d)d=1440;D.dur=d;refreshTimes();})));
        const ls=el('div',{class:'seg',id:'b-len','aria-label':'Length',onclick:e=>e.stopPropagation()},[[30,'30m'],[60,'1h'],[90,'1.5h'],[120,'2h']].map(([v,l])=>el('button',{'data-v':v,class:D.dur===v?'on':'',onclick:e=>{e.stopPropagation();D.dur=v;if(ctx.open==='end'||ctx.open==='start'){ctx.open=null;render();}else refreshTimes();}},l)));
        when.append(ctx.row('len','hour','Length',null,{expand:false,trailing:ls}));
        when.append(el('div',{class:'note warn',id:'b-ovl',role:'status',hidden:true}));
        ctx.repeatRows(when,D,()=>D.date);
        ctx.reminderRow(when,D,{word:'the start'});
        ctx.partRow(det,D,{types:['habit','goal','project'],onPick:(o,prev)=>{const t=D.title.trim();if(o&&(!t||(prev&&t===prev.title))){D.title=o.title;T.input.value=o.title;T.input._size();update();}if(!D.lookTouched){D.color=o&&o.color||'sage';D.icon=o&&o.icon||null;}}});
        const p=D.part?get.id(D.part):null;
        if(p&&p.kind==='habit')det.append(el('div',{class:'note good',html:ic('task',18,2)+`<span>This makes <b>${Math.min(habitWeek(p,D.date)+habitPlanned(p,D.date)+1,p.target||1)} of ${p.target||1}</b> ${esc(p.title)} sessions this week.</span>`}));
        ctx.areaRow(det,D);ctx.appearanceRow(det,D,chip);overlapNote();
      };
      render();
      if(isEdit)body.append(el('button',{class:'delete',onclick:()=>deleteFlow(rec,occ||null,inst)},'Delete time block'));
      if(!isEdit)focusIfKeyboard(T.input);
    }});
  function commit(){D.title=D.title.trim();delete D.lookTouched;const moved=!occ&&firstOccurrence(D,'date');if(isEdit){if(occ)return saveOcc(rec,D,occ,'date','time block',()=>inst.close());saveEdit(rec,D);}else{create('block',D);toast(moved?`Starts ${relDay(D.date)}`:'Time block added');seed._after&&seed._after();if(!seed._after&&App.state.view==='today'&&D.date!==App.state.sel){App.state.sel=D.date;App.refresh();}}}
  return inst;
}

/* ---------- New all-day item ---------- */
function alldaySheet(rec,seed={}){
  const isEdit=!!rec;
  const D=isEdit?clone(rec):Object.assign({title:'',notes:'',start:App.state.sel,end:null,repeat:{type:'never',end:null},reminder:null,remUnit:'minute',area:null,color:'sage',icon:null},seed);
  delete D.occ;delete D._after;const occ=isEdit&&seed.occ&&rec.repeat&&rec.repeat.type!=='never'?allDayOccStart(rec,seed.occ):null;if(occ){if(D.end)D.end=addK(occ,daysBetween(D.start,D.end));D.start=occ;}
  if(D.reminder!=null&&!D.rem)D.rem=D.reminder>=0?{n:Math.ceil(D.reminder/1440),unit:'day',at:(1440-D.reminder%1440)%1440}:{n:0,unit:'day',at:-D.reminder};
  let render;
  const inst=formSheet({title:isEdit?'Edit all-day item':'New all-day item',addLabel:isEdit?'Save':'Add',D,word:'all-day item',isEdit,canAdd:()=>!!D.title.trim(),commit:()=>commit(),
    build:(body,update)=>{
      const ctx=formCtx(()=>render());
      const chip=()=>el('span',{class:'adchip',style:`--c:${colorHex(D.color)};height:28px;font-size:13px`,html:(D.icon?glyph(D.icon,14,2):'')+`<span>${esc(D.title.trim()||'Preview')}</span>`});
      const refreshPv=()=>ctx.refreshLook&&ctx.refreshLook();
      const T=fieldTitle('f-ad-title','Title','Birthday, trip, day off…',D.title,v=>{D.title=v;update();refreshPv();},()=>{if(isTouch()){T.input.blur();return;}if(D.title.trim()&&commit()!==false)inst.close();});
      const when=el('div',{class:'group'}),det=el('div',{class:'group'});
      body.append(T.wrap,fieldNotes('f-ad-notes','Notes','Details or a link',D.notes,v=>D.notes=v,{rows:1,min:26}),photosEditor(D,{compact:true}),el('div',{class:'sect'},'When'),when,el('div',{class:'sect'},'Details'),det);
      render=()=>{
        when.innerHTML='';det.innerHTML='';refreshPv();
        when.append(ctx.row('date','cal',D.end?'First day':'Date',relDay(D.start),{valOn:true}));
        if(ctx.open==='date')when.append(ctx.panel('date','wide',ctx.calendar(D.start,dk=>{if(!dk)return;if(D.end)D.end=addK(dk,daysBetween(D.start,D.end));D.start=dk;ctx.followDate(D,dk);ctx.open=null;render();},{range:D.end?[D.start,D.end]:null})));
        const multi=!!D.end,fe=multi?fromK(D.end):null;
        when.append(ctx.row('end','ends',multi?'Last day':'Multiple days',null,{expand:false,tap:multi?()=>{ctx.open=ctx.open==='end'?null:'end';render();}:null,trailing:[multi?el('span',{class:'on'},`${MON[fe.getMonth()]} ${fe.getDate()} · ${daysBetween(D.start,D.end)+1} days`):null,ctx.sw(multi,'Multiple days',on=>{if(on){D.end=addK(D.start,2);ctx.open='end';}else{D.end=null;if(ctx.open==='end')ctx.open=null;}render();})]}));
        if(multi&&ctx.open==='end')when.append(ctx.panel('end','wide',el('div',{class:'eyebrow',style:'text-align:center;margin:2px 0 8px'},'Pick the last day'),ctx.calendar(D.end,dk=>{if(!dk)return;D.end=dk===D.start?null:dk;ctx.open=null;render();if(!D.end)toast('Back to a single day');},{minK:D.start,range:[D.start,D.end]})));
        ctx.repeatRows(when,D,()=>D.start,{unit:'year'});
        const hasRem=D.reminder!=null,syncRem=()=>{const r=D.rem;D.reminder=r.n*(r.unit==='week'?7:1)*1440-r.at;};const remText=r=>`${r.n===0?'Day of':`${r.n} ${r.unit}${r.n>1?'s':''}`} · ${fmtT(r.at)}`;
        when.append(ctx.row('rem','bell','Reminder',null,{expand:false,tap:hasRem?()=>{ctx.open=ctx.open==='rem'?null:'rem';render();}:null,trailing:[hasRem?el('span',{class:'on clip',id:'ad-rem',style:'max-width:170px'},remText(D.rem)):null,ctx.sw(hasRem,'Remind me',on=>{if(on){D.rem={n:1,unit:'day',at:540};syncRem();ctx.open='rem';}else{D.reminder=null;delete D.rem;if(ctx.open==='rem')ctx.open=null;}render();})]}));
        if(hasRem&&ctx.open==='rem'){const r=D.rem,max=r.unit==='day'?30:8;when.append(ctx.panel('rem','',el('div',{class:'sub'},el('div',{class:'lbl3'},'Remind me'),el('div',{class:'subrow'},ctx.stepper(r.n,0,max,v=>{r.n=v;syncRem();render();}),el('span',{},r.n===0?'on the day':`${r.unit}${r.n===1?'':'s'} before`)),seg([['day','Days'],['week','Weeks']],r.unit,u=>{r.unit=u;r.n=Math.min(r.n,u==='day'?30:8);syncRem();render();}),el('div',{class:'lbl3'},'At'),ctx.wheel(()=>r.at,v=>{r.at=v;syncRem();const t=$('#ad-rem');if(t)t.textContent=remText(r);}))));}
        ctx.areaRow(det,D);ctx.appearanceRow(det,D,chip);
      };
      render();
      if(isEdit)body.append(el('button',{class:'delete',onclick:()=>deleteFlow(rec,occ||null,inst)},'Delete all-day item'));
      if(!isEdit)focusIfKeyboard(T.input);
    }});
  function commit(){D.title=D.title.trim();delete D.lookTouched;const moved=!occ&&firstOccurrence(D,'start');if(isEdit){if(occ)return saveOcc(rec,D,occ,'start','all-day item',()=>inst.close());saveEdit(rec,D);}else{create('allday',D);toast(moved?`Starts ${relDay(D.start)}`:'All-day item added');seed._after&&seed._after();}}
  return inst;
}

function archiveFlow(rec,inst){rec.archived=true;rec.archivedAt=Date.now();put(rec);inst&&inst.close();toast('Moved to Archive',()=>{rec.archived=false;put(rec);});}

/* ---------- Quick capture: behaves like the other add sheets ---------- */
function watchCreate(kind,before,fn){const iv=setInterval(()=>{if(get.all(kind).length>before){clearInterval(iv);fn();}else if(!sheetStack.length){clearInterval(iv);}},300);}
function pickListSheet(text,done,photos=[]){
  const inst=openSheet({title:'Add to a list',build:body=>{
    const lists=get.all('list');let item=text||'';
    const I=fieldTitle('f-list-item','Item','What to add',item,v=>item=v);
    const need=()=>{if(item.trim())return true;I.input.focus();return false;};
    const addTo=l=>{if(!need())return;l.items=l.items||[];l.items.push({id:uid('i'),t:item.trim(),d:false,photos});put(l);inst.close();done&&done();toast(`Added to ${l.title}`);};
    body.append(I.wrap);
    if(lists.length)body.append(el('div',{class:'sect'},'Choose a list'),el('div',{class:'list'},lists.map(l=>el('button',{class:'li',onclick:()=>addTo(l)},el('span',{class:'sq',html:ic('list',20)}),el('span',{class:'grow'},el('b',{},l.title),el('small',{},`${(l.items||[]).length} items`))))));
    const nameT=fieldTitle('f-newlist','New list','Shopping, packing, anything','',v=>{nameT.v=v;mk.disabled=!v.trim();},()=>make());
    const make=()=>{const n=(nameT.v||'').trim();if(!n){nameT.input.focus();return;}if(!need())return;create('list',{title:n,items:[{id:uid('i'),t:item.trim(),d:false,photos}]});inst.close();done&&done();toast(`Added to ${n}`);};
    const mk=el('button',{class:'btn primary block',disabled:true,onclick:make},'Create list and add');body.append(nameT.wrap,mk);
  }});
}
function resourceSheet(rec,seed={},done){
  const isEdit=!!rec;const D=isEdit?clone(rec):Object.assign({title:'',notes:'',url:'',area:null},seed);let render;
  const inst=formSheet({title:isEdit?'Edit resource':'New resource',addLabel:isEdit?'Save':'Add',D,word:'resource',isEdit,canAdd:()=>!!D.title.trim(),commit:()=>{D.title=D.title.trim();if(isEdit){Object.assign(rec,D);put(rec);}else{create('resource',D);done&&done();}toast('Saved');},
    build:(body,update)=>{const ctx=formCtx(()=>render());const T=fieldTitle('f-res-title','Title','A guide, template or reference',D.title,v=>{D.title=v;update();});const det=el('div',{class:'group'});
      const u=el('label',{class:'field'},el('span',{class:'eyebrow'},'Link'),el('input',{id:'f-res-url',type:'url',placeholder:'https://',value:D.url||'',autocomplete:'off',oninput:e=>D.url=e.target.value}));
      body.append(T.wrap,u,fieldNotes('f-res-notes','Notes','What to remember',D.notes,v=>D.notes=v),det);if((D.photos||[]).length)body.append(el('div',{class:'sect'},'Attached'),photosEditor(D));render=()=>{det.innerHTML='';ctx.areaRow(det,D);};render();
      if(isEdit)body.append(el('button',{class:'delete',onclick:()=>archiveFlow(rec,inst)},'Archive resource'),el('button',{class:'delete',onclick:()=>{const c=clone(rec);remove(rec.id);inst.close();toast('Resource deleted',()=>put(c));}},'Delete resource'));else if(!T.input.value)focusIfKeyboard(T.input);}});
  return inst;
}
