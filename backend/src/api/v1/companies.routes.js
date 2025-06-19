const express = require('express');
const router = express.Router();
const companiesController = require('../../controllers/companies.controller');
const { authMiddleware, roleMiddleware } = require('../../middleware/auth.middleware');

// Public routes
router.get('/', companiesController.getAllCompanies);
router.get('/:id', companiesController.getCompanyById);
router.get('/:id/jobs', companiesController.getCompanyJobs);

// Protected routes (requires authentication)
router.use(authMiddleware);

// Company management (employer role required)
router.post('/', roleMiddleware('employer', 'admin'), companiesController.createCompany);
router.put('/:id', roleMiddleware('employer', 'admin'), companiesController.updateCompany);
router.delete('/:id', roleMiddleware('admin'), companiesController.deleteCompany);

// Company verification (admin only)
router.put('/:id/verify', roleMiddleware('admin'), companiesController.verifyCompany);

// Company contacts
router.post('/:id/contacts', roleMiddleware('employer', 'admin'), companiesController.addContact);
router.put('/:id/contacts/:contactId', roleMiddleware('employer', 'admin'), companiesController.updateContact);
router.delete('/:id/contacts/:contactId', roleMiddleware('employer', 'admin'), companiesController.deleteContact);

// Analytics
router.get('/:id/analytics', roleMiddleware('employer', 'admin'), companiesController.getCompanyAnalytics);
router.get('/:id/stats', roleMiddleware('employer', 'admin'), companiesController.getCompanyStats);

module.exports = router;