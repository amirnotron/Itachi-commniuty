const { SlashCommandBuilder, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const hasModAccess = require('../utils/checkAccess');

// یک کش ساده برای نگه داشتن عکس ارسالی تا زمان سابمیت شدن مودال
const sayImageCache = new Map();

module.exports = {
    data: new SlashCommandBuilder()
        .setName('say')
        .setDescription('ارسال پیام متنی دلخواه (همراه با عکس اختیاری)')
        .addAttachmentOption(option =>
            option.setName('image').setDescription('عکسی که می‌خوای همراه پیام باشه').setRequired(false)
        ),

    async execute(interaction) {
        // چک کردن دسترسی
        if (!(await hasModAccess(interaction))) {
            return interaction.reply({ content: '❌ شما دسترسی استفاده از این دستور را ندارید.', ephemeral: true });
        }

        // ذخیره عکس در کش
        const image = interaction.options.getAttachment('image');
        if (image) sayImageCache.set(interaction.user.id, image.url);

        // ساخت مودال برای دریافت متن طولانی
        const modal = new ModalBuilder()
            .setCustomId('say_modal')
            .setTitle('ارسال پیام جدید');

        const textInput = new TextInputBuilder()
            .setCustomId('say_text')
            .setLabel('متن پیام شما:')
            .setStyle(TextInputStyle.Paragraph) // استایل پاراگراف برای متن‌های طولانی
            .setRequired(true);

        const actionRow = new ActionRowBuilder().addComponents(textInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    }
};