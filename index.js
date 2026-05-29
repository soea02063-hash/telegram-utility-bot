‎const { Telegraf, Markup } = require('telegraf');
‎const express = require('express');
‎
‎const bot = new Telegraf('8951168764:AAELuCMhE5gY8m7-GtAkuKOGgNc1XeDYF2s');
‎
‎const app = express();
‎const PORT = process.env.PORT || 3000;
‎app.get('/', (req, res) => res.send('Bot is active!'));
‎app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
‎
‎// Regex ကို ၄၆ လုံးထက် ရှည်ရင်လည်း ဖတ်နိုင်အောင် ပြင်ဆင်ထားသည်
‎const tonRegex = /(EQ[a-zA-Z0-9_-]{46,}|UQ[a-zA-Z0-9_-]{46,})/;
‎const calcRegex = /^[0-9+\-*/().\s]+$/;
‎
‎bot.on('message', async (ctx) => {
‎    if (!ctx.message || !ctx.message.text) return;
‎    const msgText = ctx.message.text.trim();
‎
‎    // ---- TON Address Detected ----
‎    const matchTon = msgText.match(tonRegex);
‎    if (matchTon) {
‎        const tonAddress = matchTon[0];
‎        
‎        // MarkdownV2 စနစ်အရ စာသားကို ကလစ်နှိပ်ရုံဖြင့် တန်း Copy ရအောင်လုပ်ခြင်း
‎        const replyMessage = `💎 *TON Address Detected:*\n\`${tonAddress}\``;
‎        
‎        return ctx.replyWithMarkdownV2(replyMessage, {
‎            reply_to_message_id: ctx.message.message_id
‎        });
‎    }
‎
‎    // ---- Calculator ----
‎    if (calcRegex.test(msgText) && /[+\-*/]/.test(msgText)) {
‎        try {
‎            const result = new Function(`return ${msgText}`)();
‎            if (result !== undefined && !isNaN(result)) {
‎                
‎                // ရလဒ်ကို နှိပ်လိုက်တာနဲ့ ဖုန်းထဲ တန်းကော်ပီဝင်သွားအောင် လုပ်ခြင်း
‎                const replyText = `🧮 *Calculation Result:*\n\`${result}\``;
‎                
‎                return ctx.replyWithMarkdownV2(replyText, {
‎                    reply_to_message_id: ctx.message.message_id
‎                });
‎            }
‎        } catch (error) {
‎            console.log("Calculation error:", error);
‎        }
‎    }
‎});
‎
‎bot.launch();
‎process.once('SIGINT', () => bot.stop('SIGINT'));
‎process.once('SIGTERM', () => bot.stop('SIGTERM'));
‎
