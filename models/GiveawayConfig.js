const { Schema, model } = require('mongoose');

module.exports = model('GiveawayConfig', new Schema({
    guildId: { type: String, required: true },
    managerRoles: { type: [String], default: [] }
}));