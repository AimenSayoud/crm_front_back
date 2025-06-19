const cron = require('node-cron');
const User = require('../models/user_model');

//* Function to clean up expired tokens
const cleanupExpiredTokens = async () => {
    console.log('Running token cleanup job...');

    const now = new Date();

    try {
        //* Find and remove expired tokens
        await User.updateMany(
            { refreshTokenExpiresAt: { $lte: now } },
            { $unset: { refreshToken: "", refreshTokenExpiresAt: "" } }
        );

        // await User.updateMany(
        //     { accessTokenExpiresAt: { $lte: now } },
        //     { $unset: { accessToken: "", accessTokenExpiresAt: "" } }
        // );

        console.log('Expired tokens cleaned up');
    } catch (err) {
        console.error('Error during token cleanup:', err);
    }
};

//* Schedule the cron job to run daily (or however you prefer)
cron.schedule('0 0 * * *', cleanupExpiredTokens);

module.exports = { cleanupExpiredTokens };
