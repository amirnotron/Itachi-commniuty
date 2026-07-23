const { Schema, model } = require('mongoose');

const guildConfigSchema = new Schema({
    guildId: {
        type: String,
        required: true,
        unique: true
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