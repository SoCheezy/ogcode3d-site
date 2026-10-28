/* OGCODE — instant quote from STL
   ================================================================
   Prices per cm³, setup fee, minimum order, large-format factor and
   quantity discounts are NOT here: they live on the server in
   api/quote.js, so visitors never see them. This file only measures the
   files and asks the server for the price.
   Edit here: materials shown (labels, tolerances, build sizes), colours,
   and delivery fees (shown on the page; keep them in step with api/quote.js).
   ================================================================ */
var CURRENCY = 'EUR';

var PRICING = {
  // One entry per technology. maxMm = largest part the machine can build (mm).
  processes: [
    {id:'fdm', label:'FDM', note:'plastic filament', tol:'±0.3 mm',      maxMm:[550,550,550],
     materials: [
       {id:'pla',  label:'PLA'},
       {id:'petg', label:'PETG'},
       {id:'asa',  label:'ASA'},
       {id:'abs',  label:'ABS'},
       {id:'tpu',  label:'TPU (flexible)'},
       {id:'pa',   label:'PA (nylon)'}
     ]},
    {id:'sla', label:'SLA', note:'resin', tol:'±0.05–0.2 mm', maxMm:[800,800,600],
     materials: [
       {id:'resin', label:'Resin'}
     ]},
    {id:'sls', label:'SLS', note:'nylon powder', tol:'±0.3 mm', maxMm:[220,220,220],
     materials: [
       {id:'pa11', label:'PA11'},
       {id:'pa12', label:'PA12'}
     ]},
    {id:'slm', label:'SLM', note:'metal powder', tol:'±0.1–0.2 mm', maxMm:[280,280,350],
     materials: [
       {id:'alu',   label:'Aluminium'},
       {id:'ss316', label:'Stainless steel 316L'}
     ]}
  ],
  delivery: [
    {id:'courier', label:'Courier',      days:'sent by courier', fee:{gr:5,  eu:20}},
    {id:'f2f',     label:'By the owner', days:'the owner brings it to you by hand',            fee:{gr:100, eu:1000}}
  ],
  regions: [ {id:'gr', label:'Greece', f2f:'Athens area', lead:'about a week'}, {id:'eu', label:'Europe', lead:'about two weeks'} ],
};

/* ---------- COLOURS ----------
   Swatch list per group. kind: solid, silk, metal, clear, glow, marble, wood, carbon, rainbow, temper, dual.
   extra = surcharge on the material cost (0.10 = +10%). g = gloss for metals (0–1).
   AVAIL says which groups (or single colours with "c:id") each material offers. */
var COLOURS = {
  groups: [
    {id:'essentials', label:'Essentials', items:[
      {id:'black', label:'Black', hex:'#1b1c1e'}, {id:'white', label:'White', hex:'#f2f2ee'},
      {id:'grey', label:'Grey', hex:'#8d9196'}, {id:'silver', label:'Light grey', hex:'#c4c8cc'}]},
    {id:'earth', label:'Earth', items:[
      {id:'sand', label:'Sand', hex:'#d6c3a0'}, {id:'terracotta', label:'Terracotta', hex:'#b5603a'},
      {id:'olive', label:'Olive', hex:'#6f7a3a'}, {id:'chocolate', label:'Chocolate', hex:'#5a3a2a'}, {id:'slate', label:'Slate', hex:'#4b5866'}]},
    {id:'vivid', label:'Vivid', items:[
      {id:'red', label:'Red', hex:'#d0312d'}, {id:'orange', label:'Orange', hex:'#ec7a1c'}, {id:'yellow', label:'Yellow', hex:'#f2c230'},
      {id:'green', label:'Green', hex:'#2f9e4f'}, {id:'teal', label:'Teal', hex:'#14a3a0'}, {id:'blue', label:'Blue', hex:'#2563c9'},
      {id:'purple', label:'Purple', hex:'#6c3fb5'}, {id:'pink', label:'Pink', hex:'#e0559b'}]},
    {id:'pastel', label:'Pastel', items:[
      {id:'mint', label:'Mint', hex:'#a8e0c8'}, {id:'sky', label:'Sky', hex:'#a9cdf0'}, {id:'lavender', label:'Lavender', hex:'#c8b6e8'},
      {id:'rose', label:'Rose', hex:'#f0b8c8'}, {id:'peach', label:'Peach', hex:'#f6c3a5'}, {id:'lemon', label:'Lemon', hex:'#f4eaa0'}]},
    {id:'temper', label:'OGCODE Temper', note:'the heat-tint colours of tempered steel', items:[
      {id:'t-straw', label:'Straw', hex:'#C9A24A', kind:'silk', extra:0.10}, {id:'t-bronze', label:'Bronze', hex:'#A8643A', kind:'silk', extra:0.10},
      {id:'t-violet', label:'Violet', hex:'#6A4A8C', kind:'silk', extra:0.10}, {id:'t-blue', label:'Temper blue', hex:'#2E5C9C', kind:'silk', extra:0.10},
      {id:'t-grad', label:'Temper gradient', hex:'#A8643A', kind:'temper', extra:0.20}]},
    {id:'effects', label:'Effects', items:[
      {id:'silk-gold', label:'Silk gold', hex:'#d4a73c', kind:'silk', extra:0.10}, {id:'silk-silver', label:'Silk silver', hex:'#c9cdd2', kind:'silk', extra:0.10},
      {id:'silk-copper', label:'Silk copper', hex:'#b8693d', kind:'silk', extra:0.10},
      {id:'dual', label:'Dual silk red/gold', hex:'#c0392b', hex2:'#d4a73c', kind:'dual', extra:0.15},
      {id:'rainbow', label:'Rainbow silk', hex:'#e05050', kind:'rainbow', extra:0.15},
      {id:'glow', label:'Glow in the dark', hex:'#b9f5a0', kind:'glow', extra:0.20},
      {id:'clear', label:'Transparent', hex:'#dfe9ee', kind:'clear', extra:0.05},
      {id:'marble', label:'Marble', hex:'#e6e4df', kind:'marble', extra:0.15},
      {id:'wood', label:'Wood fill', hex:'#a77a4f', kind:'wood', extra:0.15},
      {id:'carbon', label:'Carbon fibre', hex:'#2a2c2f', kind:'carbon', extra:0.25}]},
    {id:'resin', label:'Resin', items:[
      {id:'r-grey', label:'Grey', hex:'#9a9ea3'}, {id:'r-black', label:'Black', hex:'#222326'}, {id:'r-white', label:'White', hex:'#eeeeea'},
      {id:'r-beige', label:'Tough beige', hex:'#dccfb8'}, {id:'r-clear', label:'Clear', hex:'#dfe9ee', kind:'clear', extra:0.10}]},
    {id:'powder', label:'Nylon colour', items:[
      {id:'p-natural', label:'Natural', hex:'#e9e6df'}, {id:'p-black', label:'Dyed black', hex:'#232426', extra:0.05},
      {id:'p-blue', label:'Dyed blue', hex:'#2d4f8f', extra:0.15}, {id:'p-red', label:'Dyed red', hex:'#9c2b2b', extra:0.15}, {id:'p-green', label:'Dyed green', hex:'#2f6b45', extra:0.15}]},
    {id:'anodised', label:'Aluminium finish', items:[
      {id:'a-raw', label:'As printed', hex:'#b9bcbf', kind:'metal', g:0.15}, {id:'a-blast', label:'Bead-blasted', hex:'#c9ccce', kind:'metal', g:0.35, extra:0.05},
      {id:'a-polish', label:'Polished', hex:'#dfe2e4', kind:'metal', g:0.85, extra:0.15},
      {id:'a-black', label:'Anodised black', hex:'#2a2b2e', kind:'metal', g:0.5, extra:0.15}, {id:'a-red', label:'Anodised red', hex:'#a2262b', kind:'metal', g:0.5, extra:0.15},
      {id:'a-blue', label:'Anodised blue', hex:'#2a5aa8', kind:'metal', g:0.5, extra:0.15}, {id:'a-gold', label:'Anodised gold', hex:'#c8a24c', kind:'metal', g:0.5, extra:0.15}]},
    {id:'steel', label:'Steel finish', items:[
      {id:'s-raw', label:'As printed', hex:'#a8acaf', kind:'metal', g:0.15}, {id:'s-blast', label:'Bead-blasted', hex:'#b7babd', kind:'metal', g:0.35, extra:0.05},
      {id:'s-polish', label:'Polished', hex:'#d7dadc', kind:'metal', g:0.85, extra:0.15}, {id:'s-mirror', label:'Mirror', hex:'#eef0f1', kind:'metal', g:1, extra:0.25},
      {id:'s-gold', label:'PVD gold', hex:'#c9a646', kind:'metal', g:0.8, extra:0.35}, {id:'s-black', label:'PVD black', hex:'#1f2023', kind:'metal', g:0.7, extra:0.35}]}
  ],
  AVAIL: {
    pla:  ['essentials','earth','vivid','pastel','temper','effects'],
    petg: ['essentials','vivid','c:clear'],
    asa:  ['essentials','earth','vivid'],
    abs:  ['essentials','earth','vivid'],
    tpu:  ['c:black','c:white','c:grey','c:red','c:blue','c:clear'],
    pa:   ['c:black','c:silver'],
    resin:['resin'],
    pa11: ['powder'], pa12: ['powder'],
    alu:  ['anodised'], ss316: ['steel']
  },
  finishFor: ['fdm','sla'],          // matte / satin / gloss offered for these technologies
  customFor: ['fdm','sla','sls'],    // colour matching offered for these
  customExtra: 0.15
};

/* ---------- no need to edit below ---------- */
(function(){
  var root = document.getElementById('quote'); if(!root) return;
  var $ = function(s){ return root.querySelector(s); };
  var fmt = new Intl.NumberFormat('en-IE',{style:'currency',currency:CURRENCY,maximumFractionDigits:2});
  var fmt0 = new Intl.NumberFormat('en-IE',{style:'currency',currency:CURRENCY,maximumFractionDigits:0});
  var num = function(n,d){ return n.toLocaleString('en-IE',{maximumFractionDigits:d,minimumFractionDigits:d}); };
  var esc = function(s){ return String(s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); };
  var parts = [];            // {id,name,tris,volMm3,size:[x,y,z],qty,mesh}
  var nextId = 1;

  var MATS = [];
  PRICING.processes.forEach(function(pr){ pr.materials.forEach(function(m){ MATS.push({id:m.id, label:m.label, proc:pr}); }); });

  // materials, grouped by technology
  $('#q-material').innerHTML = PRICING.processes.map(function(pr, pi){
    return '<div class="proc"><p class="proc-head"><b>'+esc(pr.label)+'</b> <span>'+esc(pr.note)+'</span><span class="mono">'+esc(pr.tol)+' · up to '+pr.maxMm.join('×')+' mm</span></p><div class="opts">'+
      pr.materials.map(function(m, mi){
        return '<label class="opt"><input type="radio" name="material" value="'+m.id+'" id="mat-'+m.id+'"'+(pi===0&&mi===0?' checked':'')+'><span>'+esc(m.label)+'</span></label>';
      }).join('')+'</div></div>';
  }).join('');

  $('#q-region').innerHTML = PRICING.regions.map(function(r,i){
    return '<label class="opt"><input type="radio" name="region" value="'+r.id+'" id="reg-'+r.id+'"'+(i===0?' checked':'')+'><span>'+esc(r.label)+'</span></label>';
  }).join('');
  function currentRegion(){ var v=($('input[name=region]:checked')||{}).value; return PRICING.regions.filter(function(r){ return r.id===v; })[0] || PRICING.regions[0]; }
  function paintDelivery(){
    var r = currentRegion(), keep = ($('input[name=delivery]:checked')||{}).value || PRICING.delivery[0].id;
    $('#q-delivery').innerHTML = PRICING.delivery.map(function(d){
      var where = d.id==='f2f' && r.f2f ? r.f2f+' · '+r.lead+', ' : r.lead.charAt(0).toUpperCase()+r.lead.slice(1)+', ';
      return '<label class="opt"><input type="radio" name="delivery" value="'+d.id+'" id="eta-'+d.id+'"'+(d.id===keep?' checked':'')+'><span>'+esc(d.label)+' · '+fmt0.format(d.fee[r.id])+'<small>'+esc(where+d.days)+'</small></span></label>';
    }).join('');
  }
  paintDelivery();
  function currentDelivery(){ var v=($('input[name=delivery]:checked')||{}).value; return PRICING.delivery.filter(function(d){ return d.id===v; })[0] || PRICING.delivery[0]; }

  function fits(size, max){ var a=size.slice().sort(function(x,y){return y-x;}), b=max.slice().sort(function(x,y){return y-x;}); return a[0]<=b[0] && a[1]<=b[1] && a[2]<=b[2]; }
  function currentMat(){ var v=($('input[name=material]:checked')||{}).value; return MATS.filter(function(m){ return m.id===v; })[0] || MATS[0]; }

  /* ---- STL parsing ---- */
  function parseSTL(buf){
    var dv = new DataView(buf);
    var isBinary = false;
    if(buf.byteLength >= 84){
      var n = dv.getUint32(80, true);
      if(84 + n*50 === buf.byteLength) isBinary = true;
    }
    if(!isBinary){
      var head = new TextDecoder().decode(new Uint8Array(buf, 0, Math.min(buf.byteLength, 512)));
      if(!/^\s*solid/i.test(head) || !/facet/i.test(new TextDecoder().decode(new Uint8Array(buf,0,Math.min(buf.byteLength,4096))))){
        if(buf.byteLength >= 84) isBinary = true; else throw new Error('This file is not a valid STL.');
      }
    }
    var pos;
    if(isBinary){
      var count = dv.getUint32(80, true);
      if(84 + count*50 > buf.byteLength) throw new Error('This STL file looks damaged or incomplete.');
      pos = new Float32Array(count*9);
      for(var i=0;i<count;i++){
        var o = 84 + i*50 + 12;
        for(var k=0;k<9;k++) pos[i*9+k] = dv.getFloat32(o + k*4, true);
      }
    } else {
      var text = new TextDecoder().decode(new Uint8Array(buf));
      var re = /vertex\s+([-+\d.eE]+)\s+([-+\d.eE]+)\s+([-+\d.eE]+)/g, m, arr = [];
      while((m = re.exec(text))) arr.push(+m[1], +m[2], +m[3]);
      if(!arr.length || arr.length % 9) throw new Error('This STL file has no readable triangles.');
      pos = new Float32Array(arr);
    }
    var tris = pos.length/9, vol = 0;
    var min=[Infinity,Infinity,Infinity], max=[-Infinity,-Infinity,-Infinity];
    for(var t=0;t<tris;t++){
      var a=t*9;
      var ax=pos[a],ay=pos[a+1],az=pos[a+2],bx=pos[a+3],by=pos[a+4],bz=pos[a+5],cx=pos[a+6],cy=pos[a+7],cz=pos[a+8];
      vol += (ax*(by*cz-bz*cy) - ay*(bx*cz-bz*cx) + az*(bx*cy-by*cx)) / 6;
      for(var j=0;j<9;j++){ var c=j%3, v=pos[a+j]; if(v<min[c])min[c]=v; if(v>max[c])max[c]=v; }
    }
    if(!tris) throw new Error('This STL file has no triangles.');
    return {pos:pos, tris:tris, volMm3:Math.abs(vol), size:[max[0]-min[0],max[1]-min[1],max[2]-min[2]], min:min, max:max};
  }

  /* ---- colour helpers ---- */
  var COL = {}; COLOURS.groups.forEach(function(gr){ gr.items.forEach(function(c){ c.group = gr.id; c.kind = c.kind || 'solid'; c.extra = c.extra || 0; COL[c.id] = c; }); });
  var FINISH = {matte:{label:'Matte', g:0.08}, satin:{label:'Satin', g:0.35}, gloss:{label:'Gloss', g:0.75}};
  function hexRgb(h){ h = h.replace('#',''); if(h.length===3) h = h.split('').map(function(x){return x+x;}).join(''); var n = parseInt(h,16); return [n>>16&255, n>>8&255, n&255]; }
  function mix(a,b,t){ return [a[0]+(b[0]-a[0])*t, a[1]+(b[1]-a[1])*t, a[2]+(b[2]-a[2])*t]; }
  function hsl(h,s,l){ var k=function(n){return (n+h/30)%12;}, a=s*Math.min(l,1-l), f=function(n){return l-a*Math.max(-1,Math.min(k(n)-3,9-k(n),1));}; return [f(0)*255,f(8)*255,f(4)*255]; }
  var TEMPER = ['#C9A24A','#A8643A','#6A4A8C','#2E5C9C'].map(hexRgb);
  function availFor(mat){
    var out = [];
    (COLOURS.AVAIL[mat.id] || ['essentials']).forEach(function(k){
      if(k.indexOf('c:')===0){ if(COL[k.slice(2)]) out.push(COL[k.slice(2)]); }
      else COLOURS.groups.forEach(function(gr){ if(gr.id===k) out = out.concat(gr.items); });
    });
    return out;
  }
  // a "look" is {id, hex, code, finish}; id 'custom' uses hex
  function lookColour(look){
    if(look.id === 'custom') return {id:'custom', label:'Custom match'+(look.code?' ('+look.code+')':''), hex:look.hex, kind:'solid', extra:COLOURS.customExtra};
    return COL[look.id] || COL.black;
  }
  function lookLabel(look, mat){
    var c = lookColour(look), f = (COLOURS.finishFor.indexOf(mat.proc.id) > -1 && ['solid','marble','wood'].indexOf(c.kind) > -1) ? ' · '+FINISH[look.finish||'matte'].label : '';
    return c.label + f;
  }
  function swatchCss(c){
    var h = c.hex;
    switch(c.kind){
      case 'silk': case 'metal': return 'linear-gradient(135deg,'+h+' 0%,#fff 38%,'+h+' 60%,'+h+' 100%)';
      case 'dual': return 'linear-gradient(135deg,'+h+' 0 50%,'+c.hex2+' 50% 100%)';
      case 'rainbow': return 'conic-gradient(#e05050,#f0b030,#5fc060,#3a8be0,#9a5ad0,#e05050)';
      case 'temper': return 'linear-gradient(180deg,#C9A24A,#A8643A 35%,#6A4A8C 68%,#2E5C9C)';
      case 'glow': return 'radial-gradient(circle,#eaffd8 0 30%,'+h+' 70%)';
      case 'clear': return 'linear-gradient(135deg,rgba(255,255,255,.9),rgba(190,215,225,.5)),repeating-conic-gradient(#ccc 0 25%,#fff 0 50%) 0/8px 8px';
      case 'marble': return 'linear-gradient(120deg,#eeece8 0 40%,#9a9a98 44%,#eeece8 48% 70%,#b5b4b0 72%,#eeece8 75%)';
      case 'wood': return 'repeating-linear-gradient(170deg,#b0845a 0 4px,#8a5f3b 4px 6px)';
      case 'carbon': return 'repeating-linear-gradient(45deg,#2a2c2f 0 3px,#3a3d41 3px 6px),#2a2c2f';
      default: return h;
    }
  }

  /* ---- shaded preview, coloured ---- */
  function draw(canvas, mesh, opt){
    opt = opt || {};
    var dpr = window.devicePixelRatio || 1, W = canvas.clientWidth || 120, H = canvas.clientHeight || 120;
    if(canvas.width !== Math.round(W*dpr) || canvas.height !== Math.round(H*dpr)){ canvas.width = W*dpr; canvas.height = H*dpr; }
    var g = canvas.getContext('2d'); g.setTransform(dpr,0,0,dpr,0,0); g.clearRect(0,0,W,H);
    if(opt.dark){ g.fillStyle = '#0c0e10'; g.fillRect(0,0,W,H); }
    var c = opt.look ? lookColour(opt.look) : {kind:'plain'};
    var gloss = c.kind==='metal' ? c.g : c.kind==='silk'||c.kind==='dual'||c.kind==='rainbow'||c.kind==='temper' ? 0.7 : c.kind==='clear' ? 0.8 : c.kind==='carbon' ? 0.15 : opt.look ? FINISH[opt.look.finish||'matte'].g : 0;
    var base = c.hex ? hexRgb(c.hex) : null, base2 = c.hex2 ? hexRgb(c.hex2) : null;
    var p = mesh.pos, n = mesh.tris, step = Math.max(1, Math.ceil(n/(opt.maxFaces||40000)));
    var cxm=(mesh.min[0]+mesh.max[0])/2, cym=(mesh.min[1]+mesh.max[1])/2, czm=(mesh.min[2]+mesh.max[2])/2, zs = mesh.size[2] || 1;
    var ry = opt.ry != null ? opt.ry : -0.7, rx = opt.rx != null ? opt.rx : 0.55, cy1=Math.cos(ry), sy1=Math.sin(ry), cx1=Math.cos(rx), sx1=Math.sin(rx);
    function tr(x,y,z){ x-=cxm; y-=cym; z-=czm;           // STL z-up → screen y-up
      var X = x*cy1 - y*sy1, Y0 = x*sy1 + y*cy1;
      var Y = z*cx1 - Y0*sx1, Z = z*sx1 + Y0*cx1;
      return [X,Y,Z]; }
    var faces=[], span=Math.max(mesh.size[0],mesh.size[1],mesh.size[2])||1, s=Math.min(W,H)*0.78/span;
    for(var t=0;t<n;t+=step){
      var a=t*9, A=tr(p[a],p[a+1],p[a+2]), B=tr(p[a+3],p[a+4],p[a+5]), C=tr(p[a+6],p[a+7],p[a+8]);
      var ux=B[0]-A[0],uy=B[1]-A[1],uz=B[2]-A[2],vx=C[0]-A[0],vy=C[1]-A[1],vz=C[2]-A[2];
      var nx=uy*vz-uz*vy, ny=uz*vx-ux*vz, nz=ux*vy-uy*vx, l=Math.hypot(nx,ny,nz)||1;
      var shade = Math.abs((nx*0.35 + ny*0.6 + nz*0.72)/l);
      var wx=(p[a]+p[a+3]+p[a+6])/3, wy=(p[a+1]+p[a+4]+p[a+7])/3, wz=(p[a+2]+p[a+5]+p[a+8])/3;
      faces.push([A,B,C,(A[2]+B[2]+C[2])/3,shade,(wz-mesh.min[2])/zs,wx,wy,wz,Math.abs(nx/l),t]);
    }
    faces.sort(function(f1,f2){ return f1[3]-f2[3]; });
    g.globalAlpha = c.kind==='clear' ? 0.5 : 1;
    for(var i=0;i<faces.length;i++){
      var f=faces[i], sh=f[4], col;
      if(c.kind==='plain'){ var L=Math.round(70+150*sh); col=[L,L*0.95,L*0.9]; }
      else {
        var b0 = base;
        if(c.kind==='rainbow') b0 = hsl(f[5]*300, 0.75, 0.55);
        else if(c.kind==='temper'){ var q=Math.min(2.999,f[5]*3), k=Math.floor(q); b0 = mix(TEMPER[k],TEMPER[k+1],q-k); }
        else if(c.kind==='dual') b0 = mix(base, base2, Math.min(1,Math.max(0,(f[9]-0.25)*2)));
        else if(c.kind==='marble'){ var v=Math.sin((f[6]+f[7]*0.6)*0.22 + Math.sin(f[8]*0.27)*2.2); b0 = mix(base,[140,140,138],Math.pow(Math.abs(v),16)*0.85); }
        else if(c.kind==='wood'){ b0 = mix(base,[125,85,52],0.5+0.5*Math.sin(f[8]*1.3+Math.sin(f[6]*0.12)*1.5)); }
        else if(c.kind==='carbon'){ var hsh=(Math.sin(f[10]*12.9898)*43758.5453)%1; b0 = mix(base,[70,74,78],Math.abs(hsh)*0.35); }
        var light, emis = 0;
        if(c.kind==='glow' && opt.dark){ b0 = [140,255,120]; light = 0.65 + 0.35*sh; emis = 0; }
        else light = 0.3 + 0.7*sh;
        var spec = gloss ? Math.pow(sh, 4 + 26*gloss) * gloss * (c.kind==='metal' ? 1.05 : 0.8) : 0;
        if(c.kind==='metal') light = 0.22 + 0.78*Math.pow(sh, 1 + gloss);
        col = [b0[0]*light + 255*spec + emis, b0[1]*light + 255*spec + emis, b0[2]*light + 255*spec + emis];
      }
      g.fillStyle = 'rgb('+Math.min(255,Math.round(col[0]))+','+Math.min(255,Math.round(col[1]))+','+Math.min(255,Math.round(col[2]))+')';
      g.beginPath();
      g.moveTo(W/2+f[0][0]*s, H/2-f[0][1]*s); g.lineTo(W/2+f[1][0]*s, H/2-f[1][1]*s); g.lineTo(W/2+f[2][0]*s, H/2-f[2][1]*s);
      g.closePath(); g.fill();
      if(c.kind!=='clear'){ g.strokeStyle = g.fillStyle; g.lineWidth = 0.5; g.stroke(); }
    }
    g.globalAlpha = 1;
    if(c.kind==='glow' && opt.dark){ g.globalCompositeOperation='lighter'; g.filter='blur(14px)'; g.globalAlpha=0.35; g.drawImage(canvas,0,0,W,H); g.filter='none'; g.globalAlpha=1; g.globalCompositeOperation='source-over'; }
  }

  // a sample piece for the preview before any file is added: an octagonal pawn
  function samplePawn(){
    var prof=[[0,0],[13,0],[13,3],[10,5.5],[7,8],[5.5,19],[8,21],[8,22.5],[4.5,24],[6.5,28],[7.2,32],[6.5,36],[4,39],[0,40.5]], seg=8, arr=[];
    for(var i=0;i<prof.length-1;i++) for(var j=0;j<seg;j++){
      var a0=(j/seg+1/16)*Math.PI*2, a1=((j+1)/seg+1/16)*Math.PI*2, r0=prof[i][0], z0=prof[i][1], r1=prof[i+1][0], z1=prof[i+1][1];
      var P=function(r,an,z){ return [r*Math.cos(an), r*Math.sin(an), z]; };
      var A=P(r0,a0,z0), B=P(r0,a1,z0), C=P(r1,a1,z1), D=P(r1,a0,z1);
      arr.push.apply(arr, A.concat(B,C)); arr.push.apply(arr, A.concat(C,D));
    }
    var pos=new Float32Array(arr), min=[Infinity,Infinity,Infinity], max=[-Infinity,-Infinity,-Infinity];
    for(var k=0;k<pos.length;k++){ var c=k%3; if(pos[k]<min[c])min[c]=pos[k]; if(pos[k]>max[c])max[c]=pos[k]; }
    return {pos:pos, tris:pos.length/9, size:[max[0]-min[0],max[1]-min[1],max[2]-min[2]], min:min, max:max};
  }
  var SAMPLE = samplePawn();

  /* ---- file handling ---- */
  var drop = $('#q-drop'), input = $('#q-file'), status = $('#q-status');
  function addFiles(list){
    var files = [].slice.call(list).filter(function(f){ return /\.stl$/i.test(f.name); });
    var skipped = list.length - files.length;
    status.className = 'status'; status.textContent = skipped ? skipped+' file'+(skipped>1?'s were':' was')+' skipped: only .stl files can be measured.' : '';
    files.forEach(function(f){
      if(f.size > 200*1024*1024){ status.className='status err'; status.textContent = f.name+' is over 200 MB. Send it by email instead.'; return; }
      var r = new FileReader();
      r.onload = function(){
        try{ var mesh = parseSTL(r.result); parts.push({id:nextId++, name:f.name, mesh:mesh, qty:1, file:f}); render(); }
        catch(e){ status.className='status err'; status.textContent = f.name+': '+e.message; }
      };
      r.onerror = function(){ status.className='status err'; status.textContent = 'Could not read '+f.name+'.'; };
      r.readAsArrayBuffer(f);
    });
  }
  input.addEventListener('change', function(){ addFiles(input.files); input.value=''; });
  ['dragenter','dragover'].forEach(function(ev){ drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave','drop'].forEach(function(ev){ drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function(e){ if(e.dataTransfer && e.dataTransfer.files) addFiles(e.dataTransfer.files); });

  /* ---- colour & finish ---- */
  var look = {id:'black', finish:'matte', hex:'#C9A24A', code:''};   // the colour for all parts
  var perFile = false, target = null;                                  // per-file mode: which part the swatches paint
  var view = {ry:-0.7, rx:0.45, dark:false};
  var sw = $('#q-swatches'), prev = $('#q-cprev');
  function cloneLook(l){ return {id:l.id, finish:l.finish, hex:l.hex, code:l.code}; }
  function partLook(p){ return perFile && p.look ? p.look : look; }
  function editing(){ return perFile && target ? (target.look = target.look || cloneLook(look)) : look; }
  function buildSwatches(){
    var mat = currentMat(), avail = availFor(mat), ids = avail.map(function(c){ return c.id; });
    // keep choices valid for this material
    var fix = function(l){ if(l.id !== 'custom' && ids.indexOf(l.id) < 0) l.id = ids[0]; if(l.id === 'custom' && COLOURS.customFor.indexOf(mat.proc.id) < 0) l.id = ids[0]; };
    fix(look); parts.forEach(function(p){ if(p.look) fix(p.look); });
    var groups = {}, order = [];
    avail.forEach(function(c){ if(!groups[c.group]){ groups[c.group] = []; order.push(c.group); } groups[c.group].push(c); });
    sw.innerHTML = order.map(function(gid){
      var gr = COLOURS.groups.filter(function(x){ return x.id===gid; })[0];
      return '<div class="swg"><p class="swg-head">'+esc(gr.label)+(gr.note?' <span>'+esc(gr.note)+'</span>':'')+'</p><div class="sws">'+
        groups[gid].map(function(c){
          return '<label class="sw" title="'+esc(c.label)+(c.extra?' · +'+Math.round(c.extra*100)+'%':'')+'"><input type="radio" name="colour" value="'+c.id+'" aria-label="'+esc(c.label)+'">'+
            '<span style="background:'+swatchCss(c)+'"></span>'+(c.extra?'<i aria-hidden="true">+</i>':'')+'</label>';
        }).join('')+'</div></div>';
    }).join('');
    var canCustom = COLOURS.customFor.indexOf(mat.proc.id) > -1, canFinish = COLOURS.finishFor.indexOf(mat.proc.id) > -1;
    $('#q-custom').hidden = !canCustom; $('#q-finish-wrap').hidden = !canFinish;
    syncControls();
  }
  function syncControls(){
    var l = editing(), mat = currentMat(), c = lookColour(l);
    [].forEach.call(sw.querySelectorAll('input[name=colour]'), function(i){ i.checked = i.value === l.id; });
    $('#q-custom-on').checked = l.id === 'custom'; $('#q-hex').value = l.hex; $('#q-code').value = l.code || '';
    [].forEach.call(root.querySelectorAll('input[name=finish]'), function(i){ i.checked = i.value === (l.finish||'matte'); });
    $('#q-finish-wrap').classList.toggle('off', c.kind !== 'solid' && c.kind !== 'marble' && c.kind !== 'wood');
    $('#q-cname').textContent = lookLabel(l, mat) + (c.extra ? ' · +'+Math.round(c.extra*100)+'% material' : '');
    $('#q-ctarget').textContent = perFile && target ? 'Painting: '+target.name : (perFile ? 'Pick a file below, then a colour' : 'All files');
    $('#q-lights').hidden = false;
    drawPreview();
  }
  var raf = 0;
  function drawPreview(fast){
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(function(){
      var p = perFile && target ? target : parts[0];
      draw(prev, p ? p.mesh : SAMPLE, {look: editing(), dark: view.dark, ry: view.ry, rx: view.rx, maxFaces: fast ? 9000 : 40000});
    });
  }
  sw.addEventListener('change', function(e){ if(e.target.name !== 'colour') return; editing().id = e.target.value; afterLook(); });
  root.addEventListener('change', function(e){ if(e.target.name === 'finish'){ editing().finish = e.target.value; afterLook(); } });
  $('#q-custom-on').addEventListener('change', function(){ if(this.checked){ editing().id = 'custom'; afterLook(); } });
  $('#q-hex').addEventListener('input', function(){ var l = editing(); l.hex = this.value; l.id = 'custom'; afterLook(); });
  $('#q-code').addEventListener('input', function(){ var l = editing(); l.code = this.value.slice(0,40); l.id = 'custom'; afterLook(); });
  $('#q-lights').addEventListener('click', function(){ view.dark = !view.dark; this.setAttribute('aria-pressed', view.dark); this.textContent = view.dark ? 'Lights on' : 'Lights off'; drawPreview(); });
  $('#q-surprise').addEventListener('click', function(){
    var avail = availFor(currentMat()); var c = avail[Math.floor(Math.random()*avail.length)];
    editing().id = c.id; afterLook();
  });
  $('#q-perfile').addEventListener('change', function(){
    perFile = this.checked; target = perFile ? (parts[0] || null) : null;
    if(perFile) parts.forEach(function(p){ p.look = p.look || cloneLook(look); });
    render();
  });
  function afterLook(noRedraw){ syncControls(); if(!noRedraw) paintParts(); calc(); }
  function paintParts(){
    [].forEach.call($('#q-parts').querySelectorAll('.part'), function(li){
      var p = parts.filter(function(x){ return x.id == li.dataset.id; })[0]; if(!p) return;
      draw(li.querySelector('canvas'), p.mesh, {look: partLook(p)});
      var chip = li.querySelector('.pchip'); if(chip){ chip.style.background = swatchCss(lookColour(partLook(p))); chip.title = lookLabel(partLook(p), currentMat()); }
      li.classList.toggle('target', perFile && target === p);
    });
  }
  // drag to rotate the preview
  (function(){
    var down = null;
    prev.addEventListener('pointerdown', function(e){ down = {x:e.clientX, y:e.clientY, ry:view.ry, rx:view.rx}; prev.setPointerCapture(e.pointerId); });
    prev.addEventListener('pointermove', function(e){ if(!down) return; view.ry = down.ry - (e.clientX-down.x)*0.01; view.rx = Math.max(-1.2, Math.min(1.4, down.rx + (e.clientY-down.y)*0.01)); drawPreview(true); });
    var up = function(){ if(down){ down = null; drawPreview(); } };
    prev.addEventListener('pointerup', up); prev.addEventListener('pointercancel', up);
    prev.addEventListener('keydown', function(e){ var d = {ArrowLeft:[0.2,0], ArrowRight:[-0.2,0], ArrowUp:[0,-0.15], ArrowDown:[0,0.15]}[e.key]; if(!d) return; e.preventDefault(); view.ry += d[0]; view.rx = Math.max(-1.2, Math.min(1.4, view.rx + d[1])); drawPreview(); });
    window.addEventListener('resize', function(){ drawPreview(); });
  })();

  function unitScale(){ return ($('input[name=unit]:checked')||{}).value === 'in' ? 25.4 : 1; }

  function render(){
    var u = unitScale(), list = $('#q-parts');
    $('#q-empty').hidden = parts.length > 0;
    list.innerHTML = parts.map(function(p){
      var sz = p.mesh.size.map(function(v){ return num(v*u,1); }).join(' × ');
      var cm3 = p.mesh.volMm3 * u*u*u / 1000;
      var mat = currentMat(), mm = p.mesh.size.map(function(v){ return v*u; });
      var warn = Math.max.apply(null,mm) < 3 ? '<span class="warn">Very small. If it was modelled in inches, switch units.</span>'
               : !fits(mm, mat.proc.maxMm) ? '<span class="warn">Too big for '+esc(mat.proc.label)+' (max '+mat.proc.maxMm.join('×')+' mm). We can split it or print it another way: mention it in the notes.</span>' : '';
      return '<li class="part" data-id="'+p.id+'"><canvas aria-hidden="true"></canvas><div class="pinfo"><b title="'+esc(p.name)+'">'+esc(p.name)+'</b>'+
        '<span class="mono">'+sz+' mm</span><span class="mono">'+num(cm3,2)+' cm³ · '+p.mesh.tris.toLocaleString('en-IE')+' triangles</span>'+warn+'</div>'+
        '<div class="pctl">'+(perFile?'<button type="button" class="pchip" aria-label="Choose colour for '+esc(p.name)+'"></button>':'')+'<div class="stepper sm"><button type="button" data-d="-1" aria-label="One less">−</button><input type="number" min="1" max="999" value="'+p.qty+'" aria-label="Quantity of '+esc(p.name)+'"><button type="button" data-d="1" aria-label="One more">+</button></div>'+
        '<button type="button" class="rm" aria-label="Remove '+esc(p.name)+'">Remove</button></div></li>';
    }).join('');
    [].forEach.call(list.querySelectorAll('.part'), function(li){
      var p = parts.filter(function(x){ return x.id == li.dataset.id; })[0];
      var chip = li.querySelector('.pchip'); if(chip) chip.onclick = function(){ target = p; syncControls(); paintParts(); };
      var q = li.querySelector('input');
      li.querySelectorAll('.stepper button').forEach(function(b){ b.onclick = function(){ p.qty = Math.max(1, Math.min(999, (parseInt(q.value,10)||1) + parseInt(b.dataset.d,10))); q.value = p.qty; calc(); }; });
      q.oninput = function(){ p.qty = Math.max(1, Math.min(999, parseInt(q.value,10)||1)); calc(); };
      li.querySelector('.rm').onclick = function(){ parts = parts.filter(function(x){ return x !== p; }); if(target === p) target = parts[0] || null; render(); };
    });
    $('#q-perfile-wrap').hidden = parts.length < 2;
    if(parts.length < 2 && perFile){ perFile = false; $('#q-perfile').checked = false; target = null; }
    if(perFile && !target) target = parts[0] || null;
    paintParts(); syncControls();
    calc();
  }

  var priced = {seq:0, timer:0};
  function calc(){
    var u = unitScale();
    var mat = currentMat();
    var pieces = 0, cm3 = 0;
    parts.forEach(function(p){ pieces += p.qty; cm3 += p.qty * p.mesh.volMm3 * u*u*u / 1000; });
    var eta = currentDelivery(), reg = currentRegion(), fee = eta.fee[reg.id];
    $('#t-files').textContent = parts.length;
    $('#t-pieces').textContent = pieces;
    $('#t-vol').textContent = num(cm3,2) + ' cm³';
    $('#t-mat').textContent = mat.label + ' · ' + mat.proc.label;
    var looks = {}; parts.forEach(function(p){ looks[lookLabel(partLook(p), mat)] = partLook(p); });
    var lk = Object.keys(looks), cdd = $('#t-col');
    if(!parts.length || lk.length === 1){ var one = parts.length ? looks[lk[0]] : look; cdd.innerHTML = '<span class="dot" style="background:'+swatchCss(lookColour(one))+'"></span>'+esc(lookLabel(one, mat)); }
    else cdd.innerHTML = lk.slice(0,4).map(function(k){ return '<span class="dot" title="'+esc(k)+'" style="background:'+swatchCss(lookColour(looks[k]))+'"></span>'; }).join('')+esc(lk.length+' colours');
    $('#t-eta').textContent = eta.label + ' · ' + reg.label + ' · ' + fmt0.format(fee);
    $('#t-lead').textContent = reg.lead + (eta.id==='f2f' ? ', delivered by hand' : '');
    var tooBig = parts.filter(function(p){ return !fits(p.mesh.size.map(function(v){return v*u;}), mat.proc.maxMm); }).length;
    $('#t-big').hidden = !tooBig; $('#t-big').textContent = tooBig ? tooBig+' part'+(tooBig>1?'s are':' is')+' larger than the '+mat.proc.label+' build size. The price assumes it can be printed; we will confirm.' : '';
    var qf = $('#q-summary').form; if(qf) qf._extraFiles = parts.map(function(p){ return p.file; });   // the STLs go with the request

    var seq = ++priced.seq;
    clearTimeout(priced.timer);
    if(!parts.length){
      $('#t-price').textContent = '—'; $('#t-min').hidden = true; $('#t-large').hidden = true;
      $('#q-send').disabled = true; $('#q-summary').value = ''; return;
    }
    $('#t-price').textContent = '…'; $('#q-send').disabled = true;
    var snap = parts.map(function(p){ return {p:p, look:partLook(p)}; });
    var payload = {material: mat.id, region: reg.id, delivery: eta.id, parts: snap.map(function(x){
      return {cm3: x.p.mesh.volMm3*u*u*u/1000, maxMm: Math.max.apply(null, x.p.mesh.size)*u, qty: x.p.qty, extra: lookColour(x.look).extra};
    })};
    function finish(q){
      if(seq !== priced.seq) return;   // a newer change is already being priced
      var large = (q && q.large) || [], nLarge = large.filter(Boolean).length;
      $('#t-price').textContent = q ? fmt.format(q.total) : 'On request';
      $('#t-min').hidden = !(q && q.minimumApplied);
      $('#t-large').hidden = !nLarge; $('#t-large').textContent = nLarge ? nLarge+' part'+(nLarge>1?'s have':' has')+' a side longer than '+q.largeOverMm+' mm, so '+(nLarge>1?'they are':'it is')+' priced at '+q.largeFactor+'× as a large-format print.' : '';
      $('#q-send').disabled = false;
      $('#q-summary').value = [
        'Material: '+mat.label+' ('+mat.proc.label+', '+mat.proc.tol+')', 'Units: '+(u===1?'mm':'inch'),
        snap.map(function(x, i){ var p = x.p, l = x.look, c = lookColour(l); return '- '+p.name+' × '+p.qty+': '+num(p.mesh.volMm3*u*u*u/1000,2)+' cm³, '+p.mesh.size.map(function(v){return num(v*u,1);}).join(' × ')+' mm'+(large[i]?' (large format ×'+q.largeFactor+')':'')+', colour: '+lookLabel(l, mat)+(l.id==='custom'?' ['+l.hex+']':'')+(c.extra?' (+'+Math.round(c.extra*100)+'%)':''); }).join('\n'),
        'Total volume: '+num(cm3,2)+' cm³ ('+pieces+' pieces)', 'Estimate: '+(q ? fmt.format(q.total) : 'not available, please price manually'),
        'Delivery: '+eta.label+', '+reg.label+(eta.id==='f2f'&&reg.f2f?' ('+reg.f2f+')':'')+', '+reg.lead+', '+fmt.format(fee)
      ].join('\n');
    }
    priced.timer = setTimeout(function(){
      fetch('/api/quote', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload)})
        .then(function(r){ if(!r.ok) throw new Error(r.status); return r.json(); })
        .then(finish, function(){ finish(null); });
    }, 250);
  }

  root.addEventListener('change', function(e){ if(e.target.name === 'material'){ buildSwatches(); render(); } if(e.target.name === 'unit') render(); if(e.target.name === 'delivery') calc(); if(e.target.name === 'region'){ paintDelivery(); calc(); } });
  buildSwatches();
  render();
})();
