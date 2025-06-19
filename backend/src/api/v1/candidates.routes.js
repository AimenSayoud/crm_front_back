const express = require('express');
const router = express.Router();
const candidatesController = require('../../controllers/candidates.controller');
const { authMiddleware } = require('../../middleware/auth.middleware');

// Public routes
router.get('/', candidatesController.getAllCandidates);
router.get('/:id', candidatesController.getCandidateById);

// Protected routes (requires authentication)
router.use(authMiddleware);

// Profile management
router.get('/profile/me', candidatesController.getMyProfile);
router.post('/profile', candidatesController.createProfile);
router.put('/profile', candidatesController.updateProfile);

// Education
router.post('/education', candidatesController.addEducation);
router.put('/education/:educationId', candidatesController.updateEducation);
router.delete('/education/:educationId', candidatesController.deleteEducation);

// Work Experience
router.post('/experience', candidatesController.addExperience);
router.put('/experience/:experienceId', candidatesController.updateExperience);
router.delete('/experience/:experienceId', candidatesController.deleteExperience);

// Skills
router.put('/skills', candidatesController.updateSkills);
router.delete('/skills/:skillId', candidatesController.removeSkill);

// Preferences
router.put('/preferences', candidatesController.updatePreferences);
router.put('/notification-settings', candidatesController.updateNotificationSettings);

// Job matching
router.get('/jobs/matches', candidatesController.getMatchingJobs);
router.get('/jobs/recommendations', candidatesController.getRecommendedJobs);

// Analytics
router.get('/analytics/applications', candidatesController.getApplicationAnalytics);
router.get('/analytics/profile-views', candidatesController.getProfileViews);

module.exports = router;