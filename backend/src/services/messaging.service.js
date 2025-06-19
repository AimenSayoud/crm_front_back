const { Conversation, Message, MessageAttachment, MessageReadReceipt, MessageReaction, EmailTemplate, User } = require('../models/sql');
const { createResponse, createError } = require('../utils/response');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

class MessagingService {
    // Conversation CRUD
    async createConversation(db, request, createdBy) {
        // Validate participants
        const participantIds = [...new Set([...(request.participant_ids || []), createdBy])];
        const participants = await User.find({ _id: { $in: participantIds } });
        if (participants.length !== participantIds.length) {
            throw new Error('One or more participants not found');
        }
        // Create conversation
        const conversation = await Conversation.create({
            title: request.title,
            type: request.type || 'direct',
            created_by: createdBy,
            is_archived: false,
            is_pinned: false,
            is_private: true,
            allow_file_sharing: true,
            description: request.description || '',
            tags: request.tags || [],
            total_messages: 0,
            last_message_at: null,
            last_activity_at: new Date(),
            participants: participantIds
        });
        // Optionally send initial message
        if (request.initial_message) {
            await this.sendMessage(db, conversation._id, createdBy, {
                content: request.initial_message
            });
        }
        return conversation;
    }

    async getConversationsWithSearch(db, filters) {
        // Only return conversations for the participant
        const query = { participants: filters.participant_id };
        if (filters.type) query.type = filters.type;
        if (filters.is_archived !== undefined) query.is_archived = filters.is_archived;
        if (filters.query) query.title = { $regex: filters.query, $options: 'i' };
        // Sorting
        let sort = { last_activity_at: -1 };
        if (filters.sort_by === 'title') sort = { title: filters.sort_order === 'asc' ? 1 : -1 };
        if (filters.sort_by === 'created_at') sort = { created_at: filters.sort_order === 'asc' ? 1 : -1 };
        if (filters.sort_by === 'last_message_at') sort = { last_message_at: filters.sort_order === 'asc' ? 1 : -1 };
        // Pagination
        const page = filters.page || 1;
        const pageSize = filters.page_size || 20;
        const skip = (page - 1) * pageSize;
        const conversations = await Conversation.find(query).sort(sort).skip(skip).limit(pageSize);
        const total = await Conversation.countDocuments(query);
        return { conversations, total };
    }

    async getMessagesWithSearch(db, filters) {
        const query = {};
        if (filters.conversation_id) query.conversation_id = filters.conversation_id;
        if (filters.sender_id) query.sender_id = filters.sender_id;
        if (filters.message_type) query.message_type = filters.message_type;
        if (filters.query) query.content = { $regex: filters.query, $options: 'i' };
        if (filters.date_from || filters.date_to) {
            query.created_at = {};
            if (filters.date_from) query.created_at.$gte = new Date(filters.date_from);
            if (filters.date_to) query.created_at.$lte = new Date(filters.date_to);
        }
        // Sorting
        let sort = { created_at: -1 };
        if (filters.sort_by === 'sent_at') sort = { sent_at: filters.sort_order === 'asc' ? 1 : -1 };
        // Pagination
        const page = filters.page || 1;
        const pageSize = filters.page_size || 50;
        const skip = (page - 1) * pageSize;
        const messages = await Message.find(query).sort(sort).skip(skip).limit(pageSize);
        const total = await Message.countDocuments(query);
        return { messages, total };
    }

    async sendMessage(db, conversationId, senderId, messageData) {
        // Validate conversation and sender
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) throw new Error('Conversation not found');
        if (!conversation.participants.includes(senderId)) throw new Error('User is not a participant');
        // Create message
        const message = await Message.create({
            conversation_id: conversationId,
            sender_id: senderId,
            content: messageData.content,
            message_type: messageData.message_type || 'text',
            status: 'sent',
            parent_message_id: messageData.parent_message_id,
            reply_to_id: messageData.reply_to_id,
            mentions: messageData.mentions || [],
            reactions: [],
            is_edited: false,
            is_deleted: false,
            is_pinned: false,
            is_system_message: false,
            sent_at: new Date(),
            delivered_at: null,
            read_at: null,
            file_url: messageData.file_url,
            file_name: messageData.file_name,
            file_size: messageData.file_size,
            file_type: messageData.file_type,
            thumbnail_url: messageData.thumbnail_url,
            template_id: messageData.template_id,
            template_variables: messageData.template_variables
        });
        // Optionally handle attachments
        if (messageData.attachments && Array.isArray(messageData.attachments)) {
            for (const att of messageData.attachments) {
                await MessageAttachment.create({
                    message_id: message._id,
                    file_name: att.file_name,
                    file_url: att.file_url,
                    file_size: att.file_size,
                    file_type: att.file_type,
                    mime_type: att.mime_type,
                    description: att.description,
                    is_inline: att.is_inline,
                    thumbnail_url: att.thumbnail_url,
                    is_public: att.is_public,
                    download_count: 0
                });
            }
        }
        // Update conversation stats
        conversation.total_messages += 1;
        conversation.last_message_at = new Date();
        conversation.last_activity_at = new Date();
        await conversation.save();
        return message;
    }

    async markMessageAsRead(db, messageId, readerId) {
        // Mark a single message as read
        const receipt = await MessageReadReceipt.findOneAndUpdate(
            { message_id: messageId, user_id: readerId },
            { read_at: new Date() },
            { upsert: true, new: true }
        );
        return receipt;
    }

    async addReaction(db, messageId, userId, emoji) {
        // Add a reaction to a message
        const reaction = await MessageReaction.findOneAndUpdate(
            { message_id: messageId, user_id: userId },
            { emoji },
            { upsert: true, new: true }
        );
        return reaction;
    }

    async getUnreadCount(db, userId) {
        // Get unread message counts for user
        // For each conversation, count messages not read by user
        const conversations = await Conversation.find({ participants: userId });
        let totalUnread = 0;
        const unreadByConversation = {};
        for (const conv of conversations) {
            const unread = await Message.countDocuments({
                conversation_id: conv._id,
                sender_id: { $ne: userId },
                _id: { $nin: await MessageReadReceipt.find({ user_id: userId, message_id: { $exists: true } }).distinct('message_id') }
            });
            if (unread > 0) {
                unreadByConversation[conv._id] = unread;
                totalUnread += unread;
            }
        }
        return { total: totalUnread, by_conversation: unreadByConversation };
    }

    async createEmailTemplate(db, templateData, createdBy) {
        // Check for duplicate name
        const existing = await EmailTemplate.findOne({ name: templateData.name });
        if (existing) throw new Error('Template with this name already exists');
        // Create template
        const template = await EmailTemplate.create({ ...templateData, created_by: createdBy });
        return template;
    }

    async renderEmailTemplate(db, templateId, context) {
        const template = await EmailTemplate.findById(templateId);
        if (!template) throw new Error('Template not found');
        // Render subject and body
        const render = (str, ctx) => str.replace(/\{\{(\w+)\}\}/g, (_, v) => ctx[v] || `{{${v}}}`);
        return {
            subject: render(template.subject, context),
            body: render(template.body, context),
            template_used: templateId
        };
    }

    async getConversationSummary(db, userId, days = 7) {
        // Get conversation activity summary for user
        const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
        const conversations = await Conversation.find({ participants: userId });
        let totalConversations = conversations.length;
        let activeConversations = 0;
        let messagesSent = 0;
        let messagesReceived = 0;
        let mostActiveConversation = null;
        let recentConversations = [];
        let conversationActivity = {};
        for (const conv of conversations) {
            const messages = await Message.find({ conversation_id: conv._id, created_at: { $gte: since } });
            if (messages.length) {
                activeConversations += 1;
                conversationActivity[conv._id] = messages.length;
                for (const msg of messages) {
                    if (msg.sender_id.toString() === userId.toString()) messagesSent += 1;
                    else messagesReceived += 1;
                }
                recentConversations.push({
                    id: conv._id,
                    title: conv.title,
                    last_message: messages[messages.length - 1].created_at,
                    message_count: messages.length,
                    // unread: ...
                });
            }
        }
        recentConversations.sort((a, b) => b.last_message - a.last_message);
        recentConversations = recentConversations.slice(0, 10);
        if (Object.keys(conversationActivity).length) {
            const mostActiveId = Object.entries(conversationActivity).sort((a, b) => b[1] - a[1])[0][0];
            const mostActive = conversations.find(c => c._id.toString() === mostActiveId);
            mostActiveConversation = {
                id: mostActive._id,
                title: mostActive.title,
                message_count: conversationActivity[mostActiveId]
            };
        }
        return {
            total_conversations: totalConversations,
            active_conversations: activeConversations,
            messages_sent: messagesSent,
            messages_received: messagesReceived,
            most_active_conversation: mostActiveConversation,
            recent_conversations: recentConversations
        };
    }

    async searchMessages(db, userId, query, conversationId, limit = 50) {
        // Get user's conversations
        const conversations = await Conversation.find({ participants: userId });
        let conversationIds = conversations.map(c => c._id);
        if (conversationId) {
            if (!conversationIds.includes(conversationId)) return [];
            conversationIds = [conversationId];
        }
        const messages = await Message.find({
            conversation_id: { $in: conversationIds },
            content: { $regex: query, $options: 'i' }
        }).sort({ created_at: -1 }).limit(limit);
        return messages;
    }

    // ... More methods as needed (update, delete, archive, analytics, etc.)
}

module.exports = new MessagingService();
