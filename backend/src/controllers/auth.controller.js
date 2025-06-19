const bcrypt = require('bcrypt');
const { User } = require('../models/sql');

/**
 * Auth Controller - Handles user authentication
 */
class AuthController {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  register = async (req, res) => {
    try {
      const { email, password, first_name, last_name, role = 'candidate' } = req.body;
      
      // Check if user with email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(409).json({
          message: 'User with this email already exists'
        });
      }
      
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(password, salt);
      
      // Create new user
      const newUser = new User({
        email,
        password_hash,
        first_name,
        last_name,
        role,
        is_verified: false, // New users start unverified
        is_active: true
      });
      
      const savedUser = await newUser.save();
      
      // Don't send password hash back to client
      const userResponse = savedUser.toJSON();
      
      return res.status(201).json({
        message: 'User registered successfully',
        data: userResponse
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error registering user',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };
  
  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  login = async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(401).json({
          message: 'Invalid email or password'
        });
      }
      
      // Check if user is active
      if (!user.is_active) {
        return res.status(401).json({
          message: 'Your account is inactive. Please contact support.'
        });
      }
      
      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          message: 'Invalid email or password'
        });
      }
      
      // Update last login time
      user.last_login = new Date();
      await user.save();
      
      // For a simple session-based auth without tokens, we can just return the user
      // In a real app, this would set session cookies, etc.
      const userResponse = user.toJSON();
      
      return res.status(200).json({
        message: 'Login successful',
        data: userResponse
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error during login',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };
  
  /**
   * Logout user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  logout = async (req, res) => {
    try {
      // For a simple session-based auth, we'd clear cookies/session here
      return res.status(200).json({
        message: 'Logged out successfully'
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error during logout',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };
  
  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getProfile = async (req, res) => {
    try {
      // In a real app, this would get the user from session/token
      // For this simple version, we'll use the user ID from the request
      const { userId } = req.params;
      
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }
      
      return res.status(200).json({
        data: user
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error retrieving profile',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };
  
  /**
   * Request password reset
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  requestPasswordReset = async (req, res) => {
    try {
      const { email } = req.body;
      
      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        // For security, don't reveal that the email doesn't exist
        return res.status(200).json({
          message: 'If the email exists, a password reset link has been sent'
        });
      }
      
      // In a real app, this would generate a reset token and send an email
      // For this simple version, we'll just acknowledge the request
      
      return res.status(200).json({
        message: 'If the email exists, a password reset link has been sent'
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error requesting password reset',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };
  
  /**
   * Change password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  changePassword = async (req, res) => {
    try {
      const { userId } = req.params;
      const { currentPassword, newPassword } = req.body;
      
      // Find user
      const user = await User.findById(userId);
      if (!user) {
        return res.status(404).json({
          message: 'User not found'
        });
      }
      
      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isPasswordValid) {
        return res.status(401).json({
          message: 'Current password is incorrect'
        });
      }
      
      // Hash and update new password
      const salt = await bcrypt.genSalt(10);
      const password_hash = await bcrypt.hash(newPassword, salt);
      
      user.password_hash = password_hash;
      await user.save();
      
      return res.status(200).json({
        message: 'Password updated successfully'
      });
    } catch (error) {
      return res.status(500).json({
        message: error.message || 'Error changing password',
        error: process.env.NODE_ENV === 'development' ? error : undefined
      });
    }
  };
}

module.exports = new AuthController();