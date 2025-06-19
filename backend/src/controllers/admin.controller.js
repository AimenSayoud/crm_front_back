const { User, AdminProfile, SuperAdminProfile } = require('../models/sql');
const adminService = require('../services/admin.service');
const { createResponse, createError } = require('../utils/response');
const logger = require('../utils/logger');

class AdminController {
    // Controller functions
    listAdmins = async (req, res) => {
        try {
            // Find all users with role 'admin' or 'superadmin'
            const admins = await User.find({ role: { $in: ['admin', 'superadmin'] } })
                .populate('admin_profile')
                .populate('superadmin_profile');

            res.json(createResponse('Admins retrieved successfully', admins));
        } catch (err) {
            logger.error('Error listing admins:', err);
            res.status(500).json(createError('Error retrieving admin users', err.message));
        }
    };

    createAdmin = async (req, res) => {
        try {
            const { user_id, admin_role, department, permissions, admin_level } = req.body;
            const created_by = req.user && req.user.id;

            if (!created_by) {
                return res.status(401).json(createError('Authentication required'));
            }

            const adminData = {
                admin_role: admin_role || 'user_admin',
                department,
                permissions,
                admin_level: admin_level || 1
            };

            const admin = await adminService.createAdmin(req.db, user_id, adminData, created_by);
            res.status(201).json(createResponse('Admin created successfully', admin));
        } catch (err) {
            logger.error('Error creating admin:', err);
            res.status(400).json(createError('Error creating admin user', err.message));
        }
    };

    getAdminById = async (req, res) => {
        try {
            const { adminId } = req.params;

            // Find user by ID and ensure they are admin or superadmin
            const user = await User.findOne({ _id: adminId, role: { $in: ['admin', 'superadmin'] } })
                .populate('admin_profile')
                .populate('superadmin_profile');

            if (!user) {
                return res.status(404).json(createError('Admin user not found'));
            }

            res.json(createResponse('Admin retrieved successfully', user));
        } catch (err) {
            logger.error('Error getting admin by ID:', err);
            res.status(500).json(createError('Error retrieving admin user', err.message));
        }
    };

    updateAdmin = async (req, res) => {
        try {
            const { adminId } = req.params;
            const updateData = req.body;
            const updated_by = req.user && req.user.id;

            if (!updated_by) {
                return res.status(401).json(createError('Authentication required'));
            }

            const admin = await AdminProfile.findById(adminId);
            if (!admin) {
                return res.status(404).json(createError('Admin not found'));
            }

            // Update admin profile
            Object.assign(admin, updateData);
            await admin.save();

            res.json(createResponse('Admin updated successfully', admin));
        } catch (err) {
            logger.error('Error updating admin:', err);
            res.status(500).json(createError('Error updating admin user', err.message));
        }
    };

    deleteAdmin = async (req, res) => {
        try {
            const { adminId } = req.params;
            const deleted_by = req.user && req.user.id;

            if (!deleted_by) {
                return res.status(401).json(createError('Authentication required'));
            }

            // Find the user and ensure they are admin or superadmin
            const user = await User.findOne({ _id: adminId, role: { $in: ['admin', 'superadmin'] } });
            if (!user) {
                return res.status(404).json(createError('Admin user not found'));
            }

            // Delete the admin profile if it exists
            await AdminProfile.deleteOne({ user_id: adminId });

            // Delete the user
            await User.deleteOne({ _id: adminId });

            res.json(createResponse('Admin user deleted successfully'));
        } catch (err) {
            logger.error('Error deleting admin:', err);
            res.status(500).json(createError('Error deleting admin user', err.message));
        }
    };

    updatePermissions = async (req, res) => {
        try {
            const { adminId } = req.params;
            const { permissions, restricted_actions } = req.body;
            const updated_by = req.user && req.user.id;

            if (!updated_by) {
                return res.status(401).json(createError('Authentication required'));
            }

            const permissionsUpdate = {
                permissions: permissions || [],
                restricted_actions: restricted_actions || []
            };

            const admin = await adminService.updateAdminPermissions(
                req.db,
                adminId,
                permissionsUpdate,
                updated_by
            );

            res.json(createResponse('Admin permissions updated successfully', admin));
        } catch (err) {
            logger.error('Error updating admin permissions:', err);
            res.status(400).json(createError('Error updating admin permissions', err.message));
        }
    };

    getSystemStats = async (req, res) => {
        try {
            const { start_date, end_date, admin_id } = req.query;
            const requested_by = req.user && req.user.id;

            if (!requested_by) {
                return res.status(401).json(createError('Authentication required'));
            }

            const stats = await adminService.getAuditLogAnalysis(
                req.db,
                start_date ? new Date(start_date) : null,
                end_date ? new Date(end_date) : null,
                admin_id
            );

            res.json(createResponse('System statistics retrieved successfully', stats));
        } catch (err) {
            logger.error('Error getting system stats:', err);
            res.status(500).json(createError('Error retrieving system statistics', err.message));
        }
    };

    getAuditLogs = async (req, res) => {
        try {
            const { start_date, end_date, admin_id, action_type, status, limit = 100 } = req.query;
            const requested_by = req.user && req.user.id;

            if (!requested_by) {
                return res.status(401).json(createError('Authentication required'));
            }

            // Build query
            const query = {};
            if (start_date && end_date) {
                query.created_at = {
                    $gte: new Date(start_date),
                    $lte: new Date(end_date)
                };
            }
            if (admin_id) query.admin_id = admin_id;
            if (action_type) query.action_type = action_type;
            if (status) query.status = status;

            const logs = await adminService.getAuditLogs(req.db, query, parseInt(limit));
            res.json(createResponse('Audit logs retrieved successfully', logs));
        } catch (err) {
            logger.error('Error getting audit logs:', err);
            res.status(500).json(createError('Error retrieving audit logs', err.message));
        }
    };

    createAuditLog = async (req, res) => {
        try {
            const auditData = req.body;
            const created_by = req.user && req.user.id;

            if (!created_by) {
                return res.status(401).json(createError('Authentication required'));
            }

            auditData.admin_id = created_by;
            await adminService.createAuditLog(req.db, auditData);

            res.json(createResponse('Audit log created successfully'));
        } catch (err) {
            logger.error('Error creating audit log:', err);
            res.status(500).json(createError('Error creating audit log', err.message));
        }
    };

    getSettings = async (req, res) => {
        try {
            const { category, is_public } = req.query;
            const requested_by = req.user && req.user.id;

            if (!requested_by) {
                return res.status(401).json(createError('Authentication required'));
            }

            // Build query
            const query = {};
            if (category) query.category = category;
            if (is_public !== undefined) query.is_public = is_public === 'true';

            const settings = await adminService.getSystemConfigs(req.db, query);
            res.json(createResponse('System settings retrieved successfully', settings));
        } catch (err) {
            logger.error('Error getting system settings:', err);
            res.status(500).json(createError('Error retrieving system settings', err.message));
        }
    };

    updateSettings = async (req, res) => {
        try {
            const { config_key } = req.params;
            const { config_value, reason } = req.body;
            const updated_by = req.user && req.user.id;

            if (!updated_by) {
                return res.status(401).json(createError('Authentication required'));
            }

            const update_request = {
                config_value,
                reason: reason || 'Updated via admin interface'
            };

            const updated = await adminService.updateSystemConfiguration(
                req.db,
                config_key,
                update_request,
                updated_by
            );

            res.json(createResponse('System settings updated successfully', updated));
        } catch (err) {
            logger.error('Error updating system settings:', err);
            res.status(400).json(createError('Error updating system settings', err.message));
        }
    };

    getSettingById = async (req, res) => {
        try {
            const { configId } = req.params;
            const requested_by = req.user && req.user.id;

            if (!requested_by) {
                return res.status(401).json(createError('Authentication required'));
            }

            const config = await adminService.getSystemConfig(req.db, configId);
            if (!config) {
                return res.status(404).json(createError('Configuration setting not found'));
            }

            res.json(createResponse('Configuration setting retrieved successfully', config));
        } catch (err) {
            logger.error('Error getting configuration setting:', err);
            res.status(500).json(createError('Error retrieving configuration setting', err.message));
        }
    };

    getNotifications = async (req, res) => {
        try {
            const { is_read, notification_type, priority, limit = 50 } = req.query;
            const admin_id = req.user && req.user.id;

            if (!admin_id) {
                return res.status(401).json(createError('Authentication required'));
            }

            // Build query
            const query = { admin_id };
            if (is_read !== undefined) query.is_read = is_read === 'true';
            if (notification_type) query.notification_type = notification_type;
            if (priority) query.priority = priority;

            const notifications = await adminService.getNotifications(req.db, query, parseInt(limit));
            res.json(createResponse('Admin notifications retrieved successfully', notifications));
        } catch (err) {
            logger.error('Error getting admin notifications:', err);
            res.status(500).json(createError('Error retrieving admin notifications', err.message));
        }
    };

    createNotification = async (req, res) => {
        try {
            const notificationData = req.body;
            const created_by = req.user && req.user.id;

            if (!created_by) {
                return res.status(401).json(createError('Authentication required'));
            }

            notificationData.created_by = created_by;
            await adminService.sendAdminNotification(req.db, notificationData);

            res.json(createResponse('Admin notification created successfully'));
        } catch (err) {
            logger.error('Error creating admin notification:', err);
            res.status(500).json(createError('Error creating admin notification', err.message));
        }
    };

    markNotificationAsRead = async (req, res) => {
        try {
            const { notificationId } = req.params;
            const admin_id = req.user && req.user.id;

            if (!admin_id) {
                return res.status(401).json(createError('Authentication required'));
            }

            await adminService.markNotificationAsRead(req.db, notificationId, admin_id);
            res.json(createResponse('Notification marked as read successfully'));
        } catch (err) {
            logger.error('Error marking notification as read:', err);
            res.status(500).json(createError('Error marking notification as read', err.message));
        }
    };

    deleteNotification = async (req, res) => {
        try {
            const { notificationId } = req.params;
            const admin_id = req.user && req.user.id;

            if (!admin_id) {
                return res.status(401).json(createError('Authentication required'));
            }

            await adminService.deleteNotification(req.db, notificationId, admin_id);
            res.json(createResponse('Admin notification deleted successfully'));
        } catch (err) {
            logger.error('Error deleting notification:', err);
            res.status(500).json(createError('Error deleting notification', err.message));
        }
    };

    createBackup = async (req, res) => {
        try {
            const backupData = req.body;
            const created_by = req.user && req.user.id;

            if (!created_by) {
                return res.status(401).json(createError('Authentication required'));
            }

            // This would integrate with backup service
            const backup = await adminService.createBackup(req.db, backupData, created_by);
            res.json(createResponse('System backup created successfully', backup));
        } catch (err) {
            logger.error('Error creating system backup:', err);
            res.status(500).json(createError('Error creating system backup', err.message));
        }
    };

    toggleMaintenanceMode = async (req, res) => {
        try {
            const { enabled, reason } = req.body;
            const updated_by = req.user && req.user.id;

            if (!updated_by) {
                return res.status(401).json(createError('Authentication required'));
            }

            const result = await adminService.toggleMaintenanceMode(req.db, { enabled, reason }, updated_by);
            res.json(createResponse('Maintenance mode toggled successfully', result));
        } catch (err) {
            logger.error('Error toggling maintenance mode:', err);
            res.status(500).json(createError('Error toggling maintenance mode', err.message));
        }
    };

    getPerformanceMetrics = async (req, res) => {
        try {
            const { time_range } = req.query;
            const requested_by = req.user && req.user.id;

            if (!requested_by) {
                return res.status(401).json(createError('Authentication required'));
            }

            const metrics = await adminService.getPerformanceMetrics(req.db, time_range);
            res.json(createResponse('Performance metrics retrieved successfully', metrics));
        } catch (err) {
            logger.error('Error getting performance metrics:', err);
            res.status(500).json(createError('Error retrieving performance metrics', err.message));
        }
    };

    getAdminDashboard = async (req, res) => {
        try {
            const admin_id = req.user && req.user.id;

            if (!admin_id) {
                return res.status(401).json(createError('Authentication required'));
            }

            const dashboard = await adminService.getAdminDashboard(req.db, admin_id);
            res.json(createResponse('Admin dashboard retrieved successfully', dashboard));
        } catch (err) {
            logger.error('Error getting admin dashboard:', err);
            res.status(500).json(createError('Error retrieving admin dashboard', err.message));
        }
    };

    performAdminAction = async (req, res) => {
        try {
            const { action, resource_type, resource_id, data } = req.body;
            const admin_id = req.user && req.user.id;

            if (!admin_id) {
                return res.status(401).json(createError('Authentication required'));
            }

            const ip_address = req.ip;
            const user_agent = req.get('User-Agent');

            const result = await adminService.performAdminAction(
                req.db,
                admin_id,
                action,
                resource_type,
                resource_id,
                data,
                ip_address,
                user_agent
            );

            if (result) {
                res.json(createResponse('Admin action performed successfully'));
            } else {
                res.status(403).json(createError('Permission denied for this action'));
            }
        } catch (err) {
            logger.error('Error performing admin action:', err);
            res.status(500).json(createError('Error performing admin action', err.message));
        }
    };

    handleSecurityBreach = async (req, res) => {
        try {
            const { breach_type, affected_admin_id, details } = req.body;
            const reported_by = req.user && req.user.id;

            if (!reported_by) {
                return res.status(401).json(createError('Authentication required'));
            }

            const response = await adminService.handleSecurityBreach(
                req.db,
                breach_type,
                affected_admin_id,
                details,
                reported_by
            );

            res.json(createResponse('Security breach handled successfully', response));
        } catch (err) {
            logger.error('Error handling security breach:', err);
            res.status(500).json(createError('Error handling security breach', err.message));
        }
    };

    generateComplianceReport = async (req, res) => {
        try {
            const { report_type, start_date, end_date } = req.body;
            const requested_by = req.user && req.user.id;

            if (!requested_by) {
                return res.status(401).json(createError('Authentication required'));
            }

            const report = await adminService.generateComplianceReport(
                req.db,
                report_type,
                new Date(start_date),
                new Date(end_date),
                requested_by
            );

            res.json(createResponse('Compliance report generated successfully', report));
        } catch (err) {
            logger.error('Error generating compliance report:', err);
            res.status(400).json(createError('Error generating compliance report', err.message));
        }
    };

    getTeamMembers = async (req, res) => {
        try {
            const admin_id = req.user && req.user.id;

            if (!admin_id) {
                return res.status(401).json(createError('Authentication required'));
            }

            const admin = await AdminProfile.findById(admin_id);
            if (!admin) {
                return res.status(404).json(createError('Admin not found'));
            }

            const team_members = await adminService.getTeamMembers(req.db, admin);
            res.json(createResponse('Team members retrieved successfully', team_members));
        } catch (err) {
            logger.error('Error getting team members:', err);
            res.status(500).json(createError('Error retrieving team members', err.message));
        }
    };

    getAdminStatistics = async (req, res) => {
        try {
            const admin_id = req.user && req.user.id;

            if (!admin_id) {
                return res.status(401).json(createError('Authentication required'));
            }

            const statistics = await adminService.getAdminStatistics(req.db, admin_id);
            res.json(createResponse('Admin statistics retrieved successfully', statistics));
        } catch (err) {
            logger.error('Error getting admin statistics:', err);
            res.status(500).json(createError('Error retrieving admin statistics', err.message));
        }
    };

    getRecentActivity = async (req, res) => {
        try {
            const { limit = 10 } = req.query;
            const admin_id = req.user && req.user.id;

            if (!admin_id) {
                return res.status(401).json(createError('Authentication required'));
            }

            const activity = await adminService.getRecentAdminActivity(req.db, admin_id, parseInt(limit));
            res.json(createResponse('Recent activity retrieved successfully', activity));
        } catch (err) {
            logger.error('Error getting recent activity:', err);
            res.status(500).json(createError('Error retrieving recent activity', err.message));
        }
    };

    getSystemStatus = async (req, res) => {
        try {
            const status = await adminService.getSystemStatus(req.db);
            res.json(createResponse('System status retrieved successfully', status));
        } catch (err) {
            logger.error('Error getting system status:', err);
            res.status(500).json(createError('Error retrieving system status', err.message));
        }
    };
}

module.exports = new AdminController();