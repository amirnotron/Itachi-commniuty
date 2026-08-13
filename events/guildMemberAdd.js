const { Events } = require('discord.js');
const ServerMember = require('../models/ServerMember');

module.exports = {
    name: Events.GuildMemberAdd,
    async execute(member) {
        try {
            const newInvites = await member.guild.invites.fetch();

            const oldInvites = member.client.invitesCache.get(member.guild.id) || new Map();

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
            member.client.invitesCache.set(member.guild.id, inviteMap);

            if (usedInvite && usedInvite.inviter) {
                let inviterData = await ServerMember.findOne({ guildId: member.guild.id, userId: usedInvite.inviter.id });

                if (!inviterData) {
                    inviterData = new ServerMember({ guildId: member.guild.id, userId: usedInvite.inviter.id });
                }

                inviterData.inviteTimestamps.push(Date.now());
                await inviterData.save();

                console.log(`✅ اینوایت ثبت شد: ${member.user.tag} توسط ${usedInvite.inviter.tag} دعوت شد.`);
            }
        } catch (error) {
            console.error('❌ خطایی در سیستم ترکینگ اینوایت (guildMemberAdd) رخ داد:', error);
        }
    }
};