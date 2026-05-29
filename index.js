const { Telegraf } = require('telegraf');
const express = require('express');

const bot = new Telegraf('8951168764:AAELuCMhE5gY8m7-GtAkuKOGgNc1XeDYF2s');

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is active!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const tonRegex = /(EQ[a-zA-Z0-9_-]{46,}|UQ[a-zA-Z0-9_-]{46,})/;
const calcRegex = /^[0-9+\-*/().\s]+$/;

// ---- Username Database ----
const userCache = {};

// MarkdownV2 အတွက် Special Characters များကို ပိတ်ပေးမည့် Function
function escapeMarkdown(text) {
    if (!text) return '';
    return String(text).replace(/[_*\[\]()~`>#+-=|{}.!]/g, '\\$&');
}

// ---- Pin Link Checker (/pin သို့မဟုတ် pin စာသား) ----
async function checkLatestPinLink(ctx) {
    try {
        const chat = await ctx.telegram.getChat(ctx.chat.id);
        if (!chat.pinned_message) {
            return ctx.reply("❌ ဒီ Group မှာ ဘာမှ Pin လုပ်မထားပါဘူး။");
        }

        const msg = chat.pinned_message;
        const text = msg.text || msg.caption || "";
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const links = text.match(urlRegex);

        if (links) {
            // နောက်ဆုံး Pin လုပ်ထားတဲ့ စာထဲက ပထမဆုံး Link ကို ယူမည်
            return ctx.reply(`📌 *နောက်ဆုံး Pin လုပ်ထားသော Link:* \n${links[0]}`);
        } else {
            return ctx.reply("ℹ️ နောက်ဆုံး Pin လုပ်ထားတဲ့ စာထဲမှာ Link မတွေ့ပါဘူး။");
        }
    } catch (err) {
        console.log("Pin Error:", err);
        ctx.reply("❌ Error ဖြစ်နေပါတယ်၊ Bot ကို Group Admin ပေးထားကြောင်း သေချာပါစေ။");
    }
}

// /pin Command အတွက်
bot.command('pin', checkLatestPinLink);

// ---- User ID & Info Checker (/id) ----
bot.command('id', async (ctx) => {
    try {
        let targetUser = ctx.message.reply_to_message ? ctx.message.reply_to_message.from : ctx.message.from;
        if (!targetUser) return;

        const userId = targetUser.id;
        const fullName = `${targetUser.first_name || 'No Name'} ${targetUser.last_name || ''}`.trim();
        const username = targetUser.username ? `@${targetUser.username}` : 'None';
        const isPremium = targetUser.is_premium ? 'Active (Yes)' : 'No';
        const isBot = targetUser.is_bot ? 'Yes' : 'No';

        if (targetUser.username) {
            userCache[userId] = `@${targetUser.username}`;
        }

        const infoMessage = `
👤 *User Information:*
\\- *ID:* \`${userId}\`
\\- *Name:* _${escapeMarkdown(fullName)}_
\\- *Username:* ${escapeMarkdown(username)}
\\- *Premium:* ${escapeMarkdown(isPremium)}
\\- *Is Bot:* ${escapeMarkdown(isBot)}
        `.trim();

        return ctx.replyWithMarkdownV2(infoMessage, { reply_to_message_id: ctx.message.message_id });
    } catch (err) {
        console.log("ID Command Error:", err);
    }
});

// ---- Message Listener (အခြား Feature များအားလုံး) ----
bot.on('message', async (ctx) => {
    try {
        if (!ctx.message || !ctx.message.from) return;

        const userId = ctx.message.from.id;
        const currentUsername = ctx.message.from.username ? `@${ctx.message.from.username}` : null;

        // ---- Username Change Tracker ----
        if (currentUsername) {
            if (userCache[userId]) {
                const oldUsername = userCache[userId];

                if (oldUsername !== currentUsername) {
                    const safeOld = escapeMarkdown(oldUsername);
                    const safeNew = escapeMarkdown(currentUsername);
                    
                    const changeAlert = `🤔 *This user changed username from* ${safeOld} *to* ${safeNew}`;
                    ctx.replyWithMarkdownV2(changeAlert, { reply_to_message_id: ctx.message.message_id });
                }
            }
            userCache[userId] = currentUsername;
        }

        if (!ctx.message.text) return;
        const msgText = ctx.message.text.trim();

        // ---- Pin ဟု စာသားသက်သက် ရိုက်ပါက Link ရှာပေးမည့်စနစ် ----
        if (msgText.toLowerCase() === 'pin') {
            return checkLatestPinLink(ctx);
        }

        // ---- TON Address Detected ----
        const matchTon = msgText.match(tonRegex);
        if (matchTon) {
            const tonAddress = matchTon[0];
            const replyMessage = `💎 *TON Address Detected:*\n\`${escapeMarkdown(tonAddress)}\``;
            return ctx.replyWithMarkdownV2(replyMessage, { reply_to_message_id: ctx.message.message_id });
        }

        // ---- Calculator ----
        if (calcRegex.test(msgText) && /[+\-*/]/.test(msgText)) {
            const result = new Function(`return ${msgText}`)();
            if (result !== undefined && !isNaN(result)) {
                const replyText = `🧮 *Calculation Result:*\n\`${escapeMarkdown(result)}\``;
                return ctx.replyWithMarkdownV2(replyText, { reply_to_message_id: ctx.message.message_id });
            }
        }
    } catch (err) {
        console.log("Message Listener Error:", err);
    }
});

bot.launch().catch(err => console.error("Bot launch error:", err));
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

