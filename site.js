/* OGCODE — shared site script */

/* Always open a page at the top (unless the link points to a section, like #work).
   Some viewers restore an old scroll position after the page loads, so this re-applies
   for the first moments and stops as soon as the visitor scrolls on their own. */
(function(){
  try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch(e){}
  var userMoved = false;
  ['wheel','touchstart','keydown','mousedown'].forEach(function(ev){ window.addEventListener(ev, function(){ userMoved = true; }, {passive:true, once:true}); });
  function toTop(){
    if (userMoved) return;
    if (location.hash && document.getElementById(location.hash.slice(1))) return;
    var root = document.documentElement, prev = root.style.scrollBehavior;
    root.style.scrollBehavior = 'auto';
    window.scrollTo(0, 0);
    try { if (!location.hash) { var top = document.querySelector('header.top') || document.body; if (top && top.scrollIntoView) top.scrollIntoView({block:'start', inline:'nearest', behavior:'auto'}); } } catch(e){}
    root.style.scrollBehavior = prev;
  }
  toTop();
  document.addEventListener('DOMContentLoaded', toTop);
  window.addEventListener('load', function(){ toTop(); [60, 200, 500, 1000].forEach(function(t){ setTimeout(toTop, t); }); });
  window.addEventListener('pageshow', function(e){ if (e.persisted) { userMoved = false; toTop(); } });
})();

/* Pop-up dialogs: any button with data-open="id" opens <dialog id>. */
(function(){
  document.addEventListener('click', function(e){
    var o = e.target.closest('[data-open]');
    if (o) { var d = document.getElementById(o.getAttribute('data-open')); if (d && d.showModal) { d.showModal(); } return; }
    var c = e.target.closest('dialog [data-close]'); if (c) { c.closest('dialog').close(); return; }
    if (e.target.tagName === 'DIALOG') e.target.close();   // click on the backdrop
  });
})();

/* ==== SETTINGS ====
   Every form on the site goes to your Google Sheet lead tracker.
   Paste the Web app URL from Apps Script here (see pipeline/SETUP.txt).
   It looks like https://script.google.com/macros/s/AKfy…/exec */
var SHEET_ENDPOINT = 'https://script.google.com/macros/s/AKfycbxXgSFHGDYVWU78uY3jozXMp236kjB48lcmT_91vircsUe653OuNGE5AX0c4j10Dg-N5w/exec';
var MAX_FILES = 5, MAX_FILE_MB = 10;

(function(){
  // media that can't load shows a labelled placeholder instead of a broken icon
  document.querySelectorAll('.frame').forEach(function(f){
    var m=f.querySelector('img,video'); if(!m) return;
    var fail=function(){f.classList.add('missing')};
    m.addEventListener('error',fail);
    if(m.tagName==='IMG' && m.complete && m.naturalWidth===0 && m.getAttribute('src')) fail();
  });

  // photo reels: arrows + counter, swipe via scroll-snap
  document.querySelectorAll('.reel').forEach(function(reel){
    var track=reel.querySelector('.track'), n=track.children.length;
    if(n<2) return;
    var ctrl=document.createElement('div'); ctrl.className='ctrl';
    ctrl.innerHTML='<button type="button" aria-label="Previous photo">‹</button><span class="count mono">1 / '+n+'</span><button type="button" aria-label="Next photo">›</button>';
    reel.appendChild(ctrl);
    var btns=ctrl.querySelectorAll('button'), count=ctrl.querySelector('.count');
    var idx=function(){return Math.round(track.scrollLeft/track.clientWidth)};
    var go=function(i){i=(i+n)%n;track.scrollTo({left:i*track.clientWidth,behavior:'smooth'})};
    btns[0].onclick=function(){go(idx()-1)};
    btns[1].onclick=function(){go(idx()+1)};
    track.addEventListener('scroll',function(){count.textContent=(idx()+1)+' / '+n},{passive:true});
  });

  // copy email
  var copy=document.getElementById('copy'), email=document.getElementById('email');
  if(copy&&email) copy.addEventListener('click',function(){
    var done=function(){copy.textContent='Copied';setTimeout(function(){copy.textContent='Copy'},1600)};
    var select=function(){var r=document.createRange();r.selectNodeContents(email);var s=getSelection();s.removeAllRanges();s.addRange(r)};
    try{navigator.clipboard.writeText(email.textContent).then(done,select)}catch(e){select()}
  });

  // cart count badge in the menu (all pages)
  try{
    var c=JSON.parse(localStorage.getItem('ogcode-cart')||'{}')||{}, n=0;
    Object.keys(c).forEach(function(k){ n+= (c[k]>0?c[k]:0); });
    if(n && !document.getElementById('shop-data')) document.querySelectorAll('nav a[href="shop.html"]').forEach(function(a){ var b=document.createElement('span'); b.className='badge'; b.textContent=n; a.appendChild(b); });
  }catch(e){}

  var yr=document.getElementById('yr'); if(yr) yr.textContent=new Date().getFullYear();

  // close mobile menu after picking a link
  document.querySelectorAll('.menu .drop a').forEach(function(a){a.addEventListener('click',function(){a.closest('details').open=false})});
})();

/* File pickers (project brief): keep a list the visitor can add to and remove from. */
document.querySelectorAll('.files-drop input[type=file]').forEach(function(input){
  var form = input.form, list = input.closest('.field').querySelector('.file-list'), drop = input.closest('.files-drop');
  form._picked = [];
  var size = function(b){ return b > 1048576 ? (b/1048576).toFixed(1)+' MB' : Math.max(1, Math.round(b/1024))+' KB'; };
  function show(){
    list.innerHTML = '';
    form._picked.forEach(function(f, i){
      var li = document.createElement('li'), big = f.size > MAX_FILE_MB*1048576;
      if (big) li.className = 'bad';
      var name = document.createElement('span'); name.textContent = f.name + ' · ' + size(f.size) + (big ? ' · too large, send a link instead' : '');
      var rm = document.createElement('button'); rm.type = 'button'; rm.textContent = '✕'; rm.setAttribute('aria-label', 'Remove ' + f.name);
      rm.onclick = function(){ form._picked.splice(i, 1); show(); };
      li.appendChild(name); li.appendChild(rm); list.appendChild(li);
    });
  }
  function add(files){
    Array.prototype.forEach.call(files, function(f){ if (form._picked.length < MAX_FILES) form._picked.push(f); });
    show();
  }
  input.addEventListener('change', function(){ add(input.files); input.value = ''; });
  ['dragenter','dragover'].forEach(function(ev){ drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.add('over'); }); });
  ['dragleave','drop'].forEach(function(ev){ drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.remove('over'); }); });
  drop.addEventListener('drop', function(e){ if (e.dataTransfer) add(e.dataTransfer.files); });
  form.addEventListener('reset', function(){ form._picked = []; setTimeout(show); });
});

function fileToBase64(f){
  return new Promise(function(ok, fail){
    var r = new FileReader();
    r.onload = function(){ ok(String(r.result).split(',')[1] || ''); };
    r.onerror = function(){ fail(new Error('Could not read ' + f.name)); };
    r.readAsDataURL(f);
  });
}

/* Send a form to the Google Sheet. Resolves with the reference id on success. */
function sendForm(form){
  if (SHEET_ENDPOINT.indexOf('YOUR_SCRIPT_ID') > -1)
    return Promise.reject(new Error('This form is not connected yet. Email ogcode3d@gmail.com or DM @o.gcode on Instagram instead.'));
  var fields = {};
  new FormData(form).forEach(function(v, k){
    if (typeof v !== 'string') return;                        // files are sent separately
    fields[k] = fields[k] ? fields[k] + ', ' + v : v;          // checkbox groups → "a, b"
  });
  var all = (form._picked || []).concat(form._extraFiles || []);
  var send = all.filter(function(f){ return f.size <= MAX_FILE_MB*1048576; }).slice(0, MAX_FILES);
  var skipped = all.filter(function(f){ return send.indexOf(f) < 0; });
  if (skipped.length) fields.files_not_attached = skipped.map(function(f){ return f.name; }).join(', ') + ' (too large or too many, ask for a link)';
  return Promise.all(send.map(function(f){
    return fileToBase64(f).then(function(d){ return { name: f.name, type: f.type || 'application/octet-stream', data: d }; });
  })).then(function(files){
    return fetch(SHEET_ENDPOINT, { method: 'POST', redirect: 'follow',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },           // plain text avoids a CORS preflight
      body: JSON.stringify({ fields: fields, files: files, page: location.pathname }) });
  }).then(function(r){
    return r.json().catch(function(){ return {}; }).then(function(j){
      if (r.ok && j.ok) return j;
      throw new Error((j.error || 'The form could not be sent.') + (j.error ? '' : ' Email ogcode3d@gmail.com instead.'));
    });
  }, function(err){
    if (err && /Could not read/.test(err.message)) throw err;
    throw new Error('No connection. Check your internet and try again, or email ogcode3d@gmail.com.');
  });
}

/* Wire up any form with data-send */
document.querySelectorAll('form[data-send]').forEach(function(form){
  var status=form.querySelector('.status'), btn=form.querySelector('button[type=submit]');
  form.addEventListener('submit',function(e){
    e.preventDefault();
    if(!form.reportValidity()) return;
    var label=btn.textContent; btn.disabled=true; btn.textContent='Sending…';
    status.className='status'; status.textContent='';
    var hasFiles=(form._picked||[]).length||(form._extraFiles||[]).length;
    btn.textContent=hasFiles?'Uploading…':'Sending…';
    sendForm(form).then(function(j){
      form.reset(); form.dispatchEvent(new Event('change'));
      status.className='status ok';
      status.textContent=(form.getAttribute('data-send')||'Sent. We\'ll get back to you by email.')+(j&&j.id?' Reference: '+j.id+'.':'');
    }).catch(function(err){
      status.className='status err'; status.textContent=err.message;
    }).finally(function(){btn.disabled=false;btn.textContent=label});
  });
});
