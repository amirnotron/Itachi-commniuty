const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const hasModAccess = require('../utils/checkAccess');
const ms = require('ms'); // پکیج ms رو باید نصب کنی: npm i ms

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('تایم‌اوت کردن یک کاربر')
        .addUserOption(opt => opt.setName('user').setDescription('کاربر').setRequired(true))
        .addIntegerOption(opt => opt.setName('time').setDescription('مقدار زمان').setRequired(true))
        .addStringOption(opt => opt.setName('unit').setDescription('واحد زمان').setRequired(true)
            .addChoices(
                { name: 'دقیقه', value: 'm' },
                { name: 'ساعت', value: 'h' },
                { name: 'روز', value: 'd' }
            ))
        .addStringOption(opt => opt.setName('reason').setDescription('دلیل تایم‌اوت').setRequired(false)),

    async execute(interaction) {
        if (!(await hasModAccess(interaction))) return interaction.reply({ content: '❌ دسترسی ندارید.', ephemeral: true });

        const target = interaction.options.getMember('user');
        const time = interaction.options.getInteger('time');
        const unit = interaction.options.getString('unit');
        const reason = interaction.options.getString('reason') || 'دلیلی ذکر نشده';

        const duration = ms(`${time}${unit}`); // تبدیل به میلی‌ثانیه

        await target.timeout(duration, reason);

        const embed = new EmbedBuilder()
            .setColor('#2c3040')
            .setTitle('⏳ کاربر تایم‌اوت شد')
            .setDescription(`**کاربر:** ${target}\n**زمان:** ${time} ${unit === 'm' ? 'دقیقه' : unit === 'h' ? 'ساعت' : 'روز'}\n**دلیل:** ${reason}`)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
};