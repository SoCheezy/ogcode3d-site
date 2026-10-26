/* OGCODE — lattice disks FEA case study: results chart, table view, contour maps, lightbox. */
(function(){
  var dataEl = document.getElementById('fea-data'); if (!dataEl) return;
  var M = JSON.parse(dataEl.textContent).models;
  var FAM = {bcc:'BCC', i:'I-type', t:'Tetrahedral'};
  var $ = function(id){ return document.getElementById(id); };
  var nf = function(v, d){ return v.toLocaleString('en-US', {minimumFractionDigits:d, maximumFractionDigits:d}); };

  // metric definitions: how to read a value from a model, unit, decimals, note
  var METRICS = [
    {id:'force', tab:'Reaction force', title:'Maximum reaction force', unit:'kN', d:1, get:function(m){ return m.force == null ? null : m.force / 1000; },
     note:'Force needed to compress the disk by 0.5 mm. Higher means a stiffer disk.'},
    {id:'energy', tab:'Strain energy', title:'Total strain energy', unit:'J', d:1, get:function(m){ return m.energy ? m.energy[1] / 1000 : null; },
     note:'Energy stored in the structure under load.'},
    {id:'stressAvg', tab:'Avg. stress', title:'Average von Mises stress', unit:'MPa', d:0, get:function(m){ return m.stress ? m.stress[1] : null; },
     note:'How hard the material works on average. An even spread is the goal.'},
    {id:'stressMax', tab:'Peak stress', title:'Peak von Mises stress', unit:'MPa', d:0, get:function(m){ return m.stress ? m.stress[0] : null; },
     note:'The highest local stress, where the lattice concentrates load.'},
    {id:'strain', tab:'Peak strain', title:'Peak equivalent elastic strain', unit:'mm/mm', d:3, get:function(m){ return m.strain ? m.strain[0] : null; },
     note:'Lower values mean the structure is less likely to deform permanently.'},
    {id:'deform', tab:'Deformation', title:'Maximum total deformation', unit:'mm', d:3, get:function(m){ return m.deform[0]; },
     note:'Nearly equal for all disks: the load is a fixed 0.5 mm displacement.'}
  ];
  var cur = METRICS[0], view = 'chart';

  // ---------- tabs ----------
  function tabs(host, items, active, onPick){
    host.innerHTML = items.map(function(it){ return '<button type="button" role="tab" data-k="' + it.k + '" aria-selected="' + (it.k === active) + '">' + it.l + '</button>'; }).join('');
    host.addEventListener('click', function(e){
      var b = e.target.closest('button[data-k]'); if (!b) return;
      host.querySelectorAll('button').forEach(function(x){ x.setAttribute('aria-selected', x === b); });
      onPick(b.getAttribute('data-k'));
    });
  }

  // ---------- bar chart (horizontal, one bar per disk, coloured by unit-cell family) ----------
  var chart = $('chart'), tip = $('tip'), viz = $('viz');
  function drawChart(){
    var rows = M.map(function(m){ return {m:m, v:cur.get(m)}; });
    var max = Math.max.apply(null, rows.filter(function(r){ return r.v != null; }).map(function(r){ return r.v; }));
    var W = chart.clientWidth || 760, labelW = W < 520 ? 92 : 128, padR = 70, rowH = 40, bar = 22, top = 8, axisH = 26;
    var plotW = Math.max(120, W - labelW - padR), H = top + rows.length * rowH + axisH;
    var step = niceStep(max), ticks = [0];
    while (ticks[ticks.length - 1] < max - 1e-9) ticks.push(+(ticks[ticks.length - 1] + step).toFixed(6));
    var scaleMax = ticks[ticks.length - 1];
    var x = function(v){ return labelW + v / scaleMax * plotW; };
    var lead = rows.reduce(function(a, r){ return r.v != null && (a == null || r.v > a.v) ? r : a; }, null);
    var s = '<svg width="' + W + '" height="' + H + '" viewBox="0 0 ' + W + ' ' + H + '" aria-hidden="true">';
    ticks.forEach(function(t){
      s += '<line class="grid" x1="' + x(t) + '" x2="' + x(t) + '" y1="' + top + '" y2="' + (H - axisH + 4) + '"/>';
      s += '<text class="tick" x="' + x(t) + '" y="' + (H - 8) + '" text-anchor="middle">' + fmtTick(t) + '</text>';
    });
    rows.forEach(function(r, i){
      var y = top + i * rowH + (rowH - bar) / 2, cy = y + bar / 2;
      s += '<text class="rl" x="' + (labelW - 10) + '" y="' + (cy + 4) + '" text-anchor="end">' + (W < 520 && r.m.fam === 't' ? 'Tetra' : r.m.name) + ' ' + r.m.dens + '%</text>';
      if (r.v == null){
        s += '<text class="na" x="' + (labelW + 4) + '" y="' + (cy + 4) + '">not evaluated</text>';
      } else {
        var w = Math.max(2, x(r.v) - labelW);
        s += '<path class="bar fam-' + r.m.fam + '" data-i="' + i + '" d="' + barPath(labelW, y, w, bar) + '"/>';
        s += '<rect class="hit" data-i="' + i + '" x="' + labelW + '" y="' + (top + i * rowH) + '" width="' + plotW + '" height="' + rowH + '"/>';
        if (r === lead) s += '<text class="vl" x="' + (labelW + w + 8) + '" y="' + (cy + 4) + '">' + nf(r.v, cur.d) + ' ' + cur.unit + '</text>';
      }
    });
    s += '<line class="base" x1="' + labelW + '" x2="' + labelW + '" y1="' + top + '" y2="' + (H - axisH + 4) + '"/></svg>';
    chart.innerHTML = s;
    chart.setAttribute('aria-label', cur.title + ': ' + rows.map(function(r){ return r.m.name + ' ' + r.m.dens + '% ' + (r.v == null ? 'not evaluated' : nf(r.v, cur.d) + ' ' + cur.unit); }).join('; '));
    $('vizTitle').innerHTML = cur.title + ' <span class="unit">(' + cur.unit + ')</span>';
    $('vizNote').textContent = cur.note;
  }
  function barPath(x0, y, w, h){ var r = Math.min(4, w / 2); return 'M' + x0 + ',' + y + 'H' + (x0 + w - r) + 'Q' + (x0 + w) + ',' + y + ' ' + (x0 + w) + ',' + (y + r) + 'V' + (y + h - r) + 'Q' + (x0 + w) + ',' + (y + h) + ' ' + (x0 + w - r) + ',' + (y + h) + 'H' + x0 + 'Z'; }
  function niceStep(max){ var raw = max / 5, p = Math.pow(10, Math.floor(Math.log10(raw))), n = raw / p; return (n < 1.5 ? 1 : n < 3 ? 2 : n < 7 ? 5 : 10) * p; }
  function fmtTick(t){ var d = cur.d === 3 ? 3 : (t % 1 ? 1 : 0); if (cur.unit === 'mm/mm') d = 3; return nf(t, d); }

  chart.addEventListener('mousemove', function(e){
    var h = e.target.closest('.hit');
    chart.querySelectorAll('.bar').forEach(function(b){ b.classList.remove('dim'); });
    if (!h){ tip.hidden = true; return; }
    var i = +h.getAttribute('data-i'), m = M[i], v = cur.get(m);
    chart.querySelectorAll('.bar').forEach(function(b){ if (b.getAttribute('data-i') != i) b.classList.add('dim'); });
    tip.innerHTML = '<span class="label">' + FAM[m.fam] + ' · ' + m.dens + '% density</span><b>' + nf(v, cur.d) + ' ' + cur.unit + '</b>';
    var vr = viz.getBoundingClientRect();
    tip.hidden = false;
    var tx = e.clientX - vr.left + 14, ty = e.clientY - vr.top - 10;
    if (tx + tip.offsetWidth > vr.width - 8) tx = e.clientX - vr.left - tip.offsetWidth - 14;
    tip.style.left = tx + 'px'; tip.style.top = ty + 'px';
  });
  chart.addEventListener('mouseleave', function(){ tip.hidden = true; chart.querySelectorAll('.bar').forEach(function(b){ b.classList.remove('dim'); }); });

  // ---------- table view (all metrics) ----------
  function drawTable(){
    var h = '<table class="tech datatab"><thead><tr><th>Disk</th>' + METRICS.map(function(mt){ return '<th>' + mt.title + '<br><span class="unit">' + mt.unit + '</span></th>'; }).join('') + '</tr></thead><tbody>';
    M.forEach(function(m){
      h += '<tr><th><i class="sw fam-' + m.fam + '"></i>' + m.name + ' ' + m.dens + '%</th>' + METRICS.map(function(mt){ var v = mt.get(m); return '<td>' + (v == null ? '—' : nf(v, mt.d)) + '</td>'; }).join('') + '</tr>';
    });
    $('tableView').innerHTML = h + '</tbody></table>';
  }

  tabs($('metricTabs'), METRICS.map(function(mt){ return {k:mt.id, l:mt.tab}; }), cur.id, function(k){
    cur = METRICS.filter(function(mt){ return mt.id === k; })[0]; drawChart();
  });
  document.querySelectorAll('[data-view]').forEach(function(b){
    b.addEventListener('click', function(){
      view = b.getAttribute('data-view');
      document.querySelectorAll('[data-view]').forEach(function(x){ x.setAttribute('aria-selected', x === b); });
      var t = view === 'table';
      $('tableView').hidden = !t; chart.hidden = t; $('metricTabs').hidden = t;
      viz.querySelector('.legend').hidden = t; viz.querySelector('.viz-head').hidden = t;
      if (t) drawTable();
    });
  });
  var rt; window.addEventListener('resize', function(){ clearTimeout(rt); rt = setTimeout(drawChart, 120); });
  drawChart();

  // ---------- contour maps ----------
  var MAPS = [
    {k:'def', l:'Total deformation', unit:'mm', d:3, get:function(m){ return m.deform[0]; }},
    {k:'str', l:'Elastic strain', unit:'mm/mm', d:3, get:function(m){ return m.strain && m.strain[0]; }},
    {k:'vm', l:'von Mises stress', unit:'MPa', d:0, get:function(m){ return m.stress && m.stress[0]; }},
    {k:'se', l:'Strain energy', unit:'mJ', d:2, get:function(m){ return m.energy && m.energy[0]; }}
  ];
  var CELLS = [{k:'bcc', l:'BCC'}, {k:'i', l:'I-type'}, {k:'t', l:'Tetrahedral'}];
  var mapM = 'def', mapC = 'bcc';
  function drawMaps(){
    var mt = MAPS.filter(function(x){ return x.k === mapM; })[0];
    var ms = M.filter(function(m){ return m.fam === mapC; });
    $('mapsView').innerHTML = ms.map(function(m){
      var v = mt.get(m);
      if (v == null) return '<div class="map-na o"><span class="label">' + m.name + ' ' + m.dens + '%</span><p>Evaluated for deformation only.</p></div>';
      var src = 'photos/fea/' + mapM + '-' + m.id + '.jpg', cap = mt.l + ' · ' + m.name + ' ' + m.dens + '% · max ' + nf(v, mt.d) + ' ' + mt.unit;
      return '<figure class="map"><button type="button" class="zoom ocut" data-src="' + src + '" data-cap="' + cap + '" aria-label="Enlarge: ' + cap + '"><img src="' + src + '" alt="' + cap + '" loading="lazy"></button>' +
        '<figcaption><span class="label"><i class="sw fam-' + m.fam + '"></i>' + m.name + ' ' + m.dens + '%</span><b>max ' + nf(v, mt.d) + ' ' + mt.unit + '</b></figcaption></figure>';
    }).join('');
  }
  tabs($('mapMetric'), MAPS, mapM, function(k){ mapM = k; drawMaps(); });
  tabs($('mapCell'), CELLS, mapC, function(k){ mapC = k; drawMaps(); });
  drawMaps();

  // ---------- lightbox ----------
  var lb = $('lightbox');
  document.addEventListener('click', function(e){
    var z = e.target.closest('.zoom'); if (!z || !lb || !lb.showModal) return;
    lb.querySelector('img').src = z.getAttribute('data-src'); lb.querySelector('img').alt = z.getAttribute('data-cap');
    lb.querySelector('.lb-cap').textContent = z.getAttribute('data-cap'); lb.showModal();
  });
  if (lb) lb.addEventListener('click', function(e){ if (e.target === lb) lb.close(); });
})();
