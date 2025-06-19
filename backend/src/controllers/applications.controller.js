const BaseController = require('./base.controller');
const { 
  Application, 
  ApplicationStatusHistory, 
  ApplicationNote,
  Job,
  CandidateProfile,
  User,
  Company
} = require('../models/sql');

/**
 * Applications Controller - Handles job application operations
 */
class ApplicationsController {
  constructor() {
    this.applicationController = new BaseController(Application);
    this.statusHistoryController = new BaseController(ApplicationStatusHistory);
    this.applicationNoteController = new BaseController(ApplicationNote);
  }

  /**
   * Get all applications with filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllApplications = async (req, res) => {
    try {
      const { 
        candidate_id,
        job_id,
        company_id,
        status,
        date_from,
        date_to,
        page = 1, 
        limit = 10,
        sort = '-applied_at'
      } = req.query;
      
      // Build query
      const query = {};
      
      // Add candidate filter
      if (candidate_id) {
        query.candidate_id = candidate_id;
      }
      
      // Add job filter
      if (job_id) {
        query.job_id = job_id;
      }
      
      // Add company filter (requires aggregation)
      let jobsForCompany = [];
      if (company_id) {
        const jobs = await Job.find({ company_id }).select('_id');
        jobsForCompany = jobs.map(job => job._id);
        
        if (jobsForCompany.length === 0) {
          // No jobs found for this company
          return res.status(200).json({
            data: [],
            meta: { total: 0, page: 1, limit: limitNum, pages: 0 }
          });
        }
        
        query.job_id = { $in: jobsForCompany };
      }
      
      // Add status filter
      if (status) {
        query.status = status;
      }
      
      // Add date range filter
      if (date_from || date_to) {
        query.applied_at = {};
        if (date_from) {
          query.applied_at.$gte = new Date(date_from);
        }
        if (date_to) {
          query.applied_at.$lte = new Date(date_to);
        }
      }
      
      // Convert page and limit to numbers
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;
      
      // Execute query with pagination
      const applications = await Application
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate({
          path: 'candidate_id',
          populate: {
            path: 'user_id',
            select: 'first_name last_name email'
          }
        })
        .populate({
          path: 'job_id',
          select: 'title company_id status location',
          populate: {
            path: 'company_id',
            select: 'name'
          }
        });
      
      // Get total count for pagination
      const total = await Application.countDocuments(query);
      
      return res.status(200).json({
        data: applications,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error retrieving applications',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Get application by ID with related data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getApplicationById = async (req, res) => {
    try {
      const { id } = req.params;
      
      // Find application with related data
      const application = await Application.findById(id)
        .populate({
          path: 'candidate_id',
          populate: {
            path: 'user_id',
            select: '-password_hash'
          }
        })
        .populate({
          path: 'job_id',
          populate: {
            path: 'company_id',
            select: 'name logo_url'
          }
        })
        .populate({
          path: 'status_history',
          options: { sort: { changed_at: -1 } },
          populate: {
            path: 'changed_by_user',
            select: 'first_name last_name'
          }
        })
        .populate({
          path: 'notes',
          options: { sort: { created_at: -1 } },
          populate: {
            path: 'user_id',
            select: 'first_name last_name'
          }
        });
      
      if (!application) {
        return res.status(404).json({
          message: 'Application not found'
        });
      }
      
      return res.status(200).json({
        data: application
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error retrieving application',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Submit new application
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  submitApplication = async (req, res) => {
    try {
      const {
        candidate_id,
        job_id,
        cover_letter,
        source
      } = req.body;
      
      // Verify candidate exists
      const candidate = await CandidateProfile.findById(candidate_id);
      if (!candidate) {
        return res.status(404).json({
          message: 'Candidate not found'
        });
      }
      
      // Verify job exists and is open
      const job = await Job.findById(job_id);
      if (!job) {
        return res.status(404).json({
          message: 'Job not found'
        });
      }
      
      if (job.status !== 'open') {
        return res.status(400).json({
          message: 'Cannot apply to a job that is not open'
        });
      }
      
      // Check if already applied
      const existingApplication = await Application.findOne({
        candidate_id,
        job_id
      });
      
      if (existingApplication) {
        return res.status(409).json({
          message: 'You have already applied to this job',
          data: existingApplication
        });
      }
      
      // Create application
      const application = new Application({
        candidate_id,
        job_id,
        cover_letter,
        source: source || 'website',
        applied_at: new Date(),
        status: 'submitted'
      });
      
      const savedApplication = await application.save();
      
      // Create initial status history entry
      const statusHistory = new ApplicationStatusHistory({
        application_id: savedApplication._id,
        status: 'submitted',
        comment: 'Application submitted',
        changed_at: new Date()
      });
      
      await statusHistory.save();
      
      // Update job application count
      job.application_count += 1;
      await job.save();
      
      return res.status(201).json({
        message: 'Application submitted successfully',
        data: savedApplication
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error submitting application',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Update application status
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateApplicationStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { status, comment, changed_by } = req.body;
      
      if (!status) {
        return res.status(400).json({
          message: 'Status is required'
        });
      }
      
      // Find application
      const application = await Application.findById(id);
      if (!application) {
        return res.status(404).json({
          message: 'Application not found'
        });
      }
      
      // Check if status is actually changing
      if (application.status === status) {
        return res.status(400).json({
          message: 'Application is already in this status'
        });
      }
      
      // Verify user exists if provided
      if (changed_by) {
        const user = await User.findById(changed_by);
        if (!user) {
          return res.status(404).json({
            message: 'User not found'
          });
        }
      }
      
      // Update application status
      application.status = status;
      application.last_updated = new Date();
      
      // Update specific fields based on status
      if (status === 'interviewed') {
        if (!application.interview_date) {
          application.interview_date = new Date();
        }
      } else if (status === 'offered') {
        if (!application.offer_date) {
          application.offer_date = new Date();
        }
      }
      
      await application.save();
      
      // Create status history entry
      const statusHistory = new ApplicationStatusHistory({
        application_id: id,
        status,
        comment,
        changed_by,
        changed_at: new Date()
      });
      
      await statusHistory.save();
      
      // If hired, update job status to filled
      if (status === 'hired') {
        const job = await Job.findById(application.job_id);
        if (job && job.status === 'open') {
          job.status = 'filled';
          await job.save();
          
          // Update company active jobs count
          const company = await Company.findById(job.company_id);
          if (company) {
            company.active_jobs = Math.max((company.active_jobs || 0) - 1, 0);
            await company.save();
          }
        }
      }
      
      return res.status(200).json({
        message: `Application status updated to ${status}`,
        data: application
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error updating application status',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Add note to application
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  addApplicationNote = async (req, res) => {
    try {
      const { applicationId } = req.params;
      const { user_id, note_text } = req.body;
      
      if (!note_text) {
        return res.status(400).json({
          message: 'Note text is required'
        });
      }
      
      // Verify application exists
      const application = await Application.findById(applicationId);
      if (!application) {
        return res.status(404).json({
          message: 'Application not found'
        });
      }
      
      // Verify user exists
      const user = await User.findById(user_id);
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }
      
      // Create note
      const note = new ApplicationNote({
        application_id: applicationId,
        user_id,
        note_text
      });
      
      await note.save();
      
      return res.status(201).json({
        message: 'Note added successfully',
        data: note
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error adding note',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Update interview details
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateInterviewDetails = async (req, res) => {
    try {
      const { id } = req.params;
      const { interview_date, interview_type } = req.body;
      
      // Find application
      const application = await Application.findById(id);
      if (!application) {
        return res.status(404).json({
          message: 'Application not found'
        });
      }
      
      // Update interview details
      application.interview_date = interview_date || application.interview_date;
      application.interview_type = interview_type || application.interview_type;
      application.last_updated = new Date();
      
      // If interview details are set and status is not yet interviewed, update it
      if (interview_date && application.status === 'under_review') {
        application.status = 'interview_scheduled';
        
        // Create status history entry
        const statusHistory = new ApplicationStatusHistory({
          application_id: id,
          status: 'interview_scheduled',
          comment: 'Interview scheduled',
          changed_at: new Date()
        });
        
        await statusHistory.save();
      }
      
      await application.save();
      
      return res.status(200).json({
        message: 'Interview details updated successfully',
        data: application
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error updating interview details',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Update offer details
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateOfferDetails = async (req, res) => {
    try {
      const { id } = req.params;
      const { 
        offer_salary,
        offer_currency,
        offer_date,
        offer_expiry_date,
        offer_response
      } = req.body;
      
      // Find application
      const application = await Application.findById(id);
      if (!application) {
        return res.status(404).json({
          message: 'Application not found'
        });
      }
      
      // Update offer details
      if (offer_salary !== undefined) application.offer_salary = offer_salary;
      if (offer_currency) application.offer_currency = offer_currency;
      if (offer_date) application.offer_date = offer_date;
      if (offer_expiry_date) application.offer_expiry_date = offer_expiry_date;
      if (offer_response) application.offer_response = offer_response;
      
      application.last_updated = new Date();
      
      // If offer details are set and status is not yet offered, update it
      if (offer_salary && application.status !== 'offered' && application.status !== 'hired') {
        application.status = 'offered';
        
        // Create status history entry
        const statusHistory = new ApplicationStatusHistory({
          application_id: id,
          status: 'offered',
          comment: 'Offer made',
          changed_at: new Date()
        });
        
        await statusHistory.save();
      }
      
      // If offer response is accepted and status is not yet hired, update it
      if (offer_response === 'accepted' && application.status !== 'hired') {
        application.status = 'hired';
        
        // Create status history entry
        const statusHistory = new ApplicationStatusHistory({
          application_id: id,
          status: 'hired',
          comment: 'Offer accepted',
          changed_at: new Date()
        });
        
        await statusHistory.save();
        
        // Update job status to filled
        const job = await Job.findById(application.job_id);
        if (job && job.status === 'open') {
          job.status = 'filled';
          await job.save();
          
          // Update company active jobs count
          const company = await Company.findById(job.company_id);
          if (company) {
            company.active_jobs = Math.max((company.active_jobs || 0) - 1, 0);
            await company.save();
          }
        }
      }
      
      await application.save();
      
      return res.status(200).json({
        message: 'Offer details updated successfully',
        data: application
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error updating offer details',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Withdraw application
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  withdrawApplication = async (req, res) => {
    try {
      const { id } = req.params;
      const { comment } = req.body;
      
      // Find application
      const application = await Application.findById(id);
      if (!application) {
        return res.status(404).json({
          message: 'Application not found'
        });
      }
      
      // Check if application can be withdrawn
      if (['hired', 'rejected', 'withdrawn'].includes(application.status)) {
        return res.status(400).json({
          message: `Cannot withdraw application in ${application.status} status`
        });
      }
      
      // Update application status
      application.status = 'withdrawn';
      application.last_updated = new Date();
      await application.save();
      
      // Create status history entry
      const statusHistory = new ApplicationStatusHistory({
        application_id: id,
        status: 'withdrawn',
        comment: comment || 'Application withdrawn by candidate',
        changed_at: new Date()
      });
      
      await statusHistory.save();
      
      return res.status(200).json({
        message: 'Application withdrawn successfully',
        data: application
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error withdrawing application',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Get application statistics for a company
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getCompanyApplicationStats = async (req, res) => {
    try {
      const { companyId } = req.params;
      
      // Verify company exists
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({
          message: 'Company not found'
        });
      }
      
      // Get all jobs for the company
      const jobs = await Job.find({ company_id: companyId });
      const jobIds = jobs.map(job => job._id);
      
      if (jobIds.length === 0) {
        return res.status(200).json({
          data: {
            total_applications: 0,
            status_breakdown: {},
            jobs: []
          }
        });
      }
      
      // Get all applications for these jobs
      const applications = await Application.find({ job_id: { $in: jobIds } });
      
      // Calculate statistics
      const totalApplications = applications.length;
      
      // Status breakdown
      const statusBreakdown = {};
      applications.forEach(app => {
        statusBreakdown[app.status] = (statusBreakdown[app.status] || 0) + 1;
      });
      
      // Job-specific stats
      const jobStats = [];
      for (const job of jobs) {
        const jobApplications = applications.filter(app => app.job_id.toString() === job._id.toString());
        
        // Skip jobs with no applications
        if (jobApplications.length === 0) continue;
        
        // Calculate job-specific status breakdown
        const jobStatusBreakdown = {};
        jobApplications.forEach(app => {
          jobStatusBreakdown[app.status] = (jobStatusBreakdown[app.status] || 0) + 1;
        });
        
        jobStats.push({
          job_id: job._id,
          job_title: job.title,
          applications_count: jobApplications.length,
          status_breakdown: jobStatusBreakdown
        });
      }
      
      return res.status(200).json({
        data: {
          total_applications: totalApplications,
          status_breakdown: statusBreakdown,
          jobs: jobStats
        }
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error getting application statistics',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Delete application
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteApplication = async (req, res) => {
    try {
      const { id } = req.params;
      
      // Find application
      const application = await Application.findById(id);
      if (!application) {
        return res.status(404).json({
          message: 'Application not found'
        });
      }
      
      // Delete related records
      await ApplicationStatusHistory.deleteMany({ application_id: id });
      await ApplicationNote.deleteMany({ application_id: id });
      
      // Delete the application
      await Application.deleteOne({ _id: id });
      
      // Update job application count
      const job = await Job.findById(application.job_id);
      if (job) {
        job.application_count = Math.max((job.application_count || 0) - 1, 0);
        await job.save();
      }
      
      return res.status(200).json({
        message: 'Application deleted successfully'
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error deleting application',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Delete application note
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteApplicationNote = async (req, res) => {
    return this.applicationNoteController.delete(req, res);
  };
}

module.exports = new ApplicationsController();