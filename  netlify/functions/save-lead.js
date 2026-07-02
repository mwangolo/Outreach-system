// netlify/functions/save-lead.js
// Called by your 5-question builder frontend once Groq has generated
// the preview. Creates (or updates) the lead record that create-payment.js,
// the webhooks, and trigger-build.js all read from.
//
// Request body:
// {
    //   businessName: string,
    //   contactEmail: string,
    //   country: 'US' | 'KE' | ...   // from your Maps scraper lookup, or a
    //                                  form field if the client fills it in
    //   tag: 'no_website' | 'outdated_website',
    //   previewHtml: string           // Groq's generated site
    // }
    //
    // Response: { leadId: string }

    const { saveLead } = require('./lib/leads-store');
    const crypto = require('crypto');

    exports.handler = async (event) => {
          if (event.httpMethod !== 'POST') {
                return { statusCode: 405, body: 'Method not allowed' };
          }

            let body;
              try {
                    body = JSON.parse(event.body);
              } catch {
                    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
              }

                const { businessName, contactEmail, country, tag, previewHtml, leadId } = body;

                  if (!businessName || !previewHtml) {
                        return {
                                  statusCode: 400,
                                        body: JSON.stringify({ error: 'businessName and previewHtml are required' })
                        };
                  }

                    // Reuse the id if this is an update (e.g. lead already existed from
                      // your outreach step), otherwise mint a new one.
                        const id = leadId || crypto.randomUUID();

                          const lead = {
                                id,
                                    businessName,
                                        contactEmail: contactEmail || null,
                                            country: country || 'US', // default assumption if scraper didn't tag it
                                                tag: tag || 'no_website',
                                                    status: 'previewed',
                                                        previewHtml,
                                                            amount: null,
                                                                paymentRef: null,
                                                                    checkoutRequestId: null,
                                                                        createdAt: new Date().toISOString(),
                                                                            paidAt: null
                          };

                            await saveLead(lead);

                              return {
                                    statusCode: 200,
                                        headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({ leadId: id })
                              };
    };
                              }
                          }
                        }
                  }
              }
              }
          }
    }
}