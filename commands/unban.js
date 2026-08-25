const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const hasModAccess = require('../utils/checkAccess');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('آن‌بن کردن یک کاربر')
        .addStringOption(opt => 
            opt.setName('user')
               .setDescription('نام کاربری فرد مورد نظر را تایپ و انتخاب کنید')
               .setRequired(true)
               .setAutocomplete(true) // فعال کردن حالت جستجوی زنده
        ),
        
    async execute(interaction) {
        if (!(await hasModAccess(interaction))) return interaction.reply({ content: '❌ دسترسی ندارید.', ephemeral: true });

        const targetId = interaction.options.getString('user');
        
        try {
            await interaction.guild.members.unban(targetId);
            const embed = new EmbedBuilder()
                .setColor('#2c3040')
                .setTitle('✅ کاربر آن‌بن شد')
                .setDescription(`کاربر با آیدی \`${targetId}\` با موفقیت از سرور آن‌بن شد.`)
                .setTimestamp();
            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            await interaction.reply({ content: 'این کاربر پیدا نشد یا قبلاً آن‌بن شده.', ephemeral: true });
        }
    }
};