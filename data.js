/* Data layer shared by the storefront and the admin app.
   Demo mode (default): everything lives in this browser's localStorage, so the store and /admin/ work together on the same device.
   Live mode: fill supabase.url and supabase.anonKey in config.js, then data comes from Supabase. */
(function(){
const cfg=window.SOLENNE||window.VELLOR||{};
const K=cfg.key||'shop',SB=cfg.supabase||{},LIVE=!!(SB.url&&SB.anonKey);
const LS=window.localStorage;
const jget=(k,d)=>{try{const v=JSON.parse(LS.getItem(k));return v==null?d:v}catch(e){return d}};
const jset=(k,v)=>LS.setItem(k,JSON.stringify(v));
const PH='data:image/svg+xml;utf8,'+encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='400' height='500'><rect width='400' height='500' fill='#cfc4b4'/></svg>");
window.IMG_BASE=window.IMG_BASE||'img/';
window.IMG=(b,s)=>!b?PH:/^(https?:|data:|blob:)/.test(b)?b:window.IMG_BASE+b+(s?'-s':'')+'.webp';
const DB={live:LIVE,mode:LIVE?'live':'demo',key:K,cfg};
window.DB=DB;
const sess=()=>jget(K+'_sb',null);
/* ---------- helpers ---------- */
const fromRow=r=>({id:r.id,cat:r.cat,name:r.name,en:r.en||'',desc:r.descr||'',price:r.price,img:r.img||{},sizes:r.sizes||[],stock:r.stock,featured:!!r.featured,badge:r.badge||'',active:r.active!==false,sort:r.sort||0,updated:r.updated});
const toRow=p=>({id:p.id,cat:p.cat,name:p.name,en:p.en||'',descr:p.desc||'',price:+p.price||0,img:p.img||{},sizes:p.sizes||[],stock:p.stock==null||p.stock===''?null:+p.stock,featured:!!p.featured,badge:p.badge||'',active:p.active!==false,sort:p.sort||0,updated:new Date().toISOString()});
/* ---------- live backend ---------- */
async function auth(path,body){
  const r=await fetch(SB.url+'/auth/v1/'+path,{method:'POST',headers:{apikey:SB.anonKey,'Content-Type':'application/json'},body:JSON.stringify(body)});
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error_description||j.msg||j.message||'فشل الدخول');return j;
}
function saveSession(j){const s={access_token:j.access_token,refresh_token:j.refresh_token,expires_at:Math.floor(Date.now()/1000)+(j.expires_in||3600),email:(j.user&&j.user.email)||(sess()||{}).email};jset(K+'_sb',s);return s}
async function token(){
  let s=sess();if(!s)return null;
  if(s.expires_at-60<Date.now()/1000){try{s=saveSession(await auth('token?grant_type=refresh_token',{refresh_token:s.refresh_token}))}catch(e){LS.removeItem(K+'_sb');return null}}
  return s.access_token;
}
async function rest(path,o){
  o=o||{};const t=o.auth?await token():null;
  if(o.auth&&!t)throw new Error('AUTH');
  const h={apikey:SB.anonKey,Authorization:'Bearer '+(t||SB.anonKey),'Content-Type':'application/json'};if(o.prefer)h.Prefer=o.prefer;
  const r=await fetch(SB.url+'/rest/v1/'+path,{method:o.method||'GET',headers:h,body:o.body?JSON.stringify(o.body):undefined,keepalive:!!o.keepalive});
  if(r.status===401||r.status===403){if(o.auth)throw new Error('AUTH')}
  if(!r.ok)throw new Error(await r.text());
  if(r.status===204)return null;const tx=await r.text();return tx?JSON.parse(tx):null;
}
/* ---------- demo backend ---------- */
const dkey=K+'_db';
const demo=()=>jget(dkey,null);
function seedDemo(){
  let d=demo();if(d)return d;
  d={products:(window.PRODUCTS||[]).map((p,i)=>Object.assign({active:true,stock:p.stock==null?[12,8,5,20,3,0,15,9][i%8]+(i%7):p.stock,sort:i},p)),cats:(window.CATS||[]).map((c,i)=>({id:c.id,name:c.name,sort:i})),orders:[],settings:{}};
  jset(dkey,d);return d;
}
const save=d=>{jset(dkey,d);try{window.dispatchEvent(new Event('dbchange'))}catch(e){}};
/* ---------- public API ---------- */
DB.isAuthed=()=>!LIVE||!!sess();
DB.user=()=>LIVE?(sess()||{}).email:'demo';
DB.login=async(email,pw)=>{saveSession(await auth('token?grant_type=password',{email,password:pw}))};
DB.logout=()=>LS.removeItem(K+'_sb');
DB.resetDemo=()=>LS.removeItem(dkey);
DB.exportAll=async()=>({products:await DB.products(true),cats:await DB.cats(),orders:await DB.orders(),settings:await DB.settings()});
DB.products=async(all)=>{
  if(LIVE){const rows=await rest('products?select=*&order=sort.asc,updated.desc'+(all?'':'&active=eq.true'),{auth:all});return rows.map(fromRow)}
  const d=seedDemo();return d.products.filter(p=>all||p.active!==false).sort((a,b)=>(a.sort||0)-(b.sort||0));
};
DB.saveProduct=async p=>{
  if(LIVE){await rest('products?on_conflict=id',{method:'POST',auth:true,prefer:'resolution=merge-duplicates,return=minimal',body:toRow(p)});return}
  const d=seedDemo();const i=d.products.findIndex(x=>x.id===p.id);
  if(i<0){p.sort=Math.min(0,...d.products.map(x=>x.sort||0))-1;d.products.push(p)}else d.products[i]=Object.assign({},d.products[i],p);save(d);
};
DB.deleteProduct=async id=>{
  if(LIVE){await rest('products?id=eq.'+encodeURIComponent(id),{method:'DELETE',auth:true});return}
  const d=seedDemo();d.products=d.products.filter(p=>p.id!==id);save(d);
};
DB.cats=async()=>{
  if(LIVE)return (await rest('categories?select=*&order=sort.asc')).map(c=>({id:c.id,name:c.name,sort:c.sort}));
  return seedDemo().cats.slice().sort((a,b)=>a.sort-b.sort);
};
DB.saveCat=async c=>{
  if(LIVE){await rest('categories?on_conflict=id',{method:'POST',auth:true,prefer:'resolution=merge-duplicates,return=minimal',body:c});return}
  const d=seedDemo();const i=d.cats.findIndex(x=>x.id===c.id);i<0?d.cats.push(c):d.cats[i]=c;save(d);
};
DB.deleteCat=async id=>{
  if(LIVE){await rest('categories?id=eq.'+encodeURIComponent(id),{method:'DELETE',auth:true});return}
  const d=seedDemo();d.cats=d.cats.filter(c=>c.id!==id);save(d);
};
DB.settings=async()=>{
  if(LIVE){const rows=await rest('settings?select=*');const o={};(rows||[]).forEach(r=>o[r.key]=r.value);return o}
  return seedDemo().settings||{};
};
DB.saveSettings=async o=>{
  if(LIVE){await rest('settings?on_conflict=key',{method:'POST',auth:true,prefer:'resolution=merge-duplicates,return=minimal',body:Object.keys(o).map(k=>({key:k,value:o[k]}))});return}
  const d=seedDemo();d.settings=Object.assign(d.settings||{},o);save(d);
};
DB.orders=async()=>{
  if(LIVE)return rest('orders?select=*&order=created.desc&limit=500',{auth:true});
  return seedDemo().orders.slice().sort((a,b)=>b.created.localeCompare(a.created));
};
DB.addOrder=o=>{
  o.status='new';o.created=new Date().toISOString();
  if(LIVE){return rest('orders',{method:'POST',prefer:'return=minimal',keepalive:true,body:{ref:o.ref,status:'new',name:o.name,phone:o.phone,gov:o.gov,addr:o.addr,pay:o.pay,items:o.items,sub:o.sub,ship:o.ship,total:o.total,note:o.note||''}}).catch(e=>console.warn('order save failed',e))}
  const d=seedDemo();o.id='o'+Date.now().toString(36);d.orders.push(o);
  o.items.forEach(it=>{const p=d.products.find(x=>x.id===it.id);if(p&&p.stock!=null)p.stock=Math.max(0,p.stock-it.q)});save(d);return Promise.resolve();
};
DB.updateOrder=async(id,patch)=>{
  if(LIVE){await rest('orders?id=eq.'+encodeURIComponent(id),{method:'PATCH',auth:true,prefer:'return=minimal',body:patch});return}
  const d=seedDemo();const o=d.orders.find(x=>x.id===id);if(o){if(patch.status==='cancelled'&&o.status!=='cancelled')(o.items||[]).forEach(it=>{const p=d.products.find(x=>x.id===it.id);if(p&&p.stock!=null)p.stock+=it.q});Object.assign(o,patch)}save(d);
};
DB.deleteOrder=async id=>{
  if(LIVE){await rest('orders?id=eq.'+encodeURIComponent(id),{method:'DELETE',auth:true});return}
  const d=seedDemo();d.orders=d.orders.filter(o=>o.id!==id);save(d);
};
DB.uploadImage=async(blob,name)=>{
  if(LIVE){
    const t=await token();if(!t)throw new Error('AUTH');
    const path=name+'-'+Date.now().toString(36)+'.jpg';
    const r=await fetch(SB.url+'/storage/v1/object/products/'+path,{method:'POST',headers:{apikey:SB.anonKey,Authorization:'Bearer '+t,'Content-Type':'image/jpeg','x-upsert':'true'},body:blob});
    if(!r.ok)throw new Error(await r.text());return SB.url+'/storage/v1/object/public/products/'+path;
  }
  return new Promise(res=>{const fr=new FileReader();fr.onload=()=>res(fr.result);fr.readAsDataURL(blob)});
};
/* ---------- storefront boot ---------- */
DB.loadPublic=async()=>{
  if(LIVE){
    const [p,c,s]=await Promise.all([DB.products(false),DB.cats(),DB.settings()]);
    if(p.length){window.PRODUCTS=p;window.CATS=c}
    Object.assign(cfg,s);return;
  }
  const d=demo();if(!d)return;
  window.PRODUCTS=d.products.filter(p=>p.active!==false).sort((a,b)=>(a.sort||0)-(b.sort||0));window.CATS=d.cats.slice().sort((a,b)=>a.sort-b.sort);Object.assign(cfg,d.settings||{});
};
const me=document.currentScript,nxt=((me&&me.dataset&&me.dataset.next)||'').split(',').filter(Boolean);
if(nxt.length){
  const run=async()=>{
    try{await Promise.race([DB.loadPublic(),new Promise(r=>setTimeout(r,4500))])}catch(e){console.warn(e)}
    for(const s of nxt){await new Promise(r=>{const e=document.createElement('script');e.src=s;e.onload=e.onerror=r;document.body.appendChild(e)})}
  };
  run();
}
})();
