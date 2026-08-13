const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const ms = require('ms');
const Giveaway = require('../models/Giveaway');
const GiveawayConfig = require('../models/GiveawayConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('🎉 مدیریت کامل سیستم قرعه‌کشی')
        .addSubcommand(sub => sub
            .setName('start')
            .setDescription('شروع یک گیووی جدید')
            .addStringOption(opt => opt.setName('prize').setDescription('جایزه قرعه‌کشی').setRequired(true))
            .addStringOption(opt => opt.setName('duration').setDescription('زمان (مثال: 1d, 12h, 30m)').setRequired(true))
            .addIntegerOption(opt => opt.setName('winners').setDescription('تعداد برنده‌ها').setRequired(true))
            .addUserOption(opt => opt.setName('host').setDescription('اسپانسر / برگزارکننده (اختیاری)'))
            .addIntegerOption(opt => opt.setName('req_invites').setDescription('تعداد اینوایت‌های مورد نیاز (اختیاری)'))
            .addStringOption(opt => opt.setName('message').setDescription('پیام دلخواه بالای گیووی (اختیاری)')))
        .addSubcommand(sub => sub
            .setName('end')
            .setDescription('پایان زودهنگام یک گیووی')
            .addStringOption(opt => opt.setName('message_id').setDescription('آیدی پیام گیووی').setRequired(true)))
        .addSubcommand(sub => sub
            .setName('reroll')
            .setDescription('انتخاب مجدد برنده یک گیووی')
            .addStringOption(opt => opt.setName('message_id').setDescription('آیدی پیام گیووی').setRequired(true))),

    async execute(interaction) {
        const config = await GiveawayConfig.findOne({ guildId: interaction.guild.id });
        const hasAccess = interaction.member.permissions.has('Administrator') || 
                          (config && interaction.member.roles.cache.some(r => config.managerRoles.includes(r.id)));
                          
        if (!hasAccess) return interaction.reply({ content: '❌ شما دسترسی لازم برای مدیریت گیووی را ندارید.', ephemeral: true });

        const subcommand = interaction.options.getSubcommand();

        if (subcommand === 'start') {
            const prize = interaction.options.getString('prize');
            const durationStr = interaction.options.getString('duration');
            const winnersCount = interaction.options.getInteger('winners');
            const host = interaction.options.getUser('host') || interaction.user;
            const reqInvites = interaction.options.getInteger('req_invites') || 0;
            const customMessage = interaction.options.getString('message');

            const durationMs = ms(durationStr);
            if (!durationMs) return interaction.reply({ content: '❌ فرمت زمان اشتباه است. از 1d یا 2h استفاده کنید.', ephemeral: true });

            const endAt = Date.now() + durationMs;
            const discordTimestamp = `<t:${Math.floor(endAt / 1000)}:R>`;

            const embed = new EmbedBuilder()
                .setTitle(`🎉 ${prize}`)
                .setDescription(
                    `برای شرکت در قرعه‌کشی روی دکمه زیر کلیک کنید!\n\n` +
                    `🏆 **تعداد برنده:** ${winnersCount}\n` +
                    `🎁 **برگزارکننده:** ${host}\n` +
                    `⏳ **پایان:** ${discordTimestamp}\n` +
                    (reqInvites > 0 ? `\n🔗 **شرط ورود:** دعوتِ **${reqInvites} نفر** به سرور (از الان به بعد)` : '')
                )
                .setColor('#2c3040')
                .setFooter({ text: 'ایجاد شده در' })
                .setTimestamp();

            const btn = new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('gw_join').setLabel('شرکت در قرعه‌کشی').setStyle(ButtonStyle.Primary).setEmoji('🎉')
            );

            await interaction.reply({ content: '✅ در حال ساخت گیووی...', ephemeral: true });
            
            const messagePayload = { embeds: [embed], components: [btn] };
            if (customMessage) messagePayload.content = customMessage;
            
            const gwMessage = await interaction.channel.send(messagePayload);

            await Giveaway.create({
                messageId: gwMessage.id,
                channelId: gwMessage.channel.id,
                guildId: gwMessage.guild.id,
                hostId: host.id,
                prize,
                winnersCount,
                endAt,
                reqInvites
            });
        }

        else if (subcommand === 'end') {
            const messageId = interaction.options.getString('message_id');
            const gw = await Giveaway.findOne({ messageId, guildId: interaction.guild.id, ended: false });
            
            if (!gw) return interaction.reply({ content: '❌ گیووی فعال با این آیدی یافت نشد.', ephemeral: true });
            
            gw.endAt = Date.now();
            await gw.save();
            return interaction.reply({ content: '✅ گیووی بلافاصله متوقف شد و در حال پردازش نتایج است...', ephemeral: true });
        }

        else if (subcommand === 'reroll') {
            const messageId = interaction.options.getString('message_id');
            const gw = await Giveaway.findOne({ messageId, guildId: interaction.guild.id, ended: true });
            
            if (!gw) return interaction.reply({ content: '❌ گیووی پایان‌یافته با این آیدی یافت نشد.', ephemeral: true });
            if (gw.participants.length === 0) return interaction.reply({ content: '❌ کسی در این گیووی شرکت نکرده بود.', ephemeral: true });

            const winnerId = gw.participants[Math.floor(Math.random() * gw.participants.length)];
            await interaction.reply({ content: `🎉 برنده جدید قرعه‌کشی **${gw.prize}**: <@${winnerId}>! تبریک! 🥳` });
        }
    }
};