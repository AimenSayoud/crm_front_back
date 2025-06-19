const express = require('express');
const router = express.Router();
const usersController = require('../../controllers/users.controller');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth.middleware');

// ============== USER MANAGEMENT ==============

/**
 * @route GET /api/v1/users
 * @desc Get all users with filtering and pagination
 * @access Admin, SuperAdmin, Employee
 */
router.get('/', 
    authMiddleware, 
    roleMiddleware('admin', 'superadmin', 'employee'), 
    usersController.getAllUsers
);

/**
 * @route GET /api/v1/users/:id
 * @desc Get user by ID with profile
 * @access Admin, SuperAdmin, Own Profile
 */
router.get('/:id', 
    authMiddleware, 
    usersController.getUserWithProfile
);

/**
 * @route PUT /api/v1/users/:id
 * @desc Update user profile
 * @access Admin, SuperAdmin, Own Profile
 */
router.put('/:id', 
    authMiddleware, 
    usersController.updateUserProfile
);

/**
 * @route PUT /api/v1/users/:id/status
 * @desc Update user status (active/inactive)
 * @access Admin, SuperAdmin
 */
router.put('/:id/status', 
    authMiddleware, 
    roleMiddleware('admin', 'superadmin'), 
    usersController.updateUserStatus
);

/**
 * @route DELETE /api/v1/users/:id
 * @desc Delete/deactivate user
 * @access Admin, SuperAdmin
 */
router.delete('/:id', 
    authMiddleware, 
    roleMiddleware('admin', 'superadmin'), 
    usersController.deleteUser
);

module.exports = router;
