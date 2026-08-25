const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const hasModAccess = require('../utils/checkAccess');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('🔨 بن کردن یک کاربر از سرور')
        .addUserOption(opt => opt.setName('user').setDescription('کاربری که می‌خواهید بن کنید').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('دلیل بن').setRequired(false)),

    async execute(interaction) {
        // چک کردن دسترسی با سیستم ModAdmin
        if (!(await hasModAccess(interaction))) {
            return interaction.reply({ content: '❌ شما دسترسی استفاده از این دستور را ندارید.', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('user');
        const targetMember = interaction.guild.members.cache.get(targetUser.id);
        const reason = interaction.options.getString('reason') || 'دلیلی ذکر نشده';

        // چک کردن اینکه آیا بات پرمیشن بن کردن این شخص رو داره یا نه
        if (targetMember && !targetMember.bannable) {
            return interaction.reply({ content: '❌ من پرمیشن کافی برای بن کردن این کاربر را ندارم (رول او از من بالاتر است).', ephemeral: true });
        }

        try {
            // استفاده از آیدی برای بن کردن (حتی اگه طرف لفت داده باشه هم بن میشه)
            await interaction.guild.members.ban(targetUser.id, { reason });

            const embed = new EmbedBuilder()
                .setColor('#2c3040')
                .setTitle('🔨 کاربر بن شد')
                .setDescription(`**کاربر:** ${targetUser} (${targetUser.tag})\n**دلیل:** ${reason}\n**توسط ادمین:** ${interaction.user}`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in ban command:', error);
            await interaction.reply({ content: '❌ خطایی در انجام این عملیات رخ داد.', ephemeral: true });
        }
    }
};