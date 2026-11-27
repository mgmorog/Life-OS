/* ---------- v345 · app lock: Face ID or a passcode, for the whole app or private areas ----------
   A privacy screen on this device. The passcode (hashed) and the Face ID key live on this phone only. */
const LOCK_KEY='lifeos-lock';
const lockLocal=()=>{try{return JSON.parse(localStorage.getItem(LOCK_KEY)||'{}');}catch(e){return{};}};
const lockSave=o=>{try{localStorage.setItem(LOCK_KEY,JSON.stringify(o));}catch(e){}};
const lockMode=()=>{const s=get.settings();return lockLocal().hash?(s.lockMode||'off'):'off';};
const lockAreas=()=>get.settings().lockAreas||['Finances'];
let lockOpenUntil=0,lockHiddenAt=0,lockUp=false;
async function lockHash(code){const b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode('life-os|'+code));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');}
const b64=a=>btoa(String.fromCharCode(...new Uint8Array(a))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const unb64=s=>{s=s.replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return Uint8Array.from(atob(s),c=>c.charCodeAt(0));};
const faceOK=()=>!!(window.PublicKeyCredential&&navigator.credentials&&location.protocol==='https:');
async function faceSetup(){try{const cred=await navigator.credentials.create({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),rp:{name:'Life OS',id:location.hostname},user:{id:crypto.getRandomValues(new Uint8Array(16)),name:'life-os',displayName:'Life OS'},pubKeyCredParams:[{type:'public-key',alg:-7},{type:'public-key',alg:-257}],authenticatorSelection:{authenticatorAttachment:'platform',userVerification:'required',residentKey:'discouraged'},timeout:60000}});if(!cred)return false;const L=lockLocal();L.cred=b64(cred.rawId);lockSave(L);return true;}catch(e){return false;}}
async function faceCheck(){const L=lockLocal();if(!L.cred||!faceOK())return false;try{const a=await navigator.credentials.get({publicKey:{challenge:crypto.getRandomValues(new Uint8Array(32)),allowCredentials:[{type:'public-key',id:unb64(L.cred)}],userVerification:'required',timeout:60000}});return !!a;}catch(e){return false;}}
const lockGrace=()=>(get.settings().lockAfter??1)*60e3;
function lockNeeded(view,params){const m=lockMode();if(m==='off'||Date.now()<lockOpenUntil)return false;if(m==='app')return true;
  const A=lockAreas();const hub=params&&(params.hub||params.name||params.area);if((view==='tool'||view==='area'||view==='hub')&&hub&&A.includes(hub))return true;if(view==='journal'&&A.includes('Journal'))return true;return false;}
function lockScreen(onOpen,{title='Life OS is locked',sub=null,cancel=false}={}){if(lockUp)return;lockUp=true;const L=lockLocal();let code='';
  const dots=el('div',{class:'lkdots','aria-hidden':'true'},[0,1,2,3].map(()=>el('i')));const msg=el('p',{class:'lkmsg','aria-live':'polite'},sub||'Enter your passcode');
  const open=()=>{lockOpenUntil=Date.now()+12*3600e3;lockUp=false;scr.classList.add('out');setTimeout(()=>scr.remove(),280);onOpen&&onOpen();};
  const fill=()=>[...dots.children].forEach((d,i)=>d.classList.toggle('on',i<code.length));
  const key=async d=>{if(d==='del'){code=code.slice(0,-1);fill();return;}if(code.length>=4)return;code+=d;fill();buzz(6);if(code.length===4){const h=await lockHash(code);if(h===lockLocal().hash){open();}else{msg.textContent='Wrong passcode. Try again.';dots.animate&&motionOK()&&dots.animate([{transform:'translateX(0)'},{transform:'translateX(-10px)'},{transform:'translateX(10px)'},{transform:'none'}],{duration:280});setTimeout(()=>{code='';fill();},250);}}};
  const pad=el('div',{class:'lkpad'},...['1','2','3','4','5','6','7','8','9','face','0','del'].map(d=>d==='face'?(L.cred&&faceOK()?el('button',{class:'lkk lkface','aria-label':'Use Face ID',html:ic('shield',IC.lg),onclick:async()=>{if(await faceCheck())open();}}):el('span')):d==='del'?el('button',{class:'lkk lkdel','aria-label':'Delete',html:ic('chevl',IC.lg),onclick:()=>key('del')}):el('button',{class:'lkk',onclick:()=>key(d)},d)));
  const scr=el('div',{class:'lockscr',role:'dialog','aria-modal':'true','aria-label':title},el('div',{class:'lkin'},el('span',{class:'lkic',html:ic('lock',IC.lg)}),el('h2',{},title),msg,dots,pad,cancel?Button('Cancel',{variant:'link',onclick:()=>{lockUp=false;scr.classList.add('out');setTimeout(()=>scr.remove(),280);}}):null));
  document.body.append(scr);const onKey=e=>{if(!scr.isConnected){removeEventListener('keydown',onKey);return;}if(/^[0-9]$/.test(e.key))key(e.key);else if(e.key==='Backspace')key('del');};addEventListener('keydown',onKey);
  if(L.cred&&faceOK())setTimeout(async()=>{if(scr.isConnected&&await faceCheck())open();},350);}
/* lock again after the phone has been away longer than your grace time */
document.addEventListener('visibilitychange',()=>{if(document.hidden){lockHiddenAt=Date.now();return;}if(lockHiddenAt&&Date.now()-lockHiddenAt>lockGrace()){lockOpenUntil=0;if(lockMode()==='app')lockScreen(null);else if(lockMode()==='areas'){const S=App.state;if(lockNeeded(S.view,S.params)){const v=S.view,p=S.params;App.go('today');lockScreen(()=>App.go(v,p));}}}});
function lockAtStart(){if(lockMode()==='app')lockScreen(null);}
function lockSettings(g,ctx){const s=get.settings(),L=lockLocal(),has=!!L.hash;
  g.append(setRow('App lock',has?({off:'Off',app:'Whole app',areas:'Private areas'})[s.lockMode||'off']:'Set a passcode on this phone first',has?null:'Off',()=>lockSetupSheet()));
  if(has&&(s.lockMode||'off')!=='off'){if((s.lockMode)==='areas')g.append(condRow(setRow('Private areas',lockAreas().join(', '),null,()=>{const A=(s.areas||AREAS);Picker({title:'Private areas',items:A.map(a=>[a,a]),multi:true,selected:lockAreas(),onPick:v=>setSettings({lockAreas:Array.isArray(v)?v:[v]}),left:'Done'});})));
    g.append(condRow(setRow('Lock again after',null,({0:'Right away',1:'1 minute',5:'5 minutes',15:'15 minutes'})[s.lockAfter??1],()=>pickOne('Lock again after',[[0,'Right away'],[1,'1 minute'],[5,'5 minutes'],[15,'15 minutes']],s.lockAfter??1,v=>setSettings({lockAfter:+v})))));}}
function lockSetupSheet(){const L=lockLocal(),s=get.settings();let inst;
  const setCode=()=>{let first='';const ask=(title,cb)=>askFields({title,req:true,D:{c:''},fields:[F('c','4-digit passcode','text',{ph:'••••'})],save:v=>{const c=String(v.c||'').replace(/\D/g,'');if(c.length!==4){toast('Use exactly 4 digits');return;}cb(c);}});
    ask('Choose a passcode',c=>{first=c;setTimeout(()=>ask('Type it again',async c2=>{if(c2!==first){toast('Those didn’t match. Try again.');return;}const h=await lockHash(c2);const L2=lockLocal();L2.hash=h;lockSave(L2);if((get.settings().lockMode||'off')==='off')setSettings({lockMode:'app'});else App.refresh();toast('Passcode set on this phone');}),350);});};
  inst=openSheet({title:'App lock',left:{label:'Close'},build:b=>{const has=!!lockLocal().hash;
    b.append(Caption('A privacy screen for this phone. Your passcode and Face ID stay on this device, and other devices are set up on their own.',{as:'p',style:'padding:0 var(--s1) var(--s3)'}));
    const g=el('div',{class:'list'});b.append(g);
    if(has){setSeg(g,'Lock',null,[['off','Off'],['app','Whole app'],['areas','Private areas']],get.settings().lockMode||'off',v=>setSettings({lockMode:v}));
      if(faceOK())g.append(Switch({on:!!lockLocal().cred,label:'Use Face ID',sub:'Falls back to your passcode',onChange:async v=>{if(v){const ok=await faceSetup();if(!ok){toast('Face ID wasn’t set up');}}else{const L2=lockLocal();delete L2.cred;lockSave(L2);}inst.close();lockSetupSheet();}}));
      g.append(Row({style:'',onclick:()=>{inst.close();setCode();}},el('span',{class:'grow'},el('b',{style:'font-weight:500'},'Change passcode'))),Row({style:'color:var(--overdue);font-weight:500',onclick:()=>{lockSave({});setSettings({lockMode:'off'});inst.close();toast('App lock removed from this phone');}},'Remove passcode'));}
    else g.append(Row({style:'color:var(--action-text);font-weight:500',onclick:()=>{inst.close();setCode();}},'Set a passcode'));}});}

/* ---------- v345 · daily backups, kept on this device (last 14) ---------- */
const BK_DB='lifeos-backups';
function bkDB(){return new Promise((res,rej)=>{if(!window.indexedDB){rej(new Error('no idb'));return;}const r=indexedDB.open(BK_DB,1);r.onupgradeneeded=()=>r.result.createObjectStore('bk');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error);});}
async function bkAll(){try{const db=await bkDB();return await new Promise(res=>{const out=[];const tx=db.transaction('bk','readonly'),st=tx.objectStore('bk'),c=st.openCursor();c.onsuccess=()=>{const cur=c.result;if(cur){out.push({day:cur.key,size:(cur.value||'').length});cur.continue();}else res(out.sort((a,b)=>a.day<b.day?1:-1));};c.onerror=()=>res([]);});}catch(e){return[];}}
async function bkGet(day){const db=await bkDB();return new Promise(res=>{const r=db.transaction('bk','readonly').objectStore('bk').get(day);r.onsuccess=()=>res(r.result||null);r.onerror=()=>res(null);});}
async function bkRun(force=false){try{if(get.settings().autoBackup===false&&!force)return;const day=todayK();const L=await bkAll();if(!force&&L.some(x=>x.day===day))return;const own=[...recs.values()].filter(r=>r&&!r.example&&!r.demo);if(own.length<3)return;
  const records=own.map(r=>r&&r.kind==='settings'&&r.icalFeeds?Object.assign({},r,{icalFeeds:undefined}):r);const data=JSON.stringify({app:'life-os',version:2,appVer:APP_VER,exportedAt:new Date().toISOString(),photos:'linked',auto:true,records});
  const db=await bkDB();await new Promise(res=>{const tx=db.transaction('bk','readwrite'),st=tx.objectStore('bk');st.put(data,day);L.filter(x=>x.day!==day).slice(13).forEach(x=>st.delete(x.day));tx.oncomplete=res;tx.onerror=res;});}catch(e){}}
async function bkRestore(day){const data=await bkGet(day);if(!data){toast('That backup is gone');return;}askConfirm({title:`Restore ${relDay(day)}’s backup?`,body:'Adds back anything from that day that’s missing now. Nothing you have now is removed.',yes:'Restore',danger:false,no:'Cancel',onYes:()=>importData(new File([data],`Life-OS-${day}.json`,{type:'application/json'}))});}
function bkSheet(){const inst=openSheet({title:'Daily backups',left:{label:'Close'},build:async b=>{b.append(Caption('Once a day, when you open Life OS, a copy of everything (without photos) is kept on this phone. The last 14 stay.',{as:'p',style:'padding:0 var(--s1) var(--s3)'}));const g=el('div',{class:'list'});b.append(g);
  const s=get.settings();g.append(Switch({on:s.autoBackup!==false,label:'Keep daily backups',onChange:v=>setSettings({autoBackup:v})}));
  const L=await bkAll();const l2=el('div',{class:'list',style:'margin-top:var(--s4)'});if(!L.length)l2.append(Row({as:'div',style:''},el('span',{class:'grow'},el('small',{},'The first one is made the next time you open the app.'))));
  L.forEach(x=>l2.append(Row({as:'div',style:''},el('span',{class:'grow'},el('b',{style:'font-weight:500'},x.day===todayK()?'Today':relDay(x.day)),el('small',{},`${Math.max(1,Math.round(x.size/1024))} KB`)),Button('Restore',{variant:'secondary',size:'sm',onclick:()=>{inst.close();bkRestore(x.day);}}))));b.append(l2,Row({style:'color:var(--action-text);font-weight:500;margin-top:var(--s3)',onclick:async()=>{await bkRun(true);inst.close();bkSheet();toast('Backup saved on this phone');}},'Back up now'));}});}
