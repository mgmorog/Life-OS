try{if(!document.documentElement.lang)document.documentElement.lang='en';}catch(e){}
/* append skips empty slots and accepts lists, so a missing optional piece never prints as text */
{const native=Element.prototype.append;Element.prototype.append=function(...k){native.apply(this,k.flat(Infinity).filter(x=>x!=null&&x!==false));};}
/* ---------- DOM helpers ---------- */
const $=(s,r=document)=>r.querySelector(s);
const $$=(s,r=document)=>[...r.querySelectorAll(s)];
const el=(t,a={},...kids)=>{const e=document.createElement(t);for(const k in a){const v=a[k];if(v==null||v===false)continue;if(k==='class')e.className=v;else if(k==='html')e.innerHTML=v;else if(k==='style')e.setAttribute('style',v);else if(k==='value')e.value=v;else if(k.startsWith('on'))e.addEventListener(k.slice(2),v);else e.setAttribute(k,v===true?'':v);}for(const c of kids.flat(Infinity)){if(c==null||c===false)continue;e.append(c.nodeType?c:document.createTextNode(c));}return e;};
const sv=(p,w=22,sw=1.8,extra='')=>`<svg width="${w}" height="${w}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${p}</svg>`;
const P={
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
 hour:'<path d="M7 3.5h10M7 20.5h10M8 3.5c0 4 4 5.5 4 8.5s-4 4.5-4 8.5M16 3.5c0 4-4 5.5-4 8.5s4 4.5 4 8.5"/>',
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
 spark:'<path d="M12 3v5M12 16v5M3 12h5M16 12h5M6 6l3 3M15 15l3 3M18 6l-3 3M9 15l-3 3"/>',bookmark:'<path d="M6 3h12v18l-6-4-6 4z"/>',
 shield:'<path d="M12 3l7 3v5c0 4.5-3 8.3-7 10-4-1.7-7-5.5-7-10V6z"/>',coins:'<circle cx="9" cy="9" r="5.5"/><path d="M15.5 9.6a5.5 5.5 0 1 1-6 6"/>',users:'<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.3-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.8c1.7.8 2.8 2.6 3 5.2"/>',globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',lock:'<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',moon:'<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',star:'<path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z"/>',
};
const ic=(n,w=22,s=1.8)=>sv(P[n]||'',w,n==='check'&&s>=2.6?s:Math.min(2.6,Math.max(1.6,38/w)));
const GLYPHS=[['focus','Focus','<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1" fill="currentColor"/>'],['brief','Work','<rect x="3.5" y="7.5" width="17" height="12" rx="2"/><path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 12.5h17"/>'],['dumbbell','Workout','<path d="M6.5 7v10M17.5 7v10M3.5 9.5v5M20.5 9.5v5M6.5 12h11"/>'],['book','Reading','<path d="M5 18V6a2 2 0 0 1 2-2h12v14H7a2 2 0 0 0-2 2 2 2 0 0 0 2 2h12"/>'],['pencil','Writing','<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>'],['users','People','<circle cx="9" cy="8" r="3.5"/><path d="M3 20a6 6 0 0 1 12 0M16 4.5a3.5 3.5 0 0 1 0 7M21 20a6 6 0 0 0-3.5-5.5"/>'],['phone','Call','<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>'],['coffee','Coffee','<path d="M4 9h13v5a5 5 0 0 1-5 5H9a5 5 0 0 1-5-5z"/><path d="M17 11h1.5a2.5 2.5 0 0 1 0 5H17M8 3.5v2.5M12 3.5v2.5"/>'],['meal','Meal','<path d="M7 3v18M4 3v5a3 3 0 0 0 6 0V3M17 21V3c-2 1-3 4-3 8h3"/>'],['heart','Care',P.heart],['music','Music','<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>'],['car','Travel','<path d="M5 16.5h14M5.5 12l1.6-4.2A2 2 0 0 1 9 6.5h6a2 2 0 0 1 1.9 1.3l1.6 4.2"/><rect x="3.5" y="12" width="17" height="5.5" rx="1.5"/><path d="M6.5 17.5V19M17.5 17.5V19"/>'],['cake','Birthday','<path d="M4 20h16M5 20v-6a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v6"/><path d="M5 16c1.5 1 2.5 1 3.5 0s2-1 3.5 0 2.5 1 3.5 0 2-1 3.5 0"/><path d="M12 12V9"/><path d="M12 4.5c.9.9 1 1.9 0 2.8-1-.9-.9-1.9 0-2.8z"/>'],['gift','Gift','<rect x="4" y="9" width="16" height="11" rx="1.5"/><path d="M3 9h18M12 9v11"/><path d="M12 9C10.5 5 7 5 7 7s3 2 5 2c2 0 5 0 5-2s-3.5-2-5 2z"/>'],['plane','Trip','<path d="M10.5 13.5 4 12l-1 1.5 5.5 3M10.5 13.5l-2 4.5 1.5 1 4.5-5.5M10.5 13.5 18 6c1-1 2.5-1.2 3-.7s.3 2-.7 3L13 16"/>'],['flag','Deadline',P.flag],['home','Home','<path d="M4 11 12 4.5l8 6.5M6 9.5V20h12V9.5M10 20v-5h4v5"/>'],['cap','Graduation','<path d="m12 5 9.5 4.5L12 14 2.5 9.5z"/><path d="M6.5 11.5V16c1.5 1.5 3.5 2 5.5 2s4-.5 5.5-2v-4.5M21.5 9.5V15"/>'],['health','Appointment','<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8v8M8 12h8"/>'],['ticket','Event','<path d="M4 8a2 2 0 0 0 2-2h12a2 2 0 0 0 2 2v2a2 2 0 0 0 0 4v2a2 2 0 0 0-2 2H6a2 2 0 0 0-2-2v-2a2 2 0 0 0 0-4z"/>'],['sun','Day off',P.sun],['pay','Bill due','<rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="M3.5 10h17M7 14.5h3"/>'],['leaf','Outdoors',P.leaf],['star','Special',P.star]];
const GL=Object.fromEntries(GLYPHS.map(([id,n,p])=>[id,{n,p}]));
const glyph=(id,w=18,s=1.8)=>GL[id]?sv(GL[id].p,w,s):'';
const COLORS=[['sage','Sage','#466B5A'],['blue','Blue','#4A6E9C'],['plum','Plum','#735B98'],['rose','Rose','#A8625F'],['clay','Clay','#8A6A50'],['ochre','Ochre','#8A6731'],['olive','Olive','#677A38'],['slate','Slate','#5D6573']];
const colorHex=c=>!c?COLORS[0][2]:c[0]==='#'?c:(COLORS.find(x=>x[0]===c)||COLORS[0])[2];
const AREA_ICON={Health:'a_health',Home:'a_home',Finances:'a_money',Relationships:'a_people',Career:'a_career',Learning:'a_learn',Recreation:'a_rec',Travel:'a_travel','Personal growth':'a_growth','Life admin':'a_admin',Family:'a_family',Pets:'a_pets',Community:'a_comm'};
const areaIcon=a=>AREA_ICON[a]||'leaf';
const AREAS=['Health','Home','Finances','Relationships','Career','Learning','Recreation','Travel','Personal growth'];
const AREA_COLOR={Health:'#466B5A',Home:'#8A6A50',Finances:'#677A38',Relationships:'#A8625F',Career:'#4A6E9C',Learning:'#735B98',Recreation:'#8A6731',Travel:'#3F7680','Personal growth':'#5D6573'};

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
const weekStartOf=d=>{const ws=get.settings().weekStart??1;const diff=(d.getDay()-ws+7)%7;return addD(d,-diff);};
const weekKey=d=>k(weekStartOf(d));
const monthKey=d=>`${d.getFullYear()}-${pad2(d.getMonth()+1)}`;
const quarterOf=d=>Math.floor(d.getMonth()/3);
const quarterKey=d=>`${d.getFullYear()}-Q${quarterOf(d)+1}`;
const fmtT=m=>{m=((m%1440)+1440)%1440;const h=Math.floor(m/60),mm=m%60;if(get.settings().clock===24)return `${pad2(h)}:${pad2(mm)}`;return `${h%12||12}:${pad2(mm)} ${h<12?'AM':'PM'}`;};
const fmtS=m=>{m=((m%1440)+1440)%1440;const h=Math.floor(m/60),mm=m%60;if(get.settings().clock===24)return `${pad2(h)}:${pad2(mm)}`;return `${h%12||12}:${pad2(mm)}`;};
const fmtRange=(s,e)=>{const a=fmtT(s),b=fmtT(e);if(get.settings().clock===24)return `${a} – ${b}`;return a.slice(-2)===b.slice(-2)?`${a.slice(0,-3)} – ${b}`:`${a} – ${b}`;};
const fmtDur=d=>{const h=Math.floor(d/60),m=d%60;return h&&m?`${h} hr ${m} min`:h?`${h} hr`:`${m} min`;};
const fmtDurS=d=>{if(!d)return '';const h=Math.floor(d/60),m=d%60;return h&&m?`${h}h ${m}m`:h?`${h}h`:`${m}m`;};
const daysBetween=(a,b)=>Math.round((fromK(b)-fromK(a))/864e5);
const shortDay=s=>{const d=fromK(s);return `${DOW[d.getDay()].slice(0,3)}, ${MON[d.getMonth()]} ${d.getDate()}`+(d.getFullYear()!==today().getFullYear()?`, ${d.getFullYear()}`:'');};
const relDay=s=>{if(!s)return 'No date';const diff=daysBetween(todayK(),s);if(diff===0)return 'Today';if(diff===1)return 'Tomorrow';if(diff===-1)return 'Yesterday';return shortDay(s);};
const timeAgo=ts=>{const days=daysBetween(k(new Date(ts)),todayK());if(days<=0)return 'Today';if(days===1)return 'Yesterday';if(days<7)return `${days} days ago`;if(days<30)return `${Math.floor(days/7)} wk ago`;return shortDay(k(new Date(ts)));};

/* ---------- store: one document per record, private to the signed-in person ---------- */
const CACHE='lifeos-v1';
const recs=new Map();
const dirty=new Set();
const deleted=new Set();
const store={db:null,uid:null,coll:null,assets:null,downloads:null,ready:false,mode:'starting',lastError:null};
const uid=(p='r')=>p+Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const DEFAULT_SETTINGS={id:'settings',kind:'settings',top3On:true,chime:true,planEve:true,planAt:1140,areaDue:true,weekStart:1,nav:['today','studio','calendar'],pinned:['inbox','tasks','habits','goals'],recent:[],capacity:{mode:'items',full:6,hours:8,lightWeekends:false},filters:{types:{task:true,block:true,allday:true,habit:true},areas:[]},reviewDay:0,grid:{startScroll:null},work:{start:540,end:1020},areas:AREAS.slice(),foundation:{},haptics:true,clock:12,textSize:'default',bold:false,borders:false,contrast:false,reduceMotion:false,celebrate:'flow',completed:'fade',carryOver:true,defaultHabitTarget:3,studioHabits:true,suggestOn:true,checkinCard:true,workDays:[0,1,2,3,4],protectEvenings:false,monthlyReview:true,quarterlyReview:true,inboxNudge:true,quiet:{on:false,from:1320,to:420},captureTo:'inbox',captureToast:true,calendar:{on:false,declined:false,chips:true,busy:true},currency:'$',hideAmounts:false};
const get={
  settings(){const r=recs.get('settings');if(!r)return DEFAULT_SETTINGS;if(r!==get._s){get._s=r;get._m=Object.assign({},DEFAULT_SETTINGS,r);}return get._m;},
  all(kind,{archived=false,every=false}={}){const out=[];recs.forEach(r=>{if(r.kind===kind&&(archived||!r.archived)&&(every||(!r.paused&&!r.finished)))out.push(r);});return out;},
  id(id){return recs.get(id);},
};
function cacheNow(){try{localStorage.setItem(CACHE,JSON.stringify({uid:store.uid,recs:[...recs.values()],dirty:[...dirty],deleted:[...deleted]}));}catch(e){}}
let cacheT;const scheduleCache=()=>{clearTimeout(cacheT);cacheT=setTimeout(cacheNow,250);};
function loadCache(){try{const raw=localStorage.getItem(CACHE);if(!raw)return false;const p=JSON.parse(raw);(p.recs||[]).forEach(r=>recs.set(r.id,r));(p.dirty||[]).forEach(i=>dirty.add(i));(p.deleted||[]).forEach(i=>deleted.add(i));store.cachedUid=p.uid;return recs.size>0;}catch(e){return false;}}
const timers=new Map();
function queueWrite(id){dirty.add(id);scheduleCache();clearTimeout(timers.get(id));timers.set(id,setTimeout(()=>flush(id),350));}
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
function put(r,{silent=false}={}){r.updatedAt=Date.now();if(!r.createdAt)r.createdAt=r.updatedAt;recs.set(r.id,r);deleted.delete(r.id);queueWrite(r.id);const tr='del-'+r.id;if(recs.has(tr)){recs.delete(tr);deleted.add(tr);queueWrite(tr);}if(!silent)App.refresh();return r;}
function create(kind,fields){return put(Object.assign({id:uid(kind[0]),kind},fields));}
const NO_TRASH=new Set(['settings','remstate','focus','plan','trashed','areanote','discover']);
function remove(id,{silent=false,hard=false}={}){const was=recs.get(id);if(was&&!hard&&!NO_TRASH.has(was.kind)&&!(was.f&&was.f.t==='cfg')&&!was.example){const tr={id:'del-'+id,kind:'trashed',rec:JSON.parse(JSON.stringify(was)),deletedAt:Date.now(),createdAt:Date.now(),updatedAt:Date.now()};recs.set(tr.id,tr);deleted.delete(tr.id);queueWrite(tr.id);}recs.delete(id);deleted.add(id);queueWrite(id);if(!silent)App.refresh();}
function setSettings(patch){const s=Object.assign({},DEFAULT_SETTINGS,get.settings(),patch);put(s);}
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
  timed.sort((a,b)=>a.time-b.time);
  const pr=e=>e.rec.priority==='high'?0:e.rec.priority==='low'?2:1;anytime.sort((a,b)=>(a.done-b.done)||(pr(a)-pr(b)));
  return{allDay,timed,anytime};
}
/* a time block running past midnight carries on at the top of the next day's grid */
function spill(dk){const prev=addK(dk,-1),out=[];get.all('block').forEach(r=>{if(r.start+r.dur>1440&&occursOn(r.date,r.repeat,prev,r.skip))out.push({kind:'block',id:r.id,rec:r,title:r.title,time:0,dur:r.start+r.dur-1440,color:colorHex(r.color),icon:r.icon,area:r.area,done:isDone(r,prev),cont:true,contFrom:prev});});return out;}
const occursHabit=(h,dk)=>(h.days&&h.days.length)?(h.days.includes(monIdx(fromK(dk)))&&(!h.startDate||dk>=h.startDate)):false;
function weekRange(dk){const s=weekStartOf(fromK(dk));return[k(s),k(addD(s,6))];}
const habitDone=(h,dk)=>{const v=h.logs&&h.logs[dk];if(!v)return false;return h.track==='count'||h.track==='time'?(v===true||v>=(h.goalN||1)):true;};
function habitWeek(h,dk){const[a,b]=weekRange(dk);let n=0;for(const d in(h.logs||{}))if(d>=a&&d<=b&&habitDone(h,d))n++;return n;}
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
  if(e.kind==='habit'){const h=e.rec;h.logs=h.logs||{};if(habitDone(h,dk))delete h.logs[dk];else{h.logs[dk]=h.track==='count'||h.track==='time'?(h.goalN||1):true;if(h.skips)delete h.skips[dk];if(dk===todayK()){const n=new Date();h.logT=Object.assign({},h.logT,{[dk]:n.getHours()*60+n.getMinutes()});}}put(h,{silent:true});syncHabitGoals(h);celebrateStreak(h,dk);return habitDone(h,dk);}
  const r=e.rec;if(e.kind==='task'){const d=e.occ||dk;return setTaskDone(r,d,!(r.doneDates&&r.doneDates[d]));}r.doneDates=r.doneDates||{};if(r.doneDates[dk])delete r.doneDates[dk];else r.doneDates[dk]=Date.now();
  if(e.kind==='block'&&r.part){const h=get.id(r.part);if(h&&h.kind==='habit'){h.logs=h.logs||{};if(r.doneDates[dk])h.logs[dk]=true;else delete h.logs[dk];put(h,{silent:true});}}
  put(r,{silent:true});return !!r.doneDates[dk];
}
function carried(){const tk=todayK(),out=[];get.all('task').forEach(t=>{if(t.date&&t.date<tk&&(!t.repeat||t.repeat.type==='never')&&!isDone(t,t.date)&&!onHold(t))out.push(t);});return out.sort((a,b)=>a.date<b.date?-1:1);}
const stepDone=(r,st,dk)=>r.repeat&&r.repeat.type!=='never'?!!((r.stepDone||{})[dk]||{})[st.id]:!!st.d;
function setStepDone(r,st,dk,on){if(r.repeat&&r.repeat.type!=='never'){r.stepDone=r.stepDone||{};const m=Object.assign({},r.stepDone[dk]);if(on)m[st.id]=true;else delete m[st.id];r.stepDone[dk]=m;}else{st.d=on;st.doneAt=on?Date.now():null;}}
function isOpenTask(t){if(!t.date)return !(t.doneDates&&Object.keys(t.doneDates).length);return (!t.repeat||t.repeat.type==='never')?!isDone(t,t.date):true;}
/* heat level 0-4 */
function dayLoad(dk,filters=true){const{allDay,timed,anytime}=dayItems(dk,{filters});const c=get.settings().capacity||DEFAULT_SETTINGS.capacity;const wk=[0,6].includes(fromK(dk).getDay())&&c.lightWeekends?.5:1;
  if(c.mode==='hours'){const mins=timed.reduce((n,e)=>n+(e.dur||30),0);return{value:mins/60,level:levelOf(mins/60,(c.hours||8)*wk),allDay};}
  const n=timed.length+anytime.length;return{value:n,level:levelOf(n,(c.full||6)*wk),allDay};}
function levelOf(v,full){if(v<=0)return 0;const r=v/Math.max(full,.5);return r>=1?4:r>=.66?3:r>=.33?2:1;}

/* ---------- small shared UI ---------- */
let toastT,toastAt=0;
function linkText(s){const out=[],re=/(https?:\/\/[^\s]+|www\.[^\s]+)/gi;let last=0,m;s=String(s||'');while((m=re.exec(s))){if(m.index>last)out.push(s.slice(last,m.index));const u=m[0].replace(/[).,;:!?]+$/,'');out.push(el('a',{href:/^www\./i.test(u)?'https://'+u:u,target:'_blank',rel:'noopener',style:'color:var(--accent-text);overflow-wrap:anywhere',onclick:e=>e.stopPropagation()},u));last=m.index+u.length;}if(last<s.length)out.push(s.slice(last));return out;}
function toast(msg,undo,label='Undo'){toastAt=Date.now();const t=$('#toast');t.innerHTML='';t.append(el('span',{},msg));if(undo)t.append(el('button',{onclick:()=>{undo();t.classList.remove('on');}},label));t.classList.add('on');clearTimeout(toastT);toastT=setTimeout(()=>t.classList.remove('on'),undo?4500:2000);}
/* iPhone has no vibrate API; toggling a hidden switch control gives a light system tap (iOS 18+) */
const IOS=/iP(hone|ad|od)/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const iosTap=(()=>{let l=null;return()=>{if(!l){const i=document.createElement('input');i.type='checkbox';i.setAttribute('switch','');i.id='hx-tap';i.tabIndex=-1;i.setAttribute('aria-hidden','true');i.style.display='none';l=document.createElement('label');l.htmlFor='hx-tap';l.style.display='none';l.setAttribute('aria-hidden','true');const stop=e=>e.stopPropagation();i.addEventListener('click',stop);l.addEventListener('click',stop);document.body.append(i,l);}l.click();};})();
const canBuzz=()=>!!navigator.vibrate||IOS;
const buzz=ms=>{if(!get.settings().haptics)return;try{if(navigator.vibrate)navigator.vibrate(ms);else if(IOS)iosTap();}catch(e){}};
function flowTick(btn){const m=get.settings().celebrate;buzz(8);if(m==='off')return;btn.classList.remove('flow');void btn.offsetWidth;btn.classList.add('flow');if(m==='subtle')btn.classList.add('subtle');}
function tickBtn(on,onToggle,label='Mark done'){
  const b=el('button',{class:'tick'+(on?' on':''),'aria-label':on?'Mark not done':label,'aria-pressed':String(!!on),html:ic('check',14,3),onclick:e=>{e.stopPropagation();const nowOn=!b.classList.contains('on');b.classList.toggle('on',nowOn);b.setAttribute('aria-pressed',String(nowOn));const row=b.parentElement;if(row&&row.classList.contains('tick-host'))row.classList.toggle('done',nowOn);if(nowOn)flowTick(b);App.state._flipUntil=Date.now()+1600;onToggle(nowOn);}});
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
  const z=41+sheetStack.length*2;scrim.style.zIndex=z-1;sheet.style.zIndex=z;
  sheet.append(grab);
  let head=null;
  if(title!==undefined&&!raw){
    const lb=el('button',{class:'l',onclick:()=>left&&left.onclick?left.onclick():requestClose()},left?left.label:'Close');
    const rb=right?el('button',{class:'r',disabled:right.disabled,onclick:right.onclick},right.label):el('span');
    head=el('div',{class:'shead'},lb,el('h2',{},title),rb);inst.rightBtn=rb;inst.titleEl=head.children[1];
    sheet.append(head);
  }
  sheet.append(body);
  $('#layers').append(scrim,sheet);
  const pop=anchor&&innerWidth>=900;
  inst.place=()=>{if(!pop)return;const w=380,h=sheet.offsetHeight;sheet.style.left=Math.max(12,Math.min(anchor.left,innerWidth-w-12))+'px';sheet.style.top=Math.max(12,Math.min(anchor.bottom+6,innerHeight-h-12))+'px';};
  if(pop){sheet.classList.add('pop');scrim.classList.add('clear');}
  build&&build(body,inst);inst.place();
  body.addEventListener('scroll',()=>head&&head.classList.toggle('edge',body.scrollTop>0),{passive:true});
  void sheet.offsetWidth;
  requestAnimationFrame(()=>{scrim.classList.add('on');sheet.classList.add('on');});
  scrim.addEventListener('click',()=>requestClose());
  sheetStack.push(inst);lockScroll(true);
  // swipe down to close, from the grab bar or the header
  const dragZone=e=>{if(e.button!=null&&e.button!==0)return;if(e.target.closest('button'))return;const y0=e.clientY;let dy=0,mv,up;sheet.classList.add('nodrag');
    mv=ev=>{dy=Math.max(0,ev.clientY-y0);sheet.style.transform=`translate3d(0,${dy}px,0)`;};
    up=()=>{removeEventListener('pointermove',mv);removeEventListener('pointerup',up);removeEventListener('pointercancel',up);sheet.classList.remove('nodrag');sheet.style.transform='';if(dy>110)requestClose();};
    addEventListener('pointermove',mv);addEventListener('pointerup',up);addEventListener('pointercancel',up);};
  if(innerWidth<900){grab.addEventListener('pointerdown',dragZone);head&&head.addEventListener('pointerdown',dragZone);}
  function requestClose(){if(tryClose&&tryClose()===false)return;close();}
  function close(){const i=sheetStack.indexOf(inst);if(i<0)return;sheetStack.splice(i,1);scrim.classList.remove('on');sheet.classList.remove('on');document.activeElement&&document.activeElement.blur&&document.activeElement.blur();setTimeout(()=>{scrim.remove();sheet.remove();},340);lockScroll(false);onClose&&onClose();App.refresh();setTimeout(()=>{if(opener&&opener.isConnected&&opener.focus&&!(isTouch()&&opener.matches('input,textarea')))opener.focus({preventScroll:true});},30);}
  return inst;
}
let savedY=0,lockN=0;
function lockScroll(on){lockN+=on?1:-1;document.documentElement.classList.toggle('sheet-up',lockN>0);if(on&&lockN===1){savedY=scrollY;document.body.style.cssText=`position:fixed;top:-${savedY}px;left:0;right:0;overflow:hidden`;}else if(!on&&lockN===0){document.body.style.cssText='';scrollTo(0,savedY);}}
document.addEventListener('keydown',e=>{if(e.key==='Tab'&&sheetStack.length&&!$('.confirm.on')){const box=sheetStack[sheetStack.length-1].sheet,f=[...box.querySelectorAll('button,input,textarea,select,[tabindex="0"]')].filter(n=>!n.disabled&&n.offsetParent!==null);if(f.length){const a=document.activeElement,i=f.indexOf(a);if(e.shiftKey&&i<=0){e.preventDefault();f[f.length-1].focus();}else if(!e.shiftKey&&(i<0||i===f.length-1)){e.preventDefault();f[0].focus();}}}});
/* keep sheets above the on-screen keyboard */
function syncViewport(){const v=window.visualViewport,root=document.documentElement;const h=v?v.height:innerHeight;root.style.setProperty('--vvh',h+'px');const kb=Math.max(0,innerHeight-h-(v?v.offsetTop:0));root.style.setProperty('--kb',kb+'px');root.classList.toggle('kb-up',kb>120);}
if(window.visualViewport){visualViewport.addEventListener('resize',syncViewport);visualViewport.addEventListener('scroll',syncViewport);}addEventListener('resize',syncViewport);syncViewport();
/* Inside the app the keyboard covers the page without resizing it, and the phone then pushes the whole sheet up to reveal a low field, taking Cancel and Add with it.
   So when typing starts: give the sheet more height, and bring the field up under the header before the phone needs to move anything. */
document.addEventListener('focusin',e=>{const t=e.target;if(!t.matches||!t.matches('input:not([type=color]):not([type=file]):not([type=date]),textarea'))return;const sh=t.closest('.sheet');if(!sh)return;
  if(!isTouch()){setTimeout(()=>t.scrollIntoView({block:'nearest',behavior:'smooth'}),300);return;}
  sh.classList.add('typing');const b=sh.querySelector('.sbody');if(!b||!sh.classList.contains('full'))return;
  const tr=t.getBoundingClientRect(),rel=tr.top-b.getBoundingClientRect().top;if(rel>12)b.scrollTop+=rel-6;});
/* The phone leaves a field alone only when it sits as high as the Title field; anywhere lower and it shifts the whole page, taking Cancel and Add with it. So any field moves up to that spot first, and only then takes focus. */
let tapMoved=false,tapX=0,tapY=0;
document.addEventListener('touchstart',e=>{const p=e.touches[0];tapMoved=e.touches.length>1;tapX=p.clientX;tapY=p.clientY;},{capture:true,passive:true});
document.addEventListener('touchmove',e=>{const p=e.touches[0];if(Math.hypot(p.clientX-tapX,p.clientY-tapY)>10)tapMoved=true;},{capture:true,passive:true});
document.addEventListener('touchend',e=>{const t=e.target;if(tapMoved||!t.matches||!t.matches('input:not([type=color]):not([type=file]):not([type=date]),textarea')||document.activeElement===t)return;const sh=t.closest('.sheet.full');if(!sh||innerWidth>=900)return;const b=sh.querySelector('.sbody');if(!b)return;const tr=t.getBoundingClientRect(),rel=tr.top-b.getBoundingClientRect().top;if(rel<=12)return;e.preventDefault();sh.classList.add('typing');b.scrollTop+=rel-6;t.focus({preventScroll:true});},{capture:true,passive:false});
document.addEventListener('focusout',e=>{const sh=e.target.closest&&e.target.closest('.sheet');if(!sh||!sh.classList.contains('typing'))return;setTimeout(()=>{const a=document.activeElement;if(!(a&&sh.contains(a)&&a.matches('input,textarea'))&&!sh.querySelector('.drag'))sh.classList.remove('typing');},140);});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const m=$('.menu');if(m){closeMenu();return;}const c=$('.confirm.on');if(c){c._no&&c._no();return;}const s=sheetStack[sheetStack.length-1];if(s)s.requestClose();}});
function askConfirm({title,body,yes='Discard',no='Keep editing',danger=true,alt,alts,onYes}){
  const others=[alt,...(alts||[])].filter(Boolean);
  $('#toast').classList.remove('on');
  const cs=el('div',{class:'cscrim'}),box=el('div',{class:'confirm',role:'alertdialog','aria-label':title});
  const off=()=>{cs.classList.remove('on');box.classList.remove('on');setTimeout(()=>{cs.remove();box.remove();},280);};
  box._no=off;cs.onclick=off;
  box.append(el('div',{class:'box'},el('h3',{},title),body?el('p',{},body):null,el('button',{class:'btn '+(danger?'danger':'primary'),onclick:()=>{off();onYes();}},yes),others.map(a=>el('button',{class:'btn quiet',onclick:()=>{off();a.onclick();}},a.label)),el('button',{class:'btn quiet',onclick:off},no)));
  $('#layers').append(cs,box);void box.offsetWidth;requestAnimationFrame(()=>{cs.classList.add('on');box.classList.add('on');});
}
function closeMenu(){const m=$('.menu'),s=$('.mscrim');m&&m.remove();s&&s.remove();}
function openMenu(x,y,items){
  closeMenu();{const tEl=$('#toast');if(tEl)tEl.classList.remove('on');}/* the lift of the finger that opened the menu must not close it or pick an item, however long it was held */let armed=false;document.addEventListener('pointerdown',()=>{armed=true;},{capture:true,once:true});const stray=e=>e.detail>0&&!armed;const scrim=el('div',{class:'mscrim',onclick:e=>{if(!stray(e))closeMenu();},oncontextmenu:e=>{e.preventDefault();closeMenu();}}),m=el('div',{class:'menu',role:'menu'});m.addEventListener('click',e=>{if(stray(e)){e.stopPropagation();e.preventDefault();}},true);
  items.filter(Boolean).forEach(it=>m.append(el('button',{role:'menuitem',class:it.danger?'danger':'',html:(it.icon?ic(it.icon,18):'')+`<span>${esc(it.label)}</span>`,onclick:()=>{closeMenu();it.onclick();}})));
  document.body.append(scrim,m);const vw=document.documentElement.clientWidth||innerWidth;m.style.left=Math.max(12,Math.min(x,vw-m.offsetWidth-12))+'px';m.style.top=Math.max(8,Math.min(y,innerHeight-m.offsetHeight-8))+'px';const f=m.querySelector('button');f&&f.focus({preventScroll:true});
}
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* press: right-click opens the menu with a mouse, long-press opens it on touch */
let lastPointer='mouse';
addEventListener('pointerdown',e=>{lastPointer=e.pointerType||'mouse';},true);
async function shareText(title,t,msg='Copied'){try{if(navigator.share&&isTouch()){await navigator.share({title,text:t});return;}}catch(e){if(e&&e.name==='AbortError')return;}try{await navigator.clipboard.writeText(t);toast(msg);}catch(e){toast('Copying isn’t available here.');}}
/* a clipped title expands on the first tap, then taps work as usual */
addEventListener('click',e=>{const c=e.target.closest&&e.target.closest('.clip');if(!c||c.classList.contains('unclip')||c.scrollWidth<=c.clientWidth+1)return;c.classList.add('unclip');e.preventDefault();e.stopPropagation();},true);
/* paste several lines into an add box: one item per line */
function pasteLines(e,fn){const t=(e.clipboardData||window.clipboardData)?.getData('text')||'';const ls=t.split(/\r?\n/).map(x=>x.replace(/^\s*(?:[-*•▢☐]|\[[ x]?\]|\d+[.)])\s*/i,'').trim()).filter(Boolean);if(ls.length<2)return;e.preventDefault();fn(ls);}
function onPress(node,fn,skip){
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
function emptyState(title,text,action){return el('div',{class:'empty'},el('b',{},title),text?el('div',{},text):null,action||null);}
/* ---------- smooth transitions ----------
   vt(update,{dir}) runs a DOM update inside a View Transition when the browser has one
   (iOS 18+, Chrome), so the page cross-fades and named parts (the segmented thumb, the
   calendar body) glide instead of jumping. Without support, or with Reduce motion on, it
   just runs the update. */
const motionOK=()=>!document.documentElement.classList.contains('a-motion')&&!(window.matchMedia&&matchMedia('(prefers-reduced-motion: reduce)').matches);
let vtBusy=null;
function vt(update,{dir='',named=null}={}){
  const d=document,root=d.documentElement;
  if(!d.startViewTransition||!motionOK()||vtBusy){update();return null;}
  root.dataset.vtdir=dir;
  const t=d.startViewTransition(()=>{update();if(named)named();});vtBusy=t;
  t.finished.finally(()=>{vtBusy=null;delete root.dataset.vtdir;$$('[data-vtn]').forEach(n=>{n.style.viewTransitionName='';n.removeAttribute('data-vtn');});});
  return t;
}
/* the white thumb is its own element so it can slide between options */
function segThumb(){return el('span',{class:'seg-thumb','aria-hidden':'true'});}
function seg(opts,val,on){
  const root=el('div',{class:'seg',role:'group',onclick:e=>e.stopPropagation()});
  const btns=opts.map(([v,l])=>el('button',{class:val===v?'on':'','aria-pressed':String(val===v),'data-v':String(v),onclick:e=>{e.stopPropagation();
    const from=btns.findIndex(b=>b.classList.contains('on')),to=btns.indexOf(e.currentTarget);if(from===to)return;
    const all=$$('.seg'),idx=all.indexOf(root),old=root.querySelector('.seg-thumb'),r0=old&&old.getBoundingClientRect();
    const tag=(n,nm)=>{if(n){n.style.viewTransitionName=nm;n.setAttribute('data-vtn','');}};
    /* name the thumb and, above it, each label, so the text stays readable while the thumb glides under it */
    const mark=sg=>{if(!sg)return;tag(sg.querySelector('.seg-thumb'),'seg-thumb');$$('.seg-l',sg).forEach((l,i)=>tag(l,'seg-l'+i));};
    const local=()=>{if(!root.isConnected)return;btns.forEach((b,i)=>{b.classList.toggle('on',i===to);b.setAttribute('aria-pressed',String(i===to));});const th=root.querySelector('.seg-thumb')||segThumb();btns[to].prepend(th);return th;};
    if(document.startViewTransition&&motionOK()&&!vtBusy){mark(root);vt(()=>{on(v);local();},{dir:to>from?'fwd':'back',named:()=>{mark(root.isConnected?root:$$('.seg')[idx]);}});return;}
    on(v);const th=local();
    /* fallback: slide the thumb from where it was (FLIP) */
    if(th&&r0&&motionOK()){const r1=th.getBoundingClientRect();th.animate([{transform:`translateX(${r0.left-r1.left}px)`,width:r0.width+'px'},{transform:'none',width:r1.width+'px'}],{duration:280,easing:'cubic-bezier(.3,1.2,.5,1)'});}
  }},val===v?segThumb():null,el('span',{class:'seg-l'},l)));
  root.append(...btns);return root;
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
    if(FILLS_SEEN.has(key)&&target>from){n.classList.add('oglow');n.addEventListener('animationend',()=>n.classList.remove('oglow'),{once:true});}FILLS_SEEN.add(key);
  });
}
/* After a tick, rows glide to their new places instead of jumping */
const flipKey=n=>{const t=n.querySelector('.tt,b');return t?t.textContent:null;};
function flipSnapshot(root){const m=new Map();root.querySelectorAll('.tick-host').forEach(n=>{const key=flipKey(n);if(key)m.set(key,n.getBoundingClientRect().top);});return m;}
function flipPlay(root,before){if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;root.querySelectorAll('.tick-host').forEach(n=>{const key=flipKey(n);if(!key||!n.animate)return;if(!before.has(key)){n.animate([{opacity:0},{opacity:getComputedStyle(n).opacity}],{duration:260,easing:'ease-out'});return;}const d=before.get(key)-n.getBoundingClientRect().top;if(Math.abs(d)>1)n.animate([{transform:`translateY(${d}px)`},{transform:'none'}],{duration:340,easing:'cubic-bezier(.22,.9,.3,1)'});});}
