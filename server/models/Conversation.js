const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  lastMessageAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Ensure exactly 2 participants
conversationSchema.pre('save', function(next) {
  if (this.participants.length !== 2) {
    return next(new Error('A conversation must have exactly 2 participants'));
  }
  next();
});

// Index for efficient lookup of user's conversations
conversationSchema.index({ participants: 1 });

// Static method to find or create conversation between two users
conversationSchema.statics.findOrCreateConversation = async function(userId1, userId2) {
  // Sort IDs to ensure consistent lookup regardless of order
  const sortedIds = [userId1, userId2].sort();

  let conversation = await this.findOne({
    participants: { $all: sortedIds, $size: 2 }
  }).populate('participants', 'displayName email');

  if (!conversation) {
    conversation = await this.create({
      participants: sortedIds
    });
    conversation = await conversation.populate('participants', 'displayName email');
  }

  return conversation;
};

const Conversation = mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
