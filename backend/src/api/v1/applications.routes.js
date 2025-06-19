const express = require('express');
const router = express.Router();
const applicationsController = require('../../controllers/applications.controller');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth.middleware');

// ============== APPLICATION MANAGEMENT ==============

/**
 * @route GET /api/v1/applications
 * @desc Get all applications
 * @access Private
 */
router.get('/', 
    authMiddleware, 
    applicationsController.getAllApplications || ((req, res) => res.status(501).json({ message: 'Not implemented' }))
);

/**
 * @route POST /api/v1/applications
 * @desc Create new application
 * @access Private
 */
router.post('/', 
    authMiddleware, 
    applicationsController.createApplication || ((req, res) => res.status(501).json({ message: 'Not implemented' }))
);

/**
 * @route GET /api/v1/applications/:id
 * @desc Get application by ID
 * @access Private
 */
router.get('/:id', 
    authMiddleware, 
    applicationsController.getApplicationById || ((req, res) => res.status(501).json({ message: 'Not implemented' }))
);

/**
 * @route PUT /api/v1/applications/:id
 * @desc Update application
 * @access Private
 */
router.put('/:id', 
    authMiddleware, 
    applicationsController.updateApplication || ((req, res) => res.status(501).json({ message: 'Not implemented' }))
);

module.exports = router;
