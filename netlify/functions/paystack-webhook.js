// netlify/functions/paystack-webhook.js
// Confirms payment when Paystack sends a charge.success event.
//
// Setup:
// 1. Env var in Netlify: PAYSTACK_SECRET_KEY
// 2. In Paystack Dashboard -> Settings -> API Keys & Webhooks,
//    set webhook URL to:
//    https://outreachsystem-app.netlify.app/.netlify/functions/paystack-webhook

const crypto = require('crypto');
const { markPaid } = require('./lib/leads-store');
const { notifyMe } = require('./lib/notify');
const { triggerBuild } = require('./lib/trigger-build');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

exports.handler = async (event) => {
  // Verify the request genuinely came from Paystack
  const hash = crypto
    .createHmac('sha512', PAYSTACK_SECRET)
    .update(event.body)
    .digest('hex');

  if (hash !== event.headers['x-paystack-signature']) {
    return { statusCode: 401, body: 'Invalid signature' };
  }

  const payload = JSON.parse(event.body);

  if (payload.event === 'charge.success') {
    const { metadata, amount, currency, reference } = payload.data;
    const leadId = metadata?.leadId;

    if (!leadId) {
      console.error('No leadId in Paystack metadata');
      return { statusCode: 200, body: 'ok' };
    }

    try {
      const lead = await markPaid(leadId, {
        amount: amount / 100, // back to whole currency units
        paymentRef: reference
      });

      await notifyMe(
        `💰 *Payment received*\n${lead.businessName}\n${currency} ${amount / 100}\nLead: ${leadId}`
      );

      await triggerBuild(lead);
    } catch (err) {
      console.error('Error processing paid lead', err);
    }
  }

  return { statusCode: 200, body: 'ok' };
};
