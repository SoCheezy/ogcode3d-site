// /api/viva-webhook
// GET:  Viva calls this when you press "Verify" on the webhook. We answer with the verification key.
// POST: Viva sends "Transaction Payment Created" (event 1796). We never trust the message itself:
//       the transaction is looked up again with Viva, and only a finished payment marks the order paid.
const viva = require('./_viva');

module.exports = async (req, res) => {
  try {
    if (req.method === 'GET') {
      try { return res.status(200).json({ Key: await viva.webhookKey() }); }
      catch (e) { console.error('viva-webhook key', e && e.message); return res.status(500).json({ error: String(e && e.message || e) }); }
    }
    if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST.' });

    const b = viva.readBody(req);
    const type = Number(b.EventTypeId);
    const data = b.EventData || {};
    if (type !== 1796) return res.status(200).json({ ok: true, ignored: type || null });

    const tx = await viva.getTransaction(data.TransactionId);
    if (tx.status !== 'paid') return res.status(200).json({ ok: true, status: tx.status });
    await viva.sheet(viva.paidMessage(tx.merchantTrns, tx.orderCode, data.TransactionId, tx.amount));
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('viva-webhook', e && e.message);
    return res.status(500).json({ error: 'Not processed, please retry.' });   // Viva retries for about a day
  }
};
