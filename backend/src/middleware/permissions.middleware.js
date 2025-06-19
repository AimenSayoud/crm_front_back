const createError = require('http-errors');

/**
 * Middleware to require admin role
 */
const requireAdmin = (req, res, next) => {
    try {
        if (!req.user) {
            return next(createError.Unauthorized('Authentication required'));
        }

        // Check if user has admin or superadmin role
        if (!['admin', 'superadmin'].includes(req.user.role)) {
            return next(createError.Forbidden('Admin access required'));
        }

        next();
    } catch (error) {
        next(createError.InternalServerError('Permission check failed'));
    }
};

/**
 * Middleware to require superadmin role
 */
const requireSuperAdmin = (req, res, next) => {
    try {
        if (!req.user) {
            return next(createError.Unauthorized('Authentication required'));
        }

        // Check if user has superadmin role
        if (req.user.role !== 'superadmin') {
            return next(createError.Forbidden('Superadmin access required'));
        }

        next();
    } catch (error) {
        next(createError.InternalServerError('Permission check failed'));
    }
};

/**
 * Middleware to check specific permissions
 */
const requirePermission = (permission) => {
    return (req, res, next) => {
        try {
            if (!req.user) {
                return next(createError.Unauthorized('Authentication required'));
            }

            // Superadmins have all permissions
            if (req.user.role === 'superadmin') {
                return next();
            }

            // Check if user has admin role
            if (req.user.role !== 'admin') {
                return next(createError.Forbidden('Admin access required'));
            }

            // Check if user has the specific permission
            // This would need to be implemented based on your permission system
            // For now, we'll just check if they're an admin
            next();
        } catch (error) {
            next(createError.InternalServerError('Permission check failed'));
        }
    };
};

module.exports = {
    requireAdmin,
    requireSuperAdmin,
    requirePermission
};
