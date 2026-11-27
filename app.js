(function(){
const $=s=>document.querySelector(s), cfg=window.VELLOR, P=window.PRODUCTS;
const fmt=n=>n.toLocaleString('ar-EG')+' ج.م';
const E=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
let cart=JSON.parse(localStorage.getItem('vellor_cart')||'[]');
const save=()=>localStorage.setItem('vellor_cart',JSON.stringify(cart));
const waBase=()=>'https://wa.me/'+(cfg.whatsapp||'');
if(cfg.demo){$('#demoBar').hidden=false;$('#footDemo').textContent='نسخة تجريبية: المنتجات والأسعار والصور توضيحية ومش حقيقية.'}
$('#waFloat').href=waBase()+'?text='+encodeURIComponent('أهلاً Vellor، عندي استفسار');

function renderGrid(cat='all'){
  $('#grid').innerHTML=P.filter(p=>cat==='all'||p.cat===cat).map(p=>`
  <button class="card pop" data-id="${p.id}"><div class="im">${productArt(p.kind,p.colors[0])}</div>
  <div class="tx"><h3>${E(p.name)}</h3><span class="p">${fmt(p.price)}</span>${cfg.demo?'<span class="tag">تجريبي</span>':''}</div></button>`).join('');
}
$('#tabs').onclick=e=>{const b=e.target.closest('button');if(!b)return;
  document.querySelectorAll('#tabs button').forEach(x=>x.classList.toggle('on',x===b));renderGrid(b.dataset.cat)};
$('#grid').onclick=e=>{const c=e.target.closest('.card');if(c)openProduct(c.dataset.id)};

let cur,selColor,selSize;
function chips(el,vals,get,set){
  el.innerHTML=vals.map(v=>`<button type="button" data-v="${E(v)}" class="${get()==v?'on':''}">${E(v)}</button>`).join('');
  el.onclick=e=>{const b=e.target.closest('button');if(!b)return;set(b.dataset.v);
    el.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));$('#pErr').textContent=''}
}
function openProduct(id){
  cur=P.find(p=>p.id===id);selColor=cur.colors[0];selSize=null;
  $('#pName').textContent=cur.name;$('#pPrice').textContent=fmt(cur.price)+(cfg.demo?' (سعر تجريبي)':'');
  $('#pDesc').textContent=cur.desc;$('#pErr').textContent='';
  const img=()=>$('#pImg').innerHTML=productArt(cur.kind,selColor);img();
  chips($('#colorChips'),cur.colors,()=>selColor,v=>{selColor=v;img()});
  $('#sizeOpt').hidden=!cur.sizes.length;
  if(cur.sizes.length)chips($('#sizeChips'),cur.sizes,()=>selSize,v=>selSize=v);
  show('#prodSheet');
}
$('#addBtn').onclick=()=>{
  if(cur.sizes.length&&!selSize){$('#pErr').textContent='اختار المقاس الأول';return}
  const key=[cur.id,selColor,selSize].join('|');
  const f=cart.find(i=>i.key===key);f?f.q++:cart.push({key,id:cur.id,color:selColor,size:selSize,q:1});
  save();count();hideAll();toast('اتضاف للسلة');
};
function count(){const n=cart.reduce((a,i)=>a+i.q,0);$('#cartCount').textContent=n||''}
function totals(){const sub=cart.reduce((a,i)=>a+P.find(p=>p.id===i.id).price*i.q,0);
  const ship=!sub?0:sub>=cfg.freeShippingOver?0:cfg.shipping;return{sub,ship,total:sub+ship}}
function renderCart(){
  if(!cart.length){$('#cartList').innerHTML='<p class="empty">السلة فاضية</p>';$('#totals').innerHTML='';$('#orderForm').hidden=true;return}
  $('#orderForm').hidden=false;
  $('#cartList').innerHTML=cart.map((i,ix)=>{const p=P.find(x=>x.id===i.id);return `<div class="line"><div class="th">${productArt(p.kind,i.color)}</div>
  <div class="in"><b>${E(p.name)}</b><br><small>${E(i.color)}${i.size?' · مقاس '+i.size:''}</small><br>${fmt(p.price*i.q)}</div>
  <div class="qty"><button data-a="m" data-i="${ix}">−</button><span>${i.q}</span><button data-a="p" data-i="${ix}">+</button></div></div>`}).join('');
  const t=totals();
  $('#totals').innerHTML=`<div><span>المنتجات</span><span>${fmt(t.sub)}</span></div><div><span>الشحن${cfg.demo?' (تجريبي)':''}</span><span>${t.ship?fmt(t.ship):'مجاني'}</span></div><div class="t"><span>الإجمالي</span><span>${fmt(t.total)}</span></div>`;
}
$('#cartList').onclick=e=>{const b=e.target.closest('button');if(!b)return;const i=+b.dataset.i;
  b.dataset.a==='p'?cart[i].q++:cart[i].q--;if(cart[i].q<=0)cart.splice(i,1);save();count();renderCart()};
$('#openCart').onclick=()=>{renderCart();show('#cartSheet')};
document.querySelectorAll('input[name=pay]').forEach(r=>r.onchange=payBox);
function payBox(){const v=document.querySelector('input[name=pay]:checked').value,b=$('#ipBox');
  b.hidden=v!=='instapay';
  b.textContent=cfg.instapay?'حوّل على: '+cfg.instapay+' وابعت صورة التحويل على واتساب مع الطلب.':'عنوان إنستا باي لسه متحددش (مكان مؤقت). بعد ما نحدده هتحول عليه وتبعت صورة التحويل على واتساب.'}
$('#orderForm').onsubmit=e=>{
  e.preventDefault();const f=e.target,v=n=>f[n].value.trim();
  if(!v('name')||!v('gov')||!v('addr')||!/^01[0-9]{9}$/.test(v('phone').replace(/[\s-]/g,''))){
    $('#formErr').textContent='كمّل كل البيانات، ورقم الموبايل لازم يبقى ١١ رقم يبدأ بـ 01';return}
  $('#formErr').textContent='';
  const t=totals(),pay=f.pay.value==='cod'?'الدفع عند الاستلام':'إنستا باي';
  const lines=cart.map(i=>{const p=P.find(x=>x.id===i.id);return `- ${p.name} | ${i.color}${i.size?' | مقاس '+i.size:''} | عدد ${i.q} | ${p.price*i.q} ج.م`}).join('\n');
  const msg=`${cfg.demo?'[طلب تجريبي] ':''}طلب جديد من Vellor\n${lines}\nالمنتجات: ${t.sub} ج.م\nالشحن: ${t.ship} ج.م\nالإجمالي: ${t.total} ج.م\nالدفع: ${pay}\n\nالاسم: ${v('name')}\nالموبايل: ${v('phone')}\nالمحافظة: ${v('gov')}\nالعنوان: ${v('addr')}`;
  window.open(waBase()+'?text='+encodeURIComponent(msg),'_blank','noopener');
  toast('اتفتح واتساب، ابعت الرسالة عشان الطلب يوصلنا');
};
function show(id){$('#overlay').hidden=false;document.querySelectorAll('.sheet').forEach(s=>s.hidden=s.id!==id.slice(1));payBox();document.body.style.overflow='hidden'}
function hideAll(){$('#overlay').hidden=true;document.querySelectorAll('.sheet').forEach(s=>s.hidden=true);document.body.style.overflow=''}
$('#overlay').onclick=hideAll;document.querySelectorAll('[data-close]').forEach(b=>b.onclick=hideAll);
document.addEventListener('keydown',e=>{if(e.key==='Escape')hideAll()});
let tt;function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(tt);tt=setTimeout(()=>t.hidden=true,3200)}
renderGrid();count();
const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}}),{threshold:.15});
document.querySelectorAll('.rv:not(.hero .rv)').forEach(el=>io.observe(el));
const hv=document.querySelector('.hero-vid');if(hv){hv.play&&hv.play().catch(()=>{})}
})();
