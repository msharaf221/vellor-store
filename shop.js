(function(){
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const P=window.PRODUCTS,C=window.CATS||[],S=window.SHOP,cfg=window.SOLENNE||window.VELLOR||{};
const PAGE=12;
const norm=s=>String(s||'').toLowerCase().replace(/[\u064B-\u0652]/g,'').replace(/[أإآ]/g,'ا').replace(/ة/g,'ه').replace(/ى/g,'ي');
const FAM=[['أسود',/أسود/,'#1c1713'],['بني',/كاكاو|بني|كستنائي|كونياك|تان|عسلي/,'#7a4a2b'],['بيج',/رملي|بيج|كريمي|كريم|عاجي/,'#d8c3a0'],['رمادي',/رمادي|فضي/,'#b9b6b0'],['أزرق',/سماوي|بيبي بلو|كحلي|أزرق/,'#7f9fc4'],['عنابي',/عنابي|أحمر|بوردو/,'#6e1e2e'],['زيتي',/زيتي|أخضر/,'#5b6140']];
const fam=c=>{const f=FAM.find(f=>f[1].test(c));return f?f[0]:'أخرى'};
const famHex=n=>(FAM.find(f=>f[0]===n)||[0,0,'#999'])[2];
const st={q:'',cat:'all',sizes:new Set(),cols:new Set(),max:0,sort:'rec',shown:PAGE};
const prices=P.map(p=>p.price),pmin=Math.min(...prices),pmax=Math.max(...prices);st.max=pmax;
const sizesAll=[...new Set(P.flatMap(p=>p.sizes))].sort((a,b)=>a-b);
const colsAll=[...new Set(P.flatMap(p=>Object.keys(p.img).map(fam)))];
const qs=new URLSearchParams(location.search);if(qs.get('cat'))st.cat=qs.get('cat');if(qs.get('q')){st.q=qs.get('q');$('#q').value=st.q}
/* cats */
const catCount=id=>id==='all'?P.length:P.filter(p=>p.cat===id).length;
$('#cats').innerHTML=[{id:'all',name:'الكل'},...C].map(c=>`<button data-c="${c.id}" class="${c.id===st.cat?'on':''}">${S.E(c.name)} <small>${S.num(catCount(c.id))}</small></button>`).join('');
$('#cats').onclick=e=>{const b=e.target.closest('button');if(!b)return;st.cat=b.dataset.c;st.shown=PAGE;$$('#cats button').forEach(x=>x.classList.toggle('on',x===b));render(true)};
/* filters */
$('#sizeF').innerHTML=sizesAll.map(s=>`<button type="button" data-s="${s}">${s}</button>`).join('');
$('#colF').innerHTML=colsAll.map(c=>`<button type="button" data-c="${c}"><i style="background:${famHex(c)}"></i>${c}</button>`).join('');
const pr=$('#price');pr.min=Math.floor(pmin/10)*10;pr.max=Math.ceil(pmax/10)*10;pr.step=10;pr.value=pr.max;st.max=+pr.max;
const toggle=(set,v,b)=>{set.has(v)?set.delete(v):set.add(v);b.classList.toggle('on',set.has(v));st.shown=PAGE;render(true)};
$('#sizeF').onclick=e=>{const b=e.target.closest('button');if(b)toggle(st.sizes,+b.dataset.s,b)};
$('#colF').onclick=e=>{const b=e.target.closest('button');if(b)toggle(st.cols,b.dataset.c,b)};
const pv=()=>$('#priceV').textContent='حتى '+S.fmt(+pr.value);pv();
pr.oninput=()=>{st.max=+pr.value;pv();st.shown=PAGE;render(true)};
$('#sort').onchange=e=>{st.sort=e.target.value;st.shown=PAGE;render(true)};
let qt;$('#q').oninput=e=>{clearTimeout(qt);qt=setTimeout(()=>{st.q=e.target.value;st.shown=PAGE;render(true)},180)};
$('#clear').onclick=()=>{st.sizes.clear();st.cols.clear();st.max=+pr.max;pr.value=pr.max;pv();st.q='';$('#q').value='';st.cat='all';st.shown=PAGE;$$('#sizeF button,#colF button').forEach(b=>b.classList.remove('on'));$$('#cats button').forEach(b=>b.classList.toggle('on',b.dataset.c==='all'));render(true)};
$('#fBtn').onclick=()=>document.body.classList.add('f-open');
$$('[data-fclose]').forEach(b=>b.onclick=()=>document.body.classList.remove('f-open'));
$('#more').onclick=()=>{st.shown+=PAGE;render(false)};
/* grid */
function list(){
  const q=norm(st.q).trim();
  let r=P.filter(p=>(st.cat==='all'||p.cat===st.cat)&&p.price<=st.max
   &&(!st.sizes.size||p.sizes.some(s=>st.sizes.has(s)))
   &&(!st.cols.size||Object.keys(p.img).some(c=>st.cols.has(fam(c))))
   &&(!q||norm(p.name+' '+p.en+' '+p.desc+' '+Object.keys(p.img).join(' ')).includes(q)));
  if(st.sort==='pa')r=[...r].sort((a,b)=>a.price-b.price);
  if(st.sort==='pd')r=[...r].sort((a,b)=>b.price-a.price);
  if(st.sort==='new')r=[...r].sort((a,b)=>(b.badge==='جديد')-(a.badge==='جديد'));
  return r;
}
const card=(p,i)=>`<button class="sc" data-id="${p.id}" style="animation-delay:${(i%PAGE)*.05}s"><div class="im"><img src="img/${S.first(p)}-s.webp" alt="${S.E(p.name)}" loading="lazy">${p.badge?`<span class="bd">${S.E(p.badge)}</span>`:''}</div>
<div class="tx"><h3>${S.E(p.name)}</h3><span class="en">${S.E(p.en)}</span><div class="row"><span class="p">${S.fmt(p.price)}${cfg.demo?'<span class="tag">تجريبي</span>':''}</span><span class="dots">${[...new Set(Object.keys(p.img).map(fam))].map(c=>`<i style="background:${famHex(c)}"></i>`).join('')}</span></div></div></button>`;
function render(reset){
  const r=list(),n=Math.min(st.shown,r.length),g=$('#grid');
  if(reset)window.scrollTo&&scrollY>360&&scrollTo({top:$('#cats').offsetTop-70,behavior:'smooth'});
  if(reset||!g.children.length)g.innerHTML=r.slice(0,n).map(card).join('');
  else g.insertAdjacentHTML('beforeend',r.slice(g.children.length,n).map((p,i)=>card(p,i)).join(''));
  $('#count').textContent=r.length?`${S.num(r.length)} منتج`:'';
  $('#none').hidden=!!r.length;
  $('#more').hidden=n>=r.length;$('#more').firstElementChild.textContent=`عرض المزيد (${S.num(r.length-n)} متبقي)`;
  const act=st.sizes.size+st.cols.size+(st.max<+pr.max?1:0);
  $('#fBtn').dataset.n=act?S.num(act):'';
  $('#resN').textContent=r.length?`عرض ${S.num(n)} من ${S.num(r.length)}`:'';
}
$('#grid').onclick=e=>{const c=e.target.closest('.sc');if(c)S.open(c.dataset.id)};
$('#none button').onclick=()=>$('#clear').click();
render(true);
})();
