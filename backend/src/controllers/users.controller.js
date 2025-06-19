const BaseController = require('./base.controller');
const User = require('../models/mongodb/user_model');
const { AdminProfile, SuperAdminProfile } = require('../models/sql');

/**
 * Users Controller - Handles user profile management
 */
class UsersController extends BaseController {
  constructor() {
    super(User);
  }

  /**
   * Get all users with optional filtering
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getAllUsers = async (req, res) => {
    try {
      const { role, is_active, search, page = 1, limit = 10 } = req.query;
      
      // Build query
      const query = {};
      
      // Add role filter
      if (role) {
        query.role = role;
      }
      
      // Add active status filter
      if (is_active !== undefined) {
        query.is_active = is_active === 'true';
      }
      
      // Add search filter on name or email
      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
      
      // Convert page and limit to numbers
      const pageNum = parseInt(page, 10);
      const limitNum = parseInt(limit, 10);
      const skip = (pageNum - 1) * limitNum;
      
      // Execute query with pagination
      const users = await User
        .find(query)
        .select('-password') // Exclude password
        .sort('-created_at')
        .skip(skip)
        .limit(limitNum);
      
      // Get total count for pagination
      const total = await User.countDocuments(query);
      
      return res.status(200).json({
        data: users,
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          pages: Math.ceil(total / limitNum)
        }
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error retrieving users',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Get user by ID with associated profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getUserWithProfile = async (req, res) => {
    try {
      const { id } = req.params;
      
      // Find user
      const user = await User.findById(id).select('-password');
      
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }
      
      // Get associated profile based on role
      let profile = null;
      
      switch (user.role) {
        case 'candidate':
          profile = await user.populate('candidate_profile');
          break;
        case 'employer':
          profile = await user.populate({
            path: 'employer_profiles',
            populate: {
              path: 'company',
              model: 'Company'
            }
          });
          break;
        case 'admin':
          profile = await user.populate('admin_profile');
          break;
        case 'superadmin':
          profile = await user.populate('superadmin_profile');
          break;
        default:
          break;
      }
      
      return res.status(200).json({
        data: {
          user,
          profile: user[`${user.role}_profile`] || user[`${user.role}_profiles`]
        }
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error retrieving user profile',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Update user status (active/inactive)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateUserStatus = async (req, res) => {
    try {
      const { id } = req.params;
      const { is_active } = req.body;
      
      if (is_active === undefined) {
        return res.status(400).json({
          message: 'is_active status is required'
        });
      }
      
      const user = await User.findByIdAndUpdate(
        id,
        { is_active },
        { new: true, runValidators: true }
      ).select('-password');
      
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }
      
      return res.status(200).json({
        message: `User ${is_active ? 'activated' : 'deactivated'} successfully`,
        data: user
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error updating user status',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Update user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateUserProfile = async (req, res) => {
    try {
      const { id } = req.params;
      const { firstName, lastName, phoneNumber, email } = req.body;
      
      // Update basic user info
      const updateData = {};
      if (firstName) updateData.firstName = firstName;
      if (lastName) updateData.lastName = lastName;
      if (phoneNumber) updateData.phoneNumber = phoneNumber;
      if (email) updateData.email = email;
      
      // Check if email already exists (if being updated)
      if (email) {
        const existingUser = await User.findOne({ email, _id: { $ne: id } });
        if (existingUser) {
          return res.status(409).json({
            message: 'Email is already in use by another account'
          });
        }
      }
      
      const user = await User.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).select('-password');
      
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }
      
      return res.status(200).json({
        message: 'User profile updated successfully',
        data: user
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error updating user profile',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Create or update admin profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  updateAdminProfile = async (req, res) => {
    try {
      const { id } = req.params;
      const { admin_role, department, permissions, status, notes } = req.body;
      
      // Find user and verify role
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }
      
      if (user.role !== 'admin') {
        return res.status(400).json({
          message: 'Cannot update admin profile for non-admin user'
        });
      }
      
      // Find or create admin profile
      let adminProfile = await AdminProfile.findOne({ user_id: id });
      
      if (adminProfile) {
        // Update existing profile
        if (admin_role) adminProfile.admin_role = admin_role;
        if (department) adminProfile.department = department;
        if (permissions) adminProfile.permissions = permissions;
        if (status) adminProfile.status = status;
        if (notes !== undefined) adminProfile.notes = notes;
        
        await adminProfile.save();
      } else {
        // Create new profile
        adminProfile = new AdminProfile({
          user_id: id,
          admin_role: admin_role || 'user_admin',
          department,
          permissions,
          status: status || 'active',
          notes
        });
        
        await adminProfile.save();
      }
      
      return res.status(200).json({
        message: 'Admin profile updated successfully',
        data: adminProfile
      });
    } catch (error) {
      return res.status(400).json({
        message: error.message || 'Error updating admin profile',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };

  /**
   * Delete user (with cascade)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  deleteUser = async (req, res) => {
    try {
      const { id } = req.params;
      
      // Find user
      const user = await User.findById(id);
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }
      
      // Delete associated profile based on role
      switch (user.role) {
        case 'admin':
          await AdminProfile.findOneAndDelete({ user_id: id });
          break;
        case 'superadmin':
          await SuperAdminProfile.findOneAndDelete({ user_id: id });
          break;
        // Note: For candidate and employer profiles, we rely on MongoDB
        // cascading via middleware or the client handling this
        default:
          break;
      }
      
      // Delete user
      await User.findByIdAndDelete(id);
      
      return res.status(200).json({
        message: 'User deleted successfully'
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error deleting user',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };
}

module.exports = new UsersController();