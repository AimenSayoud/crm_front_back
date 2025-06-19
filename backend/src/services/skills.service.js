const mongoose = require('mongoose');
const { Skill, SkillCategory } = require('../models/sql/skill.model');
const CandidateSkill = require('../models/sql/candidate.model').CandidateSkill;
const JobSkillRequirement = require('../models/sql/job.model').JobSkillRequirement;
const Job = require('../models/sql/job.model');
const CandidateProfile = require('../models/sql/candidate.model');
const logger = require('../utils/logger');
const { AppError } = require('../utils/appError');

class SkillsService {
    constructor() {
        this.logger = logger;
    }

    // ============== SKILL MANAGEMENT ==============

    async getSkillsWithSearch(filters = {}, includeStats = false) {
        try {
            const { query, category_id, is_active, sort_by = 'name', sort_order = 'asc', page = 1, page_size = 20 } = filters;

            let dbQuery = Skill.find();

            // Apply filters
            if (query) {
                dbQuery = dbQuery.regex('name', new RegExp(query, 'i'));
            }

            if (category_id) {
                dbQuery = dbQuery.where('category_id', category_id);
            }

            if (is_active !== undefined) {
                dbQuery = dbQuery.where('is_active', is_active);
            }

            // Get total count
            const total = await Skill.countDocuments(dbQuery.getQuery());

            // Apply sorting
            if (sort_by === 'name') {
                dbQuery = dbQuery.sort({ name: sort_order === 'desc' ? -1 : 1 });
            } else {
                dbQuery = dbQuery.sort({ created_at: -1 });
            }

            // Apply pagination
            const offset = (page - 1) * page_size;
            const skills = await dbQuery
                .populate('category_id')
                .skip(offset)
                .limit(page_size)
                .lean();

            return { skills, total };
        } catch (error) {
            this.logger.error('Error in getSkillsWithSearch:', error);
            throw new AppError('Failed to retrieve skills', 500);
        }
    }

    async createSkillWithCategory(skillData, categoryName = null) {
        try {
            // Check if skill already exists
            const existing = await Skill.findOne({ name: skillData.name });
            if (existing) {
                throw new AppError(`Skill '${skillData.name}' already exists`, 400);
            }

            // Handle category
            if (categoryName) {
                let category = await SkillCategory.findOne({ name: categoryName });
                if (!category) {
                    // Create category if doesn't exist
                    category = await SkillCategory.create({
                        name: categoryName,
                        description: `Category for ${categoryName} skills`,
                        display_order: 0
                    });
                }
                skillData.category_id = category._id;
            }

            // Create skill
            const skill = await Skill.create(skillData);
            await skill.populate('category_id');

            // Log creation
            this.logAction('skill_created', {
                skill_name: skill.name,
                category: categoryName
            });

            return skill;
        } catch (error) {
            this.logger.error('Error in createSkillWithCategory:', error);
            throw new AppError(error.message || 'Failed to create skill', error.statusCode || 500);
        }
    }

    async createSkillCategory(categoryData, createdBy) {
        try {
            // Check if category already exists
            const existing = await SkillCategory.findOne({ name: categoryData.name });
            if (existing) {
                throw new AppError(`Skill category '${categoryData.name}' already exists`, 400);
            }

            // Create category
            const category = await SkillCategory.create(categoryData);

            // Log creation
            this.logAction('skill_category_created', {
                user_id: createdBy,
                category_name: category.name
            });

            return category;
        } catch (error) {
            this.logger.error('Error in createSkillCategory:', error);
            throw new AppError(error.message || 'Failed to create skill category', error.statusCode || 500);
        }
    }

    async mergeDuplicateSkills(primarySkillId, duplicateSkillIds, mergedBy) {
        try {
            const primarySkill = await Skill.findById(primarySkillId);
            if (!primarySkill) {
                throw new AppError('Primary skill not found', 404);
            }

            // Get all duplicate skills
            const duplicateSkills = await Skill.find({
                _id: { $in: duplicateSkillIds }
            });

            if (!duplicateSkills.length) {
                throw new AppError('No duplicate skills found', 404);
            }

            // Update all references to point to primary skill
            for (const dupSkill of duplicateSkills) {
                // Update candidate skills
                await CandidateSkill.updateMany(
                    { skill_id: dupSkill._id },
                    { skill_id: primarySkillId }
                );

                // Update job skill requirements
                await JobSkillRequirement.updateMany(
                    { skill_id: dupSkill._id },
                    { skill_id: primarySkillId }
                );
            }

            // Delete duplicate skills
            await Skill.deleteMany({ _id: { $in: duplicateSkillIds } });

            // Log merge
            this.logAction('skills_merged', {
                user_id: mergedBy,
                primary_skill: primarySkill.name,
                merged_skills: duplicateSkills.map(s => s.name),
                count: duplicateSkills.length
            });

            return primarySkill;
        } catch (error) {
            this.logger.error('Error in mergeDuplicateSkills:', error);
            throw new AppError(error.message || 'Failed to merge skills', error.statusCode || 500);
        }
    }

    // ============== TRENDING SKILLS ==============

    async getTrendingSkills(days = 30, limit = 20) {
        try {
            const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

            // Get skills from recent job postings
            const trending = await JobSkillRequirement.aggregate([
                {
                    $lookup: {
                        from: 'jobs',
                        localField: 'job_id',
                        foreignField: '_id',
                        as: 'job'
                    }
                },
                {
                    $unwind: '$job'
                },
                {
                    $match: {
                        'job.created_at': { $gte: sinceDate }
                    }
                },
                {
                    $lookup: {
                        from: 'skills',
                        localField: 'skill_id',
                        foreignField: '_id',
                        as: 'skill'
                    }
                },
                {
                    $unwind: '$skill'
                },
                {
                    $group: {
                        _id: '$skill_id',
                        skill_name: { $first: '$skill.name' },
                        category_id: { $first: '$skill.category_id' },
                        job_count: { $sum: 1 }
                    }
                },
                {
                    $sort: { job_count: -1 }
                },
                {
                    $limit: limit
                }
            ]);

            // Calculate trend score and growth
            const trendingSkills = [];
            for (const trend of trending) {
                // Get previous period count
                const prevSinceDate = new Date(sinceDate.getTime() - days * 24 * 60 * 60 * 1000);
                const prevCount = await JobSkillRequirement.aggregate([
                    {
                        $lookup: {
                            from: 'jobs',
                            localField: 'job_id',
                            foreignField: '_id',
                            as: 'job'
                        }
                    },
                    {
                        $unwind: '$job'
                    },
                    {
                        $match: {
                            skill_id: trend._id,
                            'job.created_at': { $gte: prevSinceDate, $lt: sinceDate }
                        }
                    },
                    {
                        $count: 'count'
                    }
                ]);

                const prevJobCount = prevCount.length > 0 ? prevCount[0].count : 0;
                const growth = prevJobCount > 0
                    ? ((trend.job_count - prevJobCount) / prevJobCount * 100)
                    : 100;

                trendingSkills.push({
                    skill_id: trend._id,
                    skill_name: trend.skill_name,
                    category_id: trend.category_id,
                    job_count: trend.job_count,
                    growth_percentage: growth,
                    trend: growth > 0 ? 'rising' : 'falling'
                });
            }

            return trendingSkills;
        } catch (error) {
            this.logger.error('Error in getTrendingSkills:', error);
            throw new AppError('Failed to get trending skills', 500);
        }
    }

    // ============== MARKET DEMAND ANALYSIS ==============

    async getSkillMarketDemand(skillId) {
        try {
            const skill = await Skill.findById(skillId).populate('category_id');
            if (!skill) {
                throw new AppError('Skill not found', 404);
            }

            // Current demand
            const currentJobCount = await JobSkillRequirement.aggregate([
                {
                    $lookup: {
                        from: 'jobs',
                        localField: 'job_id',
                        foreignField: '_id',
                        as: 'job'
                    }
                },
                {
                    $unwind: '$job'
                },
                {
                    $match: {
                        skill_id: skillId,
                        'job.status': 'open'
                    }
                },
                {
                    $count: 'count'
                }
            ]);

            const openPositions = currentJobCount.length > 0 ? currentJobCount[0].count : 0;

            // Supply (candidates with skill)
            const candidateCount = await CandidateSkill.countDocuments({ skill_id: skillId });

            // Average salary for jobs requiring this skill
            const salaryData = await Job.aggregate([
                {
                    $lookup: {
                        from: 'jobskillrequirements',
                        localField: '_id',
                        foreignField: 'job_id',
                        as: 'skill_requirements'
                    }
                },
                {
                    $unwind: '$skill_requirements'
                },
                {
                    $match: {
                        'skill_requirements.skill_id': skillId,
                        salary_min: { $exists: true, $ne: null }
                    }
                },
                {
                    $group: {
                        _id: null,
                        avg_salary_min: { $avg: '$salary_min' },
                        avg_salary_max: { $avg: '$salary_max' }
                    }
                }
            ]);

            const avgSalaryMin = salaryData.length > 0 ? salaryData[0].avg_salary_min : 0;
            const avgSalaryMax = salaryData.length > 0 ? salaryData[0].avg_salary_max : 0;

            // Proficiency level distribution
            const proficiencyDist = await CandidateSkill.aggregate([
                {
                    $match: { skill_id: skillId }
                },
                {
                    $group: {
                        _id: '$proficiency_level',
                        count: { $sum: 1 }
                    }
                }
            ]);

            const proficiencyDistribution = {};
            proficiencyDist.forEach(item => {
                proficiencyDistribution[item._id] = item.count;
            });

            // Related skills
            const relatedSkills = await this._getRelatedSkills(skillId);

            return {
                skill: {
                    id: skillId,
                    name: skill.name,
                    category: skill.category_id ? skill.category_id.name : null
                },
                demand: {
                    open_positions: openPositions,
                    available_candidates: candidateCount,
                    supply_demand_ratio: openPositions > 0 ? candidateCount / openPositions : Infinity,
                    market_status: this._determineMarketStatus(openPositions, candidateCount)
                },
                salary: {
                    average_min: avgSalaryMin,
                    average_max: avgSalaryMax,
                    average_range: avgSalaryMax ? (avgSalaryMin + avgSalaryMax) / 2 : avgSalaryMin
                },
                proficiency_distribution: proficiencyDistribution,
                related_skills: relatedSkills,
                growth_trend: await this._calculateGrowthTrend(skillId)
            };
        } catch (error) {
            this.logger.error('Error in getSkillMarketDemand:', error);
            throw new AppError(error.message || 'Failed to get market demand', error.statusCode || 500);
        }
    }

    // ============== SKILL GAP ANALYSIS ==============

    async getSkillGapAnalysis(companyId = null, location = null) {
        try {
            // Get demanded skills from job postings
            let jobMatch = { status: 'open' };
            if (companyId) {
                jobMatch.company_id = companyId;
            }

            const demandedSkills = await JobSkillRequirement.aggregate([
                {
                    $lookup: {
                        from: 'jobs',
                        localField: 'job_id',
                        foreignField: '_id',
                        as: 'job'
                    }
                },
                {
                    $unwind: '$job'
                },
                {
                    $match: jobMatch
                },
                {
                    $lookup: {
                        from: 'skills',
                        localField: 'skill_id',
                        foreignField: '_id',
                        as: 'skill'
                    }
                },
                {
                    $unwind: '$skill'
                },
                {
                    $group: {
                        _id: '$skill_id',
                        skill_name: { $first: '$skill.name' },
                        demand_count: { $sum: 1 }
                    }
                }
            ]);

            const skillGaps = [];

            for (const demandedSkill of demandedSkills) {
                // Get available candidates with this skill
                let candidateMatch = { skill_id: demandedSkill._id };

                if (location) {
                    // Filter by candidate location
                    const candidatesWithSkill = await CandidateSkill.aggregate([
                        {
                            $match: { skill_id: demandedSkill._id }
                        },
                        {
                            $lookup: {
                                from: 'candidateprofiles',
                                localField: 'candidate_id',
                                foreignField: '_id',
                                as: 'candidate'
                            }
                        },
                        {
                            $unwind: '$candidate'
                        },
                        {
                            $match: {
                                'candidate.city': { $regex: location, $options: 'i' }
                            }
                        },
                        {
                            $count: 'count'
                        }
                    ]);

                    const supplyCount = candidatesWithSkill.length > 0 ? candidatesWithSkill[0].count : 0;
                    const gap = demandedSkill.demand_count - supplyCount;

                    if (gap > 0) {
                        skillGaps.push({
                            skill_id: demandedSkill._id,
                            skill_name: demandedSkill.skill_name,
                            demand: demandedSkill.demand_count,
                            supply: supplyCount,
                            gap: gap,
                            gap_percentage: (gap / demandedSkill.demand_count * 100),
                            severity: this._determineGapSeverity(gap, demandedSkill.demand_count)
                        });
                    }
                } else {
                    const supplyCount = await CandidateSkill.countDocuments({ skill_id: demandedSkill._id });
                    const gap = demandedSkill.demand_count - supplyCount;

                    if (gap > 0) {
                        skillGaps.push({
                            skill_id: demandedSkill._id,
                            skill_name: demandedSkill.skill_name,
                            demand: demandedSkill.demand_count,
                            supply: supplyCount,
                            gap: gap,
                            gap_percentage: (gap / demandedSkill.demand_count * 100),
                            severity: this._determineGapSeverity(gap, demandedSkill.demand_count)
                        });
                    }
                }
            }

            // Sort by gap severity
            skillGaps.sort((a, b) => b.gap - a.gap);

            return {
                total_skills_analyzed: demandedSkills.length,
                skills_with_gaps: skillGaps.length,
                critical_gaps: skillGaps.filter(s => s.severity === 'critical'),
                moderate_gaps: skillGaps.filter(s => s.severity === 'moderate'),
                low_gaps: skillGaps.filter(s => s.severity === 'low'),
                top_gaps: skillGaps.slice(0, 10)
            };
        } catch (error) {
            this.logger.error('Error in getSkillGapAnalysis:', error);
            throw new AppError('Failed to analyze skill gaps', 500);
        }
    }

    // ============== SKILL SUGGESTIONS ==============

    async suggestSkillsForCandidate(candidateId, limit = 10) {
        try {
            // Get candidate's current skills
            const currentSkills = await CandidateSkill.find({ candidate_id: candidateId });
            const currentSkillIds = currentSkills.map(s => s.skill_id);

            if (!currentSkillIds.length) {
                // Return most in-demand skills
                return await this._getMostDemandedSkills(limit);
            }

            // Find skills commonly paired with candidate's skills
            const pairedSkills = await JobSkillRequirement.aggregate([
                {
                    $match: {
                        skill_id: { $in: currentSkillIds }
                    }
                },
                {
                    $lookup: {
                        from: 'jobskillrequirements',
                        localField: 'job_id',
                        foreignField: 'job_id',
                        as: 'paired_requirements'
                    }
                },
                {
                    $unwind: '$paired_requirements'
                },
                {
                    $match: {
                        'paired_requirements.skill_id': { $nin: currentSkillIds }
                    }
                },
                {
                    $lookup: {
                        from: 'skills',
                        localField: 'paired_requirements.skill_id',
                        foreignField: '_id',
                        as: 'skill'
                    }
                },
                {
                    $unwind: '$skill'
                },
                {
                    $group: {
                        _id: '$paired_requirements.skill_id',
                        skill_name: { $first: '$skill.name' },
                        co_occurrence: { $sum: 1 }
                    }
                },
                {
                    $sort: { co_occurrence: -1 }
                },
                {
                    $limit: limit * 2
                }
            ]);

            const suggestions = [];
            for (const pairedSkill of pairedSkills) {
                // Get market demand
                const demand = await JobSkillRequirement.aggregate([
                    {
                        $lookup: {
                            from: 'jobs',
                            localField: 'job_id',
                            foreignField: '_id',
                            as: 'job'
                        }
                    },
                    {
                        $unwind: '$job'
                    },
                    {
                        $match: {
                            skill_id: pairedSkill._id,
                            'job.status': 'open'
                        }
                    },
                    {
                        $count: 'count'
                    }
                ]);

                const marketDemand = demand.length > 0 ? demand[0].count : 0;
                const score = (pairedSkill.co_occurrence * 0.6 + marketDemand * 0.4);

                suggestions.push({
                    skill_id: pairedSkill._id,
                    skill_name: pairedSkill.skill_name,
                    reason: this._determineSuggestionReason(
                        pairedSkill.co_occurrence,
                        marketDemand,
                        currentSkillIds.length
                    ),
                    market_demand: marketDemand,
                    relevance_score: score,
                    learning_path: await this._suggestLearningPath(pairedSkill._id)
                });
            }

            // Sort by score and return top suggestions
            suggestions.sort((a, b) => b.relevance_score - a.relevance_score);
            return suggestions.slice(0, limit);
        } catch (error) {
            this.logger.error('Error in suggestSkillsForCandidate:', error);
            throw new AppError('Failed to suggest skills', 500);
        }
    }

    // ============== BULK OPERATIONS ==============

    async bulkImportSkills(skillsData, importedBy) {
        try {
            const results = {
                imported: 0,
                skipped: 0,
                errors: [],
                created_skills: []
            };

            for (const skillData of skillsData) {
                try {
                    const skillName = skillData.name?.trim();
                    if (!skillName) {
                        results.errors.push('Empty skill name');
                        results.skipped += 1;
                        continue;
                    }

                    // Check if exists
                    const existing = await Skill.findOne({ name: skillName });
                    if (existing) {
                        results.skipped += 1;
                        continue;
                    }

                    // Create skill
                    const created = await Skill.create({
                        name: skillName,
                        description: skillData.description,
                        category_id: skillData.category_id,
                        skill_type: skillData.skill_type || 'technical'
                    });

                    results.created_skills.push(created.name);
                    results.imported += 1;

                } catch (error) {
                    results.errors.push(`Error importing ${skillData.name}: ${error.message}`);
                    results.skipped += 1;
                }
            }

            // Log import
            this.logAction('skills_bulk_imported', {
                user_id: importedBy,
                imported: results.imported,
                skipped: results.skipped,
                total: skillsData.length
            });

            return results;
        } catch (error) {
            this.logger.error('Error in bulkImportSkills:', error);
            throw new AppError('Failed to bulk import skills', 500);
        }
    }

    // ============== CATEGORY MANAGEMENT ==============

    async getSkillCategoriesWithSearch(filters = {}) {
        try {
            const { query, is_active, skip = 0, limit = 50 } = filters;

            let dbQuery = SkillCategory.find();

            // Apply filters
            if (query) {
                dbQuery = dbQuery.regex('name', new RegExp(query, 'i'));
            }

            if (is_active !== undefined) {
                dbQuery = dbQuery.where('is_active', is_active);
            }

            // Get total count
            const total = await SkillCategory.countDocuments(dbQuery.getQuery());

            // Apply pagination and ordering
            const categories = await dbQuery
                .sort({ name: 1 })
                .skip(skip)
                .limit(limit)
                .lean();

            return { categories, total };
        } catch (error) {
            this.logger.error('Error in getSkillCategoriesWithSearch:', error);
            throw new AppError('Failed to retrieve skill categories', 500);
        }
    }

    // ============== HELPER METHODS ==============

    async _getRelatedSkills(skillId, limit = 5) {
        try {
            const related = await JobSkillRequirement.aggregate([
                {
                    $match: { skill_id: skillId }
                },
                {
                    $lookup: {
                        from: 'jobskillrequirements',
                        localField: 'job_id',
                        foreignField: 'job_id',
                        as: 'related_requirements'
                    }
                },
                {
                    $unwind: '$related_requirements'
                },
                {
                    $match: {
                        'related_requirements.skill_id': { $ne: skillId }
                    }
                },
                {
                    $lookup: {
                        from: 'skills',
                        localField: 'related_requirements.skill_id',
                        foreignField: '_id',
                        as: 'skill'
                    }
                },
                {
                    $unwind: '$skill'
                },
                {
                    $group: {
                        _id: '$related_requirements.skill_id',
                        skill_name: { $first: '$skill.name' },
                        correlation_strength: { $sum: 1 }
                    }
                },
                {
                    $sort: { correlation_strength: -1 }
                },
                {
                    $limit: limit
                }
            ]);

            return related.map(r => ({
                skill_id: r._id,
                skill_name: r.skill_name,
                correlation_strength: r.correlation_strength
            }));
        } catch (error) {
            this.logger.error('Error in _getRelatedSkills:', error);
            return [];
        }
    }

    _determineMarketStatus(demand, supply) {
        if (demand === 0) {
            return 'no_demand';
        }

        const ratio = supply / demand;

        if (ratio < 0.5) {
            return 'high_demand_low_supply';
        } else if (ratio < 1.0) {
            return 'moderate_demand';
        } else if (ratio < 2.0) {
            return 'balanced';
        } else {
            return 'oversupplied';
        }
    }

    async _calculateGrowthTrend(skillId, periods = 6) {
        try {
            const trend = [];
            const currentDate = new Date();

            for (let i = 0; i < periods; i++) {
                const periodStart = new Date(currentDate.getTime() - 30 * (i + 1) * 24 * 60 * 60 * 1000);
                const periodEnd = new Date(currentDate.getTime() - 30 * i * 24 * 60 * 60 * 1000);

                const demand = await JobSkillRequirement.aggregate([
                    {
                        $lookup: {
                            from: 'jobs',
                            localField: 'job_id',
                            foreignField: '_id',
                            as: 'job'
                        }
                    },
                    {
                        $unwind: '$job'
                    },
                    {
                        $match: {
                            skill_id: skillId,
                            'job.created_at': { $gte: periodStart, $lt: periodEnd }
                        }
                    },
                    {
                        $count: 'count'
                    }
                ]);

                trend.push({
                    period: periodEnd.toISOString().slice(0, 7),
                    demand: demand.length > 0 ? demand[0].count : 0
                });
            }

            return trend.reverse();
        } catch (error) {
            this.logger.error('Error in _calculateGrowthTrend:', error);
            return [];
        }
    }

    _determineGapSeverity(gap, demand) {
        if (demand === 0) {
            return 'none';
        }

        const gapRatio = gap / demand;

        if (gapRatio > 0.7) {
            return 'critical';
        } else if (gapRatio > 0.4) {
            return 'moderate';
        } else {
            return 'low';
        }
    }

    async _getMostDemandedSkills(limit) {
        try {
            const demanded = await JobSkillRequirement.aggregate([
                {
                    $lookup: {
                        from: 'jobs',
                        localField: 'job_id',
                        foreignField: '_id',
                        as: 'job'
                    }
                },
                {
                    $unwind: '$job'
                },
                {
                    $match: {
                        'job.status': 'open'
                    }
                },
                {
                    $lookup: {
                        from: 'skills',
                        localField: 'skill_id',
                        foreignField: '_id',
                        as: 'skill'
                    }
                },
                {
                    $unwind: '$skill'
                },
                {
                    $group: {
                        _id: '$skill_id',
                        skill_name: { $first: '$skill.name' },
                        demand: { $sum: 1 }
                    }
                },
                {
                    $sort: { demand: -1 }
                },
                {
                    $limit: limit
                }
            ]);

            return demanded.map(s => ({
                skill_id: s._id,
                skill_name: s.skill_name,
                market_demand: s.demand,
                reason: 'High market demand'
            }));
        } catch (error) {
            this.logger.error('Error in _getMostDemandedSkills:', error);
            return [];
        }
    }

    _determineSuggestionReason(coOccurrence, demand, currentSkillCount) {
        if (demand > 50) {
            return 'High market demand';
        } else if (coOccurrence > 20) {
            return 'Complements your current skills';
        } else if (currentSkillCount < 5) {
            return 'Builds foundational skillset';
        } else {
            return 'Career advancement opportunity';
        }
    }

    async _suggestLearningPath(skillId) {
        // This would integrate with learning resources
        return {
            estimated_time: '2-3 months',
            difficulty: 'intermediate',
            resources: [
                'Online courses available',
                'Practice projects recommended',
                'Certification options'
            ]
        };
    }

    logAction(action, details = {}) {
        this.logger.info(`Skills Service - ${action}`, details);
    }
}

module.exports = new SkillsService(); 