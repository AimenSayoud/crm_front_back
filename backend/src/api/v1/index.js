const express = require('express');
const router = express.Router();

// Import route modules
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const usersRoutes = require('./users.routes');
const candidatesRoutes = require('./candidates.routes');
const companiesRoutes = require('./companies.routes');
const jobsRoutes = require('./jobs.routes');
const applicationsRoutes = require('./applications.routes');
const skillsRoutes = require('./skills.routes');
const searchRoutes = require('./search.routes');
const messagingRoutes = require('./messaging.routes');
const analyticsRoutes = require('./analytics.routes');
const aiToolsRoutes = require('./ai-tools.routes');

// Register routes
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);
router.use('/users', usersRoutes);
router.use('/candidates', candidatesRoutes);
router.use('/companies', companiesRoutes);
router.use('/jobs', jobsRoutes);
router.use('/applications', applicationsRoutes);
router.use('/skills', skillsRoutes);
router.use('/search', searchRoutes);
router.use('/messaging', messagingRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/ai-tools', aiToolsRoutes);

module.exports = router;
