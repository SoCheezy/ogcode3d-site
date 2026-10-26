// Shared helpers for the Viva.com functions. Files starting with "_" are not public routes on Vercel.
//
// Environment variables (set them in Vercel → Project → Settings → Environment Variables):
//   VIVA_ENV            demo | live            (start with demo, switch to live when tested)
//   VIVA_CLIENT_ID      Smart Checkout client ID      (Viva → Settings → API Access)
//   VIVA_CLIENT_SECRET  Smart Checkout client secret
//   VIVA_SOURCE_CODE    4-digit code of the payment source for the website
//   VIVA_MERCHANT_ID    Merchant ID   (only for webhook verification)
//   VIVA_API_KEY        API key       (only for webhook verification)
//   ORDERS_ENDPOINT     Google Apps Script web app URL (the same one the site forms use)
//   ORDERS_SECRET       the shop secret shown by the sheet (OGCODE → Shop secret)

const LIVE = (process.env.VIVA_ENV || 'demo').toLowerCase() === 'live';
const HOSTS = {
  accounts: process.env.VIVA_ACCOUNTS_URL || (LIVE ? 'https://accounts.vivapayments.com' : 'https://demo-accounts.vivapayments.com'),
  api: process.env.VIVA_API_URL || (LIVE ? 'https://api.vivapayments.com' : 'https://demo-api.vivapayments.com'),
  web: process.env.VIVA_WEB_URL || (LIVE ? 'https://www.vivapayments.com' : 'https://demo.vivapayments.com'),
};

let cached = { token: null, until: 0 };

async function token() {
  if (cached.token && Date.now() < cached.until) return cached.token;
  const id = String(process.env.VIVA_CLIENT_ID || '').trim(), secret = String(process.env.VIVA_CLIENT_SECRET || '').trim();
  if (!id || !secret) throw new Error('Viva credentials are missing.');
  const r = await fetch(HOSTS.accounts + '/connect/token', {
    method: 'POST',
    headers: {
      Authorization: 'Basic ' + Buffer.from(id + ':' + secret).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new Error('Viva login failed (' + r.status + ').');
  cached = { token: j.access_token, until: Date.now() + Math.max(60, (j.expires_in || 3600) - 120) * 1000 };
  return cached.token;
}

// Create a Smart Checkout payment order. Returns the 16-digit order code as a string.
async function createOrder(order) {
  const r = await fetch(HOSTS.api + '/checkout/v2/orders', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + await token(), 'Content-Type': 'application/json' },
    body: JSON.stringify(order),
  });
  const text = await r.text();
  // read the order code from the raw text: it can be longer than JavaScript numbers hold exactly
  const m = text.match(/"orderCode"\s*:\s*"?(\d{10,20})/i);
  if (!r.ok || !m) throw new Error('Viva did not create the order (' + r.status + '): ' + text.slice(0, 300));
  return m[1];
}

// Look up a transaction. Returns { status: 'paid' | 'pending' | 'failed', amount (cents), orderCode, raw }.
async function getTransaction(transactionId) {
  if (!/^[0-9a-f-]{36}$/i.test(String(transactionId || ''))) throw new Error('Bad transaction id.');
  const r = await fetch(HOSTS.api + '/checkout/v2/transactions/' + transactionId, {
    headers: { Authorization: 'Bearer ' + await token() },
  });
  const text = await r.text();
  if (!r.ok) throw new Error('Viva transaction lookup failed (' + r.status + ').');
  let j = {}; try { j = JSON.parse(text); } catch (e) {}
  const code = (text.match(/"orderCode"\s*:\s*"?(\d{10,20})/i) || [])[1] || '';
  const s = String(j.statusId || '').toUpperCase();
  const status = s === 'F' ? 'paid' : (s === 'A' ? 'pending' : 'failed');
  return { status, amount: Math.round(Number(j.amount || 0) * 100), orderCode: code, raw: j };
}

// Key Viva asks for when you verify the webhook URL.
async function webhookKey() {
  const id = String(process.env.VIVA_MERCHANT_ID || '').trim(), key = String(process.env.VIVA_API_KEY || '').trim();
  if (!id || !key) throw new Error('Merchant ID / API key missing.');
  const r = await fetch(HOSTS.web + '/api/messages/config/token', {
    headers: { Authorization: 'Basic ' + Buffer.from(id + ':' + key).toString('base64') },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.Key) throw new Error('Could not get the webhook key (' + r.status + '). Check VIVA_MERCHANT_ID and VIVA_API_KEY.');
  return j.Key;
}

function checkoutUrl(orderCode) { return HOSTS.web + '/web/checkout?ref=' + orderCode; }

// Talk to the Google Sheet (orders tab). Throws if the sheet does not confirm.
async function sheet(payload) {
  const url = process.env.ORDERS_ENDPOINT, secret = process.env.ORDERS_SECRET;
  if (!url || !secret) throw new Error('The order sheet is not connected.');
  const r = await fetch(url, {
    method: 'POST', redirect: 'follow',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(Object.assign({ secret }, payload)),
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.ok) throw new Error('Order sheet error: ' + (j.error || r.status));
  return j;
}

function readBody(req) {
  let b = req.body;
  if (typeof b === 'string') { try { b = JSON.parse(b); } catch (e) { b = {}; } }
  return b || {};
}

module.exports = { LIVE, token, createOrder, getTransaction, webhookKey, checkoutUrl, sheet, readBody };
