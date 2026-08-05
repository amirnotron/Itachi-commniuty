const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, UserSelectMenuBuilder, ChannelType, PermissionFlagsBits } = require('discord.js');
const SecurityConfig = require('../models/SecurityConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('security-admin')
        .setDescription('🛡️ تنظیمات پیشرفته سیستم امنیت و آنتی‌اسپم')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        let config = await SecurityConfig.findOne({ guildId: interaction.guild.id });
        if (!config) {
            config = await SecurityConfig.create({ guildId: interaction.guild.id });
        }

        const embed = new EmbedBuilder()
            .setTitle('🛡️ مرکز کنترل امنیت و آنتی‌اسپم سرور')
            .setDescription('تنظیمات فیلتر چنل‌ها و وایت‌لیست را از طریق منوهای زیر مدیریت کنید.')
            .addFields(
                { name: '🌐 چنل‌های مجاز لینک اینوایت', value: config.antiLink.allowedInviteChannels.length ? config.antiLink.allowedInviteChannels.map(id => `<#${id}>`).join(', ') : 'هیچکدام', inline: false },
                { name: '🔗 چنل‌های مجاز لینک‌های عمومی', value: config.antiLink.allowedWebChannels.length ? config.antiLink.allowedWebChannels.map(id => `<#${id}>`).join(', ') : 'هیچکدام', inline: false },
                { name: '🛡️ رول‌های استثنا (Whitelist Roles)', value: config.antiLink.whitelistedRoles.length ? config.antiLink.whitelistedRoles.map(id => `<@&${id}>`).join(', ') : 'هیچکدام', inline: true },
                { name: '👤 کاربران استثنا (Whitelist Users)', value: config.antiLink.whitelistedUsers.length ? config.antiLink.whitelistedUsers.map(id => `<@${id}>`).join(', ') : 'هیچکدام', inline: true }
            )
            .setColor('Red');

        // منوی انتخاب چنل‌های اینوایت دیسکورد
        const inviteChannelsMenu = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId('sec_invite_channels')
                .setPlaceholder('چنل‌های مجاز ارسال لینک اینوایت دیسکورد')
                .setChannelTypes(ChannelType.GuildText)
                .setMinValues(0)
                .setMaxValues(5)
        );

        // منوی انتخاب چنل‌های لینک‌های عادی وب
        const webChannelsMenu = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder()
                .setCustomId('sec_web_channels')
                .setPlaceholder('چنل‌های مجاز ارسال لینک‌های عادی وب')
                .setChannelTypes(ChannelType.GuildText)
                .setMinValues(0)
                .setMaxValues(5)
        );

        // منوی رول‌های وایت‌لیست
        const rolesMenu = new ActionRowBuilder().addComponents(
            new RoleSelectMenuBuilder()
                .setCustomId('sec_roles')
                .setPlaceholder('رول‌های مجاز (دور زدن تمام فیلترها)')
                .setMinValues(0)
                .setMaxValues(5)
        );

        // منوی کاربران وایت‌لیست
        const usersMenu = new ActionRowBuilder().addComponents(
            new UserSelectMenuBuilder()
                .setCustomId('sec_users')
                .setPlaceholder('کاربران مجاز (دور زدن تمام فیلترها)')
                .setMinValues(0)
                .setMaxValues(5)
        );

        await interaction.reply({ embeds: [embed], components: [inviteChannelsMenu, webChannelsMenu, rolesMenu, usersMenu], ephemeral: true });
    }
};