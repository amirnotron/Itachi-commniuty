const { Schema, model } = require('mongoose');

const guildConfigSchema = new Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
    },
    totalMembersChannelId: {
        type: String,
        default: ""
    },
    botCountChannelId: {
        type: String,
        default: ""
    },
    onlineMembersChannelId: {
        type: String,
        default: ""
    },
    ticketCategoryId: {
        type: String,
        default: ""
    },
    transcriptChannelId: {
        type: String,
        default: ""
    },
    supportRoleIds: {
        type: [String],
        default: []
    },
    supportUserIds: {
        type: [String],
        default: []
    }
});

module.exports = model('GuildConfig', guildConfigSchema);