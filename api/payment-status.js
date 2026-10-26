// GET /api/payment-status?t=<transactionId>
// Used by the thank-you page. Returns only the status, never personal data.
// When the payment is finished it also marks the order paid (same check as the webhook),
// so the order is confirmed even if a webhook arrives late.
const viva = require('./_viva');

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  const t = String((req.query && req.query.t) || '');
  try {
    const tx = await viva.getTransaction(t);
    if (tx.status === 'paid') {
      try { await viva.sheet({ type: 'paid', orderCode: tx.orderCode, transactionId: t, amount: tx.amount }); }
      catch (e) { console.error('payment-status sheet', e && e.message); }
    }
    return res.status(200).json({ status: tx.status });
  } catch (e) {
    return res.status(200).json({ status: 'unknown' });
  }
};
