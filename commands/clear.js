const { SlashCommandBuilder, EmbedBuilder, MessageFlags } = require('discord.js');
const hasModAccess = require('../utils/checkAccess');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('🧹 پاکسازی پیام‌های چنل (با سیستم فیلتر پیشرفته)')
        .addIntegerOption(opt =>
            opt.setName('amount')
                .setDescription('تعداد پیام‌ها (بین ۱ تا ۱۰۰)')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100)
        )
        .addUserOption(opt =>
            opt.setName('user')
                .setDescription('فیلتر: فقط پیام‌های این کاربر پاک شود (اختیاری)')
                .setRequired(false)
        ),

    async execute(interaction) {
        if (!(await hasModAccess(interaction))) {
            return interaction.reply({ content: '❌ شما دسترسی استفاده از این دستور را ندارید.', flags: MessageFlags.Ephemeral });
        }

        // استفاده از حالت مخفی برای جلوگیری از پاک شدن پیام لودینگ توسط خود ربات
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const amount = interaction.options.getInteger('amount');
        const targetUser = interaction.options.getUser('user');

        try {
            const messages = await interaction.channel.messages.fetch({ limit: amount });
            let messagesToDelete = messages;

            if (targetUser) {
                messagesToDelete = messages.filter(msg => msg.author.id === targetUser.id);
            }

            if (messagesToDelete.size === 0) {
                return interaction.editReply({ content: `هیچ پیامی از ${targetUser} در ${amount} پیام اخیر یافت نشد.` });
            }

            const deletedMessages = await interaction.channel.bulkDelete(messagesToDelete, true);

            const embed = new EmbedBuilder()
                .setColor('#2c3040')
                .setTitle('🧹 پاکسازی با موفقیت انجام شد')
                .setDescription(`تعداد **${deletedMessages.size}** پیام از این چنل پاک شد.`)
                .setTimestamp();

            if (targetUser) {
                embed.addFields({ name: '🎯 فیلتر اعمال شده:', value: `فقط پیام‌های کاربر ${targetUser}` });
            }

            // پایان دادن به لودینگ ادمین (مخفی)
            await interaction.editReply({ content: '✅ عملیات پاکسازی تکمیل شد.' });

            // ارسال پیام عمومی در چنل برای بقیه کاربران
            const successMsg = await interaction.channel.send({ embeds: [embed] });

            // پاک کردن پیام عمومی بعد از ۵ ثانیه
            setTimeout(() => {
                successMsg.delete().catch(() => { });
            }, 5000);

        } catch (error) {
            console.error('Error in clear command:', error);
            await interaction.editReply({ content: '❌ خطایی رخ داد. لطفاً مطمئن شوید ربات دسترسی `Manage Messages` را در این چنل دارد.' });
        }
    }
};