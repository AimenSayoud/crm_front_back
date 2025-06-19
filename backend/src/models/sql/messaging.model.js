const mongoose = require('mongoose');
const { Schema } = mongoose;

// Message Attachment Schema
const MessageAttachmentSchema = new Schema(
  {
    message_id: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      required: true
    },
    file_name: {
      type: String,
      required: true
    },
    file_url: {
      type: String,
      required: true
    },
    file_size: {
      type: Number
    },
    file_type: {
      type: String
    },
    mime_type: {
      type: String
    },
    description: {
      type: String
    },
    is_inline: {
      type: Boolean,
      default: false
    },
    thumbnail_url: {
      type: String
    },
    is_public: {
      type: Boolean,
      default: false
    },
    download_count: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

// Message Read Receipt Schema
const MessageReadReceiptSchema = new Schema(
  {
    message_id: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      required: true
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    read_at: {
      type: Date,
      required: true,
      default: Date.now
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

// Message Reaction Schema
const MessageReactionSchema = new Schema(
  {
    message_id: {
      type: Schema.Types.ObjectId,
      ref: 'Message',
      required: true
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    emoji: {
      type: String,
      required: true,
      maxlength: 10
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

// Email Template Schema
const EmailTemplateSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      maxlength: 100
    },
    subject: {
      type: String,
      required: true,
      maxlength: 200
    },
    body: {
      type: String,
      required: true
    },
    template_type: {
      type: String,
      required: true
    },
    category: {
      type: String
    },
    language: {
      type: String,
      default: 'en',
      maxlength: 10
    },
    variables: {
      type: Map,
      of: String
    },
    required_variables: {
      type: [String]
    },
    default_values: {
      type: Map,
      of: String
    },
    is_active: {
      type: Boolean,
      default: true
    },
    is_default: {
      type: Boolean,
      default: false
    },
    version: {
      type: String
    },
    usage_count: {
      type: Number,
      default: 0
    },
    last_used_at: {
      type: Date
    },
    created_by_id: {
      type: Schema.Types.ObjectId,
      ref: 'User'
    },
    description: {
      type: String
    },
    tags: {
      type: [String]
    },
    conversation_metadata: {
      type: Map,
      of: Schema.Types.Mixed
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Conversation Participant Schema (for the many-to-many relationship)
const ConversationParticipantSchema = new Schema(
  {
    conversation_id: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true
    },
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    joined_at: {
      type: Date,
      required: true,
      default: Date.now
    },
    left_at: {
      type: Date
    },
    role: {
      type: String,
      enum: ['admin', 'member', 'observer']
    },
    is_muted: {
      type: Boolean,
      default: false
    },
    last_read_at: {
      type: Date
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    }
  }
);

// Conversation Schema
const ConversationSchema = new Schema(
  {
    title: {
      type: String,
      maxlength: 200
    },
    type: {
      type: String,
      enum: ['direct', 'group', 'broadcast', 'system'],
      default: 'direct',
      required: true
    },
    created_by_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    is_archived: {
      type: Boolean,
      default: false
    },
    is_pinned: {
      type: Boolean,
      default: false
    },
    is_private: {
      type: Boolean,
      default: true
    },
    allow_file_sharing: {
      type: Boolean,
      default: true
    },
    description: {
      type: String
    },
    tags: {
      type: [String]
    },
    total_messages: {
      type: Number,
      default: 0
    },
    last_message_at: {
      type: Date
    },
    last_activity_at: {
      type: Date
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Message Schema
const MessageSchema = new Schema(
  {
    conversation_id: {
      type: Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true
    },
    sender_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    content: {
      type: String
    },
    message_type: {
      type: String,
      enum: ['text', 'file', 'image', 'system', 'template'],
      default: 'text',
      required: true
    },
    status: {
      type: String,
      enum: ['sent', 'delivered', 'read', 'failed'],
      default: 'sent',
      required: true
    },
    parent_message_id: {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    },
    reply_to_id: {
      type: Schema.Types.ObjectId,
      ref: 'Message'
    },
    is_edited: {
      type: Boolean,
      default: false
    },
    is_deleted: {
      type: Boolean,
      default: false
    },
    is_pinned: {
      type: Boolean,
      default: false
    },
    is_system_message: {
      type: Boolean,
      default: false
    },
    sent_at: {
      type: Date
    },
    delivered_at: {
      type: Date
    },
    read_at: {
      type: Date
    },
    mentions: {
      type: [Schema.Types.ObjectId],
      ref: 'User'
    },
    reactions: {
      type: Map,
      of: Number
    },
    file_url: {
      type: String
    },
    file_name: {
      type: String
    },
    file_size: {
      type: Number
    },
    file_type: {
      type: String
    },
    thumbnail_url: {
      type: String
    },
    template_id: {
      type: Schema.Types.ObjectId,
      ref: 'EmailTemplate'
    },
    template_variables: {
      type: Map,
      of: Schema.Types.Mixed
    }
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at'
    },
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Virtual references
ConversationSchema.virtual('created_by', {
  ref: 'User',
  localField: 'created_by_id',
  foreignField: '_id',
  justOne: true
});

ConversationSchema.virtual('participants', {
  ref: 'ConversationParticipant',
  localField: '_id',
  foreignField: 'conversation_id'
});

ConversationSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'conversation_id'
});

MessageSchema.virtual('conversation', {
  ref: 'Conversation',
  localField: 'conversation_id',
  foreignField: '_id',
  justOne: true
});

MessageSchema.virtual('sender', {
  ref: 'User',
  localField: 'sender_id',
  foreignField: '_id',
  justOne: true
});

MessageSchema.virtual('parent_message', {
  ref: 'Message',
  localField: 'parent_message_id',
  foreignField: '_id',
  justOne: true
});

MessageSchema.virtual('child_messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'parent_message_id'
});

MessageSchema.virtual('reply_to', {
  ref: 'Message',
  localField: 'reply_to_id',
  foreignField: '_id',
  justOne: true
});

MessageSchema.virtual('replies', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'reply_to_id'
});

MessageSchema.virtual('template', {
  ref: 'EmailTemplate',
  localField: 'template_id',
  foreignField: '_id',
  justOne: true
});

MessageSchema.virtual('attachments', {
  ref: 'MessageAttachment',
  localField: '_id',
  foreignField: 'message_id'
});

MessageSchema.virtual('read_receipts', {
  ref: 'MessageReadReceipt',
  localField: '_id',
  foreignField: 'message_id'
});

MessageSchema.virtual('message_reactions', {
  ref: 'MessageReaction',
  localField: '_id',
  foreignField: 'message_id'
});

EmailTemplateSchema.virtual('created_by', {
  ref: 'User',
  localField: 'created_by_id',
  foreignField: '_id',
  justOne: true
});

EmailTemplateSchema.virtual('messages', {
  ref: 'Message',
  localField: '_id',
  foreignField: 'template_id'
});

// Indexes
ConversationSchema.index({ created_by_id: 1 });
ConversationSchema.index({ last_message_at: -1 });
ConversationSchema.index({ is_archived: 1 });
ConversationSchema.index({ is_pinned: 1 });
ConversationSchema.index({ tags: 1 });

MessageSchema.index({ conversation_id: 1 });
MessageSchema.index({ sender_id: 1 });
MessageSchema.index({ parent_message_id: 1 });
MessageSchema.index({ reply_to_id: 1 });
MessageSchema.index({ template_id: 1 });
MessageSchema.index({ sent_at: -1 });
MessageSchema.index({ is_deleted: 1 });
MessageSchema.index({ content: 'text' });

ConversationParticipantSchema.index({ conversation_id: 1, user_id: 1 }, { unique: true });
MessageAttachmentSchema.index({ message_id: 1 });
MessageReadReceiptSchema.index({ message_id: 1, user_id: 1 }, { unique: true });
MessageReactionSchema.index({ message_id: 1, user_id: 1, emoji: 1 }, { unique: true });

EmailTemplateSchema.index({ name: 1 });
EmailTemplateSchema.index({ template_type: 1 });
EmailTemplateSchema.index({ is_active: 1 });
EmailTemplateSchema.index({ is_default: 1 });
EmailTemplateSchema.index({ created_by_id: 1 });

// Create models
const Conversation = mongoose.model('Conversation', ConversationSchema);
const ConversationParticipant = mongoose.model('ConversationParticipant', ConversationParticipantSchema);
const Message = mongoose.model('Message', MessageSchema);
const MessageAttachment = mongoose.model('MessageAttachment', MessageAttachmentSchema);
const MessageReadReceipt = mongoose.model('MessageReadReceipt', MessageReadReceiptSchema);
const MessageReaction = mongoose.model('MessageReaction', MessageReactionSchema);
const EmailTemplate = mongoose.model('EmailTemplate', EmailTemplateSchema);

module.exports = {
  Conversation,
  ConversationParticipant,
  Message,
  MessageAttachment,
  MessageReadReceipt,
  MessageReaction,
  EmailTemplate
};