const express = require('express');
const router = express.Router();
const jobsController = require('../../controllers/jobs.controller');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth.middleware');

// Public routes
router.get('/', jobsController.getAllJobs);
router.get('/:id', jobsController.getJobById);
router.get('/:id/similar', jobsController.getSimilarJobs);

// Protected routes (requires authentication)
router.use(authMiddleware);

// Job management (employer role required)
router.post('/', roleMiddleware('employer', 'admin'), jobsController.createJob);
router.put('/:id', roleMiddleware('employer', 'admin'), jobsController.updateJob);
router.delete('/:id', roleMiddleware('employer', 'admin'), jobsController.deleteJob);

// Job status management
router.put('/:id/publish', roleMiddleware('employer', 'admin'), jobsController.publishJob);
router.put('/:id/close', roleMiddleware('employer', 'admin'), jobsController.closeJob);
router.put('/:id/pause', roleMiddleware('employer', 'admin'), jobsController.pauseJob);

// Analytics
router.get('/:id/analytics', roleMiddleware('employer', 'admin'), jobsController.getJobAnalytics);
router.get('/:id/candidates', roleMiddleware('employer', 'admin'), jobsController.getRecommendedCandidates);

module.exports = router;