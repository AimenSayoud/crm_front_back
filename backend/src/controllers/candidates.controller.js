const BaseController = require('./base.controller');
const { 
  User, 
  CandidateProfile, 
  CandidateEducation, 
  CandidateExperience, 
  CandidateSkill,
  CandidatePreferences,
  Skill
} = require('../models/sql');

/**
 * Candidates Controller - Handles candidate profile operations
 */
class CandidatesController {
  constructor() {
    this.candidateProfileController = new BaseController(CandidateProfile);
    this.candidateEducationController = new BaseController(CandidateEducation);
    this.candidateExperienceController = new BaseController(CandidateExperience);
    this.candidateSkillController = new BaseController(CandidateSkill);
    this.candidatePreferencesController = new BaseController(CandidatePreferences);
  }

  /**
   * Get all candidates with filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllCandidates = async (req, res) => {
    try {
      const { 
        skills, 
        location, 
        experience_min, 
        experience_max,
        is_open_to_opportunities,
        search,
        page = 1, 
        limit = 10,
        sort = '-created_at'
      } = req.query;
      
      // Build query
      const query = {};
      
      // Add skills filter (if provided)
      if (skills) {
        const skillsArray = skills.split(',').map(skill => skill.trim());
        
        // Get skill IDs from skill names
        const foundSkills = await Skill.find({ name: { $in: skillsArray } });
        const skillIds = foundSkills.map(skill => skill._id);
        
        // Find candidates with these skills
        const candidateSkills = await CandidateSkill.find({ skill_id: { $in: skillIds } });
        const candidateIds = [...new Set(candidateSkills.map(cs => cs.candidate_id.toString()))];
        
        if (candidateIds.length > 0) {
          query._id = { $in: candidateIds };
        } else {
          // No candidates found with these skills
          return res.status(200).json({
            data: [],
            meta: { total: 0, page: 1, limit: limitNum, pages: 0 }
          });
        }
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
      
      // Add experience range filter
      if (experience_min || experience_max) {
        query.years_of_experience = {};
        if (experience_min) query.years_of_experience.$gte = parseInt(experience_min, 10);
        if (experience_max) query.years_of_experience.$lte = parseInt(experience_max, 10);
      }
      
      // Add open to opportunities filter
      if (is_open_to_opportunities !== undefined) {
        query.is_open_to_opportunities = is_open_to_opportunities === 'true';
      }
      
      // Add search filter
      if (search) {
        // First, search users by name
        const users = await User.find({
          $or: [
            { first_name: { $regex: search, $options: 'i' } },
            { last_name: { $regex: search, $options: 'i' } },
            { email: { $regex: search, $options: 'i' } }
          ],
          role: 'candidate'
        });
        
        const userIds = users.map(user => user._id);
        
        // Then, add user IDs to query
        if (userIds.length > 0) {
          if (query.$or) {
            query.$or.push({ user_id: { $in: userIds } });
          } else {
            query.$or = [
              { user_id: { $in: userIds } },
              { current_position: { $regex: search, $options: 'i' } },
              { current_company: { $regex: search, $options: 'i' } },
              { summary: { $regex: search, $options: 'i' } }
            ];
          }
        } else {
          // No candidates match name search, but still search other fields
          if (query.$or) {
            query.$or.push(
              { current_position: { $regex: search, $options: 'i' } },
              { current_company: { $regex: search, $options: 'i' } },
              { summary: { $regex: search, $options: 'i' } }
            );
          } else {
            query.$or = [
              { current_position: { $regex: search, $options: 'i' } },
              { current_company: { $regex: search, $options: 'i' } },
              { summary: { $regex: search, $options: 'i' } }
            ];
          }
        }
      }
      
      // Convert page and limit to numbers
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;
      
      // Execute query with pagination
      const candidates = await CandidateProfile
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('user_id', '-password_hash');
      
      // Get total count for pagination
      const total = await CandidateProfile.countDocuments(query);
      
      return res.status(200).json({
        data: candidates,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error retrieving candidates',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Get candidate by ID with related data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getCandidateById = async (req, res) => {
    try {
      const { id } = req.params;
      
      const candidate = await CandidateProfile.findById(id)
        .populate('user_id', '-password_hash')
        .populate({
          path: 'education_records',
          options: { sort: { start_date: -1 } }
        })
        .populate({
          path: 'experience_records',
          options: { sort: { start_date: -1 } }
        })
        .populate({
          path: 'skills',
          populate: {
            path: 'skill_id',
            model: 'Skill'
          }
        })
        .populate('preferences');
      
      if (!candidate) {
        return res.status(404).json({
          message: 'Candidate not found'
        });
      }
      
      return res.status(200).json({
        data: candidate
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error retrieving candidate',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Create or update candidate profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  createOrUpdateProfile = async (req, res) => {
    try {
      const { userId } = req.params;
      const profileData = req.body;
      
      // Verify user exists and is a candidate
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }
      
      if (user.role !== 'candidate') {
        return res.status(400).json({
          message: 'User is not a candidate'
        });
      }
      
      // Find existing profile or create new one
      let candidateProfile = await CandidateProfile.findOne({ user_id: userId });
      
      if (candidateProfile) {
        // Update existing profile
        Object.keys(profileData).forEach(key => {
          candidateProfile[key] = profileData[key];
        });
        
        candidateProfile.updated_at = new Date();
        await candidateProfile.save();
      } else {
        // Create new profile
        candidateProfile = new CandidateProfile({
          user_id: userId,
          ...profileData,
          profile_completed: false
        });
        
        await candidateProfile.save();
      }
      
      return res.status(200).json({
        message: 'Candidate profile updated successfully',
        data: candidateProfile
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error updating candidate profile',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Add education to candidate profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  addEducation = async (req, res) => {
    try {
      const { candidateId } = req.params;
      const educationData = req.body;
      
      // Verify candidate exists
      const candidate = await CandidateProfile.findById(candidateId);
      if (!candidate) {
        return res.status(404).json({
          message: 'Candidate not found'
        });
      }
      
      // Create education record
      const education = new CandidateEducation({
        candidate_id: candidateId,
        ...educationData
      });
      
      await education.save();
      
      return res.status(201).json({
        message: 'Education record added successfully',
        data: education
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error adding education record',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Update education record
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateEducation = async (req, res) => {
    try {
      const { educationId } = req.params;
      const educationData = req.body;
      
      // Find and update education
      const education = await CandidateEducation.findByIdAndUpdate(
        educationId,
        educationData,
        { new: true, runValidators: true }
      );
      
      if (!education) {
        return res.status(404).json({
          message: 'Education record not found'
        });
      }
      
      return res.status(200).json({
        message: 'Education record updated successfully',
        data: education
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error updating education record',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Add experience to candidate profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  addExperience = async (req, res) => {
    try {
      const { candidateId } = req.params;
      const experienceData = req.body;
      
      // Verify candidate exists
      const candidate = await CandidateProfile.findById(candidateId);
      if (!candidate) {
        return res.status(404).json({
          message: 'Candidate not found'
        });
      }
      
      // Create experience record
      const experience = new CandidateExperience({
        candidate_id: candidateId,
        ...experienceData
      });
      
      await experience.save();
      
      // Update candidate's current position if this is current experience
      if (experienceData.current && experienceData.title && experienceData.company) {
        candidate.current_position = experienceData.title;
        candidate.current_company = experienceData.company;
        await candidate.save();
      }
      
      return res.status(201).json({
        message: 'Experience record added successfully',
        data: experience
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error adding experience record',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Update experience record
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateExperience = async (req, res) => {
    try {
      const { experienceId } = req.params;
      const experienceData = req.body;
      
      // Find and update experience
      const experience = await CandidateExperience.findByIdAndUpdate(
        experienceId,
        experienceData,
        { new: true, runValidators: true }
      );
      
      if (!experience) {
        return res.status(404).json({
          message: 'Experience record not found'
        });
      }
      
      // Update candidate's current position if this is current experience
      if (experience.current && experience.title && experience.company) {
        await CandidateProfile.findByIdAndUpdate(experience.candidate_id, {
          current_position: experience.title,
          current_company: experience.company
        });
      }
      
      return res.status(200).json({
        message: 'Experience record updated successfully',
        data: experience
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error updating experience record',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Add skill to candidate profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  addSkill = async (req, res) => {
    try {
      const { candidateId } = req.params;
      const { skill_id, proficiency_level, years_experience } = req.body;
      
      // Verify candidate exists
      const candidate = await CandidateProfile.findById(candidateId);
      if (!candidate) {
        return res.status(404).json({
          message: 'Candidate not found'
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
      const existingSkill = await CandidateSkill.findOne({
        candidate_id: candidateId,
        skill_id
      });
      
      if (existingSkill) {
        return res.status(409).json({
          message: 'Skill already added to candidate profile'
        });
      }
      
      // Create skill record
      const candidateSkill = new CandidateSkill({
        candidate_id: candidateId,
        skill_id,
        proficiency_level,
        years_experience
      });
      
      await candidateSkill.save();
      
      return res.status(201).json({
        message: 'Skill added successfully',
        data: {
          ...candidateSkill.toObject(),
          skill_name: skill.name
        }
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error adding skill',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Update candidate skill
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateSkill = async (req, res) => {
    try {
      const { skillId } = req.params;
      const { proficiency_level, years_experience } = req.body;
      
      // Find and update skill
      const candidateSkill = await CandidateSkill.findByIdAndUpdate(
        skillId,
        { proficiency_level, years_experience },
        { new: true, runValidators: true }
      ).populate('skill_id');
      
      if (!candidateSkill) {
        return res.status(404).json({
          message: 'Candidate skill not found'
        });
      }
      
      return res.status(200).json({
        message: 'Skill updated successfully',
        data: candidateSkill
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error updating skill',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Update candidate preferences
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updatePreferences = async (req, res) => {
    try {
      const { candidateId } = req.params;
      const preferencesData = req.body;
      
      // Verify candidate exists
      const candidate = await CandidateProfile.findById(candidateId);
      if (!candidate) {
        return res.status(404).json({
          message: 'Candidate not found'
        });
      }
      
      // Find or create preferences
      let preferences = await CandidatePreferences.findOne({ candidate_id: candidateId });
      
      if (preferences) {
        // Update existing preferences
        Object.keys(preferencesData).forEach(key => {
          preferences[key] = preferencesData[key];
        });
        
        await preferences.save();
      } else {
        // Create new preferences
        preferences = new CandidatePreferences({
          candidate_id: candidateId,
          ...preferencesData
        });
        
        await preferences.save();
      }
      
      return res.status(200).json({
        message: 'Preferences updated successfully',
        data: preferences
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error updating preferences',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Delete education record
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteEducation = async (req, res) => {
    return this.candidateEducationController.delete(req, res);
  };

  /**
   * Delete experience record
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteExperience = async (req, res) => {
    return this.candidateExperienceController.delete(req, res);
  };

  /**
   * Delete skill from candidate profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteSkill = async (req, res) => {
    return this.candidateSkillController.delete(req, res);
  };
}

module.exports = new CandidatesController();