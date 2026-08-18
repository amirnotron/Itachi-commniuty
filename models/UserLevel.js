const { Schema, model } = require('mongoose');

module.exports = model('UserLevel', new Schema({
    guildId: String,
    userId: String,
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    lastMessageAt: { type: Number, default: 0 }
}));