const { Schema, model } = require('mongoose');

module.exports = model('ServerMember', new Schema({
    guildId: String,
    userId: String,
    inviteTimestamps: { type: [Number], default: [] }
}));