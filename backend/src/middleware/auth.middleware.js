const jwt = require('jsonwebtoken');
const createError = require('http-errors');
const User = require('../models/user_model');


const verifyAccessToken = async (req, res, next) => {
    try {
        //* Get the token from the Authorization header
        const authHeader = req.headers['authorization'];
        if (!authHeader) throw createError.Unauthorized('Access token is required');

        const token = authHeader.split(' ')[1];  //? Extract token after "Bearer"
        if (!token) throw createError.Unauthorized('Access token is required');

        //* Verify the token with JWT
        const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        console.log('Decoded Payload:', payload);

        //* Find the user in the database (DO NOT check `user.accessToken`)
        const user = await User.findById(payload.userId || payload.id).select('-password');
        if (!user) {
            console.log('No user found for ID:', payload.userId || payload.id);
            throw createError.Unauthorized('User not found');
        }

        //* Attach userId to the request for route access
        req.userId = user.id;
        console.log("User ID attached to req:", req.userId);

        next(); //? Token is valid, proceed to the next middleware or route handler
    } catch (err) {
        //* Handle invalid token errors
        if (err.name === 'JsonWebTokenError') {
            return next(createError.Unauthorized('Invalid token'));
        }
        if (err.name === 'TokenExpiredError') {
            return next(createError.Unauthorized('Token has expired'));
        }
        next(createError.Unauthorized('Unauthorized access'));
    }
};


module.exports = { verifyAccessToken };
