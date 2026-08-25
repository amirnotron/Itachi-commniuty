const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
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
        // ۱. چک کردن دسترسی 
        if (!(await hasModAccess(interaction))) {
            return interaction.reply({ content: '❌ شما دسترسی استفاده از این دستور را ندارید.', ephemeral: true });
        }

        // ۲. استفاده از deferReply چون پاک کردن پیام‌ها زمان‌بر است (جلوگیری از ارور Time Out)
        await interaction.deferReply();

        const amount = interaction.options.getInteger('amount');
        const targetUser = interaction.options.getUser('user');

        try {
            // ۳. دریافت پیام‌های اخیر چنل
            const messages = await interaction.channel.messages.fetch({ limit: amount });

            let messagesToDelete = messages;

            // ۴. اعمال فیلتر هوشمند (ویژگی متمایز این ربات)
            if (targetUser) {
                messagesToDelete = messages.filter(msg => msg.author.id === targetUser.id);
            }

            // اگر هیچ پیامی برای پاک کردن پیدا نشد (مثلاً یوزر فیلتر شده، پیامی تو اون بازه نداشته)
            if (messagesToDelete.size === 0) {
                const noMsgEmbed = new EmbedBuilder()
                    .setColor('#2c3040')
                    .setDescription(`هیچ پیامی از ${targetUser} در ${amount} پیام اخیر یافت نشد.`);

                await interaction.editReply({ embeds: [noMsgEmbed] });

                // پاک کردن همین پیام اخطار بعد از ۵ ثانیه
                setTimeout(() => {
                    interaction.deleteReply().catch(() => { }); // catch خالی برای جلوگیری از ارور در صورت پاک شدن دستی
                }, 5000);
                return;
            }

            // ۵. پاک کردن گروهی (آرگومان true جلوی کرش کردن ربات برای پیام‌های +14 روز رو می‌گیره)
            const deletedMessages = await interaction.channel.bulkDelete(messagesToDelete, true);

            // ۶. ساخت Embed دارک و شیک
            const embed = new EmbedBuilder()
                .setColor('#2c3040')
                .setTitle('🧹 پاکسازی با موفقیت انجام شد')
                .setDescription(`تعداد **${deletedMessages.size}** پیام از این چنل پاک شد.`)
                .setTimestamp();

            if (targetUser) {
                embed.addFields({ name: '🎯 فیلتر اعمال شده:', value: `فقط پیام‌های کاربر ${targetUser}` });
            }

            // ۷. نمایش نتیجه
            await interaction.editReply({ embeds: [embed] });

            // ۸. خودتخریبی پیام بعد از ۵ ثانیه
            setTimeout(() => {
                interaction.deleteReply().catch(err => {
                    // در صورتی که پیام قبلاً توسط کاربر دیگری پاک شده باشه، اروری در کنسول چاپ نمیشه
                });
            }, 5000);

        } catch (error) {
            console.error('Error in clear command:', error);
            // ارور هندلینگ تمیز در صورت نداشتن پرمیشن
            await interaction.editReply({ content: '❌ خطایی رخ داد. لطفاً مطمئن شوید ربات دسترسی `Manage Messages` را در این چنل دارد.' });

            setTimeout(() => {
                interaction.deleteReply().catch(() => { });
            }, 5000);
        }
    }
};