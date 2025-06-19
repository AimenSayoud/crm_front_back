const express = require('express');
const router = express.Router();
const analyticsController = require('../../controllers/analytics.controller');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth.middleware');

// ============== DASHBOARD OVERVIEW ==============

/**
 * @route GET /api/v1/analytics/dashboard
 * @desc Get comprehensive dashboard overview with key metrics
 * @access Admin, SuperAdmin
 */
router.get('/dashboard',
    authMiddleware,
    roleMiddleware('admin', 'superadmin'),
    analyticsController.getDashboardOverview
);

// ============== APPLICATION ANALYTICS ==============

/**
 * @route GET /api/v1/analytics/applications
 * @desc Get detailed application analytics with filtering
 * @access Admin, SuperAdmin, Employer (own company), Consultant (own data)
 */
router.get('/applications',
    authMiddleware,
    roleMiddleware('admin', 'superadmin', 'employer', 'consultant'),
    analyticsController.getApplicationAnalytics
);

// ============== JOB ANALYTICS ==============

/**
 * @route GET /api/v1/analytics/jobs
 * @desc Get job posting and performance analytics
 * @access Admin, SuperAdmin, Employer (own company), Consultant
 */
router.get('/jobs',
    authMiddleware,
    roleMiddleware('admin', 'superadmin', 'employer', 'consultant'),
    analyticsController.getJobAnalytics
);

// ============== CANDIDATE ANALYTICS ==============

/**
 * @route GET /api/v1/analytics/candidates
 * @desc Get candidate pool and performance analytics
 * @access Admin, SuperAdmin, Consultant (own candidates)
 */
router.get('/candidates',
    authMiddleware,
    roleMiddleware('admin', 'superadmin', 'consultant'),
    analyticsController.getCandidateAnalytics
);

// ============== CONSULTANT ANALYTICS ==============

/**
 * @route GET /api/v1/analytics/consultants
 * @desc Get consultant performance analytics
 * @access Admin, SuperAdmin, Consultant (own data)
 */
router.get('/consultants',
    authMiddleware,
    roleMiddleware('admin', 'superadmin', 'consultant'),
    analyticsController.getConsultantAnalytics
);

// ============== COMPANY ANALYTICS ==============

/**
 * @route GET /api/v1/analytics/companies
 * @desc Get company hiring and performance analytics
 * @access Admin, SuperAdmin, Employer (own company)
 */
router.get('/companies',
    authMiddleware,
    roleMiddleware('admin', 'superadmin', 'employer'),
    analyticsController.getCompanyAnalytics
);

// ============== TREND ANALYSIS ==============

/**
 * @route GET /api/v1/analytics/trends
 * @desc Get trend analysis for specified metrics
 * @access Admin, SuperAdmin
 */
router.get('/trends',
    authMiddleware,
    roleMiddleware('admin', 'superadmin'),
    analyticsController.getTrendAnalysis
);

// ============== KEY PERFORMANCE INDICATORS ==============

/**
 * @route GET /api/v1/analytics/kpis
 * @desc Get key performance indicators for the platform
 * @access Admin, SuperAdmin
 */
router.get('/kpis',
    authMiddleware,
    roleMiddleware('admin', 'superadmin'),
    analyticsController.getKeyPerformanceIndicators
);

// ============== CUSTOM REPORTS ==============

/**
 * @route POST /api/v1/analytics/custom-report
 * @desc Generate a custom report based on specified parameters
 * @access Admin, SuperAdmin
 */
router.post('/custom-report',
    authMiddleware,
    roleMiddleware('admin', 'superadmin'),
    analyticsController.generateCustomReport
);

/**
 * @route GET /api/v1/analytics/reports/:report_id
 * @desc Get a previously generated report
 * @access Admin, SuperAdmin
 */
router.get('/reports/:report_id',
    authMiddleware,
    roleMiddleware('admin', 'superadmin'),
    analyticsController.getGeneratedReport
);

// ============== EXPORT FUNCTIONALITY ==============

/**
 * @route POST /api/v1/analytics/export
 * @desc Export analytics data in specified format
 * @access Admin, SuperAdmin
 */
router.post('/export',
    authMiddleware,
    roleMiddleware('admin', 'superadmin'),
    analyticsController.exportAnalyticsData
);

/**
 * @route GET /api/v1/analytics/exports/:export_id/download
 * @desc Download exported analytics data
 * @access Admin, SuperAdmin
 */
router.get('/exports/:export_id/download',
    authMiddleware,
    roleMiddleware('admin', 'superadmin'),
    analyticsController.downloadExport
);

// ============== INDUSTRY BENCHMARKS ==============

/**
 * @route GET /api/v1/analytics/benchmarks
 * @desc Get industry benchmark comparisons
 * @access Admin, SuperAdmin
 */
router.get('/benchmarks',
    authMiddleware,
    roleMiddleware('admin', 'superadmin'),
    analyticsController.getIndustryBenchmarks
);

module.exports = router;
