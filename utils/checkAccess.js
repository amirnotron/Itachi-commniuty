// utils/checkAccess.js
const ModConfig = require('../models/ModConfig');

async function hasModAccess(interaction) {
    
    if (interaction.member.permissions.has('Administrator')) return true;

    const config = await ModConfig.findOne({ guildId: interaction.guild.id });
    if (!config) return false;

    if (config.allowedUsers.includes(interaction.user.id)) return true;

    const hasRole = interaction.member.roles.cache.some(role => config.allowedRoles.includes(role.id));
    if (hasRole) return true;

    return false;
}

module.exports = hasModAccess;