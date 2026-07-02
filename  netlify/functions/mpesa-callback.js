// netlify/functions/mpesa-callback.js
// Handles Daraja STK Push callback for KE leads.
//
// Setup:
// 1. Env vars in Netlify: (none needed here — Daraja doesn't sign callbacks
//    the way Stripe does, so validate by checking the CheckoutRequestID
//    matches a lead you actually initiated payment for)
// 2. Your STK push initiation call sets CallBackURL to:
//    https://<yoursite>.netlify.app/.netlify/functions/mpesa-callback
// 3. When you initiate STK push, store the CheckoutRequestID on the lead
//    (see lib/leads-store.js — add a `checkoutRequestId` field) so this
//    callback can map the payment back to the right lead.

const { getLead, markPaid, saveLead } = require('./lib/leads-store');
const { notifyMe } = require('./lib/notify');
const { triggerBuild } = require('./lib/trigger-build');

exports.handler = async (event) => {
      const body = JSON.parse(event.body);
        const callback = body?.Body?.stkCallback;

          if (!callback) {
                return { statusCode: 400, body: 'Invalid callback payload' };
          }

            const { CheckoutRequestID, ResultCode, CallbackMetadata } = callback;

              // Find the lead this checkout request belongs to.
                // Simplest approach: you stored checkoutRequestId -> leadId when you
                  // initiated the STK push. Swap this for however you index that lookup.
                    const leadId = await findLeadIdByCheckoutRequestId(CheckoutRequestID);
                      if (!leadId) {
                            console.error('No lead found for CheckoutRequestID', CheckoutRequestID);
                                return { statusCode: 200, body: 'ok' };
                      }

                        if (ResultCode !== 0) {
                                // Payment failed or was cancelled by the user
                                    const lead = await getLead(leadId);
                                        lead.status = 'previewed'; // revert, let them retry
                                            await saveLead(lead);
                                                return { statusCode: 200, body: 'ok' };
                        }

                          // ResultCode 0 = success. Extract amount + receipt from metadata items.
                            const items = CallbackMetadata.Item;
                              const amount = items.find((i) => i.Name === 'Amount')?.Value;
                                const receipt = items.find((i) => i.Name === 'MpesaReceiptNumber')?.Value;

                                  const lead = await markPaid(leadId, { amount, paymentRef: receipt });

                                    await notifyMe(
                                            `💰 *Payment received (KE)*\n${lead.businessName}\nKES ${amount}\nReceipt: ${receipt}`
                                    );

                                      await triggerBuild(lead);

                                        return { statusCode: 200, body: 'ok' };
};

// Placeholder — replace with a real lookup (e.g. a second Blobs store
// keyed by checkoutRequestId, or scan your leads if volume is low).
async function findLeadIdByCheckoutRequestId(checkoutRequestId) {
      const { getStore } = require('@netlify/blobs');
        const map = getStore('checkout-request-map');
          return await map.get(checkoutRequestId, { type: 'text' });
}
}
                                    )
                        }
                      }
          }
}