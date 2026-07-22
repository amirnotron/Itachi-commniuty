const { Events } = require('discord.js');
const config = require('../config.json');

module.exports = {
    name: Events.ClientReady,
    once: true,
    execute(client) {
        console.log(`🔥 بات ${client.user.tag} با موفقیت آنلاین شد!`);

        const updateChannels = async () => {
            try {
                const guild = client.guilds.cache.get(config.guildId);
                if (!guild) return;

                await guild.members.fetch();

                const totalMembers = guild.memberCount;
                const botCount = guild.members.cache.filter(member => member.user.bot).size;
                const onlineMembers = guild.members.cache.filter(member =>
                    !member.user.bot &&
                    member.presence &&
                    member.presence.status !== 'offline'
                ).size;

                const totalChannel = guild.channels.cache.get(config.totalMembersChannelId);
                const botsChannel = guild.channels.cache.get(config.botCountChannelId);
                const onlineChannel = guild.channels.cache.get(config.onlineMembersChannelId);

                if (totalChannel) await totalChannel.setName(`🌐Members : ${totalMembers}`);
                if (botsChannel) await botsChannel.setName(`🤖Bots : ${botCount}`);
                if (onlineChannel) await onlineChannel.setName(`🟢Online : ${onlineMembers}`);

                console.log('✅ وضعیت چنل‌ها آپدیت شد!');

            } catch (error) {
                console.error('❌ خطایی در آپدیت چنل‌ها پیش آمد:', error);
            }
        };

        updateChannels();

        setInterval(updateChannels, 600000);
    },
};