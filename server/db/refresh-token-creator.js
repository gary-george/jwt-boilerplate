const { refreshModel: RefreshTokens } = require('./refresh-token-model');

module.exports = (payload) => RefreshTokens.create(payload);
