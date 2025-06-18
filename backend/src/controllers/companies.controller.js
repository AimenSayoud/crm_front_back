const BaseController = require('./base.controller');
const { 
  Company, 
  CompanyContact, 
  CompanyHiringPreferences, 
  EmployerProfile,
  RecruitmentHistory,
  User
} = require('../models/sql');

/**
 * Companies Controller - Handles company management operations
 */
class CompaniesController {
  constructor() {
    this.companyController = new BaseController(Company);
    this.companyContactController = new BaseController(CompanyContact);
    this.hiringPreferencesController = new BaseController(CompanyHiringPreferences);
    this.employerProfileController = new BaseController(EmployerProfile);
    this.recruitmentHistoryController = new BaseController(RecruitmentHistory);
  }

  /**
   * Get all companies with filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllCompanies = async (req, res) => {
    try {
      const { 
        industry, 
        location, 
        size,
        is_verified,
        is_premium,
        search,
        page = 1, 
        limit = 10,
        sort = '-created_at'
      } = req.query;
      
      // Build query
      const query = {};
      
      // Add industry filter
      if (industry) {
        query.industry = { $regex: industry, $options: 'i' };
      }
      
      // Add location filter
      if (location) {
        const locationRegex = new RegExp(location, 'i');
        query.$or = [
          { location: locationRegex },
          { city: locationRegex },
          { country: locationRegex }
        ];
      }
      
      // Add size filter
      if (size) {
        query.$or = [
          { size },
          { company_size: size } // For backward compatibility
        ];
      }
      
      // Add verification status filter
      if (is_verified !== undefined) {
        query.is_verified = is_verified === 'true';
      }
      
      // Add premium status filter
      if (is_premium !== undefined) {
        query.is_premium = is_premium === 'true';
      }
      
      // Add search filter
      if (search) {
        const searchQuery = { $regex: search, $options: 'i' };
        
        if (query.$or) {
          query.$or.push(
            { name: searchQuery },
            { description: searchQuery },
            { industry: searchQuery }
          );
        } else {
          query.$or = [
            { name: searchQuery },
            { description: searchQuery },
            { industry: searchQuery }
          ];
        }
      }
      
      // Convert page and limit to numbers
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;
      
      // Execute query with pagination
      const companies = await Company
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum);
      
      // Get total count for pagination
      const total = await Company.countDocuments(query);
      
      return res.status(200).json({
        data: companies,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error retrieving companies',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Get company by ID with related data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getCompanyById = async (req, res) => {
    try {
      const { id } = req.params;
      const { include_jobs, include_employers } = req.query;
      
      let query = Company.findById(id);
      
      // Populate related data if requested
      const populateOptions = [];
      
      if (include_jobs === 'true') {
        populateOptions.push({
          path: 'jobs',
          options: { sort: { posting_date: -1 } }
        });
      }
      
      if (include_employers === 'true') {
        populateOptions.push({
          path: 'employer_profiles',
          populate: {
            path: 'user_id',
            model: 'User',
            select: '-password_hash'
          }
        });
      }
      
      // Always include these relations
      populateOptions.push(
        { path: 'contacts' },
        { path: 'hiring_preferences' }
      );
      
      // Apply all populate options
      populateOptions.forEach(option => {
        query = query.populate(option);
      });
      
      const company = await query;
      
      if (!company) {
        return res.status(404).json({
          message: 'Company not found'
        });
      }
      
      // Get job count
      const activeJobsCount = await company.jobs?.filter(job => job.status === 'open').length || 0;
      
      // Update active_jobs count if it's different
      if (company.active_jobs !== activeJobsCount && include_jobs === 'true') {
        company.active_jobs = activeJobsCount;
        await company.save();
      }
      
      return res.status(200).json({
        data: company
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error retrieving company',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Create new company
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createCompany = async (req, res) => {
    try {
      const companyData = req.body;
      const { created_by_user_id } = req.body;
      
      // Verify user exists if provided
      if (created_by_user_id) {
        const user = await User.findById(created_by_user_id);
        if (!user) {
          return res.status(404).json({
            message: 'User not found'
          });
        }
        
        // Only employers, admins, and superadmins can create companies
        if (!['employer', 'admin', 'superadmin'].includes(user.role)) {
          return res.status(403).json({
            message: 'User does not have permission to create a company'
          });
        }
      }
      
      // Create the company
      const company = new Company({
        ...companyData,
        is_verified: false, // New companies start unverified
        created_at: new Date()
      });
      
      const savedCompany = await company.save();
      
      // If user is employer, associate them with this company
      if (created_by_user_id) {
        const user = await User.findById(created_by_user_id);
        
        if (user.role === 'employer') {
          const employerProfile = new EmployerProfile({
            user_id: created_by_user_id,
            company_id: savedCompany._id,
            is_primary_contact: true,
            position: req.body.position || 'Company Administrator'
          });
          
          await employerProfile.save();
        }
      }
      
      return res.status(201).json({
        message: 'Company created successfully',
        data: savedCompany
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error creating company',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Update company
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateCompany = async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      // Don't allow changing verification status directly
      if (updateData.is_verified !== undefined) {
        delete updateData.is_verified;
      }
      
      // Update the company
      const company = await Company.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );
      
      if (!company) {
        return res.status(404).json({
          message: 'Company not found'
        });
      }
      
      return res.status(200).json({
        message: 'Company updated successfully',
        data: company
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error updating company',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Verify company (admin only)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  verifyCompany = async (req, res) => {
    try {
      const { id } = req.params;
      const { is_verified } = req.body;
      
      if (is_verified === undefined) {
        return res.status(400).json({
          message: 'is_verified status is required'
        });
      }
      
      // Update verification status
      const company = await Company.findByIdAndUpdate(
        id,
        { is_verified },
        { new: true }
      );
      
      if (!company) {
        return res.status(404).json({
          message: 'Company not found'
        });
      }
      
      return res.status(200).json({
        message: `Company ${is_verified ? 'verified' : 'unverified'} successfully`,
        data: company
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error updating company verification status',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Add company contact
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  addContact = async (req, res) => {
    try {
      const { companyId } = req.params;
      const contactData = req.body;
      
      // Verify company exists
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({
          message: 'Company not found'
        });
      }
      
      // Create contact
      const contact = new CompanyContact({
        company_id: companyId,
        ...contactData
      });
      
      await contact.save();
      
      // If this is a primary contact, update other contacts
      if (contact.is_primary) {
        await CompanyContact.updateMany(
          { company_id: companyId, _id: { $ne: contact._id } },
          { is_primary: false }
        );
      }
      
      return res.status(201).json({
        message: 'Contact added successfully',
        data: contact
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error adding contact',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Update company contact
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateContact = async (req, res) => {
    try {
      const { contactId } = req.params;
      const contactData = req.body;
      
      // Find and update contact
      const contact = await CompanyContact.findByIdAndUpdate(
        contactId,
        contactData,
        { new: true, runValidators: true }
      );
      
      if (!contact) {
        return res.status(404).json({
          message: 'Contact not found'
        });
      }
      
      // If this is now a primary contact, update other contacts
      if (contact.is_primary) {
        await CompanyContact.updateMany(
          { company_id: contact.company_id, _id: { $ne: contact._id } },
          { is_primary: false }
        );
      }
      
      return res.status(200).json({
        message: 'Contact updated successfully',
        data: contact
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error updating contact',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Update or create company hiring preferences
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateHiringPreferences = async (req, res) => {
    try {
      const { companyId } = req.params;
      const preferencesData = req.body;
      
      // Verify company exists
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({
          message: 'Company not found'
        });
      }
      
      // Find or create preferences
      let preferences = await CompanyHiringPreferences.findOne({ company_id: companyId });
      
      if (preferences) {
        // Update existing preferences
        Object.keys(preferencesData).forEach(key => {
          preferences[key] = preferencesData[key];
        });
        
        await preferences.save();
      } else {
        // Create new preferences
        preferences = new CompanyHiringPreferences({
          company_id: companyId,
          ...preferencesData
        });
        
        await preferences.save();
      }
      
      return res.status(200).json({
        message: 'Hiring preferences updated successfully',
        data: preferences
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error updating hiring preferences',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Add user as employer for company
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  addEmployer = async (req, res) => {
    try {
      const { companyId } = req.params;
      const { user_id, position, department, is_primary_contact, can_post_jobs } = req.body;
      
      // Verify company exists
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({
          message: 'Company not found'
        });
      }
      
      // Verify user exists
      const user = await User.findById(user_id);
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }
      
      // Check if user is already an employer for this company
      const existingProfile = await EmployerProfile.findOne({
        user_id,
        company_id: companyId
      });
      
      if (existingProfile) {
        return res.status(409).json({
          message: 'User is already an employer for this company'
        });
      }
      
      // Update user role if needed
      if (user.role !== 'employer') {
        user.role = 'employer';
        await user.save();
      }
      
      // Create employer profile
      const employerProfile = new EmployerProfile({
        user_id,
        company_id: companyId,
        position,
        department,
        is_primary_contact: is_primary_contact || false,
        can_post_jobs: can_post_jobs !== undefined ? can_post_jobs : true
      });
      
      await employerProfile.save();
      
      // If this is a primary contact, update other profiles
      if (employerProfile.is_primary_contact) {
        await EmployerProfile.updateMany(
          { company_id: companyId, _id: { $ne: employerProfile._id } },
          { is_primary_contact: false }
        );
      }
      
      return res.status(201).json({
        message: 'Employer added to company successfully',
        data: employerProfile
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error adding employer to company',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Update employer profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateEmployerProfile = async (req, res) => {
    try {
      const { profileId } = req.params;
      const { position, department, is_primary_contact, can_post_jobs } = req.body;
      
      // Find and update profile
      const profile = await EmployerProfile.findById(profileId);
      
      if (!profile) {
        return res.status(404).json({
          message: 'Employer profile not found'
        });
      }
      
      // Update fields
      if (position !== undefined) profile.position = position;
      if (department !== undefined) profile.department = department;
      if (can_post_jobs !== undefined) profile.can_post_jobs = can_post_jobs;
      
      // Handle primary contact status specially
      if (is_primary_contact !== undefined) {
        profile.is_primary_contact = is_primary_contact;
        
        // If this is now a primary contact, update other profiles
        if (is_primary_contact) {
          await EmployerProfile.updateMany(
            { company_id: profile.company_id, _id: { $ne: profile._id } },
            { is_primary_contact: false }
          );
        }
      }
      
      await profile.save();
      
      return res.status(200).json({
        message: 'Employer profile updated successfully',
        data: profile
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error updating employer profile',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Add recruitment history entry
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  addRecruitmentHistory = async (req, res) => {
    try {
      const { companyId } = req.params;
      const { job_title, date_filled, time_to_fill } = req.body;
      
      // Verify company exists
      const company = await Company.findById(companyId);
      if (!company) {
        return res.status(404).json({
          message: 'Company not found'
        });
      }
      
      // Create history entry
      const historyEntry = new RecruitmentHistory({
        company_id: companyId,
        job_title,
        date_filled,
        time_to_fill
      });
      
      await historyEntry.save();
      
      return res.status(201).json({
        message: 'Recruitment history entry added successfully',
        data: historyEntry
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error adding recruitment history',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Delete company
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteCompany = async (req, res) => {
    try {
      const { id } = req.params;
      
      // Find company
      const company = await Company.findById(id);
      if (!company) {
        return res.status(404).json({
          message: 'Company not found'
        });
      }
      
      // Delete related records - this could be handled by middleware
      // in a full implementation, but for now, we'll do it manually
      await CompanyContact.deleteMany({ company_id: id });
      await CompanyHiringPreferences.deleteMany({ company_id: id });
      await RecruitmentHistory.deleteMany({ company_id: id });
      
      // For employer profiles, we need to handle the user relationship
      const employerProfiles = await EmployerProfile.find({ company_id: id });
      
      // Remove company association from employer profiles
      for (const profile of employerProfiles) {
        await EmployerProfile.deleteOne({ _id: profile._id });
        
        // Check if user has other employer profiles
        const otherProfiles = await EmployerProfile.countDocuments({ user_id: profile.user_id });
        
        // If no other profiles, update user role to candidate
        if (otherProfiles === 0) {
          await User.updateOne(
            { _id: profile.user_id, role: 'employer' },
            { role: 'candidate' }
          );
        }
      }
      
      // Delete the company
      await Company.deleteOne({ _id: id });
      
      return res.status(200).json({
        message: 'Company deleted successfully'
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error deleting company',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };
  
  /**
   * Delete contact
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteContact = async (req, res) => {
    return this.companyContactController.delete(req, res);
  };
  
  /**
   * Delete employer from company
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  removeEmployer = async (req, res) => {
    try {
      const { profileId } = req.params;
      
      // Find profile
      const profile = await EmployerProfile.findById(profileId);
      if (!profile) {
        return res.status(404).json({
          message: 'Employer profile not found'
        });
      }
      
      // Delete the profile
      await EmployerProfile.deleteOne({ _id: profileId });
      
      // Check if user has other employer profiles
      const otherProfiles = await EmployerProfile.countDocuments({ user_id: profile.user_id });
      
      // If no other profiles, update user role to candidate
      if (otherProfiles === 0) {
        await User.updateOne(
          { _id: profile.user_id, role: 'employer' },
          { role: 'candidate' }
        );
      }
      
      return res.status(200).json({
        message: 'Employer removed from company successfully'
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error removing employer',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };
}

module.exports = new CompaniesController();