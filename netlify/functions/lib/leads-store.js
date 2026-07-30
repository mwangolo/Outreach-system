// lib/leads-store.js
// Shared helper for reading/writing lead records using Netlify Blobs.
// Docs: https://docs.netlify.com/blobs/overview/

const { getStore } = require('@netlify/blobs');

function store() {
  return getStore('leads');
}

async function getLead(id) {
  const raw = await store().get(id, { type: 'json' });
  return raw || null;
}

async function saveLead(lead) {
  await store().setJSON(lead.id, lead);
  return lead;
}

async function markPaid(id, { amount, paymentRef }) {
  const lead = await getLead(id);
  if (!lead) throw new Error(`Lead ${id} not found`);
  lead.status = 'paid';
  lead.amount = amount;
  lead.paymentRef = paymentRef;
  lead.paidAt = new Date().toISOString();
  await saveLead(lead);
  return lead;
}

module.exports = { getLead, saveLead, markPaid };
