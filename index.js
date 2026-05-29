const { Telegraf } = require('telegraf');
const express = require('express');

const bot = new Telegraf('8951168764:AAELuCMhE5gY8m7-GtAkuKOGgNc1XeDYF2s');

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is active!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const tonRegex = /(EQ[a-zA-Z0-9_-]{46}|UQ[a-zA-Z0-9_-]{46})/;
const calcRegex = /^[0-9+\-*/().\s]+$/;

bot.on('message', async (ctx) => {
    if (!ctx.message || !ctx.message.text) return;
    const msgText = ctx.message.text.trim();

    // ---- TON Address Detected ----
    const matchTon = msgText.match(tonRegex);
    if (matchTon) {
        const tonAddress = matchTon[0];
        const replyMessage = `💎 <b>TON Address Detected:</b>\n<code>${tonAddress}</code>`;
        return ctx.replyWithHTML(replyMessage, { reply_to_message_id: ctx.message.message_id });
    }

    // ---- Calculator ----
    if (calcRegex.test(msgText) && /[+\-*/]/.test(msgText)) {
        try {
            const result = new Function(`return ${msgText}`)();
            if (result !== undefined && !isNaN(result)) {
                const replyText = `🧮 <b>Calculation Result:</b>\n<code>${msgText} = ${result}</code>`;
                return ctx.replyWithHTML(replyText, { reply_to_message_id: ctx.message.message_id });
            }
        } catch (error) {
            console.log("Calculation error:", error);
        }
    }
});

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

