// OGCODE · instant quote, priced on the server
// ============================================================
// EDIT YOUR PRICES HERE. They never reach the visitor's browser:
// the quote page sends only the measured volume and size of each
// file and gets back the final price.
//   perCm3:  euros per cm³ of part volume, per material id
//   setup:   fixed fee per different part (file), added once per file
//   minimum: smallest order total (before delivery)
//   large:   parts with any side longer than overMm cost ×factor (material + setup)
//   volume:  quantity discounts on the material cost (first match wins)
//   delivery fees are shown on the page, so they also live in quote.js; keep both in step.
// ============================================================
const PRICING = {
  perCm3: {
    pla: 0.20, petg: 0.22, asa: 0.28, abs: 0.25, tpu: 0.35, pa: 0.40,   // FDM
    resin: 0.60,                                                         // SLA
    pa11: 1.00, pa12: 0.90,                                              // SLS
    alu: 6.00, ss316: 8.00                                               // SLM
  },
  setup: 10,
  minimum: 25,
  large: { overMm: 256, factor: 2 },
  volume: [ { min: 50, off: 0.20 }, { min: 10, off: 0.10 }, { min: 5, off: 0.05 }, { min: 1, off: 0 } ],
  delivery: { courier: { gr: 5, eu: 20 }, f2f: { gr: 100, eu: 1000 } }
};

function readBody(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  return b || {};
}
const numIn = (v, lo, hi, d) => { const n = Number(v); return Number.isFinite(n) ? Math.min(hi, Math.max(lo, n)) : d; };

module.exports = (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') { res.setHeader('Allow', 'POST'); return res.status(405).json({ error: 'Use POST.' }); }
  const body = readBody(req);

  const rate = PRICING.perCm3[body.material];
  if (rate == null) return res.status(400).json({ error: 'Unknown material.' });
  const fees = PRICING.delivery[body.delivery] || PRICING.delivery.courier;
  const fee = fees[body.region] != null ? fees[body.region] : fees.gr;

  const parts = (Array.isArray(body.parts) ? body.parts : []).slice(0, 200).map(p => ({
    cm3: numIn(p && p.cm3, 0, 1e7, 0),          // volume of one piece, cm³
    maxMm: numIn(p && p.maxMm, 0, 1e6, 0),      // longest side, mm
    qty: Math.round(numIn(p && p.qty, 1, 999, 1)),
    extra: numIn(p && p.extra, 0, 1, 0)          // colour surcharge shown on the page (0.10 = +10%)
  }));
  if (!parts.length) return res.status(200).json({ total: 0, work: 0, fee, minimumApplied: false, large: [], largeOverMm: PRICING.large.overMm, largeFactor: PRICING.large.factor });

  const pieces = parts.reduce((s, p) => s + p.qty, 0);
  const off = (PRICING.volume.find(v => pieces >= v.min) || { off: 0 }).off;
  let material = 0, setup = 0;
  const large = parts.map(p => {
    const big = p.maxMm > PRICING.large.overMm, k = big ? PRICING.large.factor : 1;
    material += k * p.qty * p.cm3 * rate * (1 + p.extra);
    setup += k * PRICING.setup;
    return big;
  });
  const raw = material - material * off + setup;
  const work = Math.max(PRICING.minimum, raw);
  res.status(200).json({
    total: Math.round(work + fee),
    work: Math.round(work * 100) / 100,
    fee,
    minimumApplied: raw <= PRICING.minimum,
    large,
    largeOverMm: PRICING.large.overMm,
    largeFactor: PRICING.large.factor
  });
};
