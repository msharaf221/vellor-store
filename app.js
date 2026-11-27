(function(){
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const cfg=window.VELLOR,P=window.PRODUCTS,RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const fmt=n=>n.toLocaleString('ar-EG')+' ج.م';
const num=n=>String(n).padStart(2,'0').replace(/\d/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]);
const E=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const COL0="بني كونياك";
const first=p=>p.img[COL0]||Object.values(p.img)[0];
const imgOf=(p,c)=>p.img[c]||first(p);

/* preloader */
const lift=()=>document.body.classList.remove('loading');
addEventListener('load',()=>setTimeout(lift,RM?0:1700));setTimeout(lift,4500);

/* demo flags */
if(cfg.demo){$('#demoBar').hidden=false;$('#footDemo').textContent='نسخة تجريبية: المنتجات والأسعار والصور للعرض فقط.'}
$('#waFloat').href='https://wa.me/'+(cfg.whatsapp||'')+'?text='+encodeURIComponent('أهلاً Vellor، عندي استفسار');

/* menu */
const mb=$('#menuBtn');
mb.onclick=()=>{const o=document.body.classList.toggle('menu-open');$('#menu').setAttribute('aria-hidden',!o)};
$$('#menu a').forEach(a=>a.onclick=()=>document.body.classList.remove('menu-open'));

/* products */
const F0=P.filter(p=>p.featured).slice(0,8),FL=F0.length?F0:P.slice(0,8);
if($('#track'))$('#track').innerHTML=FL.map((p,i)=>`<button class="pc" data-id="${p.id}"><div class="im"><span class="no">${num(i+1)}</span><img src="img/${first(p)}-s.webp" alt="${E(p.name)}" loading="lazy"></div>
 <div class="tx"><div><h3>${E(p.name)}</h3><span class="en">${E(p.en)}</span></div><span class="p">${fmt(p.price)}${cfg.demo?'<span class="tag">تجريبي</span>':''}</span></div></button>`).join('');
if($('#track'))$('#track').onclick=e=>{const c=e.target.closest('.pc');if(c)openProduct(c.dataset.id)};

/* statement: words light up on scroll */
const big=$('#big');let words=[];if(big){big.innerHTML=big.textContent.trim().split(/\s+/).map(w=>`<span class="w">${w}</span>`).join(' ');words=$$('#big .w')}
if($('#allCount'))$('#allCount').textContent=num(P.length);

/* reveals */
const io=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target)}}),{threshold:.12,rootMargin:'0px 0px -6% 0px'});
$$('[data-r]').forEach(el=>io.observe(el));
const io2=new IntersectionObserver(es=>es.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io2.unobserve(x.target)}}),{threshold:.01,rootMargin:'0px 0px -12% 0px'});
$$('[data-reveal-img]').forEach(el=>io2.observe(el));
// stagger siblings
$$('.steps li,.trust div,.faq details').forEach((el,i)=>el.style.transitionDelay=(i%4)*.09+'s');

/* scroll engine */
const hs=$('#hs'),track=$('#track'),hsBar=$('#hsBar'),hsNum=$('#hsNum'),top=$('#top'),heroImg=$('.hero-img'),pars=$$('[data-par]');
let vw=innerWidth,vh=innerHeight,span=0,tick=false;
function measure(){if(!hs)return;vw=innerWidth;vh=innerHeight;span=Math.max(0,track.offsetWidth-vw);hs.style.height=(span+vh)+'px'}
function update(){
  tick=false;const y=scrollY;
  top.classList.toggle('solid',y>60||document.body.classList.contains('shop'));if(!hs)return;
  if(!RM&&y<vh*1.2)heroImg.style.transform=`translate3d(0,${y*.22}px,0)`;
  // statement words
  const sr=big.getBoundingClientRect();const sp=Math.min(1,Math.max(0,(vh*.85-sr.top)/(vh*.55+sr.height*.6)));
  const n=Math.floor(sp*words.length*1.15);words.forEach((w,i)=>w.classList.toggle('on',i<n));
  // horizontal showcase
  const hr=hs.getBoundingClientRect();const p=span?Math.min(1,Math.max(0,-hr.top/span)):0;
  track.style.transform=`translate3d(${p*span}px,0,0)`;
  hsBar.style.transform=`scaleX(${p})`;
  hsNum.textContent=num(Math.min(FL.length,Math.round(p*(FL.length-1))+1));
  // parallax images
  if(!RM)pars.forEach(el=>{const r=el.parentElement.getBoundingClientRect();if(r.bottom<-100||r.top>vh+100)return;const k=+el.dataset.par;const c=(r.top+r.height/2-vh/2);el.style.transform=`translate3d(0,${-c*k}px,0)`});
}
const req=()=>{if(!tick){tick=true;requestAnimationFrame(update)}};
addEventListener('scroll',req,{passive:true});addEventListener('resize',()=>{measure();req()});
addEventListener('load',()=>{measure();update()});measure();update();

/* product sheet */
let cur,selColor,selSize;
function chips(el,vals,get,set){
  el.innerHTML=vals.map(v=>`<button type="button" data-v="${E(v)}" class="${get()==v?'on':''}">${E(v)}</button>`).join('');
  el.onclick=e=>{const b=e.target.closest('button');if(!b)return;set(b.dataset.v);el.querySelectorAll('button').forEach(x=>x.classList.toggle('on',x===b));$('#pErr').textContent=''}
}
function swapImg(){const im=$('#pImg');im.classList.add('sw');setTimeout(()=>{im.src='img/'+imgOf(cur,selColor)+'.webp';im.onload=()=>im.classList.remove('sw')},260)}
function openProduct(id){
  cur=P.find(p=>p.id===id);const cols=Object.keys(cur.img);selColor=cols[0];selSize=null;
  $('#pEn').textContent=cur.en;$('#pName').textContent=cur.name;$('#pPrice').textContent=fmt(cur.price)+(cfg.demo?' · سعر تجريبي':'');
  $('#pDesc').textContent=cur.desc;$('#pErr').textContent='';
  const im=$('#pImg');im.classList.remove('sw');im.src='img/'+imgOf(cur,selColor)+'.webp';im.alt=cur.name;
  $('#colorOpt').hidden=cols.length<2;
  chips($('#colorChips'),cols,()=>selColor,v=>{selColor=v;swapImg()});
  $('#sizeOpt').hidden=!cur.sizes.length;
  if(cur.sizes.length)chips($('#sizeChips'),cur.sizes,()=>selSize,v=>selSize=v);
  show('#prodSheet');
}
$('#addBtn').onclick=()=>{
  if(cur.sizes.length&&!selSize){$('#pErr').textContent='اختار المقاس الأول';return}
  const key=[cur.id,selColor,selSize].join('|');const f=cart.find(i=>i.key===key);
  f?f.q++:cart.push({key,id:cur.id,color:selColor,size:selSize,q:1});save();count();hideAll();toast('اتضاف للسلة');
};

/* cart */
let cart=JSON.parse(localStorage.getItem('vellor_cart2')||'[]');
const save=()=>localStorage.setItem('vellor_cart2',JSON.stringify(cart));
function count(){const n=cart.reduce((a,i)=>a+i.q,0);$('#cartCount').textContent=n?num(n).replace(/^٠/,''):''}
function totals(){const sub=cart.reduce((a,i)=>a+P.find(p=>p.id===i.id).price*i.q,0);const ship=!sub?0:sub>=cfg.freeShippingOver?0:cfg.shipping;return{sub,ship,total:sub+ship}}
function renderCart(){
  if(!cart.length){$('#cartList').innerHTML='<p class="empty">السلة فاضية</p>';$('#totals').innerHTML='';$('#orderForm').hidden=true;return}
  $('#orderForm').hidden=false;
  $('#cartList').innerHTML=cart.map((i,ix)=>{const p=P.find(x=>x.id===i.id);return `<div class="line"><div class="th"><img src="img/${imgOf(p,i.color)}-s.webp" alt=""></div>
  <div class="in"><b>${E(p.name)}</b><br><small>${E(i.color)}${i.size?' · مقاس '+i.size:''}</small><br>${fmt(p.price*i.q)}</div>
  <div class="qty"><button data-a="m" data-i="${ix}">−</button><span>${i.q}</span><button data-a="p" data-i="${ix}">+</button></div></div>`}).join('');
  const t=totals();
  const left=cfg.freeShippingOver-t.sub,ship=left>0?`<p class="shipbar">فاضل ${fmt(left)} ويبقى الشحن مجاني<i><b style="width:${Math.round(t.sub/cfg.freeShippingOver*100)}%"></b></i></p>`:'<p class="shipbar ok">الشحن مجاني على طلبك</p>';
  $('#totals').innerHTML=ship+`<div><span>المنتجات</span><span>${fmt(t.sub)}</span></div><div><span>الشحن${cfg.demo?' (تجريبي)':''}</span><span>${t.ship?fmt(t.ship):'مجاني'}</span></div><div class="t"><span>الإجمالي</span><span>${fmt(t.total)}</span></div>`;
}
$('#cartList').onclick=e=>{const b=e.target.closest('button');if(!b)return;const i=+b.dataset.i;b.dataset.a==='p'?cart[i].q++:cart[i].q--;if(cart[i].q<=0)cart.splice(i,1);save();count();renderCart()};
$('#openCart').onclick=()=>{renderCart();show('#cartSheet')};
$$('input[name=pay]').forEach(r=>r.onchange=payBox);
function payBox(){const v=document.querySelector('input[name=pay]:checked').value,b=$('#ipBox');b.hidden=v!=='instapay';
  b.textContent=cfg.instapay?'حوّل على: '+cfg.instapay+' وابعت صورة التحويل على واتساب مع الطلب.':'عنوان إنستا باي لسه متحددش (مكان مؤقت). بعد ما نحدده هتحول عليه وتبعت صورة التحويل على واتساب.'}
$('#orderForm').onsubmit=e=>{
  e.preventDefault();const f=e.target,v=n=>f[n].value.trim();
  if(!v('name')||!v('gov')||!v('addr')||!/^01[0-9]{9}$/.test(v('phone').replace(/[\s-]/g,''))){$('#formErr').textContent='كمّل كل البيانات، ورقم الموبايل لازم يبقى ١١ رقم يبدأ بـ 01';return}
  $('#formErr').textContent='';
  const t=totals(),pay=f.pay.value==='cod'?'الدفع عند الاستلام':'إنستا باي';
  const lines=cart.map(i=>{const p=P.find(x=>x.id===i.id);return `- ${p.name} | ${i.color}${i.size?' | مقاس '+i.size:''} | عدد ${i.q} | ${p.price*i.q} ج.م`}).join('\n');
  const msg=`${cfg.demo?'[طلب تجريبي] ':''}طلب جديد من Vellor\n${lines}\nالمنتجات: ${t.sub} ج.م\nالشحن: ${t.ship} ج.م\nالإجمالي: ${t.total} ج.م\nالدفع: ${pay}\n\nالاسم: ${v('name')}\nالموبايل: ${v('phone')}\nالمحافظة: ${v('gov')}\nالعنوان: ${v('addr')}`;
  window.open('https://wa.me/'+(cfg.whatsapp||'')+'?text='+encodeURIComponent(msg),'_blank','noopener');
  toast('اتفتح واتساب، ابعت الرسالة عشان الطلب يوصلنا');
};
function show(id){$('#overlay').hidden=false;$$('.sheet').forEach(s=>s.hidden=s.id!==id.slice(1));payBox();document.body.style.overflow='hidden'}
function hideAll(){$('#overlay').hidden=true;$$('.sheet').forEach(s=>s.hidden=true);document.body.style.overflow=''}
$('#overlay').onclick=hideAll;$$('[data-close]').forEach(b=>b.onclick=hideAll);
addEventListener('keydown',e=>{if(e.key==='Escape'){hideAll();document.body.classList.remove('menu-open')}});
let tt;function toast(m){const t=$('#toast');t.textContent=m;t.hidden=false;clearTimeout(tt);tt=setTimeout(()=>t.hidden=true,3200)}
window.SHOP={open:openProduct,fmt,first,E,num};
hideAll();count();
const fv=$('#filmV');if(fv&&fv.play)fv.play().catch(()=>{});
})();
