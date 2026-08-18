const UserLevel = require('../models/UserLevel');
const LevelConfig = require('../models/LevelConfig');
const { EmbedBuilder } = require('discord.js');

const calculateNeededXP = (level) => Math.floor(100 * Math.pow(level, 1.5));

async function addXP(member, amount, isVoice = false) {
    if (!member || member.user.bot) return;

    let userLevel = await UserLevel.findOne({ guildId: member.guild.id, userId: member.id });
    if (!userLevel) userLevel = new UserLevel({ guildId: member.guild.id, userId: member.id, level: 1, xp: 0 });

    if (!isVoice) {
        const now = Date.now();
        if (now - userLevel.lastMessageAt < 60000) return;
        userLevel.lastMessageAt = now;
    }

    userLevel.xp += amount;
    let neededXP = calculateNeededXP(userLevel.level);
    let leveledUp = false;
    let oldLevel = userLevel.level;

    while (userLevel.xp >= neededXP) {
        userLevel.xp -= neededXP;
        userLevel.level += 1;
        neededXP = calculateNeededXP(userLevel.level);
        leveledUp = true;
    }

    await userLevel.save();

    if (leveledUp) {
        await handleLevelUp(member, userLevel.level, oldLevel);
    }
}

async function handleLevelUp(member, newLevel, oldLevel) {
    const config = await LevelConfig.findOne({ guildId: member.guild.id });
    if (!config) return;

    if (config.roleRewards && config.roleRewards.length > 0) {
        const rewards = config.roleRewards.sort((a, b) => b.level - a.level);
        const currentReward = rewards.find(r => newLevel >= r.level);

        if (currentReward) {
            const rewardRoleIds = rewards.map(r => r.roleId);
            const rolesToRemove = rewardRoleIds.filter(id => id !== currentReward.roleId);

            await member.roles.remove(rolesToRemove).catch(() => { });
            await member.roles.add(currentReward.roleId).catch(() => { });
        }
    }

    if (config.announcementChannelId) {
        const channel = member.guild.channels.cache.get(config.announcementChannelId);
        if (channel) {
            const embed = new EmbedBuilder()
                .setTitle('🚀 ارتقای سطح!')
                .setDescription(`تبریک ${member}! 🎉\nسطح شما از **${oldLevel}** به **${newLevel}** ارتقا یافت!`)
                .setColor('#2c3040')
                .setThumbnail(member.user.displayAvatarURL({ dynamic: true }));

            await channel.send({ content: `${member}`, embeds: [embed] }).catch(() => { });
        }
    }
}

module.exports = { addXP, calculateNeededXP, handleLevelUp };