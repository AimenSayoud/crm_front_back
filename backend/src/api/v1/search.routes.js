const express = require('express');
const router = express.Router();
const searchController = require('../../controllers/search.controller');
const authMiddleware = require('../../middleware/auth.middleware');

// All search endpoints require authentication
router.use(authMiddleware.authenticate);

// Global search
router.post('/global', searchController.globalSearch);

// Suggestions
router.get('/suggestions', searchController.getSearchSuggestions);

// Trending searches
router.get('/trending', searchController.getTrendingSearches);

// Advanced search
router.post('/advanced', searchController.advancedSearch);

// Search filters
router.get('/filters', searchController.getSearchFilters);

module.exports = router;
