const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const hasModAccess = require('../utils/checkAccess');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('👢 اخراج (کیک) کردن یک کاربر از سرور')
        .addUserOption(opt => opt.setName('user').setDescription('کاربری که می‌خواهید اخراج کنید').setRequired(true))
        .addStringOption(opt => opt.setName('reason').setDescription('دلیل اخراج').setRequired(false)),

    async execute(interaction) {
        if (!(await hasModAccess(interaction))) {
            return interaction.reply({ content: '❌ شما دسترسی استفاده از این دستور را ندارید.', ephemeral: true });
        }

        const targetUser = interaction.options.getUser('user');
        const targetMember = interaction.guild.members.cache.get(targetUser.id);
        const reason = interaction.options.getString('reason') || 'دلیلی ذکر نشده';

        // کاربر حتماً باید تو سرور حضور داشته باشه تا بشه کیکش کرد
        if (!targetMember) {
            return interaction.reply({ content: '❌ این کاربر در سرور حضور ندارد.', ephemeral: true });
        }

        if (!targetMember.kickable) {
            return interaction.reply({ content: '❌ من پرمیشن کافی برای اخراج کردن این کاربر را ندارم (رول او از من بالاتر است).', ephemeral: true });
        }

        try {
            await targetMember.kick(reason);

            const embed = new EmbedBuilder()
                .setColor('#2c3040')
                .setTitle('👢 کاربر اخراج شد')
                .setDescription(`**کاربر:** ${targetUser} (${targetUser.tag})\n**دلیل:** ${reason}\n**توسط ادمین:** ${interaction.user}`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Error in kick command:', error);
            await interaction.reply({ content: '❌ خطایی در انجام این عملیات رخ داد.', ephemeral: true });
        }
    }
};