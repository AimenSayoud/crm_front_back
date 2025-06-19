const express = require('express');
const router = express.Router();
const adminController = require('../../controllers/admin.controller');
const authMiddleware = require('../../middleware/auth.middleware');
const permissionsMiddleware = require('../../middleware/permissions.middleware');

// Apply authentication middleware to all admin routes
router.use(authMiddleware.authenticate);
router.use(permissionsMiddleware.requireAdmin);

// Admin management routes
router.get('/admins', adminController.listAdmins);
router.post('/admins', adminController.createAdmin);
router.get('/admins/:adminId', adminController.getAdminById);
router.put('/admins/:adminId', adminController.updateAdmin);
router.delete('/admins/:adminId', adminController.deleteAdmin);
router.put('/admins/:adminId/permissions', adminController.updatePermissions);

// System statistics and monitoring
router.get('/stats', adminController.getSystemStats);
router.get('/performance', adminController.getPerformanceMetrics);
router.get('/status', adminController.getSystemStatus);

// Audit logs
router.get('/audit-logs', adminController.getAuditLogs);
router.post('/audit-logs', adminController.createAuditLog);

// System settings
router.get('/settings', adminController.getSettings);
router.put('/settings/:config_key', adminController.updateSettings);
router.get('/settings/:configId', adminController.getSettingById);

// Notifications
router.get('/notifications', adminController.getNotifications);
router.post('/notifications', adminController.createNotification);
router.put('/notifications/:notificationId/read', adminController.markNotificationAsRead);
router.delete('/notifications/:notificationId', adminController.deleteNotification);

// System operations
router.post('/backup', adminController.createBackup);
router.post('/maintenance', adminController.toggleMaintenanceMode);

// Security
router.post('/security-breach', adminController.handleSecurityBreach);

// Compliance and reporting
router.post('/compliance-report', adminController.generateComplianceReport);

// Admin dashboard and personal data
router.get('/dashboard', adminController.getAdminDashboard);
router.get('/team-members', adminController.getTeamMembers);
router.get('/statistics', adminController.getAdminStatistics);
router.get('/recent-activity', adminController.getRecentActivity);

// Admin actions
router.post('/actions', adminController.performAdminAction);

module.exports = router;
