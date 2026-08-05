const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, UserSelectMenuBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');
const GuildConfig = require('../models/GuildConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket-admin')
        .setDescription('⚙️ داشبورد پیشرفته مدیریت سیستم تیکت')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {
        // خواندن دیتابیس
        let dbConfig = await GuildConfig.findOne({ guildId: interaction.guild.id });
        if (!dbConfig) {
            dbConfig = await GuildConfig.create({ guildId: interaction.guild.id });
        }

        // ساخت امبد اصلی داشبورد
        const embed = new EmbedBuilder()
            .setTitle('⚙️ داشبورد مدیریت سیستم تیکت')
            .setDescription('از طریق منوهای زیر تنظیمات را انجام دهید. تغییرات شما بلافاصله ذخیره می‌شوند.')
            .addFields(
                { name: '📁 کتگوری تیکت‌ها', value: dbConfig.ticketCategoryId ? `<#${dbConfig.ticketCategoryId}>` : 'تنظیم نشده', inline: true },
                { name: '📄 چنل رونوشت (Transcript)', value: dbConfig.transcriptChannelId ? `<#${dbConfig.transcriptChannelId}>` : 'تنظیم نشده', inline: true },
                { name: '\u200B', value: '\u200B' }, // یه فاصله تمیز
                { name: '🛡️ رول‌های پشتیبانی', value: dbConfig.supportRoleIds.length ? dbConfig.supportRoleIds.map(id => `<@&${id}>`).join(', ') : 'تنظیم نشده' },
                { name: '👤 کاربران پشتیبان (Staff)', value: dbConfig.supportUserIds.length ? dbConfig.supportUserIds.map(id => `<@${id}>`).join(', ') : 'تنظیم نشده' }
            )
            .setColor('DarkButNotBlack');

        // ردیف ۱: انتخاب کتگوری
        const categoryMenu = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder().setCustomId('admin_category').setPlaceholder('📁 انتخاب کتگوری تیکت‌ها').setChannelTypes(ChannelType.GuildCategory)
        );

        // ردیف ۲: انتخاب چنل لاگ
        const transcriptMenu = new ActionRowBuilder().addComponents(
            new ChannelSelectMenuBuilder().setCustomId('admin_transcript').setPlaceholder('📄 انتخاب چنل رونوشت (ترانسکریپت)').setChannelTypes(ChannelType.GuildText)
        );

        // ردیف ۳: انتخاب رول‌های تیم ساپورت
        const rolesMenu = new ActionRowBuilder().addComponents(
            new RoleSelectMenuBuilder().setCustomId('admin_roles').setPlaceholder('🛡️ انتخاب رول‌های پشتیبان').setMinValues(0).setMaxValues(5)
        );

        // ردیف ۴: انتخاب یوزرهای خاص به عنوان ساپورت
        const usersMenu = new ActionRowBuilder().addComponents(
            new UserSelectMenuBuilder().setCustomId('admin_users').setPlaceholder('👤 انتخاب اشخاص پشتیبان').setMinValues(0).setMaxValues(5)
        );

        // ردیف ۵: دکمه ارسال پنل نهایی
        const sendPanelBtn = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('admin_send_panel').setLabel('ارسال پیام تیکت در این چنل').setStyle(ButtonStyle.Success).setEmoji('📩')
        );

        // فقط ادمین بتونه این داشبورد رو ببینه
        await interaction.reply({ embeds: [embed], components: [categoryMenu, transcriptMenu, rolesMenu, usersMenu, sendPanelBtn], ephemeral: true });
    }
};