const { Events, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const GuildConfig = require('../models/GuildConfig');
const Giveaway = require('../models/Giveaway');

module.exports = {
    name: Events.ClientReady,
    once: true,
    async execute(client) {
        console.log(`🔥 بات ${client.user.tag} با موفقیت آنلاین شد!`);

        client.invitesCache = new Map();

        client.guilds.cache.forEach(async (guild) => {
            try {
                const invites = await guild.invites.fetch();
                const inviteMap = new Map();
                invites.forEach(inv => inviteMap.set(inv.code, inv));
                client.invitesCache.set(guild.id, inviteMap);
            } catch (err) {
                console.log(`⚠️ عدم دسترسی به اینوایت‌های سرور: ${guild.name} (احتمالاً ربات پرمیشن Manage Server ندارد)`);
            }
        });

        const updateChannels = async () => {
            try {
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

                    if (totalChannel) await totalChannel.setName(`🌐Members : ${totalMembers}`).catch(() => { });
                    if (botsChannel) await botsChannel.setName(`🤖Bots : ${botCount}`).catch(() => { });
                    if (onlineChannel) await onlineChannel.setName(`🟢Online : ${onlineMembers}`).catch(() => { });
                }

                console.log('✅ وضعیت چنل‌های آمار آپدیت شد.');

            } catch (error) {
                console.error('❌ خطایی در آپدیت چنل‌های آمار پیش آمد:', error);
            }
        };

        updateChannels();
        setInterval(updateChannels, 600000);

        setInterval(async () => {
            try {
                const endedGiveaways = await Giveaway.find({ ended: false, endAt: { $lte: Date.now() } });

                for (const gw of endedGiveaways) {
                    gw.ended = true;
                    await gw.save();

                    const guild = client.guilds.cache.get(gw.guildId);
                    if (!guild) continue;

                    const channel = guild.channels.cache.get(gw.channelId);
                    if (!channel) continue;

                    const message = await channel.messages.fetch(gw.messageId).catch(() => null);
                    if (!message) continue;

                    let winners = [];
                    if (gw.participants.length > 0) {
                        const shuffled = gw.participants.sort(() => 0.5 - Math.random());
                        winners = shuffled.slice(0, gw.winnersCount);
                    }

                    const disabledBtn = new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setCustomId('gw_ended').setLabel('پایان یافته').setStyle(ButtonStyle.Secondary).setDisabled(true)
                    );

                    const endEmbed = EmbedBuilder.from(message.embeds[0])
                        .setColor('#2c3040')
                        .setDescription(`🏆 **برندگان:** ${winners.length > 0 ? winners.map(w => `<@${w}>`).join(', ') : 'هیچکس شرکت نکرد!'}\n🎁 **برگزارکننده:** <@${gw.hostId}>`);

                    await message.edit({ embeds: [endEmbed], components: [disabledBtn] }).catch(() => { });

                    if (winners.length > 0) {
                        await channel.send(`🎉 تبریک به ${winners.map(w => `<@${w}>`).join(', ')}!\nشما برنده **${gw.prize}** شدید! 🥳\n🔗 لینک قرعه‌کشی: ${message.url}`);
                    } else {
                        await channel.send(`😔 متاسفانه کسی در قرعه‌کشی **${gw.prize}** شرکت نکرد.`);
                    }
                }
            } catch (error) {
                console.error('❌ خطایی در لوپ بررسی گیووی‌ها رخ داد:', error);
            }
        }, 15000);
    },
};