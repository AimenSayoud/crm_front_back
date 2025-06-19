const skillsService = require('../services/skills.service');
const { successResponse, errorResponse } = require('../utils/response');
const logger = require('../utils/logger');
const { AppError } = require('../utils/appError');

class SkillsController {
    constructor() {
        this.logger = logger;
    }

    async getSkillsWithSearch(req, res) {
        try {
            const filters = req.query;
            const { skills, total } = await skillsService.getSkillsWithSearch(filters);
            return successResponse(res, 'Skills retrieved successfully', { skills, total });
        } catch (error) {
            this.logger.error('Error in getSkillsWithSearch:', error);
            return errorResponse(res, error.message || 'Failed to retrieve skills', error.statusCode || 500);
        }
    }

    async createSkillWithCategory(req, res) {
        try {
            const { skill, category_name } = req.body;
            const createdSkill = await skillsService.createSkillWithCategory(skill, category_name);
            return successResponse(res, 'Skill created successfully', createdSkill);
        } catch (error) {
            this.logger.error('Error in createSkillWithCategory:', error);
            return errorResponse(res, error.message || 'Failed to create skill', error.statusCode || 500);
        }
    }

    async createSkillCategory(req, res) {
        try {
            const { category, created_by } = req.body;
            const createdCategory = await skillsService.createSkillCategory(category, created_by);
            return successResponse(res, 'Skill category created successfully', createdCategory);
        } catch (error) {
            this.logger.error('Error in createSkillCategory:', error);
            return errorResponse(res, error.message || 'Failed to create skill category', error.statusCode || 500);
        }
    }

    async mergeDuplicateSkills(req, res) {
        try {
            const { primary_skill_id, duplicate_skill_ids, merged_by } = req.body;
            const mergedSkill = await skillsService.mergeDuplicateSkills(primary_skill_id, duplicate_skill_ids, merged_by);
            return successResponse(res, 'Skills merged successfully', mergedSkill);
        } catch (error) {
            this.logger.error('Error in mergeDuplicateSkills:', error);
            return errorResponse(res, error.message || 'Failed to merge skills', error.statusCode || 500);
        }
    }

    async getTrendingSkills(req, res) {
        try {
            const { days = 30, limit = 20 } = req.query;
            const trendingSkills = await skillsService.getTrendingSkills(Number(days), Number(limit));
            return successResponse(res, 'Trending skills retrieved successfully', trendingSkills);
        } catch (error) {
            this.logger.error('Error in getTrendingSkills:', error);
            return errorResponse(res, error.message || 'Failed to get trending skills', error.statusCode || 500);
        }
    }

    async getSkillMarketDemand(req, res) {
        try {
            const { skill_id } = req.params;
            const marketDemand = await skillsService.getSkillMarketDemand(skill_id);
            return successResponse(res, 'Skill market demand retrieved successfully', marketDemand);
        } catch (error) {
            this.logger.error('Error in getSkillMarketDemand:', error);
            return errorResponse(res, error.message || 'Failed to get market demand', error.statusCode || 500);
        }
    }

    async getSkillGapAnalysis(req, res) {
        try {
            const { company_id, location } = req.query;
            const gapAnalysis = await skillsService.getSkillGapAnalysis(company_id, location);
            return successResponse(res, 'Skill gap analysis retrieved successfully', gapAnalysis);
        } catch (error) {
            this.logger.error('Error in getSkillGapAnalysis:', error);
            return errorResponse(res, error.message || 'Failed to analyze skill gaps', error.statusCode || 500);
        }
    }

    async suggestSkillsForCandidate(req, res) {
        try {
            const { candidate_id } = req.params;
            const { limit = 10 } = req.query;
            const suggestions = await skillsService.suggestSkillsForCandidate(candidate_id, Number(limit));
            return successResponse(res, 'Skill suggestions retrieved successfully', suggestions);
        } catch (error) {
            this.logger.error('Error in suggestSkillsForCandidate:', error);
            return errorResponse(res, error.message || 'Failed to suggest skills', error.statusCode || 500);
        }
    }

    async bulkImportSkills(req, res) {
        try {
            const { skills_data, imported_by } = req.body;
            const result = await skillsService.bulkImportSkills(skills_data, imported_by);
            return successResponse(res, 'Bulk skill import completed', result);
        } catch (error) {
            this.logger.error('Error in bulkImportSkills:', error);
            return errorResponse(res, error.message || 'Failed to bulk import skills', error.statusCode || 500);
        }
    }

    async getSkillCategoriesWithSearch(req, res) {
        try {
            const filters = req.query;
            const { categories, total } = await skillsService.getSkillCategoriesWithSearch(filters);
            return successResponse(res, 'Skill categories retrieved successfully', { categories, total });
        } catch (error) {
            this.logger.error('Error in getSkillCategoriesWithSearch:', error);
            return errorResponse(res, error.message || 'Failed to retrieve skill categories', error.statusCode || 500);
        }
    }
}

module.exports = new SkillsController();
