const { Telegraf } = require('telegraf');
const express = require('express');

const bot = new Telegraf('8951168764:AAELuCMhE5gY8m7-GtAkuKOGgNc1XeDYF2s');

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is active!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const tonRegex = /(EQ[a-zA-Z0-9_-]{46,}|UQ[a-zA-Z0-9_-]{46,})/;
const calcRegex = /^[0-9+\-*/().\s]+$/;

// ---- User ID & Info Checker (/id) ----
bot.command('id', async (ctx) => {
    let targetUser;

    // အကယ်၍ အခြားသူစာကို Reply ပြန်ပြီး စစ်ဆေးလျှင်
    if (ctx.message.reply_to_message) {
        targetUser = ctx.message.reply_to_message.from;
    } else {
        // Reply မပြန်ဘဲ ရိုက်လျှင် မိမိအကောင့်ကို ပြသမည်
        targetUser = ctx.message.from;
    }

    if (!targetUser) return;

    const userId = targetUser.id;
    const firstName = targetUser.first_name || 'No Name';
    const lastName = targetUser.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const username = targetUser.username ? `@${targetUser.username}` : 'None';
    const isPremium = targetUser.is_premium ? 'Active  (Yes)' : 'No';
    const isBot = targetUser.is_bot ? 'Yes' : 'No';

    // ပုံစံသွင်းပြီး စာသားထုတ်ပေးခြင်း (Tap to copy စနစ်ပါဝင်သည်)
    const infoMessage = `
👤 *User Information:*
\- *ID:* \`${userId}\` \(Tap to copy\)
\- *Name:* _${fullName}_
\- *Username:* ${username}
\- *Premium:* ${isPremium}
\- *Is Bot:* ${isBot}
    `.trim();

    return ctx.replyWithMarkdownV2(infoMessage, {
        reply_to_message_id: ctx.message.message_id
    });
});

// ---- Message Listener (TON & Calculator) ----
bot.on('message', async (ctx) => {
    if (!ctx.message || !ctx.message.text) return;
    const msgText = ctx.message.text.trim();

    // ---- TON Address Detected ----
    const matchTon = msgText.match(tonRegex);
    if (matchTon) {
        const tonAddress = matchTon[0];
        const replyMessage = `💎 *TON Address Detected:*\n\`${tonAddress}\``;
        return ctx.replyWithMarkdownV2(replyMessage, {
            reply_to_message_id: ctx.message.message_id
        });
    }

    // ---- Calculator ----
    if (calcRegex.test(msgText) && /[+\-*/]/.test(msgText)) {
        try {
            const result = new Function(`return ${msgText}`)();
            if (result !== undefined && !isNaN(result)) {
                const replyText = `🧮 *Calculation Result:*\n\`${result}\``;
                return ctx.replyWithMarkdownV2(replyText, {
                    reply_to_message_id: ctx.message.message_id
                });
            }
        } catch (error) {
            console.log("Calculation error:", error);
        }
    }
});

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

