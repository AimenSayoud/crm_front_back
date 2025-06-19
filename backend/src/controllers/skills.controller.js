const createError = require('http-errors');
const { Skill, CandidateProfile, Job } = require('../models/mongodb');

class SkillsController {
    // Get all skills with search
    async getSkillsWithSearch(req, res, next) {
        try {
            const { search, category, is_technical, page = 1, page_size = 50 } = req.query;

            // Build query
            let query = { is_active: true };

            if (search) {
                query.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { aliases: { $in: [new RegExp(search, 'i')] } }
                ];
            }

            if (category) query.category = category;
            if (is_technical !== undefined) query.is_technical = is_technical === 'true';

            // Pagination
            const skip = (parseInt(page) - 1) * parseInt(page_size);
            const limit = parseInt(page_size);

            // Execute query
            const [skills, total] = await Promise.all([
                Skill.find(query)
                    .skip(skip)
                    .limit(limit)
                    .sort('name'),
                Skill.countDocuments(query)
            ]);

            res.json({
                skills,
                total,
                page: parseInt(page),
                page_size: parseInt(page_size),
                total_pages: Math.ceil(total / parseInt(page_size))
            });
        } catch (error) {
            next(error);
        }
    }

    // Create skill with category
    async createSkillWithCategory(req, res, next) {
        try {
            const { skill, category_name } = req.body;
            
            // If category_name is provided, set it in the skill
            if (category_name) {
                skill.category = category_name;
            }

            const newSkill = new Skill(skill);
            await newSkill.save();
            res.status(201).json(newSkill);
        } catch (error) {
            if (error.code === 11000) {
                next(createError.Conflict('Skill already exists'));
            } else {
                next(error);
            }
        }
    }

    // Create skill category (returns existing categories)
    async createSkillCategory(req, res, next) {
        try {
            // In MongoDB version, categories are part of the skill document
            // Return existing categories
            const categories = await Skill.distinct('category', { is_active: true });
            
            res.json({ 
                message: 'Category functionality is built into skills',
                existing_categories: categories 
            });
        } catch (error) {
            next(error);
        }
    }

    // Get skill categories with search
    async getSkillCategoriesWithSearch(req, res, next) {
        try {
            const categories = await Skill.distinct('category', { is_active: true });
            
            // Get count for each category
            const categoriesWithCount = await Promise.all(
                categories.map(async (category) => {
                    const count = await Skill.countDocuments({ category, is_active: true });
                    return { category, count };
                })
            );

            res.json({ 
                categories: categoriesWithCount,
                total: categoriesWithCount.length
            });
        } catch (error) {
            next(error);
        }
    }

    // Merge duplicate skills
    async mergeDuplicateSkills(req, res, next) {
        try {
            const { primary_skill_id, duplicate_skill_ids, merged_by } = req.body;

            // Validate primary skill exists
            const primarySkill = await Skill.findById(primary_skill_id);
            if (!primarySkill) {
                throw createError.NotFound('Primary skill not found');
            }

            // Validate duplicate skills exist
            const duplicateSkills = await Skill.find({ _id: { $in: duplicate_skill_ids } });
            if (duplicateSkills.length !== duplicate_skill_ids.length) {
                throw createError.NotFound('One or more duplicate skills not found');
            }

            // Update all references from duplicates to primary
            for (const dupId of duplicate_skill_ids) {
                await Promise.all([
                    // Update candidate skills
                    CandidateProfile.updateMany(
                        { 'skills.skill_id': dupId },
                        { $set: { 'skills.$.skill_id': primary_skill_id } }
                    ),
                    // Update job requirements
                    Job.updateMany(
                        { 'skills_required.skill_id': dupId },
                        { $set: { 'skills_required.$.skill_id': primary_skill_id } }
                    )
                ]);
            }

            // Add duplicate skill names as aliases
            const allAliases = duplicateSkills.reduce((aliases, skill) => {
                aliases.push(skill.name);
                if (skill.aliases) aliases.push(...skill.aliases);
                return aliases;
            }, []);

            primarySkill.aliases = [...new Set([...primarySkill.aliases, ...allAliases])];
            
            // Update usage count
            const totalUsage = duplicateSkills.reduce((sum, skill) => sum + skill.usage_count, 0);
            primarySkill.usage_count += totalUsage;
            
            await primarySkill.save();

            // Delete duplicate skills
            await Skill.deleteMany({ _id: { $in: duplicate_skill_ids } });

            res.json({ 
                message: 'Skills merged successfully',
                merged_skill: primarySkill
            });
        } catch (error) {
            next(error);
        }
    }

    // Get trending skills
    async getTrendingSkills(req, res, next) {
        try {
            const { days = 30, limit = 20 } = req.query;

            // Get skills sorted by usage in recent jobs
            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(days));

            const trendingSkills = await Job.aggregate([
                { $match: { 
                    published_at: { $gte: startDate },
                    status: 'active'
                }},
                { $unwind: '$skills_required' },
                { $group: { 
                    _id: '$skills_required.skill_id',
                    count: { $sum: 1 }
                }},
                { $sort: { count: -1 } },
                { $limit: parseInt(limit) },
                { $lookup: {
                    from: 'skills',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'skill'
                }},
                { $unwind: '$skill' },
                { $project: {
                    skill_id: '$_id',
                    skill_name: '$skill.name',
                    category: '$skill.category',
                    demand_count: '$count',
                    demand_level: '$skill.demand_level'
                }}
            ]);

            res.json(trendingSkills);
        } catch (error) {
            next(error);
        }
    }

    // Get skill market demand
    async getSkillMarketDemand(req, res, next) {
        try {
            const { skill_id } = req.params;

            const skill = await Skill.findById(skill_id);
            if (!skill) {
                throw createError.NotFound('Skill not found');
            }

            // Count jobs requiring this skill
            const jobCount = await Job.countDocuments({
                'skills_required.skill_id': skill_id,
                status: 'active'
            });

            // Count candidates with this skill
            const candidateCount = await CandidateProfile.countDocuments({
                'skills.skill_id': skill_id
            });

            // Get average proficiency required in jobs
            const jobProficiency = await Job.aggregate([
                { $match: { 
                    'skills_required.skill_id': skill._id,
                    status: 'active'
                }},
                { $unwind: '$skills_required' },
                { $match: { 'skills_required.skill_id': skill._id }},
                { $group: {
                    _id: null,
                    avg_proficiency: { $avg: '$skills_required.proficiency_level' }
                }}
            ]);

            res.json({
                skill_id: skill._id,
                skill_name: skill.name,
                category: skill.category,
                active_job_openings: jobCount,
                available_candidates: candidateCount,
                supply_demand_ratio: candidateCount > 0 ? (jobCount / candidateCount).toFixed(2) : 'N/A',
                average_required_proficiency: jobProficiency[0]?.avg_proficiency?.toFixed(2) || 0,
                demand_level: skill.demand_level
            });
        } catch (error) {
            next(error);
        }
    }

    // Get skill gap analysis
    async getSkillGapAnalysis(req, res, next) {
        try {
            const { company_id, location } = req.query;

            let jobQuery = { status: 'active' };
            if (company_id) jobQuery.company_id = company_id;
            if (location) jobQuery.location = { $regex: location, $options: 'i' };

            // Get most demanded skills in jobs
            const jobSkills = await Job.aggregate([
                { $match: jobQuery },
                { $unwind: '$skills_required' },
                { $group: { 
                    _id: '$skills_required.skill_id',
                    demand_count: { $sum: 1 },
                    avg_proficiency: { $avg: '$skills_required.proficiency_level' }
                }},
                { $sort: { demand_count: -1 } },
                { $limit: 20 }
            ]);

            // Get candidate skill supply
            let candidateQuery = {};
            if (location) candidateQuery.location = { $regex: location, $options: 'i' };

            const candidateSkills = await CandidateProfile.aggregate([
                { $match: candidateQuery },
                { $unwind: '$skills' },
                { $group: {
                    _id: '$skills.skill_id',
                    supply_count: { $sum: 1 },
                    avg_proficiency: { $avg: '$skills.proficiency_level' }
                }}
            ]);

            // Create supply map
            const supplyMap = {};
            candidateSkills.forEach(cs => {
                supplyMap[cs._id.toString()] = cs;
            });

            // Calculate gaps
            const skillGaps = await Promise.all(
                jobSkills.map(async (js) => {
                    const skill = await Skill.findById(js._id);
                    const supply = supplyMap[js._id.toString()] || { supply_count: 0, avg_proficiency: 0 };
                    
                    return {
                        skill_name: skill?.name || 'Unknown',
                        skill_id: js._id,
                        demand_count: js.demand_count,
                        supply_count: supply.supply_count,
                        gap: js.demand_count - supply.supply_count,
                        gap_percentage: supply.supply_count > 0 ? 
                            ((js.demand_count - supply.supply_count) / js.demand_count * 100).toFixed(2) : 100,
                        demand_proficiency: js.avg_proficiency.toFixed(2),
                        supply_proficiency: supply.avg_proficiency.toFixed(2)
                    };
                })
            );

            // Sort by gap percentage
            skillGaps.sort((a, b) => b.gap_percentage - a.gap_percentage);

            res.json(skillGaps);
        } catch (error) {
            next(error);
        }
    }

    // Suggest skills for candidate
    async suggestSkillsForCandidate(req, res, next) {
        try {
            const { candidate_id } = req.params;
            const { limit = 10 } = req.query;
            
            const candidate = await CandidateProfile.findOne({ 
                $or: [
                    { _id: candidate_id },
                    { user_id: candidate_id }
                ]
            }).populate('skills.skill_id');

            if (!candidate) {
                throw createError.NotFound('Candidate profile not found');
            }

            // Get candidate's current skills
            const currentSkillIds = candidate.skills.map(s => s.skill_id._id);

            // Find related skills
            const relatedSkills = await Skill.find({
                _id: { $nin: currentSkillIds },
                is_active: true,
                $or: [
                    { related_skills: { $in: currentSkillIds } },
                    { category: { $in: candidate.skills.map(s => s.skill_id.category) } }
                ]
            }).limit(parseInt(limit));

            // Calculate relevance scores
            const suggestions = relatedSkills.map(skill => {
                let relevanceScore = 0;
                
                // Score based on related skills
                const relatedCount = skill.related_skills.filter(rs => 
                    currentSkillIds.some(cs => cs.toString() === rs.toString())
                ).length;
                relevanceScore += relatedCount * 10;

                // Score based on same category
                if (candidate.skills.some(s => s.skill_id.category === skill.category)) {
                    relevanceScore += 5;
                }

                // Score based on demand
                if (skill.demand_level === 'high' || skill.demand_level === 'very_high') {
                    relevanceScore += 3;
                }

                return {
                    skill_id: skill._id,
                    skill_name: skill.name,
                    category: skill.category,
                    relevance_score: relevanceScore,
                    demand_level: skill.demand_level,
                    reason: relatedCount > 0 ? 'Related to your current skills' : 'Popular in your skill category'
                };
            });

            // Sort by relevance score
            suggestions.sort((a, b) => b.relevance_score - a.relevance_score);

            res.json(suggestions);
        } catch (error) {
            next(error);
        }
    }

    // Bulk import skills
    async bulkImportSkills(req, res, next) {
        try {
            const { skills_data, imported_by } = req.body;

            if (!skills_data || !Array.isArray(skills_data)) {
                throw createError.BadRequest('skills_data array is required');
            }

            const results = {
                created: 0,
                updated: 0,
                errors: []
            };

            for (const skillData of skills_data) {
                try {
                    const existingSkill = await Skill.findOne({ 
                        name: skillData.name.toLowerCase() 
                    });

                    if (existingSkill) {
                        // Update existing skill
                        Object.assign(existingSkill, skillData);
                        await existingSkill.save();
                        results.updated++;
                    } else {
                        // Create new skill
                        const newSkill = new Skill(skillData);
                        await newSkill.save();
                        results.created++;
                    }
                } catch (error) {
                    results.errors.push({
                        skill: skillData.name,
                        error: error.message
                    });
                }
            }

            res.json(results);
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new SkillsController();