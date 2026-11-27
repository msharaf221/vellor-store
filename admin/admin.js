(function(){
const cfg=window.SOLENNE||window.VELLOR,DB=window.DB,K=cfg.key,LS=localStorage;
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const E=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const ar=n=>String(n).replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]);
const fmt=n=>(+n||0).toLocaleString('ar-EG')+' ج.م';
const ST={new:'جديد',confirmed:'مؤكد',shipped:'اتشحن',delivered:'اتسلم',cancelled:'ملغي'};
const NEXT={new:'confirmed',confirmed:'shipped',shipped:'delivered'};
const NEXTL={new:'تأكيد الطلب',confirmed:'تم الشحن',shipped:'تم التسليم'};
const S={products:[],cats:[],orders:[],settings:{},tab:'dash',of:'all',oq:'',pq:'',pc:'all'};
document.body.dataset.brand=K;
const brandName=cfg.brand||K.charAt(0).toUpperCase()+K.slice(1);
document.title=brandName+' | لوحة التحكم';
const ICON={
 dash:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/></svg>',
 orders:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M5 8h14l-1.2 11H6.2L5 8z"/><path d="M9 8V6a3 3 0 016 0v2"/></svg>',
 products:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M3 17c0-2 1-3 3-3l4-1 3 2h4c2 0 4 1 4 3v1H3v-2z"/><path d="M6 14V8"/></svg>',
 more:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/></svg>'};
const TABS=[['dash','الرئيسية'],['orders','الطلبات'],['products','المنتجات'],['more','المزيد']];
const TITLES={dash:'الرئيسية',orders:'الطلبات',products:'المنتجات',more:'المزيد'};
const first=p=>{const v=Object.values(p.img||{});return v[0]};
const thumb=p=>`<div class="th"><img src="${E(window.IMG(first(p),1))}" alt="" loading="lazy"></div>`;
const toast=(m)=>{const t=document.createElement('div');t.className='toast';t.textContent=m;document.body.appendChild(t);setTimeout(()=>t.remove(),3200)};
const day0=d=>{const x=new Date(d);x.setHours(0,0,0,0);return x.getTime()};
function ago(iso){const s=(Date.now()-new Date(iso))/1000;if(s<60)return 'دلوقتي';if(s<3600)return 'من '+ar(Math.floor(s/60))+' د';if(s<86400)return 'من '+ar(Math.floor(s/3600))+' س';return new Date(iso).toLocaleDateString('ar-EG',{day:'numeric',month:'short'})}
const waLink=ph=>{let d=String(ph||'').replace(/\D/g,'');if(d.startsWith('0'))d='20'+d.slice(1);return 'https://wa.me/'+d};
/* ---------- load ---------- */
async function load(){
  try{
    const r=await Promise.all([DB.products(true),DB.cats(),DB.orders(),DB.settings()]);
    [S.products,S.cats,S.orders,S.settings]=r;
  }catch(e){if(e.message==='AUTH'){DB.logout();return showLogin()}toast('تعذر التحميل: '+String(e.message).slice(0,80))}
}
/* ---------- login ---------- */
function showLogin(msg){
  $('#app').innerHTML=`<div class="login"><div class="brand">${E(brandName.toUpperCase())}</div><p>لوحة التحكم</p>
  <form class="f" id="lf"><label>الإيميل</label><input name="e" type="email" autocomplete="username" required><label>كلمة السر</label><input name="p" type="password" autocomplete="current-password" required>
  <p class="err" id="le">${E(msg||'')}</p><button class="btn block" type="submit">دخول</button></form></div>`;
  $('#lf').onsubmit=async e=>{e.preventDefault();const f=e.target;$('#le').textContent='';
    try{await DB.login(f.e.value.trim(),f.p.value);await start()}catch(x){$('#le').textContent='الإيميل أو كلمة السر غلط'}};
}
/* ---------- shell ---------- */
function shell(){
  $('#app').innerHTML=`<header class="bar"><span class="brand">${E(brandName.toUpperCase())}</span><h1 id="ttl"></h1><span class="chip ${DB.live?'live':''}">${DB.live?'متصل':'وضع تجريبي'}</span></header>
  <main id="view"></main><button class="fab" id="fab" hidden aria-label="إضافة">+</button>
  <nav class="tab">${TABS.map(([k,l])=>`<button data-t="${k}">${ICON[k]}<span>${l}</span>${k==='orders'?'<i class="bdg" id="bdg" hidden></i>':''}</button>`).join('')}</nav><div id="layer"></div>`;
  $('nav.tab').onclick=e=>{const b=e.target.closest('button');if(b){S.tab=b.dataset.t;view();scrollTo(0,0)}};
  $('#fab').onclick=()=>editProduct();
}
function badge(){
  const n=S.orders.filter(o=>o.status==='new').length;const b=$('#bdg');
  if(b){b.hidden=!n;b.textContent=ar(n)}
  document.title=(n?'('+ar(n)+') ':'')+brandName+' | لوحة التحكم';
  try{n?navigator.setAppBadge&&navigator.setAppBadge(n):navigator.clearAppBadge&&navigator.clearAppBadge()}catch(e){}
}
function view(){
  $$('nav.tab button').forEach(b=>b.classList.toggle('on',b.dataset.t===S.tab));
  $('#ttl').textContent=TITLES[S.tab];$('#fab').hidden=S.tab!=='products';
  $('#view').innerHTML=({dash:vDash,orders:vOrders,products:vProducts,more:vMore})[S.tab]();
  badge();
}
const refresh=async()=>{await load();if($('#view'))view()};
/* ---------- dashboard ---------- */
function vDash(){
  const O=S.orders,now=Date.now(),t0=day0(now),m0=new Date(new Date().getFullYear(),new Date().getMonth(),1).getTime();
  const nn=O.filter(o=>o.status==='new').length,today=O.filter(o=>new Date(o.created)>=t0).length;
  const sales=O.filter(o=>o.status!=='cancelled'&&new Date(o.created)>=m0).reduce((a,o)=>a+(+o.total||0),0);
  const low=S.products.filter(p=>p.stock!=null&&p.stock<=3);
  const days=[...Array(7)].map((_,i)=>{const d=t0-(6-i)*864e5;return{d,n:O.filter(o=>{const c=new Date(o.created).getTime();return c>=d&&c<d+864e5}).length}});
  const mx=Math.max(1,...days.map(x=>x.n));
  return `<div class="stats"><div class="card stat ${nn?'hot':''}"><b>${ar(nn)}</b><span>طلبات جديدة</span></div><div class="card stat"><b>${ar(today)}</b><span>طلبات النهارده</span></div>
  <div class="card stat"><b>${fmt(sales)}</b><span>مبيعات الشهر</span></div><div class="card stat"><b>${ar(low.length)}</b><span>منتجات قربت تخلص</span></div></div>
  <div class="h2">آخر ٧ أيام</div><div class="card chart">${days.map(x=>`<div><span>${ar(x.n)}</span><i style="height:${Math.max(3,x.n/mx*70)}px"></i><span>${new Date(x.d).toLocaleDateString('ar-EG',{weekday:'short'})}</span></div>`).join('')}</div>
  <div class="h2">آخر الطلبات <small><a href="#" data-go="orders">عرض الكل</a></small></div><div class="list two">${O.slice(0,5).map(orderRow).join('')||'<p class="empty">مفيش طلبات لسه</p>'}</div>
  ${low.length?`<div class="h2">قربت تخلص</div><div class="list two">${low.slice(0,6).map(p=>prodRow(p,true)).join('')}</div>`:''}
  ${DB.live?'':'<div class="h2">جرّب التنبيهات</div><div class="card box"><p class="note" style="margin:0 0 10px">في الوضع التجريبي تقدر تعمل طلب وهمي تشوف إزاي بيوصلك تنبيه.</p><button class="btn acc" data-act="fake">اعمل طلب تجريبي</button></div>'}`;
}
/* ---------- orders ---------- */
const orderRow=o=>`<button class="row" data-act="order" data-id="${E(o.id)}"><div class="mid"><b>${E(o.name)} <small>#${E(o.ref||'')}</small></b><small>${E(o.gov||'')} · ${ar((o.items||[]).reduce((a,i)=>a+i.q,0))} قطع · ${ago(o.created)}</small></div><div class="end"><span class="pill ${o.status}">${ST[o.status]}</span><div>${fmt(o.total)}</div></div></button>`;
function vOrders(){
  const cnt=k=>k==='all'?S.orders.length:S.orders.filter(o=>o.status===k).length;
  const q=S.oq.trim().toLowerCase();
  const L=S.orders.filter(o=>(S.of==='all'||o.status===S.of)&&(!q||(o.name+' '+o.phone+' '+o.ref).toLowerCase().includes(q)));
  return `<div class="tabs">${['all','new','confirmed','shipped','delivered','cancelled'].map(k=>`<button data-of="${k}" class="${S.of===k?'on':''}">${k==='all'?'الكل':ST[k]}<small>${ar(cnt(k))}</small></button>`).join('')}</div>
  <div class="tools"><input id="oq" type="search" placeholder="ابحث بالاسم أو الموبايل أو رقم الطلب" value="${E(S.oq)}"></div>
  <div class="list two">${L.map(orderRow).join('')||'<p class="empty">مفيش طلبات هنا</p>'}</div>`;
}
function orderSheet(id){
  const o=S.orders.find(x=>x.id===id);if(!o)return;
  const items=(o.items||[]).map(i=>{const p=S.products.find(x=>x.id===i.id);const im=p&&((p.img||{})[i.color]||first(p));return `<div class="row"><div class="th"><img src="${E(window.IMG(im,1))}" alt=""></div><div class="mid"><b>${E(i.name)}</b><small>${E(i.color||'')}${i.size?' · مقاس '+E(i.size):''} × ${ar(i.q)}</small></div><div class="end">${fmt(i.price*i.q)}</div></div>`}).join('');
  openSheet(`<h3><span>طلب #${E(o.ref||'')} <span class="pill ${o.status}">${ST[o.status]}</span></span><button class="x" data-x>×</button></h3>
  <dl class="kv card box"><dt>الاسم</dt><dd>${E(o.name)}</dd><dt>الموبايل</dt><dd><a href="tel:${E(o.phone)}" style="text-decoration:underline">${E(o.phone)}</a></dd><dt>المحافظة</dt><dd>${E(o.gov)}</dd><dt>العنوان</dt><dd>${E(o.addr)}</dd><dt>الدفع</dt><dd>${o.pay==='cod'||o.pay==='الدفع عند الاستلام'?'عند الاستلام':'إنستا باي'}</dd><dt>الوقت</dt><dd>${new Date(o.created).toLocaleString('ar-EG')}</dd></dl>
  <div class="items list">${items}</div>
  <div style="margin-top:10px"><div class="tot"><span>المنتجات</span><span>${fmt(o.sub)}</span></div><div class="tot"><span>الشحن</span><span>${o.ship?fmt(o.ship):'مجاني'}</span></div><div class="tot t"><span>الإجمالي</span><span>${fmt(o.total)}</span></div></div>
  <div class="f"><label>ملاحظة داخلية</label><textarea id="onote" placeholder="مثال: اتصلت بالعميل">${E(o.note||'')}</textarea></div>
  <div class="acts">${NEXT[o.status]?`<button class="btn acc" data-s="${NEXT[o.status]}">${NEXTL[o.status]}</button>`:''}<a class="btn ghost" style="text-align:center" href="${waLink(o.phone)}" target="_blank" rel="noopener">واتساب العميل</a><a class="btn ghost" style="text-align:center" href="tel:${E(o.phone)}">اتصال</a></div>
  <div class="acts"><button class="btn ghost" data-s="save">حفظ الملاحظة</button>${o.status!=='cancelled'&&o.status!=='delivered'?'<button class="btn danger" data-s="cancelled">إلغاء الطلب</button>':''}${o.status==='cancelled'?'<button class="btn danger" data-s="del">حذف نهائي</button>':''}</div>`,
  async e=>{
    const b=e.target.closest('[data-s]');if(!b)return;const s=b.dataset.s;
    try{
      if(s==='save')await DB.updateOrder(o.id,{note:$('#onote').value});
      else if(s==='del'){if(!confirm('حذف الطلب نهائياً؟'))return;await DB.deleteOrder(o.id)}
      else{if(s==='cancelled'&&!confirm('إلغاء الطلب؟ الكمية هترجع للمخزون.'))return;await DB.updateOrder(o.id,{status:s,note:$('#onote').value})}
      closeSheet();toast('تم');await refresh();
    }catch(x){toast('حصل خطأ، جرب تاني')}
  });
}
/* ---------- products ---------- */
function stockPill(p){if(p.stock==null)return '';return p.stock<=0?'<span class="pill out">نفذ</span>':p.stock<=3?`<span class="pill low">باقي ${ar(p.stock)}</span>`:`<span class="pill ok">${ar(p.stock)} في المخزن</span>`}
const prodRow=(p,noact)=>`<div class="row" ${p.active===false?'style="opacity:.55"':''}><button class="row" style="border:0;padding:0;background:none;flex:1;min-width:0" data-act="prod" data-id="${E(p.id)}">${thumb(p)}<div class="mid"><b>${E(p.name)}</b><small>${fmt(p.price)} ${stockPill(p)} ${p.active===false?'<span class="pill ok">مخفي</span>':''}</small></div></button>${noact?'':`<button class="ic ${p.featured?'on':''}" data-act="star" data-id="${E(p.id)}" title="مميز في الرئيسية">${p.featured?'★':'☆'}</button><button class="ic" data-act="eye" data-id="${E(p.id)}" title="إظهار/إخفاء">${p.active===false?'◌':'●'}</button>`}</div>`;
function vProducts(){
  const q=S.pq.trim().toLowerCase();
  const L=S.products.filter(p=>(S.pc==='all'||p.cat===S.pc)&&(!q||(p.name+' '+p.en).toLowerCase().includes(q)));
  const fc=S.products.filter(p=>p.featured).length;
  return `<div class="tools"><input id="pq" type="search" placeholder="ابحث في المنتجات" value="${E(S.pq)}"><select id="pc"><option value="all">كل الأقسام</option>${S.cats.map(c=>`<option value="${E(c.id)}" ${S.pc===c.id?'selected':''}>${E(c.name)}</option>`).join('')}</select></div>
  <p class="note" style="margin:-4px 0 12px">${ar(S.products.length)} منتج · المميزة في الرئيسية: ${ar(fc)} ${fc>8?'(الرئيسية بتعرض أول ٨ بس)':'من ٨'} · النجمة = مميز، النقطة = ظاهر في المتجر</p>
  <div class="list two">${L.map(p=>prodRow(p)).join('')||'<p class="empty">مفيش منتجات</p>'}</div>`;
}
let EP=null;
async function resize(file,max,q){
  const url=URL.createObjectURL(file);const im=await new Promise((r,j)=>{const i=new Image();i.onload=()=>r(i);i.onerror=j;i.src=url});
  const k=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*k);c.height=Math.round(im.height*k);
  c.getContext('2d').drawImage(im,0,0,c.width,c.height);URL.revokeObjectURL(url);
  return new Promise(r=>c.toBlob(r,'image/jpeg',q));
}
function colRows(){
  return EP.cols.map((c,i)=>`<div class="cr"><button type="button" class="ph" data-ph="${i}">${c.img?`<img src="${E(window.IMG(c.img,1))}" alt="">`:'+'}</button><input data-cn="${i}" value="${E(c.name)}" placeholder="اسم اللون (مثال: رملي)"><button type="button" class="ic" data-cd="${i}">✕</button></div>`).join('');
}
function editProduct(id){
  const p=id?S.products.find(x=>x.id===id):null;
  EP={id:p?p.id:'p'+Date.now().toString(36),isNew:!p,cols:p?Object.entries(p.img||{}).map(([name,img])=>({name,img})):[{name:'',img:''}]};
  if(!EP.cols.length)EP.cols=[{name:'',img:''}];
  const v=p||{cat:S.cats[0]&&S.cats[0].id,name:'',en:'',desc:'',price:'',stock:null,sizes:[],badge:'',featured:false,active:true};
  openSheet(`<h3><span>${p?'تعديل منتج':'منتج جديد'}</span><button class="x" data-x>×</button></h3>
  <form class="f" id="pf" novalidate>
  <label>الاسم بالعربي *</label><input name="name" value="${E(v.name)}">
  <label>الاسم بالإنجليزي</label><input name="en" dir="ltr" value="${E(v.en)}">
  <label>الوصف</label><textarea name="desc">${E(v.desc)}</textarea>
  <div class="two"><div><label>القسم</label><select name="cat">${S.cats.map(c=>`<option value="${E(c.id)}" ${v.cat===c.id?'selected':''}>${E(c.name)}</option>`).join('')}</select></div><div><label>السعر (ج.م) *</label><input name="price" inputmode="numeric" value="${E(v.price)}"></div></div>
  <div class="two"><div><label>المخزون (فاضي = غير محدود)</label><input name="stock" inputmode="numeric" value="${v.stock==null?'':E(v.stock)}"></div><div><label>الشارة</label><select name="badge">${['','جديد','الأكثر طلباً','تخفيضات'].map(b=>`<option ${v.badge===b?'selected':''} value="${b}">${b||'بدون'}</option>`).join('')}</select></div></div>
  <label>المقاسات (افصل بفاصلة)</label><input name="sizes" inputmode="numeric" placeholder="38,39,40,41,42" value="${E((v.sizes||[]).join(','))}">
  <label>الألوان والصور</label><div class="cols" id="cols">${colRows()}</div><button type="button" class="btn ghost sm" id="addc">+ لون تاني</button>
  <input type="file" id="file" accept="image/*" hidden>
  <div class="sw" style="margin-top:12px"><span>مميز في الصفحة الرئيسية</span><input type="checkbox" name="featured" ${v.featured?'checked':''}></div>
  <div class="sw"><span>ظاهر في المتجر</span><input type="checkbox" name="active" ${v.active!==false?'checked':''}></div>
  <p class="err" id="pe"></p>
  <div class="acts"><button class="btn acc" type="submit">حفظ</button>${p?'<button class="btn danger" type="button" data-del>حذف</button>':''}</div></form>`,
  async e=>{
    if(e.target.closest('[data-del]')){if(!confirm('حذف المنتج نهائياً؟'))return;await DB.deleteProduct(EP.id);closeSheet();toast('اتحذف');return refresh()}
    const ph=e.target.closest('[data-ph]');if(ph){EP.pi=+ph.dataset.ph;$('#file').click()}
    const cd=e.target.closest('[data-cd]');if(cd){window.__sync();EP.cols.splice(+cd.dataset.cd,1);if(!EP.cols.length)EP.cols=[{name:'',img:''}];$('#cols').innerHTML=colRows()}
    if(e.target.closest('#addc')){window.__sync();EP.cols.push({name:'',img:''});$('#cols').innerHTML=colRows()}
  },
  m=>{
    const sync=window.__sync=()=>$$('[data-cn]').forEach(i=>EP.cols[+i.dataset.cn].name=i.value);
    $('#file').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;sync();
      try{const blob=await resize(f,DB.live?1400:760,DB.live?.82:.7);const url=await DB.uploadImage(blob,EP.id);EP.cols[EP.pi].img=url;$('#cols').innerHTML=colRows()}
      catch(x){toast(x.message==='AUTH'?'سجل دخول تاني':'تعذر رفع الصورة (ممكن المساحة امتلت)')}};
    $('#pf').onsubmit=async e=>{
      e.preventDefault();sync();const f=e.target,err=$('#pe');
      const name=f.name.value.trim(),price=parseInt(String(f.price.value).replace(/[^\d]/g,''),10);
      if(!name)return err.textContent='اكتب اسم المنتج';if(!price)return err.textContent='اكتب السعر';
      const img={};EP.cols.forEach((c,i)=>{if(c.img||c.name.trim())img[c.name.trim()||('لون '+(i+1))]=c.img});
      const sizes=f.sizes.value.split(/[,،\s]+/).map(x=>x.trim()).filter(Boolean).map(x=>/^\d+$/.test(x)?+x:x);
      const st=f.stock.value.trim();
      const old=S.products.find(x=>x.id===EP.id)||{};
      const prod=Object.assign({},old,{id:EP.id,cat:f.cat.value,name,en:f.en.value.trim(),desc:f.desc.value.trim(),price,stock:st===''?null:Math.max(0,parseInt(st,10)||0),badge:f.badge.value,sizes,img,featured:f.featured.checked,active:f.active.checked});
      try{await DB.saveProduct(prod);closeSheet();toast('تم الحفظ');await refresh()}catch(x){err.textContent=String(x.message).includes('quota')||x.name==='QuotaExceededError'?'المساحة امتلت، قلل الصور':'تعذر الحفظ'}
    };
  });
}
/* ---------- more: categories + settings ---------- */
function vMore(){
  const s=Object.assign({whatsapp:cfg.whatsapp,instapay:cfg.instapay,shipping:cfg.shipping,freeShippingOver:cfg.freeShippingOver,demo:cfg.demo},S.settings);
  const n=c=>S.products.filter(p=>p.cat===c.id).length;
  return `<div class="h2">الأقسام</div><div class="list" id="cl">${S.cats.map((c,i)=>`<div class="row"><input class="ci" data-id="${E(c.id)}" value="${E(c.name)}" style="flex:1;border:1px solid var(--line);background:var(--bg);border-radius:10px;padding:8px 10px;min-width:0"><small>${ar(n(c))}</small><button class="ic" data-cm="up" data-id="${E(c.id)}" ${i?'':'disabled'}>↑</button><button class="ic" data-cm="dn" data-id="${E(c.id)}" ${i<S.cats.length-1?'':'disabled'}>↓</button><button class="ic" data-cm="del" data-id="${E(c.id)}">✕</button></div>`).join('')}</div>
  <div class="tools" style="margin-top:10px"><input id="newcat" placeholder="قسم جديد"><button class="btn" data-cm="add">إضافة</button></div>
  <div class="h2">إعدادات المتجر</div><form class="f card box" id="sf"><label>رقم الواتساب (بصيغة دولية بدون +، مثال 201001234567)</label><input name="whatsapp" inputmode="numeric" dir="ltr" value="${E(s.whatsapp||'')}">
  <label>عنوان إنستا باي</label><input name="instapay" dir="ltr" value="${E(s.instapay||'')}">
  <div class="two"><div><label>الشحن (ج.م)</label><input name="shipping" inputmode="numeric" value="${E(s.shipping)}"></div><div><label>شحن مجاني فوق</label><input name="free" inputmode="numeric" value="${E(s.freeShippingOver)}"></div></div>
  <div class="sw"><span>وضع تجريبي في المتجر (شريط ووسم "تجريبي")</span><input type="checkbox" name="demo" ${s.demo?'checked':''}></div><button class="btn acc block" style="margin-top:14px" type="submit">حفظ الإعدادات</button></form>
  <div class="h2">التنبيهات والتثبيت</div><div class="card box"><button class="btn ghost block" data-act="notif">تفعيل تنبيهات الطلبات على الجهاز ده</button><p class="note">التنبيه بيوصل وأنت فاتح التطبيق أو في الخلفية. لتنبيه والتطبيق مقفول محتاج خطوة إضافية (موضحة في دليل التشغيل).</p>
  <button class="btn ghost block" style="margin-top:10px" data-act="install" id="inst" hidden>تثبيت التطبيق على الموبايل</button><p class="note">للتثبيت: في كروم اضغط ⋮ ثم "تثبيت التطبيق"، وفي سفاري المشاركة ثم "إضافة إلى الشاشة الرئيسية".</p></div>
  <div class="h2">الاتصال بقاعدة البيانات</div><div class="card box">${DB.live?`<b>متصل بـ Supabase</b><p class="note">داخل بحساب: ${E(DB.user()||'')}</p><button class="btn ghost" data-act="logout">تسجيل خروج</button>`:`<b>وضع تجريبي</b><p class="note">البيانات محفوظة على الجهاز ده بس. لتفعيل قاعدة البيانات الحقيقية: ضع رابط Supabase والمفتاح العام في <code>config.js</code> ونفّذ <code>supabase/schema.sql</code>، الخطوات في <code>ADMIN-SETUP.md</code>.</p>`}
  <button class="btn ghost" style="margin-top:10px" data-act="export">نسخة احتياطية (تنزيل JSON)</button>${DB.live?'':' <button class="btn danger" style="margin-top:10px" data-act="reset">إعادة البيانات التجريبية</button>'}</div>`;
}
async function catAction(b){
  const a=b.dataset.cm,id=b.dataset.id;
  try{
    if(a==='add'){const v=$('#newcat').value.trim();if(!v)return;await DB.saveCat({id:'c'+Date.now().toString(36),name:v,sort:S.cats.length})}
    if(a==='del'){const n=S.products.filter(p=>p.cat===id).length;if(n)return toast('القسم فيه '+ar(n)+' منتج، انقلهم الأول');if(!confirm('حذف القسم؟'))return;await DB.deleteCat(id)}
    if(a==='up'||a==='dn'){const i=S.cats.findIndex(c=>c.id===id),j=a==='up'?i-1:i+1;if(j<0||j>=S.cats.length)return;const A=S.cats[i],B=S.cats[j];await DB.saveCat({id:A.id,name:A.name,sort:j});await DB.saveCat({id:B.id,name:B.name,sort:i})}
    await refresh();
  }catch(e){toast('حصل خطأ')}
}
/* ---------- sheet ---------- */
function openSheet(html,onclick,onmount){
  $('#layer').innerHTML=`<div class="ov" data-x></div><div class="sheet" role="dialog">${html}</div>`;
  $('#layer .sheet').onclick=e=>{if(e.target.closest('[data-x]'))return closeSheet();onclick&&onclick(e)};
  $('#layer .ov').onclick=closeSheet;onmount&&onmount();document.body.style.overflow='hidden';
}
function closeSheet(){$('#layer').innerHTML='';document.body.style.overflow=''}
addEventListener('keydown',e=>{if(e.key==='Escape')closeSheet()});
/* ---------- events ---------- */
document.addEventListener('click',async e=>{
  const g=e.target.closest('[data-go]');if(g){e.preventDefault();S.tab=g.dataset.go;view();return}
  const of=e.target.closest('[data-of]');if(of){S.of=of.dataset.of;view();return}
  const cm=e.target.closest('[data-cm]');if(cm)return catAction(cm);
  const a=e.target.closest('[data-act]');if(!a)return;const id=a.dataset.id;
  switch(a.dataset.act){
   case 'order':return orderSheet(id);
   case 'prod':return editProduct(id);
   case 'star':{const p=S.products.find(x=>x.id===id);await DB.saveProduct(Object.assign({},p,{featured:!p.featured}));return refresh()}
   case 'eye':{const p=S.products.find(x=>x.id===id);await DB.saveProduct(Object.assign({},p,{active:p.active===false}));return refresh()}
   case 'fake':return fakeOrder();
   case 'notif':return askNotif();
   case 'install':if(window.__ip){window.__ip.prompt();window.__ip=null}return;
   case 'logout':DB.logout();return location.reload();
   case 'reset':if(confirm('رجوع كل المنتجات والطلبات للبيانات التجريبية الأصلية؟')){DB.resetDemo();location.reload()}return;
   case 'export':{const d=await DB.exportAll();const u=URL.createObjectURL(new Blob([JSON.stringify(d,null,1)],{type:'application/json'}));const l=document.createElement('a');l.href=u;l.download=K+'-backup-'+new Date().toISOString().slice(0,10)+'.json';l.click();return}
  }
});
document.addEventListener('input',e=>{
  if(e.target.id==='oq'){S.oq=e.target.value;const p=e.target.selectionStart;$('#view .list').outerHTML=`<div class="list two">${S.orders.filter(o=>(S.of==='all'||o.status===S.of)&&(!S.oq.trim()||(o.name+' '+o.phone+' '+o.ref).toLowerCase().includes(S.oq.trim().toLowerCase()))).map(orderRow).join('')||'<p class="empty">مفيش طلبات هنا</p>'}</div>`}
  if(e.target.id==='pq'){S.pq=e.target.value;view();const i=$('#pq');i.focus();i.setSelectionRange(i.value.length,i.value.length)}
});
document.addEventListener('change',e=>{
  if(e.target.id==='pc'){S.pc=e.target.value;view()}
  if(e.target.classList.contains('ci')){const c=S.cats.find(x=>x.id===e.target.dataset.id);if(c&&e.target.value.trim()){DB.saveCat({id:c.id,name:e.target.value.trim(),sort:c.sort}).then(()=>{toast('اتحفظ');refresh()})}}
});
document.addEventListener('submit',async e=>{
  if(e.target.id!=='sf')return;e.preventDefault();const f=e.target;
  const num=v=>parseInt(String(v).replace(/\D/g,''),10)||0;
  try{await DB.saveSettings({whatsapp:f.whatsapp.value.replace(/\D/g,''),instapay:f.instapay.value.trim(),shipping:num(f.shipping.value),freeShippingOver:num(f.free.value),demo:f.demo.checked});toast('اتحفظت الإعدادات');await refresh()}catch(x){toast('تعذر الحفظ')}
});
addEventListener('beforeinstallprompt',e=>{e.preventDefault();window.__ip=e;const b=$('#inst');if(b)b.hidden=false});
/* ---------- alerts ---------- */
const KN=K+'_known';let known=null;
function beep(){try{const c=new (window.AudioContext||window.webkitAudioContext)(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=880;g.gain.setValueAtTime(.2,c.currentTime);g.gain.exponentialRampToValueAtTime(.001,c.currentTime+.6);o.start();o.stop(c.currentTime+.6)}catch(e){}}
async function notify(o){
  toast('طلب جديد من '+o.name+' · '+fmt(o.total));beep();try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}
  if(window.Notification&&Notification.permission==='granted'){
    const title='طلب جديد #'+(o.ref||''),opt={body:o.name+' · '+fmt(o.total),tag:'o'+o.id,icon:'icon-192.png',dir:'rtl',lang:'ar'};
    try{const r=await navigator.serviceWorker.getRegistration();r?r.showNotification(title,opt):new Notification(title,opt)}catch(e){}
  }
}
async function poll(){
  if(!DB.isAuthed())return;
  const before=S.orders.length;await load();
  const ids=S.orders.map(o=>o.id);
  if(known===null){known=new Set(JSON.parse(LS.getItem(KN)||'null')||ids)}
  const fresh=S.orders.filter(o=>!known.has(o.id));
  fresh.forEach(o=>known.add(o.id));LS.setItem(KN,JSON.stringify([...known]));
  fresh.filter(o=>o.status==='new').forEach(notify);
  if($('#view')&&(fresh.length||S.orders.length!==before)&&!$('#layer .sheet'))view();else badge();
}
async function askNotif(){
  if(!window.Notification)return toast('المتصفح ده مش بيدعم التنبيهات');
  const r=await Notification.requestPermission();toast(r==='granted'?'التنبيهات اشتغلت':'التنبيهات مرفوضة، فعّلها من إعدادات المتصفح');
}
async function fakeOrder(){
  const p=S.products.filter(x=>x.active!==false)[Math.floor(Math.random()*5)]||S.products[0];if(!p)return;
  const q=1+Math.floor(Math.random()*2),sub=p.price*q,ship=sub>=(cfg.freeShippingOver||2000)?0:(cfg.shipping||60);
  const names=['منى أحمد','سارة محمود','هبة علي','نورهان سمير','دينا خالد'];
  await DB.addOrder({ref:'T'+Math.random().toString(36).slice(2,6).toUpperCase(),name:names[Math.floor(Math.random()*names.length)],phone:'01'+(0|Math.random()*9e8+1e8),gov:'الإسكندرية',addr:'شارع التحرير، عمارة ٥',pay:'cod',items:[{id:p.id,name:p.name,color:Object.keys(p.img||{})[0]||'',size:(p.sizes||[])[0]||'',q,price:p.price}],sub,ship,total:sub+ship});
  await poll();
}
/* ---------- boot ---------- */
async function start(){
  if(!DB.isAuthed())return showLogin();
  shell();await load();view();
  if(!DB.live&&!S.orders.length&&!LS.getItem(K+'_seeded')){LS.setItem(K+'_seeded','1');await seedSamples();await load();view()}
  const ids=S.orders.map(o=>o.id);if(!LS.getItem(KN))LS.setItem(KN,JSON.stringify(ids));
  setInterval(()=>{if(!document.hidden)poll()},DB.live?20000:8000);
  addEventListener('focus',poll);addEventListener('dbchange',poll);addEventListener('storage',e=>{if(e.key===K+'_db')poll()});
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)poll()});
}
async function seedSamples(){
  const P=S.products.filter(p=>p.active!==false);if(P.length<3)return;
  const mk=(i,ref,name,gov,st,ago_h)=>{const p=P[i%P.length],q=1+(i%2),sub=p.price*q,ship=sub>=(cfg.freeShippingOver||2000)?0:(cfg.shipping||60);
    return {id:'seed'+i,ref,name,phone:'0100123456'+i,gov,addr:'شارع النصر، عمارة '+(i+3),pay:i%2?'instapay':'cod',items:[{id:p.id,name:p.name,color:Object.keys(p.img||{})[0]||'',size:(p.sizes||[])[1]||'',q,price:p.price}],sub,ship,total:sub+ship,status:st,note:'',created:new Date(Date.now()-ago_h*36e5).toISOString()}};
  const list=[mk(0,'A7K2P','منى أحمد','الإسكندرية','new',.4),mk(1,'B3M9X','سارة محمود','القاهرة','confirmed',5),mk(2,'C8D1Q','هبة علي','الجيزة','shipped',27),mk(3,'D4F6T','نورهان سمير','المنصورة','delivered',52),mk(4,'E2H5R','دينا خالد','طنطا','delivered',76),mk(5,'F9L3Z','ياسمين عادل','الإسكندرية','cancelled',98)];
  const raw=JSON.parse(LS.getItem(K+'_db'));raw.orders=list;LS.setItem(K+'_db',JSON.stringify(raw));
}
if('serviceWorker' in navigator)navigator.serviceWorker.register('sw.js').catch(()=>{});
start();
})();
