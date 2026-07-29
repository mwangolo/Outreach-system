// netlify/functions/create-payment.js
// Called when the client clicks "Get this website" after seeing their
// preview. Uses Paystack for everyone — it supports card payments
// worldwide AND M-Pesa natively for Kenyan customers, so one processor
// covers both cases without needing a separate Daraja integration.
//
// Request body: { leadId: string }

const { getLead, saveLead } = require('./lib/leads-store');

const PRICE_USD = 350; // your flat deployment offer
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

exports.handler = async (event) => {
  const { leadId } = JSON.parse(event.body);
  const lead = await getLead(leadId);

  if (!lead) {
    return { statusCode: 404, body: JSON.stringify({ error: 'Lead not found' }) };
  }

  // Paystack wants amount in the smallest currency unit (kobo/cents),
  // and works in KES for Kenyan customers (enables M-Pesa automatically)
  // or USD for everyone else.
  const currency = lead.country === 'KE' ? 'KES' : 'USD';
  const amount = currency === 'KES'
    ? Math.round(PRICE_USD * 130 * 100) // rough USD->KES, refine later
    : PRICE_USD * 100;

  const res = await fetch('https://api.paystack.co/transaction/initialize', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: lead.contactEmail || 'noemail@placeholder.com', // Paystack requires an email
      amount,
      currency,
      metadata: { leadId: lead.id },
      callback_url: `https://outreachsystem-app.netlify.app/success?lead=${lead.id}`
    })
  });

  const data = await res.json();

  if (!data.status) {
    return { statusCode: 400, body: JSON.stringify({ error: data.message }) };
  }

  lead.paystackRef = data.data.reference;
  await saveLead(lead);

  return {
    statusCode: 200,
    body: JSON.stringify({ url: data.data.authorization_url })
  };
};
