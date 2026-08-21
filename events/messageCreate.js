const { Events, PermissionFlagsBits } = require('discord.js');
const SecurityConfig = require('../models/SecurityConfig');
const { addXP } = require('../utils/levelManager');

const spamMap = new Map();

module.exports = {
    name: Events.MessageCreate,
    async execute(message, client) {
        try {
            if (!message.guild || message.author.bot) return;
            // 🛡️ فیکس مهم: بعضی وقتا پیام میاد ولی member اون کش نشده (لفت داده یا هنوز کش نشده)
            // بدون این چک، ربات با ارور "Cannot read properties of null (reading 'roles')" کرش می‌کرد
            if (!message.member) return;

            const prefix = 'g$';
            if (message.content.startsWith(prefix)) {
                const args = message.content.slice(prefix.length).trim().split(/ +/);
                const command = args.shift().toLowerCase();

                if (command === 'play') {
                    const query = args.join(' ');
                    if (!query) return message.reply('❌ باید اسم یا لینک آهنگ رو بنویسی! (مثال: `g$play Reza Pishro Azad`)');

                    const voiceChannel = message.member.voice.channel;
                    if (!voiceChannel) return message.reply('❌ اول باید وارد یک چنل ویس بشی!');

                    message.reply(`🔍 در حال جستجوی **${query}**...`);

                    try {
                        await client.distube.play(voiceChannel, query, {
                            member: message.member,
                            textChannel: message.channel,
                            message
                        });
                    } catch (err) {
                        message.channel.send('❌ آهنگ پیدا نشد یا خطایی رخ داد.');
                    }
                }
            }

            const textXpToGive = Math.floor(Math.random() * 11) + 15;
            await addXP(message.member, textXpToGive, false);

            // ادمین‌های کل سرور نیازی به فیلتر شدن ندارند
            if (message.member?.permissions.has(PermissionFlagsBits.Administrator)) return;

            const config = await SecurityConfig.findOne({ guildId: message.guild.id });
            if (!config) return;

            const userId = message.author.id;
            const channelId = message.channel.id;
            const userRoles = message.member.roles.cache.map(r => r.id);

            // چک کردن وایت‌لیست کاربر یا رول
            const isWhitelisted = config.antiLink.whitelistedUsers.includes(userId) ||
                userRoles.some(roleId => config.antiLink.whitelistedRoles.includes(roleId));

            if (isWhitelisted) return;

            // --- ۱. سیستم آنتی‌لینک پیشرفته ---
            if (config.antiLink.enabled) {
                const discordInviteRegex = /(discord\.(gg|io|me|li)|discord\.com\/invite)\/[a-zA-Z0-9]+/i;
                const generalLinkRegex = /(https?:\/\/[^\s]+)/gi;

                const containsInvite = discordInviteRegex.test(message.content);
                const containsWebLink = generalLinkRegex.test(message.content);

                // سناریو A: لینک اینوایت دیسکورد ارسال شده
                if (containsInvite) {
                    const isInviteAllowed = config.antiLink.allowedInviteChannels.includes(channelId);
                    if (!isInviteAllowed) {
                        await message.delete().catch(() => { });

                        // تایم‌اوت ۲۴ ساعته (۱ روز)
                        const ONE_DAY_MS = 24 * 60 * 60 * 1000;
                        await message.member.timeout(ONE_DAY_MS, 'ارسال لینک اینوایت دیسکورد غیرمجاز').catch(console.error);

                        const warn = await message.channel.send(`⚠️ ${message.author} به دلیل ارسال لینک اینوایت دیسکورد به مدت **۱ روز** تایم‌اوت شد.`);
                        setTimeout(() => warn.delete().catch(() => { }), 6000);
                        return;
                    }
                }
                // سناریو B: لینک عادی وب ارسال شده
                else if (containsWebLink) {
                    const isWebAllowed = config.antiLink.allowedWebChannels.includes(channelId);
                    if (!isWebAllowed) {
                        await message.delete().catch(() => { });
                        const warn = await message.channel.send(`⚠️ ${message.author} ارسال لینک وب در این چنل مجاز نیست.`);
                        setTimeout(() => warn.delete().catch(() => { }), 5000);
                        return;
                    }
                }
            }

            // --- ۲. سیستم آنتی‌اسپم (Sliding Window Algorithm) ---
            if (config.antiSpam.enabled) {
                const now = Date.now();
                const { maxMessages, timeWindowMs, timeoutMs } = config.antiSpam;

                if (!spamMap.has(userId)) {
                    spamMap.set(userId, []);
                }

                const userTimestamps = spamMap.get(userId);
                userTimestamps.push(now);

                // پاکسازی پیام‌های قدیمی‌تر از بازه زمانی تعریف‌شده
                const recentMessages = userTimestamps.filter(timestamp => now - timestamp < timeWindowMs);
                spamMap.set(userId, recentMessages);

                if (recentMessages.length > maxMessages) {
                    await message.delete().catch(() => { });
                    await message.member.timeout(timeoutMs, 'تجاوز از حد مجاز ارسال پیام (Spam)').catch(console.error);

                    spamMap.delete(userId); // ریست حافظه کاربر
                    const warn = await message.channel.send(`🚫 ${message.author} به دلیل اسپم مجدداً به مدت ۱۰ دقیقه بی‌صدا شد.`);
                    setTimeout(() => warn.delete().catch(() => { }), 6000);
                }
            }
        } catch (error) {
            console.error('❌ خطای پیش‌بینی‌نشده در messageCreate:', error);
        }
    }
};