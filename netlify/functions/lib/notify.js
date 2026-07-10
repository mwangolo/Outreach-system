// lib/notify.js
// Sends yourself a Telegram message when a payment lands.
// Setup: message @BotFather on Telegram -> /newbot -> get TELEGRAM_BOT_TOKEN.
// Then message your new bot once, visit
// https://api.telegram.org/bot<TOKEN>/getUpdates to find your chat id ->
// set TELEGRAM_CHAT_ID.
// Add both as env vars in Netlify: Site settings -> Environment variables.

async function notifyMe(message) {
      const token = process.env.TELEGRAM_BOT_TOKEN;
        const chatId = process.env.TELEGRAM_CHAT_ID;
          if (!token || !chatId) {
                console.error('Telegram env vars missing, skipping notify');
                    return;
          }

            await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                    method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                      chat_id: chatId,
                                            text: message,
                                                  parse_mode: 'Markdown'
                            })
            });
}

module.exports = { notifyMe };
                            })
            })
          }
}