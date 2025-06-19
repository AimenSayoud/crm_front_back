const BaseController = require('./base.controller');
const { 
  Job, 
  JobSkillRequirement, 
  Skill, 
  Company,
  User,
  CandidateSkill,
  Application
} = require('../models/sql');

/**
 * Jobs Controller - Handles job posting and management operations
 */
class JobsController {
  constructor() {
    this.jobController = new BaseController(Job);
    this.jobSkillController = new BaseController(JobSkillRequirement);
  }

  /**
   * Get all jobs with advanced filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllJobs = async (req, res) => {
    try {
      const { 
        company_id,
        posted_by,
        location,
        contract_type,
        job_type,
        experience_level,
        is_remote,
        status,
        salary_min,
        salary_max,
        skills,
        posted_after,
        posted_before,
        search,
        page = 1, 
        limit = 10,
        sort = '-posting_date'
      } = req.query;
      
      // Build query
      const query = {};
      
      // Add company filter
      if (company_id) {
        query.company_id = company_id;
      }
      
      // Add poster filter
      if (posted_by) {
        query.posted_by = posted_by;
      }
      
      // Add location filter
      if (location) {
        query.location = { $regex: location, $options: 'i' };
      }
      
      // Add contract type filter
      if (contract_type) {
        query.contract_type = contract_type;
      }
      
      // Add job type filter
      if (job_type) {
        query.job_type = job_type;
      }
      
      // Add experience level filter
      if (experience_level) {
        query.experience_level = experience_level;
      }
      
      // Add remote work filter
      if (is_remote !== undefined) {
        query.is_remote = is_remote === 'true';
      }
      
      // Add status filter
      if (status) {
        query.status = status;
      } else {
        // By default, only show open jobs
        query.status = 'open';
      }
      
      // Add salary range filter
      if (salary_min || salary_max) {
        if (salary_min) {
          query.salary_max = { $gte: parseInt(salary_min, 10) };
        }
        if (salary_max) {
          query.salary_min = { $lte: parseInt(salary_max, 10) };
        }
      }
      
      // Add date range filter
      if (posted_after || posted_before) {
        query.posting_date = {};
        if (posted_after) {
          query.posting_date.$gte = new Date(posted_after);
        }
        if (posted_before) {
          query.posting_date.$lte = new Date(posted_before);
        }
      }
      
      // Add skills filter
      if (skills) {
        const skillsArray = skills.split(',').map(skill => skill.trim());
        
        // Get skill IDs from skill names
        const foundSkills = await Skill.find({ name: { $in: skillsArray } });
        const skillIds = foundSkills.map(skill => skill._id);
        
        // Find jobs with these skills
        const jobSkills = await JobSkillRequirement.find({ skill_id: { $in: skillIds } });
        const jobIds = [...new Set(jobSkills.map(js => js.job_id.toString()))];
        
        if (jobIds.length > 0) {
          query._id = { $in: jobIds };
        } else {
          // No jobs found with these skills
          return res.status(200).json({
            data: [],
            meta: { total: 0, page: 1, limit: limitNum, pages: 0 }
          });
        }
      }
      
      // Add search filter
      if (search) {
        query.$or = [
          { title: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { location: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Convert page and limit to numbers
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;
      
      // Execute query with pagination
      let jobs = await Job
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('company_id', 'name logo_url location')
        .populate('posted_by', 'first_name last_name');
      
      // Get total count for pagination
      const total = await Job.countDocuments(query);
      
      // Get skill requirements for each job
      for (let i = 0; i < jobs.length; i++) {
        const skillRequirements = await JobSkillRequirement.find({ job_id: jobs[i]._id })
          .populate('skill_id', 'name');
        
        jobs[i] = jobs[i].toObject();
        jobs[i].skill_requirements = skillRequirements;
      }
      
      return res.status(200).json({
        data: jobs,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error retrieving jobs',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Get job by ID with related data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getJobById = async (req, res) => {
    try {
      const { id } = req.params;
      const { include_applications } = req.query;
      
      // Find job
      const job = await Job.findById(id)
        .populate('company_id')
        .populate('posted_by', '-password_hash');
      
      if (!job) {
        return res.status(404).json({
          message: 'Job not found'
        });
      }
      
      // Get skill requirements
      const skillRequirements = await JobSkillRequirement.find({ job_id: id })
        .populate('skill_id');
      
      // Get applications if requested
      let applications = [];
      if (include_applications === 'true') {
        applications = await Application.find({ job_id: id })
          .populate({
            path: 'candidate_id',
            populate: {
              path: 'user_id',
              select: '-password_hash'
            }
          })
          .sort('-applied_at');
      }
      
      // Increment view count
      job.view_count += 1;
      await job.save();
      
      // Prepare response
      const jobData = job.toObject();
      jobData.skill_requirements = skillRequirements;
      
      if (include_applications === 'true') {
        jobData.applications = applications;
      }
      
      return res.status(200).json({
        data: jobData
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error retrieving job',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Create new job
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createJob = async (req, res) => {
    try {
      const {
        company_id,
        posted_by,
        title,
        description,
        responsibilities,
        requirements,
        location,
        contract_type,
        job_type,
        experience_level,
        is_remote,
        is_hybrid,
        salary_min,
        salary_max,
        salary_currency,
        status,
        posting_date,
        deadline_date,
        benefits,
        company_culture,
        requires_cover_letter,
        internal_notes,
        is_featured,
        skill_requirements
      } = req.body;
      
      // Verify company exists
      const company = await Company.findById(company_id);
      if (!company) {
        return res.status(404).json({
          message: 'Company not found'
        });
      }
      
      // Verify user exists
      const user = await User.findById(posted_by);
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }
      
      // Check if user has permission to post jobs for this company
      if (user.role === 'employer') {
        const employerProfile = await EmployerProfile.findOne({
          user_id: posted_by,
          company_id
        });
        
        if (!employerProfile) {
          return res.status(403).json({
            message: 'User is not an employer for this company'
          });
        }
        
        if (!employerProfile.can_post_jobs) {
          return res.status(403).json({
            message: 'User does not have permission to post jobs'
          });
        }
      } else if (!['admin', 'superadmin'].includes(user.role)) {
        return res.status(403).json({
          message: 'User does not have permission to post jobs'
        });
      }
      
      // Create job
      const newJob = new Job({
        company_id,
        posted_by,
        title,
        description,
        responsibilities: responsibilities || [],
        requirements: requirements || [],
        location,
        contract_type,
        job_type,
        experience_level,
        is_remote: is_remote || false,
        is_hybrid: is_hybrid || false,
        remote_option: is_remote || is_hybrid || false, // For backward compatibility
        salary_min,
        salary_max,
        salary_currency: salary_currency || 'GBP',
        status: status || 'draft',
        posting_date: posting_date || new Date(),
        deadline_date,
        benefits: benefits || [],
        company_culture,
        requires_cover_letter: requires_cover_letter || false,
        internal_notes,
        is_featured: is_featured || false,
        view_count: 0,
        application_count: 0
      });
      
      const savedJob = await newJob.save();
      
      // Add skill requirements if provided
      if (skill_requirements && Array.isArray(skill_requirements)) {
        for (const skillReq of skill_requirements) {
          // Verify skill exists
          const skill = await Skill.findById(skillReq.skill_id);
          if (!skill) {
            continue; // Skip invalid skills
          }
          
          // Create skill requirement
          const jobSkill = new JobSkillRequirement({
            job_id: savedJob._id,
            skill_id: skillReq.skill_id,
            is_required: skillReq.is_required !== undefined ? skillReq.is_required : true,
            proficiency_level: skillReq.proficiency_level,
            years_experience: skillReq.years_experience
          });
          
          await jobSkill.save();
        }
      }
      
      // Update company active jobs count if job is open
      if (savedJob.status === 'open') {
        company.active_jobs = (company.active_jobs || 0) + 1;
        await company.save();
      }
      
      // Update employer job posted count
      if (user.role === 'employer') {
        const employerProfile = await EmployerProfile.findOne({
          user_id: posted_by,
          company_id
        });
        
        if (employerProfile) {
          employerProfile.jobs_posted = (employerProfile.jobs_posted || 0) + 1;
          await employerProfile.save();
        }
      }
      
      return res.status(201).json({
        message: 'Job created successfully',
        data: savedJob
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error creating job',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Update job
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateJob = async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Find job
      const job = await Job.findById(id);
      if (!job) {
        return res.status(404).json({
          message: 'Job not found'
        });
      }
      
      // Check if status is changing from non-open to open
      const statusChangingToOpen = updateData.status === 'open' && job.status !== 'open';
      
      // Check if status is changing from open to non-open
      const statusChangingFromOpen = updateData.status && updateData.status !== 'open' && job.status === 'open';
      
      // Update job
      const updatedJob = await Job.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      // Update company active jobs count if status changed
      if (statusChangingToOpen || statusChangingFromOpen) {
        const company = await Company.findById(job.company_id);
        if (company) {
          if (statusChangingToOpen) {
            company.active_jobs = (company.active_jobs || 0) + 1;
          } else if (statusChangingFromOpen) {
            company.active_jobs = Math.max((company.active_jobs || 0) - 1, 0);
          }
          await company.save();
        }
      }
      
      return res.status(200).json({
        message: 'Job updated successfully',
        data: updatedJob
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error updating job',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Update job status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateJobStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status } = req.body;
      
      if (!status) {
        return res.status(400).json({
          message: 'Status is required'
        });
      }
      
      // Find job
      const job = await Job.findById(id);
      if (!job) {
        return res.status(404).json({
          message: 'Job not found'
        });
      }
      
      // Check if status is changing from non-open to open
      const statusChangingToOpen = status === 'open' && job.status !== 'open';
      
      // Check if status is changing from open to non-open
      const statusChangingFromOpen = status !== 'open' && job.status === 'open';
      
      // Update job status
      job.status = status;
      
      // If changing to filled, update filled date
      if (status === 'filled') {
        // You could add a filled_date field to the model if needed
      }
      
      await job.save();
      
      // Update company active jobs count if status changed
      if (statusChangingToOpen || statusChangingFromOpen) {
        const company = await Company.findById(job.company_id);
        if (company) {
          if (statusChangingToOpen) {
            company.active_jobs = (company.active_jobs || 0) + 1;
          } else if (statusChangingFromOpen) {
            company.active_jobs = Math.max((company.active_jobs || 0) - 1, 0);
          }
          await company.save();
        }
      }
      
      return res.status(200).json({
        message: `Job status updated to ${status}`,
        data: job
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error updating job status',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Add skill requirement to job
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  addSkillRequirement = async (req, res) => {
    try {
      const { jobId } = req.params;
      const { skill_id, is_required, proficiency_level, years_experience } = req.body;
      
      // Verify job exists
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({
          message: 'Job not found'
        });
      }
      
      // Verify skill exists
      const skill = await Skill.findById(skill_id);
      if (!skill) {
        return res.status(404).json({
          message: 'Skill not found'
        });
      }
      
      // Check if skill already added
      const existingSkill = await JobSkillRequirement.findOne({
        job_id: jobId,
        skill_id
      });
      
      if (existingSkill) {
        return res.status(409).json({
          message: 'Skill already added to job'
        });
      }
      
      // Create skill requirement
      const jobSkill = new JobSkillRequirement({
        job_id: jobId,
        skill_id,
        is_required: is_required !== undefined ? is_required : true,
        proficiency_level,
        years_experience
      });
      
      await jobSkill.save();
      
      return res.status(201).json({
        message: 'Skill requirement added successfully',
        data: {
          ...jobSkill.toObject(),
          skill_name: skill.name
        }
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error adding skill requirement',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Update job skill requirement
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateSkillRequirement = async (req, res) => {
    try {
      const { skillReqId } = req.params;
      const { is_required, proficiency_level, years_experience } = req.body;
      
      // Find and update skill requirement
      const skillReq = await JobSkillRequirement.findByIdAndUpdate(
        skillReqId,
        { is_required, proficiency_level, years_experience },
        { new: true, runValidators: true }
      ).populate('skill_id');
      
      if (!skillReq) {
        return res.status(404).json({
          message: 'Skill requirement not found'
        });
      }
      
      return res.status(200).json({
        message: 'Skill requirement updated successfully',
        data: skillReq
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error updating skill requirement',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Get recommended candidates for job
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getRecommendedCandidates = async (req, res) => {
    try {
      const { jobId } = req.params;
      const { limit = 10 } = req.query;
      
      // Find job with skill requirements
      const job = await Job.findById(jobId);
      if (!job) {
        return res.status(404).json({
          message: 'Job not found'
        });
      }
      
      // Get all skill requirements for this job
      const skillRequirements = await JobSkillRequirement.find({ job_id: jobId });
      
      if (skillRequirements.length === 0) {
        return res.status(200).json({
          data: [],
          message: 'No skill requirements defined for this job'
        });
      }
      
      // Get skill IDs
      const skillIds = skillRequirements.map(sr => sr.skill_id);
      
      // Find candidates with matching skills
      const candidateSkills = await CandidateSkill.find({
        skill_id: { $in: skillIds }
      }).populate('candidate_id');
      
      // Group by candidate and calculate match score
      const candidateScores = {};
      
      for (const candidateSkill of candidateSkills) {
        const candidateId = candidateSkill.candidate_id._id.toString();
        
        if (!candidateScores[candidateId]) {
          candidateScores[candidateId] = {
            candidate: candidateSkill.candidate_id,
            matchedSkills: 0,
            totalRequiredSkills: skillRequirements.filter(sr => sr.is_required).length,
            skillMatches: []
          };
        }
        
        // Find corresponding skill requirement
        const skillReq = skillRequirements.find(
          sr => sr.skill_id.toString() === candidateSkill.skill_id.toString()
        );
        
        if (skillReq) {
          // Check if proficiency level meets requirements
          const proficiencyLevels = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
          const candidateLevel = proficiencyLevels.indexOf(candidateSkill.proficiency_level);
          const requiredLevel = proficiencyLevels.indexOf(skillReq.proficiency_level);
          
          const meetsLevel = !skillReq.proficiency_level || candidateLevel >= requiredLevel;
          
          // Check if years of experience meets requirements
          const meetsYears = !skillReq.years_experience || 
                            (candidateSkill.years_experience && 
                             candidateSkill.years_experience >= skillReq.years_experience);
          
          // If both requirements are met, or if there are no specific requirements
          if (meetsLevel && meetsYears) {
            candidateScores[candidateId].matchedSkills += 1;
            candidateScores[candidateId].skillMatches.push({
              skill_id: candidateSkill.skill_id,
              candidate_level: candidateSkill.proficiency_level,
              candidate_years: candidateSkill.years_experience,
              required_level: skillReq.proficiency_level,
              required_years: skillReq.years_experience,
              is_required: skillReq.is_required
            });
          }
        }
      }
      
      // Calculate match percentage and prepare result
      const candidates = Object.values(candidateScores).map(score => {
        const requiredSkillsMatched = score.skillMatches.filter(match => match.is_required).length;
        const requiredMatch = score.totalRequiredSkills > 0 
          ? (requiredSkillsMatched / score.totalRequiredSkills) * 100 
          : 100;
          
        const totalMatch = (score.matchedSkills / skillRequirements.length) * 100;
        
        return {
          candidate: score.candidate,
          required_match_percentage: Math.round(requiredMatch),
          total_match_percentage: Math.round(totalMatch),
          matched_skills: score.matchedSkills,
          total_skills: skillRequirements.length,
          skill_matches: score.skillMatches
        };
      });
      
      // Sort by required match percentage (desc) then total match percentage (desc)
      candidates.sort((a, b) => {
        if (b.required_match_percentage !== a.required_match_percentage) {
          return b.required_match_percentage - a.required_match_percentage;
        }
        return b.total_match_percentage - a.total_match_percentage;
      });
      
      // Limit results
      const limitNum = parseInt(limit, 10);
      const limitedCandidates = candidates.slice(0, limitNum);
      
      // Populate user information
      for (let i = 0; i < limitedCandidates.length; i++) {
        await limitedCandidates[i].candidate.populate('user_id', '-password_hash');
      }
      
      return res.status(200).json({
        data: limitedCandidates
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error getting recommended candidates',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Delete job
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteJob = async (req, res) => {
    try {
      const { id } = req.params;
      
      // Find job
      const job = await Job.findById(id);
      if (!job) {
        return res.status(404).json({
          message: 'Job not found'
        });
      }
      
      // Check if job is open to update company active jobs count
      const wasOpen = job.status === 'open';
      
      // Delete skill requirements
      await JobSkillRequirement.deleteMany({ job_id: id });
      
      // Delete applications (in a real app, you might want to keep these)
      await Application.deleteMany({ job_id: id });
      
      // Delete the job
      await Job.deleteOne({ _id: id });
      
      // Update company active jobs count if job was open
      if (wasOpen) {
        const company = await Company.findById(job.company_id);
        if (company) {
          company.active_jobs = Math.max((company.active_jobs || 0) - 1, 0);
          await company.save();
        }
      }
      
      return res.status(200).json({
        message: 'Job deleted successfully'
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error deleting job',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Delete skill requirement
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteSkillRequirement = async (req, res) => {
    return this.jobSkillController.delete(req, res);
  };
}

module.exports = new JobsController();