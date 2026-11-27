// Placeholder product art (SVG), until real leather photos exist.
(function(){
  const C={"بني كونياك":["#a8582a","#7a3a17","#c97a42"],"أسود":["#2a2522","#120f0d","#4a423d"]};
  function shoe(c){return `<path d="M30 118c0-14 6-26 10-34 4-10 3-22 3-30h38c0 14 14 22 34 26 20 4 50 8 58 24 4 8 4 14 4 14z" fill="${c[0]}"/><path d="M30 118c0-14 6-26 10-34 4-10 3-22 3-30h38" fill="none" stroke="${c[2]}" stroke-width="2" opacity=".55"/><path d="M26 118h178v10c0 4-3 6-6 6H34c-5 0-8-3-8-8z" fill="${c[1]}"/><path d="M78 66l14 6M84 78l16 6M92 90l16 4" stroke="${c[1]}" stroke-width="3" stroke-linecap="round"/><path d="M48 84c10 4 22 4 30 0" stroke="${c[2]}" stroke-width="1.5" fill="none" stroke-dasharray="3 3"/>`}
  function wallet(c){return `<rect x="46" y="48" width="138" height="92" rx="9" fill="${c[0]}"/><rect x="46" y="48" width="138" height="92" rx="9" fill="none" stroke="${c[2]}" stroke-width="1.5" opacity=".5"/><rect x="52" y="54" width="126" height="80" rx="6" fill="none" stroke="${c[2]}" stroke-width="1.4" stroke-dasharray="4 3"/><path d="M46 70h138" stroke="${c[1]}" stroke-width="3"/><rect x="152" y="86" width="32" height="26" rx="6" fill="${c[1]}"/><circle cx="166" cy="99" r="3.5" fill="${c[2]}"/>`}
  function belt(c){return `<path d="M20 78c60-18 130-18 190 0v22c-60-18-130-18-190 0z" fill="${c[0]}"/><path d="M20 82c60-18 130-18 190 0" fill="none" stroke="${c[2]}" stroke-width="1.5" stroke-dasharray="4 3" opacity=".7"/><rect x="92" y="66" width="46" height="44" rx="6" fill="none" stroke="#c9b27a" stroke-width="5"/><rect x="113" y="74" width="4" height="28" fill="#c9b27a"/><g fill="${c[1]}"><circle cx="160" cy="88" r="2.5"/><circle cx="174" cy="90" r="2.5"/><circle cx="188" cy="92" r="2.5"/></g>`}
  window.productArt=function(kind,color,cls){
    const c=C[color]||C["بني كونياك"];
    const body=kind==="shoe"?shoe(c):kind==="wallet"?wallet(c):belt(c);
    return `<svg class="${cls||''}" viewBox="0 0 230 170" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="صورة توضيحية"><defs><filter id="lg"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .22 0"/></filter></defs><ellipse cx="115" cy="150" rx="86" ry="7" fill="#000" opacity=".18"/>${body}</svg>`;
  };
})();
