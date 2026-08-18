const { Schema, model } = require('mongoose');

module.exports = model('LevelConfig', new Schema({
    guildId: { type: String, required: true },
    announcementChannelId: String,
    roleRewards: {
        type: [{ level: Number, roleId: String }],
        default: []
    }
}));