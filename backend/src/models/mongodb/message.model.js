const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  recipient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    required: true
  },
  message_type: {
    type: String,
    enum: ['text', 'attachment', 'system'],
    default: 'text'
  },
  is_read: {
    type: Boolean,
    default: false
  },
  read_at: {
    type: Date
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    mimetype: String
  }],
  is_deleted: {
    type: Boolean,
    default: false
  },
  deleted_at: {
    type: Date
  }
}, {
  timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' }
});

// Indexes
messageSchema.index({ conversation_id: 1, created_at: -1 });
messageSchema.index({ sender_id: 1 });
messageSchema.index({ recipient_id: 1 });
messageSchema.index({ is_read: 1 });

const Message = mongoose.models.Message || mongoose.model('Message', messageSchema);

module.exports = Message;
