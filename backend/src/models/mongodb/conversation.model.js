const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joined_at: {
      type: Date,
      default: Date.now
    },
    last_read_at: {
      type: Date
    }
  }],
  conversation_type: {
    type: String,
    enum: ['direct', 'group', 'support'],
    default: 'direct'
  },
  title: {
    type: String
  },
  last_message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  last_message_at: {
    type: Date
  },
  is_active: {
    type: Boolean,
    default: true
  },
  message_count: {
    type: Number,
    default: 0
  },
  metadata: {
    job_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job'
    },
    application_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Application'
    }
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
conversationSchema.index({ 'participants.user_id': 1 });
conversationSchema.index({ last_message_at: -1 });
conversationSchema.index({ conversation_type: 1 });
conversationSchema.index({ is_active: 1 });

const Conversation = mongoose.models.Conversation || mongoose.model('Conversation', conversationSchema);

module.exports = Conversation;
