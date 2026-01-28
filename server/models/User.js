const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  password: {
    type: String,
    required: false,
    select: false,
  },
  displayName: {
    type: String,
    required: true,
  },
  authMethod: {
    type: String,
    enum: ['password', 'otp', 'both'],
    default: 'password',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  lastLogin: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  loginAttempts: {
    type: Number,
    default: 0,
  },
  lockUntil: {
    type: Date,
  },
  securityAnswer: {
    type: String,
    select: false,
  },
});

// Extract display name from email
userSchema.statics.extractDisplayName = function(email) {
  return email.split('@')[0];
};

// Check if account is locked
userSchema.methods.isLocked = function() {
  return this.lockUntil && this.lockUntil > Date.now();
};

const User = mongoose.model('User', userSchema);

module.exports = User;
