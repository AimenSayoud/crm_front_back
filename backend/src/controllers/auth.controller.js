const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const { User } = require('../models/mongodb');

/**
 * Auth Controller - Handles user authentication
 */
class AuthController {
  /**
   * Register a new user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  register = async (req, res, next) => {
    try {
      const { email, password, firstName, lastName, role = 'candidate' } = req.body;

      // Check if user with email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        throw createError.Conflict('User with this email already exists');
      }

      // Create new user (password will be hashed by pre-save hook)
      const newUser = new User({
        email,
        password,
        firstName,
        lastName,
        role,
        is_verified: false, // New users start unverified
        is_active: true
      });

      const savedUser = await newUser.save();

      // Generate tokens
      const accessToken = this.generateAccessToken(savedUser);
      const refreshToken = this.generateRefreshToken(savedUser);

      // Save refresh token
      savedUser.refreshToken = refreshToken;
      savedUser.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await savedUser.save();

      // Remove sensitive data
      const userResponse = savedUser.toObject();
      delete userResponse.password;
      delete userResponse.pin1;
      delete userResponse.pin2;
      delete userResponse.refreshToken;

      return res.status(201).json({
        message: 'User registered successfully',
        user: userResponse,
        access_token: accessToken,
        refresh_token: refreshToken
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Login user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  login = async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        throw createError.BadRequest('Email and password are required');
      }

      // Find user by email
      const user = await User.findOne({ email });
      if (!user) {
        throw createError.Unauthorized('Invalid email or password');
      }

      // Check if user is active
      if (!user.is_active) {
        throw createError.Unauthorized('Your account is inactive. Please contact support.');
      }

      // Verify password
      const isPasswordValid = await user.isValidPassword(password);
      if (!isPasswordValid) {
        throw createError.Unauthorized('Invalid email or password');
      }

      // Update last login time
      user.last_login = new Date();

      // Generate tokens
      const accessToken = this.generateAccessToken(user);
      const refreshToken = this.generateRefreshToken(user);

      // Save refresh token
      user.refreshToken = refreshToken;
      user.refreshTokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
      await user.save();

      // Remove sensitive data
      const userResponse = user.toObject();
      delete userResponse.password;
      delete userResponse.pin1;
      delete userResponse.pin2;
      delete userResponse.refreshToken;

      return res.status(200).json({
        message: 'Login successful',
        user: userResponse,
        access_token: accessToken,
        refresh_token: refreshToken
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refresh access token
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  refreshToken = async (req, res, next) => {
    try {
      const { refresh_token } = req.body;

      if (!refresh_token) {
        throw createError.BadRequest('Refresh token is required');
      }

      // Verify refresh token
      const decoded = jwt.verify(
        refresh_token, 
        process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || 'your-refresh-secret'
      );

      // Find user and check refresh token
      const user = await User.findById(decoded.userId);
      if (!user || user.refreshToken !== refresh_token) {
        throw createError.Unauthorized('Invalid refresh token');
      }

      // Check if refresh token is expired
      if (user.refreshTokenExpiresAt && new Date() > user.refreshTokenExpiresAt) {
        throw createError.Unauthorized('Refresh token expired');
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(user);

      return res.status(200).json({
        access_token: accessToken
      });
    } catch (error) {
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        next(createError.Unauthorized('Invalid refresh token'));
      } else {
        next(error);
      }
    }
  };

  /**
   * Logout user
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  logout = async (req, res, next) => {
    try {
      // Clear refresh token
      if (req.user) {
        const user = await User.findById(req.user._id);
        if (user) {
          user.refreshToken = null;
          user.refreshTokenExpiresAt = null;
          await user.save();
        }
      }

      return res.status(200).json({
        message: 'Logged out successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get current user profile
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  getProfile = async (req, res, next) => {
    try {
      const user = await User.findById(req.user._id).select('-password -pin1 -pin2 -refreshToken');
      
      if (!user) {
        throw createError.NotFound('User not found');
      }

      return res.status(200).json({
        user
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Change password
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  changePassword = async (req, res, next) => {
    try {
      const { currentPassword, newPassword } = req.body;

      // Find user
      const user = await User.findById(req.user._id);
      if (!user) {
        throw createError.NotFound('User not found');
      }

      // Verify current password
      const isPasswordValid = await user.isValidPassword(currentPassword);
      if (!isPasswordValid) {
        throw createError.Unauthorized('Current password is incorrect');
      }

      // Update password (will be hashed by pre-save hook)
      user.password = newPassword;
      await user.save();

      return res.status(200).json({
        message: 'Password updated successfully'
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Generate access token
   * @private
   */
  generateAccessToken(user) {
    return jwt.sign(
      { 
        userId: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName
      },
      process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '15m' }
    );
  }

  /**
   * Generate refresh token
   * @private
   */
  generateRefreshToken(user) {
    return jwt.sign(
      { 
        userId: user._id,
        tokenVersion: user.tokenVersion || 0
      },
      process.env.REFRESH_TOKEN_SECRET || process.env.JWT_SECRET || 'your-refresh-secret',
      { expiresIn: '7d' }
    );
  }
}

module.exports = new AuthController();