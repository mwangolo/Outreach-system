// netlify/functions/create-payment.js
// Called when the client clicks "Get this website" after seeing their
// preview. Works for any country by default (Stripe Checkout supports
// 135+ countries and auto-converts currency). If the lead is in Kenya,
// the frontend can also offer M-Pesa as an alternative — this function
// handles both.
//
// Request body: { leadId: string, method?: 'stripe' | 'mpesa', phone?: string }
// (phone required only for mpesa)

const Stripe = require('stripe');
const { getLead, saveLead } = require('./lib/leads-store');
const { getDarajaAccessToken, getTimestamp, buildPassword, DARAJA_HOST } = require('./lib/daraja-auth');

const stripe = Stripe(process.env.STRIPE_SECRET_KEY);
const PRICE_USD = 350; // your flat deployment offer

exports.handler = async (event) => {
      const { leadId, method = 'stripe', phone } = JSON.parse(event.body);
        const lead = await getLead(leadId);

          if (!lead) {
                return { statusCode: 404, body: JSON.stringify({ error: 'Lead not found' }) };
          }

            if (method === 'mpesa') {
                    if (lead.country !== 'KE') {
                              return {
                                        statusCode: 400,
                                                body: JSON.stringify({ error: 'M-Pesa only available for Kenyan leads' })
                              };
                    }
                        return await initiateMpesa(lead, phone);
            }

              // Default: Stripe, works for any country
                return await createStripeSession(lead);
};

async function createStripeSession(lead) {
      const session = await stripe.checkout.sessions.create({
            mode: 'payment',
                payment_method_types: ['card'],
                    line_items: [
                              {
                                        price_data: {
                                                      currency: 'usd',
                                                                product_data: { name: `Website deployment — ${lead.businessName}` },
                                                                          unit_amount: PRICE_USD * 100
                                        },
                                                quantity: 1
                              }
                    ],
                        metadata: { leadId: lead.id }, // stripe-webhook.js reads this back
                            success_url: `https://yoursite.netlify.app/success?lead=${lead.id}`,
                                cancel_url: `https://yoursite.netlify.app/preview?lead=${lead.id}`
      });

        return { statusCode: 200, body: JSON.stringify({ url: session.url }) };
}

async function initiateMpesa(lead, phone) {
      // Reuse your Daraja STK push logic from HotaNet here. Sketch:
        const token = await getDarajaAccessToken();
          const timestamp = getTimestamp();
            const password = buildPassword(timestamp);

              const res = await fetch(
                    `${DARAJA_HOST}/mpesa/stkpush/v1/processrequest`,
                        {
                                  method: 'POST',
                                        headers: {
                                                    Authorization: `Bearer ${token}`,
                                                            'Content-Type': 'application/json'
                                        },
                                              body: JSON.stringify({
                                                        BusinessShortCode: process.env.MPESA_SHORTCODE,
                                                                Password: password,
                                                                        Timestamp: timestamp,
                                                                                TransactionType: 'CustomerPayBillOnline',
                                                                                        Amount: PRICE_USD * 130, // rough USD->KES, use a real rate lookup
                                                                                                PartyA: phone,
                                                                                                        PartyB: process.env.MPESA_SHORTCODE,
                                                                                                                PhoneNumber: phone,
                                                                                                                        CallBackURL: 'https://yoursite.netlify.app/.netlify/functions/mpesa-callback',
                                                                                                                                AccountReference: lead.businessName,
                                                                                                                                        TransactionDesc: 'Website deployment'
                                              })
                        }
              );
                const data = await res.json();

                  // Save the mapping so mpesa-callback.js can find this lead later
                    const { getStore } = require('@netlify/blobs');
                      const map = getStore('checkout-request-map');
                        await map.set(data.CheckoutRequestID, lead.id);

                          lead.checkoutRequestId = data.CheckoutRequestID;
                            await saveLead(lead);

                              return { statusCode: 200, body: JSON.stringify({ status: 'stk_push_sent' }) };
}
                                              })
                                        }
                        }
              )
}
                                        }
                              }
                    ]
      })
}
                              }
                    }
            }
          }
}