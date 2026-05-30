const { Telegraf } = require('telegraf');
const express = require('express');

const bot = new Telegraf('8951168764:AAELuCMhE5gY8m7-GtAkuKOGgNc1XeDYF2s');

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is active!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

// Regex စနစ်များ
const tonRegex = /(EQ[a-zA-Z0-9_-]{46,}|UQ[a-zA-Z0-9_-]{46,})/;
const calcRegex = /^[0-9+\-*/().\s]+$/;

// MarkdownV2 စနစ်အတွက် စာသားများကို သန့်စင်ပေးသည့် Function
function escapeMarkdown(text) {
    if (!text) return '';
    return String(text).replace(/[_*\[\]()~`>#+-=|{}.!]/g, '\\$&');
}

bot.on('message', async (ctx) => {
    if (!ctx.message || !ctx.message.text) return;
    const msgText = ctx.message.text.trim();

    // 1. TON Wallet Address စစ်ခြင်း
    const matchTon = msgText.match(tonRegex);
    if (matchTon) {
        const tonAddress = matchTon[0];
        const replyMessage = `💎 *TON Address Detected:*\n\`${escapeMarkdown(tonAddress)}\``;
        return ctx.replyWithMarkdownV2(replyMessage, { reply_to_message_id: ctx.message.message_id });
    }

    // 2. Calculator တွက်ချက်ခြင်း
    if (calcRegex.test(msgText) && /[+\-*/]/.test(msgText)) {
        try {
            const result = new Function(`return ${msgText}`)();
            if (result !== undefined && !isNaN(result)) {
                const replyText = `🧮 *Calculation Result:*\n\`${escapeMarkdown(result)}\``;
                return ctx.replyWithMarkdownV2(replyText, { reply_to_message_id: ctx.message.message_id });
            }
        } catch (err) {
            console.log("Calculation error:", err);
        }
    }
});

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

