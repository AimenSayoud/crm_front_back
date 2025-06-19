const createError = require('http-errors');
const { Job, Company, CandidateProfile, Skill } = require('../models/mongodb');

class JobsController {
    // Get all jobs with filtering
    async getAllJobs(req, res, next) {
        try {
            const {
                search,
                job_type,
                experience_level,
                location,
                remote_type,
                skills,
                salary_min,
                salary_max,
                company_id,
                status = 'active',
                sort_by = 'published_at',
                sort_order = 'desc',
                page = 1,
                page_size = 10
            } = req.query;

            // Build query
            let query = { status };

            if (search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { requirements: { $regex: search, $options: 'i' } }
                ];
            }

            if (job_type) query.job_type = job_type;
            if (experience_level) query.experience_level = experience_level;
            if (location) query.location = { $regex: location, $options: 'i' };
            if (remote_type) query.remote_type = remote_type;
            if (company_id) query.company_id = company_id;

            // Salary range filter
            if (salary_min || salary_max) {
                query['salary_range.min'] = {};
                if (salary_min) query['salary_range.min'].$gte = parseInt(salary_min);
                if (salary_max) query['salary_range.max'] = { $lte: parseInt(salary_max) };
            }

            // Skills filter
            if (skills && Array.isArray(skills)) {
                const skillDocs = await Skill.find({ name: { $in: skills } });
                const skillIds = skillDocs.map(s => s._id);
                query['skills_required.skill_id'] = { $in: skillIds };
            }

            // Pagination
            const skip = (parseInt(page) - 1) * parseInt(page_size);
            const limit = parseInt(page_size);

            // Sort
            const sortOptions = {};
            sortOptions[sort_by] = sort_order === 'asc' ? 1 : -1;

            // Execute query
            const [jobs, total] = await Promise.all([
                Job.find(query)
                    .populate('company_id', 'name location logo_url industry')
                    .populate('skills_required.skill_id')
                    .skip(skip)
                    .limit(limit)
                    .sort(sortOptions),
                Job.countDocuments(query)
            ]);

            res.json({
                jobs,
                total,
                page: parseInt(page),
                page_size: parseInt(page_size),
                total_pages: Math.ceil(total / parseInt(page_size))
            });
        } catch (error) {
            next(error);
        }
    }

    // Get job by ID
    async getJobById(req, res, next) {
        try {
            const job = await Job.findById(req.params.id)
                .populate('company_id')
                .populate('posted_by', 'firstName lastName email')
                .populate('skills_required.skill_id');

            if (!job) {
                throw createError.NotFound('Job not found');
            }

            // Increment view count
            job.incrementViews();

            res.json(job);
        } catch (error) {
            next(error);
        }
    }

    // Get similar jobs
    async getSimilarJobs(req, res, next) {
        try {
            const job = await Job.findById(req.params.id);
            if (!job) {
                throw createError.NotFound('Job not found');
            }

            // Find similar jobs based on skills, job type, and experience level
            const query = {
                _id: { $ne: job._id },
                status: 'active',
                $or: [
                    { job_type: job.job_type },
                    { experience_level: job.experience_level },
                    { 'skills_required.skill_id': { $in: job.skills_required.map(s => s.skill_id) } }
                ]
            };

            const similarJobs = await Job.find(query)
                .populate('company_id', 'name location logo_url')
                .populate('skills_required.skill_id')
                .limit(5)
                .sort('-published_at');

            res.json({ similar_jobs: similarJobs });
        } catch (error) {
            next(error);
        }
    }

    // Create job
    async createJob(req, res, next) {
        try {
            // Verify company exists and user has permission
            const company = await Company.findById(req.body.company_id);
            if (!company) {
                throw createError.NotFound('Company not found');
            }

            if (req.user.role !== 'admin' && company.created_by.toString() !== req.user._id.toString()) {
                throw createError.Forbidden('You do not have permission to post jobs for this company');
            }

            const job = new Job({
                ...req.body,
                posted_by: req.user._id,
                status: 'draft'
            });

            await job.save();
            
            // Update company's active jobs count
            await company.updateActiveJobsCount();

            const populatedJob = await Job.findById(job._id)
                .populate('company_id', 'name location logo_url')
                .populate('skills_required.skill_id');

            res.status(201).json(populatedJob);
        } catch (error) {
            next(error);
        }
    }

    // Update job
    async updateJob(req, res, next) {
        try {
            const job = await Job.findById(req.params.id);
            if (!job) {
                throw createError.NotFound('Job not found');
            }

            // Check permission
            const company = await Company.findById(job.company_id);
            if (req.user.role !== 'admin' && company.created_by.toString() !== req.user._id.toString()) {
                throw createError.Forbidden('You do not have permission to update this job');
            }

            const updatedJob = await Job.findByIdAndUpdate(
                req.params.id,
                { $set: req.body },
                { new: true, runValidators: true }
            )
            .populate('company_id', 'name location logo_url')
            .populate('skills_required.skill_id');

            res.json(updatedJob);
        } catch (error) {
            next(error);
        }
    }

    // Delete job
    async deleteJob(req, res, next) {
        try {
            const job = await Job.findById(req.params.id);
            if (!job) {
                throw createError.NotFound('Job not found');
            }

            // Check permission
            const company = await Company.findById(job.company_id);
            if (req.user.role !== 'admin' && company.created_by.toString() !== req.user._id.toString()) {
                throw createError.Forbidden('You do not have permission to delete this job');
            }

            // Only allow deletion of draft or closed jobs
            if (!['draft', 'closed'].includes(job.status)) {
                throw createError.BadRequest('Cannot delete active or filled jobs');
            }

            await Job.findByIdAndDelete(req.params.id);
            
            // Update company's active jobs count
            await company.updateActiveJobsCount();

            res.status(204).send();
        } catch (error) {
            next(error);
        }
    }

    // Publish job
    async publishJob(req, res, next) {
        try {
            const job = await Job.findById(req.params.id);
            if (!job) {
                throw createError.NotFound('Job not found');
            }

            // Check permission
            const company = await Company.findById(job.company_id);
            if (req.user.role !== 'admin' && company.created_by.toString() !== req.user._id.toString()) {
                throw createError.Forbidden('You do not have permission to publish this job');
            }

            if (job.status !== 'draft') {
                throw createError.BadRequest('Only draft jobs can be published');
            }

            await job.publish();
            
            // Update company's active jobs count
            await company.updateActiveJobsCount();

            const publishedJob = await Job.findById(job._id)
                .populate('company_id', 'name location logo_url')
                .populate('skills_required.skill_id');

            res.json(publishedJob);
        } catch (error) {
            next(error);
        }
    }

    // Close job
    async closeJob(req, res, next) {
        try {
            const { filled = false } = req.body;
            
            const job = await Job.findById(req.params.id);
            if (!job) {
                throw createError.NotFound('Job not found');
            }

            // Check permission
            const company = await Company.findById(job.company_id);
            if (req.user.role !== 'admin' && company.created_by.toString() !== req.user._id.toString()) {
                throw createError.Forbidden('You do not have permission to close this job');
            }

            await job.close(filled);
            
            // Update company's active jobs count
            await company.updateActiveJobsCount();

            res.json(job);
        } catch (error) {
            next(error);
        }
    }

    // Pause job
    async pauseJob(req, res, next) {
        try {
            const job = await Job.findById(req.params.id);
            if (!job) {
                throw createError.NotFound('Job not found');
            }

            // Check permission
            const company = await Company.findById(job.company_id);
            if (req.user.role !== 'admin' && company.created_by.toString() !== req.user._id.toString()) {
                throw createError.Forbidden('You do not have permission to pause this job');
            }

            if (job.status !== 'active') {
                throw createError.BadRequest('Only active jobs can be paused');
            }

            job.status = 'paused';
            await job.save();
            
            // Update company's active jobs count
            await company.updateActiveJobsCount();

            res.json(job);
        } catch (error) {
            next(error);
        }
    }

    // Get job analytics
    async getJobAnalytics(req, res, next) {
        try {
            const job = await Job.findById(req.params.id);
            if (!job) {
                throw createError.NotFound('Job not found');
            }

            // Check permission
            const company = await Company.findById(job.company_id);
            if (req.user.role !== 'admin' && company.created_by.toString() !== req.user._id.toString()) {
                throw createError.Forbidden('You do not have permission to view analytics for this job');
            }

            // Calculate analytics
            const daysSincePublished = job.published_at ? 
                Math.floor((Date.now() - job.published_at.getTime()) / (1000 * 60 * 60 * 24)) : 0;

            res.json({
                job_id: job._id,
                title: job.title,
                status: job.status,
                published_at: job.published_at,
                days_active: daysSincePublished,
                views_count: job.views_count,
                applications_count: job.applications_count,
                average_views_per_day: daysSincePublished > 0 ? (job.views_count / daysSincePublished).toFixed(2) : 0,
                average_applications_per_day: daysSincePublished > 0 ? (job.applications_count / daysSincePublished).toFixed(2) : 0,
                conversion_rate: job.views_count > 0 ? ((job.applications_count / job.views_count) * 100).toFixed(2) + '%' : '0%'
            });
        } catch (error) {
            next(error);
        }
    }

    // Get recommended candidates for a job
    async getRecommendedCandidates(req, res, next) {
        try {
            const job = await Job.findById(req.params.id)
                .populate('skills_required.skill_id');
            
            if (!job) {
                throw createError.NotFound('Job not found');
            }

            // Check permission
            const company = await Company.findById(job.company_id);
            if (req.user.role !== 'admin' && company.created_by.toString() !== req.user._id.toString()) {
                throw createError.Forbidden('You do not have permission to view candidates for this job');
            }

            // Build query for matching candidates
            let candidateQuery = {};
            
            // Match by required skills
            if (job.skills_required.length > 0) {
                const requiredSkillIds = job.skills_required
                    .filter(s => s.is_required)
                    .map(s => s.skill_id._id);
                
                if (requiredSkillIds.length > 0) {
                    candidateQuery['skills.skill_id'] = { $in: requiredSkillIds };
                }
            }

            // Match by experience level
            if (job.years_of_experience_min) {
                candidateQuery.years_of_experience = { $gte: job.years_of_experience_min };
            }

            // Match by location preferences
            if (job.location && job.remote_type === 'onsite') {
                candidateQuery.$or = [
                    { location: { $regex: job.location, $options: 'i' } },
                    { 'job_preferences.relocation_willingness': true }
                ];
            }

            // Get matching candidates
            const candidates = await CandidateProfile.find(candidateQuery)
                .populate('user_id', 'firstName lastName email')
                .populate('skills.skill_id')
                .limit(20);

            // Calculate match scores
            const recommendedCandidates = candidates.map(candidate => {
                let score = 0;

                // Skills match score
                const candidateSkillIds = candidate.skills.map(s => s.skill_id._id.toString());
                job.skills_required.forEach(reqSkill => {
                    if (candidateSkillIds.includes(reqSkill.skill_id._id.toString())) {
                        score += reqSkill.is_required ? 10 : 5;
                    }
                });

                // Experience match
                if (candidate.years_of_experience >= job.years_of_experience_min) {
                    score += 5;
                }

                // Location match
                if (candidate.location === job.location || 
                    candidate.job_preferences?.relocation_willingness ||
                    job.remote_type !== 'onsite') {
                    score += 5;
                }

                return {
                    candidate,
                    match_score: score
                };
            });

            // Sort by match score
            recommendedCandidates.sort((a, b) => b.match_score - a.match_score);

            res.json({ 
                recommended_candidates: recommendedCandidates.slice(0, 10)
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new JobsController();