const { Telegraf, Markup } = require('telegraf');
const express = require('express');

const bot = new Telegraf('8951168764:AAELuCMhE5gY8m7-GtAkuKOGgNc1XeDYF2s');

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is active!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const tonRegex = /(EQ[a-zA-Z0-9_-]{46,}|UQ[a-zA-Z0-9_-]{46,})/;
const calcRegex = /^[0-9+\-*/().\s]+$/;

bot.on('message', async (ctx) => {
    if (!ctx.message || !ctx.message.text) return;
    const msgText = ctx.message.text.trim();

    // ---- TON Address Detected ----
    const matchTon = msgText.match(tonRegex);
    if (matchTon) {
        const tonAddress = matchTon[0];
        const replyMessage = `💎 <b>TON Address Detected:</b>\n<code>${tonAddress}</code>`;
        
        // နှိပ်လိုက်ရင် အပေါ်က စာသားကို အလွယ်တကူ Copy ကူးနိုင်အောင် စီစဉ်ခြင်း
        return ctx.replyWithHTML(replyMessage, {
            reply_to_message_id: ctx.message.message_id,
            ...Markup.inlineKeyboard([
                [Markup.button.callback('📋 Click to Copy Address', 'copy_alert')]
            ])
        });
    }

    // ---- Calculator ----
    if (calcRegex.test(msgText) && /[+\-*/]/.test(msgText)) {
        try {
            const result = new Function(`return ${msgText}`)();
            if (result !== undefined && !isNaN(result)) {
                const replyText = `🧮 <b>Calculation Result:</b>\n<code>${result}</code>`;
                
                return ctx.replyWithHTML(replyText, {
                    reply_to_message_id: ctx.message.message_id,
                    ...Markup.inlineKeyboard([
                        [Markup.button.callback('📋 Click to Copy Result', 'copy_alert')]
                    ])
                });
            }
        } catch (error) {
            console.log("Calculation error:", error);
        }
    }
});

// ခလုတ်နှိပ်လိုက်ရင် ပေါ်လာမယ့် Alert စာတန်း
bot.action('copy_alert', (ctx) => {
    return ctx.answerCbQuery('💡 အပေါ်က စာသားကွက်လေးကို ဖိပြီး Copy ကူးယူနိုင်ပါသည်ဗျာ!', { show_alert: true });
});

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

