const { Schema, model } = require('mongoose');

module.exports = model('Giveaway', new Schema({
    messageId: String,
    channelId: String,
    guildId: String,
    hostId: String,
    prize: String,
    winnersCount: Number,
    endAt: Number,
    ended: { type: Boolean, default: false },
    reqInvites: { type: Number, default: 0 },
    participants: { type: [String], default: [] },
    createdAt: { type: Number, default: () => Date.now() }
}));