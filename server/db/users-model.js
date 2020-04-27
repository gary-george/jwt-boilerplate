const mongoose = require('mongoose');
require('mongoose-type-email');

mongoose.Promise = Promise;

const usersSchema = new mongoose.Schema(
  {
    email: { type: mongoose.SchemaTypes.Email, required: true, index: true },
    username: { type: String, required: true, index: true },
    password: { type: String, required: true },
    created_at: { type: Date },
    updated_at: { type: Date },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
  }
);

usersSchema.index({ email: 1, username: 1 }, { unique: true });

module.exports = {
  usersModel: mongoose.model('GWDUsers', usersSchema),
};
