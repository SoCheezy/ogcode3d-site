// GET /api/deposit?l=<lead id>&a=<amount in cents>&s=<signature>
// Deposit links made by the lead sheet (OGCODE → Make deposit link). The link is signed with the shop
// secret, so the amount cannot be changed. Each visit creates a fresh Viva.com payment order and sends
// the client to Viva's payment page, so the link never expires. When the payment is confirmed
// (webhook or thank-you page) the sheet marks the lead "Deposit paid".
const crypto = require('crypto');
const viva = require('./_viva');

function page(res, code, title, text) {
  res.statusCode = code;
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.end('<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex">' +
    '<title>' + title + ' · OGCODE</title><body style="font:16px/1.5 system-ui,sans-serif;max-width:560px;margin:12vh auto;padding:0 20px;color:#16171b;background:#e5e5e0">' +
    '<h1 style="font-size:1.6rem">' + title + '</h1><p>' + text + '</p><p><a href="/">ogcode3d.com</a></p></body>');
}

module.exports = async (req, res) => {
  const q = req.query || {};
  const lead = String(q.l || ''), amount = parseInt(q.a, 10), sig = String(q.s || '');
  const secret = String(process.env.ORDERS_SECRET || '');
  const ok = /^OG-\d{1,8}$/.test(lead) && amount >= 100 && amount <= 5000000 && secret &&
    /^[0-9a-f]{32}$/.test(sig) &&
    crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(crypto.createHmac('sha256', secret).update(lead + '|' + amount).digest('hex').slice(0, 32)));
  if (!ok) return page(res, 400, 'Link not valid', 'This deposit link is not valid. Please use the link from your proposal email, or write to <a href="mailto:ogcode3d@gmail.com">ogcode3d@gmail.com</a>.');
  try {
    const orderCode = await viva.createOrder({
      amount,
      customerTrns: 'Deposit for OGCODE project ' + lead,
      merchantTrns: 'DEP:' + lead,
      sourceCode: String(process.env.VIVA_SOURCE_CODE || '').trim(),
      paymentTimeout: 1800,
      tags: ['deposit'],
    });
    res.statusCode = 302;
    res.setHeader('Location', viva.checkoutUrl(orderCode));
    res.setHeader('Cache-Control', 'no-store');
    return res.end();
  } catch (e) {
    console.error('deposit', e && e.message);
    return page(res, 502, 'Payment page not available', 'The payment page could not be opened right now. Please try again in a few minutes, or write to <a href="mailto:ogcode3d@gmail.com">ogcode3d@gmail.com</a>.');
  }
};
