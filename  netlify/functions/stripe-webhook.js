// netlify/functions/stripe-webhook.js
// Handles Stripe Checkout completion for US leads.
//
// Setup:
// 1. npm install stripe
// 2. Env vars in Netlify: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET
// 3. In Stripe Dashboard -> Developers -> Webhooks, add endpoint:
//    https://<yoursite>.netlify.app/.netlify/functions/stripe-webhook
//    Listen for: checkout.session.completed
// 4. When creating the Checkout Session (in your builder frontend/backend),
//    set metadata: { leadId: lead.id } so this webhook can find the lead.

const Stripe = require('stripe');
const { markPaid } = require('./lib/leads-store');
const { notifyMe } = require('./lib/notify');
const { triggerBuild } = require('./lib/trigger-build');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

exports.handler = async (event) => {
      const sig = event.headers['stripe-signature'];
        let stripeEvent;

          try {
                stripeEvent = stripe.webhooks.constructEvent(
                          event.body,
                                sig,
                                      process.env.STRIPE_WEBHOOK_SECRET
                );
          } catch (err) {
                console.error('Stripe signature verification failed', err.message);
                    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
          }

            if (stripeEvent.type === 'checkout.session.completed') {
                    const session = stripeEvent.data.object;
                        const leadId = session.metadata?.leadId;

                            if (!leadId) {
                                      console.error('No leadId in session metadata');
                                            return { statusCode: 200, body: 'ok' }; // ack anyway, don't retry-loop Stripe
                            }

                                const amount = (session.amount_total || 0) / 100; // cents -> dollars

                                    try {
                                              const lead = await markPaid(leadId, {
                                                        amount,
                                                                paymentRef: session.id
                                              });

                                                    await notifyMe(
                                                                `💰 *Payment received (US)*\n${lead.businessName}\n$${amount}\nLead: ${leadId}`
                                                    );

                                                          await triggerBuild(lead);
                                    } catch (err) {
                                              console.error('Error processing paid lead', err);
                                                    // Still return 200 so Stripe doesn't hammer retries while you debug;
                                                          // check Netlify function logs for the actual error.
                                    }
            }

              return { statusCode: 200, body: 'ok' };
};
                                    }
                                                    )
                                              })
                                    }
                            }
            }
          }
                )
          }
}