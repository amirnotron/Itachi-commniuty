const { Events } = require('discord.js');
const ServerMember = require('../models/ServerMember');

const invitesCache = new Map();

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        const newInvites = await member.guild.invites.fetch();
        const oldInvites = invitesCache.get(member.guild.id) || new Map();

        let usedInvite;
        for (const [code, invite] of newInvites) {
            const oldInvite = oldInvites.get(code);
            if (oldInvite && invite.uses > oldInvite.uses) {
                usedInvite = invite;
                break;
            }
        }

        const inviteMap = new Map();
        newInvites.forEach(inv => inviteMap.set(inv.code, inv));
        invitesCache.set(member.guild.id, inviteMap);

        if (usedInvite && usedInvite.inviter) {
            let inviterData = await ServerMember.findOne({ guildId: member.guild.id, userId: usedInvite.inviter.id });
            if (!inviterData) {
                inviterData = new ServerMember({ guildId: member.guild.id, userId: usedInvite.inviter.id });
            }

            inviterData.inviteTimestamps.push(Date.now());
            await inviterData.save();
        }
    }
};