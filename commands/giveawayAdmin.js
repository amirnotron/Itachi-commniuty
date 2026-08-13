const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const GiveawayConfig = require('../models/GiveawayConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway-admin')
        .setDescription('⚙️ تنظیم رول‌های مجاز برای برگزاری گیووی')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addRoleOption(option => 
            option.setName('role')
                .setDescription('نقشی که می‌خواهید اجازه مدیریت گیووی داشته باشد')
                .setRequired(true)),

    async execute(interaction) {
        const role = interaction.options.getRole('role');
        let config = await GiveawayConfig.findOne({ guildId: interaction.guild.id });
        
        if (!config) config = await GiveawayConfig.create({ guildId: interaction.guild.id });

        if (config.managerRoles.includes(role.id)) {
            config.managerRoles = config.managerRoles.filter(r => r !== role.id);
            await config.save();
            return interaction.reply({ content: `✅ دسترسی نقش ${role} برای مدیریت گیووی **حذف** شد.`, ephemeral: true });
        } else {
            config.managerRoles.push(role.id);
            await config.save();
            return interaction.reply({ content: `✅ دسترسی نقش ${role} برای مدیریت گیووی **اضافه** شد.`, ephemeral: true });
        }
    }
};