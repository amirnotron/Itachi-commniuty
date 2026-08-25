const { Schema, model } = require('mongoose');

const modConfigSchema = new Schema({
    guildId: { type: String, required: true },
    allowedUsers: { type: Array, default: [] },
    allowedRoles: { type: Array, default: [] }
});

module.exports = model('ModConfig', modConfigSchema);