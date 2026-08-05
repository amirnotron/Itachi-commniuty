const { Schema, model } = require('mongoose');

const securityConfigSchema = new Schema({
    guildId: { type: String, required: true, unique: true },
    antiLink: {
        enabled: { type: Boolean, default: true },
        allowedInviteChannels: { type: [String], default: [] },
        allowedWebChannels: { type: [String], default: [] },
        whitelistedRoles: { type: [String], default: [] },
        whitelistedUsers: { type: [String], default: [] }
    },
    antiSpam: {
        enabled: { type: Boolean, default: true },
        maxMessages: { type: Number, default: 5 },
        timeWindowMs: { type: Number, default: 5000 },
        timeoutMs: { type: Number, default: 600000 }
    }
});

module.exports = model('SecurityConfig', securityConfigSchema);