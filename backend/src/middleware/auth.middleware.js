const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const { User } = require('../models/mongodb');

const authMiddleware = async (req, res, next) => {
    try {
        // Get the token from the Authorization header
        const authHeader = req.headers['authorization'];
        if (!authHeader) throw createError.Unauthorized('Access token is required');

        const token = authHeader.split(' ')[1];  // Extract token after "Bearer"
        if (!token) throw createError.Unauthorized('Access token is required');

        // Verify the token with JWT
        const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET || process.env.JWT_SECRET || 'your-secret-key');

        // Find the user in the database
        const user = await User.findById(payload.userId || payload.id || payload._id).select('-password');
        if (!user) {
            throw createError.Unauthorized('User not found');
        }

        // Attach user to the request for route access
        req.user = user;
        req.userId = user._id;

        next(); // Token is valid, proceed to the next middleware or route handler
    } catch (err) {
        // Handle invalid token errors
        if (err.name === 'JsonWebTokenError') {
            return next(createError.Unauthorized('Invalid token'));
        }
        if (err.name === 'TokenExpiredError') {
            return next(createError.Unauthorized('Token has expired'));
        }
        next(createError.Unauthorized('Unauthorized access'));
    }
};

const roleMiddleware = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(createError.Unauthorized('Authentication required'));
        }

        if (!allowedRoles.includes(req.user.role)) {
            return next(createError.Forbidden('Insufficient permissions'));
        }

        next();
    };
};

// Legacy method for backward compatibility
const authenticate = authMiddleware;
const verifyAccessToken = authMiddleware;

module.exports = {
    authMiddleware,
    authenticate,
    verifyAccessToken,
    roleMiddleware
};
