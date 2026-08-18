const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const LevelConfig = require('../models/LevelConfig');
const UserLevel = require('../models/UserLevel');
const { calculateNeededXP, handleLevelUp } = require('../utils/levelManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level-admin')
        .setDescription('⚙️ مدیریت کامل سیستم لولینگ')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(sub => sub
            .setName('set-channel')
            .setDescription('تنظیم چنل اعلام ارتقای سطح')
            .addChannelOption(opt => opt.setName('channel').setDescription('چنل مورد نظر').setRequired(true)))
        .addSubcommand(sub => sub
            .setName('add-role')
            .setDescription('تنظیم رول پاداش برای یک لول خاص')
            .addIntegerOption(opt => opt.setName('level').setDescription('شماره سطح (مثلا 10)').setRequired(true))
            .addRoleOption(opt => opt.setName('role').setDescription('رول مورد نظر').setRequired(true)))
        .addSubcommand(sub => sub
            .setName('manage-user')
            .setDescription('مدیریت مستقیم لول و اکس‌پی یک کاربر')
            .addUserOption(opt => opt.setName('user').setDescription('کاربر').setRequired(true))
            .addStringOption(opt => opt.setName('action').setDescription('عملیات').setRequired(true).addChoices(
                { name: 'اضافه کردن لول', value: 'add_level' },
                { name: 'کم کردن لول', value: 'remove_level' },
                { name: 'تنظیم دقیق لول', value: 'set_level' }
            ))
            .addIntegerOption(opt => opt.setName('amount').setDescription('مقدار لول').setRequired(true))),

    async execute(interaction) {
        const sub = interaction.options.getSubcommand();
        let config = await LevelConfig.findOne({ guildId: interaction.guild.id });
        if (!config) config = await LevelConfig.create({ guildId: interaction.guild.id });

        if (sub === 'set-channel') {
            const channel = interaction.options.getChannel('channel');
            config.announcementChannelId = channel.id;
            await config.save();
            return interaction.reply({ content: `✅ چنل اعلام لول‌آپ روی ${channel} تنظیم شد.`, ephemeral: true });
        }

        if (sub === 'add-role') {
            const level = interaction.options.getInteger('level');
            const role = interaction.options.getRole('role');

            // اگر قبلا رولی برای این لول بود، جایگزین می‌کنه
            config.roleRewards = config.roleRewards.filter(r => r.level !== level);
            config.roleRewards.push({ level, roleId: role.id });
            await config.save();

            return interaction.reply({ content: `✅ رول ${role} برای **لول ${level}** ثبت شد.`, ephemeral: true });
        }

        if (sub === 'manage-user') {
            const targetUser = interaction.options.getUser('user');
            const action = interaction.options.getString('action');
            const amount = interaction.options.getInteger('amount');

            let userLevel = await UserLevel.findOne({ guildId: interaction.guild.id, userId: targetUser.id });
            if (!userLevel) userLevel = new UserLevel({ guildId: interaction.guild.id, userId: targetUser.id, level: 1, xp: 0 });

            const oldLevel = userLevel.level;

            if (action === 'add_level') userLevel.level += amount;
            if (action === 'remove_level') userLevel.level = Math.max(1, userLevel.level - amount);
            if (action === 'set_level') userLevel.level = Math.max(1, amount);

            userLevel.xp = 0; // برای تمیز موندن، بعد از تغییر لول دستی، اکس‌پی صفر میشه
            await userLevel.save();

            const targetMember = interaction.guild.members.cache.get(targetUser.id);
            if (targetMember && userLevel.level > oldLevel) {
                await handleLevelUp(targetMember, userLevel.level, oldLevel);
            }

            return interaction.reply({ content: `✅ لول کاربر ${targetUser} به **${userLevel.level}** تغییر یافت.`, ephemeral: true });
        }
    }
};