const { Telegraf } = require('telegraf');
const express = require('express');

const bot = new Telegraf('8951168764:AAELuCMhE5gY8m7-GtAkuKOGgNc1XeDYF2s');

const app = express();
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => res.send('Bot is active!'));
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

const tonRegex = /(EQ[a-zA-Z0-9_-]{46,}|UQ[a-zA-Z0-9_-]{46,})/;
const calcRegex = /^[0-9+\-*/().\s]+$/;

// ---- Username များကို ယာယီမှတ်သားထားမည့် နေရာ (In-Memory DB) ----
const userCache = {};

// ---- User ID & Info Checker (/id) ----
bot.command('id', async (ctx) => {
    let targetUser;
    if (ctx.message.reply_to_message) {
        targetUser = ctx.message.reply_to_message.from;
    } else {
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

    const infoMessage = `
👤 *User Information:*
\- *ID:* \`${userId}\` \(Tap to copy\)
\- *Name:* _${fullName}_
\- *Username:* ${username}
\- *Premium:* ${isPremium}
\- *Is Bot:* ${isBot}
    `.trim();

    // အချက်အလက်စစ်ရင်းနှင့် Username စာရင်းကိုပါ Database ထဲ ထည့်သွင်း/Update လုပ်ခြင်း
    if (targetUser.username) {
        userCache[userId] = `@${targetUser.username}`;
    }

    return ctx.replyWithMarkdownV2(infoMessage, {
        reply_to_message_id: ctx.message.message_id
    });
});

// ---- Message Listener (Username Tracker, TON & Calculator) ----
bot.on('message', async (ctx) => {
    if (!ctx.message || !ctx.message.from) return;

    const userId = ctx.message.from.id;
    const currentUsername = ctx.message.from.username ? `@${ctx.message.from.username}` : null;

    // ---- Username Change Tracker (အဓိက စနစ်သစ်) ----
    if (currentUsername) {
        // အရင်က ဒီလူ့ရဲ့ Username ကို မှတ်ဖူးသား ရှိမရှိ စစ်မည်
        if (userCache[userId]) {
            const oldUsername = userCache[userId];

            // အကယ်၍ မှတ်ထားတဲ့ နာမည်ဟောင်းနဲ့ လက်ရှိနာမည် မတူတော့ရင် (နာမည်ချိန်းလိုက်ရင်)
            if (oldUsername !== currentUsername) {
                // MarkdownV2 စနစ်အရ @ သင်္ကေတများကို Escape လုပ်ပေးရန် လိုအပ်ပါသည်
                const safeOld = oldUsername.replace(/_/g, '\\_');
                const safeNew = currentUsername.replace(/_/g, '\\_');
                
                const changeAlert = `🤔 *This user changed username from* ${safeOld} *to* ${safeNew}`;
                
                ctx.replyWithMarkdownV2(changeAlert, {
                    reply_to_message_id: ctx.message.message_id
                });
            }
        }
        // သမိုင်းကြောင်းအသစ်ကို Database ထဲ ပြန်သိမ်းမည်
        userCache[userId] = currentUsername;
    }

    if (!ctx.message.text) return;
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

