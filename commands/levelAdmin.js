const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');
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
        // همون اول به دیسکورد میگیم که ربات در حال پردازشه تا ارور تایم‌اوت نده
        // استفاده از MessageFlags برای رفع اون هشدار زرد رنگ کنسول
        await interaction.deferReply({ flags: MessageFlags.Ephemeral });

        const sub = interaction.options.getSubcommand();
        let config = await LevelConfig.findOne({ guildId: interaction.guild.id });
        if (!config) config = await LevelConfig.create({ guildId: interaction.guild.id });

        if (sub === 'set-channel') {
            const channel = interaction.options.getChannel('channel');
            config.announcementChannelId = channel.id;
            await config.save();
            // چون defer کردیم، حالا باید از editReply استفاده کنیم
            return interaction.editReply({ content: `✅ چنل اعلام لول‌آپ روی ${channel} تنظیم شد.` });
        }

        if (sub === 'add-role') {
            const level = interaction.options.getInteger('level');
            const role = interaction.options.getRole('role');

            config.roleRewards = config.roleRewards.filter(r => r.level !== level);
            config.roleRewards.push({ level, roleId: role.id });
            await config.save();

            return interaction.editReply({ content: `✅ رول ${role} برای **لول ${level}** ثبت شد.` });
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

            userLevel.xp = 0;
            await userLevel.save();

            const targetMember = interaction.guild.members.cache.get(targetUser.id);
            if (targetMember && userLevel.level > oldLevel) {

                for (const reward of config.roleRewards) {
                    if (reward.level > oldLevel && reward.level <= userLevel.level) {
                        const role = interaction.guild.roles.cache.get(reward.roleId);
                        if (role) {
                            try {
                                await targetMember.roles.add(role);
                            } catch (error) {
                                console.error(`❌ خطا در دادن رول لول ${reward.level}:`, error);
                            }
                        }
                    }
                }

                await handleLevelUp(targetMember, userLevel.level, oldLevel);
            }

            return interaction.editReply({ content: `✅ لول کاربر ${targetUser} به **${userLevel.level}** تغییر یافت و رول‌های ارتقا اعمال شدند.` });
        }
    }
};