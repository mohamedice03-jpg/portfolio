/* extras.js: header search + hidden admin panel for the portfolio.
   Add before </body>, after the existing script:  <script src="extras.js"></script> */
(function(){
'use strict';
const $=(s,c=document)=>c.querySelector(s), $$=(s,c=document)=>[...c.querySelectorAll(s)];
const SECRET_HASH='6e6fcc717fe712edef8cb12da3b1e9269b5071ba9992881131745139b38de260'; /* SHA-256 of the secret search keyword */
const SEED={skills:[{id:'g1',name:'Data analyst skills',items:['Power BI','AI']}],projects:[]};
const uid=()=>Math.random().toString(36).slice(2,9);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const sha=async t=>[...new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(t)))].map(x=>x.toString(16).padStart(2,'0')).join('');

/* ---------- storage (IndexedDB, so photos/videos fit) ---------- */
const db=new Promise(res=>{try{const r=indexedDB.open('portfolio-admin',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>res(null)}catch(e){res(null)}});
const kvGet=async k=>{const d=await db;if(!d)return null;return new Promise(r=>{const q=d.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>r(q.result??null);q.onerror=()=>r(null)})};
const kvSet=async(k,v)=>{const d=await db;if(!d)return;return new Promise(r=>{const t=d.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=()=>r();t.onerror=()=>r()})};
let data=JSON.parse(JSON.stringify(SEED));
async function load(){
  let d=await kvGet('data');
  if(!d){try{const r=await fetch('portfolio-data.json',{cache:'no-cache'});if(r.ok)d=await r.json()}catch(e){}}
  data=(d&&d.skills&&d.projects)?d:JSON.parse(JSON.stringify(SEED));
}
const save=()=>kvSet('data',data);
const urls=new WeakMap();
const mUrl=m=>m.blob?(urls.get(m)||(urls.set(m,URL.createObjectURL(m.blob)),urls.get(m))):m.src;

/* ---------- styles ---------- */
const st=document.createElement('style');
st.textContent=`
.xbtn{background:none;border:1px solid var(--line);border-radius:50%;width:40px;height:40px;display:grid;place-items:center;margin-left:14px;transition:border-color .2s,transform .2s}
.xbtn:hover{border-color:var(--red);transform:scale(1.08)}.xbtn svg{width:18px;height:18px}
.xs,.xad,.xlb{position:fixed;inset:0;display:none}
.xs.open,.xad.open{display:block}
.xs{z-index:160;background:rgba(5,5,5,.92);backdrop-filter:blur(8px);padding:90px 20px;overflow:auto}
.xs-box{max-width:640px;margin:0 auto}
.xs input,.xad input,.xad textarea{width:100%;background:#0e0e0e;border:1px solid var(--line);border-radius:8px;color:var(--ink);font:inherit;padding:13px 15px}
.xs input{font-size:1.2rem}
.xs input:focus,.xad input:focus,.xad textarea:focus{outline:none;border-color:var(--red)}
#xsr button{display:block;width:100%;text-align:left;background:none;border:0;border-bottom:1px solid var(--line);padding:14px 4px;color:var(--ink)}
#xsr button:hover{background:rgba(224,40,28,.1)}
#xsr small{display:block;font:11px var(--mono);letter-spacing:.14em;text-transform:uppercase;color:var(--red-soft)}
#xsr p{color:var(--muted);padding:14px 4px}
.s-hit{outline:2px solid var(--red);outline-offset:6px;border-radius:6px}
.xad{z-index:170;background:var(--bg);overflow:auto;padding-bottom:60px}
.xad-top{position:sticky;top:0;z-index:2;background:rgba(10,10,10,.96);border-bottom:1px solid var(--line);display:flex;gap:8px;align-items:center;padding:14px 24px;flex-wrap:wrap}
.xad-top b{font-family:var(--display);font-weight:400;font-size:1.5rem;margin-right:auto;text-transform:uppercase}
.xb{padding:9px 16px;border:1px solid var(--line);border-radius:6px;background:none;font-weight:600;font-size:13px;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap}
.xb:hover,.xb.on{border-color:var(--red)}.xb.red{background:var(--red);border-color:var(--red)}
.xad-in{max-width:820px;margin:0 auto;padding:28px 24px}
.xc{border:1px solid var(--line);background:var(--surface);border-radius:14px;padding:18px;margin-bottom:16px}
.xr{display:flex;gap:10px;margin-top:12px;align-items:center}
.xad .pills{margin-top:12px}.xad .pills span button{background:none;border:0;color:var(--red-soft);margin-left:6px;font-size:16px}
.xad label{display:block;font:12px var(--mono);letter-spacing:.12em;text-transform:uppercase;color:var(--muted);margin:16px 0 6px}
.xad h3{margin-bottom:4px}.xad .note{color:var(--muted);font-size:.92rem}
.xad textarea{min-height:130px;resize:vertical}
.xgrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:24px;margin-top:36px}
.mproj{background:var(--surface);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;transition:border-color .3s,box-shadow .3s}
.mproj:hover{border-color:var(--red);box-shadow:0 16px 46px rgba(224,40,28,.2)}
.xmedia{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;background:#000;aspect-ratio:16/9}
.xmedia>*{flex:0 0 100%;scroll-snap-align:start;width:100%;height:100%;object-fit:cover}
.xmedia img{cursor:zoom-in}
.mproj .card-body{padding:16px 20px 20px}.mproj h3{font-size:1.12rem;margin-bottom:6px}
.mproj p{color:var(--muted);font-size:.93rem;white-space:pre-line;margin-bottom:12px}
.xlb{z-index:180;background:rgba(0,0,0,.92);align-items:center;justify-content:center;padding:20px}
.xlb.open{display:flex}.xlb img{max-width:100%;max-height:90vh;border-radius:10px}`;
document.head.appendChild(st);

/* ---------- public rendering (new skills + projects) ---------- */
function renderPublic(){
  $$('.x-skill').forEach(e=>e.remove());
  const cols=$('#skills .skillcols');
  if(cols)data.skills.forEach(g=>{const d=document.createElement('div');d.className='skillbox x-skill';
    d.innerHTML=`<h3>${esc(g.name)}</h3><div class="pills">${g.items.map(i=>`<span>${esc(i)}</span>`).join('')}</div>`;
    cols.insertBefore(d,cols.children[3]||null)});
  let sec=$('#x-work');
  if(!data.projects.length){if(sec)sec.remove();return}
  if(!sec){sec=document.createElement('section');sec.id='x-work';
    sec.innerHTML='<div class="wrap"><div class="eyebrow">More work</div><h2 class="title">Data &amp; <em>analytics</em></h2><div class="xgrid"></div></div>';
    $('#results').before(sec)}
  $('.xgrid',sec).innerHTML=data.projects.map(p=>`<article class="mproj">
    ${p.media.length?`<div class="xmedia">${p.media.map(m=>m.type==='video'?`<video src="${esc(mUrl(m))}" controls playsinline preload="metadata"></video>`:`<img src="${esc(mUrl(m))}" alt="${esc(p.title)}" loading="lazy">`).join('')}</div>`:''}
    <div class="card-body"><h3>${esc(p.title)}</h3>${p.details?`<p>${esc(p.details)}</p>`:''}
    <div class="chips">${p.tags.map(t=>`<span>${esc(t)}</span>`).join('')}</div></div></article>`).join('');
}

/* ---------- search ---------- */
const hb=$('.bar');
const sb=document.createElement('button');sb.className='xbtn';sb.setAttribute('aria-label','Search');
sb.innerHTML='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>';
hb.insertBefore(sb,$('#burger'));
const xs=document.createElement('div');xs.className='xs';xs.setAttribute('data-lenis-prevent','');
xs.innerHTML='<div class="xs-box"><input id="xsq" type="search" placeholder="Search the portfolio…" autocomplete="off"><div id="xsr"></div></div>';
document.body.appendChild(xs);
const SECS={hero:'Home',projects:'Projects',results:'Results',process:'Process',experience:'Experience',skills:'Skills',contact:'Contact','x-work':'More work'};
const SEL='.card,.job,.side-item,.res-row,.tl-step,.pills span,.intro,.tag,.lead,.mproj,.role';
let hits=[];
function snip(e,q){const t=e.textContent.replace(/\s+/g,' ').trim(),i=Math.max(0,t.toLowerCase().indexOf(q)-30);return(i?'…':'')+t.slice(i,i+90)}
function runSearch(q){
  q=q.trim().toLowerCase();const box=$('#xsr');
  if(q.length<2){box.innerHTML='';hits=[];return}
  hits=$$(SEL).filter(e=>!e.closest('.xs,.xad')&&e.textContent.toLowerCase().includes(q)).slice(0,8);
  box.innerHTML=hits.length?hits.map((e,i)=>`<button data-i="${i}"><small>${esc(SECS[(e.closest('section')||{}).id]||'Page')}</small>${esc(snip(e,q))}</button>`).join(''):'<p>No matches.</p>';
}
function openSearch(){xs.classList.add('open');$('#xsq').focus()}
function closeSearch(){xs.classList.remove('open');$('#xsq').value='';$('#xsr').innerHTML='';hits=[]}
function go(e){
  closeSearch();const s=e.closest('section');const t=(s&&s.id==='projects')?s:e;
  setTimeout(()=>{t.scrollIntoView({block:t===s?'start':'center'});e.classList.add('s-hit');setTimeout(()=>e.classList.remove('s-hit'),2200)},60);
}
sb.addEventListener('click',openSearch);
$('#xsq').addEventListener('input',e=>runSearch(e.target.value));
$('#xsq').addEventListener('keydown',async e=>{
  if(e.key!=='Enter')return;
  const q=e.target.value.trim().toLowerCase();if(!q)return;
  try{if(await sha(q)===SECRET_HASH){closeSearch();openAdmin();return}}catch(_){}
  if(hits[0])go(hits[0]);
});
$('#xsr').addEventListener('click',e=>{const b=e.target.closest('button');if(b)go(hits[+b.dataset.i])});
xs.addEventListener('click',e=>{if(e.target===xs)closeSearch()});

/* ---------- image lightbox ---------- */
const lb=document.createElement('div');lb.className='xlb';lb.innerHTML='<img alt="">';document.body.appendChild(lb);
lb.addEventListener('click',()=>lb.classList.remove('open'));
document.addEventListener('click',e=>{const i=e.target.closest('.xmedia img');if(i){$('img',lb).src=i.src;lb.classList.add('open')}});

/* ---------- admin ---------- */
const xad=document.createElement('div');xad.className='xad';xad.setAttribute('data-lenis-prevent','');document.body.appendChild(xad);
let tab='skills',editId=null,draftMedia=[];
const commit=()=>{save();renderPublic();adminRender()};
function openAdmin(){tab='skills';editId=null;draftMedia=[];adminRender();xad.classList.add('open');document.body.style.overflow='hidden'}
function closeAdmin(){xad.classList.remove('open');document.body.style.overflow=''}
function renderPm(){const b=$('#pm');if(b)b.innerHTML=draftMedia.map((m,i)=>`<span>${esc(m.name)} (${m.type}) <button data-act="pmdel" data-n="${i}">×</button></span>`).join('')}
function adminRender(){
  xad.innerHTML=`<div class="xad-top"><b>Admin</b>${['skills','projects','publish'].map(t=>`<button class="xb ${tab===t?'on':''}" data-tab="${t}">${t}</button>`).join('')}<button class="xb" data-act="close">Close</button></div><div class="xad-in" id="xin"></div>`;
  const c=$('#xin');
  if(tab==='skills'){
    c.innerHTML=data.skills.map(g=>`<div class="xc" data-g="${g.id}"><div class="xr"><input class="gname" value="${esc(g.name)}" aria-label="Group name"><button class="xb" data-act="delg">Delete group</button></div>
      <div class="pills">${g.items.map((i,n)=>`<span>${esc(i)}<button data-act="deli" data-n="${n}">×</button></span>`).join('')}</div>
      <div class="xr"><input class="newi" placeholder="Add a skill, e.g. Power BI"><button class="xb red" data-act="addi">Add</button></div></div>`).join('')+
      `<div class="xc"><h3>New skill group</h3><div class="xr"><input id="newg" placeholder="e.g. BI tools"><button class="xb red" data-act="addg">Create</button></div></div>`;
  }else if(tab==='projects'){
    const p=editId?data.projects.find(x=>x.id===editId):{title:'',details:'',tags:[]};
    c.innerHTML=`<div class="xc"><h3>${editId?'Edit project':'Add a project'}</h3>
      <label>Title</label><input id="pt" value="${esc(p.title)}">
      <label>Details</label><textarea id="pd">${esc(p.details)}</textarea>
      <label>Tags (comma separated)</label><input id="pg" value="${esc(p.tags.join(', '))}" placeholder="Power BI, DAX, Dashboard">
      <label>Photos or videos</label><input id="pf" type="file" accept="image/*,video/*" multiple>
      <div class="pills" id="pm"></div>
      <div class="xr"><button class="xb red" data-act="psave">${editId?'Save changes':'Add project'}</button>${editId?'<button class="xb" data-act="pcancel">Cancel</button>':''}</div></div>`+
      data.projects.map(q=>`<div class="xc" data-p="${q.id}"><div class="xr"><b style="margin-right:auto">${esc(q.title)} <span class="note">· ${q.media.length} file(s)</span></b><button class="xb" data-act="pedit">Edit</button><button class="xb" data-act="pdel">Delete</button></div></div>`).join('');
    renderPm();
  }else{
    c.innerHTML=`<div class="xc"><h3>Publish your changes</h3>
      <p class="note">Everything you add here is saved in this browser only, so visitors cannot see it yet. To put it live, download the package, unzip it into your website folder (next to index.html) and upload. It contains <b>portfolio-data.json</b> and an <b>uploads</b> folder.</p>
      <div class="xr"><button class="xb red" data-act="export">Download package (.zip)</button></div></div>
      <div class="xc"><h3>Reset</h3><p class="note">Clears what is saved in this browser and goes back to the published version.</p><div class="xr"><button class="xb" data-act="reset">Reset local changes</button></div></div>`;
  }
}
xad.addEventListener('change',e=>{
  if(e.target.classList.contains('gname')){const g=data.skills.find(x=>x.id===e.target.closest('[data-g]').dataset.g);g.name=e.target.value.trim()||g.name;save();renderPublic()}
  if(e.target.id==='pf'){for(const f of e.target.files)draftMedia.push({type:f.type.startsWith('video')?'video':'image',name:f.name,blob:f});e.target.value='';renderPm()}
});
xad.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches('.newi,#newg')){e.preventDefault();e.target.closest('.xr').querySelector('button').click()}});
xad.addEventListener('click',async e=>{
  const t=e.target.closest('[data-tab]');if(t){tab=t.dataset.tab;editId=null;draftMedia=[];adminRender();return}
  const b=e.target.closest('[data-act]');if(!b)return;
  const a=b.dataset.act,gc=b.closest('[data-g]'),g=gc&&data.skills.find(x=>x.id===gc.dataset.g),pc=b.closest('[data-p]');
  if(a==='close')closeAdmin();
  else if(a==='addg'){const v=$('#newg').value.trim();if(v){data.skills.push({id:uid(),name:v,items:[]});commit()}}
  else if(a==='delg'){if(confirm('Delete this group?')){data.skills=data.skills.filter(x=>x!==g);commit()}}
  else if(a==='addi'){const v=$('.newi',gc).value.trim();if(v){g.items.push(v);commit()}}
  else if(a==='deli'){g.items.splice(+b.dataset.n,1);commit()}
  else if(a==='pmdel'){draftMedia.splice(+b.dataset.n,1);renderPm()}
  else if(a==='psave'){
    const title=$('#pt').value.trim();if(!title){alert('Please add a title.');return}
    const p={id:editId||uid(),title,details:$('#pd').value.trim(),tags:$('#pg').value.split(',').map(s=>s.trim()).filter(Boolean),media:draftMedia};
    if(editId)data.projects[data.projects.findIndex(x=>x.id===editId)]=p;else data.projects.push(p);
    editId=null;draftMedia=[];commit();
  }
  else if(a==='pcancel'){editId=null;draftMedia=[];adminRender()}
  else if(a==='pedit'){editId=pc.dataset.p;draftMedia=[...data.projects.find(x=>x.id===editId).media];adminRender();window.scrollTo(0,0);xad.scrollTo(0,0)}
  else if(a==='pdel'){if(confirm('Delete this project?')){data.projects=data.projects.filter(x=>x.id!==pc.dataset.p);commit()}}
  else if(a==='reset'){if(confirm('Discard local changes?')){await kvSet('data',null);await load();renderPublic();adminRender()}}
  else if(a==='export'){b.textContent='Preparing…';await exportZip();b.textContent='Download package (.zip)'}
});
function loadScript(src){return new Promise((ok,no)=>{const s=document.createElement('script');s.src=src;s.onload=ok;s.onerror=no;document.head.appendChild(s)})}
async function exportZip(){
  if(!window.JSZip)await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
  const z=new JSZip(),out={skills:data.skills,projects:[]};
  for(const p of data.projects){
    const q={id:p.id,title:p.title,details:p.details,tags:p.tags,media:[]};
    for(const m of p.media){
      if(m.blob){const ext=(m.name.split('.').pop()||'bin').toLowerCase().replace(/[^a-z0-9]/g,'');const path=`uploads/${p.id}-${uid()}.${ext}`;z.file(path,m.blob);q.media.push({type:m.type,name:m.name,src:path})}
      else q.media.push({type:m.type,name:m.name,src:m.src});
    }
    out.projects.push(q);
  }
  z.file('portfolio-data.json',JSON.stringify(out,null,2));
  const a=document.createElement('a');a.href=URL.createObjectURL(await z.generateAsync({type:'blob'}));a.download='portfolio-update.zip';a.click();
}

addEventListener('keydown',e=>{if(e.key==='Escape'){closeSearch();closeAdmin();lb.classList.remove('open')}});
load().then(renderPublic);
})();
