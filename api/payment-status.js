// GET /api/payment-status?t=<transactionId>&s=<orderCode>
// Used by the thank-you page and the cart (when Viva sends a buyer back). Returns only the status,
// never personal data. A finished payment also marks the order paid (the same check as the webhook),
// so the order is confirmed even if a webhook arrives late or the buyer lands on the wrong page.
const viva = require('./_viva');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const q = req.query || {};
  const t = String(q.t || ''), s = String(q.s || '');
  try {
    let status = 'unknown', paid = null, kind = 'order';
    if (/^[0-9a-f-]{36}$/i.test(t)) {
      const tx = await viva.getTransaction(t);
      status = tx.status;
      if (tx.status === 'paid') paid = viva.paidMessage(tx.merchantTrns, tx.orderCode, t, tx.amount);
      kind = /^DEP:/.test(tx.merchantTrns) ? 'deposit' : 'order';
    } else if (/^\d{10,20}$/.test(s)) {
      const o = await viva.getOrder(s);
      status = o.status;
      if (o.status === 'paid') paid = viva.paidMessage(o.merchantTrns, s, '', o.amount);
      kind = /^DEP:/.test(o.merchantTrns) ? 'deposit' : 'order';
    }
    if (paid) {
      try { await viva.sheet(paid); } catch (e) { console.error('payment-status sheet', e && e.message); }
    }
    return res.status(200).json({ status, kind });
  } catch (e) {
    console.error('payment-status', e && e.message);
    return res.status(200).json({ status: 'unknown' });
  }
};
