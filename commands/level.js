const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const UserLevel = require('../models/UserLevel');
const { calculateNeededXP } = require('../utils/levelManager');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('📊 نمایش لول و وضعیت شما یا دیگران')
        .addUserOption(opt => opt.setName('user').setDescription('کاربری که می‌خواهید ببینید (اختیاری)')),

    async execute(interaction) {
        const target = interaction.options.getUser('user') || interaction.user;
        if (target.bot) return interaction.reply({ content: '❌ ربات‌ها لول ندارند!', ephemeral: true });

        const userLevel = await UserLevel.findOne({ guildId: interaction.guild.id, userId: target.id });
        const currentLvl = userLevel ? userLevel.level : 1;
        const currentXp = userLevel ? userLevel.xp : 0;
        const neededXp = calculateNeededXP(currentLvl);

        const progressPercentage = Math.floor((currentXp / neededXp) * 10);
        const filledBar = '█'.repeat(progressPercentage);
        const emptyBar = '░'.repeat(10 - progressPercentage);
        const progressBar = `${filledBar}${emptyBar}`;

        const embed = new EmbedBuilder()
            .setAuthor({ name: target.tag, iconURL: target.displayAvatarURL({ dynamic: true }) })
            .setTitle('آمار فعالیت')
            .addFields(
                { name: '💠 سطح (Level)', value: `**${currentLvl}**`, inline: true },
                { name: '✨ امتیاز (XP)', value: `**${currentXp}** / ${neededXp}`, inline: true },
                { name: 'میزان پیشرفت', value: `\`${progressBar}\` (${Math.floor((currentXp / neededXp) * 100)}%)`, inline: false }
            )
            .setColor('#2c3040')
            .setThumbnail(target.displayAvatarURL({ dynamic: true }))
            .setFooter({ text: 'Discord Leveling System' });

        await interaction.reply({ embeds: [embed] });
    }
};