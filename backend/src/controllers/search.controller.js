const searchService = require('../services/search.service');
const { createResponse, createError } = require('../utils/response');
const logger = require('../utils/logger');

class SearchController {
    async globalSearch(req, res) {
        try {
            const filters = req.body;
            const currentUser = req.user;
            const limit = Math.min(parseInt(req.query.limit) || 20, 100);
            const offset = Math.max(parseInt(req.query.offset) || 0, 0);

            const result = await searchService.globalSearch(req.db, filters, currentUser, limit, offset);
            res.json(createResponse('Global search results', result));
        } catch (err) {
            logger.error('Error in global search:', err);
            res.status(400).json(createError('Error in global search', err.message));
        }
    }

    async getSearchSuggestions(req, res) {
        try {
            const query = req.query.query;
            const currentUser = req.user;
            const limit = Math.min(parseInt(req.query.limit) || 10, 20);

            const suggestions = await searchService.getSearchSuggestions(req.db, query, limit);
            res.json(createResponse('Search suggestions', suggestions));
        } catch (err) {
            logger.error('Error getting search suggestions:', err);
            res.status(400).json(createError('Error getting search suggestions', err.message));
        }
    }

    async getTrendingSearches(req, res) {
        try {
            const currentUser = req.user;
            const trending = await searchService.getTrendingSearches(req.db);
            res.json(createResponse('Trending searches', trending));
        } catch (err) {
            logger.error('Error getting trending searches:', err);
            res.status(400).json(createError('Error getting trending searches', err.message));
        }
    }

    async advancedSearch(req, res) {
        try {
            const filters = req.body;
            const query = req.query.query || '';
            const currentUser = req.user;
            const limit = Math.min(parseInt(req.query.limit) || 20, 100);
            const offset = Math.max(parseInt(req.query.offset) || 0, 0);
            const sortBy = req.query.sort_by || 'relevance';
            const sortOrder = req.query.sort_order || 'desc';

            const result = await searchService.advancedSearch(
                req.db, filters, query, currentUser, limit, offset, sortBy, sortOrder
            );
            res.json(createResponse('Advanced search results', result));
        } catch (err) {
            logger.error('Error in advanced search:', err);
            res.status(400).json(createError('Error in advanced search', err.message));
        }
    }

    async getSearchFilters(req, res) {
        try {
            const filters = await searchService.getSearchFilters(req.db);
            res.json(createResponse('Search filters', filters));
        } catch (err) {
            logger.error('Error getting search filters:', err);
            res.status(400).json(createError('Error getting search filters', err.message));
        }
    }
}

module.exports = new SearchController();
