const createError = require('http-errors');
const { CandidateProfile, Skill, Job, User } = require('../models/mongodb');

class CandidatesController {
    // Get all candidates with filtering
    async getAllCandidates(req, res, next) {
        try {
            const {
                search,
                skills,
                experience_min,
                experience_max,
                locations,
                page = 1,
                page_size = 10
            } = req.query;

            // Build query
            let query = {};

            if (search) {
                query.$or = [
                    { summary: { $regex: search, $options: 'i' } },
                    { location: { $regex: search, $options: 'i' } }
                ];
            }

            if (experience_min || experience_max) {
                query.years_of_experience = {};
                if (experience_min) query.years_of_experience.$gte = parseInt(experience_min);
                if (experience_max) query.years_of_experience.$lte = parseInt(experience_max);
            }

            if (locations && Array.isArray(locations)) {
                query.location = { $in: locations };
            }

            // Build skills filter
            if (skills && Array.isArray(skills)) {
                const skillDocs = await Skill.find({ name: { $in: skills } });
                const skillIds = skillDocs.map(s => s._id);
                query['skills.skill_id'] = { $in: skillIds };
            }

            // Pagination
            const skip = (parseInt(page) - 1) * parseInt(page_size);
            const limit = parseInt(page_size);

            // Execute query
            const [candidates, total] = await Promise.all([
                CandidateProfile.find(query)
                    .populate('user_id', 'firstName lastName email')
                    .populate('skills.skill_id')
                    .skip(skip)
                    .limit(limit)
                    .sort('-created_at'),
                CandidateProfile.countDocuments(query)
            ]);

            res.json({
                candidates,
                total,
                page: parseInt(page),
                page_size: parseInt(page_size),
                total_pages: Math.ceil(total / parseInt(page_size))
            });
        } catch (error) {
            next(error);
        }
    }

    // Get candidate by ID
    async getCandidateById(req, res, next) {
        try {
            const candidate = await CandidateProfile.findById(req.params.id)
                .populate('user_id', 'firstName lastName email phoneNumber')
                .populate('skills.skill_id');

            if (!candidate) {
                throw createError.NotFound('Candidate not found');
            }

            res.json(candidate);
        } catch (error) {
            next(error);
        }
    }

    // Get current user's profile
    async getMyProfile(req, res, next) {
        try {
            const profile = await CandidateProfile.findOne({ user_id: req.user.id })
                .populate('user_id', 'firstName lastName email phoneNumber')
                .populate('skills.skill_id');

            if (!profile) {
                throw createError.NotFound('Profile not found');
            }

            res.json(profile);
        } catch (error) {
            next(error);
        }
    }

    // Create profile
    async createProfile(req, res, next) {
        try {
            // Check if profile already exists
            const existingProfile = await CandidateProfile.findOne({ user_id: req.user.id });
            if (existingProfile) {
                throw createError.Conflict('Profile already exists');
            }

            const profile = new CandidateProfile({
                user_id: req.user.id,
                ...req.body
            });

            await profile.save();
            
            const populatedProfile = await CandidateProfile.findById(profile._id)
                .populate('user_id', 'firstName lastName email phoneNumber')
                .populate('skills.skill_id');

            res.status(201).json(populatedProfile);
        } catch (error) {
            next(error);
        }
    }

    // Update profile
    async updateProfile(req, res, next) {
        try {
            const profile = await CandidateProfile.findOneAndUpdate(
                { user_id: req.user.id },
                { $set: req.body },
                { new: true, runValidators: true }
            )
            .populate('user_id', 'firstName lastName email phoneNumber')
            .populate('skills.skill_id');

            if (!profile) {
                throw createError.NotFound('Profile not found');
            }

            res.json(profile);
        } catch (error) {
            next(error);
        }
    }

    // Add education
    async addEducation(req, res, next) {
        try {
            const profile = await CandidateProfile.findOneAndUpdate(
                { user_id: req.user.id },
                { $push: { education: req.body } },
                { new: true, runValidators: true }
            )
            .populate('user_id', 'firstName lastName email phoneNumber')
            .populate('skills.skill_id');

            if (!profile) {
                throw createError.NotFound('Profile not found');
            }

            res.json(profile);
        } catch (error) {
            next(error);
        }
    }

    // Update education
    async updateEducation(req, res, next) {
        try {
            const profile = await CandidateProfile.findOneAndUpdate(
                { 
                    user_id: req.user.id,
                    'education._id': req.params.educationId
                },
                { 
                    $set: { 
                        'education.$': { ...req.body, _id: req.params.educationId }
                    }
                },
                { new: true, runValidators: true }
            )
            .populate('user_id', 'firstName lastName email phoneNumber')
            .populate('skills.skill_id');

            if (!profile) {
                throw createError.NotFound('Education entry not found');
            }

            res.json(profile);
        } catch (error) {
            next(error);
        }
    }

    // Delete education
    async deleteEducation(req, res, next) {
        try {
            const profile = await CandidateProfile.findOneAndUpdate(
                { user_id: req.user.id },
                { $pull: { education: { _id: req.params.educationId } } },
                { new: true }
            )
            .populate('user_id', 'firstName lastName email phoneNumber')
            .populate('skills.skill_id');

            if (!profile) {
                throw createError.NotFound('Profile not found');
            }

            res.json(profile);
        } catch (error) {
            next(error);
        }
    }

    // Add work experience
    async addExperience(req, res, next) {
        try {
            const profile = await CandidateProfile.findOneAndUpdate(
                { user_id: req.user.id },
                { $push: { work_experience: req.body } },
                { new: true, runValidators: true }
            )
            .populate('user_id', 'firstName lastName email phoneNumber')
            .populate('skills.skill_id');

            if (!profile) {
                throw createError.NotFound('Profile not found');
            }

            res.json(profile);
        } catch (error) {
            next(error);
        }
    }

    // Update work experience
    async updateExperience(req, res, next) {
        try {
            const profile = await CandidateProfile.findOneAndUpdate(
                { 
                    user_id: req.user.id,
                    'work_experience._id': req.params.experienceId
                },
                { 
                    $set: { 
                        'work_experience.$': { ...req.body, _id: req.params.experienceId }
                    }
                },
                { new: true, runValidators: true }
            )
            .populate('user_id', 'firstName lastName email phoneNumber')
            .populate('skills.skill_id');

            if (!profile) {
                throw createError.NotFound('Experience entry not found');
            }

            res.json(profile);
        } catch (error) {
            next(error);
        }
    }

    // Delete work experience
    async deleteExperience(req, res, next) {
        try {
            const profile = await CandidateProfile.findOneAndUpdate(
                { user_id: req.user.id },
                { $pull: { work_experience: { _id: req.params.experienceId } } },
                { new: true }
            )
            .populate('user_id', 'firstName lastName email phoneNumber')
            .populate('skills.skill_id');

            if (!profile) {
                throw createError.NotFound('Profile not found');
            }

            res.json(profile);
        } catch (error) {
            next(error);
        }
    }

    // Update skills
    async updateSkills(req, res, next) {
        try {
            const { skills } = req.body;

            // Validate skills exist
            const skillIds = skills.map(s => s.skill_id);
            const existingSkills = await Skill.find({ _id: { $in: skillIds } });
            
            if (existingSkills.length !== skillIds.length) {
                throw createError.BadRequest('One or more skills not found');
            }

            const profile = await CandidateProfile.findOneAndUpdate(
                { user_id: req.user.id },
                { $set: { skills } },
                { new: true, runValidators: true }
            )
            .populate('user_id', 'firstName lastName email phoneNumber')
            .populate('skills.skill_id');

            if (!profile) {
                throw createError.NotFound('Profile not found');
            }

            res.json(profile);
        } catch (error) {
            next(error);
        }
    }

    // Remove skill
    async removeSkill(req, res, next) {
        try {
            const profile = await CandidateProfile.findOneAndUpdate(
                { user_id: req.user.id },
                { $pull: { skills: { skill_id: req.params.skillId } } },
                { new: true }
            )
            .populate('user_id', 'firstName lastName email phoneNumber')
            .populate('skills.skill_id');

            if (!profile) {
                throw createError.NotFound('Profile not found');
            }

            res.json(profile);
        } catch (error) {
            next(error);
        }
    }

    // Update preferences
    async updatePreferences(req, res, next) {
        try {
            const profile = await CandidateProfile.findOneAndUpdate(
                { user_id: req.user.id },
                { $set: { job_preferences: req.body } },
                { new: true, runValidators: true }
            )
            .populate('user_id', 'firstName lastName email phoneNumber')
            .populate('skills.skill_id');

            if (!profile) {
                throw createError.NotFound('Profile not found');
            }

            res.json(profile);
        } catch (error) {
            next(error);
        }
    }

    // Update notification settings
    async updateNotificationSettings(req, res, next) {
        try {
            const profile = await CandidateProfile.findOneAndUpdate(
                { user_id: req.user.id },
                { $set: { notification_settings: req.body } },
                { new: true, runValidators: true }
            )
            .populate('user_id', 'firstName lastName email phoneNumber')
            .populate('skills.skill_id');

            if (!profile) {
                throw createError.NotFound('Profile not found');
            }

            res.json(profile);
        } catch (error) {
            next(error);
        }
    }

    // Get matching jobs
    async getMatchingJobs(req, res, next) {
        try {
            const profile = await CandidateProfile.findOne({ user_id: req.user.id });
            if (!profile) {
                throw createError.NotFound('Profile not found');
            }

            // Build job query based on candidate preferences
            let query = { status: 'active' };

            if (profile.job_preferences) {
                const prefs = profile.job_preferences;
                
                if (prefs.desired_job_types?.length > 0) {
                    query.job_type = { $in: prefs.desired_job_types };
                }
                
                if (prefs.desired_locations?.length > 0) {
                    query.$or = [
                        { location: { $in: prefs.desired_locations } },
                        { remote_type: { $in: ['remote', 'flexible'] } }
                    ];
                }

                if (prefs.desired_salary_min) {
                    query['salary_range.max'] = { $gte: prefs.desired_salary_min };
                }
            }

            // Match by skills
            if (profile.skills?.length > 0) {
                const candidateSkillIds = profile.skills.map(s => s.skill_id.toString());
                query['skills_required.skill_id'] = { $in: candidateSkillIds };
            }

            const jobs = await Job.find(query)
                .populate('company_id', 'name location logo_url')
                .populate('skills_required.skill_id')
                .limit(20)
                .sort('-published_at');

            res.json({ jobs });
        } catch (error) {
            next(error);
        }
    }

    // Get recommended jobs
    async getRecommendedJobs(req, res, next) {
        try {
            const profile = await CandidateProfile.findOne({ user_id: req.user.id });
            if (!profile) {
                throw createError.NotFound('Profile not found');
            }

            // Get all active jobs
            const jobs = await Job.find({ status: 'active' })
                .populate('company_id', 'name location logo_url')
                .populate('skills_required.skill_id');

            // Calculate match scores
            const recommendedJobs = jobs.map(job => {
                let score = 0;

                // Skills match
                if (profile.skills?.length > 0 && job.skills_required?.length > 0) {
                    const candidateSkillIds = profile.skills.map(s => s.skill_id.toString());
                    const matchingSkills = job.skills_required.filter(req => 
                        candidateSkillIds.includes(req.skill_id._id.toString())
                    );
                    score += matchingSkills.length * 10;
                }

                // Experience match
                if (job.years_of_experience_min <= profile.years_of_experience) {
                    score += 5;
                }

                // Location match
                if (profile.job_preferences?.desired_locations?.includes(job.location)) {
                    score += 5;
                }

                // Remote preference match
                if (profile.job_preferences?.remote_preference === job.remote_type) {
                    score += 3;
                }

                return { job, match_score: score };
            });

            // Sort by score and return top matches
            const topMatches = recommendedJobs
                .filter(r => r.match_score > 0)
                .sort((a, b) => b.match_score - a.match_score)
                .slice(0, 10);

            res.json({ recommendations: topMatches });
        } catch (error) {
            next(error);
        }
    }

    // Get application analytics
    async getApplicationAnalytics(req, res, next) {
        try {
            // This would integrate with an applications collection
            // For now, return mock data
            res.json({
                total_applications: 0,
                application_status_counts: {
                    pending: 0,
                    reviewed: 0,
                    shortlisted: 0,
                    rejected: 0
                },
                response_rate: 0,
                average_response_time: 0,
                applications_over_time: []
            });
        } catch (error) {
            next(error);
        }
    }

    // Get profile views
    async getProfileViews(req, res, next) {
        try {
            // This would integrate with a profile views tracking system
            // For now, return mock data
            res.json({
                total_views: 0,
                views_this_week: 0,
                views_this_month: 0,
                view_sources: {
                    search: 0,
                    direct: 0,
                    job_applications: 0
                }
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = new CandidatesController();