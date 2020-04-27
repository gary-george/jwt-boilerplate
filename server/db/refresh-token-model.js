const mongoose = require('mongoose');

mongoose.Promise = Promise;

const refreshSchema = new mongoose.Schema(
  {
    userIdentifier: { type: String, required: true, index: true },
    refreshToken: { type: String, required: true, index: true },
    created_at: { type: Date },
    updated_at: { type: Date },
    expire_at: {
      type: Date,
      default: Date.now,
      index: { expires: '60m' },
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

refreshSchema.index({ refreshToken: 1, userIdentifier: 1 }, { unique: true });

module.exports = {
  refreshModel: mongoose.model('GWDRefreshTokens', refreshSchema),
};
