const express = require('express');
const router = express.Router();
const messagingController = require('../../controllers/messaging.controller');
const authMiddleware = require('../../middleware/auth.middleware');

// All messaging endpoints require authentication
router.use(authMiddleware.authenticate);

// Conversation endpoints
router.post('/conversations', messagingController.createConversation);
router.get('/conversations', messagingController.getConversationsWithSearch);

// Message endpoints
router.get('/messages', messagingController.getMessagesWithSearch);
router.post('/messages', messagingController.sendMessage);

// Mark message as read
router.post('/messages/read', messagingController.markMessageAsRead);

// Add reaction
router.post('/messages/reaction', messagingController.addReaction);

// Unread count
router.get('/unread-count', messagingController.getUnreadCount);

// Email templates
router.post('/email-templates', messagingController.createEmailTemplate);
router.post('/email-templates/render', messagingController.renderEmailTemplate);

// Conversation summary
router.get('/conversations/summary', messagingController.getConversationSummary);

// Search messages
router.get('/messages/search', messagingController.searchMessages);

module.exports = router;
