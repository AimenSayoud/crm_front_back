const express = require('express');
const router = express.Router();
const aiToolsController = require('../../controllers/ai-tools.controller');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth.middleware');

// ============== AI TOOLS ==============

/**
 * @route GET /api/v1/ai-tools/analyze-cv
 * @desc Analyze CV using AI
 * @access Private
 */
router.post('/analyze-cv', 
    authMiddleware, 
    aiToolsController.analyzeCv || ((req, res) => res.status(501).json({ message: 'Not implemented' }))
);

/**
 * @route GET /api/v1/ai-tools/match-jobs
 * @desc Match candidate to jobs using AI
 * @access Private
 */
router.post('/match-jobs', 
    authMiddleware, 
    aiToolsController.matchJobs || ((req, res) => res.status(501).json({ message: 'Not implemented' }))
);

module.exports = router;
