const messagingService = require('../services/messaging.service');
const { createResponse, createError } = require('../utils/response');
const logger = require('../utils/logger');

class MessagingController {
    async createConversation(req, res) {
        try {
            const request = req.body;
            const createdBy = req.user && req.user.id;
            const conversation = await messagingService.createConversation(req.db, request, createdBy);
            res.status(201).json(createResponse('Conversation created', conversation));
        } catch (err) {
            logger.error('Error creating conversation:', err);
            res.status(400).json(createError('Error creating conversation', err.message));
        }
    }

    async getConversationsWithSearch(req, res) {
        try {
            const filters = req.query;
            filters.participant_id = req.user && req.user.id;
            const result = await messagingService.getConversationsWithSearch(req.db, filters);
            res.json(createResponse('Conversations retrieved', result));
        } catch (err) {
            logger.error('Error getting conversations:', err);
            res.status(400).json(createError('Error getting conversations', err.message));
        }
    }

    async getMessagesWithSearch(req, res) {
        try {
            const filters = req.query;
            const result = await messagingService.getMessagesWithSearch(req.db, filters);
            res.json(createResponse('Messages retrieved', result));
        } catch (err) {
            logger.error('Error getting messages:', err);
            res.status(400).json(createError('Error getting messages', err.message));
        }
    }

    async sendMessage(req, res) {
        try {
            const { conversation_id, ...messageData } = req.body;
            const senderId = req.user && req.user.id;
            const message = await messagingService.sendMessage(req.db, conversation_id, senderId, messageData);
            res.status(201).json(createResponse('Message sent', message));
        } catch (err) {
            logger.error('Error sending message:', err);
            res.status(400).json(createError('Error sending message', err.message));
        }
    }

    async markMessageAsRead(req, res) {
        try {
            const { message_id } = req.body;
            const readerId = req.user && req.user.id;
            const receipt = await messagingService.markMessageAsRead(req.db, message_id, readerId);
            res.json(createResponse('Message marked as read', receipt));
        } catch (err) {
            logger.error('Error marking message as read:', err);
            res.status(400).json(createError('Error marking message as read', err.message));
        }
    }

    async addReaction(req, res) {
        try {
            const { message_id, emoji } = req.body;
            const userId = req.user && req.user.id;
            const reaction = await messagingService.addReaction(req.db, message_id, userId, emoji);
            res.json(createResponse('Reaction added', reaction));
        } catch (err) {
            logger.error('Error adding reaction:', err);
            res.status(400).json(createError('Error adding reaction', err.message));
        }
    }

    async getUnreadCount(req, res) {
        try {
            const userId = req.user && req.user.id;
            const result = await messagingService.getUnreadCount(req.db, userId);
            res.json(createResponse('Unread count retrieved', result));
        } catch (err) {
            logger.error('Error getting unread count:', err);
            res.status(400).json(createError('Error getting unread count', err.message));
        }
    }

    async createEmailTemplate(req, res) {
        try {
            const templateData = req.body;
            const createdBy = req.user && req.user.id;
            const template = await messagingService.createEmailTemplate(req.db, templateData, createdBy);
            res.status(201).json(createResponse('Email template created', template));
        } catch (err) {
            logger.error('Error creating email template:', err);
            res.status(400).json(createError('Error creating email template', err.message));
        }
    }

    async renderEmailTemplate(req, res) {
        try {
            const { template_id, context } = req.body;
            const rendered = await messagingService.renderEmailTemplate(req.db, template_id, context);
            res.json(createResponse('Email template rendered', rendered));
        } catch (err) {
            logger.error('Error rendering email template:', err);
            res.status(400).json(createError('Error rendering email template', err.message));
        }
    }

    async getConversationSummary(req, res) {
        try {
            const userId = req.user && req.user.id;
            const days = parseInt(req.query.days) || 7;
            const summary = await messagingService.getConversationSummary(req.db, userId, days);
            res.json(createResponse('Conversation summary', summary));
        } catch (err) {
            logger.error('Error getting conversation summary:', err);
            res.status(400).json(createError('Error getting conversation summary', err.message));
        }
    }

    async searchMessages(req, res) {
        try {
            const userId = req.user && req.user.id;
            const { query, conversation_id, limit } = req.query;
            const messages = await messagingService.searchMessages(req.db, userId, query, conversation_id, parseInt(limit) || 50);
            res.json(createResponse('Messages found', messages));
        } catch (err) {
            logger.error('Error searching messages:', err);
            res.status(400).json(createError('Error searching messages', err.message));
        }
    }
}

module.exports = new MessagingController();
