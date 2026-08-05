const { Events } = require('discord.js');
const GuildConfig = require('../models/GuildConfig'); // ایمپورت مدل دیتابیس

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`🔥 بات ${client.user.tag} با موفقیت آنلاین شد!`);

        const updateChannels = async () => {
            try {
                // دریافت تمام تنظیمات سرورها از دیتابیس
                const configs = await GuildConfig.find({});
                if (!configs || configs.length === 0) return;

                for (const dbConfig of configs) {
                    const guild = client.guilds.cache.get(dbConfig.guildId);
                    if (!guild) continue;

                    await guild.members.fetch();

                    const totalMembers = guild.memberCount;
                    const botCount = guild.members.cache.filter(member => member.user.bot).size;
                    const onlineMembers = guild.members.cache.filter(member =>
                        !member.user.bot &&
                        member.presence &&
                        member.presence.status !== 'offline'
                    ).size;

                    const totalChannel = guild.channels.cache.get(dbConfig.totalMembersChannelId);
                    const botsChannel = guild.channels.cache.get(dbConfig.botCountChannelId);
                    const onlineChannel = guild.channels.cache.get(dbConfig.onlineMembersChannelId);

                    if (totalChannel) await totalChannel.setName(`🌐Members : ${totalMembers}`);
                    if (botsChannel) await botsChannel.setName(`🤖Bots : ${botCount}`);
                    if (onlineChannel) await onlineChannel.setName(`🟢Online : ${onlineMembers}`);
                }

                console.log('✅ وضعیت چنل‌های آمار از طریق دیتابیس آپدیت شد!');

            } catch (error) {
                console.error('❌ خطایی در آپدیت چنل‌ها پیش آمد:', error);
            }
        };

        updateChannels();
        setInterval(updateChannels, 600000);
    },
};