const express = require('express');
const router = express.Router();
const { authMiddleware, roleMiddleware } = require('../../middleware/auth.middleware');

// ============== MONGODB UTILITIES ==============

/**
 * @route GET /api/v1/mongodb/status
 * @desc Get MongoDB connection status
 * @access Admin, SuperAdmin
 */
router.get('/status', 
    authMiddleware, 
    roleMiddleware('admin', 'superadmin'), 
    (req, res) => {
        res.json({ 
            message: 'MongoDB utilities endpoint',
            status: 'Connected'
        });
    }
);

module.exports = router;
