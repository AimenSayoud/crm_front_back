/**
 * Utility functions for creating standardized API responses
 */

/**
 * Create a successful response
 * @param {string} message - Success message
 * @param {any} data - Response data
 * @param {number} status - HTTP status code (default: 200)
 * @returns {Object} Standardized response object
 */
const createResponse = (message, data = null, status = 200) => {
    return {
        success: true,
        message: message,
        data: data,
        status: status,
        timestamp: new Date().toISOString()
    };
};

/**
 * Create an error response
 * @param {string} message - Error message
 * @param {string} error - Error details
 * @param {number} status - HTTP status code (default: 400)
 * @returns {Object} Standardized error response object
 */
const createError = (message, error = null, status = 400) => {
    return {
        success: false,
        message: message,
        error: error,
        status: status,
        timestamp: new Date().toISOString()
    };
};

/**
 * Create a paginated response
 * @param {string} message - Success message
 * @param {Array} data - Response data
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @param {number} total - Total items
 * @returns {Object} Standardized paginated response object
 */
const createPaginatedResponse = (message, data, page, limit, total) => {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
        success: true,
        message: message,
        data: data,
        pagination: {
            page: page,
            limit: limit,
            total: total,
            totalPages: totalPages,
            hasNextPage: hasNextPage,
            hasPrevPage: hasPrevPage
        },
        timestamp: new Date().toISOString()
    };
};

module.exports = {
    createResponse,
    createError,
    createPaginatedResponse
};
