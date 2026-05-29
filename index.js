const { Telegraf } = require('telegraf');
const express = require('express');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// Environment Variables စနစ်သုံးပြီး Token နှင့် Key များကို လုံခြုံအောင် ယူခြင်း
const bot = new Telegraf(process.env.BOT_TOKEN || '8951168764:AAELuCMhE5gY8m7-GtAkuKOGgNc1XeDYF2s');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY || 'AQ.Ab8RN6IBHU8nVwRXhUdtpuDaKKjpclG9iEpX3CdizPBLCaUTtA'); 
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is active!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const tonRegex = /(EQ[a-zA-Z0-9_-]{46,}|UQ[a-zA-Z0-9_-]{46,})/;
const calcRegex = /^[0-9+\-*/().\s]+$/;

function escapeMarkdown(text) {
    if (!text) return '';
    return String(text).replace(/[_*\[\]()~`>#+-=|{}.!]/g, '\\$&');
}

bot.on('message', async (ctx) => {
    if (!ctx.message || !ctx.message.text) return;
    const msgText = ctx.message.text.trim();

    // 1. TON Wallet Check
    const matchTon = msgText.match(tonRegex);
    if (matchTon) {
        const tonAddress = matchTon[0];
        return ctx.replyWithMarkdownV2(`💎 *TON Address:*\n\`${escapeMarkdown(tonAddress)}\``, { reply_to_message_id: ctx.message.message_id });
    }

    // 2. Calculator Check
    if (calcRegex.test(msgText) && /[+\-*/]/.test(msgText)) {
        try {
            const result = new Function(`return ${msgText}`)();
            if (result !== undefined && !isNaN(result)) {
                return ctx.replyWithMarkdownV2(`🧮 *Result:*\n\`${escapeMarkdown(result)}\``, { reply_to_message_id: ctx.message.message_id });
            }
        } catch (e) {}
    }

    // 3. Gemini AI (etpepe Prefix)
    if (msgText.toLowerCase().startsWith('etpepe')) {
        const question = msgText.substring(6).trim(); 
        
        if (!question) {
            return ctx.reply("🤔 etpepe ရဲ့နောက်မှာ မေးချင်တဲ့ မေးခွန်းကို တစ်ခါတည်း ရိုက်ထည့်ပေးပါဗျာ။", { reply_to_message_id: ctx.message.message_id });
        }

        try {
            await ctx.sendChatAction('typing'); 
            const result = await model.generateContent(question);
            const response = await result.response;
            const text = response.text();
            
            return ctx.reply(text, { reply_to_message_id: ctx.message.message_id });
        } catch (err) {
            console.error("Gemini Error:", err);
            return ctx.reply("❌ Gemini AI နဲ့ ချိတ်ဆက်ရာတွင် အမှားအယွင်းရှိနေပါသည်။ API Key ကို ပြန်စစ်ပေးပါ။", { reply_to_message_id: ctx.message.message_id });
        }
    }
});

bot.launch();
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

