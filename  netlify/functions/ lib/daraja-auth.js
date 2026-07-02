// lib/daraja-auth.js
// Helpers for authenticating with Safaricom's Daraja API.
//
// Env vars needed in Netlify:
//   MPESA_CONSUMER_KEY     - from Daraja app
//   MPESA_CONSUMER_SECRET  - from Daraja app
//   MPESA_SHORTCODE        - your paybill/till number
//   MPESA_PASSKEY          - Lipa Na M-Pesa passkey (given with shortcode)
//
// Use sandbox host (https://sandbox.safaricom.co.ke) while testing,
// switch to https://api.safaricom.co.ke once you've gone through
// Safaricom's go-live process.

const DARAJA_HOST = process.env.MPESA_ENV === 'production'
  ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

    async function getDarajaAccessToken() {
          const key = process.env.MPESA_CONSUMER_KEY;
            const secret = process.env.MPESA_CONSUMER_SECRET;
              const credentials = Buffer.from(`${key}:${secret}`).toString('base64');

                const res = await fetch(
                        `${DARAJA_HOST}/oauth/v1/generate?grant_type=client_credentials`,
                            {
                                      headers: { Authorization: `Basic ${credentials}` }
                            }
                );

                  if (!res.ok) {
                        throw new Error(`Daraja auth failed: ${res.status} ${await res.text()}`);
                  }

                    const data = await res.json();
                      return data.access_token;
    }

    // Daraja wants timestamps as YYYYMMDDHHmmss
    function getTimestamp() {
          const now = new Date();
            const pad = (n) => String(n).padStart(2, '0');
              return (
                    now.getFullYear().toString() +
                        pad(now.getMonth() + 1) +
                            pad(now.getDate()) +
                                pad(now.getHours()) +
                                    pad(now.getMinutes()) +
                                        pad(now.getSeconds())
              );
    }

    // Password = base64(Shortcode + Passkey + Timestamp)
    function buildPassword(timestamp) {
          const shortcode = process.env.MPESA_SHORTCODE;
            const passkey = process.env.MPESA_PASSKEY;
              return Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
    }

    module.exports = { getDarajaAccessToken, getTimestamp, buildPassword, DARAJA_HOST };
    }
              )
    }
                  }
                            }
                )
    }