const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const ModConfig = require('../models/ModConfig');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('modadmin')
        .setDescription('تنظیم دسترسی کامندهای مدیریتی')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator) // قفل کردن کامند فقط برای ادمین‌ها
        .addSubcommand(sub => sub.setName('adduser').setDescription('اضافه کردن کاربر').addUserOption(opt => opt.setName('target').setRequired(true)))
        .addSubcommand(sub => sub.setName('addrole').setDescription('اضافه کردن رول').addRoleOption(opt => opt.setName('target').setRequired(true))),

    async execute(interaction) {
        const subCommand = interaction.options.getSubcommand();
        let config = await ModConfig.findOne({ guildId: interaction.guild.id });
        if (!config) config = await ModConfig.create({ guildId: interaction.guild.id });

        if (subCommand === 'adduser') {
            const user = interaction.options.getUser('target');
            if (!config.allowedUsers.includes(user.id)) config.allowedUsers.push(user.id);
            await config.save();
            await interaction.reply({ content: `✅ دسترسی به کاربر ${user} داده شد.`, ephemeral: true });
        }
        else if (subCommand === 'addrole') {
            const role = interaction.options.getRole('target');
            if (!config.allowedRoles.includes(role.id)) config.allowedRoles.push(role.id);
            await config.save();
            await interaction.reply({ content: `✅ دسترسی به رول ${role} داده شد.`, ephemeral: true });
        }
    }
};