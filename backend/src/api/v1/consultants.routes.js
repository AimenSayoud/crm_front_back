const express = require('express');
const router = express.Router();
const consultantsController = require('../../controllers/consultants.controller');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth.middleware');

// ============== CONSULTANT MANAGEMENT ==============

/**
 * @route GET /api/v1/consultants
 * @desc Get all consultants
 * @access Admin, SuperAdmin
 */
router.get('/', 
    authMiddleware, 
    roleMiddleware('admin', 'superadmin'), 
    consultantsController.getAllConsultants || ((req, res) => res.status(501).json({ message: 'Not implemented' }))
);

/**
 * @route GET /api/v1/consultants/:id
 * @desc Get consultant by ID
 * @access Private
 */
router.get('/:id', 
    authMiddleware, 
    consultantsController.getConsultantById || ((req, res) => res.status(501).json({ message: 'Not implemented' }))
);

/**
 * @route PUT /api/v1/consultants/:id
 * @desc Update consultant profile
 * @access Private (own profile) or Admin
 */
router.put('/:id', 
    authMiddleware, 
    consultantsController.updateConsultant || ((req, res) => res.status(501).json({ message: 'Not implemented' }))
);

module.exports = router;
