// lib/trigger-build.js
// Once a lead has paid, take their already-generated preview HTML
// (from your Groq builder) and deploy it as a real Netlify site.
//
// Setup: env var NETLIFY_API_TOKEN (User settings -> Applications ->
// New access token in Netlify).

const { saveLead } = require('./leads-store');

async function triggerBuild(lead) {
      if (!lead.previewHtml) {
            console.error(`Lead ${lead.id} has no previewHtml, cannot build`);
                return;
      }

        // 1. Create a new site for this client
          const siteRes = await fetch('https://api.netlify.com/api/v1/sites', {
                method: 'POST',
                    headers: {
                              Authorization: `Bearer ${process.env.NETLIFY_API_TOKEN}`,
                                    'Content-Type': 'application/json'
                    },
                        body: JSON.stringify({
                                  name: slugify(lead.businessName) + '-' + lead.id.slice(0, 6)
                        })
          });
            const site = await siteRes.json();

              // 2. Deploy the HTML as a single-file site
                // Netlify's deploy API expects a zip or a files digest; for a single
                  // static HTML file the simplest path is the "deploy from file" flow —
                    // see https://docs.netlify.com/api/get-started/#deploys for the
                      // multipart upload format if you outgrow this basic version.
                        const deployRes = await fetch(
                                `https://api.netlify.com/api/v1/sites/${site.id}/deploys`,
                                    {
                                              method: 'POST',
                                                    headers: {
                                                                Authorization: `Bearer ${process.env.NETLIFY_API_TOKEN}`,
                                                                        'Content-Type': 'application/zip'
                                                    },
                                                          body: await zipHtml(lead.previewHtml) // implement with e.g. 'jszip'
                                    }
                        );
                          const deploy = await deployRes.json();

                            lead.status = 'built';
                              lead.liveUrl = site.ssl_url || site.url;
                                await saveLead(lead);

                                  return lead.liveUrl;
}

function slugify(str) {
      return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

// Stub — wire up with jszip: zip.file('index.html', html); return zip.generateAsync(...)
async function zipHtml(html) {
      throw new Error('zipHtml not implemented — add jszip and build the archive here');
}

module.exports = { triggerBuild };
}
}
                                                    }
                                    }
                        )
                        })
                    }
          })
      }
}